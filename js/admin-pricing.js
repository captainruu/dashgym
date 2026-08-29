// Used only by admin.html — Pricing tab (edit package prices/promos).
import { showLoading, hideLoading, showToast } from './utils.js';
import { dbGetPackages, dbSavePackages } from './db-packages.js';
import { renderPackages } from './public-site.js';

// ============================================================
// ADMIN — PRICING
// ============================================================
async function renderPricingAdmin(){
  const pkgs=await dbGetPackages();
  document.getElementById('pricingTbody').innerHTML=pkgs.map(p=>`
    <tr>
      <td>${p.name}</td><td>${p.days} day(s)</td>
      <td><input class="price-input" type="number" id="price-${p.id}" value="${p.price}"></td>
      <td><input class="price-input" style="width:180px;" type="text" id="promo-${p.id}" value="${p.promo||''}"></td>
    </tr>`).join('');
}
async function savePricing(){
  showLoading('Saving prices…');
  const pkgs=await dbGetPackages();
  pkgs.forEach(p=>{
    const inp=document.getElementById('price-'+p.id);
    const pr=document.getElementById('promo-'+p.id);
    if(inp) p.price=Number(inp.value);
    if(pr) p.promo=pr.value;
  });
  await dbSavePackages(pkgs);
  window._pkgCache=pkgs;
  hideLoading();
  await renderPackages();
  showToast('Prices updated & synced! ✓');
}
window.renderPricingAdmin=renderPricingAdmin; window.savePricing=savePricing;


export { renderPricingAdmin, savePricing };
