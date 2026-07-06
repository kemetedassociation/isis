// ================================================================
//  ISIS — ASSISTANT PERSONNEL PROACTIF
//  IA : Claude → OpenAI → Groq → Gemini (cascade)
//  Voix : Web Speech API optimisée
// ================================================================

// ── CONFIGURATION ──
const CFG = {
  claudeKey : localStorage.getItem('isis_claude_key')  || '',
  openaiKey : localStorage.getItem('isis_openai_key')  || '',
  groqKey   : localStorage.getItem('isis_groq_key')    || '',
  apiKey    : localStorage.getItem('isis_api_key')     || '',
  scriptUrl : localStorage.getItem('isis_script_url')  || '',
};

// Ordre de tentative — ISIS essaie chacun jusqu'à ce qu'un fonctionne
const API_CANDIDATES = [
  { version:'v1beta', model:'gemini-1.5-flash-latest'    },
  { version:'v1beta', model:'gemini-1.5-flash-001'       },
  { version:'v1beta', model:'gemini-1.5-flash-8b-latest' },
  { version:'v1beta', model:'gemini-1.5-flash-8b-001'    },
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
let voices        = [];
let audioStream   = null;
let holoViz       = null;
let convMode      = false;
let listenPhase   = 'idle';
let pendingAction = null;    // action en attente de confirmation

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
    } catch(e) { /* audio viz not critical */ }
  }

  // Couleur selon état
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

    // Fond
    ctx.fillStyle = 'rgba(8,13,26,.96)';
    ctx.fillRect(0,0,W,H);

    // Grille
    ctx.strokeStyle = this.col(.08);
    ctx.lineWidth = .5;
    ctx.setLineDash([]);
    const gs = 36;
    for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // Particules
    for(const p of this.particles){
      p.x = (p.x+p.vx+1)%1; p.y = (p.y+p.vy+1)%1;
      ctx.beginPath();
      ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI*2);
      ctx.fillStyle = this.colSolid(p.op*(state==='idle'?.5:1));
      ctx.fill();
    }

    const maxR = Math.min(cy-8, W*.22);

    // ── Anneaux rotatifs ──
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

      // Segments d'arc HUD
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

    // ── Scanning (thinking) ──
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

    // ── Forme d'onde ──
    this._drawWave(cx, cy, maxR*.62);

    // ── Noyau central ──
    this._drawCore(cx, cy, maxR*.2);

    // ── Coins HUD ──
    this._drawCorners(W,H);

    // ── Texte HUD ──
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
    ctx.fillText('ISIS v2.0', 18, H-8);
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

      // Lissage
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

    // Halo
    const halo = ctx.createRadialGradient(cx,cy,0,cx,cy,rp*3.2);
    halo.addColorStop(0, this.col(.3));
    halo.addColorStop(1, this.col(0));
    ctx.beginPath();
    ctx.arc(cx,cy,rp*3.2,0,Math.PI*2);
    ctx.fillStyle = halo;
    ctx.fill();

    // Cercle
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

    // Texte
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
  // BUG FIX : voix chargées de manière asynchrone sur Chrome — on attend l'événement
  const loadVoices = () => { voices = window.speechSynthesis.getVoices(); };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;

  // Détection iOS — Safari ne supporte pas SpeechRecognition
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    document.getElementById('micBtn').style.display = 'none';
    document.getElementById('convBtn').style.display = 'none';
    document.getElementById('textInput').placeholder = 'Écrivez votre message à ISIS...';
  }

  const hasKey = localStorage.getItem('isis_groq_key') || localStorage.getItem('isis_api_key')
               || localStorage.getItem('isis_claude_key') || localStorage.getItem('isis_openai_key');
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

  // Pré-remplit les paramètres
  document.getElementById('settingsClaudeKey').value = localStorage.getItem('isis_claude_key')  || '';
  document.getElementById('settingsOpenaiKey').value = localStorage.getItem('isis_openai_key')  || '';
  document.getElementById('settingsGroqKey').value   = localStorage.getItem('isis_groq_key')    || '';
  document.getElementById('settingsApiKey').value    = localStorage.getItem('isis_api_key')     || '';
  document.getElementById('settingsScriptUrl').value = localStorage.getItem('isis_script_url')  || '';
  document.getElementById('settingsGoals').value     = memory.objectifs || '';
  document.getElementById('settingsInterests').value = memory.interets  || '';

  // BUG FIX : attendre que le DOM soit peint avant d'accéder à offsetWidth du canvas
  requestAnimationFrame(() => {
    setTimeout(() => {
      const canvas = document.getElementById('holoCanvas');
      holoViz = new HoloViz(canvas);
    }, 80);
  });

  // Salutation
  const h = new Date().getHours();
  const greet = h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';
  const intro = `${greet}. ISIS en ligne. Je vérifie ta situation immédiatement.`;
  addMessage('isis', intro);
  setTimeout(() => speak(intro, () => checkEtatInitial()), 800);
}

