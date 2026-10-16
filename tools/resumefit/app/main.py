from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from uuid import uuid4
import logging
import re

from docx import Document
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .engine import Candidate, edit_docx, find_candidates, serialize_candidates, validate_docx
from .ai import suggest, active_provider
from .access import access_response
from .jd import focus_requirements
from .cover_letter import generate as generate_cover_letter, make_docx as make_cover_docx

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent
SESSIONS = Path(os.getenv('RESUMEFIT_SESSION_DIR', str(Path(tempfile.gettempdir()) / 'resumefit-sessions')))
SESSIONS.mkdir(parents=True, exist_ok=True)
MAX_FILE_BYTES = 8 * 1024 * 1024
SESSION_TTL = 60 * 60
app = FastAPI(title='ResumeFit - Format-first JD tailoring', version='0.1.0')
app.mount('/static', StaticFiles(directory=ROOT / 'static'), name='static')


@app.middleware('http')
async def secure_requests(request: Request, call_next):
    denial = access_response(request)
    if denial is not None:
        return denial
    response = await call_next(request)
    response.headers['Cache-Control'] = 'private, no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


@app.get('/healthz')
def public_health():
    return {'ok': True}



class TailorRequest(BaseModel):
    session_id: str
    jd: str = Field(min_length=50, max_length=30000)


class EditLine(BaseModel):
    id: str
    text: str = Field(min_length=1, max_length=4000)


class ExportRequest(BaseModel):
    session_id: str
    lines: list[EditLine] = Field(default_factory=list, max_length=200)
    output_format: str = 'docx'


class CoverLetterRequest(BaseModel):
    session_id: str
    jd: str = Field(min_length=50, max_length=30000)
    lines: list[EditLine] = Field(default_factory=list, max_length=200)
    company: str = Field(default='', max_length=100)
    role: str = Field(default='', max_length=120)


class CoverLetterExportRequest(BaseModel):
    session_id: str
    letter_text: str = Field(min_length=50, max_length=8000)
    company: str = Field(default='', max_length=100)
    role: str = Field(default='', max_length=120)
    output_format: str = 'docx'



def _require_session(session_id: str) -> Path:
    if len(session_id) != 32 or not all(c in '0123456789abcdef' for c in session_id):
        raise HTTPException(400, 'Invalid session.')
    path = SESSIONS / session_id
    if not (path / 'source.docx').exists():
        raise HTTPException(404, 'Resume session not found or expired.')
    if time.time() - path.stat().st_mtime > SESSION_TTL:
        shutil.rmtree(path, ignore_errors=True)
        raise HTTPException(410, 'Session expired. Upload the resume again.')
    return path


def _clean_old_sessions():
    cutoff = time.time() - SESSION_TTL
    for item in SESSIONS.iterdir():
        if item.is_dir() and item.stat().st_mtime < cutoff:
            shutil.rmtree(item, ignore_errors=True)


def _pdf_for_docx(docx_path: Path, pdf_path: Path) -> Path:
    binary = shutil.which('soffice') or shutil.which('libreoffice')
    if not binary:
        raise HTTPException(503, 'PDF export requires LibreOffice on the server. DOCX export works without it.')
    with tempfile.TemporaryDirectory(prefix='resumefit-office-') as profile:
        command = [
            binary, '-env:UserInstallation=' + Path(profile).as_uri(),
            '--headless', '--convert-to', 'pdf', '--outdir', str(pdf_path.parent), str(docx_path),
        ]
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=75)
        except subprocess.TimeoutExpired:
            raise HTTPException(504, 'PDF conversion took too long.')
        made = pdf_path.parent / f'{docx_path.stem}.pdf'
        if result.returncode or not made.exists():
            raise HTTPException(500, 'PDF conversion failed: ' + (result.stderr or result.stdout or '')[:250])
        if made != pdf_path:
            made.replace(pdf_path)
    return pdf_path


def _source_data(path: Path) -> dict:
    return json.loads((path / 'data.json').read_text(encoding='utf-8'))


@app.get('/', response_class=HTMLResponse)
def index():
    return (ROOT / 'static' / 'index.html').read_text(encoding='utf-8')


@app.get('/api/health')
def health():
    return {'ready': True, 'ai_enabled': active_provider() != 'local',
            'ai_provider': active_provider(),
            'pdf_enabled': bool(shutil.which('soffice') or shutil.which('libreoffice'))}


