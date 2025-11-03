const $ver = document.getElementById('ver');
const $hud = document.querySelector('.prism-hud');

function setAriaPressed(groupSelector, activeAttr, activeValue){
  const btns = $hud.querySelectorAll(groupSelector);
  btns.forEach(b=>{
    const val = b.getAttribute(activeAttr);
    b.setAttribute('aria-pressed', String(val===activeValue));
  });
}

async function initVersions() {
  try {
    const res = await fetch('/legal/versions.json', { credentials: 'same-origin' });
    const all = await res.json();
    const slug = (location.pathname.split('/').filter(Boolean).pop()||'privacy');
    const meta = all[slug] || { latest: 'latest', versions: [] };
    $ver.innerHTML = '';
    for (const v of (meta.versions||[])) {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      $ver.appendChild(opt);
    }
    const qs = new URLSearchParams(location.search);
    const cur = qs.get('v') || meta.latest;
    if (cur && meta.versions && meta.versions.includes(cur)) $ver.value = cur;
    $ver.addEventListener('change', ()=>{
      const s = new URLSearchParams(location.search);
      s.set('v', $ver.value);
      location.search = s.toString();
    });
  } catch(e) { console.warn('versions.json load failed', e); }
}

function wireHudToggles() {
  const qs = new URLSearchParams(location.search);
  const mode = (qs.get('mode')||'legal');
  const hl = (qs.get('hl')||'ja');
  setAriaPressed('[data-mode]', 'data-mode', mode);
  setAriaPressed('[data-hl]', 'data-hl', hl);

  $hud?.addEventListener('click', (ev)=>{
    const t = ev.target;
    if (t.matches('[data-mode]')) {
      const mode = t.getAttribute('data-mode');
      const s = new URLSearchParams(location.search);
      s.set('mode', mode);
      location.search = s.toString();
    }
    if (t.matches('[data-hl]')) {
      const lang = t.getAttribute('data-hl');
      const s = new URLSearchParams(location.search);
      s.set('hl', lang);
      location.search = s.toString();
    }
  });
}

export function bootHudEnhancements(){
  initVersions();
  wireHudToggles();
}
