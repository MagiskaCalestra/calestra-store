// Minimal ljudmotor med både named och default export av audioEngine
const ctxRef = { ctx: null };
let current = null, gain = null, fading = null;

async function ensureCtx(){
  if (ctxRef.ctx) return ctxRef.ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  ctxRef.ctx = new Ctx(); return ctxRef.ctx;
}
async function decodeArrayBuffer(ctx,url){ const r=await fetch(url); const a=await r.arrayBuffer(); return await ctx.decodeAudioData(a); }

async function play(url,{loop=true,volume=0.15,fadeMs=800}={}){
  const ctx = await ensureCtx(); const buf = await decodeArrayBuffer(ctx,url);
  const src = ctx.createBufferSource(); src.buffer=buf; src.loop=loop;
  const g = ctx.createGain(); g.gain.value=0; src.connect(g); g.connect(ctx.destination); src.start();
  if(current){ try{current.stop();}catch{} } if(fading) cancelAnimationFrame(fading);
  current=src; gain=g;
  const start=performance.now(); const step=(t)=>{const p=Math.min(1,(t-start)/fadeMs); g.gain.value=volume*p; if(p<1) fading=requestAnimationFrame(step);};
  fading=requestAnimationFrame(step);
}
function pause({fadeMs=400}={}){ if(!gain||!current) return; const g=gain, s=current; const st=performance.now(); const from=g.gain.value;
  const step=(t)=>{const p=Math.min(1,(t-st)/fadeMs); g.gain.value=from*(1-p); if(p<1) requestAnimationFrame(step); else {try{s.stop();}catch{} if(gain===g) gain=null; if(current===s) current=null;}};
  requestAnimationFrame(step);}
function resume(){ if(ctxRef.ctx && ctxRef.ctx.state==="suspended") ctxRef.ctx.resume(); }
function isPlaying(){ return !!current; }

export const audioEngine = { play, pause, resume, isPlaying };
export { play, pause, resume, isPlaying };
export default audioEngine;
