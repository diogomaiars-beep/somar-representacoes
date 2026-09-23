const categories=[['Todos','▦'],['Cama, Mesa e Banho','🛏️'],['Brinquedos','🧸'],['Utilidades','🏠'],['Material Escolar','📚'],['Festas','🎉'],['Natal','🎄'],['Sazonais','☀️']];
let active='Todos', catalogs=[];
const client=supabase.createClient(window.SOMAR_CONFIG.SUPABASE_URL,window.SOMAR_CONFIG.SUPABASE_ANON_KEY);

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function js(v){return JSON.stringify(String(v??''))}
function renderCats(){document.getElementById('cats').innerHTML=categories.map(x=>`<button class="cat ${x[0]===active?'active':''}" onclick='selectCat(${js(x[0])})'>${x[1]} ${esc(x[0])}</button>`).join('')}
function selectCat(x){active=x;renderCats();render();document.getElementById('title').textContent=x==='Todos'?'Catálogos':x}
function render(){
 const q=document.getElementById('search').value.toLowerCase().trim();
 const list=catalogs.filter(c=>(active==='Todos'||c.category===active)&&(!q||`${c.name} ${c.brand} ${c.category} ${c.description||''}`.toLowerCase().includes(q)));
 document.getElementById('count').textContent=list.length;
 document.getElementById('grid').innerHTML=list.length?list.map(c=>{
   const cover=c.cover_url?`<img src="${esc(c.cover_url)}" alt="Capa de ${esc(c.name)}" loading="lazy">`:`<div class="mark">${esc((c.brand||'S')[0].toUpperCase())}</div>`;
   return `<article class="card"><button class="card-main" onclick='openCatalog(${js(c.id)})'><div class="cover">${cover}<span class="tag">${esc(c.category)}</span></div><div class="body"><div class="brand-name">${esc(c.brand||'Somar Representações')}</div><h3>${esc(c.name)}</h3><p>${esc(c.description||'Consulte o catálogo de produtos.')}</p></div></button><div class="card-actions"><button class="btn primary" onclick='openCatalog(${js(c.id)})'>Ver catálogo</button><button class="btn" onclick='shareCatalogById(${js(c.id)})'>Compartilhar</button></div></article>`;
 }).join(''):'<div class="empty"><strong>Nenhum catálogo encontrado.</strong><span>Tente outra busca ou selecione “Todos”.</span></div>';
}
function getCatalog(id){return catalogs.find(c=>String(c.id)===String(id))}
function openCatalog(id){
 const c=getCatalog(id); if(!c)return;
 const cover=c.cover_url?`<img src="${esc(c.cover_url)}" alt="Capa de ${esc(c.name)}">`:`<div class="detail-mark">${esc((c.brand||'S')[0].toUpperCase())}</div>`;
 const url=esc(c.pdf_url||'#');
 document.getElementById('modal').innerHTML=`<div class="modal-backdrop" onclick="closeCatalog(event)"><div class="modal" onclick="event.stopPropagation()"><button class="close" onclick="closeCatalog()" aria-label="Fechar">×</button><div class="detail-cover">${cover}</div><div class="detail-content"><span class="detail-tag">${esc(c.category)}</span><div class="detail-brand">${esc(c.brand||'Somar Representações')}</div><h2>${esc(c.name)}</h2><p>${esc(c.description||'Consulte o catálogo de produtos da Somar Representações.')}</p><div class="detail-actions"><a class="btn primary big" href="${url}" target="_blank" rel="noopener">👁️ Ver catálogo</a><a class="btn big" href="${url}${url.includes('?')?'&':'?'}download=true">⬇️ Baixar PDF</a><button class="btn big" onclick='shareCatalogById(${js(c.id)})'>📲 Compartilhar</button></div></div></div></div>`;
 document.getElementById('modal').classList.add('open'); document.body.classList.add('modal-open');
}
function closeCatalog(e){if(e&&e.target!==e.currentTarget)return;document.getElementById('modal').classList.remove('open');document.body.classList.remove('modal-open')}
async function shareCatalogById(id){
 const c=getCatalog(id); if(!c)return;
 const url=c.pdf_url||''; const text=`Olá! Segue o catálogo ${c.name} da Somar Representações.${url?' '+url:''}`;
 if(navigator.share){try{await navigator.share({title:c.name,text,url:url||location.href});return}catch(e){}}
 window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener');
}
async function loadCatalogs(){
 document.getElementById('status').textContent='Carregando catálogos...';
 const {data,error}=await client.from('catalogs').select('*').eq('published',true).order('created_at',{ascending:false});
 if(error){console.error(error);document.getElementById('status').textContent='Não foi possível carregar os catálogos agora.';return}
 catalogs=data||[];document.getElementById('status').textContent='';render();
}
function focusSearch(){document.getElementById('search').focus();document.getElementById('search').scrollIntoView({behavior:'smooth',block:'center'})}
document.getElementById('search').addEventListener('input',render);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCatalog()});
renderCats();loadCatalogs();
