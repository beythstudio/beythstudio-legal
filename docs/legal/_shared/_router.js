const qs = new URLSearchParams(location.search);
const hlPref = (qs.get('hl') || localStorage.getItem('hl') || '').toLowerCase();
const langGuess = (((navigator.languages||[navigator.language||''])[0]||'').toLowerCase().startsWith('ja') ? 'ja' : 'en');
const hl = (hlPref || langGuess);
const mode = (qs.get('mode') || localStorage.getItem('mode') || 'legal').toLowerCase();
localStorage.setItem('hl', hl);
localStorage.setItem('mode', mode);

// derive slug from /legal/<slug>/ path
function currentSlug(){
  const parts = location.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('legal');
  if (i>=0 && parts[i+1]) return parts[i+1];
  return 'privacy';
}
const slug = currentSlug();

const src = (lang) => `/legal/${lang}/${slug}/index.html`;// expected localized document
const $viewport = document.getElementById('viewport');

async function loadDoc(lang) {
  try {
    const res = await fetch(src(lang), { credentials: 'same-origin' });
    if (!res.ok) throw new Error('fetch failed: '+res.status);
    const html = await res.text();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const article = tpl.content.querySelector('article,[data-prism-article]');
    return article || tpl.content;
  } catch (e) {
    // graceful fallback: link to old tonight pages if present
    const wrap = document.createElement('section');
    wrap.innerHTML = `<p>Failed to load localized content. Open legacy pages: 
      <a href="/${slug}/tonight/">${slug}/tonight</a>
    </p>`;
    return wrap;
  }
}

function mountSingle(article, lang) {
  if (article.setAttribute) article.setAttribute('lang', lang);
  $viewport.innerHTML = '';
  $viewport.appendChild(article);
}

async function mountCompare() {
  const alt = (hl==='ja'? 'en':'ja');
  const [a, b] = await Promise.all([loadDoc(hl), loadDoc(alt)]);
  if (a.setAttribute) a.setAttribute('lang', hl);
  if (b.setAttribute) b.setAttribute('lang', alt);
  const wrap = document.createElement('div');
  wrap.className = 'compare';
  const left = document.createElement('div'); left.className='pane left'; left.appendChild(a);
  const right= document.createElement('div'); right.className='pane right'; right.appendChild(b);
  wrap.append(left,right);
  $viewport.innerHTML=''; $viewport.appendChild(wrap);
  const mod = await import('./compare.js');
  mod.syncByUniversalId(left, right);
}

(async function init(){
  try {
    if (mode === 'compare') await mountCompare();
    else mountSingle(await loadDoc(hl), hl);
  } catch (e) {
    console.error(e);
    $viewport.innerHTML = `<p>Failed to load document for slug: ${slug}.` +
      ` Open: <a href="/legal/ja/${slug}/">JA</a> / <a href="/legal/en/${slug}/">EN</a></p>`;
  }
})();
