from fastapi import FastAPI, APIRouter
from pydantic import BaseModel
import openai

router = APIRouter()
app = FastAPI()

openai.api_key = ""

class IndustryInput(BaseModel):
    industry: str
    skills: list[str] 

@router.post("/generate-hashtags")
async def generate_hashtags(input_data: IndustryInput):
    combined_skills = ", ".join(input_data.skills)
    prompt = (
        f"List 5-10 current innovation or digitalization trends in the {input_data.industry} industry, "
        f"relevant to a team skilled in {combined_skills}. "
        f"Respond with short hashtags only, no explanations. Example format: #SmartHomes #EdgeComputing"
    )

    client = openai.OpenAI(api_key=openai.api_key)

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are an expert in digital innovation trends."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    hashtags = response.choices[0].message.content.strip()

    print("\n=== TREND RESPONSE ===\n")
    print(hashtags)
    print("\n=======================\n")

    return {"trends": hashtags}