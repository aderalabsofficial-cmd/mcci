import type { ReactNode } from 'react';
import type { AppForm, FeeSchedule } from '@/lib/flow/application';
import type { Chamber } from '@/lib/membership/load';
import type { BizType } from '@/lib/membership/reference';

/**
 * The MCCI "Application Form for New Membership" (20-08-2026), 4 pages, as the prototype reproduces it (docs.js
 * M.officialForm, docs/08 "Official form PDF"): page 1 letter + photo + signature + stamp + official-use box, page 2
 * particulars, partners, proposer & seconder, declaration, pages 3–4 instructions, documents per type and fees from
 * settings. This is a replica of a printed English document, so its wording lives here like a PDF template, not in
 * messages/*.json. Printed from the browser (Print / save PDF) with the prototype's print styles.
 */

export interface OfficialUse {
  status?: string;
  no?: string;
  fee?: string;
  cls?: string;
  year?: string;
}

export interface Endorser {
  name?: string;
  biz?: string;
  no?: string;
  signed?: string | null;
  signature?: string | null;
  pending?: boolean;
}

export interface OfficialFormProps {
  blank?: boolean;
  form: AppForm;
  /** photo: URL of the partner's own photo (0480), shown on the annex page */
  partners: {
    name: string;
    cnic: string | null;
    mobile: string | null;
    email?: string | null;
    photo?: string | null;
  }[];
  photo?: string | null;
  sign?: string | null;
  stamp?: string | null;
  official?: OfficialUse;
  proposer?: Endorser;
  seconder?: Endorser;
  chamber: Chamber;
  fees: FeeSchedule;
  processDays: number;
  docLists: Record<BizType, string[]>;
}

const v = (x: string | null | undefined): ReactNode => (x === null || x === undefined || x === '' ? ' ' : x);
const rs = (n: number) => `Rs. ${n.toLocaleString('en-PK')}/-`;

function Page({ n, children }: { n: number; children: ReactNode }) {
  return (
    <section className="of-page">
      {children}
      <div className="of-pn">Page {n} of 4</div>
    </section>
  );
}

const Tick = ({ on }: { on: boolean }) => <span className="of-box">{on ? '✓' : ''}</span>;

function DateBoxes({ iso }: { iso?: string }) {
  const s = iso ? iso.split('-').reverse().join('') : '';
  const d = `${s}        `.slice(0, 8).split('');
  const box = (c: string, i: number) => <i key={i}>{c.trim() ? c : ' '}</i>;
  return (
    <span className="of-dt">
      {d.slice(0, 2).map(box)}
      <em>-</em>
      {d.slice(2, 4).map(box)}
      <em>-</em>
      {d.slice(4, 8).map(box)}
    </span>
  );
}

const Img = ({ src, h, alt = '' }: { src?: string | null; h: number; alt?: string }) =>
  // eslint-disable-next-line @next/next/no-img-element -- signed URLs of private files; next/image would proxy them
  src ? <img className="of-sig" src={src} style={{ maxHeight: h }} alt={alt} /> : null;

function Header({ c }: { c: Chamber }) {
  return (
    <div className="of-hd">
      {/* eslint-disable-next-line @next/next/no-img-element -- printed document header */}
      <img src="/images/logo.png" alt="MCCI" />
      <b>{c.name}</b>
      <div>{c.addr}</div>
      <div>
        Tel: {c.tel}, Fax: {c.fax} Email: <u>{c.email}</u> URL: <u>{c.web}</u>
      </div>
    </div>
  );
}

