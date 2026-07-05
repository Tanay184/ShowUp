import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

GEMINI_PROMPT_TEMPLATE = """You are a senior software engineer reviewing a student project for a portfolio platform.
Analyse this project and return ONLY a valid JSON object with no markdown, no explanation, just raw JSON.

Project Title: {title}
Description: {description}
Tech Stack: {tech_stack}

Return this exact JSON structure:
{{
  "overall_score": 7,
  "summary": "One sentence summary of the project",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "industry_relevance": "How relevant this is to real industry work",
  "suggested_next_steps": ["next step 1", "next step 2"]
}}"""


def analyse_project(title: str, description: str, tech_stack: str) -> dict:
    """
    Call Gemini Flash 1.5 to analyse a student project.
    Returns parsed JSON dict or raises an exception.
    """
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = GEMINI_PROMPT_TEMPLATE.format(
        title=title,
        description=description or "No description provided.",
        tech_stack=tech_stack or "Not specified",
    )

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.4,
            max_output_tokens=1024,
        ),
    )

    raw = response.text.strip()

    # Strip markdown code fences if Gemini wraps them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    result = json.loads(raw)

    # Validate expected keys
    required_keys = ["overall_score", "summary", "strengths", "improvements",
                     "industry_relevance", "suggested_next_steps"]
    for key in required_keys:
        if key not in result:
            raise ValueError(f"Gemini response missing key: {key}")

    # Clamp overall_score to 1-10
    result["overall_score"] = max(1, min(10, int(result["overall_score"])))

    return result
