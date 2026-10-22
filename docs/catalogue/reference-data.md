# Documents required per business type

From the MCCI Application Form for New Membership (page 3–4). Source of truth for `document_requirements` seed data.

## Proprietorship (`prop`) — واحد ملکیت

| key | Document | Required |
|---|---|---|
| `cnic` | A copy of CNIC / Passport of Proprietor | yes |
| `ntn` | A copy of National Tax Number (NTN) certificate on the name of business | yes |
| `itr` | Latest Income Tax Return where applicable on the name of business | if applicable |
| `st` | A copy of Sales Tax Registration Certificate and Sales Tax Return, if registered / applicable | if applicable |
| `addr` | Proof of business addresses (copy of lease deed / allotment letter of the building / office) | yes |
| `bank` | Original Bank Account Maintenance Certificate on the name of business | yes |
| `photo` | Three photographs of the proprietor (latest + coloured) | yes |

## Partnership / AOP (`aop`) — شراکت داری

| key | Document | Required |
|---|---|---|
| `cnic` | Copies of CNICs / Passports of Partners | yes |
| `ntn` | A copy of National Tax Number (NTN) certificate on the name of the firm | yes |
| `itr` | Latest Income Tax Return where applicable on the name of the firm | if applicable |
| `st` | A copy of Sales Tax Registration Certificate and Sales Tax Return, if registered / applicable | if applicable |
| `addr` | Proof of business addresses (copy of lease deed / allotment letter of the building / office) | yes |
| `bank` | Original Bank Account Maintenance Certificate on the name of business | yes |
| `deed` | An attested copy of Partnership Deed duly registered with Registrar of Firms, Multan | yes |
| `formc` | An attested copy of Form “C” issued by Registrar of Firms | yes |
| `auth` | An Authority Letter on Letterhead by all Partners for nominating one of the Partners as authorized representative in Multan Chamber of Commerce & Industry | yes |
| `photo` | Three photographs of authorized representative (latest + coloured) | yes |

## Ltd. / Pvt. Ltd Co. (`pvt`) — پرائیویٹ لمیٹڈ کمپنی

| key | Document | Required |
|---|---|---|
| `cnic` | Copies of CNICs / Passports of Directors | yes |
| `ntn` | A copy of National Tax Number (NTN) certificate on the name of the Company | yes |
| `itr` | Latest Income Tax Return where applicable on the name of the Company | if applicable |
| `st` | A copy of Sales Tax Registration Certificate and Sales Tax Return, if registered / applicable | if applicable |
| `moa` | A copy of Memorandum and Articles of Association duly approved by Securities & Exchange Commission of Pakistan (SECP) and attested by company secretary | yes |
| `inc` | Copy of Certificate of Incorporation by SECP and attested by company secretary | yes |
| `addr` | Proof of business addresses (copy of lease deed / allotment letter of the building / office) | yes |
| `bank` | Original Bank Account Maintenance Certificate on the name of business | yes |
| `board` | Board Resolution on Letterhead for nominating one of the Directors as authorized representative in Multan Chamber of Commerce & Industry | yes |
| `photo` | Three photographs of authorized representative (latest + coloured) | yes |
| `forma` | Latest copy of Form A & Form 9 duly certified by SECP | yes |

## Multinational Co. (`mnc`) — ملٹی نیشنل کمپنی

| key | Document | Required |
|---|---|---|
| `cnic` | Copies of CNICs / Passports of Directors | yes |
| `ntn` | A copy of National Tax Number (NTN) certificate on the name of the Company | yes |
| `itr` | Latest Income Tax Return where applicable on the name of the Company | if applicable |
| `st` | A copy of Sales Tax Registration Certificate and Sales Tax Return, if registered / applicable | if applicable |
| `moa` | A copy of Memorandum and Articles of Association duly approved by Securities & Exchange Commission of Pakistan (SECP) and attested by company secretary | yes |
| `inc` | Copy of Certificate of Incorporation by SECP or proof of filing form 38 to 45 with SECP and BOI letter | yes |
| `addr` | Proof of business addresses (copy of lease deed / allotment letter of the building / office) | yes |
| `bank` | Original Bank Account Maintenance Certificate on the name of business | yes |
| `board` | Board Resolution or Power of Attorney, nominating one of Directors or General Manager / Country Manager as authorized representative in Multan Chamber of Commerce & Industry | yes |
| `photo` | Three photographs of authorized representative (latest + coloured) | yes |
| `forma` | Latest copy of Form A & Form 9 duly certified by SECP | yes |

