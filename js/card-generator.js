// Used by member.html (view/download own card) and admin.html
// (view a member's card from the member-details panel).
import { LOGO_GOLD_URL } from './config.js';
import { showToast, showLoading, hideLoading } from './utils.js';
import { dbGetMemberByCode } from './db-members.js';

// ============================================================
// DIGITAL MEMBER CARD
// ============================================================
let _dcMember = null;

// Helper: draw rounded-rect clipping path
function _roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// Render card to an offscreen Canvas and return it
async function renderCardToCanvas(member){
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const GOLD = '#cfb58c';

  // ── White body background ──
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // ── Black header ──
  const headerH = 260;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, headerH);

  // ── Gold DASH logo, centered in header, aspect-fit (no stretch) ──
  await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = W * 0.62, maxH = headerH * 0.5;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const dw = img.width * ratio, dh = img.height * ratio;
      ctx.drawImage(img, (W - dw) / 2, (headerH - dh) / 2, dw, dh);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = LOGO_GOLD_URL;
  });

  // ── QR code, bordered square box ──
  const qrDataUrl = await new Promise((resolve) => {
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(tmp);
    const qr = new QRCode(tmp, {text: member.code, width:400, height:400, colorDark:'#000000', colorLight:'#ffffff'});
    setTimeout(() => {
      const qCanvas = tmp.querySelector('canvas');
      const url = qCanvas ? qCanvas.toDataURL('image/png') : null;
      document.body.removeChild(tmp);
      resolve(url);
    }, 150);
  });
  const qSize = 420, qX = (W - qSize) / 2, qY = headerH + 70;
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 4;
  ctx.strokeRect(qX, qY, qSize, qSize);
  if(qrDataUrl){
    await new Promise((resolve) => {
      const qImg = new Image();
      qImg.onload = () => {
        const pad = 24;
        ctx.drawImage(qImg, qX+pad, qY+pad, qSize-pad*2, qSize-pad*2);
        resolve();
      };
      qImg.onerror = () => resolve();
      qImg.src = qrDataUrl;
    });
  }

  // ── Member ID label ──
  let y = qY + qSize + 90;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `600 26px Arial, sans-serif`;
  ctx.fillText('MEMBER ID', W/2, y);
  y += 46;
  ctx.font = `700 30px Arial, sans-serif`;
  ctx.fillText(member.code.toUpperCase(), W/2, y);

  // ── Member Name, large gold bold ──
  y += 90;
  ctx.fillStyle = GOLD;
  ctx.font = `900 58px Arial, sans-serif`;
  ctx.fillText(member.name.toUpperCase(), W/2, y);

  // ── Expiry date ──
  y += 90;
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `600 24px Arial, sans-serif`;
  ctx.fillText('EXPIRY DATE', W/2, y);
  y += 42;
  ctx.font = `700 28px Arial, sans-serif`;
  ctx.fillText(member.expiryDate, W/2, y);

  // ── Package (small footer) ──
  ctx.fillStyle = '#999999';
  ctx.font = `500 22px Arial, sans-serif`;
  ctx.fillText(member.pkgName.toUpperCase() + '  ·  DASH GYM BALI', W/2, H - 50);

  return c;
}

async function showDigitalCard(code){
  showLoading('Generating card…');
  const m = await dbGetMemberByCode(code);
  hideLoading();
  if(!m){ showToast('Member not found'); return; }
  _dcMember = m;

  // Fill preview card fields
  document.getElementById('dcIdLabel').textContent = m.code;
  document.getElementById('dcName').textContent    = m.name.toUpperCase();
  document.getElementById('dcExpiry').textContent  = m.expiryDate;
  document.getElementById('dcPkg').textContent     = m.pkgName.toUpperCase();
  document.getElementById('dcWABtn').innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:6px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Send via WhatsApp';

  // Update logo in preview card to new high-res
  const dcLogo = document.getElementById('dcLogo');
  if(dcLogo) dcLogo.src = LOGO_GOLD_URL;

  // Generate QR inside preview card
  const qrEl = document.getElementById('dcQR');
  qrEl.innerHTML = '';
  new QRCode(qrEl, {text: m.code, width:130, height:130, colorDark:'#000', colorLight:'#fff'});

  document.getElementById('memberCardModal').style.display = 'flex';
}
window.showDigitalCard = showDigitalCard;

async function downloadMemberCard(){
  if(!_dcMember){ showToast('No member loaded'); return; }
  try {
    showLoading('Rendering card…');
    const canvas = await renderCardToCanvas(_dcMember);
    hideLoading();
    const link = document.createElement('a');
    link.download = `DASH-Card-${_dcMember.code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✓ Card downloaded!');
  } catch(e) {
    hideLoading();
    console.error(e);
    showToast('⚠ Download failed: ' + e.message);
  }
}
window.downloadMemberCard = downloadMemberCard;

function sendCardViaWA(){
  if(!_dcMember) return;
  const rawPhone = (_dcMember.phone||'').trim();
  if(!rawPhone){ showToast('⚠ No phone number for this member'); return; }
  let phone = rawPhone.replace(/[^0-9+]/g,'');
  if(phone.startsWith('+')) phone = phone.slice(1);
  if(phone.startsWith('08')) phone = '62' + phone.slice(1);
  if(!phone.startsWith('62')) phone = '62' + phone;
  const msg = `Hello ${_dcMember.name}! \n\nHere is your membership package information:\n\n Member ID: ${_dcMember.code}\n Package: ${_dcMember.pkgName}\n Valid until: ${_dcMember.expiryDate}\n\nPlease show your QR code at check-in.\n\nRegards,\nDash Gym Bali`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');
  showToast('Opening WhatsApp…');
}
window.sendCardViaWA = sendCardViaWA;


export { renderCardToCanvas, showDigitalCard, downloadMemberCard, sendCardViaWA };
