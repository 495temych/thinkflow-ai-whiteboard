import re
from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import FileResponse
import json

from fpdf import FPDF
import uuid
import os
import openai

openai.api_key = ""

router = APIRouter()


class TeamMember(BaseModel):
    name: str
    skills: list[str]

class PDFInput(BaseModel):
    industry: str
    team_size: int
    team_members: list[TeamMember]
    selected_idea: str


# Function to remove emojis from text
def remove_emojis(text: str) -> str:
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F1E0-\U0001F1FF"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub(r'', text)

def generate_user_stories(idea: str, team_members: list[TeamMember]) -> dict[str, list[str]]:
    member_prompts = {
        member.name: (
            f"You are generating user stories for a student project:\n"
            f"{idea}\n\n"
            f"This team member is {member.name}, and they have the following skills: {', '.join(member.skills)}.\n"
            "Generate 3 to 5 Agile user stories that match their skills and contribute to the project. "
            "Format: As a [user], I want to [do something] so that [benefit]."
        )
        for member in team_members
    }

    client = openai.OpenAI(api_key=openai.api_key)
    stories_by_member = {}

    for name, prompt in member_prompts.items():
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant generating Agile user stories."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        text = response.choices[0].message.content.strip()
        stories_by_member[name] = [line.strip() for line in text.split("\n") if line.strip()]

    return stories_by_member



@router.post("/generate-pdf")
async def generate_pdf(data: PDFInput):
    filename = f"project_summary_{uuid.uuid4().hex[:6]}.pdf"
    output_path = os.path.join(os.path.dirname(__file__), f"../generated_docs/{filename}")
    os.makedirs("generated_docs", exist_ok=True)

    # Log the full JSON payload received
    import json
    print(f"📦 Received payload for /generate-pdf:\n{json.dumps(data.model_dump(), indent=2)}")

    # Extract idea title and summary
    lines = data.selected_idea.strip().split("\n")
    idea_title = remove_emojis(lines[0]) if lines else "Unnamed Idea"
    summary_points = [remove_emojis(line.strip("- ").strip()) for line in lines[1:] if line.strip().startswith("-")]

    # Log each team member's name and skills
    for member in data.team_members:
        print(f"👤 {member.name} – Skills: {', '.join(member.skills)}")

    stories_by_member = generate_user_stories(data.selected_idea, data.team_members)

    pdf = FPDF(orientation='P', unit='mm', format='A4')
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "ThinkFlow Project Summary", ln=True, align='C')

    pdf.set_font("Arial", 'B', 14)
    pdf.ln(8)
    pdf.cell(0, 10, f"Idea: {idea_title}", ln=True)

    pdf.set_font("Arial", '', 12)
    pdf.ln(5)
    pdf.cell(0, 10, f"Industry: {data.industry}", ln=True)

    pdf.ln(5)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "Project Summary:", ln=True)
    pdf.set_font("Arial", '', 12)
    for point in summary_points:
        pdf.multi_cell(0, 8, f"- {point}")

    pdf.ln(8)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "Team & User Stories:", ln=True)
    pdf.ln(5)

    col_width = 190 / max(1, data.team_size)
    y_start = pdf.get_y()
    x_start = pdf.get_x()

    for i, member in enumerate(data.team_members):
        x_pos = x_start + i * col_width
        pdf.set_xy(x_pos, y_start)
        pdf.set_font("Arial", 'B', 11)
        pdf.multi_cell(col_width, 8, member.name, border=1)
        
        current_y = pdf.get_y()  # capture current y after name block
        pdf.set_xy(x_pos, current_y)
        pdf.set_font("Arial", 'I', 10)
        skills_text = ", ".join(member.skills)
        pdf.multi_cell(col_width, 8, f"Skills: {skills_text}", border=1)

        current_y = pdf.get_y()
        pdf.set_xy(x_pos, current_y)
        pdf.set_font("Arial", '', 10)
        for story in stories_by_member.get(member.name, []):
            pdf.set_xy(x_pos, pdf.get_y())
            pdf.multi_cell(col_width, 6, f"- {remove_emojis(story)}", border=1)

    pdf.output(output_path)
    return {"message": "PDF generated with user stories", "file_url": f"/static/{filename}"}