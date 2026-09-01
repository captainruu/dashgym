// Used only by admin.html — the "Scan QR" tab (lookup-only, does not
// write any check-in log; just shows a member's current status).
import { showLoading, hideLoading, showToast, normCode } from './utils.js';
import { dbGetMemberByCode } from './db-members.js';

// ============================================================
// SCAN MEMBER (lookup only — no data is written)
// ============================================================
async function scanMember(){
  const raw=(document.getElementById('scanCode').value||'').trim().toUpperCase();
  if(!raw){ showToast('Enter a member code'); return; }
  showLoading('Looking up…');
  const m=await dbGetMemberByCode(raw);
  hideLoading();
  const resultDiv=document.getElementById('scanResult');
  if(!m){
    resultDiv.innerHTML=`<div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);padding:1.5rem;"><p style="color:#ef4444;font-family:var(--font-cond);font-size:14px;letter-spacing:1px;">❌ MEMBER NOT FOUND</p><p style="font-size:13px;color:var(--gray);margin-top:.5rem;">Code "${raw}" is not registered.</p></div>`;
    if(navigator.vibrate) navigator.vibrate([200]);
    return;
  }
  const today=new Date(); today.setHours(0,0,0,0);
  const exp=new Date(m.expiryDate);
  const diff=Math.ceil((exp-today)/86400000);
  const active=diff>=0;
  const color=active?'#22c55e':'#ef4444';
  resultDiv.innerHTML=`
    <div style="border:2px solid ${color};padding:1.5rem;background:${active?'rgba(34,197,94,.06)':'rgba(239,68,68,.06)'};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;">
        <div><div style="font-family:var(--font-head);font-size:28px;">${m.name}</div><div style="font-family:var(--font-cond);font-size:13px;color:var(--gray);margin-top:.25rem;">${m.code}</div></div>
        <div style="font-family:var(--font-cond);font-size:13px;letter-spacing:1px;color:${color};text-align:right;">${active?`✅ ACTIVE — ${diff} day(s) remaining`:'❌ EXPIRED'}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.25rem;">
        <div><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--gray);font-family:var(--font-cond);">Package</div><div style="font-size:15px;margin-top:.2rem;">${m.pkgName}</div></div>
        <div><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--gray);font-family:var(--font-cond);">Start</div><div style="font-size:15px;margin-top:.2rem;">${m.startDate}</div></div>
        <div><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--gray);font-family:var(--font-cond);">Expiry</div><div style="font-size:15px;margin-top:.2rem;color:${color};">${m.expiryDate}</div></div>
      </div>
    </div>`;
  if(navigator.vibrate) navigator.vibrate(active?[100]:[200,100,200]);
}
window.scanMember=scanMember;

// ============================================================
// SCAN TAB — camera scanner
// ============================================================
let scanStream=null, scanAnimFrame=null, useFrontCam=false, lastScanned='', lastScannedTime=0;
async function startScanner(){
  const wrap=document.getElementById('scannerWrap'); const video=document.getElementById('scanVideo');
  const startBtn=document.getElementById('startScanBtn'); const stopBtn=document.getElementById('stopScanBtn');
  const flipBtn=document.getElementById('flipCamBtn'); const notice=document.getElementById('noCameraNotice');
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ notice.style.display='block'; return; }
  try{
    if(scanStream) stopScanner();
    scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:useFrontCam?'user':{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
    video.srcObject=scanStream; await video.play();
    wrap.style.display='block'; notice.style.display='none';
    startBtn.style.display='none'; stopBtn.style.display='inline-flex'; flipBtn.style.display='inline-flex';
    tickScanner();
  }catch(e){ notice.style.display='block'; console.warn('Camera error:',e); }
}
function stopScanner(){
  if(scanStream){ scanStream.getTracks().forEach(t=>t.stop()); scanStream=null; }
  if(scanAnimFrame){ cancelAnimationFrame(scanAnimFrame); scanAnimFrame=null; }
  const w=document.getElementById('scannerWrap'); const s=document.getElementById('startScanBtn');
  const st=document.getElementById('stopScanBtn'); const f=document.getElementById('flipCamBtn');
  if(w)w.style.display='none'; if(s)s.style.display='inline-flex'; if(st)st.style.display='none'; if(f)f.style.display='none';
}
function flipCamera(){ useFrontCam=!useFrontCam; startScanner(); }
function tickScanner(){
  const video=document.getElementById('scanVideo'); const canvas=document.getElementById('scanCanvas');
  if(!scanStream||video.readyState!==video.HAVE_ENOUGH_DATA){ scanAnimFrame=requestAnimationFrame(tickScanner); return; }
  canvas.width=video.videoWidth; canvas.height=video.videoHeight;
  const ctx=canvas.getContext('2d'); ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
  const code=jsQR(imageData.data,imageData.width,imageData.height,{inversionAttempts:'dontInvert'});
  if(code&&code.data){
    const now=Date.now();
    if(code.data!==lastScanned||now-lastScannedTime>3000){ lastScanned=code.data; lastScannedTime=now; onCodeScanned(code.data); }
  }
  scanAnimFrame=requestAnimationFrame(tickScanner);
}
function onCodeScanned(raw){
  const code=normCode(raw);
  document.getElementById('scanCode').value=code;
  const s=document.getElementById('scanStatus');
  s.textContent='✓ Code detected: '+code; s.style.color='#22c55e';
  setTimeout(()=>{ if(s){ s.textContent='Scanning… point camera at QR code'; s.style.color='var(--blue)'; }},2500);
  setTimeout(scanMember,50);
  if(navigator.vibrate) navigator.vibrate([100,50,100]);
}
function maybeAutoStartScanner(){ if(/iPhone|iPad|Android/i.test(navigator.userAgent)) startScanner(); }
window.startScanner=startScanner; window.stopScanner=stopScanner;
window.flipCamera=flipCamera; window.maybeAutoStartScanner=maybeAutoStartScanner;

export { scanMember, startScanner, stopScanner, flipCamera, tickScanner, onCodeScanned, maybeAutoStartScanner };
