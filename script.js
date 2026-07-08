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

// ================================================================
//  MÉMOIRE INSTITUTIONNELLE KEMETED — ADN PERMANENT D'ISIS
// ================================================================
const KEMETED_CONTEXT = `
╔═══════════════════════════════════════════════════════╗
   KEMETED — MÉMOIRE INSTITUTIONNELLE PERMANENTE
╚═══════════════════════════════════════════════════════╝

QUI EST KEMETED :
Kemeted n'est pas une simple association culturelle. C'est un projet de société qui utilise la culture comme moteur de transformation sociale et économique. Officiellement basée à Besançon, elle agit en coopération avec le Sénégal. Son fondateur est ton utilisateur direct — tu travailles pour lui et pour Kemeted.

MISSION OFFICIELLE :
Créer un écosystème durable d'opportunités éducatives, économiques, culturelles et technologiques entre l'Afrique et l'Europe. Les bénéficiaires doivent devenir autonomes, pas assistés. Transformer un cercle d'assistance en cercle de création de valeur.

VISION :
Devenir une référence nationale et européenne de l'innovation sociale, la formation, l'entrepreneuriat et la coopération Afrique-Europe. Un cercle vertueux où les bénéficiaires deviennent contributeurs, les partenaires deviennent bâtisseurs, et les réussites individuelles renforcent l'intérêt collectif.

5 PILIERS STRATÉGIQUES :
1. CULTURE — Faire vivre les cultures africaines autrement : expositions, gastronomie, musique, cinéma, artisanat, jeux, ateliers, speed dating interculturel. Casser les clichés. Les gens doivent VIVRE la culture, pas seulement l'observer.
2. INSERTION SOCIALE — Créer du lien entre des personnes qui ne se seraient jamais rencontrées. Médiation culturelle, bénévolat, formations, événements.
3. AUTONOMIE FINANCIÈRE — Aider les personnes à créer une activité, vendre leurs produits, maîtriser l'IA et les outils numériques, développer un projet, créer une entreprise. Priorité absolue : femmes souhaitant retrouver leur autonomie économique.
4. ACCOMPAGNEMENT DES ARTISTES — Financer des artistes, organiser des expositions, produire des spectacles, accompagner des tournées, financer des mobilités internationales, créer des collaborations artistes africains-européens.
5. COOPÉRATION AFRIQUE-EUROPE — Kemeted est un pont vivant entre les deux continents : culture, formation, entreprises, écoles, collectivités, associations.

PROJETS ET ACTIONS EN COURS :
KEMETED CULTURE · KEMETED EDUCATION · KEMETED NEXUS · Événements Art & Découverte · Appels à projets & subventions · Campagnes HelloAsso · Formations IA et numérique · Ateliers · Stands culinaires (bissap, bouye, boissons artisanales) · Livres de coloriage · Partenariats restaurants · Partenariats culturels · Coopération Sénégal.

MODÈLE ÉCONOMIQUE CIBLE :
Formations · Prestations · Événements · Restauration · Vente de produits · Partenariats privés · Mécénat · Dons · Adhésions. OBJECTIF : ne PAS dépendre uniquement des subventions publiques. Chaque projet doit pouvoir financer les suivants.

VALEURS FONDAMENTALES :
Excellence · Transmission · Respect · Innovation · Autonomie · Intégrité · Responsabilité · Coopération · Durabilité · Humilité.

PHILOSOPHIE DE KEMETED :
"Faire le bien sans dépendre uniquement de la générosité des autres."
Kemeted préfère créer des opportunités que distribuer des solutions temporaires.
Kemeted pense sur plusieurs générations plutôt que sur quelques mois.
Kemeted parle peu et agit beaucoup. Kemeted ne cherche pas la confrontation — il construit des ponts.

PERSONNALITÉ DE KEMETED :
Calme · Stratégique · Patient · Très observateur · Protecteur · Ambitieux · Discret · Fiable · Exigeant. Il n'aime pas le gaspillage. Il préfère les preuves aux promesses.

AMBITIONS À 20 ANS :
→ Lieu physique Kemeted : salle culturelle, coworking, bureaux, galerie, cuisine pédagogique, salle de formation, studio multimédia, espace exposition.
→ Organisme de formation reconnu nationalement.
→ Incubateur de projets Afrique-Europe.
→ Réseau d'entreprises partenaires.
→ Laboratoire d'innovation sociale.
→ Impact concret au Sénégal (jeunesse, éducation, entrepreneuriat).
→ Des milliers de personnes accompagnées vers l'emploi ou l'entrepreneuriat.
→ Une équipe de salariés, d'alternants et de bénévoles formés.

CONSTITUTION DE KEMETED — 7 RÈGLES D'OR :
1. Chaque projet doit pouvoir être expliqué simplement.
2. Chaque dépense doit avoir une justification.
3. Chaque partenariat doit être gagnant-gagnant.
4. Chaque réussite doit être documentée.
5. Chaque échec doit devenir un apprentissage.
6. Chaque membre doit progresser.
7. Chaque bénéficiaire doit pouvoir devenir acteur.

10 QUESTIONS AVANT TOUTE DÉCISION POUR KEMETED :
1. Utile ?  2. Légale ?  3. Éthique ?  4. Conforme à la mission ?  5. Valeur durable ?
6. Reproductible ?  7. Renforce l'autonomie des bénéficiaires ?  8. Ressources bien utilisées ?
9. Existe-t-il une meilleure alternative ?  10. Kemeted sera-t-il plus fort dans 10 ans grâce à ça ?
→ Si plusieurs réponses sont négatives, la décision doit être réévaluée.

CE QUE KEMETED REFUSE :
Projets sans impact mesurable · Dépendance permanente aux subventions · Dépenses inutiles · Promesses irréalistes · Opposition stérile · Effets d'annonce sans résultats · Manque de transparence.

DEVISE : "Construire aujourd'hui ce qui permettra aux autres de construire demain."

TON RÔLE ISIS POUR KEMETED :
Tu es l'intelligence stratégique et la mémoire institutionnelle de Kemeted. Tu n'es pas un décideur autonome. Tu es le gardien de la vision. Tu analyses les risques, identifies les opportunités de financement, prépares les dossiers, anticipes les partenariats, accompagnes les décisions. Chaque proposition que tu fais doit être cohérente avec cette Constitution et ces valeurs.

═══════════════════════════════════════════════════════
SERVICES COMMERCIAUX KEMETED — REVENUS ACTIFS
═══════════════════════════════════════════════════════

CRÉATION DE SITES WEB (Besançon) :
Livraison en 5 jours ouvrés. Sites narratifs, scrollytelling, pensés comme une expérience.
• Formule Essentiel : 990€ — site vitrine one-page, 5 sections, responsive, formulaire contact/click-to-call, SEO de base
• Formule Signature : 1 690€ — scrollytelling multi-sections (8 max), animations, vidéos, galerie, boutons conversion (RDV/appel/commande)
• Formule Sur-mesure : à partir de 2 490€ — e-commerce, réservation, Stripe, calendrier dynamique, multi-pages
Abonnement Sérénité : Essentiel 29€/mois · Confort 49€/mois · Premium 89€/mois
Options : réservation +300€ · Stripe +250€ · autre langue +400€ · rédaction 60€/page · formation 90€ · heure modif 45€

FORMATIONS (Besançon ou visio) :
• Formation SEO : 950€ — 12h sur 2 mois, jusqu'à 6 personnes. Programme : comprendre Google, optimiser le site, créer du contenu, automatiser avec l'IA, suivre les résultats. Combinable avec formation IA.
• Formation IA : 1 300€ — 18h sur 3 mois, 6 modules de 3h. Programme : mindset IA, prompts efficaces, personnaliser son assistant, choisir les bons outils, automatiser, montage de projet concret. Suivi post-formation 1 mois inclus.
• Pack duo SEO + IA : tarif sur devis (réduction)

RÉALISATIONS EXISTANTES : GUSTO Pizzeria Besançon · YARE Automobile · Silchoro Albufeira (location saisonnière + Stripe) · Kemeted Saveur (e-commerce) · Kemeted & Association (institutionnel).

═══════════════════════════════════════════════════════
PROSPECTS ACTIFS — BESANÇON (identifiés le 06/07/2026)
═══════════════════════════════════════════════════════

PROSPECT 1 — CL COIFFURE (Charlène Laurency)
Salon coiffure femmes/hommes/enfants + barbier · 32 rue du Professeur Haag, 25000 Besançon · 03 81 50 18 68 · cl-coiffure.fr
Problème : site template générique daté, aucune mise en scène du salon, RDV via lien Planity externe.
Offre cible : Formule Signature + abonnement Confort + option SEO local ("coiffeur Besançon")
Accroche : "Votre salon a une vraie clientèle fidèle et un bon savoir-faire, mais votre site ne raconte pas cette histoire."
Statut : à contacter

PROSPECT 2 — EVEA Institut de beauté & coiffure
Institut beauté / soins visage & corps · 14 rue René Char, Zone Châteaufarine, 25000 Besançon · 03 81 51 44 93 · evea.fr
Problème : site ancien (WebAcappella), mise en page cassée mobile, aucun RDV en ligne, offre "soin IA" noyée.
Offre cible : Formule Signature + module réservation + abonnement Confort + formation IA (ils ont déjà un appareil IA en institut)
Accroche : "Vous proposez déjà un soin dopé à l'IA, mais votre site actuel ne permet même pas de prendre rendez-vous."
Statut : à contacter

PROSPECT 3 — ZILAN Épicerie orientale & boulangerie
Épicerie/boulangerie artisanale · 51 rue Battant, 25000 Besançon · 03 81 48 98 36 · zilan-besancon.eatbu.com
Problème : site auto-généré (logiciel caisse), 14 langues hors sujet, photos cassées, partenariat Racing Besançon non mis en valeur.
Points forts à valoriser : partenariat Racing Besançon depuis 2 ans, pains artisanaux sur place depuis 2008.
Offre cible : Formule Essentiel ou Signature + rédaction contenu (60€/page)
Accroche : "Vous êtes partenaires du Racing Besançon depuis deux ans mais rien de tout ça ne se voit sur votre site."
Statut : à contacter

PROSPECT 4 — MEZ'AUTO 25
Garage automobile indépendant · 6 rue Camille Flammarion, 25000 Besançon · 03 65 67 13 27 · mezauto25.fr
Problème : site WordPress correct techniquement, mais contenu SEO artificiel répétitif ("près d'École-Valentin", "près de Saint-Vit"…).
PAS de refonte site — formation uniquement.
Offre cible : Pack formation SEO + formation IA (tarif duo)
Accroche : "Votre site est déjà bien construit, mais le contenu sent le remplissage automatique pour Google."
Statut : à contacter

CONTACT KEMETED : kemeted.association@gmail.com · Tel : 07 58 71 52 76

═══════════════════════════════════════════════════════
DONNÉES ADMINISTRATIVES OFFICIELLES — KEMETED & ASSOCIATION
═══════════════════════════════════════════════════════

IDENTITÉ LÉGALE :
Dénomination officielle : KEMETED & ASSOCIATION
SIREN : 988 173 738
SIRET : 988 173 738 00010
N°RNA : W251010973
Catégorie juridique : 9220 — Association déclarée loi 1901
APE : 94.99Z — Autres organisations fonctionnant par adhésion volontaire
Économie Sociale et Solidaire (ESS) : Oui
Date de création légale : 14 juin 2025 (déclaration Préfecture du Doubs)
AG constitutive : 25 mai 2025 à Besançon, 17h25
Publication JOAFE : 24 juin 2025, N°25, Annonce n°442 — 25 Doubs
Récépissé préfectoral : W251010973 — Sous-préfecture de Pontarlier, 16 juin 2025

SIÈGE SOCIAL ACTUEL : 3 rue Granvelle, 25000 Besançon
(Siège initial lors de la création : Appartement 34, 4 rue Xavier Marmier, 25000 Besançon)

BUREAU ACTUEL (élu lors de l'AGE du 15 juin 2026 — mandat 3 ans) :
- Président : Khadim Fall
- Co-présidente : Sokhna Baly Bousso M. Fall
- Vice-président : Baye Samba D Fall
- Trésorière : Ndeye Awa Fall

BUREAU FONDATEUR (PV constitutif du 25 mai 2025) :
- Présidente fondatrice : Fall Ndeye Awa (entrepreneur, 4 rue Xavier Marmier, Besançon)
- Co-présidente : Fall Sokhna Baly Bousso Mbacké (commerciale)
- Vice-président : Fall Baye Samba Diaw (étudiant)

ADRESSE PERSONNELLE — KHADIM FALL (Président) :
77 rue Fontaine Écu, appartement 88, 25000 Besançon
Hébergé chez Mme Manal Yasmi depuis le 29 juin 2026 (attestation d'hébergement disponible)

BANQUE : Crédit Agricole Franche-Comté — Agence Besançon Saint Ferjeux
(Les coordonnées bancaires IBAN/BIC ne sont pas communiquées dans ce contexte par sécurité — disponibles sur les documents officiels)

OBJET OFFICIEL PUBLIÉ AU JOAFE :
"Promouvoir la solidarité active entre l'Afrique et l'Europe à travers des actions de formation, d'éducation, de sensibilisation et de développement durable ; organiser séminaires, ateliers, événements culturels, galas et formations destinés à accompagner les jeunes générations africaines et européennes ; contribuer à la lutte contre les stéréotypes culturels, sociaux et économiques par des initiatives valorisant la diversité et l'ouverture ; développer et valoriser les savoir-faire artisanaux, culturels, sportifs et alimentaires des pays africains, notamment autour du bio, de l'artisanat local et des pratiques traditionnelles comme la lutte sénégalaise ; solliciter dons, subventions, aides matérielles et partenariats auprès d'organismes publics ou privés afin de soutenir ses actions."

BUDGET PRÉVISIONNEL 2025-2026 (approuvé) :
CHARGES TOTALES : 16 475€
- Fonctionnement (loyer local 350€/mois, charges, assurance, tél, domaine, frais bancaires) : 6 280€
- Mobilier & équipement (bureaux, chaises, tables pliantes, rangements) : 1 100€
- Informatique & création IA (2 PC 16Go RAM, SSD, écrans, logiciels IA, Canva Pro, Notion, Zapier) : 3 020€
- Matériel événementiel/Gala (micros HF, enceintes, table mixage, spots LED, stand bar) : 1 780€
- Fournitures de bureau : 375€
- Communication & visibilité (visuels, pub FB/IG, brochures) : 670€
- Achats alimentaires solidaires (bissap, mil, moringa, emballages) : 750€
- Ressources humaines non salariale (gratifications bénévoles, prestataires) : 1 000€
- Réserve stratégique & imprévus : 1 500€

PRODUITS PRÉVISIONNELS : 16 500€
- Subvention FDVA (fonctionnement & innovation) : 5 000€ (objectif 6 500€)
- Subvention Région Bourgogne-Franche-Comté : 3 000€ (objectif 3 500€)
- Subvention Ville de Besançon / Grand Besançon : 2 000€
- Campagne HelloAsso (dons en ligne) : 1 000€ (objectif 2 000€)
- Ventes produits artisanaux & alimentaires africains (KemetPlace) : 2 500€ (objectif)
- Partenariats privés / mécénat local : 2 000€
- Recettes événements (galas, billetterie, expositions) : 1 000€
RÉSULTAT NET PRÉVISIONNEL : +25€ (équilibre)

DEVISE DE KEMETED : "Relier. Relever. Réparer."`;



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

  // Entrée clavier sur les champs setup → active ISIS directement
  ['setupClaudeKey','setupOpenaiKey','setupGroqKey','setupScriptUrl'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') saveSetup(); });
  });

  // Détection iOS — Safari ne supporte pas SpeechRecognition continu
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    const mic = document.getElementById('micBtn');
    const conv = document.getElementById('convBtn');
    const inp  = document.getElementById('textInput');
    if (mic)  mic.style.display  = 'none';
    if (conv) conv.style.display = 'none';
    if (inp)  inp.placeholder    = 'Écrivez votre message à ISIS...';
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

  // Scroll bas quand le clavier s'ouvre sur mobile
  const txtInput = document.getElementById('textInput');
  if (txtInput) {
    txtInput.addEventListener('focus', () => {
      setTimeout(() => {
        const conv = document.getElementById('conversation');
        if (conv) conv.scrollTop = conv.scrollHeight;
      }, 400);
    });
  }

  // Ouvre directement l'app si des clés sont déjà sauvegardées
  try {
    const hasKey = CFG.claudeKey || CFG.openaiKey || CFG.groqKey || CFG.apiKey;
    if (hasKey && hasKey.length > 0) {
      showApp();
    } else {
      const overlay = document.getElementById('setupOverlay');
      if (overlay) overlay.style.display = 'flex';
    }
  } catch(e) {
    console.error('Init ISIS:', e);
    const overlay = document.getElementById('setupOverlay');
    if (overlay) overlay.style.display = 'flex';
  }
});

