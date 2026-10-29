# ResumeFit — JD-tailored resume editor without redesigning the template

ResumeFit is a runnable local web app for tailoring **any text-based DOCX resume**, using the exact uploaded Word document as the output template. It lets you paste a job description, generate grounded rewrite suggestions, review/edit each line, preview the resulting PDF and download DOCX or PDF.

## What it can and cannot preserve

- **Preserved:** the original Word document's section order, headers/footers, margins, fonts, paragraph styles, tables, list numbering, icons, graphics, line spacing, colors and every unselected paragraph. Only editable text nodes in approved summary, skills and bullet paragraphs are patched.
- **Changed:** only the exact summary, skills and experience/project bullet paragraphs you approve. Education/credentials and other protected sections are not offered for rewriting. You can edit AI suggestions before export.
- **Important limitation:** a DOCX is a flowing document. Longer text can cause line wrapping or push a paragraph to the next page, even though all original formatting properties remain intact. The AI is asked to maintain similar length. Exported PDFs are converted by LibreOffice and can have minor font/layout differences versus Word on a different computer.
- **Input format:** `.docx` only for accurate in-place editing. Converting an existing PDF into Word almost always changes formatting. Please locate the original Word file if formatting fidelity matters; PDF-only resume rewriting is intentionally refused.
- **Unusual resume templates:** heavily designed documents, floating text boxes, image-based resumes, linked text or field codes may not have editable text recognized. Those items are left untouched rather than risking formatting damage.

## Run locally

Requirements: Python 3.10+ and, for PDF export/preview, LibreOffice (`soffice`).

