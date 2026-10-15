from app.jd import focus_requirements, relevance
from app.ai import _compact_payload
from app.engine import Candidate

def candidate(id, index, category, text):
    return Candidate(id=id, index=index, category=category, original=text,
                     editable_original=text, locked_prefix='', section='experience', style='Normal')

JD = """About the job
We are building a great platform for brands.
The Role
Build scalable applications for users.

What You'll Do
- Develop systems for ingesting financial and operational data from multiple sources
- Build backend services and APIs that power analytics and forecasting
- Implement AI-powered workflows for document processing and financial data extraction
Required
- Strong backend engineering skills and systems design experience
- Comfort building production systems that handle large datasets or complex workflows
Nice to Have
- Experience with data pipelines or analytics infrastructure
"""

def test_requirements_skip_promo_and_prioritize_responsibilities():
    lines = focus_requirements(JD)
    assert any('ingesting financial' in l for l in lines)
    assert any('AI-powered' in l for l in lines)
    assert not any('great platform for brands' in l for l in lines)
    assert len(lines) <= 10

def test_financial_payments_evidence_is_more_relevant_than_unrelated_bullet():
    focus = focus_requirements(JD)
    payment = 'Built reliable banking payment-processing REST APIs at scale with Cassandra.'
    gardening = 'Built mobile GPS features for tracking hiking distances.'
    assert relevance(payment, focus) > relevance(gardening, focus)

def test_payload_selects_relevant_bullets_after_summary():
    items = [candidate('p1', 1, 'summary', 'Backend engineer on payment systems.')]
    for i in range(15):
        items.append(candidate(f'p{i+2}', i+2, 'bullet', 'Built design assets for an internal dashboard project.'+'x'*320))
    items.append(candidate('p99', 99, 'bullet', 'Developed financial payment APIs and data analytics services.'))
    payload, warn = _compact_payload(items, JD, 'Resume body', 'groq')
    ids = [v['id'] for v in payload['editable_lines']]
    assert ids[0] == 'p1'
    assert 'p99' in ids
    assert payload['priority_requirements']
    assert payload['job_description'][:40] == JD[:40]
