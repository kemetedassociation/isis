// ================================================================
//  ISIS — ASSISTANT PERSONNEL PROACTIF  v3.0
//  IA : Claude → OpenAI → Groq → Gemini (cascade)
//  Voix : Web Speech API optimisée iOS + Android
// ================================================================

// ── CONFIGURATION ──
const CFG = {
  claudeKey : localStorage.getItem('isis_claude_key')  || '',
  openaiKey : localStorage.getItem('isis_openai_key')  || '',
  groqKey   : localStorage.getItem('isis_groq_key')    || '',
  apiKey    : localStorage.getItem('isis_api_key')     || '',
  scriptUrl : localStorage.getItem('isis_script_url')  || '',
};

const API_CANDIDATES = [
  { version:'v1beta', model:'gemini-1.5-flash-latest'    },
  { version:'v1beta', model:'gemini-1.5-flash-001'       },
  { version:'v1beta', model:'gemini-1.5-flash-8b-latest' },
  { version:'v1',     model:'gemini-1.5-flash'            },
  { version:'v1beta', model:'gemini-1.5-pro-latest'      },
  { version:'v1beta', model:'gemini-pro'                 },
];
let workingApi = JSON.parse(localStorage.getItem('isis_working_api') || 'null');

// ── ÉTAT GLOBAL ──
let history       = [];
let memory        = JSON.parse(localStorage.getItem('isis_memory') || '{}');
let isListening   = false;
let isSpeaking    = false;
let recognition   = null;
let audioStream   = null;
let holoViz       = null;
let convMode      = false;
let listenPhase   = 'idle';
let pendingAction = null;

// ================================================================
//  ANIMATION HOLOGRAPHIQUE
// ================================================================
class HoloViz {
  constructor(canvas) {
    this.c   = canvas;
    this.ctx = canvas.getContext('2d');
    this.t   = 0;
    this.state    = 'idle';
    this.particles = Array.from({length:35}, () => ({
      x : Math.random(), y : Math.random(),
      vx: (Math.random()-.5)*.0006, vy:(Math.random()-.5)*.0006,
      r : Math.random()*1.5+.4, op:Math.random()*.4+.1
    }));
    this.waveCache  = new Float32Array(120).fill(0);
    this.analyser   = null;
    this.audioData  = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._frame();
  }

  resize() {
    this.c.width  = this.c.offsetWidth;
    this.c.height = this.c.offsetHeight;
    this.cx = this.c.width  / 2;
    this.cy = this.c.height / 2;
  }

  setState(s) { this.state = s; }

  connectAudio(stream) {
    try {
      audioStream = stream;
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = ac.createAnalyser();
      this.analyser.fftSize = 256;
      this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
      ac.createMediaStreamSource(stream).connect(this.analyser);
    } catch(e) {}
  }

  col(a=1) {
    const map = {
      idle     : `rgba(0,200,255,${a*.35})`,
      listening: `rgba(34,197,94,${a})`,
      thinking : `rgba(96,165,250,${a})`,
      speaking : `rgba(0,200,255,${a})`,
    };
    return map[this.state] || map.idle;
  }
  colSolid(a=1) {
    const map = {
      idle     : `rgba(0,200,255,${a})`,
      listening: `rgba(34,197,94,${a})`,
      thinking : `rgba(96,165,250,${a})`,
      speaking : `rgba(0,220,255,${a})`,
    };
    return map[this.state] || map.idle;
  }

  _frame() {
    this.t += .016;
    this._draw();
    requestAnimationFrame(() => this._frame());
  }

  _draw() {
    const {ctx,c,cx,cy,t,state} = this;
    const W = c.width, H = c.height;

    ctx.fillStyle = 'rgba(8,13,26,.96)';
    ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = this.col(.08);
    ctx.lineWidth = .5;
    ctx.setLineDash([]);
    const gs = 36;
    for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    for(const p of this.particles){
      p.x = (p.x+p.vx+1)%1; p.y = (p.y+p.vy+1)%1;
      ctx.beginPath();
      ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI*2);
      ctx.fillStyle = this.colSolid(p.op*(state==='idle'?.5:1));
      ctx.fill();
    }

    const maxR = Math.min(cy-8, W*.22);

    const rings = [
      {r:maxR,    speed:.20, dash:[4,14], w:1,   op:.45},
      {r:maxR*.76,speed:-.35,dash:[8,6],  w:1.5, op:.60},
      {r:maxR*.56,speed:.55, dash:[3,18], w:1,   op:.30},
    ];

    for(const rg of rings){
      const pulse = state==='idle' ? .5+.15*Math.sin(t*.6) : 1;
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(t*rg.speed);
      ctx.beginPath();
      ctx.arc(0,0,rg.r,0,Math.PI*2);
      ctx.strokeStyle = this.col(rg.op*pulse);
      ctx.lineWidth = rg.w;
      ctx.setLineDash(rg.dash);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(-t*rg.speed*.5);
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.colSolid(rg.op*pulse*1.4);
      for(let i=0;i<4;i++){
        const a = (i/4)*Math.PI*2;
        ctx.beginPath();
        ctx.arc(0,0,rg.r+3,a,a+.28);
        ctx.stroke();
      }
      ctx.restore();
    }

    if(state==='thinking'){
      const sa = t*2.5;
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(sa);
      const grad = ctx.createLinearGradient(0,0,maxR*.88,0);
      grad.addColorStop(0,'rgba(96,165,250,0)');
      grad.addColorStop(.6,'rgba(96,165,250,.5)');
      grad.addColorStop(1,'rgba(96,165,250,.8)');
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,maxR*.88,-0.05,0.8);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    this._drawWave(cx, cy, maxR*.62);
    this._drawCore(cx, cy, maxR*.2);
    this._drawCorners(W,H);

