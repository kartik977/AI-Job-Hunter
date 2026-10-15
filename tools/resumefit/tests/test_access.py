import base64
from types import SimpleNamespace
from app.access import access_response

def request(path='/', auth=''):
    return SimpleNamespace(url=SimpleNamespace(path=path), headers={'authorization': auth})

def test_public_health_no_auth(monkeypatch):
    monkeypatch.setenv('RESUMEFIT_REQUIRE_AUTH', '1')
    monkeypatch.delenv('RESUMEFIT_ACCESS_PASSWORD', raising=False)
    assert access_response(request('/healthz')) is None

def test_public_deploy_fails_closed_without_password(monkeypatch):
    monkeypatch.setenv('RESUMEFIT_REQUIRE_AUTH', '1')
    monkeypatch.delenv('RESUMEFIT_ACCESS_PASSWORD', raising=False)
    assert access_response(request('/')).status_code == 503

def test_basic_auth_protects_resume_and_static_files(monkeypatch):
    monkeypatch.setenv('RESUMEFIT_REQUIRE_AUTH', '1')
    monkeypatch.setenv('RESUMEFIT_ACCESS_PASSWORD', 'test-very-secret-passphrase')
    assert access_response(request('/api/tailor')).status_code == 401
    assert access_response(request('/static/app.js')).status_code == 401
    token = base64.b64encode(b'resumefit:test-very-secret-passphrase').decode()
    assert access_response(request('/api/tailor', 'Basic '+token)) is None
    assert access_response(request('/api/export', 'Basic '+token)) is None
    assert access_response(request('/api/export', 'Basic '+base64.b64encode(b'resumefit:wrong').decode())).status_code == 401

def test_local_default_remains_passwordless(monkeypatch):
    monkeypatch.delenv('RESUMEFIT_REQUIRE_AUTH', raising=False)
    monkeypatch.delenv('RESUMEFIT_ACCESS_PASSWORD', raising=False)
    assert access_response(request('/')) is None