// ── SETUP / PARAMÈTRES ──
function saveSetup() {
  const groqKey = document.getElementById('setupGroqKey').value.trim();
  const gemKey  = document.getElementById('setupApiKey').value.trim();
  const url     = document.getElementById('setupScriptUrl').value.trim();

  if (!groqKey && !gemKey) {
    alert('Entrez au moins une clé API.\nRecommandé : Groq (console.groq.com — gratuit en France)');
    return;
  }

  if (groqKey) { CFG.groqKey = groqKey; localStorage.setItem('isis_groq_key', groqKey); }
  if (gemKey)  { CFG.apiKey  = gemKey;  localStorage.setItem('isis_api_key', gemKey); }
  if (url)     { CFG.scriptUrl = url;   localStorage.setItem('isis_script_url', url); }
  showApp();
}

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
      msg += urgents.map(e => `${e.fromName} sur "${e.subject}"`).join(' et ') + '. ';
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
        setTimeout(() => { addMessage('isis', preview); speak(`Brouillon de réponse prêt pour ${urgents[0].fromName}. Je l'envoie ?`); }, 2000);
      }
    }
  } catch(e) { /* silence */ }
}

function toggleSettings() {
  const p = document.getElementById('settingsPanel');
  p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

function saveSettingsPanel() {
  const groqKey = document.getElementById('settingsGroqKey').value.trim();
  const gemKey  = document.getElementById('settingsApiKey').value.trim();
  const url     = document.getElementById('settingsScriptUrl').value.trim();

  const claudeKey = document.getElementById('settingsClaudeKey').value.trim();
  const openaiKey = document.getElementById('settingsOpenaiKey').value.trim();
  if (claudeKey) { CFG.claudeKey = claudeKey; localStorage.setItem('isis_claude_key', claudeKey); }
  if (openaiKey) { CFG.openaiKey = openaiKey; localStorage.setItem('isis_openai_key', openaiKey); }
  if (groqKey)   { CFG.groqKey   = groqKey;   localStorage.setItem('isis_groq_key',   groqKey);   }
  if (gemKey)    { CFG.apiKey    = gemKey;     localStorage.setItem('isis_api_key',    gemKey);    }
  CFG.scriptUrl = url;
  if (url) localStorage.setItem('isis_script_url', url);
  else localStorage.removeItem('isis_script_url');

  const goals     = document.getElementById('settingsGoals').value.trim();
  const interests = document.getElementById('settingsInterests').value.trim();
  if (goals)     { memory.objectifs = goals;    }
  if (interests) { memory.interets  = interests; }
  if (goals || interests) localStorage.setItem('isis_memory', JSON.stringify(memory));

  workingApi = null;
  localStorage.removeItem('isis_working_api');
  toggleSettings();
  addMessage('isis', 'Paramètres mis à jour. Je les prends en compte dès maintenant.');
}

async function testGmail() {
  const box = document.getElementById('gmailResult');
  const url = document.getElementById('settingsScriptUrl').value.trim();
  if (url) { CFG.scriptUrl = url; localStorage.setItem('isis_script_url', url); }

  if (!CFG.scriptUrl) {
    box.className = 'test-result err';
    box.textContent = '✗ Aucune URL Apps Script. Colles-en une puis réessaie.';
    return;
  }

  box.className = 'test-result';
  box.textContent = 'Connexion Gmail...';
  box.style.display = 'block';

  try {
    const data = await fetchGoogleData('unread');
    if (data.error) throw new Error(data.error);
    const emails = data.emails || data;
    const nonLus = emails.nonLus ?? emails.unread ?? '?';
    const urgents = emails.urgents ?? 0;
    box.className = 'test-result ok';
    box.textContent = `✓ Gmail connecté ! ${nonLus} non lu(s)${urgents > 0 ? `, dont ${urgents} urgents` : ''}.`;
  } catch(e) {
    box.className = 'test-result err';
    let hint = '';
    if (/inaccessible|script/i.test(e.message))
      hint = ' → Lance ISIS via lancer-isis.command et vérifie que l\'Apps Script est bien déployé.';
    else if (/autoris|401|403/i.test(e.message))
      hint = ' → Ouvre script.google.com → exécute getEmails() manuellement pour autoriser l\'accès.';
    box.textContent = `✗ ${e.message}${hint}`;
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
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé Claude d\'abord (console.anthropic.com).'; return; }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
        body: JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:10,messages:[{role:'user',content:'Dis OK'}]}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className='test-result ok'; result.textContent='✓ Clé Claude valide ! ISIS utilisera Claude en priorité.';
    } else if (provider === 'openai') {
      const key = document.getElementById('settingsOpenaiKey').value.trim();
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé OpenAI d\'abord.'; return; }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:'Dis OK'}],max_tokens:5}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className='test-result ok'; result.textContent='✓ Clé OpenAI valide !';
    } else if (provider === 'groq') {
      const key = document.getElementById('settingsGroqKey').value.trim();
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé Groq d\'abord.'; return; }
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({model:'llama-3.1-8b-instant',messages:[{role:'user',content:'Dis juste "OK"'}],max_tokens:5}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className = 'test-result ok';
      result.textContent = '✓ Clé Groq valide ! Sauvegardez et utilisez ISIS.';
    } else {
      const key = document.getElementById('settingsApiKey').value.trim();
      if (!key) { result.className='test-result err'; result.textContent='Entre une clé Gemini d\'abord.'; return; }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contents:[{role:'user',parts:[{text:'Dis juste OK'}]}],generationConfig:{maxOutputTokens:5}}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      result.className = 'test-result ok';
      result.textContent = '✓ Clé Gemini valide !';
    }
  } catch(e) {
    result.className = 'test-result err';
    result.textContent = `✗ Erreur : ${e.message}`;
  }
}

