const state = {session: null, candidates: [], edits: {}, filter: 'all', originalName: '', pdfEnabled: true, previewEdited: false, previewBlob: null, previewStale: false, suggestionsGenerated: false, changeDetails: {}};
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
function counts() {
 $('totalLines').textContent=state.candidates.length;
 $('allCount').textContent=state.candidates.length;
 $('acceptedLines').textContent=state.candidates.filter(c=>state.edits[c.id]?.checked&&state.edits[c.id].text.trim()!==c.editable_original.trim()).length;
 renderChangeReport();
}
function markPreviewStale(){
 if(!state.session || !state.pdfEnabled || !state.previewEdited)return;
 state.previewEdited=false;
 state.previewStale=true;
 $('previewTitle').textContent='Tailored preview needs refreshing';
 $('previewDesc').textContent='Your selected edits have changed since the last preview.';
 $('previewToggle').textContent='Refresh tailored preview ↗';
 $('previewFrame').replaceChildren(make('div','preview-wait','Edits changed. Click Refresh tailored preview to view the updated document.'));
}
function renderChangeReport(){
 const panel=$('changeReport'),list=$('changeReportList');
 if(!state.suggestionsGenerated){panel.hidden=true;return;}
 panel.hidden=false;
 list.replaceChildren();
 let included=0, excluded=0;
 for(const candidate of state.candidates){
  const info=state.changeDetails[candidate.id];
  if(!info)continue;
  const edit=state.edits[candidate.id];
  if(!edit)continue;
  const selected=edit.checked&&edit.text.trim()!==candidate.editable_original.trim();
  if(selected)included++;else excluded++;
  const entry=make('article','change-entry'+(selected?'':' change-excluded'));
  const head=make('div','change-entry-head');
  head.append(make('strong','',candidate.category==='summary'?'Professional summary':candidate.category==='skills'?'Skills':'Experience / project bullet'),
              make('span','change-entry-status',selected?'Included in download':'Excluded from download'));
  entry.append(head);
  const originalLine=make('div','change-line');
  originalLine.append(make('span','change-line-label','BEFORE'),make('p','',candidate.editable_original));
  const editedLine=make('div','change-line');
  editedLine.append(make('span','change-line-label','AFTER'),make('p','',edit.text));
  entry.append(originalLine,editedLine);
  const manual=edit.text.trim()!==info.revised.trim();
  entry.append(make('p','change-explanation',manual?'Manually adjusted since generation. Recheck its relevance and accuracy.':'What changed: '+info.what_changed));
  if(!manual){
   entry.append(make('p','change-explanation','Why for this JD: '+info.why));
   if(info.jd_requirement)entry.append(make('p','change-jd','JD requirement: '+info.jd_requirement));
  }
  list.append(entry);
 }
 $('changeReportCount').textContent=included+' included';
 $('changeReportSummary').textContent=included+' genuine edits selected for export'+(excluded?' · '+excluded+' excluded':'')+'. No ATS percentage or fake match claims.';
 if(!included&&!excluded)list.append(make('p','change-empty','No evidence-supported changes were generated. Your original resume remains untouched.'));
}


