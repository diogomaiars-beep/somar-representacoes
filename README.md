# Somar Representações — V2

## O que esta versão já tem
- Site público responsivo.
- Busca por catálogo/marca.
- Filtros por categoria.
- Visualização e download de PDF.
- WhatsApp configurável.
- Painel administrativo com login.
- Cadastro, edição, publicação/despublicação e exclusão de catálogos.
- Upload de PDF e capa.
- Banco de dados e arquivos preparados para Supabase.
- Estrutura pronta para publicação em hospedagem estática, como Cloudflare Pages.

## 1. Criar o projeto Supabase
1. Crie um projeto em https://supabase.com/
2. Abra o SQL Editor.
3. Copie todo o conteúdo de `supabase_schema.sql` e execute.
4. Em Authentication > Users, crie seu usuário de administrador com e-mail e senha.
5. Em Project Settings / API, copie a URL do projeto e a chave pública (publishable/anon, conforme a interface da sua conta).

## 2. Configurar o site
Abra `config.js` e preencha:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `WHATSAPP` com DDI + DDD + número, somente números.

Exemplo de WhatsApp: `5543999999999`

NUNCA coloque a chave `service_role` no site. O navegador deve usar somente a chave pública/anon/publishable, protegida pelas políticas RLS.

## 3. Testar
Abra `index.html` para conferir o site.
Abra `admin.html` para entrar no painel.

No painel:
- clique em Novo catálogo;
- informe nome, marca e categoria;
- escolha o PDF;
- opcionalmente escolha uma capa;
- marque Publicar no site;
- salve.

## 4. Publicar gratuitamente
A estrutura é estática e pode ser publicada no Cloudflare Pages.

Uma forma simples:
1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta para o repositório.
3. No Cloudflare, vá em Workers & Pages > Create application > Pages > Import an existing Git repository.
4. Selecione o repositório.
5. Como não há etapa de build, deixe o build command vazio e use a própria pasta do projeto como saída, conforme a configuração da conta.
6. Publique.

Depois disso o site terá um endereço `*.pages.dev`. Um domínio próprio pode ser conectado depois.

## Segurança
O login do painel é feito pelo Supabase Auth. O acesso ao banco e aos arquivos é controlado por RLS/policies.
Não compartilhe a senha do usuário administrador.
Não use `service_role` no `config.js`.

## Próxima evolução
- Logo oficial da Somar.
- Cadastro de marcas.
- Página individual para cada catálogo.
- Botão "Pedir orçamento" por catálogo.
- Área de clientes.
- Tabela de preços privada.
- QR Code de cada catálogo.
- Estatísticas de visualização/download.
