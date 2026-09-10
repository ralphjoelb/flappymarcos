/* ================================================================
   GHOST PROJECT v2 - Political Satire Game
   You are the ghost of a project that never existed: funded,
   declared completed, never built. Haunt the infrastructure.
   Dodge issues. Avoid accountability.
   ================================================================ */

const CFG = { W: 420, H: 750, GRAV: 0.42, FLAP: -7.6, BASE_SPD: 2.5, GAP_BASE: 200 };

const RANKS = [
  [10,'LOCAL ISSUE'],[25,'NATIONAL ISSUE'],[50,'PRESS CONFERENCE'],
  [100,'SYSTEMIC'],[250,'CERTIFIED GHOST'],[500,'STILL FLYING'],
  [1000,'HOW ARE YOU STILL FLYING?']
];

const MILESTONES = [
  [5,'KEEP FLYING.'],[10,'NOTHING TO SEE HERE.'],[20,'STAY THE COURSE.'],
  [35,'TRUST THE PROCESS.'],[50,'INVESTIGATION ONGOING.'],
  [75,'ACCOUNTABILITY? NEVER MET HER.'],[100,'SYSTEMIC.'],
  [150,'THE PESO IS FINE.'],[200,'JUST ONE MORE TERM.'],
  [300,'HISTORY WILL JUDGE. LATER. MUCH LATER.'],[400,'SURVEYS ARE JUST NUMBERS.'],
  [500,'STILL FLYING.'],[750,'THE WALLS ARE FLYING TOO.'],
  [1000,'HOW ARE YOU STILL FLYING?']
];

const STAMPS = ['APPROVED','URGENT','FOR REVIEW','CONFIDENTIAL','AUDIT','UNDER INVESTIGATION'];
const BILLBOARD_TEXTS = ['SANA ALL INFRASTRUCTURE','PROGRESS SOON!','UNDER REPAIR SINCE 1998','VOTE WISELY. OR NOT.'];

const PRESS_STATEMENTS = [
  '"We are looking into it."',
  '"An investigation is ongoing."',
  '"We have already instructed the appropriate agencies."',
  '"We will get to the bottom of this."',
  '"The numbers speak for themselves. Quietly."',
  '"Now more than ever, unity."',
  '"That photo is taken out of context. The flood is in context."'
];

const HEADLINES = [
  'BREAKING: GHOST VANISHES MID-FLIGHT',
  'BREAKING: FLOOD CONTROLS NOT FOUND',
  'BREAKING: POWER OUTAGE CONFIRMED',
  'BREAKING: PESO FALLS, HERO FALLS FURTHER',
  'BREAKING: INVESTIGATION CLOSED. NO ONE KNOWS WHO CLOSED IT.',
  'BREAKING: BUDGET HEARING ENDS IN SNACKS'
];

const DEATH_TEXT = {
  ground:  'BUDGET EXHAUSTED.',
  wall:    'FLOODED.',
  pylon:   'BROWNOUT.',
  water:   'FLOODED.',
  doc:     'PRESS CONFERENCE FAILED.',
  default: 'ACCOUNTABILITY HAS ARRIVED.'
};

let audio;
let game;

function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function progress(score){ return clamp(score/500, 0, 1); }
function rand(a,b)       { return Math.random()*(b-a)+a; }
function randInt(a,b)    { return Math.floor(rand(a,b+1)); }
function lerp(a,b,t)     { return a+(b-a)*t; }
function pick(arr)       { return arr[randInt(0, arr.length-1)]; }
function fmtTime(sec)    { sec=Math.max(0,Math.floor(sec)); return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0'); }
function rankFor(score){
  var rank=null;
  for(var i=0;i<RANKS.length;i++){ if(score>=RANKS[i][0]) rank=RANKS[i]; }
  return rank;
}

function loadImage(src) {
  return new Promise(r => {
    const i = new Image();
    i.onload = () => r(i);
    i.onerror = () => r(null);
    i.src = src;
  });
}

/* ================================================================
   THE GHOST — protagonist. The ghost of a project that never
   existed: a hard hat floating over a wavy sheet. Drawn entirely
   in code (original character art — see docs/ASSET_REGISTER.md).
   ================================================================ */
function drawGhostSprite(ctx, r, opts){
  var silhouette = !!(opts && opts.silhouette);
  var t = (opts && opts.t) || Date.now()/1000;
  // faint ambient glow
  if(!silhouette){
    var glow=ctx.createRadialGradient(0,0,r*0.5,0,0,r*2.1);
    glow.addColorStop(0,'rgba(245,240,232,0.22)');
    glow.addColorStop(1,'rgba(245,240,232,0)');
    ctx.fillStyle=glow;
    ctx.beginPath(); ctx.arc(0,0,r*2.1,0,Math.PI*2); ctx.fill();
  }
  // body: dome top + scalloped hem that drifts like a sheet
  var hem = r*0.78 + Math.sin(t*3)*1.5;
  ctx.beginPath();
  ctx.arc(0, -r*0.12, r, Math.PI, 0);
  ctx.lineTo(r, hem);
  for(var i=0;i<3;i++){
    var cpX = r - (2*i+1)*(r/3);
    var endX = r - (i+1)*(2*r/3);
    ctx.quadraticCurveTo(cpX, hem + r*0.24, endX, hem);
  }
  ctx.closePath();
  if(silhouette){
    ctx.fillStyle='#0a0a0f';
    ctx.fill();
    ctx.strokeStyle='rgba(255,215,0,.55)';
    ctx.lineWidth=2;
    ctx.stroke();
    return;
  }
  ctx.fillStyle='rgba(246,243,233,0.96)';
  ctx.fill();
  ctx.strokeStyle='rgba(16,20,40,0.45)';
  ctx.lineWidth=1.5;
  ctx.stroke();
  // oval eyes (occasional blink)
  var blink = Math.sin(t*2.1)>0.97 ? 0.18 : 1;
  ctx.fillStyle='#10141f';
  for(var e=-1;e<=1;e+=2){
    ctx.beginPath();
    ctx.ellipse(e*r*0.33, -r*0.34, r*0.13, r*0.24*blink, 0, 0, Math.PI*2);
    ctx.fill();
  }
  // tiny distressed mouth
  ctx.beginPath();
  ctx.arc(0, r*0.1, r*0.09, 0, Math.PI*2);
  ctx.fillStyle='#10141f';
  ctx.fill();
  // askew hard hat — the worker the project never hired
  ctx.save();
  ctx.rotate(-0.16);
  ctx.fillStyle='#F2C94C';
  ctx.beginPath();
  ctx.arc(r*0.08, -r*1.02, r*0.4, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-r*0.36, -r*1.04, r*0.9, r*0.09);
  ctx.restore();
}

/* ================================================================
   AUDIO — patriotic loop that decays into chaos
   ================================================================ */
class AudioEngine {
  constructor() { this.ctx=null; this.on=true; this.musicOn=true; this.haptics=true; this.running=false; this._int=null; this._buzz=null; }
  init() {
    if(!this.ctx){
      try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){ this.on=false; }
    }
    if(this.ctx && this.ctx.state==='suspended') this.ctx.resume();
  }
  chaChing() {
    var self=this;
    this.chime(1318,0.12,0.12,'square');
    setTimeout(function(){ self.chime(1760,0.18,0.1,'square'); },80);
    this.noise(0.08,0.1,4200);
  }
  chime(freq, dur, vol, type) {
    vol = vol || 0.12;
    type = type || 'triangle';
    if(!this.on || !this.ctx) return;
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator();
    const g=this.ctx.createGain();
    o.type=type;
    o.frequency.value=freq;
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vol,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t+dur+0.05);
  }
  noise(dur, vol, filterFreq) {
    if(!this.on || !this.ctx) return;
    var ctx=this.ctx, t=ctx.currentTime;
    var len=Math.max(1,Math.floor(ctx.sampleRate*dur));
    var buf=ctx.createBuffer(1,len,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<len;i++) d[i]=Math.random()*2-1;
    var src=ctx.createBufferSource(); src.buffer=buf;
    var f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=filterFreq||1800; f.Q.value=0.7;
    var g=ctx.createGain();
    g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t+dur+0.02);
  }
  flap()   { this.chime(500, 0.1, 0.12, 'triangle'); if(this.haptics && navigator.vibrate) navigator.vibrate(15); }
  score()  { var self=this; [880,1320].forEach(function(f,i){ setTimeout(function(){self.chime(f,0.15,0.08);}, i*60); }); }
  milestone(){ var self=this; [660,880,1100].forEach(function(f,i){ setTimeout(function(){self.chime(f,0.2,0.1);}, i*90); }); }
  shutter(){ this.noise(0.06,0.25,2600); var self=this; setTimeout(function(){ self.noise(0.05,0.2,1800); },70); }
  klaxon() { var self=this; [0,450].forEach(function(dl){ setTimeout(function(){ self.chime(175,0.32,0.14,'sawtooth'); },dl); }); }
  click()  { this.chime(1250,0.05,0.2,'square'); }
  splash() { this.noise(0.5,0.3,500); }
  die()    { var self=this; [220,175,130].forEach(function(f,i){ setTimeout(function(){self.chime(f,0.25,0.1,'sawtooth');}, i*80); }); }
  blackoutStart() { this.stopMusic(); this._startBuzz(); }
  blackoutEnd()   { this._stopBuzz(); this.click(); this.startMusic(); }
  _startBuzz() {
    if(!this.on || !this.ctx || this._buzz) return;
    var ctx=this.ctx;
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sawtooth'; o.frequency.value=52;
    g.gain.setValueAtTime(0.001,ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05,ctx.currentTime+0.15);
    o.connect(g); g.connect(ctx.destination); o.start();
    this._buzz={o:o,g:g};
  }
  _stopBuzz() {
    if(!this._buzz) return;
    try{
      var t=this.ctx.currentTime;
      this._buzz.g.gain.linearRampToValueAtTime(0.0001,t+0.08);
      this._buzz.o.stop(t+0.1);
    }catch(e){}
    this._buzz=null;
  }
  startMusic(){ this.running=true; if(!this.ctx||!this.musicOn) return; this._playLoop(); }
  stopMusic(){ this.running=false; if(this._int) clearTimeout(this._int); }
  _playLoop() {
    if(!this.running || !this.musicOn || !this.ctx) return;
    var self=this;
    var p = (window.game && game.state!=='menu') ? progress(game.score) : 0;
    var step = lerp(0.35, 0.2, p);            // tempo increases with chaos
    var t=this.ctx.currentTime+0.05;
    var notes=[130.8,146.8,164.8,196,220,196,164.8,146.8,130.8];
    for(var i=0; i<notes.length; i++){
      var f=notes[i];
      if(p>0.5 && i%4===3) f*=1.059;          // slightly wrong notes as things decay
      if(p>0.8 && i%2===1) f*=0.94;
      var o=self.ctx.createOscillator();
      var g=self.ctx.createGain();
      o.type='triangle';
      o.frequency.value=f;
      g.gain.setValueAtTime(0.0001, t+i*step);
      g.gain.linearRampToValueAtTime(0.035+p*0.02, t+i*step+0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t+i*step+step*0.85);
      o.connect(g);
      g.connect(self.ctx.destination);
      o.start(t+i*step);
      o.stop(t+i*step+step*0.9+0.05);
    }
    self._int=setTimeout(function(){ if(self.running && self.musicOn) self._playLoop(); }, notes.length*step*1000-150);
  }
}

