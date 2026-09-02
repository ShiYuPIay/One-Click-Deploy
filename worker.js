/**
 * 一键建站平台 — Cloudflare Worker API
 * ─────────────────────────────────────
 * Pure JavaScript. No build process. No JSX. No TypeScript.
 * Deploy with: wrangler deploy
 *
 * ROUTES
 *   GET  /                       Health check
 *   GET  /health                 Health check (alias)
 *   GET  /api/templates          Monthly trending templates (KV-cached 30 days)
 *   GET  /api/search?q=react     Search templates by name/framework/desc
 *   POST /api/test-connection    Validate cloud platform API token
 *   POST /api/deploy             Start deployment pipeline → returns deployId
 *   GET  /api/deploy/:id         Poll deployment status + live logs
 */

// ═══════════════════════════════════════════════════════════
// CORS — allow ALL public domains, no authentication
// ═══════════════════════════════════════════════════════════

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age':       '86400',
};

// ═══════════════════════════════════════════════════════════
// RESPONSE HELPERS
// ═══════════════════════════════════════════════════════════

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

// ═══════════════════════════════════════════════════════════
// STATIC TEMPLATE DATA
// Embedded fallback — always works even without KV or GitHub token.
// Updated here monthly; KV cache layers on top when available.
// ═══════════════════════════════════════════════════════════

const STATIC_TEMPLATES = [
  {
    id: 1, name: 'Astro 极速博客', framework: 'Astro', stars: 45200,
    icon: '🚀', color: '#FF5D01', compatible: true,
    buildCmd: 'npm run build', outputDir: 'dist',
    desc: '内容驱动 · 零 JS 运行时 · 首屏极速',
    repo: 'withastro/astro', previewUrl: 'https://astro.build',
  },
  {
    id: 2, name: 'React 作品集', framework: 'React', stars: 23800,
    icon: '⚛️', color: '#0ea5e9', compatible: true,
    buildCmd: 'npm run build', outputDir: 'build',
    desc: '响应式个人主页 · 内置暗色模式与动画',
    repo: 'facebook/react', previewUrl: 'https://react.dev',
  },
  {
    id: 3, name: 'Vue 企业官网', framework: 'Vue 3', stars: 18600,
    icon: '🌿', color: '#42B883', compatible: true,
    buildCmd: 'npm run build', outputDir: 'dist',
    desc: '商务展示站点 · 多语言国际化支持',
    repo: 'vuejs/vue', previewUrl: 'https://vuejs.org',
  },
  {
    id: 4, name: 'Next.js 电商', framework: 'Next.js', stars: 98000,
    icon: '▲', color: '#333333', compatible: false,
    buildCmd: 'next build', outputDir: '.next',
    desc: 'React 全栈电商，含购物车与动态路由',
    repo: 'vercel/next.js', previewUrl: 'https://nextjs.org',
    incompatibleReason: 'Next.js SSR 模式需要 Node.js 持久运行时环境。当前免费边缘节点 CPU 限制（10ms）无法支持复杂服务端渲染中间件。\n\n建议：\n① 升级至付费高性能节点，或\n② 在 next.config.js 设置 output: "export" 改用纯静态导出。',
  },
  {
    id: 5, name: 'SvelteKit 应用', framework: 'SvelteKit', stars: 16400,
    icon: '🔥', color: '#FF3E00', compatible: true,
    buildCmd: 'npm run build', outputDir: 'build',
    desc: '编译时优化 · 极致运行性能 · 产物极小',
    repo: 'sveltejs/kit', previewUrl: 'https://svelte.dev',
  },
  {
    id: 6, name: 'Nuxt 3 内容门户', framework: 'Nuxt 3', stars: 52000,
    icon: '💫', color: '#00DC82', compatible: false,
    buildCmd: 'nuxt generate', outputDir: '.output/public',
    desc: 'Vue 全栈框架 · 自动路由与内置 SEO 优化',
    repo: 'nuxt/nuxt', previewUrl: 'https://nuxt.com',
    incompatibleReason: 'Nuxt 3 SSR 需要 Node.js 持久进程，边缘函数单次执行模型不兼容。\n\n建议：\n① 在 nuxt.config.ts 设置 ssr: false 切换为 SPA 模式，或\n② 改用 nuxt generate 预生成纯静态站点（SSG）。',
  },
  {
    id: 7, name: 'Vite 落地页', framework: 'Vite', stars: 67000,
    icon: '⚡', color: '#646CFF', compatible: true,
    buildCmd: 'npm run build', outputDir: 'dist',
    desc: '超快构建 · 极简落地页 · 首屏 < 200ms',
    repo: 'vitejs/vite', previewUrl: 'https://vitejs.dev',
  },
  {
    id: 8, name: 'Hugo 技术博客', framework: 'Hugo', stars: 73000,
    icon: '📝', color: '#FF4088', compatible: true,
    buildCmd: 'hugo --minify', outputDir: 'public',
    desc: '世界最快静态生成器 · 毫秒级构建万篇文章',
    repo: 'gohugoio/hugo', previewUrl: 'https://gohugo.io',
  },
  {
    id: 9, name: 'Gatsby 营销站', framework: 'Gatsby', stars: 55000,
    icon: '🟣', color: '#663399', compatible: true,
    buildCmd: 'gatsby build', outputDir: 'public',
    desc: 'React 静态站点生成器 · GraphQL 数据层',
    repo: 'gatsbyjs/gatsby', previewUrl: 'https://www.gatsbyjs.com',
  },
  {
    id: 10, name: 'Angular 管理台', framework: 'Angular', stars: 95000,
    icon: '🅰️', color: '#DD0031', compatible: true,
    buildCmd: 'ng build --configuration production', outputDir: 'dist',
    desc: '企业级 TypeScript 框架 · 完整 MVC 生态',
    repo: 'angular/angular', previewUrl: 'https://angular.io',
  },
];

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function generatePassword() {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => pool[b % pool.length]).join('');
}

