from mcp.server import MCPServer

from app.mcp.tools import analyze_job, match_resume


server = MCPServer(
    name="JobMatch"
)


@server.tool()
def analyze_job_description_tool(
    job_description: str
) -> dict:
    """
    Analyze a job description and extract
    structured requirements.
    """

    return analyze_job(job_description)


@server.tool()
def match_resume_to_job_tool(
    resume_text: str,
    job_data: dict
) -> dict:
    """
    Compare a resume against a job and generate
    a match score, missing skills and recommendations.
    """

    return match_resume(
        resume_text=resume_text,
        job_data=job_data
    )


if __name__ == "__main__":
    server.run()