import json
from pathlib import Path


class ForecastService:
    def __init__(self):
        self.model_name = "rule-based"
        self.data_path = Path(__file__).resolve().parents[2] / "database" / "data.json"

    def _load_inventory(self):
        with self.data_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return payload.get("inventarios", [])

    def predict(self, product_id: str | None = None, sku: str | None = None, days: int = 7):
        inventory = self._load_inventory()
        record = None

        for item in inventory:
            if product_id and item.get("productoId") == product_id:
                record = item
                break
            if sku and item.get("sku") == sku:
                record = item
                break

        if record is None:
            return {
                "productId": product_id,
                "sku": sku,
                "days": days,
                "forecast": [0 for _ in range(days)],
                "confidence": 0.0,
                "alert": "no-data",
                "message": "No se encontró información para el producto solicitado.",
            }

        stock = int(record.get("stockNeto", 0))
        threshold = int(record.get("umbralAlerta", 0))
        forecast = [max(stock - (index + 1) * 2, 0) for index in range(days)]
        confidence = 0.72 if stock <= threshold else 0.84
        alert = "stock-below-threshold" if stock <= threshold else "stock-ok"
        message = (
            "Pronóstico simple basado en stock actual y umbral de alerta."
            if stock <= threshold
            else "Pronóstico simple basado en stock actual y umbral de alerta."
        )

        return {
            "productId": product_id or record.get("productoId"),
            "sku": sku or record.get("sku"),
            "days": days,
            "forecast": forecast,
            "confidence": confidence,
            "alert": alert,
            "message": message,
        }
