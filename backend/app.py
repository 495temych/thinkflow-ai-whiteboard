import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from api_calls import page1_initial_input, page2_brainstorm_input, page3_build_pdf

# ✅ Create the static directory if it doesn't exist
os.makedirs("backend/generated_docs", exist_ok=True)


app = FastAPI()

# 👇 Allow frontend on localhost:3000 to call the backend on localhost:8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the router
app.include_router(page1_initial_input.router)
app.include_router(page2_brainstorm_input.router)
app.include_router(page3_build_pdf.router)



@app.get("/download-pdf")
async def download_pdf():
    pdf_path = os.path.join(os.path.dirname(__file__), "../generated_docs/thinkflow_project_plan.pdf")
    return FileResponse(path=pdf_path, filename="thinkflow_project_plan.pdf", media_type='application/pdf')


app.mount("/generated_docs", StaticFiles(directory="backend/generated_docs"), name="generated_docs")