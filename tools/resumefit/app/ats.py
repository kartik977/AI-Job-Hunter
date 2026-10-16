"""Transparent, deterministic JD keyword coverage estimate — NOT a real ATS score.

No AI calls or invented facts. Uses only supplied job requirements and the actual
resume text (or the text resulting from user-approved edits).
"""
from __future__ import annotations

import re
from .jd import focus_requirements

# Keep technology/domain terms, exclude low-information language used in most JDs.
STOP = frozenset("""
a an and are as at be been by can candidates collaborate collaborating
demonstrated demonstrated develop developed developing design designed designing
build builds building do excellent exceptional experience experienced familiar
for from good have in including into is it its job looking must need needs
of on or our own required responsible role should strong such support supporting
team teams the their them these this those through to using use used with will
work working you your ability abilities plus preferably preferred help helping
across multiple various ensure ensuring deliver delivering provide providing
solutions success years year relevant environment environments knowledge understand
understanding technical engineering engineer engineers software highly ideal
""".split())

ALIASES = {
    'apis': 'api', 'api': 'api', 'restful': 'rest',
    'services': 'service', 'microservices': 'microservice',
    'pipelines': 'pipeline', 'workflows': 'workflow', 'datasets': 'dataset',
    'databases': 'database', 'systems': 'system', 'applications': 'application',
    'integrations': 'integration', 'platforms': 'platform', 'technologies': 'technology',
    'analytics': 'analytic', 'analytical': 'analytic',
    'automated': 'automation', 'automating': 'automation', 'automate': 'automation',
    'ai-powered': 'ai', 'artificial': 'ai',
    'financial': 'finance', 'fintech': 'finance',
    'processing': 'process', 'processed': 'process',
    'ingesting': 'ingestion', 'ingested': 'ingestion',
    'scalable': 'scalability', 'scaling': 'scalability',
    'reliable': 'reliability',
    'architecting': 'architecture', 'architectural': 'architecture',
    'developing': 'development',
    'engineered': 'engineering',
}


def _tokens(text: str) -> set[str]:
    terms = re.findall(r'(?<!\w)[a-zA-Z][a-zA-Z0-9+.#-]*', text.lower())
    result = set()
    for term in terms:
        term = term.strip('.-')
        if not term or len(term) < 2 or term in STOP:
            continue
        normal = ALIASES.get(term, term)
        if normal not in STOP:
            result.add(normal)
    return result


def _requirements(jd: str, limit: int = 10) -> list[str]:
    requirements = focus_requirements(jd, limit=limit)
    if len(requirements) < 2:
        # Compact/single-paragraph JDs still receive a useful, limited analysis.
        fragments = re.split(r'(?<=[.!?])\s+|[;\n]+', jd)
        choices = [f.strip(' \t-•*') for f in fragments if len(f.strip()) >= 25]
        requirements = (requirements + choices)[:limit]
    unique = []
    fingerprints = set()
    for item in requirements:
        item = item.strip()
        keywords = _tokens(item)
        if not keywords or len(item) < 22:
            continue
        identity = ' '.join(sorted(keywords))
        if identity in fingerprints:
            continue
        unique.append(item[:240])
        fingerprints.add(identity)
        if len(unique) >= limit:
            break
    return unique


def _evidence(requirement: str, resume_lines: list[str]) -> dict:
    need = _tokens(requirement)
    if not need:
        return {'status': 'missing', 'coverage': 0.0, 'evidence': ''}
    chosen = ''
    best = set()
    for line in resume_lines:
        found = _tokens(line) & need
        if len(found) > len(best) or (len(found) == len(best) and found and len(line) < len(chosen)):
            best, chosen = found, line
    fraction = len(best) / len(need)
    threshold = 1 if len(need) <= 2 else 2
    if fraction >= 0.7 and len(best) >= threshold:
        status = 'matched'
    elif fraction >= 0.25:
        status = 'partial'
    else:
        status = 'missing'
    return {'status': status, 'coverage': round(fraction, 4),
            'evidence': chosen[:175] if best else ''}


def estimate(jd: str, original_resume: str, tailored_resume: str | None = None) -> dict:
    """Estimate before/after coverage from resume text, not claimed ATS predictions."""
    priorities = _requirements(jd)
    if not priorities:
        return {'original_score': None, 'tailored_score': None,
                'requirements': [], 'evaluated': 0}
    original_lines = [line.strip() for line in original_resume.splitlines() if line.strip()]
    tailored_lines = ([line.strip() for line in tailored_resume.splitlines() if line.strip()]
                      if tailored_resume is not None else original_lines)
    rows = []
    for requirement in priorities:
        before = _evidence(requirement, original_lines)
        after = _evidence(requirement, tailored_lines)
        rows.append({'requirement': requirement,
                     'original_status': before['status'], 'tailored_status': after['status'],
                     'original_coverage': before['coverage'], 'tailored_coverage': after['coverage'],
                     'evidence': after['evidence']})
    return {
        'original_score': round(sum(row['original_coverage'] for row in rows) * 100 / len(rows)),
        'tailored_score': round(sum(row['tailored_coverage'] for row in rows) * 100 / len(rows)),
        'requirements': rows, 'evaluated': len(rows),
    }
