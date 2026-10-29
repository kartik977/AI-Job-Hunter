// Browser-free integration test: Analyze must automatically start JD tailoring.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '../app/static/app.js'), 'utf8');

class Element {
  constructor(tag = 'div') {
    this.tagName = tag; this.textContent = ''; this.value = '';
    this.dataset = {}; this.disabled = false; this.hidden = false;
    this.files = []; this.children = []; this.listeners = {};
    this.style = {}; this.className = '';
    this.classList = {
      add() {}, remove() {}, toggle() {}
    };
  }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  append(...items) { this.children.push(...items); }
  appendChild(item) { this.children.push(item); return item; }
  replaceChildren(...items) { this.children = items; }
  get lastElementChild() { return this.children[this.children.length - 1]; }
  setAttribute() {}
  scrollIntoView() {}
  querySelector() { return new Element('iframe'); }
}

async function runApp(tailorResponse) {
  const byId = new Map();
  const element = id => {
    if (!byId.has(id)) byId.set(id, new Element());
    return byId.get(id);
  };
  const calls = [];
  const sourceText = 'Backend Software Engineer building Java APIs for payments.';
  const tailoredText = 'Backend Software Engineer delivering Java backend APIs for secure banking payments.';
  const candidates = [
    { id: 'p1', category: 'summary', original: sourceText, editable_original: sourceText },
    { id: 'p2', category: 'skills', original: 'Java | Python | SQL | AWS', editable_original: 'Java | Python | SQL | AWS' },
  ];
  element('resumeFile').files = [{ name: 'my-resume.docx', size: 1234 }];
  element('jd').value = 'Build secure banking backend APIs in Java for payment processing and integrations.';

  const document = {
    getElementById: element,
    createElement: tag => new Element(tag),
    createTextNode: content => ({ textContent: content }),
    querySelectorAll: () => [],
  };
  const fetch = async url => {
    calls.push(url);
    if (url === '/api/analyze') return { ok: true, json: async () => ({
      session_id: 'session123', filename: 'my-resume.docx', candidates,
      pdf_enabled: false, ai_enabled: true, ai_provider: 'groq',
    }) };
    if (url === '/api/tailor') {
      if (tailorResponse instanceof Error) return { ok: false, json: async()=>({ detail:tailorResponse.message }) };
      return { ok: true, json: async()=>({
        suggestions: tailorResponse, focus: [], warnings: [], mode: 'groq',
      }) };
    }
    throw Error('Unexpected fetch '+url);
  };
  class FormData { append() {} }
  vm.runInNewContext(app, {
    document, fetch, FormData, setTimeout, clearTimeout,
    console, window: { scrollTo() {} },
    URL, Blob,
  }, { filename: 'app.js' });
  assert.ok(element('analyzeBtn').listeners.click, 'analyze handler registered');
  await element('analyzeBtn').listeners.click();
  return {calls, element, tailoredText};
}

test('analyze triggers AI automatically and selects a real suggestion', async () => {
  const result = await runApp({
    p1: 'Backend Software Engineer delivering Java backend APIs for secure banking payments.'
  });
  assert.deepEqual(result.calls, ['/api/analyze', '/api/tailor']);
  assert.equal(result.element('acceptedLines').textContent, 1);
  assert.equal(result.element('tailorBtn').textContent, '↻ Regenerate suggestions');
  const cards = result.element('lineList').children;
  assert.equal(cards.length, 2);
  const summary = cards[0];
  const unchangedSkills = cards[1];
  const summaryLabel = summary.children[3].children[0];
  const skillsLabel = unchangedSkills.children[3].children[0];
  assert.equal(summaryLabel.textContent, 'SUGGESTED REPLACEMENT');
  assert.equal(skillsLabel.textContent, 'UNCHANGED — NO AI SUGGESTION');
  assert.equal(unchangedSkills.children[3].children[1].textContent, 'No change');
  assert.equal(summary.children[3].children[1].textContent.includes('length'), true);
});

test('analyze with no AI edits never displays fake 0% replacement', async () => {
  const result = await runApp({});
  assert.deepEqual(result.calls, ['/api/analyze', '/api/tailor']);
  assert.equal(result.element('acceptedLines').textContent, 0);
  for (const card of result.element('lineList').children) {
    assert.equal(card.children[3].children[0].textContent, 'UNCHANGED — NO AI SUGGESTION');
    assert.equal(card.children[3].children[1].textContent, 'No change');
  }
});

test('provider error explains that the resume was not tailored', async () => {
  const result = await runApp(new Error('Rate limit reached'));
  assert.deepEqual(result.calls, ['/api/analyze', '/api/tailor']);
  assert.match(result.element('editorNotice').textContent, /AI tailoring did not complete/);
  assert.match(result.element('editorNotice').textContent, /Rate limit reached/);
  assert.equal(result.element('acceptedLines').textContent, 0);
});
