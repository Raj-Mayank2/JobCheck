from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.job_analyzer import analyze_job_description
from app.services.groq_service import ask_groq
from app.services.resume_parser import extract_resume_text
from app.services.matcher import match_resume_to_job
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="JobMatch API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobRequest(BaseModel):
    job_description: str

class MatchRequest(BaseModel):
    resume_text: str
    job_data: dict


@app.get("/")
def root():
    return {
        "message": "JobMatch API is running"
    }


@app.get("/test-groq")
def test_groq():
    answer = ask_groq(
        "Explain what a REST API is in one simple sentence."
    )

    return {
        "answer": answer
    }


@app.post("/resume")
async def upload_resume(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided"
        )

    allowed_extensions = [".pdf", ".docx"]

    extension = "." + file.filename.split(".")[-1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported"
        )

    file_bytes = await file.read()

    temp_path = f"temp_resume{extension}"

    with open(temp_path, "wb") as f:
        f.write(file_bytes)

    try:
        resume_text = extract_resume_text(temp_path)

    finally:
        import os

        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "filename": file.filename,
        "text": resume_text
    }


@app.post("/analyze-job")
def analyze_job(request: JobRequest):

    try:

        result = analyze_job_description(
            request.job_description
        )

        return result

    except ValueError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/match")
def match_resume(request: MatchRequest):

    try:

        result = match_resume_to_job(
            resume_text=request.resume_text,
            job_data=request.job_data
        )

        return result

    except ValueError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )