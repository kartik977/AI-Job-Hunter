# ResumeFit — JD-tailored resume editor without redesigning the template

ResumeFit is a runnable local web app for tailoring **any text-based DOCX resume**, using the exact uploaded Word document as the output template. It lets you paste a job description, generate grounded rewrite suggestions, review/edit each line, preview the resulting PDF and download DOCX or PDF.

## What it can and cannot preserve

- **Preserved:** the original Word document's section order, headers/footers, margins, fonts, paragraph styles, tables, list numbering, icons, graphics, line spacing, colors and every unselected paragraph. Only editable text nodes in approved summary, skills and bullet paragraphs are patched.
- **Changed:** only the exact summary, skills and experience/project bullet paragraphs you approve. Education/credentials and other protected sections are not offered for rewriting. You can edit AI suggestions before export.
- **Important limitation:** a DOCX is a flowing document. Longer text can cause line wrapping or push a paragraph to the next page, even though all original formatting properties remain intact. The AI is asked to maintain similar length. Exported PDFs are converted by LibreOffice and can have minor font/layout differences versus Word on a different computer.
- **Input format:** `.docx` only for accurate in-place editing. Converting an existing PDF into Word almost always changes formatting. Please locate the original Word file if formatting fidelity matters; PDF-only resume rewriting is intentionally refused.
- **Unusual resume templates:** heavily designed documents, floating text boxes, image-based resumes, linked text or field codes may not have editable text recognized. Those items are left untouched rather than risking formatting damage.

## Run locally

Requirements: Python 3.11+ and, for PDF export/preview, LibreOffice (`soffice`).

```bash
cd AI-Job-Hunter/tools/resumefit
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GROQ_API_KEY to use Groq free-tier AI rewriting.
./start.sh                       # Windows: python -m uvicorn app.main:app --port 8000
```

Open **http://127.0.0.1:8000**.

### Enable Groq AI suggestions (free tier)

1. Create a key in [Groq Console](https://console.groq.com/keys). Free usage is subject to model and rate limits.
2. Put `GROQ_API_KEY=gsk_...` into your local `.env` (never GitHub).
3. Leave `GROQ_MODEL=openai/gpt-oss-20b`, the supported default.
4. Restart `./start.sh`, upload a `.docx`, paste the JD and click **Generate suggestions**.

Groq uses its OpenAI-compatible API, so the existing `openai` Python package is reused. If both keys are configured, **Groq takes priority**. `OPENAI_API_KEY` is an optional paid fallback when Groq is unset. If neither key is configured, the app still supports manual editing, local skill reordering, and DOCX export. It does **not** claim to generate AI suggestions without a provider key.

The website text and editing fields have larger font sizes for readability; **the resume's own font formatting is never changed** by website typography.


### Mac PDF support

```bash
brew install --cask libreoffice
```

Ubuntu/Debian:

```bash
sudo apt-get install libreoffice
```

DOCX export does not need LibreOffice.

## How to use

1. Upload an existing `.docx` resume, paste any JD (at least 50 characters), and click **Analyze resume**.
2. Inspect detected summary, skills and bullet paragraphs.
3. Click **Generate suggestions** (requires API key for full AI rewriting), edit individual suggestions, and check/uncheck any changes.
4. Download the updated **DOCX** or **PDF**, then compare the result to your original. The original uploaded file is never modified.

## Privacy / security

- Files are stored under a temporary unguessable session ID and expire after **1 hour** (cleanup triggered by subsequent uploads). Use **Start over** to delete the current file immediately.
- With AI enabled, the **extracted resume text and job description are transmitted to your configured Groq or OpenAI API provider** for suggestions. No full DOCX is uploaded to the model. Without a key, no resume information is transmitted to AI.
- This is designed for **local/personal use**. Before deploying publicly, add authentication, a reverse proxy, rate limits, file scanning, session ownership and a retention policy.
- A simple numerical claim guard rejects generated metrics not found in the original bullet, but users must still proofread any generated text. It is not a factual verification service.

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest -q
```

## Project layout

```
app/main.py          FastAPI endpoints, upload, exports, session management
app/engine.py        DOCX paragraph detection and formatting-preserving text patches
app/ai.py            grounded rewrite prompt and conservative local fallback
app/static/*         self-contained website UI
requirements.txt
start.sh
```

## If Generate Suggestions fails

- Check http://localhost:8000/api/health and confirm that the selected `ai_provider` is `groq`. This verifies configuration, not whether the key is valid.
- If your key is rejected, verify `GROQ_API_KEY` in your local `.env` and restart `./start.sh`. Never commit or share your real key.
- Groq's free tier has an 8K tokens/minute limit for `openai/gpt-oss-20b`. ResumeFit reduces prompt size; for unusually large resumes only a portion of bullets may receive AI suggestions, and the others stay manually editable.
- If the model is reported unavailable, configure `GROQ_MODEL=openai/gpt-oss-20b` and restart.
- The terminal logs the provider, HTTP status, safe error code, and exception type without including raw resume data or API keys. Share only that diagnostic information for help.
