/* MCCI Digital Platform — prototype v7
   core.js: namespace, utilities, icons, demo database (live-synced across tabs) and the membership / service business rules.
   In production every M.flow.* function below becomes a server endpoint (see actions.js for the API map). */
(function () {
  'use strict';
  const M = (window.M = window.M || {});
  const D = document;
  M.ROLE = D.body.dataset.role || 'site';
  M.PAGE = D.body.dataset.page || 'index';
  M.VERSION = '10.0';
  const DAY = 864e5, HOUR = 36e5;
  M.DAY = DAY; M.HOUR = HOUR;

  /* ---------- tiny utilities ---------- */
  M.$ = (s, r = D) => r.querySelector(s);
  M.$$ = (s, r = D) => [...r.querySelectorAll(s)];
  M.esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  M.pkr = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  M.date = (t) => { if (!t) return '—'; const d = new Date(t); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
  M.dt = (t) => { if (!t) return '—'; const d = new Date(t); return M.date(t) + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  M.ago = (t) => { const s = (Date.now() - t) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' hrs ago'; return Math.floor(s / 86400) + ' days ago'; };
  M.daysLeft = (t) => Math.ceil((t - Date.now()) / DAY);
  M.hrsLeft = (t) => { const s = Math.max(0, (t - Date.now()) / 1000); return Math.floor(s / 3600) + 'h ' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + 'm'; };
  M.uid = (p) => p + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  M.get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  M.set = (o, path, v) => { const k = path.split('.'); let a = o; k.slice(0, -1).forEach((x) => { if (a[x] == null) a[x] = /^\d+$/.test(x) ? [] : {}; a = a[x]; }); a[k[k.length - 1]] = v; };
  M.qs = (k) => new URLSearchParams(location.search).get(k);
  M.hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase(); };
  M.code = (seed) => { const h = (M.hash(seed) + M.hash(seed + 'x')).replace(/[^A-Z0-9]/g, ''); return 'MCCI-QR-' + h.slice(0, 4) + '-' + h.slice(4, 8); };
  /* 31 March of the current membership year (year runs 1 April – 31 March) */
  M.yearEnd = (t = Date.now()) => { const d = new Date(t); const y = d.getMonth() >= 3 ? d.getFullYear() + 1 : d.getFullYear(); return new Date(y, 2, 31, 23, 59).getTime(); };
  M.yearLabel = (t = Date.now()) => { const e = new Date(M.yearEnd(t)).getFullYear(); return (e - 1) + '–' + String(e).slice(2); };

  /* ---------- icons ---------- */
  const IC = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.4.6 3.8 2.6 3.8 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    fplus: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M12 11v6M9 14h6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>',
    tick: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6 15h4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>',
    team: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 8H4c0-1 2-2 2-8zM10 21h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8M12 12v7M9 14l3-3 3 3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    dollar: '<path d="M12 3v18M16 7.5c-.5-1.5-2-2.5-4-2.5-2.3 0-4 1.2-4 3s1.5 2.5 4 3 4 1.2 4 3-1.7 3-4 3c-2 0-3.6-1-4-2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 8l9 6 9-6"/>',
    userplus: '<circle cx="10" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-6 7-6M18 8v6M15 11h6"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    build: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>',
    db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    map: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    send: '<path d="M3 11l18-8-8 18-2-8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    phone: '<path d="M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    id: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M14 10h5M14 13h4"/>',
    photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
    stamp: '<path d="M9 3h6l-1 7h3a2 2 0 0 1 2 2v3H5v-3a2 2 0 0 1 2-2h3zM5 19h14"/>',
    sign: '<path d="M3 17c3-1 4-8 6-8s0 7 2 7 2-4 4-4 1 3 3 3 2-1 3-1M3 21h18"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 7v6M12 7v10M16 7v4"/>',
    flag: '<path d="M5 21V4h11l-1.5 4L16 12H5"/>',
    invoice: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    blueprint: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9M13 13h4M13 17h4"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  };
  M.IC = IC;
  M.ic = (n, c = 'currentColor', z = 20) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || IC.file}</svg>`;
  M.C = { GR: '#1fa34a', BL: '#3b82f6', OR: '#f59e0b', PU: '#8b5cf6', RD: '#ef4444', TL: '#14b8a6', PK: '#ec4899', GD: '#c8963e', CB: '#1b4f9c' };

  /* status badge colours */
  const BC = {
    red: /Rejected|Expired|Revoked|Overdue|Unpaid|Breach|Failed|Missing|Suspended|Temporary expired|Not valid|Escalated/,
    orange: /Receipt uploaded|Awaiting|Pending|Returned|Correction|Expiring|Review|In review|Deferred|Draft|Awaiting|At risk|Proposer|Seconder|Waiting|Queued|Batched|Check/,
    blue: /Submitted|Committee|Payment|PSID|Printing|At printer|Proof|Printed|Received|Sent|Open|New|Ready to sign|Planned|Invited|Dispatch/,
    teal: /Temporary/,
    green: /Included|Verified|Active|Permanent|Paid|Verified|Valid|Approved|Issued|Done|Live|Completed|Converted|Collected|Delivered|Resolved|Accepted|On|Clear|OK|Confirmed|Signed|Connected|Ready/,
  };
  M.bd = (t) => { let c = 'gray'; for (const k in BC) if (BC[k].test(t)) { c = k; break; } return `<span class="bd ${c}">${M.esc(t)}</span>`; };

  /* bilingual label: English + Urdu (Urdu rendered in Jameel Noori Nastaleeq) */
  M.L = (en, ur) => (ur ? `<span class="bi"><span class="bi-en">${en}</span><span class="bi-ur" lang="ur">${ur}</span></span>` : en);

  /* ---------- reference data from the MCCI New Membership form (20-08-2026) ---------- */
  M.BIZ = [
    { k: 'prop', en: 'Proprietorship', ur: 'واحد ملکیت', ic: 'user', hint: 'One owner' },
    { k: 'aop', en: 'Partnership / AOP', ur: 'شراکت داری', ic: 'users', hint: 'Two or more partners' },
    { k: 'pvt', en: 'Ltd. / Pvt. Ltd Co.', ur: 'پرائیویٹ لمیٹڈ کمپنی', ic: 'build', hint: 'Registered with SECP' },
    { k: 'mnc', en: 'Multinational Co.', ur: 'ملٹی نیشنل کمپنی', ic: 'globe', hint: 'Foreign company, Pakistan office' },
    { k: 'public', en: 'Public Ltd. Co.', ur: 'پبلک لمیٹڈ کمپنی', ic: 'bank', hint: 'Listed / public company' },
  ];
  /* sixth box on the form: ticked in addition to the legal form */
  M.MFG = { k: 'mfg', en: 'Manufacturing Concern', ur: 'مینوفیکچرنگ ادارہ', ic: 'gear', hint: 'Factory / production · tick as well' };
  M.bizName = (k) => (M.BIZ.find((b) => b.k === k) || {}).en || '—';
  /* nature of business: sector, then the specific activity (up to 3) */
  M.NATURE = [
    { k: 'mfg', en: 'Manufacturing & Industry', ur: 'صنعت و پیداوار', ic: 'gear', c: '#14b8a6', items: ['Textile spinning & weaving', 'Garments & home textiles', 'Cotton ginning', 'Food processing', 'Flour, rice & oil mills', 'Sugar mill', 'Pharmaceuticals', 'Chemicals & fertilizer', 'Plastics & packaging', 'Engineering & steel', 'Furniture & woodwork', 'Leather & footwear'] },
    { k: 'trade', en: 'Wholesale & Distribution', ur: 'تھوک و ترسیل', ic: 'truck', c: '#c8963e', items: ['Wholesaler', 'Distributor', 'Dealer / stockist', 'Commission agent (Arhti)', 'Retail shop / chain', 'Super store'] },
    { k: 'impex', en: 'Import & Export', ur: 'درآمد و برآمد', ic: 'globe', c: '#3b82f6', items: ['Exporter', 'Importer', 'Importer & exporter', 'Indenting agent', 'Customs clearing agent', 'Freight forwarder'] },
    { k: 'it', en: 'IT & Digital', ur: 'آئی ٹی و ڈیجیٹل', ic: 'db', c: '#7c3aed', items: ['Software house', 'IT services & support', 'Call centre / BPO', 'E-commerce', 'Digital marketing agency', 'Telecom & internet services'] },
    { k: 'agri', en: 'Agriculture & Food', ur: 'زراعت و خوراک', ic: 'sun', c: '#1fa34a', items: ['Agri inputs (seed, pesticide, fertilizer)', 'Cotton & grain trading', 'Mango & fruit / vegetables', 'Dairy & livestock', 'Poultry & feed', 'Cold storage'] },
    { k: 'build', en: 'Construction & Real Estate', ur: 'تعمیرات و جائیداد', ic: 'build', c: '#f59e0b', items: ['Builder & developer', 'Construction contractor', 'Building materials', 'Real estate agency', 'Architects & engineers'] },
    { k: 'health', en: 'Health & Pharma', ur: 'صحت و ادویات', ic: 'plus', c: '#ef4444', items: ['Hospital / clinic', 'Pharmacy / medical store', 'Pharma distribution', 'Diagnostic laboratory', 'Medical equipment'] },
    { k: 'logi', en: 'Transport & Travel', ur: 'ٹرانسپورٹ و سفر', ic: 'map', c: '#0ea5e9', items: ['Goods transport', 'Courier & delivery', 'Warehousing', 'Travel & tour agency', 'Passenger transport'] },
    { k: 'fin', en: 'Finance & Professional', ur: 'مالیات و پیشہ ورانہ خدمات', ic: 'bank', c: '#1b4f9c', items: ['Bank / financial institution', 'Insurance', 'Chartered accountants', 'Legal & tax consultants', 'Management consultancy'] },
    { k: 'energy', en: 'Energy & Automotive', ur: 'توانائی و آٹو', ic: 'plug', c: '#ea580c', items: ['Petroleum / CNG station', 'Solar & renewable energy', 'Electrical goods', 'Auto dealer', 'Auto parts & workshop'] },
    { k: 'hosp', en: 'Hospitality & Education', ur: 'مہمان نوازی و تعلیم', ic: 'star', c: '#db2777', items: ['Hotel', 'Restaurant & catering', 'School / college', 'Training institute', 'Events & marriage hall'] },
    { k: 'svc', en: 'Media & Other Services', ur: 'میڈیا و دیگر خدمات', ic: 'mic', c: '#64748b', items: ['Printing & publishing', 'Advertising & media', 'Security services', 'Cleaning & facility services', 'Other services'] },
  ];
  M.natureLabel = (a) => { const n = a.nature || {}; const s = M.NATURE.find((x) => x.k === n.sector); return s ? s.en + ((n.items || []).length || n.other ? ': ' + [...(n.items || []), n.other].filter(Boolean).join(', ') : '') : ''; };
  M.bizFull = (a) => M.bizName(a.bizType) + (a.manufacturing ? ' · Manufacturing Concern' : '');
  /* document checklists — exactly as listed in "Instructions and Requirements of Membership" */
  M.DOCS = {
    common: {
      ntn: ['A copy of National Tax Number (NTN) certificate on the name of {of}', 1, 'NTN certificate', 'ntn'],
      itr: ['Latest Income Tax Return where applicable on the name of {of}', 0, 'Income tax return', 'itr'],
      st: ['A copy of Sales Tax Registration Certificate and Sales Tax Return, if registered / applicable', 0, 'Sales tax certificate', 'st'],
      addr: ['Proof of business addresses (copy of lease deed / allotment letter of the building / office)', 1, 'Address proof', 'addr'],
      bank: ['Original Bank Account Maintenance Certificate on the name of business', 1, 'Bank certificate', 'bank'],
      photo: ['Three photographs of {who} (latest + coloured)', 1, 'Passport photo', 'photo'],
    },
    prop: ['cnic:A copy of CNIC / Passport of Proprietor', 'ntn', 'itr', 'st', 'addr', 'bank', 'photo'],
    aop: ['cnic:Copies of CNICs / Passports of Partners', 'ntn', 'itr', 'st', 'addr', 'bank', 'deed:An attested copy of Partnership Deed duly registered with Registrar of Firms, Multan', 'formc:An attested copy of Form “C” issued by Registrar of Firms', 'auth:An Authority Letter on Letterhead by all Partners for nominating one of the Partners as authorized representative in Multan Chamber of Commerce & Industry', 'photo'],
    pvt: ['cnic:Copies of CNICs / Passports of Directors', 'ntn', 'itr', 'st', 'moa:A copy of Memorandum and Articles of Association duly approved by Securities & Exchange Commission of Pakistan (SECP) and attested by company secretary', 'inc:Copy of Certificate of Incorporation by SECP and attested by company secretary', 'addr', 'bank', 'board:Board Resolution on Letterhead for nominating one of the Directors as authorized representative in Multan Chamber of Commerce & Industry', 'photo', 'forma:Latest copy of Form A & Form 9 duly certified by SECP'],
    public: ['cnic:Copies of CNICs / Passports of Directors', 'ntn', 'itr', 'st', 'moa:A copy of Memorandum and Articles of Association duly approved by Securities & Exchange Commission of Pakistan (SECP) and attested by company secretary', 'inc:Copy of Certificate of Incorporation by SECP or proof of filing form 38 to 45 with SECP and BOI letter', 'addr', 'bank', 'board:Board Resolution or Power of Attorney, nominating one of Directors or General Manager / Country Manager as authorized representative in Multan Chamber of Commerce & Industry', 'photo', 'forma:Latest copy of Form A & Form 9 duly certified by SECP'],
  };
  /* wording that changes with the business type, exactly as on the form */
  M.DOCWORD = { prop: { of: 'business', who: 'the proprietor' }, aop: { of: 'the firm', who: 'authorized representative' }, pvt: { of: 'the Company', who: 'authorized representative' }, public: { of: 'the Company', who: 'authorized representative' }, mnc: { of: 'the Company', who: 'authorized representative' } };
  M.DOCS.mnc = M.DOCS.public;
  M.DOCSHORT = { cnic: 'CNIC / Passport', deed: 'Partnership deed', formc: 'Form "C"', auth: 'Authority letter', moa: 'Memorandum & Articles', inc: 'Certificate of Incorporation', board: 'Board resolution / POA', forma: 'Form A & Form 9' };
  M.docList = (biz) => (M.DOCS[biz] || M.DOCS.prop).map((x) => {
    if (x.includes(':')) { const [k, l] = x.split(':'); return { k, label: l, req: true, short: M.DOCSHORT[k] }; }
    const c = M.DOCS.common[x], w = M.DOCWORD[biz] || M.DOCWORD.prop; return { k: c[3], label: c[0].replace('{of}', w.of).replace('{who}', w.who), req: !!c[1], short: c[2] };
  });

  /* services (MoU §4) */
  M.SV = [
    { k: 'ebil', n: 'E-BIL', full: 'E-BIL — Electronic Business Invitation Letter', ur: 'ای-بل دعوت نامہ', ic: 'mail', c: '#3b82f6', docs: ['Invitee passport copy', 'Purpose & itinerary of visit', 'Authority letter (if applicable)'], fields: ['Invitee name', 'Passport no.', 'Nationality', 'Visit dates'], note: 'Submitted and tracked online; letter issued with a verification QR' },
    { k: 'visa', n: 'Visa Recommendation', full: 'Visa Recommendation Letter', ur: 'ویزا سفارشی خط', ic: 'users', c: '#14b8a6', docs: ['Passport copy & CNIC', 'Invitation from host company', 'Travel itinerary'], fields: ['Traveller name', 'Passport no.', 'Country', 'Embassy'], note: 'Issued digitally with QR verification' },
    { k: 'guar', n: 'Visa Guarantee (China)', full: 'Visa Guarantee Letter — for obtaining Chinese visa', ur: 'چینی ویزا گارنٹی خط', ic: 'shield', c: '#ef4444', docs: ['Passport copy of traveller', 'Invitation letter from Chinese partner', 'Business registration proof'], fields: ['Traveller name', 'Passport no.', 'Chinese company', 'City'], note: 'AI pre-fills the form from your documents' },
    { k: 'sample', n: 'Free Samples Letter', full: 'Recommendatory Letter — carry free commercial samples abroad', ur: 'نمونہ جات سفارشی خط', ic: 'folder', c: '#f59e0b', docs: ['Sample list with values', 'Passport copy', 'Travel dates'], fields: ['Traveller name', 'Destination', 'Sample value (USD)', 'Travel date'], note: '24-hour response target' },
    { k: 'other', n: 'Recommendatory Letter', full: 'Other Recommendatory Letters — membership / company profile etc.', ur: 'دیگر سفارشی خطوط', ic: 'file', c: '#8b5cf6', docs: ['Request purpose', 'Supporting documents'], fields: ['Addressed to', 'Purpose'], note: 'Letter templates managed by MCCI' },
    { k: 'co', n: 'Certificate of Origin', full: 'Attestation of Certificate of Origin (C.O.)', ur: 'سرٹیفکیٹ آف اوریجن', ic: 'bank', c: '#c8963e', docs: ['Commercial invoice', 'Packing list', 'Bill of lading / airway bill', 'C.O. form'], fields: ['Consignee', 'Destination', 'HS code', 'Invoice value (USD)'], note: 'Documents checked online; attested copy issued with a verification QR' },
    { k: 'att', n: 'Document Attestation', full: 'Other Document Attestations — certificate, financial report, authority letter, MoU', ur: 'دستاویزات کی تصدیق', ic: 'check', c: '#1b4f9c', docs: ['Document to attest', 'Covering request'], fields: ['Document type', 'Addressed to'], note: 'Every attested document gets a verification QR' },
  ];
  M.sv = (k) => M.SV.find((s) => s.k === k) || M.SV[0];

  /* membership stages — members see 8 simple steps */
  M.STEPS = [
    { k: 'submitted', en: 'Submitted', ur: 'جمع ہو گئی', ic: 'fplus', who: 'You' },
    { k: 'review', en: 'Document check', ur: 'کاغذات کی جانچ', ic: 'shield', who: 'MCCI' },
    { k: 'proposer', en: 'Proposer & Seconder', ur: 'تجویز کنندہ و تائید کنندہ', ic: 'users', who: 'Members' },
    { k: 'committee', en: 'Committee approval', ur: 'کمیٹی کی منظوری', ic: 'award', who: 'Committee' },
    { k: 'payment', en: 'Fee payment', ur: 'فیس کی ادائیگی', ic: 'card', who: 'You' },
    { k: 'temp', en: 'Temporary membership', ur: 'عارضی رکنیت', ic: 'hourglass', who: '60 days' },
    { k: 'printing', en: 'Certificate printing', ur: 'سرٹیفکیٹ کی چھپائی', ic: 'print', who: 'Printer' },
    { k: 'permanent', en: 'Permanent member', ur: 'مستقل رکن', ic: 'check', who: 'Done' },
  ];
  M.stepIndex = (a) => {
    if (!a || a.stage === 'draft') return -1;
    const m = { submitted: 0, review: 1, returned: 1, proposer: 2, committee: 3, payment: 4, temp: 5, permanent: 7, rejected: 1 };
    let i = m[a.stage] == null ? 0 : m[a.stage];
    if (a.stage === 'temp' && a.print && ['printer', 'printed', 'received'].includes(a.print.status)) i = 6;
    return i;
  };
  M.STAGE_LABEL = { draft: 'Draft', submitted: 'Submitted', review: 'In review', returned: 'Returned for correction', proposer: 'Awaiting Proposer / Seconder', committee: 'With Committee', payment: 'Awaiting payment', temp: 'Temporary member', permanent: 'Permanent member', rejected: 'Rejected' };
  M.PRINT_LABEL = { none: '—', queued: 'Queued for printing', batched: 'Batched', proof: 'Proof approved', printer: 'At printer', printed: 'Printed', received: 'Received at MCCI', converted: 'Converted' };

  /* ---------- the demo database ---------- */
  const KEY = 'mcci.v10.db', UIKEY = 'mcci.v10.ui.' + M.ROLE + '.' + M.PAGE;
  const svgAvatar = (bg, sk) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 450"><rect width="350" height="450" fill="${bg}"/><circle cx="175" cy="175" r="78" fill="${sk}"/><path d="M50 450c0-90 56-150 125-150s125 60 125 150z" fill="#1d2b4a"/><path d="M140 300l35 50 35-50z" fill="#fff"/><path d="M110 150c0-55 30-80 65-80s65 25 65 80c-10-25-30-35-65-35s-55 10-65 35z" fill="#222"/></svg>`);
  M.svgAvatar = svgAvatar;

  function seed(preset) {
    const now = Date.now();
    const ago = (d, h = 0) => now - d * DAY - h * HOUR;
    const s = {
      ver: 8, created: now,
      seq: { app: 243, svc: 10494, psid: 4410, rc: 9013, batch: 17, serial: 100249, ticket: 420, mno: { C: 1131, A: 2214 } },
      settings: {
        tempDays: 60, tempExtendDays: 30, tempMaxExt: 1, tempAlert1: 15, tempAlert2: 7, autoTemp: true, tempInDirectory: true, tempServices: true,
        fees: { Corporate: { admission: 5000, subscription: 12000, card: 500 }, Associate: { admission: 4000, subscription: 7000, card: 500 }, Women: { admission: 2000, subscription: 5000, card: 500 }, extraCard: 1000 },
        svcFee: { ebil: 2000, visa: 1500, guar: 3000, sample: 1500, other: 1000, co: 1000, att: 500 },
        corpTurnover: 50000000, processDays: 15, slaHours: 24, psidDays: 7, bank: { name: 'MCCI bank (to be confirmed by MCCI)', title: 'Multan Chamber of Commerce & Industry', iban: 'PK00 XXXX 0000 0000 0000 0000', branch: 'Any branch' }, legacyMembers: 1262, emailCopy: true, urduFirst: false,
        chamber: { name: 'The Multan Chamber of Commerce & Industry', addr: 'Shahrah-e-Aiwan-e-Tijarat-o-Sanat, Multan', tel: '92-61-4543530, 4517087', fax: '92-61-4570463', email: 'info@mcci.org.pk', web: 'www.mcci.org.pk' },
      },
      me: { app: 'MCCI-2026-M-0231', name: 'Bilal Hussain', mobile: '0300-1234567', email: 'bilal@alnoorhome.pk', prefs: { email: true, urdu: false, dir: true }, actAs: 0, users: [{ name: 'Bilal Hussain', email: 'bilal@alnoorhome.pk', role: 'Owner', status: 'Active' }, { name: 'Sana Ahmed', email: 'accounts@alnoorhome.pk', role: 'Accounts', status: 'Active' }, { name: 'Kamran Shah', email: 'exports@alnoorhome.pk', role: 'Services', status: 'Active' }, { name: 'Faraz Ali', email: 'faraz@alnoorhome.pk', role: 'Viewer', status: 'Invited', invite: { sent: Date.now() - DAY, expires: Date.now() + 6 * DAY } }] },
      staff: [
        ['Kamran Raza', 'Secretary General', 'sg@mcci.org.pk', 'Active'], ['Ayesha Khan', 'Deputy Secretary — Membership', 'ayesha@mcci.org.pk', 'Active'], ['Bilal Ahmed', 'Membership Officer', 'bilal.ahmed@mcci.org.pk', 'Active'],
        ['Usman Tariq', 'Services Officer', 'usman@mcci.org.pk', 'Active'], ['Hina Siddiqui', 'Accounts Officer', 'hina@mcci.org.pk', 'Active'], ['Dr. Shafique Pitafi', 'President (Signatory)', 'president@mcci.org.pk', 'Active'],
        ['Sara Ahmed', 'Committee Secretary', 'committee@mcci.org.pk', 'Active'], ['Nadia Perveen', 'Front Desk / Data Entry', 'frontdesk@mcci.org.pk', 'Active'], ['Imran Ali', 'Auditor (read-only)', 'audit@mcci.org.pk', 'Invited'],
      ].map((r, i) => ({ id: 'ST-' + (10 + i), name: r[0], role: r[1], email: r[2], status: r[3], twofa: r[3] === 'Active', last: r[3] === 'Active' ? now - (i * 5 + 1) * HOUR : null, invite: r[3] === 'Invited' ? { sent: now - 2 * DAY, expires: now + 5 * DAY } : null })),
      staffId: 'ST-10', rolePerms: {},
      apps: [], members: [], svcs: [], psids: [], batches: [], docs: [], notes: [], audit: [], tickets: [], events: [], meetings: [], posts: [], templates: [], changes: [], inquiries: [], spoil: [], imports: [],
    };
    const base = (o) => Object.assign({ kind: 'new', manufacturing: false, women: false, salesTax: false, turnover50: false, partners: [], docs: {}, photo: null, sign: null, stamp: null, hist: [], proposer: {}, seconder: {}, print: { status: 'none' }, temp: null, perm: null, review: {}, committee: {}, conf: {} }, o);

    /* existing permanent members (proposers / seconders must be valid members) */
    const EX = [
      ['MCCI-C-1042', 'Al-Noor Textiles', 'Corporate', 'Textiles', 'Muhammad Arif', 'pvt'], ['MCCI-C-1090', 'Chenab Mangoes Export', 'Corporate', 'Agriculture', 'Ahmed Raza', 'pvt'],
      ['MCCI-C-1015', 'Sufi Surgical Industries', 'Corporate', 'Surgical', 'Naveed Sufi', 'pvt'], ['MCCI-A-2090', 'Multan Cotton Traders', 'Associate', 'Cotton', 'Khalid Mehmood', 'aop'],
      ['MCCI-A-2140', 'Blue Tiles Handicrafts', 'Associate', 'Handicrafts', 'Rabia Noor', 'prop', 1], ['MCCI-C-1066', 'Hamdard Agro Foods', 'Corporate', 'Food', 'Faisal Hamdard', 'pvt'],
      ['MCCI-A-2175', 'Southern Punjab Ceramics', 'Associate', 'Ceramics', 'Zubair Ahmad', 'aop'], ['MCCI-C-1101', 'Shah Rukn Fertilizers', 'Corporate', 'Fertilizer', 'Saad Shah', 'public'],
      ['MCCI-A-2188', 'Pak-China Marble Works', 'Associate', 'Marble', 'Li Wei / Asif Khan', 'aop'], ['MCCI-A-2201', 'Qasim Bagh Poultry', 'Associate', 'Poultry', 'Qasim Ali', 'prop'],
      ['MCCI-C-0987', 'Fatima Fertilizer Multan', 'Corporate', 'Fertilizer', 'Omer Farooq', 'public'], ['MCCI-A-2050', 'Ghanta Ghar Electronics', 'Associate', 'Retail', 'Bilal Ahmed', 'prop'],
    ];
    EX.forEach((m, i) => s.members.push({ no: m[0], company: m[1], cls: m[2], women: !!m[6], sector: m[3], rep: m[4], biz: m[5], city: 'Multan', status: i === 9 ? 'Expired' : 'Permanent', since: ago(400 + i * 90), validTo: i === 9 ? M.yearEnd(ago(400)) : M.yearEnd(now), serial: 'MCCI-' + m[0].split('-')[1] + '-0' + (98000 + i * 13), mobile: '0300-55' + String(10000 + i * 717).slice(0, 5), email: m[1].toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) + '@mail.pk', app: null }));

    /* membership applications at every stage */
    const P = (n, c, m) => ({ name: n, cnic: c, mobile: m, card: false });
    const mk = (tok, o) => base(Object.assign({ token: 'MCCI-2026-M-' + tok }, o));
    const persona = mk('0231', {
      stage: 'temp', created: ago(31), submitted: ago(30), bizType: 'pvt', manufacturing: true, salesTax: true, turnover50: true, cls: 'Corporate',
      f: { name: 'Al-Noor Home Textiles (Pvt) Ltd', address: 'Plot 14-B, Industrial Estate, Multan', ntn: '4521890-1', gst: '3277876143221', tel: '061-4500000', fax: '061-4500001', email: 'info@alnoorhome.pk', web: 'www.alnoorhome.pk', particulars: 'Manufacturing and export of cotton home textiles (bed linen, towels)', est: '2018-03-12', rep: 'Bilal Hussain', desig: 'Chief Executive Officer', cnic: '36302-1234567-1', mobile: '0300-1234567', sector: 'Textiles' },
      partners: [P('Bilal Hussain', '36302-1234567-1', '0300-1234567'), P('Tariq Hussain', '36302-7654321-3', '0301-7654321'), Object.assign(P('Sana Bilal', '36302-1122334-4', '0333-1122334'), { card: true })],
      proposer: { no: 'MCCI-C-1042', name: 'Muhammad Arif', biz: 'Al-Noor Textiles', ok: true, at: ago(27) }, seconder: { no: 'MCCI-C-1090', name: 'Ahmed Raza', biz: 'Chenab Mangoes Export', ok: true, at: ago(26) },
      photo: M.demoPhoto ? M.demoPhoto() : svgAvatar('#dfe9f5', '#c99a7a'), sign: M.demoSign ? M.demoSign() : null, stamp: M.demoStamp ? M.demoStamp('Al-Noor Home Textiles (Pvt) Ltd') : null, decl1: true, decl2: true, juris: true, addrMatch: true, nature: { sector: 'mfg', items: ['Garments & home textiles'], other: '' }, demoDocs: true,
      conf: { name: 98, address: 91, ntn: 99, gst: 96, tel: 88, email: 90, web: 84, particulars: 80, est: 95, rep: 99, desig: 86, cnic: 99, mobile: 0 },
      review: { officer: 'Ayesha Khan', at: ago(28), checks: { docs: 1, identity: 1, ntn: 1, address: 1, proposers: 1 } },
      committee: { meeting: 'MC-2026-10', item: 14, decision: 'Approved', at: ago(15) },
      memberNo: 'MCCI-C-1131', psid: 'PV-2026-0231', paidAt: ago(12), receipt: 'RC-9012',
      temp: { issued: ago(12), expires: ago(12) + 60 * DAY, ext: 0, code: 'MCCI-QR-T7K2-0231', status: 'active' },
      print: { status: 'printer', batch: 'BATCH-015', serial: 'MCCI-C-100212' },
    });
    M.docList('pvt').forEach((x) => { persona.docs[x.k] = { name: x.short + (x.k === 'photo' ? '.jpg' : ' (sample).jpg'), st: 'ok', thumb: M.demoDoc && x.k !== 'photo' ? M.demoDoc(x.k, persona) : undefined }; });
    persona.hist = M.flow.histFor(persona); persona.hist.push({ t: ago(8), s: 'Sent to security printer', by: 'Ayesha Khan', note: 'BATCH-015 · serial MCCI-C-100212' });
    s.apps.push(persona);
    const SIMPLE = [
      ['0232', 'Noor Pharmacy', 'prop', 'review', 2, { women: false }, 'Pharmacy', 'Hafiz Noor Ahmed'],
      ['0233', 'Habib Motors', 'aop', 'review', 1, {}, 'Automobile', 'Habib ur Rehman'],
      ['0234', 'Dawn Foods (Pvt) Ltd', 'pvt', 'returned', 4, {}, 'Food', 'Sohail Akhtar'],
      ['0235', 'Pearl Bakers', 'prop', 'proposer', 6, { women: true }, 'Food', 'Mehwish Ali'],
      ['0236', 'Crescent Mills Ltd', 'public', 'committee', 9, { manufacturing: true, salesTax: true, turnover50: true }, 'Textiles', 'Usman Crescent'],
      ['0237', 'Green Valley Farms', 'aop', 'payment', 13, {}, 'Agriculture', 'Shahid Iqbal'],
      ['0238', 'Metro Cash & Carry Pakistan', 'mnc', 'temp', 52, { salesTax: true, turnover50: true }, 'Retail', 'Jan Peters'],
      ['0239', 'Zain & Co.', 'prop', 'temp', 63, {}, 'Trading', 'Zain ul Abideen'],
      ['0240', 'Rashid Construction', 'aop', 'permanent', 70, {}, 'Construction', 'Rashid Mehmood'],
      ['0241', 'Indus Pharma (Pvt) Ltd', 'pvt', 'temp', 5, { manufacturing: true, salesTax: true }, 'Pharma', 'Dr. Aamir Indus'],
      ['0242', 'Multan Leather Crafts', 'prop', 'temp', 3, { women: true }, 'Leather', 'Saima Javed'],
      ['0243', 'Bahauddin Rice Mills', 'aop', 'submitted', 0, { manufacturing: true }, 'Rice', 'Bahauddin Zakariya'],
    ];
    SIMPLE.forEach((r, i) => {
      const [tok, name, biz, stage, d, ex, sector, rep] = r;
      const a = mk(tok, Object.assign({ created: ago(d + 1), submitted: ago(d, 3), bizType: biz, stage, f: { name, address: (12 + i) + ', ' + ['Bosan Road', 'Vehari Road', 'Industrial Estate', 'Nawan Shehr', 'Abdali Road', 'Mumtazabad'][i % 6] + ', Multan', ntn: (3100000 + i * 7919) + '-' + (i % 9), gst: ex.salesTax ? '32778' + (76100 + i) + '22' : '', tel: '061-45' + (10000 + i * 311), fax: '', email: name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10) + '@mail.pk', web: '', particulars: sector + ' business in Multan', est: (2005 + i) + '-0' + ((i % 8) + 1) + '-1' + (i % 9), rep, desig: biz === 'prop' ? 'Proprietor' : biz === 'aop' ? 'Managing Partner' : 'Director', cnic: '36302-' + (2000000 + i * 104729) + '-' + (i % 9), mobile: '0300-7' + String(100000 + i * 3571).slice(0, 6), sector }, partners: biz === 'prop' ? [] : [P(rep, '36302-' + (2000000 + i * 104729) + '-' + (i % 9), '0300-7' + String(100000 + i * 3571).slice(0, 6)), P('Partner ' + (i + 1), '36302-' + (3000000 + i * 7) + '-1', '0301-55' + (10000 + i))], photo: svgAvatar(['#e8eef8', '#f4ece0', '#e6f3ee'][i % 3], ['#c99a7a', '#b07d5b', '#d8ab8a'][i % 3]), conf: { name: 97, ntn: 99, address: 88, cnic: 98, mobile: 70 } }, ex));
      a.cls = M.flow.classOf(a);
      a.proposer = stage === 'submitted' || stage === 'review' || stage === 'returned' ? { no: 'MCCI-C-1015', name: 'Naveed Sufi', biz: 'Sufi Surgical Industries' } : { no: 'MCCI-C-1015', name: 'Naveed Sufi', biz: 'Sufi Surgical Industries', ok: true, at: ago(d - 1) };
      a.seconder = { no: 'MCCI-A-2090', name: 'Khalid Mehmood', biz: 'Multan Cotton Traders', ok: !['submitted', 'review', 'returned', 'proposer'].includes(stage), at: ago(d - 1) };
      M.docList(biz).forEach((x) => { a.docs[x.k] = { name: x.short + '.pdf', st: stage === 'submitted' ? 'pending' : 'ok' }; });
      if (stage === 'returned') { a.docs.bank = { name: 'Bank letter (photocopy).jpg', st: 'rejected', note: 'Original Bank Account Maintenance Certificate required — photocopy uploaded' }; a.returnNote = 'Please upload the original Bank Account Maintenance Certificate on the name of the company (the uploaded file is a photocopy).'; }
      if (['committee', 'payment', 'temp', 'permanent'].includes(stage)) a.review = { officer: 'Ayesha Khan', at: ago(d - 1), checks: { docs: 1, identity: 1, ntn: 1, address: 1, proposers: 1 } };
      if (['payment', 'temp', 'permanent'].includes(stage)) { a.committee = { meeting: 'MC-2026-10', item: 10 + i, decision: 'Approved', at: ago(d - 3) }; s.seq.mno[a.cls[0]]++; a.memberNo = 'MCCI-' + a.cls[0] + '-' + s.seq.mno[a.cls[0]]; }
      if (stage === 'committee') a.committee = { meeting: 'MC-2026-11', item: 3 };
      a.hist = M.flow.histFor(a, ago);
      s.apps.push(a);
    });
    /* fine-tune temp / print states */
    const A = (t) => s.apps.find((x) => x.token === 'MCCI-2026-M-' + t);
    const tmp = (a, issuedDaysAgo, pst, batch, serial, extra) => {
      a.paidAt = ago(issuedDaysAgo, 1); a.receipt = 'RC-' + (8900 + issuedDaysAgo); a.psid = 'PV-2026-' + a.token.slice(-4);
      a.temp = Object.assign({ issued: ago(issuedDaysAgo), expires: ago(issuedDaysAgo) + 60 * DAY, ext: 0, code: M.code(a.token + 'T'), status: 'active' }, extra || {});
      a.print = { status: pst, batch, serial };
    };
    tmp(A('0238'), 50, 'received', 'BATCH-014', 'MCCI-C-100198');
    tmp(A('0239'), 63, 'printer', 'BATCH-015', 'MCCI-A-100213', { status: 'expired' });
    tmp(A('0241'), 5, 'queued');
    tmp(A('0242'), 3, 'queued');
    const r = A('0240'); tmp(r, 70, 'converted', 'BATCH-013', 'MCCI-A-100140', { status: 'superseded' }); r.perm = { since: ago(22), validTo: M.yearEnd(now), code: M.code(r.token + 'P'), scan: 'Certificate MCCI-A-100140 (scan).jpg' }; r.delivery = { mode: 'courier', tracking: 'TCS 7741 0293', at: ago(20) };
    A('0237').psid = 'PV-2026-0237'; A('0237').psidDue = now + 4 * DAY;

    /* register members created from applications */
    s.apps.filter((a) => a.memberNo).forEach((a) => s.members.push(M.flow.memberFromApp(a)));

    /* batches & serial stock */
    s.batches = [
      { id: 'BATCH-013', from: 100129, to: 100160, items: ['MCCI-2026-M-0240'], printer: 'Pakistan Security Printing Corp.', status: 'Received', created: ago(80), sent: ago(78), received: ago(60), counted: 'Two officers — all serials matched' },
      { id: 'BATCH-014', from: 100161, to: 100200, items: ['MCCI-2026-M-0238'], printer: 'Pakistan Security Printing Corp.', status: 'Received', created: ago(45), sent: ago(44), received: ago(2), counted: 'Two officers — all serials matched' },
      { id: 'BATCH-015', from: 100201, to: 100248, items: ['MCCI-2026-M-0231', 'MCCI-2026-M-0239'], printer: 'Pakistan Security Printing Corp.', status: 'At printer', created: ago(10), sent: ago(8) },
    ];
    s.spoil = [{ serial: 'MCCI-C-100172', reason: 'Misprint — destruction record DR-0031', at: ago(58), by: 'Ayesha Khan' }];

    /* PSIDs */
    s.apps.filter((a) => a.psid).forEach((a) => s.psids.push({ psid: a.psid, ref: a.token, member: a.f.name, purpose: 'Membership fee', amount: M.flow.fee(a, s.settings).total, issued: a.committee.at || ago(14), due: a.psidDue || (a.committee.at || ago(14)) + 7 * DAY, status: a.paidAt ? 'Paid' : 'Unpaid', paidAt: a.paidAt, channel: a.paidAt ? 'Bank deposit · verified by Accounts' : '', receipt: a.receipt }));

    /* service requests (temporary members can use services) */
    const SVQ = [
      ['co', 'MCCI-2026-M-0231', 'In review', 3, { Consignee: 'Hanseatic Trading GmbH', Destination: 'Germany', 'HS code': '6302.31', 'Invoice value (USD)': '48,600' }],
      ['visa', 'MCCI-2026-M-0231', 'Issued', 120, { 'Traveller name': 'Bilal Hussain', 'Passport no.': 'AB1234567', Country: 'China', Embassy: 'Islamabad' }],
      ['ebil', 'MCCI-C-1090', 'Submitted', 1], ['guar', 'MCCI-C-1015', 'Ready to sign', 9], ['sample', 'MCCI-A-2090', 'Returned', 30], ['att', 'MCCI-C-1066', 'Issued', 200], ['co', 'MCCI-C-1042', 'In review', 14], ['other', 'MCCI-C-1101', 'Submitted', 2], ['co', 'MCCI-2026-M-0238', 'Issued', 300],
    ];
    SVQ.forEach((q, i) => {
      const own = q[1].startsWith('MCCI-2026') ? s.apps.find((a) => a.token === q[1]) : null;
      const mem = own ? s.members.find((m) => m.app === own.token) : s.members.find((m) => m.no === q[1]);
      const sub = now - q[3] * HOUR - 20 * 60000;
      const sv = M.sv(q[0]);
      const v = { token: 'MCCI-2026-' + (10482 + i), svc: q[0], memberNo: mem ? mem.no : q[1], company: mem ? mem.company : '', submitted: sub, due: sub + 24 * HOUR, status: q[2], fields: q[4] || Object.fromEntries(sv.fields.map((f, j) => [f, ['Sample value', 'AB' + (1000000 + i * 37), 'China', '12 Nov 2026'][j] || '—'])), docs: sv.docs.map((d) => ({ name: d + '.pdf', st: 'ok' })), fee: s.settings.svcFee[q[0]], paid: true, hist: [{ t: sub, s: 'Submitted', by: 'Member' }] };
      if (q[2] !== 'Submitted') v.hist.push({ t: sub + 40 * 60000, s: 'AI checked', by: 'AI engine', note: 'Fields extracted from documents' });
      if (q[2] === 'Issued') { v.done = sub + 9 * HOUR; v.docCode = M.code(v.token); v.hist.push({ t: v.done, s: 'Issued', by: 'President (Signatory)' }); }
      if (q[2] === 'Returned') v.returnNote = 'Sample values missing on list — please re-upload with USD values.';
      if (q[2] === 'In review' && i === 0) { v.ai = 'HS code 6302.31 matches "bed linen of cotton" — please confirm.'; }
      s.svcs.push(v);
    });
    s.seq.svc = 10482 + SVQ.length;

    /* QR document registry */
    const reg = (code, type, to, no, t, status, ref, validTo) => s.docs.push({ code, type, to, member: no, issued: t, status, ref, validTo, scans: Math.floor((M.hash(code).charCodeAt(0) % 40) + 3) });
    s.apps.forEach((a) => {
      if (a.temp) reg(a.temp.code, 'Temporary Membership Certificate', a.f.name, a.memberNo, a.temp.issued, a.temp.status === 'superseded' ? 'Superseded' : a.temp.status === 'expired' ? 'Expired' : 'Valid', a.token, a.temp.expires);
      if (a.perm) reg(a.perm.code, 'Membership Certificate', a.f.name, a.memberNo, a.perm.since, 'Valid', a.token, a.perm.validTo);
    });
    s.members.filter((m) => !m.app).forEach((m, i) => reg('MCCI-QR-8F3K-' + (2291 + i), 'Membership Certificate', m.company, m.no, m.since, m.status === 'Expired' ? 'Expired' : 'Valid', m.no, m.validTo));
    s.svcs.filter((v) => v.docCode).forEach((v) => reg(v.docCode, M.sv(v.svc).full.split(' — ')[0], v.company, v.memberNo, v.done, 'Valid', v.token, v.done + 180 * DAY));

    /* notifications for the persona (email + portal) */
    const pn = (d, title, text, ch = 'Email + Portal') => s.notes.push({ id: M.uid('N'), to: 'MCCI-2026-M-0231', t: ago(d), title, text, ch, read: d > 2 });
    pn(30, 'Application received', 'Assalam o Alaikum Bilal! Your MCCI membership application MCCI-2026-M-0231 is received. Token sent. Normal processing time is 15 working days.');
    pn(28, 'Documents verified', 'All 11 documents for Pvt Ltd company are verified by the Membership Desk. Your proposer and seconder have been emailed a confirmation link.');
    pn(26, 'Proposer & seconder confirmed', 'Muhammad Arif (MCCI-C-1042) and Ahmed Raza (MCCI-C-1090) confirmed your application. File placed before the Membership Committee.');
    pn(15, 'Approved — please pay fee', 'Congratulations! Your membership is approved (Corporate). Membership No. MCCI-C-1131. Pay PKR 18,500 at the bank with payment voucher PV-2026-0231 and upload the paid receipt in the portal.');
    pn(12, 'Payment verified — temporary membership issued', 'Your bank receipt is verified by MCCI Accounts ✓ Receipt RC-9012. Your TEMPORARY MEMBERSHIP is now active for 60 days. Download your temporary certificate from the portal. All MCCI services are open for you.');
    pn(8, 'Certificate sent for printing', 'Your permanent certificate (serial MCCI-C-100212) is with the security printer in batch BATCH-015. Your temporary membership stays valid meanwhile.');

    /* audit trail */
    const au = (d, user, action, obj, detail) => s.audit.push({ t: ago(0, d), user, action, obj, detail, ip: user === 'System' || user === 'AI engine' ? 'system' : '10.0.2.' + (10 + (d % 20)), result: 'Success' });
    au(0.2, 'Ayesha Khan', 'Viewed', 'MCCI-2026-M-0232', 'Opened application review'); au(0.6, 'AI engine', 'Read documents', 'MCCI-2026-M-0243', '7 documents, 22 fields extracted'); au(1.4, 'Usman Tariq', 'Started review', 'MCCI-2026-10488', 'Certificate of Origin'); au(2.5, 'System', 'Temporary membership alert', 'MCCI-2026-M-0238', '8 days left — printed certificate received, awaiting scan upload'); au(3.1, 'Hina Siddiqui', 'Verified payment', 'PV-2026-0241', 'Bank receipt checked against statement'); au(5, 'Kamran Raza', 'Signed', 'MCCI-2026-10485', 'Visa Guarantee Letter'); au(26, 'Ayesha Khan', 'Received batch', 'BATCH-014', '40 certificates counted by two officers');

    /* tickets, events, meetings, CMS, templates */
    s.tickets = [
      { id: 'CD-0418', from: 'Al-Noor Home Textiles (Pvt) Ltd', memberNo: 'MCCI-C-1131', cat: 'Question', subject: 'When will my printed certificate arrive?', details: 'Temporary membership is active. Want to know the printing date.', t: ago(1), owner: 'Ayesha Khan', status: 'Open', replies: [{ by: 'Ayesha Khan', t: ago(0, 20), text: 'Your certificate is in BATCH-015 at the printer. Expected at MCCI within 7 days; your temporary membership remains valid till then.' }] },
      { id: 'CD-0417', from: 'Sufi Surgical Industries', memberNo: 'MCCI-C-1015', cat: 'Document issue', subject: 'Guarantee letter spelling', details: 'Company name spelling on draft', t: ago(2), owner: 'Usman Tariq', status: 'Pending', replies: [] },
      { id: 'CD-0416', from: 'Multan Cotton Traders', memberNo: 'MCCI-A-2090', cat: 'Service delay', subject: 'Samples letter returned', details: 'Need clarity on sample values', t: ago(3), owner: 'Usman Tariq', status: 'Resolved', replies: [] },
    ];
    s.events = [
      { id: 'EV-31', title: 'Export Readiness Workshop — Certificate of Origin', date: now + 5 * DAY, type: 'Workshop', venue: 'MCCI Hall', seats: 80, regs: ['MCCI-C-1042', 'MCCI-C-1090'], status: 'Open' },
      { id: 'EV-32', title: 'Women Entrepreneurs Networking Evening', date: now + 12 * DAY, type: 'Networking', venue: 'MCCI Hall', seats: 60, regs: ['MCCI-A-2140'], status: 'Open' },
      { id: 'EV-33', title: 'China Trade Delegation Meet', date: now + 19 * DAY, type: 'B2B Meeting', venue: 'Multan Expo Centre', seats: 40, regs: [], status: 'Open' },
      { id: 'EV-34', title: 'Mango & Agro Export Forum', date: now + 26 * DAY, type: 'Forum', venue: 'Online + MCCI Hall', seats: 120, regs: [], status: 'Draft' },
    ];
    s.meetings = [
      { id: 'MC-2026-11', name: 'Membership Committee #11', committee: 'Membership Committee', date: now + 3 * DAY, agenda: 'New membership applications', actions: 0, status: 'Pending' },
      { id: 'MC-2026-10', name: 'Membership Committee #10', committee: 'Membership Committee', date: ago(15), agenda: '9 applications approved', actions: 2, status: 'Approved' },
      { id: 'EC-2026-11', name: 'Executive Committee #11', committee: 'Executive Committee', date: ago(9), agenda: 'Digital platform progress', actions: 4, status: 'Approved' },
      { id: 'GB-2026', name: 'General Body Meeting', committee: 'General Body', date: now + 34 * DAY, agenda: 'Annual items', actions: 0, status: 'Draft' },
    ];
    s.posts = [
      { id: 'PO-64', title: 'Chamber goes digital: services move online', type: 'News', author: 'Secretariat', t: ago(5), status: 'Live', body: 'MCCI is moving membership, letters and attestations to one digital platform.' },
      { id: 'PO-65', title: 'Temporary membership from day one', type: 'News', author: 'Membership Desk', t: ago(3), status: 'Live', body: 'New members receive a 60-day temporary membership as soon as the fee is paid, while the secure certificate is printed.' },
      { id: 'PO-66', title: 'Export Readiness Workshop announced', type: 'Event', author: 'Events Desk', t: ago(2), status: 'Live', body: 'Hands-on session on documents, origin certificates and buyers.' },
      { id: 'PO-67', title: 'Trade Brief — Week 42', type: 'AI brief', author: 'Research', t: ago(0, 4), status: 'Draft', body: 'Cotton yarn demand rising in EU; mango buyer inquiries.' },
    ];
    s.templates = [
      ['Application received', 'membership_received'], ['Returned for correction', 'membership_returned'], ['Proposer / seconder request', 'proposer_confirm_link'], ['Approved + payment voucher', 'membership_approved_voucher'], ['Payment receipt verified', 'payment_verified'],
      ['Temporary membership issued', 'temp_membership_issued'], ['Temporary membership: 15 days left', 'temp_expiry_15'], ['Temporary membership: 7 days left', 'temp_expiry_7'], ['Temporary membership extended', 'temp_extended'],
      ['Converted to permanent', 'membership_permanent'], ['Certificate dispatched / ready to collect', 'certificate_dispatched'], ['Renewal window open (1 March)', 'renewal_open'], ['Service request issued', 'service_issued'],
    ].map((x, i) => ({ id: 'TP-' + (i + 1), event: x[0], key: x[1], ch: 'Email, Portal', sent: 40 + ((i * 53) % 400), delivery: 96 + (i % 4), status: i === 10 ? 'Draft' : 'Live' }));
    s.inquiries = [];
    s.imports = [{ id: 'IM-03', file: 'MCCI_members_legacy_2025.xlsx', rows: 1280, matched: 1262, dup: 11, err: 7, t: ago(40), status: 'Imported' }];
    s.changes = [{ id: 'CR-12', memberNo: 'MCCI-C-1066', company: 'Hamdard Agro Foods', field: 'Business address', from: 'Vehari Road, Multan', to: 'Plot 3, Food Park, Multan', t: ago(1), status: 'Pending', by: 'Faisal Hamdard' }];

    if (preset) M.flow.applyPreset(s, preset);
    return s;
  }
  M.seed = seed;

  /* ---------- persistence + live sync between tabs ---------- */
  M.load = () => {
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.ver === 8) { M.db = d; return; } } } catch (e) { /* storage unavailable */ }
    M.db = seed(); M.persist();
  };
  M.persist = () => { try { localStorage.setItem(KEY, JSON.stringify(M.db)); } catch (e) { /* quota / private mode: keep in memory */ } };
  let bc = null; try { bc = new BroadcastChannel('mcci.v10'); } catch (e) { bc = null; }
  M.save = (why) => { M.db.rev = (M.db.rev || 0) + 1; M.persist(); if (bc) bc.postMessage({ rev: M.db.rev, why }); if (M.refresh) M.refresh(); };
  const onRemote = (why) => { M.load(); if (M.refresh) M.refresh(true); if (M.toast && why) M.toast('Live update: ' + why, 'live'); };
  if (bc) bc.onmessage = (e) => onRemote(e.data && e.data.why);
  addEventListener('storage', (e) => { if (e.key === KEY && !bc) onRemote('data changed in another tab'); });
  M.saveQuiet = () => { M.db.rev = (M.db.rev || 0) + 1; M.persist(); if (bc) bc.postMessage({ rev: M.db.rev }); };
  M.reset = (preset) => { M.db = seed(preset); M.save('Demo data reset'); };

  /* UI state (active tabs, wizard step, filters) — per page, survives refresh */
  M.ui = (() => { try { return JSON.parse(sessionStorage.getItem(UIKEY)) || {}; } catch (e) { return {}; } })();
  M.ui.tabs = M.ui.tabs || {}; M.ui.tbl = M.ui.tbl || {};
  M.saveUI = () => { try { sessionStorage.setItem(UIKEY, JSON.stringify(M.ui)); } catch (e) { /* ignore */ } };

  /* ---------- audit + notifications ---------- */
  M.myUsers = () => M.db.me.users || [];
  M.actor = () => (M.ROLE === 'admin' ? ((M.db.staff.find((x) => x.id === M.db.staffId) || {}).name || 'Staff') : M.ROLE === 'member' ? ((M.myUsers() || [])[M.db.me.actAs || 0] || M.db.me).name : 'Public visitor');
  M.log = (action, obj, detail) => { M.db.audit.unshift({ t: Date.now(), user: M.actor(), action, obj, detail: detail || '', ip: '10.0.2.' + (M.ROLE === 'admin' ? 14 : 77), result: 'Success' }); if (M.db.audit.length > 400) M.db.audit.length = 400; };
  M.notify = (to, title, text, ch = 'Email + Portal') => { M.db.notes.unshift({ id: M.uid('N'), to, t: Date.now(), title, text, ch, read: false }); };

  /* ---------- business rules (become server-side services in production) ---------- */
  const F = (M.flow = {});
  /* Corporate vs Associate — rule printed on the form */
  F.classOf = (a) => (['pvt', 'public', 'mnc'].includes(a.bizType) || (a.manufacturing && a.salesTax) || (a.salesTax && a.turnover50) ? 'Corporate' : 'Associate');
  F.classWhy = (a) => {
    if (['pvt', 'public', 'mnc'].includes(a.bizType)) return 'A body corporate / multinational is a Corporate Member.';
    if (a.manufacturing && a.salesTax) return 'A sales-tax-registered manufacturing concern is a Corporate Member.';
    if (a.salesTax && a.turnover50) return 'A sales-tax-registered business with turnover of Rs. 50 million or more is a Corporate Member.';
    return 'Not a body corporate, not a sales-tax-registered manufacturer and turnover below Rs. 50 million, so Associate Member.';
  };
  F.fee = (a, st = M.db.settings) => {
    const sch = a.women ? st.fees.Women : st.fees[a.cls || F.classOf(a)];
    const extra = (a.partners || []).filter((p) => p.card).length;
    const o = { admission: a.kind === 'renewal' ? 0 : sch.admission, subscription: sch.subscription, card: a.kind === 'renewal' ? 0 : sch.card, extraCards: extra, extra: extra * st.fees.extraCard };
    o.total = o.admission + o.subscription + o.card + o.extra; return o;
  };
  F.app = (tok) => M.db.apps.find((a) => a.token === tok);
  F.mine = () => F.app(M.db.me.app);
  F.member = (no) => M.db.members.find((m) => m.no === no);
  F.memberFromApp = (a) => ({ no: a.memberNo, company: a.f.name, cls: a.cls, women: a.women, sector: a.f.sector || '—', rep: a.f.rep, biz: a.bizType, city: 'Multan', status: a.perm ? 'Permanent' : a.temp ? (a.temp.status === 'expired' ? 'Temporary expired' : 'Temporary') : 'Approved', since: a.perm ? a.perm.since : a.temp ? a.temp.issued : a.committee.at, validTo: a.perm ? a.perm.validTo : a.temp ? a.temp.expires : null, tempExpires: a.temp ? a.temp.expires : null, serial: a.print && a.print.serial, mobile: a.f.mobile, email: a.f.email, app: a.token });
  F.syncMember = (a) => { const m = F.member(a.memberNo); const n = F.memberFromApp(a); if (m) Object.assign(m, n); else M.db.members.push(n); };
  /* is a member allowed to use services? temporary (not expired) or permanent */
  F.canUseServices = (a) => !!a && ((a.stage === 'temp' && a.temp && a.temp.status === 'active' && M.db.settings.tempServices) || a.stage === 'permanent');
  F.histFor = (a, ago) => {
    const h = []; const sub = a.submitted || Date.now();
    const push = (dt, s, by, note) => h.push({ t: dt, s, by, note });
    push(sub, 'Submitted', 'Applicant', 'Form + documents submitted online');
    push(sub + 6e4, 'AI document check', 'AI engine', 'Fields extracted and cross-checked');
    const order = ['review', 'returned', 'proposer', 'committee', 'payment', 'temp', 'permanent'];
    const at = order.indexOf(a.stage);
    if (a.stage === 'returned') push(sub + 5 * HOUR, 'Returned for correction', 'Membership Desk', a.returnNote || 'Correction required');
    if (at >= 2) push(sub + 20 * HOUR, 'Documents verified', 'Ayesha Khan', 'Checklist complete');
    if (at >= 3) push(sub + 2 * DAY, 'Proposer & seconder confirmed', 'Members', 'Confirmed by email link / member portal');
    if (at >= 4) push(sub + 5 * DAY, 'Approved by Membership Committee', 'Committee', 'Payment voucher issued');
    if (at >= 5) push(sub + 6 * DAY, 'Fee paid · Temporary membership issued (60 days)', 'System', 'Receipt and temporary certificate sent');
    if (at >= 6) push(sub + 40 * DAY, 'Converted to permanent', 'Ayesha Khan', 'Printed certificate received and uploaded');
    return h;
  };
  F.hist = (a, s, note, by) => { a.hist.push({ t: Date.now(), s, by: by || M.actor(), note: note || '' }); };

  /* demo presets — move the persona's application to any stage for presentations */
  F.applyPreset = (s, p) => {
    const a = s.apps.find((x) => x.token === s.me.app); const now = Date.now();
    const clear = () => { a.temp = null; a.perm = null; a.paidAt = null; a.receipt = null; a.memberNo = null; a.psid = null; a.print = { status: 'none' }; a.committee = {}; s.members = s.members.filter((m) => m.app !== a.token); s.docs = s.docs.filter((d) => d.ref !== a.token); s.psids = s.psids.filter((x) => x.ref !== a.token); s.svcs = s.svcs.filter((v) => v.memberNo !== 'MCCI-C-1131'); s.batches.forEach((b) => { b.items = b.items.filter((t) => t !== a.token); }); };
    if (p === 'new') {
      clear(); Object.assign(a, { decl1: false, decl2: false, juris: null, addrMatch: false, nature: null, demoDocs: false, delivery: null, aiAt: null, src: {}, stage: 'draft', cls: null, memberNo: null, bizType: null, f: { rep: s.me.name, mobile: s.me.mobile }, partners: [], docs: {}, photo: null, sign: null, stamp: null, proposer: {}, seconder: {}, conf: {}, hist: [], review: {}, step: 0, submitted: null, manufacturing: false, salesTax: false, turnover50: false, women: false, juris: null, addrMatch: false, nature: { sector: '', items: [], other: '' } });
      s.notes = s.notes.filter((n) => n.to !== a.token); return;
    }
    const order = ['submitted', 'review', 'returned', 'proposer', 'committee', 'payment', 'temp', 'temp-expiring', 'temp-expired', 'permanent'];
    if (!order.includes(p)) return;
    clear(); a.sign = a.sign || null; a.stamp = a.stamp || null;
    a.submitted = now - 2 * HOUR; a.proposer.ok = false; a.seconder.ok = false;
    const stage = p.startsWith('temp') ? 'temp' : p; a.stage = stage; a.cls = a.cls || 'Corporate';
    if (['proposer', 'committee', 'payment', 'temp', 'permanent'].includes(stage)) { a.submitted = now - 6 * DAY; a.review = { officer: 'Ayesha Khan', at: now - 5 * DAY, checks: { docs: 1, identity: 1, ntn: 1, address: 1, proposers: 1 } }; }
    if (['committee', 'payment', 'temp', 'permanent'].includes(stage)) { a.proposer.ok = true; a.seconder.ok = true; a.proposer.at = a.seconder.at = now - 4 * DAY; a.committee = { meeting: 'MC-2026-11', item: 14 }; }
    if (stage === 'returned') { a.returnNote = 'Please upload a clearer copy of the Board Resolution (page 2 is cut off).'; a.docs.board = { name: 'Board resolution.jpg', st: 'rejected', note: 'Page 2 is cut off' }; }
    if (['payment', 'temp', 'permanent'].includes(stage)) {
      a.committee = { meeting: 'MC-2026-10', item: 14, decision: 'Approved', at: now - 2 * DAY }; a.memberNo = 'MCCI-C-1131'; a.psid = 'PV-2026-0231'; a.psidDue = now + 5 * DAY;
      s.psids.push({ psid: a.psid, ref: a.token, member: a.f.name, purpose: 'Membership fee', amount: F.fee(a, s.settings).total, issued: now - 2 * DAY, due: a.psidDue, status: 'Unpaid', paidAt: null, channel: '' });
    }
    if (stage === 'temp' || stage === 'permanent') {
      const age = p === 'temp-expiring' ? 54 : p === 'temp-expired' ? 61 : p === 'permanent' ? 50 : 12;
      a.submitted = now - (age + 8) * DAY; a.paidAt = now - age * DAY; a.receipt = 'RC-9012';
      const ps = s.psids.find((x) => x.ref === a.token); ps.status = 'Paid'; ps.paidAt = a.paidAt; ps.channel = 'Bank deposit · verified by Accounts'; ps.receipt = 'RC-9012'; ps.issued = a.paidAt - DAY;
      a.temp = { issued: a.paidAt, expires: a.paidAt + s.settings.tempDays * DAY, ext: 0, code: 'MCCI-QR-T7K2-0231', status: p === 'temp-expired' ? 'expired' : 'active' };
      a.print = { status: p === 'temp' ? 'printer' : 'printer', batch: 'BATCH-015', serial: 'MCCI-C-100212' };
      const b = s.batches.find((x) => x.id === 'BATCH-015'); if (b && !b.items.includes(a.token)) b.items.unshift(a.token);
      s.docs.push({ code: a.temp.code, type: 'Temporary Membership Certificate', to: a.f.name, member: a.memberNo, issued: a.temp.issued, status: a.temp.status === 'expired' ? 'Expired' : 'Valid', ref: a.token, validTo: a.temp.expires, scans: 4 });
    }
    if (stage === 'permanent') {
      a.temp.status = 'superseded'; a.print.status = 'converted'; a.perm = { since: now - 6 * DAY, validTo: M.yearEnd(now), code: M.code(a.token + 'P'), scan: 'Certificate MCCI-C-100212 (scan).jpg' };
      s.docs.find((d) => d.code === a.temp.code).status = 'Superseded';
      s.docs.push({ code: a.perm.code, type: 'Membership Certificate', to: a.f.name, member: a.memberNo, issued: a.perm.since, status: 'Valid', ref: a.token, validTo: a.perm.validTo, scans: 1 });
    }
    a.hist = F.histFor(a);
    if (a.memberNo) s.members.push(F.memberFromApp(a));
  };

  /* expire temporary memberships whose 60 days have passed (runs on every load; a scheduled job in production) */
  F.sweep = () => {
    let ch = false;
    M.db.apps.forEach((a) => {
      if (a.stage === 'temp' && a.temp && a.temp.status === 'active' && a.temp.expires < Date.now()) {
        a.temp.status = 'expired'; F.hist(a, 'Temporary membership expired', 'Printed certificate not yet received — services paused until extended or converted', 'System');
        const d = M.db.docs.find((x) => x.code === a.temp.code); if (d) d.status = 'Expired';
        F.syncMember(a); M.notify(a.token, 'Temporary membership expired', 'Your temporary membership has passed 60 days. MCCI is completing your printed certificate; please contact the Membership Desk.'); ch = true;
      }
    });
    if (ch) M.persist();
  };

  M.load(); F.sweep();
})();
