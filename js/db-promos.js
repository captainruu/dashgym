import { db, collection, doc, getDocs, addDoc, deleteDoc, serverTimestamp } from './config.js';

// ============================================================
// FIRESTORE — PROMOS
// ============================================================
async function dbGetPromos(){
  try{
    const snap=await getDocs(collection(db,'promos'));
    return snap.docs.map(d=>({_id:d.id,...d.data()}));
  }catch(e){ return []; }
}
async function dbAddPromo(promo){
  const ref=await addDoc(collection(db,'promos'),{...promo,createdAt:serverTimestamp()});
  return ref.id;
}
async function dbDeletePromo(id){ await deleteDoc(doc(db,'promos',id)); }


export { dbGetPromos, dbAddPromo, dbDeletePromo };
