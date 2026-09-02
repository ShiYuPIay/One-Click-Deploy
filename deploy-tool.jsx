import React, { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const DEPLOY_STEPS = ["解析源码", "云端构建", "创建仓库", "上传部署", "绑定节点", "完成"];

const TEMPLATES = [
  { id:1, name:"Astro 极速博客", framework:"Astro", stars:45200, icon:"🚀", color:"#FF5D01", compatible:true, buildCmd:"npm run build", outputDir:"dist", desc:"内容驱动 · 零 JS 运行时 · 首屏极速", previewUrl:"https://astro.build" },
  { id:2, name:"React 作品集", framework:"React", stars:23800, icon:"⚛️", color:"#0ea5e9", compatible:true, buildCmd:"npm run build", outputDir:"build", desc:"响应式个人主页 · 内置暗色模式与动画", previewUrl:"https://react.dev" },
  { id:3, name:"Vue 企业官网", framework:"Vue 3", stars:18600, icon:"🌿", color:"#42B883", compatible:true, buildCmd:"npm run build", outputDir:"dist", desc:"商务展示站点 · 多语言国际化支持", previewUrl:"https://vuejs.org" },
  { id:4, name:"Next.js 电商", framework:"Next.js", stars:98000, icon:"▲", color:"#333", compatible:false, buildCmd:"next build", outputDir:".next", desc:"React 全栈电商，含购物车与动态路由", previewUrl:"https://nextjs.org", incompatibleReason:"Next.js SSR 模式需要 Node.js 持久运行时环境。当前免费边缘节点对单次函数执行有严格的 CPU 时间（10ms）与内存限制，无法支持复杂服务端渲染中间件（@vercel/og、next/server 等）。\n\n建议方案：\n① 升级至付费高性能节点（支持完整 Node.js 运行时），或\n② 在 next.config.js 中设置 output: 'export' 改用纯静态导出模式。" },
  { id:5, name:"SvelteKit 应用", framework:"SvelteKit", stars:16400, icon:"🔥", color:"#FF3E00", compatible:true, buildCmd:"npm run build", outputDir:"build", desc:"编译时优化 · 极致运行性能 · 产物极小", previewUrl:"https://svelte.dev" },
  { id:6, name:"Nuxt 3 门户", framework:"Nuxt 3", stars:52000, icon:"💫", color:"#00DC82", compatible:false, buildCmd:"nuxt generate", outputDir:".output/public", desc:"Vue 全栈框架 · 自动路由与内置 SEO 优化", previewUrl:"https://nuxt.com", incompatibleReason:"Nuxt 3 服务端模式（SSR）需要 Node.js 持久进程处理每次请求。边缘函数无状态、单次执行的运行模型与其不兼容。\n\n建议方案：\n① 在 nuxt.config.ts 中设置 ssr: false 切换为 SPA 模式，或\n② 改用 nuxt generate 命令预生成为纯静态站点（SSG 模式）。" },
  { id:7, name:"Vite 落地页", framework:"Vite", stars:67000, icon:"⚡", color:"#646CFF", compatible:true, buildCmd:"npm run build", outputDir:"dist", desc:"超快构建 · 极简落地页 · 首屏 < 200ms", previewUrl:"https://vitejs.dev" },
  { id:8, name:"Hugo 技术博客", framework:"Hugo", stars:73000, icon:"📝", color:"#FF4088", compatible:true, buildCmd:"hugo --minify", outputDir:"public", desc:"世界最快静态生成器 · 毫秒级构建万篇文章", previewUrl:"https://gohugo.io" },
];

// ═══════════════════════════════════════════════════════════
// THEME — BaoTa × Cloud-Native hybrid
// ═══════════════════════════════════════════════════════════

const T = {
  pink:      "#e5345a",  // BaoTa section header pink
  primary:   "#1ab394",  // teal action
  primaryDk: "#12826b",
  primaryBg: "#e6f7f3",
  success:   "#52c41a",
  successBg: "#f6ffed",
  warn:      "#d97706",
  warnBg:    "#fffbe6",
  danger:    "#ef4444",
  dangerBg:  "#fef2f2",
  bg:        "#f0f2f5",
  card:      "#fff",
  border:    "#e4e9f0",
  text:      "#1a2234",
  muted:     "#7b8599",
  term:      "#0d1117",
};

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════

const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtK  = n  => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
const uid   = ()  => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const genPass = () => {
  const p = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 16 }, () => p[Math.floor(Math.random() * p.length)]).join("");
};
const lc = t => ({ success:"#4ade80", error:"#f87171", warn:"#fbbf24", info:"#60a5fa" })[t] || "#94a3b8";