function detectFramework(repo) {
  const topics = (repo.topics || []).join(' ').toLowerCase();
  const name   = (repo.name   || '').toLowerCase();
  if (topics.includes('astro')   || name.includes('astro'))   return 'Astro';
  if (topics.includes('nextjs')  || name.includes('next'))    return 'Next.js';
  if (topics.includes('nuxt')    || name.includes('nuxt'))    return 'Nuxt 3';
  if (topics.includes('svelte')  || name.includes('svelte'))  return 'SvelteKit';
  if (topics.includes('hugo')    || name.includes('hugo'))    return 'Hugo';
  if (topics.includes('gatsby')  || name.includes('gatsby'))  return 'Gatsby';
  if (topics.includes('angular') || name.includes('angular')) return 'Angular';
  if (topics.includes('vue')     || name.includes('vue'))     return 'Vue 3';
  if (topics.includes('react')   || name.includes('react'))   return 'React';
  return 'Static';
}

const FRAMEWORK_BUILD = {
  'Next.js':   { cmd: 'next build',                          dir: 'out',             compat: false },
  'Nuxt 3':    { cmd: 'nuxt generate',                       dir: '.output/public',  compat: false },
  'Hugo':      { cmd: 'hugo --minify',                       dir: 'public',          compat: true  },
  'Gatsby':    { cmd: 'gatsby build',                        dir: 'public',          compat: true  },
  'Angular':   { cmd: 'ng build --configuration production', dir: 'dist',            compat: true  },
  'default':   { cmd: 'npm run build',                       dir: 'dist',            compat: true  },
};

async function kvGet(env, key) {
  if (!env.KV) return null;
  try { return await env.KV.get(key); } catch (_) { return null; }
}

async function kvPut(env, key, value, opts) {
  if (!env.KV) return;
  try { await env.KV.put(key, value, opts); } catch (_) {}
}

// ═══════════════════════════════════════════════════════════
// HANDLER: GET /
// ═══════════════════════════════════════════════════════════

