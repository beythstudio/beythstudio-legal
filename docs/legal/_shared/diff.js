export async function applyDiffHighlight(slug, version){
  if (!version || version === 'latest') return;
  try{
    const res = await fetch('/legal/diffs/' + version + '.json', { credentials: 'same-origin' });
    if (!res.ok) return;
    const json = await res.json();
    const ids = (json.highlight||[]);
    for (var i=0;i<ids.length;i++){
      var id = ids[i];
      var el = document.querySelector('[data-u]');
      // placeholder: selector will be refined later
    }
  }catch(e){ console.warn('diff highlight failed', e); }
}
