from fastapi import FastAPI, APIRouter
from pydantic import BaseModel
from typing import List
import openai

# Load your API key from environment variable or config
openai.api_key = ""

router = APIRouter()

class TeamMember(BaseModel):
    name: str
    skills: List[str]

class Step1Input(BaseModel):
    industry: str
    team_size: int
    team_members: List[TeamMember]

class BrainstormInput(BaseModel):
    industry: str
    pain_points: List[str]
    ideas: List[str]
    goals: List[str]
    constraints: List[str]


@router.post("/generate-ideas")
async def generate_ideas(input_data: BrainstormInput):
    prompt = (
    "You are helping a student Agile team generate 3 feasible project ideas.\n\n"
    "### Context\n"
    f"Industry: {input_data.industry}\n"
    f"Pain Points: {', '.join(input_data.pain_points)}\n"
    f"Ideas brainstormed: {', '.join(input_data.ideas)}\n"
    f"Goals: {', '.join(input_data.goals)}\n"
    f"Constraints: {', '.join(input_data.constraints)}\n\n"

    "### Instruction\n"
    "Each idea must follow **this exact format** with '---' used as a separator between ideas:\n\n"
    "Idea <#>: <Short Title>\n"
    "- 🎯 Goal: <one sentence>\n"
    "- 👥 Target Users: <who will use it>\n"
    "- 💡 Fit for Team: <why this team can do it>\n"
    "- 📦 Tech Stack: <technologies or methods>\n"
    "- 🌱 Scalability: <how it can grow>\n"
    "---\n"
    "Output exactly 3 ideas in this format. Do not include any introduction, summary, or explanations outside of the ideas."
)

    client = openai.OpenAI(api_key=openai.api_key)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a product strategist."},
            {"role": "user", "content": prompt}
        ]
    )

    # Capture and print the output to terminal
    ai_output = response.choices[0].message.content.strip()
    print("\n=== AI GENERATED IDEAS ===\n")
    print(ai_output)
    print("\n===========================\n")

    return {"ideas": ai_output}