/* ================================================================
   PLAYER
   ================================================================ */
class Player {
  constructor() { this.x=CFG.W*0.3; this.y=CFG.H*0.45; this.vy=0; this.r=22; this.angle=0; this.alive=true; this.img=null; this.squash=0; this.spinV=0; }
  reset()      { this.x=CFG.W*0.3; this.y=CFG.H*0.45; this.vy=0; this.alive=true; this.angle=0; this.squash=0; this.spinV=0; }
  flap()       { this.vy=CFG.FLAP; this.squash=1; if(audio && audio.on) audio.flap(); }
  update(dt) {
    if(!this.alive) return;
    this.vy += CFG.GRAV * dt * 60;
    this.y  += this.vy;
    this.squash = Math.max(0, this.squash - dt*5);
    this.angle = clamp(this.vy*0.04, -0.55, 1.2);
  }
  collide(oob) {
    // hitbox slightly smaller than the sprite — reads fair, plays forgiving
    var cr=this.r*0.82;
    var l=this.x-cr, r2=this.x+cr, t=this.y-cr, b2=this.y+cr;
    return oob.hitboxCheck(l, r2, t, b2);
  }
  draw(ctx, silhouette) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(1+0.14*this.squash, 1-0.2*this.squash);
    var r=this.r;
    // soft drop shadow blob
    if(!silhouette){
      ctx.save();
      ctx.translate(0, r+34);
      ctx.scale(1, 0.28);
      ctx.beginPath(); ctx.arc(0,0,r*0.8,0,Math.PI*2);
      ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fill();
      ctx.restore();
    }
    if(this.img){
      // character art hook: a transparent PNG (assets/characters/) drawn
      // over the hitbox. The code-drawn ghost is the default art.
      ctx.drawImage(this.img, -r*1.15, -r*1.15, r*2.3, r*2.3);
    } else {
      drawGhostSprite(ctx, r, { silhouette: silhouette, t: Date.now()/1000 });
    }
    ctx.restore();
  }
}

/* ================================================================
   OBSTACLES
   ================================================================ */
class FloodWall {
  constructor(x, gapY, kind) {
    var gameScore = (game && game.score !== undefined) ? game.score : 0;
    this.x = x;
    this.kind = (game && game.score>60 && Math.random()<0.3) ? 'pylon' : 'flood';
    this.gapY = clamp(gapY, CFG.H*0.25, CFG.H*0.65);
    this.W = 58;
    this.passed = false;
    this.gapH = Math.max(CFG.GAP_BASE - progress(gameScore)*40, 150);
    this.completedSign = this.kind==='flood' && Math.random()<0.35; // satire: "completed" while visibly broken
    this.blink = Math.random()*10;
  }
  hitboxCheck(l, r, t, b) {
    var hw=this.W/2;
    if (r > this.x-hw && l < this.x+hw) {
      var topBot = this.gapY - this.gapH/2;
      var botTop = this.gapY + this.gapH/2;
      if (b < topBot) return true;
      if (t > botTop) return true;
    }
    return false;
  }
  draw(ctx) {
    var hw = this.W/2;
    var top = this.gapY - this.gapH/2;
    var bot = this.gapY + this.gapH/2;
    var gameScore2 = (game && game.score !== undefined) ? game.score : 0;
    var dmg = progress(Math.min(gameScore2, 300));
    if(this.kind==='pylon'){ this._drawPylon(ctx, hw, top, bot); return; }
    // concrete pillar (top)
    ctx.fillStyle='#8A857C';
    ctx.fillRect(this.x-hw, -100, hw*2, top+100);
    // concrete texture + cracks
    ctx.fillStyle='rgba(0,0,0,.08)';
    for(var s=0; s<3; s++) ctx.fillRect(this.x-hw+8+s*18, 0, 3, top);
    if (dmg > 0.1) {
      ctx.strokeStyle='#6a6560';
      ctx.lineWidth=1;
      for(var i=0; i<Math.floor(dmg*4)+1; i++) {
        var cx = this.x-hw+rand(5, hw*2-10);
        var cy = top-rand(0, 40);
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.lineTo(cx+rand(-6,6), cy+rand(4,30));
        ctx.stroke();
        // exposed rebar
        if(dmg>0.4 && i%2===0){
          ctx.strokeStyle='#7a4a3a';
          ctx.beginPath();
          ctx.moveTo(cx+2, cy+6);
          ctx.lineTo(cx+4, cy+14);
          ctx.stroke();
          ctx.strokeStyle='#6a6560';
        }
      }
    }
    // project sign plate (above the top cap lip) — generic descriptive
    // text on amber hazard styling: deliberately not an official-sign lookalike
    ctx.save();
    ctx.translate(this.x, Math.max(top-52, 26));
    ctx.fillStyle='#B45309';
    ctx.fillRect(-62,-11,124,22);
    ctx.strokeStyle='#1a1a2e';
    ctx.lineWidth=1.5;
    ctx.strokeRect(-62,-11,124,22);
    ctx.fillStyle='#F5F0E8';
    ctx.font='bold 7.5px "Space Grotesk",sans-serif';
    ctx.textAlign='center';
    ctx.fillText('FLOOD CONTROL PROJECT',0,3);
    ctx.restore();
    // top cap lip framing the gap
    ctx.fillStyle='#7A756E';
    ctx.fillRect(this.x-hw, top-20, hw*2, 20);
    // concrete pillar (bottom): the wall continues to the street
    ctx.fillStyle='#8A857C';
    ctx.fillRect(this.x-hw, bot+20, hw*2, CFG.H-bot);
    ctx.fillStyle='rgba(0,0,0,.08)';
    for(var s2=0; s2<3; s2++) ctx.fillRect(this.x-hw+8+s2*18, bot+24, 3, CFG.H-bot-24);
    // bottom cap lip
    ctx.fillStyle='#7A756E';
    ctx.fillRect(this.x-hw, bot, hw*2, 20);
    if(this.completedSign && dmg>0.2){
      ctx.save();
      ctx.translate(this.x, bot+46);
      ctx.fillStyle='#1a7a3c';
      ctx.fillRect(-58,-10,116,20);
      ctx.fillStyle='#F5F0E8';
      ctx.font='bold 7.5px "Space Grotesk",sans-serif';
      ctx.textAlign='center';
      ctx.fillText('PROJECT COMPLETED ✓',0,3);
      ctx.restore();
    }
  }
  _drawPylon(ctx, hw, top, bot) {
    ctx.strokeStyle='#3a3f4a';
    ctx.lineWidth=3;
    // top tower
    ctx.beginPath();
    ctx.moveTo(this.x-hw, -100); ctx.lineTo(this.x-hw+8, top);
    ctx.moveTo(this.x+hw, -100); ctx.lineTo(this.x+hw-8, top);
    ctx.stroke();
    ctx.lineWidth=1.5;
    for(var y=-80; y<top-8; y+=18){
      var sh = 8 * (1-(y+100)/(top+100));
      ctx.beginPath();
      ctx.moveTo(this.x-hw+sh, y);
      ctx.lineTo(this.x+hw-sh, y+18);
      ctx.moveTo(this.x+hw-sh, y);
      ctx.lineTo(this.x-hw+sh, y+18);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.x-hw+sh,y); ctx.lineTo(this.x+hw-sh,y); ctx.stroke();
    }
    // bottom tower
    ctx.strokeStyle='#3a3f4a';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(this.x-hw+8, bot); ctx.lineTo(this.x-hw, CFG.H+20);
    ctx.moveTo(this.x+hw-8, bot); ctx.lineTo(this.x+hw, CFG.H+20);
    ctx.stroke();
    ctx.lineWidth=1.5;
    for(var y2=bot+8; y2<CFG.H; y2+=18){
      ctx.beginPath();
      ctx.moveTo(this.x-hw, y2); ctx.lineTo(this.x+hw, y2+16);
      ctx.moveTo(this.x+hw, y2); ctx.lineTo(this.x-hw, y2+16);
      ctx.stroke();
    }
    // hazard light
    var blink = Math.sin(Date.now()/300 + this.blink) > 0;
    if(blink){
      ctx.fillStyle='#E53935';
      ctx.beginPath(); ctx.arc(this.x, top-6, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(this.x, bot+6, 3.5, 0, Math.PI*2); ctx.fill();
    }
  }
}

