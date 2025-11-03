(function () {
  const $viewport = document.getElementById('viewport');
  const $banner = document.getElementById('banner');
  const qs = new URLSearchParams(location.search);
  const hash = location.hash || '';

  // --- \u8a2d\u5b9a\u6c7a\u5b9a
  const pathParts = location.pathname.replace(/\/+$/, '').split('/');
  // /legal/<slug>/ \u2192 slug \u62bd\u51fa
  const slug = pathParts[pathParts.length - 1] || 'privacy';
  const mode = (qs.get('mode') || localStorage.getItem('mode') || 'legal').toLowerCase();
  const hlPref = (qs.get('hl') || localStorage.getItem('hl') || '').toLowerCase();
  const guessLang = ((navigator.languages || [navigator.language || ''])[0] || '').toLowerCase().startsWith('ja') ? 'ja' : 'en';
  const hl = (hlPref === 'ja' || hlPref === 'en') ? hlPref : guessLang;
  const v = (qs.get('v') || '').trim();

  localStorage.setItem('hl', hl);
  localStorage.setItem('mode', mode);

  // --- HUD\u8868\u793a\u66f4\u65b0
  function hydrateHud() {
    // \u30e2\u30fc\u30c9
    document.querySelectorAll('#modeSeg a[role="button"]').forEach(a => {
      const m = a.dataset.mode;
      setPressed(a, m === mode);
      a.href = buildSelfURL({ mode: m });
    });
    // \u8a00\u8a9e
    document.querySelectorAll('#langSeg a[role="button"]').forEach(a => {
      const L = a.dataset.hl;
      setPressed(a, L === hl);
      a.href = buildSelfURL({ hl: L });
    });
    // \u30d0\u30fc\u30b8\u30e7\u30f3
    initVersions();
  }

  function setPressed(el, on) {
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function buildSelfURL(overrides = {}) {
    const u = new URL(location.href);
    const p = u.searchParams;
    if (overrides.mode) p.set('mode', overrides.mode);
    if (overrides.hl) p.set('hl', overrides.hl);
    if (v) p.set('v', v); else p.delete('v');
    u.search = p.toString();
    u.hash = hash;
    return u.pathname + u.search + u.hash;
  }

  function banner(msg) {
    $banner.textContent = msg;
    $banner.hidden = false;
  }

  // --- iframe \u9ad8\u3055\u81ea\u52d5
  function autoHeight(ifr) {
    function set() {
      try {
        const d = ifr.contentDocument;
        if (!d) return;
        const h = Math.max(
          d.documentElement.scrollHeight,
          d.body ? d.body.scrollHeight : 0
        );
        // \u6700\u4f4e 60vh \u306f\u78ba\u4fdd\uff08iOS\u306e\u8a08\u6e2c\u4e0d\u767a\u306e\u4fdd\u967a\uff09
        const min = Math.max(window.innerHeight * 0.6, 320);
        ifr.style.height = Math.max(h, min) + 'px';
      } catch (e) { /* cross-origin \u4fdd\u967a\uff08\u8d77\u304d\u306a\u3044\u60f3\u5b9a\uff09 */ }
    }
    ifr.addEventListener('load', () => {
      set();
      try {
        const d = ifr.contentDocument;
        if (d) {
          const ro = new ResizeObserver(set);
          ro.observe(d.documentElement);
          if (d.body) ro.observe(d.body);
          d.addEventListener('transitionend', set, { passive: true });
        }
      } catch {}
      // Safari \u4fdd\u967a\uff1a\u3086\u308b\u30dd\u30fc\u30ea\u30f3\u30b0
      let ticks = 0;
      const t = setInterval(() => {
        if (ticks++ > 20) return clearInterval(t);
        set();
      }, 300);
    }, { once: true });
  }

  // --- Compare \u540c\u671f
  function syncFrames(a, b) {
    // \u53ef\u80fd\u306a\u3089 Universal-ID\u3001\u7121\u3051\u308c\u3070\u6bd4\u7387\u540c\u671f\u3078\u30d5\u30a9\u30fc\u30eb\u30d0\u30c3\u30af
    function mapByU(doc) {
      return Array.from(doc.querySelectorAll('[data-u]'))
        .reduce((m, el) => { m[el.dataset.u] = el; return m; }, {});
    }
    function tryUniversal() {
      try {
        const LA = mapByU(a.contentDocument);
        const LB = mapByU(b.contentDocument);
        const ok = Object.keys(LA).length && Object.keys(LB).length;
        if (!ok) return false;

        let lock = false;
        const io = new IntersectionObserver(ents => {
          if (lock) return;
          const vis = ents.filter(e => e.isIntersecting)
                          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0];
          if (!vis) return;
          const id = vis.target.dataset.u;
          const mate = LB[id];
          if (mate) {
            lock = true;
            mate.scrollIntoView({ block: 'start', behavior: 'auto' });
            requestAnimationFrame(() => lock = false);
          }
        }, { root: a.contentDocument.scrollingElement, threshold: [0.1, 0.5] });
        Object.values(LA).forEach(el => io.observe(el));

        // \u9006\u65b9\u5411
        let lock2 = false;
        const io2 = new IntersectionObserver(ents => {
          if (lock2) return;
          const vis = ents.filter(e => e.isIntersecting)
                          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0];
          if (!vis) return;
          const id = vis.target.dataset.u;
          const mate = LA[id];
          if (mate) {
            lock2 = true;
            mate.scrollIntoView({ block: 'start', behavior: 'auto' });
            requestAnimationFrame(() => lock2 = false);
          }
        }, { root: b.contentDocument.scrollingElement, threshold: [0.1, 0.5] });
        Object.values(LB).forEach(el => io2.observe(el));
        return true;
      } catch { return false; }
    }

    function ratioSync() {
      let guard = false;
      function bind(src, dst) {
        src.contentWindow.addEventListener('scroll', () => {
          if (guard) return;
          try {
            const sdoc = src.contentDocument;
            const ddoc = dst.contentDocument;
            const se = sdoc.scrollingElement || sdoc.documentElement;
            const de = ddoc.scrollingElement || ddoc.documentElement;
            const ratio = se.scrollTop / (se.scrollHeight - src.clientHeight);
            guard = true;
            de.scrollTop = ratio * (de.scrollHeight - dst.clientHeight);
            requestAnimationFrame(() => { guard = false; });
          } catch {}
        }, { passive: true });
      }
      bind(a, b);
      bind(b, a);
    }

    // \u3069\u3061\u3089\u306e\u30d5\u30ec\u30fc\u30e0\u3082 load \u6e08\u307f\u3067\u547c\u3076\u3053\u3068
    if (!tryUniversal()) ratioSync();

    // \u30cf\u30c3\u30b7\u30e5\u9023\u52d5\uff08#u-... \u306a\u3069\uff09
    [a, b].forEach((ifr, idx, arr) => {
      const other = arr[1 - idx];
      function jumpToHash() {
        try {
          const h = ifr.contentWindow.location.hash;
          if (!h) return;
          const el = other.contentDocument.querySelector(h + ', [data-u="' + h.replace(/^#u-/, '') + '"]');
          if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' });
        } catch {}
      }
      ifr.contentWindow.addEventListener('hashchange', jumpToHash);
      ifr.contentDocument && ifr.contentDocument.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        if (a) setTimeout(jumpToHash, 0);
      });
    });
  }

  // --- \u753b\u9762\u751f\u6210
  function srcOf(lang) {
    const u = new URL(`/legal/${lang}/${slug}/`, location.origin);
    if (v) u.searchParams.set('v', v);
    u.hash = hash;
    return u.toString();
  }

  function mountSingle(lang) {
    $viewport.innerHTML = '';
    const ifr = document.createElement('iframe');
    ifr.setAttribute('title', `${slug} (${lang})`);
    ifr.loading = 'eager';
    ifr.src = srcOf(lang);
    ifr.className = 'prism-frame';
    autoHeight(ifr);
    $viewport.appendChild(ifr);
  }

  function mountCompare() {
    $viewport.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'compare';

    const left = document.createElement('div'); left.className = 'pane left';
    const right = document.createElement('div'); right.className = 'pane right';

    const jaFirst = hl === 'ja';
    const ifrA = document.createElement('iframe');
    const ifrB = document.createElement('iframe');
    ifrA.className = ifrB.className = 'prism-frame';
    ifrA.src = srcOf(jaFirst ? 'ja' : 'en');
    ifrB.src = srcOf(jaFirst ? 'en' : 'ja');
    ifrA.title = `Left (${jaFirst ? 'ja' : 'en'})`;
    ifrB.title = `Right (${jaFirst ? 'en' : 'ja'})`;

    [ifrA, ifrB].forEach(autoHeight);
    left.appendChild(ifrA); right.appendChild(ifrB);
    wrap.append(left, right);
    $viewport.appendChild(wrap);

    // \u4e21\u65b9 load \u5f8c\u306b\u540c\u671f\u5f3e\u304f
    let loaded = 0;
    function ready() {
      if (++loaded === 2) syncFrames(ifrA, ifrB);
    }
    ifrA.addEventListener('load', ready, { once: true });
    ifrB.addEventListener('load', ready, { once: true });
  }

  async function init() {
    hydrateHud();
    try {
      if (mode === 'compare') mountCompare();
      else mountSingle(hl);
    } catch (e) {
      console.error(e);
      banner('\u8868\u793a\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u8a00\u8a9e\u30da\u30fc\u30b8\u3078\u76f4\u63a5\u30a2\u30af\u30bb\u30b9\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
    }
  }

  // --- Version \u30bb\u30ec\u30af\u30c8
  async function initVersions() {
    const sel = document.getElementById('ver');
    sel.innerHTML = '';
    try {
      const res = await fetch('../data/versions.json', { cache: 'no-store' });
      if (!res.ok) throw 0;
      const arr = await res.json();
      if (!Array.isArray(arr) || !arr.length) throw 0;

      for (const ver of arr) {
        const opt = document.createElement('option');
        opt.value = ver; opt.textContent = ver;
        if (v && v === ver) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.disabled = false;
      sel.addEventListener('change', () => {
        const u = new URL(location.href);
        if (sel.value) u.searchParams.set('v', sel.value);
        else u.searchParams.delete('v');
        location.href = u.pathname + u.search + u.hash;
      });
      return;
    } catch {
      sel.disabled = true;
      const opt = document.createElement('option');
      opt.textContent = 'No versions';
      sel.appendChild(opt);
    }
  }

  init();
})();
