
import json

from app.services.groq_service import ask_groq


def analyze_job_description(job_description: str) -> dict:

    prompt = f"""
You are an expert job-description analyzer.

Analyze the following job description and return ONLY valid JSON.

Do not use markdown.
Do not add explanations outside JSON.

IMPORTANT:

Separate technical/professional skills from other requirements.

A SKILL is a technology, tool, framework, programming language,
platform, methodology, or clearly defined professional capability.

Examples of skills:

Python
React
TypeScript
Next.js
Docker
AWS
REST APIs
SQL
Git
JWT
Debugging
Performance optimization

DO NOT put these into required_skills or preferred_skills:

- Years of experience
- Education requirements
- College/university requirements
- Company/startup background
- Salary
- Location
- Work authorization
- Personality traits
- Generic statements about candidates
- Company preferences

For example:

"1-3 years of experience"
→ experience

"Graduate from IIT/BITS/NIT"
→ education

"Experience at a Y Combinator-backed startup"
→ background_requirements

"Strong communication skills"
→ soft_skills

"Experience with React and TypeScript"
→ skills

Return EXACTLY this structure:

{{
    "job_title": "",

    "required_skills": [],

    "preferred_skills": [],

    "experience": "",

    "education": [],

    "background_requirements": [],

    "soft_skills": [],

    "responsibilities": []
}}

RULES:

1. Keep skill names concise.

2. Do not duplicate the same skill.

3. Do not put sentences into skill arrays.

4. Do not turn experience requirements into skills.

5. Do not turn education requirements into skills.

6. Do not turn company preferences into skills.

7. Extract only requirements explicitly supported by the job description.

8. Keep responsibilities concise.

9. Do not invent requirements.

JOB DESCRIPTION:

{job_description}
"""

    response = ask_groq(prompt)

    try:

        result = json.loads(response)

    except json.JSONDecodeError:

        raise ValueError(
            "Groq returned invalid JSON"
        )


    # -------------------------
    # NORMALIZE RESULT
    # -------------------------

    result["job_title"] = (
        result.get("job_title")
        or "Unknown Position"
    )

    result["required_skills"] = (
        result.get("required_skills") or []
    )

    result["preferred_skills"] = (
        result.get("preferred_skills") or []
    )

    result["education"] = (
        result.get("education") or []
    )

    result["background_requirements"] = (
        result.get("background_requirements") or []
    )

    result["soft_skills"] = (
        result.get("soft_skills") or []
    )

    result["responsibilities"] = (
        result.get("responsibilities") or []
    )

    result["experience"] = (
        result.get("experience")
        or "Not specified"
    )


    return result