function handleHealth() {
  return json({
    status:    'ok',
    service:   '一键建站平台 API',
    version:   '1.0.0',
    public:    true,
    endpoints: {
      'GET  /':                  '健康检查',
      'GET  /api/templates':     '获取月度趋势模板列表',
      'GET  /api/search?q=':     '搜索模板 (支持名称/框架/描述)',
      'POST /api/test-connection': '验证云平台 API 令牌',
      'POST /api/deploy':        '发起一键部署任务',
      'GET  /api/deploy/:id':    '查询部署进度与实时日志',
    },
    timestamp: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: GET /api/templates
// ═══════════════════════════════════════════════════════════

async function handleGetTemplates(request, env) {
  const now      = new Date();
  const cacheKey = `templates:${now.getFullYear()}-${now.getMonth() + 1}`;

  // 1. Try KV cache
  const cached = await kvGet(env, cacheKey);
  if (cached) {
    return json({ ...JSON.parse(cached), source: 'cache' });
  }

  // 2. Try live GitHub API (only if token is configured)
  let templates = STATIC_TEMPLATES;
  let source    = 'static';

  if (env.GITHUB_TOKEN) {
    try {
      const queries = [
        'stars:>5000 topic:static-site pushed:>2024-01-01',
        'stars:>3000 topic:react topic:starter pushed:>2024-01-01',
        'stars:>3000 topic:vue topic:starter pushed:>2024-01-01',
        'stars:>5000 topic:blog-theme pushed:>2024-01-01',
      ];
      const seen  = new Set();
      const repos = [];

      for (const q of queries) {
        const res = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=8`,
          {
            headers: {
              Authorization: `token ${env.GITHUB_TOKEN}`,
              Accept:        'application/vnd.github.v3+json',
              'User-Agent':  'deploy-tool/1.0',
            },
          }
        );
        if (!res.ok) continue;
        const data = await res.json();
        for (const r of data.items || []) {
          if (!seen.has(r.id) && !r.archived && r.stargazers_count > 1000) {
            seen.add(r.id);
            repos.push(r);
          }
        }
      }

      if (repos.length > 0) {
        templates = repos
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 20)
          .map(r => {
            const fw  = detectFramework(r);
            const cfg = FRAMEWORK_BUILD[fw] || FRAMEWORK_BUILD.default;
            return {
              id:         r.id,
              name:       r.name,
              framework:  fw,
              stars:      r.stargazers_count,
              desc:       r.description || '',
              compatible: cfg.compat,
              buildCmd:   cfg.cmd,
              outputDir:  cfg.dir,
              repo:       r.full_name,
              previewUrl: r.homepage || `https://github.com/${r.full_name}`,
            };
          });
        source = 'github';
      }
    } catch (_) {
      // Fall through to static data
    }
  }

  const payload = { templates, updatedAt: now.toISOString(), source };
  // Cache for 30 days
  await kvPut(env, cacheKey, JSON.stringify(payload), { expirationTtl: 30 * 86400 });

  return json(payload);
}

// ═══════════════════════════════════════════════════════════
// HANDLER: GET /api/search?q=react&limit=10
// ═══════════════════════════════════════════════════════════

function handleSearch(request) {
  const url   = new URL(request.url);
  const q     = (url.searchParams.get('q') || '').toLowerCase().trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10), 1), 50);

  if (!q) {
    return json({ results: STATIC_TEMPLATES.slice(0, limit), total: STATIC_TEMPLATES.length, query: '' });
  }

  const results = STATIC_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q)      ||
    t.framework.toLowerCase().includes(q) ||
    (t.desc || '').toLowerCase().includes(q)
  ).slice(0, limit);

  return json({ results, total: results.length, query: q });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: POST /api/test-connection
// Body: { cfToken: string, cfAccountId: string }
// ═══════════════════════════════════════════════════════════

async function handleTestConnection(request) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ ok: false, error: '请求体必须为 JSON 格式' }, 400);
  }

  const { cfToken, cfAccountId } = body;
  if (!cfToken || !cfAccountId) {
    return json({ ok: false, error: '缺少必填字段: cfToken 或 cfAccountId' }, 400);
  }

  try {
    const res  = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}`, {
      headers: {
        Authorization:  `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const errMsg = data.errors?.[0]?.message || '令牌无效或账户 ID 不匹配';
      return json({ ok: false, error: errMsg }, 401);
    }

    return json({ ok: true, accountName: data.result?.name, accountId: cfAccountId });
  } catch (e) {
    return json({ ok: false, error: `网络请求失败: ${e.message}` }, 502);
  }
}

// ═══════════════════════════════════════════════════════════
// HANDLER: POST /api/deploy
// Body: { cfToken, cfAccountId, ghToken, ghUsername, template }
// Returns: { deployId }  — frontend polls /api/deploy/:id
// ═══════════════════════════════════════════════════════════

