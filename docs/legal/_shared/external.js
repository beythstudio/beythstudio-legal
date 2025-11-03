export async function renderExternalDataMap(){
  const container = document.createElement('section');
  container.className = 'external-data-map';
  const main = document.getElementById('viewport');
  (main?.parentNode || document.body).appendChild(container);
  try {
    const res = await fetch('/legal/data/external-data.json', { credentials: 'same-origin' });
    const data = await res.json();
    const h2 = document.createElement('h2'); h2.textContent = 'External Data Map';
    container.appendChild(h2);
    (data.services||[]).forEach(svc=>{
      const det = document.createElement('details');
      const sum = document.createElement('summary');
      sum.textContent = `${svc.id} — ${svc.provider}`;
      det.appendChild(sum);
      const ul = document.createElement('ul');
      const liPurpose = document.createElement('li'); liPurpose.textContent = `purpose: ${svc.purpose||''}`; ul.appendChild(liPurpose);
      const liTrig = document.createElement('li'); liTrig.textContent = `triggers: ${(svc.triggers||[]).join(', ')}`; ul.appendChild(liTrig);
      const liData = document.createElement('li'); liData.textContent = `data: ${(svc.data||[]).join(', ')}`; ul.appendChild(liData);
      if (svc.optout) { const liOpt = document.createElement('li'); liOpt.textContent = `opt-out: ${svc.optout}`; ul.appendChild(liOpt);}
      det.appendChild(ul);
      container.appendChild(det);
    });
  } catch(e){ console.warn('external-data.json load failed', e); }
}

renderExternalDataMap();