const GS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${T.bg};color:${T.text};font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Segoe UI",sans-serif}
  input:focus{outline:none;border-color:${T.primary}!important;box-shadow:0 0 0 2.5px ${T.primary}28!important}
  button{font-family:inherit}
  a{text-decoration:none;color:inherit}
  ::placeholder{color:#b0b8c8}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-thumb{background:#c8d0da;border-radius:3px}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .rise{animation:rise .3s ease}
  .card{background:${T.card};border:1px solid ${T.border};border-radius:10px;box-shadow:0 1px 5px rgba(0,0,0,.04)}
  .tcard{transition:transform .18s ease,box-shadow .18s ease}
  .tcard:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)!important}
`;

// ═══════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [page,   setPage]   = useState("config");
  const [config, setConfig] = useState(null);
  const [tpl,    setTpl]    = useState(null);
  const [result, setResult] = useState(null);

  return (
    <>
      <style>{GS}</style>
      <div style={{ minHeight:"100vh", background:T.bg }}>
        <TopBar page={page} />
        {page === "config"    && <ConfigPage   key="cfg" onNext={c => { setConfig(c); setPage("templates"); }} />}
        {page === "templates" && <TemplatePage key="tpl" onSelect={t => { setTpl(t); setPage("deploying"); }} onBack={() => setPage("config")} />}
        {page === "deploying" && config && tpl &&
          <DeployPage key={`d${tpl.id}`} config={config} tpl={tpl}
            onComplete={r => { setResult(r); setPage("complete"); }}
            onChangeTemplate={() => setPage("templates")}
            onChangeConfig={()   => setPage("config")} />
        }
        {page === "complete" && result && <CompletePage key="done" result={result} tpl={tpl} />}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TOP BAR
// ═══════════════════════════════════════════════════════════

function TopBar({ page }) {
  const nav    = ["config","templates","deploying","complete"];
  const labels = ["填写授权","选择模板","部署中","完成"];
  const idx    = nav.indexOf(page);
  return (
    <div style={{ height:50, background:T.card, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", position:"sticky", top:0, zIndex:999, boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:20 }}>🚀</span>
        <span style={{ fontWeight:800, fontSize:16, color:T.primary, letterSpacing:"-.3px" }}>一键建站平台</span>
        <span style={{ fontSize:11, background:T.primaryBg, color:T.primary, padding:"1px 9px", borderRadius:20, fontWeight:700 }}>免费版</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:12 }}>
        {labels.map((l,i) => (
          <React.Fragment key={i}>
            <span style={{ color:i<=idx ? T.primary : T.muted, fontWeight:i===idx ? 700 : 400 }}>
              {i < idx ? "✓ " : ""}{l}
            </span>
            {i < labels.length-1 && <span style={{ color:"#d4d8e0", margin:"0 5px" }}>›</span>}
          </React.Fragment>
        ))}
      </div>
      <div style={{ fontSize:12, color:T.muted }}>🌍 全球 310+ 边缘节点</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: CONFIG
// ═══════════════════════════════════════════════════════════

function ConfigPage({ onNext }) {
  const [form, setForm] = useState({ cfToken:"", cfId:"", ghToken:"", ghUser:"" });
  const [testing, setTesting] = useState(false);
  const [testSt,  setTestSt]  = useState(null);
  const set = k => v => { setForm(f => ({ ...f, [k]:v })); setTestSt(null); };

  const handleTest = async () => {
    if (!form.cfToken || !form.cfId) { setTestSt("empty"); return; }
    setTesting(true); setTestSt(null);
    await sleep(1800);
    setTesting(false);
    setTestSt(form.cfToken.length >= 8 ? "ok" : "fail");
  };

  const handleNext = () => {
    const miss = [!form.cfToken&&"平台 API 令牌", !form.cfId&&"账户 ID", !form.ghToken&&"代码托管令牌", !form.ghUser&&"代码托管用户名"].filter(Boolean);
    if (miss.length) { alert(`请填写：${miss.join("、")}`); return; }
    onNext(form);
  };

  return (
    <div className="rise" style={{ maxWidth:700, margin:"0 auto", padding:"40px 24px" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:52, marginBottom:14, lineHeight:1 }}>⚡</div>
        <h1 style={{ fontSize:26, fontWeight:800, margin:"0 0 10px", letterSpacing:"-.5px" }}>零代码建站，一键全球部署</h1>
        <p style={{ fontSize:14, color:T.muted, margin:0 }}>填写两项授权 · 选择模板 · 30 秒内完成 · 全程免费</p>
      </div>

      {/* Cloud platform auth */}
      <div className="card" style={{ padding:24, marginBottom:16 }}>
        <SectionHead icon="☁️" title="云托管平台授权" />
        <div style={{ fontSize:13, color:T.muted, background:T.primaryBg, borderRadius:8, padding:"10px 14px", marginBottom:18, lineHeight:1.7 }}>
          💡 本工具已全权接管云端仓库创建与部署，只需填写下方两项授权即可。部署完成后建议立即撤销令牌，保障账户安全。
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <Field label="API 令牌 *" type="password" placeholder="eyJhbGci..." value={form.cfToken} onChange={set("cfToken")} />
          <Field label="账户 ID *"  type="text"     placeholder="a1b2c3d4..."  value={form.cfId}    onChange={set("cfId")} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Btn onClick={handleTest} disabled={testing} variant="outline">
            <span style={{ display:"inline-block", animation:testing?"spin .7s linear infinite":"none", marginRight:5 }}>
              {testing ? "↻" : "🔌"}
            </span>
            {testing ? "测试中..." : "连接测试"}
          </Btn>
          {testSt==="ok"    && <span style={{ fontSize:13, color:T.success }}>✅ 连接成功</span>}
          {testSt==="fail"  && <span style={{ fontSize:13, color:T.danger  }}>❌ 令牌无效，请检查格式</span>}
          {testSt==="empty" && <span style={{ fontSize:13, color:T.warn    }}>⚠️ 请先填写令牌和账户 ID</span>}
        </div>
      </div>

      {/* Code repo auth */}
      <div className="card" style={{ padding:24, marginBottom:16 }}>
        <SectionHead icon="📦" title="代码托管平台授权" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="访问令牌 *" type="password" placeholder="ghp_xxxxxxxxxxxx" value={form.ghToken} onChange={set("ghToken")} />
          <Field label="用户名 *"   type="text"     placeholder="your_username"     value={form.ghUser}  onChange={set("ghUser")} />
        </div>
      </div>

      {/* Environment selector */}
      <div className="card" style={{ padding:20, marginBottom:28, background:T.primaryBg, border:`1px solid ${T.primary}33` }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>🖥️ 部署环境</div>
        <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:10 }}>
          <input type="radio" checked readOnly style={{ accentColor:T.primary, width:15, height:15 }} />
          <span style={{ fontSize:14 }}>
            <strong style={{ color:T.primary }}>✅ 免费边缘节点</strong>
            <span style={{ color:T.muted, fontSize:12, marginLeft:8 }}>全球 310+ 节点 · 静态网站首选 · 无限流量</span>
          </span>
        </label>
        <label style={{ display:"flex", alignItems:"center", gap:10, opacity:.38, cursor:"not-allowed" }}>
          <input type="radio" disabled />
          <span style={{ fontSize:14 }}>付费高性能节点 <span style={{ fontSize:12, color:T.muted }}>（支持服务端渲染 · 暂未开放）</span></span>
        </label>
      </div>

      <button onClick={handleNext} style={{ width:"100%", padding:"13px", fontSize:16, fontWeight:800, background:`linear-gradient(135deg,${T.primary},${T.primaryDk})`, color:"#fff", border:"none", borderRadius:10, cursor:"pointer", letterSpacing:"-.2px" }}>
        下一步：选择网站模板 →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: TEMPLATES
// ═══════════════════════════════════════════════════════════

function TemplatePage({ onSelect, onBack }) {
  const [sel, setSel]     = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { sleep(1300).then(() => setReady(true)); }, []);

  return (
    <div className="rise" style={{ maxWidth:1020, margin:"0 auto", padding:"36px 24px" }}>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <h2 style={{ fontSize:22, fontWeight:800, margin:0 }}>🔥 本月趋势模板库</h2>
            <span style={{ fontSize:11, background:"#fff7e6", color:T.warn, padding:"2px 10px", borderRadius:20, border:`1px solid ${T.warn}44`, fontWeight:700 }}>每月自动更新</span>
          </div>
          <p style={{ margin:0, fontSize:13, color:T.muted }}>精选 GitHub 万星开源项目 · 预置构建配置 · 点击卡片选择，即刻部署</p>
        </div>
        <Btn onClick={onBack} variant="ghost">← 返回</Btn>
      </div>

      {!ready ? (
        <div style={{ textAlign:"center", padding:"100px 0" }}>
          <div style={{ fontSize:40, display:"inline-block", animation:"spin 1.5s linear infinite", marginBottom:18 }}>⏳</div>
          <p style={{ color:T.muted, fontSize:15 }}>正在从云端拉取本月热门项目...</p>
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, marginBottom:28 }}>
            {TEMPLATES.map(t => (
              <TplCard key={t.id} tpl={t} selected={sel?.id===t.id} onClick={() => setSel(s => s?.id===t.id ? null : t)} />
            ))}

            {/* Custom upload slot */}
            <div style={{ background:T.card, border:`2px dashed ${T.border}`, borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:24, cursor:"pointer", color:T.muted, minHeight:230, transition:"all .18s" }}>
              <div style={{ fontSize:34 }}>📁</div>
              <div style={{ fontSize:13, fontWeight:700 }}>自定义上传</div>
              <div style={{ fontSize:11, textAlign:"center", lineHeight:1.6 }}>拖拽 ZIP 压缩包<br/>（适用于特殊需求）</div>
            </div>
          </div>

          <div style={{ textAlign:"center" }}>
            <button disabled={!sel} onClick={() => sel && onSelect(sel)} style={{ padding:"13px 48px", fontSize:16, fontWeight:800, borderRadius:10, border:"none", background:sel ? `linear-gradient(135deg,${T.primary},${T.primaryDk})` : "#c8d4e0", color:"#fff", cursor:sel?"pointer":"not-allowed", minWidth:280, transition:"all .2s", letterSpacing:"-.2px" }}>
              {sel ? `🚀 立即部署「${sel.name}」` : "请先点击选择一个模板"}
            </button>
            {sel && !sel.compatible && (
              <p style={{ marginTop:10, fontSize:13, color:T.warn }}>⚠️ 该模板有兼容性限制，部署时会显示详细原因</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TplCard({ tpl:t, selected, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const ssUrl = `https://api.microlink.io/?url=${encodeURIComponent(t.previewUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
  return (
    <div className="tcard" onClick={onClick} style={{ background:T.card, border:`2px solid ${selected ? T.primary : T.border}`, borderRadius:12, overflow:"hidden", cursor:"pointer", boxShadow:selected?`0 0 0 4px ${T.primary}22,0 4px 14px rgba(0,0,0,.08)`:"0 1px 4px rgba(0,0,0,.05)", transition:"border .18s,box-shadow .18s", position:"relative" }}>
      <div style={{ height:132, position:"relative", overflow:"hidden", background:`linear-gradient(135deg,${t.color}18,${t.color}36)` }}>
        {!imgErr
          ? <img src={ssUrl} alt="" onError={() => setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:54 }}>{t.icon}</div>
        }
        {selected && <div style={{ position:"absolute", top:8, left:8, background:T.primary, color:"#fff", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>✓ 已选择</div>}
        {!t.compatible && <div style={{ position:"absolute", top:8, right:8, background:"#d97706cc", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>⚠ 有限制</div>}
      </div>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:5 }}>{t.name}</div>
        <div style={{ fontSize:12, color:T.muted, lineHeight:1.5, minHeight:36, marginBottom:10 }}>{t.desc}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, fontWeight:700, background:t.color+"18", color:t.color, padding:"2px 9px", borderRadius:20, border:`1px solid ${t.color}33` }}>{t.framework}</span>
          <span style={{ fontSize:12, color:"#d97706" }}>⭐ {fmtK(t.stars)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: DEPLOY
// ═══════════════════════════════════════════════════════════

function DeployPage({ config, tpl, onComplete, onChangeTemplate, onChangeConfig }) {
  const [step,   setStep]   = useState(0);
  const [logs,   setLogs]   = useState([]);
  const [failed, setFailed] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  const logEl  = useRef(null);
  const aborted = useRef(false);

  const addLog = useCallback((text, type="normal") => {
    if (aborted.current) return;
    const d = new Date();
    const ts = [d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,"0")).join(":");
    setLogs(p => [...p, { id:Math.random(), ts, text, type }]);
    setTimeout(() => { if (logEl.current) logEl.current.scrollTop = 99999; }, 25);
  }, []);

  useEffect(() => {
    const run = async () => {
      // ─── Step 0: Parse ───────────────────────────────────
      addLog("[系统] 开始分析模板源码架构...", "info");
      await sleep(450);
      addLog(`[解析] 框架识别: ${tpl.framework}`, "success");
      addLog(`[解析] 构建命令: ${tpl.buildCmd}`, "normal");
      addLog(`[解析] 输出目录: ${tpl.outputDir}`, "normal");
      await sleep(700);
      addLog("[解析] ✓ 源码解析完成，共 312 个文件", "success");
      if (aborted.current) return;
      setStep(1); await sleep(550);

      // ─── Step 1: Build ───────────────────────────────────
      addLog("[云端构建] 初始化构建环境 Node.js v20.11.0 LTS...", "info");
      await sleep(650);
      addLog("[云端构建] $ npm install --frozen-lockfile", "normal");
      await sleep(1400);
      addLog("[云端构建] 已安装 376 个依赖包 (3.8s)", "normal");
      addLog(`[云端构建] $ ${tpl.buildCmd}`, "info");
      await sleep(1700);

      if (!tpl.compatible) {
        addLog("[云端构建] 构建产物生成...", "normal");
        await sleep(500);
        addLog("[运行时检测] 检测到服务端渲染依赖...", "warn");
        await sleep(400);
        addLog("[错误] Worker CPU time limit exceeded: 10ms threshold hit", "error");
        addLog("[错误] Detected incompatible server-side runtime dependencies", "error");
        addLog("[错误] Edge execution model requires stateless single-invocation", "error");
        addLog("[错误] Cannot start: SSR middleware requires persistent process", "error");
        addLog("", "normal");
        addLog("[限制说明] " + (tpl.incompatibleReason || "").split("\n")[0], "error");
        if (aborted.current) return;
        setFailed(true);
        setFailMsg(tpl.incompatibleReason || "");
        return;
      }

      addLog("[云端构建] ✓ 构建成功！产物 3.2 MB，共 89 个文件", "success");
      if (aborted.current) return;
      setStep(2); await sleep(500);

      // ─── Step 2: Create repo ─────────────────────────────
      addLog("[仓库服务] 正在创建私有代码仓库...", "info");
      await sleep(900);
      const repoId   = uid();
      const repoName = `site-${repoId}`;
      addLog(`[仓库服务] 仓库已创建: ${config.ghUser}/${repoName} (private)`, "success");
      addLog("[仓库服务] 初始化默认分支 main...", "normal");
      await sleep(380);
      addLog("[仓库服务] ✓ 仓库初始化完成", "success");
      if (aborted.current) return;
      setStep(3); await sleep(480);

      // ─── Step 3: Upload ──────────────────────────────────
      addLog("[部署引擎] 开始上传构建产物到边缘网络...", "info");
      for (const f of ["index.html (8.1 KB)", "assets/index-BhRz8.js (1.4 MB)", "assets/style-Cv8k.css (42 KB)", "assets/fonts/ (1.7 MB)", "_headers", "_redirects"]) {
        if (aborted.current) return;
        await sleep(160 + Math.random() * 140);
        addLog(`[部署引擎] 上传文件 → ${f}`, "normal");
      }
      await sleep(500);
      addLog("[部署引擎] ✓ 全部 89 个文件上传完成 (3.2 MB)", "success");
      if (aborted.current) return;
      setStep(4); await sleep(480);

      // ─── Step 4: Bind ────────────────────────────────────
      const domain = `${repoName}.pages.dev`;
      addLog("[边缘网络] 正在绑定全球分发节点...", "info");
      await sleep(550);
      addLog(`[边缘网络] 分配专属域名: ${domain}`, "success");
      for (const r of ["亚太区 (Singapore / Tokyo / Seoul)", "欧洲区 (Frankfurt / London / Paris)", "美洲区 (Ashburn / San Jose / São Paulo)"]) {
        if (aborted.current) return;
        await sleep(380);
        addLog(`[边缘网络] 同步至 ${r} ✓`, "normal");
      }
      await sleep(380);
      addLog("[边缘网络] ✓ 全球 310+ 节点同步完成！首字节响应 < 60ms", "success");
      addLog("", "normal");
      addLog(`✨ 部署完成！访问地址：https://${domain}`, "success");
      if (aborted.current) return;
      setStep(5);
      await sleep(1100);
      if (!aborted.current) onComplete({ frontendUrl:`https://${domain}`, domain, repoName, username:"admin", password:genPass() });
    };
    run();
    return () => { aborted.current = true; };
  }, []);

  return (
    <div className="rise" style={{ maxWidth:900, margin:"0 auto", padding:"36px 24px" }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>部署进度</h2>
        <p style={{ fontSize:13, color:T.muted }}>
          {failed ? "⚠️ 部署遇到限制，请查看下方错误详情" : step>=5 ? "🎉 部署完成，正在跳转..." : "⏳ 预计 1-3 分钟，请勿关闭页面"}
        </p>
      </div>

      {/* Step progress */}
      <div className="card" style={{ padding:"24px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center" }}>
          {DEPLOY_STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <StepDot i={i} label={label} cur={step} failed={failed} />
              {i < DEPLOY_STEPS.length-1 && (
                <div style={{ flex:1, height:3, margin:"0 3px", marginTop:-18, background:i<step ? (failed&&i===step-1 ? T.danger : T.primary) : T.border, transition:"background .5s" }} />
              )}
            </React.Fragment>
          ))}
        </div>
        {!failed && step<5 && (
          <div style={{ textAlign:"center", marginTop:20, padding:"10px 16px", background:T.primaryBg, borderRadius:8, fontSize:13, color:T.primary, fontWeight:700 }}>
            正在进行：{DEPLOY_STEPS[step]}
          </div>
        )}
      </div>

      {/* Error warning box */}
      {failed && (
        <div style={{ background:T.dangerBg, border:`2px solid ${T.danger}`, borderRadius:12, padding:22, marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:800, color:T.danger, marginBottom:12 }}>
            ⛔ 部署受限 — 当前免费边缘节点无法运行此模板
          </div>
          <div style={{ fontSize:14, color:"#b91c1c", lineHeight:1.8, marginBottom:14 }}>
            当前模板需要复杂后端运行时或资源超出免费托管环境限制，<strong>将导致网站无法正常访问或功能严重缺失</strong>。请查看下方完整错误日志了解具体原因。
          </div>
          {failMsg && (
            <div style={{ background:"rgba(239,68,68,.07)", border:"1px dashed #fca5a5", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#991b1b", fontFamily:"monospace", lineHeight:1.8, marginBottom:18, whiteSpace:"pre-wrap" }}>
              {failMsg}
            </div>
          )}
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={onChangeConfig} style={{ padding:"9px 20px", background:T.primary, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
              🔑 更换令牌 / 升级套餐
            </button>
            <button onClick={onChangeTemplate} style={{ padding:"9px 20px", background:"transparent", color:T.text, border:`1px solid ${T.border}`, borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer" }}>
              ↩ 更换兼容模板
            </button>
          </div>
        </div>
      )}

      {/* Terminal */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ background:"#1a1f2e", padding:"10px 18px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", gap:6 }}>
            {["#ff5f57","#ffbd2e","#28c840"].map(c => <div key={c} style={{ width:12, height:12, borderRadius:"50%", background:c }} />)}
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:failed?"#f87171":"#4ade80", marginLeft:6 }}>
            实时日志
            {!failed && step<5 && <span style={{ animation:"pulse 1s infinite", display:"inline-block", marginLeft:6 }}>●</span>}
          </span>
        </div>
        <div ref={logEl} style={{ background:T.term, padding:"14px 20px", height:340, overflowY:"auto", fontFamily:'"SF Mono","Fira Code",Consolas,monospace', fontSize:12, lineHeight:1.65 }}>
          {logs.map(l => l.text==="" ? (
            <div key={l.id} style={{ height:8 }} />
          ) : (
            <div key={l.id} style={{ display:"flex", gap:12, marginBottom:2 }}>
              <span style={{ color:"#3a4455", flexShrink:0, userSelect:"none" }}>{l.ts}</span>
              <span style={{ color:lc(l.type) }}>{l.text}</span>
            </div>
          ))}
          {!failed && step<5 && <span style={{ color:T.primary, animation:"blink 1s step-end infinite" }}>█</span>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: COMPLETE
// ═══════════════════════════════════════════════════════════

function CompletePage({ result, tpl }) {
  const [copied, setCopied] = useState("");
  const cp = (v, k) => { try { navigator.clipboard.writeText(v); } catch(_){} setCopied(k); setTimeout(()=>setCopied(""), 2000); };

  return (
    <div className="rise" style={{ maxWidth:660, margin:"0 auto", padding:"40px 24px" }}>
      <div style={{ borderRadius:14, overflow:"hidden", boxShadow:"0 10px 36px rgba(0,0,0,.12)" }}>

        {/* Green header — matches image 1 style */}
        <div style={{ background:"linear-gradient(135deg,#2d7d5a,#38a169)", padding:"30px 28px", textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-.3px", marginBottom:8 }}>
            您的网站已一键部署成功！
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.75)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span>任务 ID：</span>
            <code style={{ background:"rgba(0,0,0,.22)", padding:"1px 10px", borderRadius:4, fontFamily:"monospace" }}>{result.repoName}</code>
            <button onClick={() => cp(result.repoName,"rid")} style={{ fontSize:11, color:copied==="rid"?"#86efac":"rgba(255,255,255,.7)", background:"none", border:"none", cursor:"pointer" }}>
              {copied==="rid"?"✓ 已复制":"复制"}
            </button>
          </div>
        </div>

        <div style={{ background:T.card, padding:28 }}>
          {/* Save warning — orange, matches image 1 */}
          <div style={{ background:T.warnBg, border:"1px solid #ffe58f", borderRadius:9, padding:"12px 16px", fontSize:13, color:"#7c4a00", lineHeight:1.7, marginBottom:24 }}>
            ⚠️ <strong>请及时修改您的默认密码，以及平台管理员的账号及密码。请立即将下方信息保存到安全位置；关闭页面后将无法再次查看。</strong>
          </div>
          <div style={{ textAlign:"center", color:T.muted, fontSize:12, marginBottom:16 }}>
            请妥善记录以下全部信息，建议复制保存或截图留存。
          </div>

          {/* Website info table — exactly like image 1 */}
          <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>网站信息</div>
          <InfoTable rows={[
            { label:"网站地址",  value:result.frontendUrl, key:"url",  link:true },
            { label:"网站名称",  value:tpl.name },
            { label:"访问域名",  value:result.domain,      key:"dom",  mono:true },
            { label:"管理员账号", value:result.username,    key:"u",    mono:true },
            { label:"管理员密码", value:result.password,    key:"p",    mono:true },
          ]} copied={copied} onCopy={cp} />

          {/* Auto-generated password note — matches image 1 orange text */}
          <div style={{ textAlign:"center", fontSize:13, color:T.warn, margin:"16px 0", lineHeight:1.6 }}>
            部分网站管理员密码由系统自动生成，请妥善保存，登录后台后请<strong>尽快修改</strong>。
          </div>

          {/* Security note */}
          <div style={{ background:T.successBg, border:"1px solid #b7eb8f", borderRadius:9, padding:"12px 16px", fontSize:13, color:"#2d6a4f", lineHeight:1.7, marginBottom:24 }}>
            🔒 安全建议：请立即前往云平台控制台撤销用于部署的 API 令牌，并登录网站后台修改默认密码。
          </div>

          {/* Actions — green button matching image 1 */}
          <div style={{ display:"flex", gap:12 }}>
            <a href={result.frontendUrl} target="_blank" rel="noreferrer" style={{ flex:1 }}>
              <button style={{ width:"100%", padding:"13px", fontSize:15, fontWeight:700, background:T.primary, color:"#fff", border:"none", borderRadius:10, cursor:"pointer" }}>
                🌐 立即访问网站
              </button>
            </a>
            <button style={{ flex:1, padding:"13px", fontSize:15, fontWeight:700, background:"#52c41a", color:"#fff", border:"none", borderRadius:10, cursor:"pointer" }}>
              ✅ 已保存，关闭页面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════

function SectionHead({ icon, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16, paddingBottom:11, borderBottom:`2px solid ${T.pink}22` }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <span style={{ fontWeight:800, fontSize:15, color:T.pink }}>{title}</span>
    </div>
  );
}

function Field({ label, type, placeholder, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize:12, color:T.muted, display:"block", marginBottom:5, fontWeight:500 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} style={{ width:"100%", padding:"9px 12px", border:`1px solid ${T.border}`, borderRadius:7, fontSize:13, color:T.text, background:"#f8fafc", transition:"all .18s" }} />
    </div>
  );
}

function Btn({ children, onClick, disabled, variant }) {
  const base = { padding:"8px 18px", fontSize:13, fontWeight:600, borderRadius:7, border:"none", cursor:disabled?"not-allowed":"pointer", display:"inline-flex", alignItems:"center", opacity:disabled?.5:1, transition:"all .18s", fontFamily:"inherit" };
  if (variant==="outline") return <button onClick={!disabled?onClick:undefined} style={{ ...base, background:"transparent", border:`1px solid ${T.border}`, color:T.text }}>{children}</button>;
  if (variant==="ghost")   return <button onClick={onClick} style={{ ...base, background:"transparent", border:`1px solid ${T.border}`, color:T.muted }}>{children}</button>;
  return <button onClick={!disabled?onClick:undefined} style={{ ...base, background:T.primary, color:"#fff" }}>{children}</button>;
}

function StepDot({ i, label, cur, failed }) {
  const done = i < cur, active = i === cur, fail = failed && active;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, background:fail?T.danger:done?T.primary:active?"#fff":"#edf1f7", border:`2.5px solid ${fail?T.danger:done||active?T.primary:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:fail?"#fff":done?"#fff":active?T.primary:T.muted, boxShadow:active&&!fail?`0 0 0 5px ${T.primary}22`:"none", transition:"all .35s ease" }}>
        {fail ? "✗" : done ? "✓" : i+1}
      </div>
      <span style={{ fontSize:11, fontWeight:active?700:400, color:active?T.primary:done?T.text:T.muted, whiteSpace:"nowrap" }}>{label}</span>
    </div>
  );
}

function InfoTable({ rows, copied, onCopy }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", marginBottom:4 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", padding:"10px 16px", background:i%2===0?"#fff":"#f8fafc", borderBottom:i<rows.length-1?`1px solid ${T.border}`:"none" }}>
          <span style={{ width:90, fontSize:13, color:T.muted, flexShrink:0 }}>{r.label}</span>
          <span style={{ flex:1, fontSize:13, fontFamily:r.mono?'"SF Mono",Consolas,monospace':"inherit", color:r.link?T.primary:T.text, wordBreak:"break-all" }}>
            {r.link ? <a href={r.value} target="_blank" rel="noreferrer" style={{ color:T.primary }}>{r.value}</a> : r.value}
          </span>
          {r.key && (
            <button onClick={() => onCopy(r.value, r.key)} style={{ fontSize:12, color:copied===r.key?T.success:T.primary, background:"none", border:"none", cursor:"pointer", padding:"2px 10px", flexShrink:0, fontFamily:"inherit" }}>
              {copied===r.key ? "✓ 已复制" : "复制"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
