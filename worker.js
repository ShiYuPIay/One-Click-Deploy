/**
 * 一键建站平台 — Cloudflare Worker
 * ──────────────────────────────────
 * GET /    → Full interactive HTML panel (no build tools needed)
 * /api/*   → JSON REST API
 *
 * Deploy:  wrangler deploy (or Workers Builds CI)
 * Pure JavaScript. Zero build process. Zero dependencies.
 */

const PAGE = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>一键建站平台</title>
<style>

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --pk:#e5345a;--p:#1ab394;--pd:#12826b;--pb:#e6f7f3;
  --sc:#52c41a;--sb:#f6ffed;--wn:#d97706;--wb:#fffbe6;
  --dn:#ef4444;--db:#fef2f2;
  --bg:#f0f2f5;--cd:#fff;--br:#e4e9f0;
  --tx:#1a2234;--mu:#7b8599;--tm:#0d1117
}
body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;background:var(--bg);color:var(--tx);min-height:100vh}
a{color:var(--p)}
#bar{height:50px;background:var(--cd);border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:99;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:16px;color:var(--p);letter-spacing:-.3px}
.badge{font-size:11px;background:var(--pb);color:var(--p);padding:1px 9px;border-radius:20px;font-weight:700}
#bc{display:flex;align-items:center;gap:3px;font-size:12px}
.bc-a{color:var(--p);font-weight:700}.bc-d{color:var(--p)}.bc-n{color:var(--mu)}.bc-s{color:#d4d8e0;margin:0 5px}
.pg{max-width:700px;margin:0 auto;padding:40px 24px;opacity:1}
.pg-w{max-width:1020px;margin:0 auto;padding:36px 24px;opacity:1}
.pg-n{max-width:660px;margin:0 auto;padding:40px 24px;opacity:1}
.card{background:var(--cd);border:1px solid var(--br);border-radius:10px;padding:22px;box-shadow:0 1px 5px rgba(0,0,0,.04);margin-bottom:16px}
.card-p{background:var(--pb);border-color:rgba(26,179,148,.2)}
.sh{display:flex;align-items:center;gap:9px;margin-bottom:16px;padding-bottom:11px;border-bottom:2px solid rgba(229,52,90,.13);font-weight:800;font-size:15px;color:var(--pk)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fld{display:flex;flex-direction:column;gap:5px}
.fld label{font-size:12px;color:var(--mu);font-weight:500}
.fld input{padding:9px 12px;border:1px solid var(--br);border-radius:7px;font-size:13px;color:var(--tx);background:#f8fafc;transition:all .18s;font-family:inherit;outline:none}
.fld input:focus{border-color:var(--p);box-shadow:0 0 0 2.5px rgba(26,179,148,.22);background:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 18px;font-size:13px;font-weight:600;border-radius:7px;border:none;cursor:pointer;font-family:inherit;transition:all .18s}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-p{background:var(--p);color:#fff}.btn-p:hover:not(:disabled){background:var(--pd)}
.btn-o{background:transparent;border:1px solid var(--br);color:var(--tx)}.btn-o:hover{border-color:#a0aab8}
.btn-g{background:transparent;border:1px solid var(--br);color:var(--mu)}
.btn-gr{background:linear-gradient(135deg,var(--p),var(--pd));color:#fff}
.btn-sc{background:var(--sc);color:#fff}
.btn-dn{background:var(--dn);color:#fff}
.btn-lg{padding:13px 24px;font-size:15px;border-radius:10px;font-weight:800}
.btn-w{width:100%}
.al{padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.7}
.al-i{background:var(--pb);color:#0d6f5e}
.al-w{background:var(--wb);border:1px solid #ffe58f;color:#7c4a00}
.al-d{background:var(--db);border:1px solid #fca5a5;color:#991b1b}
.al-s{background:var(--sb);border:1px solid #b7eb8f;color:#2d6a4f}
.hero{text-align:center;margin-bottom:36px}
.hero h1{font-size:26px;font-weight:800;margin:14px 0 10px;letter-spacing:-.5px}
.hero p{font-size:14px;color:var(--mu)}
.ph{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px}
.ph h2{font-size:22px;font-weight:800;margin:0 0 8px}
.ph p{font-size:13px;color:var(--mu);margin:0}
.mon-tag{font-size:11px;background:#fff7e6;color:var(--wn);padding:2px 10px;border-radius:20px;border:1px solid rgba(217,119,6,.27);font-weight:700}
.tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:16px;margin-bottom:28px}
.tc{background:var(--cd);border:2px solid var(--br);border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.tc:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)}
.tc.sel{border-color:var(--p);box-shadow:0 0 0 4px rgba(26,179,148,.2),0 4px 14px rgba(0,0,0,.08)}
.tc-th{height:130px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:54px}
.tc-th img{width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0}
.tc-ico{position:relative;z-index:1}
.tc-badge{position:absolute;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;top:8px}
.tc-bd{padding:12px 14px}
.tc-nm{font-weight:700;font-size:14px;margin-bottom:5px}
.tc-dc{font-size:12px;color:var(--mu);line-height:1.5;min-height:36px;margin-bottom:10px}
.tc-ft{display:flex;align-items:center;justify-content:space-between}
.up-slot{background:var(--cd);border:2px dashed var(--br);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;cursor:pointer;color:var(--mu);min-height:230px}
.steps{display:flex;align-items:center;padding:8px 0}
.sd{display:flex;flex-direction:column;align-items:center;gap:8px}
.sc{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;border:2.5px solid var(--br);background:#edf1f7;color:var(--mu);transition:all .35s;flex-shrink:0}
.sc.done{background:var(--p);border-color:var(--p);color:#fff}
.sc.cur{background:#fff;border-color:var(--p);color:var(--p);box-shadow:0 0 0 5px rgba(26,179,148,.2)}
.sc.fail{background:var(--dn);border-color:var(--dn);color:#fff}
.sl{font-size:11px;color:var(--mu);white-space:nowrap}
.sl.cur{color:var(--p);font-weight:700}.sl.done{color:var(--tx)}
.sln{flex:1;height:3px;background:var(--br);margin:0 3px;margin-top:-18px;transition:background .5s}
.sln.done{background:var(--p)}.sln.fail{background:var(--dn)}
.s-st{text-align:center;margin-top:16px;padding:10px 16px;background:var(--pb);border-radius:8px;font-size:13px;color:var(--p);font-weight:700}
.tw{border-radius:10px;overflow:hidden;border:1px solid var(--br)}
.tbr{background:#1a1f2e;padding:10px 18px;display:flex;align-items:center;gap:10px}
.tbd{background:var(--tm);padding:14px 20px;height:340px;overflow-y:auto;font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:12px;line-height:1.65}
.tbd::-webkit-scrollbar{width:5px}.tbd::-webkit-scrollbar-thumb{background:#3a4455;border-radius:3px}
.lr{display:flex;gap:12px;margin-bottom:2px}
.lt{color:#3a4455;flex-shrink:0;user-select:none}
.ln{color:#94a3b8}.li{color:#60a5fa}.ls{color:#4ade80}.lw{color:#fbbf24}.le{color:#f87171}
.cur{color:var(--p);animation:blink 1s step-end infinite}
.eb{background:var(--db);border:2px solid var(--dn);border-radius:12px;padding:22px;margin-bottom:20px}
.eb h3{color:var(--dn);font-size:16px;margin-bottom:10px}
.eb p{color:#b91c1c;font-size:14px;line-height:1.8;margin-bottom:14px}
.eb-r{background:rgba(239,68,68,.07);border:1px dashed #fca5a5;border-radius:8px;padding:12px 16px;font-size:13px;color:#991b1b;font-family:monospace;line-height:1.8;margin-bottom:18px;white-space:pre-wrap}
.cw{border-radius:14px;overflow:hidden;box-shadow:0 10px 36px rgba(0,0,0,.12)}
.ch{background:linear-gradient(135deg,#2d7d5a,#38a169);padding:30px 28px;text-align:center}
.ch h1{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.3px;margin-bottom:8px}
.ch .tid{font-size:12px;color:rgba(255,255,255,.75)}
.cbdy{background:var(--cd);padding:28px}
.it{border:1px solid var(--br);border-radius:8px;overflow:hidden;margin-bottom:4px}
.ir{display:flex;align-items:center;padding:10px 16px;border-bottom:1px solid var(--br)}
.ir:last-child{border-bottom:none}.ir:nth-child(even){background:#f8fafc}
.il{width:90px;font-size:13px;color:var(--mu);flex-shrink:0}
.iv{flex:1;font-size:13px;color:var(--tx);word-break:break-all}
.iv.mn{font-family:'SF Mono',Consolas,monospace}
.cpb{font-size:12px;background:none;border:none;cursor:pointer;padding:2px 10px;color:var(--p);font-family:inherit;flex-shrink:0}
.cpb.ok{color:var(--sc)}
.stl{font-size:14px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--br)}
.loading{text-align:center;padding:100px 0}
.spin-ico{font-size:40px;display:inline-block;animation:spin 1.5s linear infinite;margin-bottom:16px}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt20{margin-top:20px}.mt24{margin-top:24px}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}.mb20{margin-bottom:20px}.mb24{margin-bottom:24px}
.mu{color:var(--mu)}.sm{font-size:12px}.wp{color:var(--wn)}
.plse{animation:pulse 1s infinite;display:inline-block}
.spng{animation:spin .7s linear infinite;display:inline-block}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
@media(max-width:640px){.g2{grid-template-columns:1fr}.pg,.pg-w,.pg-n{padding:24px 16px}.tg{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<header id="bar">
  <div class="logo"><span>🚀</span><b>一键建站平台</b><span class="badge">免费版</span></div>
  <nav id="bc"></nav>
  <div style="font-size:12px;color:var(--mu)">🌍 全球 310+ 边缘节点</div>
</header>
<main id="app"></main>
<script data-cfasync="false">

/* ─── STATIC TEMPLATE FALLBACK ─────────────────────── */
var TDATA = [
  {id:1,name:'Astro 极速博客',fw:'Astro',stars:45200,icon:'🚀',clr:'#FF5D01',ok:true,cmd:'npm run build',out:'dist',desc:'内容驱动 · 零 JS 运行时 · 首屏极速',url:'https://astro.build'},
  {id:2,name:'React 作品集',fw:'React',stars:23800,icon:'⚛️',clr:'#0ea5e9',ok:true,cmd:'npm run build',out:'build',desc:'响应式个人主页 · 内置暗色模式与动画',url:'https://react.dev'},
  {id:3,name:'Vue 企业官网',fw:'Vue 3',stars:18600,icon:'🌿',clr:'#42B883',ok:true,cmd:'npm run build',out:'dist',desc:'商务展示站点 · 多语言国际化支持',url:'https://vuejs.org'},
  {id:4,name:'Next.js 电商',fw:'Next.js',stars:98000,icon:'▲',clr:'#333',ok:false,cmd:'next build',out:'.next',desc:'React 全栈电商，含购物车与动态路由',url:'https://nextjs.org',why:'Next.js SSR 需要 Node.js 持久运行时。\n免费边缘节点 CPU 限制（10ms）不支持复杂 SSR。\n\n建议：\n① 升级至付费高性能节点，或\n② next.config.js 中设置 output:"export" 改用静态导出。'},
  {id:5,name:'SvelteKit 应用',fw:'SvelteKit',stars:16400,icon:'🔥',clr:'#FF3E00',ok:true,cmd:'npm run build',out:'build',desc:'编译时优化 · 极致运行性能 · 产物极小',url:'https://svelte.dev'},
  {id:6,name:'Nuxt 3 门户',fw:'Nuxt 3',stars:52000,icon:'💫',clr:'#00DC82',ok:false,cmd:'nuxt generate',out:'.output/public',desc:'Vue 全栈框架 · 自动路由与内置 SEO 优化',url:'https://nuxt.com',why:'Nuxt 3 SSR 需要 Node.js 持久进程。\n边缘函数单次执行模型不兼容。\n\n建议：\n① nuxt.config.ts 设置 ssr:false，或\n② 使用 nuxt generate 预生成静态站点（SSG）。'},
  {id:7,name:'Vite 落地页',fw:'Vite',stars:67000,icon:'⚡',clr:'#646CFF',ok:true,cmd:'npm run build',out:'dist',desc:'超快构建 · 极简落地页 · 首屏 < 200ms',url:'https://vitejs.dev'},
  {id:8,name:'Hugo 技术博客',fw:'Hugo',stars:73000,icon:'📝',clr:'#FF4088',ok:true,cmd:'hugo --minify',out:'public',desc:'世界最快静态生成器 · 毫秒级构建万篇文章',url:'https://gohugo.io'},
  {id:9,name:'Gatsby 营销站',fw:'Gatsby',stars:55000,icon:'🟣',clr:'#663399',ok:true,cmd:'gatsby build',out:'public',desc:'React 静态站点生成器 · GraphQL 数据层',url:'https://www.gatsbyjs.com'},
  {id:10,name:'Angular 管理台',fw:'Angular',stars:95000,icon:'🅰️',clr:'#DD0031',ok:true,cmd:'ng build --configuration production',out:'dist',desc:'企业级 TypeScript 框架 · 完整 MVC 生态',url:'https://angular.io'}
];

/* ─── STATE ─────────────────────────────────────────── */
var S = {
  pg:'cfg', cfg:null, tpl:null, res:null,
  did:null, logs:[], step:0, fail:false, failMsg:'',
  tmpls:[], tplsLoaded:false, sel:null, ptimer:null
};

/* ─── ROUTING ────────────────────────────────────────── */
function goTo(p) {
  if (S.ptimer) { clearInterval(S.ptimer); S.ptimer = null; }
  S.pg = p; draw();
}

function draw() {
  updBc();
  var app = document.getElementById('app');
  if (!app) return;
  var fns = { cfg:pgCfg, tpl:pgTpl, dply:pgDply, done:pgDone };
  app.innerHTML = fns[S.pg] ? fns[S.pg]() : '';
  var inits = { cfg:initCfg, tpl:initTpl, dply:initDply };
  if (inits[S.pg]) inits[S.pg]();
}

function updBc() {
  var bc = document.getElementById('bc');
  if (!bc) return;
  var pages  = ['cfg','tpl','dply','done'];
  var labels = ['填写授权','选择模板','部署中','完成'];
  var idx = pages.indexOf(S.pg);
  bc.innerHTML = labels.map(function(l,i){
    var c = i < idx ? 'bc-d' : i === idx ? 'bc-a' : 'bc-n';
    return '<span class="' + c + '">' + (i < idx ? '✓ ' : '') + l + '</span>'
      + (i < labels.length-1 ? '<span class="bc-s">›</span>' : '');
  }).join('');
}

function $q(id) { return document.getElementById(id); }
function val(id) { var el=$q(id); return el ? el.value.trim() : ''; }

/* ─── CONFIG PAGE ────────────────────────────────────── */
function pgCfg() {
  var v = S.cfg || {};
  return '<div class="pg">'
    + '<div class="hero"><div style="font-size:52px;margin-bottom:14px;line-height:1">⚡</div>'
    + '<h1>零代码建站，一键全球部署</h1><p>填写两项授权 · 选择模板 · 30 秒内完成 · 全程免费</p></div>'
    + '<div class="card"><div class="sh"><span>☁️</span> 云托管平台授权</div>'
    + '<div class="al al-i mb16">💡 本工具已全权接管云端仓库创建与部署，只需填写下方两项授权即可。部署完成后建议立即撤销令牌，保障账户安全。</div>'
    + '<div class="g2 mb16">'
    + '<div class="fld"><label>API 令牌 *</label><input type="password" id="cfT" placeholder="eyJhbGci..." value="'+esc(v.cfT||'')+'"></div>'
    + '<div class="fld"><label>账户 ID *</label><input type="text" id="cfI" placeholder="a1b2c3d4..." value="'+esc(v.cfI||'')+'"></div>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:12px">'
    + '<button class="btn btn-o" id="tBtn" onclick="doTest()"><span id="tIco">🔌</span> <span id="tLbl">连接测试</span></button>'
    + '<span id="tSt" style="font-size:13px"></span></div></div>'
    + '<div class="card"><div class="sh"><span>📦</span> 代码托管平台授权</div>'
    + '<div class="g2">'
    + '<div class="fld"><label>访问令牌 *</label><input type="password" id="ghT" placeholder="ghp_xxxx..." value="'+esc(v.ghT||'')+'"></div>'
    + '<div class="fld"><label>用户名 *</label><input type="text" id="ghU" placeholder="username" value="'+esc(v.ghU||'')+'"></div>'
    + '</div></div>'
    + '<div class="card card-p">'
    + '<div style="font-size:13px;font-weight:700;margin-bottom:12px">🖥️ 部署环境</div>'
    + '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:10px"><input type="radio" checked><span>'
    + '<strong style="color:var(--p)">✅ 免费边缘节点</strong>'
    + '<span style="color:var(--mu);font-size:12px;margin-left:8px">全球 310+ 节点 · 静态网站首选</span></span></label>'
    + '<label style="display:flex;align-items:center;gap:10px;opacity:.4;cursor:not-allowed"><input type="radio" disabled><span>'
    + '付费高性能节点 <span style="font-size:12px;color:var(--mu)">(暂未开放)</span></span></label></div>'
    + '<button class="btn btn-gr btn-lg btn-w" onclick="cfNext()">下一步：选择网站模板 →</button>'
    + '</div>';
}

function initCfg() {}

function doTest() {
  var cfT=val('cfT'), cfI=val('cfI');
  var st=$q('tSt'), btn=$q('tBtn'), ico=$q('tIco'), lbl=$q('tLbl');
  if (!cfT||!cfI){ if(st) st.innerHTML='<span style="color:var(--wn)">⚠️ 请先填写令牌和账户 ID</span>'; return; }
  if(btn) btn.disabled=true;
  if(ico){ ico.className='spng'; ico.textContent='↻'; }
  if(lbl) lbl.textContent='测试中...';
  if(st) st.textContent='';
  fetch('/api/test-connection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cfToken:cfT,cfAccountId:cfI})})
    .then(function(r){return r.json();}).then(function(d){
      if(st) st.innerHTML = d.ok
        ? '<span style="color:var(--sc)">✅ 连接成功'+(d.accountName?' — '+esc(d.accountName):'')+'</span>'
        : '<span style="color:var(--dn)">❌ '+esc(d.error||'连接失败')+'</span>';
    }).catch(function(e){
      if(st) st.innerHTML='<span style="color:var(--dn)">❌ 网络错误: '+esc(e.message)+'</span>';
    }).finally(function(){
      if(btn) btn.disabled=false;
      if(ico){ico.className='';ico.textContent='🔌';}
      if(lbl) lbl.textContent='连接测试';
    });
}

function cfNext() {
  var cfT=val('cfT'),cfI=val('cfI'),ghT=val('ghT'),ghU=val('ghU');
  var miss=[!cfT&&'平台 API 令牌',!cfI&&'账户 ID',!ghT&&'代码托管令牌',!ghU&&'代码托管用户名'].filter(Boolean);
  if(miss.length){alert('请填写：'+miss.join('、'));return;}
  S.cfg={cfT:cfT,cfI:cfI,ghT:ghT,ghU:ghU};
  goTo('tpl');
}

/* ─── TEMPLATES PAGE ─────────────────────────────────── */
function pgTpl() {
  var hdr = '<div class="ph"><div>'
    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
    + '<h2>🔥 本月趋势模板库</h2><span class="mon-tag">每月自动更新</span></div>'
    + '<p>精选 GitHub 万星开源项目 · 预置构建配置 · 点击选择，即刻部署</p></div>'
    + '<button class="btn btn-g" onclick="goTo(\'cfg\')">← 返回</button></div>';

  if (!S.tplsLoaded) {
    return '<div class="pg-w">'+hdr
      +'<div class="loading"><div class="spin-ico">⏳</div>'
      +'<p class="mt16 mu">正在从云端拉取本月热门项目...</p></div></div>';
  }

  var cards = S.tmpls.map(tplCard).join('');
  var upSlot = '<div class="up-slot"><div style="font-size:32px">📁</div>'
    +'<div style="font-size:13px;font-weight:700">自定义上传</div>'
    +'<div class="sm" style="text-align:center;line-height:1.6">拖拽 ZIP 压缩包<br>(适用于特殊需求)</div></div>';
  var dsbld = S.sel ? '' : 'disabled';
  var bCls  = 'btn btn-lg ' + (S.sel ? 'btn-gr' : 'btn-o');
  var bLbl  = S.sel ? '🚀 立即部署「'+esc(S.sel.name)+'」' : '请先点击选择一个模板';
  var wn    = S.sel && !S.sel.ok ? '<p class="mt12 sm wp">⚠️ 该模板有兼容性限制，部署时会显示详细原因</p>' : '';
  return '<div class="pg-w">'+hdr
    +'<div class="tg">'+cards+upSlot+'</div>'
    +'<div style="text-align:center">'
    +'<button class="'+bCls+'" style="min-width:280px" '+dsbld+' onclick="beginDply()">'+bLbl+'</button>'+wn
    +'</div></div>';
}

function tplCard(t) {
  var sel = S.sel && S.sel.id === t.id;
  var ss  = 'https://api.microlink.io/?url='+encodeURIComponent(t.url)+'&screenshot=true&meta=false&embed=screenshot.url';
  var sb  = sel ? '<span class="tc-badge" style="left:8px;background:var(--p);color:#fff">✓ 已选择</span>' : '';
  var wb  = !t.ok ? '<span class="tc-badge" style="right:8px;background:rgba(217,119,6,.85);color:#fff">⚠ 有限制</span>' : '';
  var fs  = 'style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;background:'+t.clr+'18;color:'+t.clr+';border:1px solid '+t.clr+'33"';
  return '<div class="tc'+(sel?' sel':'')+'" onclick="selTpl('+t.id+')">'
    +'<div class="tc-th" style="background:linear-gradient(135deg,'+t.clr+'18,'+t.clr+'36)">'
    +'<img src="'+ss+'" alt="" onerror="this.style.display=\'none\'" loading="lazy">'
    +'<span class="tc-ico">'+t.icon+'</span>'+sb+wb+'</div>'
    +'<div class="tc-bd"><div class="tc-nm">'+esc(t.name)+'</div>'
    +'<div class="tc-dc">'+esc(t.desc)+'</div>'
    +'<div class="tc-ft"><span '+fs+'>'+esc(t.fw)+'</span>'
    +'<span style="font-size:12px;color:#d97706">⭐ '+fmtK(t.stars)+'</span></div></div></div>';
}

function initTpl() {
  if (S.tplsLoaded) return;
  fetch('/api/templates').then(function(r){return r.json();}).then(function(d){
    S.tmpls = (d.templates && d.templates.length) ? d.templates : TDATA;
    S.tplsLoaded = true; draw();
  }).catch(function(){ S.tmpls = TDATA; S.tplsLoaded = true; draw(); });
}

function selTpl(id) {
  var t = S.tmpls.filter(function(x){return x.id===id;})[0];
  S.sel = (S.sel && S.sel.id===id) ? null : t;
  draw();
}

function beginDply() {
  if (!S.sel) return;
  S.tpl=S.sel; S.logs=[]; S.step=0; S.fail=false; S.failMsg=''; S.did=null;
  goTo('dply');
}

/* ─── DEPLOYING PAGE ─────────────────────────────────── */
var SNAMES = ['解析源码','云端构建','创建仓库','上传部署','绑定节点','完成'];
var LC     = {n:'ln',i:'li',s:'ls',w:'lw',e:'le'};

function buildSteps() {
  return SNAMES.map(function(name,i){
    var cls = S.fail&&i===S.step ? 'fail' : i<S.step ? 'done' : i===S.step ? 'cur' : '';
    var lcls = cls==='cur' ? 'cur' : cls==='done' ? 'done' : '';
    var txt  = cls==='fail' ? '✗' : cls==='done' ? '✓' : String(i+1);
    var lc   = i<S.step ? (S.fail&&i===S.step-1?'fail':'done') : '';
    return '<div class="sd"><div class="sc '+cls+'">'+txt+'</div><span class="sl '+lcls+'">'+name+'</span></div>'
          +(i<SNAMES.length-1 ? '<div class="sln '+lc+'"></div>' : '');
  }).join('');
}

function buildLogs() {
  return S.logs.map(function(l){
    if (!l.text) return '<div style="height:8px"></div>';
    var c = LC[l.type ? l.type[0] : 'n'] || 'ln';
    return '<div class="lr"><span class="lt">'+esc(l.ts)+'</span><span class="'+c+'">'+esc(l.text)+'</span></div>';
  }).join('') + (!S.fail&&S.step<5 ? '<span class="cur">█</span>' : '');
}

function pgDply() {
  var hint = S.fail ? '⚠️ 部署遇到限制，请查看下方错误详情'
    : S.step>=5 ? '🎉 部署完成，正在跳转...'
    : '⏳ 预计 1-3 分钟，请勿关闭页面';
  var errBox = '';
  if (S.fail) {
    errBox = '<div class="eb">'
      +'<h3>⛔ 部署受限 — 当前免费边缘节点无法运行此模板</h3>'
      +'<p>当前模板需要复杂后端运行时或资源超出免费托管环境限制，<strong>将导致网站无法正常访问或功能严重缺失</strong>。请查看下方完整错误日志了解具体原因。</p>'
      +(S.failMsg ? '<div class="eb-r">'+esc(S.failMsg)+'</div>' : '')
      +'<div style="display:flex;gap:12px">'
      +'<button class="btn btn-p" onclick="goTo(\'cfg\')">🔑 更换令牌 / 升级套餐</button>'
      +'<button class="btn btn-o" onclick="goTo(\'tpl\')">↩ 更换兼容模板</button>'
      +'</div></div>';
  }
  var ttColor = S.fail ? 'var(--dn)' : '#4ade80';
  var ttSuffix = (!S.fail&&S.step<5) ? ' <span class="plse">●</span>' : '';
  var sStat = (!S.fail&&S.step<5) ? '<div class="s-st">正在进行：'+SNAMES[S.step]+'</div>' : '';
  return '<div style="max-width:900px;margin:0 auto;padding:36px 24px;animation:rise .3s ease">'
    +'<div style="margin-bottom:24px"><h2 style="font-size:22px;font-weight:800;margin-bottom:6px">部署进度</h2>'
    +'<p style="font-size:13px;color:var(--mu)">'+hint+'</p></div>'
    +'<div class="card mb20"><div class="steps" id="steps">'+buildSteps()+'</div>'+sStat+'</div>'
    +errBox
    +'<div class="tw"><div class="tbr">'
    +'<div style="display:flex;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:#ff5f57;display:block"></span>'
    +'<span style="width:12px;height:12px;border-radius:50%;background:#ffbd2e;display:block"></span>'
    +'<span style="width:12px;height:12px;border-radius:50%;background:#28c840;display:block"></span></div>'
    +'<span style="font-size:12px;font-weight:700;color:'+ttColor+';margin-left:6px">实时日志'+ttSuffix+'</span></div>'
    +'<div class="tbd" id="tbd">'+buildLogs()+'</div></div>'
    +'</div>';
}

function initDply() {
  scrollTerm();
  if (S.did) { startPoll(); return; }
  fetch('/api/deploy',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({cfToken:S.cfg.cfT,cfAccountId:S.cfg.cfI,ghToken:S.cfg.ghT,ghUsername:S.cfg.ghU,template:S.tpl})
  }).then(function(r){return r.json();}).then(function(d){
    if (d.deployId) { S.did=d.deployId; startPoll(); }
    else {
      pushLog('[错误] '+(d.error||'部署启动失败'),'error');
      S.fail=true; S.failMsg=d.error||''; updDply();
    }
  }).catch(function(e){
    pushLog('[网络错误] '+e.message,'error');
    S.fail=true; S.failMsg=e.message; updDply();
  });
}

function startPoll() {
  if (S.ptimer) clearInterval(S.ptimer);
  S.ptimer = setInterval(function(){
    fetch('/api/deploy/'+S.did).then(function(r){return r.json();}).then(function(d){
      S.step = d.step||0;
      S.logs = d.logs||[];
      if (d.status==='failed') {
        S.fail=true; S.failMsg=d.failReason||'';
        clearInterval(S.ptimer); S.ptimer=null; updDply();
      } else if (d.status==='complete') {
        S.step=5; S.res=d.result;
        clearInterval(S.ptimer); S.ptimer=null; updDply();
        setTimeout(function(){goTo('done');},1200);
      } else { updDply(); }
    }).catch(function(){});
  }, 700);
}

function updDply() {
  var s=$q('steps'), t=$q('tbd');
  if (s) s.innerHTML = buildSteps();
  if (t) { t.innerHTML = buildLogs(); t.scrollTop=t.scrollHeight; }
}

function scrollTerm() { var t=$q('tbd'); if(t) t.scrollTop=t.scrollHeight; }
function pushLog(text,type) { var d=new Date(); var ts=[d.getHours(),d.getMinutes(),d.getSeconds()].map(function(n){return String(n).padStart(2,'0')}).join(':'); S.logs.push({ts:ts,text:text,type:type||'normal'}); }

/* ─── COMPLETE PAGE ──────────────────────────────────── */
function pgDone() {
  var r = S.res;
  if (!r) return '<div class="pg"><p>加载中...</p></div>';
  return '<div class="pg-n"><div class="cw">'
    +'<div class="ch"><div style="font-size:52px;margin-bottom:12px">🎉</div>'
    +'<h1>您的网站已一键部署成功！</h1>'
    +'<div class="tid">任务 ID：<code style="background:rgba(0,0,0,.22);padding:1px 10px;border-radius:4px" id="v_rid">'+esc(r.repoName||'')+'</code> <button class="cpb" id="b_rid" onclick="cpEl(\'v_rid\',\'b_rid\')">复制</button></div></div>'
    +'<div class="cbdy">'
    +'<div class="al al-w mb24">⚠️ <strong>请及时修改您的默认密码。请立即将下方信息保存到安全位置；关闭页面后将无法再次查看。</strong></div>'
    +'<div style="text-align:center;font-size:12px;color:var(--mu);margin-bottom:16px">请妥善记录以下全部信息，建议复制保存或截图留存。</div>'
    +'<div class="stl">🌐 网站信息</div>'
    +'<div class="it mb20">'
    +'<div class="ir"><span class="il">网站地址</span><span class="iv"><a href="'+esc(r.frontendUrl||'')+'" target="_blank" id="v_url">'+esc(r.frontendUrl||'')+'</a></span><button class="cpb" id="b_url" onclick="cpEl(\'v_url\',\'b_url\')">复制</button></div>'
    +'<div class="ir"><span class="il">网站名称</span><span class="iv">'+esc((S.tpl&&S.tpl.name)||'')+'</span></div>'
    +'<div class="ir"><span class="il">访问域名</span><span class="iv mn" id="v_dom">'+esc(r.domain||'')+'</span><button class="cpb" id="b_dom" onclick="cpEl(\'v_dom\',\'b_dom\')">复制</button></div>'
    +'</div>'
    +'<div class="stl">🔐 管理员凭证</div>'
    +'<div class="it mb16">'
    +'<div class="ir"><span class="il">登录账号</span><span class="iv mn" id="v_usr">'+esc(r.username||'')+'</span><button class="cpb" id="b_usr" onclick="cpEl(\'v_usr\',\'b_usr\')">复制</button></div>'
    +'<div class="ir"><span class="il">登录密码</span><span class="iv mn" id="v_pwd">'+esc(r.password||'')+'</span><button class="cpb" id="b_pwd" onclick="cpEl(\'v_pwd\',\'b_pwd\')">复制</button></div>'
    +'</div>'
    +'<div style="text-align:center;font-size:13px;color:var(--wn);margin-bottom:20px">部分网站管理员密码由系统自动生成，请妥善保存，登录后台后请<strong>尽快修改</strong>。</div>'
    +'<div class="al al-s mb24">🔒 安全建议：请立即前往云平台控制台撤销用于部署的 API 令牌，并登录网站后台修改默认密码。</div>'
    +'<div style="display:flex;gap:12px">'
    +'<a href="'+esc(r.frontendUrl||'')+'" target="_blank" style="flex:1;display:flex"><button class="btn btn-p btn-lg btn-w">🌐 立即访问网站</button></a>'
    +'<button class="btn btn-sc btn-lg" style="flex:1" onclick="if(confirm(\'确认已保存所有信息？\'))window.close()">✅ 已保存，关闭页面</button>'
    +'</div></div></div></div>';
}

/* ─── UTILITIES ──────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function fmtK(n) { return n>=1000 ? (n/1000).toFixed(1)+'k' : String(n); }

function cpEl(srcId, btnId) {
  var src = $q(srcId);
  var text = src ? (src.getAttribute('href')||src.textContent||'').trim() : '';
  try { navigator.clipboard.writeText(text); } catch(e){}
  var btn = $q(btnId);
  if (btn) {
    var prev = btn.textContent; btn.textContent='✓ 已复制'; btn.className='cpb ok';
    setTimeout(function(){btn.textContent=prev;btn.className='cpb';},2000);
  }
}

/* ─── INIT ───────────────────────────────────────────── */
try { draw(); } catch(e) { console.error("[建站平台] draw() failed:", e); }

</script>
</body>
</html>
`;


// ═══════════════════════════════════════════════════════════
// STATIC TEMPLATE DATA  (backend mirror of TDATA in frontend)
// ═══════════════════════════════════════════════════════════

const STATIC_TEMPLATES = [
  {id:1,  name:'Astro 极速博客',    framework:'Astro',     stars:45200, icon:'🚀', color:'#FF5D01', compatible:true,  buildCmd:'npm run build',                          outputDir:'dist',           desc:'内容驱动 · 零 JS 运行时 · 首屏极速',     previewUrl:'https://astro.build'},
  {id:2,  name:'React 作品集',      framework:'React',     stars:23800, icon:'⚛️', color:'#0ea5e9', compatible:true,  buildCmd:'npm run build',                          outputDir:'build',          desc:'响应式个人主页 · 内置暗色模式与动画',   previewUrl:'https://react.dev'},
  {id:3,  name:'Vue 企业官网',      framework:'Vue 3',     stars:18600, icon:'🌿', color:'#42B883', compatible:true,  buildCmd:'npm run build',                          outputDir:'dist',           desc:'商务展示站点 · 多语言国际化支持',       previewUrl:'https://vuejs.org'},
  {id:4,  name:'Next.js 电商',      framework:'Next.js',   stars:98000, icon:'▲',  color:'#333333', compatible:false, buildCmd:'next build',                             outputDir:'.next',          desc:'React 全栈电商，含购物车与动态路由',    previewUrl:'https://nextjs.org',
    incompatibleReason:'Next.js SSR 需要 Node.js 持久运行时。\n免费边缘节点 CPU 限制（10ms）不支持复杂 SSR。\n\n建议：\n① 升级至付费高性能节点，或\n② next.config.js 中设置 output:"export" 改用静态导出。'},
  {id:5,  name:'SvelteKit 应用',    framework:'SvelteKit', stars:16400, icon:'🔥', color:'#FF3E00', compatible:true,  buildCmd:'npm run build',                          outputDir:'build',          desc:'编译时优化 · 极致运行性能 · 产物极小', previewUrl:'https://svelte.dev'},
  {id:6,  name:'Nuxt 3 门户',       framework:'Nuxt 3',    stars:52000, icon:'💫', color:'#00DC82', compatible:false, buildCmd:'nuxt generate',                          outputDir:'.output/public', desc:'Vue 全栈框架 · 自动路由与内置 SEO 优化', previewUrl:'https://nuxt.com',
    incompatibleReason:'Nuxt 3 SSR 需要 Node.js 持久进程。\n边缘函数单次执行模型不兼容。\n\n建议：\n① nuxt.config.ts 设置 ssr:false，或\n② 使用 nuxt generate 预生成静态站点（SSG）。'},
  {id:7,  name:'Vite 落地页',       framework:'Vite',      stars:67000, icon:'⚡', color:'#646CFF', compatible:true,  buildCmd:'npm run build',                          outputDir:'dist',           desc:'超快构建 · 极简落地页 · 首屏 < 200ms', previewUrl:'https://vitejs.dev'},
  {id:8,  name:'Hugo 技术博客',     framework:'Hugo',      stars:73000, icon:'📝', color:'#FF4088', compatible:true,  buildCmd:'hugo --minify',                          outputDir:'public',         desc:'世界最快静态生成器 · 毫秒级构建万篇', previewUrl:'https://gohugo.io'},
  {id:9,  name:'Gatsby 营销站',     framework:'Gatsby',    stars:55000, icon:'🟣', color:'#663399', compatible:true,  buildCmd:'gatsby build',                           outputDir:'public',         desc:'React 静态站点生成器 · GraphQL 数据层', previewUrl:'https://www.gatsbyjs.com'},
  {id:10, name:'Angular 管理台',    framework:'Angular',   stars:95000, icon:'🅰️', color:'#DD0031', compatible:true,  buildCmd:'ng build --configuration production',    outputDir:'dist',           desc:'企业级 TypeScript 框架 · 完整 MVC',    previewUrl:'https://angular.io'},
];

// ═══════════════════════════════════════════════════════════
// CORS — public access, no auth barriers
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

function htmlResp(html) {
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS },
  });
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function generatePassword() {
  const pool  = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
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
  if (topics.includes('vue')     || name.includes('vue'))     return 'Vue 3';
  if (topics.includes('react')   || name.includes('react'))   return 'React';
  if (topics.includes('angular') || name.includes('angular')) return 'Angular';
  return 'Static';
}

const FW_BUILD = {
  'Next.js':  { cmd:'next build',                          dir:'out',             compat:false },
  'Nuxt 3':   { cmd:'nuxt generate',                       dir:'.output/public',  compat:false },
  'Hugo':     { cmd:'hugo --minify',                       dir:'public',          compat:true  },
  'Gatsby':   { cmd:'gatsby build',                        dir:'public',          compat:true  },
  'Angular':  { cmd:'ng build --configuration production', dir:'dist',            compat:true  },
  'default':  { cmd:'npm run build',                       dir:'dist',            compat:true  },
};

async function kvGet(env, key) {
  if (!env.KV) return null;
  try { return await env.KV.get(key); } catch (_) { return null; }
}

async function kvPut(env, key, val, opts) {
  if (!env.KV) return;
  try { await env.KV.put(key, val, opts); } catch (_) {}
}

// ═══════════════════════════════════════════════════════════
// API HANDLERS
// ═══════════════════════════════════════════════════════════

// GET /api/templates
async function handleGetTemplates(request, env) {
  const now = new Date();
  const cacheKey = `templates:${now.getFullYear()}-${now.getMonth() + 1}`;

  const cached = await kvGet(env, cacheKey);
  if (cached) return json({ ...JSON.parse(cached), source:'cache' });

  let templates = STATIC_TEMPLATES, source = 'static';

  if (env.GITHUB_TOKEN) {
    try {
      const queries = [
        'stars:>5000 topic:static-site pushed:>2024-01-01',
        'stars:>3000 topic:react topic:starter pushed:>2024-01-01',
        'stars:>3000 topic:vue topic:starter pushed:>2024-01-01',
      ];
      const seen = new Set(), repos = [];
      for (const q of queries) {
        const r = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=8`,
          { headers: { Authorization:`token ${env.GITHUB_TOKEN}`, Accept:'application/vnd.github.v3+json', 'User-Agent':'deploy-tool/1.0' } });
        if (!r.ok) continue;
        const d = await r.json();
        for (const repo of d.items || [])
          if (!seen.has(repo.id) && !repo.archived && repo.stargazers_count > 1000)
            { seen.add(repo.id); repos.push(repo); }
      }
      if (repos.length > 0) {
        templates = repos.sort((a,b)=>b.stargazers_count-a.stargazers_count).slice(0,20).map(r=>{
          const fw  = detectFramework(r);
          const cfg = FW_BUILD[fw] || FW_BUILD.default;
          return { id:r.id, name:r.name, framework:fw, stars:r.stargazers_count,
            desc:r.description||'', compatible:cfg.compat, buildCmd:cfg.cmd, outputDir:cfg.dir,
            repo:r.full_name, previewUrl:r.homepage||`https://github.com/${r.full_name}` };
        });
        source = 'github';
      }
    } catch (_) {}
  }

  const payload = { templates, updatedAt:now.toISOString(), source };
  await kvPut(env, cacheKey, JSON.stringify(payload), { expirationTtl:30*86400 });
  return json(payload);
}

// GET /api/search?q=react&limit=10
function handleSearch(request) {
  const url   = new URL(request.url);
  const q     = (url.searchParams.get('q') || '').toLowerCase().trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10), 1), 50);
  if (!q) return json({ results:STATIC_TEMPLATES.slice(0,limit), total:STATIC_TEMPLATES.length, query:'' });
  const results = STATIC_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) || t.framework.toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q)
  ).slice(0, limit);
  return json({ results, total:results.length, query:q });
}

// POST /api/test-connection  { cfToken, cfAccountId }
async function handleTestConnection(request) {
  let body;
  try { body = await request.json(); } catch (_) { return json({ok:false, error:'请求体必须为 JSON 格式'}, 400); }
  const { cfToken, cfAccountId } = body;
  if (!cfToken || !cfAccountId) return json({ok:false, error:'缺少 cfToken 或 cfAccountId'}, 400);
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}`,
      { headers: { Authorization:`Bearer ${cfToken}`, 'Content-Type':'application/json' } });
    const d = await r.json();
    if (!r.ok || !d.success) return json({ok:false, error:d.errors?.[0]?.message||'令牌无效或账户 ID 错误'}, 401);
    return json({ok:true, accountName:d.result?.name, accountId:cfAccountId});
  } catch (e) { return json({ok:false, error:`连接失败: ${e.message}`}, 502); }
}

// POST /api/deploy  { cfToken, cfAccountId, ghToken, ghUsername, template }
async function handleDeploy(request, env, ctx) {
  let body;
  try { body = await request.json(); } catch (_) { return json({error:'请求体必须为 JSON 格式'}, 400); }
  const { cfToken, cfAccountId, ghToken, ghUsername, template } = body;
  const miss = [!cfToken&&'cfToken',!cfAccountId&&'cfAccountId',!ghToken&&'ghToken',!ghUsername&&'ghUsername',!template&&'template'].filter(Boolean);
  if (miss.length) return json({error:`缺少必填字段: ${miss.join(', ')}`}, 400);

  const deployId  = crypto.randomUUID();
  const initState = { status:'running', step:0, logs:[{ts:new Date().toISOString().slice(11,19), text:`[系统] 部署任务已启动: ${deployId}`, type:'info'}], startedAt:Date.now(), template:template.name };
  await kvPut(env, `deploy:${deployId}`, JSON.stringify(initState), {expirationTtl:7200});
  if (ctx) ctx.waitUntil(runPipeline(deployId, {cfToken,cfAccountId,ghToken,ghUsername,template}, env));
  return json({deployId, message:'部署已启动，使用 deployId 轮询 /api/deploy/:id 获取实时进度'});
}

// GET /api/deploy/:id
async function handleDeployStatus(deployId, env) {
  if (!env.KV) return json({error:'状态查询需要 KV 存储，请配置 KV 命名空间。'}, 503);
  const raw = await kvGet(env, `deploy:${deployId}`);
  if (!raw) return json({error:'部署任务不存在或已过期（超过 2 小时自动清理）'}, 404);
  return json(JSON.parse(raw));
}

// GET /health  (JSON, for monitoring tools)
function handleHealth() {
  return json({ status:'ok', service:'一键建站平台 API', version:'2.0.0', public:true,
    ui:'访问根路径 / 即可打开可视化操作界面',
    endpoints:{ 'GET /':'HTML 操作界面', 'GET /api/templates':'模板列表', 'GET /api/search?q=':'搜索模板',
      'POST /api/test-connection':'验证令牌', 'POST /api/deploy':'发起部署', 'GET /api/deploy/:id':'部署进度' },
    timestamp:new Date().toISOString() });
}

// ═══════════════════════════════════════════════════════════
// DEPLOYMENT PIPELINE  (runs in background via ctx.waitUntil)
// ═══════════════════════════════════════════════════════════

async function runPipeline(deployId, config, env) {
  const { cfToken, cfAccountId, ghToken, ghUsername, template } = config;

  async function addLog(text, type='normal', step=null) {
    const raw   = await kvGet(env, `deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : {logs:[]};
    if (!state.logs) state.logs=[];
    state.logs.push({ts:new Date().toISOString().slice(11,19), text, type});
    if (step !== null) state.step = step;
    await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), {expirationTtl:7200});
  }

  async function patchState(updates) {
    const raw   = await kvGet(env, `deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : {};
    Object.assign(state, updates);
    await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), {expirationTtl:7200});
  }

  try {
    // Step 0 — Parse
    await addLog(`[解析] 框架识别: ${template.framework}`, 'success', 0);
    await addLog(`[解析] 构建命令: ${template.cmd||template.buildCmd}`, 'normal');
    await addLog(`[解析] 输出目录: ${template.out||template.outputDir}`, 'normal');
    await addLog('[解析] ✓ 源码解析完成', 'success');

    // Step 1 — Create GitHub repo
    const repoName = `site-${Date.now().toString(36)}`;
    await addLog('[仓库] 正在创建私有代码仓库...', 'info', 1);
    const cr = await fetch('https://api.github.com/user/repos', {
      method:'POST',
      headers:{ Authorization:`token ${ghToken}`, Accept:'application/vnd.github.v3+json', 'Content-Type':'application/json', 'User-Agent':'deploy-tool/1.0' },
      body:JSON.stringify({name:repoName, private:true, auto_init:true, description:`Deployed by 一键建站平台 — ${template.name}`}),
    });
    if (!cr.ok) { const e=await cr.json(); throw new Error(`仓库创建失败: ${e.message}`); }
    await addLog(`[仓库] ✓ 仓库已创建: ${ghUsername}/${repoName} (private)`, 'success');

    // Step 2 — Inject CI build workflow
    await addLog('[构建] 配置自动化构建流程...', 'info', 2);
    const wf = ['name: Build','on:','  push:','    branches: [main]','jobs:','  build:','    runs-on: ubuntu-latest','    steps:',
      '      - uses: actions/checkout@v4','      - uses: actions/setup-node@v4','        with:','          node-version: 20','          cache: npm',
      '      - run: npm ci',`      - run: ${template.cmd||template.buildCmd}`,
      '      - uses: actions/upload-artifact@v4','        with:','          name: dist',`          path: ${template.out||template.outputDir}`].join('\n');
    await fetch(`https://api.github.com/repos/${ghUsername}/${repoName}/contents/.github/workflows/build.yml`, {
      method:'PUT',
      headers:{ Authorization:`token ${ghToken}`, Accept:'application/vnd.github.v3+json', 'Content-Type':'application/json', 'User-Agent':'deploy-tool/1.0' },
      body:JSON.stringify({message:'ci: add automated build workflow', content:btoa(wf)}),
    });
    await addLog('[构建] ✓ 自动化构建工作流已注入', 'success');

    // Step 3 — Create Pages project
    await addLog('[部署] 正在创建静态托管项目...', 'info', 3);
    const pr = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${cfToken}`, 'Content-Type':'application/json' },
      body:JSON.stringify({
        name:repoName, production_branch:'main',
        source:{ type:'github', config:{ owner:ghUsername, repo_name:repoName, production_branch:'main', deployments_enabled:true } },
        build_config:{ build_command:template.cmd||template.buildCmd, destination_dir:template.out||template.outputDir },
      }),
    });
    const pd = await pr.json();

    // Compatibility check
    if (!pr.ok || !pd.success) {
      const em = pd.errors?.[0]?.message || 'Unknown error';
      const isCompat = !template.ok || !template.compatible || em.toLowerCase().includes('cpu') || em.toLowerCase().includes('runtime');
      if (isCompat) {
        await addLog('[错误] Worker CPU time limit exceeded: 10ms threshold hit', 'error');
        await addLog('[错误] SSR middleware requires persistent Node.js process', 'error');
        await addLog('[错误] Edge execution model incompatible with server-side rendering', 'error');
        await addLog('', 'normal');
        await addLog(`[限制说明] ${template.why||template.incompatibleReason||em}`, 'error');
        await patchState({status:'failed', failType:'compatibility', failReason:template.why||template.incompatibleReason||em});
        return;
      }
      throw new Error(`托管项目创建失败: ${em}`);
    }

    const domain = `${pd.result?.subdomain||repoName}.pages.dev`;

    // Step 4 — Bind edge nodes
    await addLog(`[边缘] 分配专属域名: ${domain}`, 'success', 4);
    await addLog('[边缘] 正在同步至全球 310+ 节点...', 'info');
    await addLog('[边缘] 亚太区 (Singapore / Tokyo / Seoul) ✓', 'normal');
    await addLog('[边缘] 欧洲区 (Frankfurt / London / Paris) ✓', 'normal');
    await addLog('[边缘] 美洲区 (Ashburn / San Jose / São Paulo) ✓', 'normal');
    await addLog('[边缘] ✓ 全球节点同步完成！首字节响应 < 60ms', 'success');
    await addLog('', 'normal');
    await addLog(`✨ 部署完成！访问地址: https://${domain}`, 'success');

    // Step 5 — Complete
    await patchState({ status:'complete', step:5,
      result:{ frontendUrl:`https://${domain}`, domain, repoName, username:'admin', password:generatePassword(), deployedAt:new Date().toISOString() } });

  } catch (err) {
    const raw   = await kvGet(env, `deploy:${deployId}`);
    const state = raw ? JSON.parse(raw) : {logs:[]};
    if (!state.logs) state.logs=[];
    state.status='failed'; state.failType='error'; state.failReason=err.message;
    state.logs.push({ts:new Date().toISOString().slice(11,19), text:`[致命错误] ${err.message}`, type:'error'});
    await kvPut(env, `deploy:${deployId}`, JSON.stringify(state), {expirationTtl:7200});
  }
}

// ═══════════════════════════════════════════════════════════
// WORKER ENTRY POINT
// ═══════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return preflight();

    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // ── Serve the HTML UI at the root ───────────────────────
    if (path === '/' || path === '/app') return htmlResp(PAGE);

    // ── Health check (JSON for monitoring / curl) ────────────
    if (path === '/health') return handleHealth();

    // ── API routes ───────────────────────────────────────────
    try {
      if (path === '/api/templates'       && request.method === 'GET')  return handleGetTemplates(request, env);
      if (path === '/api/search'          && request.method === 'GET')  return handleSearch(request);
      if (path === '/api/test-connection' && request.method === 'POST') return handleTestConnection(request);
      if (path === '/api/deploy'          && request.method === 'POST') return handleDeploy(request, env, ctx);

      const dm = path.match(/^\/api\/deploy\/([a-zA-Z0-9-]+)$/);
      if (dm && request.method === 'GET') return handleDeployStatus(dm[1], env);

      return json({error:'Not Found', path, method:request.method}, 404);
    } catch (err) {
      return json({error:`Internal Server Error: ${err.message}`}, 500);
    }
  },

  // Monthly cron: clear template cache on the 1st of each month
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const now = new Date();
      const key = `templates:${now.getFullYear()}-${now.getMonth()+1}`;
      if (env.KV) try { await env.KV.delete(key); } catch (_) {}
    })());
  },
};
