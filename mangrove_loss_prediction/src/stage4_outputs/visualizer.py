"""
STAGE 4: Final Outputs
Generate visualizations and maps for outputs
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.colors import ListedColormap
from matplotlib import cm
from pathlib import Path
from PIL import Image
import config


class OutputGenerator:
    """Generate final visualizations and output maps"""
    
    def __init__(self, output_dir=config.OUTPUT_DIR):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        sns.set_style("whitegrid")
        
    # ── Transparent overlay helpers ───────────────────────────────────────────

    @staticmethod
    def _rgba_to_png(rgba: np.ndarray, path: Path):
        """Save an (H, W, 4) uint8 RGBA array as a transparent PNG."""
        Image.fromarray(rgba.astype(np.uint8), mode="RGBA").save(path)

    @staticmethod
    def _mangrove_overlay(mangrove_map: np.ndarray) -> np.ndarray:
        """Mangrove pixels → forest green; everything else transparent."""
        rgba = np.zeros((*mangrove_map.shape, 4), dtype=np.uint8)
        rgba[mangrove_map == 1] = [22, 163, 74, 210]   # #16A34A
        return rgba

    @staticmethod
    def _change_overlay(loss_map: np.ndarray, gain_map: np.ndarray) -> np.ndarray:
        """Loss → red, gain → green, rest transparent."""
        rgba = np.zeros((*loss_map.shape, 4), dtype=np.uint8)
        rgba[gain_map == 1] = [22, 163, 74, 210]    # green
        rgba[loss_map == 1] = [220, 38, 38, 210]    # red (paint over gain on conflict)
        return rgba

    @staticmethod
    def _risk_heatmap_overlay(risk_map: np.ndarray) -> np.ndarray:
        """Continuous risk (0-1) → RdYlGn_r colormap, alpha proportional to risk."""
        colormap = cm.RdYlGn_r
        rgba = (colormap(risk_map) * 255).astype(np.uint8)
        # Low-risk pixels mostly transparent; high-risk pixels fully opaque
        rgba[:, :, 3] = np.clip(risk_map * 220 + 20, 0, 230).astype(np.uint8)
        return rgba

    @staticmethod
    def _risk_zones_overlay(zones: np.ndarray) -> np.ndarray:
        """Low/medium/high zones with distinct colours; non-classified transparent."""
        rgba = np.zeros((*zones.shape, 4), dtype=np.uint8)
        rgba[zones == 0] = [22,  163,  74, 130]   # low    — green, subtle
        rgba[zones == 1] = [217, 119,   6, 190]   # medium — amber
        rgba[zones == 2] = [220,  38,  38, 220]   # high   — red
        return rgba

    # ── Plot methods ──────────────────────────────────────────────────────────

    def plot_mangrove_map(self, mangrove_map, year, title=None):
        """Plot mangrove classification map and save transparent overlay."""
        if title is None:
            title = f"Mangrove Coverage - {year}"

        fig, ax = plt.subplots(figsize=(10, 8))
        cmap = ListedColormap(['white', 'darkgreen'])
        im = ax.imshow(mangrove_map, cmap=cmap, interpolation='nearest')
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel('Longitude Index')
        ax.set_ylabel('Latitude Index')
        cbar = plt.colorbar(im, ax=ax, label='Mangrove')
        cbar.set_ticks([0, 1])
        cbar.set_ticklabels(['No', 'Yes'])
        plt.tight_layout()
        save_path = self.output_dir / f"mangrove_map_{year}.png"
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
        plt.close()

        # Transparent overlay for Leaflet
        overlay_path = self.output_dir / f"mangrove_map_{year}_overlay.png"
        self._rgba_to_png(self._mangrove_overlay(mangrove_map), overlay_path)
        print(f"✓ Saved: {overlay_path}")
    
    def plot_change_map(self, loss_map, gain_map, year1, year2):
        """Plot loss and gain maps side by side and save transparent overlay."""
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))

        ax = axes[0]
        ax.imshow(loss_map, cmap=ListedColormap(['white', 'red']), interpolation='nearest')
        ax.set_title(f'Mangrove Loss {year1}→{year2}', fontsize=12, fontweight='bold')
        ax.set_xlabel('Longitude Index')
        ax.set_ylabel('Latitude Index')

        ax = axes[1]
        ax.imshow(gain_map, cmap=ListedColormap(['white', 'green']), interpolation='nearest')
        ax.set_title(f'Mangrove Gain {year1}→{year2}', fontsize=12, fontweight='bold')
        ax.set_xlabel('Longitude Index')
        ax.set_ylabel('Latitude Index')

        plt.tight_layout()
        save_path = self.output_dir / f"change_map_{year1}_{year2}.png"
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
        plt.close()

        overlay_path = self.output_dir / f"change_map_{year1}_{year2}_overlay.png"
        self._rgba_to_png(self._change_overlay(loss_map, gain_map), overlay_path)
        print(f"✓ Saved: {overlay_path}")
    
    def plot_risk_heatmap(self, risk_map, title="Mangrove Loss Risk Heatmap"):
        """Plot risk prediction heatmap and save transparent overlay."""
        fig, ax = plt.subplots(figsize=(10, 8))
        im = ax.imshow(risk_map, cmap='RdYlGn_r', interpolation='bilinear', vmin=0, vmax=1)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel('Longitude Index')
        ax.set_ylabel('Latitude Index')
        plt.colorbar(im, ax=ax, label='Loss Risk Probability')
        plt.tight_layout()
        save_path = self.output_dir / "risk_heatmap.png"
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
        plt.close()

        overlay_path = self.output_dir / "risk_heatmap_overlay.png"
        self._rgba_to_png(self._risk_heatmap_overlay(risk_map), overlay_path)
        print(f"✓ Saved: {overlay_path}")
    
    def plot_risk_zones(self, zones, title="Mangrove Risk Zones"):
        """Plot classified risk zones and save transparent overlay."""
        fig, ax = plt.subplots(figsize=(10, 8))
        zone_cmap = ListedColormap(['green', 'yellow', 'red'])
        im = ax.imshow(zones, cmap=zone_cmap, interpolation='nearest')
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel('Longitude Index')
        ax.set_ylabel('Latitude Index')
        cbar = plt.colorbar(im, ax=ax, ticks=[0, 1, 2], label='Risk Level')
        cbar.set_ticklabels(['Low', 'Medium', 'High'])
        plt.tight_layout()
        save_path = self.output_dir / "risk_zones.png"
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
        plt.close()

        overlay_path = self.output_dir / "risk_zones_overlay.png"
        self._rgba_to_png(self._risk_zones_overlay(zones), overlay_path)
        print(f"✓ Saved: {overlay_path}")
    
    def plot_change_timeline(self, change_metrics_by_period):
        """Plot mangrove loss/gain over time"""
        periods = list(change_metrics_by_period.keys())
        loss_values = [change_metrics_by_period[p]['loss_pixels'] for p in periods]
        gain_values = [change_metrics_by_period[p]['gain_pixels'] for p in periods]
        net_values = [change_metrics_by_period[p]['net_change'] for p in periods]
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        x = np.arange(len(periods))
        width = 0.25
        
        ax.bar(x - width, loss_values, width, label='Loss', color='red', alpha=0.7)
        ax.bar(x, gain_values, width, label='Gain', color='green', alpha=0.7)
        ax.bar(x + width, net_values, width, label='Net Change', color='blue', alpha=0.7)
        
        ax.set_xlabel('Time Period', fontsize=11)
        ax.set_ylabel('Area (pixels)', fontsize=11)
        ax.set_title('Mangrove Loss and Gain Timeline', fontsize=13, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(periods, rotation=45)
        ax.legend()
        ax.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        save_path = self.output_dir / "change_timeline.png"
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
        plt.close()
    
    def generate_summary_report(self, detector, predictor, change_metrics):
        """Generate text summary report"""
        report = []
        report.append("="*60)
        report.append("MANGROVE LOSS PREDICTION - SUMMARY REPORT")
        report.append("="*60)
        
        report.append(f"\nStudy Area: {config.STUDY_AREA}")
        report.append(f"Analysis Period: {config.START_YEAR}-{config.END_YEAR}")
        report.append(f"Satellite: {config.SATELLITE}")
        
        # Stage 1 Results
        report.append("\n" + "-"*60)
        report.append("STAGE 1: SPATIOTEMPORAL CHANGE DETECTION")
        report.append("-"*60)
        
        for year in sorted(detector.classification_maps.keys()):
            mangrove_map = detector.classification_maps[year]
            coverage = (np.sum(mangrove_map) / mangrove_map.size) * 100
            report.append(f"Year {year}: {coverage:.2f}% mangrove coverage ({np.sum(mangrove_map)} pixels)")
        
        # Change metrics
        report.append("\nChange Metrics:")
        for period, metrics in change_metrics.items():
            report.append(f"  {period}: Loss={metrics['loss_pixels']}, Gain={metrics['gain_pixels']}, Net={metrics['net_change']}")
        
        # Stage 3 Results
        report.append("\n" + "-"*60)
        report.append("STAGE 3: RISK PREDICTION MODEL")
        report.append("-"*60)
        report.append(f"Model Type: {predictor.model_type.upper()}")
        report.append(f"Training Status: {'✓ Trained' if predictor.is_trained else '✗ Not Trained'}")
        
        report.append("\nOutput Maps Generated:")
        report.append("  • Historical loss maps")
        report.append("  • Current mangrove health maps")
        report.append("  • Future risk heatmap (probability)")
        report.append("  • Risk zone classification (low/medium/high)")
        report.append("  • Change timeline visualization")
        
        report.append("\n" + "="*60)
        report.append("END OF REPORT")
        report.append("="*60)
        
        report_text = "\n".join(report)
        
        # Save report
        report_path = self.output_dir / "summary_report.txt"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        print(report_text)
        print(f"\n✓ Report saved: {report_path}")


def run_stage4(detector, engineer, predictor):
    """Execute Stage 4 - Generate all outputs"""
    print("\n" + "="*50)
    print("STAGE 4: FINAL OUTPUTS")
    print("="*50)
    
    generator = OutputGenerator()
    
    # Plot mangrove maps for all years
    for year in sorted(detector.classification_maps.keys()):
        generator.plot_mangrove_map(
            detector.classification_maps[year],
            year,
            title=f"Mangrove Coverage - {year} ({config.STUDY_AREA})"
        )
    
    # Plot change maps
    years = sorted(detector.classification_maps.keys())
    change_metrics = {}
    for i in range(len(years) - 1):
        year1, year2 = years[i], years[i+1]
        loss, gain, _ = detector.detect_changes(year1, year2)
        
        if loss is not None:
            generator.plot_change_map(loss, gain, year1, year2)
            metrics = detector.compute_change_metrics(loss, gain)
            change_metrics[f"{year1}→{year2}"] = metrics
    
    # Plot risk prediction (if model trained)
    if predictor.is_trained and engineer.features_df is not None:
        ref_map = detector.classification_maps[years[-1]]
        risk_proba, risk_map = predictor.predict_risk(
            engineer.features_df,
            shape=ref_map.shape
        )
        
        generator.plot_risk_heatmap(risk_map)
        
        zones, zone_counts = predictor.classify_risk_zones(risk_map)
        generator.plot_risk_zones(zones)
    
    # Plot change timeline
    if change_metrics:
        generator.plot_change_timeline(change_metrics)
    
    # Generate summary report
    generator.generate_summary_report(detector, predictor, change_metrics)
    
    return generator


if __name__ == "__main__":
    print("Run main.py to execute full pipeline")
