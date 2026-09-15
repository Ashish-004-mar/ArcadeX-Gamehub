const UKEY='gamehub_users',CKEY='gamehub_current_user';
const users=()=>JSON.parse(localStorage.getItem(UKEY)||'[]');
const save=u=>localStorage.setItem(UKEY,JSON.stringify(u));

function init(){
  const msg=document.getElementById('authMessage'),lf=document.getElementById('loginForm'),rf=document.getElementById('registerForm');
  if(lf) lf.onsubmit=async e=>{
    e.preventDefault();
    msg.textContent='';
    const email=document.getElementById('loginEmail').value.trim().toLowerCase();
    const password=document.getElementById('loginPassword').value;

    // Check the same normal login endpoint for the administrator first.
    // The administrator password is never embedded in client-side code.
    try{
      const response=await fetch(lf.action || '/login',{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'},
        body:new URLSearchParams({email,password})
      });
      const result=await response.json();
      if(result.admin){
        // The administrator can also use the site as a player. Keep a separate
        // browser-local player identity so admin favorites/history never need a DB user.
        localStorage.setItem('gamehub_admin_player_mode','1');
        localStorage.removeItem('gamehub_after_login');
        localStorage.removeItem('gamehub_login_reason');
        location=result.redirect || '/admin-dashboard';
        return;
      }
    }catch(error){
      // If the server check is unavailable, continue with browser-only user auth.
    }

    const u=users().find(x=>x.email===email&&x.password===password);
    if(!u){msg.textContent='Invalid email or password.';return}
    u.lastLoginAt=new Date().toISOString();
    save(users().map(x=>x.id===u.id?u:x));
    localStorage.setItem(CKEY,u.id);
    localStorage.removeItem('gamehub_admin_player_mode');
    const next=localStorage.getItem('gamehub_after_login')||'/dashboard';
    localStorage.removeItem('gamehub_after_login');
    localStorage.removeItem('gamehub_login_reason');
    location=next;
  };
  if(rf) rf.onsubmit=e=>{
    e.preventDefault();
    const fullName=document.getElementById('fullName').value.trim(),username=document.getElementById('username').value.trim(),email=document.getElementById('email').value.trim().toLowerCase(),password=document.getElementById('password').value,confirm=document.getElementById('confirmPassword').value;
    let us=users();
    if(!fullName||!username||!email||!password||!confirm){msg.textContent='Please complete all fields.';return}
    if(!/^\S+@\S+\.\S+$/.test(email)){msg.textContent='Enter a valid email address.';return}
    if(password!==confirm){msg.textContent='Passwords do not match.';return}
    if(us.some(x=>x.email===email||x.username.toLowerCase()===username.toLowerCase())){msg.textContent='Username or email already exists.';return}
    const u={id:crypto.randomUUID(),fullName,username,email,password,createdAt:new Date().toISOString(),lastLoginAt:new Date().toISOString()};
    us.push(u);save(us);localStorage.setItem(CKEY,u.id);
    localStorage.removeItem('gamehub_admin_player_mode');
    const next=localStorage.getItem('gamehub_after_login')||'/dashboard';
    localStorage.removeItem('gamehub_after_login');
    localStorage.removeItem('gamehub_login_reason');
    location=next;
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
