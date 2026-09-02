/**
 * 一键建站平台 — Cloudflare Worker
 * Pure JavaScript: HTML/CSS/JS UI + JSON API in one file.
 * No JSX, bundler, framework, or build step required.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

const STATIC_TEMPLATES = [
  { id: 1, name: "Astro 极速博客", framework: "Astro", stars: 45200, icon: "🚀", compatible: true, buildCmd: "npm run build", outputDir: "dist", desc: "内容驱动 · 零 JS 运行时 · 首屏极速", repo: "withastro/astro", previewUrl: "https://astro.build" },
  { id: 2, name: "React 作品集", framework: "React", stars: 23800, icon: "⚛️", compatible: true, buildCmd: "npm run build", outputDir: "build", desc: "响应式个人主页 · 内置暗色模式与动画", repo: "facebook/react", previewUrl: "https://react.dev" },
  { id: 3, name: "Vue 企业官网", framework: "Vue 3", stars: 18600, icon: "🌿", compatible: true, buildCmd: "npm run build", outputDir: "dist", desc: "商务展示站点 · 多语言国际化支持", repo: "vuejs/vue", previewUrl: "https://vuejs.org" },
  { id: 4, name: "Next.js 电商", framework: "Next.js", stars: 98000, icon: "▲", compatible: false, buildCmd: "next build", outputDir: ".next", desc: "React 全栈电商，含购物车与动态路由", repo: "vercel/next.js", previewUrl: "https://nextjs.org", incompatibleReason: "Next.js SSR 模式需要 Node.js 持久运行时。建议使用 output: 'export' 进行静态导出后再部署。" },
  { id: 5, name: "SvelteKit 应用", framework: "SvelteKit", stars: 16400, icon: "🔥", compatible: true, buildCmd: "npm run build", outputDir: "build", desc: "编译时优化 · 极致运行性能 · 产物极小", repo: "sveltejs/kit", previewUrl: "https://svelte.dev" },
  { id: 6, name: "Nuxt 3 内容门户", framework: "Nuxt 3", stars: 52000, icon: "💫", compatible: false, buildCmd: "nuxt generate", outputDir: ".output/public", desc: "Vue 全栈框架 · 自动路由与内置 SEO 优化", repo: "nuxt/nuxt", previewUrl: "https://nuxt.com", incompatibleReason: "Nuxt 3 SSR 模式需要服务端运行时。建议使用 nuxt generate 预生成静态站点。" },
  { id: 7, name: "Vite 落地页", framework: "Vite", stars: 67000, icon: "⚡", compatible: true, buildCmd: "npm run build", outputDir: "dist", desc: "超快构建 · 极简落地页 · 首屏 < 200ms", repo: "vitejs/vite", previewUrl: "https://vitejs.dev" },
  { id: 8, name: "Hugo 技术博客", framework: "Hugo", stars: 73000, icon: "📝", compatible: true, buildCmd: "hugo --minify", outputDir: "public", desc: "高性能静态站点生成器 · 适合技术博客", repo: "gohugoio/hugo", previewUrl: "https://gohugo.io" },
  { id: 9, name: "Gatsby 营销站", framework: "Gatsby", stars: 55000, icon: "🟣", compatible: true, buildCmd: "gatsby build", outputDir: "public", desc: "React 静态站点生成器 · GraphQL 数据层", repo: "gatsbyjs/gatsby", previewUrl: "https://www.gatsbyjs.com" },
  { id: 10, name: "Angular 管理台", framework: "Angular", stars: 95000, icon: "🅰️", compatible: true, buildCmd: "ng build --configuration production", outputDir: "dist", desc: "企业级 TypeScript 框架 · 完整生态", repo: "angular/angular", previewUrl: "https://angular.dev" },
];

const FRAMEWORK_BUILD = {
  "Next.js": { cmd: "next build", dir: "out", compat: false },
  "Nuxt 3": { cmd: "nuxt generate", dir: ".output/public", compat: false },
  "Hugo": { cmd: "hugo --minify", dir: "public", compat: true },
  "Gatsby": { cmd: "gatsby build", dir: "public", compat: true },
  "Angular": { cmd: "ng build --configuration production", dir: "dist", compat: true },
  default: { cmd: "npm run build", dir: "dist", compat: true },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function html(body) {
  return new Response(body, {
    headers: {
      ...CORS,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

async function kvGet(env, key) {
  if (!env.KV) return null;
  try { return await env.KV.get(key); } catch (_) { return null; }
}

async function kvPut(env, key, value, opts) {
  if (!env.KV) return;
  try { await env.KV.put(key, value, opts); } catch (_) {}
}

function detectFramework(repo) {
  const topics = (repo.topics || []).join(" ").toLowerCase();
  const name = (repo.name || "").toLowerCase();
  if (topics.includes("astro") || name.includes("astro")) return "Astro";
  if (topics.includes("nextjs") || name.includes("next")) return "Next.js";
  if (topics.includes("nuxt") || name.includes("nuxt")) return "Nuxt 3";
  if (topics.includes("svelte") || name.includes("svelte")) return "SvelteKit";
  if (topics.includes("hugo") || name.includes("hugo")) return "Hugo";
  if (topics.includes("gatsby") || name.includes("gatsby")) return "Gatsby";
  if (topics.includes("angular") || name.includes("angular")) return "Angular";
  if (topics.includes("vue") || name.includes("vue")) return "Vue 3";
  if (topics.includes("react") || name.includes("react")) return "React";
  return "Static";
}

function handleHealth() {
  return json({
    status: "ok",
    service: "一键建站平台 API",
    version: "2.0.0",
    ui: "/",
    public: true,
    endpoints: {
      "GET /api/health": "健康检查",
      "GET /api/templates": "获取模板列表",
      "GET /api/search?q=": "搜索模板",
      "POST /api/test-connection": "验证 Cloudflare API 令牌",
      "POST /api/deploy": "启动部署任务",
      "GET /api/deploy/:id": "查询部署任务状态",
    },
    timestamp: new Date().toISOString(),
  });
}

async function handleGetTemplates(env) {
  const now = new Date();
  const cacheKey = `templates:${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  const cached = await kvGet(env, cacheKey);
  if (cached) return json({ ...JSON.parse(cached), source: "cache" });

  let templates = STATIC_TEMPLATES;
  let source = "static";

  if (env.GITHUB_TOKEN) {
    try {
      const queries = [
        "stars:>5000 topic:static-site pushed:>2024-01-01",
        "stars:>3000 topic:react topic:starter pushed:>2024-01-01",
        "stars:>3000 topic:vue topic:starter pushed:>2024-01-01",
      ];
      const seen = new Set();
      const repos = [];

      for (const q of queries) {
        const res = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=8`,
          { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "one-click-deploy/2.0" } }
        );
        if (!res.ok) continue;
        const data = await res.json();
        for (const r of data.items || []) {
          if (!seen.has(r.id) && !r.archived) {
            seen.add(r.id);
            repos.push(r);
          }
        }
      }

      if (repos.length) {
        templates = repos
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 20)
          .map((r) => {
            const framework = detectFramework(r);
            const cfg = FRAMEWORK_BUILD[framework] || FRAMEWORK_BUILD.default;
            return {
              id: r.id,
              name: r.name,
              framework,
              stars: r.stargazers_count,
              icon: "📦",
              compatible: cfg.compat,
              buildCmd: cfg.cmd,
              outputDir: cfg.dir,
              desc: r.description || "",
              repo: r.full_name,
              previewUrl: r.homepage || `https://github.com/${r.full_name}`,
            };
          });
        source = "github";
      }
    } catch (_) {}
  }

  const payload = { templates, updatedAt: now.toISOString(), source };
  await kvPut(env, cacheKey, JSON.stringify(payload), { expirationTtl: 30 * 86400 });
  return json(payload);
}

function handleSearch(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") || "10", 10) || 10, 1), 50);
  const results = STATIC_TEMPLATES.filter((t) =>
    !q ||
    t.name.toLowerCase().includes(q) ||
    t.framework.toLowerCase().includes(q) ||
    (t.desc || "").toLowerCase().includes(q)
  ).slice(0, limit);
  return json({ results, total: results.length, query: q });
}

async function handleTestConnection(request) {
  let body;
  try { body = await request.json(); }
  catch (_) { return json({ ok: false, error: "请求体必须为 JSON 格式" }, 400); }

  const { cfToken, cfAccountId } = body || {};
  if (!cfToken || !cfAccountId) {
    return json({ ok: false, error: "缺少 cfToken 或 cfAccountId" }, 400);
  }

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cfAccountId)}`, {
      headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return json({ ok: false, error: data.errors?.[0]?.message || "令牌无效或账户 ID 不匹配" }, 401);
    }
    return json({ ok: true, accountName: data.result?.name || "", accountId: cfAccountId });
  } catch (error) {
    return json({ ok: false, error: `Cloudflare API 请求失败: ${error.message}` }, 502);
  }
}

async function handleDeploy(request, env, ctx) {
  let body;
  try { body = await request.json(); }
  catch (_) { return json({ ok: false, error: "请求体必须为 JSON 格式" }, 400); }

  const { cfToken, cfAccountId, ghToken, ghUsername, template } = body || {};
  const missing = [
    !cfToken && "cfToken",
    !cfAccountId && "cfAccountId",
    !ghToken && "ghToken",
    !ghUsername && "ghUsername",
    !template && "template",
  ].filter(Boolean);

  if (missing.length) return json({ ok: false, error: `缺少必填字段: ${missing.join(", ")}` }, 400);
  if (!template.compatible) return json({ ok: false, error: template.incompatibleReason || "此模板当前不兼容静态部署" }, 400);
  if (!env.KV) return json({ ok: false, error: "部署状态需要 KV。请先在 Worker 绑定名为 KV 的命名空间。" }, 503);

  const deployId = crypto.randomUUID();
  const state = {
    status: "running",
    step: 0,
    logs: [{ ts: new Date().toISOString(), text: `部署任务已启动: ${deployId}`, type: "info" }],
    startedAt: Date.now(),
    template: template.name,
  };
  await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 7200 });

  ctx.waitUntil(runPipeline(deployId, { cfToken, cfAccountId, ghToken, ghUsername, template }, env));
  return json({ ok: true, deployId, message: "部署已启动" }, 202);
}

async function handleDeployStatus(deployId, env) {
  if (!env.KV) return json({ ok: false, error: "状态查询需要 KV 存储" }, 503);
  const raw = await kvGet(env, `deploy:${deployId}`);
  if (!raw) return json({ ok: false, error: "部署任务不存在或已过期" }, 404);
  return json(JSON.parse(raw));
}

async function runPipeline(deployId, config, env) {
  const { cfToken, cfAccountId, ghToken, ghUsername, template } = config;

  async function getState() {
    const raw = await kvGet(env, `deploy:${deployId}`);
    return raw ? JSON.parse(raw) : { logs: [] };
  }
  async function saveState(state) {
    await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 7200 });
  }
  async function log(text, type = "normal", step = null) {
    const state = await getState();
    state.logs = state.logs || [];
    state.logs.push({ ts: new Date().toISOString(), text, type });
    if (step !== null) state.step = step;
    await saveState(state);
  }

  try {
    await log(`框架识别: ${template.framework}`, "success", 0);
    await log(`构建命令: ${template.buildCmd}`, "normal");

    const repoName = `site-${Date.now().toString(36)}`;
    await log("正在创建 GitHub 私有仓库…", "info", 1);
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "one-click-deploy/2.0",
      },
      body: JSON.stringify({ name: repoName, private: true, auto_init: true, description: `Deployed by One-Click-Deploy — ${template.name}` }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`GitHub 仓库创建失败: ${createData.message || createRes.status}`);
    await log(`GitHub 仓库已创建: ${createData.full_name || `${ghUsername}/${repoName}`}`, "success", 2);

    await log("正在创建 Cloudflare Pages 项目…", "info", 3);
    const pagesRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cfAccountId)}/pages/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: repoName,
        production_branch: "main",
        source: {
          type: "github",
          config: {
            owner: ghUsername,
            repo_name: repoName,
            production_branch: "main",
            pr_comments_enabled: false,
            deployments_enabled: true,
          },
        },
        build_config: {
          build_command: template.buildCmd,
          destination_dir: template.outputDir,
          root_dir: "",
        },
      }),
    });
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok || !pagesData.success) {
      throw new Error(`Cloudflare Pages 项目创建失败: ${pagesData.errors?.[0]?.message || pagesRes.status}`);
    }

    const subdomain = pagesData.result?.subdomain || repoName;
    const domain = subdomain.includes(".") ? subdomain : `${subdomain}.pages.dev`;
    await log(`部署项目已创建: https://${domain}`, "success", 4);

    const state = await getState();
    Object.assign(state, {
      status: "complete",
      step: 5,
      result: {
        frontendUrl: `https://${domain}`,
        domain,
        repoName,
        repoUrl: createData.html_url || `https://github.com/${ghUsername}/${repoName}`,
        deployedAt: new Date().toISOString(),
      },
    });
    await saveState(state);
  } catch (error) {
    const state = await getState();
    state.status = "failed";
    state.failReason = error.message;
    state.logs = state.logs || [];
    state.logs.push({ ts: new Date().toISOString(), text: error.message, type: "error" });
    await saveState(state);
  }
}

const APP_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>One-Click Deploy · 一键建站</title>
<style>
:root{--bg:#f4f7f9;--panel:#fff;--text:#17202a;--muted:#667085;--line:#e4e9ef;--brand:#0f9d83;--brand2:#087865;--ok:#16a34a;--warn:#d97706;--bad:#dc2626;--code:#0d1117;--shadow:0 12px 38px rgba(15,23,42,.08)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
button,input{font:inherit}button{cursor:pointer}.shell{max-width:1120px;margin:auto;padding:28px 20px 60px}
.top{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.topin{max-width:1120px;margin:auto;height:62px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:16px}.logo{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;background:var(--brand);color:#fff}.pill{font-size:12px;color:var(--brand2);background:#e9f8f4;border:1px solid #cceee5;padding:3px 8px;border-radius:999px}
.hero{padding:44px 0 24px;display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:center}.hero h1{font-size:42px;line-height:1.08;margin:0 0 14px;letter-spacing:-1.5px}.hero p{font-size:16px;color:var(--muted);max-width:720px}.heroCard{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:var(--shadow)}.status{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)}.status:last-child{border:0}.dot{width:9px;height:9px;border-radius:50%;background:var(--ok);display:inline-block;margin-right:7px}
.steps{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 24px}.step{padding:7px 11px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted)}.step.active{border-color:#9bd9cb;background:#e9f8f4;color:var(--brand2);font-weight:700}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;box-shadow:0 2px 12px rgba(15,23,42,.04)}.card h2{font-size:17px;margin:0 0 4px}.hint{color:var(--muted);font-size:13px;margin-bottom:18px}
.field{margin:0 0 14px}.field label{display:block;font-weight:700;margin:0 0 6px}.field input{width:100%;border:1px solid #cfd8e3;background:#fff;color:#17202a;border-radius:9px;padding:10px 12px;outline:0}.field input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(15,157,131,.12)}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.btn{border:0;border-radius:9px;padding:10px 14px;font-weight:750;background:var(--brand);color:#fff}.btn:hover{background:var(--brand2)}.btn.alt{background:#fff;color:var(--text);border:1px solid var(--line)}.btn:disabled{opacity:.55;cursor:not-allowed}
.banner{margin-top:16px;border-radius:10px;padding:11px 13px;background:#fff8e7;border:1px solid #f3d89c;color:#7a5410}.ok{color:var(--ok)}.bad{color:var(--bad)}.muted{color:var(--muted)}
.toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:24px 0 14px}.search{min-width:280px;border:1px solid #cfd8e3;border-radius:9px;padding:10px 12px;background:#fff}
.templates{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.tpl{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;transition:.18s}.tpl:hover{transform:translateY(-2px);box-shadow:var(--shadow)}.tplTop{display:flex;justify-content:space-between;gap:12px}.icon{font-size:28px}.tag{font-size:11px;border-radius:999px;padding:3px 8px;background:#eef2f6;color:#5a6676}.tpl h3{margin:9px 0 4px}.tpl p{color:var(--muted);min-height:42px}.meta{display:flex;justify-content:space-between;color:var(--muted);font-size:12px;margin:12px 0}.tpl .btn{width:100%}.disabled{opacity:.62}
#deployPanel{margin-top:18px}.terminal{background:var(--code);color:#c9d1d9;border-radius:12px;padding:14px;height:260px;overflow:auto;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.log-ok{color:#7ee787}.log-error{color:#ff7b72}.log-info{color:#79c0ff}
.footer{padding:34px 0 0;text-align:center;color:var(--muted);font-size:12px}.hidden{display:none!important}
@media(max-width:850px){.hero,.grid{grid-template-columns:1fr}.templates{grid-template-columns:repeat(2,1fr)}.hero h1{font-size:34px}}
@media(max-width:560px){.topin{height:auto;padding-top:11px;padding-bottom:11px;align-items:flex-start}.pill{display:none}.shell{padding:18px 14px 40px}.hero{padding-top:28px}.hero h1{font-size:30px}.templates{grid-template-columns:1fr}.toolbar{align-items:stretch;flex-direction:column}.search{min-width:0;width:100%}}
@media(prefers-color-scheme:dark){:root{--bg:#0f1419;--panel:#161d24;--text:#e6edf3;--muted:#9aa7b4;--line:#2a3540;--shadow:0 12px 38px rgba(0,0,0,.28)}.top{background:rgba(22,29,36,.92)}.step,.field input,.search,.btn.alt,.tpl{background:#161d24;color:#e6edf3}.field input,.search{border-color:#3a4652}.banner{background:#2a2316;border-color:#665125;color:#e6c978}.tag{background:#26313c;color:#b7c1ca}}
</style>
</head>
<body>
<header class="top"><div class="topin"><div class="brand"><span class="logo">⚡</span><span>One-Click Deploy · 一键建站</span><span class="pill">Worker 原生 UI</span></div><div class="muted">HTML + CSS + JS · 无需 JSX 构建</div></div></header>
<main class="shell">
<section class="hero">
  <div><h1>一个 Worker，完成配置、模板选择与部署。</h1><p>界面直接嵌入 <code>worker.js</code>，访问根路径即可渲染。所有后端请求统一走 <code>/api/*</code>，不依赖 React、JSX、Vite 或其他构建工具。</p><div class="steps"><span class="step active">1 授权配置</span><span class="step">2 选择模板</span><span class="step">3 启动部署</span><span class="step">4 查看状态</span></div></div>
  <aside class="heroCard"><div class="status"><span><i class="dot"></i>Worker UI</span><strong>Online</strong></div><div class="status"><span>API 前缀</span><code>/api/*</code></div><div class="status"><span>CORS</span><code>*</code></div><div class="status"><span>构建过程</span><strong>不需要</strong></div></aside>
</section>

<section class="grid">
  <article class="card">
    <h2>Cloudflare 授权</h2><div class="hint">令牌仅随当前请求发送到 Worker，不写入浏览器持久存储。</div>
    <div class="field"><label for="cfToken">API Token</label><input id="cfToken" type="password" autocomplete="off" placeholder="Cloudflare API Token"></div>
    <div class="field"><label for="cfAccountId">Account ID</label><input id="cfAccountId" autocomplete="off" placeholder="Cloudflare Account ID"></div>
    <div class="row"><button class="btn alt" id="testBtn">测试连接</button><span id="testResult" class="muted">尚未测试</span></div>
  </article>
  <article class="card">
    <h2>GitHub 授权</h2><div class="hint">用于后端部署流程创建仓库并连接 Pages 项目。</div>
    <div class="field"><label for="ghToken">GitHub Token</label><input id="ghToken" type="password" autocomplete="off" placeholder="GitHub fine-grained / classic token"></div>
    <div class="field"><label for="ghUsername">GitHub Username</label><input id="ghUsername" autocomplete="off" placeholder="your-username"></div>
    <div class="banner">生产环境建议使用最小权限、短期令牌；部署完成后撤销不再需要的授权。</div>
  </article>
</section>

<div class="toolbar"><div><h2 style="margin:0">选择模板</h2><div class="muted">模板来自 Worker 内置列表；配置 GITHUB_TOKEN 后 API 可尝试读取趋势仓库。</div></div><input class="search" id="search" placeholder="搜索 Astro / React / Vue…"></div>
<section id="templates" class="templates"><div class="muted">正在加载模板…</div></section>

<section id="deployPanel" class="card hidden">
  <div class="row" style="justify-content:space-between"><div><h2 id="deployTitle">部署状态</h2><div id="deployState" class="muted">准备中</div></div><a id="resultLink" class="btn hidden" target="_blank" rel="noreferrer">访问站点</a></div>
  <div id="terminal" class="terminal" style="margin-top:14px"></div>
</section>
<div class="footer">One-Click-Deploy · Cloudflare Worker native UI</div>
</main>

<script>
const $ = (id) => document.getElementById(id);
let templates = [];
let selected = null;
let pollTimer = null;

async function api(path, options = {}) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({ error: "响应不是有效 JSON" }));
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function formatStars(n) {
  return Number(n) >= 1000 ? (Number(n) / 1000).toFixed(1) + "k" : String(n || 0);
}

function renderTemplates(items) {
  const root = $("templates");
  if (!items.length) {
    root.innerHTML = '<div class="card muted">没有匹配的模板。</div>';
    return;
  }
  root.innerHTML = items.map((t) => {
    const disabled = t.compatible === false;
    return '<article class="tpl ' + (disabled ? 'disabled' : '') + '">' +
      '<div class="tplTop"><span class="icon">' + esc(t.icon || "📦") + '</span><span class="tag">' + esc(t.framework) + '</span></div>' +
      '<h3>' + esc(t.name) + '</h3><p>' + esc(t.desc || "") + '</p>' +
      '<div class="meta"><span>★ ' + esc(formatStars(t.stars)) + '</span><span>' + esc(t.outputDir || "dist") + '</span></div>' +
      '<button class="btn" data-id="' + esc(t.id) + '" ' + (disabled ? "disabled" : "") + '>' + (disabled ? "当前不兼容" : "选择并部署") + '</button>' +
      '</article>';
  }).join("");

  root.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selected = templates.find((t) => String(t.id) === btn.dataset.id);
      if (selected) startDeploy(selected);
    });
  });
}

async function loadTemplates() {
  try {
    const data = await api("/api/templates");
    templates = data.templates || [];
    renderTemplates(templates);
  } catch (e) {
    $("templates").innerHTML = '<div class="card bad">模板加载失败：' + esc(e.message) + '</div>';
  }
}

$("search").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  renderTemplates(templates.filter((t) => !q || [t.name, t.framework, t.desc].join(" ").toLowerCase().includes(q)));
});

$("testBtn").addEventListener("click", async () => {
  const btn = $("testBtn");
  const result = $("testResult");
  const cfToken = $("cfToken").value.trim();
  const cfAccountId = $("cfAccountId").value.trim();
  if (!cfToken || !cfAccountId) {
    result.textContent = "请先填写 Token 和 Account ID";
    result.className = "bad";
    return;
  }
  btn.disabled = true;
  result.textContent = "测试中…";
  result.className = "muted";
  try {
    const data = await api("/api/test-connection", { method: "POST", body: JSON.stringify({ cfToken, cfAccountId }) });
    result.textContent = "连接成功" + (data.accountName ? " · " + data.accountName : "");
    result.className = "ok";
  } catch (e) {
    result.textContent = "连接失败 · " + e.message;
    result.className = "bad";
  } finally {
    btn.disabled = false;
  }
});

async function startDeploy(template) {
  const cfToken = $("cfToken").value.trim();
  const cfAccountId = $("cfAccountId").value.trim();
  const ghToken = $("ghToken").value.trim();
  const ghUsername = $("ghUsername").value.trim();
  if (!cfToken || !cfAccountId || !ghToken || !ghUsername) {
    alert("请先完整填写 Cloudflare 与 GitHub 授权信息。");
    window.scrollTo({ top: 180, behavior: "smooth" });
    return;
  }

  $("deployPanel").classList.remove("hidden");
  $("deployTitle").textContent = "正在部署 · " + template.name;
  $("deployState").textContent = "正在提交任务…";
  $("terminal").textContent = "";
  $("resultLink").classList.add("hidden");
  $("deployPanel").scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const data = await api("/api/deploy", {
      method: "POST",
      body: JSON.stringify({ cfToken, cfAccountId, ghToken, ghUsername, template }),
    });
    $("deployState").textContent = "任务 ID: " + data.deployId;
    pollDeploy(data.deployId);
  } catch (e) {
    $("deployState").textContent = "启动失败";
    $("terminal").innerHTML = '<div class="log-error">' + esc(e.message) + '</div>';
  }
}

async function pollDeploy(id) {
  if (pollTimer) clearTimeout(pollTimer);
  try {
    const state = await api("/api/deploy/" + encodeURIComponent(id));
    $("deployState").textContent = state.status === "complete" ? "部署完成" : state.status === "failed" ? "部署失败" : "部署进行中 · Step " + (state.step ?? 0);
    $("terminal").innerHTML = (state.logs || []).map((l) => {
      const cls = l.type === "success" ? "log-ok" : l.type === "error" ? "log-error" : l.type === "info" ? "log-info" : "";
      return '<div class="' + cls + '">[' + esc((l.ts || "").slice(11,19)) + '] ' + esc(l.text) + '</div>';
    }).join("");
    $("terminal").scrollTop = $("terminal").scrollHeight;

    if (state.status === "complete") {
      const link = $("resultLink");
      link.href = state.result?.frontendUrl || "#";
      link.classList.remove("hidden");
      return;
    }
    if (state.status === "failed") return;
    pollTimer = setTimeout(() => pollDeploy(id), 1800);
  } catch (e) {
    $("deployState").textContent = "状态查询失败";
    $("terminal").innerHTML += '<div class="log-error">' + esc(e.message) + '</div>';
  }
}

loadTemplates();
</script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return preflight();

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (path === "/" && request.method === "GET") return html(APP_HTML);
      if ((path === "/health" || path === "/api/health") && request.method === "GET") return handleHealth();
      if (path === "/api/templates" && request.method === "GET") return handleGetTemplates(env);
      if (path === "/api/search" && request.method === "GET") return handleSearch(request);
      if (path === "/api/test-connection" && request.method === "POST") return handleTestConnection(request);
      if (path === "/api/deploy" && request.method === "POST") return handleDeploy(request, env, ctx);

      const match = path.match(/^\/api\/deploy\/([a-zA-Z0-9-]+)$/);
      if (match && request.method === "GET") return handleDeployStatus(match[1], env);

      if (path.startsWith("/api/")) return json({ error: "Not Found", path, method: request.method }, 404);
      return html('<!doctype html><meta charset="utf-8"><title>404</title><h1>404 Not Found</h1><p><a href="/">返回首页</a></p>');
    } catch (error) {
      if (path.startsWith("/api/")) return json({ error: `Internal Server Error: ${error.message}` }, 500);
      return html("<h1>500 Internal Server Error</h1>");
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (!env.KV) return;
      const now = new Date();
      const cacheKey = `templates:${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
      try { await env.KV.delete(cacheKey); } catch (_) {}
    })());
  },
};
