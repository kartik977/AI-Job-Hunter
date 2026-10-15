const state = {session: null, candidates: [], edits: {}, filter: 'all', originalName: '', pdfEnabled: true, previewEdited: false, previewBlob: null};
const $ = id => document.getElementById(id);
const fileInput = $('resumeFile'), jdField = $('jd');
const notice = (el, message, kind = '') => {el.hidden = !message; el.textContent = message || ''; el.className = 'notice' + (kind ? ' ' + kind : '');};
const setBusy = (btn, busy, label) => { if (busy) {btn.dataset.oldLabel = btn.textContent; btn.disabled = true;btn.textContent = label;} else {btn.disabled = false;btn.textContent = btn.dataset.oldLabel || btn.textContent;} };
function updateReady() { $('analyzeBtn').disabled = !(fileInput.files[0] && jdField.value.trim().length >= 50); $('jdCount').textContent = jdField.value.length.toLocaleString() + ' characters'; }
fileInput.addEventListener('change', () => { let f=fileInput.files[0]; if(f) {$('dropTitle').textContent=f.name; $('dropHint').textContent=(f.size/(1024*1024)).toFixed(2)+' MB selected';} updateReady(); });
jdField.addEventListener('input', updateReady);
const zone = $('dropZone');
for (const e of ['dragenter','dragover']) zone.addEventListener(e, ev => {ev.preventDefault(); zone.classList.add('dragged');});
for (const e of ['dragleave','drop']) zone.addEventListener(e, ev => {ev.preventDefault(); zone.classList.remove('dragged');});
zone.addEventListener('drop', ev => { const files=ev.dataTransfer.files; if(!files.length)return; try {fileInput.files = files;fileInput.dispatchEvent(new Event('change'));} catch (_) {notice($('mainNotice'),'Please click the upload area to select a file.','warning');}});
async function jsonFetch(url, options={}) { const res=await fetch(url, options); let result; try {result=await res.json();} catch{throw new Error('Server returned an invalid response.');} if(!res.ok) throw new Error(typeof result.detail==='string'?result.detail:'Request failed.'); return result; }
function counts() { $('totalLines').textContent=state.candidates.length; $('allCount').textContent=state.candidates.length; $('acceptedLines').textContent=Object.values(state.edits).filter(e=>e.checked && e.text.trim()).length; }
function fileName() { return state.originalName || 'resume.docx'; }
async function analyze() {
 const f=fileInput.files[0]; if(!f)return;const btn=$('analyzeBtn');setBusy(btn,true,'Reading formatting…');notice($('mainNotice'),'');
 try {
  const body=new FormData();body.append('file',f);
  const result=await jsonFetch('/api/analyze',{method:'POST',body});
  state.session=result.session_id;state.candidates=result.candidates;state.originalName=result.filename;state.pdfEnabled=result.pdf_enabled;
  state.edits={};state.previewEdited=false;$('previewToggle').textContent='Preview my edits ↗'; for (const c of state.candidates) state.edits[c.id]={text:c.editable_original,checked:false};
  $('workingFilename').textContent=result.filename; counts();render();
  $('editor-section').hidden=false;$('editor-section').scrollIntoView({behavior:'smooth',block:'start'});
  if (state.pdfEnabled){const iframe=document.createElement('iframe');iframe.title='Preview of original resume';iframe.src='/api/preview/'+encodeURIComponent(state.session);$('previewFrame').replaceChildren(iframe);}else{$('previewFrame').textContent='PDF preview requires LibreOffice. DOCX editing is still available.';$('pdfBtn').disabled=true;$('previewToggle').disabled=true;}
  if(!result.ai_enabled) notice($('editorNotice'),'AI is not configured. Add GROQ_API_KEY to .env for free-tier AI rewriting, then restart the website. You can still edit manually and download DOCX.','warning');
  else notice($('editorNotice'),result.ai_provider==='groq'?'Groq AI is connected (free tier, subject to usage limits). Click Generate suggestions to tailor your resume.':'OpenAI AI is connected. Click Generate suggestions to tailor your resume.');
 } catch(e){notice($('mainNotice'),e.message,'error');}
 finally{setBusy(btn,false);updateReady();}
}
$('analyzeBtn').addEventListener('click',analyze);
function make(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function render(){
 const list=$('lineList');list.replaceChildren();
 const items=state.candidates.filter(c=>state.filter==='all'||c.category===state.filter);
 if(!items.length){list.appendChild(make('div','empty-list','No editable paragraphs in this section.'));return;}
 for (const c of items){
  const model=state.edits[c.id];let card=make('article','edit-card'+(model.checked?' accepted':''));
  let head=make('div','edit-card-head'); const title=make('span','edit-tag '+c.category,({'summary':'SUMMARY','skills':'SKILLS','bullet':'BULLET POINT'})[c.category]);
  const checkboxLabel=make('label','check-wrap');const check=document.createElement('input');check.type='checkbox';check.checked=model.checked;
  checkboxLabel.append(check,document.createTextNode(' Include this edit'));
  check.addEventListener('change',()=>{model.checked=check.checked;card.classList.toggle('accepted',model.checked);counts();});
  head.append(title,checkboxLabel);
  const originalCap=make('div','original-caption','ORIGINAL');const original=make('div','original-text',c.original);
  const subHead=make('div','suggest-label');subHead.append(make('span','','REPLACEMENT'),make('span','word-count',''));
  const count=subHead.lastElementChild;
  const area=make('textarea','edit-textarea');area.value=model.text;area.setAttribute('aria-label',`Replacement for ${c.category} line ${c.id}`);
  const updateCount=()=>{const originalLen=c.editable_original.length, delta=Math.round((area.value.length / Math.max(1,originalLen)-1)*100);count.textContent=(delta>=0?'+':'')+delta+'% length';count.classList.toggle('long',delta>15);};
  area.addEventListener('input',()=>{model.text=area.value;model.checked=(area.value.trim()!==c.editable_original.trim());check.checked=model.checked;card.classList.toggle('accepted',model.checked);updateCount();counts();});
  updateCount();card.append(head,originalCap,original,subHead,area);list.appendChild(card);
 }
}
for (const tab of document.querySelectorAll('.tab')) tab.addEventListener('click',()=>{state.filter=tab.dataset.filter;for(const t of document.querySelectorAll('.tab'))t.classList.toggle('selected',t===tab);render();});
$('clearBtn').addEventListener('click',()=>{for(const model of Object.values(state.edits))model.checked=false;counts();render();});
$('tailorBtn').addEventListener('click', async()=>{if(!state.session)return;const btn=$('tailorBtn');setBusy(btn,true,'Generating suggestions…');notice($('editorNotice'),'');try{
 const result=await jsonFetch('/api/tailor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:state.session,jd:jdField.value})});
 let rewritten=0, reordered=0;
 for(const [id,text] of Object.entries(result.suggestions)){
  const candidate=state.candidates.find(c=>c.id===id);
  if(state.edits[id]&&candidate&&text.trim()&&text!==candidate.editable_original){
   state.edits[id].text=text;state.edits[id].checked=true;
   if(candidate.category==='skills') reordered++; else rewritten++;
  }
 }
 render();counts();
 const topFocus=(result.focus||[]).slice(0,2).map(t=>t.length>115?t.slice(0,112)+'…':t).join(' • ');
 const message=(rewritten||reordered?`${rewritten} substantive summary/bullet suggestion(s); ${reordered} skill list(s) prioritized without dropping existing skills. Review each suggestion before exporting. `:'No safe automatic changes found; you can edit lines manually. ')+(topFocus?'JD priorities: '+topFocus+'. ':'')+(result.warnings||[]).join(' ');
 notice($('editorNotice'),message,result.mode==='local'?'warning':'');
 }catch(e){notice($('editorNotice'),e.message,'error');}finally{setBusy(btn,false);}});
async function download(format){if(!state.session)return;const btn=format==='pdf'?$('pdfBtn'):$('docxBtn');setBusy(btn,true,'Preparing file…');notice($('editorNotice'),'');try{
 const lines=state.candidates.filter(c=>state.edits[c.id].checked).map(c=>({id:c.id,text:state.edits[c.id].text}));
 const response=await fetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:state.session,lines,output_format:format})});
 if(!response.ok){const e=await response.json();throw new Error(e.detail||'Export failed.');}
 const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fileName().replace(/\.docx$/i,'')+'_Tailored.'+format;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(e){notice($('editorNotice'),e.message,'error');window.scrollTo({top:$('editor-section').offsetTop,behavior:'smooth'});}finally{setBusy(btn,false);}}
