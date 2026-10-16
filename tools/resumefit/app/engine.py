"""Conservative DOCX paragraph patching: preserve document OOXML and layout.

The engine NEVER recreates a Word file, page, table, paragraph, style, list,
header or footer. Only text in review-approved paragraphs is replaced.
"""
from __future__ import annotations

from collections import Counter
from copy import deepcopy
from dataclasses import asdict, dataclass
from difflib import SequenceMatcher
from io import BytesIO
import re
import zipfile
from pathlib import Path
from typing import Any

from docx import Document
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE

HEADINGS: dict[str, str] = {
    "summary": "summary", "professional summary": "summary", "career summary": "summary",
    "profile": "summary", "professional profile": "summary", "career objective": "summary",
    "objective": "summary", "about me": "summary", "executive summary": "summary",
    "skills": "skills", "technical skills": "skills", "core skills": "skills",
    "technical expertise": "skills", "skills & tools": "skills", "tools & technologies": "skills", "qualifications": "skills",
    "key skills": "skills", "skills & technologies": "skills", "technologies": "skills",
    "technical competencies": "skills", "core competencies": "skills",
    "technical proficiencies": "skills", "tech stack": "skills",
    "professional experience": "experience", "work experience": "experience",
    "experience": "experience", "employment history": "experience",
    "professional history": "experience", "work history": "experience",
    "relevant experience": "experience", "internships": "experience",
    "career history": "experience", "employment": "experience", "employment experience": "experience",
    "relevant work experience": "experience",
    "projects": "projects", "personal projects": "projects", "academic projects": "projects",
    "selected projects": "projects", "key projects": "projects", "project experience": "projects",
    "education": "other", "certifications": "other", "licenses": "other",
    "awards": "other", "achievements": "other", "honors": "other",
    "publications": "other", "languages": "other", "interests": "other",
    "volunteer experience": "other", "additional information": "other",
    "activities": "other", "references": "other",
}
CATEGORY_NAMES = {"summary": "Summary", "skills": "Skills", "bullet": "Experience / project bullet"}
INLINE_HEAD = re.compile(
    r"^(\s*(?:professional\s+summary|career\s+summary|summary|professional\s+profile|profile|"
    r"skills\s*(?:&|and)\s*technologies|technical\s+skills|core\s+competencies|"
    r"skills|technologies|core\s+skills)\s*:\s*)(.+)$", re.IGNORECASE | re.DOTALL,
)
MANUAL_BULLET = re.compile(r"^(\s*(?:[•●▪◦‣⁃*]|[-–—](?=\s))\s+)(.+)$", re.DOTALL)
ACTIVITY = re.compile(
    r"^(?:developed|implemented|built|designed|automated|led|managed|optimized|"
    r"created|collaborated|integrated|maintained|improved|deployed|tested|"
    r"analyzed|delivered|supported|configured|reduced|increased|streamlined|"
    r"engineered|migrated|architected|owned|worked|used|leveraged|\w+ing)\b",
    re.IGNORECASE,
)


@dataclass
class Candidate:
    id: str
    index: int
    category: str
    original: str
    editable_original: str
    locked_prefix: str
    section: str
    style: str


def _paragraphs(doc: Document) -> list[Any]:
    """Walk body paragraphs, including nested tables, in document order."""
    return list(doc.element.body.xpath('.//w:p'))


def _text_elements(p: Any) -> list[Any]:
    return p.xpath('.//w:t')


def _text(p: Any) -> str:
    return ''.join(t.text or '' for t in _text_elements(p))


def _style(doc: Document, p: Any) -> str:
    found = p.xpath('./w:pPr/w:pStyle')
    if not found:
        return 'Normal'
    style_id = found[0].get(qn('w:val'))
    try:
        return doc.styles.get_by_id(style_id, WD_STYLE_TYPE.PARAGRAPH).name
    except (KeyError, ValueError, TypeError):
        return style_id or 'Normal'


def _heading(text: str) -> str | None:
    s = re.sub(r'\s+', ' ', text).strip().strip(':-|•').casefold()
    return HEADINGS.get(s)


def _has_bullet_numbering(p: Any) -> bool:
    return bool(p.xpath('./w:pPr/w:numPr'))


