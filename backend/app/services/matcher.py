
import json

from app.services.groq_service import ask_groq


def match_resume_to_job(
    resume_text: str,
    job_data: dict
) -> dict:

    prompt = f"""
You are an expert technical recruiter.

Compare the candidate resume against the job requirements.

Return ONLY valid JSON.

Do not use markdown.
Do not add explanations outside JSON.

IMPORTANT RULES:

1. Never invent candidate experience.

2. Only mark a skill as matched if there is clear evidence in the resume.

3. If the candidate has related experience but not the exact skill,
   classify it as partial.

4. If there is no evidence, classify it as missing.

5. Do not treat related technologies as identical.

Examples:

React != Next.js
JavaScript != TypeScript
REST API != JWT
Python != FastAPI

6. Academic projects, personal projects, coursework and hackathons
   are NOT professional work experience.

7. Evaluate professional experience separately.

8. Recommendations must be based on the actual resume and job.

9. Do not recommend inventing experience.

10. Do not mention unrelated companies, technologies or organizations.

11. Resume recommendations should focus on improving existing evidence.

12. Skill development suggestions should NOT be included in
    resume recommendations.

13. Never tell the candidate to add a skill, experience, project,
    internship, certification, or achievement unless the resume
    already provides evidence that they have it.

14. If a requirement is missing, explain how the candidate can
    address the gap through future learning or projects, but do
    NOT phrase it as something they should add to their current
    resume.

15. When suggesting a resume change based on a conditional fact,
    use language such as:
    "If applicable, highlight..."
    or
    "If you have this experience, consider adding..."

16. Never fabricate experience to satisfy a job requirement.    

RETURN EXACTLY THIS JSON STRUCTURE:

{{
    "matched_skills": [],
    "missing_skills": [],
    "partial_matches": [],

    "required_skills_matched": 0,
    "required_skills_total": 0,

    "preferred_skills_matched": 0,
    "preferred_skills_total": 0,

    "experience_level": "strong|partial|weak",

    "experience_match": "",

    "responsibility_match": "strong|partial|weak",

    "recommendations": []
}}

SCORING INFORMATION:

required_skills_matched:
Number of required job skills clearly demonstrated in the resume.

required_skills_total:
Total number of required job skills.

preferred_skills_matched:
Number of preferred skills clearly demonstrated.

preferred_skills_total:
Total number of preferred skills.

experience_level:

strong = professional experience clearly satisfies the requirement

partial = some relevant experience exists but the requirement is not
fully satisfied

weak = little or no relevant experience

responsibility_match:

strong = resume demonstrates strong evidence for the main responsibilities

partial = some responsibilities are demonstrated

weak = little evidence for the responsibilities

Keep recommendations concise.

Maximum 5 recommendations.

JOB DATA:

{json.dumps(job_data, indent=2)}

RESUME:

{resume_text}
"""

    response = ask_groq(prompt)

    try:

        result = json.loads(response)

    except json.JSONDecodeError:

        raise ValueError(
            "Groq returned invalid JSON"
        )


    # --------------------------------
    # NORMALIZE ARRAYS
    # --------------------------------

    result["matched_skills"] = (
        result.get("matched_skills") or []
    )

    result["missing_skills"] = (
        result.get("missing_skills") or []
    )

    result["partial_matches"] = (
        result.get("partial_matches") or []
    )

    result["recommendations"] = (
        result.get("recommendations") or []
    )


    # --------------------------------
    # SKILL COUNTS
    # --------------------------------

    required_matched = int(
        result.get("required_skills_matched", 0)
        or 0
    )

    required_total = int(
        result.get("required_skills_total", 0)
        or 0
    )

    preferred_matched = int(
        result.get("preferred_skills_matched", 0)
        or 0
    )

    preferred_total = int(
        result.get("preferred_skills_total", 0)
        or 0
    )


    # Prevent invalid values

    required_matched = max(
        0,
        min(required_matched, required_total)
    )

    preferred_matched = max(
        0,
        min(preferred_matched, preferred_total)
    )


    # --------------------------------
    # SKILL SCORE
    # --------------------------------

    if required_total > 0:

        required_score = (
            required_matched /
            required_total
        ) * 100

    else:

        required_score = 100


    if preferred_total > 0:

        preferred_score = (
            preferred_matched /
            preferred_total
        ) * 100

    else:

        preferred_score = 100


    skill_score = (
        required_score * 0.80
        +
        preferred_score * 0.20
    )


    # --------------------------------
    # EXPERIENCE SCORE
    # --------------------------------

    experience_level = (
        result.get("experience_level")
        or "weak"
    ).lower()


    if experience_level == "strong":

        experience_score = 100

    elif experience_level == "partial":

        experience_score = 60

    else:

        experience_score = 25


    # --------------------------------
    # RESPONSIBILITY SCORE
    # --------------------------------

    responsibility_level = (
        result.get("responsibility_match")
        or "weak"
    ).lower()


    if responsibility_level == "strong":

        responsibility_score = 100

    elif responsibility_level == "partial":

        responsibility_score = 60

    else:

        responsibility_score = 25


    # --------------------------------
    # FINAL SCORE
    # --------------------------------

    final_score = (
        skill_score * 0.50
        +
        experience_score * 0.25
        +
        responsibility_score * 0.15
        +
        preferred_score * 0.10
    )


    final_score = round(
        max(0, min(100, final_score))
    )


    # --------------------------------
    # RESULT
    # --------------------------------

    result["match_score"] = final_score

    result["score_breakdown"] = {

        "skills": round(skill_score),

        "experience": experience_score,

        "responsibilities": responsibility_score,

        "preferred_skills": round(preferred_score)
    }

    result["skill_summary"] = {

        "required_matched": required_matched,

        "required_total": required_total,

        "preferred_matched": preferred_matched,

        "preferred_total": preferred_total
    }

    result["experience_match"] = (
        result.get("experience_match")
        or "Experience match could not be determined."
    )


    return result