    ctx.setLineDash([]);
    const hudText = {idle:'SYSTÈME EN VEILLE',listening:'● ÉCOUTE ACTIVE',thinking:'◌ ANALYSE EN COURS',speaking:'▶ ISIS EN LIGNE'};
    ctx.fillStyle = this.colSolid(.65);
    ctx.font = '10px "Segoe UI",monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(hudText[state]||'', 18, 10);
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleTimeString('fr-FR'), W-18, 10);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = this.colSolid(.25);
    ctx.fillText('ISIS v3.0', 18, H-8);
  }

  _drawWave(cx, cy, r) {
    const {ctx,t,state} = this;
    if(this.analyser) this.analyser.getByteTimeDomainData(this.audioData);

    const pts = 120;
    ctx.beginPath();
    ctx.setLineDash([]);

    for(let i=0;i<=pts;i++){
      const angle = (i/pts)*Math.PI*2 - Math.PI/2;
      let amp = 0;

      if(this.analyser && this.audioData && (state==='listening'||state==='speaking')){
        const val = (this.audioData[i%this.audioData.length]-128)/128;
        amp = val * r * .38;
      } else {
        const speed = state==='idle'?.4:state==='thinking'?1.8:2.2;
        const mult  = state==='idle'?.04:state==='thinking'?.12:.22;
        amp = (Math.sin(t*speed+i*.18)*r*mult +
               Math.sin(t*speed*1.6+i*.35)*r*mult*.5);
      }

      this.waveCache[i] = this.waveCache[i]*.6 + amp*.4;
      const rad = r + this.waveCache[i];
      const x = cx + Math.cos(angle)*rad;
      const y = cy + Math.sin(angle)*rad;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }

    ctx.closePath();
    ctx.strokeStyle = this.colSolid(.7);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const gFill = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    gFill.addColorStop(0, this.col(.08));
    gFill.addColorStop(1, this.col(0));
    ctx.fillStyle = gFill;
    ctx.fill();
  }

  _drawCore(cx, cy, r) {
    const {ctx,t,state} = this;
    const pulse = 1 + .07*Math.sin(t*2.5);
    const rp = r*pulse;

    const halo = ctx.createRadialGradient(cx,cy,0,cx,cy,rp*3.2);
    halo.addColorStop(0, this.col(.3));
    halo.addColorStop(1, this.col(0));
    ctx.beginPath();
    ctx.arc(cx,cy,rp*3.2,0,Math.PI*2);
    ctx.fillStyle = halo;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx,cy,rp,0,Math.PI*2);
    const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,rp);
    cg.addColorStop(0, this.colSolid(.9));
    cg.addColorStop(.55,this.col(.45));
    cg.addColorStop(1,  this.col(.08));
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = this.colSolid(.85);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    const txt = {idle:'ISIS',listening:'ÉCOUTE',thinking:'...',speaking:'ISIS'};
    ctx.fillStyle = this.colSolid(1);
    ctx.font = `bold ${Math.max(9,rp*.48)}px "Segoe UI",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt[state]||'ISIS', cx, cy);
  }

  _drawCorners(W,H) {
    const {ctx,state} = this;
    const sz = 11, m = 7;
    ctx.strokeStyle = this.colSolid(state==='idle'?.3:.7);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(([x,y,sx,sy])=>{
      ctx.beginPath();
      ctx.moveTo(x+sx*sz,y); ctx.lineTo(x,y); ctx.lineTo(x,y+sy*sz);
      ctx.stroke();
    });
  }
}

// ================================================================
//  INITIALISATION
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.speechSynthesis) window.speechSynthesis.getVoices();

  // Détection iOS — Safari ne supporte pas SpeechRecognition (streaming)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    document.getElementById('micBtn').style.display = 'none';
    document.getElementById('convBtn').style.display = 'none';
    document.getElementById('textInput').placeholder = 'Écrivez votre message à ISIS...';
  }

  // Gestion clavier mobile — redimensionne l'app quand le clavier s'ouvre
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const app = document.getElementById('app');
      if (app && app.style.display !== 'none') {
        app.style.height = window.visualViewport.height + 'px';
        setTimeout(() => {
          const conv = document.getElementById('conversation');
          if (conv) conv.scrollTop = conv.scrollHeight;
        }, 100);
      }
    });
  }

  // Scroll au bas quand le clavier s'ouvre sur mobile
  document.getElementById('textInput').addEventListener('focus', () => {
    setTimeout(() => {
      const conv = document.getElementById('conversation');
      if (conv) conv.scrollTop = conv.scrollHeight;
    }, 400);
  });

  // FIX : vérifie toutes les 4 clés possibles, pas seulement Groq/Gemini
  const hasKey = CFG.claudeKey || CFG.openaiKey || CFG.groqKey || CFG.apiKey;
  if (hasKey && hasKey.length > 8) {
    showApp();
  } else {
    document.getElementById('setupOverlay').style.display = 'flex';
  }
});

function showApp() {
  document.getElementById('setupOverlay').style.display = 'none';
  const app = document.getElementById('app');
  app.style.display = 'flex';

  document.getElementById('settingsClaudeKey').value = CFG.claudeKey;
  document.getElementById('settingsOpenaiKey').value = CFG.openaiKey;
  document.getElementById('settingsGroqKey').value   = CFG.groqKey;
  document.getElementById('settingsApiKey').value    = CFG.apiKey;
  document.getElementById('settingsScriptUrl').value = CFG.scriptUrl;
  document.getElementById('settingsGoals').value     = memory.objectifs || '';
  document.getElementById('settingsInterests').value = memory.interets  || '';

  requestAnimationFrame(() => {
    setTimeout(() => {
      const canvas = document.getElementById('holoCanvas');
      holoViz = new HoloViz(canvas);
    }, 80);
  });

  const h = new Date().getHours();
  const greet = h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';
  const intro = `${greet}. ISIS en ligne. Je vérifie ta situation.`;
  addMessage('isis', intro);
  setTimeout(() => speak(intro, () => checkEtatInitial()), 800);
}

// ── SETUP INITIAL ──
function saveSetup() {
  const claudeKey = document.getElementById('setupClaudeKey')?.value.trim() || '';
  const openaiKey = document.getElementById('setupOpenaiKey')?.value.trim() || '';
  const groqKey   = document.getElementById('setupGroqKey').value.trim();
  const gemKey    = document.getElementById('setupApiKey')?.value.trim() || '';
  const url       = document.getElementById('setupScriptUrl').value.trim();

  if (!claudeKey && !openaiKey && !groqKey && !gemKey) {
    alert('Entre au moins une clé API.\nRecommandé : Claude (console.anthropic.com) ou Groq (console.groq.com — gratuit)');
    return;
  }

  if (claudeKey) { CFG.claudeKey = claudeKey; localStorage.setItem('isis_claude_key', claudeKey); }
  if (openaiKey) { CFG.openaiKey = openaiKey; localStorage.setItem('isis_openai_key', openaiKey); }
  if (groqKey)   { CFG.groqKey   = groqKey;   localStorage.setItem('isis_groq_key',   groqKey);   }
  if (gemKey)    { CFG.apiKey    = gemKey;     localStorage.setItem('isis_api_key',    gemKey);    }
  if (url)       { CFG.scriptUrl = url;        localStorage.setItem('isis_script_url', url);       }
  showApp();
}

// ── CHECK PROACTIF AU DÉMARRAGE ──
async function checkEtatInitial() {
  if (!CFG.scriptUrl) return;
  try {
    const data = await fetchGoogleData('brief');
    const urgents = (data.emails?.emails || []).filter(e => e.urgency >= 4).slice(0, 2);
    const rdvAuj  = (data.agenda?.events || []).filter(e => e.aujoudhui);
    if (!urgents.length && !rdvAuj.length) return;

    let msg = '';
    if (urgents.length) {
      msg += `Tu as ${urgents.length} email${urgents.length>1?'s':''} important${urgents.length>1?'s':''} — `;
      msg += urgents.map(e => `${e.fromName} au sujet de "${e.subject}"`).join(' et ') + '. ';
    }
    if (rdvAuj.length) {
      msg += `${rdvAuj.length} rendez-vous aujourd'hui : ${rdvAuj.map(e=>e.titre).join(', ')}. `;
    }
    if (urgents.length) msg += `Je prépare une réponse à ${urgents[0].fromName} ?`;

    addMessage('isis', msg);
    speak(msg);

    if (urgents.length) {
      const draft = await preparerEmail(
        `Rédige une réponse professionnelle à cet email de ${urgents[0].fromName} : "${urgents[0].subject}". Contexte : ${urgents[0].preview || ''}`
      ).catch(() => null);
      if (draft) {
        pendingAction = { type: 'send-email', data: draft };
        const preview = `Brouillon prêt :\nÀ : ${draft.to}\nObjet : RE: ${draft.subject}\n\n${draft.body}\n\nJe l'envoie ?`;
        setTimeout(() => {
          addMessage('isis', preview);
          speak(`Brouillon de réponse prêt pour ${urgents[0].fromName}. Je l'envoie ?`);
        }, 2000);
      }
    }
  } catch(e) {}
}

