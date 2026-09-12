from app.services.job_analyzer import analyze_job_description
from app.services.matcher import match_resume_to_job


def analyze_job(job_description: str) -> dict:
    """
    Analyze a job description and extract
    structured requirements.
    """

    return analyze_job_description(job_description)


def match_resume(
    resume_text: str,
    job_data: dict
) -> dict:
    """
    Compare a resume against structured
    job requirements.
    """

    return match_resume_to_job(
        resume_text=resume_text,
        job_data=job_data
    )