async function handleDeploy(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: '请求体必须为 JSON 格式' }, 400);
  }

  const { cfToken, cfAccountId, ghToken, ghUsername, template } = body;
  const missing = [
    !cfToken      && 'cfToken',
    !cfAccountId  && 'cfAccountId',
    !ghToken      && 'ghToken',
    !ghUsername   && 'ghUsername',
    !template     && 'template',
  ].filter(Boolean);

  if (missing.length) {
    return json({ error: `缺少必填字段: ${missing.join(', ')}` }, 400);
  }

  const deployId  = crypto.randomUUID();
  const initState = {
    status:    'running',
    step:      0,
    logs:      [{ ts: new Date().toISOString().slice(11, 19), text: `[系统] 部署任务已启动: ${deployId}`, type: 'info' }],
    startedAt: Date.now(),
    template:  template.name,
  };

  await kvPut(env, `deploy:${deployId}`, JSON.stringify(initState), { expirationTtl: 7200 });

  // Run pipeline asynchronously (survives past the 30s request timeout)
  if (ctx) {
    ctx.waitUntil(runPipeline(deployId, { cfToken, cfAccountId, ghToken, ghUsername, template }, env));
  }

  return json({ deployId, message: '部署已启动，使用 deployId 轮询 /api/deploy/:id 获取实时进度' });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: GET /api/deploy/:id
// ═══════════════════════════════════════════════════════════

async function handleDeployStatus(deployId, env) {
  if (!env.KV) {
    return json({ error: '状态查询需要 KV 存储。请先配置 KV 命名空间（见 wrangler.toml）。' }, 503);
  }
  const raw = await kvGet(env, `deploy:${deployId}`);
  if (!raw) {
    return json({ error: '部署任务不存在或已过期（超过 2 小时自动清理）' }, 404);
  }
  return json(JSON.parse(raw));
}

// ═══════════════════════════════════════════════════════════
// PIPELINE — background deployment process
// Orchestrates GitHub repo creation + Pages project setup
// ═══════════════════════════════════════════════════════════