class FloatingObstacle {
  // kinds: peso | fuel | kwh | bill | doc | mic
  constructor(x, y, kind) {
    this.x=x; this.y=y; this.kind=kind||'peso';
    this.passed=false; this.bobPhase=rand(0,Math.PI*2);
    this.sinkV = this.kind==='peso' ? rand(6,14) : 0; // the peso visibly sinks
    var dims = { peso:[56,56], fuel:[70,54], kwh:[78,58], bill:[96,54], doc:[82,58], mic:[42,60] };
    this.w=dims[this.kind][0]; this.h=dims[this.kind][1];
    this.stamp = this.kind==='doc' ? pick(STAMPS) : null;
    this.price = '₱'+'?'.repeat(randInt(2,5));
    // bearish ₱/$ chart shape — jagged decline, deterministic per coin
    this._chartPts = [[0,0.08],[0.16,0.3],[0.3,0.24],[0.45,0.52],[0.58,0.46],[0.78,0.82],[1,0.95]];
    // live rising price tickers (fuel ₱/L, power ₱/kWh)
    this._t0 = Date.now() + rand(0,4000);
    this._pBase = this.kind==='fuel' ? 80 : 14;
  }
  update(dt) { this.y += this.sinkV*dt; }
  hitboxCheck(l, r, t, b) {
    return (r > this.x-this.w/2 && l < this.x+this.w/2) && (t < this.y+this.h/2 && b > this.y-this.h/2);
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(Date.now()/700 + this.bobPhase)*4);
    var w=this.w, h=this.h;
    switch(this.kind){
      case 'peso': this._drawPeso(ctx); break;
      case 'fuel': this._drawFuel(ctx); break;
      case 'kwh': this._drawKwh(ctx); break;
      case 'bill': this._drawBill(ctx); break;
      case 'doc': this._drawDoc(ctx); break;
      case 'mic': this._drawMic(ctx); break;
    }
    ctx.restore();
  }
  _label(ctx, text, w, y, small){
    ctx.fillStyle='#1a1a2e';
    ctx.font='bold '+(small?9:11)+'px "Space Grotesk",sans-serif';
    ctx.textAlign='center';
    ctx.fillText(text, 0, y);
  }
  _drawPeso(ctx){
    var r=this.w/2;
    // the coin itself, nudged up to make room for its ticker chart
    var g=ctx.createRadialGradient(-r*0.3,-r*0.3-10,r*0.1, 0,-10,r);
    g.addColorStop(0,'#FFD700'); g.addColorStop(1,'#B8860B');
    ctx.beginPath(); ctx.arc(0,-10,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='#8B6914'; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle='#5c4a10';
    ctx.font='bold 30px "Bebas Neue",sans-serif';
    ctx.textAlign='center';
    ctx.fillText('₱', 0, 1);
    // bearish ₱/$ chart card — the value visibly trending down
    ctx.save();
    ctx.translate(0, r-6);
    var cw=66, ch=36;
    ctx.fillStyle='rgba(8,12,24,.88)';
    this._roundRect(ctx,-cw/2,0,cw,ch,5); ctx.fill();
    ctx.strokeStyle='rgba(229,57,53,.65)'; ctx.lineWidth=1; ctx.stroke();
    ctx.strokeStyle='#FF5252';
    ctx.lineWidth=2;
    ctx.lineJoin='round';
    ctx.beginPath();
    var pts=this._chartPts;
    for(var i=0;i<pts.length;i++){
      var px=-cw/2+5+(cw-10)*pts[i][0];
      var py=5+(ch-14)*pts[i][1];
      if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.stroke();
    // blinking "live" end point at the bottom of the trend
    var last=pts[pts.length-1];
    var ex=-cw/2+5+(cw-10)*last[0], ey=5+(ch-14)*last[1];
    if(Math.floor(Date.now()/350)%2===0){
      ctx.fillStyle='#FF5252';
      ctx.beginPath(); ctx.arc(ex,ey,2.5,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.font='bold 7px "Space Grotesk",sans-serif';
    ctx.textAlign='left';
    ctx.fillText('₱/$ ▼', -cw/2+4, ch-3);
    ctx.restore();
  }
  _drawFuel(ctx){
    var w=this.w, h=this.h; // board is the hitbox; the pole below is decoration
    // sign pole
    ctx.fillStyle='#6b7078';
    ctx.fillRect(-3, h/2-2, 6, 26);
    // price board
    ctx.fillStyle='#F5F0E8';
    this._roundRect(ctx,-w/2,-h/2,w,h,6); ctx.fill();
    ctx.strokeStyle='#B71C1C'; ctx.lineWidth=2.5; ctx.stroke();
    // header band
    ctx.fillStyle='#B71C1C';
    this._roundRect(ctx,-w/2+4,-h/2+4,w-8,14,3); ctx.fill();
    ctx.fillStyle='#F5F0E8';
    ctx.font='bold 9px "Space Grotesk",sans-serif';
    ctx.textAlign='center';
    ctx.fillText('GASOLINE',0,-h/2+15);
    // price, ticking upward live
    var price=this._pBase + Math.floor((Date.now()-this._t0)/700)*0.1;
    ctx.fillStyle='#1a1a2e';
    ctx.font='bold 18px "Bebas Neue",sans-serif';
    ctx.textAlign='left';
    ctx.fillText('₱'+price.toFixed(1), -w/2+7, h/2-8);
    // up arrow flashes with every tick
    if(Math.floor((Date.now()-this._t0)/350)%2===0){
      ctx.fillStyle='#E53935';
      ctx.font='bold 14px "Space Grotesk",sans-serif';
      ctx.textAlign='right';
      ctx.fillText('▲', w/2-7, h/2-9);
    }
  }
  _drawKwh(ctx){
    var w=this.w, h=this.h;
    // hazard rate panel
    ctx.fillStyle='#10141f';
    this._roundRect(ctx,-w/2,-h/2,w,h,6); ctx.fill();
    ctx.strokeStyle='#FFD700'; ctx.lineWidth=2.5; ctx.stroke();
    // bolt icon
    ctx.fillStyle='#FFD700';
    ctx.beginPath();
    ctx.moveTo(-w/2+10,-h/2+8); ctx.lineTo(-w/2+18,-h/2+8); ctx.lineTo(-w/2+13,-h/2+17);
    ctx.lineTo(-w/2+19,-h/2+17); ctx.lineTo(-w/2+8,-h/2+31);
    ctx.lineTo(-w/2+12,-h/2+20); ctx.lineTo(-w/2+7,-h/2+20);
    ctx.closePath(); ctx.fill();
    // label
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.font='bold 9px "Space Grotesk",sans-serif';
    ctx.textAlign='left';
    ctx.fillText('₱ / kWh', -w/2+24, -h/2+16);
    // digital readout, ticking upward
    var price=this._pBase + Math.floor((Date.now()-this._t0)/700)*0.05;
    ctx.fillStyle='#7CFC00';
    ctx.font='bold 24px "Bebas Neue",sans-serif';
    ctx.textAlign='center';
    ctx.fillText(price.toFixed(2), 2, h/2-14);
    // RISING tag
    if(Math.floor((Date.now()-this._t0)/400)%2===0){
      ctx.fillStyle='#FF5252';
      ctx.font='bold 8px "Space Grotesk",sans-serif';
      ctx.textAlign='center';
      ctx.fillText('▲ RATES RISING', 0, h/2-4);
    }
  }
  _drawBill(ctx){
    // giant electric bill
    ctx.fillStyle='#F5F0E8';
    this._roundRect(ctx,-this.w/2,-this.h/2,this.w,this.h,4); ctx.fill();
    ctx.strokeStyle='#E53935'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.fillStyle='#E53935';
    ctx.font='bold 9px "Space Grotesk",sans-serif';
    ctx.textAlign='left';
    ctx.fillText('ELECTRIC BILL',-this.w/2+7,-this.h/2+14);
    ctx.fillStyle='#1a1a2e';
    ctx.font='bold 16px "Bebas Neue",sans-serif';
    ctx.textAlign='right';
    ctx.fillText('₱ ????',this.w/2-7,4);
    // bolt
    ctx.fillStyle='#FFD700';
    ctx.beginPath();
    ctx.moveTo(2,6); ctx.lineTo(-4,16); ctx.lineTo(0,16); ctx.lineTo(-2,24); ctx.lineTo(5,13); ctx.lineTo(1,13); ctx.lineTo(4,6);
    ctx.closePath(); ctx.fill();
  }
  _drawDoc(ctx){
    // brown envelope
    ctx.fillStyle='#B08850';
    this._roundRect(ctx,-this.w/2,-this.h/2,this.w,this.h,5); ctx.fill();
    ctx.strokeStyle='#8a6a45'; ctx.lineWidth=2; ctx.stroke();
    // flap
    ctx.beginPath();
    ctx.moveTo(-this.w/2,-this.h/2);
    ctx.lineTo(0,2);
    ctx.lineTo(this.w/2,-this.h/2);
    ctx.strokeStyle='#8a6a45'; ctx.stroke();
    // stamp
    ctx.save();
    ctx.rotate(-0.18);
    ctx.strokeStyle='#B71C1C';
    ctx.fillStyle='#B71C1C';
    ctx.lineWidth=1.5;
    ctx.font='bold 10px "Space Grotesk",sans-serif';
    ctx.textAlign='center';
    var st=this.stamp||'URGENT';
    ctx.fillText(st, 4, -8);
    ctx.strokeRect(-24,-20,58,16);
    ctx.restore();
  }
  _drawMic(ctx){
    // press microphone
    ctx.strokeStyle='#1a1a2e';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(0,this.h/2); ctx.lineTo(0,4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0,-8,12,0,Math.PI*2);
    ctx.fillStyle='#1a1a2e'; ctx.fill();
    ctx.strokeStyle='#D4A843'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(0,-8,12,0,Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14,2); ctx.quadraticCurveTo(0,10,14,2);
    ctx.stroke();
  }
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
}

/* ================================================================
   CASH SUITCASE — grab it for +5. Definitely above board.
   ================================================================ */
class CashCase {
  constructor(x, y){ this.x=x; this.y=y; this.w=50; this.h=36; this.taken=false; this.ph=rand(0,6.28); }
  draw(ctx){
    var t=Date.now();
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(t/500+this.ph)*5);
    var pulse=0.5+0.5*Math.sin(t/280+this.ph);
    // attention glow
    ctx.strokeStyle='rgba(255,215,0,'+(0.2+0.4*pulse)+')';
    ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,32+4*pulse,0,Math.PI*2); ctx.stroke();
    // bills poking out
    ctx.fillStyle='#7bc47f';
    ctx.fillRect(-14,-24,10,12);
    ctx.fillRect(-2,-26,10,14);
    ctx.fillRect(10,-23,10,11);
    ctx.strokeStyle='#4e8a52';
    ctx.lineWidth=1;
    ctx.strokeRect(-14,-24,10,12);
    ctx.strokeRect(-2,-26,10,14);
    ctx.strokeRect(10,-23,10,11);
    // case body
    ctx.fillStyle='#8a5a2a';
    ctx.beginPath();
    ctx.moveTo(-24,-14); ctx.lineTo(24,-14); ctx.quadraticCurveTo(28,-14,28,-10);
    ctx.lineTo(28,14); ctx.quadraticCurveTo(28,18,24,18);
    ctx.lineTo(-24,18); ctx.quadraticCurveTo(-28,18,-28,14);
    ctx.lineTo(-28,-10); ctx.quadraticCurveTo(-28,-14,-24,-14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle='#5f3d1c';
    ctx.lineWidth=2;
    ctx.stroke();
    // handle
    ctx.beginPath();
    ctx.moveTo(-9,-14); ctx.quadraticCurveTo(0,-24,9,-14);
    ctx.stroke();
    // seam + latch
    ctx.beginPath(); ctx.moveTo(-28,2); ctx.lineTo(28,2); ctx.stroke();
    ctx.fillStyle='#FFD700';
    ctx.fillRect(-4,-2,8,8);
    // peso mark on the case
    ctx.fillStyle='#5f3d1c';
    ctx.font='bold 12px "Space Grotesk",sans-serif';
    ctx.textAlign='center';
    ctx.fillText('₱', 0, 14);
    // corner sparkles
    if(Math.floor(t/260+this.ph)%2===0){
      ctx.fillStyle='rgba(255,255,255,.9)';
      ctx.fillRect(-30,-18,3,3);
      ctx.fillRect(27,12,3,3);
    }
    ctx.restore();
  }
}

/* ================================================================
   ACCOUNTABILITY — the looming consequence
   ================================================================ */
class Accountability {
  constructor(){ this.x=-280; this.w=130; this.phase='in'; this.t=0; }
  draw(ctx){
    ctx.save();
    ctx.translate(this.x, 0);
    // slab
    var g=ctx.createLinearGradient(0,0,this.w,0);
    g.addColorStop(0,'#1a0508');
    g.addColorStop(1,'#4a0e14');
    ctx.fillStyle=g;
    ctx.fillRect(-40,-20,this.w+40,CFG.H+40);
    // hazard stripes on the leading edge
    ctx.fillStyle='#E53935';
    for(var y=-20; y<CFG.H+20; y+=36){
      ctx.save();
      ctx.translate(this.w-6, y);
      ctx.rotate(Math.PI/4);
      ctx.fillRect(-6,-6,12,26);
      ctx.restore();
    }
    // label
    ctx.save();
    ctx.translate(45, CFG.H/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillStyle='#FF5252';
    ctx.font='bold 40px "Bebas Neue",sans-serif';
    ctx.textAlign='center';
    ctx.fillText('ACCOUNTABILITY',0,14);
    ctx.restore();
    // blinking INCOMING
    if(this.phase==='in' && Math.floor(Date.now()/300)%2===0){
      ctx.fillStyle='#FFD700';
      ctx.font='bold 13px "Space Grotesk",sans-serif';
      ctx.textAlign='center';
      ctx.save();
      ctx.translate(108, CFG.H/2);
      ctx.rotate(-Math.PI/2);
      ctx.fillText('INCOMING',0,0);
      ctx.restore();
    }
    ctx.restore();
  }
}

/* ================================================================
   BACKGROUND WORLD — parallax Philippines that decays with score
   ================================================================ */
class ParallaxBG {
  constructor() {
    this.scroll=0;
    this.clouds=[];
    for(var i=0;i<12;i++) this.clouds.push({x0:rand(0,CFG.W), y:rand(20,200), size:rand(30,60), opacity:rand(0.1,0.4), f:rand(0.12,0.2)});
    this.buildings=[];
    for(var j=0;j<10;j++) this.buildings.push({x0:j*52+rand(-8,8), h:rand(60,170), w:rand(30,46), bill:Math.random()<0.35, flag:j===3, lit:randInt(3,8)});
    this.poles=[];
    for(var k=0;k<4;k++) this.poles.push({x0:k*240});
  }
  update(dScroll){ this.scroll += dScroll; }
  draw(ctx, score, t) {
    var p = progress(score);
    var sg=ctx.createLinearGradient(0,0,0,CFG.H);
    if(p < 0.3) {
      sg.addColorStop(0,'#1a4a7c');
      sg.addColorStop(0.6,'#2E6DB4');
      sg.addColorStop(1,'#0D4F7A');
    } else if(p < 0.7){
      sg.addColorStop(0,'#0f2847');
      sg.addColorStop(0.35,'#0a1d36');
      sg.addColorStop(0.65,'#1a2340');
      sg.addColorStop(1,'#0a0a0f');
    } else {
      sg.addColorStop(0,'#1a0e12');   // chaos: the sky itself turns wrong
      sg.addColorStop(0.4,'#0d0a14');
      sg.addColorStop(1,'#050508');
    }
    ctx.fillStyle = sg;
    ctx.fillRect(0,0,CFG.W,CFG.H);
    // stars appear as the sky darkens
    var starA = clamp((p-0.25)*1.6, 0, 0.85);
    if(starA>0.02){
      ctx.globalAlpha=starA;
      ctx.fillStyle='#fff';
      for(var k=0;k<26;k++){
        var sx=(k*73+15)%CFG.W;
        var sy=(k*47)%180;
        ctx.fillRect(sx,sy,1.5,1.5);
      }
      ctx.globalAlpha=1;
    }
    // distant mountains
    ctx.fillStyle='rgba(14,27,48,0.6)';
    var off = this.scroll*0.25;
    for(var m=0;m<CFG.W;m+=2){
      var mh = Math.sin((m+off)*0.01)*70 + Math.sin((m+off)*0.025)*40;
      ctx.fillRect(m, CFG.H - mh - 80, 2, mh + 80);
    }
    this._drawBuildings(ctx, p, t);
    this._drawClouds(ctx, p, t);
    this._drawPoles(ctx, p);
    if(p<0.55) this._drawJeepney(ctx, p, t);
    if(p>0.6){ // late-game flood shimmer at street level
      ctx.fillStyle='rgba(26,74,94,'+(0.25+Math.sin(t*2)*0.06)+')';
      ctx.fillRect(0,CFG.H-26,CFG.W,26);
    }
  }
  _wrap(x0, span, margin){
    var x = ((x0 - this.scroll) % span + span) % span;
    return x - margin;
  }
  _drawBuildings(ctx, p, t) {
    var span=CFG.W+120;
    for(var n=0;n<this.buildings.length;n++){
      var b=this.buildings[n];
      var bx=((b.x0 - this.scroll*0.5)%span+span)%span - 60;
      if(bx>CFG.W+60) continue;
      var by=CFG.H-b.h-18;
      ctx.fillStyle= p<0.3 ? 'rgba(30,49,85,.75)' : 'rgba(16,20,34,.85)';
      ctx.fillRect(bx,by,b.w,b.h+18);
      // lit windows as dusk falls
      if(p>0.2){
        ctx.fillStyle='rgba(255,214,120,'+(0.25+0.35*p)+')';
        for(var wi=0; wi<b.lit; wi++){
          ctx.fillRect(bx+6+(wi%3)*((b.w-12)/3), by+8+Math.floor(wi/3)*16, 4, 5);
        }
      }
      // billboard
      if(b.bill && b.w>32){
        ctx.fillStyle='#33383f';
        ctx.fillRect(bx+3,by-24,b.w-6,18);
        ctx.fillStyle='#F5F0E8';
        ctx.font='6px "Space Grotesk",sans-serif';
        ctx.textAlign='center';
        ctx.fillText(BILLBOARD_TEXTS[n%BILLBOARD_TEXTS.length], bx+b.w/2, by-13);
        ctx.fillStyle='rgba(255,255,255,.25)';
        ctx.fillRect(bx+b.w/2-1,by-6,2,6);
      }
      // philippine flag on the tallest early building
      if(n===3){
        this._drawFlag(ctx, bx+b.w-4, by-2, t);
      }
    }
  }
  _drawFlag(ctx, x, y, t){
    ctx.strokeStyle='rgba(200,200,200,.5)';
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-26); ctx.stroke();
    var fw=22, fh=12;
    for(var i=0;i<6;i++){
      var xi=x+i*(fw/6);
      var wob=Math.sin(t*5+i*0.8)*1.8;
      ctx.fillStyle='#0038A8';
      ctx.fillRect(xi, y-26+wob*0.4, fw/6+0.5, fh/2);
      ctx.fillStyle='#CE1126';
      ctx.fillRect(xi, y-26+fh/2+wob*0.4, fw/6+0.5, fh/2);
    }
    ctx.fillStyle='#F5F0E8';
    ctx.beginPath();
    ctx.moveTo(x,y-26);
    ctx.lineTo(x+8,y-26+fh/2);
    ctx.lineTo(x,y-26+fh);
    ctx.closePath();
    ctx.fill();
    // sun
    ctx.fillStyle='#FCD116';
    ctx.beginPath(); ctx.arc(x+4.5,y-26+fh/2,1.6,0,Math.PI*2); ctx.fill();
  }
  _drawClouds(ctx, p, t) {
    for(var ci=0;ci<this.clouds.length;ci++){
      var c=this.clouds[ci];
      var span=CFG.W+160;
      var cx=((c.x0 - this.scroll*c.f + Math.sin(t*0.4+ci)*8)%span+span)%span - 80;
      ctx.globalAlpha = c.opacity*(1-p*0.5);
      ctx.fillStyle= p<0.3 ? '#ffffff' : '#8a93a8';
      this._drawCloud(ctx, cx, c.y, c.size);
    }
    ctx.globalAlpha=1;
  }
  _drawCloud(ctx, x, y, s) {
    ctx.beginPath();
    ctx.arc(x,y,s*0.7,Math.PI,0);
    ctx.arc(x+s*0.3, y+s*0.1, s*0.5, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  _drawPoles(ctx, p) {
    // foreground utility poles + tangled wires
    var span=CFG.W+300;
    ctx.save();
    ctx.globalAlpha=0.32;
    ctx.strokeStyle='#0d0d14';
    ctx.fillStyle='#0d0d14';
    for(var i=0;i<this.poles.length;i++){
      var px=((this.poles[i].x0 - this.scroll*1.35)%span+span)%span - 150;
      if(px>CFG.W+60) continue;
      ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(px,CFG.H); ctx.lineTo(px,CFG.H-190); ctx.stroke();
      ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(px-16,CFG.H-180); ctx.lineTo(px+16,CFG.H-180); ctx.stroke();
      // drooping wires to the right edge of the pole span
      var nx=((this.poles[(i+1)%this.poles.length].x0 - this.scroll*1.35)%span+span)%span - 150;
      if(nx>px){
        ctx.lineWidth=1.5;
        for(var wv=0;wv<3;wv++){
          ctx.beginPath();
          ctx.moveTo(px+2, CFG.H-178+wv*5);
          ctx.quadraticCurveTo((px+nx)/2, CFG.H-150+wv*7+Math.sin(this.scroll*0.02+wv)*6, nx-2, CFG.H-178+wv*5);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  _drawJeepney(ctx, p, t){
    var span=CFG.W+500;
    var jx=((300 - this.scroll*1.05)%span+span)%span - 250;
    var jy=CFG.H-42;
    ctx.save();
    ctx.translate(jx, jy + Math.sin(t*9)*0.8);
    // body
    ctx.fillStyle='#c8402e';
    this._rr(ctx,-34,-14,68,16,4); ctx.fill();
    ctx.fillStyle='#F5F0E8';
    this._rr(ctx,-34,-14,68,5,3); ctx.fill();
    ctx.fillStyle='#1a1a2e';
    ctx.fillRect(-24,-10,12,7);  // windows
    ctx.fillRect(-8,-10,12,7);
    // wheels
    ctx.beginPath(); ctx.arc(-20,2,5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(20,2,5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  _rr(ctx,x,y,w,h,r){ // rounded rect path helper (shared)
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
}

/* ================================================================
   COMBO / MESSAGE / RANK HUD
   ================================================================ */
var comboTimer=null, rankTimer=null, msgTimer=null, prevRank=-1, milestoneIdx=0;

function showCombo(c){
  var el=document.getElementById('hud-combo');
  if(!el) return;
  el.textContent = c>=10 ? 'ACCOUNTABILITY DODGED x'+c : 'DODGE STREAK x'+c;
  el.classList.add('visible');
  clearTimeout(comboTimer);
  comboTimer=setTimeout(function(){ el && el.classList.remove('visible'); }, 850);
}
function showMsg(text, dur){
  var el=document.getElementById('hud-message');
  if(!el) return;
  el.textContent=text;
  el.classList.add('visible');
  clearTimeout(showMsg._t);
  showMsg._t=setTimeout(function(){ el && el.classList.remove('visible'); }, dur||1800);
}
function showRankIfNew(score){
  if(score < RANKS[0][0]) return;
  var rank=rankFor(score);
  if(rank[0]===prevRank) return;
  prevRank=rank[0];
  var el=document.getElementById('hud-rank');
  if(el) {
    el.textContent=rank[1];
    el.classList.add('visible');
    clearTimeout(rankTimer);
    rankTimer=setTimeout(function(){ el && el.classList.remove('visible'); }, 1800);
  }
}

/* ================================================================
   GAME
   ================================================================ */
class Game {
  constructor(canvasId) {
    this.canvas=document.getElementById(canvasId);
    this.ctx=this.canvas.getContext('2d');
    this.player=new Player();
    this.obstaclesList=[];
    this.state='menu';
    this.score=0;
    this.combo=0;
    this.bestScore=parseInt(localStorage.getItem('fm-best')||'0');
    this.longest=parseInt(localStorage.getItem('fm-longest')||'0');
    this.bg=new ParallaxBG();
    this.canvas.width=CFG.W;
    this.canvas.height=CFG.H;
    this.particles=[];
    this.rain=[];
    this.shake=0;
    this.flashA=0;
    this.pressPhrase='';
    this._spawnTimer=0;
    this.stats={floods:0,bills:0,docs:0,blackouts:0,cash:0,flight:0};
    this.cashList=[];
    this.pops=[];
    this._caseTimer=0;
    this._caseEvery=rand(6,9);
    this._lastGapY=CFG.H*0.45;
    this.activeEvent=null;
    this.accountability=null;
    this.flood=null;
    this.blackout=null;
    this.nextEventAt=999;
    this._milestoneIdx=0;
    this.sx=1; this.sy=1; this.ox=0; this.oy=0;
    this.resize();
  }
  resize() {
    var container=this.canvas.parentElement;
    if(!container) return;
    var cw=container.clientWidth;
    var ch=container.clientHeight;
    if(!cw || !ch) return;
    var s=Math.min(cw/CFG.W, ch/CFG.H);
    this.sx=s; this.sy=s;
    this.ox=(cw-CFG.W*s)/2;
    this.oy=(ch-CFG.H*s)/2;
    this.canvas.style.width=CFG.W+'px';
    this.canvas.style.height=CFG.H+'px';
    this.canvas.style.transformOrigin='0 0';
    this.canvas.style.transform='translate('+this.ox+'px,'+this.oy+'px) scale('+s+')';
  }
  startGame() {
    this.score=0;
    this.combo=0;
    this.state='playing';
    this.obstaclesList=[];
    this.particles=[];
    this.rain=[];
    this.activeEvent=null;
    this.accountability=null;
    this.flood=null;
    this.blackout=null;
    this._milestoneIdx=0;
    this.stats={floods:0,bills:0,docs:0,blackouts:0,cash:0,flight:0};
    this.cashList=[];
    this.pops=[];
    this._caseTimer=0;
    this._caseEvery=rand(6,9);
    this._lastGapY=CFG.H*0.45;
    this.nextEventAt=rand(12,16);
    prevRank=-1; milestoneReset();
    transitionTo('#game-screen', true);
    document.getElementById('game-screen').classList.add('in-game');
    this.player.reset();
    var hn=document.getElementById('hud-num'); if(hn) hn.textContent='0';
    var hc=document.getElementById('hud-combo'); if(hc) hc.classList.remove('visible');
    var hr=document.getElementById('hud-rank'); if(hr) hr.classList.remove('visible');
    var hm=document.getElementById('hud-message'); if(hm) hm.classList.remove('visible');
    audio.init();
    audio.startMusic();
  }
  goMenu() {
    this.state='menu';
    this.obstaclesList=[]; this.particles=[]; this.rain=[];
    this.activeEvent=null; this.accountability=null; this.flood=null;
    audio._stopBuzz();
    audio.stopMusic();
    transitionTo('#menu-screen', true);
    document.getElementById('game-screen').classList.remove('in-game');
    showMenuBest();
  }
  /* ---------- events ---------- */
  scheduleNextEvent(){
    this.nextEventAt = this.stats.flight + rand(14,24);
  }
  updateEvents(dt){
    if(this.activeEvent) return; // active events tick via updateBlackout/updateFlood/updateAccountability below
    if(this.stats.flight >= this.nextEventAt){
      var p=this.score;
      var pool=[];
      if(p>=10) pool.push('flood');
      if(p>=30) pool.push('presser');
      if(p>=50) pool.push('accountability');
      if(p>=70) pool.push('blackout');
      if(!pool.length){ this.scheduleNextEvent(); return; }
      this.triggerEvent(pick(pool));
    }
  }
  triggerEvent(type){
    var self=this;
    if(this.activeEvent) return;
    if(type==='blackout'){
      this.activeEvent={type:'blackout', t:0, dur:rand(2.2,3.0)};
      this.blackout={phase:'flicker', t:0};
      audio.blackoutStart();
    } else if(type==='flood'){
      this.activeEvent={type:'flood', t:0};
      this.flood={phase:'warn', t:0, lv:0};
      showMsg('HEAVY RAIN. FLOODING LIKELY.', 2200);
      audio.klaxon();
    } else if(type==='accountability'){
      this.activeEvent={type:'accountability', t:0};
      this.accountability=new Accountability();
      showMsg('ACCOUNTABILITY INCOMING.', 2400);
      audio.klaxon();
    } else if(type==='presser'){
      this.beginPresser();
    }
  }
  updateBlackout(dt){
    var b=this.blackout;
    b.t+=dt;
    this.activeEvent.t+=dt;
    if(b.phase==='flicker' && b.t>0.5){ b.phase='dark'; b.t=0; }
    if(b.phase==='dark' && b.t>this.activeEvent.dur){
      this.blackout=null;
      this.activeEvent=null;
      this.stats.blackouts++;
      audio.blackoutEnd();
      showMsg('POWER RESTORED. MOSTLY.', 1600);
      this.scheduleNextEvent();
    }
  }
  updateFlood(dt){
    var f=this.flood;
    f.t+=dt;
    if(f.phase==='warn' && f.t>1.0){ f.phase='rise'; f.t=0; audio.splash(); }
    else if(f.phase==='rise'){ f.lv=Math.min(1, f.t/2.6); if(f.t>2.6){ f.phase='hold'; f.t=0; } }
    else if(f.phase==='hold' && f.t>3){ f.phase='recede'; f.t=0; }
    else if(f.phase==='recede'){ f.lv=Math.max(0, 1-f.t/2.4); if(f.t>2.4){ this.flood=null; this.activeEvent=null; this.scheduleNextEvent(); return; } }
    // rain particles
    if(f.phase!=='recede' || f.t<1){
      for(var i=0;i<3;i++) this.rain.push({x:rand(0,CFG.W), y:-10, v:rand(300,420)});
    }
    // drowning check (forgiving: only when visibly submerged)
    var surface=CFG.H - f.lv*CFG.H*0.30;
    if(f.lv>0.04 && this.player.y + this.player.r*0.5 > surface){
      this.beginDying('water');
    }
  }
  updateAccountability(dt){
    var a=this.accountability;
    a.t+=dt;
    if(a.phase==='in'){
      var k=clamp(a.t/7,0,1);
      a.x=lerp(-280, this.player.x-95, k*k*(3-2*k));
      if(a.t>7){ a.phase='hold'; a.t=0; }
    } else if(a.phase==='hold'){
      a.x=this.player.x-95+Math.sin(a.t*7)*3;
      this.shake=Math.max(this.shake, 0.15);
      if(a.t>3){ a.phase='out'; a.t=0; }
    } else if(a.phase==='out'){
      a.x=lerp(a.x, -340, dt*2.2);
      if(a.t>2.6){
        this.accountability=null;
        this.activeEvent=null;
        showMsg('ACCOUNTABILITY DODGED. FOR NOW.', 2200);
        this.scheduleNextEvent();
      }
    }
    var v=document.getElementById('vignette');
    if(v){
      var vv=(a.phase==='hold')?0.45+0.25*Math.sin(a.t*9):(a.phase==='in'?clamp(a.t/7,0,0.25):0);
      v.style.opacity=this.blackout?0:vv;
    }
  }
  beginPresser(){
    this.state='presser';
    this.activeEvent={type:'presser'};
    this.flashA=1;
    audio.shutter();
    document.getElementById('presser-statement').textContent=pick(PRESS_STATEMENTS);
    showModal('presser-overlay');
    this._presserTimeout=setTimeout(function(){ if(game.state==='presser') resolvePresser('deflect', true); }, 9000);
  }
  /* ---------- death ---------- */
  beginDying(cause){
    if(this.state!=='playing') return;
    this.state='dying';
    this.dyingT=0;
    this.deathCause=cause||'default';
    this.player.alive=false;
    this.player.spinV=rand(7,13)*(Math.random()<0.5?-1:1);
    audio.stopMusic();
    audio._stopBuzz();
    if(audio.on) audio.die();
    this.shake=1;
    this.flashA=0.85;
    // exploding paperwork + debris
    var docCols=['#B08845','#F5F0E8','#D4A843','#8A857C','#E53935'];
    for(var i=0;i<50;i++){
      this.particles.push({x:this.player.x, y:this.player.y, vx:rand(-4,4), vy:rand(-6,-1),
        color:pick(['#B08845','#F5F0E8','#D4A843','#8A857C']), size:rand(3,11), life:1, spin:rand(-0.3,0.3), a:rand(0,Math.PI)});
    }
    var v=document.getElementById('vignette'); if(v) v.style.opacity=0;
  }
  stopGame(cause){ this.beginDying(cause); }
  /* ---------- main update ---------- */
  update(dt) {
    if(this.state!=='playing') return;
    this.stats.flight += dt;
    this.player.update(dt);
    if(this.player.y > CFG.H-14 || this.player.y < 8){
      this.beginDying('ground');
      return;
    }
    var p = progress(this.score);
    var spd = CFG.BASE_SPD + p*2.2;
    this.bg.update(spd*dt*60);

    // spawn obstacles
    this._spawnTimer += dt;
    var interval = 1.55 - p*0.3;
    if(this._spawnTimer >= interval){
      this._spawnTimer = 0;
      this.spawnObstacle(p);
    }

    // cash suitcases
    this._caseTimer += dt;
    if(this._caseTimer >= this._caseEvery){
      this._caseTimer = 0;
      this._caseEvery = rand(7,12);
      this.spawnCashCase();
    }
    for(var ci=0; ci<this.cashList.length; ci++){
      var cc=this.cashList[ci];
      cc.x -= spd*dt*60;
      var dx=cc.x-this.player.x, dy=cc.y-this.player.y;
      if(!cc.taken && dx*dx+dy*dy < (this.player.r+30)*(this.player.r+30)){
        cc.taken=true;
        this.collectCash(cc);
      }
    }
    this.cashList = this.cashList.filter(function(c){ return !c.taken && c.x > -80; });
    for(var pi=this.pops.length-1; pi>=0; pi--){
      var pop=this.pops[pi];
      pop.y -= 40*dt; pop.t -= dt;
      if(pop.t<=0) this.pops.splice(pi,1);
    }

    // move obstacles
    for(var i=0;i<this.obstaclesList.length;i++){
      var ob=this.obstaclesList[i];
      ob.x -= spd * dt * 60;
      if(ob.sinkV) ob.y += ob.sinkV*dt;
      if(!ob.passed && ob.x < this.player.x - this.player.r - 8){
        ob.passed=true;
        this.addScore(ob.kind||'other');
      }
    }
    this.obstaclesList = this.obstaclesList.filter(function(o){ return o.x > -200; });

    // collisions
    for(var j=0;j<this.obstaclesList.length;j++){
      var ob2=this.obstaclesList[j];
      if(this.player.alive && this.player.collide(ob2)){
        this.beginDying(ob2.kind==='pylon'?'pylon':(ob2 instanceof FloodWall?'wall':(ob2.kind==='doc'?'doc':ob2.kind)));
        return;
      }
    }

    // random events
    this.updateEvents(dt);
    if(this.blackout) this.updateBlackout(dt);
    if(this.flood) this.updateFlood(dt);
    if(this.accountability) this.updateAccountability(dt);

    // rain
    for(var r=this.rain.length-1;r>=0;r--){
      var d=this.rain[r];
      d.y+=d.v*dt; d.x-=spd*dt*30;
      if(d.y>CFG.H+10) this.rain.splice(r,1);
    }
    this.updateParticles(dt);
    this.shake=Math.max(0,this.shake-dt*2.4);
    this.flashA=Math.max(0,this.flashA-dt*2.2);
  }
  addScore(kind){
    this.score++;
    this.combo++;
    if(this.combo===10 || this.combo===25 || this.combo===50){
      this.emitConfetti();
      this.flashA=0.7;
      audio.shutter();
    }
    if(this.score>=5 && this.score%25===0) this.emitConfetti();
    // stats by kind
    if(kind==='flood') this.stats.floods++;
    else if(kind==='pylon'||kind==='bill') this.stats.bills++;
    else if(kind==='doc') this.stats.docs++;
    var hn=document.getElementById('hud-num');
    if(hn) hn.textContent=this.score;
    // milestone messages
    while(this._milestoneIdx<MILESTONES.length && this.score>=MILESTONES[this._milestoneIdx][0]){
      showMsg(MILESTONES[this._milestoneIdx][1], 2000);
      audio.milestone();
      this._milestoneIdx++;
    }
    showRankIfNew(this.score);
    if(audio.on) audio.score();
    showCombo(this.combo);
  }
  spawnCashCase(){
    // drop it in a nearby wall's gap when possible, otherwise open sky, never inside an obstacle
    var nearWall=null;
    for(var i=0;i<this.obstaclesList.length;i++){
      var o=this.obstaclesList[i];
      if(o.gapY!==undefined && o.x>CFG.W-60 && o.x<CFG.W+420) nearWall=o;
    }
    var x=CFG.W+180, y, tries=0;
    do{
      y = nearWall ? nearWall.gapY+rand(-24,24) : rand(110, CFG.H-190);
      var clear=true;
      for(var j=0;j<this.obstaclesList.length;j++){
        var o2=this.obstaclesList[j];
        if(o2.gapY!==undefined) continue;
        if(Math.abs(o2.y-y)<85 && Math.abs(o2.x-x)<130){ clear=false; break; }
      }
      if(clear) break;
      nearWall=null; tries++;
    } while(tries<3);
    if(tries>=3 && !nearWall) return;
    this.cashList.push(new CashCase(x, y));
  }
  collectCash(cc){
    this.score += 5;
    this.stats.cash++;
    var hn=document.getElementById('hud-num');
    if(hn) hn.textContent=this.score;
    this.pops.push({x:cc.x, y:cc.y-20, txt:'+5', t:1});
    // burst of bills
    for(var i=0;i<12;i++){
      this.particles.push({x:cc.x, y:cc.y, vx:rand(-2.5,2.5), vy:rand(-3.5,-0.5),
        color:pick(['#7bc47f','#FFD700','#F5F0E8']), size:rand(4,8), life:0.9, spin:rand(-5,5), a:rand(0,6.28)});
    }
    if(audio.on) audio.chaChing();
    showRankIfNew(this.score);
  }
  spawnObstacle(p){
    var wallChance = 0.55 - p*0.1;
    if(Math.random() < wallChance){
      // keep consecutive gaps reachable: within ±150px of the previous wall's gap
      var gy = clamp(this._lastGapY + rand(-150,150), CFG.H*0.25, CFG.H*0.65);
      this._lastGapY = gy;
      this.obstaclesList.push(new FloodWall(CFG.W+80, gy));
    } else {
      var pool=[['peso',2],['fuel',2.2]];
      if(p>0.08) pool.push(['kwh',1.8]);
      if(p>0.22) pool.push(['bill',1.8]);
      if(p>0.32) pool.push(['doc',2.2]);
      if(p>0.45) pool.push(['mic',0.8]);
      var total=0; for(var i=0;i<pool.length;i++) total+=pool[i][1];
      for(var fi=0; fi<randInt(1,2); fi++){
        var roll=rand(0,total), kind='peso';
        for(var ki=0;ki<pool.length;ki++){ roll-=pool[ki][1]; if(roll<=0){ kind=pool[ki][0]; break; } }
        this.obstaclesList.push(new FloatingObstacle(CFG.W+60+fi*46, rand(80, CFG.H-120), kind));
      }
    }
  }
  /* ---------- particles ---------- */
  emitConfetti(){
    var cols=['#D4A843','#FFD700','#E53935','#0A3D8F','#F5F0E8'];
    for(var i=0;i<36;i++){
      this.particles.push({x:rand(0,CFG.W), y:rand(-20,60), vx:rand(-1,1), vy:rand(1,3),
        color:pick(cols), size:rand(3,7), life:1.6, spin:rand(-6,6), a:rand(0,Math.PI)});
    }
  }
  updateParticles(dt){
    for(var i=this.particles.length-1;i>=0;i--){
      var pt=this.particles[i];
      pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=(pt.vy>0?0.05:0.15); pt.a+=pt.spin; pt.life-=dt;
      if(pt.life<=0) this.particles.splice(i,1);
    }
  }
  drawParticles(ctx){
    for(var i=0;i<this.particles.length;i++){
      var pt=this.particles[i];
      ctx.save();
      ctx.globalAlpha=clamp(pt.life,0,1);
      ctx.translate(pt.x,pt.y);
      ctx.rotate(pt.a||0);
      ctx.fillStyle=pt.color;
      ctx.fillRect(-pt.size/2,-pt.size/2,pt.size,pt.size*0.7);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }
  /* ---------- render ---------- */
  render() {
    var ctx=this.ctx;
    var t=Date.now()/1000;
    ctx.clearRect(0,0,CFG.W,CFG.H);
    ctx.save();
    if(this.shake>0) ctx.translate(rand(-6,6)*this.shake, rand(-5,5)*this.shake);
    this.bg.draw(ctx, this.state==='menu'?0:this.score, t);

    for(var i=0;i<this.obstaclesList.length;i++) this.obstaclesList[i].draw(ctx);

    for(var cc=0; cc<this.cashList.length; cc++) this.cashList[cc].draw(ctx);

    // floating score pops (+5)
    for(var pp=0; pp<this.pops.length; pp++){
      var pop=this.pops[pp];
      ctx.save();
      ctx.globalAlpha=clamp(pop.t,0,1);
      ctx.fillStyle='#FFD700';
      ctx.font='bold 18px "Bebas Neue",sans-serif';
      ctx.textAlign='center';
      ctx.fillText(pop.txt, pop.x, pop.y);
      ctx.restore();
    }
    ctx.globalAlpha=1;

    if(this.accountability) this.accountability.draw(ctx);

    // flood water (over obstacles, under player)
    if(this.flood && this.flood.lv>0.01){
      var f=this.flood;
      var surface=CFG.H - f.lv*CFG.H*0.30;
      ctx.fillStyle='rgba(20,58,74,.82)';
      ctx.beginPath();
      ctx.moveTo(0,CFG.H);
      for(var wx=0;wx<=CFG.W;wx+=8){
        ctx.lineTo(wx, surface + Math.sin(wx*0.06 + t*4)*3);
      }
      ctx.lineTo(CFG.W,CFG.H);
      ctx.closePath();
      ctx.fill();
      // floating debris
      ctx.fillStyle='rgba(122,90,60,.7)';
      for(var db=0;db<4;db++){
        var dx=((db*137 + this.bg.scroll*1.1)%(CFG.W+80))-40;
        ctx.fillRect(dx, surface+10+db*8, 14, 5);
      }
    }
    // rain
    if(this.rain.length){
      ctx.strokeStyle='rgba(200,220,255,.35)';
      ctx.lineWidth=1;
      for(var ri=0;ri<this.rain.length;ri++){
        var d2=this.rain[ri];
        ctx.beginPath();
        ctx.moveTo(d2.x,d2.y);
        ctx.lineTo(d2.x-2,d2.y+10);
        ctx.stroke();
      }
    }

    var blackoutDark = this.blackout && this.blackout.phase==='dark';
    var flicker = this.blackout && this.blackout.phase==='flicker';
    if(flicker) {
      // the lights struggle
      ctx.fillStyle='rgba(0,0,10,'+(0.55+0.45*Math.sin(Date.now()/40))+')';
      ctx.fillRect(0,0,CFG.W,CFG.H);
    }
    if(!blackoutDark) this.player.draw(ctx, false);

    this.drawParticles(ctx);

    if(blackoutDark){
      ctx.fillStyle='rgba(2,2,6,.94)';
      ctx.fillRect(0,0,CFG.W,CFG.H);
      // emergency light glow
      var eg=ctx.createRadialGradient(this.player.x,this.player.y,4,this.player.x,this.player.y,140);
      eg.addColorStop(0,'rgba(255,60,40,.18)');
      eg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=eg;
      ctx.fillRect(0,0,CFG.W,CFG.H);
      this.player.draw(ctx, true); // silhouette only
    }

    // camera flash
    if(this.flashA>0){
      ctx.fillStyle='rgba(255,255,255,'+clamp(this.flashA,0,1)+')';
      ctx.fillRect(0,0,CFG.W,CFG.H);
    }
    // late-game grime (alpha ramps with progress — never opaque)
    var p=progress(this.score);
    if(p>0.3 && !blackoutDark){
      ctx.fillStyle='rgba(0,0,10,'+clamp((p-0.3)*0.7,0,0.45)+')';
      ctx.fillRect(0,0,CFG.W,CFG.H);
    }
    ctx.restore();
  }
  renderMenu() {
    var ctx=this.ctx;
    var t=Date.now()/1000;
    ctx.clearRect(0,0,CFG.W,CFG.H);
    this.bg.draw(ctx, 0, t);
    // the ghost idles mid-air
    this.player.x=CFG.W*0.7;
    this.player.y=CFG.H*0.2+Math.sin(t*2.2)*14;
    this.player.angle=Math.sin(t*2.2+0.6)*0.12;
    this.player.draw(ctx,false);
    this.bg.scroll+=0.5;
  }
}

var milestoneReset=function(){ if(game) game._milestoneIdx=0; };

/* ================================================================
   GAME OVER / SCOREKEEPING
   ================================================================ */
function showGameOver(score){
  var rank=rankFor(score);
  var cause=game.deathCause||'default';
  var deathText=DEATH_TEXT[cause]||DEATH_TEXT.default;
  if(game.stats.flight>game.longest){
    game.longest=Math.floor(game.stats.flight);
    try{ localStorage.setItem('fm-longest', game.longest); }catch(e){}
  }
  if(game.score>game.bestScore){
    game.bestScore=game.score;
    try{ localStorage.setItem('fm-best', game.score); }catch(e){}
  }
  document.getElementById('go-title').textContent='ACCOUNTABILITY CAUGHT YOU.';
  document.getElementById('go-death-text').textContent=deathText;
  var rows=[
    ['ISSUES DODGED', game.score],
    ['LONGEST FLIGHT', fmtTime(game.longest)],
    ['BRIEFCASES COLLECTED', game.stats.cash],
    ['FLOOD PROJECTS AVOIDED', game.stats.floods],
    ['BLACKOUTS SURVIVED', game.stats.blackouts],
    ['BILLS DODGED', game.stats.bills]
  ];
  document.getElementById('go-stats').innerHTML=rows.map(function(r){
    return '<div class="go-stat"><div class="go-label">'+r[0]+'</div><div class="go-val">'+r[1]+'</div></div>';
  }).join('');
  document.getElementById('go-headline').textContent=pick(HEADLINES);
  // leaderboard entry
  var qualifies=lbQualifies(game.score);
  var nameRow=document.getElementById('lb-name-row');
  if(nameRow){ nameRow.hidden=!qualifies; if(qualifies) document.getElementById('lb-name').value=''; }
  var btnSaveScore=document.getElementById('btn-save-score');
  if(btnSaveScore) btnSaveScore.disabled=false;
  document.getElementById('game-screen').classList.remove('in-game');
  transitionTo('#gameover-screen', true);
}

function renderShareCard(cv){
  var ctx=cv.getContext('2d');
  var W=cv.width=900, H=cv.height=1200;
  var t=Date.now()/1000;
  // sky
  var g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#0f2847'); g.addColorStop(0.5,'#0a1d36'); g.addColorStop(1,'#050508');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  // stars
  ctx.fillStyle='rgba(255,255,255,.5)';
  for(var i=0;i<40;i++) ctx.fillRect((i*137)%W,(i*89)%400,2,2);
  // skyline
  ctx.fillStyle='rgba(14,18,32,.9)';
  var bx=0;
  while(bx<W){
    var bw=40+((bx*37)%60), bh=90+((bx*61)%180);
    ctx.fillRect(bx,H-bh-120,bw,bh);
    bx+=bw+8;
  }
  ctx.fillStyle='rgba(20,26,44,.9)';
  ctx.fillRect(0,H-120,W,120);
  // gold ring ghost
  var px=W/2, py=330;
  ctx.save();
  ctx.beginPath(); ctx.arc(px,py,120,0,Math.PI*2);
  ctx.fillStyle='#D4A843'; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(px, py+8);
  drawGhostSprite(ctx, 82, {t:t});
  ctx.restore();
  // texts
  ctx.textAlign='center';
  ctx.fillStyle='#F2D06B';
  ctx.font='bold 90px "Bebas Neue",sans-serif';
  ctx.fillText('GHOST PROJECT',W/2,150);
  ctx.fillStyle='#fff';
  ctx.font='bold 110px "Bebas Neue",sans-serif';
  ctx.fillText('I DODGED '+game.score,W/2,560);
  ctx.fillText('ISSUES',W/2,680);
  ctx.font='30px "Space Grotesk",sans-serif';
  ctx.fillStyle='rgba(255,255,255,.75)';
  var rank=rankFor(game.score);
  ctx.fillText('LONGEST FLIGHT  '+fmtTime(game.longest),W/2,790);
  ctx.fillStyle='#F2D06B';
  ctx.font='bold 34px "Bebas Neue",sans-serif';
  ctx.fillText('STATUS: '+(rank?rank[1]:'CIVILIAN'),W/2,850);
  ctx.strokeStyle='rgba(212,168,67,.5)';
  ctx.lineWidth=6;
  ctx.strokeRect(30,30,W-60,H-60);
  ctx.fillStyle='rgba(255,255,255,.4)';
  ctx.font='22px "Space Grotesk",sans-serif';
  ctx.fillText('Dodge issues. Avoid accountability.',W/2,1120);
  ctx.fillText('A political satire game.',W/2,1155);
}

/* ================================================================
   GLOBAL LEADERBOARD  ("WHO DODGED THE MOST?")
   Server-sorted via /api/leaderboard; the local board stays as an
   offline fallback (and feeds the "does this score qualify?" gate).
   ================================================================ */
function lbLoad(){
  try{ return JSON.parse(localStorage.getItem('fm-board')||'[]'); }catch(e){ return []; }
}
function lbSave(list){ try{ localStorage.setItem('fm-board', JSON.stringify(list.slice(0,5))); }catch(e){} }
function lbQualifies(score){
  if(score<=0) return false;
  var b=lbLoad();
  return b.length<5 || score>b[b.length-1].s;
}
function lbAdd(name, score){
  // local record (offline fallback / personal board)
  var b=lbLoad();
  b.push({n:(name||'ANONYMOUS DODGER').toUpperCase().slice(0,18), s:score, t:Date.now()});
  b.sort(function(a,c){ return c.s-a.s; });
  lbSave(b);
}
function lbSubmit(name, score){
  // sync to the global board; resolves with the Response (or null offline)
  try{
    return fetch('/api/leaderboard', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:name, score:score})
    }).catch(function(){ return null; });
  }catch(e){ return Promise.resolve(null); }
}
function escHtml(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function lbDraw(list){
  var el=document.getElementById('lb-list');
  if(!list.length){
    el.innerHTML='<div class="lb-empty">NO DODGERS YET. THE BAR IS ON THE FLOOR.</div>';
    return;
  }
  el.innerHTML=list.map(function(r,i){
    var rank=rankFor(r.s);
    return '<div class="lb-row"><span class="lb-pos">'+(i+1)+'</span><span class="lb-name">'+escHtml(r.n)+'</span><span class="lb-rank">'+(rank?rank[1]:'CIVILIAN')+'</span><span class="lb-score">'+r.s+'</span></div>';
  }).join('');
}
function lbRender(tab){
  var el=document.getElementById('lb-list');
  if(el) el.innerHTML='<div class="lb-empty">SYNCING WITH BUREAUCRACY...</div>';
  var done=false;
  function fallback(){
    if(done) return; done=true;
    var b=lbLoad();
    if(tab==='today') b=b.filter(function(r){ return Date.now()-r.t<86400000; });
    lbDraw(b);
  }
  try{
    fetch('/api/leaderboard?tab='+encodeURIComponent(tab)).then(function(r){
      return r.ok ? r.json() : Promise.reject();
    }).then(function(d){
      done=true;
      lbDraw(d.scores||[]);
    }).catch(fallback);
    // don't let a hanging request keep the placeholder forever
    setTimeout(fallback, 4000);
  }catch(e){ fallback(); }
}

/* ================================================================
   SCREENS & UI
   ================================================================ */
function transitionTo(sel, visible){
  var el=document.querySelector(sel);
  if(!el) return;
  document.querySelectorAll('.screen').forEach(function(s){
    if(s.id==='game-screen') return; // canvas layer always stays visible underneath
    s.classList.remove('active','invisible');
  });
  if(visible === false || visible === undefined) {
    el.classList.add('invisible');
  } else {
    el.classList.add('active');
    document.querySelectorAll('.screen').forEach(function(s){
      if(s!==el && s.id!=='game-screen') s.classList.add('invisible');
    });
  }
  var gs=document.getElementById('game-screen');
  if(gs && sel!=='#loading-screen'){ gs.classList.add('active'); gs.classList.remove('invisible'); }
}
function toggleModal(id){
  var m=document.getElementById(id);
  if(!m) return;
  m.classList.toggle('invisible');
}
function showModal(id){ var m=document.getElementById(id); if(m) m.classList.remove('invisible'); }
function hideModal(id){ var m=document.getElementById(id); if(m) m.classList.add('invisible'); }

function showMenuBest(){
  var best=parseInt(localStorage.getItem('fm-best')||'0');
  var el=document.getElementById('menu-best');
  if(el) el.innerHTML=best>0?'Best: '+best+' issues dodged':'';
}

function pauseGame(){
  if(game.state!=='playing') return;
  game.state='paused';
  audio.stopMusic();
  showModal('pause-overlay');
}
function resumeGame(){
  if(game.state!=='paused') return;
  game.state='playing';
  audio.init();
  audio.startMusic();
  hideModal('pause-overlay');
}
function resolvePresser(choice){
  clearTimeout(game._presserTimeout);
  hideModal('presser-overlay');
  game.state='playing';
  game.activeEvent=null;
  if(choice==='address'){
    // consequences: the paperwork arrives
    for(var i=0;i<2;i++){
      game.obstaclesList.push(new FloatingObstacle(CFG.W+120+i*130, rand(120,CFG.H-160), 'doc'));
    }
    showMsg('BRAVE. BUT UNWISE.', 2200);
  } else {
    showMsg('NOTHING TO SEE HERE.', 1800);
  }
  game.scheduleNextEvent();
}

game = new Game('game-canvas');
audio = new AudioEngine();
window.__fm={game:game, audio:audio}; // debug/testing hook

window.addEventListener('load', function(){
  transitionTo('#menu-screen', true);
  audio.init();
  audio.startMusic();
  showMenuBest();

  var tapHandler=function(e){
    if(game.state!=='playing') return;
    if(e.target.closest && e.target.closest('button, .modal, a, input')) return;
    e.preventDefault();
    if(audio.ctx && audio.ctx.state==='suspended') audio.ctx.resume();
    game.player.flap();
  };
  document.addEventListener('pointerdown', tapHandler);
  document.addEventListener('keydown', function(e){
    if(e.code==='Space'){
      if(game.state==='playing'){
        e.preventDefault();
        if(!e.repeat) game.player.flap();
      } else if(game.state==='presser'){
        e.preventDefault();
        resolvePresser('deflect');
      }
    } else if(e.code==='Escape' || e.code==='KeyP'){
      if(game.state==='playing') pauseGame();
      else if(game.state==='paused') resumeGame();
    }
  });

  document.getElementById('btn-start').onclick=function(){ audio.init(); game.startGame(); };
  document.getElementById('btn-retry').onclick=function(){ game.startGame(); };
  document.getElementById('btn-menu-go').onclick=function(){ game.goMenu(); };
  document.getElementById('btn-pause-menu').onclick=function(){
    hideModal('pause-overlay');
    game.goMenu();
  };
  document.getElementById('btn-resume').onclick=resumeGame;
  document.getElementById('btn-deflect').onclick=function(){ resolvePresser('deflect'); };
  document.getElementById('btn-address').onclick=function(){ resolvePresser('address'); };

  var btnPauseHud=document.getElementById('btn-pause-hud');
  if(btnPauseHud){
    btnPauseHud.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
    btnPauseHud.onclick=function(e){ e.stopPropagation(); pauseGame(); };
  }

  var btnShare=document.getElementById('btn-share');
  if(btnShare){
    btnShare.onclick=function(){
      var cv=document.getElementById('share-canvas');
      renderShareCard(cv);
      showModal('share-overlay');
      cv.toBlob(function(blob){
        window.__fm._shareBlob=blob;
      });
    };
  }
  var btnShareSend=document.getElementById('btn-share-send');
  if(btnShareSend){
    btnShareSend.onclick=function(){
      var text='I dodged '+game.score+' issues in GHOST PROJECT. Longest flight: '+fmtTime(game.longest)+'. Dodge issues. Avoid accountability.';
      var done=function(){ btnShareSend.textContent='READY!'; setTimeout(function(){btnShareSend.textContent='SHARE';},1500); };
      var blob=window.__fm._shareBlob;
      if(blob && navigator.canShare){
        var file=new File([blob],'ghost-project.png',{type:'image/png'});
        if(navigator.canShare({files:[file]})){
          navigator.share({files:[file], text:text}).then(done).catch(function(){});
          return;
        }
      }
      if(navigator.share){ navigator.share({text:text}).then(done).catch(function(){}); }
      else if(navigator.clipboard){ navigator.clipboard.writeText(text).then(done).catch(function(){}); }
    };
  }
  var btnShareDl=document.getElementById('btn-share-dl');
  if(btnShareDl){
    btnShareDl.onclick=function(){
      var blob=window.__fm._shareBlob;
      if(!blob) return;
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='ghost-project-score.png';
      a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);},2000);
    };
  }

  // leaderboard save
  var btnSaveScore=document.getElementById('btn-save-score');
  if(btnSaveScore){
    btnSaveScore.onclick=function(){
      if(btnSaveScore.disabled) return;
      btnSaveScore.disabled=true;
      var name=document.getElementById('lb-name').value;
      lbAdd(name, game.score); // the local board always records the run
      var done=function(){
        document.getElementById('lb-name-row').hidden=true;
        btnSaveScore.textContent='SAVED';
        setTimeout(function(){btnSaveScore.textContent='SAVE TO LEADERBOARD';},1500);
      };
      lbSubmit(name, game.score).then(function(res){
        if(res && res.status===422){
          // the moderation filter rejected that name — post anonymously
          document.getElementById('lb-name').value='';
          btnSaveScore.textContent='SAVED ANONYMOUSLY';
          lbSubmit('ANONYMOUS DODGER', game.score).then(done);
          setTimeout(function(){btnSaveScore.textContent='SAVE TO LEADERBOARD';},1500);
        } else {
          done();
        }
      });
    };
  }

  // settings
  var soundChk=document.getElementById('setting-sound');
  var musicChk=document.getElementById('setting-music');
  var hapticsChk=document.getElementById('setting-haptics');
  function saveSettings(){
    try{ localStorage.setItem('fm-settings', JSON.stringify({sound:audio.on, music:audio.musicOn, haptics:audio.haptics})); }catch(e){}
  }
  function applySettings(){
    if(soundChk) soundChk.checked=audio.on;
    if(musicChk) musicChk.checked=audio.musicOn;
    if(hapticsChk) hapticsChk.checked=audio.haptics;
  }
  (function loadSettings(){
    try{
      var s=JSON.parse(localStorage.getItem('fm-settings')||'{}');
      if(s.sound===false) audio.on=false;
      if(s.music===false) audio.musicOn=false;
      if(s.haptics===false) audio.haptics=false;
    }catch(e){}
  })();
  applySettings();
  if(soundChk) soundChk.onchange=function(){ audio.on=this.checked; if(audio.on) audio.init(); saveSettings(); };
  if(musicChk) musicChk.onchange=function(){
    audio.musicOn=this.checked;
    if(audio.musicOn){ audio.startMusic(); } else { audio.stopMusic(); }
    saveSettings();
  };
  if(hapticsChk) hapticsChk.onchange=function(){ audio.haptics=this.checked; saveSettings(); };

  var btnHowto=document.getElementById('btn-howto');
  if(btnHowto) btnHowto.onclick=function(){ toggleModal('howto-overlay'); };
  var btnSettings=document.getElementById('btn-settings');
  if(btnSettings) btnSettings.onclick=function(){ toggleModal('settings-overlay'); };
  var btnLb=document.getElementById('btn-leaderboard');
  if(btnLb) btnLb.onclick=function(){ lbRender('all'); toggleModal('lb-overlay'); };
  var btnAbout=document.getElementById('btn-about');
  if(btnAbout) btnAbout.onclick=function(){ toggleModal('about-overlay'); };
  var tabToday=document.getElementById('lb-tab-today');
  var tabAll=document.getElementById('lb-tab-all');
  if(tabToday) tabToday.onclick=function(){ lbRender('today'); tabToday.classList.add('on'); tabAll.classList.remove('on'); };
  if(tabAll) tabAll.onclick=function(){ lbRender('all'); tabAll.classList.add('on'); tabToday.classList.remove('on'); };

  document.querySelectorAll('[data-target]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var target=btn.getAttribute('data-target');
      if(target) toggleModal(target);
    });
  });
});

var lastTime=0;

function gameLoop(ts){
  var dt = Math.min((ts-lastTime)/1000, 0.064);
  lastTime=ts;
  if(!game) { requestAnimationFrame(gameLoop); return; }
  try{
    if(game.state==='playing'){
      game.update(dt);
      game.render();
    } else if(game.state==='menu'){
      game.renderMenu();
    } else if(game.state==='presser'){
      game.render();
    } else if(game.state==='dying'){
      game.dyingT+=dt;
      game.player.angle+=game.player.spinV*dt;
      game.player.y+=40*dt;
      game.updateParticles(dt);
      game.shake=Math.max(0,game.shake-dt*1.6);
      game.flashA=Math.max(0,game.flashA-dt*1.2);
      game.render();
      if(game.dyingT>1.0){
        game.state='over';
        showGameOver(game.score);
      }
    } else if(game.state==='over'){
      game.updateParticles(dt);
      game.render();
    }
  }catch(err){
    // never let one bad frame kill the loop
    if(!window.__fmLoopErr){ window.__fmLoopErr=true; console.error('gameLoop error:', err); }
  }
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

/* Character art hook: to use custom art instead of the code-drawn ghost,
   drop a transparent PNG under assets/characters/ and assign it to
   game.player.img (see docs/ASSET_REGISTER.md). */

window.addEventListener('resize', function(){ game.resize(); });