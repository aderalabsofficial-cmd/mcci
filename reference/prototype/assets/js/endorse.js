/* endorse.js — member-to-member endorsement (proposer & seconder).
   MCCI does not arrange proposers. The applicant chooses two valid members of the same membership class;
   each member receives a live request in their own portal (plus email), reviews the application and either
   signs digitally (declaration + signature + one-time email code) or declines with a reason.
   Applicant and admin see every change live. Signatures are placed on the official form. */
(function () {
  'use strict';
  const M = window.M, F = M.flow, D = document, { esc, ic, bd, $, $$, L } = M, C = M.C;
  const db = () => M.db, S = () => M.db.settings;
  const commit = (el) => el && el.dataset && el.dataset.commit === '1';
  const ROLE_T = { proposer: 'Proposer', seconder: 'Seconder' }, ROLE_U = { proposer: 'تجویز کنندہ', seconder: 'تائید کنندہ' };

  /* ---------- rules (editable in admin Settings) ---------- */
  const R = () => { const s = S(); s.endorse = Object.assign({ sameClass: true, preferSector: true, days: 7, remindDay: 3, maxPerYear: 12, needCode: true }, s.endorse || {}); return s.endorse; };

  /* ---------- which account this browser tab is signed in as (demo) ---------- */
  const PKEY = 'mcci.persona';
  M.persona = () => { try { return sessionStorage.getItem(PKEY) || 'applicant'; } catch (e) { return 'applicant'; } };
  M.setPersona = (p) => { try { sessionStorage.setItem(PKEY, p); } catch (e) { /* ignore */ } };
  const legacy = (no) => {
    db().legacy = db().legacy || {};
    if (!db().legacy[no]) {
      const m = F.member(no); if (!m) return null; const doc = db().docs.find((d) => d.member === no && d.status === 'Valid');
      db().legacy[no] = { token: no, legacy: true, stage: 'permanent', memberNo: no, cls: m.cls, women: m.women, bizType: m.biz || 'prop', kind: 'new', f: { name: m.company, rep: m.rep, mobile: m.mobile, email: m.email, address: 'Multan', sector: m.sector, desig: 'Owner' }, partners: [], docs: {}, photo: null, sign: null, stamp: null, hist: [{ t: m.since, s: 'Member since', by: 'MCCI', note: 'Imported member record' }], proposer: {}, seconder: {}, print: { status: 'converted', serial: m.serial }, temp: null, perm: { since: m.since, validTo: m.validTo, code: doc ? doc.code : 'MCCI-QR-8F3K-2291' }, committee: {}, review: {}, conf: {}, delivery: { mode: 'collect', tracking: 'Collected at MCCI', at: m.since }, users: [{ name: m.rep, email: m.email, role: 'Owner', status: 'Active' }] };
      M.persist();
    }
    return db().legacy[no];
  };
  const mine0 = F.mine, app0 = F.app;
  F.mine = () => { const p = M.persona(); if (p !== 'applicant' && M.ROLE === 'member') return legacy(p) || mine0(); return mine0(); };
  F.app = (t) => app0(t) || (db().legacy && db().legacy[t]) || null;
  M.myUsers = () => { const a = F.mine(); return a && a.legacy ? a.users : db().me.users; };
  M.myName = () => { const a = F.mine(); return a && a.legacy ? a.f.rep : db().me.name; };

  /* ---------- eligibility ---------- */
  const yearCount = (no) => { const y0 = M.yearEnd() - 365 * M.DAY; return db().apps.reduce((n, a) => n + ['proposer', 'seconder'].filter((k) => a[k] && a[k].no === no && a[k].status === 'Approved' && (a[k].at || 0) > y0).length, 0); };
  M.endorseCount = yearCount;
  const people = (a) => [a.f.rep, ...(a.partners || []).map((p) => p.name)].filter(Boolean).map((x) => x.toLowerCase());
  F.eligible = (a, role) => {
    const r = R(), cls = a.cls || F.classOf(a), other = a[role === 'proposer' ? 'seconder' : 'proposer'] || {};
    return db().members.filter((m) => m.status === 'Permanent' && !(m.app && m.app === a.token)).map((m) => {
      let why = '';
      if (r.sameClass && m.cls !== cls) why = 'Different membership class (' + m.cls + ')';
      else if (m.no === other.no && ['Pending', 'Approved'].includes(other.status)) why = 'Already your ' + (role === 'proposer' ? 'seconder' : 'proposer');
      else if ((m.company || '').toLowerCase() === (a.f.name || '').toLowerCase() || people(a).includes((m.rep || '').toLowerCase())) why = 'Same business or director (conflict of interest)';
      else if (other.no && F.member(other.no) && F.member(other.no).company === m.company) why = 'Same organisation as your other endorser';
      else if (yearCount(m.no) >= r.maxPerYear) why = 'Has reached ' + r.maxPerYear + ' endorsements this year';
      return { m, why, same: r.preferSector && m.sector && a.f.sector && (a.f.sector.toLowerCase().includes(m.sector.toLowerCase()) || (a.nature && a.nature.sector === 'mfg' && /Textile|Cotton|Surgical|Ceramic|Fertilizer|Marble|Food/.test(m.sector))) };
    }).sort((x, y) => (x.why ? 1 : 0) - (y.why ? 1 : 0) || (y.same ? 1 : 0) - (x.same ? 1 : 0) || x.m.company.localeCompare(y.m.company));
  };

  /* ---------- state helpers ---------- */
  const st = (x) => (x && x.status) || (x && x.ok ? 'Approved' : x && x.no ? 'Pending' : 'Empty');
  F.endorsed = (a) => st(a.proposer) === 'Approved' && st(a.seconder) === 'Approved';
  const normDb = (d, force) => { (d.apps || []).forEach((a) => ['proposer', 'seconder'].forEach((k) => { const x = a[k]; if (!x || !x.no || (x.status && !force)) return; x.status = x.ok ? 'Approved' : 'Pending'; x.reqAt = x.reqAt || a.submitted || Date.now() - 2 * M.DAY; if (!x.ok) { x.reqAt = Math.max(x.reqAt, Date.now() - 3 * M.DAY); x.sign = null; x.hash = null; } x.expires = x.reqAt + 7 * M.DAY; x.valid = true; if (x.ok) { x.at = x.at || Date.now() - M.DAY; if (!x.sign && M.demoSign) x.sign = M.demoSign(); if (!x.hash) x.hash = (M.hash(a.token + k + x.no) + M.hash(x.no + x.at)).slice(0, 12).toUpperCase(); } })); };
  const norm = () => { normDb(M.db); M.persist(); };
  const seed0 = M.seed; M.seed = (...x) => { const d = seed0(...x); normDb(d, true); return d; };
  const ap0 = F.applyPreset; F.applyPreset = (d, p) => { ap0(d, p); const a = d.apps.find((x) => x.token === d.me.app); if (a) { ['proposer', 'seconder'].forEach((k) => { if (a[k]) delete a[k].status; }); normDb({ apps: [a] }); } };
  const after = (a) => { if (F.endorsed(a) && a.stage === 'proposer') F.toCommittee(a); };
  const sweep0 = F.sweep; F.sweep = () => { sweep0(); let ch = false; db().apps.forEach((a) => ['proposer', 'seconder'].forEach((k) => { const x = a[k]; if (x && x.status === 'Pending' && x.expires < Date.now()) { x.status = 'Expired'; (a.endorseLog = a.endorseLog || []).push({ role: k, no: x.no, name: x.name, status: 'Expired', t: Date.now() }); M.notify(a.token, ROLE_T[k] + ' request expired', x.name + ' did not respond within ' + R().days + ' days. Please choose another member.'); ch = true; } })); if (ch) M.persist(); };

  /* ---------- applicant: request / remind / withdraw ---------- */
  M.act('end.pick', { label: 'Choose a member as proposer / seconder', api: 'GET /api/members/eligible?role=', tables: 'members (public fields), endorsements', roles: 'Applicant', live: 'Only valid permanent members of the same class; conflicts and yearly limits filtered out', run(p) {
    const a = F.mine(), list = F.eligible(a, p), q = M.ui.endq || '';
    M.modal(`Choose your ${ROLE_T[p].toLowerCase()} · ${ROLE_U[p]}`, `<p class="muted">Valid <b>${esc(a.cls || F.classOf(a))}</b> members of MCCI. Members of your sector are shown first. ${ic('help', '#94a3b8', 14)} Tip: tell the member before you send the request.</p><div class="nat-search" style="margin:12px 0">${ic('search', 'currentColor', 18)}<input id="endQ" placeholder="Search by name, company, sector or membership no." value="${esc(q)}" autocomplete="off"></div><div class="elist" id="endL">${list.map(({ m, why, same }) => `<div class="ecard ${why ? 'off' : ''}" data-q="${esc((m.rep + ' ' + m.company + ' ' + m.sector + ' ' + m.no).toLowerCase())}"><div class="eav">${esc(m.rep.split(' ').map((w) => w[0]).slice(0, 2).join(''))}</div><div class="ebx"><b>${esc(m.rep)}</b><small>${esc(m.company)} · ${esc(m.no)}</small><small>${esc(m.cls)} · ${esc(m.sector)} · ${yearCount(m.no)}/${R().maxPerYear} endorsements this year</small>${why ? `<em>${esc(why)}</em>` : same ? '<i class="same">Same sector</i>' : ''}</div>${why ? `<button class="btn w" disabled title="${esc(why)}">Not eligible</button>` : M.btn('Select', 'end.compose', p + '|' + m.no, 'w p')}</div>`).join('')}</div>`, '', 'wide');
    const f = () => { const v = ($('#endQ').value || '').trim().toLowerCase(); M.ui.endq = v; $$('#endL .ecard').forEach((c) => { c.hidden = v && !v.split(/\s+/).every((w) => c.dataset.q.includes(w)); }); }; $('#endQ').oninput = f; f();
  } });
  M.act('end.compose', { label: 'Write a note and send the endorsement request', api: 'POST /api/endorsements', tables: 'endorsements, notifications, audit_log', roles: 'Applicant', live: 'Creates the request (expires in 7 days), notifies the member live in their portal and by email', run(p, el) {
    const [role, no] = p.split('|'), a = F.mine(), m = F.member(no);
    if (!commit(el)) return M.modal('Send request to ' + esc(m.rep), `${M.kv([['Member', esc(m.rep)], ['Business', esc(m.company)], ['Membership No.', esc(no)], ['As your', ROLE_T[role]]])}<label class="jf full" style="margin-top:14px;display:block">Personal note (they will see it)<textarea data-k="msg" rows="3" style="width:100%">${esc('Assalam o Alaikum ' + m.rep.split(' ')[0] + ' sahib, I have applied for MCCI membership for ' + (a.f.name || 'my business') + '. Kindly be my ' + role + '. Regards, ' + (a.f.rep || M.myName()))}</textarea></label><p class="muted" style="margin-top:10px">They get a notification in their MCCI portal and an email. The request stays open for ${R().days} days.</p>`, `${M.btn('Back', 'end.pick', role)}<button class="btn gold" ${M.da('end.compose', p)} data-commit="1">${ic('send', '#2a1d05', 16)} Send request</button>`);
    const x = M.vals(); if (!x) return;
    const now = Date.now(); a[role] = { no, name: m.rep, biz: m.company, valid: true, status: 'Pending', reqAt: now, expires: now + R().days * M.DAY, msg: x.msg, reminders: 0 };
    (a.endorseLog = a.endorseLog || []).push({ role, no, name: m.rep, status: 'Requested', t: now });
    M.notify(no, 'New ' + role + ' request · ' + (a.f.name || 'applicant'), (a.f.rep || 'An applicant') + ' has asked you to be their ' + role + ' for MCCI membership. Review the application and sign, or decline, in Endorsement requests.');
    F.hist(a, ROLE_T[role] + ' request sent', m.rep + ' (' + no + ')', 'Applicant'); M.log('Endorsement requested', a.token, role + ' → ' + no);
    M.close(); M.save(); M.toast('Request sent to ' + m.rep + ' — they will see it live in their portal');
  } });
  M.act('end.remind', { label: 'Remind proposer / seconder', api: 'POST /api/endorsements/{id}/remind', tables: 'notifications', roles: 'Applicant (once a day) · Membership Officer', live: 'Re-sends the portal notification and email', run(p) { const [t, role] = p.includes('|') ? p.split('|') : [F.mine().token, p]; const a = F.app(t); const x = a[role]; x.reminders = (x.reminders || 0) + 1; M.notify(x.no, 'Reminder: ' + role + ' request · ' + a.f.name, 'Please review and sign, or decline, the request from ' + a.f.rep + '.'); M.log('Endorsement reminder', a.token, role + ' → ' + x.no); M.save(); M.toast('Reminder sent to ' + x.name); } });
  M.act('end.withdraw', { label: 'Withdraw request and choose another member', api: 'DELETE /api/endorsements/{id}', tables: 'endorsements', roles: 'Applicant', live: 'Request closed; member notified', run(p) { const a = F.mine(), x = a[p]; if (x.status === 'Pending') M.notify(x.no, 'Request withdrawn', a.f.name + ' withdrew the ' + p + ' request.'); (a.endorseLog = a.endorseLog || []).push({ role: p, no: x.no, name: x.name, status: x.status === 'Pending' ? 'Withdrawn' : x.status, t: Date.now() }); a[p] = {}; M.save(); M.A['end.pick'].run(p); } });

  /* ---------- slots UI (wizard step 4 + after submission) ---------- */
  M.endorseSlots = (a, editable) => `<div class="g2c">${['proposer', 'seconder'].map((k) => {
    const x = a[k] || {}, s = st(x);
    const head = `<h3>${L(k === 'proposer' ? 'Proposed by' : 'Seconded by', ROLE_U[k])}</h3>`;
    if (s === 'Empty') return `<div class="pcard">${head}<p class="muted">Choose a valid MCCI member of your class who knows your business. They approve by signing digitally.</p><div class="pb" style="margin-top:12px">${M.btn(L('Choose a member', 'رکن منتخب کریں'), 'end.pick', k, 'p big', 'search')}</div></div>`;
    const who = `<div class="found ${s === 'Approved' ? '' : 'pend'}">${ic(s === 'Approved' ? 'check' : s === 'Pending' ? 'clock' : 'x', s === 'Approved' ? C.GR : s === 'Pending' ? C.OR : C.RD, 22)}<div><b>${esc(x.name)}</b><small>${esc(x.biz)} · ${esc(x.no)}</small></div>${bd(s === 'Approved' ? 'Signed' : s)}</div>`;
    const body = s === 'Approved' ? `<div class="esig">${x.sign ? `<img src="${x.sign}" alt="Signature">` : ''}<small>Signed digitally ${M.dt(x.at)}<br>Ref ${esc(x.hash || '')}</small></div>`
      : s === 'Pending' ? `<p class="muted">Request sent ${M.ago(x.reqAt)} · ${Math.max(0, M.daysLeft(x.expires))} days left to respond${x.reminders ? ' · ' + x.reminders + ' reminder(s) sent' : ''}</p><div class="pb" style="margin-top:10px">${M.btn('Send reminder', 'end.remind', k, 'w', 'mail')}${editable !== false ? M.btn('Withdraw & choose another', 'end.withdraw', k, 'w') : ''}</div>`
      : `<p class="err">${s === 'Declined' ? 'Declined' + (x.reason ? ': ' + esc(x.reason) : '') : 'No response in ' + R().days + ' days'}</p><div class="pb" style="margin-top:10px">${M.btn('Choose another member', 'end.withdraw', k, 'p w', 'search')}</div>`;
    return `<div class="pcard ${s === 'Approved' ? 'ok' : s === 'Pending' ? '' : 'bad'}">${head}${who}${body}</div>`;
  }).join('')}</div>`;

  /* ---------- member: inbox, review & sign, decline ---------- */
  const inbox = (no) => { const out = []; db().apps.forEach((a) => ['proposer', 'seconder'].forEach((k) => { if (a[k] && a[k].no === no && a[k].status) out.push({ a, k, x: a[k] }); })); return out.sort((p, q) => (q.x.reqAt || 0) - (p.x.reqAt || 0)); };
  M.endorseInbox = inbox;
  M.pendingFor = () => { const a = F.mine(); return a && a.memberNo ? inbox(a.memberNo).filter((r) => r.x.status === 'Pending').length : 0; };
  M.act('end.review', { label: 'Review an endorsement request', api: 'GET /api/endorsements/{id}', tables: 'endorsements, applications (summary)', roles: 'The requested member only', live: 'Shows the applicant summary and their official form (documents stay private)', run(p) {
    const [t, k] = p.split('|'), a = F.app(t), x = a[k], me = F.mine();
    M.modal(`${ROLE_T[k]} request · ${esc(a.f.name)}`, `${x.msg ? `<div class="m1" style="margin-bottom:12px"><b>${esc(a.f.rep)}</b> wrote:<br>${esc(x.msg)}</div>` : ''}${M.kv([['Applicant', esc(a.f.rep)], ['Business', esc(a.f.name)], ['Type', esc(M.bizFull ? M.bizFull(a) : M.bizName(a.bizType))], ['Nature', esc(M.natureLabel ? M.natureLabel(a) : a.f.particulars || '')], ['Address', esc(a.f.address)], ['Established', M.date(new Date(a.f.est || Date.now()).getTime())], ['Applying as', esc(a.cls || F.classOf(a))], ['You are asked to be', ROLE_T[k]]])}<p class="muted" style="margin-top:12px">${ic('lock', '#94a3b8', 14)} Documents and CNIC numbers stay private to MCCI. You can read the application form below before deciding.</p>`, `${M.btn('View application form', 'doc.view', 'form|' + t, '', 'file')}${x.status === 'Pending' ? M.btn('Decline', 'end.decline', p, 'danger') + M.btn(L('Approve & sign', 'منظور اور دستخط'), 'end.sign', p, 'gold', 'sign') : ''}`, 'wide');
  } });
  M.act('end.sign', { label: 'Approve and sign digitally', api: 'POST /api/endorsements/{id}/sign', tables: 'endorsements, signatures, applications, notifications, audit_log', roles: 'The requested member only (must be signed in)', live: 'Declaration + signature + one-time email code; stores time, device and a document hash; signature appears on the official form', run(p, el) {
    const [t, k] = p.split('|'), a = F.app(t), x = a[k], me = F.mine();
    if (!commit(el)) {
      M.modal(L('Approve & sign', 'منظور اور دستخط'), `<button class="decl on" ${M.da('end.decl')} id="endDecl"><i>✓</i><span>I, <b>${esc(me.f.rep)}</b> (${esc(me.memberNo)}), personally know <b>${esc(a.f.rep)}</b> of <b>${esc(a.f.name)}</b>. To the best of my knowledge the business is genuine and within the Multan Chamber's jurisdiction, and I ${k === 'proposer' ? 'propose' : 'second'} this application for membership.</span></button><h4 class="jg">Your signature</h4><canvas id="endSig" class="sigpad" width="560" height="170"></canvas><div class="pb" style="margin-top:8px">${M.btn('Clear', 'end.clear', '', 'w', 'refresh')}${me.sign ? M.btn('Use my saved signature', 'end.saved', '', 'w') : ''}${M.btn('Sample signature (demo)', 'end.sample', '', 'w')}</div>${R().needCode ? `<div class="fg" style="margin-top:14px"><label>6-digit code sent to ${esc((me.f.email || 'your email').replace(/^(.).*@/, '$1•••@'))} <em class="rq">*</em><input data-k="code" inputmode="numeric" maxlength="6" placeholder="Demo: any 6 digits" value="123456"></label></div>` : ''}`, `${M.btn('Cancel', 'modal.close')}<button class="btn gold" ${M.da('end.sign', p)} data-commit="1">${ic('sign', '#2a1d05', 16)} Sign & approve</button>`);
      const c = $('#endSig'), g = c.getContext('2d'); g.lineWidth = 2.6; g.lineCap = 'round'; g.strokeStyle = '#0b2a8a'; let d = false; M._endDirty = false; M._endSig = null;
      const pt = (e) => { const r = c.getBoundingClientRect(); return [((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height]; };
      c.onpointerdown = (e) => { d = true; M._endDirty = true; M._endSig = null; c.setPointerCapture(e.pointerId); const q = pt(e); g.beginPath(); g.moveTo(q[0], q[1]); };
      c.onpointermove = (e) => { if (!d) return; const q = pt(e); g.lineTo(q[0], q[1]); g.stroke(); };
      c.onpointerup = () => { d = false; };
      return;
    }
    const v = M.vals(); if (!v) return;
    if (!$('#endDecl').classList.contains('on')) return M.toast('Please accept the declaration', 'warn');
    if (R().needCode && !/^\d{6}$/.test(v.code || '')) return M.toast('Enter the 6-digit code from your email', 'warn');
    const sig = M._endSig || (M._endDirty ? M.trimCanvas($('#endSig')) : null); if (!sig) return M.toast('Please sign first', 'warn');
    const now = Date.now(); Object.assign(x, { status: 'Approved', ok: true, at: now, sign: sig, hash: (M.hash(t + k + x.no + now) + M.hash(a.f.name + now)).slice(0, 12).toUpperCase(), device: (navigator.userAgent.match(/(Chrome|Firefox|Safari|Edg)\/[\d.]+/) || ['Browser'])[0], ip: '10.0.3.' + (now % 200) });
    if (!me.sign) me.sign = sig;
    (a.endorseLog = a.endorseLog || []).push({ role: k, no: x.no, name: x.name, status: 'Signed', t: now });
    F.hist(a, ROLE_T[k] + ' signed digitally', x.name + ' (' + x.no + ') · ref ' + x.hash, x.name);
    M.notify(a.token, x.name + ' signed as your ' + k, x.name + ' (' + x.no + ') approved and signed your application as ' + k + '.' + (F.endorsed(a) ? ' Both endorsements are complete.' : ''));
    M.log('Endorsement signed', a.token, k + ' · ' + x.no + ' · ref ' + x.hash); after(a);
    M.close(); M.save(); M.toast('Signed — ' + a.f.rep + ' can see it now');
  } });
  M.act('end.decl', { label: 'Accept endorsement declaration', phase: 'UI', live: 'Required before signing', run: (p, el) => { el.classList.toggle('on'); el.querySelector('i').textContent = el.classList.contains('on') ? '✓' : ''; } });
  M.act('end.clear', { label: 'Clear signature', phase: 'UI', live: 'Client-side', run() { const c = $('#endSig'); c.getContext('2d').clearRect(0, 0, c.width, c.height); M._endDirty = false; M._endSig = null; } });
  M.act('end.saved', { label: 'Use saved signature', phase: 'UI', live: 'Signature saved from a previous signing', run() { M._endSig = F.mine().sign; const c = $('#endSig'), g = c.getContext('2d'), i = new Image(); i.onload = () => { g.clearRect(0, 0, c.width, c.height); const s = Math.min(c.width / i.width, c.height / i.height) * 0.85; g.drawImage(i, (c.width - i.width * s) / 2, (c.height - i.height * s) / 2, i.width * s, i.height * s); }; i.src = M._endSig; } });
  M.act('end.sample', { label: 'Sample signature', phase: 'Demo', live: 'Not part of the built system', run() { M._endSig = M.demoSign(); const c = $('#endSig'), g = c.getContext('2d'), i = new Image(); i.onload = () => { g.clearRect(0, 0, c.width, c.height); g.drawImage(i, 40, 20, c.width - 80, c.height - 40); }; i.src = M._endSig; } });
  M.act('end.decline', { label: 'Decline an endorsement request', api: 'POST /api/endorsements/{id}/decline', tables: 'endorsements, notifications', roles: 'The requested member only', live: 'Applicant is told and can choose another member', run(p, el) {
    const [t, k] = p.split('|'), a = F.app(t), x = a[k];
    if (!commit(el)) return M.ask({ title: 'Decline request', intro: 'The applicant will see that you declined and can choose another member.', fields: [{ k: 'r', l: 'Reason', type: 'select', opts: ['I do not know the applicant well enough', 'The business is not in my category / sector', 'I am not available to endorse at this time', 'Other'] }, { k: 'n', l: 'Note to applicant (optional)', type: 'textarea' }], act: 'end.decline', p, ok: 'Decline', danger: 1 });
    const v = M.vals(); if (!v) return; Object.assign(x, { status: 'Declined', ok: false, reason: v.r + (v.n ? ' — ' + v.n : ''), at: Date.now() });
    (a.endorseLog = a.endorseLog || []).push({ role: k, no: x.no, name: x.name, status: 'Declined', t: Date.now(), reason: x.reason });
    M.notify(a.token, x.name + ' declined your ' + k + ' request', 'Reason: ' + x.reason + '. Please choose another member.'); M.log('Endorsement declined', a.token, k + ' · ' + x.no); M.close(); M.save(); M.toast('Declined — the applicant has been informed');
  } });

  /* account switch (demo: each browser tab can be a different person) */
  M.act('persona.switch', { label: 'Switch account (demo)', phase: 'Demo', live: 'In the built system each person signs in with their own account', run() {
    const cur = M.persona(); const ms = db().members.filter((m) => m.status === 'Permanent' && !m.app).slice(0, 8);
    M.modal('Switch account (demo)', `<p class="muted" style="margin-bottom:12px">Open the applicant in one tab and a member in another tab. Requests and signatures appear live on both sides.</p>${M.li('user', cur === 'applicant' ? C.GR : C.BL, esc(db().me.name) + ' — applicant', esc((mine0() || {}).f ? mine0().f.name || 'New applicant' : ''), cur === 'applicant' ? bd('This tab') : M.btn('Use', 'persona.set', 'applicant', 'w p'))}${ms.map((m) => { const n = inbox(m.no).filter((r) => r.x.status === 'Pending').length; return M.li('award', cur === m.no ? C.GR : C.GD, esc(m.rep) + (n ? ' · ' + n + ' request' + (n > 1 ? 's' : '') : ''), esc(m.company) + ' · ' + m.no + ' · ' + m.cls, cur === m.no ? bd('This tab') : M.btn('Use', 'persona.set', m.no, 'w p')); }).join('')}`, '', 'wide');
  } });
  M.act('persona.set', { label: 'Use this account in this tab (demo)', phase: 'Demo', live: 'Not part of the built system', run(p) { M.setPersona(p); try { db().me.actAs = 0; } catch (e) { /* ignore */ } M.close(); M.go(p === 'applicant' ? 'dashboard.html' : (inbox(p).some((r) => r.x.status === 'Pending') ? 'endorse.html' : 'dashboard.html')); } });

  M.page('member', 'endorse', { t: 'Endorsement requests', d: 'Members receive proposer / seconder requests live, review the applicant and sign digitally or decline; history of endorsements and yearly limit' }, () => {
    const a = F.mine();
    if (!a.legacy && a.stage !== 'permanent' && !(a.stage === 'temp')) return { t: L('Endorsement requests', 'تائید کی درخواستیں'), raw: `<div class="ph"><div><h1>${L('Endorsement requests', 'تائید کی درخواستیں')}</h1><p>When you are an MCCI member, other applicants can ask you to be their proposer or seconder. Their requests appear here.</p></div></div><div class="card">${M.empty('users', 'No requests for you yet', 'This tab is the applicant’s account. To see the member side, switch to a member account.', M.btn('Switch account (demo)', 'persona.switch', '', 'p'))}</div>` };
    const L2 = inbox(a.memberNo), pend = L2.filter((r) => r.x.status === 'Pending'), past = L2.filter((r) => r.x.status !== 'Pending');
    const card = (r) => `<div class="ereq ${r.x.status === 'Pending' ? 'new' : ''}"><div class="eav">${esc(r.a.f.rep.split(' ').map((w) => w[0]).slice(0, 2).join(''))}</div><div class="ebx"><b>${esc(r.a.f.name)}</b><small>${esc(r.a.f.rep)} · ${esc(M.bizName(r.a.bizType))} · applying as ${esc(r.a.cls || '')}</small><small>Asked you to be <b>${ROLE_T[r.k]}</b> · ${M.ago(r.x.reqAt)}${r.x.status === 'Pending' ? ' · ' + Math.max(0, M.daysLeft(r.x.expires)) + ' days left' : ''}</small></div>${r.x.status === 'Pending' ? `${M.btn('Review', 'end.review', r.a.token + '|' + r.k, 'w')}${M.btn(L('Approve & sign', 'دستخط کریں'), 'end.sign', r.a.token + '|' + r.k, 'w gold', 'sign')}` : `${bd(r.x.status === 'Approved' ? 'Signed' : r.x.status)}${M.btn('View', 'end.review', r.a.token + '|' + r.k, 'w')}`}</div>`;
    return { t: L('Endorsement requests', 'تائید کی درخواستیں'), s: 'Applicants who asked you to propose or second their MCCI membership. You decide; MCCI never signs for you.', b: [['Switch account (demo)', 'persona.switch', '', '', 'users']], k: [M.K('Waiting for you', pend.length, 'Respond within ' + R().days + ' days', 'clock', C.OR), M.K('Signed this year', yearCount(a.memberNo), 'Limit ' + R().maxPerYear + ' per year', 'sign', C.GR), M.K('Declined', L2.filter((r) => r.x.status === 'Declined').length, '', 'x', C.RD)], r: [['1fr', M.card(L('Waiting for your decision', 'آپ کے فیصلے کی منتظر'), pend.map(card).join('') || M.empty('check', 'Nothing waiting', 'New requests appear here instantly.'))], ['1fr', M.card(L('History', 'تاریخچہ'), past.map(card).join('') || '<p class="muted">No past requests.</p>')]] };
  });

  /* admin: remind on behalf (no signing on behalf) */
  M.act('adm.prop.remind', { label: 'Remind proposer / seconder', api: 'POST /api/endorsements/{id}/remind', tables: 'notifications', roles: 'Membership Officer', live: 'Re-sends the request notification; staff can never sign on a member’s behalf', run(p) { const a = F.app(p.split('|')[0]); ['proposer', 'seconder'].forEach((k) => { if (a[k] && a[k].status === 'Pending') M.A['end.remind'].run(a.token + '|' + k); }); } });
  M.endAdmin = (a) => ['proposer', 'seconder'].map((k) => { const x = a[k] || {}, s = st(x); return `<div class="drow"><span>${ic(s === 'Approved' ? 'tick' : s === 'Pending' ? 'clock' : 'x', s === 'Approved' ? C.GR : s === 'Pending' ? C.OR : C.RD, 16)}</span><div><b>${ROLE_T[k]}: ${esc(x.name || '—')}</b><small>${esc(x.biz || '')} · ${esc(x.no || '')}${x.reqAt ? ' · requested ' + M.date(x.reqAt) : ''}${s === 'Approved' ? ' · signed ' + M.dt(x.at) + ' · ref ' + esc(x.hash || '') : ''}${s === 'Declined' ? ' · ' + esc(x.reason || '') : ''}</small></div>${s === 'Approved' && x.sign ? `<img class="esmall" src="${x.sign}" alt="signature">` : ''}${bd(s === 'Approved' ? 'Signed' : s === 'Empty' ? 'Not chosen' : s)}</div>`; }).join('') + ((a.endorseLog || []).length ? `<details class="elog"><summary>Endorsement log (${a.endorseLog.length})</summary>${a.endorseLog.map((l) => `<div><small>${M.dt(l.t)} · ${esc(l.role)} · ${esc(l.name)} · ${esc(l.status)}${l.reason ? ' — ' + esc(l.reason) : ''}</small></div>`).join('')}</details>` : '');

  /* demo shortcut: both endorsers sign */
  M.act('end.demoSign', { label: 'Proposer & seconder sign (demo shortcut)', phase: 'Demo', live: 'Not part of the built system', run() { const a = mine0(); ['proposer', 'seconder'].forEach((k) => { const x = a[k]; if (x && x.status === 'Pending') { Object.assign(x, { status: 'Approved', ok: true, at: Date.now(), sign: M.demoSign(), hash: M.hash(a.token + k + Date.now()).toUpperCase() }); F.hist(a, ROLE_T[k] + ' signed digitally', x.name, x.name); M.notify(a.token, x.name + ' signed as your ' + k, 'Endorsement complete.'); } }); after(a); M.close(); M.save(); M.toast('Both endorsements signed (demo)'); } });

  /* member dashboard: a clear banner when someone is waiting for your signature */
  let dashDone = false; const wrapDash = () => { const P = M.P && M.P.member; if (dashDone || !P || !P.dashboard) return; dashDone = true; const f = P.dashboard; const w = () => { const r = f(); const n = M.pendingFor(); if (!n) return r; const ban = `<div class="next gold"><div class="next-i">${ic('sign', '#fff', 34)}</div><div class="next-b"><b>${n} endorsement request${n > 1 ? 's' : ''} waiting for you</b><span lang="ur" style="display:block;margin:2px 0">آپ کی تائید کی منتظر درخواست</span><p>An applicant has asked you to be their proposer or seconder. Review and sign, or decline.</p></div><a class="btn gold big" href="endorse.html">${ic('sign', '#2a1d05', 18)} Open requests</a></div>`; if (r.raw) r.raw = ban + r.raw; else r.r = [['1fr', ban]].concat(r.r || []); return r; }; w._end = true; P.dashboard = w; };
  const render0 = M.render; M.render = () => { wrapDash(); render0(); };
  norm(); F.sweep();
})();
