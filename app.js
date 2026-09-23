const CATEGORIES = ["Todos","Cama, Mesa e Banho","Brinquedos","Utilidades","Material Escolar","Sazonais"];
let catalogs = [];
let activeCategory = "Todos";

function configured() {
  return window.SOMAR_CONFIG &&
    window.SOMAR_CONFIG.SUPABASE_URL &&
    !window.SOMAR_CONFIG.SUPABASE_URL.includes("SEU-PROJETO") &&
    window.SOMAR_CONFIG.SUPABASE_ANON_KEY &&
    !window.SOMAR_CONFIG.SUPABASE_ANON_KEY.includes("SUA_CHAVE");
}

const demo = [
  {id:"demo1",name:"Catálogo de Utilidades",brand:"Marca 01",category:"Utilidades",description:"Exemplo de catálogo para demonstração.",pdf_url:"assets/catalogo-exemplo.pdf"},
  {id:"demo2",name:"Catálogo de Brinquedos",brand:"Marca 02",category:"Brinquedos",description:"Exemplo de catálogo para demonstração.",pdf_url:"assets/catalogo-exemplo.pdf"},
  {id:"demo3",name:"Catálogo Cama, Mesa e Banho",brand:"Marca 03",category:"Cama, Mesa e Banho",description:"Exemplo de catálogo para demonstração.",pdf_url:"assets/catalogo-exemplo.pdf"},
  {id:"demo4",name:"Catálogo Material Escolar",brand:"Marca 04",category:"Material Escolar",description:"Exemplo de catálogo para demonstração.",pdf_url:"assets/catalogo-exemplo.pdf"},
  {id:"demo5",name:"Catálogo Sazonais",brand:"Marca 05",category:"Sazonais",description:"Exemplo de catálogo para demonstração.",pdf_url:"assets/catalogo-exemplo.pdf"}
];

async function loadCatalogs() {
  const status = document.getElementById("status");
  if (!configured()) {
    catalogs = demo;
    status.textContent = "Modo demonstração: conecte o Supabase em config.js para usar catálogos reais.";
    render();
    return;
  }
  const client = supabase.createClient(window.SOMAR_CONFIG.SUPABASE_URL, window.SOMAR_CONFIG.SUPABASE_ANON_KEY);
  const {data, error} = await client.from("catalogs")
    .select("*")
    .eq("published", true)
    .order("created_at", {ascending:false});
  if (error) {
    console.error(error);
    catalogs = [];
    status.textContent = "Não foi possível carregar os catálogos. Confira a configuração do Supabase.";
  } else {
    catalogs = data || [];
    status.textContent = catalogs.length ? "" : "Nenhum catálogo publicado ainda.";
  }
  render();
}

function renderFilters() {
  const el = document.getElementById("filters");
  el.innerHTML = CATEGORIES.map(c => `<button class="filter ${c===activeCategory?"active":""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
  el.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
    activeCategory = btn.dataset.cat;
    renderFilters(); render();
  }));
}

function render() {
  renderFilters();
  const q = document.getElementById("search").value.trim().toLowerCase();
  const list = catalogs.filter(c =>
    (activeCategory === "Todos" || c.category === activeCategory) &&
    (!q || `${c.name} ${c.brand} ${c.category} ${c.description||""}`.toLowerCase().includes(q))
  );
  document.getElementById("count").textContent = catalogs.length;
  const grid = document.getElementById("catalogGrid");
  grid.innerHTML = list.map(c => `
    <article class="catalog-card">
      <div class="cover">
        ${c.cover_url ? `<img src="${escapeAttr(c.cover_url)}" alt="">` : `<div class="cover-placeholder"><span>${escapeHtml((c.brand||"S").slice(0,1).toUpperCase())}</span></div>`}
        <span class="tag">${escapeHtml(c.category)}</span>
      </div>
      <div class="card-body">
        <small>${escapeHtml(c.brand || "")}</small>
        <h3>${escapeHtml(c.name)}</h3>
        <p>${escapeHtml(c.description || "Consulte o catálogo de produtos.")}</p>
        <div class="card-actions">
          <a class="btn small" href="${escapeAttr(c.pdf_url)}" target="_blank" rel="noopener">Ver PDF</a>
          <a class="btn btn-outline small" href="${escapeAttr(c.pdf_url)}" download>Baixar</a>
        </div>
      </div>
    </article>`).join("");
}

function escapeHtml(v="") { return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function escapeAttr(v="") { return escapeHtml(v); }

function setupWhatsApp() {
  const n = window.SOMAR_CONFIG?.WHATSAPP || "";
  if (!n || n.includes("9999")) return;
  const url = `https://wa.me/${n}?text=${encodeURIComponent("Olá! Gostaria de conhecer os catálogos da Somar Representações.")}`;
  ["whatsTop","whatsHero","whatsFooter"].forEach(id => document.getElementById(id).href = url);
}
document.getElementById("search").addEventListener("input", render);
setupWhatsApp();
loadCatalogs();
