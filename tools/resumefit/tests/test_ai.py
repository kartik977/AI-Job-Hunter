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
            return SimpleNamespace(choices=[SimpleNamespace(finish_reason='stop', message=SimpleNamespace(
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
    assert suggestions == {}  # Superficial verb swap must no longer count.
    assert any('no substantive' in w for w in warnings)
    assert observed['client']['base_url'] == 'https://api.groq.com/openai/v1'
    assert observed['model'] == 'openai/gpt-oss-20b'
    assert observed['response_format'] == {'type': 'json_object'}


def test_openai_still_available_when_groq_missing(monkeypatch):
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
    monkeypatch.setenv('OPENAI_API_KEY', 'sk-paid-test')
    assert ai.active_provider() == 'openai'


def test_groq_compacts_large_input_without_losing_mappings(monkeypatch):
    lines = [_sample()[0]] * 80
    payload, warnings = ai._compact_payload(lines, 'Java developer ' * 2000, 'REST APIs built ' * 3000, 'groq')
    assert len(payload['job_description']) <= 4500
    assert len(payload['full_original_resume_for_factual_reference']) <= 4500
    assert len(payload['editable_lines']) == len(lines)
    assert any('shortened' in x for x in warnings)


def test_groq_bounds_many_long_bullets():
    lines = []
    for i in range(70):
        lines.append(Candidate(id=f'p{i}', index=i, category='bullet', original='A' * 450,
                               editable_original='A' * 450, locked_prefix='', section='experience', style='List Bullet'))
    payload, warnings = ai._compact_payload(lines, 'JD ' * 100, 'resume ' * 500, 'groq')
    assert 0 < len(payload['editable_lines']) < len(lines)
    assert any('remaining lines' in x for x in warnings)
    assert all('id' in r for r in payload['editable_lines'])


def _candidate(cat: str, value: str, ident: str = 'p12') -> Candidate:
    return Candidate(id=ident, index=12, category=cat, original=value,
                     editable_original=value, locked_prefix='', section=cat, style='Normal')


def test_cosmetic_rephrases_are_ignored():
    assert not ai._is_meaningful('Built REST APIs using Java.', 'Developed REST APIs using Java.')
    assert not ai._is_meaningful('Python, SQL, Docker', 'Docker, SQL, Python')
    assert ai._is_meaningful('Built REST APIs using Java and Spring Boot.',
        'Engineered Spring Boot REST endpoints in Java, providing reusable backend integrations.')


def test_skills_lists_keep_every_framework_and_label():
    skills = _candidate('skills',
        'Frameworks & APIs: Spring Boot | Node.js | NestJS | Express.js | REST APIs | GraphQL | React.js | Next.js | Flask | Microservices')
    result = ai._priority_skills([skills], 'We need React.js, Next.js, and Spring Boot expertise.')
    revised = result[skills.id]
    assert revised.startswith('Frameworks & APIs: ')
    assert sorted(revised.split(': ', 1)[1].split(' | ')) == sorted(skills.original.split(': ', 1)[1].split(' | '))
    assert 'React.js' in revised and 'Next.js' in revised


def test_skill_list_no_cosmetic_swap_when_top_skills_already_match():
    skills = _candidate('skills','Languages: Java | TypeScript | JavaScript | Python | SQL')
    assert ai._priority_skills([skills], 'Java and TypeScript developer wanted') == {}


def test_groq_sends_summary_and_bullets_not_skill_lists():
    skills = _candidate('skills','Languages: Python | Java | SQL | Node.js')
    summary = _candidate('summary','Software engineer working with Java and Spring Boot on backend platforms.', 'p3')
    bullet = _candidate('bullet','Built REST APIs in Java and Spring Boot for internal applications.', 'p9')
    payload, _ = ai._compact_payload([skills, bullet, summary], 'Backend Java position', 'Experience', 'groq')
    assert [x['id'] for x in payload['editable_lines']] == ['p3', 'p9']


def test_model_cannot_delete_skills_or_change_numbers(monkeypatch):
    from types import SimpleNamespace
    import sys
    skills = _candidate('skills','Frameworks: Spring Boot | Java | Python | React.js | SQL','p2')
    bullet = _candidate('bullet', 'Improved release process with Docker, cutting deployment time by 25%.', 'p3')
    class FakeCompletion:
        def create(self, **kw):
            return SimpleNamespace(choices=[SimpleNamespace(finish_reason='stop', message=SimpleNamespace(
                content='{"changes":['
                        '{"id":"p2","text":"Frameworks: Spring Boot | Java"},'
                        '{"id":"p3","text":"Automated releases using Docker and saved 50% of deployment time."}'
                        ']}'
            ))])
    class FakeOpenAI:
        def __init__(self, **kw):
            self.chat = SimpleNamespace(completions=FakeCompletion())
    monkeypatch.setenv('GROQ_API_KEY','gsk-test-only')
    monkeypatch.delenv('OPENAI_API_KEY',raising=False)
    monkeypatch.setitem(sys.modules,'openai',SimpleNamespace(OpenAI=FakeOpenAI))
    result, mode, warnings=ai.suggest([skills, bullet], 'Java API engineer in Spring Boot and Docker ' * 4,
                                     skills.original+'\n'+bullet.original)
    assert mode == 'groq'
    assert skills.id not in result  # No removal of Python, React, or SQL allowed.
    assert bullet.id not in result  # Changed numeric claim rejected.
    assert any('numerical claims' in w for w in warnings)