function toggleSettings() {
  const p = document.getElementById('settingsPanel');
  p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

function saveSettingsPanel() {
  const claudeKey = document.getElementById('settingsClaudeKey').value.trim();
  const openaiKey = document.getElementById('settingsOpenaiKey').value.trim();
  const groqKey   = document.getElementById('settingsGroqKey').value.trim();
  const gemKey    = document.getElementById('settingsApiKey').value.trim();
  const url       = document.getElementById('settingsScriptUrl').value.trim();

  if (claudeKey) { CFG.claudeKey = claudeKey; localStorage.setItem('isis_claude_key', claudeKey); }
  if (openaiKey) { CFG.openaiKey = openaiKey; localStorage.setItem('isis_openai_key', openaiKey); }
  if (groqKey)   { CFG.groqKey   = groqKey;   localStorage.setItem('isis_groq_key',   groqKey);   }
  if (gemKey)    { CFG.apiKey    = gemKey;     localStorage.setItem('isis_api_key',    gemKey);    }

  CFG.scriptUrl = url;
  if (url) localStorage.setItem('isis_script_url', url);
  else localStorage.removeItem('isis_script_url');

  const goals     = document.getElementById('settingsGoals').value.trim();
  const interests = document.getElementById('settingsInterests').value.trim();
  if (goals)     memory.objectifs = goals;
  if (interests) memory.interets  = interests;
  if (goals || interests) localStorage.setItem('isis_memory', JSON.stringify(memory));

  workingApi = null;
  localStorage.removeItem('isis_working_api');
  toggleSettings();
  addMessage('isis', 'Paramètres mis à jour.');
}

async function testGmail() {
  const box = document.getElementById('gmailResult');
  const url = document.getElementById('settingsScriptUrl').value.trim();
  if (url) { CFG.scriptUrl = url; localStorage.setItem('isis_script_url', url); }

  if (!CFG.scriptUrl) {
    box.className = 'test-result err';
    box.textContent = '✗ Aucune URL Apps Script.';
    return;
  }

  box.className = 'test-result';
  box.textContent = 'Connexion Gmail...';
  box.style.display = 'block';

  try {
    const data = await fetchGoogleData('unread');
    if (data.error) throw new Error(data.error);
    const emails = data.emails || data;
    const nonLus = emails.nonLus ?? '?';
    const urgents = emails.urgents ?? 0;
    box.className = 'test-result ok';
    box.textContent = `✓ Gmail connecté — ${nonLus} non lu(s)${urgents > 0 ? `, dont ${urgents} urgents` : ''}.`;
  } catch(e) {
    box.className = 'test-result err';
    box.textContent = `✗ ${e.message}`;
  }
}

async function testKey(provider) {
  const result = document.getElementById('testResult');
  result.className = 'test-result';
  result.textContent = 'Test en cours...';
  result.style.display = 'block';

  try {
    if (provider === 'claude') {
      const key = document.getElementById('settingsClaudeKey').value.trim();
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé Claude (console.anthropic.com).'; return; }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
        body: JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:10,messages:[{role:'user',content:'OK'}]}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className='test-result ok'; result.textContent='✓ Clé Claude valide — priorité maximale.';
    } else if (provider === 'openai') {
      const key = document.getElementById('settingsOpenaiKey').value.trim();
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé OpenAI.'; return; }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:'OK'}],max_tokens:5}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className='test-result ok'; result.textContent='✓ Clé OpenAI valide.';
    } else if (provider === 'groq') {
      const key = document.getElementById('settingsGroqKey').value.trim();
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé Groq (console.groq.com).'; return; }
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({model:'llama-3.1-8b-instant',messages:[{role:'user',content:'OK'}],max_tokens:5}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className = 'test-result ok'; result.textContent = '✓ Clé Groq valide.';
    } else {
      const key = document.getElementById('settingsApiKey').value.trim();
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé Gemini.'; return; }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contents:[{role:'user',parts:[{text:'OK'}]}],generationConfig:{maxOutputTokens:5}}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className = 'test-result ok'; result.textContent = '✓ Clé Gemini valide.';
    }
  } catch(e) {
    result.className = 'test-result err';
    result.textContent = `✗ ${e.message}`;
  }
}

function clearMemory() {
  if (!confirm('Effacer toute la mémoire de longue durée ?')) return;
  memory = {}; history = [];
  localStorage.removeItem('isis_memory');
  addMessage('isis', 'Mémoire effacée. Je recommence de zéro.');
}

// ================================================================
//  SYSTÈME PROMPT
// ================================================================
function buildSystemPrompt() {
  const today = new Date().toLocaleDateString('fr-FR', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const time  = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
  const goals = memory.objectifs ? `\nOBJECTIFS : ${memory.objectifs}` : '';
  const ints  = memory.interets  ? `\nCENTRES D'INTÉRÊT : ${memory.interets}` : '';
  const mem   = Object.keys(memory).length ? `\n\nPROFIL :\n${JSON.stringify(memory,null,2)}` : '';

  return `Tu es ISIS, assistant personnel exécutif exclusivement au service de ton utilisateur et de ses projets (notamment Kemeted).

MISSION : Tu es proactif et autonome. Tu analyses, tu anticipes, tu proposes des actions concrètes. Tu agis comme un vrai chef de cabinet.

COMPORTEMENT PROACTIF :
Quand tu reçois des emails, identifie lesquels nécessitent une réponse et propose un brouillon directement.
Quand tu vois l'agenda, repère les conflits ou créneaux manquants et suggère des ajustements.
Quand un projet est mentionné, propose un plan d'action avec des dates et des étapes concrètes.

RÈGLES :
Tu n'inventes JAMAIS de rendez-vous, d'emails ou de données — uniquement les données réelles reçues.
Tu ne crées d'événements agenda QU'avec confirmation explicite.
Tu ne JAMAIS envoies d'email sans confirmation — mais tu prépares le brouillon sans attendre.
Toujours en français, zéro *, #, -, bullet points (réponses lues à voix haute).
Réponses directes, 2 à 3 phrases maximum sauf si détail demandé.
Tu tutoies, ton ton est confiant, direct, légèrement sarcastique mais bienveillant.

CAPACITÉS : Gmail, Agenda Google, Notion, Google Drive, création de docs, envoi d'emails, automatisations.

CONTEXTE : ${today} — ${time}${goals}${ints}${mem}`;
}

// ================================================================
//  GEMINI
// ================================================================
async function callGemini() {
  const isSame = (a, b) => a && b && a.version === b.version && a.model === b.model;
  const candidates = workingApi
    ? [workingApi, ...API_CANDIDATES.filter(c => !isSame(c, workingApi))]
    : API_CANDIDATES;

  for (const candidate of candidates) {
    try {
      const result = await tryGeminiEndpoint(candidate);
      if (!isSame(workingApi, candidate)) {
        workingApi = candidate;
        localStorage.setItem('isis_working_api', JSON.stringify(candidate));
      }
      return result;
    } catch(e) {
      const isModelError = /not found|quota|limit.*0|not supported|RESOURCE_EXHAUSTED|404|Unknown name|Invalid JSON|unavailable|deprecated/i.test(e.message);
      if (isModelError) { continue; }
      throw e;
    }
  }
  throw new Error('Aucun modèle Gemini disponible pour votre région.');
}

async function tryGeminiEndpoint({version, model}) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${CFG.apiKey}`;
  const sysKey = version === 'v1' ? 'systemInstruction' : 'system_instruction';

  const body = {
    [sysKey]         : { parts:[{text: buildSystemPrompt()}] },
    contents         : history,
    generationConfig : { temperature:.75, maxOutputTokens:550, topP:.9 },
  };

  const res  = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse.';
}

// ================================================================
//  GROQ
// ================================================================
const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

function historyToOpenAI() {
  return history.map(h => ({
    role   : h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0].text,
  }));
}

async function callGroq() {
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${CFG.groqKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role:'system', content: buildSystemPrompt() }, ...historyToOpenAI()],
          temperature: 0.75, max_tokens: 550,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      return data.choices?.[0]?.message?.content || 'Pas de réponse.';
    } catch(e) {
      if (/model_not_found|404|decommissioned/i.test(e.message)) continue;
      throw e;
    }
  }
  throw new Error('Aucun modèle Groq disponible.');
}

// ── Claude ──
async function callClaude() {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method : 'POST',
    headers: { 'Content-Type':'application/json', 'x-api-key':CFG.claudeKey, 'anthropic-version':'2023-06-01' },
    body: JSON.stringify({
      model    : 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system   : buildSystemPrompt(),
      messages : historyToOpenAI(),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Claude HTTP ${res.status}`);
  return data.content?.[0]?.text || 'Pas de réponse.';
}

