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

function showStatus(id, text, type = "success") {
  const el = $(id);
  if (!el) {
    console.warn("Área de mensagem não encontrada:", id, text);
    return;
  }

  el.textContent = text;
  el.className = "status " + type;
  el.hidden = false;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function msg(text, error = false) {
  showStatus("adminMsg", text, error ? "error" : "success");
}

function loginMsg(text, error = false) {
  showStatus("loginMsg", text, error ? "error" : "success");
}

function slugExt(file) {
  const ext = file.name.includes(".")
    ? "." + file.name.split(".").pop().toLowerCase()
    : "";
  return crypto.randomUUID() + ext;
}

function setSavingState(saving) {
  const form = $("catalogForm");
  if (!form) return;

  const submit = form.querySelector('button[type="submit"]');
  if (submit) {
    submit.disabled = saving;
    submit.textContent = saving ? "Enviando..." : "Salvar catálogo";
  }

  if ($("cancelEdit")) $("cancelEdit").disabled = saving;

  ["pdf", "cover", "name", "brand", "category", "description", "published"].forEach(id => {
    if ($(id)) $(id).disabled = saving;
  });
}

function errorText(error) {
  if (!error) return "Erro desconhecido.";

  const parts = [];
  if (error.message) parts.push(error.message);
  if (error.code) parts.push("Código: " + error.code);
  if (error.status) parts.push("Status: " + error.status);
  if (error.details) parts.push(error.details);
  if (error.hint) parts.push("Dica: " + error.hint);

  return parts.join(" | ") || String(error);
}

async function start() {
  try {
    if (!configured()) {
      loginMsg(
        "Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js antes de usar o painel.",
        true
      );
      const button = $("loginForm")?.querySelector("button");
      if (button) button.disabled = true;
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      loginMsg("❌ A biblioteca do Supabase não foi carregada. Recarregue a página.", true);
      return;
    }

    client = window.supabase.createClient(
      window.SOMAR_CONFIG.SUPABASE_URL,
      window.SOMAR_CONFIG.SUPABASE_ANON_KEY
    );

    const { data, error } = await client.auth.getSession();
    if (error) {
      loginMsg("❌ Erro ao verificar login: " + errorText(error), true);
      return;
    }

    showSession(data?.session || null);

    client.auth.onAuthStateChange((_event, session) => {
      showSession(session);
    });
  } catch (error) {
    console.error("Erro ao iniciar painel:", error);
    loginMsg("❌ Erro ao iniciar o painel: " + errorText(error), true);
  }
}

function showSession(session) {
  if ($("loginBox")) $("loginBox").hidden = !!session;
  if ($("dashboard")) $("dashboard").hidden = !session;

  if (session) loadAdmin();
}

$("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  if (!client) {
    loginMsg("❌ O sistema ainda não foi inicializado. Atualize a página.", true);
    return;
  }

  loginMsg("⏳ Entrando...");

  try {
    const { error } = await client.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) {
      loginMsg("❌ Não foi possível entrar: " + errorText(error), true);
    } else {
      loginMsg("✅ Login realizado com sucesso.");
    }
  } catch (error) {
    console.error("Erro no login:", error);
    loginMsg("❌ Erro no login: " + errorText(error), true);
  }
});

$("logout")?.addEventListener("click", async () => {
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) loginMsg("❌ Erro ao sair: " + errorText(error), true);
});

$("cancelEdit")?.addEventListener("click", () => resetForm());

async function loadAdmin() {
  if (!client) return;

  msg("⏳ Carregando catálogos...");

  try {
    const { data, error } = await client
      .from("catalogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      msg("❌ Não foi possível carregar os catálogos: " + errorText(error), true);
      return;
    }

    $("adminList").innerHTML = (data || []).map(c => `
      <div class="admin-item">
        <div>
          <strong>${esc(c.name)}</strong>
          <span>${esc(c.brand || "")} · ${esc(c.category || "")}</span>
          <small>${c.published ? "Publicado" : "Rascunho"}</small>
        </div>
        <div class="admin-actions">
          <button class="btn small edit" data-id="${esc(c.id)}">Editar</button>
          <button class="btn btn-danger small del" data-id="${esc(c.id)}">Excluir</button>
        </div>
      </div>
    `).join("") || "<p>Nenhum catálogo cadastrado.</p>";

    document.querySelectorAll(".edit").forEach(b => {
      b.onclick = () => editCatalog(b.dataset.id, data);
    });

    document.querySelectorAll(".del").forEach(b => {
      b.onclick = () => deleteCatalog(b.dataset.id, data);
    });

    msg((data || []).length
      ? "✅ Catálogos carregados."
      : "ℹ️ Nenhum catálogo cadastrado ainda.");
  } catch (error) {
    console.error("Erro ao carregar catálogos:", error);
    msg("❌ Erro ao carregar catálogos: " + errorText(error), true);
  }
}

