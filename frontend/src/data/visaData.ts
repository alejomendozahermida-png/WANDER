/**
 * Visa compatibility data by passport country.
 * 'free' = no visa needed, 'evisa' = electronic visa available, 'visa' = traditional visa required
 */

export type VisaStatus = 'free' | 'evisa' | 'visa';

// Schengen/EU countries that share visa policies
const SCHENGEN_COUNTRIES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','CH'];

// Countries where EU passport holders can travel visa-free
const EU_VISA_FREE: string[] = [
  // All Schengen + EU
  ...SCHENGEN_COUNTRIES,
  // Americas
  'US','CA','MX','BR','AR','CL','CO','PE','EC','UY','PA','CR','CU',
  // Asia
  'JP','KR','SG','TH','MY','ID','PH','TW','HK','VN','KH','NP','LK','IN','MV',
  // Middle East
  'AE','IL','JO','QA','OM','TR',
  // Africa  
  'MA','TN','ZA','KE','TZ','MU','SN','EG','ET',
  // Oceania
  'AU','NZ','FJ','PF',
  // UK
  'GB',
];

const EU_EVISA: string[] = ['CN'];

// US passport visa-free countries
const US_VISA_FREE: string[] = [
  ...SCHENGEN_COUNTRIES, 'GB','IE',
  'MX','CA','BR','AR','CL','CO','PE','EC','UY','PA','CR','CU',
  'JP','KR','SG','TH','MY','HK','TW','PH','KH',
  'AE','IL','JO','QA','OM','TR',
  'MA','TN','ZA','KE','MU',
  'AU','NZ','FJ','PF',
];
const US_EVISA: string[] = ['IN','LK','VN','ID','NP','EG','ET','TZ','SN','MV','CN'];

// UK passport
const UK_VISA_FREE: string[] = [
  ...SCHENGEN_COUNTRIES,
  'US','CA','MX','BR','AR','CL','CO','PE','EC','UY','PA','CR',
  'JP','KR','SG','TH','MY','HK','TW','PH','KH','ID',
  'AE','IL','JO','QA','OM','TR',
  'MA','TN','ZA','KE','MU',
  'AU','NZ','FJ','PF',
];
const UK_EVISA: string[] = ['IN','LK','VN','NP','EG','ET','TZ','SN','MV','CN','CU'];

// LATAM common (Colombia, Mexico, Brazil, Argentina, Chile, Peru)
const LATAM_VISA_FREE: string[] = [
  ...SCHENGEN_COUNTRIES, 'GB',
  'MX','BR','AR','CL','CO','PE','EC','UY','PA','CR','CU',
  'JP','KR','SG','TH','MY','HK','TW','PH','ID',
  'AE','TR','IL','JO','MA','TN','ZA',
  'AU','NZ',
];
const LATAM_EVISA: string[] = ['IN','VN','KH','EG','KE','TZ','ET','US','CA'];

// Passport groups mapping country codes to visa data
const PASSPORT_GROUPS: Record<string, { free: string[]; evisa: string[] }> = {
  // EU/Schengen countries
  FR: { free: EU_VISA_FREE, evisa: EU_EVISA },
  DE: { free: EU_VISA_FREE, evisa: EU_EVISA },
  ES: { free: EU_VISA_FREE, evisa: EU_EVISA },
  IT: { free: EU_VISA_FREE, evisa: EU_EVISA },
  PT: { free: EU_VISA_FREE, evisa: EU_EVISA },
  NL: { free: EU_VISA_FREE, evisa: EU_EVISA },
  BE: { free: EU_VISA_FREE, evisa: EU_EVISA },
  AT: { free: EU_VISA_FREE, evisa: EU_EVISA },
  CH: { free: EU_VISA_FREE, evisa: EU_EVISA },
  SE: { free: EU_VISA_FREE, evisa: EU_EVISA },
  NO: { free: EU_VISA_FREE, evisa: EU_EVISA },
  DK: { free: EU_VISA_FREE, evisa: EU_EVISA },
  FI: { free: EU_VISA_FREE, evisa: EU_EVISA },
  IE: { free: EU_VISA_FREE, evisa: EU_EVISA },
  PL: { free: EU_VISA_FREE, evisa: EU_EVISA },
  CZ: { free: EU_VISA_FREE, evisa: EU_EVISA },
  HU: { free: EU_VISA_FREE, evisa: EU_EVISA },
  GR: { free: EU_VISA_FREE, evisa: EU_EVISA },
  RO: { free: EU_VISA_FREE, evisa: EU_EVISA },
  BG: { free: EU_VISA_FREE, evisa: EU_EVISA },
  HR: { free: EU_VISA_FREE, evisa: EU_EVISA },
  IS: { free: EU_VISA_FREE, evisa: EU_EVISA },
  LV: { free: EU_VISA_FREE, evisa: EU_EVISA },
  LT: { free: EU_VISA_FREE, evisa: EU_EVISA },
  EE: { free: EU_VISA_FREE, evisa: EU_EVISA },
  SI: { free: EU_VISA_FREE, evisa: EU_EVISA },
  SK: { free: EU_VISA_FREE, evisa: EU_EVISA },
  // US
  US: { free: US_VISA_FREE, evisa: US_EVISA },
  // UK
  GB: { free: UK_VISA_FREE, evisa: UK_EVISA },
  // LATAM
  CO: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  MX: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  BR: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  AR: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  CL: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  PE: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  EC: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  UY: { free: LATAM_VISA_FREE, evisa: LATAM_EVISA },
  // Asia/Others — simplified, assume EU-like for high-passport countries
  JP: { free: EU_VISA_FREE, evisa: EU_EVISA },
  KR: { free: EU_VISA_FREE, evisa: EU_EVISA },
  SG: { free: EU_VISA_FREE, evisa: EU_EVISA },
  AU: { free: UK_VISA_FREE, evisa: UK_EVISA },
  NZ: { free: UK_VISA_FREE, evisa: UK_EVISA },
  CA: { free: US_VISA_FREE, evisa: US_EVISA },
};

/**
 * Get visa status for a specific destination given a passport country
 */
export const getVisaStatus = (passportCountry: string, destinationCountry: string): VisaStatus => {
  // Same country = always free
  if (passportCountry === destinationCountry) return 'free';
  
  // Check Schengen — if both are Schengen, always free
  if (SCHENGEN_COUNTRIES.includes(passportCountry) && SCHENGEN_COUNTRIES.includes(destinationCountry)) {
    return 'free';
  }

  const passportData = PASSPORT_GROUPS[passportCountry];
  if (!passportData) {
    // Unknown passport — assume visa required for most, free for Schengen if EU
    return 'visa';
  }

  if (passportData.free.includes(destinationCountry)) return 'free';
  if (passportData.evisa.includes(destinationCountry)) return 'evisa';
  return 'visa';
};

/**
 * Get all visa-free and eVisa destinations for a passport
 */
export const getAccessibleCountries = (passportCountry: string): { free: string[]; evisa: string[] } => {
  const data = PASSPORT_GROUPS[passportCountry];
  if (!data) return { free: SCHENGEN_COUNTRIES, evisa: [] };
  return data;
};
