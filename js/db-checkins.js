import { db, collection, addDoc, getDocs, serverTimestamp, query, where } from './config.js';
import { normCode, todayStr } from './utils.js';

// ============================================================
// FIRESTORE — CHECK-IN LOGS
// ============================================================
async function dbAddCheckIn(memberCode, memberName, pkgName, status){
  const now = new Date();
  await addDoc(collection(db,'checkins'),{
    memberCode: normCode(memberCode), memberName, pkgName, status,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}),
    timestamp: serverTimestamp()
  });
}
async function dbGetCheckInsByCode(code){
  try{
    const norm = normCode(code);
    // Query only this member's check-ins instead of downloading the whole
    // (ever-growing) checkins collection every time someone views a profile.
    const q = query(collection(db,'checkins'), where('memberCode','==',norm));
    const snap = await getDocs(q);
    return snap.docs
      .map(d=>({_id:d.id,...d.data()}))
      .sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  }catch(e){ return []; }
}
async function dbGetTodayCheckIns(){
  try{
    const today = todayStr();
    const snap = await getDocs(collection(db,'checkins'));
    return snap.docs
      .map(d=>({_id:d.id,...d.data()}))
      .filter(d=>d.date===today)
      .sort((a,b)=>b.time.localeCompare(a.time));
  }catch(e){ return []; }
}
async function dbGetCheckInCount(code){
  const list = await dbGetCheckInsByCode(code);
  return list.length;
}


export { dbAddCheckIn, dbGetCheckInsByCode, dbGetTodayCheckIns, dbGetCheckInCount };
