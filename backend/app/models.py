from pydantic import BaseModel, Field
from typing import Optional


class ClimoResponse(BaseModel):
    """Response model for climatology rain probability data"""
    pop: float = Field(..., description="Probability of precipitation (0-100)")
    pop_low: float = Field(..., description="Lower bound of 95% confidence interval")
    pop_high: float = Field(..., description="Upper bound of 95% confidence interval")
    mean_mm: float = Field(..., description="Mean rainfall on rainy days (mm)")
    median_mm: float = Field(..., description="Median rainfall on rainy days (mm)")
    n_years: int = Field(..., description="Number of years in sample")
    source: str = Field(..., description="Data source information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pop": 45.2,
                "pop_low": 38.1,
                "pop_high": 52.3,
                "mean_mm": 8.7,
                "median_mm": 4.2,
                "n_years": 22,
                "source": "IMERG Final v07 climatology (2001-2022) - DEMO DATA"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")