"""Grounded, no-extra-model-call explanations of selected resume wording changes.

A JD connection is a textual association, not a claim about an employer's ATS
or proof that an applicant genuinely has that skill. Human review stays required.
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher

from .engine import Candidate
from .jd import focus_requirements, relevance

TRIVIAL = frozenset(
    'the a an and in on at to from with for of by is was are were as '
    'built build developed develop created create designed design worked '
    'implemented implement improved improve using use used'.split()
)


def _changed_words(before: str, after: str) -> tuple[str, str]:
    old = re.findall(r'\S+', before)
    new = re.findall(r'\S+', after)
    matcher = SequenceMatcher(None, [x.casefold() for x in old],
                              [x.casefold() for x in new], autojunk=False)
    additions, removals = [], []
    for op, a, b, c, d in matcher.get_opcodes():
        if op == 'equal':
            continue
        if op in ('insert', 'replace'):
            chunk = ' '.join(new[c:d]).strip()
            if chunk and any(w.lower().strip('.,:;') not in TRIVIAL for w in new[c:d]):
                additions.append(chunk)
        if op in ('delete', 'replace'):
            chunk = ' '.join(old[a:b]).strip()
            if chunk:
                removals.append(chunk)
    return ' · '.join(additions)[:160], ' · '.join(removals)[:160]


def describe_changes(candidates: list[Candidate], suggestions: dict[str, str],
                     job_description: str) -> dict[str, dict[str, str]]:
    priorities = focus_requirements(job_description, limit=10)
    authorized = {candidate.id: candidate for candidate in candidates}
    details: dict[str, dict[str, str]] = {}
    for id_, proposed in suggestions.items():
        original = authorized.get(id_)
        if original is None or original.category not in ('summary', 'skills', 'bullet'):
            continue
        before, after = original.editable_original, proposed.strip()
        if not after or after == before:
            continue
        addition, removal = _changed_words(before, after)
        requirement = max(priorities,
                          key=lambda line: (relevance(after, [line]),
                                            relevance(before, [line])),
                          default='')
        # A named JD requirement is shown only if there is relevant overlap.
        if requirement and not (relevance(after, [requirement]) or relevance(before, [requirement])):
            requirement = ''
        if original.category == 'skills':
            what = 'Reprioritized existing skills; no skills were added or removed.'
            why = ('Moves qualifications mentioned in the JD closer to the start of '
                   'the existing skills list.')
        else:
            parts = []
            if addition:
                parts.append('Emphasized: ' + addition)
            if removal:
                parts.append('De-emphasized: ' + removal)
            what = ' | '.join(parts) or 'Reframed the wording and emphasis.'
            why = (
                'Connects the documented experience to this JD requirement; '
                'verify that the new wording remains accurate.'
                if requirement else
                'Clarifies the existing experience. Verify that the new wording '
                'is relevant to this JD and remains accurate.'
            )
        details[id_] = {
            'category': original.category,
            'original': before,
            'revised': after,
            'what_changed': what,
            'jd_requirement': requirement[:240],
            'why': why,
        }
    return details