function fileName() { return state.originalName || 'resume.docx'; }
async function analyze() {
 const f=fileInput.files[0]; if(!f)return;const btn=$('analyzeBtn');setBusy(btn,true,'Reading document & tailoring…');notice($('mainNotice'),'');
 try {
  const body=new FormData();body.append('file',f);
  const result=await jsonFetch('/api/analyze',{method:'POST',body});
  state.session=result.session_id;state.candidates=result.candidates;state.originalName=result.filename;state.pdfEnabled=result.pdf_enabled;
  state.edits={};state.changeDetails={};state.suggestionsGenerated=false;state.previewEdited=false;state.previewStale=false;
  $('changeReport').hidden=true;$('resultTitle').textContent='Finding JD connections…';
  $('previewTitle').textContent='Original format preview';
  $('previewDesc').textContent='A reference of your uploaded Word file';
  $('previewToggle').textContent='Preview my edits ↗';
  for (const c of state.candidates) state.edits[c.id]={text:c.editable_original,checked:false};
  $('workingFilename').textContent=result.filename; counts();render();
  $('editor-section').hidden=false;$('editor-section').scrollIntoView({behavior:'smooth',block:'start'});
  if (state.pdfEnabled){const iframe=document.createElement('iframe');iframe.title='Preview of original resume';iframe.src='/api/preview/'+encodeURIComponent(state.session);$('previewFrame').replaceChildren(iframe);}else{$('previewFrame').textContent='PDF preview requires LibreOffice. DOCX editing is still available.';$('pdfBtn').disabled=true;$('previewToggle').disabled=true;}
  if(!result.ai_enabled) {
   $('resultTitle').textContent='Tailoring unavailable — original resume only';
   notice($('editorNotice'),'AI is not configured. The original resume was read but has NOT been tailored. Configure GROQ_API_KEY in Render, or manually edit permitted text.','warning');
  }else{
   btn.textContent='Tailoring resume to JD…';
   await generateSuggestions();
  }
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
  const isChanged=()=>model.text.trim()!==c.editable_original.trim();
  const checkboxLabel=make('label','check-wrap');const check=document.createElement('input');check.type='checkbox';check.checked=model.checked&&isChanged();
  checkboxLabel.append(check,document.createTextNode(' Include this edit'));
  check.addEventListener('change',()=>{model.checked=check.checked&&isChanged();check.checked=model.checked;card.classList.toggle('accepted',model.checked);markPreviewStale();counts();});
  head.append(title,checkboxLabel);
  const originalCap=make('div','original-caption','ORIGINAL');const original=make('div','original-text',c.original);
  const subHead=make('div','suggest-label');
  const copyState=()=>model.text.trim()!==c.editable_original.trim();
  const editLabel=make('span','',copyState()?'SUGGESTED REPLACEMENT':state.suggestionsGenerated?'UNCHANGED — NO AI SUGGESTION':'EDITABLE COPY — NOT YET TAILORED');
  subHead.append(editLabel,make('span','word-count',''));
  const count=subHead.lastElementChild;
  const area=make('textarea','edit-textarea');area.value=model.text;area.setAttribute('aria-label',`Replacement for ${c.category} line ${c.id}`);
  const updateCount=()=>{
   const originalLen=c.editable_original.length;
   const delta=Math.round((area.value.length / Math.max(1,originalLen)-1)*100);
   count.textContent=!isChanged()?'No change':delta===0?'Same length':(delta>0?'+':'')+delta+'% length change';
   count.title='Text-length difference only — not a JD match score.';
   count.classList.toggle('long',isChanged()&&delta>15);
  };
  area.addEventListener('input',()=>{model.text=area.value;model.checked=isChanged();check.checked=model.checked;card.classList.toggle('accepted',model.checked);editLabel.textContent=model.checked?'MANUALLY EDITED REPLACEMENT':'UNCHANGED — NO EDIT';markPreviewStale();updateCount();counts();});
  updateCount();card.append(head,originalCap,original,subHead,area);
  const explanation=state.changeDetails[c.id];
  if(explanation){
   const hint=make('div','edit-reason');
   hint.append(make('strong','','JD connection: '),document.createTextNode(explanation.jd_requirement||explanation.why));
   card.append(hint);
  }
  list.appendChild(card);
 }
}
for (const tab of document.querySelectorAll('.tab')) tab.addEventListener('click',()=>{state.filter=tab.dataset.filter;for(const t of document.querySelectorAll('.tab'))t.classList.toggle('selected',t===tab);render();});
$('clearBtn').addEventListener('click',()=>{for(const model of Object.values(state.edits))model.checked=false;markPreviewStale();counts();render();});
async function generateSuggestions(){
 if(!state.session)return;
 notice($('editorNotice'),'Tailoring in progress: matching your verified experience to the job requirements…');
 try{
  const result=await jsonFetch('/api/tailor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:state.session,jd:jdField.value})});
  state.suggestionsGenerated=true;
  state.changeDetails=result.change_details||{};
  let summary=0,skills=0,bullets=0;
  for(const [id,text] of Object.entries(result.suggestions||{})){
   const candidate=state.candidates.find(c=>c.id===id);
   if(state.edits[id]&&candidate&&text.trim()&&text.trim()!==candidate.editable_original.trim()){
    state.edits[id].text=text;state.edits[id].checked=true;
    if(candidate.category==='summary')summary++;
    else if(candidate.category==='skills')skills++;
    else bullets++;
   }
  }
  render();counts();
  const total=summary+skills+bullets;
  if(!total){
   $('resultTitle').textContent='No evidence-supported changes found';
   notice($('editorNotice'),'No evidence-supported JD edits were produced. The original resume remains unchanged; no tailored file is being claimed. '+(result.warnings||[]).join(' '),'warning');
   return;
  }
  $('resultTitle').textContent='Your tailored resume is ready for review';
  let message='Tailored resume ready: '+summary+' summary, '+skills+' skill list(s), '+bullets+' experience/project bullet(s) updated. All edits are selected for export; review the changes below and uncheck anything inaccurate.';
  if(result.warnings?.length)message+=' '+result.warnings.join(' ');
  notice($('editorNotice'),message);
  if(state.pdfEnabled){
   await togglePreview(true);
  }else{
   $('previewTitle').textContent='Tailored DOCX ready';
   $('previewDesc').textContent='PDF preview is unavailable, but your approved edits will export to Word.';
   $('previewToggle').disabled=true;
  }
 }catch(e){
  $('resultTitle').textContent='Tailoring failed — original resume only';
  notice($('editorNotice'),'AI tailoring did not complete: '+e.message+'. Your original resume is unchanged. You can retry with the main Tailor Resume button.','error');
 }
}
async function download(format){if(!state.session)return;const btn=format==='pdf'?$('pdfBtn'):$('docxBtn');setBusy(btn,true,'Preparing file…');notice($('editorNotice'),'');try{
 const lines=state.candidates.filter(c=>state.edits[c.id].checked).map(c=>({id:c.id,text:state.edits[c.id].text}));
 const response=await fetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:state.session,lines,output_format:format})});
 if(!response.ok){const e=await response.json();throw new Error(e.detail||'Export failed.');}
 const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fileName().replace(/\.docx$/i,'')+'_Tailored.'+format;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(e){notice($('editorNotice'),e.message,'error');window.scrollTo({top:$('editor-section').offsetTop,behavior:'smooth'});}finally{setBusy(btn,false);}}
