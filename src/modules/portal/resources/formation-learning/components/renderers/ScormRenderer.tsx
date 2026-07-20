import type { CourseContent } from '../../lib/types';

// ── SCORM inline demo (mock) ──────────────────────────────────────────────────
const SCORM_SRCDOC = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Module SCORM</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;height:100vh;display:flex;flex-direction:column}
  header{background:#1e293b;padding:16px 24px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #334155}
  .logo{background:#3b82f6;color:#fff;border-radius:8px;padding:6px 12px;font-weight:700;font-size:14px}
  .progress-bar{flex:1;height:8px;background:#334155;border-radius:4px;overflow:hidden}
  .progress-fill{height:100%;background:#3b82f6;transition:width .4s ease;border-radius:4px}
  main{flex:1;padding:32px;display:flex;flex-direction:column;gap:24px;overflow:auto}
  .slide{display:none;flex-direction:column;gap:20px;animation:fade .3s ease}
  .slide.active{display:flex}
  @keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  h1{font-size:1.6rem;font-weight:700;color:#f1f5f9}
  h2{font-size:1.2rem;font-weight:600;color:#94a3b8}
  p{line-height:1.7;color:#cbd5e1}
  .card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
  .card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px}
  .card .icon{font-size:2rem;margin-bottom:8px}
  .card h3{font-size:1rem;font-weight:600;margin-bottom:4px}
  .card p{font-size:.875rem;color:#94a3b8}
  .quiz-options{display:flex;flex-direction:column;gap:10px}
  .quiz-option{padding:14px 18px;background:#1e293b;border:2px solid #334155;border-radius:10px;cursor:pointer;transition:all .2s;text-align:left;color:#e2e8f0;font-size:.95rem}
  .quiz-option:hover{border-color:#3b82f6;background:#1e3a5f}
  .quiz-option.correct{border-color:#22c55e;background:#052e16;color:#86efac}
  .quiz-option.wrong{border-color:#ef4444;background:#2d0b0b;color:#fca5a5}
  .feedback{padding:14px;border-radius:10px;font-size:.9rem;font-weight:500}
  .feedback.ok{background:#052e16;color:#86efac;border:1px solid #22c55e}
  .feedback.ko{background:#2d0b0b;color:#fca5a5;border:1px solid #ef4444}
  footer{padding:16px 24px;background:#1e293b;border-top:1px solid #334155;display:flex;justify-content:space-between;align-items:center}
  .btn{padding:10px 24px;border:none;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer;transition:opacity .2s}
  .btn-primary{background:#3b82f6;color:#fff}
  .btn-primary:hover{opacity:.85}
  .btn-ghost{background:#334155;color:#e2e8f0}
  .btn-ghost:hover{opacity:.85}
  .step-text{font-size:.85rem;color:#94a3b8}
  .badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:.8rem;font-weight:600}
  .badge-blue{background:#1e3a5f;color:#93c5fd;border:1px solid #2563eb}
  .result-circle{width:120px;height:120px;border-radius:50%;border:6px solid #22c55e;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto}
  .result-circle .score{font-size:2rem;font-weight:700;color:#22c55e}
  .result-circle .label{font-size:.7rem;color:#86efac}
</style>
</head>
<body>
<header>
  <div class="logo">SCORM</div>
  <div style="font-weight:600;font-size:.95rem">Introduction à TypeScript</div>
  <div class="progress-bar" style="margin-left:auto;max-width:200px"><div class="progress-fill" id="pbar" style="width:0%"></div></div>
  <span id="ptext" class="step-text" style="margin-left:8px">0%</span>
</header>
<main>
  <div class="slide active" id="s0">
    <h1>Introduction à TypeScript</h1>
    <span class="badge badge-blue">Module 1 · 4 diapositives</span>
    <p>TypeScript est un surensemble typé de JavaScript développé par Microsoft. Il ajoute la vérification de types statiques au langage JavaScript, permettant de détecter les erreurs avant l'exécution.</p>
    <div class="card-grid">
      <div class="card"><div class="icon">🔍</div><h3>Typage statique</h3><p>Détecte les erreurs à la compilation</p></div>
      <div class="card"><div class="icon">🔧</div><h3>IDE support</h3><p>Autocomplétion et refactoring avancés</p></div>
      <div class="card"><div class="icon">♻️</div><h3>Compatibilité</h3><p>Compile vers n'importe quelle version JS</p></div>
    </div>
  </div>
  <div class="slide" id="s1">
    <h1>Les Types de Base</h1>
    <p>TypeScript offre plusieurs types primitifs :</p>
    <div class="card-grid">
      <div class="card"><h3>string</h3><p>Chaînes de caractères</p></div>
      <div class="card"><h3>number</h3><p>Nombres entiers et décimaux</p></div>
      <div class="card"><h3>boolean</h3><p>true / false</p></div>
      <div class="card"><h3>any</h3><p>Désactive le typage (à éviter)</p></div>
      <div class="card"><h3>unknown</h3><p>Typage sûr pour l'inconnu</p></div>
      <div class="card"><h3>void</h3><p>Absence de valeur de retour</p></div>
    </div>
  </div>
  <div class="slide" id="s2">
    <h1>Interfaces &amp; Types</h1>
    <p>Les interfaces permettent de décrire la forme des objets :</p>
    <pre style="background:#0f172a;padding:20px;border-radius:10px;border:1px solid #334155;font-size:.85rem;color:#7dd3fc;overflow:auto">
interface User {
  id: number;
  name: string;
  email?: string; // optionnel
}

type Status = 'active' | 'inactive' | 'pending';

const user: User = { id: 1, name: 'Alice' };
const status: Status = 'active';</pre>
  </div>
  <div class="slide" id="s3">
    <h1>Quiz de validation</h1>
    <h2>Quel type TypeScript indique l'absence de valeur de retour ?</h2>
    <div class="quiz-options" id="opts">
      <button class="quiz-option" onclick="answer(this,'wrong')">any</button>
      <button class="quiz-option" onclick="answer(this,'wrong')">null</button>
      <button class="quiz-option" onclick="answer(this,'correct')">void</button>
      <button class="quiz-option" onclick="answer(this,'wrong')">undefined</button>
    </div>
    <div id="fb" style="display:none"></div>
  </div>
</main>
<footer>
  <button class="btn btn-ghost" id="prevBtn" onclick="go(-1)" style="visibility:hidden">← Précédent</button>
  <span class="step-text" id="stepText">Diapositive 1 / 4</span>
  <button class="btn btn-primary" id="nextBtn" onclick="go(1)">Suivant →</button>
</footer>
<script>
  var cur=0,tot=4,answered=false;
  function upd(){
    document.querySelectorAll('.slide').forEach(function(s,i){s.classList.toggle('active',i===cur)});
    document.getElementById('prevBtn').style.visibility=cur===0?'hidden':'visible';
    document.getElementById('nextBtn').textContent=cur===tot-1?'Terminer':'Suivant →';
    document.getElementById('stepText').textContent='Diapositive '+(cur+1)+' / '+tot;
    var p=Math.round((cur/(tot-1))*100);
    document.getElementById('pbar').style.width=p+'%';
    document.getElementById('ptext').textContent=p+'%';
  }
  function go(d){
    if(cur===tot-1&&d===1){alert('Module terminé ! Score: 100%');return;}
    if(cur+d>=0&&cur+d<tot){cur+=d;answered=false;upd();}
  }
  function answer(el,res){
    if(answered)return;answered=true;
    document.querySelectorAll('.quiz-option').forEach(function(o){o.disabled=true});
    el.classList.add(res);
    var fb=document.getElementById('fb');
    fb.style.display='block';
    fb.className='feedback '+(res==='correct'?'ok':'ko');
    fb.textContent=res==='correct'?" Bonne réponse ! void indique qu'une fonction ne retourne rien.":'❌ Incorrect. La bonne réponse est void.';
  }
  upd();
</script>
</body>
</html>`;

export default function ScormRenderer({ content }: { content: CourseContent }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="text-(--color-primary) border px-2 py-0.5 rounded-full font-medium">
          SCORM 2004
        </span>
        <span>{content.title}</span>
      </div>
      <iframe
        srcDoc={SCORM_SRCDOC}
        className="w-full rounded-xl border border-slate-600 bg-slate-900"
        style={{ height: '560px' }}
        title={content.title}
        sandbox="allow-scripts"
      />
    </div>
  );
}
