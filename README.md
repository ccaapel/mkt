# 📊 Painel de Marketing · CCAA Pelotas

Site para organizar o calendário de marketing da unidade e dar visão clara nas reuniões de alinhamento (gestor, coordenação, financeiro e marketing).

## O que tem

- **Painel** — KPIs do mês, foco principal, % concluído e próximas ações.
- **Calendário** — grade mensal com as ações por data (cores por status).
- **Tarefas** — quadro kanban (A fazer / Em andamento / Concluído), arrastar e soltar.
- **Ideias** — banco de ideias futuras com votação.
- **Resultados** — registro do que deu certo, com métrica e impacto.
- **Backup** — exportar/importar tudo em JSON.

Tudo roda no navegador, sem servidor. Os dados ficam salvos no `localStorage` da máquina.

## Rodar localmente

Abra a pasta e rode um servidor simples:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`. (Ou simplesmente abra o `index.html` no navegador.)

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex: `marketing-ccaa`).
2. Suba os arquivos (`index.html`, `styles.css`, `app.js`):
   ```bash
   git init
   git add .
   git commit -m "Painel de marketing CCAA Pelotas"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/marketing-ccaa.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Source: `main` / root → Save**.
4. Em ~1 min o site fica no ar em `https://SEU-USUARIO.github.io/marketing-ccaa/`.

## Importante sobre os dados

Os dados são salvos **por navegador**. Cada pessoa que abrir o link verá seu próprio painel vazio. Para compartilhar o mesmo conteúdo:

- Use **Exportar dados** para gerar um `.json` e mande para o time, que usa **Importar dados**.
- Se quiser dados realmente compartilhados em tempo real (todos veem o mesmo), dá para evoluir para um backend gratuito (Firebase/Supabase). É só pedir.
