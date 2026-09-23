let client = null;
let editing = false;

const $ = id => document.getElementById(id);
function configured() {
  return window.SOMAR_CONFIG &&
    window.SOMAR_CONFIG.SUPABASE_URL &&
    !window.SOMAR_CONFIG.SUPABASE_URL.includes("SEU-PROJETO") &&
    window.SOMAR_CONFIG.SUPABASE_ANON_KEY &&
    !window.SOMAR_CONFIG.SUPABASE_ANON_KEY.includes("SUA_CHAVE");
}
function msg(text, error=false) {
  const el = $("adminMsg"); el.textContent = text; el.className = "status " + (error ? "error":"success");
}
function loginMsg(text, error=false) {
  const el = $("loginMsg"); el.textContent = text; el.className = "status " + (error ? "error":"success");
}
function slugExt(file) {
  const ext = file.name.includes(".") ? "." + file.name.split(".").pop().toLowerCase() : "";
  return `${crypto.randomUUID()}${ext}`;
}
async function start() {
  if (!configured()) {
    loginMsg("Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js antes de usar o painel.", true);
    $("loginForm").querySelector("button").disabled = true;
    return;
  }
  client = supabase.createClient(window.SOMAR_CONFIG.SUPABASE_URL, window.SOMAR_CONFIG.SUPABASE_ANON_KEY);
  const {data:{session}} = await client.auth.getSession();
  showSession(session);
  client.auth.onAuthStateChange((_event, session) => showSession(session));
}
function showSession(session) {
  $("loginBox").hidden = !!session;
  $("dashboard").hidden = !session;
  if (session) loadAdmin();
}
$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  loginMsg("Entrando...");
  const {error} = await client.auth.signInWithPassword({email:$("email").value, password:$("password").value});
  if (error) loginMsg(error.message, true);
});
$("logout").addEventListener("click", () => client.auth.signOut());
$("cancelEdit").addEventListener("click", resetForm);

async function loadAdmin() {
  const {data,error} = await client.from("catalogs").select("*").order("created_at",{ascending:false});
  if (error) return msg(error.message,true);
  $("adminList").innerHTML = (data||[]).map(c => `
    <div class="admin-item">
      <div><strong>${esc(c.name)}</strong><span>${esc(c.brand)} · ${esc(c.category)}</span><small>${c.published ? "Publicado":"Rascunho"}</small></div>
      <div class="admin-actions"><button class="btn small edit" data-id="${c.id}">Editar</button><button class="btn btn-danger small del" data-id="${c.id}">Excluir</button></div>
    </div>`).join("") || "<p>Nenhum catálogo cadastrado.</p>";
  document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>editCatalog(b.dataset.id,data));
  document.querySelectorAll(".del").forEach(b=>b.onclick=()=>deleteCatalog(b.dataset.id,data));
}
function editCatalog(id,data) {
  const c = data.find(x=>x.id===id); if(!c) return;
  editing=true; $("formTitle").textContent="Editar catálogo"; $("catalogId").value=c.id;
  $("name").value=c.name; $("brand").value=c.brand; $("category").value=c.category;
  $("description").value=c.description||""; $("published").checked=!!c.published;
  $("oldPdfPath").value=c.pdf_path||""; $("oldCoverPath").value=c.cover_path||"";
  $("pdf").required=false; window.scrollTo({top:0,behavior:"smooth"});
}
async function uploadIf(file, folder, contentType) {
  if (!file) return null;
  const path = `${folder}/${slugExt(file)}`;
  const {error} = await client.storage.from("catalogos").upload(path,file,{upsert:false,contentType,cacheControl:"3600"});
  if(error) throw error;
  return path;
}
function publicUrl(path) {
  if(!path) return null;
  return client.storage.from("catalogos").getPublicUrl(path).data.publicUrl;
}
async function removePath(path) {
  if(path) await client.storage.from("catalogos").remove([path]);
}
$("catalogForm").addEventListener("submit", async e => {
  e.preventDefault();
  msg("Salvando...");
  try {
    const id=$("catalogId").value || crypto.randomUUID();
    const pdfFile=$("pdf").files[0], coverFile=$("cover").files[0];
    if(!editing && !pdfFile) throw new Error("Selecione o PDF do catálogo.");
    const pdfPath = pdfFile ? await uploadIf(pdfFile,"pdfs","application/pdf") : $("oldPdfPath").value;
    const coverPath = coverFile ? await uploadIf(coverFile,"covers",coverFile.type) : $("oldCoverPath").value || null;
    const payload={
      id,name:$("name").value.trim(),brand:$("brand").value.trim(),category:$("category").value,
      description:$("description").value.trim(),pdf_path:pdfPath,cover_path:coverPath,
      pdf_url:publicUrl(pdfPath),cover_url:publicUrl(coverPath),published:$("published").checked,
      updated_at:new Date().toISOString()
    };
    const {error}=await client.from("catalogs").upsert(payload);
    if(error) throw error;
    const oldPdf=$("oldPdfPath").value, oldCover=$("oldCoverPath").value;
    if(pdfFile && oldPdf && oldPdf!==pdfPath) await removePath(oldPdf);
    if(coverFile && oldCover && oldCover!==coverPath) await removePath(oldCover);
    msg("Catálogo salvo com sucesso.");
    resetForm(); await loadAdmin();
  } catch(err) {
    console.error(err); msg(err.message || "Erro ao salvar.",true);
  }
});
async function deleteCatalog(id,data) {
  const c=data.find(x=>x.id===id); if(!c) return;
  if(!confirm(`Excluir "${c.name}"?`)) return;
  msg("Excluindo...");
  const {error}=await client.from("catalogs").delete().eq("id",id);
  if(error) return msg(error.message,true);
  await removePath(c.pdf_path); await removePath(c.cover_path);
  msg("Catálogo excluído."); loadAdmin();
}
function resetForm() {
  editing=false; $("formTitle").textContent="Novo catálogo"; $("catalogForm").reset();
  $("catalogId").value=""; $("oldPdfPath").value=""; $("oldCoverPath").value="";
  $("published").checked=true; $("pdf").required=true;
}
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
start();