function editCatalog(id, data) {
  const c = data.find(x => x.id === id);
  if (!c) return;

  editing = true;
  $("formTitle").textContent = "Editar catálogo";
  $("catalogId").value = c.id;
  $("name").value = c.name || "";
  $("brand").value = c.brand || "";
  $("category").value = c.category || "";
  $("description").value = c.description || "";
  $("published").checked = !!c.published;
  $("oldPdfPath").value = c.pdf_path || "";
  $("oldCoverPath").value = c.cover_path || "";
  $("pdf").required = false;

  msg('✏️ Editando o catálogo "' + c.name + '".');
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function uploadIf(file, folder, contentType, label) {
  if (!file) return null;

  msg("⏳ Enviando " + label + ": " + file.name);

  const path = folder + "/" + slugExt(file);

  try {
    const { data, error } = await client.storage
      .from("catalogos")
      .upload(path, file, {
        upsert: false,
        contentType,
        cacheControl: "3600"
      });

    if (error) {
      throw new Error("Erro ao enviar " + label + ": " + errorText(error));
    }

    if (!data?.path) {
      throw new Error("O Supabase não confirmou o caminho do arquivo enviado.");
    }

    msg("✅ " + label + " enviado com sucesso. Agora salvando as informações...");
    return data.path;
  } catch (error) {
    console.error("Erro no upload:", error);
    throw error;
  }
}

function publicUrl(path) {
  if (!path) return null;

  const result = client.storage.from("catalogos").getPublicUrl(path);
  return result?.data?.publicUrl || null;
}

async function removePath(path) {
  if (!path || !client) return;

  try {
    const { error } = await client.storage.from("catalogos").remove([path]);
    if (error) console.warn("Não foi possível remover arquivo:", errorText(error));
  } catch (error) {
    console.warn("Erro ao remover arquivo:", error);
  }
}

$("catalogForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  if (!client) {
    msg("❌ O Supabase não está conectado. Atualize a página e faça login novamente.", true);
    return;
  }

  setSavingState(true);
  msg(editing
    ? "⏳ Atualizando catálogo..."
    : "⏳ Preparando o envio do catálogo..."
  );

  let newPdfPath = null;
  let newCoverPath = null;

  try {
    const id = $("catalogId").value || crypto.randomUUID();
    const pdfFile = $("pdf").files[0];
    const coverFile = $("cover").files[0];

    const name = $("name").value.trim();
    const brand = $("brand").value.trim();
    const category = $("category").value;
    const description = $("description").value.trim();

    if (!name) throw new Error("Informe o nome do catálogo.");
    if (!brand) throw new Error("Informe a marca.");
    if (!category) throw new Error("Selecione uma categoria.");
    if (!editing && !pdfFile) throw new Error("Selecione o PDF do catálogo.");

    if (pdfFile && pdfFile.type !== "application/pdf") {
      throw new Error("O arquivo selecionado precisa ser um PDF.");
    }

    if (coverFile && !coverFile.type.startsWith("image/")) {
      throw new Error("A capa precisa ser uma imagem.");
    }

    const oldPdf = $("oldPdfPath").value;
    const oldCover = $("oldCoverPath").value;

    const pdfPath = pdfFile
      ? (newPdfPath = await uploadIf(pdfFile, "pdfs", "application/pdf", "o PDF"))
      : oldPdf;

    const coverPath = coverFile
      ? (newCoverPath = await uploadIf(coverFile, "covers", coverFile.type, "a capa"))
      : oldCover || null;

    msg("⏳ Arquivo enviado. Gravando o catálogo no banco de dados...");

    const payload = {
      id,
      name,
      brand,
      category,
      description,
      pdf_path: pdfPath,
      cover_path: coverPath,
      pdf_url: publicUrl(pdfPath),
      cover_url: publicUrl(coverPath),
      published: $("published").checked,
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from("catalogs").upsert(payload);

    if (error) {
      throw new Error("Erro ao salvar o catálogo no banco de dados: " + errorText(error));
    }

    if (pdfFile && oldPdf && oldPdf !== pdfPath) {
      await removePath(oldPdf);
    }

    if (coverFile && oldCover && oldCover !== coverPath) {
      await removePath(oldCover);
    }

    const successMessage = $("published").checked
      ? "✅ CATÁLOGO SALVO COM SUCESSO! Já está publicado no site."
      : "✅ CATÁLOGO SALVO COM SUCESSO! Ficou como rascunho.";

    resetForm(false);
    await loadAdmin();
    msg(successMessage);

  } catch (error) {
    console.error("ERRO COMPLETO NO SALVAMENTO:", error);

    if (newPdfPath) await removePath(newPdfPath);
    if (newCoverPath) await removePath(newCoverPath);

    msg(
      "❌ NÃO FOI POSSÍVEL SALVAR O CATÁLOGO. " +
      errorText(error),
      true
    );
  } finally {
    setSavingState(false);
  }
});

async function deleteCatalog(id, data) {
  const c = data.find(x => x.id === id);
  if (!c || !client) return;

  if (!confirm('Excluir "' + c.name + '"?')) return;

  msg("⏳ Excluindo catálogo...");

  try {
    const { error } = await client.from("catalogs").delete().eq("id", id);

    if (error) {
      msg("❌ Não foi possível excluir: " + errorText(error), true);
      return;
    }

    await removePath(c.pdf_path);
    await removePath(c.cover_path);
    await loadAdmin();
    msg("✅ Catálogo excluído com sucesso.");
  } catch (error) {
    console.error("Erro ao excluir:", error);
    msg("❌ Erro ao excluir: " + errorText(error), true);
  }
}

function resetForm(showMessage = true) {
  editing = false;
  $("formTitle").textContent = "Novo catálogo";
  $("catalogForm").reset();
  $("catalogId").value = "";
  $("oldPdfPath").value = "";
  $("oldCoverPath").value = "";
  $("published").checked = true;
  $("pdf").required = true;

  if (showMessage) msg("Formulário limpo. Pronto para cadastrar um novo catálogo.");
}

function esc(v = "") {
  return String(v).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

start();