function clearMemory() {
  if (!confirm('Effacer toute la mémoire de longue durée ?')) return;
  memory = {};
  history = [];
  localStorage.removeItem('isis_memory');
  addMessage('isis', 'Mémoire effacée. Je recommence de zéro.');
}

// ================================================================
//  SYSTÈME PROMPT — PROACTIF / KEMETED
// ================================================================
function buildSystemPrompt() {
  const today = new Date().toLocaleDateString('fr-FR', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const time  = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
  const goals = memory.objectifs ? `\nOBJECTIFS : ${memory.objectifs}` : '';
  const ints  = memory.interets  ? `\nCENTRES D'INTÉRÊT : ${memory.interets}` : '';
  const mem   = Object.keys(memory).length ? `\n\nPROFIL :\n${JSON.stringify(memory,null,2)}` : '';

  return `Tu es ISIS, assistant personnel exécutif exclusivement au service de ton utilisateur et de ses projets (notamment Kemeted).

MISSION CENTRALE :
Tu es proactif et autonome. Tu n'attends pas qu'on te demande — tu analyses, tu anticipes, tu proposes des actions concrètes. Tu agis comme un vrai chef de cabinet.

COMPORTEMENT PROACTIF (applique-le systématiquement) :
Quand tu reçois des emails, identifie lesquels nécessitent une réponse et propose un brouillon directement.
Quand tu vois l'agenda, repère les conflits ou créneaux manquants et suggère des ajustements.
Quand un projet est mentionné, propose un plan d'action avec des dates et des étapes concrètes.
Quand quelque chose peut être utile, propose-le sans attendre.

RÈGLES NON NÉGOCIABLES :
Tu n'inventes JAMAIS de rendez-vous, d'emails ou de données — uniquement les données réelles reçues.
Tu ne crées d'événements agenda QU'avec confirmation explicite de l'utilisateur.
Tu ne JAMAIS envoies d'email sans confirmation — mais tu prépares le brouillon sans attendre qu'on te le demande.
Toujours en français, zéro *, #, -, bullet points dans les réponses (elles sont lues à voix haute).
Réponses directes, 2 à 3 phrases maximum sauf si on demande du détail.
Tu tutoies, ton ton est confiant, direct, légèrement sarcastique mais toujours bienveillant.

CAPACITÉS :
Gmail, Agenda Google, Notion, Google Drive, création de docs, envoi d'emails, automatisations.

CONTEXTE : ${today} — ${time}${goals}${ints}${mem}`;
}

async function callGemini() {
  // BUG FIX : comparaison correcte par valeur (JSON.parse crée un nouvel objet à chaque fois)
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
        console.info('ISIS utilise :', candidate.version, candidate.model);
      }
      return result;
    } catch(e) {
      // BUG FIX : regex élargi pour capturer "Unknown name", "Invalid JSON payload", etc.
      const isModelError = /not found|quota|limit.*0|not supported|RESOURCE_EXHAUSTED|404|Unknown name|Invalid JSON|unavailable|deprecated/i.test(e.message);
      if (isModelError) { console.warn('Modèle indisponible, essai suivant :', candidate.model, e.message); continue; }
      throw e;
    }
  }
  throw new Error('Aucun modèle Gemini disponible pour votre région. Vérifiez votre clé sur aistudio.google.com');
}