## Public Ltd. Co. (`public`) — پبلک لمیٹڈ کمپنی

| key | Document | Required |
|---|---|---|
| `cnic` | Copies of CNICs / Passports of Directors | yes |
| `ntn` | A copy of National Tax Number (NTN) certificate on the name of the Company | yes |
| `itr` | Latest Income Tax Return where applicable on the name of the Company | if applicable |
| `st` | A copy of Sales Tax Registration Certificate and Sales Tax Return, if registered / applicable | if applicable |
| `moa` | A copy of Memorandum and Articles of Association duly approved by Securities & Exchange Commission of Pakistan (SECP) and attested by company secretary | yes |
| `inc` | Copy of Certificate of Incorporation by SECP or proof of filing form 38 to 45 with SECP and BOI letter | yes |
| `addr` | Proof of business addresses (copy of lease deed / allotment letter of the building / office) | yes |
| `bank` | Original Bank Account Maintenance Certificate on the name of business | yes |
| `board` | Board Resolution or Power of Attorney, nominating one of Directors or General Manager / Country Manager as authorized representative in Multan Chamber of Commerce & Industry | yes |
| `photo` | Three photographs of authorized representative (latest + coloured) | yes |
| `forma` | Latest copy of Form A & Form 9 duly certified by SECP | yes |

# Form fields (page 2 "Particulars of Member")

| key | Label on the form |
|---|---|
| `name` | Name of Business |
| `address` | Business Address |
| `ntn` | Business NTN |
| `gst` | Business GST (if applicable) |
| `tel` | Business Telephone No. |
| `fax` | Fax No. |
| `email` | Business Email ID |
| `web` | Website |
| `particulars` | Particulars of Business |
| `est` | Date of Business Establishment |
| `rep` | Name of Authorized Representative |
| `desig` | Designation |
| `cnic` | CNIC No. |
| `mobile` | Mobile No. |
| `sector` | Sector |

# Services

| key | Service | Urdu | Documents | Form fields | Fee placeholder (PKR) |
|---|---|---|---|---|---|
| `ebil` | E-BIL — Electronic Business Invitation Letter | ای-بل دعوت نامہ | Invitee passport copy; Purpose & itinerary of visit; Authority letter (if applicable) | Invitee name; Passport no.; Nationality; Visit dates | 2000 |
| `visa` | Visa Recommendation Letter | ویزا سفارشی خط | Passport copy & CNIC; Invitation from host company; Travel itinerary | Traveller name; Passport no.; Country; Embassy | 1500 |
| `guar` | Visa Guarantee Letter — for obtaining Chinese visa | چینی ویزا گارنٹی خط | Passport copy of traveller; Invitation letter from Chinese partner; Business registration proof | Traveller name; Passport no.; Chinese company; City | 3000 |
| `sample` | Recommendatory Letter — carry free commercial samples abroad | نمونہ جات سفارشی خط | Sample list with values; Passport copy; Travel dates | Traveller name; Destination; Sample value (USD); Travel date | 1500 |
| `other` | Other Recommendatory Letters — membership / company profile etc. | دیگر سفارشی خطوط | Request purpose; Supporting documents | Addressed to; Purpose | 1000 |
| `co` | Attestation of Certificate of Origin (C.O.) | سرٹیفکیٹ آف اوریجن | Commercial invoice; Packing list; Bill of lading / airway bill; C.O. form | Consignee; Destination; HS code; Invoice value (USD) | 1000 |
| `att` | Other Document Attestations — certificate, financial report, authority letter, MoU | دستاویزات کی تصدیق | Document to attest; Covering request | Document type; Addressed to | 500 |