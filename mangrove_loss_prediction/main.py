"""Main pipeline runner - Execute all 4 stages"""

import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.stage1_change_detection.detector import run_stage1
from src.stage2_feature_engineering.feature_extractor import run_stage2
from src.stage3_risk_model.predictor import run_stage3
from src.stage4_outputs.visualizer import run_stage4
import config


def main():
    """Execute the complete mangrove loss prediction pipeline"""
    
    print("\n" + "█"*60)
    print("█" + " "*58 + "█")
    print("█  MANGROVE LOSS PREDICTION SYSTEM" + " "*24 + "█")
    print("█  Mumbai / Thane Creek Analysis (2020-2025)" + " "*13 + "█")
    print("█" + " "*58 + "█")
    print("█"*60)
    
    try:
        # ===== STAGE 1: Change Detection =====
        detector = run_stage1(config.YEARS)
        
        # ===== STAGE 2: Feature Engineering =====
        engineer = run_stage2(detector)
        
        # ===== STAGE 3: Risk Prediction =====
        predictor = run_stage3(engineer, detector)
        
        # ===== STAGE 4: Final Outputs =====
        generator = run_stage4(detector, engineer, predictor)
        
        # Summary
        print("\n" + "█"*60)
        print("█" + " "*58 + "█")
        print("█  PIPELINE EXECUTION COMPLETED SUCCESSFULLY ✓" + " "*10 + "█")
        print("█" + " "*58 + "█")
        print(f"█  Output Directory: {config.OUTPUT_DIR}" + " "*(60-35-len(config.OUTPUT_DIR)) + "█")
        print("█" + " "*58 + "█")
        print("█"*60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Pipeline Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