```bash
cd resumefit_site
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

- Confirm the selected provider at [http://localhost:8000/api/health](http://localhost:8000/api/health); it should show `"ai_provider":"groq"`. This checks configuration **only**, not key validity.
- If the app says the key was rejected, check that your **local** `.env` contains the right `GROQ_API_KEY` and restart `./start.sh`. Never paste an API key into screenshots, ChatGPT, or GitHub.
- Groq free tier has an **8K tokens/minute** limit for `openai/gpt-oss-20b`. ResumeFit now limits request size; very long resumes may receive suggestions for only their first portion. The rest remain manually editable.
- If the app reports an unavailable model, set `GROQ_MODEL=openai/gpt-oss-20b` and restart.
- The terminal now logs the provider, HTTP status and safe error code (without the raw request, secret key, or resume text). Send **only** that status/error type when requesting help.

## Deploy from GitHub (Render, private personal beta)

GitHub Pages hosts static files only, so it **cannot** run this Python/FastAPI server.
The repository root has `render.yaml`, which deploys the ResumeFit subfolder as a free Render Docker web service.

1. Merge the ResumeFit GitHub pull request into `main`.
2. At [Render Dashboard](https://dashboard.render.com/), select **New > Blueprint**, connect `kartik977/AI-Job-Hunter`, and select the default branch.
3. Render reads `render.yaml`. Enter `RESUMEFIT_ACCESS_PASSWORD` (choose a strong new password) and `GROQ_API_KEY` as secret environment variables. **Never put those in GitHub.**
4. Deploy and wait for the Docker build. Render's URL is displayed when your service is live; the address is not known until creation.
5. Visit the generated HTTPS `onrender.com` URL. Sign in to the browser's HTTP Basic prompt with username `resumefit` and your `RESUMEFIT_ACCESS_PASSWORD`. Upload DOCX, paste a JD, review edits, preview PDF, and download DOCX/PDF.

The Docker image includes LibreOffice for PDF conversion and Carlito, a Calibri-compatible font. Existing portfolio/Next.js routes are unchanged. The `/healthz` readiness route is public but includes no configuration info. All other routes require the password when deployed.

**Privacy and free-tier limits:** This setup is for one owner, not an open multi-user website. Stored resumes are temporarily placed on Render's *ephemeral disk* and can be lost when the free instance sleeps or restarts; do not use it as permanent resume storage. Render's free services spin down after inactivity, with a cold-start delay. Files are removed when their sessions expire (cleanup is lazy). Groq free-tier quotas also apply. Never publish the access password or Groq key. Public signups require stronger multi-user authentication, rate limiting, a retention policy and security review.

### Local tests

```bash
cd tools/resumefit
pip install -r requirements-dev.txt
python -m pytest -q
```


## Matching cover letters

Once a resume is analyzed, scroll to **04 · Matching cover letter**. Optionally enter
company and job title, choose resume edits in step 02, and click **Generate matching
cover letter**. The draft uses the **same JD plus the approved resume changes**, so
it reflects the experiences actually present in the document. Review and edit the
letter on screen, then download as DOCX or PDF. PDF requires LibreOffice (included
in the Render Docker image). Neither the original DOCX nor the exported tailored
resume is modified by cover-letter generation.

Groq is used when `GROQ_API_KEY` is set, and the existing optional OpenAI fallback
continues to work. Free-tier Groq rate limits apply. This feature does not invent
qualifications intentionally, but AI output still needs human review. It cannot
guarantee ATS results, interviews, or employment.

## Strict JD matching and optional GPT-6

ResumeFit **only** offers changes to original DOCX summary, skills and experience/project bullet text.
Headings, company names, dates, education, certifications, graphics, margins, document structures,
and unapproved lines remain unchanged. Page breaks may still shift if replacement text wraps.

AI now identifies priority JD requirements and selects relevant original resume evidence
from across the document, including older roles and projects, to make more substantive rewrites.
Skills are *reordered* only when matching skills are already present: none are removed or invented.
Proposed rewrites with unsupported technologies or changed numbers are automatically rejected.
**80–85% alignment is a goal, not an ATS score or a guarantee.** Missing qualifications are
never invented to achieve the target.

Groq remains the free-tier default. To **opt into the paid OpenAI API** instead, configure in
Render > Environment: AI_PROVIDER=openai, OPENAI_API_KEY=<your own key>, and
OPENAI_MODEL=gpt-6-luna (cost-conscious) or gpt-6-sol (more capable).
OpenAI API billing is separate from ChatGPT Plus. Never commit secret keys.
To return to free Groq, remove AI_PROVIDER or set it to groq.

## Natural JD-focused experience rewriting

The default AI now favors **light, truthful refinements** of each existing experience/project bullet: foreground relevant work for the JD, but keep the same task, scope, employer, technologies and results. It should not turn a contribution into ownership or copy responsibilities from a different role. Bullets rewritten much longer (over roughly 20% plus a short allowance) or drastically shorter are rejected for review; unchanged bullets remain untouched. Summary rewriting and existing skills prioritization still work as before. This is not a guaranteed ATS score or an instruction to add missing expertise.


## Evidence-based JD tailoring (quality fix)

ResumeFit prioritizes a focused group of the most relevant existing experience/project bullets per AI request instead of asking the model to rewrite dozens at once. Groq uses medium reasoning with a larger completion budget, nearby resume context, and an explicit JD requirement per line. The backend now rejects experience-bullet edits that merely rearrange words or swap verbs without making a specific JD connection clearer. It still protects original metrics, unsupported technologies, formatting and all unapproved sections. Some bullets will deliberately stay unchanged if the original resume lacks genuine evidence; the tool does not invent missing qualifications. No ATS dashboard or scoring feature is reintroduced.


## Summary-specific JD tailoring

If the main AI pass doesn't generate a real summary improvement, ResumeFit makes one optional, compact summary-focused follow-up call. It can prioritize different evidenced accomplishments for different JDs and omit unrelated clauses or metrics without inventing new claims. If that call fails or still has no safe improvement, the summary stays unchanged. In the editor, an unchanged editable copy is explicitly labeled as such, rather than portrayed as an AI-tailored replacement. This may consume one additional AI request per tailoring attempt. No ATS score was added.