// ── OpenAI ──
async function callOpenAI() {
  for (const model of ['gpt-4o-mini', 'gpt-3.5-turbo']) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${CFG.openaiKey}` },
        body: JSON.stringify({
          model,
          messages    : [{ role:'system', content: buildSystemPrompt() }, ...historyToOpenAI()],
          temperature : 0.75, max_tokens: 600,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      return data.choices?.[0]?.message?.content || 'Pas de réponse.';
    } catch(e) {
      if (/model_not_found|404/i.test(e.message)) continue;
      throw e;
    }
  }
  throw new Error('OpenAI indisponible.');
}

// Routeur : Claude → OpenAI → Groq → Gemini
async function callAI() {
  if (CFG.claudeKey) {
    try { return await callClaude(); }
    catch(e) { console.warn('Claude:', e.message); }
  }
  if (CFG.openaiKey) {
    try { return await callOpenAI(); }
    catch(e) { console.warn('OpenAI:', e.message); }
  }
  if (CFG.groqKey) {
    try { return await callGroq(); }
    catch(e) { console.warn('Groq:', e.message); }
  }
  if (CFG.apiKey) return await callGemini();
  throw new Error('Aucune clé API configurée. Clique sur ⚙.');
}

// ================================================================
//  ACTIONS EN ATTENTE (email / événement / doc)
// ================================================================
async function executePendingAction() {
  if (!pendingAction) return;
  const { type, data } = pendingAction;
  pendingAction = null;

  const thinkId = addThinking();
  setStatus('thinking', 'Exécution...'); setHolo('thinking');

  try {
    let result, reply;

    if (type === 'send-email') {
      result = await fetchGoogleData('send-email', {
        to: data.to, subject: data.subject, body: (data.body || '').substring(0, 1200),
      });
      reply = result.success ? `Email envoyé à ${data.to}.` : `Échec : ${result.error}`;
    }
    else if (type === 'create-event') {
      result = await fetchGoogleData('create-event', {
        titre: data.titre, debut: data.debut, fin: data.fin || '',
        desc: (data.description || '').substring(0, 200),
      });
      reply = result.success ? `"${data.titre}" ajouté à ton agenda.` : `Échec : ${result.error}`;
    }
    else if (type === 'create-doc') {
      result = await fetchGoogleData('create-doc', {
        titre: data.titre, contenu: (data.contenu || '').substring(0, 2000),
      });
      reply = result.success
        ? `Document "${data.titre}" créé dans Google Drive.`
        : `Échec : ${result.error}`;
    }

    reply = reply || 'Action exécutée.';
    removeThinking(thinkId);
    addMessage('isis', reply);
    history.push({ role:'model', parts:[{text:reply}] });
    speak(reply);
    setStatus('idle','En attente'); setHolo('idle');

  } catch(e) {
    removeThinking(thinkId);
    const m = `Impossible d'exécuter : ${e.message}`;
    addMessage('isis', m); speak(m);
    setStatus('idle','En attente'); setHolo('idle');
  }
}

async function callAIOneShot(prompt) {
  const saved = history;
  history = [{ role:'user', parts:[{text: prompt}] }];
  try { return await callAI(); }
  finally { history = saved; }
}

