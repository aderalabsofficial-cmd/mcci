// Local stand-in for the OpenAI Responses API used by the e2e run (playwright.config.ts starts it and points the app
// at it with OPENAI_BASE_URL). It answers every document reading with fixed values, by schema name (mcci_<doc>), so
// "Read with AI" can be tested end to end without a key, cost or document content leaving the machine.
import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_OPENAI_PORT ?? 3998);
const f = (value, confidence) => ({ value, confidence });
const ANSWERS = {
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
    const name = JSON.parse(body)?.text?.format?.name ?? '';
    const answer = ANSWERS[name.replace(/^mcci_/, '')] ?? {};
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
