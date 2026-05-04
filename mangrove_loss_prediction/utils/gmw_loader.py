"""
Global Mangrove Watch (GMW v3.0) data loader.

Primary path : Stream-clip the real GMW GeoTIFF from Zenodo via rasterio/vsicurl
               (requires rasterio + GDAL network support; no full-file download needed)
Fallback path: RealisticMangroveGenerator — ecologically grounded synthetic maps for
               Vasai-Konkan coast based on actual creek/estuary locations.
"""

import numpy as np
from pathlib import Path
from scipy.ndimage import gaussian_filter, binary_dilation

# Map project years to nearest available GMW year
GMW_YEAR_MAP = {
    2020: 2020,
    2021: 2020,   # GMW v3 has no 2021; use 2020 baseline
    2023: 2020,   # nearest; year-on-year change applied synthetically
    2025: 2020,
}
GMW_AVAILABLE = [1996, 2007, 2008, 2009, 2010, 2015, 2016, 2017, 2018, 2019, 2020]

# Zenodo record for GMW v3.0 — https://zenodo.org/record/6894273
_ZENODO_BASE = "https://zenodo.org/record/6894273/files"


class GMWDataLoader:
    """
    Downloads (or streams) Global Mangrove Watch v3.0 GeoTIFFs and clips them
    to the study-area bounding box.

    Results are cached as .npy files so subsequent runs are instant.
    Falls back to RealisticMangroveGenerator on any failure.
    """

    def __init__(self, cache_dir: str, lat_bounds: tuple, lng_bounds: tuple):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.lat_bounds = lat_bounds     # (lat_min, lat_max)
        self.lng_bounds = lng_bounds     # (lng_min, lng_max)

    def load(self, year: int, target_shape: tuple = (256, 256)) -> np.ndarray:
        """
        Return a binary mangrove map (1=mangrove, 0=other) of shape target_shape.

        Uses a two-level cache:
          - gmw_<gmw_year>_base.npy  : the raw GMW raster (real or synthetic base)
          - gmw_<project_year>.npy   : base + year-specific progressive loss applied
        """
        gmw_year   = GMW_YEAR_MAP.get(year, 2020)
        base_cache = self.cache_dir / f"gmw_{gmw_year}_base.npy"
        year_cache = self.cache_dir / f"gmw_{year}.npy"

        # --- Year-specific cache (fastest path) ---
        if year_cache.exists():
            print(f"  [GMW] Loaded from cache: {year_cache.name}")
            return np.load(year_cache)

        # --- Load or build the base (GMW year) raster ---
        if base_cache.exists():
            base = np.load(base_cache)
            base = self._resize(base, target_shape)
        else:
            base = self._try_vsicurl(gmw_year)
            if base is not None:
                np.save(base_cache, base)
                print(f"  [GMW] Saved real GMW base → {base_cache.name}")
                base = self._resize(base, target_shape)
            else:
                print(f"  [GMW] Using realistic synthetic base (rasterio/network unavailable)")
                base = RealisticMangroveGenerator.generate(target_shape, year=gmw_year)
                np.save(base_cache, base)

        # --- Apply year-specific progressive loss on top of the base ---
        if year == gmw_year:
            result = base
        else:
            result = RealisticMangroveGenerator.apply_year_change(base, gmw_year, year)

        np.save(year_cache, result)
        return result

    def _try_vsicurl(self, gmw_year: int) -> "np.ndarray | None":
        """Stream-read just the study-area window from the Zenodo GeoTIFF."""
        try:
            import rasterio
            from rasterio.windows import from_bounds as win_from_bounds

            lat_min, lat_max = self.lat_bounds
            lng_min, lng_max = self.lng_bounds

            # GDAL virtual path: zip-over-https (no full download required)
            vsicurl_path = (
                f"/vsizip//vsicurl/{_ZENODO_BASE}/"
                f"GMW_v3_{gmw_year}_v3.zip/"
                f"GMW_v3_{gmw_year}.tif"
            )

            with rasterio.open(vsicurl_path) as src:
                window = win_from_bounds(lng_min, lat_min, lng_max, lat_max, src.transform)
                data = src.read(1, window=window)

            print(f"  [GMW] Streamed real GMW {gmw_year} from Zenodo — shape {data.shape}")
            return (data > 0).astype(np.uint8)

        except Exception as exc:
            print(f"  [GMW] vsicurl failed ({type(exc).__name__}); switching to synthetic")
            return None

    @staticmethod
    def _resize(arr: np.ndarray, target_shape: tuple) -> np.ndarray:
        if arr.shape == target_shape:
            return arr
        from PIL import Image
        img = Image.fromarray(arr.astype(np.uint8))
        img = img.resize((target_shape[1], target_shape[0]), Image.NEAREST)
        return np.array(img, dtype=np.uint8)


