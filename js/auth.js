// ============================================================
// AUTH — member login (code-based) + admin login (Firebase Auth)
// Rewritten for the multi-page structure: instead of toggling
// hidden <div> "pages" inside one document, each flow now
// navigates to its own real HTML file.
// ============================================================
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './config.js';
import { dbGetMemberByCode } from './db-members.js';
import { showLoading, hideLoading, showToast, setMemberSession, getMemberSession, clearMemberSession } from './utils.js';

// ---- Member login (login.html) ----
async function doLogin(){
  const code=(document.getElementById('loginCode').value||'').trim();
  if(!code){ showToast('Enter your member code'); return; }
  showLoading('Checking membership…');
  const m=await dbGetMemberByCode(code);
  hideLoading();
  if(!m){ showToast('Invalid code. Please try again.'); return; }
  setMemberSession(m.code);
  window.location.href = 'member.html';
}

// ---- Admin login (admin-login.html) ----
async function doAdminLogin(){
  const email=(document.getElementById('adminEmail').value||'').trim();
  const pass=document.getElementById('adminPassword').value||'';
  if(!email||!pass){ showToast('Enter admin email & password'); return; }
  showLoading('Signing in…');
  try{
    await signInWithEmailAndPassword(auth, email, pass);
    hideLoading();
    window.location.href = 'admin.html';
  }catch(e){
    hideLoading();
    showToast('Login failed: invalid email or password');
  }
}

// ---- Logout (used from member.html and admin.html) ----
async function doLogout(){
  clearMemberSession();
  try{ await signOut(auth); }catch(e){ /* not an admin session, fine */ }
  window.location.href = 'index.html';
}

// ---- Page guards ----
// Call at the top of member.html's script: redirects to login.html
// if there's no active member session, otherwise resolves with the code.
function requireMemberSession(){
  const code = getMemberSession();
  if(!code){ window.location.href = 'login.html'; return null; }
  return code;
}

// Call at the top of admin.html's script: redirects to admin-login.html
// if Firebase Auth has no signed-in user. Returns a Promise<User|null>.
function requireAdminAuth(){
  return new Promise((resolve)=>{
    const unsub = onAuthStateChanged(auth, (user)=>{
      unsub();
      if(!user){ window.location.href = 'admin-login.html'; resolve(null); }
      else resolve(user);
    });
  });
}

window.doLogin=doLogin; window.doAdminLogin=doAdminLogin; window.doLogout=doLogout;

export { doLogin, doAdminLogin, doLogout, requireMemberSession, requireAdminAuth };
