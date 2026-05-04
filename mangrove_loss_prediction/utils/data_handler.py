"""
Data loading and preprocessing utilities
"""

import numpy as np
import pandas as pd
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')


class SentinelDataLoader:
    """Load and preprocess Sentinel-2 satellite data"""
    
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        
    def load_bands(self, year: int, region: str = "mumbai"):
        """
        Load satellite bands for a given year.
        In production: load from GEE/cloud storage
        For demo: return synthetic data
        """
        # Synthetic data for demo (replace with real data loading)
        height, width = 256, 256
        bands = {
            'red': np.random.rand(height, width) * 0.3,
            'green': np.random.rand(height, width) * 0.25,
            'blue': np.random.rand(height, width) * 0.2,
            'nir': np.random.rand(height, width) * 0.4,
            'swir': np.random.rand(height, width) * 0.15
        }
        return bands
    
    def compute_ndvi(self, red, nir):
        """
        Compute Normalized Difference Vegetation Index
        NDVI = (NIR - RED) / (NIR + RED)
        """
        denominator = nir + red
        # Avoid division by zero
        denominator = np.where(denominator == 0, 1e-8, denominator)
        ndvi = (nir - red) / denominator
        return np.clip(ndvi, -1, 1)
    
    def compute_ndwi(self, green, nir):
        """
        Compute Normalized Difference Water Index
        NDWI = (GREEN - NIR) / (GREEN + NIR)
        """
        denominator = green + nir
        denominator = np.where(denominator == 0, 1e-8, denominator)
        ndwi = (green - nir) / denominator
        return np.clip(ndwi, -1, 1)
    
    def create_feature_array(self, bands):
        """Combine bands into feature array"""
        ndvi = self.compute_ndvi(bands['red'], bands['nir'])
        ndwi = self.compute_ndwi(bands['green'], bands['nir'])
        
        features = np.stack([
            bands['red'],
            bands['green'],
            bands['blue'],
            bands['nir'],
            bands['swir'],
            ndvi,
            ndwi
        ], axis=-1)
        
        return features, ndvi, ndwi


class GeometryHandler:
    """Handle distance calculations and spatial operations"""
    
    @staticmethod
    def distance_to_urban(coordinates, urban_centers):
        """Calculate distance to nearest urban area"""
        distances = []
        for coord in coordinates:
            min_dist = min([np.linalg.norm(np.array(coord) - np.array(urban)) 
                           for urban in urban_centers])
            distances.append(min_dist)
        return np.array(distances)
    
    @staticmethod
    def distance_to_coast(coordinates, coast_lines):
        """Calculate distance to nearest coastline"""
        distances = []
        for coord in coordinates:
            distances.append(np.min([np.linalg.norm(np.array(coord) - np.array(coast)) 
                                     for coast in coast_lines]))
        return np.array(distances)


def prepare_training_data(features_list: list, labels: np.ndarray) -> tuple:
    """
    Prepare training data for ML models
    
    Args:
        features_list: List of feature arrays
        labels: Binary labels (0/1)
    
    Returns:
        Flattened features and labels ready for training
    """
    X = np.vstack([f.reshape(f.shape[0] * f.shape[1], -1) for f in features_list])
    y = np.repeat(labels, features_list[0].shape[0] * features_list[0].shape[1])
    
    return X, y
