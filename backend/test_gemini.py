import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv("d:/NEW IDEA/backend/.env")
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

from app.gemini_analyzer import PROMPT_TEMPLATE

model = genai.GenerativeModel("gemini-2.5-flash")

prompt = PROMPT_TEMPLATE.format(
    title="Zero Waste Vision",
    description="AI to analyze and detect the waste it will analyze your waste and also categorize it . It will tell you to seperate the wastes recycling tricks and you can ask questions from Our integrated AI",
    tech_stack="React, Flask, FastAPI",
    year_of_study=2,
    has_live_url=True,
    has_github_url=True,
    has_readme=False,
)

response = model.generate_content(
    prompt,
    generation_config=genai.types.GenerationConfig(
        temperature=0.4,
        max_output_tokens=8192,
        response_mime_type="application/json",
    ),
)

print("Text:", response.text)
try:
    print("Finish Reason:", response.candidates[0].finish_reason)
except Exception as e:
    print("Error getting finish reason:", e)