def _unsafe_to_edit(p: Any) -> bool:
    # Editing linked/field/drawing content risks modifying relationships or graphics.
    return bool(p.xpath('.//w:hyperlink | .//w:drawing | .//w:fldChar | .//w:instrText | .//w:object | ancestor::w:txbxContent'))


def validate_docx(data: bytes, max_uncompressed: int = 32 * 1024 * 1024) -> None:
    if not zipfile.is_zipfile(BytesIO(data)):
        raise ValueError('This does not appear to be a valid DOCX document.')
    with zipfile.ZipFile(BytesIO(data)) as archive:
        names = set(archive.namelist())
        if 'word/document.xml' not in names:
            raise ValueError('This Word document has no document body.')
        if sum(i.file_size for i in archive.infolist()) > max_uncompressed:
            raise ValueError('The DOCX is too large when decompressed.')


def find_candidates(doc: Document) -> list[Candidate]:
    section = 'other'
    found: list[Candidate] = []
    for index, p in enumerate(_paragraphs(doc)):
        raw = _text(p)
        content = raw.strip()
        if not content:
            continue
        new_section = _heading(content)
        if new_section:
            section = new_section
            continue
        if _unsafe_to_edit(p):
            continue

        style = _style(doc, p)
        prefix = ''
        category: str | None = None
        inline = INLINE_HEAD.match(raw)
        if inline:
            prefix = inline.group(1)
            head_name = prefix.split(':')[0].strip().casefold()
            category = 'skills' if ('skills' in head_name or 'technolog' in head_name or 'competenc' in head_name) else 'summary'
        elif section in ('summary', 'skills'):
            category = section
        else:
            manual = MANUAL_BULLET.match(raw)
            numbered = _has_bullet_numbering(p)
            styled = bool(re.search(r'\b(?:bullet|list)\b', style, re.IGNORECASE))
            # Many tailored resume templates use unnumbered action-verb paragraphs.
            likely_plain_bullet = section in ('experience', 'projects') and len(content) >= 55 and bool(ACTIVITY.match(content))
            # Protect education, credentials and awards from bullet rewriting.
            if section in ('experience', 'projects') and (manual or numbered or styled or likely_plain_bullet):
                category = 'bullet'
                if manual:
                    prefix = manual.group(1)

        if category is None:
            continue
        editable = raw[len(prefix):].strip()
        # Keep unimportant tiny fragments and job titles untouched.
        if len(editable) < (12 if category == 'skills' else 20):
            continue
        found.append(Candidate(
            id=f'p{index}', index=index, category=category,
            original=raw, editable_original=editable, locked_prefix=prefix,
            section=section, style=style,
        ))
    return found


def _split_text_into_run_lengths(new_text: str, original_lengths: list[int]) -> list[str]:
    """Distribute new words across existing style runs, leaving all run properties intact.

    This is best-effort typography retention. Original character/style allocation
    stays approximately proportional; no OOXML formatting nodes are changed.
    """
    if not original_lengths:
        return []
    if len(original_lengths) == 1:
        return [new_text]
    if not new_text:
        return [''] * len(original_lengths)

    total = sum(original_lengths)
    if total == 0:
        return [new_text] + [''] * (len(original_lengths) - 1)
    parts: list[str] = []
    start = 0
    running = 0
    for old_len in original_lengths[:-1]:
        running += old_len
        target = round(len(new_text) * running / total)
        target = max(start, min(target, len(new_text)))
        if start < target < len(new_text):
            # Look for a word boundary close by so bold terms aren't split in half.
            options = [i for i in range(max(start, target - 10), min(len(new_text), target + 10) + 1)
                       if i == len(new_text) or new_text[i - 1:i] == ' ']
            if options:
                target = min(options, key=lambda i: abs(i - target))
        parts.append(new_text[start:target])
        start = target
    parts.append(new_text[start:])
    return parts


