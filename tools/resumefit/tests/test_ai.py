"""Groq/OpenAI selection must be testable without any network or real API key."""
from types import SimpleNamespace
import sys

from app import ai
from app.engine import Candidate


def _sample():
    return [Candidate(id='p7', index=7, category='bullet',
                      original='Built REST APIs using Java.',
                      editable_original='Built REST APIs using Java.',
                      locked_prefix='', section='experience', style='List Bullet')]


def test_no_key_is_local(monkeypatch):
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    assert ai.active_provider() == 'local'
    assert ai.suggest(_sample(), 'Java Spring Boot software engineer ' * 4, 'Java developer')[1] == 'local'


def test_placeholder_key_does_not_activate_provider(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'your_api_key_here')
    monkeypatch.setenv('GROQ_API_KEY', 'your_groq_api_key_here')
    assert ai.active_provider() == 'local'


def test_groq_has_priority_and_uses_compatible_api(monkeypatch):
    observed = {}
    class FakeCompletion:
        def create(self, **kw):
            observed.update(kw)
            return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(
                content='{"changes":[{"id":"p7","text":"Developed REST APIs using Java."}]}'
            ))])
    class FakeOpenAI:
        def __init__(self, **kw):
            observed['client'] = kw
            self.chat = SimpleNamespace(completions=FakeCompletion())
    monkeypatch.setenv('OPENAI_API_KEY', 'sk-paid-test')
    monkeypatch.setenv('GROQ_API_KEY', 'gsk-free-test')
    monkeypatch.delenv('GROQ_MODEL', raising=False)
    monkeypatch.setitem(sys.modules, 'openai', SimpleNamespace(OpenAI=FakeOpenAI))
    suggestions, mode, warnings = ai.suggest(_sample(), 'Java developer who builds REST APIs ' * 4, 'Built REST APIs using Java.')
    assert mode == 'groq'
    assert not warnings
    assert suggestions == {'p7': 'Developed REST APIs using Java.'}
    assert observed['client']['base_url'] == 'https://api.groq.com/openai/v1'
    assert observed['model'] == 'openai/gpt-oss-20b'
    assert observed['response_format'] == {'type': 'json_object'}


def test_openai_still_available_when_groq_missing(monkeypatch):
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
    monkeypatch.setenv('OPENAI_API_KEY', 'sk-paid-test')
    assert ai.active_provider() == 'openai'