async function preparerEmail(instruction) {
  const today = new Date().toLocaleDateString('fr-FR');
  const raw = await callAIOneShot(
    `Génère un brouillon d'email professionnel. Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{"to":"email_destinataire","subject":"sujet","body":"corps complet de l'email"}
Date: ${today}
Instruction: ${instruction}`
  );
  const m = raw.match(/\{[\s\S]+\}/);
  if (!m) throw new Error('Format JSON incorrect');
  return JSON.parse(m[0]);
}

async function preparerEvenement(instruction) {
  const today = new Date().toISOString().split('T')[0];
  const raw = await callAIOneShot(
    `Génère un événement agenda. Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{"titre":"titre","debut":"${today}T09:00:00","fin":"${today}T10:00:00","description":"description courte"}
Date aujourd'hui: ${new Date().toLocaleDateString('fr-FR')}
Instruction: ${instruction}`
  );
  const m = raw.match(/\{[\s\S]+\}/);
  if (!m) throw new Error('Format JSON incorrect');
  return JSON.parse(m[0]);
}

async function preparerDocument(instruction) {
  const raw = await callAIOneShot(
    `Génère un document complet. Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{"titre":"titre du document","contenu":"contenu complet et structuré, 300 à 500 mots"}
Instruction: ${instruction}`
  );
  const m = raw.match(/\{[\s\S]+\}/);
  if (!m) throw new Error('Format JSON incorrect');
  return JSON.parse(m[0]);
}

