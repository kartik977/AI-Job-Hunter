// End-to-end client workflow with mocked DOM/API: one click, real edits, explanations.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/static/app.js'), 'utf8');

class Element {
  constructor(tag='div'){
    this.tagName=tag;this.textContent='';this.value='';this.dataset={};this.disabled=false;
    this.hidden=false;this.files=[];this.children=[];this.listeners={};
    this.className='';this.checked=false;this.classList={add(){},remove(){},toggle(){}};
    this.style={};
  }
  addEventListener(type, fn){this.listeners[type]=fn;}
  append(...items){this.children.push(...items);}
  appendChild(item){this.children.push(item);return item;}
  replaceChildren(...items){this.children=items;}
  get lastElementChild(){return this.children[this.children.length-1];}
  setAttribute(){}
  scrollIntoView(){}
  querySelector(){return new Element('iframe');}
}

async function runApp(suggestions, {pdfEnabled=false, details=null, failPreview=false}={}){
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
  const calls=[];
  const original='Backend Software Engineer building Java APIs for payments.';
  const tailored='Backend Software Engineer delivering Java backend APIs for secure banking payments.';
  const candidates=[
    {id:'p1',category:'summary',original,editable_original:original},
    {id:'p2',category:'skills',original:'Java | Python | SQL | AWS',editable_original:'Java | Python | SQL | AWS'},
  ];
  get('resumeFile').files=[{name:'resume.docx',size:1200}];
  get('jd').value='Build secure banking backend APIs in Java for payment processing and integrations.';
  get('analyzeBtn').textContent='✧ Tailor Resume →';
  get('previewToggle').textContent='Show original ↩';
  const document={
    getElementById:get,createElement:tag=>new Element(tag),
    createTextNode:text=>({textContent:text}),
    querySelectorAll:()=>[],
  };
  const fetch=async url=>{
    calls.push(url);
    if(url==='/api/analyze')return {ok:true,json:async()=>({
      session_id:'session123',filename:'resume.docx',candidates,pdf_enabled:pdfEnabled,
      ai_enabled:true,ai_provider:'groq',
    })};
    if(url==='/api/tailor'){
      if(suggestions instanceof Error)return {ok:false,json:async()=>({detail:suggestions.message})};
      return {ok:true,json:async()=>({
        suggestions,change_details:details??(suggestions.p1?{p1:{
          category:'summary',original,revised:tailored,
          what_changed:'Emphasized backend APIs and secure banking.',
          jd_requirement:'Build secure banking backend APIs',
          why:'Connects verified experience to this JD requirement.',
        }}:{}),
        focus:[],warnings:[],mode:'groq',
      })};
    }
    if(url==='/api/preview-tailored'){
      if(failPreview)return {ok:false,json:async()=>({detail:'PDF unavailable'})};
      return {ok:true,blob:async()=>new Blob(['%PDF-1.4'])};
    }
    throw Error('Unexpected request '+url);
  };
  class FormData{append(){}}
  vm.runInNewContext(app,{document,fetch,FormData,console,setTimeout,clearTimeout,
    Blob,URL,window:{scrollTo(){}}},{filename:'app.js'});
  await get('analyzeBtn').listeners.click();
  return {get,calls,original,tailored};
}

test('one Tailor Resume click performs analyze, AI tailoring and change report',async()=>{
  const r=await runApp({p1:'Backend Software Engineer delivering Java backend APIs for secure banking payments.'});
  assert.deepEqual(r.calls,['/api/analyze','/api/tailor']);
  assert.equal(r.get('acceptedLines').textContent,1);
  assert.equal(r.get('changeReport').hidden,false);
  assert.equal(r.get('changeReportList').children.length,1);
  const entry=r.get('changeReportList').children[0];
  assert.equal(entry.children[0].children[1].textContent,'Included in download');
  assert.match(entry.children[3].textContent,/What changed: Emphasized backend APIs/);
  assert.match(entry.children[4].textContent,/Why for this JD/);
  const cards=r.get('lineList').children;
  assert.equal(cards.length,2);
  assert.equal(cards[0].children[3].children[0].textContent,'SUGGESTED REPLACEMENT');
  assert.equal(cards[1].children[3].children[0].textContent,'UNCHANGED — NO AI SUGGESTION');
  assert.equal(cards[1].children[3].children[1].textContent,'No change');
  assert.equal(r.get('analyzeBtn').textContent,'✧ Tailor Resume →');
  assert.equal(r.get('changeReportSummary').textContent.includes('No ATS'),true);
});

test('successful tailoring opens the selected-edits PDF preview automatically',async()=>{
  const r=await runApp({p1:'Backend Software Engineer delivering Java backend APIs for secure banking payments.'},{pdfEnabled:true});
  assert.deepEqual(r.calls,['/api/analyze','/api/tailor','/api/preview-tailored']);
  assert.equal(r.get('previewTitle').textContent,'Tailored resume preview');
  assert.equal(r.get('previewToggle').textContent,'Show original ↩');
  assert.equal(r.get('previewFrame').children.length,1);
  const cards=r.get('lineList').children;
  const checkbox=cards[0].children[0].children[1].children[0];
  checkbox.checked=false;
  checkbox.listeners.change();
  assert.equal(r.get('acceptedLines').textContent,0);
  assert.equal(r.get('changeReportList').children[0].children[0].children[1].textContent,'Excluded from download');
  assert.equal(r.get('previewTitle').textContent,'Tailored preview needs refreshing');
  assert.equal(r.get('previewToggle').textContent,'Refresh tailored preview ↗');
});

test('no AI suggestions means no deceptive tailored resume or no-op score',async()=>{
  const r=await runApp({});
  assert.deepEqual(r.calls,['/api/analyze','/api/tailor']);
  assert.equal(r.get('acceptedLines').textContent,0);
  assert.equal(r.get('changeReportList').children[0].textContent.startsWith('No evidence-supported'),true);
  assert.match(r.get('editorNotice').textContent,/No evidence-supported JD edits/);
  assert.equal(r.get('previewFrame').children.length,0);
  for(const card of r.get('lineList').children){
    assert.equal(card.children[3].children[0].textContent,'UNCHANGED — NO AI SUGGESTION');
    assert.equal(card.children[3].children[1].textContent,'No change');
  }
});

test('a failed AI provider request does not claim successful tailoring',async()=>{
  const r=await runApp(new Error('Rate limit reached'));
  assert.deepEqual(r.calls,['/api/analyze','/api/tailor']);
  assert.match(r.get('editorNotice').textContent,/AI tailoring did not complete/);
  assert.match(r.get('editorNotice').textContent,/Rate limit reached/);
  assert.equal(r.get('acceptedLines').textContent,0);
  assert.equal(r.get('changeReport').hidden,true);
});

test('PDF preview failure leaves actual selected edits available for DOCX export',async()=>{
  const r=await runApp({p1:'Backend Software Engineer delivering Java backend APIs for secure banking payments.'},{pdfEnabled:true,failPreview:true});
  assert.equal(r.get('acceptedLines').textContent,1);
  assert.match(r.get('editorNotice').textContent,/PDF preview failed/);
  assert.equal(r.get('changeReportList').children.length,1);
});
