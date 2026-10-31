import os
import secrets
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from huggingface_hub import HfApi

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
HF_REPO_ID = os.getenv("HF_REPO_ID", "MidoSTM11/Mido").strip()
SITE_PASSWORD = os.getenv("SITE_PASSWORD", "")
SESSION_SECRET = os.getenv("SESSION_SECRET", "")

if not SITE_PASSWORD:
    raise RuntimeError("Set SITE_PASSWORD in your .env file.")
if not SESSION_SECRET or len(SESSION_SECRET) < 32:
    raise RuntimeError("Set SESSION_SECRET in .env to a random string of at least 32 characters.")
if not HF_TOKEN:
    raise RuntimeError("Set HF_TOKEN in your .env file.")

app = FastAPI()
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="mido_uploader_session",
    max_age=60 * 60 * 8,
    same_site="lax",
    https_only=False,  # localhost only; use HTTPS if you later deploy publicly
)

app.mount("/static", StaticFiles(directory="static"), name="static")


def is_logged_in(request: Request) -> bool:
    return request.session.get("authenticated") is True


@app.get("/")
async def home(request: Request):
    if is_logged_in(request):
        return FileResponse("static/uploader.html")
    return FileResponse("static/error.html")


@app.post("/api/login")
async def login(request: Request):
    data = await request.json()
    password = str(data.get("password", ""))
    if secrets.compare_digest(password, SITE_PASSWORD):
        request.session.clear()
        request.session["authenticated"] = True
        return {"ok": True}
    raise HTTPException(status_code=401, detail="Incorrect password.")


@app.post("/api/logout")
async def logout(request: Request):
    request.session.clear()
    return {"ok": True}


@app.post("/api/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    if not is_logged_in(request):
        raise HTTPException(status_code=401, detail="Please unlock the uploader first.")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    # Keep only the filename, preventing directory traversal.
    filename = Path(file.filename.replace("\\", "/")).name.strip()
    if not filename or filename in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    try:
        api = HfApi(token=HF_TOKEN)
        api.upload_file(
            path_or_fileobj=file.file,
            path_in_repo=filename,
            repo_id=HF_REPO_ID,
            repo_type="dataset",
            commit_message=f"Upload {filename} from Mido's private uploader",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Hugging Face upload failed: {str(exc)[:400]}")

    link = f"https://huggingface.co/datasets/{HF_REPO_ID}/resolve/main/{quote(filename)}"
    return {"ok": True, "filename": filename, "url": link}


@app.get("/api/status")
async def status(request: Request):
    return {"authenticated": is_logged_in(request), "repo_id": HF_REPO_ID}