$('docxBtn').addEventListener('click',()=>download('docx'));$('pdfBtn').addEventListener('click',()=>download('pdf'));
$('restartBtn').addEventListener('click',async()=>{letterDraftSource=null;$('letterResult').hidden=true;letterText.value='';notice($('letterNotice'),'');if(state.session)try{await fetch('/api/session/'+state.session,{method:'DELETE'});}catch(_){}state.session=null;state.candidates=[];state.edits={};$('editor-section').hidden=true;fileInput.value='';$('dropTitle').textContent='Drop your resume here';$('dropHint').textContent='or click to browse your files';updateReady();$('upload-section').scrollIntoView({behavior:'smooth',block:'start'});});
updateReady();

async function togglePreview(){
 if(!state.session || !state.pdfEnabled)return;
 const btn=$('previewToggle');setBusy(btn,true,'Rendering…');notice($('editorNotice'),'');
 try{
  if(state.previewEdited){
    $('previewFrame').querySelector('iframe').src='/api/preview/'+state.session;
    state.previewEdited=false;
  }else{
    const lines=state.candidates.filter(c=>state.edits[c.id].checked).map(c=>({id:c.id,text:state.edits[c.id].text}));
    const response=await fetch('/api/preview-tailored',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:state.session,lines,output_format:'pdf'})});
    if(!response.ok){const result=await response.json();throw new Error(result.detail||'Preview failed.');}
    const blob=await response.blob();
    if(state.previewBlob) URL.revokeObjectURL(state.previewBlob);
    state.previewBlob=URL.createObjectURL(blob);
    $('previewFrame').querySelector('iframe').src=state.previewBlob;
    state.previewEdited=true;
  }
  $('previewTitle').textContent=state.previewEdited?'Tailored resume preview':'Original format preview';
  $('previewDesc').textContent=state.previewEdited?'Rendered with your selected changes':'A reference of your uploaded Word file';
 }catch(e){notice($('editorNotice'),e.message,'error');}
 finally{setBusy(btn,false);btn.textContent=state.previewEdited?'Show original ↩':'Preview my edits ↗';}
}
$('previewToggle').addEventListener('click',togglePreview);