class RealisticMangroveGenerator:
    """
    Generates ecologically realistic mangrove maps for Vasai-Konkan coast (15.5°N–19.5°N).

    Creek/estuary systems encoded from real geography:
      - Thane Creek / Ulhas estuary  (Vasai-Virar, ~19.3°N) — largest patch, high urban pressure
      - Kundalika River / Alibag     (~18.6°N)
      - Savitri River / Bankot       (~17.9°N)
      - Shastri River / Jaigad       (~17.3°N)
      - Ratnagiri harbour            (~17.0°N)
      - Jagbudi creek                (~16.5°N)
      - Terekhol / Sindhudurg        (~15.7°N)

    Row 0 = 19.5°N (north), Row 255 = 15.5°N (south)
    Col 0 = 72.7°E (west),  Col 255 = 73.9°E (east, inland)

    The coastline is DIAGONAL: it shifts from col~22 at Vasai (north) to col~210
    at Vengurla/Sindhudurg (south), reflecting the real eastward tilt of the Konkan coast.
    """

    # (row_norm, creek_depth_norm, peak_density, half_width_norm)
    CREEKS = [
        (0.05,  0.18, 0.90, 0.040),   # Thane Creek / Ulhas estuary
        (0.22,  0.13, 0.72, 0.030),   # Kundalika / Alibag
        (0.38,  0.11, 0.63, 0.028),   # Savitri / Bankot
        (0.55,  0.09, 0.56, 0.025),   # Shastri / Jaigad
        (0.63,  0.08, 0.51, 0.022),   # Ratnagiri
        (0.75,  0.07, 0.45, 0.020),   # Jagbudi
        (0.90,  0.06, 0.39, 0.018),   # Terekhol / Sindhudurg
    ]

    # Cumulative fractional loss per year in the northern third (Vasai urban zone)
    # Calibrated to match published ~0.5%/yr loss rate for Thane Creek mangroves
    _LOSS_RATES = {2015: 0.00, 2016: 0.005, 2017: 0.010, 2018: 0.018,
                   2019: 0.025, 2020: 0.032, 2021: 0.040, 2022: 0.048,
                   2023: 0.057, 2024: 0.065, 2025: 0.074}

    @staticmethod
    def _coast_col_per_row(h: int, w: int) -> np.ndarray:
        """
        Diagonal Konkan coastline: coast column shifts from ~col 22 (Vasai, 19.35°N)
        to ~col 210 (Vengurla, 15.5°N) within bounding box 72.7–73.9°E, 15.5–19.5°N.
        Control points derived from real coastal longitudes at key latitudes.
        """
        rows_n = np.array([0.000, 0.038, 0.215, 0.380, 0.630, 0.860, 1.000])
        cols_n = np.array([0.042, 0.117, 0.150, 0.242, 0.500, 0.642, 0.825])
        return np.interp(np.arange(h) / max(h - 1, 1), rows_n, cols_n) * (w - 1)

    @classmethod
    def generate(cls, shape: tuple = (256, 256), year: int = 2020,
                 base_seed: int = 42) -> np.ndarray:
        h, w = shape
        rng = np.random.RandomState(base_seed)
        prob = np.zeros((h, w), dtype=float)

        # Diagonal coastline grid: coast_cg[r, 0] = coast column at row r
        row_idx  = np.arange(h)
        coast_c  = cls._coast_col_per_row(h, w)          # (h,) float
        col_grid = np.arange(w)[np.newaxis, :]            # (1, w)
        coast_cg = coast_c[:, np.newaxis]                 # (h, 1)
        dist_inland = col_grid - coast_cg                 # (h, w): +ve=land, -ve=ocean

        # 1. Coastal mangrove strip — intertidal zone straddles the diagonal coast
        # Land side: slow decay inland; ocean side: quick decay seaward (exposed fringe)
        prob += np.where(
            dist_inland >= 0,
            np.exp(-dist_inland / (w * 0.05)) * 0.42,      # land/tidal flat side
            np.exp( dist_inland / (w * 0.022)) * 0.28,     # ocean fringe (dist_inland<0 → decays)
        )

        # 2. Creek/estuary fingers — each creek starts at the coast column for that row
        for row_n, depth_n, density, hw_n in cls.CREEKS:
            row_c       = row_n * h
            hw          = max(2, hw_n * h)
            g_row       = np.exp(-0.5 * ((row_idx - row_c) / hw) ** 2)  # (h,)
            dist_norm   = np.clip(dist_inland / (depth_n * w), 0.0, 1.0)  # (h, w)
            valid       = (dist_inland >= 0) & (dist_norm < 1)
            creek_patch = np.where(valid, (1 - dist_norm) ** 0.6 * density, 0.0)
            prob       += g_row[:, np.newaxis] * creek_patch

        # 3. Spatial smoothing for realistic patchy edges
        prob = gaussian_filter(prob, sigma=1.2)
        prob = np.clip(prob, 0.0, 1.0)

        # 4. Year-based loss: northern urban zone loses cover progressively
        cumulative_loss = cls._LOSS_RATES.get(year, cls._LOSS_RATES[2020])
        if cumulative_loss > 0:
            north_end = int(h * 0.33)   # northern third = Vasai–Thane urban zone
            loss_mask = np.zeros((h, w))
            loss_mask[:north_end, :] = cumulative_loss * np.linspace(1.0, 0.3, north_end)[:, None]
            prob = prob * (1.0 - loss_mask)

        # 5. Apply threshold + texture noise for realistic binary map
        noise = rng.rand(h, w) * 0.12
        mangrove = ((prob + noise) > 0.38).astype(np.uint8)

        return mangrove

    @classmethod
    def apply_year_change(cls, base_map: np.ndarray,
                          base_year: int, target_year: int) -> np.ndarray:
        """
        Apply progressive mangrove loss to a base map for a later project year.
        Loss is concentrated in the northern urban zone (Vasai–Thane corridor).
        """
        if target_year <= base_year:
            return base_map.copy()

        h, w   = base_map.shape
        rng    = np.random.RandomState(42 + target_year)
        result = base_map.copy()

        base_loss   = cls._LOSS_RATES.get(base_year, 0.032)
        target_loss = cls._LOSS_RATES.get(target_year, 0.032)
        delta       = max(0.0, target_loss - base_loss)
        if delta == 0:
            return result

        # Northern third = Vasai-Virar urban zone, highest loss rate
        north_end = int(h * 0.33)
        rows, cols = np.where(result[:north_end, :] == 1)
        if len(rows) > 0:
            n_remove = int(len(rows) * delta * 3.0)   # amplified for urban zone
            n_remove = min(n_remove, len(rows))
            if n_remove > 0:
                idx = rng.choice(len(rows), n_remove, replace=False)
                result[rows[idx], cols[idx]] = 0

        # Mid-section — slight loss from aquaculture/seasonal factors
        mid_start, mid_end = int(h * 0.33), int(h * 0.66)
        rows_m, cols_m = np.where(result[mid_start:mid_end, :] == 1)
        if len(rows_m) > 0:
            n_remove_m = int(len(rows_m) * delta * 0.8)
            n_remove_m = min(n_remove_m, len(rows_m))
            if n_remove_m > 0:
                idx_m = rng.choice(len(rows_m), n_remove_m, replace=False)
                result[rows_m[idx_m] + mid_start, cols_m[idx_m]] = 0

        return result

    @classmethod
    def generate_consistent_ndwi(cls, mangrove_map: np.ndarray,
                                  year: int = 2020, seed: int = 42) -> np.ndarray:
        """
        Generate NDWI consistent with geography:
          - Near-coast / mangrove pixels: NDWI 0.1–0.5 (water-influenced)
          - Inland pixels               : NDWI -0.4–0.1 (drier land cover)
        """
        h, w = mangrove_map.shape
        rng  = np.random.RandomState(seed + year + 1)
        ndwi = np.zeros((h, w), dtype=float)

        # Coastal proximity: NDWI highest at the diagonal coastline, decays inland
        col_grid = np.arange(w)[np.newaxis, :]
        coast_cg = cls._coast_col_per_row(h, w)[:, np.newaxis]
        dist_abs = np.abs(col_grid - coast_cg)
        ndwi += np.exp(-dist_abs / (w * 0.12)) * 0.5
        # Ocean pixels (west of coast) get uniformly high NDWI
        ndwi += np.where(col_grid < coast_cg, 0.35, 0.0)

        # Mangrove areas slightly wetter
        is_mg = mangrove_map == 1
        ndwi[is_mg] += 0.15

        # Add noise and smooth
        ndwi += rng.randn(h, w) * 0.08
        ndwi  = gaussian_filter(ndwi, sigma=1.0)

        return np.clip(ndwi, -1.0, 1.0)

    @classmethod
    def generate_consistent_ndvi(cls, mangrove_map: np.ndarray,
                                 year: int = 2020, seed: int = 42) -> np.ndarray:
        """
        Generate NDVI consistent with the mangrove classification:
          - Mangrove pixels    : NDVI 0.50–0.85 (dense tropical canopy)
          - Near-coast non-man : NDVI 0.15–0.45 (mudflat / sparse scrub)
          - Inland non-man     : NDVI 0.10–0.60 (cropland / urban / dry scrub)
        """
        h, w = mangrove_map.shape
        rng = np.random.RandomState(seed + year)
        ndvi = np.zeros((h, w), dtype=float)

        is_mg = mangrove_map == 1
        ndvi[is_mg]  = 0.50 + rng.rand(int(is_mg.sum()))  * 0.35
        ndvi[~is_mg] = 0.10 + rng.rand(int((~is_mg).sum())) * 0.50

        # Light smoothing so pixel-level NDVI looks like a real composite
        ndvi = gaussian_filter(ndvi, sigma=0.8)

        # Small health decline in northern area over time
        if year > 2018:
            h_cut = int(h * 0.30)
            decline = (year - 2018) * 0.008
            ndvi[:h_cut, :] -= decline

        return np.clip(ndvi, -1.0, 1.0)
