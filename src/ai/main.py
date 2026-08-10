from pathlib import Path
import sys

from fastapi import FastAPI
from pydantic import BaseModel

sys.path.append(str(Path(__file__).resolve().parent))
from services.forecast_service import ForecastService

app = FastAPI(title="PREDICEX AI Service", version="0.1.0")
service = ForecastService()


class ForecastRequest(BaseModel):
    productId: str | None = None
    sku: str | None = None
    days: int = 7


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "PREDICEX AI Service",
        "model": service.model_name,
    }


@app.post("/forecast")
def forecast(request: ForecastRequest):
    return service.predict(
        product_id=request.productId,
        sku=request.sku,
        days=request.days,
    )
