/* 榜单情报台 · 原型 V0.1 — 单页应用（Hash 路由，纯前端模拟） */
(function () {
  'use strict';

  const M = window.MOCK;

  /* ---------- 图标（Lucide 内联 SVG，零外部依赖） ---------- */
  const ICONS = {
    'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    'list-checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    'bar-chart-3': '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    'gamepad-2': '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    minus: '<path d="M5 12h14"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'refresh-cw': '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    'edit-3': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    'trash-2': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    'chevrons-up': '<path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/>',
    'chevrons-down': '<path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    'circle-dot': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
    'file-check': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>'
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls) => `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS['circle-dot']}</svg>`;
  const badge = (text, variant, iconName) => `<span class="badge badge-${variant || 'neutral'}">${iconName ? icon(iconName) : ''}${esc(text)}</span>`;
  const roleLabel = { operator: '运营', lead: '负责人', admin: '管理员' };
  const roleNames = { operator: '林渝', lead: '周宁', admin: '陈默' };
  const platformLabel = (p) => M.platforms[p] || p;
  const boardLabel = (b) => M.boards[b] || b;

  function greetingFor(date) {
    const hour = date.getHours();
    let text = '夜深了';
    if (hour >= 5 && hour < 9) text = '早上好';
    else if (hour >= 9 && hour < 12) text = '上午好';
    else if (hour >= 12 && hour < 14) text = '中午好';
    else if (hour >= 14 && hour < 18) text = '下午好';
    else if (hour >= 18 && hour < 23) text = '晚上好';
    return text + '，主人';
  }

  function todayLabel(date) {
    const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日 · 周' + week;
  }

  function gameById(id) { return M.games.find((g) => g.id === id) || null; }
  function articleById(id) { return M.articles.find((a) => a.id === id) || null; }
  function sourceById(id) { return M.sources.find((s) => s.id === id) || null; }
  function claimById(id) { return M.claims.find((c) => c.id === id) || null; }

  function gameAvatar(g, cls) {
    if (!g) return `<span class="game-avatar" style="background:#b9b3a4">?</span>`;
    return `<span class="game-avatar ${cls || ''}" style="background:${g.color}">${esc(g.short)}</span>`;
  }
  function gameCell(g, sub) {
    if (!g) return `<div class="game-cell">${gameAvatar(null)}<div><div class="game-name">未映射</div><div class="game-sub">待人工确认</div></div></div>`;
    return `<div class="game-cell">${gameAvatar(g)}<div><div class="game-name">${esc(g.name)}</div><div class="game-sub">${esc(sub || (g.aliases[0] || g.publisher))}</div></div></div>`;
  }
  function trendHTML(trend, delta) {
    if (trend === 'up') return `<span class="trend trend-up">${icon('arrow-up')}${Math.abs(delta || 0)}</span>`;
    if (trend === 'down') return `<span class="trend trend-down">${icon('arrow-down')}${Math.abs(delta || 0)}</span>`;
    if (trend === 'new') return `<span class="trend trend-new">新进</span>`;
    if (trend === 'out') return `<span class="trend trend-out">掉榜</span>`;
    return `<span class="trend trend-flat">—</span>`;
  }
  function sourceBadge(type) {
    if (type === 'official_original') return badge('官方原始', 'official', 'shield');
    if (type === 'article_citation') return badge('公众号转述', 'citation');
    return badge('人工整理', 'manual');
  }
  function articleStatusBadge(status) {
    if (status === 'parsed') return badge('已解析', 'success');
    if (status === 'failed') return badge('解析失败', 'danger');
    if (status === 'needs_review') return badge('待人工确认', 'warning');
    return badge('待解析', 'neutral');
  }
  function categoryPathHTML(path) {
    if (!path) return '<span class="muted">未分类</span>';
    return path.map((p, i) => p
      ? `<span class="tag ${i === 2 ? 'tag-accent' : ''}">${esc(p)}</span>`
      : `<span class="tag" style="border-style:dashed;color:var(--warning)">L${i + 1} 待补</span>`).join('<span class="muted" style="margin:0 2px">/</span>');
  }
  function confidenceBar(v) {
    const pct = Math.round((v || 0) * 100);
    return `<span class="confidence"><span class="confidence-bar"><span style="width:${pct}%"></span></span>${pct}%</span>`;
  }
  function emptyHTML(iconName, title, desc, actionHTML) {
    return `<div class="empty"><div class="empty-icon">${icon(iconName)}</div><div class="empty-title">${esc(title)}</div><div class="empty-desc">${esc(desc || '')}</div>${actionHTML || ''}</div>`;
  }
  function bannerHTML(type, iconName, text) {
    return `<div class="banner banner-${type}">${icon(iconName)}<div>${text}</div></div>`;
  }

  /* ---------- 状态 ---------- */
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('ri_proto_user') || 'null'); } catch (e) { return null; }
  })();

  function makeDigest(date) {
    return {
      date,
      status: 'draft',
      generatedAt: date === '2026-10-16' ? '2026-10-16 07:42' : '2026-10-17 09:30',
      items: M.digestItems.map((i) => Object.assign({}, i))
    };
  }

  const digestStore = { '2026-10-16': makeDigest('2026-10-16') };

  const state = {
    user: savedUser,
    route: { name: 'workbench', key: 'workbench', params: {} },
    login: { role: 'operator', error: '' },
    forms: { loginPassword: 'admin123', ingestLinks: '', fulltextTitle: '', fulltext: '' },
    overlay: null,
    toast: null,
    ingest: {
      tab: 'link',
      parsing: false,
      screenshotName: '',
      summary: null,
      results: [
        { title: '抓大鹅重回第一，消除赛道又热了', source: '游戏葡萄', method: '链接', status: '已入库', obs: 5, claims: 2, time: '08:21', articleId: 'a1' },
        { title: '10月16日小游戏榜：抖音休闲新品集体上冲', source: '罗斯基', method: '链接', status: '已入库', obs: 5, claims: 3, time: '09:12', articleId: 'a2' },
        { title: '10月16日买量榜：末日题材继续霸榜', source: 'DataEye', method: '链接', status: '解析失败', obs: 0, claims: 0, time: '10:24', articleId: 'a3' }
      ]
    },
    review: { tab: 'mapping', done: { mapping: [], category: [], claims: [], errors: [] } },
    rankings: { platform: 'wechat_mini', board: 'hot', date: '2026-10-16', citationIndex: 0, loading: false },
    games: { q: '', platform: 'all', category: 'all' },
    gameProfile: { id: null, tab: 'overview' },
    digest: { date: '2026-10-16', editingId: null, editingText: '' },
    settings: {
      tab: 'sources',
      model: Object.assign({}, M.modelConfig),
      test: { loading: false, ok: false, latency: 0 }
    }
  };

  function reviewCounts() {
    const done = state.review.done;
    return {
      mapping: M.review.mapping.filter((r) => !done.mapping.includes(r.id)).length,
      category: M.review.category.filter((r) => !done.category.includes(r.id)).length,
      claims: M.review.claims.filter((id) => !done.claims.includes(id)).length,
      errors: M.review.errors.filter((r) => !done.errors.includes(r.id)).length
    };
  }
  function totalPending() {
    const c = reviewCounts();
    return c.mapping + c.category + c.claims + c.errors;
  }
  function canWrite() { return state.user && (state.user.role === 'operator' || state.user.role === 'admin'); }
  function canAccess(name, role) {
    if (name === 'ingest' || name === 'review') return role === 'operator' || role === 'admin';
    if (name === 'settings') return role === 'admin';
    return true;
  }
  function currentSnapshotKey() {
    return `${state.rankings.platform}:${state.rankings.board}:${state.rankings.date}`;
  }

  let toastTimer = null;
  function toast(msg, type) {
    state.toast = { msg, type: type || 'success' };
    clearTimeout(toastTimer);
    render();
    toastTimer = setTimeout(() => {
      state.toast = null;
      const el = document.querySelector('.toast');
      if (el) el.remove();
    }, 2800);
  }

  function openOverlay(obj) { state.overlay = obj; render(); }
  function closeOverlay() { state.overlay = null; render(); }

  /* ---------- 路由 ---------- */
  function parseRoute() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    if (!raw) return { name: 'workbench', key: 'workbench', params: {} };
    const parts = raw.split('/').filter(Boolean);
    const seg = parts[0];
    if (seg === 'login') return { name: 'login', key: 'login', params: {} };
    if (seg === 'ingest') return { name: 'ingest', key: 'ingest', params: {} };
    if (seg === 'review') return { name: 'review', key: 'review', params: {} };
    if (seg === 'rankings') return { name: 'rankings', key: 'rankings', params: {} };
    if (seg === 'games') return parts[1] ? { name: 'gameProfile', key: 'games', params: { id: parts[1] } } : { name: 'games', key: 'games', params: {} };
    if (seg === 'digest') return { name: 'digest', key: 'digest', params: { date: parts[1] || state.digest.date } };
    if (seg === 'articles') return { name: 'article', key: 'article', params: { id: parts[1] } };
    if (seg === 'settings') return { name: 'settings', key: 'settings', params: {} };
    return { name: 'notFound', key: 'notFound', params: {} };
  }

  let lastKey = null;
  function render() {
    const route = parseRoute();
    state.route = route;
    const app = $('#app');
    if (!app) return;

    if (!state.user) {
      if (route.name !== 'login') { location.replace('#/login'); return; }
      const y = window.scrollY;
      app.innerHTML = loginView() + overlayHTML() + toastHTML();
      window.scrollTo(0, y);
      return;
    }
    if (route.name === 'login') { location.replace('#/'); return; }

    let content;
    if (!canAccess(route.name, state.user.role)) content = forbiddenView();
    else content = viewFor(route);

    const shouldTop = lastKey !== route.key;
    const y = window.scrollY;
    app.innerHTML = appShell(content, route) + overlayHTML() + toastHTML();
    if (shouldTop) window.scrollTo(0, 0);
    else window.scrollTo(0, y);
    lastKey = route.key;
  }

  function toastHTML() {
    if (!state.toast) return '';
    const t = state.toast;
    const iconName = t.type === 'danger' ? 'alert-triangle' : t.type === 'warning' ? 'alert-triangle' : 'check-circle';
    return `<div class="toast toast-${t.type}">${icon(iconName)}${esc(t.msg)}</div>`;
  }

  function navItems() {
    const items = [
      { key: 'workbench', href: '#/', label: '今日工作台', icon: 'layout-dashboard' },
      { key: 'ingest', href: '#/ingest', label: '投喂台', icon: 'inbox', roles: ['operator', 'admin'] },
      { key: 'review', href: '#/review', label: '待核队列', icon: 'list-checks', roles: ['operator', 'admin'], badge: totalPending() },
      { key: 'rankings', href: '#/rankings', label: '榜单中心', icon: 'bar-chart-3' },
      { key: 'games', href: '#/games', label: '游戏库', icon: 'gamepad-2' },
      { key: 'digest', href: '#/digest/' + state.digest.date, label: '日报编辑器', icon: 'newspaper' },
      { key: 'settings', href: '#/settings', label: '设置', icon: 'settings', roles: ['admin'] }
    ];
    return items.filter((i) => !i.roles || i.roles.includes(state.user.role));
  }

  function appShell(content, route) {
    const titleMap = {
      workbench: '今日工作台', ingest: '投喂台', review: '待核队列', rankings: '榜单中心',
      games: '游戏库', gameProfile: '游戏档案', digest: '日报编辑器', article: '文章详情',
      settings: '设置', forbidden: '无访问权限', notFound: '页面不存在'
    };
    const title = titleMap[route.name] || '榜单情报台';
    const nav = navItems().map((item) => {
      const active = route.key === item.key;
      return `<a class="nav-item ${active ? 'active' : ''}" href="${item.href}">
        ${icon(item.icon)}<span class="nav-label">${item.label}</span>
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      </a>`;
    }).join('');

    return `<div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">榜</div>
          <div class="brand-text"><div class="brand-name">榜单情报台</div><div class="brand-sub">Ranking Intel</div></div>
        </div>
        <nav class="nav">${nav}</nav>
        <div class="sidebar-foot">
          <div class="user-chip">
            <div class="avatar">${esc(state.user.name.slice(0, 1))}</div>
            <div class="user-meta"><div class="user-name">${esc(state.user.name)}</div><div class="user-role">${roleLabel[state.user.role]} · ${state.user.role === 'lead' ? '只读视角' : '可编辑'}</div></div>
            <button class="user-logout" title="退出登录" data-action="logout">${icon('log-out')}</button>
          </div>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
            <div class="crumb">榜单情报台 / ${title}</div>
            <div class="page-title">${title}</div>
          </div>
          <div class="topbar-right">
            ${state.user.role === 'lead' ? badge('只读视角', 'neutral', 'lock') : ''}
            <span class="date-chip">${icon('calendar')}数据日 2026-10-16</span>
            <span class="role-wrap">
              <select class="role-select" data-action="switch-role" title="演示：切换角色视角">
                <option value="operator" ${state.user.role === 'operator' ? 'selected' : ''}>运营视角</option>
                <option value="lead" ${state.user.role === 'lead' ? 'selected' : ''}>负责人视角</option>
                <option value="admin" ${state.user.role === 'admin' ? 'selected' : ''}>管理员视角</option>
              </select>
            </span>
          </div>
        </header>
        <div class="content">${content}</div>
      </div>
    </div>`;
  }

  function viewFor(route) {
    switch (route.name) {
      case 'workbench': return workbenchView();
      case 'ingest': return ingestView();
      case 'review': return reviewView();
      case 'rankings': return rankingsView();
      case 'games': return gamesView();
      case 'gameProfile': return gameProfileView(route.params.id);
      case 'digest': return digestView(route.params.date);
      case 'article': return articleView(route.params.id);
      case 'settings': return settingsView();
      case 'notFound': return notFoundView();
      default: return workbenchView();
    }
  }

  function forbiddenView() {
    return `<div class="page"><div class="card"><div class="empty" style="padding:72px 20px">
      <div class="empty-icon">${icon('lock')}</div>
      <div class="empty-title">当前角色无访问权限</div>
      <div class="empty-desc">你正在使用${esc(roleLabel[state.user.role])}视角。该页面仅对指定角色开放，可切换角色视角体验，或返回工作台。</div>
      <a class="btn btn-primary" style="margin-top:8px" href="#/">返回今日工作台</a>
    </div></div></div>`;
  }

  function notFoundView() {
    return `<div class="page"><div class="card">${emptyHTML('search', '页面不存在', '链接可能已失效，返回工作台继续。', '<a class="btn btn-primary" style="margin-top:8px" href="#/">返回今日工作台</a>')}</div></div>`;
  }

  /* ---------- 登录 ---------- */
  function loginView() {
    return `<div class="login">
      <section class="login-left">
        <div class="login-brand">
          <div class="brand-mark">榜</div>
          <div><div class="brand-name">榜单情报台</div><div class="brand-sub">Ranking Intel</div></div>
        </div>
        <div class="login-hero">
          <div class="login-kicker">Mini Game Ranking Intelligence</div>
          <h1>把每天的榜单解读，<br>沉淀成可回溯的情报。</h1>
          <p>面向微小 / 抖小游戏运营团队。统一投喂、交叉验证、按品类归档，每天生成一份带来源引用的日报初稿。</p>
        </div>
        <div class="login-stats">
          <div class="login-stat"><div class="num">${M.sources.length}</div><div class="lab">已接入信源</div></div>
          <div class="login-stat"><div class="num">${totalPending()}</div><div class="lab">今日待核</div></div>
          <div class="login-stat"><div class="num">${M.digestItems.length}</div><div class="lab">日报条目</div></div>
        </div>
      </section>
      <section class="login-right">
        <div class="login-card">
          <h2>进入工作台</h2>
          <p class="sub">选择演示角色，体验不同权限下的页面与操作。</p>
          <form data-submit="login">
            <div class="field">
              <label>演示角色</label>
              <div class="role-pick">
                ${['operator', 'lead', 'admin'].map((r) => `<button type="button" class="role-option ${state.login.role === r ? 'active' : ''}" data-action="pick-role" data-role="${r}">
                  <div class="role-name">${roleLabel[r]}</div>
                  <div class="role-desc">${r === 'operator' ? '投喂 / 待核 / 日报' : r === 'lead' ? '只读 / 抽查来源' : '全部权限 / 设置'}</div>
                </button>`).join('')}
              </div>
            </div>
            <div class="field">
              <label for="login-password">登录密码</label>
              <input class="input" id="login-password" type="password" value="${esc(state.forms.loginPassword)}" data-form="loginPassword" placeholder="请输入密码">
            </div>
            ${state.login.error ? `<div class="login-error">${esc(state.login.error)}</div>` : ''}
            <button class="btn btn-primary" type="submit" style="width:100%;margin-top:16px;padding:11px 14px">登录</button>
          </form>
          <div class="login-hint">演示账号：任意角色，密码 <strong>admin123</strong>。登录后可在右上角切换角色视角。</div>
          <div class="login-foot">原型 V0.1 · 仅用于流程与交互验证，数据均为模拟</div>
        </div>
      </section>
    </div>`;
  }

  /* ---------- 今日工作台 ---------- */
  function workbenchView() {
    const now = new Date();
    const c = reviewCounts();
    const pending = totalPending();
    const activeSources = M.sources.filter((s) => s.status === 'active').length;
    const d = digestStore['2026-10-16'];
    const total = d ? d.items.length : 0;
    const selected = d ? d.items.filter((i) => i.selected).length : 0;
    const pct = total ? Math.round((selected / total) * 100) : 0;
    const movements = M.workbench.movements.map((m) => {
      const g = gameById(m.gameId);
      return `<tr class="row-click" data-action="open-game" data-id="${g.id}">
        <td>${gameCell(g)}</td>
        <td><span class="badge badge-neutral">${platformLabel(m.platform)}</span></td>
        <td><span class="rank ${m.rank <= 3 ? 'rank-top' : ''}">${m.rank}</span></td>
        <td>${trendHTML(m.trend, m.delta)}</td>
        <td class="muted">${esc(m.note)}</td>
        <td>${m.platform === 'douyin_mini' ? badge('转述', 'warning') : badge('官方', 'official')}</td>
      </tr>`;
    }).join('');

    const todos = [
      { tab: 'mapping', label: '榜单观测待映射', count: c.mapping, color: '#b9663c' },
      { tab: 'category', label: 'L3 品类待补', count: c.category, color: '#a97722' },
      { tab: 'claims', label: '低置信观点', count: c.claims, color: '#396a86' },
      { tab: 'errors', label: '解析异常', count: c.errors, color: '#b3453d' }
    ].map((t) => `<div class="todo-row">
      <span class="todo-dot" style="background:${t.color}"></span>
      <span class="todo-label">${t.label}</span>
      <span class="todo-count">${t.count}</span>
      ${canWrite() ? `<button class="todo-link" data-action="go-review" data-tab="${t.tab}" title="前往处理">${icon('chevron-right')}</button>` : ''}
    </div>`).join('');

    const recents = state.ingest.results.slice(0, 3).map((r) => `<a class="recent-row" href="#/articles/${r.articleId}" style="color:inherit">
      <div class="grow">
        <div class="recent-title">${esc(r.title)}</div>
        <div class="recent-meta"><span>${esc(r.source)}</span><span>·</span><span>${esc(r.time)}</span></div>
      </div>
      ${r.status === '已入库' ? badge('已入库', 'success') : r.status === '解析失败' ? badge('失败', 'danger') : badge(r.status, 'warning')}
    </a>`).join('');

    return `<div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">${todayLabel(now)}</div>
          <h1 class="display">${greetingFor(now)}</h1>
          <p class="page-sub">昨天共收录 ${M.articles.length} 篇文章、生成 ${M.observations.length} 条榜单观测。还有 <strong>${pending} 项待核</strong>，日报尚未定稿。</p>
        </div>
        <div class="page-actions">
          ${canWrite() ? `<a class="btn btn-primary" href="#/ingest">${icon('inbox')}投喂文章</a>` : ''}
          <a class="btn btn-ghost" href="#/digest/2026-10-16">${icon('newspaper')}继续日报</a>
        </div>
      </div>

      <div class="grid grid-4">
        <div class="stat" ${canWrite() ? 'style="cursor:pointer" data-action="go-review" data-tab="mapping"' : ''}>
          <div class="stat-label">${icon('list-checks')}待核事项</div>
          <div class="stat-value stat-accent-2">${pending}</div>
          <div class="stat-foot">${c.mapping} 映射 · ${c.category} 品类 · ${c.claims} 观点 · ${c.errors} 异常</div>
        </div>
        <div class="stat">
          <div class="stat-label">${icon('activity')}今日新进</div>
          <div class="stat-value">${M.workbench.newEntries}</div>
          <div class="stat-foot">微信 5 · 抖音 2</div>
        </div>
        <div class="stat">
          <div class="stat-label">${icon('database')}覆盖信源</div>
          <div class="stat-value">${M.sources.length}</div>
          <div class="stat-foot">${activeSources} 个公众号活跃 · 较昨日 +3</div>
        </div>
        <a class="stat" href="#/digest/2026-10-16" style="color:inherit">
          <div class="stat-label">${icon('newspaper')}日报进度</div>
          <div class="stat-value">${selected}<span class="unit">/ ${total} 条</span></div>
          <div class="progress" style="margin-top:8px"><div class="progress-bar" style="width:${pct}%"></div></div>
        </a>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card-head">
            <div class="card-title">${icon('bar-chart-3')}今日榜单异动</div>
            <a class="link small" href="#/rankings">查看榜单中心 ${icon('chevron-right', '')}</a>
          </div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>游戏</th><th>平台</th><th>名次</th><th>变化</th><th>备注</th><th>信源</th></tr></thead>
            <tbody>${movements}</tbody>
          </table></div>
          <div class="card-foot" style="justify-content:space-between">
            <span class="hint">抖音热门榜当前仅有转述，未经官方核对</span>
            <a class="btn btn-ghost btn-sm" href="#/rankings">进入榜单中心</a>
          </div>
        </div>

        <div class="side-stack">
          <div class="card">
            <div class="card-head"><div class="card-title">${icon('list-checks')}待核队列</div>${badge(pending + ' 项', 'warning')}</div>
            <div class="card-body" style="padding-top:6px;padding-bottom:6px">${todos}</div>
            <div class="card-foot">${canWrite() ? '<a class="btn btn-soft btn-sm" href="#/review">进入待核队列</a>' : '<span class="hint">负责人视角仅可查看数量</span>'}</div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${icon('newspaper')}日报进度</div>${d ? badge(d.status === 'draft' ? '草稿' : '已定稿', d.status === 'draft' ? 'warning' : 'success') : badge('未生成', 'neutral')}</div>
            <div class="card-body">
              <div class="flex-between small"><span class="muted">已选条目</span><strong>${selected} / ${total}</strong></div>
              <div class="progress" style="margin:8px 0 10px"><div class="progress-bar" style="width:${pct}%"></div></div>
              <div class="hint">生成于 ${d ? esc(d.generatedAt) : '—'}；定稿后可导出 Markdown。</div>
            </div>
            <div class="card-foot"><a class="btn btn-primary btn-sm" href="#/digest/2026-10-16">${d && d.status === 'reviewed' ? '查看日报' : '继续编辑'}</a></div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${icon('inbox')}最近投喂</div>${canWrite() ? '<a class="link small" href="#/ingest">全部</a>' : ''}</div>
            <div class="card-body" style="padding-top:5px;padding-bottom:5px">${recents}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- 投喂台 ---------- */
  function parseStepsHTML() {
    const steps = ['抓取正文', '去重检查', 'AI 抽取', '写入待核'];
    return `<div class="parse-steps">${steps.map((s, i) => `<div class="parse-step ${i === 0 ? 'active' : ''}">${i === 0 ? '<span class="spinner spinner-dark"></span>' : icon('circle-dot')}${s}</div>`).join('')}</div>`;
  }

  function ingestResultsTable() {
    if (!state.ingest.results.length) return emptyHTML('inbox', '还没有投喂记录', '从上方选择任一通道开始。');
    const rows = state.ingest.results.map((r) => `<tr>
      <td><div class="game-name">${esc(r.title)}</div><div class="game-sub">${esc(r.source)}</div></td>
      <td><span class="badge badge-neutral">${esc(r.method)}</span></td>
      <td>${r.status === '已入库' ? badge('已入库', 'success') : r.status === '解析失败' ? badge('解析失败', 'danger') : badge(r.status, 'warning')}</td>
      <td class="mono">${r.obs}</td>
      <td class="mono">${r.claims}</td>
      <td class="muted mono">${esc(r.time)}</td>
      <td><a class="link small" href="#/articles/${r.articleId}">查看</a></td>
    </tr>`).join('');
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>文章</th><th>通道</th><th>状态</th><th>观测</th><th>观点</th><th>时间</th><th>操作</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function ingestView() {
    const tab = state.ingest.tab;
    let panel = '';
    if (tab === 'link') {
      panel = `<div class="card ingest-panel"><div class="card-head"><div class="card-title">${icon('link')}链接投喂</div><span class="hint">一次最多 20 条，逐行粘贴</span></div>
        <div class="card-body">
          <div class="field">
            <label>公众号文章链接</label>
            <textarea class="textarea" data-form="ingestLinks" placeholder="https://mp.weixin.qq.com/s/...&#10;https://mp.weixin.qq.com/s/...">${esc(state.forms.ingestLinks)}</textarea>
            <span class="hint">支持 URL 精确去重与正文指纹去重；重复投喂会提示已存在。</span>
          </div>
          <div class="form-foot">
            <button class="btn btn-ghost" data-action="fill-demo-links">${icon('sparkles')}填入示例链接</button>
            <button class="btn btn-primary" data-action="parse-link" ${state.ingest.parsing ? 'disabled' : ''}>${state.ingest.parsing ? '<span class="spinner"></span>正在解析' : '开始解析'}</button>
          </div>
          ${state.ingest.parsing ? parseStepsHTML() : ''}
        </div>
      </div>`;
    } else if (tab === 'screenshot') {
      panel = `<div class="card ingest-panel"><div class="card-head"><div class="card-title">${icon('image')}截图投喂</div><span class="hint">OCR 结果将进入预览</span></div>
        <div class="card-body">
          <input id="shot-file" type="file" accept="image/*" hidden>
          <div class="dropzone" data-action="pick-screenshot">
            <div class="drop-icon">${icon('upload')}</div>
            <div class="dropzone-title">拖拽榜单截图到这里，或点击选择</div>
            <div class="dropzone-desc">也可以直接 Ctrl+V 粘贴剪贴板中的截图</div>
          </div>
          ${state.ingest.screenshotName ? `<div class="file-row mt-12">${icon('image', 'file-icon')}<div class="grow"><div class="game-name">${esc(state.ingest.screenshotName)}</div><div class="game-sub">已读取，等待 OCR 识别</div></div><button class="btn btn-ghost btn-sm" data-action="clear-screenshot">移除</button></div>` : ''}
          <div class="form-foot">
            <span class="hint">低置信度行（&lt; 0.7）会自动进入待核队列。</span>
            <button class="btn btn-primary" data-action="parse-screenshot" ${!state.ingest.screenshotName || state.ingest.parsing ? 'disabled' : ''}>${state.ingest.parsing ? '<span class="spinner"></span>识别中' : '开始识别'}</button>
          </div>
          ${state.ingest.parsing ? parseStepsHTML() : ''}
        </div>
      </div>`;
    } else {
      panel = `<div class="card ingest-panel"><div class="card-head"><div class="card-title">${icon('file-text')}全文兜底</div><span class="hint">链接抓取失败时使用</span></div>
        <div class="card-body">
          <div class="stack">
            <div class="field"><label>文章标题</label><input class="input" data-form="fulltextTitle" value="${esc(state.forms.fulltextTitle)}" placeholder="例如：10月16日小游戏榜：抓大鹅重回第一"></div>
            <div class="field"><label>正文全文</label><textarea class="textarea" style="min-height:180px" data-form="fulltext" placeholder="将公众号文章正文整段粘贴到这里">${esc(state.forms.fulltext)}</textarea></div>
          </div>
          <div class="form-foot">
            <button class="btn btn-ghost" data-action="fill-demo-fulltext">${icon('sparkles')}填入示例全文</button>
            <button class="btn btn-primary" data-action="parse-fulltext" ${state.ingest.parsing ? 'disabled' : ''}>${state.ingest.parsing ? '<span class="spinner"></span>正在解析' : '开始解析'}</button>
          </div>
          ${state.ingest.parsing ? parseStepsHTML() : ''}
        </div>
      </div>`;
    }

    return `<div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Ingest</div>
          <h1 class="display">投喂台</h1>
          <p class="page-sub">把分散在公众号里的榜单与观点收进来。三通道最终产出同一种解析结果，预览确认后再入库。</p>
        </div>
        <div class="page-actions"><a class="btn btn-ghost" href="#/review">${icon('list-checks')}待核队列 ${badge(totalPending(), 'warning')}</a></div>
      </div>

      ${state.ingest.summary ? bannerHTML('success', 'check-circle', `已入库 <strong>${state.ingest.summary.ingested}</strong> 篇，跳过 <strong>${state.ingest.summary.skipped}</strong> 篇重复；生成 ${state.ingest.summary.obs} 条榜单观测、${state.ingest.summary.claims} 条观点。`) : ''}

      <div class="tabs">
        ${[['link', '链接投喂', 'link'], ['screenshot', '截图投喂', 'image'], ['fulltext', '全文兜底', 'file-text']].map(([k, label, ic]) => `<button class="tab ${tab === k ? 'active' : ''}" data-action="ingest-tab" data-tab="${k}">${icon(ic)}${label}</button>`).join('')}
      </div>

      ${panel}

      <div class="section-head"><h2>最近投喂</h2><span class="hint">按接收时间倒序 · 状态由解析管道回写</span></div>
      <div class="card">${ingestResultsTable()}</div>
    </div>`;
  }

  /* ---------- 待核队列 ---------- */
  function reviewView() {
    const c = reviewCounts();
    const tab = state.review.tab;
    if (!['mapping', 'category', 'claims', 'errors'].includes(tab)) state.review.tab = 'mapping';
    const active = state.review.tab;
    let content = '';

    if (active === 'mapping') {
      const rows = M.review.mapping.filter((r) => !state.review.done.mapping.includes(r.id));
      content = rows.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>原始名称</th><th>平台 / 榜次</th><th>来源文章</th><th>建议游戏</th><th>置信度</th><th>操作</th></tr></thead>
        <tbody>${rows.map((r) => {
          const g = gameById(r.suggestedGameId);
          const a = articleById(r.articleId);
          return `<tr>
            <td><span class="game-name">${esc(r.rawName)}</span><div class="game-sub">${platformLabel(r.platform)} · ${boardLabel(r.board)} #${r.rank}</div></td>
            <td><span class="badge badge-neutral">${platformLabel(r.platform)}</span></td>
            <td><a class="link small" href="#/articles/${r.articleId}">${esc(a ? a.title : '—')}</a></td>
            <td>${g ? gameCell(g) : '<span class="muted">无建议，需新建</span>'}</td>
            <td>${confidenceBar(r.confidence)}</td>
            <td><button class="btn btn-soft btn-sm" data-action="open-map" data-id="${r.id}">${g ? '确认映射' : '新建游戏'}</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>` : emptyHTML('check-circle', '映射队列已清空', '所有榜单观测都已关联到游戏库。');
    }

    if (active === 'category') {
      const rows = M.review.category.filter((r) => !state.review.done.category.includes(r.id));
      content = rows.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>游戏</th><th>当前路径</th><th>建议 L3</th><th>来源</th><th>操作</th></tr></thead>
        <tbody>${rows.map((r) => {
          const g = gameById(r.gameId);
          const a = articleById(r.articleId);
          return `<tr>
            <td>${gameCell(g)}</td>
            <td>${categoryPathHTML([r.l1, r.l2, null])}</td>
            <td><span class="badge badge-warning">${esc(r.suggestedL3)}</span></td>
            <td><a class="link small" href="#/articles/${r.articleId}">${esc(a ? a.title : '—')}</a></td>
            <td><button class="btn btn-soft btn-sm" data-action="open-category" data-id="${r.id}">补全品类</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>` : emptyHTML('check-circle', '品类已补齐', '进入日报的游戏都已具备 L3 路径。');
    }

    if (active === 'claims') {
      const rows = M.review.claims.filter((id) => !state.review.done.claims.includes(id)).map((id) => claimById(id)).filter(Boolean);
      content = rows.length ? `<div class="card"><div class="card-body" style="padding-top:4px;padding-bottom:4px">${rows.map((cl) => {
        const a = articleById(cl.articleId);
        const g = cl.subjectType === 'game' ? gameById(cl.subjectId) : null;
        return `<div class="claim-card">
          <div class="flex-between wrap">
            <div class="claim-text">${esc(cl.text)}</div>
            <span class="badge badge-warning">置信度 ${Math.round(cl.confidence * 100)}%</span>
          </div>
          <div class="claim-quote">“${esc(cl.quote)}”</div>
          <div class="claim-meta">
            <span>${g ? esc(g.name) : '品类观点'}</span><span>·</span>
            <a class="link" href="#/articles/${cl.articleId}">${esc(a ? a.title : '原文')}</a><span>·</span>
            <span>${esc(cl.time)}</span>
            <span class="stance stance-${cl.stance}">${cl.stance === 'positive' ? '正面' : cl.stance === 'negative' ? '负面' : '中性'}</span>
          </div>
          <div class="flex" style="margin-top:10px">
            <button class="btn btn-soft btn-sm" data-action="claim-confirm" data-id="${cl.id}">${icon('check')}确认观点</button>
            <button class="btn btn-ghost btn-sm" data-action="claim-dispute" data-id="${cl.id}">标记为分歧</button>
          </div>
        </div>`;
      }).join('')}</div></div>` : emptyHTML('check-circle', '低置信观点已处理', '观点库中当前没有待核实条目。');
    }

    if (active === 'errors') {
      const rows = M.review.errors.filter((r) => !state.review.done.errors.includes(r.id));
      content = rows.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>文章</th><th>失败原因</th><th>重试次数</th><th>接收时间</th><th>操作</th></tr></thead>
        <tbody>${rows.map((r) => {
          const a = articleById(r.articleId);
          return `<tr>
            <td><div class="game-name">${esc(a ? a.title : r.articleId)}</div><div class="game-sub">${esc(a ? sourceById(a.sourceId).name : '')}</div></td>
            <td><span class="badge badge-danger">${esc(r.reason)}</span></td>
            <td class="mono">${r.attempts}</td>
            <td class="muted mono">${esc(r.time)}</td>
            <td><div class="flex"><button class="btn btn-soft btn-sm" data-action="retry-error" data-id="${r.id}">${icon('refresh-cw')}重试</button><button class="btn btn-ghost btn-sm" data-action="go-fulltext" data-article="${r.articleId}">转全文</button></div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>` : emptyHTML('check-circle', '解析队列正常', '没有失败或超时的解析任务。');
    }

    return `<div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Review Queue</div>
          <h1 class="display">待核队列</h1>
          <p class="page-sub">系统不替你做判断：名称对不上、品类缺 L3、观点置信度低、正文抓取失败，都在这里集中处理。</p>
        </div>
        <div class="page-actions"><span class="badge badge-warning" style="padding:9px 12px">${totalPending()} 项待处理</span></div>
      </div>

      <div class="tabs">
        ${[['mapping', '榜单映射', c.mapping], ['category', '品类待补', c.category], ['claims', '低置信观点', c.claims], ['errors', '解析异常', c.errors]].map(([k, label, n]) => `<button class="tab ${active === k ? 'active' : ''}" data-action="review-tab" data-tab="${k}">${label}<span class="tab-count">${n}</span></button>`).join('')}
      </div>

      <div class="card">${content}</div>
    </div>`;
  }

  /* ---------- 榜单中心 ---------- */
  function rankingsFilterHTML() {
    return `<div class="card"><div class="card-body">
      <form data-submit="ranking">
        <div class="filter-bar">
          <div class="field" style="min-width:auto">
            <label>平台</label>
            <div class="seg">
              ${Object.keys(M.platforms).map((p) => `<button type="button" class="seg-btn ${state.rankings.platform === p ? 'active' : ''}" data-action="ranking-platform" data-platform="${p}">${platformLabel(p)}</button>`).join('')}
            </div>
          </div>
          <div class="field"><label>榜种</label><select class="select" data-form="rankBoard">${Object.keys(M.boards).map((b) => `<option value="${b}" ${state.rankings.board === b ? 'selected' : ''}>${boardLabel(b)}</option>`).join('')}</select></div>
          <div class="field"><label>日期</label><input class="input" type="date" data-form="rankDate" value="${state.rankings.date}"></div>
          <button class="btn btn-primary" type="submit">${icon('search')}查询</button>
        </div>
      </form>
    </div></div>`;
  }

  function officialTableHTML(snap) {
    if (!snap.official) {
      return emptyHTML('shield', '暂无官方原始榜单', '当前只有公众号转述，快照为暂定状态，统计口径需谨慎。');
    }
    const rows = snap.official.entries.map((e) => {
      const g = gameById(e.gameId);
      return `<tr class="row-click" data-action="open-evidence" data-game="${e.gameId}">
        <td><span class="rank ${e.rank <= 3 ? 'rank-top' : ''}">${e.rank}</span></td>
        <td>${gameCell(g, g ? (g.categoryPath[1] || '品类待补') : '')}</td>
        <td>${trendHTML(e.trend, e.delta)}</td>
        <td><span class="badge badge-official">官方</span></td>
      </tr>`;
    }).join('');
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>名次</th><th>游戏</th><th>变化</th><th>信源</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function citationTableHTML(snap) {
    const citations = snap.citations || [];
    const idx = Math.min(state.rankings.citationIndex, Math.max(citations.length - 1, 0));
    const cite = citations[idx];
    if (!cite) return emptyHTML('file-text', '暂无转述来源', '等待公众号文章入库。');
    const officialMap = new Map(((snap.official && snap.official.entries) || []).map((e) => [e.gameId, e.rank]));
    const rows = cite.entries.map((e) => {
      const g = e.gameId ? gameById(e.gameId) : null;
      const oRank = e.gameId ? officialMap.get(e.gameId) : null;
      const diff = oRank ? e.rank - oRank : null;
      const isDiff = diff !== null && diff !== 0;
      const action = g ? `data-action="open-evidence" data-game="${g.id}"` : `data-action="unmapped"`;
      return `<tr class="row-click ${isDiff ? 'row-diff' : ''}" ${action}>
        <td><span class="rank ${e.rank <= 3 ? 'rank-top' : ''}">${e.rank}</span></td>
        <td>${g ? gameCell(g) : `<div class="game-cell">${gameAvatar(null)}<div><div class="game-name">${esc(e.rawName || '未命名')}</div><div class="game-sub">未映射</div></div></div>`}</td>
        <td>${oRank === null ? '<span class="diff-tag diff-tag-ok">待官方</span>' : isDiff ? `<span class="diff-tag">${diff > 0 ? '+' : ''}${diff}</span>` : '<span class="diff-tag diff-tag-ok">一致</span>'}</td>
      </tr>`;
    }).join('');
    return `<div class="source-tabs">${citations.map((c, i) => `<button type="button" class="source-tab ${i === idx ? 'active' : ''}" data-action="ranking-citation" data-index="${i}">${esc(c.sourceName)}</button>`).join('')}</div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>名次</th><th>游戏</th><th>相对官方</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function rankingsView() {
    const snap = M.rankings[currentSnapshotKey()];
    if (state.rankings.loading) {
      return `<div class="page">
        <div class="page-head"><div><div class="eyebrow">Rankings</div><h1 class="display">榜单中心</h1><p class="page-sub">官方原始与公众号转述并列展示，名次差异不自动合并。</p></div></div>
        ${rankingsFilterHTML()}
        <div class="card mt-16">${emptyHTML('clock', '正在读取快照…', '模拟查询延迟，稍后呈现官方与转述对照。')}</div>
      </div>`;
    }
    if (!snap) {
      return `<div class="page">
        <div class="page-head"><div><div class="eyebrow">Rankings</div><h1 class="display">榜单中心</h1><p class="page-sub">官方原始与公众号转述并列展示，名次差异不自动合并。</p></div></div>
        ${rankingsFilterHTML()}
        <div class="card mt-16">${emptyHTML('bar-chart-3', '该日期暂无快照', `${platformLabel(state.rankings.platform)} · ${boardLabel(state.rankings.board)} · ${state.rankings.date} 尚未生成榜单快照。`, canWrite() ? '<a class="btn btn-primary" style="margin-top:8px" href="#/ingest">去投喂文章</a>' : '')}</div>
      </div>`;
    }

    const openConflicts = (snap.conflicts || []).filter((c) => c.status === 'open').length;
    const statusBadge = snap.status === 'confirmed' ? badge('已确认', 'success', 'check-circle') : badge('暂定', 'warning', 'alert-triangle');
    const officialMeta = snap.official ? `基准快照：${snap.official.sourceName} · ${snap.official.capturedAt}` : '无官方原始榜单，仅按转述生成';

    return `<div class="page">
      <div class="page-head">
        <div><div class="eyebrow">Rankings</div><h1 class="display">榜单中心</h1><p class="page-sub">同一「平台 + 榜种 + 日期」下的多源观测在这里归并；官方优先作为基准，转述用于校验。</p></div>
        <div class="page-actions">${statusBadge}<span class="badge badge-neutral">${snap.citations.length} 家转述</span>${snap.status === 'provisional' ? badge('待官方核对', 'warning', 'alert-triangle') : openConflicts ? badge(openConflicts + ' 项差异', 'danger', 'alert-triangle') : badge('无差异', 'success')}</div>
      </div>

      ${rankingsFilterHTML()}

      <div class="snapshot-meta">
        <span>${icon('calendar')} ${snap.date}</span><span>·</span><strong>${officialMeta}</strong><span>·</span>
        <span>统计口径：${snap.official ? '官方基准快照' : '转述暂定'}</span>
      </div>

      ${snap.status === 'provisional' ? bannerHTML('warning', 'alert-triangle', '<strong>暂定快照：</strong>当前只有公众号转述，未经官方核对。日报中会标注该状态，差异不静默合并。') : ''}

      <div class="compare-grid mt-16">
        <div class="card">
          <div class="panel-head"><div class="panel-title">${icon('shield')}官方原始</div>${badge('基准', 'official')}</div>
          ${officialTableHTML(snap)}
          ${snap.official ? `<div class="card-foot" style="justify-content:space-between"><span class="hint">共 ${snap.official.entries.length} 条 · 展示前 ${snap.official.entries.length} 条</span><span class="hint">点击条目查看证据</span></div>` : ''}
        </div>
        <div class="card">
          <div class="panel-head"><div class="panel-title">${icon('message-square')}公众号转述</div>${badge('校验用', 'citation')}</div>
          ${citationTableHTML(snap)}
          <div class="card-foot" style="justify-content:space-between"><span class="hint">重复转述不重复计数</span><span class="hint">差异标红，不自动选边</span></div>
        </div>
      </div>

      <div class="banner banner-info mt-16">${icon('activity')}<div>转述只作为证据挂载，不覆盖官方基准。点击任一游戏可查看全部出处、名次差异与原文引用。</div></div>
    </div>`;
  }

  /* ---------- 游戏库 ---------- */
  function filteredGames() {
    const q = state.games.q.trim().toLowerCase();
    return M.games.filter((g) => {
      const hay = [g.name, g.publisher, g.developer].concat(g.aliases).join(' ').toLowerCase();
      const okQ = !q || hay.indexOf(q) >= 0;
      const okP = state.games.platform === 'all' || g.platforms.indexOf(state.games.platform) >= 0;
      const okC = state.games.category === 'all' || g.categoryPath[0] === state.games.category;
      return okQ && okP && okC;
    });
  }

  function gameRowsHTML() {
    const list = filteredGames();
    if (!list.length) return `<tr><td colspan="7">${emptyHTML('search', '没有匹配的游戏', '试试更短的关键词，或清空筛选条件。')}</td></tr>`;
    return list.map((g) => `<tr class="row-click" data-action="open-game" data-id="${g.id}">
      <td>${gameCell(g)}</td>
      <td>${categoryPathHTML(g.categoryPath)}</td>
      <td>${g.platforms.map((p) => `<span class="badge badge-neutral" style="margin-right:3px">${platformLabel(p)}</span>`).join('')}</td>
      <td><span class="rank ${g.stats.currentRank <= 3 ? 'rank-top' : ''}">${g.stats.currentRank}</span></td>
      <td class="mono">#${g.stats.bestRank}</td>
      <td class="mono">${g.stats.daysOnBoard} 天</td>
      <td>${g.quality.length ? `<span class="badge badge-warning">${esc(g.quality[0])}</span>` : '<span class="muted small">正常</span>'}</td>
    </tr>`).join('');
  }

  function refreshGameRows() {
    const body = $('#game-rows');
    if (body) body.innerHTML = gameRowsHTML();
    const count = $('#game-count');
    if (count) count.textContent = filteredGames().length + ' 款游戏';
  }

  function gamesView() {
    const list = filteredGames();
    return `<div class="page">
      <div class="page-head">
        <div><div class="eyebrow">Game Library</div><h1 class="display">游戏库</h1><p class="page-sub">一个游戏一条主品类路径，多个标签；榜单履历、观点档案与素材来源都挂在同一张档案上。</p></div>
        <div class="page-actions"><span class="badge badge-neutral" style="padding:9px 12px" id="game-count">${list.length} 款游戏</span></div>
      </div>

      <div class="card"><div class="card-body" style="padding:14px 18px">
        <div class="filter-bar">
          <div class="field grow" style="min-width:220px"><label>搜索</label><input class="input" data-form="gameSearch" value="${esc(state.games.q)}" placeholder="游戏名、别名、发行商"></div>
          <div class="field"><label>平台</label><select class="select" data-action="game-filter" data-field="platform">
            <option value="all" ${state.games.platform === 'all' ? 'selected' : ''}>全部平台</option>
            ${Object.keys(M.platforms).map((p) => `<option value="${p}" ${state.games.platform === p ? 'selected' : ''}>${platformLabel(p)}</option>`).join('')}
          </select></div>
          <div class="field"><label>L1 品类</label><select class="select" data-action="game-filter" data-field="category">
            <option value="all" ${state.games.category === 'all' ? 'selected' : ''}>全部品类</option>
            ${M.categoryTree.map((c) => `<option value="${c.name}" ${state.games.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select></div>
        </div>
      </div></div>

      <div class="card mt-16"><div class="table-wrap"><table class="table">
        <thead><tr><th>游戏</th><th>品类路径</th><th>平台</th><th>当前名次</th><th>历史最佳</th><th>在榜</th><th>数据质量</th></tr></thead>
        <tbody id="game-rows">${gameRowsHTML()}</tbody>
      </table></div></div>
    </div>`;
  }

  function historyRows(g) {
    const base = g.stats.currentRank;
    const platform = g.platforms[0];
    const rows = [
      { date: '2026-10-16', rank: base, trend: 'up', delta: 4, type: 'official_original' },
      { date: '2026-10-15', rank: base + 4, trend: 'flat', delta: 0, type: 'article_citation' },
      { date: '2026-10-14', rank: base + 3, trend: 'down', delta: -1, type: 'manual' },
      { date: '2026-10-13', rank: base + 2, trend: 'up', delta: 1, type: 'article_citation' },
      { date: '2026-10-12', rank: base + 3, trend: 'new', delta: null, type: 'official_original' },
      { date: '2026-10-11', rank: base + 5, trend: 'down', delta: -2, type: 'article_citation' },
      { date: '2026-10-10', rank: null, trend: 'out', delta: null, type: 'manual' }
    ];
    return rows.map((r) => `<tr>
      <td class="mono">${r.date}</td>
      <td><span class="badge badge-neutral">${platformLabel(platform)}</span> <span class="muted small">${boardLabel('hot')}</span></td>
      <td>${r.rank ? `<span class="rank ${r.rank <= 3 ? 'rank-top' : ''}">${r.rank}</span>` : '<span class="muted">—</span>'}</td>
      <td>${trendHTML(r.trend, r.delta)}</td>
      <td>${sourceBadge(r.type)}</td>
    </tr>`).join('');
  }

  function gameProfileView(id) {
    const g = gameById(id);
    if (!g) return notFoundView();
    if (state.gameProfile.id !== g.id) { state.gameProfile.id = g.id; state.gameProfile.tab = 'overview'; }
    const tab = state.gameProfile.tab;
    const claims = M.claims.filter((c) => c.subjectId === g.id);
    const obs = M.observations.filter((o) => o.gameId === g.id);
    const artIds = [];
    obs.forEach((o) => { if (o.articleId && artIds.indexOf(o.articleId) < 0) artIds.push(o.articleId); });
    const sourceArticles = (artIds.length ? artIds : ['a1', 'a2']).slice(0, 4).map(articleById).filter(Boolean);

    let tabContent = '';
    if (tab === 'overview') {
      tabContent = `<div class="grid grid-2">
        <div class="card">
          <div class="card-head"><div class="card-title">${icon('user')}基础身份</div>${badge(g.categorySource === 'human' ? '人工确认' : 'AI 建议', g.categorySource === 'human' ? 'success' : 'warning')}</div>
          <div class="card-body"><dl class="kv">
            <dt>主名</dt><dd>${esc(g.name)}</dd>
            <dt>发行商</dt><dd>${esc(g.publisher || '待补充')}</dd>
            <dt>研发商</dt><dd>${esc(g.developer || '待补充')}</dd>
            <dt>上线日期</dt><dd>${esc(g.release || '待补充')}</dd>
            <dt>运营状态</dt><dd>${esc(g.status || '待确认')}</dd>
            <dt>版号</dt><dd>${g.isbn ? '有' : '无 / 待确认'}</dd>
            <dt>首次收录</dt><dd>${esc(g.firstSeen)}</dd>
            <dt>最近出现</dt><dd>${esc(g.lastSeen)}</dd>
          </dl></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">${icon('layers')}品类身份</div>${badge('单一主路径', 'neutral')}</div>
          <div class="card-body">
            <div class="chip-list">${categoryPathHTML(g.categoryPath)}</div>
            <div class="divider"></div>
            <div class="flex-between small"><span class="muted">归类来源</span><span>${g.categorySource === 'human' ? '人工确认' : 'AI 建议'} · 置信度 ${Math.round(g.categoryConfidence * 100)}%</span></div>
            <div class="divider"></div>
            <div class="small muted" style="margin-bottom:6px">标签（玩法 / 题材 / 美术 / 变现 / 生命周期）</div>
            <div class="chip-list">${(g.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('') || '<span class="muted small">暂无标签</span>'}</div>
          </div>
        </div>
      </div>
      <div class="card mt-16">
        <div class="card-head"><div class="card-title">${icon('tag')}别名与口径</div><span class="hint">公众号叫法经人工确认后复用</span></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>别名 / 原始叫法</th><th>类型</th><th>来源</th><th>确认人</th><th>确认时间</th></tr></thead>
          <tbody>${(g.aliases.length ? g.aliases : ['（暂无别名）']).map((a, i) => `<tr><td>${esc(a)}</td><td>${i === 0 ? badge('公众号口径', 'citation') : badge('别名', 'neutral')}</td><td>${i === 0 ? '游戏葡萄 / 罗斯基' : '人工补充'}</td><td>${g.aliases.length ? '林渝' : '—'}</td><td class="muted mono">${g.aliases.length ? '2026-10-12' : '—'}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
      <div class="card mt-16">
        <div class="card-head"><div class="card-title">${icon('alert-triangle')}数据质量</div>${g.quality.length ? badge(g.quality.length + ' 项提示', 'warning') : badge('正常', 'success')}</div>
        <div class="card-body">${g.quality.length ? g.quality.map((q) => `<div class="flex" style="padding:5px 0"><span class="todo-dot" style="background:var(--warning)"></span><span class="small">${esc(q)}</span></div>`).join('') : '<div class="small muted">没有待处理的数据质量提示。</div>'}</div>
      </div>`;
    } else if (tab === 'history') {
      tabContent = `<div class="card">
        <div class="card-head"><div class="card-title">${icon('bar-chart-3')}近 7 日榜单履历</div><span class="hint">P1 将补充趋势图；本期以表格呈现</span></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>日期</th><th>平台 / 榜种</th><th>名次</th><th>变化</th><th>来源类型</th></tr></thead>
          <tbody>${historyRows(g)}</tbody>
        </table></div>
      </div>`;
    } else if (tab === 'claims') {
      tabContent = `<div class="card"><div class="card-body" style="padding-top:4px;padding-bottom:4px">
        ${claims.length ? claims.map((c) => {
          const a = articleById(c.articleId);
          return `<div class="claim-item">
            <div class="flex-between wrap"><div class="claim-text">${esc(c.text)}</div><div class="flex"><span class="stance stance-${c.stance}">${c.stance === 'positive' ? '正面' : c.stance === 'negative' ? '负面' : '中性'}</span>${badge(c.status === 'confirmed' ? '已确认' : c.status === 'disputed' ? '有分歧' : '待核实', c.status === 'confirmed' ? 'success' : c.status === 'disputed' ? 'danger' : 'warning')}</div></div>
            <div class="claim-quote">“${esc(c.quote)}”</div>
            <div class="claim-meta"><a class="link" href="#/articles/${c.articleId}">${esc(a ? a.title : '原文')}</a><span>·</span><span>${esc(c.time)}</span><span>·</span><span>置信度 ${Math.round(c.confidence * 100)}%</span></div>
          </div>`;
        }).join('') : emptyHTML('message-square', '还没有观点', '该游戏尚未被文章提及，或观点未通过引用校验。')}
      </div></div>`;
    } else {
      tabContent = `<div class="card"><div class="card-body" style="padding-top:4px;padding-bottom:4px">
        ${sourceArticles.length ? sourceArticles.map((a) => `<div class="source-item">${icon('file-text', 'file-icon')}<div class="grow"><div class="game-name">${esc(a.title)}</div><div class="game-sub">${esc(sourceById(a.sourceId).name)} · ${esc(a.publishedAt)} · ${a.method === 'link' ? '链接投喂' : a.method === 'screenshot' ? '截图投喂' : '全文兜底'}</div></div><a class="link small" href="#/articles/${a.id}">查看</a></div>`).join('') : emptyHTML('file-text', '暂无素材', '该游戏尚未关联文章或截图。')}
      </div></div>`;
    }

    return `<div class="page">
      <div class="page-head">
        <div class="game-head">
          ${gameAvatar(g)}
          <div>
            <div class="eyebrow">Game Profile</div>
            <h1 class="game-head-title">${esc(g.name)}</h1>
            <div class="game-head-sub">${esc(g.publisher)} · ${g.platforms.map(platformLabel).join(' / ')} · ${categoryPathHTML(g.categoryPath)}</div>
          </div>
        </div>
        <div class="page-actions">
          <a class="btn btn-ghost" href="#/games">${icon('arrow-left')}游戏库</a>
          ${canWrite() ? `<button class="btn btn-primary" data-action="open-game-edit">${icon('edit-3')}编辑档案</button>` : badge('只读', 'neutral', 'lock')}
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat"><div class="n">#${g.stats.currentRank}</div><div class="l">当前名次</div></div>
        <div class="profile-stat"><div class="n">#${g.stats.bestRank}</div><div class="l">历史最佳</div></div>
        <div class="profile-stat"><div class="n">${g.stats.daysOnBoard}</div><div class="l">在榜天数</div></div>
        <div class="profile-stat"><div class="n">${g.stats.streak}</div><div class="l">连续在榜</div></div>
      </div>

      <div class="tabs mt-16">
        ${[['overview', '概览'], ['history', '榜单履历'], ['claims', '观点档案'], ['sources', '素材溯源']].map(([k, label]) => `<button class="tab ${tab === k ? 'active' : ''}" data-action="profile-tab" data-tab="${k}">${label}</button>`).join('')}
      </div>
      ${tabContent}
    </div>`;
  }

  /* ---------- 日报编辑器 ---------- */
  function digestItemHTML(item, d) {
    const locked = d.status !== 'draft' || !canWrite();
    const editing = state.digest.editingId === item.id;
    return `<div class="digest-item ${item.selected ? '' : 'excluded'}">
      <input class="digest-check" type="checkbox" data-action="digest-toggle" data-id="${item.id}" ${item.selected ? 'checked' : ''} ${locked ? 'disabled' : ''}>
      ${locked ? '' : `<div class="digest-order">
        <button class="order-btn" data-action="digest-move" data-id="${item.id}" data-dir="-1" title="上移">${icon('chevrons-up')}</button>
        <button class="order-btn" data-action="digest-move" data-id="${item.id}" data-dir="1" title="下移">${icon('chevrons-down')}</button>
      </div>`}
      <div class="digest-main">
        ${editing ? `<textarea class="digest-textarea" data-form="digestEdit">${esc(state.digest.editingText)}</textarea>
          <div class="flex" style="margin-top:6px"><button class="btn btn-soft btn-sm" data-action="digest-edit-save" data-id="${item.id}">${icon('check')}保存</button><button class="btn btn-ghost btn-sm" data-action="digest-edit-cancel">取消</button></div>`
          : `<div class="digest-text">${esc(item.text)}</div>`}
        <div class="digest-meta">
          <button class="source-chip" data-action="digest-source" data-id="${item.id}">${icon('link')}${esc(item.source)}</button>
          ${item.edited ? badge('人工改写', 'accent', 'edit-3') : ''}
        </div>
      </div>
      ${locked || editing ? '' : `<div class="digest-actions">
        <button class="btn btn-icon btn-ghost" title="改写" data-action="digest-edit" data-id="${item.id}">${icon('edit-3')}</button>
        <button class="btn btn-icon btn-ghost" title="移除" data-action="digest-delete" data-id="${item.id}">${icon('trash-2')}</button>
      </div>`}
    </div>`;
  }

  function digestSectionHTML(section, d) {
    const items = d.items.filter((i) => i.section === section.key);
    const selected = items.filter((i) => i.selected).length;
    return `<div class="card digest-section">
      <div class="card-head">
        <div class="card-title">${icon(section.icon)}${section.title}<span class="tab-count">${selected}/${items.length}</span></div>
        <span class="hint">${section.hint}</span>
      </div>
      <div class="digest-list">${items.length ? items.map((i) => digestItemHTML(i, d)).join('') : `<div class="empty" style="padding:24px">该章节暂无条目</div>`}</div>
    </div>`;
  }

  function digestView(dateParam) {
    const digestDate = dateParam || state.digest.date || '2026-10-16';
    state.digest.date = digestDate;
    const d = digestStore[digestDate] || null;
    const total = d ? d.items.length : 0;
    const selected = d ? d.items.filter((i) => i.selected).length : 0;
    const pct = total ? Math.round((selected / total) * 100) : 0;
    const locked = d && d.status !== 'draft';

    return `<div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Daily Digest</div>
          <h1 class="display">日报编辑器</h1>
          <p class="page-sub">从基准快照生成初稿，逐条勾选、改写、排序；每个条目都能回溯到原文或截图。</p>
        </div>
        <div class="page-actions digest-bar">
          <input class="input" type="date" style="width:150px" value="${esc(digestDate)}" data-action="digest-date">
          ${d ? (d.status === 'draft' ? badge('草稿', 'warning') : badge('已定稿', 'success')) : badge('未生成', 'neutral')}
          ${canWrite() && d && d.status === 'draft' ? `<button class="btn btn-ghost" data-action="digest-regenerate">${icon('refresh-cw')}重新生成</button>` : ''}
          ${canWrite() && d && d.status === 'draft' ? `<button class="btn btn-primary" data-action="digest-finalize">${icon('check-circle')}定稿</button>` : ''}
          ${d ? `<button class="btn btn-soft" data-action="digest-export">${icon('download')}导出 Markdown</button>` : ''}
        </div>
      </div>

      ${locked ? bannerHTML('success', 'check-circle', `<strong>已定稿：</strong>内容已锁定，条目与顺序不再可编辑；仍可导出 Markdown 或切换日期查看历史。`) : ''}
      ${!d ? `<div class="card">${emptyHTML('newspaper', '该日期还没有日报', '生成一份初稿，系统会自动计算新进、掉榜、名次跃迁，并关联观点。', canWrite() ? `<button class="btn btn-primary" style="margin-top:8px" data-action="digest-generate">${icon('sparkles')}生成初稿</button>` : '')}</div>` : `
        <div class="card"><div class="card-body" style="padding:14px 18px">
          <div class="flex-between wrap">
            <div class="flex"><span class="muted small">已选条目</span><strong style="font-family:var(--display);font-size:20px">${selected} / ${total}</strong><span class="muted small">· 生成于 ${esc(d.generatedAt)}</span></div>
            <div class="digest-progress">${icon('clock')}定稿后可导出 Markdown</div>
          </div>
          <div class="progress" style="margin-top:10px"><div class="progress-bar" style="width:${pct}%"></div></div>
        </div></div>
        <div class="mt-16">${M.digestSections.map((s) => digestSectionHTML(s, d)).join('')}</div>
      `}
    </div>`;
  }

  /* ---------- 文章详情 ---------- */
  function pipelineHTML(status) {
    const idx = status === 'failed' ? 1 : status === 'needs_review' ? 6 : 5;
    return `<div class="pipeline">${M.statusSteps.map((s, i) => {
      const cls = i < idx ? 'done' : i === idx ? 'current' : '';
      return `<div class="pipe-step ${cls}"><span class="pipe-dot">${i < idx ? icon('check') : i + 1}</span>${M.statusLabels[s]}</div>`;
    }).join('')}</div>`;
  }

  function articleView(id) {
    const a = articleById(id);
    if (!a) return notFoundView();
    const src = sourceById(a.sourceId);
    const obs = M.observations.filter((o) => o.articleId === a.id);
    const minConf = obs.length ? Math.min.apply(null, obs.map((o) => o.confidence)) : 0;
    const claims = M.claims.filter((c) => c.articleId === a.id);

    return `<div class="page">
      <div class="page-head">
        <div>
          <button class="btn btn-ghost btn-sm" data-action="back">${icon('arrow-left')}返回</button>
          <div class="eyebrow" style="margin-top:13px">Article Trace</div>
          <h1 class="article-title">${esc(a.title)}</h1>
          <div class="article-meta">
            <span>${esc(src ? src.name : '未知来源')}</span><span>·</span><span>${esc(a.publishedAt)}</span><span>·</span>
            <span>${a.method === 'link' ? '链接投喂' : a.method === 'screenshot' ? '截图投喂' : '全文兜底'}</span><span>·</span>
            ${articleStatusBadge(a.status)}
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" data-action="copy-link">${icon('copy')}复制原文链接</button>
          ${a.status === 'failed' && canWrite() ? `<button class="btn btn-primary" data-action="retry-article">${icon('refresh-cw')}重试解析</button>` : ''}
        </div>
      </div>

      <div class="card"><div class="card-body" style="padding:14px 18px">${pipelineHTML(a.status)}</div></div>

      ${a.status === 'failed' ? `<div class="mt-16">${bannerHTML('danger', 'alert-triangle', `<strong>抓取失败：</strong>${esc(a.failureReason || '未知错误')}。可以重试，或转到全文兜底通道。`)}</div>` : ''}

      <div class="article-layout mt-16">
        <div class="card">
          <div class="card-head"><div class="card-title">${icon('file-text')}正文</div><span class="hint">${a.method === 'screenshot' ? '截图 OCR 还原' : '原始层只追加，不改写'}</span></div>
          <div class="card-body">
            ${a.body && a.body.length ? `<div class="article-body">${a.body.map((p) => `<p class="${p.trim().charAt(0) === '“' ? 'quote' : ''}">${esc(p)}</p>`).join('')}</div>` : emptyHTML('file-text', '暂无正文', '抓取失败或尚未解析，未写入原始文本。')}
          </div>
        </div>

        <div class="side-stack">
          <div class="card">
            <div class="card-head"><div class="card-title">${icon('sparkles')}抽取摘要</div>${articleStatusBadge(a.status)}</div>
            <div class="card-body">
              <div class="grid grid-2" style="gap:8px">
                <div class="profile-stat"><div class="n">${obs.length}</div><div class="l">榜单观测</div></div>
                <div class="profile-stat"><div class="n">${claims.length}</div><div class="l">观点</div></div>
              </div>
              <div class="hint mt-12">内容指纹：${esc(a.hash || '—')} · 抓取于 ${esc(a.fetchedAt)}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${icon('image')}素材</div>${a.method === 'screenshot' ? badge('OCR ' + Math.round(a.ocrConfidence * 100) + '%', 'warning') : badge('无截图', 'neutral')}</div>
            <div class="card-body">
              ${a.method === 'screenshot' ? `<div class="ocr-frame"><table>
                <thead><tr><th>#</th><th>游戏</th><th>榜单</th></tr></thead>
                <tbody>${obs.map((o) => `<tr><td>${o.rank}</td><td>${esc(gameById(o.gameId) ? gameById(o.gameId).name : o.rawName)}</td><td>${boardLabel(o.board)}</td></tr>`).join('')}</tbody>
              </table></div><div class="hint mt-8">最低行置信度 ${minConf.toFixed(2)}，低置信度行已进入待核队列。</div>` : `<div class="small muted">本文通过链接 / 全文通道投喂，没有图片素材。</div>`}
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${icon('bar-chart-3')}榜单观测</div><span class="hint">${obs.length} 条</span></div>
            <div class="card-body" style="padding-top:4px;padding-bottom:4px">
              ${obs.length ? obs.map((o) => `<div class="flex-between" style="padding:7px 0;border-bottom:1px dashed var(--line)">
                <div class="flex"><span class="rank ${o.rank <= 3 ? 'rank-top' : ''}">${o.rank}</span><div><div class="small" style="font-weight:600">${esc(gameById(o.gameId) ? gameById(o.gameId).name : o.rawName)}</div><div class="hint">${platformLabel(o.platform)} · ${boardLabel(o.board)}</div></div></div>
                ${sourceBadge(o.sourceType)}
              </div>`).join('') : '<div class="small muted" style="padding:8px 0">没有抽取到榜单观测。</div>'}
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${icon('message-square')}观点</div><span class="hint">${claims.length} 条</span></div>
            <div class="card-body" style="padding-top:4px;padding-bottom:4px">
              ${claims.length ? claims.map((c) => `<div style="padding:8px 0;border-bottom:1px dashed var(--line)"><div class="small" style="font-weight:600">${esc(c.text)}</div><div class="claim-quote" style="margin-top:6px">“${esc(c.quote)}”</div><div class="claim-meta"><span class="stance stance-${c.stance}">${c.stance === 'positive' ? '正面' : c.stance === 'negative' ? '负面' : '中性'}</span><span>置信度 ${Math.round(c.confidence * 100)}%</span></div></div>`).join('') : '<div class="small muted" style="padding:8px 0">没有通过引用校验的观点。</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- 设置 ---------- */
  function treeNodeHTML(n) {
    if (n.level === 3) return `<div class="tree-row"><span class="level-dot">L3</span>${esc(n.name)}<span class="tree-count">${n.count} 款</span></div>`;
    return `<details open><summary><span class="chev">${icon('chevron-right')}</span><span class="level-dot">L${n.level}</span><strong>${esc(n.name)}</strong><span class="tree-count">${n.count} 款</span></summary>
      <div class="tree-children">${(n.children || []).map(treeNodeHTML).join('')}</div>
    </details>`;
  }

  function settingsView() {
    const tab = state.settings.tab;
    let content = '';
    if (tab === 'sources') {
      content = `<div class="card">
        <div class="card-head"><div class="card-title">${icon('database')}公众号信源</div><button class="btn btn-soft btn-sm" data-action="open-add-source">${icon('plus')}新增公众号</button></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>公众号</th><th>覆盖平台</th><th>权重</th><th>累计文章</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${M.sources.map((s) => `<tr>
            <td><div class="game-name">${esc(s.name)}</div><div class="game-sub">${esc(s.note)}</div></td>
            <td>${s.platforms.map((p) => `<span class="badge badge-neutral" style="margin-right:3px">${platformLabel(p)}</span>`).join('')}</td>
            <td class="mono">${s.weight}</td>
            <td class="mono">${s.articles}</td>
            <td>${s.status === 'active' ? badge('启用', 'success') : badge('暂停', 'neutral')}</td>
            <td><button class="btn btn-ghost btn-sm" data-action="source-toggle" data-id="${s.id}">${s.status === 'active' ? '暂停' : '启用'}</button></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    } else if (tab === 'category') {
      content = `<div class="card">
        <div class="card-head"><div class="card-title">${icon('layers')}三级品类树</div><button class="btn btn-soft btn-sm" data-action="open-add-category">${icon('plus')}新增品类</button></div>
        <div class="card-body"><div class="tree">${M.categoryTree.map(treeNodeHTML).join('')}</div></div>
        <div class="card-foot" style="justify-content:flex-start"><span class="hint">L1 定大盘、L2 定玩法、L3 定结构；一个游戏只允许一条主路径。</span></div>
      </div>`;
    } else if (tab === 'tags') {
      const dims = ['玩法', '题材', '美术', '变现', '生命周期'];
      content = `<div class="card">
        <div class="card-head"><div class="card-title">${icon('tag')}标签体系</div><button class="btn btn-soft btn-sm" data-action="open-add-tag">${icon('plus')}新增标签</button></div>
        <div class="card-body">${dims.map((dim) => `<div class="tag-group"><div class="tag-group-head">${dim}<span class="hint">${M.tags.filter((t) => t.dimension === dim).length} 个</span></div><div class="chip-list">${M.tags.filter((t) => t.dimension === dim).map((t) => `<span class="tag">${esc(t.name)}</span>`).join('')}</div></div>`).join('')}</div>
      </div>`;
    } else if (tab === 'members') {
      content = `<div class="card">
        <div class="card-head"><div class="card-title">${icon('users')}成员与角色</div><button class="btn btn-soft btn-sm" data-action="open-add-member">${icon('plus')}新增成员</button></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>成员</th><th>岗位</th><th>角色</th><th>最近活跃</th></tr></thead>
          <tbody>${M.members.map((m) => `<tr><td><div class="game-cell"><span class="avatar" style="width:30px;height:30px;background:var(--surface-2);color:var(--ink-2)">${esc(m.name.slice(0, 1))}</span><div><div class="game-name">${esc(m.name)}</div><div class="game-sub">${esc(m.title)}</div></div></div></td><td>${esc(m.title)}</td><td>${badge(roleLabel[m.role], m.role === 'admin' ? 'danger' : m.role === 'lead' ? 'warning' : 'neutral')}</td><td class="muted">${esc(m.lastActive)}</td></tr>`).join('')}</tbody>
        </table></div>
        <div class="card-foot" style="justify-content:flex-start"><span class="hint">一期只做页面级角色权限；公众号 / 品类级细粒度权限在二期。</span></div>
      </div>`;
    } else {
      content = `<div class="grid grid-2">
        <div class="card">
          <div class="card-head"><div class="card-title">${icon('bot')}模型配置</div>${badge('OpenAI 兼容', 'neutral')}</div>
          <div class="card-body">
            <div class="stack">
              <div class="field"><label>Base URL</label><input class="input" data-model-field="baseUrl" value="${esc(state.settings.model.baseUrl)}"></div>
              <div class="field"><label>模型</label><input class="input" data-model-field="model" value="${esc(state.settings.model.model)}"></div>
              <div class="field"><label>API Key</label><input class="input" data-model-field="apiKey" value="${esc(state.settings.model.apiKey)}"></div>
              <div class="field"><label>OCR 引擎</label><select class="select" data-model-field="ocr"><option ${state.settings.model.ocr.indexOf('RapidOCR') >= 0 ? 'selected' : ''}>RapidOCR（本地）</option><option>云 OCR</option></select></div>
            </div>
            <div class="form-foot">
              <span class="hint">${state.settings.test.ok ? `<span style="color:var(--success)">连接正常 · ${state.settings.test.latency}ms</span>` : '修改后请测试连接'}</span>
              <div class="flex">
                <button class="btn btn-ghost btn-sm" data-action="model-test" ${state.settings.test.loading ? 'disabled' : ''}>${state.settings.test.loading ? '<span class="spinner spinner-dark"></span>测试中' : '测试连接'}</button>
                <button class="btn btn-primary btn-sm" data-action="save-model">保存配置</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">${icon('activity')}用量统计</div><span class="hint">近 7 日</span></div>
          <div class="card-body">
            <div class="usage-grid">
              <div class="usage-card"><div class="n">${M.modelConfig.usage.calls}</div><div class="l">模型调用次数</div></div>
              <div class="usage-card"><div class="n">${esc(M.modelConfig.usage.tokens)}</div><div class="l">消耗 Token</div></div>
              <div class="usage-card"><div class="n">${esc(M.modelConfig.usage.cost)}</div><div class="l">估算成本</div></div>
            </div>
            <div class="banner banner-info mt-16">${icon('alert-triangle')}<div>20+ 篇/天的抽取成本需持续观察；模型调用失败会重试 3 次，仍失败则只入事实、不出观点。</div></div>
          </div>
        </div>
      </div>`;
    }

    return `<div class="page">
      <div class="page-head">
        <div><div class="eyebrow">Settings</div><h1 class="display">设置</h1><p class="page-sub">维护信源、三级品类、标签、成员角色与模型配置。仅管理员可进入。</p></div>
      </div>
      <div class="tabs">
        ${[['sources', '公众号'], ['category', '品类树'], ['tags', '标签'], ['members', '成员与角色'], ['model', '模型 / OCR']].map(([k, label]) => `<button class="tab ${tab === k ? 'active' : ''}" data-action="settings-tab" data-tab="${k}">${label}</button>`).join('')}
      </div>
      ${content}
    </div>`;
  }

  /* ---------- 浮层 ---------- */
  function overlayHTML() {
    const o = state.overlay;
    if (!o) return '';
    if (o.type === 'preview') return `<div class="overlay overlay-drawer">${previewDrawer(o)}</div>`;
    if (o.type === 'evidence') return `<div class="overlay overlay-drawer">${evidenceDrawer(o)}</div>`;
    if (o.type === 'digestSource') return `<div class="overlay overlay-drawer">${digestSourceDrawer(o)}</div>`;
    if (o.type === 'map') return `<div class="overlay overlay-modal">${mapModal(o)}</div>`;
    if (o.type === 'category') return `<div class="overlay overlay-modal">${categoryModal(o)}</div>`;
    if (o.type === 'gameEdit') return `<div class="overlay overlay-modal">${gameEditModal(o)}</div>`;
    if (o.type === 'regenerate') return `<div class="overlay overlay-modal">${regenerateModal()}</div>`;
    if (o.type === 'addSource') return `<div class="overlay overlay-modal">${addSourceModal(o)}</div>`;
    if (o.type === 'addCategory') return `<div class="overlay overlay-modal">${addCategoryModal(o)}</div>`;
    if (o.type === 'addTag') return `<div class="overlay overlay-modal">${addTagModal(o)}</div>`;
    if (o.type === 'addMember') return `<div class="overlay overlay-modal">${addMemberModal(o)}</div>`;
    return '';
  }

  function previewDrawer(o) {
    const selectable = o.items.filter((i) => !i.duplicate);
    const selected = selectable.filter((i) => i.selected).length;
    return `<div class="drawer">
      <div class="drawer-head"><div><h2 class="drawer-title">解析预览</h2><div class="drawer-sub">确认后入库；重复文章会自动跳过</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="drawer-body">
        ${o.channel === 'screenshot' ? bannerHTML('info', 'image', 'OCR 置信度 86%。第 4 行低于阈值，入库后会进入待核队列。') : ''}
        <div class="preview-list">
          ${o.items.map((it) => `<label class="preview-item" style="cursor:pointer">
            <input class="preview-check" type="checkbox" data-action="preview-toggle" data-id="${it.id}" ${it.selected ? 'checked' : ''} ${it.duplicate ? 'disabled' : ''}>
            <div class="grow">
              <div class="preview-title">${esc(it.title)}</div>
              <div class="preview-meta"><span>${esc(it.source)}</span><span>·</span><span>${esc(it.method)}</span><span>·</span><span>${it.obs} 观测 / ${it.claims} 观点</span>${it.duplicate ? badge('已存在', 'neutral') : ''}${it.needsReview ? badge('待核', 'warning') : ''}</div>
            </div>
          </label>`).join('')}
        </div>
        <div class="banner banner-info mt-16">${icon('activity')}<div>已选 <strong>${selected}</strong> 篇；未选中的文章不会入库。重复文章不会重复计数。</div></div>
      </div>
      <div class="drawer-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="ingest-confirm" ${selected ? '' : 'disabled'}>确认入库（${selected}）</button></div>
    </div>`;
  }

  function evidenceDrawer(o) {
    const snap = M.rankings[o.snapshotKey];
    const g = gameById(o.gameId);
    if (!snap || !g) return `<div class="drawer"><div class="drawer-head"><h2 class="drawer-title">证据</h2><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div><div class="drawer-body">${emptyHTML('alert-triangle', '证据不存在', '快照或游戏已变更。')}</div></div>`;
    const official = snap.official ? snap.official.entries.find((e) => e.gameId === g.id) : null;
    const cites = (snap.citations || []).map((c) => {
      const entry = c.entries.find((e) => e.gameId === g.id);
      return { sourceName: c.sourceName, articleId: c.articleId, capturedAt: c.capturedAt, rank: entry ? entry.rank : null };
    }).filter((c) => c.rank);
    const conflict = (snap.conflicts || []).find((c) => c.gameId === g.id);
    const claims = M.claims.filter((c) => c.subjectId === g.id).slice(0, 2);
    const articleId = (conflict && conflict.articleId) || (cites[0] && cites[0].articleId) || null;
    const resolved = conflict && conflict.status !== 'open';
    return `<div class="drawer">
      <div class="drawer-head"><div><h2 class="drawer-title">${esc(g.name)}</h2><div class="drawer-sub">${platformLabel(snap.platform)} · ${boardLabel(snap.board)} · ${snap.date}</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="drawer-body">
        <div class="evidence-card">
          <div class="evidence-source"><span>官方基准</span>${official ? badge('第 ' + official.rank + ' 名', 'official') : badge('暂无官方', 'warning')}</div>
          <div class="hint mt-8">${snap.official ? esc(snap.official.sourceName) + ' · ' + esc(snap.official.capturedAt) : '当前快照由转述生成，未经官方核对'}</div>
        </div>
        ${cites.map((c) => `<div class="evidence-card">
          <div class="evidence-source"><span>${esc(c.sourceName)}</span>${badge('第 ' + c.rank + ' 名', 'citation')}</div>
          <div class="hint mt-8">${esc(c.capturedAt)}</div>
        </div>`).join('')}

        ${conflict ? (conflict.status === 'open'
          ? bannerHTML('warning', 'alert-triangle', `<strong>名次不一致：</strong>官方第 ${conflict.officialRank} 名，${esc(conflict.sourceName)}转述第 ${conflict.citationRank} 名。系统不自动选边，请记录结论。`)
          : bannerHTML('success', 'check-circle', `<strong>已记录结论：</strong>${esc(conflict.note || '已处理')}`))
          : bannerHTML('success', 'check-circle', '官方基准与当前转述名次一致，无需处理。')}

        ${conflict && conflict.status === 'open' && canWrite() ? `<div class="field mt-16"><label>结论备注（可选）</label><textarea class="textarea" style="min-height:70px" data-overlay-field="note" placeholder="例如：以官方口径为准，转述为截图识别误差">${esc((o.form && o.form.note) || '')}</textarea></div>
          <div class="flex mt-8"><button class="btn btn-soft btn-sm" data-action="conflict-resolve" data-id="${conflict.id}" data-status="resolved">${icon('check')}标记已核实</button><button class="btn btn-ghost btn-sm" data-action="conflict-resolve" data-id="${conflict.id}" data-status="kept">保留分歧</button></div>` : ''}

        <div class="section-head"><h2 style="font-size:16px">相关观点</h2><span class="hint">引用已通过原文校验</span></div>
        ${claims.length ? claims.map((c) => `<div class="evidence-card"><div class="evidence-source"><span>${esc(c.text)}</span><span class="stance stance-${c.stance}">${c.stance === 'positive' ? '正面' : c.stance === 'negative' ? '负面' : '中性'}</span></div><div class="evidence-quote">“${esc(c.quote)}”</div><div class="hint mt-8">${Math.round(c.confidence * 100)}% · ${esc(articleById(c.articleId) ? articleById(c.articleId).title : '')}</div></div>`).join('') : '<div class="small muted">暂无关联观点。</div>'}
      </div>
      <div class="drawer-foot"><button class="btn btn-ghost" data-action="close-overlay">关闭</button>${articleId ? `<a class="btn btn-primary" href="#/articles/${articleId}" data-action="close-overlay">${icon('external-link')}查看原文</a>` : ''}</div>
    </div>`;
  }

  function mapGameListHTML(o) {
    const q = (o.form.search || '').toLowerCase();
    let list = M.games.filter((g) => [g.name, g.publisher].concat(g.aliases).join(' ').toLowerCase().indexOf(q) >= 0);
    if (o.form.gameId) {
      const selected = gameById(o.form.gameId);
      if (selected && list.indexOf(selected) < 0) list.unshift(selected);
    }
    list = list.slice(0, 8);
    if (!list.length) return `<div class="small muted" style="padding:14px 4px">没有匹配的游戏，可切换到「新建游戏」。</div>`;
    return list.map((g) => `<button type="button" class="preview-item" style="width:100%;text-align:left;cursor:pointer;border-color:${o.form.gameId === g.id ? 'var(--primary)' : 'var(--line)'};background:${o.form.gameId === g.id ? 'var(--primary-weak)' : '#fff'}" data-action="map-pick" data-id="${g.id}">
      ${gameAvatar(g)}
      <div class="grow"><div class="preview-title">${esc(g.name)}</div><div class="preview-meta"><span>${esc(g.publisher)}</span><span>·</span><span>${categoryPathHTML(g.categoryPath)}</span></div></div>
      ${o.form.gameId === g.id ? icon('check-circle') : ''}
    </button>`).join('');
  }

  function l1Options(selected) {
    return `<option value="">请选择 L1</option>` + M.categoryTree.map((n) => `<option value="${n.name}" ${selected === n.name ? 'selected' : ''}>${n.name}</option>`).join('');
  }
  function l2Options(l1Name, selected) {
    const l1 = M.categoryTree.find((n) => n.name === l1Name);
    if (!l1) return `<option value="">先选择 L1</option>`;
    return `<option value="">请选择 L2</option>` + l1.children.map((n) => `<option value="${n.name}" ${selected === n.name ? 'selected' : ''}>${n.name}</option>`).join('');
  }
  function l3Options(l2Name, selected) {
    let found = null;
    M.categoryTree.forEach((l1) => (l1.children || []).forEach((l2) => { if (l2.name === l2Name) found = l2; }));
    if (!found) return `<option value="">先选择 L2</option>`;
    return `<option value="">请选择 L3</option>` + (found.children || []).map((n) => `<option value="${n.name}" ${selected === n.name ? 'selected' : ''}>${n.name}</option>`).join('');
  }

  function mapModal(o) {
    const row = M.review.mapping.find((r) => r.id === o.rowId);
    if (!row) return '';
    const f = o.form;
    const canConfirm = (o.mode === 'existing' && f.gameId) || (o.mode === 'new' && f.name.trim() && f.l1 && f.l2);
    return `<div class="modal">
      <div class="modal-head"><div><h2 class="modal-title">映射「${esc(row.rawName)}」</h2><div class="drawer-sub">${platformLabel(row.platform)} · ${boardLabel(row.board)} #${row.rank} · 置信度 ${Math.round(row.confidence * 100)}%</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body">
        <div class="seg" style="margin-bottom:14px">
          <button type="button" class="seg-btn ${o.mode === 'existing' ? 'active' : ''}" data-action="map-mode" data-mode="existing">选择已有游戏</button>
          <button type="button" class="seg-btn ${o.mode === 'new' ? 'active' : ''}" data-action="map-mode" data-mode="new">新建游戏</button>
        </div>
        ${o.mode === 'existing' ? `
          <div class="field"><label>搜索游戏库</label><input class="input" data-overlay-field="search" value="${esc(f.search || '')}" placeholder="游戏名或发行商"></div>
          <div class="preview-list mt-12" id="map-game-list" style="max-height:290px;overflow:auto">${mapGameListHTML(o)}</div>
        ` : `
          <div class="stack">
            <div class="field"><label>游戏主名</label><input class="input" data-overlay-field="name" value="${esc(f.name)}"></div>
            <div class="form-grid">
              <div class="field"><label>L1 品类</label><select class="select" data-action="map-level" data-level="1">${l1Options(f.l1)}</select></div>
              <div class="field"><label>L2 品类</label><select class="select" data-action="map-level" data-level="2" ${f.l1 ? '' : 'disabled'}>${l2Options(f.l1, f.l2)}</select></div>
            </div>
            <div class="field"><label>L3 品类（可稍后补）</label><select class="select" data-action="map-level" data-level="3" ${f.l2 ? '' : 'disabled'}>${l3Options(f.l2, f.l3)}</select></div>
            <div class="hint">新建后会写入游戏库，并把「${esc(row.rawName)}」记录为别名。</div>
          </div>
        `}
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="confirm-map" ${canConfirm ? '' : 'disabled'}>${o.mode === 'existing' ? '确认映射' : '创建并映射'}</button></div>
    </div>`;
  }

  function categoryModal(o) {
    const row = M.review.category.find((r) => r.id === o.rowId);
    const g = row ? gameById(row.gameId) : null;
    if (!row || !g) return '';
    const f = o.form;
    const canSave = f.l1 && f.l2 && f.l3;
    return `<div class="modal">
      <div class="modal-head"><div><h2 class="modal-title">补全「${esc(g.name)}」品类</h2><div class="drawer-sub">当前路径：${g.categoryPath.map((p) => p || '待补').join(' / ')}</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body">
        <div class="banner banner-warning">${icon('alert-triangle')}<div>进入日报的游戏必须补齐 L3；长尾游戏可暂留 L2 并继续待核。</div></div>
        <div class="stack mt-16">
          <div class="field"><label>L1 大盘</label><select class="select" data-action="cat-level" data-level="1">${l1Options(f.l1)}</select></div>
          <div class="field"><label>L2 玩法</label><select class="select" data-action="cat-level" data-level="2" ${f.l1 ? '' : 'disabled'}>${l2Options(f.l1, f.l2)}</select></div>
          <div class="field"><label>L3 结构</label><select class="select" data-action="cat-level" data-level="3" ${f.l2 ? '' : 'disabled'}>${l3Options(f.l2, f.l3)}</select></div>
        </div>
        <div class="hint mt-8">AI 建议：${esc(row.suggestedL3)}。确认后写入主数据，并标记为人工确认。</div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="confirm-category" ${canSave ? '' : 'disabled'}>保存品类</button></div>
    </div>`;
  }

  function gameEditModal(o) {
    const g = gameById(o.gameId);
    if (!g) return '';
    const f = o.form;
    return `<div class="modal">
      <div class="modal-head"><div><h2 class="modal-title">编辑游戏档案</h2><div class="drawer-sub">${esc(g.name)} · 修改会写入主数据层</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="field"><label>主名</label><input class="input" data-overlay-field="name" value="${esc(f.name)}"></div>
          <div class="field"><label>发行商</label><input class="input" data-overlay-field="publisher" value="${esc(f.publisher)}"></div>
          <div class="field"><label>研发商</label><input class="input" data-overlay-field="developer" value="${esc(f.developer)}"></div>
          <div class="field"><label>上线日期</label><input class="input" data-overlay-field="release" value="${esc(f.release)}"></div>
          <div class="field"><label>运营状态</label><select class="select" data-overlay-field="status"><option ${f.status === '运营中' ? 'selected' : ''}>运营中</option><option ${f.status === '待确认' ? 'selected' : ''}>待确认</option><option ${f.status === '已停运' ? 'selected' : ''}>已停运</option></select></div>
          <div class="field"><label>版号</label><select class="select" data-overlay-field="isbn"><option value="true" ${f.isbn ? 'selected' : ''}>有</option><option value="false" ${!f.isbn ? 'selected' : ''}>无 / 待确认</option></select></div>
        </div>
        <div class="divider"></div>
        <div class="stack">
          <div class="field"><label>L1 品类</label><select class="select" data-action="game-edit-level" data-level="1">${l1Options(f.l1)}</select></div>
          <div class="field"><label>L2 品类</label><select class="select" data-action="game-edit-level" data-level="2" ${f.l1 ? '' : 'disabled'}>${l2Options(f.l1, f.l2)}</select></div>
          <div class="field"><label>L3 品类</label><select class="select" data-action="game-edit-level" data-level="3" ${f.l2 ? '' : 'disabled'}>${l3Options(f.l2, f.l3)}</select></div>
        </div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="save-game">保存档案</button></div>
    </div>`;
  }

  function digestSourceDrawer(o) {
    const d = digestStore[state.digest.date];
    const item = d ? d.items.find((i) => i.id === o.itemId) : null;
    if (!item) return '';
    let ref = '';
    if (item.refType === 'claim') {
      const c = claimById(item.refId);
      if (c) {
        const a = articleById(c.articleId);
        ref = `<div class="evidence-card"><div class="evidence-source"><span>${esc(c.text)}</span>${badge(c.status === 'confirmed' ? '已确认' : c.status === 'disputed' ? '有分歧' : '待核实', c.status === 'confirmed' ? 'success' : c.status === 'disputed' ? 'danger' : 'warning')}</div><div class="evidence-quote">“${esc(c.quote)}”</div><div class="hint mt-8">${esc(a ? a.title : '')} · 置信度 ${Math.round(c.confidence * 100)}%</div><div class="mt-8"><a class="btn btn-ghost btn-sm" href="#/articles/${c.articleId}" data-action="close-overlay">${icon('external-link')}查看原文</a></div></div>`;
      }
    } else if (item.refType === 'snapshot') {
      const snap = M.rankings[item.refId];
      if (snap) {
        ref = `<div class="evidence-card"><div class="evidence-source"><span>榜单快照</span>${snap.status === 'confirmed' ? badge('已确认', 'success') : badge('暂定', 'warning')}</div><div class="hint mt-8">${platformLabel(snap.platform)} · ${boardLabel(snap.board)} · ${snap.date}</div><div class="hint">${snap.official ? '基准：' + esc(snap.official.sourceName) : '无官方原始榜单'}</div><div class="hint">转述 ${snap.citations.length} 家 · 差异 ${snap.conflicts.length} 项</div><div class="mt-8"><a class="btn btn-ghost btn-sm" href="#/rankings" data-action="close-overlay">${icon('bar-chart-3')}查看榜单</a></div></div>`;
      }
    } else if (item.refType === 'conflict') {
      ref = `<div class="evidence-card"><div class="evidence-source"><span>分歧记录</span>${badge('待处理', 'danger')}</div><div class="hint mt-8">官方与转述名次不一致，系统保留双方口径，等待人工结论。</div><div class="mt-8"><a class="btn btn-ghost btn-sm" href="#/rankings" data-action="close-overlay">${icon('bar-chart-3')}去榜单中心</a></div></div>`;
    } else {
      ref = `<div class="evidence-card"><div class="evidence-source"><span>待核事项</span>${badge('未完成', 'warning')}</div><div class="hint mt-8">该条目依赖尚未完成的品类或名次核对。</div><div class="mt-8"><a class="btn btn-ghost btn-sm" href="#/review" data-action="close-overlay">${icon('list-checks')}去待核队列</a></div></div>`;
    }
    return `<div class="drawer">
      <div class="drawer-head"><div><h2 class="drawer-title">来源与引用</h2><div class="drawer-sub">每个日报条目都能回溯到原文或快照</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="drawer-body">
        <div class="quote">${esc(item.text)}</div>
        <div class="flex-between small mt-12"><span class="muted">信源</span><strong>${esc(item.source)}</strong></div>
        <div class="divider"></div>
        ${ref}
      </div>
      <div class="drawer-foot"><button class="btn btn-ghost" data-action="close-overlay">关闭</button></div>
    </div>`;
  }

  function regenerateModal() {
    return `<div class="modal" style="width:min(440px,94vw)">
      <div class="modal-head"><div><h2 class="modal-title">重新生成日报初稿</h2><div class="drawer-sub">当前勾选、改写与排序会被覆盖</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body"><div class="banner banner-warning">${icon('alert-triangle')}<div>将按最新基准快照重新计算异动并关联观点。原型中会恢复为预置初稿。</div></div></div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-danger" data-action="regenerate-confirm">确认重新生成</button></div>
    </div>`;
  }

  function addSourceModal(o) {
    const f = o.form;
    return `<div class="modal" style="width:min(500px,94vw)">
      <div class="modal-head"><div><h2 class="modal-title">新增公众号</h2><div class="drawer-sub">信源权重参与日报排序</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body">
        <div class="stack">
          <div class="field"><label>公众号名称</label><input class="input" data-overlay-field="name" value="${esc(f.name)}" placeholder="例如：游戏葡萄"></div>
          <div class="form-grid">
            <div class="field"><label>覆盖平台</label><select class="select" data-overlay-field="platforms"><option value="both" ${f.platforms === 'both' ? 'selected' : ''}>微信 + 抖音</option><option value="wechat_mini" ${f.platforms === 'wechat_mini' ? 'selected' : ''}>仅微信</option><option value="douyin_mini" ${f.platforms === 'douyin_mini' ? 'selected' : ''}>仅抖音</option></select></div>
            <div class="field"><label>权重（1-5）</label><input class="input" type="number" min="1" max="5" data-overlay-field="weight" value="${esc(f.weight)}"></div>
          </div>
          <div class="field"><label>备注</label><input class="input" data-overlay-field="note" value="${esc(f.note)}" placeholder="内容特点或更新频率"></div>
        </div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="save-source">保存</button></div>
    </div>`;
  }

  function categoryParentOptions(level) {
    if (level === 2) return M.categoryTree.map((n) => `<option value="${n.id}">${esc(n.name)}</option>`).join('');
    if (level === 3) {
      const out = [];
      M.categoryTree.forEach((l1) => (l1.children || []).forEach((l2) => out.push(`<option value="${l2.id}">${esc(l1.name)} / ${esc(l2.name)}</option>`)));
      return out.join('');
    }
    return '';
  }

  function addCategoryModal(o) {
    const f = o.form;
    const level = Number(f.level);
    return `<div class="modal" style="width:min(500px,94vw)">
      <div class="modal-head"><div><h2 class="modal-title">新增品类</h2><div class="drawer-sub">三级树最多三层</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body">
        <div class="stack">
          <div class="field"><label>层级</label><select class="select" data-action="cat-add-level"><option value="1" ${level === 1 ? 'selected' : ''}>L1 大盘</option><option value="2" ${level === 2 ? 'selected' : ''}>L2 玩法</option><option value="3" ${level === 3 ? 'selected' : ''}>L3 结构</option></select></div>
          ${level > 1 ? `<div class="field"><label>上级品类</label><select class="select" data-overlay-field="parentId"><option value="">请选择上级</option>${categoryParentOptions(level)}</select></div>` : ''}
          <div class="field"><label>品类名称</label><input class="input" data-overlay-field="name" value="${esc(f.name)}" placeholder="例如：合成消除"></div>
        </div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="save-category">保存</button></div>
    </div>`;
  }

  function addTagModal(o) {
    const f = o.form;
    return `<div class="modal" style="width:min(420px,94vw)">
      <div class="modal-head"><div><h2 class="modal-title">新增标签</h2><div class="drawer-sub">标签不进入品类树</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body"><div class="stack">
        <div class="field"><label>维度</label><select class="select" data-overlay-field="dimension">${['玩法', '题材', '美术', '变现', '生命周期'].map((d) => `<option ${f.dimension === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
        <div class="field"><label>标签名</label><input class="input" data-overlay-field="name" value="${esc(f.name)}" placeholder="例如：开箱"></div>
      </div></div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="save-tag">保存</button></div>
    </div>`;
  }

  function addMemberModal(o) {
    const f = o.form;
    return `<div class="modal" style="width:min(460px,94vw)">
      <div class="modal-head"><div><h2 class="modal-title">新增成员</h2><div class="drawer-sub">一期仅页面级角色</div></div><button class="close-btn" data-action="close-overlay">${icon('x')}</button></div>
      <div class="modal-body"><div class="stack">
        <div class="form-grid">
          <div class="field"><label>姓名</label><input class="input" data-overlay-field="name" value="${esc(f.name)}"></div>
          <div class="field"><label>岗位</label><input class="input" data-overlay-field="title" value="${esc(f.title)}" placeholder="例如：平台运营"></div>
        </div>
        <div class="field"><label>角色</label><select class="select" data-overlay-field="role"><option value="operator" ${f.role === 'operator' ? 'selected' : ''}>运营</option><option value="lead" ${f.role === 'lead' ? 'selected' : ''}>负责人</option><option value="admin" ${f.role === 'admin' ? 'selected' : ''}>管理员</option></select></div>
      </div></div>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-overlay">取消</button><button class="btn btn-primary" data-action="save-member">保存</button></div>
    </div>`;
  }

  /* ---------- 解析预览数据 ---------- */
  function linkPreviewItems() {
    return [
      { id: 'p1', title: '抓大鹅重回第一，消除赛道又热了', source: '游戏葡萄', method: '链接', obs: 5, claims: 2, articleId: 'a1', selected: true, duplicate: false },
      { id: 'p2', title: '小游戏日报：三款新品闯入抖音前十', source: '手游那点事', method: '链接', obs: 5, claims: 2, articleId: 'a5', selected: true, duplicate: false },
      { id: 'p3', title: '10月16日微信小游戏热门榜（转述）', source: '小游戏观察', method: '链接', obs: 5, claims: 1, articleId: 'a8', selected: false, duplicate: true }
    ];
  }

  /* ---------- 事件处理 ---------- */
  function switchRole(role) {
    state.user.role = role;
    state.user.name = roleNames[role];
    localStorage.setItem('ri_proto_user', JSON.stringify(state.user));
    const fallback = !canAccess(state.route.name, role);
    if (fallback) location.hash = '#/';
    else render();
    setTimeout(() => toast('已切换为' + roleLabel[role] + '视角', 'success'), 20);
  }

  function doLogin() {
    const pwd = ($('#login-password') || {}).value || '';
    state.forms.loginPassword = pwd;
    if (pwd !== 'admin123') {
      state.login.error = '密码不正确。演示密码为 admin123。';
      render();
      return;
    }
    state.user = { name: roleNames[state.login.role], role: state.login.role };
    localStorage.setItem('ri_proto_user', JSON.stringify(state.user));
    state.login.error = '';
    state.overlay = null;
    location.hash = '#/';
    render();
  }

  function applyRankingFilter() {
    const boardEl = $('[data-form="rankBoard"]');
    const dateEl = $('[data-form="rankDate"]');
    state.rankings.board = boardEl ? boardEl.value : state.rankings.board;
    state.rankings.date = dateEl ? dateEl.value : state.rankings.date;
    state.rankings.citationIndex = 0;
    state.rankings.loading = true;
    render();
    setTimeout(() => { state.rankings.loading = false; render(); }, 450);
  }

  function confirmIngest() {
    const o = state.overlay;
    if (!o || o.type !== 'preview') return;
    let ingested = 0, skipped = 0, obs = 0, claims = 0;
    const rows = o.items.map((it) => {
      const included = it.selected && !it.duplicate;
      if (included) { ingested += 1; obs += it.obs; claims += it.claims; }
      else skipped += 1;
      return {
        title: it.title, source: it.source, method: it.method,
        status: included ? (it.needsReview ? '待核' : '已入库') : (it.duplicate ? '重复跳过' : '已跳过'),
        obs: included ? it.obs : 0,
        claims: included ? it.claims : 0,
        time: '09:48',
        articleId: it.articleId
      };
    });
    state.ingest.results = rows.concat(state.ingest.results);
    state.ingest.summary = { ingested, skipped, obs, claims };
    state.overlay = null;
    render();
    toast('已入库 ' + ingested + ' 篇，跳过 ' + skipped + ' 篇');
  }

  function resolveConflict(id, status) {
    const o = state.overlay;
    if (!o || o.type !== 'evidence') return;
    const snap = M.rankings[o.snapshotKey];
    const cf = snap ? snap.conflicts.find((c) => c.id === id) : null;
    if (!cf) return;
    const note = ((o.form && o.form.note) || '').trim();
    cf.status = status;
    cf.note = note || (status === 'resolved' ? '人工核实，以官方基准名次为准。' : '保留双方口径，继续观察。');
    render();
    toast(status === 'resolved' ? '已记录结论：以官方为准' : '已保留分歧');
  }

  function exportDigest() {
    const d = digestStore[state.digest.date];
    if (!d) { toast('当前日期还没有日报', 'warning'); return; }
    const selected = d.items.filter((i) => i.selected);
    if (!selected.length) { toast('至少勾选一条日报内容', 'warning'); return; }
    const lines = ['# 微小 / 抖小游戏榜单情报日报', '', '- 日期：' + d.date, '- 生成时间：' + d.generatedAt, '', '---', ''];
    M.digestSections.forEach((s) => {
      const items = selected.filter((i) => i.section === s.key);
      if (!items.length) return;
      lines.push('## ' + s.title, '');
      items.forEach((i) => {
        lines.push('- ' + i.text);
        if (i.source) lines.push('  > 来源：' + i.source);
      });
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '榜单情报日报-' + d.date + '.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Markdown 已导出');
  }

  function onClick(e) {
    if (e.target.classList && e.target.classList.contains('overlay')) { closeOverlay(); return; }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'logout') {
      localStorage.removeItem('ri_proto_user');
      state.user = null;
      state.overlay = null;
      state.toast = null;
      location.hash = '#/login';
      render();
      return;
    }
    if (action === 'pick-role') {
      state.login.role = el.dataset.role;
      state.login.error = '';
      render();
      return;
    }
    if (action === 'ingest-tab') {
      state.ingest.tab = el.dataset.tab;
      state.ingest.parsing = false;
      state.ingest.summary = null;
      render();
      return;
    }
    if (action === 'fill-demo-links') {
      state.forms.ingestLinks = 'https://mp.weixin.qq.com/s/demo-a1\nhttps://mp.weixin.qq.com/s/demo-a5\nhttps://mp.weixin.qq.com/s/demo-a8';
      toast('已填入 3 条示例链接');
      return;
    }
    if (action === 'parse-link') {
      const text = (state.forms.ingestLinks || '').trim();
      if (!text) { toast('请先粘贴至少一条文章链接', 'warning'); return; }
      state.ingest.parsing = true;
      state.ingest.summary = null;
      render();
      setTimeout(() => {
        state.ingest.parsing = false;
        state.overlay = { type: 'preview', channel: 'link', items: linkPreviewItems() };
        render();
      }, 1200);
      return;
    }
    if (action === 'fill-demo-fulltext') {
      state.forms.fulltextTitle = '10月16日小游戏榜：抓大鹅重回第一';
      state.forms.fulltext = '10 月 16 日，微信小游戏热门榜出现了一次久违的换位。\n\n《抓大鹅》在连续两周徘徊于前五之后，重新回到榜首。\n\n“抓大鹅这次回到榜首，靠的并不是买量，而是把两年前那套社交裂变重新跑通了。”一位接近项目组的从业者告诉游戏葡萄。\n\n与此同时，《寻道大千》退居第二。';
      toast('已填入示例全文');
      return;
    }
    if (action === 'parse-fulltext') {
      if (!state.forms.fulltextTitle.trim() || !state.forms.fulltext.trim()) { toast('请填写标题与正文', 'warning'); return; }
      state.ingest.parsing = true;
      state.ingest.summary = null;
      render();
      setTimeout(() => {
        state.ingest.parsing = false;
        state.overlay = {
          type: 'preview', channel: 'fulltext',
          items: [{ id: 'p5', title: state.forms.fulltextTitle, source: '手动录入', method: '全文', obs: 3, claims: 1, articleId: 'a2', selected: true, duplicate: false }]
        };
        render();
      }, 900);
      return;
    }
    if (action === 'pick-screenshot') {
      const f = $('#shot-file');
      if (f) f.click();
      return;
    }
    if (action === 'clear-screenshot') {
      state.ingest.screenshotName = '';
      render();
      return;
    }
    if (action === 'parse-screenshot') {
      if (!state.ingest.screenshotName) { toast('请先选择或粘贴一张截图', 'warning'); return; }
      state.ingest.parsing = true;
      state.ingest.summary = null;
      render();
      setTimeout(() => {
        state.ingest.parsing = false;
        state.overlay = {
          type: 'preview', channel: 'screenshot',
          items: [{ id: 'p4', title: '微信小游戏畅销榜 10.16 截图', source: '竞核', method: '截图', obs: 4, claims: 0, articleId: 'a4', selected: true, duplicate: false, needsReview: true }]
        };
        render();
      }, 1000);
      return;
    }
    if (action === 'close-overlay') { closeOverlay(); return; }
    if (action === 'ingest-confirm') { confirmIngest(); return; }
    if (action === 'go-review') {
      state.review.tab = el.dataset.tab || 'mapping';
      if (location.hash === '#/review') render();
      else location.hash = '#/review';
      return;
    }
    if (action === 'review-tab') { state.review.tab = el.dataset.tab; render(); return; }

    if (action === 'open-map') {
      const row = M.review.mapping.find((r) => r.id === el.dataset.id);
      if (!row) return;
      openOverlay({
        type: 'map', rowId: row.id,
        mode: row.suggestedGameId ? 'existing' : 'new',
        form: { search: '', gameId: row.suggestedGameId || null, name: row.rawName, l1: '', l2: '', l3: '' }
      });
      return;
    }
    if (action === 'map-mode') { state.overlay.mode = el.dataset.mode; render(); return; }
    if (action === 'map-pick') { state.overlay.form.gameId = el.dataset.id; render(); return; }
    if (action === 'confirm-map') {
      const o = state.overlay;
      const row = M.review.mapping.find((r) => r.id === o.rowId);
      const f = o.form;
      let name = '';
      if (o.mode === 'existing') {
        if (!f.gameId) { toast('请选择一个已有游戏', 'warning'); return; }
        const g = gameById(f.gameId);
        if (!g) return;
        if (row.rawName && row.rawName !== g.name && g.aliases.indexOf(row.rawName) < 0) g.aliases.push(row.rawName);
        name = g.name;
      } else {
        if (!f.name.trim() || !f.l1 || !f.l2) { toast('请填写游戏名并选择 L1 / L2', 'warning'); return; }
        const colors = ['#8a9a8b', '#b99a5b', '#7e9b9a', '#c98a5e', '#a58a6f', '#6f8fa8'];
        const g = {
          id: 'g' + Date.now(), name: f.name.trim(), short: f.name.trim().slice(0, 1), color: colors[M.games.length % colors.length],
          aliases: row.rawName !== f.name.trim() ? [row.rawName] : [],
          publisher: '待补充', developer: '待补充', platforms: [row.platform], release: '待补充', status: '待确认', isbn: false,
          categoryPath: [f.l1, f.l2, f.l3 || null], categorySource: 'human', categoryConfidence: 1,
          firstSeen: '2026-10-16', lastSeen: '2026-10-16',
          stats: { currentRank: row.rank, bestRank: row.rank, daysOnBoard: 1, streak: 1 },
          quality: f.l3 ? [] : ['L3 品类待补'], tags: []
        };
        M.games.push(g);
        name = g.name;
      }
      state.review.done.mapping.push(row.id);
      state.overlay = null;
      render();
      toast('已映射到「' + name + '」');
      return;
    }
    if (action === 'open-category') {
      const row = M.review.category.find((r) => r.id === el.dataset.id);
      if (!row) return;
      openOverlay({ type: 'category', rowId: row.id, form: { l1: row.l1, l2: row.l2, l3: row.suggestedL3 } });
      return;
    }
    if (action === 'confirm-category') {
      const o = state.overlay;
      const row = M.review.category.find((r) => r.id === o.rowId);
      const f = o.form;
      if (!f.l1 || !f.l2 || !f.l3) { toast('请补全三级品类', 'warning'); return; }
      const g = gameById(row.gameId);
      if (g) {
        g.categoryPath = [f.l1, f.l2, f.l3];
        g.categorySource = 'human';
        g.categoryConfidence = 1;
        g.quality = g.quality.filter((q) => q.indexOf('L3') < 0);
      }
      state.review.done.category.push(row.id);
      state.overlay = null;
      render();
      toast('品类已补全并标记为人工确认');
      return;
    }
    if (action === 'claim-confirm') {
      const c = claimById(el.dataset.id);
      if (c) c.status = 'confirmed';
      state.review.done.claims.push(el.dataset.id);
      render();
      toast('观点已确认');
      return;
    }
    if (action === 'claim-dispute') {
      const c = claimById(el.dataset.id);
      if (c) c.status = 'disputed';
      state.review.done.claims.push(el.dataset.id);
      render();
      toast('已标记为分歧，保留双方原文引用');
      return;
    }
    if (action === 'retry-error') {
      const row = M.review.errors.find((r) => r.id === el.dataset.id);
      if (row) {
        state.review.done.errors.push(row.id);
        const a = articleById(row.articleId);
        if (a) { a.status = 'needs_review'; a.failureReason = null; }
      }
      render();
      toast('重试成功，已进入待核队列');
      return;
    }
    if (action === 'go-fulltext') {
      const a = articleById(el.dataset.article);
      state.ingest.tab = 'fulltext';
      state.ingest.parsing = false;
      if (a) { state.forms.fulltextTitle = a.title; state.forms.fulltext = ''; }
      location.hash = '#/ingest';
      if (location.hash === '#/ingest') render();
      return;
    }

    if (action === 'ranking-platform') {
      state.rankings.platform = el.dataset.platform;
      state.rankings.citationIndex = 0;
      render();
      return;
    }
    if (action === 'ranking-citation') { state.rankings.citationIndex = Number(el.dataset.index); render(); return; }
    if (action === 'open-evidence') {
      if (!el.dataset.game) { toast('该条目尚未映射到游戏库', 'warning'); return; }
      openOverlay({ type: 'evidence', snapshotKey: currentSnapshotKey(), gameId: el.dataset.game, form: { note: '' } });
      return;
    }
    if (action === 'unmapped') { toast('该条目尚未映射，请先到待核队列处理', 'warning'); return; }
    if (action === 'conflict-resolve') { resolveConflict(el.dataset.id, el.dataset.status); return; }

    if (action === 'open-game') { location.hash = '#/games/' + el.dataset.id; return; }
    if (action === 'profile-tab') { state.gameProfile.tab = el.dataset.tab; render(); return; }
    if (action === 'open-game-edit') {
      const g = gameById(state.gameProfile.id);
      if (!g) return;
      openOverlay({
        type: 'gameEdit', gameId: g.id,
        form: {
          name: g.name, publisher: g.publisher, developer: g.developer, release: g.release,
          status: g.status, isbn: g.isbn, l1: g.categoryPath[0], l2: g.categoryPath[1], l3: g.categoryPath[2] || ''
        }
      });
      return;
    }
    if (action === 'save-game') {
      const o = state.overlay;
      const f = o.form;
      const g = gameById(o.gameId);
      if (!g) return;
      if (!f.name.trim()) { toast('游戏主名不能为空', 'warning'); return; }
      g.name = f.name.trim();
      g.short = g.name.slice(0, 1);
      g.publisher = f.publisher.trim();
      g.developer = f.developer.trim();
      g.release = f.release.trim();
      g.status = f.status;
      g.isbn = String(f.isbn) === 'true';
      g.categoryPath = [f.l1, f.l2, f.l3 || null];
      g.categorySource = 'human';
      g.categoryConfidence = 1;
      if (f.l3) g.quality = g.quality.filter((q) => q.indexOf('L3') < 0);
      state.overlay = null;
      render();
      toast('游戏档案已保存');
      return;
    }

    if (action === 'digest-generate') {
      digestStore[state.digest.date] = makeDigest(state.digest.date);
      render();
      toast('已生成日报初稿');
      return;
    }
    if (action === 'digest-regenerate') { openOverlay({ type: 'regenerate' }); return; }
    if (action === 'regenerate-confirm') {
      digestStore[state.digest.date] = makeDigest(state.digest.date);
      state.overlay = null;
      render();
      toast('已重新生成初稿');
      return;
    }
    if (action === 'digest-move') {
      const d = digestStore[state.digest.date];
      if (!d) return;
      const item = d.items.find((i) => i.id === el.dataset.id);
      if (!item) return;
      const sectionItems = d.items.filter((i) => i.section === item.section);
      const idx = sectionItems.indexOf(item);
      const target = idx + Number(el.dataset.dir);
      if (!sectionItems[target]) return;
      const aIdx = d.items.indexOf(item);
      const bIdx = d.items.indexOf(sectionItems[target]);
      const tmp = d.items[aIdx];
      d.items[aIdx] = d.items[bIdx];
      d.items[bIdx] = tmp;
      render();
      return;
    }
    if (action === 'digest-edit') {
      const d = digestStore[state.digest.date];
      const item = d ? d.items.find((i) => i.id === el.dataset.id) : null;
      if (!item) return;
      state.digest.editingId = item.id;
      state.digest.editingText = item.text;
      render();
      return;
    }
    if (action === 'digest-edit-save') {
      const d = digestStore[state.digest.date];
      const item = d ? d.items.find((i) => i.id === el.dataset.id) : null;
      if (item) {
        const text = (state.digest.editingText || '').trim();
        if (text) { item.text = text; item.edited = true; }
      }
      state.digest.editingId = null;
      state.digest.editingText = '';
      render();
      toast('条目已改写');
      return;
    }
    if (action === 'digest-edit-cancel') {
      state.digest.editingId = null;
      state.digest.editingText = '';
      render();
      return;
    }
    if (action === 'digest-delete') {
      const d = digestStore[state.digest.date];
      if (!d) return;
      d.items = d.items.filter((i) => i.id !== el.dataset.id);
      if (state.digest.editingId === el.dataset.id) { state.digest.editingId = null; state.digest.editingText = ''; }
      render();
      toast('已从日报中移除');
      return;
    }
    if (action === 'digest-source') { openOverlay({ type: 'digestSource', itemId: el.dataset.id }); return; }
    if (action === 'digest-finalize') {
      const d = digestStore[state.digest.date];
      if (!d) return;
      if (!d.items.filter((i) => i.selected).length) { toast('至少勾选一条日报内容再定稿', 'warning'); return; }
      d.status = 'reviewed';
      render();
      toast('日报已定稿，可导出 Markdown');
      return;
    }
    if (action === 'digest-export') { exportDigest(); return; }

    if (action === 'retry-article') {
      const a = articleById(state.route.params.id);
      if (a) {
        a.status = 'needs_review';
        a.failureReason = null;
        M.review.errors.forEach((r) => {
          if (r.articleId === a.id && state.review.done.errors.indexOf(r.id) < 0) state.review.done.errors.push(r.id);
        });
      }
      render();
      toast('重试成功，已进入待核队列');
      return;
    }
    if (action === 'copy-link') {
      const a = articleById(state.route.params.id);
      if (!a) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(a.url).then(() => toast('原文链接已复制')).catch(() => toast('当前环境无法访问剪贴板', 'warning'));
      } else {
        toast('当前环境不支持剪贴板', 'warning');
      }
      return;
    }
    if (action === 'back') {
      if (history.length > 1) history.back();
      else location.hash = '#/ingest';
      return;
    }

    if (action === 'settings-tab') { state.settings.tab = el.dataset.tab; render(); return; }
    if (action === 'source-toggle') {
      const s = sourceById(el.dataset.id);
      if (s) s.status = s.status === 'active' ? 'paused' : 'active';
      render();
      toast(s && s.status === 'active' ? '已启用该信源' : '已暂停该信源');
      return;
    }
    if (action === 'open-add-source') { openOverlay({ type: 'addSource', form: { name: '', platforms: 'both', weight: 3, note: '' } }); return; }
    if (action === 'save-source') {
      const f = state.overlay.form;
      if (!f.name.trim()) { toast('请填写公众号名称', 'warning'); return; }
      M.sources.push({
        id: 's' + Date.now(), name: f.name.trim(),
        platforms: f.platforms === 'both' ? ['wechat_mini', 'douyin_mini'] : [f.platforms],
        weight: Number(f.weight) || 3, status: 'active', note: f.note.trim() || '人工新增', articles: 0
      });
      state.overlay = null;
      render();
      toast('公众号已新增');
      return;
    }
    if (action === 'open-add-category') { openOverlay({ type: 'addCategory', form: { level: '2', parentId: '', name: '' } }); return; }
    if (action === 'save-category') {
      const f = state.overlay.form;
      const level = Number(f.level);
      if (!f.name.trim()) { toast('请填写品类名称', 'warning'); return; }
      if (level > 1 && !f.parentId) { toast('请选择上级品类', 'warning'); return; }
      const all = flattenCategories();
      const parent = level > 1 ? all.find((n) => n.id === f.parentId) : null;
      const node = { id: 'cat-' + Date.now(), name: f.name.trim(), level, count: 0, children: level < 3 ? [] : undefined };
      if (level === 1) M.categoryTree.push(node);
      else if (parent) { if (!parent.children) parent.children = []; parent.children.push(node); }
      state.overlay = null;
      render();
      toast('品类已新增');
      return;
    }
    if (action === 'open-add-tag') { openOverlay({ type: 'addTag', form: { dimension: '玩法', name: '' } }); return; }
    if (action === 'save-tag') {
      const f = state.overlay.form;
      if (!f.name.trim()) { toast('请填写标签名', 'warning'); return; }
      M.tags.push({ dimension: f.dimension, name: f.name.trim() });
      state.overlay = null;
      render();
      toast('标签已新增');
      return;
    }
    if (action === 'open-add-member') { openOverlay({ type: 'addMember', form: { name: '', title: '', role: 'operator' } }); return; }
    if (action === 'save-member') {
      const f = state.overlay.form;
      if (!f.name.trim()) { toast('请填写姓名', 'warning'); return; }
      M.members.push({ id: 'u' + Date.now(), name: f.name.trim(), role: f.role, title: f.title.trim() || roleLabel[f.role], lastActive: '尚未登录' });
      state.overlay = null;
      render();
      toast('成员已新增');
      return;
    }
    if (action === 'model-test') {
      state.settings.test = { loading: true, ok: false, latency: 0 };
      render();
      setTimeout(() => {
        state.settings.test = { loading: false, ok: true, latency: 412 };
        render();
        toast('模型连接正常（412ms）');
      }, 700);
      return;
    }
    if (action === 'save-model') {
      Object.assign(M.modelConfig, state.settings.model);
      toast('模型配置已保存');
      return;
    }
    if (action === 'soon') { toast(el.dataset.msg || '原型阶段暂未实现', 'warning'); return; }
  }

  function onChange(e) {
    const t = e.target;
    const action = t.dataset.action;

    if (action === 'switch-role') { switchRole(t.value); return; }
    if (action === 'preview-toggle') {
      const o = state.overlay;
      if (o && o.type === 'preview') {
        const item = o.items.find((i) => i.id === t.dataset.id);
        if (item && !item.duplicate) { item.selected = t.checked; render(); }
      }
      return;
    }
    if (action === 'digest-toggle') {
      const d = digestStore[state.digest.date];
      const item = d ? d.items.find((i) => i.id === t.dataset.id) : null;
      if (item) { item.selected = t.checked; render(); }
      return;
    }
    if (action === 'digest-date') {
      state.digest.date = t.value;
      state.digest.editingId = null;
      location.hash = '#/digest/' + t.value;
      if (location.hash === '#/digest/' + t.value) render();
      return;
    }
    if (action === 'game-filter') { state.games[t.dataset.field] = t.value; render(); return; }
    if (action === 'cat-level' || action === 'map-level' || action === 'game-edit-level') {
      const o = state.overlay;
      if (!o || !o.form) return;
      const level = Number(t.dataset.level);
      if (level === 1) { o.form.l1 = t.value; o.form.l2 = ''; o.form.l3 = ''; }
      if (level === 2) { o.form.l2 = t.value; o.form.l3 = ''; }
      if (level === 3) { o.form.l3 = t.value; }
      render();
      return;
    }
    if (action === 'cat-add-level') {
      if (!state.overlay || !state.overlay.form) return;
      state.overlay.form.level = t.value;
      state.overlay.form.parentId = '';
      render();
      return;
    }
    if (t.id === 'shot-file') {
      if (t.files && t.files[0]) {
        state.ingest.screenshotName = t.files[0].name;
        render();
        toast('截图已读取，等待识别');
      }
      return;
    }
    if (t.dataset.overlayField && state.overlay && state.overlay.form) {
      state.overlay.form[t.dataset.overlayField] = t.value;
      if (t.dataset.overlayField === 'search') refreshMapList();
      return;
    }
    if (t.dataset.gameField && state.overlay && state.overlay.form) {
      state.overlay.form[t.dataset.gameField] = t.value;
      return;
    }
    if (t.dataset.modelField) {
      state.settings.model[t.dataset.modelField] = t.value;
      return;
    }
  }

  function onInput(e) {
    const t = e.target;
    const formKey = t.dataset.form;
    if (formKey) {
      if (formKey === 'gameSearch') {
        state.games.q = t.value;
        refreshGameRows();
        return;
      }
      if (formKey === 'digestEdit') { state.digest.editingText = t.value; return; }
      state.forms[formKey] = t.value;
      return;
    }
    if (t.dataset.overlayField === 'search' && state.overlay && state.overlay.form) {
      state.overlay.form.search = t.value;
      refreshMapList();
      return;
    }
    if (t.dataset.overlayField && state.overlay && state.overlay.form) {
      state.overlay.form[t.dataset.overlayField] = t.value;
      return;
    }
    if (t.dataset.gameField && state.overlay && state.overlay.form) {
      state.overlay.form[t.dataset.gameField] = t.value;
      return;
    }
    if (t.dataset.modelField) {
      state.settings.model[t.dataset.modelField] = t.value;
    }
  }

  function refreshMapList() {
    const o = state.overlay;
    if (!o || o.type !== 'map') return;
    const box = $('#map-game-list');
    if (box) box.innerHTML = mapGameListHTML(o);
  }

  function flattenCategories() {
    const out = [];
    M.categoryTree.forEach((l1) => {
      out.push(l1);
      (l1.children || []).forEach((l2) => {
        out.push(l2);
        (l2.children || []).forEach((l3) => out.push(l3));
      });
    });
    return out;
  }

  function onSubmit(e) {
    const form = e.target.closest('[data-submit]');
    if (!form) return;
    e.preventDefault();
    if (form.dataset.submit === 'login') doLogin();
    if (form.dataset.submit === 'ranking') applyRankingFilter();
  }

  function onPaste(e) {
    if (state.route.name !== 'ingest' || state.ingest.tab !== 'screenshot') return;
    if (!e.clipboardData || !e.clipboardData.items) return;
    const items = Array.prototype.slice.call(e.clipboardData.items);
    const image = items.find((i) => i.type && i.type.indexOf('image') === 0);
    if (image) {
      state.ingest.screenshotName = '粘贴的榜单截图.png';
      render();
      toast('已读取剪贴板图片');
    }
  }

  document.addEventListener('dragover', (e) => {
    if (e.target.closest && e.target.closest('[data-action="pick-screenshot"]')) e.preventDefault();
  });
  document.addEventListener('drop', (e) => {
    const zone = e.target.closest && e.target.closest('[data-action="pick-screenshot"]');
    if (!zone) return;
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      state.ingest.screenshotName = file.name;
      render();
      toast('截图已读取，等待识别');
    }
  });

  /* ---------- 启动 ---------- */
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('paste', onPaste);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.overlay) closeOverlay(); });
  window.addEventListener('hashchange', render);

  if (!location.hash) location.replace(state.user ? '#/' : '#/login');
  render();
})();
