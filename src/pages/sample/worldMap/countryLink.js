/**
 * 지도 나라 ↔ 규제 국가 코드 연결.
 *
 * 지도 데이터(world-atlas)는 나라를 ISO 3166 숫자 코드(한국 = 410)로, 규제 화면은 영문 2자리(KR)로 부른다.
 * 그래서 규제 국가 코드 목록(regulationMock.countryCodes)에 있는 나라만 숫자 코드를 붙여 둔다.
 * 여기에 없는 나라를 누르면 규제 대상 국가가 아니라고 알려 준다.
 * (홍콩·마카오·싱가포르·바레인·몰타·룩셈부르크 등은 110m 지도에 땅이 없어 클릭할 수 없다 → 권역 타일 드롭다운으로)
 */
import { countryCodes } from '@/data/regulationMock'

// 영문 2자리 → ISO 숫자
const NUMERIC = {
  KR: 410, JP: 392, CN: 156, VN: 704, IN: 356, TW: 158, HK: 344, MO: 446, SG: 702, TH: 764, MY: 458, ID: 360,
  PH: 608, BN: 96, MM: 104, KH: 116, LA: 418, BD: 50, PK: 586, LK: 144, NP: 524, MN: 496, KZ: 398, UZ: 860,
  FR: 250, DE: 276, IT: 380, ES: 724, PL: 616, GB: 826, NL: 528, BE: 56, LU: 442, AT: 40, CH: 756, SE: 752,
  NO: 578, DK: 208, FI: 246, IS: 352, IE: 372, PT: 620, GR: 300, CY: 196, MT: 470, CZ: 203, SK: 703, HU: 348,
  RO: 642, BG: 100, HR: 191, SI: 705, RS: 688, EE: 233, LV: 428, LT: 440, UA: 804, TR: 792,
  US: 840, CA: 124, MX: 484,
  BR: 76, AR: 32, CL: 152, CO: 170, PE: 604, EC: 218, UY: 858, PY: 600, BO: 68, VE: 862, CR: 188, PA: 591,
  GT: 320, DO: 214,
  AE: 784, SA: 682, QA: 634, KW: 414, BH: 48, OM: 512, IL: 376, JO: 400, IQ: 368, IR: 364, EG: 818, MA: 504,
  TN: 788, DZ: 12, NG: 566, GH: 288, KE: 404, ET: 231, TZ: 834, ZA: 710,
  AU: 36, NZ: 554, FJ: 242, PG: 598, NC: 540
}

// 지도 feature.cid(숫자 문자열) → 규제 국가 { code, name, regionCd }
const BY_CID = {}
countryCodes.forEach((c) => {
  if (NUMERIC[c.code] != null) BY_CID[String(NUMERIC[c.code])] = { code: c.code, name: c.name, regionCd: c.parentCd }
})

/** 지도 나라 코드(cid)로 규제 국가를 찾는다. 규제 대상이 아니면 null */
export const regCountryOf = (cid) => (cid == null ? null : BY_CID[String(Number(cid))] || null)
