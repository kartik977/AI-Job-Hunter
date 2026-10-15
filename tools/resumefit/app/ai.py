"""AI-assisted, truth-constrained resumes. External API only when configured."""
from __future__ import annotations

import json
import os
from typing import Any

from .engine import Candidate, heuristic_skill_sort, new_digits

INSTRUCTIONS = """You tailor resumes for a specific job description. Rewrite ONLY the editable
Summary, Skills, and bullet text explicitly supplied to you. These are real people's
career documents, so factual fidelity is mandatory.

STRICT RULES:
- Never fabricate employers, roles, degrees, skills, tools, certificates, dates, metrics,
  promotions, tenure, awards or accomplishments. A skill must already exist somewhere
  in the original resume content to be mentioned as a skill.
- Preserve all numerical facts; do not invent, delete, or change existing metrics.
- Emphasize overlap with the JD through rewording and rearranging true existing facts.
- Keep the meaning of every bullet, and match its original approximate length (+/-15%).
- For Skills, reorder relevant existing terms, never add unmentioned technologies.
- Do not add/alter headings, prefixes, names, companies or dates.
- No markdown bullets or extra labels in returned strings.
- Return a compact JSON object: {"changes": [{"id":"p12", "text":"replacement..."}]}
  Include one entry per supplied editable line, even if unchanged.
- Output only JSON, no explanation.
"""


def _usable_key(value: str | None) -> str:
    """A copied .env example must not accidentally enable a paid provider."""
    key = (value or '').strip()
    return '' if not key or key.lower().startswith(('your_', 'replace_', 'paste_')) else key


def active_provider() -> str:
    """Prefer the Groq free tier when available; OpenAI is optional."""
    if _usable_key(os.getenv('GROQ_API_KEY')):
        return 'groq'
    if _usable_key(os.getenv('OPENAI_API_KEY')):
        return 'openai'
    return 'local'


def suggest(candidates: list[Candidate], job_description: str, full_resume_text: str) -> tuple[dict[str, str], str, list[str]]:
    """Return suggestions, provider name, and warnings. Never invent facts."""
    provider = active_provider()
    if provider == 'local':
        return (
            heuristic_skill_sort(candidates, job_description),
            'local',
            ['AI rewriting is not enabled. Add GROQ_API_KEY (free tier) to .env, '
             'or optionally OPENAI_API_KEY. In local mode only existing skills '
             'can be reordered; manual edits and export still work.'],
        )

    # Groq offers an OpenAI-compatible chat completions endpoint, so no second SDK is needed.
    from openai import OpenAI
    if provider == 'groq':
        client = OpenAI(api_key=_usable_key(os.getenv('GROQ_API_KEY')),
                        base_url='https://api.groq.com/openai/v1',
                        timeout=80.0, max_retries=1)
        model = os.getenv('GROQ_MODEL') or 'openai/gpt-oss-20b'
    else:
        client = OpenAI(api_key=_usable_key(os.getenv('OPENAI_API_KEY')),
                        timeout=80.0, max_retries=1)
        model = os.getenv('OPENAI_MODEL') or 'gpt-4o-mini'

    payload: dict[str, Any] = {
        'job_description': job_description[:22000],
        'full_original_resume_for_factual_reference': full_resume_text[:25000],
        'editable_lines': [
            {'id': c.id, 'type': c.category, 'text': c.editable_original}
            for c in candidates[:110]
        ],
    }
    response = client.chat.completions.create(
        model=model,
        temperature=0.15,
        response_format={'type': 'json_object'},
        messages=[
            {'role': 'system', 'content': INSTRUCTIONS},
            {'role': 'user', 'content': json.dumps(payload, ensure_ascii=False)},
        ],
    )
    data = json.loads(response.choices[0].message.content or '{}')
    entries = data.get('changes', [])
    if not isinstance(entries, list):
        raise ValueError('AI returned an unexpected response.')
    valid = {c.id: c for c in candidates}
    changes: dict[str, str] = {}
    warnings: list[str] = []
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get('id'), str) or not isinstance(entry.get('text'), str):
            continue
        ident = entry['id']
        if ident not in valid:
            continue
        original = valid[ident].editable_original
        revised = entry['text'].strip()
        if not revised or revised == original:
            continue
        introduced = new_digits(original, revised)
        removed = new_digits(revised, original)
        if introduced or removed:
            warnings.append(f'{ident} was left unchanged because the suggestion changed numerical claims.')
            continue
        if len(revised) > len(original) * 1.3 + 12:
            warnings.append(f'{ident}: suggestion is over 30% longer; review for line wrapping.')
        changes[ident] = revised
    return changes, provider, warnings
