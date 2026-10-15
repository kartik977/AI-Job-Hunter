"""Extract job-specific priorities from real JD sections without an extra model call."""
from __future__ import annotations
import re

HEADINGS = (
    ("what you'll do", 5), ('what you will do', 5), ('responsibilities', 5),
    ('the role', 3), ('example problems', 4), ('required', 4),
    ("what we're looking for", 4), ('what we are looking for', 4),
    ('requirements', 4), ('qualifications', 4), ('nice to have', 2), ('preferred', 2),
)

def focus_requirements(jd: str, limit: int = 10) -> list[str]:
    """Prefer actual duties and requirements, not marketing copy or company numbers."""
    entries: list[tuple[int, int, str]] = []
    level = 0
    for idx, raw in enumerate(jd.splitlines()):
        line = re.sub(r'^\s{0,3}(?:#{1,6}\s*|[-*•]\s+|\d+[.)]\s*)', '', raw).strip().strip('*').strip()
        if not line:
            continue
        heading = line.lower().strip(':')
        matched = next((weight for phrase, weight in HEADINGS if heading == phrase), None)
        if matched is not None:
            level = matched
            continue
        if re.fullmatch(r'#{0,2}[A-Za-z /&+-]{3,40}', line) and not any(p in line.lower() for p in ('build','develop','design','experience','engineer')):
            if line.isupper() or raw.lstrip().startswith('##'):
                level = 0
                continue
        if len(line) < 25 or len(line) > 380 or line.startswith('http'):
            continue
        if level == 0 and len(line) > 180:
            continue
        if re.search(r'^(location|salary|benefits|equal opportunity|apply here|about us)\s*:', line, re.I):
            continue
        entries.append((level or 1, idx, line[:240]))
    if any(score > 1 for score, _, _ in entries):
        entries = [item for item in entries if item[0] > 1]
    entries.sort(key=lambda item: (-item[0], item[1]))
    output, seen = [], set()
    for _, _, line in entries:
        canon = re.sub(r'\W+', ' ', line.lower())
        if canon not in seen:
            output.append(line)
            seen.add(canon)
        if len(output) >= limit:
            break
    return output

STOP = set('the and for with from into over that this their your will have when build building work using work used able strong large scale years role team teams ability across systems software engineer experience product solutions through platform services technical requirements development help design designing develop designed core working projects to of a an in on by or it as is be at are we our you'.split())

def relevance(text: str, focus: list[str]) -> int:
    """Count specific overlapping job terms and related existing domain evidence."""
    target = ' '.join(focus).lower()
    source = text.lower()
    words = set(re.findall(r'[a-z][a-z+#.0-9-]{2,}', source)) - STOP
    target_words = set(re.findall(r'[a-z][a-z+#.0-9-]{2,}', target)) - STOP
    score = len(words & target_words) * 2
    domains = [
        (('finance','financial','cash','payments','banking','invoice','deductions'), ('financial','banking','payment','debit','credit','retail','transaction')),
        (('data','pipelines','ingestion','processing','analytics','forecasting'), ('data','pipeline','analysis','analytical','processing','cassandra','sql')),
        (('automation','automate','workflows','ai-powered','ai/ml'), ('automated','automation','workflow','ai','claude','openai')),
        (('backend','apis','infrastructure','performance','reliability'), ('backend','api','service','latency','reliability','cloud')),
    ]
    for jd_terms, resume_terms in domains:
        if any(w in target for w in jd_terms) and any(w in source for w in resume_terms):
            score += 3
    return score
