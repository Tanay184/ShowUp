import google.generativeai as genai
import json
import json_repair
import os
import re

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

SCORE_LABELS = [
    (4.0,  "Just Getting Started"),
    (6.0,  "Needs Work"),
    (7.5,  "Solid Foundation"),
    (9.0,  "Hire-Ready"),
    (10.1, "Exceptional"),
]

PROMPT_TEMPLATE = """
You are a senior software engineer at a top Indian product startup doing a brutally honest portfolio review for a {year_of_study} year engineering student.

Be specific, direct, and genuinely useful — not generic or encouraging for the sake of it.
A student should read this and immediately know exactly what to fix and why.

Project Details:
- Title: {title}
- Description: {description}
- Tech Stack: {tech_stack}
- Has Live Demo: {has_live_url}
- Has GitHub Link: {has_github_url}
- Has README: {has_readme}
- Student Year: {year_of_study}

Analyze across exactly these 7 dimensions. You MUST return a JSON object that EXACTLY matches the structure below. Do not change or omit any of the 7 keys inside the "dimensions" object. Return ONLY a valid JSON object — no markdown, no code blocks, no explanation before or after. Raw JSON only.

{{
  "overall_score": 7.4,
  "score_label": "Solid Foundation",
  "project_tagline": "A one sentence description of what this project actually does, written compellingly",
  "dimensions": {{
    "problem_clarity": {{
      "score": 6,
      "label": "Problem Clarity",
      "feedback": "Does this solve a real problem or is it a tutorial clone? Be specific about what's missing or strong here. 2-3 sentences."
    }},
    "tech_appropriateness": {{
      "score": 8,
      "label": "Tech Stack Fit",
      "feedback": "Did they use the right tools for this job? Call out any overkill, underkill, or smart choices. 2-3 sentences."
    }},
    "complexity_for_year": {{
      "score": 7,
      "label": "Complexity vs Year",
      "feedback": "Is this impressive, expected, or below par for a {year_of_study} year student? Be direct. 2-3 sentences."
    }},
    "industry_relevance": {{
      "score": 8,
      "label": "Industry Relevance",
      "feedback": "How hireable does this project make them? What companies or roles would value this? 2-3 sentences."
    }},
    "completeness": {{
      "score": 5,
      "label": "Completeness",
      "feedback": "README, live demo, deployment, documentation — what's missing and why it matters. 2-3 sentences."
    }},
    "code_quality_signals": {{
      "score": 6,
      "label": "Code Quality Signals",
      "feedback": "Based on the tech stack and description, what can be inferred about code quality? What patterns suggest good or bad practices? 2-3 sentences."
    }},
    "presentation": {{
      "score": 7,
      "label": "How It's Presented",
      "feedback": "Is the project description clear and compelling? Would a non-technical founder understand the value? 2-3 sentences."
    }}
  }},
  "next_steps": [
    "Specific actionable improvement 1 — explain why this matters",
    "Specific actionable improvement 2 — explain why this matters",
    "Specific actionable improvement 3 — explain why this matters"
  ],
  "brutal_honest_line": "The one thing a senior would say that nobody else will — specific, uncomfortable, and true. One sentence only.",
  "strengths": [
    "Genuine strength 1",
    "Genuine strength 2"
  ]
}}

Score labels to use based on overall_score:
- 0-4: "Just Getting Started"
- 4-6: "Needs Work"
- 6-7.5: "Solid Foundation"
- 7.5-9: "Hire-Ready"
- 9-10: "Exceptional"
"""


def analyze_project(
    title: str,
    description: str,
    tech_stack: str,
    year_of_study: int = 2,
    has_live_url: bool = False,
    has_github_url: bool = False,
    has_readme: bool = False,
) -> dict:
    """
    Analyse a student project across 7 dimensions using Gemini 2.5 Flash.
    Returns a structured dict with score, dimensions, next_steps, etc.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = PROMPT_TEMPLATE.format(
        title=title or "Untitled",
        description=description or "No description provided.",
        tech_stack=tech_stack or "Not specified",
        year_of_study=year_of_study,
        has_live_url=has_live_url,
        has_github_url=has_github_url,
        has_readme=has_readme,
    )

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.4,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()

    # Strip markdown fences if Gemini wraps anyway
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"^```\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    raw = raw.strip()

    result = json_repair.loads(raw)

    # Normalise overall_score to float, clamped 0-10
    result["overall_score"] = max(0.0, min(10.0, float(result.get("overall_score", 5.0))))

    # Ensure score_label is consistent with score
    for threshold, label in SCORE_LABELS:
        if result["overall_score"] < threshold:
            result["score_label"] = label
            break

    # Ensure required top-level keys exist
    for key in ["project_tagline", "dimensions", "next_steps", "brutal_honest_line", "strengths"]:
        if key not in result:
            result[key] = None

    # Enforce dimensions structure
    default_dims = {
        "problem_clarity": {"score": 0, "label": "Problem Clarity", "feedback": "AI analysis skipped this dimension."},
        "tech_appropriateness": {"score": 0, "label": "Tech Stack Fit", "feedback": "AI analysis skipped this dimension."},
        "complexity_for_year": {"score": 0, "label": "Complexity vs Year", "feedback": "AI analysis skipped this dimension."},
        "industry_relevance": {"score": 0, "label": "Industry Relevance", "feedback": "AI analysis skipped this dimension."},
        "completeness": {"score": 0, "label": "Completeness", "feedback": "AI analysis skipped this dimension."},
        "code_quality_signals": {"score": 0, "label": "Code Quality Signals", "feedback": "AI analysis skipped this dimension."},
        "presentation": {"score": 0, "label": "How It's Presented", "feedback": "AI analysis skipped this dimension."}
    }

    if not isinstance(result.get("dimensions"), dict):
        result["dimensions"] = default_dims
    else:
        for k, v in default_dims.items():
            if k not in result["dimensions"] or not isinstance(result["dimensions"][k], dict):
                result["dimensions"][k] = v

    return result
