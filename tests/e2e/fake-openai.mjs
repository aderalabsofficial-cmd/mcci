// Local stand-in for the OpenAI Responses API used by the e2e run (playwright.config.ts starts it and points the app
// at it with OPENAI_BASE_URL). It answers every document reading with fixed values, by schema name (mcci_<doc>), so
// "Read with AI" can be tested end to end without a key, cost or document content leaving the machine.
import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_OPENAI_PORT ?? 3998);
const f = (value, confidence) => ({ value, confidence });
const member = (no, company, rep, validTo, status, c = 95) => ({
  membership_no: f(no, 97),
  class: f('Associate', 96),
  women: f(null, 0),
  company_name: f(company, 95),
  business_type: f('Proprietorship', 90),
  sector: f(null, 0),
  address: f(null, 0),
  ntn: f(null, 0),
  gst: f(null, 0),
  representative_name: f(rep, 94),
  mobile: f(null, 0),
  email: f(null, 0),
  member_since: f(null, 0),
  valid_to: f(validTo, c),
  status: f(status, 93),
  certificate_serial: f(null, 0),
});
// a scanned security-press certificate (lib/certificates/ai.ts): the answer depends on the test image's width, so one
// fake serves the clear, the blurry and the unknown-member scans of tests/e2e/certificates.spec.ts
const cert = (no, company, c = 95) => ({
  membership_no: f(no, c),
  company_name: f(company, c),
  class: f('Corporate Class', c),
  membership_year: f('2026-2027', c),
  valid_to: f('31st March 2027', c),
  issued_on: f('20th May 2026', c),
  ntn: f(null, 0),
  book_no: f('B 19346', c),
  serial_no: f('B 1934589', c),
});
const CERTIFICATES = {
  640: cert('C-90869', 'Garden Makers (Pvt.) Ltd.'),
  641: cert('C-90869', 'Garden Makers (Pvt.) Ltd.', 40),
  642: cert('C-99999', 'Nobody Industries'),
};
const pngWidth = (body) => {
  const url = JSON.stringify(body).match(/data:image\/png;base64,([A-Za-z0-9+/=]{40,})/)?.[1];
  return url ? Buffer.from(url.slice(0, 40), 'base64').readUInt32BE(16) : 0;
};
const ANSWERS = {
  // a service request's documents (lib/services/ai.ts): the first four details of the service, in order
  service_request: { f0: f('ACME GmbH', 94), f1: f('Germany', 96), f2: f('6302.10', 88), f3: f('12000', 90) },
  // a PDF member directory (lib/import/ai.ts): one clear row, one the "AI" was unsure of
  member_directory: {
    members: [
      member('MCCI-A-0050', 'Scanned Traders', 'Rep Scan', '31 March 2027', 'Permanent'),
      member('MCCI-A-0051', 'Blurry & Co', 'Rep Blur', '31-03-2027', 'Active', 55),
    ],
    more_than_limit: false,
  },
  ntn: {
    name: f('Fresh Traders (AI)', 96),
    ntn: f('7654321-0', 97),
    address: f('22 Abdali Road, Multan', 78),
    regDate: f('2018-05-01', 90),
  },
  cnic: { rep: f('Amir Khan', 95), cnic: f('36302-7654321-1', 93), dob: f('1980-01-01', 90), address: f(null, 0) },
  bank: { accountTitle: f('Fresh Traders', 88), bank: f('HBL Multan', 90), iban: f('PK00HABB0000000000000000', 80) },
  addr: { address: f('22 Abdali Road, Multan Cantt', 70) },
  st: { gst: f('17-00-1234-567-89', 92), name: f('Fresh Traders', 90) },
  inc: {
    name: f('Fresh Industries (Pvt) Ltd', 95),
    incNo: f('0123456', 95),
    incDate: f('2015-07-01', 94),
    directors: [],
  },
  forma: {
    name: f('Fresh Industries (Pvt) Ltd', 92),
    incNo: f('0123456', 90),
    incDate: f('2015-07-01', 90),
    directors: [
      { name: f('Asad Ali', 90), cnic: f('36302-1111111-1', 85) },
      { name: f('Sana Ali', 90), cnic: f('36302-2222222-2', 85) },
    ],
  },
};

createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (req.url === '/health') return res.end('ok');
    if (req.method !== 'POST' || !req.url?.endsWith('/responses')) {
      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: { message: 'not found' } }));
    }
    const parsed = JSON.parse(body);
    const name = parsed?.text?.format?.name ?? '';
    // Ask MCCI AI (lib/assistant): a plain-text answer that shows what context the server sent
    if (String(parsed?.instructions ?? '').includes('MCCI-ASSISTANT')) {
      const all = JSON.stringify(parsed.input ?? []);
      const file = all.match(/FILE:(MCCI-\d{4}-M-\d{4})/)?.[1];
      const text = `FAKE-ASSISTANT${all.includes('Membership fees') ? ' knowledge-ok' : ''}${file ? ` file ${file}` : ''}`;
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 'resp_ai',
          object: 'response',
          created_at: Math.floor(Date.now() / 1000),
          status: 'completed',
          model: 'fake',
          output: [
            {
              id: 'msg_ai',
              type: 'message',
              role: 'assistant',
              status: 'completed',
              content: [{ type: 'output_text', text, annotations: [] }],
            },
          ],
        }),
      );
    }
    const answer =
      name === 'mcci_certificate'
        ? (CERTIFICATES[pngWidth(parsed?.input)] ?? {})
        : (ANSWERS[name.replace(/^mcci_/, '')] ?? {});
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'resp_e2e',
        object: 'response',
        created_at: Math.floor(Date.now() / 1000),
        status: 'completed',
        model: 'fake',
        output: [
          {
            id: 'msg_e2e',
            type: 'message',
            role: 'assistant',
            status: 'completed',
            content: [{ type: 'output_text', text: JSON.stringify(answer), annotations: [] }],
          },
        ],
      }),
    );
  });
}).listen(PORT, '127.0.0.1', () => console.log(`fake OpenAI on ${PORT}`));
