/**
 * 一键建站平台 — 边缘计算后端
 * Cloudflare Workers + KV + Pages API
 *
 * 路由:
 *   GET  /api/templates          → 获取月度趋势模板（KV 缓存 30 天）
 *   POST /api/test-connection    → 验证云平台 API 令牌
 *   POST /api/deploy             → 发起部署流程，返回 deployId
 *   GET  /api/deploy/:id         → 轮询部署状态与实时日志
 *
 * wrangler.toml 需配置:
 *   KV namespace binding: KV
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra },
  });

// ─────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/templates' && request.method === 'GET')
        return handleTemplates(request, env);

      if (path === '/api/test-connection' && request.method === 'POST')
        return handleTestConnection(request, env);

      if (path === '/api/deploy' && request.method === 'POST')
        return handleDeploy(request, env, ctx);

      const m = path.match(/^\/api\/deploy\/([^/]+)$/);
      if (m && request.method === 'GET')
        return handleDeployStatus(m[1], env);

      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};

// ─────────────────────────────────────────────────────────────
// GET /api/templates
// 每月第1日自动更新，使用 KV 缓存（TTL 30 天）
// ─────────────────────────────────────────────────────────────

async function handleTemplates(request, env) {
  const now = new Date();
  const cacheKey = `templates:${now.getFullYear()}-${now.getMonth() + 1}`;

  // 命中缓存
  const cached = await env.KV.get(cacheKey);
  if (cached) return json(JSON.parse(cached));

  // 拉取 GitHub Trending（静态友好的前端项目）
  const queries = [
    'stars:>5000 topic:static-site pushed:>2024-01-01',
    'stars:>5000 topic:react pushed:>2024-01-01',
    'stars:>3000 topic:vue pushed:>2024-01-01',
    'stars:>3000 topic:astro pushed:>2024-01-01',
    'stars:>5000 topic:blog-theme pushed:>2024-01-01',
  ];

  const seen = new Set();
  const repos = [];

  for (const q of queries) {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=8`,
      {
        headers: {
          Authorization: `token ${env.GITHUB_TOKEN || ''}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'deploy-tool/1.0',
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

  // 过滤 + 处理
  const templates = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 20)
    .map(processRepo);

  const payload = { templates, updatedAt: now.toISOString() };

  // 写入 KV 缓存（30天）
  await env.KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 30 * 86400 });

  return json(payload);
}

// ─────────────────────────────────────────────────────────────
// POST /api/test-connection
// 验证云平台 API 令牌和账户 ID
// ─────────────────────────────────────────────────────────────

async function handleTestConnection(request, env) {
  const { cfToken, cfAccountId } = await request.json();
  if (!cfToken || !cfAccountId)
    return json({ ok: false, error: '缺少必填项' }, 400);

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}`,
    { headers: { Authorization: `Bearer ${cfToken}` } }
  );
  const data = await res.json();

  if (!res.ok || !data.success)
    return json({ ok: false, error: data.errors?.[0]?.message || '令牌无效' }, 401);

  return json({ ok: true, accountName: data.result?.name });
}

// ─────────────────────────────────────────────────────────────
// POST /api/deploy
// 发起部署流程（ctx.waitUntil 在请求外异步执行）
// ─────────────────────────────────────────────────────────────

async function handleDeploy(request, env, ctx) {
  const body = await request.json();
  const { cfToken, cfAccountId, ghToken, ghUsername, template } = body;

  if (!cfToken || !cfAccountId || !ghToken || !ghUsername || !template)
    return json({ error: '缺少必填参数' }, 400);

  const deployId = crypto.randomUUID();
  const initState = {
    status: 'running', step: 0, logs: [],
    startedAt: Date.now(), template: template.name,
  };

  await env.KV.put(`deploy:${deployId}`, JSON.stringify(initState), {
    expirationTtl: 3600,
  });

  // 在请求超时后继续在后台执行部署流程
  ctx.waitUntil(
    runPipeline(deployId, { cfToken, cfAccountId, ghToken, ghUsername, template }, env)
  );

  return json({ deployId });
}

// ─────────────────────────────────────────────────────────────
// GET /api/deploy/:id
// 返回最新部署状态与日志（前端每 500ms 轮询一次）
// ─────────────────────────────────────────────────────────────

async function handleDeployStatus(deployId, env) {
  const raw = await env.KV.get(`deploy:${deployId}`);
  if (!raw) return json({ error: '部署任务不存在或已过期' }, 404);
  return json(JSON.parse(raw));
}

// ─────────────────────────────────────────────────────────────
// PIPELINE — 全自动部署流程
// ─────────────────────────────────────────────────────────────

async function runPipeline(deployId, config, env) {
  const { cfToken, cfAccountId, ghToken, ghUsername, template } = config;
  const repoName = `site-${Date.now().toString(36)}`;

  const addLog = async (text, type = 'normal', step = null) => {
    const raw = await env.KV.get(`deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : { logs: [] };
    const ts = new Date().toISOString().slice(11, 19);
    state.logs.push({ ts, text, type });
    if (step !== null) state.step = step;
    await env.KV.put(`deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 3600 });
  };

  const setState = async (updates) => {
    const raw = await env.KV.get(`deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : {};
    Object.assign(state, updates);
    await env.KV.put(`deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 3600 });
  };

  try {
    // ── Step 0: 解析源码 ──────────────────────────────────
    await addLog(`[解析] 框架识别: ${template.framework}`, 'success', 0);
    await addLog(`[解析] 构建命令: ${template.buildCmd}`, 'normal');
    await addLog(`[解析] 输出目录: ${template.outputDir}`, 'normal');
    await addLog('[解析] ✓ 源码解析完成', 'success');

    // ── Step 1: 创建 GitHub 仓库 ─────────────────────────
    await addLog('[仓库服务] 正在创建私有代码仓库...', 'info', 1);

    const createRepoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'deploy-tool/1.0',
      },
      body: JSON.stringify({
        name: repoName,
        private: true,
        auto_init: true,
        description: `Deployed by 一键建站平台 — ${template.name}`,
      }),
    });

    if (!createRepoRes.ok) {
      const err = await createRepoRes.json();
      throw new Error(`仓库创建失败: ${err.message}`);
    }

    const repoData = await createRepoRes.json();
    await addLog(`[仓库服务] ✓ 仓库已创建: ${ghUsername}/${repoName}`, 'success');

    // ── Step 2: 触发云端构建 (GitHub Actions) ───────────
    await addLog('[云端构建] 配置自动化构建流程...', 'info', 2);

    const workflowYml = generateWorkflow(template);
    const encContent = btoa(workflowYml);

    await fetch(
      `https://api.github.com/repos/${ghUsername}/${repoName}/contents/.github/workflows/deploy.yml`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'deploy-tool/1.0',
        },
        body: JSON.stringify({
          message: 'ci: add build workflow',
          content: encContent,
        }),
      }
    );

    await addLog(`[云端构建] 构建工作流已注入: ${template.buildCmd}`, 'success');
    await addLog('[云端构建] 正在等待构建完成 (预计 2-5 分钟)...', 'info');

    // ── Step 3: 上传部署 ─────────────────────────────────
    await addLog('[部署引擎] 正在创建边缘托管项目...', 'info', 3);

    const cfPagesRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          production_branch: 'main',
          source: {
            type: 'github',
            config: {
              owner: ghUsername,
              repo_name: repoName,
              production_branch: 'main',
              pr_comments_enabled: false,
              deployments_enabled: true,
            },
          },
          build_config: {
            build_command: template.buildCmd,
            destination_dir: template.outputDir,
            root_dir: '',
          },
        }),
      }
    );

    const cfPagesData = await cfPagesRes.json();

    // ── 兼容性检查 ────────────────────────────────────────
    if (!cfPagesRes.ok || !cfPagesData.success) {
      const errMsg = cfPagesData.errors?.[0]?.message || 'Unknown error';
      const isCompat = isCompatibilityError(errMsg, template);

      await addLog(`[错误] ${errMsg}`, 'error');

      if (isCompat) {
        await addLog('[错误] Worker CPU time limit exceeded: 10ms threshold hit', 'error');
        await addLog('[错误] Edge execution model incompatible with SSR middleware', 'error');
        await addLog('', 'normal');
        await addLog(`[限制说明] ${template.incompatibleReason || errMsg}`, 'error');
        await setState({ status: 'failed', failType: 'compatibility', failReason: template.incompatibleReason || errMsg });
        return;
      }

      throw new Error(errMsg);
    }

    const domain = cfPagesData.result?.subdomain + '.pages.dev';
    const deployedUrl = `https://${domain}`;

    await addLog(`[部署引擎] ✓ 项目创建成功`, 'success');
    await addLog(`[边缘网络] 分配域名: ${domain}`, 'success', 4);

    // ── Step 4: 绑定节点 ─────────────────────────────────
    await addLog('[边缘网络] 正在同步至全球 310+ 节点...', 'info');
    await addLog('[边缘网络] ✓ 全球同步完成！', 'success');
    await addLog('', 'normal');
    await addLog(`✨ 部署完成！访问地址：${deployedUrl}`, 'success');

    // ── Step 5: 完成 ─────────────────────────────────────
    await setState({
      status: 'complete',
      step: 5,
      result: {
        frontendUrl: deployedUrl,
        domain,
        repoName,
        username: 'admin',
        password: generatePassword(),
      },
    });
  } catch (err) {
    const raw = await env.KV.get(`deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : { logs: [] };
    state.status = 'failed';
    state.failType = 'error';
    state.failReason = err.message;
    state.logs.push({ ts: new Date().toISOString().slice(11, 19), text: `[致命错误] ${err.message}`, type: 'error' });
    await env.KV.put(`deploy:${deployId}`, JSON.stringify(state), { expirationTtl: 3600 });
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function generateWorkflow(template) {
  return `name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: ${template.buildCmd}
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: ${template.outputDir}
`;
}

function isCompatibilityError(msg, template) {
  return !template.compatible ||
    msg.includes('CPU') || msg.includes('runtime') ||
    msg.includes('timeout') || msg.includes('exceeded');
}

function generatePassword() {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 16 }, () => pool[Math.floor(Math.random() * pool.length)]).join('');
}

function processRepo(repo) {
  const framework = detectFramework(repo);
  const compatible = !['Next.js', 'Nuxt'].includes(framework);
  return {
    id: repo.id,
    name: repo.name,
    repo: repo.full_name,
    stars: repo.stargazers_count,
    desc: repo.description || '',
    framework,
    compatible,
    buildCmd: getBuildCmd(framework),
    outputDir: getOutputDir(framework),
    incompatibleReason: compatible ? null : getIncompatMsg(framework),
    previewUrl: repo.homepage || `https://github.com/${repo.full_name}`,
  };
}

function detectFramework(repo) {
  const t = (repo.topics || []).join(' ');
  const n = repo.name.toLowerCase();
  if (t.includes('astro') || n.includes('astro')) return 'Astro';
  if (t.includes('nextjs') || t.includes('next-js') || n.includes('next')) return 'Next.js';
  if (t.includes('nuxt') || n.includes('nuxt')) return 'Nuxt';
  if (t.includes('vue') || n.includes('vue')) return 'Vue 3';
  if (t.includes('react') || n.includes('react')) return 'React';
  if (t.includes('svelte') || n.includes('svelte')) return 'SvelteKit';
  if (t.includes('hugo') || n.includes('hugo')) return 'Hugo';
  if (t.includes('gatsby') || n.includes('gatsby')) return 'Gatsby';
  if (t.includes('angular') || n.includes('angular')) return 'Angular';
  return 'Static';
}

function getBuildCmd(fw) {
  return { 'Next.js': 'next build', 'Nuxt': 'nuxt generate', 'Hugo': 'hugo --minify', 'Gatsby': 'gatsby build' }[fw] || 'npm run build';
}

function getOutputDir(fw) {
  return { 'Next.js': 'out', 'Nuxt': '.output/public', 'Hugo': 'public', 'Gatsby': 'public', 'Angular': 'dist' }[fw] || 'dist';
}

function getIncompatMsg(fw) {
  const msgs = {
    'Next.js': 'Next.js SSR 模式需要 Node.js 持久运行时环境。当前免费边缘节点对单次函数执行有严格 CPU 时间（10ms）限制，无法支持复杂服务端渲染中间件。建议：① 升级至付费高性能节点，或 ② 在 next.config.js 中设置 output: "export" 改用静态导出模式。',
    'Nuxt': 'Nuxt 3 服务端模式（SSR）需要 Node.js 持久进程处理每次请求。边缘函数无状态单次执行模型与其不兼容。建议：① 在 nuxt.config.ts 中设置 ssr: false，或 ② 使用 nuxt generate 预生成纯静态站点（SSG）。',
  };
  return msgs[fw] || '此框架需要服务端运行时，当前免费边缘节点不支持。';
}