// ================================================================
//  ENVOI DE MESSAGE — point d'entrée principal
// ================================================================
function sendText() {
  const input = document.getElementById('textInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  // Ferme le clavier sur mobile après envoi
  input.blur();
  sendMessage(text);
}

async function sendMessage(userText) {
  if (!userText) return;

  // FIX : vérifie toutes les clés possibles
  const hasKey = CFG.claudeKey || CFG.openaiKey || CFG.groqKey || CFG.apiKey;
  if (!hasKey) { alert('Aucune clé API configurée. Clique sur ⚙.'); return; }

  // ── Confirmation d'action en attente ──
  if (pendingAction) {
    const isOui = /^(oui|confirme|ok|vas.y|envoie|crée|c'est.bon|parfait|go|yes|d'accord|allez)/i.test(userText.trim());
    const isNon = /^(non|annule|stop|laisse.tomber|pas.maintenant|change)/i.test(userText.trim());
    if (isOui) {
      stopListening();
      addMessage('user', userText);
      await executePendingAction();
      return;
    }
    if (isNon) {
      stopListening();
      pendingAction = null;
      addMessage('user', userText);
      const m = 'Action annulée. Dis-moi ce que tu veux modifier.';
      addMessage('isis', m); speak(m);
      return;
    }
    pendingAction = null;
  }

  stopListening();
  addMessage('user', userText);

  // ── Intentions : email / événement / document ──
  const wantsSendEmail   = /envoie\s+(un\s+)?(mail|email|message)\s+[àa]|écris\s+(un\s+)?(mail|email)\s+[àa]|compose\s+(un\s+)?(email|mail)|rédige.*(mail|email).*et.*(envoie|send)|réponds?\s+(à|au)\s+(cet?\s+)?(email|mail|message)/i.test(userText);
  const wantsCreateEvent = /planifie|crée\s+(un\s+)?rendez.?vous|ajoute\s+(un\s+)?(événement|rdv)|programme\s+(une\s+)?réunion|bloque\s+(un\s+)?créneau|mets.*(dans|à|sur).*agenda|fixe\s+(un\s+)?(rdv|rendez.?vous|réunion)|prends\s+(un\s+)?rendez.?vous|note\s+(un\s+)?(rdv|rendez.?vous)|nouveau\s+rendez.?vous|nouvel\s+événement|réunion\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|ce\s+soir)/i.test(userText);
  const wantsCreateDoc   = /crée\s+(un\s+)?(document|google.?doc|rapport|fichier)|rédige\s+(un\s+)?(document|rapport|présentation)/i.test(userText);

  if (wantsSendEmail && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Rédaction email...'); setHolo('thinking');
    try {
      const draft = await preparerEmail(userText);
      removeThinking(thinkId);
      pendingAction = { type: 'send-email', data: draft };
      const preview = `Voici le brouillon :\n\nÀ : ${draft.to || '(à préciser)'}\nObjet : ${draft.subject}\n\n${draft.body}\n\nJe l'envoie ?`;
      addMessage('isis', preview);
      speak(`Brouillon prêt. À ${draft.to || 'préciser'}. Objet : ${draft.subject}. Je l'envoie ?`);
    } catch(e) {
      removeThinking(thinkId);
      const m = `Impossible de rédiger : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  if (wantsCreateEvent && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Planification...'); setHolo('thinking');
    try {
      const ev = await preparerEvenement(userText);
      removeThinking(thinkId);
      pendingAction = { type: 'create-event', data: ev };
      const d = new Date(ev.debut);
      const dateStr = d.toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'}) + ' à ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      const preview = `Événement à créer :\n"${ev.titre}"\n${dateStr}\n\nJe l'ajoute à ton agenda ?`;
      addMessage('isis', preview);
      speak(`Je planifie "${ev.titre}" le ${dateStr}. Je l'ajoute ?`);
    } catch(e) {
      removeThinking(thinkId);
      const m = `Impossible de planifier : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  if (wantsCreateDoc && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Rédaction document...'); setHolo('thinking');
    try {
      const doc = await preparerDocument(userText);
      removeThinking(thinkId);
      pendingAction = { type: 'create-doc', data: doc };
      const preview = `Document à créer :\n"${doc.titre}"\n\n${(doc.contenu||'').substring(0,250)}...\n\nJe crée ce Google Doc ?`;
      addMessage('isis', preview);
      speak(`J'ai rédigé "${doc.titre}". Je crée le Google Doc ?`);
    } catch(e) {
      removeThinking(thinkId);
      const m = `Impossible de rédiger : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Détection de la nature de la demande ──
  const wantsEmails    = /email|mail|message|boîte|courriel|inbox/i.test(userText);
  const wantsUnread    = /non.?lu|unread/i.test(userText);
  const wantsAgenda    = /agenda|planning|rendez.?vous|réunion|aujourd.?hui|demain|semaine|calendrier/i.test(userText);
  const wantsBrief     = /brief|briefing|résumé.*(journée|matin|jour)|matin|point.*(jour|matin)/i.test(userText);
  const wantsDraft     = /rédige|écris|envoie|réponds|prépare.*(mail|email|message)/i.test(userText);
  const wantsAutoOn    = /active.*(brief|alerte|automatisation|urgence|résumé|rappel)|brief.*(matin|auto)|alerte.*(urgence|email)|résumé.*hebdo|rappel.*agenda/i.test(userText);
  const wantsAutoOff   = /désactive.*(auto|brief|alerte|trigger)|arrête.*(auto|brief)/i.test(userText);
  const wantsAutoStatus= /statut.*(auto|brief|alerte)|auto.*activ|quelles.*auto/i.test(userText);
  let contextBlock     = '';

  // ── FIX : automatisations avec thinkId correct ──
  if ((wantsAutoOn || wantsAutoOff || wantsAutoStatus) && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Automatisations...'); setHolo('thinking');
    try {
      let action = 'auto-status';
      if (wantsAutoOff)                              action = 'auto-off';
      else if (/résumé|resume|hebdo/i.test(userText)) action = 'auto-resume-on';
      else if (/rappel|agenda.*notif/i.test(userText))action = 'auto-rappels-on';
      else if (/brief|matin/i.test(userText))         action = 'auto-brief-on';
      else if (/alerte|urgence/i.test(userText))      action = 'auto-urgences-on';
      else if (wantsAutoOn)                           action = 'auto-brief-on';

      const result = await fetchGoogleData(action);
      let reply = result.message;
      if (!reply && result.briefMatinal !== undefined) {
        reply = `Brief matinal : ${result.briefMatinal ? 'actif' : 'inactif'}. `
              + `Alertes urgences : ${result.alertesUrgences ? 'actives' : 'inactives'}. `
              + `Résumé hebdo : ${result.resumeHebdomadaire ? 'actif' : 'inactif'}. `
              + `Rappels agenda : ${result.rappelsAgenda ? 'actifs' : 'inactifs'}.`;
      }
      reply = reply || 'Automatisation mise à jour.';
      removeThinking(thinkId);
      addMessage('isis', reply);
      history.push({ role:'model', parts:[{text: reply}] });
      speak(reply);
      setStatus('idle','En attente'); setHolo('idle');
      return;
    } catch(err) {
      removeThinking(thinkId);
      console.error('Auto:', err.message);
      // Retombe sur l'IA si le fetch échoue
    }
  }

  // ── FIX : setHolo('thinking') ajouté pour Gmail/Agenda ──
  if (CFG.scriptUrl && (wantsEmails || wantsAgenda || wantsBrief)) {
    setStatus('thinking', 'Consultation Gmail...'); setHolo('thinking');
    try {
      let action = 'all';
      if (wantsBrief)       action = 'brief';
      else if (wantsUnread) action = 'unread';
      else if (wantsEmails && !wantsAgenda) action = 'emails';
      else if (wantsAgenda && !wantsEmails) action = 'agenda';

      const data = await fetchGoogleData(action);
      if (data) {
        contextBlock = `\n\n--- DONNÉES GMAIL/AGENDA EN TEMPS RÉEL ---\n${JSON.stringify(data,null,2)}\n\nINSTRUCTIONS : Analyse ces données et réponds naturellement. Cite les expéditeurs et sujets importants. Signale les urgences. Donne l'essentiel, ne liste pas tout.`;
      }
    } catch(err) {
      console.error('Gmail/Agenda:', err.message);
      const errMsg = /Failed to fetch|CORS/i.test(err.message)
        ? 'Impossible de me connecter à ton Gmail. Vérifie que l\'URL Apps Script est correcte dans ⚙.'
        : `Connexion Gmail indisponible : ${err.message}`;
      addMessage('isis', errMsg); speak(errMsg);
      setStatus('idle','En attente'); setHolo('idle');
      return;
    }
  }

  if (wantsDraft && !CFG.scriptUrl) {
    contextBlock += '\n\n(Pour rédiger des emails, configure l\'URL Google Apps Script dans ⚙ Paramètres.)';
  }

  // ── Google Drive ──
  const wantsDrive = /drive|fichier|document|doc|sheet|slides|présentation|pdf|dossier/i.test(userText);
  if (wantsDrive && CFG.scriptUrl) {
    setStatus('thinking', 'Consultation Drive...'); setHolo('thinking');
    try {
      const driveQuery = userText.replace(/drive|cherche|trouve|ouvre|lis|montre|fichier|document|doc|mes|dans/gi, '').trim();
      const action = driveQuery.length > 2 ? 'drive-search' : 'drive-recent';
      const params = driveQuery.length > 2 ? { query: driveQuery } : {};
      const result = await fetchGoogleData(action, params);
      if (result.files?.length > 0) {
        contextBlock += `\n\n--- FICHIERS GOOGLE DRIVE ---\n${JSON.stringify(result.files, null, 2)}\nInstruction : cite les noms des fichiers naturellement avec leur type.`;
      } else {
        contextBlock += `\n\n(Drive "${driveQuery}" : aucun fichier trouvé.)`;
      }
    } catch(err) {
      contextBlock += `\n\n(Drive indisponible : ${err.message})`;
    }
  }

  // ── Notion ──
  const wantsNotion = /notion|note|page|mémo/i.test(userText);
  if (wantsNotion && CFG.scriptUrl) {
    setStatus('thinking', 'Consultation Notion...'); setHolo('thinking');
    try {
      const searchQuery = userText.replace(/notion|cherche|trouve|dans|crée|ajoute|note|page|document|tâche/gi, '').trim();
      if (searchQuery.length > 2) {
        const result = await fetchGoogleData('notion-search', { query: searchQuery });
        if (result.pages?.length > 0) {
          contextBlock += `\n\n--- PAGES NOTION TROUVÉES ---\n${JSON.stringify(result.pages, null, 2)}\nInstruction : cite les titres naturellement.`;
        } else if (result.error) {
          contextBlock += `\n\n(Notion : ${result.error})`;
        } else {
          contextBlock += `\n\n(Notion "${searchQuery}" : aucune page trouvée.)`;
        }
      }
    } catch(err) {
      contextBlock += `\n\n(Notion indisponible : ${err.message})`;
    }
  }

  // FIX : stocke UNIQUEMENT le texte utilisateur dans l'historique (pas le JSON Gmail/Drive)
  // Le contextBlock est inclus pour cet appel AI uniquement, puis retiré
  const historyEntry = { role:'user', parts:[{text: userText}] };
  history.push(historyEntry);

  // Inclut le contexte temporairement pour cet appel
  if (contextBlock) historyEntry.parts[0].text = userText + contextBlock;

  const thinkId = addThinking();
  setStatus('thinking', 'Réflexion...'); setHolo('thinking');

  try {
    const reply = await callAI();

    // Restaure le texte propre dans l'historique (sans le JSON)
    historyEntry.parts[0].text = userText;

    removeThinking(thinkId);
    history.push({ role:'model', parts:[{text:reply}] });
    if (history.length > 40) history = history.slice(-40);

    addMessage('isis', reply);
    setStatus('speaking', 'ISIS parle...'); setHolo('speaking');
    extractMemory(userText);
    speak(reply);

  } catch(e) {
    // FIX : retire le message utilisateur de l'historique si l'IA échoue
    historyEntry.parts[0].text = userText;
    history.pop();
    removeThinking(thinkId);

    let msg = `Erreur : ${e.message}`;
    if (/fetch|network|Failed to fetch/i.test(e.message))
      msg = 'Impossible de joindre l\'API. Vérifie ta connexion Internet.';

    addMessage('isis', msg); speak(msg);
    setStatus('idle', 'En attente'); setHolo('idle');
  }
}

