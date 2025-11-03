export function applyPlainMode(root){
  const src = root.querySelector('article,[data-prism-article]') || root;
  const out = document.createElement('article');
  out.setAttribute('data-prism-article','');
  const headings = src.querySelectorAll('h1,h2,h3');
  if (headings.length===0){ root.classList.add('plain'); return; }
  headings.forEach(h=>{
    out.appendChild(h.cloneNode(true));
    let p = h.nextElementSibling;
    while(p && p.tagName.toLowerCase()==='div'){ p=p.nextElementSibling; }
    if (p && p.tagName.toLowerCase()==='p'){ out.appendChild(p.cloneNode(true)); }
  });
  root.innerHTML='';
  root.appendChild(out);
}