@app.post('/api/analyze')
async def analyze(file: UploadFile = File(...)):
    filename = file.filename or ''
    if Path(filename).suffix.lower() != '.docx':
        raise HTTPException(400, 'For same-format editing, upload the original .docx. PDF-only files cannot be reliably rewritten with identical formatting.')
    raw = await file.read(MAX_FILE_BYTES + 1)
    if len(raw) > MAX_FILE_BYTES:
        raise HTTPException(413, 'File exceeds the 8 MB limit.')
    try:
        validate_docx(raw)
    except ValueError as err:
        raise HTTPException(400, str(err)) from err
    _clean_old_sessions()
    uid = uuid4().hex
    session = SESSIONS / uid
    session.mkdir(mode=0o700)
    (session / 'source.docx').write_bytes(raw)
    try:
        doc = Document(str(session / 'source.docx'))
        candidates = find_candidates(doc)
        if not candidates:
            raise ValueError('No summary, skills or editable bullet paragraphs were identified. The document may be scanned or use unusual formatting.')
        body_text = '\n'.join(''.join(t.text or '' for t in p.xpath('.//w:t')) for p in doc.element.body.xpath('.//w:p'))
        data = {'original_filename': filename, 'candidates': serialize_candidates(candidates),
                'full_resume_text': body_text}
        (session / 'data.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    except Exception as exc:
        shutil.rmtree(session, ignore_errors=True)
        if isinstance(exc, ValueError):
            raise HTTPException(422, str(exc)) from exc
        raise HTTPException(422, f'Could not read this Word document: {exc}') from exc
    return {
        'session_id': uid, 'filename': filename, 'candidates': serialize_candidates(candidates),
        'ai_enabled': active_provider() != 'local', 'ai_provider': active_provider(),
        'pdf_enabled': bool(shutil.which('soffice') or shutil.which('libreoffice')),
    }


@app.post('/api/tailor')
def tailor(req: TailorRequest):
    path = _require_session(req.session_id)
    data = _source_data(path)
    candidates = [Candidate(**item) for item in data['candidates']]
    try:
        suggestions, mode, warnings = suggest(candidates, req.jd, data['full_resume_text'])
    except Exception as exc:
        from openai import APIStatusError, AuthenticationError, RateLimitError, APIConnectionError, APITimeoutError
        provider = active_provider()
        status = getattr(exc, 'status_code', None)
        # Never return or log raw upstream messages: a provider might include
        # candidate text or request headers in an exception description.
        body = getattr(exc, 'body', None)
        code = body.get('code') if isinstance(body, dict) else None
        if not isinstance(code, str) and isinstance(body, dict) and isinstance(body.get('error'), dict):
            code = body['error'].get('code')
        safe_code = re.sub(r'[^A-Za-z0-9_-]', '', code or '')[:50] if isinstance(code, str) else ''
        logger.warning('AI failure provider=%s status=%s code=%s error_type=%s',
                       provider, status, safe_code, type(exc).__name__)
        if isinstance(exc, AuthenticationError):
            raise HTTPException(502, f'{provider.title()} API key is invalid. Check GROQ_API_KEY in .env and restart the server.'
                                if provider == 'groq' else 'OpenAI API key is invalid. Check OPENAI_API_KEY in .env and restart.') from exc
        if isinstance(exc, RateLimitError):
            raise HTTPException(429, f'{provider.title()} rate limit reached. On Groq free tier, large resumes and repeated requests can exceed the 8K-token/minute limit. Try again after the limit resets.') from exc
        if isinstance(exc, (APIConnectionError, APITimeoutError)):
            raise HTTPException(503, f'Cannot reach {provider.title()} right now. Check internet connectivity and retry.') from exc
        if isinstance(exc, APIStatusError):
            if status == 413:
                raise HTTPException(413, 'AI request was too large for this provider. Try a shorter job description.') from exc
            if status in (400, 404):
                if safe_code in ('model_decommissioned', 'model_not_found', 'model_not_available') or status == 404:
                    raise HTTPException(502, f'{provider.title()} model not available. Set GROQ_MODEL=openai/gpt-oss-20b in .env and restart.') from exc
                raise HTTPException(502, f'{provider.title()} rejected the request (HTTP {status}' +
                                    (f', error: {safe_code}' if safe_code else '') + '). Try a shorter job description; verify the model in .env.') from exc
            raise HTTPException(502, f'{provider.title()} service returned HTTP {status or "error"}. Retry later.') from exc
        if isinstance(exc, (ValueError, json.JSONDecodeError)):
            # Only approved, developer-defined messages are returned; otherwise
            # avoid echoing any raw model output.
            if str(exc) in ('AI response reached its output limit. Try a shorter job description or a shorter resume.',
                            'AI returned invalid JSON. Try Generate Suggestions again.',
                            'AI returned an unexpected response.'):
                raise HTTPException(502, str(exc)) from exc
        raise HTTPException(502, f'{provider.title()} tailoring failed. Check the terminal for the HTTP status or error type (no API key needed).') from exc
    return {'suggestions': suggestions, 'mode': mode, 'warnings': warnings,
            'focus': focus_requirements(req.jd, limit=3)}




def _cover_resume_text(session: Path, lines: list[EditLine]) -> str:
    data = _source_data(session)
    selections = {}
    for item in lines:
        if item.id in selections:
            raise HTTPException(400, f'Duplicate edited line: {item.id}')
        selections[item.id] = item.text
    docx_path = session / 'cover_evidence.docx'
    try:
        edit_docx(session / 'source.docx', docx_path, selections,
                  [Candidate(**item) for item in data['candidates']])
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    doc = Document(docx_path)
    return '\n'.join(''.join(node.text or '' for node in paragraph.xpath('.//w:t'))
                     for paragraph in doc.element.body.xpath('.//w:p'))


@app.post('/api/cover-letter')
def cover_letter(req: CoverLetterRequest):
    session = _require_session(req.session_id)
    evidence = _cover_resume_text(session, req.lines)
    try:
        letter = generate_cover_letter(evidence, req.jd, req.company, req.role)
    except Exception as exc:
        # Never return raw SDK exceptions (they can contain confidential resume text).
        from openai import AuthenticationError, RateLimitError, APIStatusError, APIConnectionError, APITimeoutError
        if isinstance(exc, AuthenticationError):
            raise HTTPException(502, 'AI provider rejected the API key. Check the Groq key in Render Environment.') from exc
        if isinstance(exc, RateLimitError):
            raise HTTPException(429, 'Groq rate limit reached. Please wait for the free-tier limit to reset.') from exc
        if isinstance(exc, (APITimeoutError, APIConnectionError)):
            raise HTTPException(503, 'Cannot reach the AI provider. Please try again.') from exc
        if isinstance(exc, APIStatusError):
            raise HTTPException(502, 'Cover letter request was rejected by the AI provider (HTTP %d).' % exc.status_code) from exc
        if isinstance(exc, ValueError):
            raise HTTPException(422, str(exc)) from exc
        logger.warning('Cover letter generation failed: %s', type(exc).__name__)
        raise HTTPException(502, 'Cover letter generation failed. Please try again.') from exc
    return {'letter_text': letter, 'provider': active_provider()}


@app.post('/api/cover-letter/export')
def export_cover_letter(req: CoverLetterExportRequest):
    session = _require_session(req.session_id)
    if req.output_format not in ('docx', 'pdf'):
        raise HTTPException(400, 'Choose DOCX or PDF output.')
    evidence = _source_data(session)['full_resume_text']
    docx_path = session / 'matching_cover_letter.docx'
    try:
        make_cover_docx(docx_path, req.letter_text, evidence, req.company, req.role)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    safe_company = re.sub(r'[^a-zA-Z0-9_-]+', '_', req.company.strip()).strip('_')[:40] or 'Job'
    filename = safe_company + '_Cover_Letter.' + req.output_format
    if req.output_format == 'docx':
        return FileResponse(docx_path, filename=filename,
                            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    pdf_path = _pdf_for_docx(docx_path, session / 'matching_cover_letter.pdf')
    return FileResponse(pdf_path, filename=filename, media_type='application/pdf')


@app.post('/api/export')
def export(req: ExportRequest):
    path = _require_session(req.session_id)
    if req.output_format not in ('docx', 'pdf'):
        raise HTTPException(400, 'Choose DOCX or PDF output.')
    data = _source_data(path)
    selections = {}
    for line in req.lines:
        if line.id in selections:
            raise HTTPException(400, f'Duplicate line: {line.id}')
        selections[line.id] = line.text
    output_docx = path / 'tailored.docx'
    try:
        edit_docx(path / 'source.docx', output_docx, selections,
                  [Candidate(**item) for item in data['candidates']])
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    original_stem = Path(data['original_filename']).stem[:65]
    name = f'{original_stem}_Tailored'
    if req.output_format == 'docx':
        return FileResponse(output_docx, filename=name + '.docx',
                            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    pdf_path = _pdf_for_docx(output_docx, path / 'tailored.pdf')
    return FileResponse(pdf_path, filename=name + '.pdf', media_type='application/pdf')


@app.post('/api/preview-tailored')
def preview_tailored(req: ExportRequest):
    path = _require_session(req.session_id)
    data = _source_data(path)
    selections = {line.id: line.text for line in req.lines}
    if len(selections) != len(req.lines):
        raise HTTPException(400, 'Duplicate line identifiers.')
    document_path = path / 'preview_tailored.docx'
    try:
        edit_docx(path / 'source.docx', document_path, selections,
                  [Candidate(**item) for item in data['candidates']])
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    pdf = _pdf_for_docx(document_path, path / 'preview_tailored.pdf')
    return FileResponse(pdf, media_type='application/pdf',
                        headers={'Cache-Control': 'private, no-store'})


@app.get('/api/preview/{session_id}')
def preview(session_id: str):
    path = _require_session(session_id)
    pdf = path / 'source.pdf'
    if not pdf.exists():
        _pdf_for_docx(path / 'source.docx', pdf)
    return FileResponse(pdf, media_type='application/pdf', headers={'Cache-Control': 'private, no-store'})


@app.delete('/api/session/{session_id}')
def remove_session(session_id: str):
    path = _require_session(session_id)
    shutil.rmtree(path, ignore_errors=True)
    return {'deleted': True}
