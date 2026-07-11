// Affiliate program signup data — from the DEV-350 31-brand regional sourcing
// research (2026-07-11, adversarially verified). Keyed by brand; signupUrl is
// the real program application page (CJ / Impact / Awin / Rakuten / UpPromote /
// Shopify Collabs / in-house). Brands with hasProgram:false have no verifiable
// publisher program — fall back to Amazon Associates or contact the brand.
export interface AffiliateProgram {
  network: string;
  signupUrl: string;
  commission: string;
  hasProgram: boolean;
}

export const AFFILIATE_PROGRAMS: Record<string, AffiliateProgram> = {
  'Amazon Associates': { network: 'Amazon Associates (Amazon-only)', signupUrl: 'https://affiliate-program.amazon.com/signup', commission: 'Standard category rates', hasProgram: true },
  'Ancestral Supplements': { network: 'SuperFiliate (brand-run)', signupUrl: 'https://ancestralsl.superfiliate.com/portal/sign-up', commission: '25% per sale + 15% tier', hasProgram: true },
  'Ancient Organics': { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Blueprint': { network: 'In-house referral (store credit); Amazon fallback', signupUrl: 'https://affiliate-program.amazon.com/signup', commission: 'No cash commission', hasProgram: false },
  'BodyBio': { network: 'In-house via Superfiliate', signupUrl: 'https://bodybioinc.superfiliate.com/portal/sign-up', commission: '20% commission', hasProgram: true },
  'Bragg': { network: 'CJ (Commission Junction)', signupUrl: 'https://signup.cj.com/member/signup/publisher/?cid=5787037#/branded', commission: '~7% per sale', hasProgram: true },
  'Bulletproof': { network: 'Impact', signupUrl: 'https://app.impact.com/campaign-mediapartner-signup/Bulletproof-Partner-Program.brand', commission: '~10% + bonus', hasProgram: true },
  'DiatomaceousEarth.com': { network: 'Shopify Collabs', signupUrl: 'https://www.diatomaceousearth.com/pages/collab', commission: 'Not published', hasProgram: true },
  "Doctor's Best": { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Dr. Clark Store': { network: 'UpPromote', signupUrl: 'https://af.uppromote.com/drclarkstore/register', commission: '10% of sales', hasProgram: true },
  'Dr. Mercola': { network: 'Awin (advertiser 86679)', signupUrl: 'https://ui.awin.com/publisher-signup/us/awin?advertiser=86679', commission: '10%, 15-day cookie', hasProgram: true },
  'Enzymedica': { network: 'Impact', signupUrl: 'https://app.impact.com/signup/none/create-new-mediapartner-account-flow.ihtml?execution=e1s1#/?viewkey=signUpPreStart', commission: 'Up to 15%, 45-day cookie', hasProgram: true },
  'Gaia Herbs': { network: 'CJ (advertiser 5273951)', signupUrl: 'https://signup.cj.com/member/signup/publisher/?cid=5273951', commission: '~4%, 45-day cookie', hasProgram: true },
  'Garden of Life': { network: 'FlexOffers (US) / AWIN (intl)', signupUrl: 'https://publisherprobeta.flexoffers.com/signup/accountInfo', commission: '8%, 30-day cookie', hasProgram: true },
  'Herb Pharm': { network: 'Shopify Collabs', signupUrl: 'https://api.collabs.shopify.com/creator/signup/community_application/QlYMVDzAWTA?origin=THEME_EXTENSION', commission: 'Not published', hasProgram: true },
  'Kettle & Fire': { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Life Extension': { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Lucy Bee': { network: 'In-house (Typeform)', signupUrl: 'https://form.typeform.com/to/YNrWYH4w', commission: 'Not published', hasProgram: true },
  'Mixsoon': { network: 'UpPromote', signupUrl: 'https://af.uppromote.com/mixsoonstore/register', commission: '10–15% tiered', hasProgram: true },
  'Momentous': { network: 'Current (current.tech)', signupUrl: 'https://momentous.current.tech/join', commission: '15% on all sales', hasProgram: true },
  'NOW Foods': { network: 'No program; Amazon / iHerb fallback', signupUrl: 'https://affiliate-program.amazon.com/signup', commission: 'Via marketplace', hasProgram: false },
  'Nordic Naturals': { network: 'Rakuten Advertising', signupUrl: 'https://signup.linkshare.com/publishers/registration/landing?mid=52977', commission: 'Rate on approval', hasProgram: true },
  'Nutiva': { network: 'No program; Amazon fallback', signupUrl: 'https://affiliate-program.amazon.com/signup', commission: 'Via marketplace', hasProgram: false },
  'Quicksilver Scientific': { network: 'Impact', signupUrl: 'https://app.impact.com/campaign-campaign-info-v2/Quicksilver-Scientific.brand', commission: 'Per brand page', hasProgram: true },
  'Sky Organics': { network: 'In-house (email)', signupUrl: 'https://skyorganics.com/pages/contact-us', commission: 'Not published', hasProgram: true },
  'Solaray': { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Swanson': { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Thorne': { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Traditional Medicinals': { network: 'FlexOffers', signupUrl: 'https://publisherprobeta.flexoffers.com/signup/accountInfo?aid=241341', commission: '5%, 30-day cookie', hasProgram: true },
  'Transparent Labs': { network: '', signupUrl: '', commission: '', hasProgram: false },
  'Tre Lune': { network: 'Wholesale/stockist only', signupUrl: '', commission: 'No affiliate program', hasProgram: false },
  'Tru Niagen': { network: 'Impact', signupUrl: 'https://app.impact.com/campaign-promo-signup/Tru-Niagen.brand', commission: 'Up to 5–10%', hasProgram: true },
  'iHerb': { network: 'Partnerize / Impact / CJ / Awin', signupUrl: 'https://join.partnerize.com/iherbaffiliate', commission: '5% default, 10% new-partner', hasProgram: true },
};

export const AMAZON_ASSOCIATES = 'https://affiliate-program.amazon.com/signup';

// Derive the affiliate brand from a kit-item title (mirrors the mobile app's
// affiliate rows: "Gaia Herbs Milk Thistle Seed (Organic)" → "Gaia Herbs").
const BRAND_MATCHERS: [RegExp, string][] = [
  [/bragg/i, 'Bragg'], [/nutiva/i, 'Nutiva'], [/tre ?lune|self heal by design|book bundle|wild yam|castor/i, 'Tre Lune'],
  [/garden of life/i, 'Garden of Life'], [/nordic/i, 'Nordic Naturals'], [/mercola/i, 'Dr. Mercola'],
  [/niagen/i, 'Tru Niagen'], [/momentous/i, 'Momentous'], [/enzymedica/i, 'Enzymedica'], [/bodybio/i, 'BodyBio'],
  [/quicksilver/i, 'Quicksilver Scientific'], [/gaia/i, 'Gaia Herbs'], [/herb ?pharm/i, 'Herb Pharm'],
  [/traditional medicinals/i, 'Traditional Medicinals'], [/\bnow\b/i, 'NOW Foods'], [/sky organics/i, 'Sky Organics'],
  [/ancestral/i, 'Ancestral Supplements'], [/dr\.? clark|wormwood/i, 'Dr. Clark Store'],
  [/diatomaceous/i, 'DiatomaceousEarth.com'], [/bulletproof/i, 'Bulletproof'], [/blueprint/i, 'Blueprint'],
  [/mixsoon/i, 'Mixsoon'], [/lucy bee/i, 'Lucy Bee'], [/thorne/i, 'Thorne'], [/life extension/i, 'Life Extension'],
  [/solaray/i, 'Solaray'], [/swanson/i, 'Swanson'], [/doctor'?s best/i, "Doctor's Best"],
  [/transparent labs/i, 'Transparent Labs'], [/ancient organics/i, 'Ancient Organics'], [/kettle/i, 'Kettle & Fire'],
];

export function brandForTitle(title: string | null | undefined): string {
  const t = title || '';
  for (const [re, brand] of BRAND_MATCHERS) if (re.test(t)) return brand;
  return t.split('—')[0].split('(')[0].trim() || 'Unknown';
}

export function programFor(brand: string): AffiliateProgram {
  return AFFILIATE_PROGRAMS[brand] || { network: 'No program found — use Amazon Associates or contact the brand.', signupUrl: AMAZON_ASSOCIATES, commission: '', hasProgram: false };
}
