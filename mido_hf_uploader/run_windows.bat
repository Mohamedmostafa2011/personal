@echo off
cd /d "%~dp0"
if not exist .venv (
  py -m venv .venv
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if not exist .env (
  copy .env.example .env
  echo.
  echo Created .env. Edit it with your Hugging Face token and chosen password, then run this file again.
  notepad .env
  pause
  exit /b
)
python -m uvicorn app:app --host 127.0.0.1 --port 8000
