from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.storage import get_dataset_as_df
import pandas as pd
from typing import List

router = APIRouter()

class DatasetAnalysisRequest(BaseModel):
    filename: str
    target_feature: str
    protected_attribute: str

@router.post("/dataset")
async def analyze_dataset_bias(request: DatasetAnalysisRequest):
    df = get_dataset_as_df(request.filename)
    
    if df.empty:
        # Mock logic fallback explicitly for local run/testing
        return {
            "status": "success",
            "message": "Mock dataset analysis returned due to empty file or DB connection issue",
            "metrics": {
                "representation_ratio": 0.85,
                "class_imbalance": {"group_1": 60, "group_2": 40}
            }
        }

    try:
        if request.protected_attribute not in df.columns or request.target_feature not in df.columns:
            raise HTTPException(status_code=400, detail="Requested features are missing from dataset.")

        # Real metric calculation Logic:
        # Class Imbalance
        counts = df[request.protected_attribute].value_counts().to_dict()
        total_rows = len(df)
        class_imbalance = {str(k): (v / total_rows) * 100 for k,v in counts.items()}
        
        # Representation Ratio logic (privileged vs unprivileged counts)
        # Simplified ratio calculation for demonstration based on top 2 categories
        top_cats = list(counts.keys())[:2]
        representation_ratio = 1.0
        if len(top_cats) > 1:
            representation_ratio = counts[top_cats[1]] / counts[top_cats[0]]

        return {
            "status": "success",
            "filename": request.filename,
            "metrics": {
                "representation_ratio": representation_ratio,
                "class_imbalance": class_imbalance
            }
        }
        
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