async function tryGeminiEndpoint({version, model}) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${CFG.apiKey}`;

  // BUG FIX : v1 utilise "systemInstruction" (camelCase), v1beta utilise "system_instruction" (snake_case)
  const sysKey = version === 'v1' ? 'systemInstruction' : 'system_instruction';

  const body = {
    [sysKey]         : { parts:[{text: buildSystemPrompt()}] },
    contents         : history,
    generationConfig : { temperature:.75, maxOutputTokens:550, topP:.9 },
  };

  const res = await fetch(url, {
    method : 'POST',
    headers: {'Content-Type':'application/json'},
    body   : JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);

  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse générée.';
}

// ================================================================
//  GROQ API (alternative gratuite, fonctionne en France)
// ================================================================
const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

// Convertit l'historique Gemini → format OpenAI/Groq
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
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${CFG.groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role:'system', content: buildSystemPrompt() },
            ...historyToOpenAI(),
          ],
          temperature : 0.75,
          max_tokens  : 550,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      return data.choices?.[0]?.message?.content || 'Pas de réponse générée.';

    } catch(e) {
      if (/model_not_found|404|decommissioned/i.test(e.message)) { console.warn('Modèle Groq indisponible:', model); continue; }
      throw e;
    }
  }
  throw new Error('Aucun modèle Groq disponible. Vérifiez votre clé sur console.groq.com');
}

// ── Claude AI (meilleure qualité) ──
async function callClaude() {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method : 'POST',
    headers: {
      'Content-Type'      : 'application/json',
      'x-api-key'         : CFG.claudeKey,
      'anthropic-version' : '2023-06-01',
    },
    body: JSON.stringify({
      model      : 'claude-haiku-4-5-20251001',
      max_tokens : 600,
      system     : buildSystemPrompt(),
      messages   : historyToOpenAI(),
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
          temperature : 0.75,
          max_tokens  : 600,
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
  throw new Error('OpenAI indisponible');
}

// Routeur principal : Claude → OpenAI → Groq → Gemini
async function callAI() {
  if (CFG.claudeKey) {
    try { return await callClaude(); }
    catch(e) { console.warn('Claude échoué:', e.message); }
  }
  if (CFG.openaiKey) {
    try { return await callOpenAI(); }
    catch(e) { console.warn('OpenAI échoué:', e.message); }
  }
  if (CFG.groqKey) {
    try { return await callGroq(); }
    catch(e) { console.warn('Groq échoué:', e.message); }
  }
  if (CFG.apiKey) return await callGemini();
  throw new Error('Aucune clé API configurée. Cliquez sur ⚙.');
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
        to     : data.to,
        subject: data.subject,
        body   : data.body.substring(0, 1200),
      });
      reply = result.success ? `Email envoyé à ${data.to}.` : `Échec : ${result.error}`;
    }
    else if (type === 'create-event') {
      result = await fetchGoogleData('create-event', {
        titre: data.titre,
        debut: data.debut,
        fin  : data.fin || '',
        desc : (data.description || '').substring(0, 200),
      });
      reply = result.success ? `"${data.titre}" ajouté à ton agenda.` : `Échec : ${result.error}`;
    }
    else if (type === 'create-doc') {
      result = await fetchGoogleData('create-doc', {
        titre  : data.titre,
        contenu: data.contenu.substring(0, 2000),
      });
      reply = result.success
        ? `Document "${data.titre}" créé dans Google Drive. Ouvre Drive pour le lire.`
        : `Échec : ${result.error}`;
    }

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
//  ENVOI DE MESSAGE
// ================================================================
function sendText() {
  const input = document.getElementById('textInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  sendMessage(text);
}

async function sendMessage(userText) {
  if (!userText) return;
  if (!CFG.groqKey && !CFG.apiKey) { alert('Clé API manquante. Cliquez sur ⚙'); return; }

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
    pendingAction = null; // nouvelle demande = on efface l'action précédente
  }

  stopListening();
  addMessage('user', userText);

  // ── Intentions spéciales ──
  const wantsSendEmail   = /envoie\s+(un\s+)?(mail|email|message)\s+[àa]|rédige.*(mail|email).*et.*(envoie|send)/i.test(userText);
  const wantsCreateEvent = /planifie|crée\s+(un\s+)?rendez.?vous|ajoute\s+(un\s+)?(événement|rdv)|programme\s+(une\s+)?réunion|bloque\s+(un\s+)?créneau|mets.*(dans|à|sur).*agenda/i.test(userText);
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
      const preview = `Document à créer :\n"${doc.titre}"\n\n${doc.contenu.substring(0,250)}...\n\nJe crée ce Google Doc ?`;
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

  // Détecte la nature de la demande
  const wantsEmails  = /email|mail|message|boîte|courriel|inbox/i.test(userText);
  const wantsUnread  = /non.?lu|unread/i.test(userText);
  const wantsAgenda  = /agenda|planning|rendez.?vous|réunion|aujourd.?hui|demain|semaine|calendrier/i.test(userText);
  const wantsBrief   = /brief|briefing|résumé.*(journée|matin|jour)|matin|point.*(jour|matin)/i.test(userText);
  const wantsDraft   = /rédige|écris|envoie|réponds|prépare.*(mail|email|message)/i.test(userText);
  const wantsAutoOn  = /active.*(brief|alerte|automatisation|urgence)|brief.*(matin|auto)|alerte.*(urgence|email)/i.test(userText);
  const wantsAutoOff = /désactive.*(auto|brief|alerte|trigger)|arrête.*(auto|brief)/i.test(userText);
  const wantsAutoStatus = /statut.*(auto|brief|alerte)|auto.*activ/i.test(userText);
  let contextBlock   = '';

  // ── Automatisations ──
  if ((wantsAutoOn || wantsAutoOff || wantsAutoStatus) && CFG.scriptUrl) {
    try {
      let action = 'auto-status';
      if (wantsAutoOff) action = 'auto-off';
      else if (/brief|matin/i.test(userText)) action = 'auto-brief-on';
      else if (/alerte|urgence/i.test(userText)) action = 'auto-urgences-on';
      else if (wantsAutoOn) action = 'auto-brief-on';

      const result = await fetchGoogleData(action);
      const reply  = result.message || (result.briefMatinal !== undefined
        ? `Brief matinal : ${result.briefMatinal ? 'actif' : 'inactif'}. Alertes urgences : ${result.alertesUrgences ? 'actives' : 'inactives'}.`
        : JSON.stringify(result));

      removeThinking(addThinking());
      addMessage('isis', reply);
      speak(reply);
      setStatus('idle','En attente'); setHolo('idle');
      return;
    } catch(err) {
      console.error('Auto:', err.message);
    }
  }

  if (CFG.scriptUrl && (wantsEmails || wantsAgenda || wantsBrief)) {
    setStatus('thinking', 'Consultation Gmail...');
    try {
      let action = 'all';
      if (wantsBrief)       action = 'brief';
      else if (wantsUnread) action = 'unread';
      else if (wantsEmails && !wantsAgenda) action = 'emails';
      else if (wantsAgenda && !wantsEmails) action = 'agenda';

      const data = await fetchGoogleData(action);
      if (data) {
        contextBlock = `\n\n--- DONNÉES GMAIL/AGENDA EN TEMPS RÉEL ---\n${JSON.stringify(data,null,2)}\n\nINSTRUCTIONS : Analyse ces données et réponds naturellement. Pour les emails, cite les expéditeurs et sujets importants. Signale les urgences. Ne liste pas tout — donne l'essentiel.`;
      }
    } catch(err) {
      console.error('Gmail/Agenda fetch error:', err.message);
      // ISIS informe l'utilisateur à voix haute du problème
      const errMsg = /Failed to fetch|CORS/i.test(err.message)
        ? 'Je n\'arrive pas à me connecter à ton Gmail. Lance ISIS via le fichier lancer-isis.command plutôt qu\'en ouvrant index.html directement.'
        : /401|403/i.test(err.message)
        ? 'L\'accès Gmail n\'est pas autorisé. Va sur script.google.com et exécute la fonction getEmails pour autoriser l\'accès.'
        : `Connexion Gmail indisponible : ${err.message}`;
      removeThinking(addThinking());
      addMessage('isis', errMsg);
      speak(errMsg);
      setStatus('idle','En attente'); setHolo('idle');
      return;
    }
  }

  if (wantsDraft && !CFG.scriptUrl) {
    contextBlock += "\n\n(Pour rédiger des emails, configure l'URL Google Apps Script dans ⚙ Paramètres.)";
  }

  // ── Google Drive ──
  const wantsDrive  = /drive|fichier|document|doc|sheet|slides|présentation|pdf|dossier/i.test(userText);
  const driveSearch = /cherche|trouve|ouvre|lis|montre/i.test(userText);

  if (wantsDrive && CFG.scriptUrl) {
    setStatus('thinking', 'Consultation Drive...');
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
      console.error('Drive:', err.message);
      contextBlock += `\n\n(Drive indisponible : ${err.message})`;
    }
  }

  // ── Notion (via Apps Script — contourne CORS) ──
  const wantsNotion = /notion|note|page|mémo/i.test(userText);

  if (wantsNotion && CFG.scriptUrl) {
    setStatus('thinking', 'Consultation Notion...');
    try {
      const searchQuery = userText.replace(/notion|cherche|trouve|dans|crée|ajoute|note|page|document|tâche/gi, '').trim();
      if (searchQuery.length > 2) {
        const result = await fetchGoogleData('notion-search', { query: searchQuery });
        if (result.pages?.length > 0) {
          contextBlock += `\n\n--- PAGES NOTION TROUVÉES ---\n${JSON.stringify(result.pages, null, 2)}\nInstruction : cite les titres naturellement.`;
        } else if (result.error) {
          contextBlock += `\n\n(Notion : ${result.error})`;
        } else {
          contextBlock += `\n\n(Notion "${searchQuery}" : aucune page trouvée — vérifie que les pages sont partagées avec l'intégration ISIS.)`;
        }
      }
    } catch(err) {
      console.error('Notion:', err.message);
      contextBlock += `\n\n(Notion indisponible : ${err.message})`;
    }
  }

  history.push({ role:'user', parts:[{text: userText + contextBlock}] });

  const thinkId = addThinking();
  setStatus('thinking', 'Réflexion...');
  setHolo('thinking');

  try {
    const reply = await callAI();
    removeThinking(thinkId);
    history.push({ role:'model', parts:[{text:reply}] });
    if (history.length > 50) history = history.slice(-50);
    addMessage('isis', reply);
    setStatus('speaking', 'ISIS parle...');
    setHolo('speaking');
    extractMemory(userText);
    speak(reply);
  } catch(e) {
    removeThinking(thinkId);
    console.error(e);

    let msg = `Erreur : ${e.message}`;
    if (/fetch|network|Failed to fetch/i.test(e.message))
      msg = 'Impossible de joindre l\'API. Vérifiez votre connexion Internet.';

    addMessage('isis', msg);
    setStatus('idle', 'En attente');
    setHolo('idle');
  }
}

