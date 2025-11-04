(function () {
  function stringifySearch(params) {
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  function updateModeLinks(container) {
    const params = new URLSearchParams(location.search);
    const storedMode = (localStorage.getItem('mode') || '').toLowerCase();
    const mode = (params.get('mode') || storedMode || 'legal').toLowerCase();
    const lang = (params.get('hl') || '').toLowerCase();

    container.querySelectorAll('.lp-subtab[data-mode]').forEach((link) => {
      const target = (link.dataset.mode || '').toLowerCase();
      const url = new URL(location.href);
      if (target.length > 0) {
        url.searchParams.set('mode', target);
      } else {
        url.searchParams.delete('mode');
      }
      if (lang) {
        url.searchParams.set('hl', lang);
      } else {
        url.searchParams.delete('hl');
      }
      link.href = `${url.pathname}${stringifySearch(url.searchParams)}${url.hash}`;
      if (target === mode) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lp-subtabs').forEach(updateModeLinks);
  });
})();
