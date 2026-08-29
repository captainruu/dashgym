import { db, doc, getDocs, setDoc, DEFAULT_PACKAGES } from './config.js';

// ============================================================
// FIRESTORE — PACKAGES
// ============================================================
async function dbGetPackages(){
  try{
    const snap = await getDocs(collection(db,'packages'));
    if(snap.empty){ await dbSeedPackages(); return DEFAULT_PACKAGES; }
    const pkgs = snap.docs.map(d=>({_id:d.id,...d.data()}));
    pkgs.sort((a,b)=>a.price-b.price);
    return pkgs;
  }catch(e){ return DEFAULT_PACKAGES; }
}

async function dbSeedPackages(){
  for(const p of DEFAULT_PACKAGES) await setDoc(doc(db,'packages',p.id),p);
}
async function dbSavePackages(pkgs){
  for(const p of pkgs){
    const id=p.id||p._id; if(!id) continue;
    const {_id,...data}=p;
    await setDoc(doc(db,'packages',id),data);
  }
}


export { dbGetPackages, dbSeedPackages, dbSavePackages };
