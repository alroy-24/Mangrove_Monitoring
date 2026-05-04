"""
STAGE 2: Feature Engineering
Generate risk factors: distance to urban, coastline, NDVI trends, etc.
"""

import numpy as np
import pandas as pd
from scipy.ndimage import distance_transform_edt
from utils.data_handler import GeometryHandler
import config


class FeatureEngineer:
    """Extract and engineer features for risk prediction"""
    
    def __init__(self, classification_maps):
        """
        Initialize with classification maps from Stage 1
        classification_maps: dict with year -> mangrove map
        """
        self.classification_maps = classification_maps
        self.features_df = None
        
    def compute_ndvi_trend(self, ndvi_maps, years):
        """
        Compute NDVI trend over time
        Trend = slope of linear regression on NDVI over years
        """
        if not ndvi_maps:
            return np.zeros_like(list(self.classification_maps.values())[0])
        
        # Simple trend: difference between first and last year
        years_sorted = sorted(years)
        first_year_ndvi = ndvi_maps.get(years_sorted[0])
        last_year_ndvi = ndvi_maps.get(years_sorted[-1])
        
        if first_year_ndvi is None or last_year_ndvi is None:
            h, w = list(self.classification_maps.values())[0].shape
            return np.zeros((h, w))
        
        trend = (last_year_ndvi - first_year_ndvi) / len(years_sorted)
        return trend
    
    def distance_to_urban(self, urban_mask):
        """
        Compute distance from each pixel to nearest urban area
        urban_mask: binary mask (1 = urban, 0 = non-urban)
        """
        distance = distance_transform_edt(1 - urban_mask)
        return distance
    
    def distance_to_coast(self, coastline_mask):
        """
        Compute distance from each pixel to coastline
        coastline_mask: binary mask (1 = coast, 0 = inland)
        """
        distance = distance_transform_edt(1 - coastline_mask)
        return distance
    
    def previous_loss_occurrence(self, loss_maps):
        """
        Count how many times a pixel experienced loss
        loss_maps: dict with year-pairs -> loss maps
        """
        h, w = list(self.classification_maps.values())[0].shape
        loss_count = np.zeros((h, w))
        
        for loss_map in loss_maps.values():
            loss_count += loss_map.astype(int)
        
        return loss_count
    
    def salinity_water_proximity(self, ndwi_maps):
        """
        Higher NDWI = closer to water/higher salinity
        Use mean NDWI across years
        """
        if not ndwi_maps:
            h, w = list(self.classification_maps.values())[0].shape
            return np.zeros((h, w))
        
        ndwi_stack = np.array(list(ndwi_maps.values()))
        return np.mean(ndwi_stack, axis=0)
    
    @staticmethod
    def _coast_col_per_row(h, w):
        """
        Diagonal Konkan coastline: coast shifts from col~22 (Vasai, 19.35°N)
        to col~210 (Vengurla, 15.5°N) within bounding box 72.7–73.9°E, 15.5–19.5°N.
        """
        rows_n = np.array([0.000, 0.038, 0.215, 0.380, 0.630, 0.860, 1.000])
        cols_n = np.array([0.042, 0.117, 0.150, 0.242, 0.500, 0.642, 0.825])
        return np.interp(np.arange(h) / max(h - 1, 1), rows_n, cols_n) * (w - 1)

    def generate_urban_mask(self, shape):
        """
        Synthetic urban mask for Vasai-Konkan towns placed east of the diagonal coast.
        In production: use OSM building footprints.
        """
        h, w = shape
        urban_mask = np.zeros((h, w))
        coast_col  = self._coast_col_per_row(h, w).astype(int)
        # (row_norm, inland_offset_norm, row_height_norm, patch_width_norm)
        towns = [
            (0.05, 0.12, 0.07, 0.14),   # Vasai-Virar
            (0.28, 0.18, 0.06, 0.12),   # Alibag
            (0.50, 0.20, 0.06, 0.14),   # Ratnagiri
            (0.78, 0.12, 0.06, 0.12),   # Sindhudurg
        ]
        for r_n, off_n, rh_n, cw_n in towns:
            r0 = max(0, int(r_n * h));  r1 = min(h, int((r_n + rh_n) * h))
            rc = min(int(r_n * h), h - 1)
            c0 = min(w - 1, coast_col[rc] + int(off_n * w))
            c1 = min(w, c0 + int(cw_n * w))
            urban_mask[r0:r1, c0:c1] = 1
        return urban_mask

    def generate_coastline_mask(self, shape):
        """
        Diagonal coastline mask for Vasai-Konkan.
        Coast shifts from col~25 (north) to col~237 (south).
        In production: use real coastline vectors.
        """
        h, w = shape
        coastline  = np.zeros((h, w))
        coast_col  = self._coast_col_per_row(h, w).astype(int)
        for r, c in enumerate(coast_col):
            coastline[r, max(0, c - 1):min(w, c + 2)] = 1
        # Creek inlets at major estuaries (extend inland from coast)
        for r_n in [0.08, 0.35, 0.55, 0.80]:
            r0 = int(r_n * h)
            c0 = coast_col[min(r0, h - 1)]
            depth = int(w * 0.12)
            coastline[r0:min(h, r0 + 4), c0:min(w, c0 + depth)] = 1
        return coastline
    
    def aquaculture_proximity(self, shape):
        """Distance to nearest synthetic aquaculture zone (shrimp/fish ponds near creek mouths).
        Zones are placed just inland of the diagonal coast at each creek latitude."""
        h, w = shape
        mask      = np.zeros((h, w))
        coast_col = self._coast_col_per_row(h, w).astype(int)
        # (row_norm, inland_offset_norm, row_height_norm, zone_width_norm)
        zones = [
            (0.04, 0.02, 0.06, 0.08),   # Vasai-Virar tidal flats
            (0.22, 0.03, 0.08, 0.10),   # Alibag / Kundalika
            (0.38, 0.02, 0.07, 0.09),   # Bankot / Savitri
            (0.54, 0.02, 0.07, 0.08),   # Jaigad / Shastri
            (0.64, 0.02, 0.06, 0.08),   # Ratnagiri port area
            (0.75, 0.02, 0.06, 0.07),   # Jagbudi
            (0.90, 0.02, 0.05, 0.07),   # Terekhol / Malvan
        ]
        for r_n, off_n, rh_n, cw_n in zones:
            r0  = max(0, int(r_n * h));  r1 = min(h, int((r_n + rh_n) * h))
            rc  = min(int(r_n * h), h - 1)
            c0  = min(w - 1, coast_col[rc] + int(off_n * w))
            c1  = min(w, c0 + int(cw_n * w))
            mask[r0:r1, c0:c1] = 1
        return distance_transform_edt(1 - mask)

    def elevation_proxy(self, shape):
        """
        Low-elevation coastal risk proxy (0=inland/high, 1=tidal zone/low).
        Computed as exponential decay from the diagonal coastline inland.
        """
        h, w = shape
        col_grid  = np.arange(w)[np.newaxis, :]
        coast_cg  = self._coast_col_per_row(h, w)[:, np.newaxis]
        dist_inland = col_grid - coast_cg           # +ve = land side
        base = np.where(dist_inland >= 0,
                        np.exp(-dist_inland / (w * 0.08)), 0.0)
        # Creek-mouth patches: Gaussian along rows, exponential inland from coast
        row_idx          = np.arange(h)
        creek_rows_norm  = [0.05, 0.22, 0.38, 0.55, 0.63, 0.75, 0.90]
        for r_n in creek_rows_norm:
            r_c = int(r_n * h)
            hw  = max(3, int(0.03 * h))
            g_r = np.exp(-0.5 * ((row_idx - r_c) / hw) ** 2)
            g_c = np.where(dist_inland[r_c:r_c+1, :] >= 0,
                           np.exp(-dist_inland[r_c:r_c+1, :] / (w * 0.10)), 0.0)
            base += np.outer(g_r, g_c[0]) * 0.4
        return np.clip(base, 0.0, 1.0)

    def mangrove_fragmentation(self, mangrove_map):
        """
        Fragmentation score: 1=edge pixel (isolated, more vulnerable), 0=interior canopy.
        Computed via binary erosion — edge pixels are more exposed to salt intrusion and storms.
        """
        from scipy.ndimage import binary_erosion
        if mangrove_map.sum() == 0:
            return np.zeros_like(mangrove_map, dtype=float)
        interior = binary_erosion(mangrove_map.astype(bool), iterations=2)
        return np.clip(mangrove_map.astype(float) - interior.astype(float), 0.0, 1.0)

    def extract_features(self, ndvi_maps, ndwi_maps, loss_maps_by_period, reference_year=None):
        """
        Extract all features for each pixel
        Returns: pixel-level feature dataframe and feature arrays
        """
        if reference_year is None:
            reference_year = max(self.classification_maps.keys())
        
        ref_map = self.classification_maps[reference_year]
        h, w = ref_map.shape
        
        print(f"\nExtracting features (reference year: {reference_year})...")
        
        # 1. NDVI Trend
        ndvi_trend = self.compute_ndvi_trend(ndvi_maps, list(self.classification_maps.keys()))
        
        # 2. Distance to Urban
        urban_mask = self.generate_urban_mask((h, w))
        dist_urban = self.distance_to_urban(urban_mask)
        
        # 3. Distance to Coast
        coast_mask = self.generate_coastline_mask((h, w))
        dist_coast = self.distance_to_coast(coast_mask)
        
        # 4. Previous Loss Occurrence
        loss_count = self.previous_loss_occurrence(loss_maps_by_period)
        
        # 5. Salinity / Water Proximity
        water_proximity = self.salinity_water_proximity(ndwi_maps)
        
        # 6. Current Mangrove Status
        current_mangrove = ref_map.astype(float)

        # 7. Aquaculture proximity
        aqua_dist = self.aquaculture_proximity((h, w))

        # 8. Low-elevation coastal risk proxy
        elev_risk = self.elevation_proxy((h, w))

        # 9. Mangrove fragmentation (edge exposure)
        fragmentation = self.mangrove_fragmentation(ref_map)

        # Stack all features (9 total)
        feature_array = np.stack([
            ndvi_trend,
            dist_urban,
            dist_coast,
            loss_count.astype(float),
            water_proximity,
            current_mangrove,
            aqua_dist,
            elev_risk,
            fragmentation,
        ], axis=-1)

        # Flatten to get pixel-level data
        feature_flat = feature_array.reshape(h * w, 9)

        feature_names = [
            'ndvi_trend',
            'distance_to_urban',
            'distance_to_coast',
            'previous_loss_count',
            'water_proximity',
            'current_mangrove',
            'aquaculture_proximity',
            'elevation_proxy',
            'mangrove_fragmentation',
        ]
        
        self.features_df = pd.DataFrame(feature_flat, columns=feature_names)

        print(f"✓ Extracted {len(feature_names)} features for {len(self.features_df)} pixels")
        print(self.features_df.describe().round(4).to_string())
        
        return self.features_df, feature_array
    
    def save_features(self, output_path=f"{config.OUTPUT_DIR}/features.csv"):
        """Save feature dataframe"""
        if self.features_df is None:
            print("No features extracted yet")
            return
        
        self.features_df.to_csv(output_path, index=False)
        print(f"✓ Saved features: {output_path}")


def run_stage2(detector):
    """Execute Stage 2 with outputs from Stage 1"""
    print("\n" + "="*50)
    print("STAGE 2: FEATURE ENGINEERING")
    print("="*50)
    
    engineer = FeatureEngineer(detector.classification_maps)
    
    # Prepare loss maps (loss between consecutive years)
    loss_maps = {}
    years = sorted(detector.classification_maps.keys())
    for i in range(len(years) - 1):
        year1, year2 = years[i], years[i+1]
        loss, _, _ = detector.detect_changes(year1, year2)
        loss_maps[f"{year1}-{year2}"] = loss if loss is not None else np.zeros_like(detector.classification_maps[year1])
    
    # Extract features — pass real NDWI maps from Stage 1
    features_df, feature_array = engineer.extract_features(
        ndvi_maps=detector.ndvi_maps,
        ndwi_maps=detector.ndwi_maps,
        loss_maps_by_period=loss_maps
    )
    
    engineer.save_features()
    
    return engineer


if __name__ == "__main__":
    # Demo: requires stage1 output
    print("Run main.py to execute full pipeline")
