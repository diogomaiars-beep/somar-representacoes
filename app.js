const categories=[['Todos','▦'],['Cama, Mesa e Banho','🛏️'],['Brinquedos','🧸'],['Utilidades','🏠'],['Material Escolar','📚'],['Festas','🎉'],['Natal','🎄'],['Sazonais','☀️']];
let active='Todos', catalogs=[];
const client=supabase.createClient(window.SOMAR_CONFIG.SUPABASE_URL,window.SOMAR_CONFIG.SUPABASE_ANON_KEY);

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function renderCats(){document.getElementById('cats').innerHTML=categories.map(x=>`<button class="cat ${x[0]===active?'active':''}" onclick="selectCat('${x[0]}')">${x[1]} ${x[0]}</button>`).join('')}
function selectCat(x){active=x;renderCats();render();document.getElementById('title').textContent=x==='Todos'?'Catálogos':x}
function render(){
 const q=document.getElementById('search').value.toLowerCase().trim();
 const list=catalogs.filter(c=>(active==='Todos'||c.category===active)&&(!q||`${c.name} ${c.brand} ${c.category} ${c.description||''}`.toLowerCase().includes(q)));
 document.getElementById('count').textContent=list.length;
 document.getElementById('grid').innerHTML=list.length?list.map(c=>{
   const cover=c.cover_url?`<img src="${esc(c.cover_url)}" alt="">`:`<div class="mark">${esc((c.brand||'S')[0].toUpperCase())}</div>`;
   const url=esc(c.pdf_url||'#');
   return `<article class="card"><div class="cover">${cover}<span class="tag">${esc(c.category)}</span></div><div class="body"><div class="brand-name">${esc(c.brand||'')}</div><h3>${esc(c.name)}</h3><p>${esc(c.description||'Consulte o catálogo de produtos.')}</p><div class="actions"><a class="btn primary" href="${url}" target="_blank" rel="noopener">Ver PDF</a><button class="btn" onclick="shareCatalog('${esc(c.name)}','${url}')">WhatsApp</button></div></div></article>`;
 }).join(''):'<div class="empty">Nenhum catálogo publicado encontrado.</div>';
}
function shareCatalog(name,url){
 const text=`Olá! Segue o catálogo ${name} da Somar Representações. ${url==='#'?'':url}`;
 window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}
async function loadCatalogs(){
 document.getElementById('status').textContent='Carregando catálogos...';
 const {data,error}=await client.from('catalogs').select('*').eq('published',true).order('created_at',{ascending:false});
 if(error){console.error(error);document.getElementById('status').textContent='Não foi possível carregar os catálogos agora.';return}
 catalogs=data||[];document.getElementById('status').textContent='';render();
}
function focusSearch(){document.getElementById('search').focus()}
document.getElementById('search').addEventListener('input',render);
renderCats();loadCatalogs();