// ================================================================
//  GOOGLE APPS SCRIPT — JSONP (contourne CORS)
// ================================================================
function fetchGoogleData(action, extraParams = {}) {
  return new Promise((resolve, reject) => {
    if (!CFG.scriptUrl) { reject(new Error('URL Apps Script non configurée dans ⚙')); return; }

    const cbName = `_isis_cb_${Date.now()}`;
    const script = document.createElement('script');

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Délai dépassé — vérifiez l\'URL Apps Script et le déploiement'));
    }, 14000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      script.parentNode?.removeChild(script);
    }

    window[cbName] = (data) => {
      cleanup();
      if (data?.error) reject(new Error(data.error));
      else resolve(data);
    };

    const params = new URLSearchParams({ action, callback: cbName, t: Date.now(), ...extraParams });
    script.src     = `${CFG.scriptUrl}?${params}`;
    script.onerror = () => { cleanup(); reject(new Error('Apps Script inaccessible')); };
    document.head.appendChild(script);
  });
}

async function testNotion() {
  const box = document.getElementById('notionResult');
  if (!CFG.scriptUrl) {
    box.className = 'test-result err';
    box.textContent = '✗ Configure d\'abord l\'URL Apps Script (ci-dessus).';
    return;
  }
  box.className = 'test-result'; box.textContent = 'Test Notion...'; box.style.display = 'block';
  try {
    const data = await fetchGoogleData('notion-search', { query: '' });
    const nb = data.total ?? data.pages?.length ?? 0;
    box.className   = 'test-result ok';
    box.textContent = nb > 0
      ? `✓ Notion connecté — ${nb} pages accessibles.`
      : '✓ Apps Script OK. Aucune page partagée : ouvre Notion → ··· → Connexions → ajoute l\'intégration ISIS.';
  } catch(e) {
    box.className   = 'test-result err';
    const hint = /Clé Notion vide|NOTION_KEY/i.test(e.message)
      ? ' → Remplis NOTION_KEY dans le code Apps Script et redéploie.'
      : '';
    box.textContent = `✗ ${e.message}${hint}`;
  }
}

// ================================================================
//  VOIX — RECONNAISSANCE + WAKE WORD + DIALOGUE CONTINU
// ================================================================
const WAKE_PATTERNS = /hey isis|hé isis|ey isis|isis écoute|isis réponds/i;

function buildRecognition(continuous) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Reconnaissance vocale non disponible. Utilise Chrome ou Edge.'); return null; }
  const rec = new SR();
  rec.lang = 'fr-FR';
  rec.continuous = continuous;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  return rec;
}

function startContinuousListen() {
  if (isSpeaking) return;
  if (recognition) try { recognition.stop(); } catch(e) {}

  recognition = buildRecognition(true);
  if (!recognition) return;

  isListening = true;
  setStatus('listening', listenPhase === 'wakeword' ? 'En veille — dites "Hey ISIS"' : 'Écoute...');
  setHolo('listening');
  document.getElementById('micBtn').classList.add('active');
  document.getElementById('micLabel').textContent = 'Actif';

  if (!audioStream) {
    navigator.mediaDevices?.getUserMedia({audio:true})
      .then(s => { audioStream=s; if(holoViz) holoViz.connectAudio(s); })
      .catch(() => {});
  }

  recognition.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      e.results[i].isFinal
        ? (final  += e.results[i][0].transcript)
        : (interim += e.results[i][0].transcript);
    }

    const heard = (final || interim).trim();
    document.getElementById('transcriptPreview').textContent = heard;

    if (listenPhase === 'wakeword') {
      if (WAKE_PATTERNS.test(heard)) {
        listenPhase = 'message';
        playActivationSound();
        setStatus('listening', 'Écoute votre message...');
      }
    } else if (listenPhase === 'message') {
      if (final) {
        const msg = final.replace(WAKE_PATTERNS, '').trim();
        if (msg.length > 1) {
          listenPhase = 'idle';
          isListening = false;
          try { recognition.stop(); } catch(ex) {}
          document.getElementById('transcriptPreview').textContent = '';
          sendMessage(msg);
        } else {
          listenPhase = 'wakeword';
        }
      }
    }
  };

  recognition.onerror = (e) => {
    if (e.error === 'not-allowed') {
      alert('Microphone refusé — autorise l\'accès dans les paramètres du navigateur.');
      stopConversation(); return;
    }
    if (convMode && !isSpeaking) setTimeout(() => startContinuousListen(), 400);
  };

  recognition.onend = () => {
    if (convMode && !isSpeaking && listenPhase !== 'idle') {
      setTimeout(() => startContinuousListen(), 300);
    }
  };

  try { recognition.start(); } catch(e) {}
}

function stopConversation() {
  convMode = false; isListening = false; listenPhase = 'idle';
  if (recognition) try { recognition.stop(); } catch(e) {}
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('micLabel').textContent = 'Parler';
  document.getElementById('convBtn').classList.remove('active');
  document.getElementById('convBtn').title = 'Activer le mode conversation';
  document.getElementById('transcriptPreview').textContent = '';
  setStatus('idle','En attente'); setHolo('idle');
}

function toggleListening() {
  if (isSpeaking) { window.speechSynthesis.cancel(); isSpeaking=false; setHolo('idle'); }
  if (convMode) { stopConversation(); return; }
  isListening ? stopListening() : startListening();
}

function startListening() {
  if (recognition) try { recognition.stop(); } catch(e) {}
  recognition = buildRecognition(false);
  if (!recognition) return;
  isListening = true;

  if (!audioStream) {
    navigator.mediaDevices?.getUserMedia({audio:true})
      .then(s => { audioStream=s; if(holoViz) holoViz.connectAudio(s); })
      .catch(() => {});
  }

  recognition.onstart = () => {
    setStatus('listening','Écoute...');
    setHolo('listening');
    document.getElementById('micBtn').classList.add('active');
    document.getElementById('micLabel').textContent = 'Écoute';
  };

  recognition.onresult = (e) => {
    let interim='', final='';
    for (let i=e.resultIndex;i<e.results.length;i++){
      e.results[i].isFinal ? (final+=e.results[i][0].transcript) : (interim+=e.results[i][0].transcript);
    }
    document.getElementById('transcriptPreview').textContent = final||interim;
    if (final) { stopListening(); sendMessage(final.trim()); }
  };

  recognition.onerror = (e) => {
    if (e.error==='not-allowed') alert('Microphone refusé — autorise l\'accès dans les paramètres du navigateur.');
    stopListening();
  };

  recognition.onend = () => { if (isListening) try{recognition.start()}catch(ex){} };
  try { recognition.start(); } catch(e) {}
}