def _split_using_format_anchors(ts: list[Any], replacement: str) -> list[str] | None:
    """Keep unchanged bold/italic/highlight phrases inside their original styled runs.

    Example: [normal: Built ] [bold: REST APIs] [normal: with Python] ->
    [normal: Built scalable ] [bold: REST APIs] [normal: using Python].
    Returns None if new text makes preserving those style anchors impossible.
    """
    anchors: list[tuple[int, int, int]] = []
    search_from = 0
    for i, node in enumerate(ts):
        old = (node.text or '').strip()
        run = node.getparent()
        has_direct_format = bool(run.xpath('./w:rPr'))
        if not has_direct_format or len(old) < 3:
            continue
        match = re.search(re.escape(old), replacement[search_from:], flags=re.IGNORECASE)
        if match is None:
            continue
        start = search_from + match.start()
        end = search_from + match.end()
        anchors.append((i, start, end))
        search_from = end
    if not anchors:
        return None
    pieces = [''] * len(ts)
    last_node = -1
    last_pos = 0
    for idx, start, end in anchors + [(len(ts), len(replacement), len(replacement))]:
        nodes = list(range(last_node+1, idx))
        segment = replacement[last_pos:start]
        if not nodes:
            if segment:
                return None
        else:
            redistributed = _split_text_into_run_lengths(segment, [len(ts[n].text or '') for n in nodes])
            for node_id, piece in zip(nodes, redistributed):
                pieces[node_id] = piece
        if idx < len(ts):
            pieces[idx] = replacement[start:end]
        last_node = idx
        last_pos = end
    return pieces


def _patch_text(p: Any, replacement: str) -> None:
    ts = _text_elements(p)
    if not ts:
        raise ValueError('Selected paragraph has no editable text runs.')
    lengths = [len(t.text or '') for t in ts]
    pieces = _split_using_format_anchors(ts, replacement) or _split_text_into_run_lengths(replacement, lengths)
    # Replace only w:t textual contents. Original w:pPr, w:rPr, bullets, tabs,
    # hyperlinks, images, numbering IDs and all tables remain byte-equivalent.
    for node, piece in zip(ts, pieces):
        node.text = piece
        if piece[:1].isspace() or piece[-1:].isspace():
            node.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')


def edit_docx(source: Path, destination: Path, selections: dict[str, str],
              candidates: list[Candidate] | None = None) -> None:
    doc = Document(str(source))
    if candidates is None:
        candidates = find_candidates(doc)
    # Never trust a caller-supplied candidate list as edit authorization.
    # Re-identify allowed summary, skills and bullet nodes in the source DOCX.
    actual = {c.id: c for c in find_candidates(doc)}
    valid = {c.id: actual[c.id] for c in candidates if c.id in actual and
             c.category == actual[c.id].category and c.original == actual[c.id].original}
    paragraphs = _paragraphs(doc)
    for key, user_replacement in selections.items():
        if key not in valid:
            raise ValueError(f'Line {key} is not an allowed editable line.')
        if not isinstance(user_replacement, str) or not user_replacement.strip():
            raise ValueError(f'Text for line {key} cannot be empty.')
        if len(user_replacement) > 4000:
            raise ValueError(f'Text for line {key} is too long.')
        cand = valid[key]
        original = _text(paragraphs[cand.index])
        if original != cand.original:
            raise ValueError(f'Line {key} no longer matches the uploaded file.')
        # Preserve explicit, literal bullet characters or inline section labels.
        _patch_text(paragraphs[cand.index], cand.locked_prefix + user_replacement.strip())
    destination.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(destination))


def serialize_candidates(items: list[Candidate]) -> list[dict[str, Any]]:
    return [asdict(item) for item in items]


def heuristic_skill_sort(items: list[Candidate], job_description: str) -> dict[str, str]:
    """Private fallback: only reorder already-present skills, never invent them."""
    changes: dict[str, str] = {}
    jd = job_description.casefold()
    for item in items:
        if item.category != 'skills':
            continue
        original = item.editable_original
        if ',' not in original:
            continue
        chunks = [x.strip() for x in original.split(',')]
        if len(chunks) < 3 or len(chunks) > 30:
            continue
        changed = sorted(enumerate(chunks), key=lambda t: (not (len(t[1]) > 1 and t[1].casefold() in jd), t[0]))
        new = ', '.join(s for _, s in changed)
        if new != original:
            changes[item.id] = new
    return changes


def new_digits(original: str, suggestion: str) -> list[str]:
    """Return numerical claims not present in source bullet (best-effort guard)."""
    orig = Counter(re.findall(r'\b\d+(?:[.,]\d+)?%?\b', original))
    new = Counter(re.findall(r'\b\d+(?:[.,]\d+)?%?\b', suggestion))
    return list((new - orig).elements())
