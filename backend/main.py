from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import upload, analyze, model, mitigate

load_dotenv()

app = FastAPI(title="FairAI Backend", description="Backend APIs for Bias Detection & Mitigation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production, e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analyze.router, prefix="/api", tags=["Dataset Analysis"])
app.include_router(model.router, prefix="/api", tags=["Model Analysis"])
app.include_router(mitigate.router, prefix="/api", tags=["Mitigation"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the FairAI API"}
