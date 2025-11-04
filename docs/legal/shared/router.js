(function () {
  const $viewport = document.getElementById('viewport');
  const qs = new URLSearchParams(location.search);
  const hash = location.hash || '';

  // /legal/<slug>/ から slug を推定
  const pathParts = location.pathname.replace(/\/+$/, '').split('/');
  const slug = pathParts[pathParts.length - 1] || 'privacy';

  // 言語決定（ja/en のみ）
  const hlPref = (qs.get('hl') || localStorage.getItem('hl') || '').toLowerCase();
  const guess = ((navigator.languages || [navigator.language || ''])[0] | '| '').toLowerCase().startsWith('ja') ? 'ja' : 'en';
  const hl = (hlPref === 'ja' || hlPref === 'en') ? hlPref : guess;
  localStorage.setItem('hl', hl);

  // HUDの押下状態＆リンク
  function setPressed(el, on){ el.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function buildSelfURL(newHl){
    const u = new URL(location.href);
    if (newHl) u.searchParams.set('hl', newHl);
    else u.searchParams.delete('hl');
    u.hash = hash;
    return u.pathname + '?' + u.searchParams.toString() + u.hash;
  }
  document.querySelectorAll('#langSeg a[role="button"]').forEach(a=>{
    const L = a.dataset.hl;
    setPressed(a, L === hl);
    a.href = buildSelfURL(L);
  });

  // iFrame高さ＆本文CSS注入
  function ensureReaderCSS(doc){
    if (doc && !doc.getElementById('__prism_reader_css__')) {
      const link = doc.createElement('link');
      link.id='__prism_reader_css__'; link.rel='stylesheet'; link.href='/legal/shared/reader.css';
      doc.head.appendChild(link);
    }
  }
  function autoHeight(ifr){
    function set(){
      try{
        const d = ifr.contentDocument; if (!d) return;
        const h = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0);
        const min = Math.max(window.innerHeight * 0.6, 320);
        ifr.style.height = Math.max(h, min) + 'px';
      } catch {}
    }
    ifr.addEventListener('load', ()=>{
      try{ ensureReaderCSS(ifr.contentDocument); }catch{}
      set();
      try{
        const d = ifr.contentDocument;
        if (d) {  const ro = new ResizeObserver(set);
          ro.observe(d.documentElement); if (d.body) ro.observe(d.body);
        }
      }catch{}
      let t=0; const iv=setInterval(()=>{ if(t++>20) return clearInterval(iv); set(); },300);
    }, { once:true });
  }

  function srcOf(lang){
    const u = new URL(`/legal/${lang}/${slug}/`, location.origin);
    u.hash = hash; return u.toString();
  }

  // 単言語のみ表示
  function mount(){
    $viewport.innerHTML = '';
    const ifr = document.createElement('iframe');
    ifr.className='prism-frame'; ifr.title=`${slug} (${hl})`; ifr.loading='eager';
    ifr.src = srcOf(hl);
    autoHeight(ifr);
    $viewport.appendChild(ifr);
  }

  mount();
})();
