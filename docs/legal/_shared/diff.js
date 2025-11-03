export async function applyDiffHighlight(slug, version){
  if (!version || version === 'latest') return;
  try{
    const res = await fetch('/legal/diffs/' + version + '.json', { credentials: 'same-origin' });
    if (!res.ok) return;
    const json = await res.json();
    const ids = (json.highlight||[]);
    const all = document.querySelectorAll('[data-u]');
    for (var i=0;i<all.length;i++){
      var el = all[i];
      var id = el.getAttribute('data-u');
      for (var j=0;j<ids.length;j++){
        if (ids[j] === id){ el.classList.add('prism-diff'); break; }
      }
    }
  }catch(e){ console.warn('diff highlight failed', e); }
}