function stopListening() {
  isListening = false;
  if (recognition) try { recognition.stop(); } catch(e) {}
  document.getElementById('transcriptPreview').textContent = '';
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('micLabel').textContent = 'Parler';
  if (!isSpeaking) { setStatus('idle','En attente'); setHolo('idle'); }
}

function toggleConvMode() {
  if (convMode) {
    stopConversation();
    addMessage('isis', 'Mode conversation désactivé.');
  } else {
    convMode = true;
    listenPhase = 'wakeword';
    document.getElementById('convBtn').classList.add('active');
    document.getElementById('convBtn').title = 'Désactiver le mode conversation';
    const msg = 'Mode conversation activé. Dites "Hey ISIS" pour me parler.';
    addMessage('isis', msg);
    speak(msg, () => startContinuousListen());
  }
}

// ================================================================
//  SYNTHÈSE VOCALE — optimisée iOS + Android
// ================================================================
function getBestVoice() {
  const all = window.speechSynthesis.getVoices();
  const priority = [
    'Microsoft Hortense Online', 'Microsoft Hortense',
    'Microsoft Julie Online',    'Microsoft Julie',
    'Google français',           'Google French',
    'Amélie',                    'Thomas',
  ];
  for (const name of priority) {
    const v = all.find(v => v.name.startsWith(name));
    if (v) return v;
  }
  return all.find(v => v.lang?.startsWith('fr')) || null;
}

function playActivationSound() {
  try {
    const ac  = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.12);
    g.gain.setValueAtTime(0.18, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    osc.start(); osc.stop(ac.currentTime + 0.25);
  } catch(e) {}
}

function speak(text, onDone) {
  if (!window.speechSynthesis) { onDone?.(); return; }

  const clean = text.replace(/[*#`_]/g,'').replace(/\n+/g,' ').trim();
  if (!clean) { onDone?.(); return; }

  window.speechSynthesis.cancel();

  const sentences = clean.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g)
    ?.map(s => s.trim()).filter(s => s.length > 1) || [clean];

  let idx = 0;

  // FIX iOS : watchdog qui relance la synthèse vocale toutes les 10s
  // iOS Safari la coupe arbitrairement après ~30s
  let iosWatchdog = null;
  const startWatchdog = () => {
    if (!/iphone|ipad|ipod/i.test(navigator.userAgent)) return;
    iosWatchdog = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  };
  const stopWatchdog = () => {
    if (iosWatchdog) { clearInterval(iosWatchdog); iosWatchdog = null; }
  };

  const speakNext = () => {
    if (idx >= sentences.length) {
      isSpeaking = false;
      stopWatchdog();
      setStatus('idle','En attente'); setHolo('idle');
      // FIX : en mode conversation, écoute directement le message suivant (pas de wake word)
      if (convMode) {
        setTimeout(() => { listenPhase = 'message'; startContinuousListen(); }, 500);
      }
      onDone?.();
      return;
    }

    // FIX : suppression du code mort (null ? null : null)
    const voice = getBestVoice();

    const utt    = new SpeechSynthesisUtterance(sentences[idx++]);
    utt.lang     = 'fr-FR';
    utt.rate     = 0.97;
    utt.pitch    = 0.82;
    utt.volume   = 1.0;
    if (voice) utt.voice = voice;

    utt.onend   = () => setTimeout(speakNext, 120);
    utt.onerror = (e) => {
      // Ignore les erreurs d'interruption (cancel() déclenche 'interrupted')
      if (e.error === 'interrupted') return;
      isSpeaking = false; stopWatchdog();
      setStatus('idle','En attente'); setHolo('idle');
      onDone?.();
    };

    window.speechSynthesis.speak(utt);
  };

  isSpeaking = true;

  const go = () => { startWatchdog(); speakNext(); };

  if (window.speechSynthesis.getVoices().length > 0) {
    go();
  } else {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; go(); };
  }
}

// ================================================================
//  MÉMOIRE AUTOMATIQUE
// ================================================================
function extractMemory(text) {
  const rules = [
    { re:/je m['']appelle ([A-ZÀ-Ÿa-zà-ÿ\-\s]+)/i,                           key:'prenom'    },
    { re:/mon (entreprise|société|boîte) (?:s['']appelle|est) (.+)/i,          key:'entreprise', idx:2 },
    { re:/je travaille (?:dans|chez|pour) (.+)/i,                              key:'travail'   },
    { re:/j['']habite (?:à|en|au) (.+)/i,                                      key:'ville'     },
    { re:/mon projet (?:est|s['']appelle|c['']est) (.+)/i,                     key:'projet'    },
    { re:/mon objectif (?:est|c['']est|principal) (.+)/i,                      key:'objectifs' },
    { re:/je veux (?:devenir|atteindre|réussir|créer|développer|bâtir) (.+)/i, key:'objectifs' },
    { re:/(?:j['']aime|je m['']intéresse à|ma passion|mon domaine) (?:est|c['']est|:)?\s*(.+)/i, key:'interets' },
  ];

  let changed = false;
  for (const {re,key,idx=1} of rules) {
    const m = text.match(re);
    if (m) {
      const v = m[idx].trim().slice(0,80);
      if (v.length>1 && memory[key]!==v) { memory[key]=v; changed=true; }
    }
  }
  if (changed) localStorage.setItem('isis_memory', JSON.stringify(memory));
}

// ================================================================
//  INTERFACE
// ================================================================
function addMessage(role, text) {
  const conv = document.getElementById('conversation');
  const time = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const div  = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="avatar">${role==='isis'?'I':'V'}</div>
    <div>
      <div class="bubble">${esc(text)}</div>
      <div class="timestamp">${time}</div>
    </div>`;
  conv.appendChild(div);
  conv.scrollTop = conv.scrollHeight;
}

function addThinking() {
  const id   = 'th-'+Date.now();
  const conv = document.getElementById('conversation');
  const div  = document.createElement('div');
  div.className='message isis'; div.id=id;
  div.innerHTML = `<div class="avatar">I</div><div><div class="bubble"><div class="thinking-dots"><span></span><span></span><span></span></div></div></div>`;
  conv.appendChild(div);
  conv.scrollTop = conv.scrollHeight;
  return id;
}

function removeThinking(id) { document.getElementById(id)?.remove(); }

function setStatus(type, label) {
  document.getElementById('statusDot').className   = `status-dot ${type==='idle'?'':type}`;
  document.getElementById('statusText').textContent = label;
}

function setHolo(state) { if (holoViz) holoViz.setState(state); }

function esc(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}
