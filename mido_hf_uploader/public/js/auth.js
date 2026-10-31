let clicks=0;
const secret=document.querySelector('#secret'), entrance=document.querySelector('#entrance');
secret.addEventListener('click',()=>{
  if (++clicks !== 5) return;
  try { const C=window.AudioContext||window.webkitAudioContext; const ctx=new C(); const o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(530,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(790,ctx.currentTime+.1); g.gain.setValueAtTime(.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.07,ctx.currentTime+.025); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.22); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+.23); o.onended=()=>ctx.close(); } catch {}
  entrance.hidden=false; requestAnimationFrame(()=>entrance.classList.add('visible')); document.querySelector('#password').focus();
});
document.querySelector('#login-form').addEventListener('submit',async e=>{
  e.preventDefault(); const button=e.currentTarget.querySelector('button'), error=document.querySelector('#login-error'); button.disabled=true; error.textContent='';
  try { const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.querySelector('#password').value})}); const data=await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to sign in.'); location.href='/dashboard'; } catch(err) { error.textContent=err.message || 'Unable to sign in.'; button.disabled=false; }
});