function EndorserTable({ who, x }: { who: string; x: Endorser }) {
  return (
    <table className="of-tb of-pp">
      <tbody>
        <tr>
          <th>{who} by (Name)</th>
          <th>Business Name</th>
          <th>Membership No.</th>
          <th>Signature</th>
        </tr>
        <tr>
          <td>{v(x.name)}</td>
          <td>{v(x.biz)}</td>
          <td>{v(x.no)}</td>
          <td className="of-dsig">
            {x.signed ? (
              <>
                {x.signature && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file
                  <img
                    src={x.signature}
                    alt=""
                    style={{ maxHeight: 34, maxWidth: 120, display: 'block', margin: '0 auto' }}
                  />
                )}
                <small>{x.signed}</small>
              </>
            ) : x.pending ? (
              <small style={{ color: '#b45309' }}>Awaiting signature</small>
            ) : (
              ' '
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** main category, then the legal form (docs/21 points 6–7: "Manufacturing Concern" is now the category) */
const CAT: [boolean, string][] = [
  [true, 'Manufacturing'],
  [false, 'Non-manufacturing'],
];
const BT: [BizType, string][] = [
  ['prop', 'Proprietorship'],
  ['aop', 'Partnership /AOP'],
  ['pvt', 'Ltd. / Pvt. Ltd Co.'],
  ['mnc', 'Multinational Co.'],
  ['public', 'Public Ltd. Co.'],
  ['llp', 'LLP'],
];

export function OfficialForm(p: OfficialFormProps) {
  const f: AppForm = p.blank ? {} : p.form;
  const P = p.blank ? [] : p.partners;
  const off = p.blank ? {} : (p.official ?? {});
  const fees = p.fees;
  const dl = (k: BizType) => (
    <ol>
      {p.docLists[k].map((d, i) => (
        <li key={i}>{d}.</li>
      ))}
    </ol>
  );
  const feeBox = (t: string, x: { admission: number; subscription: number; card: number }) => (
    <div className="of-fee">
      <b>{t}</b>
      <table>
        <tbody>
          <tr>
            <td>Admission:</td>
            <td>{rs(x.admission)}</td>
          </tr>
          <tr>
            <td>Annual Subscription:</td>
            <td>{rs(x.subscription)}</td>
          </tr>
          <tr>
            <td>Membership Card for Authorized Representative:</td>
            <td>{rs(x.card)}</td>
          </tr>
          <tr className="t">
            <td>Total:</td>
            <td>{rs(x.admission + x.subscription + x.card)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
  const row = (l: string, val?: string) => (
    <tr>
      <td className="lb">{l}</td>
      <td colSpan={3}>{v(val)}</td>
    </tr>
  );

  return (
    <div className="of-wrap">
      <Page n={1}>
        <Header c={p.chamber} />
        <h2 className="of-title">APPLICATION FORM FOR NEW MEMBERSHIP</h2>
        <div className="of-sub">
          (Please read the attached instructions before filling the Application Form for Membership)
        </div>
        <div className="of-r1">
          <div className="of-to">
            The Secretary General,
            <br />
            Multan Chamber of Commerce &amp; Industry,
            <br />
            Shahrah-e-Aiwan-e-Tijarat-o-Sanat,
            <br />
            Multan.
            <br />
            <br />
            Dear Sir,
          </div>
          <div className="of-photo">
            {!p.blank && p.photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL of the applicant's photo
              <img src={p.photo} alt="Photograph" />
            ) : (
              <span>
                Photograph of
                <br />
                Proprietor/Director/
                <br />
                Partner/CEO
              </span>
            )}
          </div>
        </div>
        <p className="of-p">
          I am desirous of becoming member of the Multan Chamber of Commerce &amp; Industry, I have read and understand
          Memorandum and Articles of Association and By Laws of this Chamber and I agree to abide by the same. If at any
          stage I will not abide by or breach any Rules and Regulations as defined in the Memorandum and Articles of
          Association and By Laws of the Multan Chamber of Commerce &amp; Industry so in that case the Multan Chamber of
          Commerce &amp; Industry will have the right to cancel my membership. I will pay Admission Fee along with
          Annual Subscription Fee subject to approval of my application by the Membership Committee of the Multan
          Chamber of Commerce &amp; Industry.
        </p>
        <p className="of-p">Yours faithfully,</p>
        <div className="of-sg">
          <div>
            <span className="of-fill">{v(f.rep)}</span>
            <b>Name of Authorized Representative</b>
          </div>
          <div>
            <span className="of-fill">{v(f.name)}</span>
            <b>Name of Business Firm / Company</b>
          </div>
        </div>
        <div className="of-sg">
          <div>
            <span className="of-fill tall">{!p.blank && <Img src={p.sign} h={46} alt="Signature" />}</span>
            <b className="c">Signature</b>
          </div>
          <div>
            <span className="of-fill tall">{!p.blank && <Img src={p.stamp} h={60} alt="Stamp" />}</span>
            <b className="c">Stamp / Seal Company / Firm</b>
          </div>
        </div>
        <table className="of-off">
          <tbody>
            <tr>
              <th colSpan={4}>FOR OFFICIAL USE ONLY</th>
            </tr>
            <tr>
              <td>Approval Status by Membership Committee</td>
              <td className="vv">{v(off.status)}</td>
              <td>Membership No.</td>
              <td className="vv">{v(off.no)}</td>
            </tr>
            <tr>
              <td>Fee Received</td>
              <td className="vv">{v(off.fee)}</td>
              <td>Class of Membership</td>
              <td className="vv">{v(off.cls)}</td>
            </tr>
            <tr>
              <td>Membership Year</td>
              <td className="vv" colSpan={3}>
                {v(off.year)}
              </td>
            </tr>
          </tbody>
        </table>
      </Page>

      <Page n={2}>
        <h3 className="of-h3">PARTICULARS OF MEMBER</h3>
        <div className="of-tk">Tick Relevant Box</div>
        <div className="of-ticks">
          {CAT.map(([k, label]) => (
            <div key={label}>
              <small>{label}</small>
              <Tick on={f.manufacturing === k} />
            </div>
          ))}
        </div>
        <div className="of-ticks">
          {BT.map(([k, label]) => (
            <div key={k}>
              <small>
                {label}
                {k === 'aop' && f.biz === 'aop' && typeof f.aopRegistered === 'boolean'
                  ? f.aopRegistered
                    ? ' (Registered)'
                    : ' (Unregistered)'
                  : ''}
              </small>
              <Tick on={f.biz === k} />
            </div>
          ))}
        </div>
        <table className="of-tb">
          <tbody>
            {row('Name of Business', f.name)}
            {row('Business Address', f.address)}
            <tr>
              <td className="lb">Business NTN</td>
              <td>{v(f.ntn)}</td>
              <td className="lb sm">
                Business GST
                <br />
                if applicable
              </td>
              <td>{v(f.gst)}</td>
            </tr>
            {f.salesTax && (
              <tr>
                <td className="lb">Sales tax registered w.e.f.</td>
                <td colSpan={3}>{v(f.stWef)}</td>
              </tr>
            )}
            <tr>
              <td className="lb">Business Telephone No.</td>
              <td>{v(f.tel)}</td>
              <td className="lb sm">Fax No.</td>
              <td>{v(f.fax)}</td>
            </tr>
            <tr>
              <td className="lb">Business Email ID</td>
              <td>{v(f.email)}</td>
              <td className="lb sm">Website</td>
              <td>{v(f.web)}</td>
            </tr>
          </tbody>
        </table>
        <table className="of-tb">
          <tbody>
            <tr>
              <td className="lb">Particulars of Business</td>
              <td>{v(f.particulars)}</td>
            </tr>
          </tbody>
        </table>
        <div className="of-est">
          Date of Business Establishment <DateBoxes iso={f.est} />
        </div>
        <table className="of-tb">
          <tbody>
            {(
              [
                ['Name of Authorized Representative', f.rep],
                ['Designation', f.desig],
                ['CNIC No.', f.cnic],
                ['Mobile No.', f.mobile],
                ['Email', f.repEmail],
                ['Address', f.repAddress],
              ] as const
            ).map(([l, val]) => (
              <tr key={l}>
                <td className="lb w">{l}</td>
                <td>{v(val)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="of-lbl">Particulars of Partners/Directors:</div>
        <table className="of-tb of-pt">
          <tbody>
            <tr>
              <th />
              <th>Name</th>
              <th>CNIC</th>
              <th>Mobile No.</th>
              <th>Email</th>
            </tr>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="n">{i + 1}</td>
                <td>{v(P[i]?.name)}</td>
                <td>{v(P[i]?.cnic)}</td>
                <td>{v(P[i]?.mobile)}</td>
                <td>{v(P[i]?.email)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="of-sm">
          Application must be proposed and seconded by valid Members of the Multan Chamber of Commerce &amp; Industry
        </div>
        <EndorserTable who="Proposed" x={p.blank ? {} : (p.proposer ?? {})} />
        <EndorserTable who="Seconded" x={p.blank ? {} : (p.seconder ?? {})} />
        <p className="of-p sm">
          I declare that the particulars given in this Application Form are true to the best of my knowledge and belief
          and that I have no criminal conviction and that nothing has been concealed.
        </p>
        <div className="of-sg b">
          <div>
            <span className="of-fill tall">{!p.blank && <Img src={p.sign} h={46} alt="Signature" />}</span>
            <b>Signature of Authorized Representative</b>
          </div>
          <div>
            <span className="of-fill tall">{!p.blank && <Img src={p.stamp} h={56} alt="Stamp" />}</span>
            <b>Stamp / Seal of Firm / Company</b>
          </div>
        </div>
      </Page>

      <Page n={3}>
        <h3 className="of-h3">INSTRUCTIONS AND REQUIREMENTS OF MEMBERSHIP</h3>
        <ul className="of-ul">
          <li>Only Annual Subscription will be paid by the member at the time of Renewal of Membership.</li>
          <li>
            Membership shall be granted for a period of one year (From 01<sup>st</sup> April to 31<sup>st</sup> March
            each year) and shall expire on 31<sup>st</sup> of March each year irrespective of the date of grant of
            membership.
          </li>
          <li>
            Membership Renewal Period at the Multan Chamber of Commerce &amp; Industry is from 01<sup>st</sup> March to
            31<sup>st</sup> March each year.
          </li>
          <li>
            Membership of Multan Chamber of Commerce &amp; Industry will only be granted to the business concern whose
            business scope fits within the jurisdiction limit of Multan Chamber as per TOR 11 (b).
          </li>
          <li>Business Address of Firm/Company must be matched with the address mentioned in NTN Certificate.</li>
        </ul>
        <p className="of-p sm">
          <b>
            <u>Corporate Member:</u>
          </b>
          <br />A member of a trade organization which is either a body corporate or a multinational corporation with
          its head office or branch office in Pakistan or a sales-tax-registered manufacturing concern or a
          sales-tax-registered business concern having annual turn-over of not less than Rs.50 million shall be called
          “Corporate Member”.
        </p>
        <p className="of-p sm">
          <b>
            <u>Associate Member:</u>
          </b>
          <br />A member of a trade organization which is not a body corporate or a multinational or a
          sales-tax-registered manufacturing concern or a sales-tax-registered business concern having annual turn-over
          of not less than Rs.50 million shall be called “Associate Member”.
        </p>
        <p className="of-p sm">
          An application for grant of membership must be accompanied with documents as mentioned below:-
        </p>
        <div className="of-docs">
          <b>
            <u>Proprietorship:</u>
          </b>
          {dl('prop')}
          <b>
            <u>Partnership / AOP:</u>
          </b>
          {dl('aop')}
          <b>
            <u>Private Limited / Limited Company:</u>
          </b>
          {dl('pvt')}
        </div>
      </Page>

      <Page n={4}>
        <div className="of-docs">
          <b>
            <u>Public Limited / Multinational Company:</u>
          </b>
          {dl('public')}
        </div>
        <h3 className="of-h3 u">Membership Fee</h3>
        {feeBox('Corporate Class:', fees.Corporate)}
        {feeBox('Associate Class:', fees.Associate)}
        {feeBox('Women Entrepreneurs — Corporate / Associate Class:', fees.Women)}
        <div className="of-fee">
          <table>
            <tbody>
              <tr className="t">
                <td>Membership Card Fee for Partners / Directors (Optional)</td>
                <td>{rs(fees.extraCard)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="of-p sm">
          <b>Note:</b>
        </p>
        <ol className="of-ul n">
          <li>Incomplete Application will not be considered / entertained.</li>
          <li>
            Application Form must be proposed and seconded by any two valid members of Multan Chamber of Commerce &amp;
            Industry.
          </li>
          <li>
            Payment Receipt and Membership Certificate will be issued after approval by the Membership Committee of the
            Multan Chamber of Commerce &amp; Industry.
          </li>
          <li>
            After obtaining membership, if there is any change in particulars of business, it must be communicated to
            the Chamber by the member for record purpose.
          </li>
          <li>
            Application Form for membership along with required documents can be submitted during office hours of the
            Chamber.
          </li>
          <li>Normal Membership Process Time – {p.processDays} Working Days.</li>
        </ol>
      </Page>
      {P.length > 0 && (
        // each partner's / director's own photograph (owner, 29 Oct 2026; migration 0480), after the four form pages
        <section className="of-page of-annex" data-annex="partners">
          <Header c={p.chamber} />
          <h2 className="of-title">ANNEX — PHOTOGRAPHS OF PARTNERS / DIRECTORS</h2>
          <div className="of-sub">Name of Business: {v(f.name)}</div>
          <div className="of-pgrid">
            {P.map((x, i) => (
              <figure key={i} data-partner={i + 1}>
                <div className="of-photo">
                  {x.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the partner's photo (signed or logged URL)
                    <img src={x.photo} alt={`Photograph of ${x.name || `partner ${i + 1}`}`} />
                  ) : (
                    <span>Photograph</span>
                  )}
                </div>
                <figcaption>
                  <b>
                    {i + 1}. {x.name || ' '}
                  </b>
                  <small>CNIC: {v(x.cnic)}</small>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="of-pn">Annex to the Application Form</div>
        </section>
      )}
    </div>
  );
}