$('docxBtn').addEventListener('click',()=>download('docx'));$('pdfBtn').addEventListener('click',()=>download('pdf'));
$('restartBtn').addEventListener('click',async()=>{letterDraftSource=null;$('letterResult').hidden=true;letterText.value='';notice($('letterNotice'),'');if(state.session)try{await fetch('/api/session/'+state.session,{method:'DELETE'});}catch(_){}state.session=null;state.candidates=[];state.edits={};state.changeDetails={};state.suggestionsGenerated=false;state.previewStale=false;$('changeReport').hidden=true;$('editor-section').hidden=true;fileInput.value='';$('dropTitle').textContent='Drop your resume here';$('dropHint').textContent='or click to browse your files';updateReady();$('upload-section').scrollIntoView({behavior:'smooth',block:'start'});});
updateReady();

async function togglePreview(forceTailored=false){
 if(!state.session||!state.pdfEnabled)return;
 const btn=$('previewToggle');setBusy(btn,true,'Rendering…');
 try{
  if(state.previewEdited&&!forceTailored&&!state.previewStale){
   $('previewFrame').querySelector('iframe').src='/api/preview/'+encodeURIComponent(state.session);
   state.previewEdited=false;
  }else{
   const lines=chosenLines();
   const response=await fetch('/api/preview-tailored',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({session_id:state.session,lines,output_format:'pdf'})});
   if(!response.ok){
    const result=await response.json();
    throw new Error(result.detail||'Preview failed.');
   }
   const blob=await response.blob();
   if(state.previewBlob)URL.revokeObjectURL(state.previewBlob);
   state.previewBlob=URL.createObjectURL(blob);
   const frame=document.createElement('iframe');
   frame.title='Tailored resume PDF preview';
   frame.src=state.previewBlob;
   $('previewFrame').replaceChildren(frame);
   state.previewEdited=true;
   state.previewStale=false;
  }
  $('previewTitle').textContent=state.previewEdited?'Tailored resume preview':'Original format preview';
  $('previewDesc').textContent=state.previewEdited?'Updated with your selected JD-tailored edits':'The unchanged source Word document';
 }catch(e){
  notice($('editorNotice'),'Tailored text is ready for DOCX export, but PDF preview failed: '+e.message+'. Review your edits and download DOCX.','warning');
 }finally{setBusy(btn,false);btn.textContent=state.previewEdited?'Show original ↩':'Preview my edits ↗';}
}
$('previewToggle').addEventListener('click',()=>togglePreview());


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
