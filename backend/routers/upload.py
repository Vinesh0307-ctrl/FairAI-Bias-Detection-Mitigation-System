from fastapi import APIRouter, File, UploadFile, HTTPException
from utils.storage import upload_dataset

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    valid_extensions = (".csv", ".pkl", ".joblib")
    if not file.filename.endswith(valid_extensions):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV, PKL, or JOBLIB file.")
        
    try:
        contents = await file.read()
        public_url = upload_dataset(contents, file.filename)
        
        if not public_url:
            raise HTTPException(status_code=500, detail="Fail to upload the file to Supabase.")
            
        return {"filename": file.filename, "url": public_url, "status": "Uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