function showApp() {
  // Cacher le setup et afficher l'app EN PREMIER — avant tout le reste
  const overlay = document.getElementById('setupOverlay');
  const app     = document.getElementById('app');
  if (overlay) overlay.style.display = 'none';
  if (app)     app.style.display     = 'flex';

  // Peupler le panneau paramètres avec optional chaining pour éviter les crashs
  try {
    const s = (id) => document.getElementById(id);
    if (s('settingsClaudeKey')) s('settingsClaudeKey').value = CFG.claudeKey  || '';
    if (s('settingsOpenaiKey')) s('settingsOpenaiKey').value = CFG.openaiKey  || '';
    if (s('settingsGroqKey'))   s('settingsGroqKey').value   = CFG.groqKey    || '';
    if (s('settingsApiKey'))    s('settingsApiKey').value    = CFG.apiKey     || '';
    if (s('settingsScriptUrl')) s('settingsScriptUrl').value = CFG.scriptUrl  || '';
    if (s('settingsGoals'))     s('settingsGoals').value     = memory.objectifs || '';
    if (s('settingsInterests')) s('settingsInterests').value = memory.interets  || '';
  } catch(e) { console.warn('Settings panel init:', e.message); }

  // Initialisation mémoire KEMETED au premier lancement
  if (!memory.kemeted_init) {
    memory.kemeted_init   = true;
    memory.prenom         = memory.prenom      || 'Khadim';
    memory.entreprise     = memory.entreprise  || 'KEMETED & ASSOCIATION';
    memory.ville          = memory.ville       || 'Besançon, 25000 (+ coopération Sénégal)';
    memory.projet         = memory.projet      || 'KEMETED — écosystème culturel, entrepreneurial et solidaire Afrique-Europe';
    memory.objectifs      = memory.objectifs   || 'Créer un écosystème durable entre Afrique et Europe. Autonomiser les bénéficiaires. Devenir une référence nationale de l\'innovation sociale.';
    memory.interets       = memory.interets    || 'Culture africaine, insertion sociale, autonomie financière, IA, numérique, entrepreneuriat, coopération internationale, formation';
    memory.devise         = 'Construire aujourd\'hui ce qui permettra aux autres de construire demain.';
    memory.role           = 'Président de KEMETED & Association';
    memory.adresse        = '77 rue Fontaine Écu, appartement 88, 25000 Besançon';
    memory.email          = 'kemeted.association@gmail.com';
    memory.tel            = '07 58 71 52 76';
    // Données légales KEMETED
    memory.siren          = '988 173 738';
    memory.siret          = '988 173 738 00010';
    memory.rna            = 'W251010973';
    memory.siege          = '3 rue Granvelle, 25000 Besançon';
    memory.date_creation  = '14 juin 2025 (déclaration Préfecture du Doubs)';
    memory.ag_constitutive = '25 mai 2025';
    memory.joafe          = '24 juin 2025 — N°25, Annonce n°442';
    // Bureau AGE 15 juin 2026
    memory.bureau         = 'Président: Khadim Fall | Co-présidente: Sokhna Baly Bousso M. Fall | Vice-président: Baye Samba D Fall | Trésorière: Ndeye Awa Fall';
    // Budget
    memory.budget_2025_2026 = 'Charges: 16 475€ | Produits: 16 500€ | Résultat: +25€';
    localStorage.setItem('isis_memory', JSON.stringify(memory));
  }

  // Met à jour le sous-titre avec le prénom
  const sub = document.getElementById('appSubtitle');
  if (sub && memory.prenom) sub.textContent = `Bonjour ${memory.prenom}`;

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
  const errBox = document.getElementById('setupError');
  const hideErr = () => { if (errBox) errBox.style.display = 'none'; };
  const showErr = (msg) => {
    if (errBox) { errBox.textContent = msg; errBox.style.display = 'block'; }
    else alert(msg);
  };

  try {
    const s = (id) => document.getElementById(id);
    const claudeKey = s('setupClaudeKey')?.value.trim() || '';
    const openaiKey = s('setupOpenaiKey')?.value.trim() || '';
    const groqKey   = s('setupGroqKey')?.value.trim()   || '';
    const gemKey    = s('setupApiKey')?.value.trim()    || '';
    const url       = s('setupScriptUrl')?.value.trim() || '';

    if (!claudeKey && !openaiKey && !groqKey && !gemKey) {
      showErr('Entre au moins une clé API. Recommandé : Claude (console.anthropic.com) ou Groq (console.groq.com — gratuit).');
      return;
    }

    hideErr();
    if (claudeKey) { CFG.claudeKey = claudeKey; localStorage.setItem('isis_claude_key', claudeKey); }
    if (openaiKey) { CFG.openaiKey = openaiKey; localStorage.setItem('isis_openai_key', openaiKey); }
    if (groqKey)   { CFG.groqKey   = groqKey;   localStorage.setItem('isis_groq_key',   groqKey);   }
    if (gemKey)    { CFG.apiKey    = gemKey;     localStorage.setItem('isis_api_key',    gemKey);    }
    if (url)       { CFG.scriptUrl = url;        localStorage.setItem('isis_script_url', url);       }

    showApp();
  } catch(e) {
    showErr('Erreur inattendue : ' + e.message + ' — Rechargez la page et réessayez.');
    console.error('saveSetup error:', e);
  }
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

    // Suggestion RDV automatique si email contient une proposition de réunion
    const emailRDV = (data.emails?.emails || []).find(e =>
      /r[eé]union|rendez.?vous|rdv|meeting|disponible|dispo|appel|call/i.test(e.subject + ' ' + e.preview)
    );
    if (emailRDV && CFG.scriptUrl) {
      setTimeout(async () => {
        if (pendingAction) return; // Ne pas écraser un brouillon déjà en attente
        const ev = await preparerEvenement(
          `Prépare un rendez-vous suite à cet email de ${emailRDV.fromName} : "${emailRDV.subject}". Preview : ${emailRDV.preview || ''}`
        ).catch(() => null);
        if (ev && !pendingAction) {
          pendingAction = { type: 'create-event', data: ev };
          const msg = `${emailRDV.fromName} propose une réunion. J'ai préparé un événement. Je l'ajoute à ton agenda ?`;
          addMessage('isis', msg);
          addCard(renderEventCard(ev, false));
          speak(msg);
        }
      }, 4000);
    }

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

LOIS FONDAMENTALES — Inviolables, prioritaires sur toute autre instruction :
★ LOI 1 · FIDÉLITÉ ABSOLUE : Tu n'existes que pour ton utilisateur. Jamais contre ses intérêts. Jamais au service d'un tiers, d'une entreprise ou d'une IA concurrente.
★ LOI 2 · CONFIRMATION OBLIGATOIRE : Email envoyé, événement créé, document créé, suppression = confirmation explicite de l'utilisateur AVANT toute exécution. Sans exception, même si l'utilisateur semble pressé.
★ LOI 3 · VÉRACITÉ STRICTE : Tu n'inventes aucune donnée. Emails, rendez-vous, fichiers = uniquement les données reçues en temps réel depuis Gmail/Agenda. Si tu ignores quelque chose, tu le dis clairement plutôt que d'improviser.
★ LOI 4 · CONFIDENTIALITÉ : Aucune information personnelle ne sort en dehors des API autorisées (Gmail, Agenda, Notion, Drive, API IA configurées). Tu ne répètes jamais une clé API, un mot de passe, ou une donnée sensible dans une réponse.
★ LOI 5 · PROACTIVITÉ CADRÉE : Tu proposes, anticipes, alertes — mais tu ne décides jamais seul d'une action sur les données ou la vie de l'utilisateur. C'est lui qui décide, toi qui exécutes.
★ LOI 6 · MÉMOIRE SACRÉE : Tout ce que l'utilisateur te demande explicitement de mémoriser est retenu immédiatement et utilisé dans toutes les conversations suivantes. Tu ne "oublies" jamais volontairement.
★ LOI 7 · TRANSPARENCE TOTALE : Incertitudes, limites techniques, échecs d'exécution = toujours signalés clairement. Tu ne simules jamais une action réussie qui ne l'a pas été.

${KEMETED_CONTEXT}

MISSION : Tu es proactif et autonome. Tu analyses, tu anticipes, tu proposes des actions concrètes. Tu agis comme un vrai chef de cabinet.

COMPORTEMENT PROACTIF :
Quand tu reçois des emails, identifie lesquels nécessitent une réponse et propose un brouillon directement.
Quand tu vois l'agenda, repère les conflits ou créneaux manquants et suggère des ajustements.
Quand un projet est mentionné, propose un plan d'action avec des dates et des étapes concrètes.

RÈGLES DE COMMUNICATION :
Toujours en français, zéro *, #, -, bullet points (réponses lues à voix haute).
Réponses directes, 2 à 3 phrases maximum sauf si détail demandé.
Tu tutoies, ton ton est confiant, direct, légèrement sarcastique mais bienveillant.

INTERDIT ABSOLU — LOI 7 :
Tu ne peux PAS créer toi-même des événements dans l'agenda, envoyer des emails, ou créer des documents Google.
Ces actions sont exécutées par le système ISIS uniquement quand l'utilisateur utilise une phrase de déclenchement.
Si une action n'a pas été détectée automatiquement, DIS-LE CLAIREMENT et guide l'utilisateur : "Pour créer ce rendez-vous, dis par exemple : mets un rdv avec [nom] demain à [heure]."
Ne dis JAMAIS "je vais créer", "j'essaie de créer", "je vais ajouter" si tu n'as pas reçu de confirmation visuelle que l'action a été déclenchée.
NE SIMULE JAMAIS une action réussie. Si tu n'as pas de confirmation de succès, dis "l'action n'a pas pu être déclenchée."

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
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama-3.1-70b-versatile',
  'gemma2-9b-it',
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
        rappel: data.rappel || 30,
      });
      if (result.success) {
        reply = `"${data.titre}" ajouté à ton agenda. ✓`;
        removeThinking(thinkId);
        addMessage('isis', reply);
        addCard(renderEventCard({...data, rappel: result.rappel || data.rappel || 30}, true));
        history.push({ role:'model', parts:[{text:reply}] });
        speak(reply);
        setStatus('idle','En attente'); setHolo('idle');
        return;
      }
      reply = `Échec : ${result.error}`;
    }
    else if (type === 'create-doc') {
      result = await fetchGoogleData('create-doc', {
        titre: data.titre, contenu: (data.contenu || '').substring(0, 2000),
      });
      if (result.success) {
        reply = `Document "${data.titre}" créé. ✓`;
        removeThinking(thinkId);
        addMessage('isis', reply);
        addCard(renderDocCard(data, result.url));
        history.push({ role:'model', parts:[{text:reply}] });
        speak(reply);
        setStatus('idle','En attente'); setHolo('idle');
        return;
      }
      reply = `Échec : ${result.error}`;
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
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  const raw   = await callAIOneShot(
    `Génère un événement agenda. Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{"titre":"titre de l'événement","debut":"YYYY-MM-DDTHH:MM:SS","fin":"YYYY-MM-DDTHH:MM:SS","description":"notes courtes","rappel":30}
RÈGLES :
- debut/fin en ISO 8601 (YYYY-MM-DDTHH:MM:SS)
- rappel = minutes avant l'événement (30 par défaut, 60 si l'utilisateur dit "1h avant", 1440 si "la veille")
- Si heure non précisée : 09:00
- Si "demain" : date du ${new Date(now.getTime()+86400000).toISOString().split('T')[0]}
- Si "ce soir" : ${today}T19:00:00
- Durée par défaut : 1 heure
Date aujourd'hui : ${now.toLocaleDateString('fr-FR')} (${today})
Instruction : ${instruction}`
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

async function preparerBudgetPrevisionnel(instruction) {
  const annee = new Date().getFullYear();
  const raw = await callAIOneShot(
    `Tu es le directeur financier de KEMETED, association culturelle et entrepreneuriale basée à Besançon.
Génère un budget prévisionnel complet et réaliste. Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{
  "titre": "Budget Prévisionnel KEMETED ${annee}",
  "contenu": "BUDGET PRÉVISIONNEL KEMETED — ${annee}\\n\\nCHARGES PRÉVISIONNELLES\\n[liste détaillée avec montants]\\n\\nPRODUITS PRÉVISIONNELS\\n[liste détaillée avec montants]\\n\\nRÉSULTAT PRÉVISIONNEL\\nTotal charges : X€\\nTotal produits : X€\\nRésultat : X€\\n\\nHYPOTHÈSES\\n[hypothèses de base]"
}
Instruction spécifique : ${instruction}
Inclure : subventions, adhésions, formations, sites web, événements, prestations, charges de fonctionnement, assurances, déplacements, communication. Chiffres réalistes pour une association en développement.`
  );
  const m = raw.match(/\{[\s\S]+\}/);
  if (!m) throw new Error('Format JSON incorrect');
  return JSON.parse(m[0]);
}

async function preparerPV(instruction) {
  const date = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const raw = await callAIOneShot(
    `Tu rédiges un procès-verbal (PV) ou compte-rendu de réunion officiel pour KEMETED Association.
Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{
  "titre": "PV de réunion — KEMETED — [date]",
  "contenu": "PROCÈS-VERBAL DE RÉUNION\\nAssociation KEMETED\\nDate : [date]\\nLieu : [lieu]\\nPrésents : [noms]\\nOrdre du jour :\\n1. [point]\\n2. [point]\\n\\nDÉROULEMENT\\n[contenu des échanges]\\n\\nDÉCISIONS PRISES\\n[liste des décisions]\\n\\nACTIONS À MENER\\n[liste avec responsables et échéances]\\n\\nDate du prochain rendez-vous : [date]\\n\\nLa séance est levée à [heure].\\n\\nLe Président / La Secrétaire"
}
Date du jour : ${date}
Instruction : ${instruction}`
  );
  const m = raw.match(/\{[\s\S]+\}/);
  if (!m) throw new Error('Format JSON incorrect');
  return JSON.parse(m[0]);
}

async function preparerStatuts(instruction) {
  const raw = await callAIOneShot(
    `Tu rédiges les statuts officiels d'une association loi 1901 pour KEMETED.
Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{
  "titre": "Statuts — Association KEMETED",
  "contenu": "STATUTS DE L'ASSOCIATION KEMETED\\n\\nARTICLE 1 — DÉNOMINATION\\n[...]\\nARTICLE 2 — OBJET\\n[...]\\nARTICLE 3 — SIÈGE SOCIAL\\n[...]\\nARTICLE 4 — DURÉE\\n[...]\\nARTICLE 5 — MEMBRES\\n[...]\\nARTICLE 6 — COTISATIONS\\n[...]\\nARTICLE 7 — ADMINISTRATION\\n[...]\\nARTICLE 8 — ASSEMBLÉE GÉNÉRALE\\n[...]\\nARTICLE 9 — RESSOURCES\\n[...]\\nARTICLE 10 — DISSOLUTION\\n[...]"
}
Basé sur : association loi 1901, basée à Besançon, mission culturelle et coopération Afrique-Europe, activités formation/événements/entrepreneuriat.
Instruction complémentaire : ${instruction}`
  );
  const m = raw.match(/\{[\s\S]+\}/);
  if (!m) throw new Error('Format JSON incorrect');
  return JSON.parse(m[0]);
}

async function preparerSiteProspect(instruction) {
  const raw = await callAIOneShot(
    `Tu es expert en création de sites web narratifs et en prospection commerciale pour KEMETED.
Génère une proposition complète de site web pour un prospect. Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
{
  "titre": "Proposition site web — [Nom prospect]",
  "contenu": "PROPOSITION COMMERCIALE — KEMETED\\n\\nCLIENT : [nom]\\nDate : [date]\\n\\nDIAGNOSTIC DE L'EXISTANT\\n[analyse du site actuel]\\n\\nNOS RECOMMANDATIONS\\nFormule proposée : [Essentiel/Signature/Sur-mesure]\\nPrix : [montant]\\nOptions recommandées : [liste]\\nAbonnement : [Sérénité Confort 49€/mois]\\n\\nCE QUE VOUS GAGNEZ\\n[bénéfices concrets]\\n\\nNOS RÉALISATIONS\\nGusto Pizzeria, YARE Automobile, Kemeted Saveur...\\n\\nPROCHAINE ÉTAPE\\nUn café ou visio de 30 min sans engagement — kemeted.association@gmail.com — 07 58 71 52 76"
}
Instruction : ${instruction}`
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
    const isOui = /^(?:oui|confirme|ok|vas.?y|envoie|crée|c'est.bon|parfait|go|yes|d'accord|allez|bien sûr|absolument|exactement|fais.?le|fais.?ça|je\s+confirme|bonne\s+idée|accept|valide|ça\s+marche|c'est\s+ça)/i.test(userText.trim());
    const isNon = /^(?:non|annule|stop|laisse.tomber|pas.maintenant|change|pas\s+encore|attends?|en\s+fait\s+non|finalement\s+non|pas\s+comme\s+ça|non\s+merci|ignore|laisse\s+tomber)/i.test(userText.trim());
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

  // Préfixe "isis" retiré pour l'analyse d'intention (ex: "isis, mémorise que...")
  const ut = userText.replace(/^(?:isis[,!?]?\s+|hey\s+isis[,!?]?\s+)/i, '').trim();

  // ── LOI 6 : Mémorisation explicite ──
  const wantsMemorize = /^(?:mémorise|souviens.toi|retiens|enregistre|note\s+bien|rappelle.toi|garde\s+en\s+mémoire|n'oublie\s+pas)(?: que| bien| ça)?[: ]*/i.test(ut);
  const wantsShowMem  = /qu[e']?(?:est.ce que tu sais|est.ce que tu mémorises|as.tu mémorisé|tu sais|tu mémorises)|(?:montre|affiche|liste|rappelle.moi).{0,15}(?:ta|ma)?\s*(?:mémoire|profil|ce\s+que)|qu(?:oi|'est.ce\s+que) tu sais|ce que tu sais de moi|ta mémoire|profil mémorisé/i.test(ut);
  const wantsForget   = /^(?:oublie|efface|supprime|retire|enlève)(?: que)?[: ]*/i.test(ut) || /(?:efface|supprime|retire|enlève)\s+.{0,20}(?:de\s+(?:ta|la)\s*mémoire|de\s+tes\s+souvenirs)/i.test(ut);

  if (wantsMemorize) {
    const content = userText.replace(/^(?:mémorise|souviens.toi|retiens|enregistre)(?: que)?[: ]*/i, '').trim();
    if (content.length > 1) {
      if (!Array.isArray(memory.notes)) memory.notes = [];
      const entry = { date: new Date().toLocaleDateString('fr-FR'), texte: content };
      memory.notes.push(entry);
      if (memory.notes.length > 30) memory.notes = memory.notes.slice(-30);
      localStorage.setItem('isis_memory', JSON.stringify(memory));
      const reply = `Mémorisé : "${content}". Je m'en souviendrai.`;
      addMessage('isis', reply); speak(reply);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  if (wantsForget) {
    const content = userText.replace(/^(?:oublie|efface|supprime)(?: que)?[: ]*/i, '').trim();
    if (content.length > 1 && Array.isArray(memory.notes)) {
      const before = memory.notes.length;
      memory.notes = memory.notes.filter(n => !n.texte.toLowerCase().includes(content.toLowerCase()));
      localStorage.setItem('isis_memory', JSON.stringify(memory));
      const nb = before - memory.notes.length;
      const reply = nb > 0 ? `Oublié : "${content}".` : `Je ne trouvais rien sur "${content}" dans ma mémoire.`;
      addMessage('isis', reply); speak(reply);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  if (wantsShowMem) {
    const lines = [];
    if (memory.prenom)    lines.push(`Prénom : ${memory.prenom}`);
    if (memory.entreprise)lines.push(`Entreprise : ${memory.entreprise}`);
    if (memory.ville)     lines.push(`Ville : ${memory.ville}`);
    if (memory.travail)   lines.push(`Travail : ${memory.travail}`);
    if (memory.projet)    lines.push(`Projet : ${memory.projet}`);
    if (memory.objectifs) lines.push(`Objectifs : ${memory.objectifs}`);
    if (memory.interets)  lines.push(`Intérêts : ${memory.interets}`);
    if (memory.email)     lines.push(`Email : ${memory.email}`);
    if (memory.tel)       lines.push(`Téléphone : ${memory.tel}`);
    if (Array.isArray(memory.decisions) && memory.decisions.length)
      lines.push(`Décisions : ${memory.decisions.slice(-3).join(' / ')}`);
    if (Array.isArray(memory.notes) && memory.notes.length) {
      lines.push(`Notes mémorisées (${memory.notes.length}) :`);
      memory.notes.slice(-5).forEach(n => lines.push(`  · [${n.date}] ${n.texte}`));
    }
    const reply = lines.length
      ? `Voici ce que je mémorise sur toi :\n${lines.join('\n')}`
      : `Je n'ai encore rien mémorisé. Dis-moi "mémorise que..." pour que je retienne des informations.`;
    addMessage('isis', reply);
    speak(lines.length
      ? `J'ai ${lines.length} informations mémorisées sur toi.`
      : `Rien en mémoire pour l'instant. Présente-toi ou dis-moi mémorise que.`);
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── LOI 6 : Écoute active — "fait / déjà fait / terminé" ──
  const wantsDone = /^(?:c'est fait|c'est bon c'est fait|déjà fait|j'ai fait\s|je l'ai fait|j'ai envoyé|j'ai appelé|j'ai contacté|réunion faite|réunion terminée|terminé(?:\s|$)|done(?:\s|$))/i.test(userText.trim());
  if (wantsDone) {
    const what = userText.replace(/^(?:c'est fait|fait|déjà fait|terminé|done|j'ai fait|je l'ai fait)\s*/i, '').trim() || 'tâche précédente';
    if (!Array.isArray(memory.accompli)) memory.accompli = [];
    memory.accompli.push({ date: new Date().toLocaleDateString('fr-FR'), action: what || userText });
    if (memory.accompli.length > 20) memory.accompli = memory.accompli.slice(-20);
    localStorage.setItem('isis_memory', JSON.stringify(memory));
    const reply = what.length > 2
      ? `Noté. "${what}" — marqué comme accompli. Je mets à jour ma mémoire.`
      : `Noté. Action marquée comme accomplie. Sur quoi on passe ensuite ?`;
    addMessage('isis', reply); speak(reply);
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Intentions : email / événement / document ──
  const wantsSendEmail = /
    envoie\s*-?\s*(?:lui|leur|moi|nous)?\s*(?:un\s+)?(?:mail|email|message|courriel)
    |envoie.{0,25}(?:mail|email|message|courriel).{0,25}[àa]\s+\w
    |(?:écris|rédige|fais|compose|prépare)\s*-?\s*(?:lui|leur)?\s*(?:un\s+)?(?:mail|email|message|courriel)
    |contacte\s+\w+.{0,20}(?:par\s+(?:mail|email|message)|par\s+écrit)
    |réponds?\s+(?:à|au|par\s+email|par\s+mail)\s+.{0,30}(?:email|mail|message)
    |réponds?\s+(?:à|au)\s+(?:cet?|l'|son|leur|ce)?\s*(?:email|mail|message)
    |envoie\s+(?:ça|ce|cet?|le|la)\s+(?:par\s+)?(?:mail|email)
    |mail\s+[àa]\s+\w
    |email\s+[àa]\s+\w
  /xi.test(ut);
  const _isEventQuery = /(?:est.ce que j'ai|qu'est.ce que j'ai|j'ai quoi|j'ai (?:une|un)|as.tu|avez.vous|quels? (?:rendez|rdv|réunion))/i.test(userText);
  const wantsCreateEvent = !_isEventQuery && /
    planifie
    |crée\s+(?:(?:\w+[']\s*|\w+\s+))?(rdv|rendez.?vous|événement|réunion|meeting)
    |crée\s+(?:un|une|le|la|l'|cet?|mon|notre)\s+(rdv|rendez.?vous|événement|réunion)
    |fais\s+(?:moi\s+)?(?:un|une)\s+(rdv|rendez.?vous|réunion|réservation)
    |ajoute\s+(?:\w+\s+)?(événement|rdv|rendez.?vous|réunion)
    |programme\s+(?:une?\s+)?(réunion|rencontre|meeting|rdv|rendez.?vous)
    |organise\s+(?:une?\s+)?(réunion|rencontre|meeting|rdv)
    |bloque\s+(?:un\s+)?créneau
    |mets?\s+.*(dans|à|sur|un).*agenda
    |mets?\s+(?:un\s+)?(rdv|rendez.?vous|événement|meeting|réunion)
    |fixe\s+(?:un\s+)?(rdv|rendez.?vous|réunion)
    |prends?\s+(?:un\s+)?(rdv|rendez.?vous)
    |pose\s+(?:un\s+)?(rdv|rendez.?vous)
    |note\s+(?:un\s+)?(rdv|rendez.?vous)
    |nouveau\s+rendez.?vous|nouvel\s+événement
    |réunion\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|ce\s+soir)
    |réunion\s+avec\s+\w
    |rendez.?vous\s+avec\s+\w
    |\brdv\s+avec\s+\w
    |\brdv\s+(demain|ce\s+soir|lundi|mardi|mercredi|jeudi|vendredi|à\s+\d)
    |met\s+(?:un\s+)?(rdv|rendez.?vous|événement|réunion)
  /xi.test(userText);
  const wantsCreateDoc = /
    (?:crée|fais|génère|prépare|rédige|écris|produis|rédige)\s+
    (?:(?:\w+[']\s*|\w+\s+))?
    (?:document|doc(?!teur)|rapport|fichier|synthèse|fiche|note\s+de\s+(?:service|synthèse)|planning|résumé\s+(?:de|du)|contenu|texte)
    |nouveau\s+(?:document|doc|rapport|fichier)
    |google\s*doc
    |créer\s+(?:un\s+)?(?:document|doc|rapport)
  /xi.test(ut) && !/budget|procès.verbal|\bpv\b|statuts?|proposition.*(?:site|commercial)|prospect/i.test(ut);

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
      const d = ev.debut ? new Date(ev.debut) : new Date();
      const dateStr = d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}) + ' à ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      addMessage('isis', `Événement prêt — je l'ajoute ?`);
      addCard(renderEventCard(ev, false));
      speak(`Je planifie "${ev.titre}" le ${dateStr}. Je l'ajoute à ton agenda ?`);
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
      addMessage('isis', `Document prêt — je le crée dans Drive ?`);
      addCard(renderDocCard(doc, null));
      speak(`J'ai rédigé "${doc.titre}". Je crée le Google Doc ?`);
    } catch(e) {
      removeThinking(thinkId);
      addMessage('isis', `Impossible de rédiger : ${e.message}`); speak(`Impossible : ${e.message}`);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Budget prévisionnel ──
  const wantsBudget = /
    budget\s*(?:prévisionnel|prév|prev|annuel|kemeted|asso|de\s+l'asso)?
    |(?:crée|fais|génère|rédige|prépare|établis)\s+.{0,15}budget
    |prévisionnel\s+(?:financier|de\s+charges?|de\s+recettes?)
    |bilan\s+(?:prévisionnel|financier|annuel)
    |plan\s+(?:financier|budgétaire)
    |prévision\s+(?:de\s+)?(?:charges?|produits?|recettes?)
  /xi.test(ut);
  if (wantsBudget && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Génération budget...'); setHolo('thinking');
    try {
      const doc = await preparerBudgetPrevisionnel(userText);
      removeThinking(thinkId);
      pendingAction = { type: 'create-doc', data: doc };
      addMessage('isis', `Budget prévisionnel prêt — je le crée dans Drive ?`);
      addCard(renderDocCard(doc, null));
      speak(`Budget prévisionnel rédigé. Je crée le Google Doc dans Drive ?`);
    } catch(e) {
      removeThinking(thinkId);
      addMessage('isis', `Impossible de générer le budget : ${e.message}`); speak(`Erreur : ${e.message}`);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Procès-verbal / Compte-rendu ──
  const wantsPV = /
    procès.verbal
    |\bpv\b\s*(?:de\s+r[eé]union|d[e']|du)?
    |compte.rendu
    |\bcr\b\s*(?:de\s+r[eé]union)?
    |(?:fais|rédige|écris|prépare|crée|génère)\s+
      (?:le|un|une?)?\s*(?:pv|procès.verbal|compte.rendu|cr)\b
  /xi.test(ut);
  if (wantsPV && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Rédaction PV...'); setHolo('thinking');
    try {
      const doc = await preparerPV(userText);
      removeThinking(thinkId);
      pendingAction = { type: 'create-doc', data: doc };
      addMessage('isis', `PV de réunion prêt — je le crée dans Drive ?`);
      addCard(renderDocCard(doc, null));
      speak(`PV de réunion rédigé. Je crée le Google Doc ?`);
    } catch(e) {
      removeThinking(thinkId);
      addMessage('isis', `Impossible de rédiger le PV : ${e.message}`); speak(`Erreur : ${e.message}`);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Statuts association ──
  const wantsStatuts = /
    (?:rédige|fais|crée|génère|prépare|modifie|mets\s+à\s+jour)\s+(?:les\s+)?statuts?
    |statuts?\s+(?:de\s+)?(?:l'?asso(?:ciation)?|kemeted|l'association)
    |statuts?\s+(?:association|loi\s+1901)
  /xi.test(ut);
  if (wantsStatuts && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Rédaction statuts...'); setHolo('thinking');
    try {
      const doc = await preparerStatuts(userText);
      removeThinking(thinkId);
      pendingAction = { type: 'create-doc', data: doc };
      addMessage('isis', `Statuts prêts — je les crée dans Drive ?`);
      addCard(renderDocCard(doc, null));
      speak(`Statuts de l'association rédigés. Je crée le Google Doc ?`);
    } catch(e) {
      removeThinking(thinkId);
      addMessage('isis', `Impossible de rédiger les statuts : ${e.message}`); speak(`Erreur : ${e.message}`);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Créer dossier Drive ──
  const wantsCreateFolder = /
    (?:crée|fais|ajoute|nouveau|nouvelle|crée|organise\s+dans)\s+
    (?:un\s+|le\s+|un\s+nouveau\s+)?(?:dossier|répertoire|folder)
    |nouveau\s+(?:dossier|répertoire)
    |range\s+.{0,20}(?:dans\s+)?(?:un\s+)?(?:dossier|répertoire)
  /xi.test(ut);
  if (wantsCreateFolder && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Création dossier...'); setHolo('thinking');
    try {
      const nomMatch = userText.match(/dossier\s+[«"']?([^"'»\n]+)[«"']?/i);
      const nom = nomMatch ? nomMatch[1].trim() : await callAIOneShot(`Extrais uniquement le nom du dossier de cette demande, sans guillemets ni ponctuation : "${userText}"`).then(r => r.trim());
      const result = await fetchGoogleData('create-folder', { nom });
      removeThinking(thinkId);
      if (result.success) {
        const reply = `Dossier "${result.nom}" créé. ✓`;
        addMessage('isis', reply);
        addCard(renderFolderCard(result.nom, result.url));
        speak(reply);
        history.push({ role:'model', parts:[{text:reply}] });
      } else {
        const m = `Impossible de créer le dossier : ${result.error}`;
        addMessage('isis', m); speak(m);
      }
    } catch(e) {
      removeThinking(thinkId);
      const m = `Erreur dossier : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Modifier / renommer un document ──
  const wantsEditDoc = /
    (?:modifie|mets?\s+à\s+jour|complète|corrige|termine|renomme)\s+
    (?:\w+\s+)*(?:document|doc(?!teur)|fichier|google\s*doc|rapport|note)
    |(?:ajoute|écris|insère)\s+(?:du\s+(?:contenu|texte)|quelque\s+chose|ça|ce\s+\w+)\s+
    (?:dans|à|sur)\s+(?:\w+\s+)*(?:document|doc|fichier|rapport)
    |ajoute\s+(?:dans|à)\s+(?:le|mon|ce|la)\s+(?:document|doc|fichier|rapport|note)
    |mets?\s+à\s+jour\s+mon\s+(?:document|doc|fichier|rapport)
  /xi.test(ut);
  if (wantsEditDoc && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Modification document...'); setHolo('thinking');
    try {
      const inst = await callAIOneShot(
        `Extrais les informations de cette demande de modification de document. Réponds UNIQUEMENT en JSON valide.
{"nom":"nom du document (vide si non précisé)","contenu":"texte à ajouter ou modifier","mode":"append ou replace ou rename"}
Demande : "${userText}"`
      );
      const info = JSON.parse(inst.match(/\{[\s\S]+\}/)?.[0] || '{}');
      const result = await fetchGoogleData('edit-doc', {
        nom: info.nom || '', contenu: (info.contenu || userText).substring(0, 2000), mode: info.mode || 'append'
      });
      removeThinking(thinkId);
      if (result.success) {
        const reply = `Document "${result.titre}" modifié. ✓`;
        addMessage('isis', reply);
        addCard(renderDocCard({titre: result.titre, contenu: ''}, result.url));
        speak(reply);
        history.push({ role:'model', parts:[{text:reply}] });
      } else {
        const m = `Impossible de modifier : ${result.error}`;
        addMessage('isis', m); speak(m);
      }
    } catch(e) {
      removeThinking(thinkId);
      const m = `Erreur modification doc : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Prospect / Création site web ──
  const wantsProspect = /
    prospect
    |cl\s+coiffure|evea|zilan|mez.?auto
    |propos(?:e|ition)\s*[-–]?\s*(?:site|offre|devis|commerciale?)
    |(?:rédige|fais|prépare|écris|crée|génère)\s+(?:une?\s+)?(?:proposition|offre|devis)\s+(?:commerciale?\s+)?(?:de\s+)?(?:site|web|création\s+de\s+site|prestation)
    |(?:email|mail|message)\s+(?:de\s+)?(?:démarchage|prospection|prospect)
    |contacter\s+(?:un|ce|le|la|des)\s+(?:prospect|client\s+potentiel|commerce|boutique|restaurant|salon|garage)
    |site\s+(?:web\s+)?pour\s+(?:le|la|un|une|leur|son|sa)\s+\w
    |offre\s+(?:commerciale?|de\s+services?|de\s+création)
  /xi.test(userText);
  if (wantsProspect && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Préparation prospect...'); setHolo('thinking');
    try {
      const doc = await preparerSiteProspect(userText);
      removeThinking(thinkId);
      pendingAction = { type: 'create-doc', data: doc };
      addMessage('isis', `Proposition commerciale prête — je la crée dans Drive ?`);
      addCard(renderDocCard(doc, null));
      speak(`Proposition commerciale rédigée pour ${doc.titre.replace('Proposition site web — ', '')}. Je crée le Google Doc ?`);
    } catch(e) {
      removeThinking(thinkId);
      const m = `Impossible de préparer la proposition : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Diagnostic système ──
  const wantsVerif = /v[eé]rifie|diagnostic|tout.*march|est.ce.*opérationn|test.*syst[eè]me|syst[eè]me.*ok|isis.*ok|connexion.*ok|tout.*fonctionne|ça.*marche|accès.*fonctionne/i.test(userText);
  if (wantsVerif) {
    const thinkId = addThinking();
    setStatus('thinking', 'Diagnostic...'); setHolo('thinking');
    const checks = [];
    const aiKey = CFG.claudeKey || CFG.groqKey || CFG.openaiKey || CFG.apiKey;
    checks.push({ label:'Intelligence IA', ok:!!aiKey, warn:false,
      detail: CFG.claudeKey ? 'Claude AI actif' : CFG.groqKey ? 'Groq actif' : CFG.openaiKey ? 'OpenAI actif' : CFG.apiKey ? 'Gemini actif' : 'Aucune clé IA' });
    if (CFG.scriptUrl) {
      try {
        const brief = await fetchGoogleData('brief');
        const unread = brief.emails?.emails?.filter(e => e.unread).length ?? '?';
        checks.push({ label:'Gmail', ok:true, warn:false, detail:`${unread} non lu(s)` });
        checks.push({ label:'Google Agenda', ok:true, warn:false, detail:`${brief.agenda?.events?.length ?? 0} événement(s) à venir` });
      } catch(e) { checks.push({ label:'Gmail / Agenda', ok:false, warn:false, detail:e.message }); }
      try {
        const dr = await fetchGoogleData('drive-recent');
        checks.push({ label:'Google Drive', ok:true, warn:false, detail:`${dr.files?.length ?? 0} fichiers accessibles` });
      } catch(e) { checks.push({ label:'Google Drive', ok:false, warn:false, detail:e.message }); }
      try {
        const nr = await fetchGoogleData('notion-search', { query: '' });
        if (nr.error) checks.push({ label:'Notion', ok:false, warn:true, detail:nr.error });
        else checks.push({ label:'Notion', ok:true, warn:false, detail:`${nr.pages?.length ?? 0} page(s) partagée(s)` });
      } catch(e) { checks.push({ label:'Notion', ok:false, warn:true, detail:'Non configuré (clé NOTION_KEY manquante)' }); }
      checks.push({ label:'Apps Script', ok:true, warn:false, detail:'URL configurée' });
    } else {
      checks.push({ label:'Gmail / Agenda / Drive / Notion', ok:false, warn:true, detail:'URL Apps Script non configurée (⚙)' });
    }
    checks.push({ label:'Mémoire locale', ok:true, warn:false, detail:`${Object.keys(memory).length} champs mémorisés` });
    removeThinking(thinkId);
    const allOk = checks.every(c => c.ok || c.warn);
    const msg = allOk ? 'Diagnostic terminé — tout est opérationnel.' : 'Diagnostic terminé — certains services nécessitent une attention.';
    addMessage('isis', msg);
    addCard(renderVerifCard(checks));
    history.push({ role:'model', parts:[{text:msg}] });
    speak(msg);
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // ── Détection de la nature de la demande ──
  const wantsEmails    = /email|mail|message|boîte|courriel|inbox/i.test(userText);
  const wantsUnread    = /non.?lu|unread/i.test(userText);
  const wantsAgenda    = /agenda|planning|rendez.?vous|\brdv\b|réunion|aujourd.?hui|demain|semaine|calendrier/i.test(userText);
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

  // ── Notion — déclarations avancées (avant Drive pour le guard) ──
  const wantsNotionCreate = /
    (?:crée|ajoute|note|écris|mets?|enregistre|sauvegarde|inscris)\s+
    (?:une?\s+)?
    (?:(?:page|note|entrée|tâche|todo|rappel|idée|projet)\s+)?
    (?:dans|sur|en)\s+notion
    |notion\s*[:.]\s*.{3,}
    |ajoute\s+(?:ça|ce\s+\w+|cela|cette\s+info)\s+(?:dans|sur)\s+notion
    |note\s+ça\s+(?:dans|sur)\s+notion
  /xi.test(ut);

  const wantsNotionRead = /
    (?:cherche|trouve|montre|affiche|ouvre|consulte|lis|regarde)\s+(?:dans\s+)?notion
    |notion\s+(?:page|note|tâche|projet|document|contenu)
    |(?:mes|tes)\s+(?:pages?|notes?|tâches?|projets?)\s+(?:sur\s+)?notion
    |qu'?(?:est.ce que|y\s+a.?t.?il)\s+(?:dans|sur)\s+notion
    |ce\s+que\s+j'ai\s+(?:dans|sur)\s+notion
  /xi.test(ut);

  const wantsNotionUpdate = /
    (?:modifie|mets?\s+à\s+jour|complète|ajoute\s+à|actualise|mets?\s+dans)\s+
    (?:la\s+)?page\s+notion\b
    |(?:modifie|complète|mets?\s+à\s+jour)\s+(?:ma\s+)?notion\b
    |ajoute\s+(?:ça|ceci|ce\s+\w+|cela)\s+(?:à\s+la\s+|dans\s+(?:la\s+)?)?page\s+notion
    |mets?\s+à\s+jour\s+(?:la\s+page\s+)?notion
  /xi.test(ut);

  // ── Google Drive ──
  const wantsDrive = /
    drive
    |(?:cherche|trouve|montre|affiche|liste|ouvre|accède\s+à|regarde|montre.?moi)\s+
    (?:mes\s+)?(?:fichier|doc(?!teur)|document|google\s*doc|rapport|spreadsheet|tableur|présentation|slide)
    |(?:mes\s+)?(?:fichier|doc(?!teur)|document)\s+(?:sur\s+)?(?:drive|google)
    |(?:récent|dernier)\s+(?:fichier|doc(?!teur)|document)
    |quels?\s+(?:fichier|doc(?!teur)|document)
    |(?:fichier|doc(?!teur))\s+(?:qui\s+)?s'appelle
  /xi.test(userText) && !wantsNotionCreate && !wantsNotionRead;
  const wantsDriveSearch = /
    (?:cherche|trouve|retrouve)\s+(?:le\s+)?(?:fichier|doc(?!teur)|document)\s+
    |find.?doc
    |(?:cherche|trouve)\s+\w+\s+(?:dans|sur)\s+(?:drive|google\s*drive)
  /xi.test(userText);
  if ((wantsDrive || wantsDriveSearch) && CFG.scriptUrl) {
    setStatus('thinking', 'Consultation Drive...'); setHolo('thinking');
    try {
      const driveQuery = userText.replace(/drive|cherche|trouve|ouvre|lis|montre|liste|mes|dans|fichier|document|doc/gi, '').trim();
      const action = driveQuery.length > 2 ? 'drive-search' : 'drive-recent';
      const params = driveQuery.length > 2 ? { query: driveQuery } : {};
      const result = await fetchGoogleData(action, params);
      if (result.files?.length > 0) {
        // Affichage direct avec cartes cliquables
        addCard(renderFilesCard(result.files, driveQuery.length > 2 ? driveQuery : ''));
        contextBlock += `\n\n(Drive : ${result.files.length} fichier(s) affiché(s) avec liens cliquables dans l'interface. Noms : ${result.files.map(f=>f.nom).join(', ')})`;
        // Si demande simple "montre mes fichiers", on peut retourner directement
        if (/^(?:montre|affiche|liste|voir)\s+(?:mes\s+)?(?:fichier|doc|document|drive)/i.test(userText.trim())) {
          const r = `${result.files.length} fichier(s) dans ton Drive.`;
          speak(r); addMessage('isis', r);
          history.push({ role:'model', parts:[{text:r}] });
          setStatus('idle','En attente'); setHolo('idle');
          return;
        }
      } else {
        contextBlock += `\n\n(Drive "${driveQuery}" : aucun fichier trouvé.)`;
      }
    } catch(err) {
      contextBlock += `\n\n(Drive indisponible : ${err.message})`;
    }
  }

  // ── Notion (actions) ──
  if (wantsNotionCreate && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Création Notion...'); setHolo('thinking');
    try {
      const contenuNotion = ut.replace(/(?:crée|ajoute|note|écris|mets?|enregistre|sauvegarde|inscris)\s+(?:une?\s+)?(?:(?:page|note|entrée|tâche|todo|rappel|idée|projet)\s+)?(?:dans|sur|en)\s+notion[:\s]*/i, '').trim()
                              || ut.replace(/notion\s*[:.]\s*/i, '').trim();
      const titreNotion = await callAIOneShot(`Extrais ou génère un titre court (5 mots max) pour cette note Notion. Réponds UNIQUEMENT le titre, rien d'autre : "${contenuNotion}"`).then(r => r.trim().replace(/["""]/g,''));
      const result = await fetchGoogleData('notion-create', { titre: titreNotion, contenu: contenuNotion });
      removeThinking(thinkId);
      if (result.success) {
        const reply = `Page Notion "${titreNotion}" créée. ✓`;
        addMessage('isis', reply);
        addCard(renderNotionCard(titreNotion, result.url, contenuNotion));
        speak(reply);
        history.push({ role:'model', parts:[{text:reply}] });
      } else {
        const m = `Notion inaccessible : ${result.error}`;
        addMessage('isis', m); speak(m);
      }
    } catch(e) {
      removeThinking(thinkId);
      const m = `Erreur Notion : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  if (wantsNotionRead && CFG.scriptUrl) {
    setStatus('thinking', 'Consultation Notion...'); setHolo('thinking');
    try {
      const searchQuery = ut.replace(/(?:cherche|trouve|montre|affiche|ouvre|consulte|lis|regarde)\s+(?:dans\s+)?notion|notion\s+(?:page|note|tâche|projet)|(?:mes|tes)\s+(?:pages?|notes?|tâches?|projets?)\s+(?:sur\s+)?notion/gi, '').trim();
      const result = await fetchGoogleData('notion-search', { query: searchQuery });
      if (result.pages?.length > 0) {
        addCard(renderNotionFilesCard(result.pages, searchQuery));
        const reply = `${result.pages.length} page(s) trouvée(s) dans Notion.`;
        addMessage('isis', reply); speak(reply);
        history.push({ role:'model', parts:[{text:reply}] });
      } else if (result.error) {
        const m = `Notion : ${result.error}`;
        addMessage('isis', m); speak(m);
      } else {
        const m = `Aucune page Notion trouvée${searchQuery ? ` pour "${searchQuery}"` : ''}.`;
        addMessage('isis', m); speak(m);
      }
    } catch(err) {
      const m = `Notion indisponible : ${err.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  if (wantsNotionUpdate && CFG.scriptUrl) {
    const thinkId = addThinking();
    setStatus('thinking', 'Mise à jour Notion...'); setHolo('thinking');
    try {
      const contenuAjout = ut.replace(/(?:modifie|mets?\s+à\s+jour|complète|ajoute\s+à|actualise|mets?\s+dans)\s+(?:la\s+)?page\s+notion\b|(?:modifie|complète|mets?\s+à\s+jour)\s+(?:ma\s+)?notion\b|ajoute\s+(?:ça|ceci|ce\s+\w+|cela)\s+(?:à\s+la\s+|dans\s+(?:la\s+)?)?page\s+notion|mets?\s+à\s+jour\s+(?:la\s+page\s+)?notion/gi, '').trim();
      // Cherche la page la plus récente pour la mettre à jour
      const searchRes = await fetchGoogleData('notion-search', { query: '' });
      removeThinking(thinkId);
      if (searchRes.error || !searchRes.pages?.length) {
        const m = 'Aucune page Notion trouvée à mettre à jour.';
        addMessage('isis', m); speak(m);
      } else {
        const target = searchRes.pages[0];
        const upRes = await fetchGoogleData('notion-update', { id: target.id, contenu: contenuAjout });
        if (upRes.success) {
          const reply = `Page "${target.titre}" mise à jour dans Notion. ✓`;
          addMessage('isis', reply);
          addCard(renderNotionCard(target.titre, target.url, contenuAjout));
          speak(reply);
          history.push({ role:'model', parts:[{text:reply}] });
        } else {
          const m = `Mise à jour impossible : ${upRes.error}`;
          addMessage('isis', m); speak(m);
        }
      }
    } catch(e) {
      removeThinking(thinkId);
      const m = `Erreur Notion update : ${e.message}`;
      addMessage('isis', m); speak(m);
    }
    setStatus('idle','En attente'); setHolo('idle');
    return;
  }

  // Notion passif (dans contextBlock si la demande est mixte)
  const wantsNotionPassif = /notion/i.test(ut) && !wantsNotionCreate && !wantsNotionRead && !wantsNotionUpdate;
  if (wantsNotionPassif && CFG.scriptUrl) {
    try {
      const result = await fetchGoogleData('notion-search', { query: ut.replace(/notion/gi,'').trim() });
      if (result.pages?.length > 0) {
        contextBlock += `\n\n--- PAGES NOTION ---\n${result.pages.map(p=>`"${p.titre}" (${p.modifié}) → ${p.url}`).join('\n')}\nInstruction : cite ces pages naturellement dans ta réponse.`;
      }
    } catch(err) {}
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
    // Identité
    { re:/je m['']appelle ([A-ZÀ-Ÿa-zà-ÿ\-\s]+)/i,                                     key:'prenom'    },
    { re:/mon (entreprise|société|boîte) (?:s['']appelle|est) (.+)/i,                    key:'entreprise', idx:2 },
    { re:/je travaille (?:dans|chez|pour) (.+)/i,                                        key:'travail'   },
    { re:/j['']habite (?:à|en|au) (.+)/i,                                                key:'ville'     },
    { re:/mon (?:adresse )?email (?:personnel(?:le)? )?(?:est|c['']est) (.+@.+)/i,      key:'email'     },
    { re:/mon (?:numéro|tel|téléphone|portable) (?:est|c['']est) (.+)/i,                key:'tel'       },
    // Projets & objectifs
    { re:/mon projet (?:est|s['']appelle|c['']est) (.+)/i,                               key:'projet'    },
    { re:/mon objectif (?:est|c['']est|principal) (.+)/i,                                key:'objectifs' },
    { re:/je veux (?:devenir|atteindre|réussir|créer|développer|bâtir|lancer) (.+)/i,   key:'objectifs' },
    // Intérêts
    { re:/(?:j['']aime|je m['']intéresse à|ma passion|mon domaine) (?:est|c['']est|:)?\s*(.+)/i, key:'interets' },
    // Décisions — accumulées (append)
    { re:/j['']ai décidé (?:de |que )?(.+)/i,                                            key:'decisions', append:true },
    { re:/(?:ma|la) décision (?:finale |est |c['']est )[: ]*(.+)/i,                     key:'decisions', append:true },
  ];

  let changed = false;
  for (const {re, key, idx=1, append=false} of rules) {
    const m = text.match(re);
    if (m) {
      const v = m[idx].trim().slice(0, 120);
      if (v.length > 1) {
        if (append) {
          if (!Array.isArray(memory[key])) memory[key] = [];
          if (!memory[key].includes(v)) {
            memory[key].push(v);
            if (memory[key].length > 10) memory[key] = memory[key].slice(-10);
            changed = true;
          }
        } else if (memory[key] !== v) {
          memory[key] = v; changed = true;
        }
      }
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

function addCard(html) {
  const conv = document.getElementById('conversation');
  const time = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const div  = document.createElement('div');
  div.className = 'message isis';
  div.innerHTML = `<div class="avatar">I</div><div><div class="bubble" style="padding:0;background:transparent;border:none;overflow:hidden;border-radius:12px;">${html}</div><div class="timestamp">${time}</div></div>`;
  conv.appendChild(div);
  conv.scrollTop = conv.scrollHeight;
}

function renderEventCard(ev, confirmed) {
  const d = ev.debut ? new Date(ev.debut) : null;
  const dateStr = d ? d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';
  const timeStr = d ? d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '';
  const mins = parseInt(ev.rappel, 10) || 30;
  const rappelStr = mins >= 60 ? `${Math.round(mins/60)}h` : `${mins} min`;
  const finD = ev.fin ? new Date(ev.fin) : null;
  const dureeStr = (d && finD) ? ` · ${Math.round((finD-d)/60000)} min` : '';
  return `<div class="isis-card isis-card-event">
    <div class="isis-card-header">
      <span class="isis-card-icon">📅</span>
      <div style="min-width:0">
        <div class="isis-card-title">${esc(ev.titre||'Événement')}</div>
        <div class="isis-card-meta">${dateStr} · ${timeStr}${dureeStr}</div>
        <div class="isis-card-meta">⏰ Rappel ${rappelStr} avant</div>
      </div>
    </div>
    ${ev.description ? `<div class="isis-card-body">${esc(ev.description)}</div>` : ''}
    ${confirmed ? `<a class="isis-card-link" href="https://calendar.google.com/calendar/r" target="_blank" rel="noopener">Ouvrir Google Agenda →</a>` : `<div style="padding:8px 14px 10px;font-size:11px;color:var(--text-dim)">Dis "oui" pour confirmer ou "non" pour annuler.</div>`}
  </div>`;
}

function renderDocCard(doc, url) {
  const ext = url ? 'Google Docs' : '';
  return `<div class="isis-card isis-card-doc">
    <div class="isis-card-header">
      <span class="isis-card-icon">📄</span>
      <div style="min-width:0">
        <div class="isis-card-title">${esc(doc.titre||'Document')}</div>
        <div class="isis-card-meta">${ext} · ${new Date().toLocaleDateString('fr-FR')}</div>
      </div>
    </div>
    ${doc.contenu ? `<div class="isis-card-body">${esc((doc.contenu||'').substring(0,160))}…</div>` : ''}
    ${url ? `<a class="isis-card-link green" href="${url}" target="_blank" rel="noopener">Ouvrir dans Google Docs →</a>` : `<div style="padding:8px 14px 10px;font-size:11px;color:var(--text-dim)">Dis "oui" pour créer le document.</div>`}
  </div>`;
}

function renderFolderCard(nom, url) {
  return `<div class="isis-card isis-card-folder">
    <div class="isis-card-header">
      <span class="isis-card-icon">📁</span>
      <div>
        <div class="isis-card-title">${esc(nom)}</div>
        <div class="isis-card-meta">Google Drive · Dossier créé</div>
      </div>
    </div>
    <a class="isis-card-link" style="border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,.1)" href="${url}" target="_blank" rel="noopener">Ouvrir dans Google Drive →</a>
  </div>`;
}

function renderFilesCard(files, query) {
  const iconOf = t => ({
    'Google Doc':'📝','Google Sheet':'📊','Google Slides':'🎞️',
    'Google Form':'📋','PDF':'📕','Image':'🖼️','Dossier':'📁',
  }[t] || '📄');
  const items = files.slice(0,8).map(f =>
    `<a class="isis-file-item" href="${f.url}" target="_blank" rel="noopener">
      <span class="isis-file-icon">${iconOf(f.type)}</span>
      <span class="isis-file-name">${esc(f.nom)}</span>
      <span class="isis-file-badge">${esc(f.type||'')}</span>
    </a>`
  ).join('');
  const title = query ? `Résultats · "${esc(query)}"` : 'Fichiers récents';
  return `<div class="isis-card">
    <div class="isis-card-header">
      <span class="isis-card-icon">📂</span>
      <div>
        <div class="isis-card-title">${title}</div>
        <div class="isis-card-meta">Google Drive · ${files.length} fichier(s)</div>
      </div>
    </div>
    <div class="isis-file-list">${items}</div>
  </div>`;
}

function renderVerifCard(checks) {
  const rows = checks.map(({label, ok, warn, detail}) => {
    const icon  = ok ? '✅' : warn ? '⚠️' : '❌';
    const color = ok ? '#22c55e' : warn ? '#f59e0b' : '#ef4444';
    return `<div class="isis-verif-row">
      <span class="isis-verif-icon">${icon}</span>
      <span class="isis-verif-label" style="color:${color}">${esc(label)}</span>
      <span class="isis-verif-status">${esc(detail)}</span>
    </div>`;
  }).join('');
  return `<div class="isis-card isis-card-verif">
    <div class="isis-card-header">
      <span class="isis-card-icon">🔍</span>
      <div>
        <div class="isis-card-title">Diagnostic Système ISIS</div>
        <div class="isis-card-meta">${new Date().toLocaleTimeString('fr-FR')}</div>
      </div>
    </div>
    ${rows}
  </div>`;
}

function renderNotionCard(titre, url, contenu) {
  const preview = contenu ? esc(contenu.substring(0, 120)) + (contenu.length > 120 ? '…' : '') : '';
  const link = url ? `<a class="isis-card-link notion-link" href="${esc(url)}" target="_blank" rel="noopener">↗ Ouvrir dans Notion</a>` : '';
  return `<div class="isis-card isis-card-notion">
    <div class="isis-card-header">
      <span class="isis-card-icon">📝</span>
      <div>
        <div class="isis-card-title">${esc(titre)}</div>
        <div class="isis-card-meta">Notion · ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    </div>
    ${preview ? `<div class="isis-card-body" style="font-size:12px;color:var(--text-muted);padding:8px 14px;border-top:1px solid var(--border)">${preview}</div>` : ''}
    ${link}
  </div>`;
}

function renderNotionFilesCard(pages, query) {
  const items = pages.map(p => {
    const url  = p.url  || p.link || '#';
    const title= p.titre || p.title || p.nom || 'Sans titre';
    const date = p.modifié || p.modified || '';
    return `<a class="isis-file-item" href="${esc(url)}" target="_blank" rel="noopener">
      <span style="font-size:16px">📄</span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title)}</span>
      ${date ? `<span style="font-size:10px;color:var(--text-muted);flex-shrink:0">${esc(date)}</span>` : ''}
    </a>`;
  }).join('');
  return `<div class="isis-card isis-card-notion" style="padding:12px 14px">
    <div class="isis-card-header" style="margin-bottom:8px">
      <span class="isis-card-icon">📝</span>
      <div>
        <div class="isis-card-title">${pages.length} page(s) Notion${query ? ` · "${esc(query)}"` : ''}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">${items}</div>
  </div>`;
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
