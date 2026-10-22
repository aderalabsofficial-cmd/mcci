/* ui.js — components, page shell, event wiring, live refresh, orphan audit, demo panel */
(function () {
  'use strict';
  const M = window.M, D = document, B = D.body, { $, $$, esc, ic, bd, L } = M;
  const C = M.C;

  /* ---------- action registry (definitions live in actions.js) ---------- */
  M.A = {};
  M.act = (id, def) => { M.A[id] = Object.assign({ id, phase: 'Build' }, def); if (M.A[id].phase === 'V1') M.A[id].phase = 'Build'; };
  /* attribute helper: data-a / data-p */
  M.da = (a, p) => `data-a="${a}"${p != null && p !== '' ? ` data-p="${esc(p)}"` : ''}`;
  M.btn = (label, a, p, cls = '', icon) => `<button class="btn ${cls}" ${M.da(a, p)}>${icon ? ic(icon, 'currentColor', 16) + ' ' : ''}${label}</button>`;

  /* ---------- page registry ---------- */
  M.P = { site: {}, member: {}, admin: {} };
  M.META = { site: {}, member: {}, admin: {} };
  M.page = (role, name, meta, fn) => { M.P[role][name] = fn; M.META[role][name] = meta; };
  M.pageUrl = (role, name) => (role === M.ROLE ? '' : '../' + role + '/') + name + '.html';

  /* ---------- small components ---------- */
  M.K = (label, v, sub, i, c, act, p) => `<div class="kpi${act ? '' : ' st'}" ${act ? M.da(act, p) : ''}><div class="ki" style="background:${c}22">${ic(i, c, 28)}</div><div><small>${label}</small><br><b>${v}</b><p>${sub || ''}</p></div></div>`;
  M.kg = (...k) => `<div class="kg">${k.join('')}</div>`;
  M.gr = (t, ...b) => `<div class="gr" style="grid-template-columns:${t}">${b.join('')}</div>`;
  M.card = (title, body, right = '') => `<div class="card"><div class="ch"><h3>${title}</h3>${right}</div>${body}</div>`;
  M.li = (i, c, t, s, r, act, p) => `<div class="li${act ? '' : ' st'}" ${act ? M.da(act, p) : ''}><i style="background:${c}22;color:${c}">${M.IC[i] ? ic(i, c, 20) : esc(i)}</i><div><b>${t}</b><small>${s || ''}</small></div>${r ? `<span>${r}</span>` : ''}</div>`;
  M.lst = (t, items, go, gt) => `<div class="card"><div class="ch"><h3>${t}</h3>${go ? `<a href="${go}">${gt || 'View all'}</a>` : ''}</div>${items.length ? items.join('') : '<p class="muted">Nothing here yet.</p>'}</div>`;
  M.kv = (pairs) => `<div class="kv">${pairs.map((x) => `<div><small>${x[0]}</small><b>${x[1] == null || x[1] === '' ? '—' : x[1]}</b></div>`).join('')}</div>`;
  M.PR = (t, items) => `<div class="card"><div class="ch"><h3>${t}</h3></div>${items.map((x) => `<div class="pr st"><div><span>${x[0]}</span><b>${x[3] || x[1] + '%'}</b></div><u><i style="width:${Math.min(100, x[1])}%;background:${x[2]}"></i></u></div>`).join('')}</div>`;
  M.TG = (t, items) => `<div class="card"><div class="ch"><h3>${t}</h3></div>${items.map((x) => `<div class="tg"><div><b>${x[0]}</b><br><small class="muted">${x[1]}</small></div><button class="sw ${x[2] ? 'on' : ''}" ${M.da(x[3] || 'setting.toggle', x[4] || '')} aria-label="${esc(x[0])}"></button></div>`).join('')}</div>`;
  M.stp = (a) => a.map((s, i) => `<div class="stp st"><i style="background:${s[2]}">${i + 1}</i><div><b>${s[0]}</b><small>${s[1]}</small></div></div>`).join('');
  M.tl = (a) => `<ul class="tl">${a.map((x) => `<li class="${x[2]}"><i>${x[2] === 'd' ? '✓' : ''}</i><div><b>${x[0]}</b><small>${x[1]}</small></div></li>`).join('')}</ul>`;
  M.empty = (icon, title, text, action) => `<div class="empty">${ic(icon, '#94a3b8', 40)}<h3>${title}</h3><p>${text}</p>${action || ''}</div>`;
  M.cd = (t, label) => `<div class="cdw" data-cd="${t}">--:--:--</div><small>${label || 'until 24-hour response deadline'}</small>`;
  M.ring = (pct, big, small, col) => `<div class="ring" style="--p:${Math.max(0, Math.min(100, pct))};--c:${col || 'var(--mint)'}"><div><b>${big}</b><small>${small}</small></div></div>`;

  /* charts (clickable points show their value) */
  M.donut = (t, d, lab) => { const tot = d.reduce((a, x) => a + x[1], 0) || 1, CC = 2 * Math.PI * 60; let o = 0; return `<div class="card"><div class="ch"><h3>${t}</h3></div><div class="dn-w"><svg viewBox="0 0 160 160" width="170"><g transform="rotate(-90 80 80)" fill="none" stroke-width="20">${d.map((x) => { const l = (x[1] / tot) * CC, s = `<circle cx="80" cy="80" r="60" stroke="${x[2]}" stroke-dasharray="${Math.max(0, l - 2)} ${CC - l + 2}" stroke-dashoffset="${-o}" ${M.da('chart.point', x[0] + ': ' + x[1])}/>`; o += l; return s; }).join('')}</g><text x="80" y="82" text-anchor="middle" class="dt">${d.reduce((a, x) => a + x[1], 0)}</text><text x="80" y="99" text-anchor="middle" class="ds">${lab}</text></svg><ul class="lg">${d.map((x) => `<li ${M.da('chart.point', x[0] + ': ' + x[1] + ' of ' + tot)}><i style="background:${x[2]}"></i>${x[0]}<b>${x[1]}</b><span>${Math.round((x[1] / tot) * 100)}%</span></li>`).join('')}</ul></div></div>`; };
  M.bars = (t, Lb, S) => { const m = Math.max(1, ...S.flatMap((s) => s[2])); return `<div class="card"><div class="ch"><h3>${t}</h3></div><div class="lgd">${S.map((s) => `<span><i style="background:${s[1]}"></i>${s[0]}</span>`).join('')}</div><div class="bars">${Lb.map((l, j) => `<div class="bg"><div class="bb">${S.map((s) => `<u style="height:${(s[2][j] / m) * 100}%;background:${s[1]}" ${M.da('chart.point', l + ' · ' + s[0] + ': ' + s[2][j])}></u>`).join('')}</div></div>`).join('')}</div><div class="xl">${Lb.map((l) => `<small>${l}</small>`).join('')}</div></div>`; };
  M.line = (t, Lb, d, c, big, dl) => { const m = Math.max(...d), p = d.map((v, i) => [i * (300 / (d.length - 1)), 112 - (v / m) * 100]), pl = p.map((a) => a.join(',')).join(' '); return `<div class="card"><div class="ch"><h3>${t}</h3></div><div class="big">${big}${dl ? `<em class="up">${dl}</em>` : ''}</div><svg viewBox="0 0 300 125" class="ln"><polygon points="0,125 ${pl} 300,125" fill="${c}22"/><polyline points="${pl}" fill="none" stroke="${c}" stroke-width="2.5"/>${p.map((a, i) => `<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="#fff" stroke="${c}" stroke-width="2" ${M.da('chart.point', Lb[i] + ': ' + d[i])}/>`).join('')}</svg><div class="xl">${Lb.map((l) => `<small>${l}</small>`).join('')}</div></div>`; };
  M.MS = (() => { const n = new Date(), a = []; for (let i = 5; i >= 0; i--) { const d = new Date(n.getFullYear(), n.getMonth() - i, 1); a.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]); } return a; })();

  /* tabs — state survives re-render */
  M.tabs = (id, labels, panels) => { const on = Math.min(M.ui.tabs[id] || 0, labels.length - 1); return `<div class="tabs" data-tabs="${id}" role="tablist">${labels.map((x, i) => `<button role="tab" class="${i === on ? 'on' : ''}" ${M.da('tab', id + '|' + i)}>${x}</button>`).join('')}</div>${panels.map((c, i) => `<div class="tp ${i === on ? 'on' : ''}" data-tp="${id}|${i}" role="tabpanel">${c}</div>`).join('')}`; };

  /* data table with search, status filter, sort, CSV export, row action */
  M.TB = {};
  M.table = (id, o) => {
    M.TB[id] = o; const st = (M.ui.tbl[id] = M.ui.tbl[id] || { q: M.qs('q') || '', f: '', so: null, dir: 1 });
    const statuses = o.status != null ? [...new Set(o.rows.map((r) => String(r.cells[o.status]).replace(/<[^>]+>/g, '')))] : [];
    return `<div class="card"><div class="ch"><h3>${o.title}</h3><div class="pb">${o.add ? M.btn(o.add[0], o.add[1], o.add[2] || '', 'p w', 'plus') : ''}${o.noExport ? '' : M.btn('Export CSV', 'tbl.export', id, 'w', 'download')}</div></div><div class="tbar"><input data-tsearch="${id}" placeholder="Search ${esc(o.title.toLowerCase())}…" value="${esc(st.q)}" aria-label="Search">${statuses.length > 1 ? `<select class="sel" data-tfilter="${id}" aria-label="Filter"><option value="">All statuses</option>${statuses.map((x) => `<option ${x === st.f ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>` : ''}</div><div class="tw"><table><thead><tr>${o.cols.map((c, j) => `<th ${M.da('tbl.sort', id + '|' + j)}>${c} ↕</th>`).join('')}${o.rowAct ? '<th></th>' : ''}</tr></thead><tbody id="tb-${id}">${M.tbody(id)}</tbody></table></div><div class="cnt" id="tc-${id}">${M.tcount(id)}</div></div>`;
  };
  M.trows = (id) => { const o = M.TB[id], st = M.ui.tbl[id]; let r = o.rows.filter((x) => { const txt = x.cells.join(' ').replace(/<[^>]+>/g, '').toLowerCase(); return txt.includes((st.q || '').toLowerCase()) && (!st.f || String(x.cells[o.status]).replace(/<[^>]+>/g, '') === st.f); }); if (st.so != null) r = r.slice().sort((a, b) => String(a.cells[st.so]).localeCompare(String(b.cells[st.so]), undefined, { numeric: true }) * st.dir); return r; };
  M.tbody = (id) => { const o = M.TB[id], r = M.trows(id); return r.map((x) => `<tr ${o.rowAct ? M.da(x.act || o.rowAct, x.key) : 'class="st"'}>${x.cells.map((c, j) => `<td>${j === o.status ? bd(String(c)) : j === 0 ? `<b>${c}</b>` : c}</td>`).join('')}${o.rowAct ? `<td class="ar">${ic('chev', '#94a3b8', 16)}</td>` : ''}</tr>`).join('') || `<tr class="st"><td colspan="12" class="em">${o.empty || 'No records match your search.'}</td></tr>`; };
  M.tcount = (id) => `Showing ${M.trows(id).length} of ${M.TB[id].rows.length} records`;
  const retable = (id) => { const b = $('#tb-' + id); if (b) { b.innerHTML = M.tbody(id); $('#tc-' + id).textContent = M.tcount(id); } M.saveUI(); };
  M.retable = retable;

  /* ---------- modal, ask (form modal), toast, file picker ---------- */
  M.modal = (title, body, foot = '', wide = '') => { M.close(); const ov = D.createElement('div'); ov.className = 'ov'; ov.innerHTML = `<div class="md ${wide}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mh"><h3>${title}</h3><button ${M.da('modal.close')} aria-label="Close">✕</button></div><div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div>`; B.append(ov); M._ov = ov; M.fixLinks(ov); const f = ov.querySelector('input,select,textarea'); if (f) setTimeout(() => f.focus(), 60); };
  M.close = () => { if (M._ov) M._ov.remove(); M._ov = null; };
  M.field = (x) => {
    const v = x.v == null ? '' : x.v, req = x.req ? ' <em class="rq">*</em>' : '';
    if (x.type === 'textarea') return `<label class="full">${x.l}${req}<textarea data-k="${x.k}" rows="3" placeholder="${esc(x.ph || '')}">${esc(v)}</textarea></label>`;
    if (x.type === 'select') return `<label>${x.l}${req}<select data-k="${x.k}">${x.opts.map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select></label>`;
    if (x.type === 'info') return `<div class="full note-i">${x.l}</div>`;
    if (x.type === 'check') return `<label class="full chk"><input type="checkbox" data-k="${x.k}" ${v ? 'checked' : ''}> ${x.l}</label>`;
    return `<label class="${x.full ? 'full' : ''}">${x.l}${req}<input data-k="${x.k}" type="${x.type || 'text'}" value="${esc(v)}" placeholder="${esc(x.ph || '')}"></label>`;
  };
  M.ask = (o) => M.modal(o.title, `${o.intro ? `<p class="muted" style="margin-bottom:14px">${o.intro}</p>` : ''}<div class="fg">${(o.fields || []).map(M.field).join('')}</div>`, `${M.btn('Cancel', 'modal.close')}<button class="btn ${o.danger ? 'danger' : 'p'}" ${M.da(o.act, o.p)} data-commit="1">${o.ok || 'Save'}</button>`, o.wide ? 'wide' : '');
  M.vals = () => { const o = {}; let ok = true; $$('.md [data-k]').forEach((i) => { const v = i.type === 'checkbox' ? i.checked : i.value.trim(); o[i.dataset.k] = v; const lab = i.closest('label'); if (lab && lab.querySelector('.rq') && !v) { ok = false; i.classList.add('bad'); } else i.classList.remove('bad'); }); if (!ok) { M.toast('Please fill the required fields', 'warn'); return null; } return o; };
  M.toast = (m, type = '') => { $$('.ts').forEach((t) => t.remove()); const t = D.createElement('div'); t.className = 'ts ' + type; t.setAttribute('role', 'status'); t.innerHTML = esc(m); B.append(t); setTimeout(() => t.remove(), 3200); };
  M.pickFile = (opt, cb) => { const i = D.createElement('input'); i.type = 'file'; if (opt.accept) i.accept = opt.accept; if (opt.multiple) i.multiple = true; if (opt.capture) i.setAttribute('capture', opt.capture); i.style.display = 'none'; i.onchange = () => { cb([...i.files]); i.remove(); }; B.append(i); i.click(); };
  M.readURL = (file, cb) => { const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file); };
  M.download = (name, text, mime = 'text/plain') => { const a = D.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; B.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  M.printHTML = (title, html) => { const w = window.open('', '_blank'); if (!w) { M.toast('Allow pop-ups to print / save as PDF', 'warn'); return; } w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="${M.base}assets/style.css"><link rel="stylesheet" href="${M.base}assets/v7.css"></head><body class="printing">${html}<script>setTimeout(()=>print(),700)<\/script></body></html>`); w.document.close(); };
  M.base = (() => { const s = $('script[src*="assets/js/core.js"]'); return s ? s.getAttribute('src').replace('assets/js/core.js', '') : '../'; })();

  /* ---------- QR (real, scannable) ---------- */
  M.qr = (text, px = 4) => { try { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: px, margin: 2, scalable: true }); } catch (e) { return ic('qr', '#1b4f9c', 64); } };
  M.verifyURL = (code) => 'https://mcci.org.pk/verify?c=' + encodeURIComponent(code);

  /* ---------- portal shell ---------- */
  M.NAV = { member: [], admin: [] }; M.GROUPS = { member: [], admin: [] };
  const groupOf = (role, page) => M.GROUPS[role].find((g) => g.some((t) => t[0] === page));
  const side = () => {
    const role = M.ROLE, adm = role === 'admin';
    const g = groupOf(role, M.PAGE), head = g ? g[0][0] : M.PAGE;
    return `<aside class="sb" aria-label="Main menu"><a class="br" href="dashboard.html"><img src="${M.base}assets/logo-white.png" height="46" alt="MCCI"><div><b>MCCI <span>${adm ? 'Admin' : 'Member'}</span></b><small>${adm ? 'Secretariat Panel' : 'Digital Chamber Portal'}</small></div></a><nav>${M.NAV[role].map((m) => (typeof m === 'string' ? `<h6>${m}</h6>` : `<a class="ni ${m[1] === M.PAGE || m[1] === head ? 'on' : ''}" href="${m[1]}.html"><i style="background:${m[3]}22">${ic(m[2], m[3], 19)}</i>${adm ? m[0] : L(m[0], m[4])}${m[5] ? `<em class="nb">${m[5]()}</em>` : ''}</a>`)).join('')}</nav>${adm ? `<a class="firm" href="settings.html"><i>${ic('gear', '#f3d98b', 20)}</i><div><b>MCCI Secretariat</b><small>Admin panel · demo data</small></div></a>` : `<a class="firm" href="profile.html"><i>${ic('build', '#cbd5e1', 20)}</i><div><b>${esc((M.flow.mine() || {}).f ? M.flow.mine().f.name || 'My company' : 'My company')}</b><small>${esc(M.memberLabel())}</small></div></a>`}</aside>`;
  };
  M.memberLabel = () => { const a = M.flow.mine(); if (!a) return ''; if (a.stage === 'permanent') return 'Permanent member · ' + a.memberNo; if (a.stage === 'temp') return (a.temp.status === 'expired' ? 'Temporary (expired) · ' : 'Temporary member · ') + a.memberNo; if (a.stage === 'draft') return 'New applicant'; return 'Applicant · ' + a.token.replace('MCCI-2026-', ''); };
  const top = () => {
    const adm = M.ROLE === 'admin';
    const notes = adm ? M.db.audit.slice(0, 4).map((a) => ({ title: a.action + ' · ' + a.obj, text: a.user + ' · ' + M.ago(a.t), go: 'audit.html' })) : M.db.notes.filter((n) => n.to === (M.flow.mine() || {}).token).slice(0, 4).map((n) => ({ title: n.title, text: M.ago(n.t), go: 'notifications.html' }));
    const unread = adm ? (M.db.apps.filter((a) => a.stage === 'review' || a.stage === 'submitted').length) : M.db.notes.filter((n) => n.to === (M.flow.mine() || {}).token && !n.read).length;
    return `<header class="tb"><button class="ib hb" ${M.da('menu.toggle')} aria-label="Menu">☰</button><button class="srch" ${M.da('search.open')}>${ic('search', '#64798c', 18)}<span>${adm ? 'Search tokens, members, documents…' : L('Search', 'تلاش کریں')}</span><kbd>Ctrl K</kbd></button><div class="tr">${adm ? '' : `<button class="ib lang" ${M.da('lang.toggle')} title="English / اردو">${L('اردو', 'English')}</button>`}<button class="ib" ${M.da('theme.toggle')} title="Light / dark" aria-label="Light or dark theme">${ic('sun', C.GD, 22)}</button><button class="ib" ${M.da('ai.open')} aria-label="Ask MCCI AI">${ic('spark', C.GD, 22)} AI</button><div class="dw"><button class="ib" ${M.da('dd.toggle', 'd1')} aria-label="Notifications">${ic('bell', C.GD, 22)}${unread ? `<sup>${unread}</sup>` : ''}</button><div class="dd" id="d1"><b class="ddh">${adm ? 'Latest activity' : 'Notifications'}</b>${notes.map((n) => `<a href="${n.go}"><span>${ic('bell', C.GD, 18)}</span><div><b>${esc(n.title)}</b><small>${esc(n.text)}</small></div></a>`).join('') || '<p class="muted" style="padding:10px">No notifications</p>'}</div></div><div class="dw"><button class="ib" ${M.da('dd.toggle', 'd3')}><span class="av">${esc(M.actor().split(' ').filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join(''))}</span><span class="who">${esc(M.actor())}<small>${adm ? esc(M.whoRole ? M.whoRole() : '') : esc(M.whoRole ? M.whoRole() : M.memberLabel())}</small></span>${ic('chev', '#64798c', 14)}</button><div class="dd" id="d3"><a href="${adm ? 'settings' : 'profile'}.html">${ic('gear', '#94a3b8')} ${adm ? 'Settings' : 'Company profile'}</a><a href="../site/index.html">${ic('globe', C.CB)} Public website</a><a href="../${adm ? 'member' : 'admin'}/dashboard.html">${ic('users', C.TL)} Open ${adm ? 'member' : 'admin'} portal</a>${M.whoMenu ? M.whoMenu() : ''}<a href="../blueprint.html">${ic('blueprint', C.GD)} Development plan</a><a href="../site/login.html">${ic('logout', C.RD)} Sign out</a></div></div></div></header>`;
  };
  const ptabs = () => { const g = groupOf(M.ROLE, M.PAGE); return g && g.length > 1 ? `<div class="ptabs" role="tablist">${g.map((t) => `<a class="${t[0] === M.PAGE ? 'on' : ''}" href="${t[0]}.html${t[4] || ''}">${ic(t[2], 'currentColor', 17)} ${M.ROLE === 'member' && t[3] ? L(t[1], t[3]) : t[1]}${t[5] ? `<em>${t[5]()}</em>` : ''}</a>`).join('')}</div>` : ''; };
  const head = (po) => po.raw ? po.raw : `<div class="ph"><div><h1>${po.t}</h1>${po.s ? `<p>${po.s}</p>` : ''}</div><div class="pb">${(po.b || []).map((b) => M.btn(b[0], b[1], b[2] || '', b[3] || '', b[4])).join('')}</div></div>${po.k ? M.kg(...po.k) : ''}${(po.r || []).map((r) => M.gr(r[0], ...r.slice(1))).join('')}`;

  /* ---------- render + live refresh ---------- */
  M.render = () => {
    const fn = M.P[M.ROLE][M.PAGE] || M.P[M.ROLE].dashboard || M.P[M.ROLE].home;
    let po; try { po = fn(); } catch (e) { console.error(e); po = { t: 'Something went wrong', s: esc(e.message), r: [] }; }
    D.title = (po.title || po.t || 'MCCI') + ' · MCCI Digital';
    if (M.ROLE === 'site') $('#app').innerHTML = M.pubShell(head(po));
    else $('#app').innerHTML = `<div class="app">${side()}<div class="mc">${top()}<main class="pg" id="pg">${M.banner ? M.banner() : ''}${ptabs()}${head(po)}</main></div></div>${demoFab()}`;
    if (po.after) try { po.after(); } catch (e) { console.error(e); }
    M.fixLinks($('#app'));
    M.tickAll(); M.reveal();
  };
  M.refresh = () => { const y = scrollY; const act = D.activeElement; const typing = act && act.matches && act.matches('input,textarea,select') && !act.closest('.md'); if (typing && act.dataset.bind) return; M.render(); scrollTo(0, y); };

  /* countdowns */
  M.tickAll = () => $$('[data-cd]').forEach((e) => { const s = Math.max(0, (+e.dataset.cd - Date.now()) / 1000 | 0); e.textContent = [s / 3600 | 0, (s / 60) % 60 | 0, s % 60].map((x) => String(x).padStart(2, '0')).join(':'); });
  setInterval(M.tickAll, 1000);
  M.reveal = () => { $$('.kpi,.card,.sc,.bt').forEach((e, i) => { e.classList.add('rv', 'in'); e.style.setProperty('--d', (i % 5) * 50 + 'ms'); }); };

  /* ---------- event wiring: every interactive element carries data-a ---------- */
  D.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('ov')) return M.close();
    if (!e.target.closest('.dw')) $$('.dd.on').forEach((x) => x.classList.remove('on'));
    const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    const a = M.A[el.dataset.a];
    if (!a) { console.warn('Unregistered action', el.dataset.a); M.toast('Not wired yet: ' + el.dataset.a, 'warn'); return; }
    e.preventDefault();
    try { a.run(el.dataset.p || '', el, e); } catch (err) { console.error(err); M.toast('Error: ' + err.message, 'warn'); }
  });
  D.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.tsearch) { M.ui.tbl[t.dataset.tsearch].q = t.value; retable(t.dataset.tsearch); }
    if (t.dataset.bind && M.onBind) M.onBind(t);
  });
  D.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.tfilter) { M.ui.tbl[t.dataset.tfilter].f = t.value; retable(t.dataset.tfilter); }
    if (t.dataset.bind && M.onBind) M.onBind(t, true);
  });
  D.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); M.A['search.open'].run(); } if (e.key === 'Escape') M.close(); if (e.key === 'Enter' && e.target.dataset.enter) { const b = $(e.target.dataset.enter); if (b) b.click(); } });

  /* ---------- folder-per-page addresses (member/join/), public site & plan hidden ---------- */
  M.IDX = /^https?:$/.test(location.protocol) ? '' : 'index.html';
  M.home = () => '../../' + M.IDX;
  M.pageOf = (href) => { try { const u = new URL(href, location.href), seg = u.pathname.split('/').filter(Boolean); if (seg[seg.length - 1] === 'index.html') seg.pop(); const last = seg[seg.length - 1] || ''; if (last.endsWith('.html')) return { role: seg[seg.length - 2], page: last.replace('.html', '') }; for (let i = seg.length - 1; i > 0; i--) if (['member', 'admin', 'site'].includes(seg[i - 1])) return { role: seg[i - 1], page: seg[i] }; return { role: 'home', page: 'index' }; } catch (e) { return null; } };
  M.fixURL = (h) => { if (!h || /^(https?:|mailto:|tel:|#|javascript:|data:|blob:)/.test(h)) return h; const m = h.match(/^((?:\.\.\/)*)(?:(member|admin|site)\/)?([\w-]+)\.html(\?[^#]*)?(#.*)?$/); if (!m) return h; const role = m[2] || M.ROLE; let page = m[3]; if (page === 'blueprint' || page === 'plan') return '../../plan/' + M.IDX + (m[5] || ''); if (page === 'index') { if (role === 'site' && !(m[1] && !m[2])) page = 'home'; else return h; } return (role === M.ROLE ? '../' : '../../' + role + '/') + page + '/' + M.IDX + (m[4] || '') + (m[5] || ''); };
  M.go = (u) => { const f = M.fixURL(u); if (f) location.href = f; };
  M.fixLinks = (root) => { $$('a[href]', root || D).forEach((a) => { const h = a.getAttribute('href'), f = M.fixURL(h); if (f === h) return; if (f == null) { const tile = a.closest('.bt'); (tile || a).remove(); } else a.setAttribute('href', f); }); };

  /* ---------- orphan audit: every clickable thing must do something ---------- */
  M.knownPage = (href) => {
    if (!href || href === '#') return false;
    if (/^(tel:|mailto:|https?:)/.test(href)) return true;
    const p = M.pageOf(href); if (!p) return false; if (p.role === 'home') return true;
    return !!(M.META[p.role] && M.META[p.role][p.page]);
  };
  M.audit = (root = D) => {
    const bad = [];
    const ok = (el) => { const x = el.closest('[data-a],a[href]'); if (!x) return false; if (x.matches('[data-a]')) return !!M.A[x.dataset.a]; return M.knownPage(x.getAttribute('href')); };
    $$('button,a,[data-a],tr,[role=button],[role=tab]', root).forEach((el) => {
      if (el.closest('.dev-ov')) return;
      if (el.matches('button[disabled]')) { if (!el.title) bad.push([el, 'disabled without reason']); return; }
      if (el.matches('tr') && !el.matches('[data-a]')) return;
      if (!ok(el)) bad.push([el, el.dataset.a ? 'unregistered action ' + el.dataset.a : el.tagName === 'A' ? 'link to unknown page ' + el.getAttribute('href') : 'no action']);
    });
    $$('#app *', root).forEach((el) => { if (el.closest('[data-a],a[href],label,input,select,textarea,.dev-ov')) return; if (getComputedStyle(el).cursor === 'pointer' && !(el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer')) bad.push([el, 'looks clickable (pointer cursor) but has no action']); });
    return bad;
  };
  M.showAudit = () => { $$('.audit-bad').forEach((x) => x.classList.remove('audit-bad')); const b = M.audit(); b.forEach(([el]) => el.classList.add('audit-bad')); const n = $$('[data-a]').length + $$('a[href]').length; M.toast(b.length ? b.length + ' unwired control(s) found — outlined in red' : `Audit passed: all ${n} controls on this page are wired`, b.length ? 'warn' : 'live'); if (b.length) console.table(b.map(([el, r]) => ({ el: el.outerHTML.slice(0, 120), r }))); return b; };

  /* demo control button (prototype only — removed in production) */
  const demoFab = () => `<button class="demo-fab" ${M.da('demo.open')} title="Prototype demo controls">${ic('spark', '#fff', 16)} Demo</button>`;

  /* ---------- AI assistant (canned in prototype; OpenAI with MCCI knowledge base in production) ---------- */
  const AI = [
    [/temp|عارضی|60/i, 'Temporary membership: as soon as MCCI Accounts verify your fee payment, MCCI issues a temporary membership valid for 60 days, with a temporary certificate and QR. You can use all services. When the printed certificate reaches MCCI, staff upload it and your membership becomes permanent automatically — you get an email and your dashboard updates.'],
    [/pay|bank|voucher|receipt/i, 'After approval you get a payment voucher. Pay at the bank (or by transfer to MCCI’s account quoting the voucher number), then upload a photo of the paid receipt in Payments. MCCI Accounts verify it and your temporary membership starts.'],
    [/fee|cost|price|فیس|charges/i, 'Membership fees (as per MCCI form): Corporate PKR 17,500 (admission 5,000 + subscription 12,000 + card 500). Associate PKR 11,500 (4,000 + 7,000 + 500). Women Entrepreneurs PKR 7,500 (2,000 + 5,000 + 500). Extra cards for partners/directors PKR 1,000 each. Renewal: annual subscription only.'],
    [/document|papers|کاغذ|checklist|required/i, 'Documents depend on your business type. Proprietorship: CNIC, NTN, income tax return, sales tax (if any), address proof, bank certificate, photos. Partnership adds partnership deed, Form C and authority letter. Companies add Memorandum & Articles, incorporation certificate, board resolution and Form A/9. The application screen shows the exact list for you.'],
    [/origin|c\.o/i, 'Certificate of Origin: upload commercial invoice, packing list and bill of lading. AI reads HS code, value and parties for you to confirm. MCCI responds within 24 hours and issues a QR-verified attestation.'],
    [/visa|china|guarantee/i, 'Visa letters: choose Visa Recommendation or Visa Guarantee (China), upload passport and invitation; AI pre-fills the request. Response within 24 hours.'],
    [/renew/i, 'Membership runs 1 April to 31 March. Renewal window is 1–31 March each year; you pay only the annual subscription. We remind you by email and in the portal.'],
    [/proposer|seconder/i, 'Your application must be proposed and seconded by two valid MCCI members. Enter their membership numbers; they confirm through an email link or from their own MCCI portal. If you do not know any member, choose “MCCI will help me find one”.'],
    [/track|status|token|kahan|کہاں/i, 'Open “My Membership” to see your 8 steps. The highlighted step is where your file is now, with the next action for you.'],
    [/verify|qr|fake/i, 'Scan the QR on any MCCI certificate or enter its code on the Verify page. Temporary certificates show the valid-until date; once permanent, the temporary QR shows “superseded”.'],
  ];
  M.reply = (q) => (AI.find((a) => a[0].test(q)) || [0, 'I can help with membership, fees, documents, temporary membership, services and tracking. (Demo assistant — the live version answers from MCCI rules and your own records, in English or اردو, and hands over to staff when unsure.)'])[1];
  M.chatUI = (id) => `<div class="cb" id="cb${id}"><div class="m1">Assalam o Alaikum! I am MCCI AI. Ask about membership, fees, documents, temporary membership or services — English or اردو.</div></div><div class="qp">${['What documents do I need?', 'Membership fee?', 'What is temporary membership?', 'Where is my application?'].map((q) => `<button class="btn w" ${M.da('ai.ask', q + '|' + id)}>${q}</button>`).join('')}</div><div class="ci"><input id="ci${id}" placeholder="Type your question…" data-enter="#cs${id}"><button class="btn p" id="cs${id}" ${M.da('ai.send', id)} aria-label="Send">${ic('send', '#fff', 16)}</button></div>`;
  M.say = (id, q) => { const b = $('#cb' + id); if (!b || !q) return; b.insertAdjacentHTML('beforeend', `<div class="m2">${esc(q)}</div>`); setTimeout(() => { b.insertAdjacentHTML('beforeend', `<div class="m1">${esc(M.reply(q))}</div>`); b.scrollTop = 1e5; }, 400); b.scrollTop = 1e5; };

  /* ---------- boot ---------- */
  M.boot = () => {
    try { if (localStorage.getItem('mcci.th') === 'd') B.classList.add('dark'); if (localStorage.getItem('mcci.ur') === '1') B.classList.add('ur-first'); } catch (e) { /* ignore */ }
    if (!$('#app')) return;
    M.render();
    if (M.qs('audit') === '1') setTimeout(M.showAudit, 600);
    setInterval(() => { if (!M._ov && !(D.activeElement && D.activeElement.matches('input,textarea,select'))) { M.flow.sweep(); } }, 60000);
  };
})();
