"""
STAGE 1: Spatiotemporal Change Detection
Load mangrove extent maps (GMW v3.0 or realistic synthetic fallback),
compute NDVI consistent with the classification, detect loss/gain.
"""

import numpy as np
from pathlib import Path
from utils.gmw_loader import GMWDataLoader, RealisticMangroveGenerator
import config


GRID_SHAPE = (256, 256)


class ChangeDetectionModel:
    """Detect mangrove presence and changes over time using GMW-sourced maps."""

    def __init__(self):
        self.ndvi_maps = {}
        self.ndwi_maps = {}
        self.classification_maps = {}
        self._gmw = GMWDataLoader(
            cache_dir=config.GMW_CACHE_DIR,
            lat_bounds=config.LATITUDE_BOUNDS,
            lng_bounds=config.LONGITUDE_BOUNDS,
        ) if config.USE_GMW_DATA else None

    def process_year(self, year: int) -> np.ndarray:
        """
        Load (or generate) the mangrove classification map for a year,
        derive a consistent NDVI, and store both.
        """
        if self._gmw is not None:
            mangrove_map = self._gmw.load(year, target_shape=GRID_SHAPE)
        else:
            mangrove_map = RealisticMangroveGenerator.generate(GRID_SHAPE, year=year)

        self.classification_maps[year] = mangrove_map

        ndvi = RealisticMangroveGenerator.generate_consistent_ndvi(
            mangrove_map, year=year, seed=config.RANDOM_STATE
        )
        ndwi = RealisticMangroveGenerator.generate_consistent_ndwi(
            mangrove_map, year=year, seed=config.RANDOM_STATE
        )
        self.ndvi_maps[year] = ndvi
        self.ndwi_maps[year] = ndwi

        pct = np.sum(mangrove_map) / mangrove_map.size * 100
        print(f"  Year {year}: {pct:.1f}% mangrove coverage "
              f"({int(np.sum(mangrove_map))} / {mangrove_map.size} px)")

        return mangrove_map

    def detect_changes(self, year1: int, year2: int):
        """
        Loss : present in year1, absent in year2
        Gain : absent in year1, present in year2
        """
        if year1 not in self.classification_maps or year2 not in self.classification_maps:
            return None, None, None

        m1, m2 = self.classification_maps[year1], self.classification_maps[year2]
        loss   = (m1 == 1) & (m2 == 0)
        gain   = (m1 == 0) & (m2 == 1)
        stable = m1 == m2
        return loss, gain, stable

    def compute_change_metrics(self, loss, gain):
        if loss is None:
            return None
        return {
            "loss_pixels": int(np.sum(loss)),
            "gain_pixels": int(np.sum(gain)),
            "net_change":  int(np.sum(gain)) - int(np.sum(loss)),
        }

    def save_maps(self, year: int, output_dir: str = config.OUTPUT_DIR):
        Path(output_dir).mkdir(exist_ok=True)
        if year in self.classification_maps:
            out = f"{output_dir}/mangrove_classification_{year}.npy"
            np.save(out, self.classification_maps[year])
            print(f"  Saved classification map → {out}")


def run_stage1(years=None):
    if years is None:
        years = config.YEARS

    print("\n" + "=" * 50)
    print("STAGE 1: CHANGE DETECTION")
    print("=" * 50)

    detector = ChangeDetectionModel()

    for year in years:
        print(f"\nProcessing {year}...")
        detector.process_year(year)
        detector.save_maps(year)

    print("\n--- Change Detection ---")
    for i in range(len(years) - 1):
        y1, y2 = years[i], years[i + 1]
        loss, gain, _ = detector.detect_changes(y1, y2)
        metrics = detector.compute_change_metrics(loss, gain)
        if metrics:
            print(f"\n{y1} → {y2}:")
            print(f"  Loss: {metrics['loss_pixels']} px")
            print(f"  Gain: {metrics['gain_pixels']} px")
            print(f"  Net : {metrics['net_change']} px")

    return detector


if __name__ == "__main__":
    detector = run_stage1()
