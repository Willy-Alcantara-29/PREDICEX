import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.ai.services.forecast_service import ForecastService


class ForecastServiceTests(unittest.TestCase):
    def test_predict_returns_data_driven_forecast_for_inventory_product(self):
        service = ForecastService()
        result = service.predict(product_id="prd-001", sku="SKU-PRD-018", days=3)

        self.assertEqual(len(result["forecast"]), 3)
        self.assertGreater(result["confidence"], 0.0)
        self.assertEqual(result["alert"], "stock-below-threshold")


if __name__ == "__main__":
    unittest.main()
