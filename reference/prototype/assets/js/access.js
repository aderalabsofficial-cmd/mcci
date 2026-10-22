/* access.js — staff designations & seniority limits (admin), company user roles (member),
   email invitations, and "view as" so MCCI can see each person's limited dashboard. Prototype only. */
(function () {
  'use strict';
  const M = window.M, F = M.flow, { esc, ic, bd, $$ } = M, C = M.C;
  const db = () => M.db;
  const commit = (el) => el && el.dataset && el.dataset.commit === '1';
  const LV = ['No access', 'View', 'Edit', 'Approve'];

  /* ============================ ADMIN: modules, designations, seniority ============================ */
  const AMOD = { dash: ['Dashboard', ['dashboard']], mem: ['Membership applications', ['requests', 'mreview']], cmt: ['Committee decisions', ['committee']], temp: ['Temporary & certificates', ['temp', 'certs', 'serials']], reg: ['Members register', ['members', 'member', 'import']], svc: ['Service requests & signing', ['applications', 'review', 'sla', 'approvals']], docs: ['Documents & QR', ['documents']], pay: ['Payments & vouchers', ['payments', 'psid']], eng: ['Events, complaints & content', ['events', 'meetings', 'complaints', 'content', 'notify']], rep: ['Reports & AI', ['reports', 'ai']], staff: ['Staff & audit', ['staff', 'audit']], plat: ['Services setup & settings', ['services', 'integrations', 'settings']] };
  const K = Object.keys(AMOD);
  /* designation → seniority level (1 junior … 5 senior management) + default limits per module */
  const ROLES = {
    'Secretary General': [5, 'Senior management — full control incl. staff, settings and final approvals', { dash: 3, mem: 3, cmt: 3, temp: 3, reg: 3, svc: 3, docs: 3, pay: 3, eng: 3, rep: 3, staff: 3, plat: 3 }],
    'President (Signatory)': [5, 'Signs letters and certificates; views everything else', { dash: 1, mem: 1, cmt: 1, temp: 1, reg: 1, svc: 3, docs: 1, pay: 1, eng: 1, rep: 1, staff: 0, plat: 0 }],
    'Deputy Secretary — Membership': [4, 'Runs the membership desk; approves extensions, class changes, revocations', { dash: 1, mem: 3, cmt: 1, temp: 3, reg: 3, svc: 1, docs: 2, pay: 1, eng: 2, rep: 1, staff: 1, plat: 0 }],
    'Membership Officer': [3, 'Reviews applications, issues temporary memberships, uploads certificates', { dash: 1, mem: 2, cmt: 0, temp: 2, reg: 2, svc: 0, docs: 1, pay: 1, eng: 1, rep: 1, staff: 0, plat: 0 }],
    'Services Officer': [3, 'Handles the seven service requests up to signing', { dash: 1, mem: 0, cmt: 0, temp: 0, reg: 1, svc: 2, docs: 2, pay: 1, eng: 1, rep: 1, staff: 0, plat: 0 }],
    'Accounts Officer': [3, 'Issues vouchers and verifies bank receipts', { dash: 1, mem: 1, cmt: 0, temp: 1, reg: 1, svc: 1, docs: 0, pay: 3, eng: 0, rep: 1, staff: 0, plat: 0 }],
    'Committee Secretary': [2, 'Records Membership Committee decisions and minutes', { dash: 1, mem: 1, cmt: 3, temp: 0, reg: 1, svc: 0, docs: 0, pay: 0, eng: 2, rep: 0, staff: 0, plat: 0 }],
    'Front Desk / Data Entry': [1, 'Enters member records and complaints; no approvals', { dash: 1, mem: 1, cmt: 0, temp: 1, reg: 2, svc: 1, docs: 0, pay: 0, eng: 2, rep: 0, staff: 0, plat: 0 }],
    'Auditor (read-only)': [1, 'Sees everything, changes nothing', { dash: 1, mem: 1, cmt: 1, temp: 1, reg: 1, svc: 1, docs: 1, pay: 1, eng: 1, rep: 1, staff: 1, plat: 1 }],
  };
  M.STAFF_ROLES = ROLES;
  /* which module + level each admin action needs */
  const AREQ = [
    [/^adm\.app\.open$/, 'mem', 1], [/^adm\.reject$|^adm\.cls$/, 'mem', 3], [/^adm\./, 'mem', 2], [/^cmt\./, 'cmt', 3],
    [/^temp\.(extend|revoke|policy)$/, 'temp', 3], [/^temp\.view$/, 'temp', 1], [/^(temp\.|batch\.(create|step)|dispatch\.set|serial\.|cert\.scan)/, 'temp', 2], [/^batch\.(view|file)$/, 'temp', 1],
    [/^mem\.status$/, 'reg', 3], [/^mem\.open$/, 'reg', 1], [/^(mem\.|chg\.|imp\.)/, 'reg', 2],
    [/^svc\.open$/, 'svc', 1], [/^svc\.(sign|signAll)$/, 'svc', 3], [/^svc\.(start|return|approve|msg)$/, 'svc', 2], [/^sla\.rules$/, 'plat', 2],
    [/^qr\.revoke$/, 'docs', 3], [/^qr\.view$/, 'docs', 1],
    [/^(pay\.verify|pay\.reject|psid\.markpaid|psid\.cancel)$/, 'pay', 2], [/^psid\.gen$/, 'pay', 2], [/^psid\.view$/, 'pay', 1],
    [/^(ev\.|mt\.|tk\.|post\.(create|edit)|tpl\.|campaign\.)/, 'eng', 2], [/^rep\./, 'rep', 2],
    [/^(staff\.|perm\.)/, 'staff', 3], [/^audit\./, 'staff', 1],
    [/^(fees\.edit|backup\.now)$/, 'plat', 3], [/^(svcset\.|int\.|settings\.save)$/, 'plat', 2],
  ];
  const me = () => db().staff.find((s) => s.id === db().staffId) || db().staff[0];
  M.roleLevel = (role, mod) => { const o = (db().rolePerms || {})[role]; if (o && o[mod] != null) return o[mod]; const r = ROLES[role]; return r ? r[2][mod] || 0 : 0; };
  const lvl = (mod) => M.roleLevel(me().role, mod);
  M.myLevel = (mod) => lvl(mod);
  const modOfPage = (p) => K.find((k) => AMOD[k][1].includes(p));
  const reqOf = (id, p) => {
    if (M.ROLE === 'member') return mreq(id);
    if (M.ROLE !== 'admin') return null;
    if (id === 'setting.toggle') return /^me\./.test(p || '') ? null : ['plat', 2];
    if (id === 'ticket.reply' || id === 'tk.resolve') return ['eng', 2];
    const x = AREQ.find((r) => r[0].test(id)); return x ? [x[1], x[2]] : null;
  };
  M.can = (id, p) => { const q = reqOf(id, p); if (!q) return true; return M.ROLE === 'member' ? mlvl(q[0]) >= q[1] : lvl(q[0]) >= q[1]; };

  /* ============================ MEMBER: company users & roles ============================ */
  const MMOD = { mship: ['Membership & application', ['membership', 'join', 'mtrack', 'form']], svc: ['Service requests', ['apply', 'applications', 'application']], docs: ['Documents', ['documents']], pay: ['Payments', ['payments']], events: ['Events & trade', ['events', 'opportunities']], profile: ['Company profile & users', ['profile']] };
  const MROLES = {
    Owner: ['Authorized representative — everything, incl. inviting colleagues', { mship: 3, svc: 3, docs: 3, pay: 3, events: 3, profile: 3 }],
    Manager: ['Applies, pays and manages documents; cannot manage users', { mship: 2, svc: 2, docs: 2, pay: 2, events: 2, profile: 1 }],
    Services: ['Requests services (C.O., visa letters…) and downloads documents', { mship: 1, svc: 2, docs: 1, pay: 0, events: 1, profile: 1 }],
    Accounts: ['Pays vouchers and uploads receipts only', { mship: 1, svc: 1, docs: 1, pay: 2, events: 0, profile: 1 }],
    Viewer: ['Can look, cannot change anything', { mship: 1, svc: 1, docs: 1, pay: 1, events: 1, profile: 1 }],
  };
  M.MEMBER_ROLES = MROLES;
  const MREQ = [[/^(wiz\.|app\.|photo\.|sign\.|delivery\.set|renew\.|card\.request)/, 'mship', 2], [/^svc\.(open)$/, 'svc', 1], [/^svc\./, 'svc', 2], [/^vault\./, 'docs', 2], [/^(pay\.)/, 'pay', 2], [/^(event\.reg|opp\.)/, 'events', 2], [/^(user\.|profile\.change)/, 'profile', 3]];
  const mme = () => (M.myUsers() || [])[db().me.actAs || 0] || { role: 'Owner', name: db().me.name };
  const mlvl = (mod) => { const r = MROLES[mme().role]; return r ? r[1][mod] || 0 : 3; };
  const mreq = (id) => { if (/^(setting\.toggle)$/.test(id)) return null; const x = MREQ.find((r) => r[0].test(id)); return x ? [x[1], x[2]] : null; };
  const mmodOfPage = (p) => Object.keys(MMOD).find((k) => MMOD[k][1].includes(p));

  M.whoRole = () => (M.ROLE === 'admin' ? me().role + ' · L' + (ROLES[me().role] || [0])[0] : mme().role === 'Owner' ? M.memberLabel() : mme().role + ' user · ' + ((F.mine() || {}).f || {}).name);
  M.whoMenu = () => (M.ROLE === 'admin' ? `<a href="#" ${M.da('acc.viewas')}>${ic('users', C.PU)} View panel as… (demo)</a>` : `<a href="#" ${M.da('persona.switch')}>${ic('award', C.PU)} Switch account — applicant / member (demo)</a><a href="#" ${M.da('acc.viewas')}>${ic('users', C.PU)} Switch company user (demo)</a>`);

  /* ============================ enforcement: menu, pages, buttons ============================ */
  const NAV0 = { member: M.NAV.member.slice(), admin: M.NAV.admin.slice() }, GRP0 = { member: M.GROUPS.member.slice(), admin: M.GROUPS.admin.slice() };
  const pageOK = (role, p) => { if (role === 'admin') { const m = modOfPage(p); return !m || lvl(m) >= 1; } if (role === 'member') { const m = mmodOfPage(p); return !m || mlvl(m) >= 1; } return true; };
  const filterNav = () => {
    const role = M.ROLE; if (role !== 'admin' && role !== 'member') return;
    const out = []; let pend = null;
    NAV0[role].forEach((x) => { if (typeof x === 'string') { pend = x; return; } if (pageOK(role, x[1])) { if (pend) { out.push(pend); pend = null; } out.push(x); } });
    M.NAV[role] = out; M.GROUPS[role] = GRP0[role].map((g) => g.filter((t) => pageOK(role, t[0]))).filter((g) => g.length);
  };
  const noAccess = (role, p) => () => ({ t: 'No access', raw: `<div class="card" style="max-width:640px;margin:40px auto">${M.empty('lock', 'This screen is outside your limits', `Your ${role === 'admin' ? 'designation (' + esc(me().role) + ')' : 'role (' + esc(mme().role) + ')'} does not include “${esc(role === 'admin' ? AMOD[modOfPage(p)][0] : MMOD[mmodOfPage(p)][0])}”. ${role === 'admin' ? 'Ask the Secretary General to change your limits.' : 'Ask your company’s authorized representative.'}`, '<a class="btn p" href="dashboard.html">Back to dashboard</a>')}</div>` });
  const wrapPages = () => { ['admin', 'member'].forEach((role) => { Object.keys(M.P[role]).forEach((p) => { const fn = M.P[role][p]; if (fn._acc) return; const w = () => (M.ROLE === role && !pageOK(role, p) ? noAccess(role, p)() : fn()); w._acc = true; M.P[role][p] = w; }); }); };
  M.applyAccess = (root) => {
    if (M.ROLE !== 'admin' && M.ROLE !== 'member') return;
    const blocked = (href) => { const x = M.pageOf(href); return !!x && x.role === M.ROLE && !pageOK(M.ROLE, x.page); };
    $$('#app a[href], #app [data-a="nav"], .md a[href], .md [data-a="nav"]', root || document).forEach((el) => { const h = el.getAttribute('href') || el.dataset.p; if (!h || !blocked(h)) return; if (el.matches('.kpi,.bt,.ptabs a,.dd a')) { el.remove(); return; } const t = 'View access to this screen'; if (el.tagName === 'A') { el.removeAttribute('href'); el.setAttribute('data-a', 'acc.locked'); el.dataset.p = t; } else if (el.tagName === 'BUTTON') { el.disabled = true; el.title = 'Needs ' + t; } else { el.dataset.a = 'acc.locked'; el.dataset.p = t; } el.classList.add('locked'); });
    $$('[data-a]', root || document).forEach((el) => {
      const id = el.dataset.a; if (id === 'acc.locked' || M.can(id, el.dataset.p)) return;
      const q = reqOf(id, el.dataset.p), need = LV[q[1]] + ' access to ' + (M.ROLE === 'admin' ? AMOD[q[0]][0] : MMOD[q[0]][0]);
      if (el.tagName === 'BUTTON' && !el.closest('tr')) { el.disabled = true; el.title = 'Needs ' + need; el.classList.add('locked'); }
      else { el.dataset.p = need; el.dataset.a = 'acc.locked'; el.classList.add('locked'); }
    });
  };
  const render0 = M.render; M.render = () => { filterNav(); wrapPages(); render0(); M.applyAccess(); };
  const modal0 = M.modal; M.modal = (...a) => { modal0(...a); M.applyAccess(M._ov); };
  M.act('acc.locked', { label: 'Explain a locked control', phase: 'UI', live: 'Shown when a person’s limits do not allow an action', run: (p) => M.toast('Locked — needs ' + p, 'warn') });

  /* ============================ view as (demo) ============================ */
  M.act('acc.viewas', { label: 'View the panel as another person', phase: 'Demo', live: 'Not part of the built system — everyone sees only their own limits', run() {
    if (M.ROLE === 'admin') return M.modal('View panel as…', `<p class="muted" style="margin-bottom:12px">See exactly what each staff member can open and do. Menu, dashboard and buttons follow their designation.</p>${db().staff.filter((s) => s.status === 'Active').map((s) => M.li('user', s.id === db().staffId ? C.GR : C.BL, esc(s.name), esc(s.role) + ' · seniority L' + (ROLES[s.role] || [0])[0], s.id === db().staffId ? bd('Current') : M.btn('View as', 'acc.as', s.id, 'w p'))).join('')}`);
    M.modal('Switch company user', `<p class="muted" style="margin-bottom:12px">Each colleague sees only what their role allows.</p>${(M.myUsers() || []).map((u, i) => M.li('user', i === (db().me.actAs || 0) ? C.GR : C.BL, esc(u.name), esc(u.role) + ' · ' + esc(MROLES[u.role][0]), i === (db().me.actAs || 0) ? bd('Current') : u.status !== 'Active' ? bd(u.status) : M.btn('Use portal as', 'acc.as', i, 'w p'))).join('')}`);
  } });
  M.act('acc.as', { label: 'Switch to person (demo)', phase: 'Demo', live: 'Not part of the built system', run(p) { if (M.ROLE === 'admin') db().staffId = p; else db().me.actAs = +p; M.close(); M.save(); M.toast('Now viewing as ' + M.actor()); if (!pageOK(M.ROLE, M.PAGE)) M.go('dashboard.html'); } });

  /* ============================ ADMIN: staff invitations & limits ============================ */
  M.act('staff.invite', { label: 'Invite staff member by email', api: 'POST /api/staff/invitations', tables: 'staff, invitations, audit_log', roles: 'Secretary General', live: 'Email with a one-time link (7 days); the person sets a password and 2-step login, then gets the limits of the chosen designation', run(p, el) {
    if (!commit(el)) return M.ask({ title: 'Invite staff by email', intro: 'They receive an email link to join. Access follows the designation you choose.', fields: [{ k: 'n', l: 'Full name', req: 1 }, { k: 'e', l: 'Official email', req: 1, type: 'email', ph: 'name@mcci.org.pk' }, { k: 'r', l: 'Designation', type: 'select', opts: Object.keys(ROLES).map((r) => [r, r + ' (L' + ROLES[r][0] + ')']) }, { k: 'note', l: 'Personal note (optional)', type: 'textarea' }], act: 'staff.invite', ok: 'Send invitation' });
    const x = M.vals(); if (!x) return; if (!/^\S+@\S+\.\S+$/.test(x.e)) return M.toast('Please enter a valid email', 'warn');
    if (db().staff.some((s) => s.email.toLowerCase() === x.e.toLowerCase())) return M.toast('This email is already on the staff list', 'warn');
    db().staff.push({ id: M.uid('ST'), name: x.n, email: x.e, role: x.r, status: 'Invited', twofa: false, invite: { sent: Date.now(), expires: Date.now() + 7 * M.DAY, by: M.actor() } });
    M.log('Invited staff', x.e, x.r); M.close(); M.save(); M.toast('Invitation emailed to ' + x.e);
  } });
  M.act('staff.edit', { label: 'Open staff member (designation, status, invitation)', api: 'PATCH /api/staff/{id}', tables: 'staff, audit_log', roles: 'Secretary General', live: 'Changes apply at the person’s next page load', run(p, el) {
    const s = db().staff.find((y) => y.id === p);
    if (!commit(el)) { const ex = M.btn; return M.modal(esc(s.name), `${M.kv([['Email', esc(s.email)], ['Designation', esc(s.role)], ['Seniority', 'L' + (ROLES[s.role] || [0])[0]], ['Status', bd(s.status)], ['2-step login', s.twofa ? 'On' : 'Not set'], [s.invite && s.status === 'Invited' ? 'Invitation' : 'Last active', s.status === 'Invited' && s.invite ? 'Sent ' + M.ago(s.invite.sent) + ' · expires ' + M.date(s.invite.expires) : s.last ? M.ago(s.last) : '—']])}<div class="fg" style="margin-top:14px">${M.field({ k: 'r', l: 'Designation', type: 'select', opts: Object.keys(ROLES), v: s.role })}${M.field({ k: 's', l: 'Status', type: 'select', opts: ['Active', 'Invited', 'Disabled'], v: s.status })}</div><p class="muted" style="margin-top:10px">${esc((ROLES[s.role] || ['', ''])[1])}</p>`, `${s.status === 'Invited' ? ex('Resend invitation', 'staff.resend', p, '', 'mail') + ex('Cancel invitation', 'staff.revoke', p, 'danger') + ex('Accept invitation (demo)', 'staff.accept', p, 'gold') : ex('Reset 2-step login', 'staff.reset2fa', p, '')}<button class="btn p" ${M.da('staff.edit', p)} data-commit="1">Save</button>`); }
    const x = M.vals(); if (!x) return; if (s.id === db().staffId && x.r !== 'Secretary General' && me().role === 'Secretary General' && db().staff.filter((y) => y.role === 'Secretary General' && y.status === 'Active').length < 2) return M.toast('At least one active Secretary General must remain', 'warn');
    M.log('Changed staff', s.email, s.role + ' → ' + x.r + ' · ' + x.s); s.role = x.r; s.status = x.s; M.close(); M.save(); M.toast('Saved');
  } });
  M.act('staff.resend', { label: 'Resend staff invitation', api: 'POST /api/staff/invitations/{id}/resend', tables: 'invitations', roles: 'Secretary General', live: 'New 7-day link emailed', run(p) { const s = db().staff.find((y) => y.id === p); s.invite = { sent: Date.now(), expires: Date.now() + 7 * M.DAY, by: M.actor() }; M.log('Resent invitation', s.email); M.close(); M.save(); M.toast('Invitation re-sent to ' + s.email); } });
  M.act('staff.revoke', { label: 'Cancel staff invitation', api: 'DELETE /api/staff/invitations/{id}', tables: 'invitations, staff', roles: 'Secretary General', live: 'Link stops working', run(p) { const s = db().staff.find((y) => y.id === p); db().staff = db().staff.filter((y) => y.id !== p); M.log('Cancelled invitation', s.email); M.close(); M.save(); M.toast('Invitation cancelled'); } });
  M.act('staff.accept', { label: 'Accept invitation (simulated)', phase: 'Demo', api: 'POST /api/invitations/{token}/accept', tables: 'auth.users, staff', live: 'In the built system the invitee opens the email link, sets a password and 2-step login', run(p, el) { const s = db().staff.find((y) => y.id === p); if (!commit(el)) return M.ask({ title: 'Welcome to MCCI Admin, ' + esc(s.name), intro: 'This is what the invitee sees after clicking the email link.', fields: [{ k: 'pw', l: 'Create password', type: 'password', req: 1, v: 'demo1234' }, { k: 'c', l: '6-digit code from authenticator app (2-step login)', req: 1, v: '123456' }], act: 'staff.accept', p, ok: 'Activate account' }); if (!M.vals()) return; s.status = 'Active'; s.twofa = true; s.last = Date.now(); s.invite = null; M.log('Accepted invitation', s.email, s.role); M.close(); M.save(); M.toast(s.name + ' is now active as ' + s.role); } });
  M.act('staff.reset2fa', { label: 'Reset 2-step login', api: 'POST /api/staff/{id}/reset-2fa', tables: 'auth.mfa', roles: 'Secretary General', live: 'Person must set up 2-step login again', run(p) { const s = db().staff.find((y) => y.id === p); s.twofa = false; M.log('Reset 2-step login', s.email); M.close(); M.save(); M.toast('2-step login reset'); } });
  M.act('perm.cycle', { label: 'Change a designation’s limit for a module', api: 'PATCH /api/roles/{designation}/limits', tables: 'role_permissions, audit_log', roles: 'Secretary General', live: 'Enforced on every screen and action (row-level security in the database)', run(p) { const [role, mod] = p.split('|'); if (role === 'Secretary General') return M.toast('Secretary General always keeps full control', 'warn'); const cur = M.roleLevel(role, mod); const nx = (cur + 1) % 4; db().rolePerms[role] = db().rolePerms[role] || {}; db().rolePerms[role][mod] = nx; M.log('Changed limit', role, AMOD[mod][0] + ': ' + LV[nx]); M.save(); } });
  M.act('perm.reset', { label: 'Reset limits to defaults', api: 'DELETE /api/roles/limits', tables: 'role_permissions', roles: 'Secretary General', live: 'Restores the standard designation limits', run() { db().rolePerms = {}; M.log('Reset limits to defaults', 'All designations'); M.save(); M.toast('Default limits restored'); } });

  const cell = (role, mod) => { const v = M.roleLevel(role, mod); return `<button class="lvl l${v}" ${M.da('perm.cycle', role + '|' + mod)} title="${esc(role)} · ${esc(AMOD[mod][0])}: ${LV[v]} (click to change)">${['—', 'View', 'Edit', 'Approve'][v]}</button>`; };
  M.page('admin', 'staff', { t: 'Staff & Roles', d: 'Invite staff by email, designations with seniority levels, editable limits per module (No access / View / Edit / Approve), view the panel as anyone' }, () => {
    const S2 = db().staff, inv = S2.filter((s) => s.status === 'Invited');
    return { t: 'Staff & Roles', s: 'Each person’s menu, dashboard and buttons follow the limits of their designation.', b: [['View panel as…', 'acc.viewas', '', '', 'users'], ['Invite staff by email', 'staff.invite', '', 'p', 'mail']], k: [M.K('Active staff', S2.filter((s) => s.status === 'Active').length, 'Signed in with 2-step login', 'users', C.GR), M.K('Invitations pending', inv.length, 'Emailed, not yet accepted', 'mail', C.OR), M.K('Designations', Object.keys(ROLES).length, 'Seniority L1 – L5', 'award', C.GD), M.K('You', esc(me().name.split(' ')[0]), esc(me().role), 'shield', C.BL)], r: [['1fr', M.table('st', { title: 'Staff', cols: ['Name', 'Designation', 'Seniority', 'Email', 'Last active', 'Status'], status: 5, rowAct: 'staff.edit', rows: S2.map((s) => ({ key: s.id, cells: [esc(s.name), esc(s.role), 'L' + (ROLES[s.role] || [0])[0], esc(s.email), s.status === 'Invited' && s.invite ? 'Invited ' + M.ago(s.invite.sent) : s.last ? M.ago(s.last) : '—', s.status] })) })], ['1fr', `<div class="card"><div class="ch"><h3>Limits by designation</h3>${M.btn('Reset to defaults', 'perm.reset', '', 'w', 'refresh')}</div><p class="muted" style="margin-bottom:10px">Click a cell to change it: — (no access) → View → Edit → Approve. “Approve” covers final decisions such as committee approval, extending or revoking temporary memberships, signing documents and verifying payments.</p><div class="tw"><table class="lim"><thead><tr><th>Designation</th><th>Level</th>${K.map((k) => `<th>${AMOD[k][0]}</th>`).join('')}</tr></thead><tbody>${Object.keys(ROLES).map((r) => `<tr class="st"><td><b>${r}</b><small class="muted" style="display:block">${ROLES[r][1]}</small></td><td>L${ROLES[r][0]}</td>${K.map((k) => `<td>${cell(r, k)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`]] };
  });

  /* ============================ MEMBER: invite colleagues by email ============================ */
  M.act('user.invite', { label: 'Invite a colleague by email', api: 'POST /api/companies/{id}/invitations', tables: 'company_users, invitations', roles: 'Authorized representative (Owner)', live: 'Email link (7 days); colleague creates a password and sees only what the role allows', run(p, el) {
    if (!commit(el)) return M.ask({ title: 'Invite a colleague', intro: 'They get an email link. Choose what they may do.', fields: [{ k: 'n', l: 'Name', req: 1 }, { k: 'e', l: 'Email', type: 'email', req: 1 }, { k: 'r', l: 'Role', type: 'select', opts: Object.keys(MROLES).filter((r) => r !== 'Owner').map((r) => [r, r + ' — ' + MROLES[r][0]]) }], act: 'user.invite', ok: 'Send invitation' });
    const x = M.vals(); if (!x) return; if (!/^\S+@\S+\.\S+$/.test(x.e)) return M.toast('Please enter a valid email', 'warn');
    M.myUsers().push({ name: x.n, email: x.e, role: x.r, status: 'Invited', invite: { sent: Date.now(), expires: Date.now() + 7 * M.DAY } }); M.log('Invited company user', x.e, x.r); M.close(); M.save(); M.toast('Invitation emailed to ' + x.e);
  } });
  M.act('user.edit', { label: 'Change colleague’s role / resend / cancel', api: 'PATCH /api/companies/{id}/users/{user}', tables: 'company_users', roles: 'Owner', live: 'Applies immediately', run(p, el) {
    const u = M.myUsers()[+p];
    if (!commit(el)) return M.modal(esc(u.name), `${M.kv([['Email', esc(u.email)], ['Role', esc(u.role)], ['Status', bd(u.status)], ['Can do', esc(MROLES[u.role][0])]])}<div class="fg" style="margin-top:14px">${M.field({ k: 'r', l: 'Role', type: 'select', opts: Object.keys(MROLES).filter((r) => r !== 'Owner'), v: u.role })}</div>`, `${u.status === 'Invited' ? M.btn('Resend', 'user.resend', p, '', 'mail') + M.btn('Accept (demo)', 'user.accept', p, 'gold') : ''}${M.btn(u.status === 'Invited' ? 'Cancel invitation' : 'Remove access', 'user.remove', p, 'danger')}<button class="btn p" ${M.da('user.edit', p)} data-commit="1">Save</button>`);
    const x = M.vals(); if (!x) return; M.log('Changed company user role', u.email, u.role + ' → ' + x.r); u.role = x.r; M.close(); M.save();
  } });
  M.act('user.resend', { label: 'Resend colleague invitation', api: 'POST /api/companies/{id}/invitations/{inv}/resend', tables: 'invitations', roles: 'Owner', live: 'New link emailed', run(p) { const u = M.myUsers()[+p]; u.invite = { sent: Date.now(), expires: Date.now() + 7 * M.DAY }; M.close(); M.save(); M.toast('Re-sent to ' + u.email); } });
  M.act('user.accept', { label: 'Colleague accepts invitation (simulated)', phase: 'Demo', live: 'In the built system the colleague opens the email link and sets a password', run(p) { const u = M.myUsers()[+p]; u.status = 'Active'; u.invite = null; M.log('Company user joined', u.email, u.role); M.close(); M.save(); M.toast(u.name + ' joined as ' + u.role); } });
  M.act('user.remove', { label: 'Remove colleague / cancel invitation', api: 'DELETE /api/companies/{id}/users/{user}', tables: 'company_users', roles: 'Owner', live: 'Access revoked immediately', run(p) { if (+p === 0) return M.toast('The authorized representative cannot be removed', 'warn'); const u = M.myUsers().splice(+p, 1)[0]; if ((db().me.actAs || 0) >= M.myUsers().length) db().me.actAs = 0; M.log('Removed company user', u.email); M.close(); M.save(); M.toast('Removed ' + u.name); } });
  M.colleagues = () => { const U = M.myUsers() || []; return `<div class="card"><div class="ch"><h3>${M.L('People who can use this account', 'اکاؤنٹ استعمال کرنے والے')}</h3><div class="pb">${M.btn('Switch user (demo)', 'acc.viewas', '', 'w')}${M.btn('Invite by email', 'user.invite', '', 'p w', 'mail')}</div></div>${U.map((u, i) => M.li('user', u.role === 'Owner' ? C.GD : C.BL, esc(u.name) + (i === (db().me.actAs || 0) ? ' (you)' : ''), esc(u.role) + ' · ' + esc(u.email) + (u.status === 'Invited' && u.invite ? ' · invited ' + M.ago(u.invite.sent) : ''), u.role === 'Owner' ? bd('Owner') : bd(u.status), u.role === 'Owner' ? null : 'user.edit', i)).join('')}<div class="rolekey">${Object.keys(MROLES).map((r) => `<span><b>${r}</b> ${esc(MROLES[r][0])}</span>`).join('')}</div></div>`; };
})();
