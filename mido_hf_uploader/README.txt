MIDO'S PRIVATE HUGGING FACE UPLOADER
====================================

1) Create a Hugging Face access token with WRITE access to dataset:
   https://huggingface.co/settings/tokens

2) Double-click run_windows.bat.
   The first run installs dependencies and creates .env from .env.example.

3) Fill in .env:
   HF_REPO_ID=MidoSTM11/Mido
   HF_TOKEN=your Hugging Face write token
   SITE_PASSWORD=the password you choose
   SESSION_SECRET=a long random secret (at least 32 characters)

4) Double-click run_windows.bat again.
   Open http://127.0.0.1:8000 in your browser.

HOW THE SECRET ENTRY WORKS
--------------------------
The page initially looks like a 404 error page. Click the small red
question-mark icon five times. A short synthesized chime plays and the
password field appears. Enter the SITE_PASSWORD value from .env and press
Enter (or click Unlock) to reach the upload page.

SECURITY NOTES
-------------
- Keep .env private. Never share it or upload it to GitHub.
- The server binds to 127.0.0.1, so it is available only on this computer.
- The hidden five-click sequence is an easter egg, not a security boundary.
  Actual access control is enforced by the server-side password check.
- Uploaded files are sent directly to MidoSTM11/Mido on Hugging Face.
- Files are stored in the repository's main branch. Uploading a file with
  the same name may replace the existing path.
- The download link works according to the dataset repository's visibility.
  If the dataset is private, visitors need Hugging Face permission/authentication
  to download it.
