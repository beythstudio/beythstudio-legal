(function () {
  const qs = new URLSearchParams(location.search);
  const preferredLang = (qs.get('hl') || localStorage.getItem('hl') || '').toLowerCase();
  const browserGuess = (((navigator.languages || [navigator.language || ''])[0] || '')
    .toLowerCase()
    .startsWith('ja')
      ? 'ja'
      : 'en');
  const hl = preferredLang === 'ja' || preferredLang === 'en' ? preferredLang : browserGuess;
  localStorage.setItem('hl', hl);

  function currentSlug() {
    const parts = location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('legal');
    if (idx >= 0 && parts[idx + 1]) {
      return parts[idx + 1];
    }
    return 'privacy';
  }

  const slug = currentSlug();
  const $viewport = document.getElementById('viewport');

  function buildSelfURL(lang) {
    const url = new URL(location.href);
    if (lang) {
      url.searchParams.set('hl', lang);
    } else {
      url.searchParams.delete('hl');
    }
    url.searchParams.delete('mode'); // legacy cleanup
    const search = url.searchParams.toString();
    return `${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
  }

  function refreshLangButtons() {
    document.querySelectorAll('#langSeg a[role="button"]').forEach((link) => {
      const target = (link.dataset.hl || '').toLowerCase();
      link.setAttribute('aria-pressed', target === hl ? 'true' : 'false');
      link.href = buildSelfURL(target);
    });
  }

  function srcOf(lang) {
    return `/legal/${lang}/${slug}/`;
  }

  async function tryLegacy() {
    const fallbackMap = {
      privacy: '/privacy/tonight/',
      terms: '/terms/tonight/',
      'tokusho': '/tokusho/tonight/',
      'outbound-data': '/external-data-policy/tonight/',
    };
    const path = fallbackMap[slug];
    if (!path) return null;
    try {
      const res = await fetch(path, { credentials: 'same-origin' });
      if (!res.ok) return null;
      const html = await res.text();
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      const article = tpl.content.querySelector('article,[data-prism-article]');
      return article || tpl.content;
    } catch (_) {
      return null;
    }
  }

  async function loadDoc(lang) {
    try {
      const res = await fetch(srcOf(lang), { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const html = await res.text();
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      const article = tpl.content.querySelector('article,[data-prism-article]');
      return article || tpl.content;
    } catch (error) {
      const legacy = await tryLegacy();
      if (legacy) return legacy;
      const wrap = document.createElement('section');
      wrap.innerHTML = `<p role="alert" style="padding:12px;border:1px solid #f99;background:#fff0f0">Failed to load content. Open JA/EN: <a href="/legal/ja/${slug}/">JA</a> / <a href="/legal/en/${slug}/">EN</a></p>`;
      return wrap;
    }
  }

  function mountArticle(fragment, lang) {
    if (!$viewport) return;
    $viewport.innerHTML = '';
    if (fragment.setAttribute) {
      fragment.setAttribute('lang', lang);
    }
    $viewport.appendChild(fragment);
  }

  async function render() {
    try {
      const article = await loadDoc(hl);
      mountArticle(article, hl);
    } catch (error) {
      console.error(error);
      if ($viewport) {
        $viewport.innerHTML = `<p role="alert">Failed to load document for slug: ${slug}. Open: <a href="/legal/ja/${slug}/">JA</a> / <a href="/legal/en/${slug}/">EN</a></p>`;
      }
    }
  }

  refreshLangButtons();
  render();
})();
