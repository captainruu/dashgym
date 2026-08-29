import { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from './config.js';
import { normCode, showToast } from './utils.js';

// ============================================================
// FIRESTORE — MEMBERS
// ============================================================
async function dbGetMembers(){
  try{
    const snap = await getDocs(collection(db,'members'));
    return snap.docs.map(d=>({_id:d.id,...d.data()}));
  }catch(e){ console.error(e); showToast('⚠ DB error: '+e.code); return []; }
}
async function dbGetMemberByCode(code){
  try{
    const norm = normCode(code);
    const docId = norm.replace(/[^A-Z0-9\-]/g,'_');
    // Fast path: member doc IDs are derived from their code, so this is a
    // single-document read (1 quota unit) regardless of how many members exist.
    const direct = await getDoc(doc(db,'members',docId));
    if(direct.exists()) return {_id:direct.id,...direct.data()};
    // Fallback for any legacy/mismatched doc IDs: indexed equality query,
    // still only reads the matching document(s), not the whole collection.
    const q = query(collection(db,'members'), where('code','==',norm));
    const qsnap = await getDocs(q);
    if(!qsnap.empty){ const d=qsnap.docs[0]; return {_id:d.id,...d.data()}; }
    return null;
  }catch(e){ return null; }
}
async function dbSaveMember(member){
  const docId = member.code.replace(/[^a-zA-Z0-9\-]/g,'_');
  await setDoc(doc(db,'members',docId),{...member, updatedAt:serverTimestamp()});
  return docId;
}
async function dbUpdateMember(code, data){
  const m = await dbGetMemberByCode(code);
  if(!m) return;
  await updateDoc(doc(db,'members',m._id),{...data, updatedAt:serverTimestamp()});
}
async function dbDeleteMember(code){
  const m = await dbGetMemberByCode(code);
  if(!m) return;
  await deleteDoc(doc(db,'members',m._id));
}


export { dbGetMembers, dbGetMemberByCode, dbSaveMember, dbUpdateMember, dbDeleteMember };