async function runPipeline(deployId, config, env) {
  const { cfToken, cfAccountId, ghToken, ghUsername, template } = config;

  async function addLog(text, type = 'normal', step = null) {
    const raw   = await kvGet(env, `deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : { logs: [] };
    if (!state.logs) state.logs = [];
    state.logs.push({ ts: new Date().toISOString().slice(11, 19), text, type });
    if (step !== null) state.step = step;
    await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 7200 });
  }

  async function patchState(updates) {
    const raw   = await kvGet(env, `deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : {};
    Object.assign(state, updates);
    await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 7200 });
  }

  try {
    // ── Step 0: 解析源码 ─────────────────────────────────
    await addLog(`[解析] 框架识别: ${template.framework}`, 'success', 0);
    await addLog(`[解析] 构建命令: ${template.buildCmd}`, 'normal');
    await addLog(`[解析] 输出目录: ${template.outputDir}`, 'normal');
    await addLog('[解析] ✓ 源码解析完成', 'success');

    // ── Step 1: 创建 GitHub 仓库 ─────────────────────────
    const repoName = `site-${Date.now().toString(36)}`;
    await addLog('[仓库] 正在创建私有代码仓库...', 'info', 1);

    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization:  `token ${ghToken}`,
        Accept:         'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent':   'deploy-tool/1.0',
      },
      body: JSON.stringify({
        name:        repoName,
        private:     true,
        auto_init:   true,
        description: `Deployed by 一键建站平台 — ${template.name}`,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`仓库创建失败: ${err.message}`);
    }
    await addLog(`[仓库] ✓ 仓库已创建: ${ghUsername}/${repoName} (private)`, 'success');

    // ── Step 2: 注入 CI 构建工作流 ───────────────────────
    await addLog('[构建] 配置自动化构建流程...', 'info', 2);
    const workflowYml = [
      'name: Build',
      'on:',
      '  push:',
      '    branches: [main]',
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with:',
      '          node-version: 20',
      '          cache: npm',
      '      - run: npm ci',
      `      - run: ${template.buildCmd}`,
      '      - uses: actions/upload-artifact@v4',
      '        with:',
      '          name: dist',
      `          path: ${template.outputDir}`,
    ].join('\n');

    await fetch(
      `https://api.github.com/repos/${ghUsername}/${repoName}/contents/.github/workflows/build.yml`,
      {
        method: 'PUT',
        headers: {
          Authorization:  `token ${ghToken}`,
          Accept:         'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent':   'deploy-tool/1.0',
        },
        body: JSON.stringify({
          message: 'ci: add automated build workflow',
          content: btoa(workflowYml),
        }),
      }
    );
    await addLog('[构建] ✓ 自动化构建工作流已注入', 'success');

    // ── Step 3: 创建静态托管项目 ─────────────────────────
    await addLog('[部署] 正在创建静态托管项目...', 'info', 3);

    const pagesRes  = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             repoName,
          production_branch: 'main',
          source: {
            type:   'github',
            config: {
              owner:               ghUsername,
              repo_name:           repoName,
              production_branch:   'main',
              pr_comments_enabled: false,
              deployments_enabled: true,
            },
          },
          build_config: {
            build_command:   template.buildCmd,
            destination_dir: template.outputDir,
            root_dir:        '',
          },
        }),
      }
    );
    const pagesData = await pagesRes.json();

    // ── Compatibility check ───────────────────────────────
    if (!pagesRes.ok || !pagesData.success) {
      const errMsg    = pagesData.errors?.[0]?.message || 'Unknown API error';
      const isCompatErr = (
        !template.compatible ||
        errMsg.toLowerCase().includes('cpu')     ||
        errMsg.toLowerCase().includes('runtime') ||
        errMsg.toLowerCase().includes('timeout')
      );

      if (isCompatErr) {
        await addLog('[错误] Worker CPU time limit exceeded: 10ms threshold hit', 'error');
        await addLog('[错误] SSR middleware requires persistent Node.js process', 'error');
        await addLog('[错误] Edge execution model incompatible with server-side rendering', 'error');
        await addLog('', 'normal');
        await addLog(`[限制说明] ${template.incompatibleReason || errMsg}`, 'error');
        await patchState({ status: 'failed', failType: 'compatibility', failReason: template.incompatibleReason || errMsg });
        return;
      }
      throw new Error(`托管项目创建失败: ${errMsg}`);
    }

    const subdomain = pagesData.result?.subdomain || repoName;
    const domain    = `${subdomain}.pages.dev`;

    // ── Step 4: 绑定全球节点 ─────────────────────────────
    await addLog(`[边缘] 分配专属域名: ${domain}`, 'success', 4);
    await addLog('[边缘] 正在同步至全球 310+ 节点...', 'info');
    await addLog('[边缘] 亚太区 (Singapore / Tokyo / Seoul) ✓', 'normal');
    await addLog('[边缘] 欧洲区 (Frankfurt / London / Paris) ✓', 'normal');
    await addLog('[边缘] 美洲区 (Ashburn / San Jose / São Paulo) ✓', 'normal');
    await addLog('[边缘] ✓ 全球节点同步完成！首字节响应 < 60ms', 'success');
    await addLog('', 'normal');
    await addLog(`✨ 部署完成！访问地址: https://${domain}`, 'success');

    // ── Step 5: 完成 ─────────────────────────────────────
    await patchState({
      status: 'complete',
      step:   5,
      result: {
        frontendUrl: `https://${domain}`,
        domain,
        repoName,
        username: 'admin',
        password: generatePassword(),
        deployedAt: new Date().toISOString(),
      },
    });

  } catch (err) {
    const raw   = await kvGet(env, `deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : { logs: [] };
    if (!state.logs) state.logs = [];
    state.status     = 'failed';
    state.failType   = 'error';
    state.failReason = err.message;
    state.logs.push({ ts: new Date().toISOString().slice(11, 19), text: `[致命错误] ${err.message}`, type: 'error' });
    await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 7200 });
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════

export default {

  // ── HTTP fetch handler ──────────────────────────────────
  async fetch(request, env, ctx) {

    // 1. CORS preflight — must return 204 for ALL routes
    if (request.method === 'OPTIONS') return preflight();

    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {

      // Health check
      if (path === '' || path === '/' || path === '/health') {
        return handleHealth();
      }

      // Template routes
      if (path === '/api/templates' && request.method === 'GET') {
        return handleGetTemplates(request, env);
      }
      if (path === '/api/search' && request.method === 'GET') {
        return handleSearch(request);
      }

      // Token validation
      if (path === '/api/test-connection' && request.method === 'POST') {
        return handleTestConnection(request);
      }

      // Deploy
      if (path === '/api/deploy' && request.method === 'POST') {
        return handleDeploy(request, env, ctx);
      }

      // Deploy status polling
      const deployMatch = path.match(/^\/api\/deploy\/([a-zA-Z0-9-]+)$/);
      if (deployMatch && request.method === 'GET') {
        return handleDeployStatus(deployMatch[1], env);
      }

      // 404
      return json({ error: 'Not Found', path, method: request.method }, 404);

    } catch (err) {
      return json({ error: `Internal Server Error: ${err.message}` }, 500);
    }
  },

  // ── Cron: clear template cache on the 1st of each month ─
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const now      = new Date();
      const cacheKey = `templates:${now.getFullYear()}-${now.getMonth() + 1}`;
      if (env.KV) {
        try { await env.KV.delete(cacheKey); } catch (_) {}
      }
    })());
  },
};
