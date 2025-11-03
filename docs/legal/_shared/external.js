export async function renderExternalDataMap(){
  const container = document.createElement('section');
  container.className = 'external-data-map';
  const main = document.getElementById('viewport');
  (main?.parentNode || document.body).appendChild(container);
  async function renderFallback(){
    try{
      const r = await fetch('/legal/data/external-data.fallback.html', { credentials: 'same-origin' });
      if (!r.ok) return;
      const html = await r.text();
      container.innerHTML = html;
    }catch(e){ console.warn('fallback load failed', e); }
  }
  try {
    const res = await fetch('/legal/data/external-data.json', { credentials: 'same-origin' });
    if (!res.ok) { await renderFallback(); return; }
    const data = await res.json();
    const h2 = document.createElement('h2'); h2.textContent = 'External Data Map';
    container.appendChild(h2);
    (data.services||[]).forEach(function(svc){
      const det = document.createElement('details');
      const sum = document.createElement('summary');
      sum.textContent = (svc.id||'') + ' — ' + (svc.provider||'');
      det.appendChild(sum);
      const ul = document.createElement('ul');
      function item(label,val){ const li=document.createElement('li'); li.textContent = label+': '+val; return li; }
      ul.appendChild(item('purpose', svc.purpose||''));
      ul.appendChild(item('triggers', (svc.triggers||[]).join(', ')));
      ul.appendChild(item('data', (svc.data||[]).join(', ')));
      if (svc.optout) ul.appendChild(item('opt-out', svc.optout));
      det.appendChild(ul);
      container.appendChild(det);
    });
  } catch(e){ console.warn('external-data.json load failed', e); await renderFallback(); }
}

renderExternalDataMap();