// Cover letter: generated from the same JD and the currently approved resume edits.
function chosenLines() {
 return state.candidates.filter(c=>state.edits[c.id].checked).map(c=>({id:c.id,text:state.edits[c.id].text}));
}
function currentLetterSource() {
 return JSON.stringify({jd:jdField.value,company:$('letterCompany').value,role:$('letterRole').value,lines:chosenLines()});
}
let letterDraftSource = null;
const letterText = $('letterText');
function markLetterOutdated() {
 if(letterDraftSource && currentLetterSource()!==letterDraftSource){
  notice($('letterNotice'),'Your JD, company, role, or selected resume edits changed after generating this letter. Regenerate to keep them aligned.','warning');
 }
}
jdField.addEventListener('input',markLetterOutdated);
$('letterCompany').addEventListener('input',markLetterOutdated);
$('letterRole').addEventListener('input',markLetterOutdated);
$('editor-section').addEventListener('input',markLetterOutdated);
$('editor-section').addEventListener('change',markLetterOutdated);
$('generateLetterBtn').addEventListener('click',async()=>{
 if(!state.session)return;
 const btn=$('generateLetterBtn');setBusy(btn,true,'Writing a matching cover letter…');notice($('letterNotice'),'');
 try{
  const source=currentLetterSource();
  const request={session_id:state.session,jd:jdField.value,lines:chosenLines(),company:$('letterCompany').value.trim(),role:$('letterRole').value.trim()};
  const result=await jsonFetch('/api/cover-letter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
  letterText.value=result.letter_text;
  $('letterResult').hidden=false;
  letterDraftSource=source;
  notice($('letterNotice'),'Draft generated using '+result.provider+'. Review facts, edit the wording, then download your preferred format.');
  $('letterResult').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(err){notice($('letterNotice'),err.message,'error');}
 finally{setBusy(btn,false);}
});
async function downloadLetter(format){
 if(!state.session||!letterText.value.trim())return;
 const btn=format==='pdf'?$('letterPdfBtn'):$('letterDocxBtn');setBusy(btn,true,'Preparing cover letter…');
 try{
  const response=await fetch('/api/cover-letter/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:state.session,letter_text:letterText.value,company:$('letterCompany').value.trim(),role:$('letterRole').value.trim(),output_format:format})});
  if(!response.ok){const err=await response.json();throw new Error(err.detail||'Cover letter export failed.');}
  const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
  const company=$('letterCompany').value.trim().replace(/[^a-z0-9_-]+/gi,'_').slice(0,40)||'Job';
  a.href=url;a.download=company+'_Cover_Letter.'+format;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(err){notice($('letterNotice'),err.message,'error');}
 finally{setBusy(btn,false);}
}
$('letterDocxBtn').addEventListener('click',()=>downloadLetter('docx'));
$('letterPdfBtn').addEventListener('click',()=>downloadLetter('pdf'));
