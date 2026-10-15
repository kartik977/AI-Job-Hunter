"""Single-owner password gate for a self-hosted ResumeFit instance."""
from __future__ import annotations
import base64
import binascii
import hmac
import os
from fastapi import Request
from fastapi.responses import PlainTextResponse

def access_response(request: Request):
    """Return a denial response or None, without exposing credentials in logs."""
    if request.url.path == '/healthz':
        return None
    secret = os.environ.get('RESUMEFIT_ACCESS_PASSWORD', '')
    required = os.environ.get('RESUMEFIT_REQUIRE_AUTH') == '1'
    if required and not secret:
        return PlainTextResponse('Server access password not configured.', status_code=503)
    if not secret:
        return None  # Local development only; Render requires auth.
    header = request.headers.get('authorization', '')
    if header.startswith('Basic ') and len(header) < 500:
        try:
            data = base64.b64decode(header[6:], validate=True).decode('utf-8')
            username, supplied = data.split(':', 1)
            if hmac.compare_digest(username, 'resumefit') and hmac.compare_digest(supplied, secret):
                return None
        except (ValueError, UnicodeError, binascii.Error):
            pass
    return PlainTextResponse('Authentication required.', status_code=401,
                             headers={'WWW-Authenticate': 'Basic realm="ResumeFit"'})