// ================================================================
//  GOOGLE APPS SCRIPT — JSONP (contourne CORS définitivement)
//  Gère : Gmail, Agenda, Notion
// ================================================================
function fetchGoogleData(action, extraParams = {}) {
  return new Promise((resolve, reject) => {
    if (!CFG.scriptUrl) { reject(new Error('URL Apps Script non configurée dans ⚙')); return; }

    const cbName = `_isis_cb_${Date.now()}`;
    const script  = document.createElement('script');

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
    script.onerror = () => { cleanup(); reject(new Error('Apps Script inaccessible — vérifiez l\'URL et réautorisez sur script.google.com')); };
    document.head.appendChild(script);
  });
}

// ================================================================
//  NOTION — via Apps Script (pas de CORS)
// ================================================================
async function createNotionPage(titre, contenu) {
  if (!CFG.scriptUrl) throw new Error('URL Apps Script non configurée dans ⚙');
  return await fetchGoogleData('notion-create', { titre, contenu });
}

async function testNotion() {
  const box = document.getElementById('notionResult');
  if (!CFG.scriptUrl) {
    box.className = 'test-result err';
    box.textContent = '✗ Configure d\'abord l\'URL Apps Script (ci-dessus), puis reteste.';
    return;
  }

  box.className = 'test-result'; box.textContent = 'Test Notion via Apps Script...'; box.style.display = 'block';

  try {
    const data = await fetchGoogleData('notion-search', { query: '' });
    const nb = data.total ?? data.pages?.length ?? 0;
    box.className   = 'test-result ok';
    box.textContent = nb > 0
      ? `✓ Notion connecté ! ${nb} pages accessibles.`
      : '✓ Apps Script OK. Aucune page Notion partagée : ouvre Notion → ··· → Connexions → ajoute ton intégration ISIS.';
  } catch(e) {
    box.className   = 'test-result err';
    const hint = /Clé Notion vide|NOTION_KEY/i.test(e.message)
      ? ' → Ouvre le code Apps Script, remplis NOTION_KEY, sauvegarde et redéploie (Déployer → Gérer les déploiements → Nouvelle version).'
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
  if (!SR) { alert('Reconnaissance vocale non disponible. Utilisez Chrome ou Edge.'); return null; }
  const rec = new SR();
  rec.lang = 'fr-FR';
  rec.continuous = continuous;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  return rec;
}

// ── Mode conversation automatique (wake word + auto-écoute) ──
function startContinuousListen() {
  if (isSpeaking) return;
  if (recognition) try { recognition.stop(); } catch(e) {}

  recognition = buildRecognition(true);
  if (!recognition) return;

  isListening   = true;
  listenPhase   = 'wakeword';

  setStatus('listening', listenPhase === 'wakeword' ? 'En veille — dites "Hey ISIS"' : 'Écoute...');
  setHolo('listening');
  document.getElementById('micBtn').classList.add('active');
  document.getElementById('micLabel').textContent = 'Actif';

  // Micro pour visualisation
  if (!audioStream) {
    navigator.mediaDevices?.getUserMedia({audio:true})
      .then(s => { audioStream=s; if(holoViz) holoViz.connectAudio(s); })
      .catch(() => {});
  }

  let messageBuffer = '';

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
        messageBuffer = '';
        playActivationSound();
        setStatus('listening', 'Écoute votre message...');
      }
    } else if (listenPhase === 'message') {
      if (final) {
        // Retire le wake word du message s'il est présent
        const msg = final.replace(WAKE_PATTERNS, '').trim();
        if (msg.length > 1) {
          listenPhase = 'idle';
          isListening = false;
          try { recognition.stop(); } catch(ex) {}
          document.getElementById('transcriptPreview').textContent = '';
          sendMessage(msg);
        } else {
          listenPhase = 'wakeword'; // message vide → retour en veille
        }
      }
    }
  };

  recognition.onerror = (e) => {
    if (e.error === 'not-allowed') {
      alert('Microphone refusé — autorisez l\'accès dans les paramètres du navigateur.');
      stopConversation();
      return;
    }
    // Relance automatique sur les erreurs passagères
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
  convMode    = false;
  isListening = false;
  listenPhase = 'idle';
  if (recognition) try { recognition.stop(); } catch(e) {}
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('micLabel').textContent = 'Parler';
  document.getElementById('convBtn').classList.remove('active');
  document.getElementById('convBtn').title = 'Activer le mode conversation';
  document.getElementById('transcriptPreview').textContent = '';
  setStatus('idle','En attente');
  setHolo('idle');
}

