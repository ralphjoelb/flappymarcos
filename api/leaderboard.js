/* ================================================================
   GLOBAL LEADERBOARD API  (Upstash Redis via REST — no dependencies)

   GET  /api/leaderboard?tab=all|today   → { ok, scores: [{n, s, t}] }
   POST /api/leaderboard { name, score } → { ok, scores: [...] }
        422 when the name is rejected by the moderation filter

   Storage: two sorted sets —
     fm-lb:all          all-time top scores
     fm-lb:day:<date>   today's scores (UTC), expires after 48h
   Members are JSON strings {"n":name,"t":epoch-ms}; the score lives
   in the sorted-set score. If the Redis env vars are missing, the
   function answers 503 and the client falls back to its local board.
   ================================================================ */

const MAX_SCORE = 10000;   // sanity cap: no legitimate run gets near this
const TOP_N     = 10;      // entries returned to the client
const KEEP_N    = 100;     // entries kept server-side in the all-time set
const IP_LIMIT  = 5;       // submissions per IP...
const IP_WINDOW = 60;      // ...per this many seconds

function dayKey(){
  return 'fm-lb:day:' + new Date().toISOString().slice(0, 10);
}

/* The Vercel Marketplace integration injects KV_REST_API_URL/TOKEN;
   older setups use UPSTASH_REDIS_REST_URL/TOKEN. Accept both. */
function redisConfig(){
  return {
    url:  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  };
}

function cleanName(v){
  var n = String(v || '').toUpperCase().replace(/[^A-Z0-9 .,!?'-]/g, '').trim().slice(0, 18);
  return n || 'ANONYMOUS DODGER';
}

/* Moderation filter (impersonation + abuse). This list is filter data,
   not game copy: it is the one sanctioned place in the repo where real
   officials' names appear — see docs/POLITICAL_CONTENT_GUIDELINES.md.
   Word-boundary matched; common non-political surnames can collide
   (documented tradeoff, keep the list tight). */
var BLOCKED_NAMES = [
  'MARCOS', 'BONGBONG', 'BONG BONG', 'BBM', 'PBBM',
  'DUTERTE', 'DIGONG', 'FPRRD', 'PRRD',
  'SARA DUTERTE', 'INDAY SARA',
  'AQUINO', 'NOYNOY', 'ABNOY',
  'ARROYO', 'GLORIA MACAPAGAL', 'GMA',
  'ESTRADA', 'ERAP',
  'RAMOS', 'IMELDA',
  'FLAPPY MARCOS',
  'GAGO', 'PUTANG', 'PUTA', 'TANGA', 'BOBO', 'TAE', 'PUCHU'
];

function isBlockedName(name){
  var padded = ' ' + String(name).replace(/\s+/g, ' ').trim().toUpperCase() + ' ';
  for(var i = 0; i < BLOCKED_NAMES.length; i++){
    if(padded.indexOf(' ' + BLOCKED_NAMES[i] + ' ') !== -1) return true;
  }
  return false;
}

async function redis(cmds){
  var cfg = redisConfig();
  var res = await fetch(cfg.url + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cmds)
  });
  if(!res.ok) throw new Error('redis ' + res.status);
  return res.json();
}

/* ZREVRANGE ... WITHSCORES comes back flat: [member, score, member, score, ...] */
function parseEntries(raw){
  var out = [];
  for(var i = 0; i + 1 < raw.length; i += 2){
    try{
      var m = JSON.parse(raw[i]);
      out.push({ n: m.n, t: m.t, s: Math.round(Number(raw[i + 1])) });
    }catch(e){ /* skip malformed member */ }
  }
  return out;
}

module.exports = async function handler(req, res){
  try{
    var cfg = redisConfig();
    if(!cfg.url || !cfg.token){
      return res.status(503).json({ ok: false, error: 'leaderboard not connected' });
    }

    if(req.method === 'GET'){
      var tab = req.query.tab === 'today' ? dayKey() : 'fm-lb:all';
      var r = await redis([['ZREVRANGE', tab, 0, TOP_N - 1, 'WITHSCORES']]);
      return res.status(200).json({ ok: true, scores: parseEntries(r[0].result || []) });
    }

    if(req.method === 'POST'){
      var body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      var score = Math.round(Number(body.score));
      if(!isFinite(score) || score < 1 || score > MAX_SCORE){
        return res.status(400).json({ ok: false, error: 'implausible score' });
      }
      var name = cleanName(body.name);
      if(isBlockedName(name)){
        return res.status(422).json({ ok: false, error: 'name not allowed' });
      }

      // rate limit per IP (x-forwarded-for is set by Vercel's edge)
      var ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      var rl = await redis([['INCR', 'fm-rl:' + ip], ['EXPIRE', 'fm-rl:' + ip, IP_WINDOW]]);
      if(Number(rl[0].result) > IP_LIMIT){
        return res.status(429).json({ ok: false, error: 'the bureaucracy is overwhelmed' });
      }

      var member = JSON.stringify({ n: name, t: Date.now() });
      await redis([
        ['ZADD', 'fm-lb:all', score, member],
        ['ZADD', dayKey(), score, member],
        ['EXPIRE', dayKey(), 172800],
        ['ZREMRANGEBYRANK', 'fm-lb:all', 0, -(KEEP_N + 1)]
      ]);
      var r2 = await redis([['ZREVRANGE', 'fm-lb:all', 0, TOP_N - 1, 'WITHSCORES']]);
      return res.status(200).json({ ok: true, scores: parseEntries(r2[0].result || []) });
    }

    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }catch(e){
    return res.status(503).json({ ok: false, error: 'leaderboard unavailable' });
  }
};
