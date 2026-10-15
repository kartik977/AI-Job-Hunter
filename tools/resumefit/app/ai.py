"""AI-assisted, truth-constrained resumes. External API only when configured."""
from __future__ import annotations

import json
import os
import re
from collections import Counter
from difflib import SequenceMatcher
from typing import Any

from .engine import Candidate, new_digits

INSTRUCTIONS = """You are a careful resume editor helping a candidate fit a specific job.
Only rewrite the provided SUMMARY and EXPERIENCE/PROJECT BULLET entries.
You are editing their existing document, not making a new resume.

GOAL: Make real, substantive job-description-specific improvements, not cosmetic swaps.
- SUMMARY: Rewrite around the role's main responsibilities and relevant, ALREADY EVIDENCED
  experience from the candidate's resume. Lead with their relevant focus, actual tools,
  and strengths. Do NOT invent years of experience, metrics, employment or skills.
- BULLETS: Reframe documented tasks and outcomes to emphasize the parts relevant to the
  job description. Prefer clear action + specific actual technology/task + real result.
  Use JD keywords naturally ONLY when those facts are supported by that bullet and/or
  clear surrounding experience. Do not claim a different project, role, skill, or outcome.
- Avoid mere word swaps (Built -> Developed), reordered words, added buzzwords, or
  essentially identical sentences. If there isn't an honest, material improvement,
  OMIT that line from your response rather than pretending to improve it.
- Keep numerical claims, names, dates, metrics, employment and technical facts EXACT.
- Aim for similar length to the original (within ~15%) to protect Word line wrapping.
- Leave skills lists untouched; they are prioritized separately without deleting skills.
- Rewrite each individual bullet as one bullet, not multiple bullets or a paragraph.
- No markdown bullets, section headings, quotes, or explanation in replacement text.
- Return a compact JSON object exactly like:
  {"changes": [{"id":"p12", "text":"a clearly improved, truthful replacement"}]}
  Return only materially improved lines, otherwise {"changes": []}.
- Return valid JSON only.
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



def _priority_skills(items: list[Candidate], job_description: str) -> dict[str, str]:
    """Move confirmed JD-matching skills forward, without deleting/rewording ANY item.

    Skip already-good skill lists: they should not count as AI rewrites just
    because two adjacent entries switched places. Supports | and comma lists.
    """
    jd = job_description.casefold()
    changes: dict[str, str] = {}
    for item in items:
        if item.category != 'skills':
            continue
        original = item.editable_original
        delimiter = ' | ' if '|' in original else ', ' if ',' in original else None
        if not delimiter:
            continue
        splitter = '|' if '|' in original else ','
        parts = [part.strip() for part in original.split(splitter)]
        if not 4 <= len(parts) <= 40 or not all(parts):
            continue
        # Keep labels, like 'Languages:' and 'Frameworks & APIs:', untouched.
        label = ''
        label_match = re.match(r'^([^|,;]{2,65}:\s*)(.+)$', parts[0])
        if label_match:
            label = label_match.group(1)
            parts[0] = label_match.group(2).strip()
        if len({part.casefold() for part in parts}) != len(parts):
            continue
        matches = [bool(re.search(r'(?<!\w)' + re.escape(x.casefold()) + r'(?!\w)', jd)) for x in parts]
        window = min(3, len(parts))
        # Only make a change if it genuinely elevates JD-matched skills into the
        # first few positions. Otherwise preserve the original ordering exactly.
        if not any(matches[window:]):
            continue
        sorted_indices = sorted(range(len(parts)), key=lambda i: (not matches[i], i))
        if sum(matches[i] for i in sorted_indices[:window]) <= sum(matches[:window]):
            continue
        new_parts = [parts[i] for i in sorted_indices]
        result = label + delimiter.join(new_parts)
        if result != original:
            changes[item.id] = result
    return changes


def _is_meaningful(original: str, revised: str) -> bool:
    """Reject tiny edits, pure reorderings, and superficial single-word swaps."""
    a = re.findall(r'[\w+#.]+', original.casefold())
    b = re.findall(r'[\w+#.]+', revised.casefold())
    if not a or not b or Counter(a) == Counter(b):
        return False
    if SequenceMatcher(None, ' '.join(a), ' '.join(b)).ratio() >= 0.94:
        return False
    added = list((Counter(b) - Counter(a)).elements())
    removed = list((Counter(a) - Counter(b)).elements())
    # Most single-term substitutions are 'Created' -> 'Developed' rephrasing.
    if len(added) <= 1 and len(removed) <= 1:
        return False
    return True


def _compact_payload(candidates: list[Candidate], job_description: str, full_resume_text: str, provider: str):
    """Send summaries/bullets only. Reserve the Groq budget for meaningful rewrites."""
    eligible = [c for c in candidates if c.category in ('summary', 'bullet')]
    # Prioritize summaries over bullets, then maintain original document order.
    eligible.sort(key=lambda c: (0 if c.category == 'summary' else 1, c.index))
    limit = 6500 if provider == 'groq' else 20000
    used = 0
    lines = []
    for candidate in eligible[:110]:
        record = {'id': candidate.id, 'type': candidate.category, 'text': candidate.editable_original}
        cost = len(json.dumps(record, ensure_ascii=False))
        if used + cost > limit:
            break
        used += cost
        lines.append(record)
    warnings = []
    if len(lines) < len(eligible):
        warnings.append(f'Only {len(lines)} of {len(eligible)} summary/bullet lines fit this AI request. The remaining lines are unchanged and editable.')
    if provider == 'groq' and len(job_description) > 4500:
        warnings.append('The job description was shortened for Groq free-tier limits.')
    return ({
        'job_description': job_description[:4500 if provider == 'groq' else 22000],
        'full_original_resume_for_factual_reference': full_resume_text[:4500 if provider == 'groq' else 25000],
        'editable_lines': lines,
    }, warnings)


def suggest(candidates: list[Candidate], job_description: str, full_resume_text: str) -> tuple[dict[str, str], str, list[str]]:
    """Return suggestions, provider name, and warnings. Never invent facts."""
    provider = active_provider()
    skills = _priority_skills(candidates, job_description)
    if provider == 'local':
        return (
            skills,
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

    payload, warnings = _compact_payload(candidates, job_description, full_resume_text, provider)
    if not payload['editable_lines']:
        warnings.append('No eligible summary or bullet lines found for AI rewriting.')
        return skills, provider, warnings
    request: dict[str, Any] = {
        'model': model,
        'temperature': 0.15,
        'response_format': {'type': 'json_object'},
        'messages': [
            {'role': 'system', 'content': INSTRUCTIONS},
            {'role': 'user', 'content': json.dumps(payload, ensure_ascii=False)},
        ],
    }
    if provider == 'groq':
        request['max_completion_tokens'] = 2200
        if model.startswith('openai/gpt-oss-'):
            request['extra_body'] = {'reasoning_effort': 'low'}
    response = client.chat.completions.create(**request)
    if response.choices[0].finish_reason == 'length':
        raise ValueError('AI response reached its output limit. Try a shorter job description or a shorter resume.')
    try:
        data = json.loads(response.choices[0].message.content or '{}')
    except json.JSONDecodeError as exc:
        raise ValueError('AI returned invalid JSON. Try Generate Suggestions again.') from exc
    entries = data.get('changes', [])
    if not isinstance(entries, list):
        raise ValueError('AI returned an unexpected response.')
    valid = {c.id: c for c in candidates}
    changes: dict[str, str] = dict(skills)
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get('id'), str) or not isinstance(entry.get('text'), str):
            continue
        ident = entry['id']
        if ident not in valid or valid[ident].category == 'skills':
            continue
        original = valid[ident].editable_original
        revised = entry['text'].strip()
        if not revised or revised == original or not _is_meaningful(original, revised):
            continue
        introduced = new_digits(original, revised)
        removed = new_digits(revised, original)
        if introduced or removed:
            warnings.append(f'{ident} was left unchanged because the suggestion changed numerical claims.')
            continue
        if len(revised) > len(original) * 1.3 + 12:
            warnings.append(f'{ident}: suggestion is over 30% longer; review for line wrapping.')
        changes[ident] = revised
    if not any(valid[key].category in ('summary', 'bullet') for key in changes) and not warnings:
        warnings.append('The model found no substantive, safely supported summary/bullet rewrites. Skills may still be prioritized. Review the JD or edit lines manually.')
    return changes, provider, warnings
