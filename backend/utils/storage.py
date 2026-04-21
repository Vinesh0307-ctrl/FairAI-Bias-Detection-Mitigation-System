import os
import io
import requests
import pandas as pd
import joblib
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "Datasets"

def upload_dataset(file_bytes: bytes, file_name: str) -> str:
    """Uploads a CSV file to the Supabase Storage Bucket."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return f"mock_url_for_{file_name}"
        
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "text/csv"
        }
        res = requests.post(url, headers=headers, data=file_bytes)
        res.raise_for_status()
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
    except requests.exceptions.HTTPError as e:
        print(f"Supabase Upload HTTP Error: {e.response.status_code} - {e.response.text}")
        print("Falling back to local mock storage...")
        return f"mock_url_for_{file_name}"
    except Exception as e:
        print("Upload Error:", e)
        return f"mock_url_for_{file_name}"

def get_dataset_as_df(file_name: str) -> pd.DataFrame:
    """Retrieves a CSV file from Supabase and parses it with pandas."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        # Return a mock empty DataFrame for testing without DB access
        return pd.DataFrame()
        
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return pd.read_csv(io.BytesIO(response.content))
    except Exception as e:
        print("Download Error:", e)
        return pd.DataFrame()

def get_model_as_obj(file_name: str):
    """Retrieves a model file from Supabase and parses it with joblib."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
        
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return joblib.load(io.BytesIO(response.content))
    except Exception as e:
        print("Download Error:", e)
        return None
