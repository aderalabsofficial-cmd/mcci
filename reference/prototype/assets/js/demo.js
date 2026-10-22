/* demo.js — presentation demo materials: a sample male owner passport photo, specimen documents for every
   checklist item (all watermarked SAMPLE · DEMO DOCUMENT), demo data that fills every field of the official form. */
(function () {
  'use strict';
  const M = window.M, F = M.flow, D = document, { esc, $ } = M;
  const S = () => M.db.settings;

  /* ---------------- demo company data (consistent across every document) ---------------- */
  M.DEMO = (a) => {
    const t = (a && a.bizType) || 'pvt';
    const name = { prop: 'Al-Noor Home Textiles', aop: 'Al-Noor Home Textiles & Co.', pvt: 'Al-Noor Home Textiles (Pvt) Ltd', public: 'Al-Noor Home Textiles Limited', mnc: 'Al-Noor Home Textiles Pakistan (Pvt) Ltd' }[t];
    const desig = { prop: 'Proprietor', aop: 'Managing Partner', pvt: 'Chief Executive Officer', public: 'Chief Executive Officer', mnc: 'Country Manager' }[t];
    const P = [{ name: 'Bilal Hussain', cnic: '36302-1234567-1', mobile: '0300-1234567', father: 'Tariq Hussain', dob: '14.06.1984' }, { name: 'Tariq Hussain', cnic: '36302-7654321-3', mobile: '0301-7654321', father: 'Abdul Hameed', dob: '02.01.1958' }, { name: 'Sana Bilal', cnic: '36302-1122334-4', mobile: '0333-1122334', father: 'Muhammad Aslam', dob: '21.09.1988' }];
    return { t, name, desig, address: 'Plot 14-B, Industrial Estate, Multan', ntn: '4521890-1', gst: '3277876143221', tel: '061-4500000', fax: '061-4500001', email: 'info@alnoorhome.pk', web: 'www.alnoorhome.pk', est: '2018-03-12', estTxt: '12-03-2018', rep: P[0].name, cnic: P[0].cnic, mobile: P[0].mobile, partners: t === 'prop' ? [] : t === 'aop' ? P.slice(0, 2) : P, people: P, inc: '0091245', account: '0123-4567890-01', iban: 'PK00 DEMO 0123 4567 8900 1000', particulars: 'Manufacturing and export of cotton home textiles (bed linen, towels)' };
  };

  /* ---------------- sample passport photo (illustrated male owner) ---------------- */
  const portrait = (x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><defs><linearGradient id="pk" x1="0" x2="1"><stop offset="0" stop-color="#b47a55"/><stop offset=".5" stop-color="#d49d75"/><stop offset="1" stop-color="#ae7450"/></linearGradient><linearGradient id="ps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3854"/><stop offset="1" stop-color="#141a29"/></linearGradient></defs>
<path d="M180 1000 C190 835 300 765 420 738 L580 738 C700 765 810 835 820 1000Z" fill="url(#ps)"/><path d="M432 736 L500 862 L568 736 L553 728 L500 802 L447 728Z" fill="#f5f7fa"/><path d="M489 792 L511 792 L521 818 L510 965 L500 980 L490 965 L479 818Z" fill="#7b1f2c"/><path d="M490 792 L510 792 L514 806 L486 806Z" fill="#5e1621"/>
<path d="M422 738 L500 884 L455 1000 L355 1000 L378 806Z" fill="#222b43"/><path d="M578 738 L500 884 L545 1000 L645 1000 L622 806Z" fill="#222b43"/>
<path d="M442 598 L442 718 Q500 772 558 718 L558 598Z" fill="#a96f4b"/><path d="M442 640 Q500 690 558 640 L558 600 L442 600Z" fill="#8f5a3a" opacity=".45"/>
<ellipse cx="357" cy="458" rx="27" ry="50" fill="#bf855d"/><ellipse cx="643" cy="458" rx="27" ry="50" fill="#bf855d"/>
<path d="M500 232 C622 232 652 332 650 442 C648 562 592 662 500 670 C408 662 352 562 350 442 C348 332 378 232 500 232Z" fill="url(#pk)"/>
<path d="M370 492 C378 600 430 668 500 671 C570 668 622 600 630 492 C612 556 572 606 500 610 C428 606 388 556 370 492Z" fill="#2a1c15" opacity=".6"/>
<path d="M350 425 C336 300 398 200 506 200 C614 200 668 288 652 425 C642 350 612 300 562 291 C520 283 470 302 420 293 C384 300 361 352 350 425Z" fill="#17110e"/><path d="M420 293 C460 270 520 262 562 291" stroke="#2c211b" stroke-width="6" fill="none"/>
<path d="M403 396 Q440 376 477 391" stroke="#17110e" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M523 391 Q560 376 597 396" stroke="#17110e" stroke-width="13" fill="none" stroke-linecap="round"/>
<ellipse cx="440" cy="430" rx="23" ry="11" fill="#fbfbf8"/><circle cx="441" cy="430" r="9.5" fill="#3a2517"/><circle cx="444" cy="427" r="3" fill="#fff"/><ellipse cx="560" cy="430" rx="23" ry="11" fill="#fbfbf8"/><circle cx="559" cy="430" r="9.5" fill="#3a2517"/><circle cx="562" cy="427" r="3" fill="#fff"/>
<path d="M418 446 Q440 454 462 446" stroke="#9c6544" stroke-width="3" fill="none" opacity=".6"/><path d="M538 446 Q560 454 582 446" stroke="#9c6544" stroke-width="3" fill="none" opacity=".6"/>
<path d="M502 436 L489 512 Q501 526 515 514" stroke="#8a5536" stroke-width="5.5" fill="none" stroke-linecap="round"/><ellipse cx="478" cy="512" rx="10" ry="6" fill="#8a5536" opacity=".35"/><ellipse cx="524" cy="512" rx="10" ry="6" fill="#8a5536" opacity=".35"/>
<path d="M443 550 Q472 532 500 541 Q528 532 557 550 Q530 562 500 556 Q470 562 443 550Z" fill="#17110e"/><path d="M466 578 Q500 591 534 578" stroke="#7a3d2a" stroke-width="6.5" fill="none" stroke-linecap="round"/></g>`;
  M.demoPhoto = () => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000"><defs><radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#f1f6fb"/><stop offset="1" stop-color="#c7d7e8"/></radialGradient></defs><rect width="1000" height="1000" fill="url(#bg)"/>${portrait()}</svg>`);

  /* auto-crop to 35 × 45 mm without the dialog (used by "sample documents") */
  M.autoCrop = (src, cb) => { const img = new Image(); img.onload = () => { const W = 350, H = 450, c = D.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); const s = Math.max(W / img.width, H / img.height) * 1.12; const w = img.width * s, h = img.height * s; x.drawImage(img, (W - w) / 2, (H - h) * 0.32, w, h); cb(c.toDataURL('image/jpeg', 0.9)); }; img.onerror = () => cb(src); img.src = src; };

  /* ---------------- specimen documents ---------------- */
  const wrap = (txt, n) => { const out = []; let line = ''; String(txt).split(' ').forEach((w) => { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; }); if (line.trim()) out.push(line.trim()); return out; };
  const svgURL = (w, h, body) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Arial, Helvetica, sans-serif">${body}<g opacity=".13" transform="rotate(-28 ${w / 2} ${h / 2})"><text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-size="${Math.round(w / 11)}" font-weight="700" fill="#b91c1c">SAMPLE · DEMO DOCUMENT</text></g></svg>`);
  const page = (o) => {
    let y = 210; const rows = (o.rows || []).map((r) => { const ls = wrap(r[1], 46); const t = `<text x="70" y="${y}" font-size="17" fill="#555">${esc(r[0])}</text>${ls.map((l, i) => `<text x="300" y="${y + i * 24}" font-size="18" font-weight="700" fill="#111">${esc(l)}</text>`).join('')}<line x1="70" x2="730" y1="${y + ls.length * 24 - 8}" y2="${y + ls.length * 24 - 8}" stroke="#e3e3e3"/>`; y += ls.length * 24 + 22; return t; }).join('');
    const para = (o.para || []).map((p) => { const ls = wrap(p, 66); const t = ls.map((l, i) => `<text x="70" y="${y + 20 + i * 26}" font-size="17" fill="#222">${esc(l)}</text>`).join(''); y += ls.length * 26 + 18; return t; }).join('');
    return svgURL(800, 1040, `<rect width="800" height="1040" fill="#fffef9"/><rect x="24" y="24" width="752" height="992" fill="none" stroke="${o.c || '#1b4f9c'}" stroke-width="3"/><rect x="24" y="24" width="752" height="120" fill="${o.c || '#1b4f9c'}"/><text x="400" y="74" text-anchor="middle" font-size="18" fill="#fff" opacity=".9">${esc(o.issuer)}</text><text x="400" y="114" text-anchor="middle" font-size="27" font-weight="700" fill="#fff">${esc(o.title)}</text><text x="70" y="178" font-size="15" fill="#666">${esc(o.ref || '')}</text>${rows}${para}<text x="520" y="930" font-size="15" fill="#555">${esc(o.sig || 'Authorised signatory')}</text><path d="M520 900 C560 870 580 905 610 885 S660 890 700 878" stroke="#1d3fa8" stroke-width="2.5" fill="none"/><circle cx="160" cy="900" r="58" fill="none" stroke="${o.c || '#1b4f9c'}" stroke-width="3" opacity=".5"/><text x="160" y="906" text-anchor="middle" font-size="14" font-weight="700" fill="${o.c || '#1b4f9c'}" opacity=".6">SEAL</text><text x="400" y="985" text-anchor="middle" font-size="13" fill="#888">Specimen created for the MCCI digital platform demo — not a real document</text>`);
  };
  const cnic = (p, i) => svgURL(860, 540, `<rect width="860" height="540" rx="26" fill="#eaf4ec"/><rect x="0" y="0" width="860" height="86" rx="26" fill="#1f7a4a"/><rect x="0" y="60" width="860" height="26" fill="#1f7a4a"/><text x="40" y="56" font-size="26" font-weight="700" fill="#fff">IDENTITY CARD · copy (specimen)</text><text x="820" y="56" text-anchor="end" font-size="18" fill="#d8f2e2">${i ? 'Director / partner ' + (i + 1) : 'Authorized representative'}</text><rect x="40" y="120" width="210" height="270" rx="8" fill="#d9e6f2"/><svg x="40" y="120" width="210" height="270" viewBox="230 150 540 700" preserveAspectRatio="xMidYMid slice">${portrait()}</svg>${[['Name', p.name], ['Father Name', p.father], ['Gender', i === 2 ? 'F' : 'M'], ['Country of Stay', 'Pakistan'], ['Identity Number', p.cnic], ['Date of Birth', p.dob], ['Date of Expiry', '02.03.2031']].map((r, j) => `<text x="290" y="${140 + j * 50}" font-size="16" fill="#3b6b4f">${r[0]}</text><text x="290" y="${163 + j * 50}" font-size="21" font-weight="700" fill="#10261a">${esc(r[1])}</text>`).join('')}<text x="40" y="500" font-size="14" fill="#6b8b77">Specimen for demo — not a real identity card</text>`);
  M.demoDoc = (k, a) => {
    const d = M.DEMO(a), nm = d.name;
    switch (k) {
      case 'cnic': return cnic(d.people[0], 0);
      case 'ntn': return page({ issuer: 'Tax authority (FBR) · specimen layout', title: 'National Tax Number Certificate', ref: 'Registration No. ' + d.ntn, c: '#14532d', rows: [['NTN', d.ntn], ['Name', nm], ['Business address', d.address], ['Registration date', d.estTxt], ['Tax office', 'RTO Multan'], ['Principal activity', 'Manufacture of textiles'], ['Status', 'Active']] });
      case 'itr': return page({ issuer: 'Tax authority (FBR) · specimen layout', title: 'Income Tax Return — Acknowledgement', ref: 'Tax Year 2026', c: '#14532d', rows: [['NTN', d.ntn], ['Name', nm], ['Tax year', '2026'], ['Filed on', '28-09-2026'], ['Return status', 'Filed / accepted']] });
      case 'st': return page({ issuer: 'Tax authority (FBR) · specimen layout', title: 'Sales Tax Registration Certificate', ref: 'STRN ' + d.gst, c: '#14532d', rows: [['STRN', d.gst], ['Name', nm], ['Address', d.address], ['Business type', 'Manufacturer'], ['Registered since', '01-07-2018']] });
      case 'addr': return page({ issuer: 'Stamp paper · Rs. 1,200', title: 'Lease Deed (business premises)', ref: 'Executed at Multan on 01-01-2024', c: '#7c2d12', rows: [['Lessor', 'Mian Shahid Iqbal'], ['Lessee', nm], ['Premises', d.address], ['Period', '01-01-2024 to 31-12-2028'], ['Monthly rent', 'PKR 350,000']], para: ['The lessor hereby lets the above premises to the lessee for running its business, on the terms and conditions set out in this deed.'], sig: 'Lessor / Lessee / Witnesses' });
      case 'bank': return page({ issuer: 'Demo Bank Limited · Industrial Estate Branch, Multan', title: 'Account Maintenance Certificate', ref: 'Ref: DBL/MLN/2026/4471 · 15-10-2026', c: '#0f3d6e', rows: [['Account title', nm], ['Account number', d.account], ['IBAN', d.iban], ['Account type', 'Current account'], ['Maintained since', 'April 2018']], para: ['This is to certify that the above account is being maintained with us and its conduct has been satisfactory. This certificate is issued on the request of the account holder without any risk or responsibility on the part of the bank.'], sig: 'Branch Manager' });
      case 'moa': return page({ issuer: 'Company registry (SECP) · certified copy, specimen', title: 'Memorandum & Articles of Association', ref: 'Certified true copy', c: '#3f3f8f', rows: [['Company', nm], ['Registered office', d.address], ['Objects', 'Manufacture, export and sale of textile products'], ['Authorised capital', 'PKR 50,000,000'], ['Subscribers', d.people.map((p) => p.name).join(', ')]], sig: 'Company Secretary' });
      case 'inc': return page({ issuer: 'Company registry (SECP) · specimen layout', title: 'Certificate of Incorporation', ref: 'Corporate Unique Identification No. ' + d.inc, c: '#3f3f8f', para: ['I hereby certify that ' + nm + ' is this day incorporated under the Companies Act, 2017 and that the company is limited by shares.', 'Given under my hand at Multan this twelfth day of March, two thousand and eighteen.'], sig: 'Registrar of Companies' });
      case 'board': return page({ issuer: nm + ' · ' + d.address, title: 'Board Resolution', ref: 'Meeting of the Board of Directors · 05-10-2026', c: '#7a5410', para: ['RESOLVED that Mr. ' + d.rep + ', ' + d.desig + ', CNIC ' + d.cnic + ', is hereby nominated as the authorized representative of the company in the Multan Chamber of Commerce & Industry.', 'FURTHER RESOLVED that all correspondence with the Chamber shall be signed by the authorized representative.'], sig: 'Directors' });
      case 'forma': return page({ issuer: 'Company registry (SECP) · certified copy, specimen', title: 'Form A & Form 9 — Directors', ref: 'Annual return 2026', c: '#3f3f8f', rows: d.people.map((p, i) => [['Director ' + (i + 1)], p.name + ' · CNIC ' + p.cnic]).map((r) => [r[0][0], r[1]]), sig: 'Company Secretary' });
      case 'deed': return page({ issuer: 'Registrar of Firms, Multan · specimen', title: 'Partnership Deed (registered)', ref: 'Registration No. RF-MLN-2018-0412', c: '#7c2d12', rows: [['Firm', nm], ['Partners', d.partners.map((p) => p.name).join(', ')], ['Business', 'Manufacture and sale of textiles'], ['Address', d.address], ['Commencement', d.estTxt]], sig: 'Partners / Registrar' });
      case 'formc': return page({ issuer: 'Registrar of Firms, Multan · specimen', title: 'Form "C" — Registration of Firm', ref: 'Registration No. RF-MLN-2018-0412', c: '#7c2d12', rows: [['Firm', nm], ['Partners', d.partners.map((p) => p.name).join(', ')], ['Registered on', d.estTxt]], sig: 'Registrar of Firms' });
      case 'auth': return page({ issuer: nm + ' · ' + d.address, title: 'Authority Letter', ref: 'Date: 05-10-2026', c: '#7a5410', para: ['We, all partners of ' + nm + ', hereby nominate Mr. ' + d.rep + ' (CNIC ' + d.cnic + ') as our authorized representative in the Multan Chamber of Commerce & Industry. All correspondence shall be addressed by his signature.'], sig: 'All partners' });
      default: return page({ issuer: nm, title: (M.DOCSHORT[k] || k), rows: [['Company', nm]] });
    }
  };

  /* ---------------- demo actions ---------------- */
  const A0 = () => F.mine();
  M.act('wiz.sample', { label: 'Use sample documents', phase: 'Demo', live: 'Not part of the built system', run() {
    const a = A0(); if (!a.bizType) { a.bizType = 'pvt'; a.cls = F.classOf(a); }
    M.docList(a.bizType).forEach((d) => { if (d.k !== 'photo' && (!a.docs[d.k] || a.docs[d.k].st !== 'ok')) a.docs[d.k] = { name: d.short + ' (sample).jpg', st: 'uploaded', thumb: M.demoDoc(d.k, a) }; });
    a.demoDocs = true;
    if (a.photo) { M.save(); return M.toast('Sample documents added'); }
    M.autoCrop(M.demoPhoto(), (u) => { a.photo = u; a.docs.photo = { name: 'Passport photo (auto-cropped).jpg', st: 'uploaded' }; M.save(); M.toast('Sample documents and passport photo added'); });
  } });
  M.act('wiz.photo.demo', { label: 'Use the sample passport photo', phase: 'Demo', live: 'Not part of the built system', run() { M.cropper.open(M.demoPhoto()); } });
  M.act('wiz.prop.demo', { label: 'Send demo requests to two members', phase: 'Demo', live: 'Not part of the built system', run() { const a = A0(); const now = Date.now(); const set = (k, no) => { if (['Pending', 'Approved'].includes((a[k] || {}).status)) return; const m = F.member(no); a[k] = { no, name: m.rep, biz: m.company, valid: true, status: 'Pending', reqAt: now, expires: now + 7 * M.DAY, reminders: 0, msg: 'Assalam o Alaikum ' + m.rep.split(' ')[0] + ' sahib, I have applied for MCCI membership for ' + (a.f.name || 'my business') + '. Kindly be my ' + k + '. Regards, ' + (a.f.rep || '') }; (a.endorseLog = a.endorseLog || []).push({ role: k, no, name: m.rep, status: 'Requested', t: now }); M.notify(no, 'New ' + k + ' request · ' + (a.f.name || 'applicant'), (a.f.rep || 'An applicant') + ' has asked you to be their ' + k + '. Review and sign, or decline, in Endorsement requests.'); }; set('proposer', 'MCCI-C-1042'); set('seconder', 'MCCI-C-1090'); M.save(); M.toast('Requests sent to Muhammad Arif and Ahmed Raza — open a second tab and switch account to sign'); } });

  /* AI reading of the sample documents fills every field from the same demo data */
  const ai0 = M.aiExtract;
  M.aiExtract = (a) => {
    if (!a.demoDocs) return ai0(a);
    const d = M.DEMO(a); a.src = a.src || {}; a.conf = a.conf || {}; let n = 0;
    const put = (k, v, c, src) => { if (!a.f[k] || a.conf[k] < 100 || a.f[k] === '') { a.f[k] = v; a.conf[k] = c; n++; } a.src[k] = src; };
    put('name', d.name, 98, 'NTN certificate'); put('address', d.address, 94, 'NTN certificate'); put('ntn', d.ntn, 99, 'NTN certificate');
    if (a.salesTax) put('gst', d.gst, 96, 'Sales tax certificate'); else { a.f.gst = a.f.gst || ''; a.src.gst = 'Not registered'; }
    put('tel', d.tel, 88, 'Bank letter / letterhead'); put('fax', d.fax, 82, 'Letterhead'); put('email', d.email, 90, 'Letterhead'); put('web', d.web, 86, 'Letterhead');
    if (!a.f.particulars) put('particulars', d.particulars, 84, 'NTN principal activity');
    put('est', d.est, 95, ['prop'].includes(a.bizType) ? 'NTN certificate' : a.bizType === 'aop' ? 'Partnership deed' : 'Certificate of Incorporation');
    put('rep', d.rep, 99, 'CNIC'); put('desig', d.desig, 90, a.bizType === 'prop' ? 'NTN certificate' : a.bizType === 'aop' ? 'Authority letter' : 'Board resolution');
    put('cnic', d.cnic, 99, 'CNIC'); put('mobile', d.mobile, 86, 'Bank letter — please confirm');
    if (!(a.partners || []).filter((p) => p.name).length) { a.partners = d.partners.map((p, i) => ({ name: p.name, cnic: p.cnic, mobile: p.mobile, card: i === 2 })); n += a.partners.length; }
    a.aiAt = Date.now(); return n;
  };
})();
