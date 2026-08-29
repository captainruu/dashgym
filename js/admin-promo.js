// Used only by admin.html — Promo & Events tab (upload artwork to
// Supabase Storage, publish/delete promos).
import { supabase, PROMO_BUCKET } from './config.js';
import { showLoading, hideLoading, showToast } from './utils.js';
import { dbGetPromos, dbAddPromo, dbDeletePromo } from './db-promos.js';
import { renderPromos } from './public-site.js';

// ADMIN — PROMO
// ============================================================
let _promoImgFile = null;
function previewPromoImg(evt){
  const file = evt.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Please select an image file'); evt.target.value=''; return; }
  if(file.size > 5*1024*1024){ showToast('Image must be under 5MB'); evt.target.value=''; return; }
  _promoImgFile = file;
  const reader = new FileReader();
  reader.onload = (e)=>{
    document.getElementById('promoImgPreview').src = e.target.result;
    document.getElementById('promoImgPreviewWrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}
function clearPromoImg(){
  _promoImgFile = null;
  document.getElementById('promoImgFile').value = '';
  document.getElementById('promoImgPreviewWrap').style.display = 'none';
}
window.previewPromoImg = previewPromoImg; window.clearPromoImg = clearPromoImg;

async function renderPromoAdmin(){
  const promos=await dbGetPromos();
  window._promoAdminCache = promos;
  const list=document.getElementById('adminPromoList');
  if(!promos.length){ list.innerHTML='<p style="font-size:13px;color:var(--gray);padding:1rem;">No promos yet.</p>'; return; }
  list.innerHTML=promos.map(pr=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;border-bottom:1px solid var(--border);gap:1rem;">
      ${pr.img?`<img src="${pr.img}" style="width:48px;height:48px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`:''}
      <div style="flex:1;"><strong style="font-family:var(--font-cond);">${pr.title}</strong><br><small style="color:var(--gray);">${(pr.desc||'').substring(0,60)}…</small></div>
      <button class="action-btn danger" onclick="deletePromo('${pr._id}')">Delete</button>
    </div>`).join('');
}
async function addPromo(){
  const title=document.getElementById('promoTitle').value.trim();
  const desc=document.getElementById('promoDesc').value.trim();
  const urlInput=document.getElementById('promoImg').value.trim();
  const tag=document.getElementById('promoTag').value.trim();
  if(!title){ showToast('Please enter a title'); return; }

  let img = urlInput;
  let imgPath = '';

  if(_promoImgFile){
    showLoading('Uploading artwork…');
    try{
      const path = `${Date.now()}_${_promoImgFile.name.replace(/[^a-zA-Z0-9.\-_]/g,'_')}`;
      const { error: upErr } = await supabase.storage.from(PROMO_BUCKET).upload(path, _promoImgFile, { cacheControl: '3600', upsert: false });
      if(upErr) throw upErr;
      const { data: pub } = supabase.storage.from(PROMO_BUCKET).getPublicUrl(path);
      img = pub.publicUrl;
      imgPath = path;
    }catch(e){
      hideLoading();
      showToast('⚠ Upload failed: '+(e.message||e));
      return;
    }
  }

  showLoading('Publishing…');
  await dbAddPromo({title,desc,img,imgPath,tag});
  hideLoading();
  await renderPromos(); await renderPromoAdmin();
  ['promoTitle','promoDesc','promoImg','promoTag'].forEach(id=>document.getElementById(id).value='');
  clearPromoImg();
  showToast('Promo published! ✓');
}
async function deletePromo(id){
  if(!confirm('Delete this promo?')) return;
  showLoading('Deleting…');
  try{
    const promos = window._promoAdminCache || await dbGetPromos();
    const pr = promos.find(p=>p._id===id);
    if(pr && pr.imgPath){
      try{ await supabase.storage.from(PROMO_BUCKET).remove([pr.imgPath]); }
      catch(e){ console.warn('Storage cleanup skipped:', e); }
    }
  }catch(e){}
  await dbDeletePromo(id); hideLoading();
  await renderPromos(); await renderPromoAdmin();
  showToast('Promo deleted');
}
window.renderPromoAdmin=renderPromoAdmin; window.addPromo=addPromo; window.deletePromo=deletePromo;


export { previewPromoImg, clearPromoImg, renderPromoAdmin, addPromo, deletePromo };