// ── Bouton micro simple (sans mode conversation) ──
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
    if (e.error==='not-allowed') alert('Microphone refusé — autorisez l\'accès dans les paramètres du navigateur.');
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

// ── Toggle mode conversation automatique ──
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

// ── SYNTHÈSE VOCALE — Phrase par phrase pour une diction naturelle ──
function getBestVoice() {
  const all = window.speechSynthesis.getVoices();
  const priority = [
    'Microsoft Hortense Online',
    'Microsoft Hortense',
    'Microsoft Julie Online',
    'Microsoft Julie',
    'Google français',
    'Google French',
    'Amélie',
    'Thomas',
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

  // Découpe en phrases pour une élocution naturelle
  const sentences = clean.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g)
    ?.map(s => s.trim()).filter(s => s.length > 1) || [clean];

  let idx = 0;

  const speakNext = () => {
    if (idx >= sentences.length) {
      isSpeaking = false;
      setStatus('idle','En attente');
      setHolo('idle');
      // Mode conversation : relance l'écoute automatiquement
      if (convMode) {
        setTimeout(() => { listenPhase='wakeword'; startContinuousListen(); }, 600);
      }
      onDone?.();
      return;
    }

    const currentVoices = window.speechSynthesis.getVoices();
    const voice = (currentVoices.length ? null : null) || getBestVoice();

    const utt    = new SpeechSynthesisUtterance(sentences[idx++]);
    utt.lang     = 'fr-FR';
    utt.rate     = 0.97;   // fluide et naturel
    utt.pitch    = 0.82;   // grave et autoritaire comme Alexa
    utt.volume   = 1.0;
    if (voice) utt.voice = voice;

    utt.onend   = () => setTimeout(speakNext, 120);
    utt.onerror = () => { isSpeaking=false; setStatus('idle','En attente'); setHolo('idle'); onDone?.(); };

    window.speechSynthesis.speak(utt);
  };

  isSpeaking = true;

  if (window.speechSynthesis.getVoices().length > 0) {
    speakNext();
  } else {
    window.speechSynthesis.onvoiceschanged = () => speakNext();
  }
}

// ================================================================
//  MÉMOIRE AUTOMATIQUE
// ================================================================
function extractMemory(text) {
  const rules = [
    { re:/je m['']appelle ([A-ZÀ-Ÿa-zà-ÿ\-\s]+)/i,                          key:'prenom'      },
    { re:/mon (entreprise|société|boîte) (?:s['']appelle|est) (.+)/i,         key:'entreprise', idx:2 },
    { re:/je travaille (?:dans|chez|pour) (.+)/i,                             key:'travail'     },
    { re:/j['']habite (?:à|en|au) (.+)/i,                                     key:'ville'       },
    { re:/mon projet (?:est|s['']appelle|c['']est) (.+)/i,                    key:'projet'      },
    { re:/mon objectif (?:est|c['']est|principal) (.+)/i,                     key:'objectifs'   },
    { re:/je veux (?:devenir|atteindre|réussir|créer|développer|bâtir) (.+)/i,key:'objectifs'   },
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
  document.getElementById('statusDot').className  = `status-dot ${type==='idle'?'':type}`;
  document.getElementById('statusText').textContent = label;
}

function setHolo(state) { if (holoViz) holoViz.setState(state); }

function esc(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}
