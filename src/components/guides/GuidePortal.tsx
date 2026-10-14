import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ChevronRight, FileText, HeartPulse, LogOut,
  Mail, Package, Plus, Salad, Sparkles, Users, Globe2, Loader2,
  Upload, Check, Instagram, Youtube, Link2, AtSign, Route, CalendarDays, Download,
  MoreHorizontal, FolderOpen, Trash2, ExternalLink, Hammer, PencilRuler, Blocks, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProtocolEditor } from '../admin/ProtocolEditor';
import { RoutineMark } from '../Header';
import { APP_STORE_URL } from '../../config/appLinks';
import { buildProtocolWithAI, createProtocol, createProtocolItem, listProtocols, type AdminProtocol } from '../../utils/protocolAdmin';
import {
  createGuideLead, createGuideOffer, createGuideRecipe, createGuideValueRamp, getGuideProfile, getGuideProfileBySlug,
  importGuideProfile, listGuideLeads, listGuideOffers, listGuideRecipes, listGuideValueRamps, listPublicGuideProfiles, saveGuideProfile, submitGuardianSuggestion, submitGuardianOptIn,
  createGuideLibraryFolder, createGuideLibraryItem, deleteGuideLibraryItem, getGuideFileDownloadUrl,
  listGuideLibraryFolders, listGuideLibraryItems, replaceGuideBrands, updateGuideRecipe, uploadGuideFile, uploadGuideImage,
  type GuideBrand, type GuideLead, type GuideLibraryFolder, type GuideLibraryItem, type GuideOffer, type GuideProfile, type GuideRecipe,
  type GuideValueRamp, type ImportedGuideProfile,
} from '../../utils/guidePortal';

const ink = '#F5F2EA';
const muted = '#B8B6AF';
const line = 'rgba(245,242,234,0.24)';
const black = '#090A08';
const panel = '#11120F';
const acid = '#C7D8A3';
// Match AS-TRO's rendered guide route: Canela for editorial display and
// Euclid Circular A for interface and body copy.
const serif = '"CanelaText", "Canela Text", Georgia, serif';
const sans = '"EuclidCircularA", "DM Sans", "Helvetica Neue", Arial, sans-serif';
function themeFont(name: string) {
  if (name === 'Archivo') return '"Archivo", sans-serif';
  if (name === 'Inter') return '"Inter", sans-serif';
  if (name === 'Fraunces') return '"Fraunces", Georgia, serif';
  if (name === 'Instrument Serif') return '"Instrument Serif", Georgia, serif';
  if (name === 'DM Sans') return '"DM Sans", sans-serif';
  if (name === 'Poppins') return '"Poppins", sans-serif';
  if (name === 'Georgia') return 'Georgia, serif';
  if (name === 'Euclid') return sans;
  return serif;
}

function parseExpertiseTags(value?: string) {
  return (value || '').split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
}

function customerFacingOfferTitle(value: string) {
  return value.replace(/^R3\s+Protocol\s*>\s*/i, '').trim();
}

function offerTitleSize(value: string) {
  const length = customerFacingOfferTitle(value).length;
  if (length > 54) return 'clamp(30px,4vw,52px)';
  if (length > 34) return 'clamp(36px,5vw,62px)';
  return 'clamp(42px,6vw,76px)';
}

function ExpertiseTags({ tags, color = '#667245', compact = false }: { tags: string[]; color?: string; compact?: boolean }) {
  if (!tags.length) return null;
  return <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: compact ? 5 : 7, margin: compact ? '0 0 11px' : '0 0 18px' }}>
    {tags.map((tag) => <span key={tag} style={{ border: `1px solid ${color}66`, borderRadius: 999, color, padding: compact ? '4px 7px' : '6px 10px', fontSize: compact ? 6.5 : 9, fontWeight: 700, letterSpacing: '.055em', textTransform: 'uppercase', background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(5px)' }}>{tag}</span>)}
  </div>;
}

type Tab = 'home' | 'profile' | 'library' | 'leads' | 'value_ramps' | 'offer_builder' | 'recipes' | 'protocols';
type FreeOfferKind = 'ebook' | 'one_to_one_call' | 'group_call' | 'recipe_book' | 'routine';
type UpsellKind = 'ebook' | 'routine' | 'routine_guidance' | 'recipe_book' | 'group_call' | 'one_to_one_call' | 'in_person' | 'festival';
type DeliveryFormat = 'Downloadable PDF' | 'Interactive Protocol' | 'PDF + Interactive Protocol' | 'Live online' | 'In person' | 'Event';
type BookingProvider = 'ROUTINE³ Booking' | 'Cal.com' | 'Google appointment schedule' | 'Calendly' | 'Other';
type StoryTemplateId = 'editorial' | 'ritual' | 'human' | 'clinical' | 'kitchen' | 'night' | 'coastal' | 'movement' | 'collage' | 'herbal' | 'future' | 'community';
type CurrencyCode = 'GBP' | 'EUR' | 'USD' | 'PLN' | 'CAD' | 'AUD' | 'NZD' | 'CHF' | 'JPY' | 'INR' | 'AED' | 'ZAR' | 'BRL' | 'MXN' | 'SEK' | 'NOK' | 'DKK' | 'CZK';
type BrandDraft = Omit<GuideBrand, 'id' | 'guide_id' | 'is_primary'> & { localId: string };
type GuardianOfferGoal = 'audience' | 'sell';
type HeaderStyle = 'white' | 'hidden';
type OfferNextStep = 'builder' | 'link' | 'video' | 'booking';
type BillingModel = 'one_time' | 'subscription' | 'pack_10';

const targetAgeRanges: Record<string, string[]> = {
  Everyone: ['All ages', 'Children 0–5', 'Children 6–12', 'Teens 13–17', 'Adults 18–24', 'Adults 25–44', 'Adults 45–64', 'Adults 65+'],
  Women: ['All ages', 'Girls 0–12', 'Teens 13–17', 'Women 18–24', 'Women 25–44', 'Women 45–64', 'Women 65+'],
  Men: ['All ages', 'Boys 0–12', 'Teens 13–17', 'Men 18–24', 'Men 25–44', 'Men 45–64', 'Men 65+'],
  Children: ['All childhood', 'Infants 0–1', 'Toddlers 1–3', 'Children 4–8', 'Children 9–12', 'Teens 13–17'],
};
const targetLifeStages: Record<string, string[]> = {
  Everyone: ['Not specified', 'Early life', 'Adolescence', 'Young adulthood', 'Midlife', 'Healthy ageing'],
  Women: ['Not specified', 'Childhood', 'Puberty', 'Reproductive years', 'Preconception', 'Pregnancy', 'Postpartum', 'Premenopause', 'Perimenopause', 'Menopause', 'Postmenopause', 'Healthy ageing'],
  Men: ['Not specified', 'Childhood', 'Puberty', 'Reproductive years', 'Preconception and fertility', 'Fatherhood', 'Midlife', 'Andropause', 'Healthy ageing'],
  Children: ['Not specified', 'Infancy', 'Toddler years', 'Early childhood', 'Middle childhood', 'Puberty', 'Adolescence'],
};

const pricingRegions: { region: string; currency: CurrencyCode; label: string }[] = [
  { region: 'United Kingdom', currency: 'GBP', label: '🇬🇧 UK · Pound' },
  { region: 'Eurozone', currency: 'EUR', label: '🇪🇺 Eurozone · Euro' },
  { region: 'United States', currency: 'USD', label: '🇺🇸 US · Dollar' },
  { region: 'Poland', currency: 'PLN', label: '🇵🇱 Poland · Złoty' },
  { region: 'Canada', currency: 'CAD', label: '🇨🇦 Canada · Dollar' },
  { region: 'Australia', currency: 'AUD', label: '🇦🇺 Australia · Dollar' },
  { region: 'New Zealand', currency: 'NZD', label: '🇳🇿 New Zealand · Dollar' },
  { region: 'Switzerland', currency: 'CHF', label: '🇨🇭 Switzerland · Franc' },
  { region: 'Japan', currency: 'JPY', label: '🇯🇵 Japan · Yen' },
  { region: 'India', currency: 'INR', label: '🇮🇳 India · Rupee' },
  { region: 'United Arab Emirates', currency: 'AED', label: '🇦🇪 UAE · Dirham' },
  { region: 'South Africa', currency: 'ZAR', label: '🇿🇦 South Africa · Rand' },
  { region: 'Brazil', currency: 'BRL', label: '🇧🇷 Brazil · Real' },
  { region: 'Mexico', currency: 'MXN', label: '🇲🇽 Mexico · Peso' },
  { region: 'Sweden', currency: 'SEK', label: '🇸🇪 Sweden · Krona' },
  { region: 'Norway', currency: 'NOK', label: '🇳🇴 Norway · Krone' },
  { region: 'Denmark', currency: 'DKK', label: '🇩🇰 Denmark · Krone' },
  { region: 'Czech Republic', currency: 'CZK', label: '🇨🇿 Czechia · Koruna' },
];
function defaultPricingRegion() {
  if (typeof navigator === 'undefined') return pricingRegions[0];
  const country = (navigator.language.split('-')[1] || '').toUpperCase();
  const regionByCountry: Record<string, string> = { GB: 'United Kingdom', US: 'United States', PL: 'Poland', CA: 'Canada', AU: 'Australia', NZ: 'New Zealand', CH: 'Switzerland', JP: 'Japan', IN: 'India', AE: 'United Arab Emirates', ZA: 'South Africa', BR: 'Brazil', MX: 'Mexico', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', CZ: 'Czech Republic' };
  const euroCountries = ['AT','BE','HR','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU','MT','NL','PT','SK','SI','ES'];
  const region = euroCountries.includes(country) ? 'Eurozone' : regionByCountry[country];
  return pricingRegions.find((option) => option.region === region) || pricingRegions[2];
}
function formatMoney(value: number | string, currency: string = 'GBP') {
  const amount = Number(value || 0);
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount); }
  catch { return `${currency} ${amount}`; }
}
function currencySymbol(currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find((part) => part.type === 'currency')?.value || currency; }
  catch { return currency; }
}
const billingLabels: Record<BillingModel, { title: string; suffix: string; note: string }> = {
  one_time: { title: 'One-time', suffix: '', note: 'One payment for this offer' },
  subscription: { title: 'Subscription', suffix: '/ month', note: 'Recurring guidance and ongoing support' },
  pack_10: { title: '10-session pack', suffix: '/ 10 sessions', note: 'Prepaid bundle of ten sessions' },
};
const offerValueScores: Record<UpsellKind, number> = {
  ebook: 2,
  recipe_book: 3,
  routine: 3,
  routine_guidance: 4,
  one_to_one_call: 4,
  group_call: 5,
  in_person: 5,
  festival: 5,
};
function CustomerValueStars({ score, compact = false, mutedState = false }: { score: number; compact?: boolean; mutedState?: boolean }) {
  return <span aria-label={`${score} out of 5 for customer value`} title={`${score} out of 5 for customer value`} style={{ display: 'flex', alignItems: 'center', gap: compact ? 3 : 5 }}>
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 1, fontSize: compact ? 10 : 12 }}>{Array.from({ length: 5 }, (_, index) => <span key={index} style={{ color: mutedState ? muted : index < score ? acid : 'rgba(199,216,163,.24)' }}>{index < score ? '★' : '☆'}</span>)}</span>
    <span style={{ color: mutedState ? muted : ink, fontSize: compact ? 8 : 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Value</span>
  </span>;
}
function R3CreatorBenefitArt({ index, size = 58 }: { index: number; size?: number }) {
  const width = size * (2172 / 7 / 724);
  return <span aria-hidden="true" style={{ display: 'block', width, height: size, flex: `0 0 ${width}px`, backgroundImage: 'url(/images/guides/r3-creator-benefits-v1.png)', backgroundRepeat: 'no-repeat', backgroundSize: '700% 100%', backgroundPosition: `${index * 100 / 6}% 50%`, filter: 'grayscale(1) contrast(1.04)' }} />;
}
function readableText(background: string) {
  const value = background.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#11120F';
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((part) => parseInt(part, 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#11120F' : '#FFFFFF';
}

const storyTemplates: { id: StoryTemplateId; name: string; style: string; description: string; image: string; heading: string; body: string; page: string; accent: string; header: string; treatment: 'color' | 'greyscale' }[] = [
  { id: 'editorial', name: 'The Path', style: 'Modern editorial', description: 'Clean, direct and structured.', image: '/images/guides/templates/editorial-path.jpg', heading: 'Archivo', body: 'Inter', page: '#F2EFE7', accent: '#667245', header: 'white', treatment: 'greyscale' },
  { id: 'ritual', name: 'The Ritual', style: 'Botanical serif', description: 'Reflective, tactile and soulful.', image: '/images/guides/templates/botanical-ritual.jpg', heading: 'Fraunces', body: 'Instrument Serif', page: '#ECE9E0', accent: '#A56B48', header: 'tone', treatment: 'greyscale' },
  { id: 'human', name: 'The Guide', style: 'Humanist', description: 'Expressive, warm and personal.', image: '/images/guides/templates/human-guide.jpg', heading: 'Fraunces', body: 'Inter', page: '#F4F0E8', accent: '#667245', header: 'white', treatment: 'color' },
  { id: 'clinical', name: 'The Clarity', style: 'Clinical minimal', description: 'Bright, precise and evidence-led.', image: '/images/guides/templates/clinical-light.webp', heading: 'Archivo', body: 'DM Sans', page: '#F4F9FB', accent: '#39768A', header: 'white', treatment: 'color' },
  { id: 'kitchen', name: 'The Table', style: 'Culinary warmth', description: 'Sunlit, practical and nourishing.', image: '/images/guides/templates/sunlit-kitchen.webp', heading: 'Fraunces', body: 'DM Sans', page: '#F7EFE2', accent: '#A45128', header: 'tone', treatment: 'color' },
  { id: 'night', name: 'The Stillness', style: 'Nocturnal luxury', description: 'Quiet, focused and immersive.', image: '/images/guides/templates/night-focus.webp', heading: 'Instrument Serif', body: 'Inter', page: '#E8E1D7', accent: '#7B4B2A', header: 'black', treatment: 'color' },
  { id: 'coastal', name: 'The Horizon', style: 'Coastal calm', description: 'Open, restorative and spacious.', image: '/images/guides/templates/coastal-air.webp', heading: 'Instrument Serif', body: 'DM Sans', page: '#EEF3F2', accent: '#426978', header: 'white', treatment: 'color' },
  { id: 'movement', name: 'The Practice', style: 'Movement studio', description: 'Grounded, physical and disciplined.', image: '/images/guides/templates/movement-studio.webp', heading: 'Poppins', body: 'Inter', page: '#F0E8DC', accent: '#85613D', header: 'tone', treatment: 'color' },
  { id: 'collage', name: 'The Spark', style: 'Graphic collage', description: 'Bold, artistic and memorable.', image: '/images/guides/templates/paper-collage.webp', heading: 'Archivo', body: 'DM Sans', page: '#F5F0E6', accent: '#16449A', header: 'black', treatment: 'color' },
  { id: 'herbal', name: 'The Apothecary', style: 'Earth and herb', description: 'Rooted, expert and traditional.', image: '/images/guides/templates/earth-herbal.webp', heading: 'Fraunces', body: 'Instrument Serif', page: '#EEE7D9', accent: '#4F6434', header: 'black', treatment: 'color' },
  { id: 'future', name: 'The Future', style: 'Soft technology', description: 'Progressive, fluid and intelligent.', image: '/images/guides/templates/future-calm.webp', heading: 'Archivo', body: 'Poppins', page: '#EDF7F3', accent: '#327B70', header: 'tone', treatment: 'color' },
  { id: 'community', name: 'The Gathering', style: 'Community warmth', description: 'Welcoming, shared and generous.', image: '/images/guides/templates/community-table.webp', heading: 'Fraunces', body: 'DM Sans', page: '#F5EBDD', accent: '#9A5B3B', header: 'tone', treatment: 'color' },
];

const defaultAvatars = [
  { name: 'Guardian', image: '/images/guides/avatars/guardian.png' },
  { name: 'Woman', image: '/images/guides/avatars/woman.png' },
  { name: 'Man', image: '/images/guides/avatars/man.png' },
  { name: 'Grandmother', image: '/images/guides/avatars/grandmother.png' },
  { name: 'Grandfather', image: '/images/guides/avatars/grandfather.png' },
];

const bookingProviders: { value: BookingProvider; label: string; placeholder: string }[] = [
  { value: 'ROUTINE³ Booking', label: 'R3 Booking', placeholder: 'https://routine3.com/book/yourname' },
  { value: 'Cal.com', label: 'Cal.com', placeholder: 'https://cal.com/yourname' },
  { value: 'Google appointment schedule', label: 'Google Calendar', placeholder: 'https://calendar.app.google/your-booking-page' },
  { value: 'Calendly', label: 'Calendly', placeholder: 'https://calendly.com/yourname' },
  { value: 'Other', label: 'Other', placeholder: 'https://yourwebsite.com/book' },
];
const languageOptions = [
  { name: 'English', code: 'en', flag: '🇬🇧' }, { name: 'Polish', code: 'pl', flag: '🇵🇱' }, { name: 'Spanish', code: 'es', flag: '🇪🇸' },
  { name: 'French', code: 'fr', flag: '🇫🇷' }, { name: 'German', code: 'de', flag: '🇩🇪' }, { name: 'Italian', code: 'it', flag: '🇮🇹' },
  { name: 'Portuguese', code: 'pt', flag: '🇵🇹' }, { name: 'Dutch', code: 'nl', flag: '🇳🇱' }, { name: 'Arabic', code: 'ar', flag: '🇦🇪' },
];
function defaultLanguage() {
  if (typeof navigator === 'undefined') return 'English';
  const code = navigator.language.split('-')[0].toLowerCase();
  return languageOptions.find((language) => language.code === code)?.name || 'English';
}

const freeValueSuggestions: Record<FreeOfferKind, string> = {
  ebook: 'Learn one useful method they can apply today.',
  one_to_one_call: 'Leave with clarity on the right next step for their goal.',
  group_call: 'Join a useful weekly conversation, ask questions and learn alongside people working towards the same goal.',
  recipe_book: 'Make practical recipes they can use immediately.',
  routine: 'Follow a simple routine and experience an early result.',
};

const nextStepLabels: Record<OfferNextStep, { title: string; note: string }> = {
  builder: { title: 'Build in ROUTINE³', note: 'Create an editable Recipe or Protocol' },
  link: { title: 'Open offer page', note: 'Send them to a page or checkout' },
  video: { title: 'Watch a video', note: 'Open a YouTube, Vimeo or hosted video' },
  booking: { title: 'Book a session', note: 'Use your booking calendar' },
};

const deliveryFormats: { value: DeliveryFormat; note: string; image: string }[] = [
  { value: 'Downloadable PDF', note: 'Download, save or print', image: '/images/guides/delivery/physical-pdf.png' },
  { value: 'Interactive Protocol', note: 'Follow and check off each step', image: '/images/guides/delivery/digital-app.png' },
  { value: 'PDF + Interactive Protocol', note: 'Downloadable guide with interactive steps', image: '/images/guides/delivery/physical-digital.png' },
  { value: 'Live online', note: 'Video call or live room', image: '/images/guides/delivery/live-online.png' },
  { value: 'In person', note: 'Private physical session', image: '/images/guides/delivery/in-person.png' },
  { value: 'Event', note: 'Shared physical experience', image: '/images/guides/delivery/event.png' },
];

function suggestedDelivery(kind: FreeOfferKind | UpsellKind): DeliveryFormat {
  if (kind === 'routine_guidance') return 'Interactive Protocol';
  if (kind === 'routine') return 'PDF + Interactive Protocol';
  if (kind === 'one_to_one_call' || kind === 'group_call') return 'Live online';
  if (kind === 'in_person') return 'In person';
  if (kind === 'festival') return 'Event';
  return 'Downloadable PDF';
}

const specialtyGroups = {
  Body: ['Nutrition', 'Fitness', 'Wellness', 'Yoga', 'Somatic work', 'Sleep', 'Skin', 'Gut health', 'Family health', 'Longevity', 'Breathwork'],
  Mind: ['Psychology', 'Stress', 'Focus', 'Habits', 'Confidence', 'Relationships', 'Emotional wellbeing', 'Mindfulness', 'Coaching'],
  Soul: ['Human Design', 'Astrology', 'Tarot', 'Numerology', 'Meditation', 'Spiritual practice', 'Reiki', 'Energy work', 'Sound healing', 'Purpose', 'Journaling', 'Rituals', 'Life transitions', 'Breathwork'],
} as const;
type GuideRealm = keyof typeof specialtyGroups;

const realmImages: Record<GuideRealm, string> = {
  Body: '/images/guides/body-realm.png',
  Mind: '/images/guides/mind-realm.png',
  Soul: '/images/guides/soul-realm.png',
};
const specialties = Array.from(new Set(Object.values(specialtyGroups).flat()));
const specialtyHelp: Record<string, string> = {
  Nutrition: 'Food choices and eating plans', Fitness: 'Movement, strength and mobility', Wellness: 'Everyday health and balance', Yoga: 'Movement, flexibility and presence',
  'Somatic work': 'Body awareness and regulation', Sleep: 'Rest, recovery and sleep habits', Skin: 'Skin routines and practical care', 'Gut health': 'Digestion and food support',
  'Family health': 'Healthy routines for families', Longevity: 'Habits for a longer healthy life', Breathwork: 'Breathing practices and regulation',
  Psychology: 'Understand thoughts and behaviour', Stress: 'Reduce pressure and restore calm', Focus: 'Attention, clarity and deep work', Habits: 'Build actions that last',
  Confidence: 'Self-trust and personal growth', Relationships: 'Communication and connection', 'Emotional wellbeing': 'Process feelings with care', Mindfulness: 'Awareness and grounded attention', Coaching: 'Clarity, accountability and action',
  'Human Design': 'Understand personal energy and choices', Astrology: 'Cycles, patterns and self-reflection', Tarot: 'Reflection and intuitive direction', Numerology: 'Meaning through numbers and cycles',
  Meditation: 'Stillness, awareness and presence', 'Spiritual practice': 'Meaningful everyday devotion', Reiki: 'Energy balance and relaxation', 'Energy work': 'Awareness, alignment and release',
  'Sound healing': 'Restoration through sound', Purpose: 'Direction, meaning and contribution', Journaling: 'Reflection and written clarity', Rituals: 'Intentional practices for change',
  'Life transitions': 'Support through personal change',
};
const specialtyOutcomes: Record<string, string> = {
  Nutrition: 'Eat with more confidence', Fitness: 'Build strength you can sustain', Wellness: 'Feel better in your everyday life', Yoga: 'Move with greater ease and awareness',
  'Somatic work': 'Feel safer and more at home in your body', Sleep: 'Sleep deeply and wake restored', Skin: 'Build a skin routine that works', 'Gut health': 'Support calmer, more comfortable digestion',
  'Family health': 'Create healthier rhythms for the whole family', Longevity: 'Build habits for a longer, healthier life', Breathwork: 'Use your breath to find calm and energy',
  Psychology: 'Understand your patterns and move forward', Stress: 'Feel calmer when life gets demanding', Focus: 'Protect your attention and think clearly', Habits: 'Turn good intentions into lasting habits',
  Confidence: 'Trust yourself and act with confidence', Relationships: 'Build stronger, more honest relationships', 'Emotional wellbeing': 'Meet difficult feelings with more ease', Mindfulness: 'Feel present, grounded and clear', Coaching: 'Turn clarity into meaningful action',
  'Human Design': 'Make decisions that fit your natural design', Astrology: 'Use your patterns and cycles with purpose', Tarot: 'Find clarity through guided reflection', Numerology: 'Understand the patterns shaping your path',
  Meditation: 'Create more stillness and clarity', 'Spiritual practice': 'Build a spiritual practice that feels true', Reiki: 'Restore balance and deep relaxation', 'Energy work': 'Release what feels stuck and restore balance',
  'Sound healing': 'Settle your nervous system through sound', Purpose: 'Find direction and live with more meaning', Journaling: 'Turn reflection into personal clarity', Rituals: 'Create rituals that support real change',
  'Life transitions': 'Move through change with clarity and support',
};

function guardianHeadline(topic: string, audiences: string[]) {
  const matchedTopic = Object.keys(specialtyOutcomes).find((key) => key.toLowerCase() === topic.toLowerCase());
  const outcome = matchedTopic ? specialtyOutcomes[matchedTopic] : `Feel better with practical ${topic.toLowerCase()} guidance`;
  const audience = audiences.length === 1 && audiences[0] !== 'Everyone' ? ` for ${audiences[0].toLowerCase()}` : '';
  return `${outcome}${audience}.`;
}
function guardianHeadlineSuggestions(topics: string[], audiences: string[]) {
  const topic = topics[0] || 'Wellness';
  const secondTopic = topics[1];
  const outcome = (specialtyOutcomes[topic] || `Feel better with practical ${topic.toLowerCase()} guidance`).replace(/\.$/, '');
  const outcomeLower = outcome.charAt(0).toLowerCase() + outcome.slice(1);
  const topicLower = topic.toLowerCase();
  const audience = audiences.length === 1 && audiences[0] !== 'Everyone' ? audiences[0].toLowerCase() : 'everyday life';
  const combined = secondTopic ? `${topicLower} and ${secondTopic.toLowerCase()}` : topicLower;
  return Array.from(new Set([
    guardianHeadline(topic, audiences),
    `${outcome}.`,
    `A practical path to ${outcomeLower}.`,
    `${outcome} in a way that lasts.`,
    `Make ${topicLower} work for your everyday life.`,
    `Build a ${topicLower} practice you can keep.`,
    `Simple ${topicLower}. Meaningful change.`,
    `A clearer way to approach ${topicLower}.`,
    `Turn ${topicLower} insight into daily action.`,
    `Feel supported at every step of your ${topicLower} journey.`,
    `Small ${topicLower} steps. Lasting results.`,
    `Your practical guide to better ${topicLower}.`,
    `Find what works for your body and your life.`,
    `Move from knowing to doing.`,
    `Build confidence through practical ${topicLower}.`,
    `Create everyday habits that help you thrive.`,
    `Make space for the change you need.`,
    `Feel clearer, stronger and more supported.`,
    `A grounded approach to ${combined}.`,
    `Personal guidance for real everyday change.`,
    `Start where you are. Build what works.`,
    `Support designed around you.`,
    `Practical guidance for ${audience}.`,
    `A better rhythm for your everyday life.`,
    `Turn good intentions into a practice that lasts.`,
    `Discover the next step that fits you.`,
    `Learn what helps. Keep what works.`,
    `Feel more capable in your everyday life.`,
    `Build your path with clarity and confidence.`,
    `Your next chapter starts with one useful step.`,
    `Guidance that meets you where you are.`,
  ])).slice(0, 30);
}
const nav: { id: Tab; label: string; Icon: typeof Users }[] = [
  { id: 'home', label: 'Overview', Icon: Sparkles },
  { id: 'library', label: 'Library', Icon: FolderOpen },
  { id: 'leads', label: 'Leads', Icon: Users },
  { id: 'value_ramps', label: 'Value Ramps', Icon: Route },
  { id: 'offer_builder', label: 'Offer Builder', Icon: Package },
  { id: 'recipes', label: 'Recipes', Icon: Salad },
  { id: 'protocols', label: 'Protocols', Icon: HeartPulse },
  { id: 'profile', label: 'Profile', Icon: FileText },
];

const guidePlates: Record<string, string> = {
  home: '/images/guides/guide-plate.png',
  profile: '/images/guides/guide-plate.png',
  leads: '/images/guides/lead-plate.png',
  value_ramps: '/images/guides/offer-plate.png',
  offer_builder: '/images/guides/build-plate.png',
  recipes: '/images/guides/build-plate.png',
  protocols: '/images/guides/build-plate.png',
  library: '/images/guides/build-plate.png',
};

const input: React.CSSProperties = {
  width: '100%', height: 46, boxSizing: 'border-box', border: `1px solid ${line}`,
  background: '#0D0E0C', color: ink, borderRadius: 2, padding: '0 13px',
  fontFamily: sans, fontSize: 14, outline: 'none',
};
const label: React.CSSProperties = { display: 'block', color: muted, fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, lineHeight: 1.35 };
// Homepage-style CTA: a label cell joined to a solid button on one shared seam.
function CtaLockup({ href, label, action, dark = false }: { href: string; label: string; action: string; dark?: boolean }) {
  const edge = dark ? '#11120F' : '#FFFFFF';
  const cell: React.CSSProperties = { height: 42, boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', fontFamily: '"Archivo", "Inter", sans-serif', fontSize: 11, fontWeight: 600, border: `1px solid ${edge}` };
  return (
    <a href={href} style={{ display: 'inline-flex', marginTop: 26, textDecoration: 'none', maxWidth: '100%' }}>
      <span style={{ ...cell, padding: '0 14px', letterSpacing: '0.04em', color: edge, background: dark ? 'rgba(17,18,15,0.06)' : 'rgba(255,255,255,0.16)', borderRight: 'none', borderRadius: '2px 0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <span style={{ ...cell, padding: '0 16px', gap: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: dark ? '#FFFFFF' : '#16140F', background: edge, borderRadius: '0 2px 2px 0', whiteSpace: 'nowrap' }}>{action} <ArrowRight size={13} /></span>
    </a>
  );
}

const btn: React.CSSProperties = { minHeight: 44, border: `1px solid ${line}`, background: ink, color: black, padding: '0 18px', borderRadius: 4, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, lineHeight: 1.2 };
const compactControl: React.CSSProperties = { height: 40, fontSize: 11, fontWeight: 600, lineHeight: 1.2 };
const titleHighlight: React.CSSProperties = { display: 'inline', width: 'fit-content', background: 'rgba(245,242,234,.82)', color: black, padding: '3px 7px 4px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' };

interface TagArt { src: string; cols: number; rows: number; index: number; cellAspect: number }
const atlas = (src: string, cols: number, rows: number, labels: readonly string[], cellAspect = 1) => Object.fromEntries(labels.map((name, index) => [name, { src, cols, rows, index, cellAspect } as TagArt]));
function InventoryThumb({ art }: { art: TagArt }) {
  const col = art.index % art.cols;
  const row = Math.floor(art.index / art.cols);
  return <span aria-hidden="true" style={{ width: 54, height: 54, flex: '0 0 54px', backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${art.cols === 1 ? 0 : col * 100 / (art.cols - 1)}% ${art.rows === 1 ? 0 : row * 100 / (art.rows - 1)}%`, filter: 'grayscale(1) contrast(.96)' }} />;
}
function SelectCard({ orientation, eyebrow, title, copy, art, active, recommended = false, onClick }: { orientation: 'vertical' | 'horizontal'; eyebrow?: string; title: string; copy: string; art: TagArt; active: boolean; recommended?: boolean; onClick: () => void }) {
  const col = art.index % art.cols;
  const row = Math.floor(art.index / art.cols);
  const iconHeight = orientation === 'vertical' ? 46 : 52;
  const icon = <span aria-hidden="true" style={{ width: iconHeight * art.cellAspect, height: iconHeight, flex: '0 0 auto', backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${art.cols === 1 ? 0 : col * 100 / (art.cols - 1)}% ${art.rows === 1 ? 0 : row * 100 / (art.rows - 1)}%`, filter: active ? 'grayscale(1) brightness(.22)' : 'grayscale(1) contrast(.94) brightness(.94)' }} />;
  const valueIcon = <span aria-hidden="true" style={{ width: 34 * art.cellAspect, height: 34, flex: '0 0 auto', backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${art.cols === 1 ? 0 : col * 100 / (art.cols - 1)}% ${art.rows === 1 ? 0 : row * 100 / (art.rows - 1)}%`, filter: active ? 'grayscale(1) brightness(.22)' : 'grayscale(1) contrast(.94) brightness(.94)' }} />;
  const formatIcon = title === 'R3 Protocol'
    ? <span aria-hidden="true" style={{ width: 45, height: 30, flex: '0 0 45px', border: `1px solid ${active ? black : ink}`, color: active ? black : ink, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '.05em' }}>R³</span>
    : icon;
  const eyebrowText = recommended ? 'Best fit' : eyebrow;
  const eyebrowNode = eyebrowText && <span style={{ display: 'block', color: active ? black : recommended ? acid : muted, fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7 }}>{eyebrowText}</span>;
  const horizontalMeta = <span style={{ minWidth: 0 }}>{eyebrowNode}<strong style={{ display: 'block', color: active ? black : ink, fontSize: 13, lineHeight: 1.3 }}>{title}</strong><span style={{ display: 'block', color: active ? 'rgba(9,10,8,.72)' : muted, fontSize: 11, lineHeight: 1.45, marginTop: 5 }}>{copy}</span></span>;
  return <button className="guardian-card" type="button" onClick={onClick} aria-pressed={active} style={{ minHeight: orientation === 'vertical' ? 220 : 92, width: '100%', border: `1px solid ${active ? ink : line}`, background: active ? ink : 'transparent', color: active ? black : ink, padding: orientation === 'vertical' ? 0 : 14, fontFamily: sans, cursor: 'pointer', textAlign: 'left', display: orientation === 'vertical' ? 'grid' : 'grid', gridTemplateRows: orientation === 'vertical' ? '1fr 1fr' : undefined, gridTemplateColumns: orientation === 'horizontal' ? '58px minmax(0,1fr)' : undefined, gap: orientation === 'horizontal' ? 12 : 0, alignItems: orientation === 'horizontal' ? 'center' : 'stretch', minWidth: 0 }}>
    {orientation === 'vertical' ? <><span style={{ minHeight: 0, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><span style={{ display: 'block', color: active ? 'rgba(9,10,8,.62)' : acid, fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 9 }}>Value{eyebrowText ? ` · ${eyebrowText}` : ''}</span><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{valueIcon}<strong style={{ display: 'block', color: active ? black : ink, fontSize: 13, lineHeight: 1.4 }}>{copy}</strong></span></span><span style={{ minHeight: 0, padding: 14, borderTop: `1px solid ${active ? 'rgba(9,10,8,.2)' : line}`, display: 'flex', alignItems: 'center', gap: 10 }}>{formatIcon}<span><span style={{ display: 'block', color: active ? 'rgba(9,10,8,.62)' : muted, fontSize: 9, fontWeight: 700, letterSpacing: '.1em', marginBottom: 4 }}>FORMAT</span><strong style={{ display: 'block', fontSize: 12 }}>{title}</strong></span></span></> : <>{icon}{horizontalMeta}</>}
  </button>;
}
const specialtyArt: Record<GuideRealm, Record<string, TagArt>> = {
  Body: atlas('/images/guides/tags/body.webp', 4, 3, specialtyGroups.Body),
  Mind: atlas('/images/guides/tags/mind.webp', 3, 3, specialtyGroups.Mind),
  Soul: atlas('/images/guides/tags/soul.webp', 5, 3, specialtyGroups.Soul),
};
const audienceArt = atlas('/images/guides/tags/audience.webp', 4, 2, ['Everyone', 'Busy families', 'Women', 'Men', 'Children', 'Athletes', 'Adults 50+']);
const supportArt = atlas('/images/guides/tags/support-v3.webp', 3, 2, ['ROUTINE³ (physical + digital)', 'Recipes', 'Group call', '1:1 online', 'In person', 'Event']);
const offerArt: Record<string, TagArt> = atlas('/images/guides/tags/offers-v2.webp', 4, 3, ['Starter guide', 'Recipe pack', 'ROUTINE³', '1:1 call', 'Group call', 'Journey', 'Event', 'eBook', 'Recipe book', 'Team program', 'Upload', 'Paid'], .75);
const offerTypeArt = atlas('/images/guides/tags/offer-types-v3.png', 4, 2, ['routine', 'ebook', 'recipe_book', 'routine_guidance', 'festival', 'group_call', 'one_to_one_call', 'in_person']);
const freeOfferArt: Record<FreeOfferKind, TagArt> = {
  ebook: offerArt.eBook,
  one_to_one_call: offerArt['1:1 call'],
  group_call: offerArt['Group call'],
  recipe_book: offerArt['Recipe pack'],
  routine: offerArt['ROUTINE³'],
};
const freeOfferImages: Record<FreeOfferKind, string> = {
  ebook: '/images/guides/generated/lead-pdf-guide-v2.webp',
  one_to_one_call: '/images/guides/generated/lead-private-call-v2.webp',
  group_call: '/images/guides/generated/lead-community-call-v2.webp',
  recipe_book: '/images/guides/generated/lead-recipes-v2.webp',
  routine: '/images/guides/generated/r3-protocol-card.png',
};
const deliveryCardArt: Record<DeliveryFormat, TagArt> = {
  'Downloadable PDF': offerArt['Starter guide'],
  'Interactive Protocol': offerArt['ROUTINE³'],
  'PDF + Interactive Protocol': supportArt['ROUTINE³ (physical + digital)'],
  'Live online': supportArt['Group call'],
  'In person': supportArt['In person'],
  Event: supportArt.Event,
};

function TagChoice({ text, description, active, art, onClick, compact = false, largeText = false, badge, tone = 'accent', checkRight = 6, showCheck = true }: { text: string; description?: string; active: boolean; art: TagArt; onClick: () => void; compact?: boolean; largeText?: boolean; badge?: string; tone?: 'accent' | 'free'; checkRight?: number; showCheck?: boolean }) {
  const col = art.index % art.cols;
  const row = Math.floor(art.index / art.cols);
  const activeBg = ink;
  const iconHeight = compact ? 42 : 52;
  const iconWidth = iconHeight * art.cellAspect;
  return <button className="guardian-card" type="button" onClick={onClick} aria-pressed={active} style={{ position: 'relative', minHeight: compact ? 76 : description ? 104 : 92, padding: badge ? '24px 12px 10px' : compact ? '8px 10px' : '10px 12px', border: `1px solid ${active ? activeBg : line}`, color: active ? black : ink, background: active ? activeBg : 'transparent', fontFamily: sans, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', minWidth: 0, overflow: 'hidden' }}>
    {badge && <span style={{ position: 'absolute', top: 6, left: 7, color: active ? black : badge === 'FREE' ? acid : '#C88A66', fontSize: 8, fontWeight: 700, letterSpacing: '.14em' }}>{badge}</span>}
    {active && showCheck && <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: checkRight, width: 18, height: 18, display: 'grid', placeItems: 'center', border: `1px solid ${black}`, background: black, color: ink }}><Check size={11} strokeWidth={2.5} /></span>}
    <span role="img" aria-label="" style={{ width: iconWidth, height: iconHeight, flex: '0 0 auto', backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${art.cols === 1 ? 0 : col * 100 / (art.cols - 1)}% ${art.rows === 1 ? 0 : row * 100 / (art.rows - 1)}%`, filter: active ? 'brightness(.2)' : 'grayscale(1) contrast(.92) brightness(.92)' }} />
    <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: largeText ? 13 : compact ? 10 : 11, fontWeight: 600, lineHeight: 1.25 }}>{text}</span>{description && <span style={{ display: 'block', color: active ? 'rgba(9,10,8,.62)' : muted, fontSize: largeText ? 9.5 : 8, fontWeight: 400, lineHeight: 1.4, marginTop: 5 }}>{description}</span>}</span>
  </button>;
}

function CreatorChoiceCard({ creator, avatarUrl, badge, byline, title, description, footer, active, art, image, onClick, onInfo }: { creator: string; avatarUrl?: string; badge: string; byline: string; title: string; description: string; footer: string; active: boolean; art?: TagArt; image?: string; onClick: () => void; onInfo?: () => void }) {
  const col = art ? art.index % art.cols : 0;
  const row = art ? Math.floor(art.index / art.cols) : 0;
  const [imageLoaded, setImageLoaded] = useState(!image);
  return <div className="guardian-card" aria-pressed={active} style={{ minHeight: 320, border: `1px solid ${active ? acid : line}`, background: active ? '#20251B' : panel, color: ink, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <button type="button" onClick={onClick} aria-pressed={active} style={{ flex: '1 1 auto', width: '100%', border: 0, background: 'transparent', color: 'inherit', padding: '54px 20px 18px', fontFamily: sans, cursor: 'pointer', textAlign: 'left', display: 'grid', gridTemplateColumns: '112px minmax(0,1fr)', gap: 18, alignItems: 'center' }}>
      <span style={{ position: 'absolute', top: 12, right: onInfo ? 76 : 12, background: ink, color: black, padding: '9px 12px', fontSize: 8, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{badge}</span>
      {active && <span aria-hidden="true" style={{ position: 'absolute', top: 12, left: 12, width: 26, height: 26, display: 'grid', placeItems: 'center', border: `1px solid ${acid}`, borderRadius: '50%', color: acid }}><Check size={13} strokeWidth={2.5} /></span>}
      {image ? <span className="guardian-image-shell" style={{ width: 112, height: 112, position: 'relative', display: 'grid', placeItems: 'center' }}>{!imageLoaded && <span aria-hidden="true" className="guardian-image-loader" style={{ width: 42, height: 42, border: `1px solid ${line}`, borderRadius: '50%', display: 'grid', placeItems: 'center', color: acid, fontSize: 16 }}>✦</span>}<img src={image} alt="" loading="lazy" onLoad={() => setImageLoaded(true)} style={{ width: 112, height: 112, objectFit: 'contain', opacity: imageLoaded ? 1 : 0, transition: 'opacity 240ms ease' }} /></span> : art ? <span role="img" aria-label="" style={{ width: 101 * art.cellAspect, height: 112, backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${col * 100 / Math.max(1, art.cols - 1)}% ${row * 100 / Math.max(1, art.rows - 1)}%`, filter: 'grayscale(1) contrast(.94)' }} /> : null}
      <span><span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${line}` }} /> : <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1px solid ${line}`, fontFamily: serif }}>{creator[0] || 'G'}</span>}<span style={{ color: muted, fontSize: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{creator} <ChevronRight size={10} style={{ display: 'inline', verticalAlign: '-2px' }} /> {byline}</span></span><strong style={{ display: 'block', fontSize: 20, lineHeight: 1.18 }}>{title}</strong><span style={{ display: 'block', color: muted, fontSize: 10, lineHeight: 1.5, marginTop: 9 }}>{description}</span></span>
    </button>
    {onInfo && <button type="button" onClick={onInfo} style={{ position: 'absolute', top: 12, right: 12, height: 31, border: `1px solid ${ink}`, background: 'transparent', color: ink, padding: '0 10px', fontFamily: sans, fontSize: 8, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Info</button>}
    {/* Not a <button>: globals.css forces buttons to 16px !important, which made this footer heavy and wrap. */}
    <div onClick={onClick} title={footer} style={{ minHeight: 44, display: 'flex', alignItems: 'center', borderTop: `1px solid ${line}`, background: 'rgba(245,242,234,.025)', color: active ? acid : muted, padding: '0 20px', fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{footer}</span></div>
  </div>;
}

function FunnelStage({ number, eyebrow, title, copy, art, last = false, children }: { number: string; eyebrow: string; title: string; copy: string; art?: TagArt; last?: boolean; children: React.ReactNode }) {
  const artCol = art ? art.index % art.cols : 0;
  const artRow = art ? Math.floor(art.index / art.cols) : 0;
  return <div style={{ position: 'relative', padding: '0 0 34px 44px', borderLeft: last ? '1px solid transparent' : `1px solid ${line}` }}>
    <span aria-hidden="true" style={{ position: 'absolute', left: -16, top: -2, width: 30, height: 30, borderRadius: '50%', border: `1px solid ${acid}`, background: black, color: acid, display: 'grid', placeItems: 'center', fontFamily: sans, fontSize: 9, fontWeight: 700 }}>{number}</span>
    <div style={{ ...label, color: acid }}>{eyebrow}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '9px 0 8px' }}>{art && <span aria-hidden="true" style={{ width: 48 * art.cellAspect, height: 48, flex: `0 0 ${48 * art.cellAspect}px`, backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${artCol * 100 / Math.max(1, art.cols - 1)}% ${artRow * 100 / Math.max(1, art.rows - 1)}%`, filter: 'grayscale(1) contrast(.94)' }} />}<h2 style={{ color: ink, fontFamily: serif, fontSize: 32, fontWeight: 300, lineHeight: 1.05, margin: 0 }}>{title}</h2></div>
    <p style={{ color: muted, fontSize: 13, lineHeight: 1.6, margin: '0 0 19px', maxWidth: 720 }}>{copy}</p>
    {children}
  </div>;
}

function DeliveryPicker({ value, recommended, onChange }: { value: DeliveryFormat[]; recommended: DeliveryFormat; onChange: (value: DeliveryFormat[]) => void }) {
  const toggle = (option: DeliveryFormat) => onChange(value.includes(option) ? (value.length === 1 ? value : value.filter((item) => item !== option)) : [...value, option]);
  return <div style={{ marginTop: 12 }}>
    <label style={label}>Value unlocked at this level <span style={{ color: acid }}>· choose all that apply · suggested: {recommended}</span></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 7 }}>
      {deliveryFormats.map((option) => { const active = value.includes(option.value); return <SelectCard key={option.value} orientation="horizontal" title={option.value} copy={option.note} art={deliveryCardArt[option.value]} active={active} recommended={recommended === option.value} onClick={() => toggle(option.value)} />; })}
    </div>
  </div>;
}

function FreeOfferCard({ eyebrow, title, copy, art, active, recommended = false, onClick }: { eyebrow: string; title: string; copy: string; art: TagArt; active: boolean; recommended?: boolean; onClick: () => void }) {
  return <SelectCard orientation="vertical" eyebrow={eyebrow} title={title} copy={copy} art={art} active={active} recommended={recommended} onClick={onClick} />;
}

function Brand({ centered = false }: { centered?: boolean }) {
  return <a href="/" aria-label="ROUTINE³ Guardians" style={{ width: 'fit-content', margin: centered ? '0 auto' : undefined, textDecoration: 'none', display: 'block' }}><RoutineMark size={31} textColor={ink} hairline="rgba(245,242,234,0.58)" suffix="Guardians" /></a>;
}

function SocialUrlField({ label: text, value, placeholder, Icon, onChange }: { label: string; value: string; placeholder: string; Icon: typeof Globe2; onChange: (value: string) => void }) {
  return <div>
    <label style={label}>{text} <span style={{ color: muted }}>· optional</span></label>
    <div style={{ position: 'relative' }}>
      <Icon aria-hidden="true" size={15} strokeWidth={1.5} style={{ position: 'absolute', left: 13, top: 16, color: muted, pointerEvents: 'none' }} />
      <input type="url" style={{ ...input, paddingLeft: 40 }} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  </div>;
}

function AuthPanel({ bare = false }: { bare?: boolean }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    if (mode === 'login') {
      const result = await signIn(email, password);
      if (result.error) setError(result.error.helpMessage || result.error.message || 'Could not sign in');
      else window.location.assign('/guardians/workspace');
      setBusy(false);
      return;
    }

    // Existing HealthScan users are already valid guide users. Sign them into
    // the same account first; GuidePortal will then open guide onboarding when
    // no guide profile exists yet.
    const login = await signIn(email, password);
    if (!login.error) { window.location.assign('/guardians/workspace'); return; }

    const result = await signUp(email, password, name);
    if (result.error) {
      const message = String(result.error.message || result.error.error_description || '');
      if (/already registered|already exists|user_already_exists/i.test(message) || result.error.status === 422) {
        setMode('login');
        setError('This HealthScan account already exists. Check the password, then sign in to activate its Guardian profile.');
      } else {
        setError(result.error.helpMessage || result.error.message || 'Could not create the account');
      }
    } else {
      setError('Check your email to confirm the account, then sign in to create your Guardian profile.');
    }
    setBusy(false);
  }
  return (
    <form id="guide-signin" onSubmit={submit} style={bare ? { maxWidth: 460, width: '100%' } : { border: `1px solid ${line}`, background: panel, padding: 'clamp(24px,4vw,48px)', maxWidth: 460 }}>
      {!bare && <><div style={{ ...label, color: acid }}>Step 1 · Sign in</div>
      <h2 style={{ margin: '12px 0 10px', fontFamily: serif, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.045em' }}>Build with ROUTINE³.</h2>
      <p style={{ color: muted, fontFamily: sans, fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>Create your profile, collect leads, and publish paid resources, recipes and protocols from one workspace.</p></>}
      {mode === 'signup' && <div style={{ marginBottom: 12 }}><label style={label}>Your name</label><input value={name} onChange={(e) => setName(e.target.value)} required style={input} /></div>}
      <div style={{ marginBottom: 12 }}><label style={label}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={input} /></div>
      <div style={{ marginBottom: 16 }}><label style={label}>Password</label><input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required style={input} /></div>
      {error && <div style={{ color: '#F0A7A7', fontSize: 12, fontFamily: sans, marginBottom: 14 }}>{error}</div>}
      <button disabled={busy} style={{ ...btn, width: '100%', opacity: busy ? 0.55 : 1, ...(bare ? { minHeight: 42, borderRadius: 2, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', background: '#FFFFFF', color: '#16140F', borderColor: '#FFFFFF' } : {}) }}>{busy ? 'Please wait' : mode === 'login' ? 'Sign in' : 'Create Guardian account'} <ArrowRight size={14} /></button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ border: 0, background: 'none', color: muted, width: '100%', marginTop: 15, cursor: 'pointer', fontFamily: sans, fontSize: 12 }}>
        {mode === 'login' ? 'New Guardian? Create an account' : 'Already have an account? Sign in'}
      </button>
    </form>
  );
}

const guardianDirectoryTypes = [
  { label: 'Herbalist', pattern: /herb|botanical|plant medicine|naturopath/i },
  { label: 'Life coach', pattern: /life coach|coaching|mindset|personal development/i },
  { label: 'Nutritionist', pattern: /nutrition|meal|diet|food|recipe/i },
  { label: 'Fitness coach', pattern: /fitness|movement|strength|athlet|yoga/i },
  { label: 'Wellness practitioner', pattern: /wellness|health|sleep|breath|somatic|longevity/i },
];

function directoryTypesFor(guardian: GuideProfile) {
  const searchable = `${guardian.headline} ${guardian.bio} ${guardian.specialties.join(' ')}`;
  const matches = guardianDirectoryTypes.filter((type) => type.pattern.test(searchable)).map((type) => type.label);
  return matches.length ? matches : ['Wellness practitioner'];
}

function SuggestGuardianModal({ type, onClose }: { type: string; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', instagram: '', tiktok: '', youtube: '', website: '', note: '', suggester_email: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });
  const hasSocial = [form.instagram, form.tiktok, form.youtube, form.website].some((value) => value.trim());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      await submitGuardianSuggestion({ guardian_type: type, ...form });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }
  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: 42, border: '1px solid rgba(17,18,15,.24)', borderRadius: 2, padding: '0 12px', fontFamily: sans, fontSize: 13, background: '#FFF', color: '#11120F', outline: 'none' };
  const lab: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#66645F', margin: '0 0 6px' };
  const socials: [keyof typeof form, string, string][] = [['instagram', 'Instagram', '@handle'], ['tiktok', 'TikTok', '@handle'], ['youtube', 'YouTube', 'Channel URL'], ['website', 'Website', 'https://']];
  return (
    <div role="dialog" aria-modal="true" aria-label={`Suggest a ${type.toLowerCase()}`} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(9,10,8,.62)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', background: '#F2EFE7', color: '#11120F', borderRadius: 4, padding: 'clamp(22px,4vw,34px)', fontFamily: sans }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div><span style={{ color: '#667245', fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>Suggest a Guardian · {type}</span><h3 style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, lineHeight: 1, margin: '10px 0 18px' }}>Who should we invite?</h3></div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: 0, background: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#11120F' }}>×</button>
        </div>
        {status === 'sent' ? <>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>Thank you. We will review {form.name.trim() || 'them'} and reach out.</p>
          <button type="button" onClick={onClose} style={{ ...btn, background: '#11120F', color: '#FFF', borderColor: '#11120F', borderRadius: 2, width: '100%', marginTop: 10 }}>Done</button>
        </> : <>
          <div style={{ marginBottom: 12 }}><label style={lab}>Their name</label><input required value={form.name} onChange={set('name')} style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 12 }}>
            {socials.map(([key, name, hint]) => <div key={key}><label style={lab}>{name}</label><input value={form[key]} onChange={set(key)} placeholder={hint} style={field} /></div>)}
          </div>
          <div style={{ marginBottom: 12 }}><label style={lab}>Why them? (optional)</label><textarea value={form.note} onChange={set('note')} rows={3} style={{ ...field, height: 'auto', padding: 12, resize: 'vertical' }} /></div>
          <div style={{ marginBottom: 16 }}><label style={lab}>Your email (optional)</label><input type="email" value={form.suggester_email} onChange={set('suggester_email')} style={field} /></div>
          {!hasSocial && <p style={{ fontSize: 11, color: '#66645F', margin: '0 0 12px' }}>Add at least one social link or website so we can find them.</p>}
          {status === 'error' && <p style={{ fontSize: 12, color: '#A23B3B', margin: '0 0 12px' }}>We could not send that just now. Please try again.</p>}
          <button disabled={status === 'sending' || !hasSocial || !form.name.trim()} style={{ ...btn, background: '#11120F', color: '#FFF', borderColor: '#11120F', borderRadius: 2, width: '100%', opacity: status === 'sending' || !hasSocial || !form.name.trim() ? 0.5 : 1 }}>{status === 'sending' ? 'Sending' : 'Send suggestion'} <ArrowRight size={13} /></button>
        </>}
      </form>
    </div>
  );
}

function PublicGuidePage({ isSignedIn }: { isSignedIn: boolean }) {
  const { signOut } = useAuth();
  const [guardians, setGuardians] = useState<GuideProfile[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [activeType, setActiveType] = useState('All');
  useEffect(() => {
    listPublicGuideProfiles().then(setGuardians).catch(() => setGuardians([])).finally(() => setDirectoryLoading(false));
  }, []);
  const availableTypes = ['All', ...guardianDirectoryTypes.map((type) => type.label)];
  const visibleGuardians = activeType === 'All' ? guardians : guardians.filter((guardian) => directoryTypesFor(guardian).includes(activeType));
  const guardianCta = isSignedIn ? '/guardians/workspace' : '#guardian-apply';
  const [suggesting, setSuggesting] = useState<string | null>(null);
  const suggestTypes = activeType === 'All' ? guardianDirectoryTypes.map((type) => type.label) : [activeType];
  return (
    <div style={{ minHeight: '100vh', background: black, color: ink, fontFamily: sans }}>
      <header style={{ position: 'absolute', zIndex: 10, inset: '0 0 auto', height: 70, borderBottom: '1px solid rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,5vw,72px)', background: 'rgba(9,10,8,.32)', backdropFilter: 'blur(12px)' }}>
        <Brand />
        <nav aria-label="Guardian builders" className="guardian-builders" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 'clamp(16px,2.6vw,34px)' }}>
          {([['Protocol builder', 'protocols', Hammer], ['Offer builder', 'offer_builder', PencilRuler], ['Site builder', 'profile', Blocks]] as const).map(([text, tab, Icon]) => <a key={text} href={isSignedIn ? `/guardians/workspace?tab=${tab}` : '#guardian-apply'} title={isSignedIn ? text : `${text} · sign in to use`} style={{ color: ink, opacity: isSignedIn ? .86 : .42, textDecoration: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}><Icon size={13} strokeWidth={1.8} />{text}</a>)}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isSignedIn
            ? <><a href="/guardians/workspace" style={{ height: 34, padding: '0 14px', border: `1px solid ${ink}`, borderRadius: 2, background: ink, color: black, textDecoration: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 7 }}><LayoutDashboard size={13} strokeWidth={1.8} />Dashboard</a><button type="button" onClick={() => signOut()} style={{ height: 34, padding: '0 14px', border: '1px solid rgba(245,242,234,.6)', borderRadius: 2, background: 'transparent', color: ink, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>Sign out</button></>
            : <>
              <a href="#guardian-apply" style={{ height: 34, padding: '0 14px', border: '1px solid rgba(245,242,234,.6)', borderRadius: 2, color: ink, textDecoration: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>Sign in</a>
              <a href="#guardian-apply" style={{ height: 34, padding: '0 14px', border: `1px solid ${ink}`, borderRadius: 2, background: ink, color: black, textDecoration: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>Sign up</a>
            </>}
        </div>
      </header>
      <main>
        <section style={{ position: 'relative', minHeight: '100svh', display: 'grid', alignItems: 'center', overflow: 'hidden', backgroundImage: 'linear-gradient(rgba(9,10,8,.22),rgba(9,10,8,.84)),url(/images/guides/templates/community-table.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div style={{ width: '100%', boxSizing: 'border-box', padding: 'clamp(110px,14vh,150px) clamp(20px,6vw,90px) clamp(54px,8vh,90px)' }}>
            <div style={{ maxWidth: 860 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: acid, marginBottom: 28 }}>LEARN · BUILD · GUIDE</div>
              <h1 style={{ margin: 0, fontFamily: serif, fontWeight: 300, fontSize: 'clamp(64px,10vw,142px)', lineHeight: .84, letterSpacing: '-0.055em' }}>Become a Guardian.</h1>
              <p style={{ maxWidth: 650, margin: '30px 0 10px', fontSize: 'clamp(18px,2vw,25px)', lineHeight: 1.4, fontWeight: 600 }}>Turn what you know into guidance people can follow.</p>
              <p style={{ maxWidth: 650, margin: 0, color: 'rgba(245,242,234,.72)', fontSize: 14, lineHeight: 1.7 }}>Create your public page, build a value ramp, collect leads, and publish guides, recipes and interactive Protocols with ROUTINE³.</p>
              <CtaLockup href={guardianCta} label={isSignedIn ? 'Your Guardian workspace' : 'Share what you know'} action={isSignedIn ? 'Open workspace' : 'Become a Guardian'} />
            </div>
          </div>
        </section>
        <section id="guardian-value" style={{ padding: 'clamp(70px,10vw,130px) clamp(20px,6vw,90px)', background: black, color: ink }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <span style={{ color: acid, fontSize: 10, fontWeight: 700, letterSpacing: '.15em' }}>WHY BUILD ON ROUTINE³</span>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(42px,6vw,78px)', fontWeight: 300, lineHeight: .95, margin: '16px 0 18px', maxWidth: 900 }}>Your knowledge, running every day in someone’s routine.</h2>
            <p style={{ color: muted, fontSize: 15, lineHeight: 1.7, maxWidth: 640, margin: '0 0 clamp(40px,6vw,70px)' }}>Most guidance ends when the call or the PDF does. On ROUTINE³ it becomes a Protocol people follow in the app, and you see how it is going.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))', borderTop: '1px solid rgba(255,255,255,.18)' }}>
              {[
                ['01', 'A health database to build on', 'Start from a catalogue of foods, ingredients, recipes, supplements and activities instead of a blank page. Every step you add is already structured, timed and explained.'],
                ['02', 'A platform people already use', 'Your Protocols live inside the ROUTINE³ app, with reminders, a daily timeline and check-offs. People follow your guidance where they plan their day, not in a forgotten download.'],
                ['03', 'A coaching feedback loop', 'See which steps get done and where people drop off. Adjust the Protocol, add a check-in, or offer one-to-one support at the moment it is needed.'],
                ['04', 'Revenue you share in', 'Sell guides, programmes and calls through your value ramp, and earn a share when the people you bring in join ROUTINE³. Your page does the selling between sessions.'],
              ].map(([n, title, body]) => <div key={n} style={{ padding: 'clamp(24px,3vw,34px) clamp(0px,2vw,26px) 0 0', borderRight: '1px solid rgba(255,255,255,.1)', paddingLeft: 'clamp(0px,1.5vw,22px)' }}>
                <span style={{ color: acid, fontSize: 10, fontWeight: 700, letterSpacing: '.12em' }}>{n}</span>
                <h3 style={{ fontFamily: serif, fontSize: 'clamp(26px,2.4vw,32px)', fontWeight: 300, lineHeight: 1.05, margin: '14px 0 12px' }}>{title}</h3>
                <p style={{ color: muted, fontSize: 13, lineHeight: 1.65, margin: '0 0 28px' }}>{body}</p>
              </div>)}
            </div>
          </div>
        </section>
        <section id="guardian-directory" style={{ padding: 'clamp(70px,10vw,130px) clamp(20px,6vw,90px)', background: '#F2EFE7', color: '#11120F' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24, flexWrap: 'wrap', marginBottom: 26 }}><div><span style={{ color: '#667245', fontSize: 10, fontWeight: 700, letterSpacing: '.15em' }}>THE ROUTINE³ NETWORK</span><h2 style={{ fontFamily: serif, fontSize: 'clamp(46px,7vw,86px)', fontWeight: 300, lineHeight: .92, margin: '15px 0 0' }}>Meet the Guardians.</h2></div><a href={guardianCta} style={{ ...btn, background: '#11120F', color: '#FFF', borderColor: '#11120F', textDecoration: 'none' }}>{isSignedIn ? 'Open workspace' : 'Apply to join'} <ArrowRight size={13} /></a></div>
            <div aria-label="Filter Guardians by type" style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 18, marginBottom: 22 }}>
              {availableTypes.map((type) => <button type="button" key={type} onClick={() => setActiveType(type)} aria-pressed={activeType === type} style={{ flex: '0 0 auto', minHeight: 38, padding: '0 14px', border: `1px solid ${activeType === type ? '#11120F' : 'rgba(17,18,15,.24)'}`, borderRadius: 3, background: activeType === type ? '#11120F' : 'transparent', color: activeType === type ? '#FFF' : '#11120F', fontFamily: sans, fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>{type}</button>)}
            </div>
            {directoryLoading ? <p style={{ color: '#686762' }}>Loading Guardians…</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14 }}>
              {visibleGuardians.map((guardian) => <a className="guardian-directory-card" key={guardian.user_id} href={`/guardians/${guardian.slug}`} style={{ minHeight: 390, border: '1px solid rgba(17,18,15,.18)', borderRadius: 6, background: '#FFF', color: '#11120F', textDecoration: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 220, background: '#171812', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>{guardian.avatar_url ? <img src={guardian.avatar_url} alt={guardian.display_name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src="/images/guides/guide-plate.png" alt="" loading="lazy" style={{ width: 150, height: 150, objectFit: 'contain', filter: 'grayscale(1)' }} />}</div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}><span style={{ color: '#667245', fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>{directoryTypesFor(guardian).join(' · ')}</span><h3 style={{ fontFamily: serif, fontSize: 30, fontWeight: 300, lineHeight: 1, margin: '12px 0 8px' }}>{guardian.display_name}</h3><p style={{ color: '#66645F', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{guardian.headline || guardian.bio}</p><span style={{ marginTop: 'auto', paddingTop: 20, fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>View Guardian <ArrowRight size={12} /></span></div>
              </a>)}
              {suggestTypes.map((type) => <div key={type} style={{ minHeight: 390, border: '1.5px dashed rgba(17,18,15,.32)', borderRadius: 6, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundImage: 'radial-gradient(rgba(17,18,15,.16) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
                <div><span style={{ color: '#667245', fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>{type}</span><h3 style={{ fontFamily: serif, fontSize: 30, fontWeight: 300, lineHeight: 1, margin: '12px 0 8px' }}>Know a great {type.toLowerCase()}?</h3><p style={{ color: '#66645F', fontSize: 12, lineHeight: 1.5, margin: 0 }}>Tell us who should be guiding people here. We will reach out and invite them.</p></div>
                <button type="button" onClick={() => setSuggesting(type)} style={{ ...btn, background: '#11120F', color: '#FFF', borderColor: '#11120F', borderRadius: 2, width: '100%' }}>Suggest {/^[aeiou]/i.test(type) ? 'an' : 'a'} {type.toLowerCase()} <ArrowRight size={13} /></button>
              </div>)}
            </div>}
            {suggesting && <SuggestGuardianModal type={suggesting} onClose={() => setSuggesting(null)} />}
          </div>
        </section>
        {!isSignedIn && <section id="guardian-apply" style={{ padding: 'clamp(70px,10vw,130px) clamp(20px,6vw,90px)', background: black }}><div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 'clamp(34px,7vw,100px)', alignItems: 'center' }}><div><span style={{ color: acid, fontSize: 10, fontWeight: 700, letterSpacing: '.15em' }}>BECOME A GUARDIAN</span><h2 style={{ fontFamily: serif, fontSize: 'clamp(48px,7vw,86px)', fontWeight: 300, lineHeight: .92, margin: '16px 0' }}>Build your place in the network.</h2><p style={{ color: muted, lineHeight: 1.65, maxWidth: 540 }}>Use your existing ROUTINE³ account or create one to build your Guardian profile and first Protocol.</p></div><AuthPanel bare /></div></section>}
      </main>
    </div>
  );
}

const SUPPORT_KINDS: GuideOffer['kind'][] = ['one_to_one_call', 'group_call', 'in_person', 'journey', 'festival', 'team_program'];

/** Default funnel order: the ramp's own order when published, else free → paid by price → personal support. */
function orderFunnelOffers(offers: GuideOffer[], ramp: GuideValueRamp | null): GuideOffer[] {
  if (ramp?.offer_ids?.length) {
    const byId = new Map(offers.map((offer) => [offer.id, offer]));
    const ordered = ramp.offer_ids.map((id) => byId.get(id)).filter(Boolean) as GuideOffer[];
    if (ordered.length) return ordered;
  }
  const rank = (offer: GuideOffer) => (offer.access_model === 'free' ? 0 : SUPPORT_KINDS.includes(offer.kind) ? 2 : 1);
  return [...offers].sort((a, b) => rank(a) - rank(b) || (a.price_cents || 0) - (b.price_cents || 0));
}

const CONSENT_TEXT = 'Send me occasional emails with new guidance and offers. Unsubscribe any time.';

function GuardianFunnel({ profile, offers, ramp, accent, headingFont }: { profile: GuideProfile; offers: GuideOffer[]; ramp: GuideValueRamp | null; accent: string; headingFont: string }) {
  const ordered = orderFunnelOffers(offers, ramp);
  const entry = ordered.find((offer) => offer.access_model === 'free') || null;
  const nextPaid = ordered.find((offer) => offer.access_model === 'paid' && !SUPPORT_KINDS.includes(offer.kind)) || null;
  const support = ordered.find((offer) => SUPPORT_KINDS.includes(offer.kind)) || null;
  const [form, setForm] = useState({ name: '', email: '', goal: '', consent: false });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const price = (offer: GuideOffer) => offer.access_model === 'free' ? 'Free' : offer.price_cents ? formatMoney(offer.price_cents / 100, offer.currency || 'GBP') : 'Enquire';
  const offerHref = (offer: GuideOffer) => offer.booking_url || offer.affiliate_url || '#start';
  async function optIn(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      await submitGuardianOptIn(profile.user_id, { name: form.name, email: form.email, goal: form.goal || null, marketingConsent: form.consent, consentText: CONSENT_TEXT, sourceOfferId: entry?.id, valueRampId: ramp?.id });
      setState('done');
    } catch {
      setState('error');
    }
  }
  const eyebrow: React.CSSProperties = { color: accent, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' };
  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: 46, border: '1px solid #11120F', borderRadius: 2, padding: '0 14px', fontFamily: 'inherit', fontSize: 14, background: '#FFF', color: '#11120F', outline: 'none' };
  const solid: React.CSSProperties = { minHeight: 46, border: '1px solid #11120F', borderRadius: 2, background: '#11120F', color: '#FFF', padding: '0 20px', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' };
  const steps = [entry, nextPaid, support].filter(Boolean) as GuideOffer[];
  return <>
    {steps.length > 0 && <section id="offers" style={{ padding: 'clamp(60px,9vw,120px) clamp(24px,8vw,110px)', borderTop: '1px solid rgba(17,18,15,.2)' }}>
      <span style={eyebrow}>{ramp?.problem ? ramp.problem : `Work with ${profile.display_name}`}</span>
      <h2 style={{ fontFamily: headingFont, fontWeight: 300, fontSize: 'clamp(44px,7vw,82px)', lineHeight: .95, margin: '18px 0 36px' }}>Your path, step by step.</h2>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', borderTop: '1px solid #11120F' }}>
        {steps.map((offer, index) => <li key={offer.id} style={{ padding: '24px 22px 26px 0', borderRight: index < steps.length - 1 ? '1px solid rgba(17,18,15,.16)' : 'none', paddingLeft: index ? 22 : 0, display: 'flex', flexDirection: 'column' }}>
          <span style={eyebrow}>{String(index + 1).padStart(2, '0')} · {index === 0 && offer.access_model === 'free' ? 'Start free' : SUPPORT_KINDS.includes(offer.kind) ? 'Personal support' : 'Go deeper'} · {price(offer)}</span>
          <strong style={{ fontFamily: headingFont, fontSize: 32, lineHeight: 1.05, fontWeight: 300, margin: '18px 0 10px' }}>{offer.title}</strong>
          <span style={{ color: '#66645F', fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>{offer.description || 'The next step in your journey.'}</span>
          <a href={index === 0 && offer.access_model === 'free' ? '#start' : offerHref(offer)} style={{ ...solid, marginTop: 'auto', width: 'fit-content', ...(index ? { background: 'transparent', color: '#11120F' } : {}) }}>{index === 0 && offer.access_model === 'free' ? 'Start free' : SUPPORT_KINDS.includes(offer.kind) ? 'Apply / book a call' : 'See what is included'} <ArrowRight size={13} /></a>
        </li>)}
      </ol>
    </section>}
    {entry && <section id="start" style={{ padding: 'clamp(60px,9vw,120px) clamp(24px,8vw,110px)', background: '#11120F', color: '#F5F2EA' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 'clamp(32px,6vw,90px)', alignItems: 'center' }}>
        <div>
          <span style={{ ...eyebrow, color: '#C7D08E' }}>Free · {entry.title}</span>
          <h2 style={{ fontFamily: headingFont, fontWeight: 300, fontSize: 'clamp(40px,6vw,72px)', lineHeight: .95, margin: '18px 0' }}>{state === 'done' ? 'You are in.' : 'Start today, free.'}</h2>
          <p style={{ color: 'rgba(245,242,234,.72)', fontSize: 14, lineHeight: 1.7, maxWidth: 520 }}>{state === 'done' ? `Open ${entry.title} now. It runs as a daily routine in the ROUTINE³ app, with reminders, so you keep going.` : entry.description || 'Get the guide and the interactive routine that goes with it.'}</p>
        </div>
        {state === 'done' ? <div style={{ display: 'grid', gap: 12 }}>
          <a href={entry.booking_url || APP_STORE_URL} style={{ ...solid, background: '#F5F2EA', color: '#11120F', borderColor: '#F5F2EA' }}>Open your free routine <ArrowRight size={13} /></a>
          {nextPaid && <div style={{ border: '1px solid rgba(245,242,234,.3)', padding: 22 }}>
            <span style={{ ...eyebrow, color: '#C7D08E' }}>Ready to go further? · {price(nextPaid)}</span>
            <strong style={{ display: 'block', fontFamily: headingFont, fontWeight: 300, fontSize: 28, lineHeight: 1.05, margin: '12px 0 8px' }}>{nextPaid.title}</strong>
            <p style={{ color: 'rgba(245,242,234,.72)', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>{nextPaid.description || 'The complete programme, step by step.'}</p>
            <a href={offerHref(nextPaid)} style={{ ...solid, background: 'transparent', color: '#F5F2EA', borderColor: '#F5F2EA' }}>See what is included <ArrowRight size={13} /></a>
          </div>}
        </div> : <form onSubmit={optIn} style={{ display: 'grid', gap: 12 }}>
          <input required placeholder="First name" aria-label="First name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={field} />
          <input required type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={field} />
          <div role="radiogroup" aria-label="Main goal (optional)" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Health', 'Beauty', 'Fitness'].map((goal) => <button type="button" key={goal} role="radio" aria-checked={form.goal === goal} onClick={() => setForm({ ...form, goal: form.goal === goal ? '' : goal })} style={{ minHeight: 36, padding: '0 14px', border: '1px solid rgba(245,242,234,.5)', borderRadius: 2, background: form.goal === goal ? '#F5F2EA' : 'transparent', color: form.goal === goal ? '#11120F' : '#F5F2EA', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>{goal}</button>)}
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.5, color: 'rgba(245,242,234,.78)', cursor: 'pointer' }}><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} style={{ marginTop: 3 }} />{CONSENT_TEXT}</label>
          {state === 'error' && <p style={{ color: '#F0A7A7', fontSize: 12, margin: 0 }}>We could not sign you up just now. Please try again.</p>}
          <button disabled={state === 'sending'} style={{ ...solid, background: '#F5F2EA', color: '#11120F', borderColor: '#F5F2EA', opacity: state === 'sending' ? .6 : 1 }}>{state === 'sending' ? 'Sending' : 'Get free access'} <ArrowRight size={13} /></button>
          <p style={{ fontSize: 11, color: 'rgba(245,242,234,.5)', margin: 0 }}>We use your email to send your access. Marketing emails only if you tick the box.</p>
        </form>}
      </div>
    </section>}
    <footer style={{ padding: '28px clamp(24px,8vw,110px)', borderTop: '1px solid rgba(17,18,15,.2)', color: '#66645F', fontSize: 11, lineHeight: 1.6 }}>
      {profile.display_name} shares general wellbeing guidance, not medical advice. Speak to your GP or doctor before changing medication, diet or exercise, and about any health concern. Individual results vary.
    </footer>
  </>;
}

function GuardianWebsite({ slug, isSignedIn }: { slug: string; isSignedIn: boolean }) {
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [offers, setOffers] = useState<GuideOffer[]>([]);
  const [valueRamps, setValueRamps] = useState<GuideValueRamp[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getGuideProfileBySlug(slug).then(async (found) => {
      setProfile(found);
      setOffers(found ? await listGuideOffers(found.user_id) : []);
      setValueRamps(found ? await listGuideValueRamps(found.user_id).catch(() => []) : []);
    }).catch(() => { setProfile(null); setOffers([]); }).finally(() => setLoading(false));
  }, [slug]);
  if (loading) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', fontFamily: sans }}>Building Guardian page…</div>;
  if (!profile) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', padding: 24, fontFamily: sans, textAlign: 'center' }}><div><Brand /><h1 style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, margin: '48px 0 12px' }}>This page is not published yet.</h1><a href="/guardians" style={{ color: acid }}>Return to Guardians</a></div></div>;
  const freeOffers = offers.filter((offer) => offer.access_model === 'free');
  const socials = profile.social_links || {};
  const publicHeadingFont = serif;
  const publicBodyFont = sans;
  const publicPageColor = socials.theme_page_color || '#F2EFE7';
  const publicAccent = socials.theme_accent_color || '#667245';
  const publicLanguage = languageOptions.find((language) => language.name === socials.language)?.code || 'en';
  const publicBackgroundIsVideo = socials.theme_background_type === 'video' || /\.(mp4|webm)(?:\?|$)/i.test(socials.theme_background || '');
  const publicGreyscale = socials.theme_image_treatment === 'greyscale';
  const publicHeaderStyle: HeaderStyle = socials.theme_header_style === 'hidden' ? 'hidden' : 'white';
  const publicHeaderBackground = '#FFFFFF';
  const publicHeaderText = '#11120F';
  const publicExpertiseTags = parseExpertiseTags(socials.expertise_tags);
  return <div lang={publicLanguage} dir={publicLanguage === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: publicPageColor, color: '#11120F', fontFamily: publicBodyFont }}>
    {publicHeaderStyle !== 'hidden' && <header style={{ minHeight: 64, background: publicHeaderBackground, color: publicHeaderText, borderBottom: '1px solid rgba(17,18,15,.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '0 clamp(20px,6vw,84px)', flexWrap: 'wrap' }}>
      <a href="/" aria-label="ROUTINE³" style={{ color: publicHeaderText, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}><RoutineMark size={32} textColor="#16140F" hairline="#16140F" />{socials.brand_name && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em' }}>{socials.brand_name}</span>}</a>
      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
        {socials.instagram && <a href={socials.instagram} aria-label="Instagram" title="Instagram" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Instagram size={15} /></a>}
        {socials.tiktok && <a href={socials.tiktok} aria-label="TikTok" title="TikTok" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><AtSign size={15} /></a>}
        {socials.youtube && <a href={socials.youtube} aria-label="YouTube" title="YouTube" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Youtube size={16} /></a>}
        {socials.linktree && <a href={socials.linktree} aria-label="Linktree" title="Linktree" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Link2 size={15} /></a>}
        {socials.website && <a href={socials.website} aria-label="Website" title="Website" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Globe2 size={15} /></a>}
        {isSignedIn && <a href="/guardians" style={{ color: publicHeaderText, fontSize: 10, fontWeight: 700 }}>Guardian workspace →</a>}
      </div>
    </header>}
    <main>
      <section style={{ minHeight: 'min(760px,calc(100vh - 64px))', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(52px,9vw,130px) clamp(24px,8vw,110px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundImage: socials.theme_background && !publicBackgroundIsVideo ? `linear-gradient(rgba(242,239,231,.66),rgba(242,239,231,.66)),url(${socials.theme_background})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: publicGreyscale ? 'luminosity' : 'normal' }}>
          {publicBackgroundIsVideo && <><video src={socials.theme_background} autoPlay muted loop playsInline aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: publicGreyscale ? 'grayscale(1)' : 'none' }} /><span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(242,239,231,.66)' }} /></>}
          <span style={{ position: 'relative', zIndex: 2, color: publicAccent, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>{profile.specialties.slice(0, 3).join(' · ') || 'Personal guidance'}</span>
          <h1 style={{ position: 'relative', zIndex: 2, fontFamily: publicHeadingFont, fontWeight: 300, fontSize: 'clamp(58px,9vw,118px)', lineHeight: .86, letterSpacing: '-.035em', margin: '24px 0' }}>{profile.headline || profile.display_name}</h1>
          <ExpertiseTags tags={publicExpertiseTags} color={publicAccent} />
          <p style={{ position: 'relative', zIndex: 2, color: '#66645F', fontSize: 15, lineHeight: 1.75, maxWidth: 560 }}>{profile.bio}</p>
          {freeOffers[0] && <a href="#start" style={{ position: 'relative', zIndex: 2, marginTop: 24, width: 'fit-content', minHeight: 40, borderRadius: 4, background: publicAccent, color: readableText(publicAccent), padding: '0 16px', textDecoration: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 22px rgba(17,18,15,.14)' }}>Start free <ArrowRight size={14} /></a>}
        </div>
        <div style={{ minHeight: 520, background: '#11120F', display: 'grid', placeItems: 'center', padding: 40 }}>
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width: 'min(74%,520px)', maxHeight: 620, objectFit: 'contain', filter: publicGreyscale ? 'grayscale(1) contrast(1.05)' : 'none' }} /> : <img src="/images/guides/guide-plate.png" alt="" style={{ width: 'min(74%,420px)', objectFit: 'contain', filter: publicGreyscale ? 'grayscale(1)' : 'none' }} />}
        </div>
      </section>
      <GuardianFunnel profile={profile} offers={offers} ramp={valueRamps.find((ramp) => ramp.status === 'published') || null} accent={publicAccent} headingFont={publicHeadingFont} />
    </main>
  </div>;
}

function Onboarding({ userId, accessToken, name, email, accountAvatarUrl, onDone }: { userId: string; accessToken: string; name: string; email: string; accountAvatarUrl?: string | null; onDone: (p: GuideProfile) => void }) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(name);
  const [mainLanguage, setMainLanguage] = useState(defaultLanguage());
  const [contactEmail, setContactEmail] = useState(email);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linktreeUrl, setLinktreeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(accountAvatarUrl || null);
  const [activeBrandId, setActiveBrandId] = useState('personal');
  const [brandProfiles, setBrandProfiles] = useState<BrandDraft[]>([{ localId: 'personal', name: name || 'Personal brand', kind: 'personal', logo_url: accountAvatarUrl || null, contact_email: email, whatsapp_phone: '', website_url: '', social_links: {}, language: defaultLanguage(), pricing_region: defaultPricingRegion().region, currency: defaultPricingRegion().currency }]);
  const [bookingProvider, setBookingProvider] = useState<BookingProvider>('ROUTINE³ Booking');
  const [bookingUrl, setBookingUrl] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [realm, setRealm] = useState<GuideRealm>('Body');
  const [audience, setAudience] = useState<string[]>(['Everyone']);
  const [format, setFormat] = useState<string[]>(['Protocol (Physical + Interactive)']);
  const [intro, setIntro] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(accountAvatarUrl || defaultAvatars[0].image);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [storyTemplate, setStoryTemplate] = useState<StoryTemplateId>('editorial');
  const [siteStyleStage, setSiteStyleStage] = useState(0);
  const [pageColor, setPageColor] = useState('#F2EFE7');
  const [accentColor, setAccentColor] = useState('#667245');
  const [imageTreatment, setImageTreatment] = useState<'color' | 'greyscale'>('color');
  const [selectedHeadline, setSelectedHeadline] = useState('');
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [expertiseTagDraft, setExpertiseTagDraft] = useState('');
  const [funnelPreviewStage, setFunnelPreviewStage] = useState(0);
  const [funnelUnlockedStage, setFunnelUnlockedStage] = useState(0);
  const [funnelPageState, setFunnelPageState] = useState<'offer' | 'checkout' | 'access' | 'post_purchase' | 'complete'>('offer');
  const [funnelTimerSeconds, setFunnelTimerSeconds] = useState(600);
  const [funnelPurchases, setFunnelPurchases] = useState<string[]>([]);
  const [leadCaptureValue, setLeadCaptureValue] = useState('');
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>('white');
  const [pricingRegion, setPricingRegion] = useState(defaultPricingRegion().region);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultPricingRegion().currency);
  const [offerGoal, setOfferGoal] = useState<GuardianOfferGoal>('sell');
  const [offerPlanStage, setOfferPlanStage] = useState(0);
  const [showProtocolInfo, setShowProtocolInfo] = useState(false);
  const [summaryView, setSummaryView] = useState<'offers' | 'sites' | null>(null);
  const [inventoryMenu, setInventoryMenu] = useState<string | null>(null);
  const [offerAccess, setOfferAccess] = useState<Record<UpsellKind, 'free' | 'paid'>>({ ebook: 'paid', routine: 'paid', routine_guidance: 'paid', recipe_book: 'paid', group_call: 'paid', one_to_one_call: 'paid', in_person: 'paid', festival: 'paid' });
  const [importedProfile, setImportedProfile] = useState<ImportedGuideProfile | null>(null);
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingOffer, setUploadingOffer] = useState(false);
  const [freeOfferType, setFreeOfferType] = useState<FreeOfferKind>('routine');
  const [selectedLeadMagnets, setSelectedLeadMagnets] = useState<FreeOfferKind[]>(['routine']);
  const [freeDelivery, setFreeDelivery] = useState<DeliveryFormat[]>(['Downloadable PDF', 'Interactive Protocol']);
  const [leadMagnetTitle, setLeadMagnetTitle] = useState('Starter R3 Protocol');
  const [freeAudienceValue, setFreeAudienceValue] = useState(freeValueSuggestions.routine);
  const [leadMagnetPath, setLeadMagnetPath] = useState<string | null>(null);
  const [protocolBrief, setProtocolBrief] = useState('');
  const [protocolSourceUrls, setProtocolSourceUrls] = useState('');
  const [protocolGoal, setProtocolGoal] = useState('');
  const [protocolTypes, setProtocolTypes] = useState<string[]>(['Wellness']);
  const [audienceProblemsByGroup, setAudienceProblemsByGroup] = useState<Record<string, string[]>>({ Everyone: ['Sleep problems', 'Low energy'] });
  const [audienceProblemDrafts, setAudienceProblemDrafts] = useState<Record<string, string>>({});
  const [rampAudience, setRampAudience] = useState('Everyone');
  const [rampProblem, setRampProblem] = useState('Sleep problems');
  const [audienceSetupStage, setAudienceSetupStage] = useState(0);
  const [freeOfferSetupStage, setFreeOfferSetupStage] = useState(0);
  const [paidOfferSetupStages, setPaidOfferSetupStages] = useState<Partial<Record<UpsellKind, number>>>({});
  const [onboardingProtocol, setOnboardingProtocol] = useState<AdminProtocol | null>(null);
  const [onboardingProtocolRevision, setOnboardingProtocolRevision] = useState(0);
  const [protocolBuilderOpen, setProtocolBuilderOpen] = useState(false);
  const [protocolEditorVisible, setProtocolEditorVisible] = useState(false);
  const [creatingProtocol, setCreatingProtocol] = useState(false);
  const [selectedUpsells, setSelectedUpsells] = useState<UpsellKind[]>(['one_to_one_call']);
  const [showAddOfferOptions, setShowAddOfferOptions] = useState(false);
  const [upsellDrafts, setUpsellDrafts] = useState<Record<UpsellKind, { title: string; price: string; url: string; delivery: DeliveryFormat[]; audienceValue: string; nextStep: OfferNextStep; billingModel: BillingModel }>>({
    ebook: { title: 'Complete guide', price: '29', url: '', delivery: ['Downloadable PDF'], audienceValue: 'Learn the complete method and apply it at your own pace.', nextStep: 'link', billingModel: 'one_time' },
    routine: { title: 'General R3 Protocol', price: '49', url: '', delivery: ['PDF + Interactive Protocol'], audienceValue: 'Follow a complete proven Protocol in print and in the R3 app.', nextStep: 'builder', billingModel: 'one_time' },
    routine_guidance: { title: 'Specific R3 Protocol', price: '79', url: '', delivery: ['Interactive Protocol'], audienceValue: 'Receive a Protocol shaped around your specific goal, age, life stage and needs.', nextStep: 'builder', billingModel: 'one_time' },
    recipe_book: { title: 'Recipe collection', price: '24', url: '', delivery: ['Downloadable PDF'], audienceValue: 'Make a complete collection of practical recipes with confidence.', nextStep: 'builder', billingModel: 'one_time' },
    group_call: { title: 'Personal Protocol + weekly coaching + daily feedback', price: '299', url: '', delivery: ['Interactive Protocol', 'Live online'], audienceValue: 'Your coach sees the Protocol activity you choose to share, reviews progress daily and suggests timely changes, with a private coaching call every week.', nextStep: 'booking', billingModel: 'subscription' },
    one_to_one_call: { title: 'Personalised R3 Protocol + private call', price: '104', url: '', delivery: ['Interactive Protocol', 'Live online'], audienceValue: 'Receive a custom Protocol and one private call to refine it around your needs and agree the next actions.', nextStep: 'booking', billingModel: 'one_time' },
    in_person: { title: 'In-person session', price: '349', url: '', delivery: ['In person'], audienceValue: 'Experience tailored hands-on support and individual attention.', nextStep: 'booking', billingModel: 'pack_10' },
    festival: { title: 'Three-day in-person retreat', price: '1500', url: '', delivery: ['Event'], audienceValue: 'Spend three focused days at a country hotel with in-person coaching, practical sessions, accommodation and a personal plan to take home.', nextStep: 'booking', billingModel: 'one_time' },
  });
  const [routineGender, setRoutineGender] = useState('Women');
  const [routineAge, setRoutineAge] = useState('Adults 45–64');
  const [routineLifeStage, setRoutineLifeStage] = useState('Menopause');
  const activeStoryTemplate = storyTemplates.find((template) => template.id === storyTemplate) || storyTemplates[0];
  const effectiveBackground = backgroundUrl || activeStoryTemplate.image;
  const previewHeaderBackground = '#FFFFFF';
  const previewHeaderText = '#11120F';

  function currentBrandDraft(): BrandDraft {
    const current = brandProfiles.find((brand) => brand.localId === activeBrandId);
    return {
      localId: activeBrandId,
      name: displayName.trim() || current?.name || 'Untitled brand',
      kind: current?.kind || 'business',
      logo_url: logoUrl,
      contact_email: contactEmail.trim(),
      whatsapp_phone: whatsappPhone.trim(),
      website_url: websiteUrl.trim(),
      social_links: { instagram: instagramUrl.trim(), tiktok: tiktokUrl.trim(), youtube: youtubeUrl.trim(), linktree: linktreeUrl.trim() },
      language: mainLanguage,
      pricing_region: pricingRegion,
      currency,
    };
  }

  function loadBrand(brand: BrandDraft) {
    setActiveBrandId(brand.localId); setDisplayName(brand.name); setLogoUrl(brand.logo_url); setAvatarUrl(brand.logo_url);
    setContactEmail(brand.contact_email); setWhatsappPhone(brand.whatsapp_phone); setWebsiteUrl(brand.website_url);
    setInstagramUrl(brand.social_links.instagram || ''); setTiktokUrl(brand.social_links.tiktok || '');
    setYoutubeUrl(brand.social_links.youtube || ''); setLinktreeUrl(brand.social_links.linktree || '');
    setMainLanguage(brand.language); setPricingRegion(brand.pricing_region); setCurrency(brand.currency);
  }

  function selectBrand(localId: string) {
    const savedCurrent = currentBrandDraft();
    const updated = brandProfiles.map((brand) => brand.localId === activeBrandId ? savedCurrent : brand);
    setBrandProfiles(updated);
    const next = updated.find((brand) => brand.localId === localId);
    if (next) loadBrand(next);
  }

  function addBrand() {
    const savedCurrent = currentBrandDraft();
    const localId = `brand-${Date.now()}`;
    const next: BrandDraft = { localId, name: 'New brand', kind: 'business', logo_url: null, contact_email: contactEmail, whatsapp_phone: '', website_url: '', social_links: {}, language: mainLanguage, pricing_region: pricingRegion, currency };
    setBrandProfiles([...brandProfiles.map((brand) => brand.localId === activeBrandId ? savedCurrent : brand), next]);
    loadBrand(next);
  }

  function removeActiveBrand() {
    if (brandProfiles.length === 1 || activeBrandId === 'personal') return;
    const remaining = brandProfiles.filter((brand) => brand.localId !== activeBrandId);
    setBrandProfiles(remaining);
    loadBrand(remaining[0]);
  }

  function addExpertiseTags(raw: string) {
    const additions = raw.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (!additions.length) return;
    setExpertiseTags((current) => Array.from(new Set([...current, ...additions])).slice(0, 10));
    setExpertiseTagDraft('');
  }

  function toggleAudienceProblem(group: string, problem: string) {
    setAudienceProblemsByGroup((current) => {
      const selected = current[group] || [];
      return { ...current, [group]: selected.includes(problem) ? selected.filter((item) => item !== problem) : [...selected, problem] };
    });
  }

  function addAudienceProblem(group: string) {
    const problem = (audienceProblemDrafts[group] || '').trim();
    if (!problem) return;
    setAudienceProblemsByGroup((current) => ({ ...current, [group]: Array.from(new Set([...(current[group] || []), problem])).slice(0, 12) }));
    setAudienceProblemDrafts((current) => ({ ...current, [group]: '' }));
  }

  function tiltCard(event: React.PointerEvent<HTMLDivElement>) {
    const card = (event.target as HTMLElement).closest<HTMLElement>('.guardian-card');
    if (!card || event.pointerType === 'touch') return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.setProperty('--card-rotate-x', `${(-y * 7).toFixed(2)}deg`);
    card.style.setProperty('--card-rotate-y', `${(x * 9).toFixed(2)}deg`);
  }

  function resetTilt(event: React.PointerEvent<HTMLDivElement>) {
    const card = (event.target as HTMLElement).closest<HTMLElement>('.guardian-card');
    if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
    card.style.setProperty('--card-rotate-x', '0deg');
    card.style.setProperty('--card-rotate-y', '0deg');
  }

  function applyStoryTemplate(id: StoryTemplateId) {
    const template = storyTemplates.find((item) => item.id === id);
    if (!template) return;
    setStoryTemplate(id);
    setBackgroundUrl(null);
    setBackgroundType('image');
    setPageColor(template.page);
    setAccentColor(template.accent);
    setImageTreatment(template.treatment);
  }
  const [guidanceReviewCadence, setGuidanceReviewCadence] = useState('Daily review');
  const [eventsPerYear, setEventsPerYear] = useState('1');
  const [importMessage, setImportMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const audiences = ['Everyone', 'Busy families', 'Women', 'Men', 'Children', 'Athletes', 'Adults 50+'];
  const audienceProblemSuggestions = ['Sleep problems', 'Hot flushes', 'Low energy', 'Brain fog', 'Stress or anxiety', 'Weight changes', 'Digestive discomfort', 'Skin changes', 'Pain or mobility', 'Fitness confidence', 'Meal planning', 'Healthy routines'];
  const audienceProblemSuggestionsByGroup: Record<string, string[]> = {
    Everyone: audienceProblemSuggestions,
    'Busy families': ['Sleep problems', 'Low energy', 'Stress or anxiety', 'Meal planning', 'Healthy routines', 'Digestive discomfort'],
    Women: ['Hot flushes', 'Sleep problems', 'Low energy', 'Brain fog', 'Stress or anxiety', 'Weight changes', 'Skin changes', 'Healthy routines'],
    Men: ['Low energy', 'Stress or anxiety', 'Weight changes', 'Fitness confidence', 'Sleep problems', 'Healthy routines'],
    Children: ['Sleep problems', 'Digestive discomfort', 'Skin changes', 'Meal planning', 'Healthy routines', 'Pain or mobility'],
    Athletes: ['Fitness confidence', 'Pain or mobility', 'Low energy', 'Meal planning', 'Digestive discomfort', 'Healthy routines'],
    'Adults 50+': ['Pain or mobility', 'Sleep problems', 'Brain fog', 'Low energy', 'Weight changes', 'Fitness confidence', 'Healthy routines'],
  };
  const audienceProblems = Array.from(new Set(audience.flatMap((group) => audienceProblemsByGroup[group] || [])));
  const audienceProblemArt = atlas('/images/guides/tags/body.webp', 4, 3, audienceProblemSuggestions);
  const formats: { label: string; value: string; description: string; art: TagArt }[] = [
    { label: 'Protocol (Physical + Interactive)', value: 'PHYSICAL + APP', description: 'A guide to keep with interactive steps in the app', art: supportArt['ROUTINE³ (physical + digital)'] },
    { label: 'Protocol + Guidance', value: 'INTERACTIVE', description: 'Review progress and suggest the next action', art: offerArt['ROUTINE³'] },
    { label: 'Recipes', value: 'DOWNLOAD', description: 'Practical recipes people can use at home', art: supportArt.Recipes },
    { label: 'Group call', value: 'LIVE GROUP', description: 'Teach, discuss and answer together', art: supportArt['Group call'] },
    { label: '1:1 online', value: 'PRIVATE LIVE', description: 'Tailored guidance for one person', art: supportArt['1:1 online'] },
    { label: 'In person', value: 'PHYSICAL', description: 'Hands-on personal support', art: supportArt['In person'] },
    { label: 'Event', value: 'PHYSICAL EVENT', description: 'A shared immersive experience', art: supportArt.Event },
  ];
  const freeOfferCta: Record<FreeOfferKind, string> = { ebook: 'Get the guide', recipe_book: 'Get the recipes', routine: 'Start the Protocol', group_call: 'Join the weekly call', one_to_one_call: 'Book a call' };
  const upsellSuggestions: { kind: UpsellKind; label: string; value: string; why: string; art: TagArt }[] = [
    { kind: 'ebook', label: 'Complete guide', value: 'Complete method', why: 'Learn the complete method and apply it at your own pace.', art: offerArt.eBook },
    { kind: 'recipe_book', label: 'Practical recipe collection', value: 'Practical toolkit', why: 'Use a complete collection of practical recipes whenever you need them.', art: offerArt['Recipe book'] },
    { kind: 'routine', label: 'General R3 Protocol', value: 'General plan', why: 'Follow a proven Protocol in print and through the interactive R3 app.', art: offerArt['ROUTINE³'] },
    { kind: 'routine_guidance', label: 'Specific R3 Protocol', value: 'Specific plan', why: 'Get a Protocol shaped around your specific goal, age, life stage and needs.', art: offerArt['ROUTINE³'] },
    { kind: 'festival', label: 'Three-day in-person retreat', value: 'Premium', why: 'Spend three focused days at a country hotel with coaching, practical sessions and accommodation.', art: offerArt.Event },
    { kind: 'group_call', label: 'Personal Protocol + weekly coaching + daily feedback', value: 'Ongoing', why: 'Share selected Protocol activity with your coach for daily feedback, timely adjustments and a private call every week.', art: offerArt['Group call'] },
    { kind: 'one_to_one_call', label: 'Personal Protocol + private call', value: 'Guided', why: 'Refine your custom Protocol in one private coaching call and leave with agreed next actions.', art: offerArt['1:1 call'] },
    { kind: 'in_person', label: 'In person', value: 'Highest', why: 'Receive tailored hands-on support and the Guardian’s full attention.', art: supportArt['In person'] },
  ];
  const offerValueTags: Record<UpsellKind, string> = {
    ebook: 'Complete method',
    recipe_book: 'Practical toolkit',
    routine: 'General plan',
    routine_guidance: 'Specific plan',
    one_to_one_call: 'Personal refinement',
    group_call: 'Ongoing adaptation',
    in_person: 'Private support',
    festival: 'Immersive support',
  };
  const freeValueTags: Record<FreeOfferKind, string> = {
    ebook: 'Lead magnet',
    recipe_book: 'Recipe sampler',
    routine: 'Starter Protocol',
    group_call: 'Community builder',
    one_to_one_call: 'Discovery',
  };
  const freeOfferTypes: { value: FreeOfferKind; label: string; eyebrow: string; copy: string }[] = [
    { value: 'routine', label: 'R3 Protocol', eyebrow: 'PDF + DIGITAL', copy: 'Printable PDF + digital interactive twin in the ROUTINE³ app.' },
    { value: 'ebook', label: 'eBook', eyebrow: 'GUIDE', copy: 'Teach one useful idea.' },
    { value: 'one_to_one_call', label: 'Call', eyebrow: 'DISCOVERY', copy: 'Find the right next step.' },
    { value: 'group_call', label: 'Weekly call', eyebrow: 'COMMUNITY', copy: 'Bring people back each week.' },
    { value: 'recipe_book', label: 'Recipes', eyebrow: 'COLLECTION', copy: 'Give them something practical.' },
  ];
  const websiteGoal = offerGoal === 'sell' ? 'Sell an offer' : 'Collect leads';
  const headlineSuggestions = useMemo(() => guardianHeadlineSuggestions(chosen, audience), [chosen, audience]);
  const generatedHeadline = selectedHeadline || headlineSuggestions[0];
  useEffect(() => { setSelectedHeadline(''); }, [chosen.join('|'), audience.join('|')]);
  const suggestedFreeOffer = useMemo(() => {
    const subject = chosen[0] || 'wellness';
    if (format.includes('Group call')) return { kind: 'group_call' as const, title: `Free Tuesday ${subject.toLowerCase()} community call` };
    if (format.includes('Recipes') || chosen.includes('Nutrition')) return { kind: 'recipe_book' as const, title: `3 free ${subject} recipes` };
    if (format.includes('1:1 online') || format.includes('In person')) return { kind: 'one_to_one_call' as const, title: `A free ${subject} discovery call` };
    if (format.includes('Protocol (Physical + Interactive)') || chosen.includes('Breathwork')) return { kind: 'routine' as const, title: `A free 3-day ${subject} Protocol` };
    return { kind: 'ebook' as const, title: `A free introduction to ${subject}` };
  }, [chosen, format]);
  const pickStyle = (active: boolean): React.CSSProperties => ({ minHeight: 44, padding: '0 13px', border: `1px solid ${active ? ink : line}`, color: active ? black : ink, background: active ? ink : 'transparent', fontFamily: sans, fontSize: 11, fontWeight: 600, cursor: 'pointer' });
  async function importPublicProfile(urls: string[]) {
    if (!urls.length) return;
    setImporting(true); setImportMessage('');
    try {
      const imported = await importGuideProfile(urls, accessToken);
      setImportedProfile(imported);
      if (imported.name) setDisplayName(imported.name);
      if (imported.bio) setIntro(imported.bio);
      if (imported.avatarUrl) { setAvatarUrl(imported.avatarUrl); setLogoUrl(imported.avatarUrl); }
      const searchable = `${imported.headline} ${imported.bio} ${imported.topics.join(' ')}`.toLowerCase();
      const inferred = specialties.filter((specialty) => imported.topics.includes(specialty) || searchable.includes(specialty.toLowerCase().replace(' health', '')));
      if (inferred.length) {
        setChosen((current) => Array.from(new Set([...current, ...inferred])));
        const inferredRealm = (Object.keys(specialtyGroups) as GuideRealm[]).find((key) => specialtyGroups[key].some((option) => inferred.includes(option)));
        if (inferredRealm) setRealm(inferredRealm);
      }
      if (/family|parent|children|kids/.test(searchable)) setAudience(['Busy families']);
      else if (/women|female|mother/.test(searchable)) setAudience(['Women']);
      else if (/athlete|sport|fitness/.test(searchable)) setAudience(['Athletes']);
      setImportMessage(`Imported from ${imported.sources.map((source) => source.site).join(', ')}. Review anything you want to change.`);
    } catch (e: any) {
      setImportMessage(e.message || 'Nothing could be imported. Continue with the quick choices below.');
    } finally { setImporting(false); }
  }

  async function uploadPortrait(file?: File) {
    if (!file) return;
    setUploading(true); setImportMessage('');
    try {
      const url = await uploadGuideImage(userId, file);
      setAvatarUrl(url);
      setLogoUrl(url);
      setImportMessage('Profile image uploaded.');
    } catch (e: any) {
      setImportMessage(e.message || 'Could not upload that profile image.');
    } finally { setUploading(false); }
  }

  async function uploadBackground(file?: File) {
    if (!file) return;
    setUploadingBackground(true); setImportMessage('');
    try {
      setBackgroundUrl(await uploadGuideImage(userId, file));
      setBackgroundType(file.type.startsWith('video/') ? 'video' : 'image');
    } catch (e: any) {
      setImportMessage(e.message || 'Could not upload that background.');
    } finally { setUploadingBackground(false); }
  }

  async function uploadLeadMagnet(file?: File) {
    if (!file) return;
    setUploadingOffer(true); setError('');
    try { setLeadMagnetPath(await uploadGuideFile(userId, file)); }
    catch (e: any) { setError(e.message || 'Could not upload that file.'); }
    finally { setUploadingOffer(false); }
  }

  async function continueSetup() {
    setError('');
    if (step === 1 && !displayName.trim()) { setError('Add the name people should call you.'); return; }
    if (step === 1 && !/^\S+@\S+\.\S+$/.test(contactEmail.trim())) { setError('Add a valid contact email.'); return; }
    if (step === 2 && !chosen.length) { setError('Choose at least one area you can help with.'); return; }
    if (step === 3 && !audience.length) { setError('Choose at least one audience.'); return; }
    if (step === 1) {
      setBrandProfiles((current) => current.map((brand) => brand.localId === activeBrandId ? currentBrandDraft() : brand));
      const profileUrls = Array.from(new Set([instagramUrl, tiktokUrl, youtubeUrl, linktreeUrl, websiteUrl].map((value) => value.trim()).filter(Boolean)));
      if (profileUrls.length) await importPublicProfile(profileUrls);
    }
    setStep((current) => Math.min(5, current + 1));
  }

  function toggleAudience(value: string) {
    const selecting = !audience.includes(value);
    if (selecting) {
      if (value === 'Women') setRoutineGender('Women');
      if (value === 'Men') setRoutineGender('Men');
      if (value === 'Adults 50+') setRoutineAge('Adults 45–64');
      if (value === 'Children') { setRoutineAge('Children 6–12'); setRoutineLifeStage('Not specified'); }
      if (value === 'Athletes') setProtocolTypes((current) => Array.from(new Set([...current, 'Fitness'])));
      if (value === 'Busy families') setProtocolTypes((current) => Array.from(new Set([...current, 'Meals / nutrition'])));
    }
    setAudience((current) => {
      if (value === 'Everyone') return current.includes('Everyone') ? [] : ['Everyone'];
      const withoutEveryone = current.filter((item) => item !== 'Everyone');
      return withoutEveryone.includes(value) ? withoutEveryone.filter((item) => item !== value) : [...withoutEveryone, value];
    });
  }

  function toggleUpsell(kind: UpsellKind) {
    setSelectedUpsells((current) => current.includes(kind) ? (current.length === 1 ? current : current.filter((item) => item !== kind)) : [...current, kind]);
  }

  function addValuePathOffer(kind: UpsellKind) {
    if (offerAccess[kind] === 'paid') {
      const highestPaidPrice = selectedUpsells.reduce((highest, selectedKind) => offerAccess[selectedKind] === 'paid' ? Math.max(highest, Number(upsellDrafts[selectedKind].price || 0)) : highest, 0);
      const currentPrice = Number(upsellDrafts[kind].price || 0);
      if (currentPrice <= highestPaidPrice) updateUpsell(kind, { price: String(Math.ceil((highestPaidPrice + 20) / 5) * 5) });
    }
    toggleUpsell(kind);
    setShowAddOfferOptions(false);
  }

  function applyOfferGoal(goal: GuardianOfferGoal) {
    setOfferGoal(goal);
    if (goal === 'audience') {
      const subject = chosen[0]?.toLowerCase() || 'wellbeing';
      setFreeOfferType('group_call');
      setSelectedLeadMagnets(['group_call']);
      setFreeDelivery(['Live online']);
      setLeadMagnetTitle(`Free Tuesday ${subject} community call`);
      setFreeAudienceValue(`Join me every Tuesday to talk about ${subject}, ask questions and learn one useful action to try that week.`);
      setSelectedUpsells(['one_to_one_call']);
    } else {
      setFreeOfferType('ebook');
      setSelectedLeadMagnets(['ebook']);
      setFreeDelivery(['Downloadable PDF']);
      setLeadMagnetTitle('Free starter guide');
      setFreeAudienceValue(freeValueSuggestions.ebook);
      setSelectedUpsells(['one_to_one_call']);
    }
  }

  function toggleFormat(value: string) {
    setFormat((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function toggleProtocolType(value: string) {
    setProtocolTypes((current) => current.includes(value)
      ? current.length === 1 ? current : current.filter((item) => item !== value)
      : [...current, value]);
  }

  function updateUpsell(kind: UpsellKind, patch: Partial<{ title: string; price: string; url: string; delivery: DeliveryFormat[]; audienceValue: string; nextStep: OfferNextStep; billingModel: BillingModel }>) {
    setUpsellDrafts((current) => ({ ...current, [kind]: { ...current[kind], ...patch } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (!displayName.trim()) throw new Error('Add the name people should call you.');
      if (!/^\S+@\S+\.\S+$/.test(contactEmail.trim())) throw new Error('Add a valid contact email.');
      if (!chosen.length) throw new Error('Choose at least one area you can help with.');
      const slug = guardianSlug;
      const audienceText = audience.join(', ').toLowerCase();
      const headline = generatedHeadline;
      const bio = intro.trim() || `I help ${audienceText} with ${chosen.join(', ').toLowerCase()} through ${format.join(', ').toLowerCase()}.`;
      const profile = await saveGuideProfile({ user_id: userId, slug, display_name: displayName, headline, bio, avatar_url: avatarUrl, contact_email: contactEmail.trim(), whatsapp_phone: whatsappPhone.trim(), social_links: { instagram: instagramUrl.trim(), tiktok: tiktokUrl.trim(), youtube: youtubeUrl.trim(), linktree: linktreeUrl.trim(), website: websiteUrl.trim(), language: mainLanguage, pricing_region: pricingRegion, currency, site_goal: websiteGoal, booking_provider: bookingProvider, booking_url: bookingUrl.trim(), brand_name: brandName.trim() || displayName.trim(), logo_url: logoUrl || '', expertise_tags: expertiseTags.join(','), theme_template: storyTemplate, theme_background: effectiveBackground, theme_background_type: backgroundType, theme_image_treatment: imageTreatment, theme_header_style: headerStyle, theme_heading: 'Canela', theme_body: 'Euclid', theme_page_color: pageColor, theme_accent_color: accentColor }, specialties: chosen, status: 'submitted', onboarding_step: 5 });
      const selectedBrand = currentBrandDraft();
      const brandsToSave = brandProfiles.map((brand) => brand.localId === activeBrandId ? selectedBrand : brand);
      await replaceGuideBrands(userId, brandsToSave.map(({ localId, ...brand }) => ({ ...brand, is_primary: localId === activeBrandId })));
      const drafts: Promise<GuideOffer>[] = [];
      const protocolSourceList = protocolSourceUrls.split(/\n|,/).map((value) => value.trim()).filter(Boolean);
      const protocolTargetGoal = protocolGoal.trim() || audienceProblems[0] || chosen[0] || 'General wellbeing';
      const protocolContext = [
        protocolBrief.trim() && `Build brief: ${protocolBrief.trim()}.`,
        protocolSourceList.length && `Source URLs: ${protocolSourceList.join(', ')}.`,
        leadMagnetPath && `Source file: ${leadMagnetPath}.`,
        `Audiences: ${audience.join(', ')}.`,
        `Goal: ${protocolTargetGoal}.`,
        audienceProblems.length && `Problems by audience: ${audience.map((group) => `${group}: ${(audienceProblemsByGroup[group] || []).join(', ')}`).join('; ')}.`,
        `Content types: ${protocolTypes.join(', ')}.`,
      ].filter(Boolean).join(' ');
      if (leadMagnetTitle.trim()) {
        const freeOfferIsCall = freeOfferType === 'one_to_one_call' || freeOfferType === 'group_call';
        drafts.push(createGuideOffer(userId, { kind: freeOfferType, title: leadMagnetTitle.trim(), description: `${freeAudienceValue.trim()} Delivery: ${freeDelivery.join(', ')}.${freeOfferType === 'routine' ? ` ${protocolContext}` : ''}`.trim(), price_cents: 0, currency, affiliate_url: null, access_model: 'free', file_path: freeOfferIsCall ? null : leadMagnetPath, booking_url: freeOfferIsCall ? bookingUrl.trim() || null : null }));
      }
      selectedLeadMagnets.filter((kind) => kind !== freeOfferType).forEach((kind) => {
        const option = freeOfferTypes.find((item) => item.value === kind);
        const isCall = kind === 'one_to_one_call' || kind === 'group_call';
        drafts.push(createGuideOffer(userId, { kind, title: `Free ${option?.label || 'guide'}`, description: `${freeValueSuggestions[kind]} Delivery: ${suggestedDelivery(kind)}.`, price_cents: 0, currency, affiliate_url: null, access_model: 'free', file_path: null, booking_url: isCall ? bookingUrl.trim() || null : null }));
      });
      orderedUpsells.forEach((kind) => {
        const suggestion = upsellSuggestions.find((item) => item.kind === kind);
        const draft = upsellDrafts[kind];
        if (!draft.title.trim()) return;
        const targeting = kind === 'routine' || kind === 'routine_guidance' || kind === 'group_call'
          ? ` Target audiences: ${audience.join(', ')}. Problems: ${audience.map((group) => `${group}: ${(audienceProblemsByGroup[group] || []).join(', ')}`).join('; ')}. Goal: ${chosen[0] || 'general wellbeing'}.${kind === 'group_call' ? ` Coach review: ${guidanceReviewCadence.toLowerCase()}. Shared activity: Protocol completion and voluntary check-ins; private account and health data remain excluded.` : ''}`
          : kind === 'festival' ? ` Frequency: ${eventsPerYear} event${eventsPerYear === '1' ? '' : 's'} per year.` : '';
        const destination = draft.url.trim() || (draft.nextStep === 'booking' ? bookingUrl.trim() : '');
        const access = offerAccess[kind];
        const billing = access === 'paid' ? ` Payment model: ${billingLabels[draft.billingModel].title}${billingLabels[draft.billingModel].suffix}.` : '';
        drafts.push(createGuideOffer(userId, { kind, title: draft.title.trim(), description: `${draft.audienceValue.trim() || suggestion?.why || ''} Delivery: ${draft.delivery.join(', ')}. Next action: ${nextStepLabels[draft.nextStep].title}.${billing}${targeting}`.trim() || null, price_cents: access === 'free' ? 0 : Math.max(0, Math.round(Number(draft.price || 0) * 100)), currency, affiliate_url: null, access_model: access, file_path: null, booking_url: destination || null }));
      });
      if (drafts.length) await Promise.all(drafts);
      const wantsRecipes = freeOfferType === 'recipe_book' || selectedUpsells.some((kind) => kind === 'recipe_book' && upsellDrafts[kind].nextStep === 'builder');
      const wantsRoutine = freeOfferType === 'routine' || selectedUpsells.some((kind) => (kind === 'routine' || kind === 'routine_guidance') && upsellDrafts[kind].nextStep === 'builder');
      const recipeBuilderKind = selectedUpsells.find((kind) => kind === 'recipe_book' && upsellDrafts[kind].nextStep === 'builder');
      const protocolBuilderKind = selectedUpsells.find((kind) => (kind === 'routine' || kind === 'routine_guidance') && upsellDrafts[kind].nextStep === 'builder');
      if (wantsRecipes) await createGuideRecipe(userId, { title: recipeBuilderKind ? upsellDrafts[recipeBuilderKind].title : leadMagnetTitle.trim() || suggestedFreeOffer.title, description: recipeBuilderKind ? upsellDrafts[recipeBuilderKind].audienceValue : freeAudienceValue.trim() || 'Recipe collection draft', meal_slot: 'any' });
      if (wantsRoutine && !onboardingProtocol) await createProtocol(accessToken, { user_id: userId, name: protocolBuilderKind ? upsellDrafts[protocolBuilderKind].title : leadMagnetTitle.trim() || suggestedFreeOffer.title, description: `${protocolBuilderKind ? upsellDrafts[protocolBuilderKind].audienceValue : freeAudienceValue.trim()} ${protocolContext}`.trim(), target_gender: audience.length === 1 && (audience[0] === 'Women' || audience[0] === 'Men') ? audience[0] : 'Everyone', total_days: 3 });
      window.history.pushState({}, '', `/guardians/${profile.slug}/value-ramp/${valueRampSlug}`);
      onDone(profile);
    } catch (e: any) { setError(e.message?.includes('guide_profiles') ? 'Guardian database is not installed yet. Apply the portal migration first.' : e.message); }
    finally { setBusy(false); }
  }
  const steps = [
    { n: 1, label: 'Profile', title: 'Start with what you know.', copy: 'Add your name and any public profile you want us to learn from.', image: '/images/guides/guide-plate.png' },
    { n: 2, label: 'Guidance', title: 'Where can you help?', copy: 'Choose the areas where your experience is most useful.', image: '/images/guides/build-plate.png' },
    { n: 3, label: 'Audience', title: 'Who do you help?', copy: 'Tell us who you work with and the problems you help solve.', image: '/images/guides/lead-plate.png' },
    { n: 4, label: 'Value Ramp', title: 'Build your value ramp.', copy: 'Plan the journey, then build every free and paid offer it contains.', image: '/images/guides/offer-plate.png' },
    { n: 5, label: 'Site', title: 'Build your site.', copy: 'Preview the customer journey, then publish.', image: '/images/guides/guide-plate.png' },
  ];
  const activeStep = steps[step - 1];
  const rampAudienceOptions = audience.length ? audience : ['Everyone'];
  const rampTargetAudience = rampAudienceOptions.includes(rampAudience) ? rampAudience : rampAudienceOptions[0];
  const rampProblemOptions = audienceProblemsByGroup[rampTargetAudience] || [];
  const rampTargetProblem = rampProblemOptions.includes(rampProblem) ? rampProblem : rampProblemOptions[0] || chosen[0] || 'wellbeing';
  const routineAgeOptions = targetAgeRanges[routineGender] || targetAgeRanges.Everyone;
  const routineLifeStageOptions = targetLifeStages[routineGender] || targetLifeStages.Everyone;
  const routineNameTopic = rampTargetProblem.toLowerCase().replace(/ problems?$/, '').replace(/ changes?$/, ' balance');
  const routineNameLifeStage = routineLifeStage !== 'Not specified' ? `${routineLifeStage.toLowerCase()} ` : '';
  const routineNameAudience = routineGender === 'Everyone' ? rampTargetAudience.toLowerCase() : routineGender.toLowerCase();
  const routineTitlePrefix = 'R3 Protocol > ';
  const suggestedRoutineName = `${routineTitlePrefix}7-day ${routineNameLifeStage}${routineNameTopic} challenge for ${routineNameAudience}`;
  const leadMagnetIdeas = [
    `${routineTitlePrefix}3-day ${routineNameTopic} reset for ${routineNameAudience}`,
    `${routineTitlePrefix}5-day ${routineNameLifeStage}${routineNameTopic} starter plan`,
    `${routineTitlePrefix}7-day ${routineNameLifeStage}${routineNameTopic} challenge for ${routineNameAudience}`,
    `${routineTitlePrefix}14-day ${routineNameTopic} foundations`,
    `${routineTitlePrefix}Morning ${routineNameTopic} routine`,
    `${routineTitlePrefix}Evening ${routineNameTopic} routine`,
    `${routineTitlePrefix}${rampTargetProblem} first-aid plan`,
    `${routineTitlePrefix}${routineNameLifeStage}${routineNameTopic} daily checklist`,
    `${routineTitlePrefix}${routineNameTopic} habit tracker`,
    `${routineTitlePrefix}${routineNameTopic} self-assessment and action plan`,
    `${routineTitlePrefix}Weekend ${routineNameTopic} reset`,
    `${routineTitlePrefix}30-day ${routineNameTopic} roadmap`,
    `${routineTitlePrefix}${routineNameTopic} quick-start guide for ${routineNameAudience}`,
    `${routineTitlePrefix}Five changes for better ${routineNameTopic}`,
    `${routineTitlePrefix}${routineNameLifeStage}${routineNameTopic} myth and action guide`,
    `${routineTitlePrefix}Personal ${routineNameTopic} planner`,
    `${routineTitlePrefix}${routineNameTopic} preparation guide`,
    `${routineTitlePrefix}${routineNameTopic} progress journal`,
  ];
  const guardianSlug = displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || userId.slice(0, 8);
  const valueRampSlug = (leadMagnetTitle || suggestedRoutineName).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'value-ramp';
  const publishedSitePath = `/guardians/${guardianSlug}/value-ramp/${valueRampSlug}`;
  useEffect(() => {
    if (rampAudience !== rampTargetAudience) setRampAudience(rampTargetAudience);
    if (rampProblem !== rampTargetProblem) setRampProblem(rampTargetProblem);
  }, [rampAudience, rampProblem, rampTargetAudience, rampTargetProblem]);
  useEffect(() => {
    if (freeOfferType === 'routine') setLeadMagnetTitle(suggestedRoutineName);
  }, [freeOfferType, suggestedRoutineName]);
  const perspectiveTitle = activeStep.title;
  const activeStepImage = step === 2 ? realmImages[realm] : activeStep.image;
  const activeFreeOfferArt = freeOfferArt[freeOfferType];
  const activeFreeOfferArtCol = activeFreeOfferArt.index % activeFreeOfferArt.cols;
  const activeFreeOfferArtRow = Math.floor(activeFreeOfferArt.index / activeFreeOfferArt.cols);
  const orderedUpsells = [...selectedUpsells].sort((a, b) => {
    const accessOrder = Number(offerAccess[a] === 'paid') - Number(offerAccess[b] === 'paid');
    return accessOrder || Number(upsellDrafts[a].price || 0) - Number(upsellDrafts[b].price || 0);
  });
  const offerCards = [...upsellSuggestions]
    .sort((a, b) => Number(offerAccess[a.kind] === 'paid') - Number(offerAccess[b.kind] === 'paid') || Number(upsellDrafts[a.kind].price || 0) - Number(upsellDrafts[b.kind].price || 0));
  const funnelStages = [
    { title: leadMagnetTitle || suggestedFreeOffer.title, value: freeAudienceValue, meta: `Free · ${freeDelivery.join(' + ')}`, action: freeOfferCta[freeOfferType] },
    ...orderedUpsells.map((kind) => ({ title: upsellDrafts[kind].title, value: upsellDrafts[kind].audienceValue, meta: `${offerAccess[kind] === 'free' ? 'Free' : `${formatMoney(upsellDrafts[kind].price, currency)}${billingLabels[upsellDrafts[kind].billingModel].suffix}`} · ${kind === 'one_to_one_call' ? 'Limited offer · 30% off · ' : ''}${upsellDrafts[kind].delivery.join(' + ')}`, action: nextStepLabels[upsellDrafts[kind].nextStep].title })),
  ];
  const leadEmailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadCaptureValue.trim());
  const builtOfferCount = Number(freeOfferSetupStage >= 2) + orderedUpsells.filter((kind) => (paidOfferSetupStages[kind] || 0) >= 3).length;
  const totalOfferCount = orderedUpsells.length + 1;
  const openOfferEditor = (kind?: UpsellKind) => {
    const targetId = kind ? `offer-builder-${kind}` : 'offer-builder-entry';
    window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  async function openProtocolBuilder(kind?: 'routine' | 'routine_guidance') {
    if (onboardingProtocol) { setProtocolEditorVisible(false); setProtocolBuilderOpen(true); return; }
    setCreatingProtocol(true); setError('');
    try {
      const draft = kind ? upsellDrafts[kind] : null;
      const protocol = await createProtocol(accessToken, {
        user_id: userId,
        name: draft?.title.trim() || leadMagnetTitle.trim() || suggestedRoutineName,
        description: `${draft?.audienceValue.trim() || freeAudienceValue.trim()} Audience: ${rampTargetAudience}. Population: ${routineGender}. Age: ${routineAge}. Health stage: ${routineLifeStage}. Goal: ${rampTargetProblem}.${protocolBrief.trim() ? ` Creator brief: ${protocolBrief.trim()}` : ''}${protocolSourceUrls.trim() ? ` Sources: ${protocolSourceUrls.trim().replace(/\n+/g, ', ')}` : ''}`.trim(),
        target_gender: routineGender,
        total_days: 7,
      });
      setOnboardingProtocol(protocol);
      setProtocolEditorVisible(false);
      setProtocolBuilderOpen(true);
    } catch (e: any) { setError(e.message || 'Could not create the Protocol draft.'); }
    finally { setCreatingProtocol(false); }
  }
  const protocolBuilderRequest = `Build a practical 7-day ${rampTargetProblem.toLowerCase()} Protocol for ${routineGender.toLowerCase()}, age ${routineAge}, at the ${routineLifeStage.toLowerCase()} stage. Use ROUTINE³ health database items and smart lists where suitable. Group meals as breakfast, lunch, dinner, snack or drink; group activities as fitness, wellness or hygiene. Include safe timings, amounts, adaptations, cautions and when to seek clinical advice.${protocolBrief.trim() ? ` Creator brief: ${protocolBrief.trim()}` : ''}${protocolSourceUrls.trim() ? ` Sources to consider: ${protocolSourceUrls.trim().replace(/\n+/g, ', ')}.` : ''}`;
  const activeFunnelStage = funnelStages[Math.min(funnelPreviewStage, funnelStages.length - 1)];
  const postPurchaseOffer = funnelStages[funnelPreviewStage + 1];
  useEffect(() => {
    if (funnelPageState !== 'post_purchase' || funnelTimerSeconds <= 0) return;
    const timer = window.setInterval(() => setFunnelTimerSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [funnelPageState, funnelTimerSeconds]);

  function confirmFunnelOffer() {
    setFunnelPageState('checkout');
  }

  function completeFunnelCheckout() {
    if (funnelPreviewStage === 0 && !leadEmailIsValid) return;
    setFunnelPurchases((current) => current.includes(activeFunnelStage.title) ? current : [...current, activeFunnelStage.title]);
    setFunnelPageState('access');
  }

  function continueAfterAccess() {
    if (funnelPreviewStage >= funnelStages.length - 1) { setFunnelPageState('complete'); return; }
    setFunnelTimerSeconds(600);
    setFunnelPageState('post_purchase');
  }

  function resolvePostPurchase(accepted: boolean) {
    const nextIndex = funnelPreviewStage + 1;
    if (accepted && postPurchaseOffer) setFunnelPurchases((current) => current.includes(postPurchaseOffer.title) ? current : [...current, postPurchaseOffer.title]);
    setFunnelUnlockedStage((current) => Math.max(current, nextIndex));
    setFunnelPreviewStage(nextIndex);
    if (accepted) setFunnelPageState('access');
    else if (nextIndex >= funnelStages.length - 1) setFunnelPageState('complete');
    else setFunnelPageState('offer');
  }
  if (onboardingProtocol && protocolBuilderOpen) return <div style={{ minHeight: '100vh', background: '#F5F4EF', color: '#151515', fontFamily: sans }}>
    <header style={{ minHeight: 64, borderBottom: '1px solid #C9C6BC', padding: '10px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, background: '#11120F' }}><Brand /><span style={{ color: muted, fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>R3 Protocol Builder</span><button type="button" onClick={() => { setProtocolEditorVisible(false); setProtocolBuilderOpen(false); }} style={{ ...btn, minHeight: 38, background: 'transparent', color: ink }}>← Back to Value Ramp</button></header>
    <main style={{ padding: 'clamp(16px,3vw,34px)' }}>
      <section aria-label="Selected Protocol offer" style={{ maxWidth: 1120, margin: '0 auto 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 18, alignItems: 'stretch' }}>
        <div style={{ minHeight: 360, border: `1px solid ${acid}`, background: '#20251B', color: ink, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <span style={{ position: 'absolute', zIndex: 2, top: 16, left: 16, width: 30, height: 30, border: `1px solid ${acid}`, borderRadius: '50%', display: 'grid', placeItems: 'center', color: acid, fontSize: 8, fontWeight: 700 }}>01</span>
          <span style={{ position: 'absolute', zIndex: 2, top: 16, right: 16, background: ink, color: black, padding: '10px 14px', fontSize: 9, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase' }}>Lead magnet · Free</span>
          <div style={{ flex: '1 1 auto', padding: '68px clamp(22px,4vw,48px) 28px', display: 'grid', gridTemplateColumns: 'minmax(150px,220px) minmax(0,1fr)', gap: 'clamp(22px,4vw,46px)', alignItems: 'center' }}>
            <img src="/images/guides/generated/r3-protocol-card.png" alt="Printed Protocol and interactive ROUTINE³ app" style={{ display: 'block', width: '100%', maxWidth: 220, aspectRatio: '1', objectFit: 'contain' }} />
            <span><span style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${line}` }} /> : <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1px solid ${line}`, fontFamily: serif }}>{(displayName || 'G')[0]}</span>}<span style={{ color: muted, fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>By {displayName || 'your Guardian'}</span></span><strong style={{ display: 'block', fontSize: 'clamp(21px,3vw,32px)', lineHeight: 1.16 }}>{onboardingProtocol.name || leadMagnetTitle}</strong><span style={{ display: 'block', marginTop: 11, color: muted, fontSize: 11, lineHeight: 1.55 }}>{freeAudienceValue}</span><span style={{ display: 'block', marginTop: 14 }}><CustomerValueStars score={5} compact /></span></span>
          </div>
          <div style={{ borderTop: `1px solid ${line}`, minHeight: 58, padding: '0 22px', background: 'rgba(245,242,234,.025)', display: 'flex', alignItems: 'center' }}><strong style={{ color: acid, fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase' }}>R3 Protocol · Step 01</strong></div>
        </div>
        <div style={{ border: '1px solid #C9C6BC', background: '#FFF', color: '#151515', padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><span><span style={{ display: 'block', color: '#6E7C4B', fontSize: 9, fontWeight: 800, letterSpacing: '.11em', textTransform: 'uppercase' }}>Selected offer</span><h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 300, lineHeight: 1.1, margin: '10px 0' }}>Build its Protocol.</h2><p style={{ color: '#686762', fontSize: 11, lineHeight: 1.6, margin: 0 }}>The audience, source material and generated ROUTINE³ steps below belong to this offer.</p></span><span style={{ color: '#6E7C4B', fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{protocolEditorVisible ? 'Editing Protocol' : 'Setup in progress'}</span></div>
      </section>
      <GuardianProtocolAI
        accessToken={accessToken}
        protocol={onboardingProtocol}
        ownerId={userId}
        initialRequest={protocolBuilderRequest}
        initialSourceUrls={protocolSourceUrls}
        initialSourcePath={leadMagnetPath}
        audienceProfile={{ audience: rampTargetAudience, population: routineGender, age: routineAge, stage: routineLifeStage, problem: rampTargetProblem }}
        progressive
        onBuilt={() => { setOnboardingProtocolRevision((value) => value + 1); setFreeOfferSetupStage(2); }}
        onRevealEditor={() => setProtocolEditorVisible(true)}
      />
      {protocolEditorVisible && <ProtocolEditor key={`${onboardingProtocol.id}-${onboardingProtocolRevision}`} accessToken={accessToken} initialProtocolId={onboardingProtocol.id} ownerId={userId} />}
    </main>
  </div>;
  return <div onPointerMove={tiltCard} onPointerOut={resetTilt} style={{ minHeight: '100vh', background: black, color: ink, padding: '30px clamp(20px,6vw,90px)', fontFamily: sans }}>
    <style>{`@keyframes guardian-orbit{to{transform:rotate(360deg)}}.guardian-image-loader{animation:guardian-orbit 1.8s linear infinite}.guardian-card{--card-rotate-x:0deg;--card-rotate-y:0deg;transition:transform 160ms ease,border-color 180ms ease,box-shadow 180ms ease,background-color 180ms ease;transform-origin:center;transform-style:preserve-3d;will-change:transform;text-align:left}.guardian-card>span[aria-hidden="true"],.guardian-card [role="img"]{margin-left:0!important;margin-right:0!important}.guardian-card img{transition:filter 180ms ease;filter:grayscale(1) contrast(.92)!important}.guardian-card:hover{transform:perspective(700px) translateY(-5px) rotateX(var(--card-rotate-x)) rotateY(var(--card-rotate-y));box-shadow:0 16px 30px rgba(0,0,0,.3)}.guardian-card:not([aria-pressed="true"]):not([aria-disabled="true"]):hover{border-color:#A56B48!important;background-color:#171811!important}.guardian-card:hover img{filter:grayscale(0) contrast(1.02) saturate(1.08)!important}.guardian-card[aria-disabled="true"]:hover{transform:none;box-shadow:none}.guardian-card:focus-visible{outline:2px solid #C7D8A3;outline-offset:3px}@media(prefers-reduced-motion:reduce){.guardian-card,.guardian-image-loader{transition:none;animation:none}.guardian-card:hover{transform:none!important}}`}</style>
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <Brand />
      <nav aria-label="Guardian workspace" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button type="button" onClick={() => setSummaryView('offers')} style={{ padding: 0, border: 0, borderBottom: summaryView === 'offers' ? `1px solid ${ink}` : '1px solid transparent', background: 'transparent', color: summaryView === 'offers' ? ink : muted, cursor: 'pointer', fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Offers <span style={{ color: acid }}>{builtOfferCount}/{totalOfferCount}</span></button>
        <button type="button" onClick={() => setSummaryView('sites')} style={{ padding: 0, border: 0, borderBottom: summaryView === 'sites' ? `1px solid ${ink}` : '1px solid transparent', background: 'transparent', color: summaryView === 'sites' ? ink : muted, cursor: 'pointer', fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Sites <span style={{ color: acid }}>2</span></button>
      </nav>
    </div>
    <div aria-label="Guardian setup progress" style={{ maxWidth: 1100, margin: '42px auto 0', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` }}>
      {steps.map((item) => <button type="button" key={item.n} onClick={() => { setSummaryView(null); setStep(item.n); }} aria-current={!summaryView && step === item.n ? 'step' : undefined} style={{ height: 54, border: 0, borderRight: item.n < 5 ? `1px solid ${line}` : 0, background: !summaryView && step === item.n ? ink : 'transparent', color: !summaryView && step === item.n ? black : item.n < step ? acid : muted, fontFamily: sans, cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>{String(item.n).padStart(2, '0')} · {item.label}</button>)}
    </div>
    {summaryView && <section style={{ maxWidth: 1100, margin: '52px auto', border: `1px solid ${line}`, background: panel }}>
      <div style={{ padding: 22, borderBottom: `1px solid ${line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span><span style={{ ...label, color: acid }}>{summaryView === 'offers' ? 'Offer inventory' : 'Site inventory'}</span><h1 style={{ margin: '7px 0 0', fontFamily: serif, fontWeight: 300, fontSize: 42 }}>{summaryView === 'offers' ? 'All offers' : 'All sites'}</h1></span>
        <button type="button" onClick={() => { setInventoryMenu(null); setSummaryView(null); }} style={{ ...btn, background: 'transparent', color: ink }}>Back to setup</button>
      </div>
      {summaryView === 'offers' ? <div><div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, background: '#171913' }}>
        <span style={{ ...label, color: acid, marginBottom: 7 }}>Value Ramp</span>
        <h2 style={{ margin: '0 0 14px', fontFamily: serif, fontSize: 28, fontWeight: 300 }}>{leadMagnetTitle || suggestedRoutineName}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {[['Audience', rampTargetAudience], ['Gender', routineGender], ['Age', routineAge], ['Life stage', routineLifeStage], ['Problem', rampTargetProblem]].map(([key, value]) => <span key={key} style={{ border: `1px solid ${line}`, padding: '7px 9px', color: muted, fontSize: 8, lineHeight: 1.3 }}><strong style={{ color: ink, textTransform: 'uppercase', letterSpacing: '.08em' }}>{key}</strong> · {value}</span>)}
        </div>
      </div><div style={{ marginLeft: 24, borderLeft: `1px solid ${acid}` }}>{[
        { key: 'lead', title: leadMagnetTitle || 'Entry offer', meta: `${freeOfferTypes.find((item) => item.value === freeOfferType)?.label} · Free`, built: freeOfferSetupStage >= 2, art: freeOfferArt[freeOfferType], kind: undefined as UpsellKind | undefined },
        ...orderedUpsells.map((kind) => ({ key: kind, title: upsellDrafts[kind].title, meta: `${offerAccess[kind] === 'paid' ? `${formatMoney(upsellDrafts[kind].price, currency)}${billingLabels[upsellDrafts[kind].billingModel].suffix}` : 'Free'} · ${upsellSuggestions.find((item) => item.kind === kind)?.label || kind}`, built: (paidOfferSetupStages[kind] || 0) >= 3, art: offerTypeArt[kind], kind })),
      ].map((offer) => {
        const openBuilder = (createContent: boolean) => {
          setInventoryMenu(null);
          setSummaryView(null);
          setStep(4);
          setOfferPlanStage(2);
          if (createContent) offer.kind ? setPaidOfferSetupStages((current) => ({ ...current, [offer.kind!]: Math.max(1, current[offer.kind!] || 0) })) : setFreeOfferSetupStage((current) => Math.max(1, current));
          openOfferEditor(offer.kind);
        };
        const offerIndex = offer.key === 'lead' ? 0 : orderedUpsells.indexOf(offer.kind!) + 1;
        return <div key={offer.key} style={{ position: 'relative', minHeight: 96, padding: '16px 18px', borderBottom: `1px solid ${line}`, display: 'grid', gridTemplateColumns: '32px 54px minmax(0,1fr) auto auto', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 28, height: 28, marginLeft: -33, border: `1px solid ${acid}`, borderRadius: '50%', background: panel, color: acid, display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 800 }}>{String(offerIndex + 1).padStart(2, '0')}</span>
          <InventoryThumb art={offer.art} />
          <span><strong style={{ display: 'block', color: ink, fontSize: 13 }}>{offer.title}</strong><span style={{ display: 'block', color: muted, fontSize: 9, marginTop: 4 }}>{offer.meta}</span><span style={{ display: 'block', color: acid, fontSize: 7, marginTop: 7, letterSpacing: '.07em', textTransform: 'uppercase' }}>{rampTargetAudience} · {routineGender} · {routineAge} · {rampTargetProblem}</span></span>
          <span style={{ color: offer.built ? acid : '#D49A74', fontSize: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{offer.built ? 'Built' : 'Draft'}</span>
          <button type="button" aria-label={`Actions for ${offer.title}`} aria-expanded={inventoryMenu === offer.key} onClick={() => setInventoryMenu((current) => current === offer.key ? null : offer.key)} style={{ width: 38, height: 38, border: `1px solid ${line}`, background: 'transparent', color: ink, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><MoreHorizontal size={19} /></button>
          {inventoryMenu === offer.key && <div role="menu" style={{ position: 'absolute', zIndex: 8, right: 18, top: 60, width: 158, border: `1px solid ${line}`, background: black, boxShadow: '0 14px 28px rgba(0,0,0,.42)', padding: 4 }}>
            <button type="button" role="menuitem" onClick={() => openBuilder(false)} style={{ width: '100%', border: 0, background: 'transparent', color: ink, padding: '10px 12px', textAlign: 'left', fontFamily: sans, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
            <button type="button" role="menuitem" onClick={() => openBuilder(true)} style={{ width: '100%', border: 0, borderTop: `1px solid ${line}`, background: 'transparent', color: ink, padding: '10px 12px', textAlign: 'left', fontFamily: sans, fontWeight: 700, cursor: 'pointer' }}>Create content</button>
          </div>}
        </div>;
      })}</div></div> : <div style={{ padding: 22, display: 'grid', gap: 10 }}>
        {[
          { key: 'profile-site', type: 'Profile site', title: `${displayName || 'Guardian'} profile`, path: `/guardians/${guardianSlug}`, previewId: 'profile-site-preview' },
          { key: 'funnel-site', type: 'Value Ramp funnel', title: leadMagnetTitle || 'Value Ramp site', path: publishedSitePath, previewId: 'value-ramp-funnel-preview' },
        ].map((site) => <div key={site.key} style={{ position: 'relative', border: `1px solid ${line}`, minHeight: 92, padding: 14, display: 'grid', gridTemplateColumns: '82px minmax(0,1fr) auto auto', gap: 16, alignItems: 'center' }}>
          <img src={effectiveBackground} alt="" style={{ width: 82, height: 62, objectFit: 'cover', filter: 'grayscale(1)' }} />
          <span><span style={{ display: 'block', color: acid, fontSize: 7, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 5 }}>{site.type}</span><strong style={{ display: 'block', color: ink, fontSize: 13 }}>{site.title}</strong><code style={{ display: 'block', color: muted, fontSize: 9, marginTop: 6 }}>{site.path}</code></span>
          <span style={{ color: '#D49A74', fontSize: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Draft</span>
          <button type="button" aria-label={`Actions for ${site.title}`} aria-expanded={inventoryMenu === site.key} onClick={() => setInventoryMenu((current) => current === site.key ? null : site.key)} style={{ width: 38, height: 38, border: `1px solid ${line}`, background: 'transparent', color: ink, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><MoreHorizontal size={19} /></button>
          {inventoryMenu === site.key && <div role="menu" style={{ position: 'absolute', zIndex: 8, right: 14, top: 64, width: 158, border: `1px solid ${line}`, background: black, boxShadow: '0 14px 28px rgba(0,0,0,.42)', padding: 4 }}>
            <button type="button" role="menuitem" onClick={() => { setInventoryMenu(null); setSummaryView(null); setStep(5); setSiteStyleStage(site.key === 'profile-site' ? 0 : 2); }} style={{ width: '100%', border: 0, background: 'transparent', color: ink, padding: '10px 12px', textAlign: 'left', fontFamily: sans, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
            <button type="button" role="menuitem" onClick={() => { setInventoryMenu(null); setSummaryView(null); setStep(5); window.setTimeout(() => document.getElementById(site.previewId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} style={{ width: '100%', border: 0, borderTop: `1px solid ${line}`, background: 'transparent', color: ink, padding: '10px 12px', textAlign: 'left', fontFamily: sans, fontWeight: 700, cursor: 'pointer' }}>Preview and test</button>
          </div>}
        </div>)}
      </div>}
    </section>}
    {!summaryView && <form onSubmit={submit} style={{ maxWidth: 1100, margin: '52px auto' }}>
      <div style={{ display: 'block' }}>
        <aside style={{ display: 'none' }}>
          <div style={{ ...label, color: acid }}>Step {step} · {activeStep.label}</div>
          <img src={activeStepImage} alt="" style={{ width: '100%', maxWidth: 220, height: 220, objectFit: 'contain', filter: 'grayscale(1) contrast(.92) brightness(.8)', opacity: .92, margin: '12px 0 18px' }} />
          <p style={{ color: muted, fontSize: 12, lineHeight: 1.65, maxWidth: 220, margin: 0 }}>{activeStep.copy}</p>
        </aside>
        <section style={{ width: '100%', maxWidth: 920, minWidth: 0, margin: '0 auto' }}>
          <header style={{ maxWidth: 720, margin: '0 auto 44px', textAlign: 'center' }}>
            <div style={{ ...label, color: acid }}>Guardian setup · {step} of 5</div>
            <img src={activeStepImage} alt="" style={{ display: 'block', width: 138, height: 138, objectFit: 'contain', filter: 'grayscale(1) contrast(.92) brightness(.86)', margin: '18px auto 14px' }} />
            <h1 style={{ color: ink, fontFamily: serif, fontSize: 'clamp(44px,7vw,76px)', fontWeight: 300, lineHeight: .98, margin: 0 }}>{perspectiveTitle}</h1>
            <p style={{ color: muted, fontSize: 14, lineHeight: 1.6, margin: '14px auto 0', maxWidth: 600 }}>{activeStep.copy}</p>
          </header>

      {step === 1 && <>
      <div style={{ border: `1px solid ${line}`, background: panel, padding: 16, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <span><label style={{ ...label, color: ink }}>Choose a brand</label><span style={{ color: muted, fontSize: 10 }}>Use your own name or select one of your business brands for this Value Ramp.</span></span>
          <button type="button" onClick={addBrand} style={{ ...btn, ...compactControl, background: 'transparent', color: ink }}><Plus size={13} /> Add brand</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 8 }}>
          {brandProfiles.map((brand) => { const active = brand.localId === activeBrandId; const visibleName = active ? displayName : brand.name; const visibleLogo = active ? logoUrl : brand.logo_url; return <button type="button" key={brand.localId} onClick={() => selectBrand(brand.localId)} aria-pressed={active} style={{ ...pickStyle(false), minHeight: 76, height: 'auto', padding: 12, justifyContent: 'flex-start', textAlign: 'left', gap: 10, borderColor: active ? acid : line, background: active ? '#20251B' : 'transparent', color: ink }}>
            <span style={{ width: 38, height: 38, flex: '0 0 38px', display: 'grid', placeItems: 'center', border: `1px solid ${active ? black : line}`, background: active ? 'rgba(9,10,8,.08)' : black, overflow: 'hidden' }}>{visibleLogo ? <img src={visibleLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontFamily: serif, fontSize: 18 }}>{visibleName.trim().charAt(0) || 'B'}</span>}</span>
            <span><strong style={{ display: 'block', fontSize: 11 }}>{visibleName || 'Untitled brand'}</strong><span style={{ display: 'block', marginTop: 4, fontSize: 8, opacity: .68, textTransform: 'uppercase', letterSpacing: '.08em' }}>{brand.kind === 'personal' ? 'Personal brand' : 'Business brand'}{active ? ' · selected' : ''}</span></span>
          </button>; })}
        </div>
        {activeBrandId !== 'personal' && <button type="button" onClick={removeActiveBrand} style={{ border: 0, background: 'transparent', color: muted, fontFamily: sans, fontSize: 8, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 10, padding: 0, cursor: 'pointer' }}>Remove this brand</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <div><label style={label}>{activeBrandId === 'personal' ? 'Your public name' : 'Brand name'}</label><div style={{ position: 'relative' }}>{avatarUrl && <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ position: 'absolute', zIndex: 1, left: 9, top: 7, width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${line}` }} />}<input style={{ ...input, paddingLeft: avatarUrl ? 48 : 12 }} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div></div>
        <div><label style={label}>Main language</label><div style={{ position: 'relative' }}><span aria-hidden="true" style={{ position: 'absolute', zIndex: 1, left: 11, top: 11, fontSize: 16 }}>{languageOptions.find((language) => language.name === mainLanguage)?.flag || '🌐'}</span><select style={{ ...input, paddingLeft: 42 }} value={mainLanguage} onChange={(event) => setMainLanguage(event.target.value)}>{languageOptions.map((language) => <option key={language.code} value={language.name}>{language.name}</option>)}</select></div></div>
        <div><label style={label}>Pricing region</label><select style={input} value={pricingRegion} onChange={(event) => { const option = pricingRegions.find((item) => item.region === event.target.value); if (option) { setPricingRegion(option.region); setCurrency(option.currency); } }}>{pricingRegions.map((option) => <option key={option.region} value={option.region}>{option.label}</option>)}</select></div>
      </div>
      <div style={{ borderTop: `1px solid ${line}`, paddingTop: 18, marginTop: 20 }}>
        <label style={{ ...label, color: ink }}>Profile image <span style={{ color: muted }}>· optional</span></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {avatarUrl ? <img src={avatarUrl} alt="Profile" referrerPolicy="no-referrer" style={{ width: 64, height: 64, objectFit: 'cover', border: `1px solid ${line}` }} /> : <span aria-hidden="true" style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', border: `1px solid ${line}`, color: muted, fontFamily: serif, fontSize: 24 }}>{displayName.trim().charAt(0) || 'B'}</span>}
          <label style={{ ...btn, height: 38, boxSizing: 'border-box', background: 'transparent', color: ink, fontSize: 9 }}>
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}{uploading ? 'Uploading' : avatarUrl ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPortrait(event.target.files?.[0])} style={{ display: 'none' }} />
          </label>
        </div>
        <p style={{ color: muted, fontSize: 10, lineHeight: 1.5, margin: '9px 0 0' }}>Used on your brand card, profile and published site.</p>
        {importMessage && <p style={{ color: importMessage.startsWith('Imported') ? acid : muted, fontSize: 11, lineHeight: 1.5, margin: '10px 0 0' }}>{importMessage}</p>}
      </div>
      <p style={{ color: muted, fontSize: 10, lineHeight: 1.5, margin: '9px 0 0' }}>Language applies to your page and content. Pricing region sets the currency for every paid stage.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 18 }}>
        <div><label style={label}>Contact email</label><input type="email" style={input} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <div><label style={label}>WhatsApp number <span style={{ color: muted }}>· optional</span></label><input type="tel" inputMode="tel" style={input} value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="+44 7700 900000" /></div>
      </div>
      <p style={{ color: muted, fontSize: 10, lineHeight: 1.5, margin: '9px 0 0' }}>If you add WhatsApp, include the international country code. These details can be changed before your Guardian page is published.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 22 }}>
        <SocialUrlField label="Instagram" Icon={Instagram} value={instagramUrl} onChange={setInstagramUrl} placeholder="https://instagram.com/yourname" />
        <SocialUrlField label="TikTok" Icon={AtSign} value={tiktokUrl} onChange={setTiktokUrl} placeholder="https://tiktok.com/@yourname" />
        <SocialUrlField label="YouTube" Icon={Youtube} value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/@yourname" />
        <SocialUrlField label="Linktree" Icon={Link2} value={linktreeUrl} onChange={setLinktreeUrl} placeholder="https://linktr.ee/yourname" />
        <SocialUrlField label="Personal website" Icon={Globe2} value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://yourwebsite.com" />
      </div>
      {importedProfile?.topics.length ? <div style={{ borderTop: `1px solid ${line}`, paddingTop: 18, marginTop: 24 }}><span style={label}>Detected guidance</span><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{importedProfile.topics.map((topic) => <span key={topic} style={{ border: `1px solid ${acid}`, color: acid, padding: '6px 9px', fontSize: 10 }}>{topic}</span>)}</div></div> : null}
      <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginTop: 24 }}>
        <label style={{ ...label, color: ink }}>How should clients book with you? <span style={{ color: muted }}>· optional</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 7, marginBottom: 10 }}>
          {bookingProviders.map((provider) => <button type="button" key={provider.value} onClick={() => setBookingProvider(provider.value)} style={{ ...pickStyle(bookingProvider === provider.value), whiteSpace: 'nowrap', minWidth: 0 }}>{provider.label}</button>)}
        </div>
        <input type="url" style={input} value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} placeholder={bookingProviders.find((provider) => provider.value === bookingProvider)?.placeholder} />
        <p style={{ color: muted, fontSize: 9, lineHeight: 1.5, margin: '8px 0 0' }}>This becomes the default booking link for live guidance, group calls, 1:1 sessions and in-person offers.</p>
      </div>
      </>}

      {step === 2 && <div>
        <label style={label}>What can you help with?</label>
        <div role="tablist" aria-label="Guidance area" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: `1px solid ${line}`, marginBottom: 12 }}>
          {(Object.keys(specialtyGroups) as GuideRealm[]).map((item, index) => {
            const count = specialtyGroups[item].filter((option) => chosen.includes(option)).length;
            const active = realm === item;
            return <button type="button" role="tab" aria-selected={active} key={item} onClick={() => setRealm(item)} style={{ minHeight: 46, border: 0, borderLeft: index ? `1px solid ${line}` : 0, background: active ? ink : 'transparent', color: active ? black : ink, fontFamily: sans, fontSize: 11, fontWeight: 500, letterSpacing: '.12em', cursor: 'pointer' }}>{item.toUpperCase()}{count ? ` · ${count}` : ''}</button>;
          })}
        </div>
        <div role="tabpanel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 8, minHeight: 84, alignContent: 'flex-start' }}>
          {specialtyGroups[realm].map((s) => <TagChoice key={s} text={s} description={specialtyHelp[s]} active={chosen.includes(s)} art={specialtyArt[realm][s]} onClick={() => setChosen((v) => v.includes(s) ? v.filter((x) => x !== s) : [...v, s])} />)}
        </div>
        {chosen.length > 0 && <div style={{ color: muted, fontSize: 10, lineHeight: 1.5, marginTop: 8 }}>Selected: {chosen.join(' · ')}</div>}
      </div>}

      {step === 3 && <>
        {audienceSetupStage > 0 && <div style={{ border: `1px solid ${line}`, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span><span style={{ ...label, marginBottom: 3 }}>Audience</span><strong style={{ color: ink, fontSize: 12, fontWeight: 600 }}>{audience.join(' · ')}</strong></span><button type="button" onClick={() => setAudienceSetupStage(0)} style={{ ...btn, minHeight: 36, height: 36, background: 'transparent', color: ink, fontSize: 9 }}>Edit</button></div>}
        {audienceSetupStage === 0 && <div><label style={label}>Who do you usually help? <span style={{ color: acid }}>· choose all that apply</span></label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 8 }}>{audiences.map((x) => <TagChoice key={x} text={x} active={audience.includes(x)} art={audienceArt[x]} onClick={() => toggleAudience(x)} />)}</div><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 14 }}><button type="button" onClick={() => setStep(2)} style={{ ...btn, background: 'transparent', color: ink }}>← Back</button><button type="button" disabled={!audience.length} onClick={() => setAudienceSetupStage(1)} style={btn}>Continue <ArrowRight size={14} /></button></div></div>}
        {audienceSetupStage > 1 && <div style={{ border: `1px solid ${line}`, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span><span style={{ ...label, marginBottom: 3 }}>Problems by audience</span><strong style={{ color: ink, fontSize: 12, fontWeight: 600 }}>{audience.map((group) => `${group}: ${(audienceProblemsByGroup[group] || []).join(', ')}`).join(' · ')}</strong></span><button type="button" onClick={() => setAudienceSetupStage(1)} style={{ ...btn, minHeight: 36, height: 36, background: 'transparent', color: ink, fontSize: 9 }}>Edit</button></div>}
        {audienceSetupStage === 1 && <div>
          <label style={label}>What problems do you help each audience with? <span style={{ color: acid }}>· choose more than one</span></label>
          <div style={{ display: 'grid', gap: 14 }}>{audience.map((group) => { const suggestions = audienceProblemSuggestionsByGroup[group] || audienceProblemSuggestions; const selected = audienceProblemsByGroup[group] || []; const customProblems = selected.filter((problem) => !audienceProblemSuggestions.includes(problem)); return <section key={group} style={{ border: `1px solid ${line}`, padding: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><span aria-hidden="true" style={{ width: 36, height: 36, flex: '0 0 36px', backgroundImage: `url(${audienceArt[group].src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${audienceArt[group].cols * 100}% ${audienceArt[group].rows * 100}%`, backgroundPosition: `${(audienceArt[group].index % audienceArt[group].cols) * 100 / Math.max(1, audienceArt[group].cols - 1)}% ${Math.floor(audienceArt[group].index / audienceArt[group].cols) * 100 / Math.max(1, audienceArt[group].rows - 1)}%`, filter: 'grayscale(1) contrast(.94)' }} /><strong style={{ color: ink, fontSize: 14 }}>{group}</strong><span style={{ color: muted, fontSize: 9 }}>{selected.length} selected</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: 7 }}>{suggestions.map((problem) => { const active = selected.includes(problem); const art = audienceProblemArt[problem]; const col = art.index % art.cols; const row = Math.floor(art.index / art.cols); return <button type="button" key={problem} onClick={() => toggleAudienceProblem(group, problem)} aria-pressed={active} style={{ position: 'relative', height: 52, border: `1px solid ${active ? ink : line}`, background: active ? ink : 'transparent', color: active ? black : ink, padding: '0 28px 0 10px', fontFamily: sans, fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center' }}>{active && <span aria-hidden="true" style={{ position: 'absolute', top: 5, right: 5, width: 15, height: 15, display: 'grid', placeItems: 'center', background: black, color: ink }}><Check size={9} strokeWidth={2.5} /></span>}<span aria-hidden="true" style={{ width: 27 * art.cellAspect, height: 27, flex: `0 0 ${27 * art.cellAspect}px`, backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${col * 100 / Math.max(1, art.cols - 1)}% ${row * 100 / Math.max(1, art.rows - 1)}%`, filter: active ? 'grayscale(1) brightness(.2)' : 'grayscale(1) contrast(.94)' }} /><span>{problem}</span></button>; })}</div><div style={{ display: 'flex', gap: 7, marginTop: 9 }}><input style={input} value={audienceProblemDrafts[group] || ''} onChange={(event) => setAudienceProblemDrafts((current) => ({ ...current, [group]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addAudienceProblem(group); } }} placeholder={`Add another issue for ${group.toLowerCase()}`} /><button type="button" onClick={() => addAudienceProblem(group)} disabled={!(audienceProblemDrafts[group] || '').trim()} style={{ ...btn, flex: '0 0 auto' }}>Add</button></div>{customProblems.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>{customProblems.map((problem) => <button type="button" key={problem} onClick={() => toggleAudienceProblem(group, problem)} title={`Remove ${problem}`} style={{ minHeight: 32, border: `1px solid ${ink}`, background: ink, color: black, padding: '0 9px', fontFamily: sans, fontSize: 9, cursor: 'pointer' }}>{problem} ×</button>)}</div>}</section>; })}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 14 }}><button type="button" onClick={() => setAudienceSetupStage(0)} style={{ ...btn, background: 'transparent', color: ink }}>← Back</button><button type="button" disabled={audience.some((group) => !(audienceProblemsByGroup[group] || []).length)} onClick={() => { setError(''); setOfferPlanStage(0); setStep(4); }} style={btn}>Continue to offers <ArrowRight size={14} /></button></div>
        </div>}
      </>}

      {step === 4 && <>
        <div style={{ border: `1px solid ${line}`, background: panel, padding: 16, marginBottom: 28 }}>
          {(() => { const stageCopy = [
            { title: 'Choose a business goal', copy: 'Decide whether this offer system should convert your current audience or help you build a larger one.' },
            { title: 'Choose your lead magnets', copy: 'Select one or more useful free offers that introduce your expertise and give people a reason to continue.' },
            { title: 'Build your value ramp', copy: 'Arrange increasingly valuable offers from the first free win through paid knowledge and personal support.' },
          ][offerPlanStage]; return <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 12, alignItems: 'center', marginBottom: 16 }}><img src={['/images/guides/offer-plate.png', '/images/guides/lead-plate.png', '/images/guides/build-plate.png'][offerPlanStage]} alt="" style={{ width: 52, height: 52, objectFit: 'contain', filter: 'grayscale(1) contrast(.94)' }} /><span><strong style={{ display: 'block', color: ink, fontFamily: serif, fontSize: 22, fontWeight: 400, lineHeight: 1.15 }}>{stageCopy.title}</strong><span style={{ display: 'block', maxWidth: 650, marginTop: 5, color: muted, fontSize: 9, lineHeight: 1.5 }}>{stageCopy.copy}</span></span></div>; })()}
          {offerPlanStage === 0 && <div>
          <label style={{ ...label, color: acid }}>Business goal</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 12 }}>
            {([
              { value: 'sell', eyebrow: 'Convert', title: 'Convert your audience', copy: 'Move from a useful free win into paid knowledge and personal support.', image: '/images/guides/offer-plate.png', flow: ['Free value', 'Paid Protocol', 'Personal support'] },
              { value: 'audience', eyebrow: 'Grow', title: 'Build your audience', copy: 'Lead with generous free value and recurring reasons to come back.', image: '/images/guides/lead-plate.png', flow: ['Free resource', 'Group call', 'Community'] },
            ] as const).map((goal) => <CreatorChoiceCard key={goal.value} creator={displayName || 'Your Guardian'} avatarUrl={avatarUrl} badge={goal.eyebrow} byline="Business goal" title={goal.title} description={goal.copy} footer={goal.flow.join(' → ')} active={offerGoal === goal.value} image={goal.image} onClick={() => applyOfferGoal(goal.value)} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 18 }}><button type="button" onClick={() => setStep(3)} style={{ ...btn, width: '100%', background: 'transparent', color: ink }}>← Back to audience</button><button type="button" onClick={() => setOfferPlanStage(1)} style={{ ...btn, width: '100%' }}>Continue <ArrowRight size={14} /></button></div>
          </div>}
          {offerPlanStage === 1 && <div>
            <div style={{ border: `1px solid ${line}`, padding: 11, marginBottom: 16, display: 'grid', gridTemplateColumns: '46px minmax(0,1fr) auto', gap: 11, alignItems: 'center' }}><img src={offerGoal === 'sell' ? '/images/guides/offer-plate.png' : '/images/guides/lead-plate.png'} alt="" style={{ width: 46, height: 46, objectFit: 'contain', filter: 'grayscale(1) contrast(.94)' }} /><span><span style={{ display: 'block', color: muted, fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Selected business goal</span><strong style={{ display: 'block', color: ink, fontSize: 12, marginTop: 4 }}>{offerGoal === 'sell' ? 'Convert your audience' : 'Build your audience'}</strong><span style={{ display: 'block', color: muted, fontSize: 8, marginTop: 3 }}>{offerGoal === 'sell' ? 'Free value → paid Protocol → personal support' : 'Free resource → group call → community'}</span></span><button type="button" onClick={() => setOfferPlanStage(0)} style={{ ...btn, minHeight: 34, height: 34, background: 'transparent', color: ink, padding: '0 11px', fontSize: 8 }}>Edit</button></div>
            <label style={label}>Choose lead magnets <span style={{ color: acid }}>· one or more</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 12 }}>{freeOfferTypes.map((offer) => { const active = selectedLeadMagnets.includes(offer.value); const toggle = () => { setSelectedLeadMagnets((current) => active ? current.length === 1 ? current : current.filter((item) => item !== offer.value) : [...current, offer.value]); if (!active) setFreeOfferType(offer.value); }; return <CreatorChoiceCard key={offer.value} creator={displayName || 'Your Guardian'} avatarUrl={avatarUrl} badge={offer.eyebrow} byline={offer.label} title={offer.label} description={offer.copy} footer={`Lead magnet · ${offer.label}`} active={active} image={freeOfferImages[offer.value]} onClick={toggle} onInfo={offer.value === 'routine' ? () => setShowProtocolInfo(true) : undefined} />; })}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 18 }}><button type="button" onClick={() => setOfferPlanStage(0)} style={{ ...btn, width: '100%', background: 'transparent', color: ink }}>← Back</button><button type="button" onClick={() => setOfferPlanStage(2)} style={{ ...btn, width: '100%' }}>Continue <ArrowRight size={14} /></button></div>
            {showProtocolInfo && <div role="presentation" onMouseDown={() => setShowProtocolInfo(false)} style={{ position: 'fixed', zIndex: 1000, inset: 0, background: 'rgba(0,0,0,.76)', padding: 20, display: 'grid', placeItems: 'center' }}>
              <section role="dialog" aria-modal="true" aria-labelledby="r3-protocol-info-title" onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(680px,100%)', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', border: `1px solid ${acid}`, background: panel, color: ink, padding: 'clamp(20px,4vw,34px)', position: 'relative' }}>
                <button type="button" onClick={() => setShowProtocolInfo(false)} aria-label="Close R3 Protocol information" style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, border: `1px solid ${line}`, background: 'transparent', color: ink, fontSize: 18, cursor: 'pointer' }}>×</button>
                <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)', gap: 18, alignItems: 'center', marginRight: 42 }}><R3CreatorBenefitArt index={0} size={96} /><span><span style={{ color: acid, fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>R3 Protocol · A remarkable creator opportunity</span><h3 id="r3-protocol-info-title" style={{ margin: '9px 0 0', fontFamily: serif, fontSize: 32, fontWeight: 400, lineHeight: 1.08 }}>Build guidance that keeps working between every conversation.</h3></span></div>
                <p style={{ margin: '14px 0 18px', color: muted, fontSize: 11, lineHeight: 1.55 }}>Give people a printable Protocol and a living digital twin in ROUTINE³. Earn recurring revenue, personalise the experience and support progress day by day.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 8 }}>
                  {[
                    ['General and specific Protocols', 'Publish a proven general Protocol, then shape specific versions around each person’s goals, age, life stage and needs.', 1],
                    ['Earn recurring revenue', 'Receive 30% of recurring ROUTINE³ subscription revenue from people attributed to your Protocol.', 2],
                    ['Private, link-only access', 'Keep Protocols out of public discovery and share access only through links you control.', 3],
                    ['See progress with permission', 'When a user opts in, see what they complete each day and where support is needed.', 4],
                    ['Adapt the next days live', 'Edit upcoming actions and refine the Protocol as the person progresses.', 5],
                    ['Re-export the latest PDF', 'Users can create a fresh printable copy whenever their Protocol changes.', 6],
                  ].map(([title, copy, artIndex]) => <div key={title} style={{ border: `1px solid ${line}`, padding: 13, display: 'grid', gridTemplateColumns: '58px minmax(0,1fr)', gap: 11, alignItems: 'center' }}><span style={{ minWidth: 58, display: 'grid', placeItems: 'center' }}><R3CreatorBenefitArt index={Number(artIndex)} /></span><span><strong style={{ display: 'block', color: acid, fontSize: 11 }}>{title}</strong><span style={{ display: 'block', marginTop: 6, color: muted, fontSize: 9, lineHeight: 1.5 }}>{copy}</span></span></div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9, marginTop: 18 }}><button type="button" onClick={() => { setSelectedLeadMagnets((current) => current.includes('routine') ? current : ['routine', ...current]); setFreeOfferType('routine'); setFreeDelivery(['Downloadable PDF', 'Interactive Protocol']); setShowProtocolInfo(false); }} style={{ ...btn, width: '100%', minHeight: 48 }}>Use R3 Protocol <ArrowRight size={14} /></button><a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ ...btn, width: '100%', minHeight: 48, boxSizing: 'border-box', background: 'transparent', color: ink, textDecoration: 'none', textAlign: 'center' }}>View ROUTINE³ on the App Store <ArrowRight size={14} /></a></div>
              </section>
            </div>}
          </div>}
          {offerPlanStage === 2 && <div>
            <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginBottom: 16 }}>
              <label style={{ ...label, color: acid }}>Create this value ramp for</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: 9 }}>
                <div><label style={{ ...label, marginBottom: 5 }}>Audience</label><select value={rampTargetAudience} onChange={(event) => { const nextAudience = event.target.value; setRampAudience(nextAudience); setRampProblem((audienceProblemsByGroup[nextAudience] || [])[0] || ''); }} style={{ ...input, paddingRight: 38 }}>{rampAudienceOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label style={{ ...label, marginBottom: 5 }}>Sex / population</label><select value={routineGender} onChange={(event) => { const nextPopulation = event.target.value; setRoutineGender(nextPopulation); setRoutineAge((targetAgeRanges[nextPopulation] || targetAgeRanges.Everyone)[0]); setRoutineLifeStage((targetLifeStages[nextPopulation] || targetLifeStages.Everyone)[0]); }} style={{ ...input, paddingRight: 38 }}>{Object.keys(targetAgeRanges).map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label style={{ ...label, marginBottom: 5 }}>Age range</label><select value={routineAge} onChange={(event) => setRoutineAge(event.target.value)} style={{ ...input, paddingRight: 38 }}>{routineAgeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label style={{ ...label, marginBottom: 5 }}>Health / life stage</label><select value={routineLifeStage} onChange={(event) => setRoutineLifeStage(event.target.value)} style={{ ...input, paddingRight: 38 }}>{routineLifeStageOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label style={{ ...label, marginBottom: 5 }}>Problem</label><select value={rampTargetProblem} onChange={(event) => setRampProblem(event.target.value)} style={{ ...input, paddingRight: 38 }}>{rampProblemOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              </div>
              <div style={{ marginTop: 12, borderLeft: `2px solid ${acid}`, padding: '3px 0 3px 10px' }}>
                <label htmlFor="value-ramp-name" style={{ display: 'block', color: muted, fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Lead magnet name <span style={{ color: acid }}>· choose an idea or type your own</span></label>
                <input id="value-ramp-name" list="lead-magnet-ideas" value={leadMagnetTitle} onChange={(event) => setLeadMagnetTitle(event.target.value)} onBlur={() => { if (freeOfferType === 'routine' && leadMagnetTitle.trim() && !leadMagnetTitle.trim().startsWith(routineTitlePrefix)) setLeadMagnetTitle(`${routineTitlePrefix}${leadMagnetTitle.trim()}`); }} placeholder={suggestedRoutineName} style={{ ...input, height: 42, minHeight: 42, fontSize: 12 }} />
                <datalist id="lead-magnet-ideas">{leadMagnetIdeas.map((idea) => <option key={idea} value={idea} />)}</datalist>
                <span style={{ display: 'block', color: muted, fontSize: 8, lineHeight: 1.4, marginTop: 6 }}>Suggested: {suggestedRoutineName}</span>
                <details style={{ marginTop: 10 }}><summary style={{ color: acid, fontSize: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Browse {leadMagnetIdeas.length} lead magnet ideas</summary><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 6, marginTop: 9 }}>{leadMagnetIdeas.map((idea) => <button type="button" key={idea} onClick={() => setLeadMagnetTitle(idea)} aria-pressed={leadMagnetTitle === idea} style={{ minHeight: 48, border: `1px solid ${leadMagnetTitle === idea ? acid : line}`, background: leadMagnetTitle === idea ? 'rgba(199,216,163,.1)' : 'transparent', color: ink, padding: '8px 10px', fontFamily: sans, fontSize: 9, lineHeight: 1.35, textAlign: 'left', cursor: 'pointer' }}>{idea}</button>)}</div></details>
              </div>
            </div>
            <label style={{ ...label, color: ink }}>Your value ramp <span style={{ color: acid }}>· value rises at every step</span></label>
            <p style={{ color: muted, fontSize: 9, lineHeight: 1.5, margin: '-1px 0 12px' }}>Add or remove steps in one continuous customer journey.</p>
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 'max-content' }}>
                {(() => { const art = freeOfferArt[freeOfferType]; return <div className="guardian-card" style={{ width: 420, flex: '0 0 420px', border: `1px solid ${acid}`, background: '#20251B', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ position: 'absolute', zIndex: 2, top: 10, left: 10, width: 24, height: 24, border: `1px solid ${acid}`, borderRadius: '50%', display: 'grid', placeItems: 'center', color: acid, fontSize: 7, fontWeight: 700 }}>01</span>
                  <span style={{ position: 'absolute', zIndex: 2, top: 10, right: 10, background: ink, color: black, padding: '8px 12px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>Lead magnet · Free</span>
                  <div style={{ minHeight: 250, padding: '58px 22px 22px', display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: 22, alignItems: 'center' }}>{freeOfferType === 'routine' ? <img src="/images/guides/generated/r3-protocol-card.png" alt="Printed Protocol and interactive ROUTINE³ app" style={{ display: 'block', width: 150, height: 150, objectFit: 'contain' }} /> : <span aria-hidden="true" style={{ display: 'block', width: 126 * art.cellAspect, height: 140, backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${(art.index % art.cols) * 100 / Math.max(1, art.cols - 1)}% ${Math.floor(art.index / art.cols) * 100 / Math.max(1, art.rows - 1)}%`, filter: 'grayscale(1) contrast(.92)' }} />}<span><span style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 25, height: 25, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${line}` }} /> : <span style={{ width: 25, height: 25, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1px solid ${line}`, fontFamily: serif }}>{(displayName || 'G')[0]}</span>}<span style={{ color: muted, fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>By {displayName || 'your Guardian'}</span></span><strong style={{ display: 'block', fontSize: 17, lineHeight: 1.22 }}>{leadMagnetTitle || 'Lead magnet'}</strong><span style={{ display: 'block', marginTop: 8, color: muted, fontSize: 10, lineHeight: 1.5 }}>{freeAudienceValue}</span><span style={{ display: 'block', marginTop: 10 }}><CustomerValueStars score={freeOfferType === 'routine' ? 5 : 1} compact /></span></span></div>
                  <div style={{ borderTop: `1px solid ${line}`, minHeight: 50, marginTop: 'auto', padding: 10, background: 'rgba(245,242,234,.025)', display: 'flex', alignItems: 'center' }}><strong style={{ color: acid, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase' }}>Lead magnet · Step 01</strong></div>
                </div>; })()}
                {offerCards.filter((offer) => selectedUpsells.includes(offer.kind)).map((offer) => {
                const art = offerTypeArt[offer.kind];
                const access = offerAccess[offer.kind];
                const suggestedPrice = upsellDrafts[offer.kind].price;
                const inPath = true;
                const stageNumber = orderedUpsells.indexOf(offer.kind) + 2;
                return <Fragment key={offer.kind}><span aria-hidden="true" style={{ width: 34, flex: '0 0 34px', alignSelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', color: inPath ? acid : line }}><ArrowRight size={22} strokeWidth={1.4} /></span><div className="guardian-card" style={{ width: 320, flex: '0 0 320px', border: `1px solid ${inPath ? acid : line}`, background: inPath ? '#20251B' : '#0D0E0C', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ position: 'absolute', zIndex: 2, top: 10, left: 10, width: 24, height: 24, border: `1px solid ${inPath ? acid : ink}`, borderRadius: '50%', display: 'grid', placeItems: 'center', color: inPath ? acid : ink, fontSize: 7, fontWeight: 700 }}>{inPath ? String(stageNumber).padStart(2, '0') : '+'}</span>
                  <span style={{ position: 'absolute', zIndex: 2, top: 10, right: 10, background: ink, color: black, padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{access === 'free' ? 'Free' : `${formatMoney(suggestedPrice, currency)}${billingLabels[upsellDrafts[offer.kind].billingModel].suffix}`}</span>
                  <div style={{ minHeight: 150, padding: '58px 16px 16px', color: ink, fontFamily: sans, textAlign: 'left', display: 'grid', gridTemplateColumns: '78px minmax(0,1fr)', gap: 14, alignItems: 'center' }}>
                    <span role="img" aria-label={`${offer.label} illustration`} style={{ display: 'block', width: 68, height: 76, backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${(art.index % art.cols) * 100 / Math.max(1, art.cols - 1)}% ${Math.floor(art.index / art.cols) * 100 / Math.max(1, art.rows - 1)}%`, filter: 'grayscale(1) contrast(.98)' }} />
                    <span><strong style={{ display: 'block', fontSize: 13, lineHeight: 1.25 }}>{offer.label}</strong><span style={{ display: 'block', color: muted, fontSize: 9, lineHeight: 1.45, marginTop: 6 }}>{offer.why}</span><span style={{ display: 'block', marginTop: 8 }}><CustomerValueStars score={offerValueScores[offer.kind]} compact /></span></span>
                  </div>
                  <div aria-label={`${offer.label} access and price`} style={{ borderTop: `1px solid ${line}`, marginTop: 'auto', padding: 10, background: 'rgba(245,242,234,.025)', display: 'grid', gridTemplateColumns: access === 'paid' ? 'repeat(2,minmax(0,1fr))' : '1fr', gap: 8 }}>
                    <div><label style={{ ...label, marginBottom: 5 }}>Access</label><select aria-label={`${offer.label} access`} value={access} onChange={(event) => setOfferAccess((current) => ({ ...current, [offer.kind]: event.target.value as 'free' | 'paid' }))} style={{ ...input, ...compactControl, paddingRight: 38 }}><option value="free">Free</option><option value="paid">Paid</option></select></div>
                    {access === 'paid' && <div><label style={{ ...label, marginBottom: 5 }}>Payment</label><select aria-label={`${offer.label} payment model`} value={upsellDrafts[offer.kind].billingModel} onChange={(event) => updateUpsell(offer.kind, { billingModel: event.target.value as BillingModel })} style={{ ...input, ...compactControl, paddingRight: 38 }}><option value="one_time">One time</option><option value="subscription">Monthly</option><option value="pack_10">10 sessions</option></select></div>}
                    <div style={{ gridColumn: '1 / -1' }}><span style={{ display: 'block', color: muted, fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>{access === 'free' ? 'No charge' : `Suggested · ${formatMoney(suggestedPrice, currency)}${billingLabels[upsellDrafts[offer.kind].billingModel].suffix}`}</span><div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 12, top: 13, color: access === 'free' ? line : muted, fontSize: 11 }}>{currencySymbol(currency)}</span><input aria-label={`${offer.label} price`} type="number" min="0" step="1" disabled={access === 'free'} value={access === 'free' ? '0' : upsellDrafts[offer.kind].price} onChange={(event) => updateUpsell(offer.kind, { price: event.target.value })} style={{ ...input, ...compactControl, paddingLeft: 34, opacity: access === 'free' ? .45 : 1 }} /></div></div>
                    <button type="button" onClick={() => inPath ? toggleUpsell(offer.kind) : addValuePathOffer(offer.kind)} style={{ ...btn, ...compactControl, width: '100%', minHeight: 40, gridColumn: '1 / -1', background: inPath ? 'transparent' : ink, color: inPath ? ink : black }}>{inPath ? 'Remove' : 'Add'}{!inPath && <ArrowRight size={14} />}</button>
                  </div>
                </div></Fragment>;
              })}
                {offerCards.some((offer) => !selectedUpsells.includes(offer.kind)) && <Fragment><span aria-hidden="true" style={{ width: 34, flex: '0 0 34px', alignSelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', color: line }}><ArrowRight size={22} strokeWidth={1.4} /></span><div style={{ width: 420, flex: '0 0 420px', border: `1px solid ${line}`, background: '#0D0E0C', display: 'flex', flexDirection: 'column' }}>
                  <button type="button" onClick={() => setShowAddOfferOptions((current) => !current)} aria-expanded={showAddOfferOptions} style={{ minHeight: 250, flex: '1 1 auto', border: 0, background: 'transparent', color: ink, fontFamily: sans, cursor: 'pointer', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '38px 20px 24px' }}><span><span style={{ width: 48, height: 48, margin: '0 auto 14px', border: `1px solid ${ink}`, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 25, fontWeight: 300 }}>+</span><strong style={{ display: 'block', fontSize: 16 }}>Add next offer</strong><span style={{ display: 'block', color: muted, fontSize: 10, marginTop: 7 }}>{offerCards.filter((offer) => !selectedUpsells.includes(offer.kind)).length} options available</span></span></button>
                  {showAddOfferOptions && <div style={{ display: 'grid', gap: 6, padding: '0 10px 10px' }}>{offerCards.filter((offer) => !selectedUpsells.includes(offer.kind)).map((offer) => { const art = offerTypeArt[offer.kind]; return <button type="button" key={offer.kind} onClick={() => addValuePathOffer(offer.kind)} style={{ minHeight: 58, border: `1px solid ${line}`, background: panel, color: ink, padding: '8px 10px', fontFamily: sans, cursor: 'pointer', display: 'grid', gridTemplateColumns: '42px minmax(0,1fr) auto', alignItems: 'center', gap: 9, textAlign: 'left' }}><span aria-hidden="true" style={{ width: 38, height: 38, backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${(art.index % art.cols) * 100 / Math.max(1, art.cols - 1)}% ${Math.floor(art.index / art.cols) * 100 / Math.max(1, art.rows - 1)}%`, filter: 'grayscale(1) contrast(.98)' }} /><span><strong style={{ display: 'block', fontSize: 10 }}>{offer.label}</strong><span style={{ display: 'block', color: muted, fontSize: 8, marginTop: 3 }}>{offerAccess[offer.kind] === 'free' ? 'Free' : `${formatMoney(upsellDrafts[offer.kind].price, currency)}${billingLabels[upsellDrafts[offer.kind].billingModel].suffix}`}</span></span><Plus size={14} /></button>; })}</div>}
                  <div style={{ borderTop: `1px solid ${line}`, minHeight: 50, marginTop: 'auto', padding: 10, background: 'rgba(245,242,234,.025)', display: 'flex', alignItems: 'center' }}><strong style={{ color: muted, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase' }}>Next value step</strong></div>
                </div></Fragment>}
              </div>
            </div>
          </div>}
        </div>
        {offerPlanStage === 2 && <>
        <section style={{ border: `1px solid ${line}`, background: panel, marginBottom: 30 }}>
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><span><span style={{ ...label, color: acid, marginBottom: 4 }}>Offer build queue</span><strong style={{ color: ink, fontFamily: serif, fontSize: 25, fontWeight: 400 }}>{builtOfferCount} of {totalOfferCount} built</strong></span><span style={{ color: muted, fontSize: 9 }}>Finish each offer before publishing the Value Ramp site.</span></div>
          <div style={{ overflowX: 'auto' }}><div role="table" aria-label="Offers to build" style={{ minWidth: 760 }}>
            <div role="row" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1.5fr) 120px 120px 120px 105px 130px', borderBottom: `1px solid ${line}`, padding: '9px 14px', color: muted, fontSize: 7, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>{['Offer','Type','Access','Payment','Price','Status'].map((heading) => <span role="columnheader" key={heading}>{heading}</span>)}</div>
            <div role="row" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(220px,1.5fr) 120px 120px 120px 105px 130px', alignItems: 'center', borderBottom: `1px solid ${line}`, padding: '13px 14px', boxSizing: 'border-box', color: ink, fontFamily: sans, textAlign: 'left' }}><strong role="cell" style={{ fontSize: 11 }}>{leadMagnetTitle || 'Entry offer'}</strong><span role="cell" style={{ color: muted, fontSize: 9 }}>{freeOfferTypes.find((item) => item.value === freeOfferType)?.label}</span><span role="cell" style={{ fontSize: 9 }}>Free</span><span role="cell" style={{ color: muted, fontSize: 9 }}>No payment</span><span role="cell" style={{ fontSize: 9 }}>{formatMoney(0, currency)}</span><button type="button" role="cell" onClick={() => freeOfferType === 'routine' ? openProtocolBuilder() : openOfferEditor()} disabled={creatingProtocol} style={{ ...btn, minHeight: 46, padding: '0 12px', background: acid, color: black, borderColor: acid, fontSize: 8 }}>{creatingProtocol ? <><Loader2 size={12} className="animate-spin" /> Creating</> : freeOfferType === 'routine' ? <>{onboardingProtocol ? 'Open builder' : 'Build Protocol'} <ArrowRight size={13} /></> : <>{freeOfferSetupStage >= 2 ? 'Edit offer' : 'Build offer'} <ArrowRight size={13} /></>}</button></div>
            {orderedUpsells.map((kind) => { const draft = upsellDrafts[kind]; const access = offerAccess[kind]; const built = (paidOfferSetupStages[kind] || 0) >= 3; return <button type="button" role="row" key={kind} onClick={() => openOfferEditor(kind)} style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(220px,1.5fr) 120px 120px 120px 105px 130px', alignItems: 'center', border: 0, borderBottom: `1px solid ${line}`, padding: '13px 14px', background: 'transparent', color: ink, fontFamily: sans, textAlign: 'left', cursor: 'pointer' }}><strong role="cell" style={{ fontSize: 11 }}>{draft.title}</strong><span role="cell" style={{ color: muted, fontSize: 9 }}>{upsellSuggestions.find((item) => item.kind === kind)?.label || kind.replaceAll('_', ' ')}</span><span role="cell" style={{ fontSize: 9 }}>{access === 'paid' ? 'Paid' : 'Free'}</span><span role="cell" style={{ color: muted, fontSize: 9 }}>{access === 'paid' ? billingLabels[draft.billingModel].title : 'No payment'}</span><span role="cell" style={{ fontSize: 9 }}>{access === 'paid' ? `${formatMoney(draft.price, currency)}${billingLabels[draft.billingModel].suffix}` : formatMoney(0, currency)}</span><span role="cell" style={{ color: built ? acid : '#D49A74', fontSize: 8, fontWeight: 800, textTransform: 'uppercase' }}>{built ? 'Built · Edit' : 'To build →'}</span></button>; })}
          </div></div>
        </section>
        <div id="offer-builder-entry" style={{ scrollMarginTop: 20 }}><FunnelStage number="01" eyebrow="Free · Build trust" title="Give your audience one useful win." copy="Choose one useful result, name it clearly, then decide how people receive it." art={freeOfferArt[freeOfferType]}>
          {freeOfferSetupStage > 0 && <div style={{ border: `1px solid ${line}`, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span><span style={{ ...label, marginBottom: 3 }}>Entry offer</span><strong style={{ color: ink, fontSize: 12, fontWeight: 600 }}>{freeOfferTypes.find((offer) => offer.value === freeOfferType)?.label}</strong></span><button type="button" onClick={() => setFreeOfferSetupStage(0)} style={{ ...btn, minHeight: 36, height: 36, background: 'transparent', color: ink, fontSize: 9 }}>Edit</button></div>}
          {freeOfferSetupStage === 0 && <><label style={label}>Choose the entry offer</label>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(145px,1fr))', gap: 0, minWidth: 870, borderTop: `1px solid ${line}`, borderLeft: `1px solid ${line}` }}>
              {[...freeOfferTypes].sort((offer) => Number(offer.value !== 'routine')).map((offer) => <FreeOfferCard key={offer.value} eyebrow={offer.eyebrow} title={offer.label} copy={offer.copy} active={freeOfferType === offer.value} art={freeOfferArt[offer.value]} onClick={() => { setFreeOfferType(offer.value); setFreeDelivery(offer.value === 'routine' ? ['Downloadable PDF', 'Interactive Protocol'] : [suggestedDelivery(offer.value)]); setFreeAudienceValue(freeValueSuggestions[offer.value]); setFreeOfferSetupStage(1); }} />)}
              <FreeOfferCard eyebrow="RECOMMENDED" title={suggestedFreeOffer.title} copy="Best fit for this audience." active={false} recommended art={freeOfferArt[suggestedFreeOffer.kind]} onClick={() => { setFreeOfferType(suggestedFreeOffer.kind); setFreeDelivery(suggestedFreeOffer.kind === 'routine' ? ['Downloadable PDF', 'Interactive Protocol'] : [suggestedDelivery(suggestedFreeOffer.kind)]); setFreeAudienceValue(freeValueSuggestions[suggestedFreeOffer.kind]); setLeadMagnetTitle(suggestedFreeOffer.title); setFreeOfferSetupStage(1); }} />
            </div>
          </div></>}
          {freeOfferSetupStage > 1 && <div style={{ border: `1px solid ${line}`, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span><span style={{ ...label, marginBottom: 3 }}>Offer</span><strong style={{ color: ink, fontSize: 12, fontWeight: 600 }}>{leadMagnetTitle}</strong><span style={{ display: 'block', color: muted, fontSize: 9, marginTop: 3 }}>{freeAudienceValue}</span></span><button type="button" onClick={() => setFreeOfferSetupStage(1)} style={{ ...btn, minHeight: 36, height: 36, background: 'transparent', color: ink, fontSize: 9 }}>Edit</button></div>}
          {freeOfferSetupStage === 1 && <div>
          <label style={label}>Offer name</label>
          <div style={{ position: 'relative' }}><span aria-hidden="true" style={{ position: 'absolute', left: 9, top: 6, width: 30 * activeFreeOfferArt.cellAspect, height: 30, backgroundImage: `url(${activeFreeOfferArt.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${activeFreeOfferArt.cols * 100}% ${activeFreeOfferArt.rows * 100}%`, backgroundPosition: `${activeFreeOfferArtCol * 100 / Math.max(1, activeFreeOfferArt.cols - 1)}% ${activeFreeOfferArtRow * 100 / Math.max(1, activeFreeOfferArt.rows - 1)}%`, filter: 'grayscale(1) contrast(.94)', pointerEvents: 'none' }} /><input style={{ ...input, paddingLeft: 18 + 30 * activeFreeOfferArt.cellAspect }} value={leadMagnetTitle} onChange={(e) => setLeadMagnetTitle(e.target.value)} placeholder="Name your free offer" /></div>
          <div style={{ marginTop: 10 }}><label style={label}>Customer value / outcome <span style={{ color: acid }}>· what changes for them?</span></label><textarea style={{ ...input, minHeight: 76, height: 76, paddingTop: 12, resize: 'vertical' }} value={freeAudienceValue} onChange={(e) => setFreeAudienceValue(e.target.value)} placeholder="Describe the useful result your audience receives" /></div>
          {freeOfferType === 'routine' && <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginTop: 12 }}>
            <label style={{ ...label, color: ink }}>Build your R3 Protocol</label>
            <p style={{ color: muted, fontSize: 9, lineHeight: 1.5, margin: '0 0 12px' }}>Type your knowledge, add source links or attach a file. These details become the brief for the AI Protocol builder.</p>
            <div><label style={label}>What should this Protocol include?</label><textarea style={{ ...input, minHeight: 92, height: 92, paddingTop: 12, resize: 'vertical' }} value={protocolBrief} onChange={(event) => setProtocolBrief(event.target.value)} placeholder="Describe the steps, advice, cautions and experience you want the R3 Protocol builder to use." /></div>
            <div style={{ marginTop: 10 }}><label style={label}>Source URLs <span style={{ color: muted }}>· one per line</span></label><textarea style={{ ...input, minHeight: 70, height: 70, paddingTop: 12, resize: 'vertical' }} value={protocolSourceUrls} onChange={(event) => setProtocolSourceUrls(event.target.value)} placeholder={'https://yourwebsite.com/article\nhttps://youtube.com/watch?v=...'} /></div>
          </div>}
          <button type="button" disabled={!leadMagnetTitle.trim() || !freeAudienceValue.trim()} onClick={() => setFreeOfferSetupStage(2)} style={{ ...btn, marginTop: 14 }}>Continue <ArrowRight size={14} /></button>
          </div>}
          {freeOfferSetupStage === 2 && <div>
          <DeliveryPicker value={freeDelivery} recommended={suggestedDelivery(freeOfferType)} onChange={setFreeDelivery} />
          {freeOfferType !== 'one_to_one_call' && freeOfferType !== 'group_call' ? <div style={{ border: `1px dashed ${line}`, padding: 14, marginTop: 10 }}>
            <label style={{ ...label, color: ink }}>Upload source material <span style={{ color: muted }}>· optional</span></label>
            <p style={{ color: muted, fontSize: 10, lineHeight: 1.55, margin: '0 0 10px' }}>Attach a PDF, EPUB or ZIP. The Protocol builder will preserve it with the draft so it can become structured recipes, a recipe book or guided steps.</p>
            <label style={{ ...btn, height: 38, boxSizing: 'border-box', background: 'transparent', color: ink, fontSize: 9 }}>
              {uploadingOffer ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}{uploadingOffer ? 'Uploading' : leadMagnetPath ? 'Source file attached' : 'Upload source file'}
              <input type="file" accept="application/pdf,application/epub+zip,application/zip,.pdf,.epub,.zip" onChange={(event) => uploadLeadMagnet(event.target.files?.[0])} style={{ display: 'none' }} />
            </label>
          </div> : <div style={{ border: `1px dashed ${line}`, padding: 14, marginTop: 10, color: muted, fontSize: 10, lineHeight: 1.5 }}>No file needed. Add the booking link below.</div>}
          {freeOfferType === 'routine' && <button type="button" onClick={() => openProtocolBuilder()} disabled={creatingProtocol} style={{ ...btn, width: '100%', minHeight: 62, marginTop: 14, background: acid, color: black, borderColor: acid, fontSize: 12 }}>{creatingProtocol ? <><Loader2 size={16} className="animate-spin" /> Creating Protocol</> : <><HeartPulse size={17} /> {onboardingProtocol ? 'Open Protocol Builder' : 'Build Protocol in ROUTINE³'} <ArrowRight size={17} /></>}</button>}
          </div>}
        </FunnelStage></div>
        {orderedUpsells.map((kind, index) => {
          const offer = upsellSuggestions.find((item) => item.kind === kind);
          const draft = upsellDrafts[kind];
          const access = offerAccess[kind];
          const previousPaidValue = orderedUpsells.slice(0, index).reduce((highest, previousKind) => offerAccess[previousKind] === 'paid' ? Math.max(highest, Number(upsellDrafts[previousKind].price || 0)) : highest, 0);
          const nextSteps: OfferNextStep[] = kind === 'recipe_book' || kind === 'routine' || kind === 'routine_guidance' ? ['builder', 'link', 'video'] : kind === 'one_to_one_call' || kind === 'group_call' || kind === 'in_person' || kind === 'festival' ? ['booking', 'link', 'video'] : ['link', 'video'];
          const offerSetupStage = paidOfferSetupStages[kind] || 0;
          const setOfferSetupStage = (stage: number) => setPaidOfferSetupStages((current) => ({ ...current, [kind]: stage }));
          if (!offer) return null;
          const offerImage = offerTypeArt[kind];
          const offerImageCol = offerImage.index % offerImage.cols;
          const offerImageRow = Math.floor(offerImage.index / offerImage.cols);
          return <div id={`offer-builder-${kind}`} key={kind} style={{ scrollMarginTop: 20 }}><FunnelStage number={String(index + 2).padStart(2, '0')} eyebrow={`Value · ${offer.value.split(' · ')[0]} · ${access === 'free' ? 'Free' : `${formatMoney(draft.price, currency)}${billingLabels[draft.billingModel].suffix}`} · ${pricingRegion}`} title={draft.audienceValue || 'Define the result they receive.'} copy={`${draft.title || offer.label} · ${offer.why}`} art={offerImage}>
            <div style={{ marginBottom: 12 }}><CustomerValueStars score={offerValueScores[kind]} /></div>
            {offerSetupStage > 0 && <div style={{ border: `1px solid ${line}`, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span><span style={{ ...label, marginBottom: 3 }}>Offer</span><strong style={{ color: ink, fontSize: 12 }}>{draft.title} · {access === 'free' ? 'Free' : formatMoney(draft.price, currency)}</strong></span><button type="button" onClick={() => setOfferSetupStage(0)} style={{ ...btn, ...compactControl, minHeight: 40, background: 'transparent', color: ink }}>Edit</button></div>}
            {offerSetupStage === 0 && <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) minmax(125px,155px) minmax(145px,180px) minmax(105px,140px)', gap: 9, alignItems: 'start' }}>
              <div><label style={{ ...label, minHeight: 14 }}>Offer name</label><div style={{ position: 'relative' }}><span aria-hidden="true" style={{ position: 'absolute', left: 9, top: 6, width: 30 * offerImage.cellAspect, height: 30, backgroundImage: `url(${offerImage.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${offerImage.cols * 100}% ${offerImage.rows * 100}%`, backgroundPosition: `${offerImageCol * 100 / Math.max(1, offerImage.cols - 1)}% ${offerImageRow * 100 / Math.max(1, offerImage.rows - 1)}%`, filter: 'grayscale(1) contrast(.94)', pointerEvents: 'none' }} /><input style={{ ...input, paddingLeft: 18 + 30 * offerImage.cellAspect }} value={draft.title} onChange={(e) => updateUpsell(kind, { title: e.target.value })} /></div></div>
              <div><label style={{ ...label, minHeight: 14 }}>Access</label><select style={input} value={access} onChange={(event) => setOfferAccess((current) => ({ ...current, [kind]: event.target.value as 'free' | 'paid' }))}><option value="free">Free</option><option value="paid">Paid</option></select></div>
              <div><label style={{ ...label, minHeight: 14 }}>Format</label><select aria-label={`${offer.label} payment format`} disabled={access === 'free'} value={draft.billingModel} onChange={(event) => updateUpsell(kind, { billingModel: event.target.value as BillingModel })} style={{ ...input, paddingRight: 36, opacity: access === 'free' ? .45 : 1 }}><option value="one_time">One time</option><option value="subscription">Subscription · monthly</option><option value="pack_10">Prepaid · 10 sessions</option></select></div>
              <div><label style={{ ...label, minHeight: 14 }}>Price · {currency}</label><div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 12, top: 15, color: access === 'free' ? line : muted, fontSize: 12 }}>{currencySymbol(currency)}</span><input type="number" min="0" step="0.01" disabled={access === 'free'} style={{ ...input, paddingLeft: 34, opacity: access === 'free' ? .45 : 1 }} value={access === 'free' ? '0' : draft.price} onChange={(e) => updateUpsell(kind, { price: e.target.value })} /></div>{access === 'paid' && <span style={{ display: 'block', color: Number(draft.price || 0) > previousPaidValue ? acid : '#C98662', fontSize: 7, lineHeight: 1.35, marginTop: 5 }}>{Number(draft.price || 0) > previousPaidValue ? `Value rises from ${formatMoney(previousPaidValue, currency)}` : `Suggested minimum: ${formatMoney(previousPaidValue + 20, currency)}`}</span>}</div>
            </div>
            <button type="button" disabled={!draft.title.trim()} onClick={() => setOfferSetupStage(1)} style={{ ...btn, marginTop: 14 }}>Continue <ArrowRight size={14} /></button>
            </div>}
            {offerSetupStage > 1 && <div style={{ border: `1px solid ${line}`, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span><span style={{ ...label, marginBottom: 3 }}>Value and payment</span><strong style={{ color: ink, fontSize: 12 }}>{access === 'paid' ? billingLabels[draft.billingModel].title : 'Free'} · {draft.audienceValue}</strong></span><button type="button" onClick={() => setOfferSetupStage(1)} style={{ ...btn, ...compactControl, minHeight: 40, background: 'transparent', color: ink }}>Edit</button></div>}
            {offerSetupStage === 1 && <div>
            <div style={{ marginTop: 10 }}><label style={label}>Customer value / outcome <span style={{ color: acid }}>· what changes for them?</span></label><textarea style={{ ...input, minHeight: 76, height: 76, paddingTop: 12, resize: 'vertical' }} value={draft.audienceValue} onChange={(e) => updateUpsell(kind, { audienceValue: e.target.value })} placeholder="Describe the result, benefit or transformation" /></div>
            <button type="button" disabled={!draft.audienceValue.trim()} onClick={() => setOfferSetupStage(2)} style={{ ...btn, marginTop: 14 }}>Continue <ArrowRight size={14} /></button>
            </div>}
            {offerSetupStage > 2 && <div style={{ border: `1px solid ${line}`, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span><span style={{ ...label, marginBottom: 3 }}>Visitor action</span><strong style={{ color: ink, fontSize: 12 }}>{nextStepLabels[draft.nextStep].title}</strong></span><button type="button" onClick={() => setOfferSetupStage(2)} style={{ ...btn, ...compactControl, minHeight: 40, background: 'transparent', color: ink }}>Edit</button></div>}
            {offerSetupStage === 2 && <div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>What happens next? <span style={{ color: acid }}>· choose the visitor action</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 7 }}>
                {nextSteps.map((nextStep) => { const active = draft.nextStep === nextStep; return <button className="guardian-card" type="button" key={nextStep} onClick={() => updateUpsell(kind, { nextStep })} aria-pressed={active} style={{ ...pickStyle(active), minHeight: 58, justifyContent: 'flex-start', textAlign: 'left' }}><span><strong style={{ display: 'block', fontSize: 9 }}>{nextStepLabels[nextStep].title}</strong><span style={{ display: 'block', marginTop: 4, color: active ? 'rgba(9,10,8,.65)' : muted, fontSize: 8, lineHeight: 1.35 }}>{nextStepLabels[nextStep].note}</span></span></button>; })}
              </div>
            </div>
            {draft.nextStep === 'builder' ? <div style={{ marginTop: 10, padding: 12, border: `1px solid ${acid}`, background: 'rgba(199,216,163,.08)' }}><strong style={{ display: 'block', color: acid, fontSize: 9 }}>{kind === 'recipe_book' ? 'Recipe Builder will be created' : 'Protocol Builder will be created'}</strong><span style={{ display: 'block', color: muted, fontSize: 8, lineHeight: 1.45, marginTop: 4 }}>After setup, the Guardian can add images, audio, ingredients or steps and publish when ready.</span></div> : <div style={{ marginTop: 10 }}><label style={label}>{draft.nextStep === 'booking' ? 'Booking link' : draft.nextStep === 'video' ? 'Video link' : 'Offer or checkout link'} <span style={{ color: muted }}>· optional</span></label><input type="url" style={input} value={draft.url} onChange={(e) => updateUpsell(kind, { url: e.target.value })} placeholder={draft.nextStep === 'booking' ? bookingUrl || 'https://cal.com/yourname' : draft.nextStep === 'video' ? 'https://youtube.com/watch?v=...' : 'https://yourwebsite.com/offer'} /></div>}
            <button type="button" onClick={() => setOfferSetupStage(3)} style={{ ...btn, marginTop: 14 }}>Continue <ArrowRight size={14} /></button>
            </div>}
            {offerSetupStage === 3 && <div>
            <DeliveryPicker value={draft.delivery} recommended={suggestedDelivery(kind)} onChange={(delivery) => updateUpsell(kind, { delivery })} />
            {(kind === 'routine' || kind === 'routine_guidance') && draft.nextStep === 'builder' && <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginTop: 10 }}>
              <label style={{ ...label, color: ink }}>{kind === 'routine_guidance' ? 'R3 Protocol + guidance setup' : 'R3 Protocol setup'}</label>
              <p style={{ color: muted, fontSize: 9, lineHeight: 1.45, margin: '0 0 10px' }}>{kind === 'routine_guidance' ? 'With their permission, the Guardian sees routine completion and check-ins, then suggests adjustments and the next action.' : 'Personalise this routine using the Guardian’s selected goal, gender and age range.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 }}>
                <div><label style={label}>Sex / population</label><select style={{ ...input, paddingRight: 38 }} value={routineGender} onChange={(event) => { const nextPopulation = event.target.value; setRoutineGender(nextPopulation); setRoutineAge((targetAgeRanges[nextPopulation] || targetAgeRanges.Everyone)[0]); setRoutineLifeStage((targetLifeStages[nextPopulation] || targetLifeStages.Everyone)[0]); }}>{Object.keys(targetAgeRanges).map((item) => <option key={item}>{item}</option>)}</select></div>
                <div><label style={label}>Age range</label><select style={{ ...input, paddingRight: 38 }} value={routineAge} onChange={(event) => setRoutineAge(event.target.value)}>{routineAgeOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
                <div><label style={label}>Health / life stage</label><select style={{ ...input, paddingRight: 38 }} value={routineLifeStage} onChange={(event) => setRoutineLifeStage(event.target.value)}>{routineLifeStageOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
                <div><label style={label}>Primary goal</label><input style={input} readOnly value={chosen[0] || 'General wellbeing'} /></div>
                {kind === 'routine_guidance' && <div><label style={label}>Guardian review</label><select style={input} value={guidanceReviewCadence} onChange={(e) => setGuidanceReviewCadence(e.target.value)}><option>Real-time</option><option>Daily review</option><option>Weekly review</option></select></div>}
              </div>
              {kind === 'routine_guidance' && <div style={{ marginTop: 10, borderTop: `1px solid ${line}`, paddingTop: 10, color: acid, fontSize: 9, lineHeight: 1.5 }}>Shared with the Guardian: completed routine items and voluntary check-ins. Private account and health data remain outside this offer.</div>}
              <button type="button" onClick={() => openProtocolBuilder(kind)} disabled={creatingProtocol} style={{ ...btn, marginTop: 14 }}>
                {creatingProtocol ? <><Loader2 size={14} className="animate-spin" /> Creating Protocol</> : <>{onboardingProtocol ? 'Open Protocol Builder' : 'Build Protocol'} <ArrowRight size={14} /></>}
              </button>
            </div>}
            {kind === 'group_call' && <div style={{ border: `1px solid ${acid}`, background: 'rgba(199,216,163,.08)', padding: 14, marginTop: 10 }}>
              <label style={{ ...label, color: ink }}>Transparent Protocol coaching</label>
              <p style={{ color: muted, fontSize: 9, lineHeight: 1.5, margin: '0 0 10px' }}>The customer chooses to share Protocol completion and check-ins. Their coach uses that activity to give daily feedback, suggest changes and prepare for the weekly private call.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 }}>
                <div><label style={label}>Coach review</label><select style={input} value={guidanceReviewCadence} onChange={(e) => setGuidanceReviewCadence(e.target.value)}><option>Daily review</option><option>Real-time</option><option>Weekly review</option></select></div>
                <div><label style={label}>Private coaching</label><input style={input} readOnly value="One call every week" /></div>
              </div>
              <div style={{ marginTop: 10, borderTop: `1px solid ${line}`, paddingTop: 10, color: acid, fontSize: 9, lineHeight: 1.5 }}>Shared only with permission: completed Protocol items and voluntary check-ins. Private account and health data stay outside the coaching view.</div>
            </div>}
            {kind === 'festival' && <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginTop: 10 }}>
              <label style={{ ...label, color: ink }}>Event plan</label>
              <p style={{ color: muted, fontSize: 9, lineHeight: 1.45, margin: '0 0 10px' }}>Keep the event rare and valuable. We recommend one flagship event per year, with two as the maximum.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                {['1', '2'].map((count) => <button type="button" key={count} onClick={() => setEventsPerYear(count)} style={{ ...pickStyle(eventsPerYear === count), height: 52 }}>{count} event{count === '1' ? '' : 's'} per year{count === '1' ? ' · recommended' : ''}</button>)}
              </div>
              <p style={{ color: acid, fontSize: 9, lineHeight: 1.45, margin: '10px 0 0' }}>Suggested starting value: {formatMoney(1000, currency)}–{formatMoney(2000, currency)}. Default: {formatMoney(1500, currency)}.</p>
            </div>}
            </div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ color: muted, fontSize: 9 }}>Step {index + 2} of the visitor journey</span>
              <button type="button" onClick={() => toggleUpsell(kind)} style={{ ...btn, height: 34, padding: '0 13px', background: 'transparent', color: ink, borderColor: line, fontSize: 8 }}>Remove</button>
            </div>
          </FunnelStage></div>;
        })}
        </>}
      </>}

      {step === 5 && <>
        <FunnelStage number="01" eyebrow="Site · Style your page" title={`${displayName || 'Your'}${displayName ? '’s' : ''} story.`} copy="Style your page and preview the customer journey." last>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ border: `1px solid ${line}`, background: panel, padding: 14 }}>
            <label style={{ ...label, color: ink }}>Style your page</label>
            <div role="tablist" aria-label="Site style steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `1px solid ${line}`, marginBottom: 16 }}>
              {['Story', 'Identity', 'Background', 'Colors'].map((title, index) => <button type="button" role="tab" aria-selected={siteStyleStage === index} key={title} onClick={() => setSiteStyleStage(index)} style={{ minHeight: 44, border: 0, borderLeft: index ? `1px solid ${line}` : 0, background: siteStyleStage === index ? ink : 'transparent', color: siteStyleStage === index ? black : index < siteStyleStage ? acid : muted, fontFamily: sans, fontSize: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>{String(index + 1).padStart(2, '0')} · {title}</button>)}
            </div>
            {siteStyleStage === 0 && <>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Story headline <span style={{ color: acid }}>· 30 tailored suggestions</span></label>
              <select style={{ ...input, marginBottom: 7 }} value={headlineSuggestions.includes(generatedHeadline) ? generatedHeadline : ''} onChange={(event) => setSelectedHeadline(event.target.value)}>
                <option value="" disabled>Custom headline</option>
                {headlineSuggestions.map((headline, index) => <option key={headline} value={headline}>{String(index + 1).padStart(2, '0')} · {headline}</option>)}
              </select>
              <input style={input} value={generatedHeadline} onChange={(event) => setSelectedHeadline(event.target.value)} placeholder="Write your own outcome-led headline" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Expertise tags <span style={{ color: muted }}>· shown under your headline</span></label>
              <div style={{ display: 'flex', gap: 7 }}><input style={input} value={expertiseTagDraft} onChange={(event) => setExpertiseTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addExpertiseTags(expertiseTagDraft); } }} placeholder="Hypnosis, compassionate care, equity" /><button type="button" onClick={() => addExpertiseTags(expertiseTagDraft)} disabled={!expertiseTagDraft.trim()} style={{ ...btn, height: 46, padding: '0 13px' }}>Add</button></div>
              {expertiseTags.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{expertiseTags.map((tag) => <button type="button" key={tag} onClick={() => setExpertiseTags((current) => current.filter((item) => item !== tag))} title={`Remove ${tag}`} style={{ border: `1px solid ${line}`, background: 'transparent', color: ink, padding: '5px 8px', fontFamily: sans, fontSize: 8, cursor: 'pointer' }}>{tag} ×</button>)}</div>}
            </div>
            <div style={{ marginBottom: 14 }}><label style={label}>Your brand name</label><input style={input} value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Your name, practice or studio" /></div>
            <button type="button" onClick={() => setSiteStyleStage(1)} style={btn}>Continue <ArrowRight size={14} /></button>
            </>}
            {siteStyleStage === 1 && <>
            <label style={label}>Header and navigation</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 7, marginBottom: 16 }}>
              {([['white', 'White header'], ['hidden', 'No header']] as const).map(([value, text]) => { const active = headerStyle === value; return <button className="guardian-card" type="button" key={value} onClick={() => setHeaderStyle(value)} aria-pressed={active} style={{ minWidth: 0, minHeight: 54, padding: 7, border: `1px solid ${active ? acid : line}`, background: 'transparent', color: ink, cursor: 'pointer', fontFamily: sans, textAlign: 'left' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 22, padding: '0 6px', background: value === 'hidden' ? 'transparent' : '#FFFFFF', color: value === 'hidden' ? muted : '#11120F', border: '1px solid rgba(127,127,127,.25)', fontSize: 6, fontWeight: 700, letterSpacing: '.1em' }}><span>{value === 'hidden' ? 'FULL BLEED' : 'R³ LOGO'}</span><span>{value === 'hidden' ? 'NO NAV' : 'MENU'}</span></span>
                <strong style={{ display: 'block', marginTop: 6, fontSize: 8 }}>{text}</strong>
              </button>; })}
            </div>
            <label style={label}>Choose an avatar</label>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
              {defaultAvatars.map((avatar) => { const active = avatarUrl === avatar.image; return <button className="guardian-card" type="button" key={avatar.name} onClick={() => setAvatarUrl(avatar.image)} aria-pressed={active} style={{ position: 'relative', width: 100, flex: '0 0 100px', minHeight: 94, padding: '8px 6px 7px', border: `1px solid ${active ? acid : line}`, background: active ? acid : 'transparent', color: active ? black : ink, cursor: 'pointer', fontFamily: sans }}>
                {active && <span style={{ position: 'absolute', top: 5, right: 5, width: 17, height: 17, display: 'grid', placeItems: 'center', background: black, color: acid }}><Check size={10} /></span>}
                <img src={avatar.image} alt="" style={{ display: 'block', width: 58, height: 58, maxWidth: '100%', objectFit: 'contain', margin: '0 auto 5px', filter: active ? 'grayscale(1) brightness(.25)' : 'grayscale(1) contrast(.95) brightness(.9)' }} />
                <span style={{ display: 'block', fontSize: 8, fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>{avatar.name}</span>
              </button>; })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><button type="button" onClick={() => setSiteStyleStage(0)} style={{ ...btn, background: 'transparent', color: ink }}>← Back</button><button type="button" onClick={() => setSiteStyleStage(2)} style={btn}>Continue <ArrowRight size={14} /></button></div>
            </>}
            {siteStyleStage === 2 && <>
            <label style={label}>Choose a story template</label>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 14, scrollSnapType: 'x mandatory' }}>
              {storyTemplates.map((template) => { const active = storyTemplate === template.id && !backgroundUrl; return <button className="guardian-card" type="button" key={template.id} onClick={() => applyStoryTemplate(template.id)} aria-pressed={active} style={{ position: 'relative', width: 180, flex: '0 0 180px', scrollSnapAlign: 'start', padding: 0, overflow: 'hidden', border: `1px solid ${active ? acid : line}`, background: active ? acid : '#0D0E0C', color: active ? black : ink, textAlign: 'left', cursor: 'pointer', fontFamily: sans }}>
                <img src={template.image} alt="" loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', objectPosition: 'center' }} />
                {active && <span style={{ position: 'absolute', top: 7, right: 7, width: 19, height: 19, display: 'grid', placeItems: 'center', background: black, color: acid }}><Check size={11} /></span>}
                <span style={{ display: 'block', padding: '10px 11px 11px' }}><span style={{ display: 'block', color: active ? 'rgba(9,10,8,.62)' : acid, fontSize: 7, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>{template.style}</span><strong style={{ display: 'block', fontSize: 11 }}>{template.name}</strong><span style={{ display: 'block', marginTop: 5, color: active ? 'rgba(9,10,8,.65)' : muted, fontSize: 8, lineHeight: 1.4 }}>{template.description}</span></span>
              </button>; })}
            </div>
            <label style={{ ...label, color: ink }}>Use your own background</label>
            <label style={{ ...btn, height: 40, background: 'transparent', color: ink, fontSize: 8, marginBottom: 14 }}>{uploadingBackground ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}{backgroundUrl ? 'Replace background' : 'Upload photo or video'}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => uploadBackground(event.target.files?.[0])} style={{ display: 'none' }} /></label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><button type="button" onClick={() => setSiteStyleStage(1)} style={{ ...btn, background: 'transparent', color: ink }}>← Back</button><button type="button" onClick={() => setSiteStyleStage(3)} style={btn}>Continue <ArrowRight size={14} /></button></div>
            </>}
            {siteStyleStage === 3 && <>
            <label style={label}>Image style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 7, marginBottom: 16 }}>
              {(['color', 'greyscale'] as const).map((treatment) => { const active = imageTreatment === treatment; return <button className="guardian-card" type="button" key={treatment} onClick={() => setImageTreatment(treatment)} aria-pressed={active} style={{ ...pickStyle(active), minHeight: 48, justifyContent: 'flex-start', textAlign: 'left' }}>
                <span style={{ width: 24, height: 24, flex: '0 0 auto', border: `1px solid ${active ? 'rgba(9,10,8,.3)' : line}`, background: treatment === 'color' ? 'linear-gradient(135deg,#A56B48 0 33%,#C7D8A3 33% 66%,#507785 66%)' : 'linear-gradient(135deg,#E8E8E4 0 33%,#999 33% 66%,#242522 66%)' }} />
                <span><strong style={{ display: 'block', fontSize: 10, textTransform: 'capitalize' }}>{treatment}</strong><span style={{ display: 'block', marginTop: 3, color: active ? 'rgba(9,10,8,.65)' : muted, fontSize: 8 }}>{treatment === 'color' ? 'Keep photography in full color' : 'Use a restrained black-and-white treatment'}</span></span>
              </button>; })}
            </div>
            <label style={label}>Fine tune your colors</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(150px,1fr))', gap: 9 }}>
              <div><label style={label}>Page color</label><input type="color" style={{ ...input, padding: 5 }} value={pageColor} onChange={(e) => setPageColor(e.target.value)} /></div>
              <div><label style={label}>Accent color</label><input type="color" style={{ ...input, padding: 5 }} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <label style={{ ...btn, height: 36, background: 'transparent', color: ink, fontSize: 8 }}><Upload size={11} />{avatarUrl ? 'Replace avatar' : 'Upload avatar'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPortrait(event.target.files?.[0])} style={{ display: 'none' }} /></label>
              <button type="button" onClick={() => setSiteStyleStage(2)} style={{ ...btn, height: 36, background: 'transparent', color: ink, fontSize: 8 }}>← Background</button>
            </div>
            </>}
          </div>
          <div id="profile-site-preview" style={{ scrollMarginTop: 20 }}><span style={{ ...label, display: 'block', color: acid, marginBottom: 7 }}>Profile site preview <span style={{ color: muted }}>· shows every published Value Ramp</span></span><div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', border: `1px solid ${line}`, backgroundColor: pageColor, backgroundImage: backgroundType === 'image' ? `linear-gradient(rgba(242,239,231,.66),rgba(242,239,231,.66)),url(${effectiveBackground})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: imageTreatment === 'greyscale' ? 'luminosity' : 'normal', color: '#11120F', overflow: 'hidden', fontFamily: sans }}>
            {backgroundType === 'video' && <><video src={effectiveBackground} autoPlay muted loop playsInline aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: imageTreatment === 'greyscale' ? 'grayscale(1)' : 'none' }} /><span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(242,239,231,.66)' }} /></>}
            {headerStyle !== 'hidden' && <div style={{ position: 'relative', zIndex: 2, height: 44, background: previewHeaderBackground, color: previewHeaderText, borderBottom: '1px solid rgba(17,18,15,.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: 7, fontWeight: 700, letterSpacing: '.12em' }}><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><RoutineMark size={26} textColor="#16140F" hairline="#16140F" />{brandName.trim() && <span>{brandName.trim()}</span>}</span><span>routine3.com/{displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'your-name'}</span></div>}
            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(18px,4vw,34px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 24, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', filter: imageTreatment === 'greyscale' ? 'grayscale(1)' : 'none' }} /> : <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#D7D4CC', display: 'grid', placeItems: 'center', fontFamily: serif, fontSize: 18 }}>{(displayName || 'G')[0]}</span>}<span><strong style={{ display: 'block', fontSize: 11 }}>{displayName || 'Your name'}</strong><span style={{ display: 'block', marginTop: 3, fontSize: 8, color: '#6B6963' }}>{chosen.slice(0, 3).join(' · ') || 'Your guidance'}</span></span></div>
                <h3 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(28px,4vw,46px)', lineHeight: .95, letterSpacing: '-.035em', margin: '0 0 12px' }}>{generatedHeadline}</h3>
                <ExpertiseTags tags={expertiseTags} color={accentColor} compact />
                <p style={{ color: '#66645F', fontSize: 10, lineHeight: 1.55, margin: 0 }}>{intro || `A practical ${chosen.slice(0, 2).join(' and ').toLowerCase() || 'guidance'} path shaped for ${audience.join(' and ').toLowerCase()}.`}</p>
              </div>
              <div style={{ display: 'grid', gap: 9 }}>
                <span style={{ color: accentColor, fontSize: 7, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Explore my Value Ramps</span>
                <div style={{ border: '1px solid rgba(17,18,15,.16)', borderRadius: 5, padding: 16, background: 'rgba(255,255,255,.94)', boxShadow: '0 10px 28px rgba(17,18,15,.09)' }}><span style={{ display: 'block', color: accentColor, fontSize: 7, fontWeight: 700, letterSpacing: '.12em', marginBottom: 7 }}>{rampTargetAudience.toUpperCase()} · {rampTargetProblem.toUpperCase()}</span><strong style={{ display: 'block', fontSize: 12, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{customerFacingOfferTitle(leadMagnetTitle || suggestedFreeOffer.title)}</strong><span style={{ display: 'block', color: '#66645F', fontSize: 8, lineHeight: 1.5, marginTop: 7 }}>{freeAudienceValue}</span><button type="button" onClick={() => document.getElementById('value-ramp-funnel-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} style={{ marginTop: 11, width: 'fit-content', minHeight: 28, padding: '0 10px', border: 0, borderRadius: 3, background: accentColor, color: readableText(accentColor), fontFamily: sans, fontSize: 7, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>View <ArrowRight size={9} /></button></div>
              </div>
            </div>
          </div></div>
          </div>
        </FunnelStage>
        <div id="value-ramp-funnel-preview" style={{ scrollMarginTop: 20, border: `1px solid ${line}`, background: panel, padding: 16, marginBottom: 24 }}>
          <label style={{ ...label, color: acid }}>Value Ramp funnel preview <span style={{ color: muted }}>· test purchase and access</span></label>
          <div aria-label="Customer journey stages" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(92px,1fr))', overflowX: 'auto', border: `1px solid ${line}`, margin: '10px 0 14px' }}>
            {['Discover', 'Offer', funnelPreviewStage === 0 ? 'Lead capture' : 'Checkout', 'Delivery / access', 'Next offer', 'Complete'].map((title, index) => {
              const currentStage = funnelPageState === 'offer' ? 1 : funnelPageState === 'checkout' ? 2 : funnelPageState === 'access' ? 3 : funnelPageState === 'post_purchase' ? 4 : 5;
              return <span key={title} aria-current={currentStage === index ? 'step' : undefined} style={{ minWidth: 92, padding: '10px 9px', borderLeft: index ? `1px solid ${line}` : 0, background: currentStage === index ? ink : 'transparent', color: currentStage === index ? black : index < currentStage ? acid : muted }}><strong style={{ display: 'block', fontSize: 8 }}>{String(index + 1).padStart(2, '0')}</strong><span style={{ display: 'block', marginTop: 4, fontSize: 7, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</span></span>;
            })}
          </div>
          <span style={{ ...label, display: 'block', marginBottom: 7 }}>Preview an offer</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '0 0 14px' }}>
            {funnelStages.map((stage, index) => { const unlocked = index <= funnelUnlockedStage; return <button type="button" key={`${stage.title}-${index}`} disabled={!unlocked} onClick={() => { setFunnelPreviewStage(index); setFunnelPageState('offer'); }} aria-current={funnelPreviewStage === index ? 'step' : undefined} aria-label={unlocked ? `Preview stage ${index + 1}: ${stage.title}` : `Stage ${index + 1} locked`} title={unlocked ? stage.title : 'Complete the current action to reveal this stage'} style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', border: `1px solid ${index <= funnelPreviewStage ? acid : line}`, background: funnelPreviewStage === index ? acid : 'transparent', color: funnelPreviewStage === index ? black : index < funnelPreviewStage ? acid : muted, fontFamily: sans, fontSize: 8, fontWeight: 700, cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : .4 }}>{unlocked ? String(index + 1).padStart(2, '0') : '—'}</button>; })}
          </div>
          <div style={{ width: '100%', maxWidth: '100%', minHeight: 'clamp(420px,56vw,560px)', boxSizing: 'border-box', border: `1px solid ${line}`, borderRadius: 5, backgroundColor: '#F2EFE7', backgroundImage: backgroundType === 'image' ? `linear-gradient(rgba(242,239,231,.84),rgba(242,239,231,.84)),url(${effectiveBackground})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', color: '#11120F', padding: 'clamp(22px,5vw,52px)', display: 'grid', alignItems: 'center', overflow: 'hidden' }}>
            {funnelPageState === 'offer' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 'clamp(28px,6vw,80px)', alignItems: 'center' }}><div style={{ minWidth: 0 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(17,18,15,.22)' }} /> : <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', border: '1px solid rgba(17,18,15,.22)', fontFamily: serif }}>{(displayName || 'G')[0]}</span>}<span style={{ color: '#55564F', fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>{displayName || 'Your Guardian'} <ChevronRight size={10} style={{ display: 'inline', verticalAlign: '-2px' }} /> {funnelPreviewStage === 0 && freeOfferType === 'routine' ? 'R3 Protocol' : 'Offer'}</span></span><span style={{ color: accentColor, fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>Stage {String(funnelPreviewStage + 1).padStart(2, '0')} · {activeFunnelStage.meta}</span><h3 style={{ fontFamily: serif, fontSize: offerTitleSize(activeFunnelStage.title), fontWeight: 300, lineHeight: .95, margin: '18px 0 0', overflowWrap: 'anywhere' }}>{customerFacingOfferTitle(activeFunnelStage.title)}</h3></div><div><p style={{ color: '#66645F', fontSize: 15, lineHeight: 1.6, margin: '0 0 22px' }}>{activeFunnelStage.value}</p><button type="button" onClick={confirmFunnelOffer} style={{ ...btn, minHeight: 52, padding: '0 22px', background: accentColor, color: readableText(accentColor), borderColor: accentColor, fontSize: 10 }}>{activeFunnelStage.action} <ArrowRight size={14} /></button></div></div>}
            {funnelPageState === 'checkout' && <div style={{ width: '100%', maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
              <span style={{ color: accentColor, fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>{funnelPreviewStage === 0 ? 'Free lead magnet' : 'Secure checkout'}</span>
              <h3 style={{ fontFamily: serif, fontSize: 'clamp(40px,6vw,66px)', fontWeight: 300, lineHeight: .98, margin: '16px 0 12px' }}>{customerFacingOfferTitle(activeFunnelStage.title)}</h3>
              {funnelPreviewStage === 0 ? <><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 auto 14px' }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(17,18,15,.22)' }} /> : <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', border: '1px solid rgba(17,18,15,.22)', fontFamily: serif }}>{(displayName || 'G')[0]}</span>}<span style={{ color: '#55564F', fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>Created by {displayName || 'your Guardian'}</span></span><p style={{ color: '#66645F', fontSize: 14, lineHeight: 1.6, margin: '0 auto 18px' }}>Enter your email to receive the free offer.</p><div style={{ maxWidth: 430, margin: '0 auto 8px', display: 'grid', gap: 8 }}><input type="email" inputMode="email" autoComplete="email" required value={leadCaptureValue} onChange={(event) => setLeadCaptureValue(event.target.value)} placeholder="you@example.com" aria-label="Your email" aria-invalid={Boolean(leadCaptureValue) && !leadEmailIsValid} style={{ minHeight: 48, border: `1px solid ${leadCaptureValue && !leadEmailIsValid ? '#A5463A' : 'rgba(17,18,15,.3)'}`, background: 'rgba(255,255,255,.88)', color: '#11120F', padding: '0 14px', fontFamily: sans, fontSize: 12 }} /></div>{leadCaptureValue && !leadEmailIsValid && <span role="alert" style={{ display: 'block', color: '#8A3D31', fontSize: 9, marginBottom: 10 }}>Enter a valid email address.</span>}<button type="button" disabled={!leadEmailIsValid} onClick={completeFunnelCheckout} style={{ ...btn, minHeight: 52, padding: '0 22px', background: accentColor, color: readableText(accentColor), borderColor: accentColor, opacity: leadEmailIsValid ? 1 : .45 }}>Send my free offer <ArrowRight size={14} /></button></> : <><p style={{ color: '#66645F', fontSize: 14, lineHeight: 1.6, margin: '0 auto 22px' }}>Review {activeFunnelStage.meta.split(' · ')[0]} and complete your purchase.</p><button type="button" onClick={completeFunnelCheckout} style={{ ...btn, minHeight: 52, padding: '0 22px', background: accentColor, color: readableText(accentColor), borderColor: accentColor }}>Complete purchase <ArrowRight size={14} /></button></>}
            </div>}
            {funnelPageState === 'access' && <div style={{ width: '100%', maxWidth: 650, margin: '0 auto', textAlign: 'center' }}><span style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', background: accentColor, color: readableText(accentColor), display: 'grid', placeItems: 'center' }}><Check size={22} /></span><h3 style={{ fontFamily: serif, fontSize: 'clamp(40px,6vw,66px)', fontWeight: 300, lineHeight: .98, margin: '0 0 12px' }}>Your offer is ready.</h3><p style={{ color: '#66645F', fontSize: 14, lineHeight: 1.6, margin: '0 auto 22px' }}>{funnelPreviewStage === 0 ? `Access details were sent to ${leadCaptureValue}. Use the free offer now, then see the limited personalised offer.` : 'Your purchase is confirmed and access details are ready.'}</p><div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>{funnelPreviewStage === 0 && freeDelivery.includes('Downloadable PDF') && <button type="button" style={{ ...btn, minHeight: 50, background: accentColor, color: readableText(accentColor), borderColor: accentColor }}><Download size={14} /> Download PDF</button>}{funnelPreviewStage === 0 && freeDelivery.includes('Interactive Protocol') && <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ ...btn, minHeight: 50, background: accentColor, color: readableText(accentColor), borderColor: accentColor, textDecoration: 'none' }}>Open in ROUTINE³ <ArrowRight size={14} /></a>}{funnelPreviewStage === 0 && !freeDelivery.some((delivery) => delivery === 'Downloadable PDF' || delivery === 'Interactive Protocol') && <button type="button" style={{ ...btn, minHeight: 50, background: accentColor, color: readableText(accentColor), borderColor: accentColor }}>{freeOfferCta[freeOfferType]} <ArrowRight size={14} /></button>}<button type="button" onClick={continueAfterAccess} style={{ ...btn, minHeight: 50, background: 'transparent', color: '#11120F', borderColor: 'rgba(17,18,15,.35)' }}>See limited offer <ArrowRight size={14} /></button></div></div>}
            {funnelPageState === 'post_purchase' && postPurchaseOffer && <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: accentColor, fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}><Check size={15} /> Free Protocol delivered</span><h3 style={{ fontFamily: serif, fontSize: 'clamp(42px,6vw,70px)', fontWeight: 300, lineHeight: .98, margin: '18px 0 12px' }}>Get your personalised Protocol and call for 30% off.</h3><p style={{ color: '#66645F', fontSize: 14, lineHeight: 1.6, margin: '0 auto 18px', maxWidth: 600 }}>Add <strong>{customerFacingOfferTitle(postPurchaseOffer.title)}</strong> for a plan adapted to your needs and a private call with {displayName || 'your Guardian'}. Your free download is already yours.</p><div style={{ display: 'inline-block', border: `1px solid ${accentColor}`, padding: '8px 12px', color: funnelTimerSeconds ? accentColor : '#8A3D31', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 18 }}>{funnelTimerSeconds ? `30% off · ${String(Math.floor(funnelTimerSeconds / 60)).padStart(2, '0')}:${String(funnelTimerSeconds % 60).padStart(2, '0')}` : 'Limited offer expired'}</div><div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}><button type="button" disabled={!funnelTimerSeconds} onClick={() => resolvePostPurchase(true)} style={{ ...btn, minHeight: 52, padding: '0 22px', background: accentColor, color: readableText(accentColor), borderColor: accentColor, opacity: funnelTimerSeconds ? 1 : .45 }}>Yes, add {postPurchaseOffer.meta.split(' · ')[0]} <ArrowRight size={14} /></button><button type="button" onClick={() => resolvePostPurchase(false)} style={{ ...btn, minHeight: 52, padding: '0 18px', background: 'transparent', color: '#11120F', borderColor: 'rgba(17,18,15,.35)' }}>No thanks, continue</button></div></div>}
            {funnelPageState === 'complete' && <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}><span style={{ width: 52, height: 52, margin: '0 auto 18px', borderRadius: '50%', background: accentColor, color: readableText(accentColor), display: 'grid', placeItems: 'center' }}><Check size={24} /></span><h3 style={{ fontFamily: serif, fontSize: 'clamp(44px,6vw,72px)', fontWeight: 300, lineHeight: .98, margin: 0 }}>You’re all set.</h3><p style={{ color: '#66645F', fontSize: 14, lineHeight: 1.6, margin: '16px auto 22px' }}>Confirmation and access details are ready. This journey includes {funnelPurchases.length} accepted offer{funnelPurchases.length === 1 ? '' : 's'}.</p><div style={{ borderTop: '1px solid rgba(17,18,15,.2)', paddingTop: 14, fontSize: 10, lineHeight: 1.8 }}>{funnelPurchases.map((title) => <div key={title}>{customerFacingOfferTitle(title)}</div>)}</div></div>}
          </div>
          <button type="button" onClick={() => { setFunnelPreviewStage(0); setFunnelUnlockedStage(0); setFunnelPageState('offer'); setFunnelTimerSeconds(600); setFunnelPurchases([]); setLeadCaptureValue(''); }} style={{ marginTop: 10, border: 0, background: 'transparent', color: muted, fontFamily: sans, fontSize: 8, cursor: 'pointer', textDecoration: 'underline' }}>Restart visitor journey</button>
        </div>
        <div><label style={label}>Add one personal sentence <span style={{ color: muted }}>· optional</span></label><input style={input} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Why people come to you — or leave this blank" /></div>
        <div style={{ borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, padding: '22px 0', marginTop: 28, display: 'grid', gap: 13 }}>
          <div><span style={label}>Guardian</span><span style={{ fontFamily: serif, fontSize: 26 }}>{displayName}</span></div>
          <div><span style={label}>Main language</span><span style={{ color: ink, fontSize: 12 }}>{mainLanguage}</span></div>
          <div><span style={label}>Contact</span><span style={{ color: ink, fontSize: 12 }}>{[contactEmail, whatsappPhone].filter(Boolean).join(' · ')}</span></div>
          {bookingUrl && <div><span style={label}>Booking</span><span style={{ color: ink, fontSize: 12 }}>{bookingProvider} · {bookingUrl}</span></div>}
          <div><span style={label}>Guidance</span><span style={{ color: ink, fontSize: 12 }}>{chosen.join(' · ')}</span></div>
          <div><span style={label}>Audience and format</span><span style={{ color: ink, fontSize: 12 }}>{audience.join(' · ')} · {format.join(' · ')}</span></div>
          {(leadMagnetTitle || orderedUpsells.length > 0) && <div><span style={label}>Offer ladder · {pricingRegion}</span><span style={{ color: ink, fontSize: 12 }}>{[leadMagnetTitle && `Free: ${leadMagnetTitle} · ${freeDelivery.join(' + ')}`, ...orderedUpsells.map((kind) => `${upsellDrafts[kind].title} · ${offerAccess[kind] === 'free' ? 'Free' : `${formatMoney(upsellDrafts[kind].price, currency)}${billingLabels[upsellDrafts[kind].billingModel].suffix}`} · ${upsellDrafts[kind].delivery.join(' + ')}`)].filter(Boolean).join(' → ')}</span></div>}
          <div><span style={label}>Website goal</span><span style={{ color: ink, fontSize: 12 }}>{websiteGoal}</span></div>
        </div>
        <div style={{ border: `1px solid ${acid}`, background: '#20251B', padding: 16, marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ minWidth: 0 }}><span style={{ ...label, color: acid, marginBottom: 5 }}>Your public site</span><code style={{ display: 'block', color: ink, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 9, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{publishedSitePath}</code></span>
          <button type="submit" disabled={busy} style={{ ...btn, flex: '0 0 auto' }}>{busy ? 'Publishing…' : 'Publish site'} <ArrowRight size={14} /></button>
        </div>
      </>}

      {error && <p style={{ color: '#F0A7A7', fontSize: 12 }}>{error}</p>}
      {step !== 3 && step !== 5 && (step !== 4 || offerPlanStage === 2) && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', alignItems: 'center', gap: 12, marginTop: 34 }}>
        {step > 1 ? <button type="button" onClick={() => { setError(''); if (step === 3) setAudienceSetupStage(1); else if (step === 4) setOfferPlanStage(1); else setStep((current) => current - 1); }} style={{ ...btn, width: '100%', background: 'transparent', color: ink }}>← Back</button> : <span />}
        {(step !== 4 || offerPlanStage === 2) && (step !== 5 || freeOfferSetupStage === 2) ? step < 5 ? <button type="button" onClick={continueSetup} disabled={importing} style={{ ...btn, width: '100%' }}>{importing ? <><Loader2 size={14} className="animate-spin" /> Reading profiles</> : <>Continue <ArrowRight size={14} /></>}</button> : <button disabled={busy} style={{ ...btn, width: '100%' }}>{busy ? 'Creating your Guardian' : 'Create my Guardian profile'} <ArrowRight size={14} /></button> : <span />}
      </div>}
        </section>
      </div>
    </form>}
  </div>;
}

function Empty({ title, copy, action, image }: { title: string; copy: string; action?: React.ReactNode; image?: string }) {
  return <div style={{ border: `1px solid ${line}`, padding: 38, textAlign: 'center', background: panel }}>{image && <img src={image} alt="" loading="lazy" style={{ width: 104, height: 104, objectFit: 'contain', filter: 'grayscale(1) contrast(.9) brightness(.78)', opacity: .85, marginBottom: 14 }} />}<h3 style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, margin: '0 0 8px' }}>{title}</h3><p style={{ color: muted, fontSize: 13, margin: '0 0 20px' }}>{copy}</p>{action}</div>;
}

function RecipeBuilder({ recipe, onBack, onSaved }: { recipe: GuideRecipe; onBack: () => void; onSaved: (recipe: GuideRecipe) => void }) {
  const asLines = (items: unknown[]) => items.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description || '');
  const [mealSlot, setMealSlot] = useState(recipe.meal_slot || 'any');
  const [ingredients, setIngredients] = useState(asLines(recipe.ingredients || []));
  const [instructions, setInstructions] = useState(asLines(recipe.instructions || []));
  const [status, setStatus] = useState<GuideRecipe['status']>(recipe.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    setSaving(true); setMessage('');
    try {
      const saved = await updateGuideRecipe(recipe.id, { title: title.trim(), description: description.trim() || null, meal_slot: mealSlot, ingredients: ingredients.split('\n').map((line) => line.trim()).filter(Boolean), instructions: instructions.split('\n').map((line) => line.trim()).filter(Boolean), status });
      onSaved(saved); setMessage('Recipe saved to the Guardian database.');
    } catch (error: any) { setMessage(error.message || 'Could not save this recipe.'); }
    finally { setSaving(false); }
  }
  return <div style={{ maxWidth: 820 }}>
    <button type="button" onClick={onBack} style={{ ...btn, marginBottom: 22, background: 'transparent', color: ink }}>← Recipes</button>
    <div style={{ ...label, color: acid }}>Recipe builder</div><h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 300, margin: '10px 0 28px' }}>{title || 'Untitled recipe'}</h1>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(150px,1fr)', gap: 10 }}><div><label style={label}>Recipe name</label><input style={input} value={title} onChange={(event) => setTitle(event.target.value)} /></div><div><label style={label}>Meal</label><select style={input} value={mealSlot} onChange={(event) => setMealSlot(event.target.value)}><option value="any">Any meal</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option><option value="drink">Drink</option></select></div></div>
    <label style={{ ...label, marginTop: 16 }}>What this recipe helps with</label><textarea style={{ ...input, height: 92, paddingTop: 12 }} value={description} onChange={(event) => setDescription(event.target.value)} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12, marginTop: 16 }}><div><label style={label}>Ingredients · one per line</label><textarea style={{ ...input, height: 240, paddingTop: 12, lineHeight: 1.6 }} value={ingredients} onChange={(event) => setIngredients(event.target.value)} placeholder={'2 cups spinach\n1 lemon\n1 tbsp olive oil'} /></div><div><label style={label}>Method · one step per line</label><textarea style={{ ...input, height: 240, paddingTop: 12, lineHeight: 1.6 }} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder={'Wash and prepare the ingredients.\nCombine everything in a bowl.\nServe immediately.'} /></div></div>
    <div style={{ display: 'flex', alignItems: 'end', gap: 10, marginTop: 16, flexWrap: 'wrap' }}><div style={{ minWidth: 180 }}><label style={label}>Status</label><select style={input} value={status} onChange={(event) => setStatus(event.target.value as GuideRecipe['status'])}><option value="draft">Draft</option><option value="submitted">Ready for review</option><option value="published">Published</option></select></div><button type="button" onClick={save} disabled={saving || !title.trim()} style={btn}>{saving ? 'Saving…' : 'Save recipe'}</button>{message && <span style={{ color: message.startsWith('Recipe saved') ? acid : '#F0A7A7', fontSize: 10 }}>{message}</span>}</div>
  </div>;
}

function GuardianProtocolAI({ accessToken, protocol, ownerId, initialRequest, initialSourceUrls = '', initialSourcePath = null, audienceProfile, progressive = false, onBuilt, onRevealEditor }: {
  accessToken: string;
  protocol: AdminProtocol;
  ownerId?: string;
  initialRequest?: string;
  initialSourceUrls?: string;
  initialSourcePath?: string | null;
  audienceProfile?: { audience: string; population: string; age: string; stage: string; problem: string };
  progressive?: boolean;
  onBuilt: () => void;
  onRevealEditor?: () => void;
}) {
  const [request, setRequest] = useState(initialRequest || 'Build a practical Protocol for this selected profile. Include safe daily actions, useful adaptations, and when to seek clinical advice.');
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [sourceUrls, setSourceUrls] = useState(initialSourceUrls);
  const [sourcePath, setSourcePath] = useState<string | null>(initialSourcePath);
  const [sourceFileName, setSourceFileName] = useState(initialSourcePath?.split('/').pop() || '');
  const [uploadingSource, setUploadingSource] = useState(false);

  async function attachSource(file?: File) {
    if (!file || !ownerId) return;
    setUploadingSource(true);
    setMessage('');
    try {
      const path = await uploadGuideFile(ownerId, file);
      setSourcePath(path);
      setSourceFileName(file.name);
    } catch (error: any) {
      setMessage(error?.message || 'The source file could not be uploaded.');
    } finally {
      setUploadingSource(false);
    }
  }

  async function buildDraft() {
    if (!request.trim()) return;
    setBuilding(true);
    setMessage('');
    try {
      const sources = [sourceUrls.trim() && `Reference websites: ${sourceUrls.trim().replace(/\n+/g, ', ')}`, sourcePath && `Uploaded reference document: ${sourcePath}`].filter(Boolean).join('\n');
      const draft = await buildProtocolWithAI(accessToken, protocol.id, `${request.trim()}${sources ? `\n\n${sources}` : ''}`);
      await Promise.all(draft.steps.map((step, index) => createProtocolItem(accessToken, {
        protocol_id: protocol.id,
        display_name: step.title,
        item_type: step.category === 'consume' ? 'consume' : step.category === 'supplement' ? 'supplement' : 'activity',
        kind: 'action',
        scope: null,
        scheduled_time: step.time ? `${step.time}:00` : null,
        duration_minutes: step.duration_minutes,
        group_name: null,
        day_number: step.day_number,
        sort_order: index + 1,
        parent_protocol_item_id: null,
        has_children: false,
        category: step.category,
        subtype: step.category === 'sleep' ? 'sleep' : step.category === 'consume' ? 'meal' : step.category === 'supplement' ? 'supplement' : 'wellness',
        hidden: false,
        enabled: true,
        notes: step.notes,
        recurrence_type: 'daily',
      })));
      setMessage(`${draft.summary} Added ${draft.steps.length} editable draft steps. Review them before publishing.`);
      setStage(2);
      onBuilt();
    } catch (error: any) {
      setMessage(error?.message || 'The AI draft could not be created.');
    } finally {
      setBuilding(false);
    }
  }

  if (progressive) return <section style={{ border: '1px solid #C9C6BC', background: '#FFF', maxWidth: 1120, margin: '0 auto 18px' }}>
    <div style={{ padding: '14px 18px', borderBottom: '1px solid #D7D4CB', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
      {['01 Profile & sources', '02 AI brief', '03 Review'].map((title, index) => <div key={title} style={{ color: stage === index ? '#151515' : '#8A8881', fontSize: 9, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase' }}><span style={{ display: 'inline-block', width: 8, height: 8, marginRight: 7, borderRadius: '50%', background: stage >= index ? '#6E7C4B' : '#D7D4CB' }} />{title}</div>)}
    </div>
    {stage === 0 && <div style={{ padding: 'clamp(20px,4vw,46px)' }}>
      <div style={{ color: '#6E7C4B', fontSize: 9, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase' }}>Known audience</div>
      <h1 style={{ fontFamily: serif, fontSize: 'clamp(34px,5vw,58px)', fontWeight: 300, margin: '8px 0 10px' }}>Start with the selected profile.</h1>
      <p style={{ color: '#686762', fontSize: 12, lineHeight: 1.6, maxWidth: 680, margin: '0 0 24px' }}>Confirm the audience already defined in the Value Ramp, then add trusted source material for this Protocol.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', border: '1px solid #D7D4CB', marginBottom: 26 }}>
        {Object.entries(audienceProfile || { audience: 'Everyone', population: protocol.target_gender || 'Everyone', age: 'Not specified', stage: 'Not specified', problem: protocol.name }).map(([key, value]) => <div key={key} style={{ minHeight: 84, padding: 14, borderRight: '1px solid #D7D4CB' }}><span style={{ display: 'block', color: '#77756F', fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 9 }}>{key}</span><strong style={{ fontSize: 13 }}>{value}</strong></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <div><label style={{ ...label, color: '#5F5D57' }}>Website addresses</label><textarea value={sourceUrls} onChange={(event) => setSourceUrls(event.target.value)} placeholder={'https://example.com/research\nhttps://example.com/guidance'} style={{ width: '100%', minHeight: 118, boxSizing: 'border-box', resize: 'vertical', border: '1px solid #C9C6BC', background: '#F5F4EF', color: '#151515', padding: 12, fontFamily: sans, fontSize: 12, lineHeight: 1.55 }} /><span style={{ display: 'block', color: '#77756F', fontSize: 9, marginTop: 6 }}>Add one trusted page per line.</span></div>
        <div><label style={{ ...label, color: '#5F5D57' }}>Reference PDF</label><label style={{ minHeight: 116, border: '1px dashed #A9A69D', background: '#F5F4EF', display: 'grid', placeItems: 'center', padding: 12, cursor: uploadingSource ? 'wait' : 'pointer', textAlign: 'center' }}><input type="file" accept="application/pdf,.pdf" disabled={uploadingSource || !ownerId} onChange={(event) => { void attachSource(event.target.files?.[0]); event.currentTarget.value = ''; }} style={{ display: 'none' }} /><span><Upload size={20} style={{ margin: '0 auto 8px' }} /><strong style={{ display: 'block', fontSize: 12 }}>{uploadingSource ? 'Uploading PDF…' : sourceFileName || 'Upload a PDF'}</strong><span style={{ display: 'block', color: '#77756F', fontSize: 9, marginTop: 5 }}>{sourcePath ? 'Attached to this Protocol' : 'PDF up to 50 MB'}</span></span></label></div>
      </div>
      {message && <p role="alert" style={{ color: '#9A3C3C', fontSize: 10, margin: '12px 0 0' }}>{message}</p>}
      <button type="button" onClick={() => { setMessage(''); setStage(1); }} style={{ ...btn, marginTop: 24, background: '#151515', color: '#FFF', borderColor: '#151515' }}>Continue to AI brief <ArrowRight size={14} /></button>
    </div>}
    {stage === 1 && <div style={{ padding: 'clamp(20px,4vw,46px)' }}>
      <div style={{ color: '#6E7C4B', fontSize: 9, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase' }}>Build instructions</div>
      <h1 style={{ fontFamily: serif, fontSize: 'clamp(34px,5vw,58px)', fontWeight: 300, margin: '8px 0 10px' }}>Review the AI brief.</h1>
      <p style={{ color: '#686762', fontSize: 11, margin: '0 0 18px' }}>{sourcePath || sourceUrls.trim() ? 'The selected profile and attached sources will be included.' : 'The selected profile will be used. No external sources are attached.'}</p>
      <textarea aria-label="Tell AI what to build" value={request} onChange={(event) => setRequest(event.target.value)} style={{ width: '100%', minHeight: 150, boxSizing: 'border-box', resize: 'vertical', border: '1px solid #C9C6BC', background: '#F5F4EF', color: '#151515', padding: 14, fontFamily: sans, fontSize: 12, lineHeight: 1.6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 16 }}><button type="button" onClick={() => { setMessage(''); setStage(0); }} disabled={building} style={{ ...btn, width: '100%', justifyContent: 'center', background: '#FFF', color: '#151515', borderColor: '#AAA79E' }}>← Back</button><button type="button" onClick={buildDraft} disabled={building || !request.trim()} style={{ ...btn, width: '100%', justifyContent: 'center', background: '#151515', color: '#FFF', borderColor: '#151515' }}>{building ? <><Loader2 size={13} className="animate-spin" /> Building draft</> : <><Sparkles size={13} /> Build Protocol</>}</button></div>
      {message && <p role="alert" style={{ color: message.includes('could not') || message.includes('failed') ? '#9A3C3C' : '#5D6545', fontSize: 10, margin: '12px 0 0' }}>{message}</p>}
    </div>}
    {stage === 2 && <div style={{ padding: 'clamp(28px,5vw,58px)', textAlign: 'center' }}><span style={{ width: 50, height: 50, margin: '0 auto 18px', borderRadius: '50%', background: '#6E7C4B', color: '#FFF', display: 'grid', placeItems: 'center' }}><Check size={24} /></span><div style={{ color: '#6E7C4B', fontSize: 9, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase' }}>Draft created</div><h1 style={{ fontFamily: serif, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, margin: '8px 0 10px' }}>Your Protocol is ready to review.</h1><p style={{ color: '#686762', fontSize: 11, lineHeight: 1.6, maxWidth: 650, margin: '0 auto 22px' }}>{message}</p><button type="button" onClick={onRevealEditor} style={{ ...btn, background: '#151515', color: '#FFF', borderColor: '#151515' }}>Review and edit Protocol <ArrowRight size={14} /></button></div>}
  </section>;

  return <section style={{ border: '1px solid #C9C6BC', background: '#FFF', padding: 18, marginBottom: 18 }}>
    <div style={{ color: '#6E7C4B', fontSize: 9, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase' }}>AI Protocol Builder</div>
    <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, margin: '8px 0 6px' }}>Build for the selected profile.</h2>
    <p style={{ color: '#686762', fontSize: 11, lineHeight: 1.55, margin: '0 0 12px' }}>{protocol.description || `Profile: ${protocol.target_gender || 'Everyone'}.`}</p>
    <textarea aria-label="Tell AI what to build" value={request} onChange={(event) => setRequest(event.target.value)} style={{ width: '100%', minHeight: 92, boxSizing: 'border-box', resize: 'vertical', border: '1px solid #C9C6BC', background: '#F5F4EF', color: '#151515', padding: 12, fontFamily: sans, fontSize: 12, lineHeight: 1.5 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
      <button type="button" onClick={buildDraft} disabled={building || !request.trim()} style={{ ...btn, height: 38, background: '#151515', color: '#FFF', borderColor: '#151515' }}>{building ? <><Loader2 size={13} className="animate-spin" /> Building draft</> : <><Sparkles size={13} /> Build with AI</>}</button>
      <span style={{ color: message.includes('could not') || message.includes('failed') ? '#9A3C3C' : '#5D6545', fontSize: 10, lineHeight: 1.4, flex: '1 1 280px' }}>{message || 'AI uses the audience, life stage, goal and Protocol description saved with this offer.'}</span>
    </div>
  </section>;
}

const offerBuilderTypes = [
  { kind: 'routine', title: 'R3 Protocol', eyebrow: 'Routine database', copy: 'Build a printable PDF and interactive app twin from linked meals, activities, supplements and smart lists.', Icon: HeartPulse },
  { kind: 'ebook', title: 'PDF guide', eyebrow: 'Profile + sources', copy: 'Turn your profile links and uploaded documents into a focused downloadable guide.', Icon: FileText },
  { kind: 'recipe_book', title: 'Recipe collection', eyebrow: 'Meals', copy: 'Build recipes grouped as breakfast, lunch, dinner, snack or drink.', Icon: Salad },
  { kind: 'one_to_one_call', title: '1:1 booking', eyebrow: 'Private live', copy: 'Send a client to your saved booking page for individual support.', Icon: CalendarDays },
  { kind: 'group_call', title: 'Group call', eyebrow: 'Live group', copy: 'Create a shared session using your saved booking link.', Icon: Users },
  { kind: 'in_person', title: 'In-person offer', eyebrow: 'Physical', copy: 'Package an appointment, workshop or local experience.', Icon: Globe2 },
] as const;

function OfferBuilder({ profile, protocols, offers, librarySources = [], onOpenProtocols, onCreated }: { profile: GuideProfile; protocols: AdminProtocol[]; offers: GuideOffer[]; librarySources?: GuideLibraryItem[]; onOpenProtocols: () => void; onCreated: (offer: GuideOffer) => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  async function build(kind: typeof offerBuilderTypes[number]['kind'], title: string) {
    if (kind === 'routine') { onOpenProtocols(); return; }
    if (!user) return;
    setBusy(kind); setMessage('');
    try {
      const booking = kind === 'one_to_one_call' || kind === 'group_call' ? profile.social_links?.booking_url || null : null;
      const sourceNote = librarySources.length ? ` Sources: ${librarySources.map((source) => source.title).join(', ')}.` : '';
      const created = await createGuideOffer(user.id, { kind, title, description: `${offerBuilderTypes.find((item) => item.kind === kind)?.copy || ''}${sourceNote}`.trim() || null, price_cents: 0, affiliate_url: null, access_model: kind === 'ebook' || kind === 'recipe_book' ? 'free' : 'paid', file_path: librarySources.find((source) => source.kind === 'pdf')?.file_path || null, booking_url: booking });
      onCreated(created); setMessage(`${title} created. Open Value Ramps to place it in a customer journey.`);
    } catch (error: any) { setMessage(error?.message || 'Could not create this offer.'); }
    finally { setBusy(''); }
  }
  return <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><img src={guidePlates.offer_builder} alt="" style={{ width: 74, height: 74, objectFit: 'contain', filter: 'grayscale(1) contrast(.9) brightness(.74)' }} /><div><div style={{ ...label, color: acid }}>Reusable building blocks</div><h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 300, margin: '8px 0 0' }}>Offer Builder</h1></div></div>
    <p style={{ color: muted, maxWidth: 720, lineHeight: 1.6 }}>Create the things people receive. Reuse any offer across more than one Value Ramp.</p>
    {librarySources.length > 0 && <div style={{ border: `1px solid ${acid}`, background: '#1B2017', color: acid, padding: 13, marginTop: 18, fontSize: 11 }}><strong>{librarySources.length} Library source{librarySources.length === 1 ? '' : 's'} attached:</strong> {librarySources.map((source) => source.title).join(', ')}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 28 }}>{offerBuilderTypes.map(({ kind, title, eyebrow, copy, Icon }) => <button key={kind} type="button" onClick={() => build(kind, title)} disabled={busy === kind} style={{ minHeight: 220, border: `1px solid ${line}`, background: panel, color: ink, padding: 22, textAlign: 'left', cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column' }}><span style={{ width: 48, height: 48, border: `1px solid ${line}`, display: 'grid', placeItems: 'center', color: acid }}><Icon size={22} /></span><span style={{ ...label, color: acid, margin: '24px 0 7px' }}>{eyebrow}</span><strong style={{ fontSize: 22 }}>{title}</strong><span style={{ color: muted, fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{copy}</span><span style={{ marginTop: 'auto', paddingTop: 18, fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{busy === kind ? 'Creating...' : kind === 'routine' ? 'Open R3 builder →' : 'Create offer →'}</span></button>)}</div>
    {message && <p style={{ color: acid, fontSize: 11, marginTop: 16 }}>{message}</p>}
    <section style={{ borderTop: `1px solid ${line}`, marginTop: 38, paddingTop: 24 }}><h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 32, margin: 0 }}>R3 outputs</h2><p style={{ color: muted, fontSize: 12 }}>Every R3 Protocol can be edited against the full Routine database, exported as a PDF and delivered through web or iOS.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><a href={APP_STORE_URL} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: 'none' }}>Open iOS app <ArrowRight size={13} /></a><button type="button" onClick={onOpenProtocols} style={{ ...btn, background: 'transparent', color: ink }}>Manage {protocols.length} Protocols</button><span style={{ ...btn, background: 'transparent', color: muted, cursor: 'default' }}><Download size={13} /> PDF export inside builder</span></div></section>
    {offers.length > 0 && <section style={{ marginTop: 34 }}><div style={label}>Created offers · {offers.length}</div>{offers.slice(0, 6).map((offer) => <Row key={offer.id} title={offer.title} meta={`${offer.kind.replaceAll('_', ' ')} · ${offer.status}`} />)}</section>}
  </>;
}

function GuideLibrary({ guideId, selectedIds, onSelectedIds, onUse }: { guideId: string; selectedIds: string[]; onSelectedIds: (ids: string[]) => void; onUse: (destination: 'protocol' | 'pdf', sources: GuideLibraryItem[]) => void }) {
  const [folders, setFolders] = useState<GuideLibraryFolder[]>([]);
  const [items, setItems] = useState<GuideLibraryItem[]>([]);
  const [folder, setFolder] = useState('all');
  const [mode, setMode] = useState<'pdf' | 'url' | 'transcript' | null>(null);
  const [folderName, setFolderName] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const selectedFolder = folder === 'all' || folder === 'unfiled' ? null : folder;
  const visibleItems = items.filter((item) => folder === 'all' || (folder === 'unfiled' ? !item.folder_id : item.folder_id === folder));

  useEffect(() => {
    Promise.all([listGuideLibraryFolders(guideId), listGuideLibraryItems(guideId)])
      .then(([nextFolders, nextItems]) => { setFolders(nextFolders); setItems(nextItems); })
      .catch((error) => setMessage(error?.message || 'Could not open the library. Apply the latest database migration and try again.'));
  }, [guideId]);

  async function addFolder() {
    if (!folderName.trim()) return;
    setBusy(true); setMessage('');
    try { const created = await createGuideLibraryFolder(guideId, folderName.trim()); setFolders((current) => [...current, created]); setFolder(created.id); setFolderName(''); }
    catch (error: any) { setMessage(error?.message || 'Could not create that folder.'); }
    finally { setBusy(false); }
  }

  async function addItem(file?: File) {
    if (!mode) return;
    setBusy(true); setMessage('');
    try {
      let filePath: string | null = null;
      let body = transcript.trim() || null;
      let itemTitle = title.trim();
      if (mode === 'pdf') {
        if (!file) throw new Error('Choose a PDF first.');
        filePath = await uploadGuideFile(guideId, file);
        itemTitle ||= file.name.replace(/\.pdf$/i, '');
      }
      if (mode === 'url') {
        if (!url.trim()) throw new Error('Add a website address first.');
        new URL(url.trim());
        itemTitle ||= new URL(url.trim()).hostname.replace(/^www\./, '');
      }
      if (mode === 'transcript' && !body) throw new Error('Paste or import a transcript first.');
      itemTitle ||= 'Untitled transcript';
      const created = await createGuideLibraryItem(guideId, { folder_id: selectedFolder, kind: mode, title: itemTitle, source_url: mode === 'url' ? url.trim() : null, file_path: filePath, transcript: body });
      setItems((current) => [created, ...current]); setMode(null); setTitle(''); setUrl(''); setTranscript(''); setMessage(`${itemTitle} saved to the library.`);
    } catch (error: any) { setMessage(error?.message === 'Invalid URL' ? 'Enter a complete URL, including https://.' : error?.message || 'Could not save this source.'); }
    finally { setBusy(false); }
  }

  function importTranscript(file?: File) {
    if (!file) return;
    file.text().then((text) => { setTranscript(text); setTitle((current) => current || file.name.replace(/\.(txt|md)$/i, '')); });
  }

  async function openItem(item: GuideLibraryItem) {
    if (item.kind === 'pdf' && item.file_path) window.open(await getGuideFileDownloadUrl(item.file_path), '_blank', 'noopener,noreferrer');
    if (item.kind === 'url' && item.source_url) window.open(item.source_url, '_blank', 'noopener,noreferrer');
    if (item.kind === 'transcript' && item.transcript) {
      const href = URL.createObjectURL(new Blob([item.transcript], { type: 'text/plain' }));
      const anchor = document.createElement('a'); anchor.href = href; anchor.download = `${item.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'transcript'}.txt`; anchor.click(); URL.revokeObjectURL(href);
    }
  }

  return <section>
    <div style={{ minHeight: 230, border: `1px solid ${line}`, padding: 'clamp(24px,4vw,46px)', background: panel, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 180px', alignItems: 'center', gap: 24 }}><div><div style={{ ...label, color: acid }}>Source library</div><h1 style={{ fontFamily: serif, fontSize: 'clamp(42px,6vw,72px)', lineHeight: .95, fontWeight: 300, margin: '12px 0 16px' }}>Build from what you trust.</h1><p style={{ color: muted, lineHeight: 1.6, maxWidth: 650, margin: 0 }}>Keep PDFs, useful webpages and transcripts organised, then select the sources that should inform your next Protocol or PDF guide.</p></div><FolderOpen size={128} strokeWidth={.7} color={acid} style={{ opacity: .7 }} /></div>
    <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', border: `1px solid ${line}`, borderTop: 0 }}>
      <aside style={{ padding: 18, borderRight: `1px solid ${line}` }}><div style={{ ...label, color: ink }}>Folders</div>{[['all','All sources'],['unfiled','Unfiled']].map(([id, name]) => <button key={id} onClick={() => setFolder(id)} style={{ width: '100%', border: 0, background: folder === id ? '#25291F' : 'transparent', color: folder === id ? acid : muted, padding: '11px 10px', textAlign: 'left', fontFamily: sans, cursor: 'pointer' }}>{name}</button>)}{folders.map((entry) => <button key={entry.id} onClick={() => setFolder(entry.id)} style={{ width: '100%', border: 0, background: folder === entry.id ? '#25291F' : 'transparent', color: folder === entry.id ? acid : muted, padding: '11px 10px', textAlign: 'left', fontFamily: sans, cursor: 'pointer' }}>{entry.name}</button>)}<div style={{ display: 'flex', gap: 6, marginTop: 16 }}><input aria-label="New folder name" style={{ ...input, height: 38, minWidth: 0 }} value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="New folder" /><button type="button" onClick={addFolder} disabled={busy || !folderName.trim()} style={{ ...btn, width: 40, minHeight: 38, padding: 0 }}><Plus size={14} /></button></div></aside>
      <div style={{ padding: 'clamp(18px,3vw,32px)' }}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{([['pdf','Upload PDF',Upload],['url','Save URL',Link2],['transcript','Add transcript',FileText]] as const).map(([id, text, Icon]) => <button key={id} type="button" onClick={() => { setMode(mode === id ? null : id); setMessage(''); }} style={{ ...btn, background: mode === id ? acid : 'transparent', color: mode === id ? black : ink }}><Icon size={14} />{text}</button>)}</div>
        {mode && <div style={{ border: `1px solid ${line}`, background: '#0D0E0C', padding: 18, marginTop: 14 }}><label style={label}>Source title</label><input style={input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this source a clear name" />{mode === 'pdf' && <label style={{ ...btn, width: '100%', boxSizing: 'border-box', marginTop: 10, background: acid }}><input type="file" accept="application/pdf,.pdf" hidden disabled={busy} onChange={(event) => { void addItem(event.target.files?.[0]); event.currentTarget.value = ''; }} />{busy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} Choose PDF and save</label>}{mode === 'url' && <><label style={{ ...label, marginTop: 12 }}>Website address</label><input type="url" style={input} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/research" /><button type="button" onClick={() => void addItem()} disabled={busy || !url.trim()} style={{ ...btn, marginTop: 10, background: acid }}>Save webpage</button></>}{mode === 'transcript' && <><label style={{ ...label, marginTop: 12 }}>Transcript</label><textarea style={{ ...input, height: 150, paddingTop: 12, resize: 'vertical' }} value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Paste transcript text here" /><div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}><label style={{ ...btn, background: 'transparent', color: ink }}><input type="file" accept=".txt,.md,text/plain,text/markdown" hidden onChange={(event) => { importTranscript(event.target.files?.[0]); event.currentTarget.value = ''; }} />Import .txt or .md</label><button type="button" onClick={() => void addItem()} disabled={busy || !transcript.trim()} style={{ ...btn, background: acid }}>Save transcript</button></div></>}</div>}
        {message && <p role="status" style={{ color: message.includes('saved') ? acid : '#F0A7A7', fontSize: 11 }}>{message}</p>}
        {selectedIds.length > 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, marginTop: 18, border: `1px solid ${acid}`, background: '#1B2017', flexWrap: 'wrap' }}><strong style={{ fontSize: 12, color: acid }}>{selectedIds.length} source{selectedIds.length === 1 ? '' : 's'} selected</strong><span style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => onUse('protocol', items.filter((item) => selectedIds.includes(item.id)))} style={{ ...btn, background: acid }}>Use in Protocol</button><button type="button" onClick={() => onUse('pdf', items.filter((item) => selectedIds.includes(item.id)))} style={{ ...btn }}>Use in PDF</button></span></div>}
        <div style={{ marginTop: 20 }}>{visibleItems.length ? visibleItems.map((item) => { const active = selectedIds.includes(item.id); return <article key={item.id} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr) auto', gap: 13, alignItems: 'center', borderTop: `1px solid ${line}`, padding: '16px 2px' }}><input aria-label={`Select ${item.title}`} type="checkbox" checked={active} onChange={() => onSelectedIds(active ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id])} style={{ width: 18, height: 18, accentColor: acid }} /><div><span style={{ color: acid, fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>{item.kind} · {folders.find((entry) => entry.id === item.folder_id)?.name || 'Unfiled'}</span><h3 style={{ fontFamily: serif, fontSize: 23, fontWeight: 300, margin: '5px 0 3px' }}>{item.title}</h3><span style={{ color: muted, fontSize: 10 }}>{item.kind === 'url' ? item.source_url : item.kind === 'transcript' ? `${item.transcript?.split(/\s+/).filter(Boolean).length || 0} words` : 'Private PDF'}</span></div><div style={{ display: 'flex', gap: 6 }}><button type="button" title={item.kind === 'transcript' ? 'Download transcript' : 'Open source'} onClick={() => void openItem(item)} style={{ ...btn, width: 38, minHeight: 38, padding: 0, background: 'transparent', color: ink }}>{item.kind === 'transcript' ? <Download size={14} /> : <ExternalLink size={14} />}</button><button type="button" title="Delete source" onClick={async () => { await deleteGuideLibraryItem(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); onSelectedIds(selectedIds.filter((id) => id !== item.id)); }} style={{ ...btn, width: 38, minHeight: 38, padding: 0, background: 'transparent', color: muted }}><Trash2 size={14} /></button></div></article>; }) : <Empty title="This folder is empty" copy="Upload a PDF, save a useful webpage or add a transcript." />}</div>
      </div>
    </div>
  </section>;
}

function Workspace({ profile, onProfile }: { profile: GuideProfile; onProfile: (p: GuideProfile) => void }) {
  const { user, accessToken, signOut } = useAuth();
  // Deep links from the public Guardians nav, e.g. /guardians/workspace?tab=protocols
  const [tab, setTab] = useState<Tab>(() => { const wanted = new URLSearchParams(window.location.search).get('tab'); const tabs: Tab[] = ['home', 'profile', 'library', 'leads', 'value_ramps', 'offer_builder', 'recipes', 'protocols']; return tabs.includes(wanted as Tab) ? wanted as Tab : 'home'; });
  const [leads, setLeads] = useState<GuideLead[]>([]);
  const [offers, setOffers] = useState<GuideOffer[]>([]);
  const [recipes, setRecipes] = useState<GuideRecipe[]>([]);
  const [protocols, setProtocols] = useState<AdminProtocol[]>([]);
  const [valueRamps, setValueRamps] = useState<GuideValueRamp[]>([]);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [protocolRevision, setProtocolRevision] = useState(0);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [builderLibrarySources, setBuilderLibrarySources] = useState<GuideLibraryItem[]>([]);
  const profileBookingProvider = (profile.social_links?.booking_provider as BookingProvider) || 'ROUTINE³ Booking';
  const profileBookingUrl = profile.social_links?.booking_url || '';
  const profileLanguage = profile.social_links?.language || 'English';
  const updateProfileLink = (key: string, value: string) => onProfile({ ...profile, social_links: { ...(profile.social_links || {}), [key]: value } });
  useEffect(() => { if (!user) return; Promise.all([listGuideLeads(user.id), listGuideOffers(user.id), listGuideRecipes(user.id), accessToken ? listProtocols(accessToken, user.id) : Promise.resolve([])]).then(([l,o,r,p]) => { setLeads(l); setOffers(o); setRecipes(r); setProtocols(p); }).catch(() => {}); listGuideValueRamps(user.id).then(setValueRamps).catch(() => setValueRamps([])); }, [user?.id, accessToken]);
  const metric = useMemo(() => [{ n: leads.length, l: 'Leads' }, { n: valueRamps.length, l: 'Value Ramps' }, { n: offers.length + recipes.length + protocols.length, l: 'Offers' }, { n: protocols.length, l: 'R3 Protocols' }], [leads.length, offers.length, recipes.length, protocols.length, valueRamps.length]);
  async function quickAdd() {
    if (!user || !newTitle.trim()) return;
    setAdding(true);
    try {
      if (tab === 'leads') { const x = await createGuideLead(user.id, { name: newTitle, email: newEmail, goal: newGoal || null }); setLeads([x, ...leads]); }
      if (tab === 'value_ramps') { const base = newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'value-ramp'; const x = await createGuideValueRamp(user.id, { name: newTitle.trim(), slug: `${base}-${Date.now().toString().slice(-5)}`, audience: 'Everyone', problem: newGoal.trim() || profile.specialties[0] || 'Wellbeing' }); setValueRamps([x, ...valueRamps]); }
      if (tab === 'recipes') { const x = await createGuideRecipe(user.id, { title: newTitle, description: newGoal || null, meal_slot: 'breakfast' }); setRecipes([x, ...recipes]); }
      if (tab === 'protocols' && accessToken) { const x = await createProtocol(accessToken, { user_id: user.id, name: newTitle }); setProtocols([x, ...protocols]); setProtocolId(x.id); }
      setNewTitle(''); setNewEmail(''); setNewGoal('');
    } finally { setAdding(false); }
  }
  return <div style={{ minHeight: '100vh', background: black, color: ink, fontFamily: sans }}>
    <header style={{ height: 62, borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}><Brand /><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ color: muted, fontSize: 11 }}>{profile.display_name}</span><button onClick={signOut} title="Sign out" style={{ border: `1px solid ${line}`, background: 'transparent', color: muted, width: 34, height: 34, cursor: 'pointer' }}><LogOut size={14} /></button></div></header>
    <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0,1fr)', minHeight: 'calc(100vh - 63px)' }}>
      <aside style={{ borderRight: `1px solid ${line}`, padding: '25px 14px' }}>{nav.map(({ id, label: n, Icon }) => <button key={id} onClick={() => { setTab(id); setProtocolId(null); setRecipeId(null); }} style={{ width: '100%', height: 42, border: 0, background: tab === id ? '#1C1E19' : 'transparent', color: tab === id ? ink : muted, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', cursor: 'pointer', fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}><Icon size={14} />{n}</button>)}</aside>
      <main style={{ padding: 'clamp(26px,5vw,68px)', overflow: 'hidden' }}>
        {tab === 'home' && <><div style={{ ...label, color: acid }}>Guardian workspace</div><h1 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(44px,6vw,76px)', lineHeight: .95, margin: '15px 0 18px' }}>Build what people follow.</h1><p style={{ color: muted, maxWidth: 650, lineHeight: 1.6 }}>Create reusable offers, then arrange them into as many audience-specific Value Ramps as you need.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', borderTop: `1px solid ${line}`, marginTop: 55 }}>{metric.map((m) => <div key={m.l} style={{ borderRight: `1px solid ${line}`, padding: '25px 18px 25px 0' }}><div style={{ fontFamily: serif, fontSize: 42 }}>{m.n}</div><div style={{ ...label, margin: '7px 0 0' }}>{m.l}</div></div>)}</div><div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>{nav.slice(1,5).map(({ id, label: title }) => <button key={id} onClick={() => setTab(id)} style={{ border: `1px solid ${line}`, background: panel, color: ink, minHeight: 210, padding: 22, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}><span><img src={guidePlates[id]} alt="" style={{ width: 86, height: 86, objectFit: 'contain', filter: 'grayscale(1) contrast(.9) brightness(.75)', opacity: .82 }} /><span style={{ display: 'block', fontFamily: serif, fontSize: 25, fontWeight: 300, marginTop: 12 }}>{title}</span></span><ChevronRight size={17} color={muted} /></button>)}</div></>}
        {tab === 'profile' && <>
          <h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 350 }}>Your profile</h1>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <div><label style={label}>Public name</label><input style={input} value={profile.display_name} onChange={(e) => onProfile({ ...profile, display_name: e.target.value })} /></div>
              <div><label style={label}>Main language</label><select style={input} value={profileLanguage} onChange={(event) => updateProfileLink('language', event.target.value)}>{languageOptions.map((language) => <option key={language.code}>{language.name}</option>)}</select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 18 }}>
              <div><label style={label}>Contact email</label><input type="email" style={input} value={profile.contact_email || ''} onChange={(e) => onProfile({ ...profile, contact_email: e.target.value })} /></div>
              <div><label style={label}>WhatsApp number <span style={{ color: muted }}>· optional</span></label><input type="tel" style={input} value={profile.whatsapp_phone || ''} onChange={(e) => onProfile({ ...profile, whatsapp_phone: e.target.value })} /></div>
            </div>
            <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginTop: 18 }}>
              <label style={{ ...label, color: ink }}>Booking provider</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(135px,1fr))', gap: 7, marginBottom: 10 }}>
                {bookingProviders.map((provider) => <button type="button" key={provider.value} onClick={() => updateProfileLink('booking_provider', provider.value)} style={{ ...btn, height: 38, padding: '0 9px', background: profileBookingProvider === provider.value ? acid : 'transparent', color: profileBookingProvider === provider.value ? black : ink, borderColor: profileBookingProvider === provider.value ? acid : line, fontSize: 8, whiteSpace: 'nowrap', minWidth: 0 }}>{provider.label}</button>)}
              </div>
              <label style={label}>Booking page URL</label>
              <input type="url" style={input} value={profileBookingUrl} onChange={(e) => updateProfileLink('booking_url', e.target.value)} placeholder={bookingProviders.find((provider) => provider.value === profileBookingProvider)?.placeholder} />
            </div>
            <label style={{ ...label, marginTop: 18 }}>Headline</label><input style={input} value={profile.headline} onChange={(e) => onProfile({ ...profile, headline: e.target.value })} />
            <label style={{ ...label, marginTop: 18 }}>Expertise tags <span style={{ color: muted }}>· separate with commas</span></label><input style={input} value={profile.social_links?.expertise_tags || ''} onChange={(e) => updateProfileLink('expertise_tags', e.target.value)} placeholder="Hypnosis, compassionate care, equity" />
            <div style={{ marginTop: 8 }}><ExpertiseTags tags={parseExpertiseTags(profile.social_links?.expertise_tags)} color={acid} compact /></div>
            <label style={{ ...label, marginTop: 18 }}>Bio</label><textarea style={{ ...input, height: 150, paddingTop: 12 }} value={profile.bio} onChange={(e) => onProfile({ ...profile, bio: e.target.value })} />
            <button onClick={async () => onProfile(await saveGuideProfile(profile))} style={{ ...btn, marginTop: 18 }}>Save profile</button>
          </div>
        </>}
        {tab === 'library' && user && <GuideLibrary guideId={user.id} selectedIds={selectedLibraryIds} onSelectedIds={setSelectedLibraryIds} onUse={(destination, sources) => { setBuilderLibrarySources(sources); setTab(destination === 'protocol' ? 'protocols' : 'offer_builder'); }} />}
        {tab === 'offer_builder' && <OfferBuilder profile={profile} protocols={protocols} offers={offers} librarySources={builderLibrarySources} onOpenProtocols={() => setTab('protocols')} onCreated={(offer) => setOffers((current) => [offer, ...current])} />}
        {(['leads','value_ramps','recipes','protocols'] as Tab[]).includes(tab) && !protocolId && !recipeId && <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><img src={guidePlates[tab]} alt="" style={{ width: 74, height: 74, objectFit: 'contain', filter: 'grayscale(1) contrast(.9) brightness(.74)', opacity: .86 }} /><div><div style={{ ...label, color: acid }}>{tab === 'value_ramps' ? 'Customer journeys' : 'Build'}</div><h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 300, margin: '8px 0 0' }}>{tab === 'value_ramps' ? 'Value Ramps' : tab.charAt(0).toUpperCase() + tab.slice(1)}</h1></div></div><button onClick={() => setAdding(!adding)} style={btn}><Plus size={14} /> Add {tab === 'value_ramps' ? 'Value Ramp' : tab === 'protocols' ? 'Protocol' : tab.slice(0,-1)}</button></div>{adding && <div style={{ display: 'grid', gridTemplateColumns: tab === 'leads' ? '1fr 1fr 1.2fr auto' : '1fr 1.4fr auto', gap: 9, margin: '28px 0' }}><input style={input} placeholder={tab === 'leads' ? 'Name' : tab === 'value_ramps' ? 'Ramp name' : 'Title'} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />{tab === 'leads' && <input style={input} type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />}<input style={input} placeholder={tab === 'value_ramps' ? 'Audience problem or goal' : tab === 'leads' ? 'Goal' : 'Short description'} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} /><button onClick={quickAdd} disabled={adding && !newTitle} style={btn}>Create</button></div>}<div style={{ marginTop: 30 }}>{tab === 'leads' && (leads.length ? leads.map((x) => <Row key={x.id} title={x.name} meta={`${x.email} · ${x.goal || 'No goal yet'}`} />) : <Empty image={guidePlates.leads} title="No leads yet" copy="Add a lead or share your public guide page." />)}{tab === 'value_ramps' && (valueRamps.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 12 }}>{valueRamps.map((ramp) => <article key={ramp.id} style={{ border: `1px solid ${line}`, background: panel, padding: 22, minHeight: 220, display: 'flex', flexDirection: 'column' }}><Route size={24} color={acid} /><div style={{ ...label, color: acid, marginTop: 24 }}>{ramp.audience} · {ramp.problem}</div><h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 29, margin: '4px 0 8px' }}>{ramp.name}</h2><p style={{ color: muted, fontSize: 11, lineHeight: 1.5 }}>{ramp.offer_ids.length} reusable offers · {ramp.status}</p><span style={{ marginTop: 'auto', color: ink, fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>/guardians/{profile.slug}/value-ramp/{ramp.slug}</span></article>)}</div> : <Empty image={guidePlates.value_ramps} title="Create your first Value Ramp" copy="Choose one audience problem, then arrange reusable offers from a free first win to deeper support." action={<button type="button" onClick={() => setAdding(true)} style={btn}>Create Value Ramp</button>} />)}{tab === 'recipes' && (recipes.length ? recipes.map((x) => <Row key={x.id} title={x.title} meta={`${x.meal_slot || 'Any meal'} · ${x.status}`} action="Open builder" onClick={() => setRecipeId(x.id)} />) : <Empty image={guidePlates.recipes} title="No recipes yet" copy="Create a meal, drink or snack and reuse it in Protocols and offers." />)}{tab === 'protocols' && (protocols.length ? protocols.map((x) => <Row key={x.id} title={x.name} meta={`${x.total_days || 1} days · ${x.is_public ? 'Published' : 'Draft'} · PDF + app twin`} action="Open R3 builder" onClick={() => setProtocolId(x.id)} />) : <Empty image={guidePlates.protocols} title="No Protocol drafts yet" copy="Build against the full Routine database with timings, quantities, linked records and PDF export." />)}</div></>}
        {tab === 'recipes' && recipeId && <RecipeBuilder recipe={recipes.find((recipe) => recipe.id === recipeId)!} onBack={() => setRecipeId(null)} onSaved={(saved) => setRecipes((current) => current.map((recipe) => recipe.id === saved.id ? saved : recipe))} />}
        {tab === 'protocols' && protocolId && accessToken && user && <div style={{ background: '#F5F4EF', color: '#151515', padding: 18, minHeight: 700 }}><button onClick={() => setProtocolId(null)} style={{ ...btn, marginBottom: 14, background: '#151515', color: '#FFF' }}>← Protocols</button>{protocols.find((protocol) => protocol.id === protocolId) && <GuardianProtocolAI accessToken={accessToken} protocol={protocols.find((protocol) => protocol.id === protocolId)!} ownerId={user.id} initialSourceUrls={builderLibrarySources.filter((source) => source.kind === 'url').map((source) => source.source_url).filter(Boolean).join('\n')} initialSourcePath={builderLibrarySources.find((source) => source.kind === 'pdf')?.file_path || null} initialRequest={builderLibrarySources.length ? `Build a practical Protocol using these Library sources:\n${builderLibrarySources.map((source) => `- ${source.title}${source.kind === 'transcript' ? `: ${source.transcript?.slice(0, 4000)}` : ''}`).join('\n')}` : undefined} onBuilt={() => setProtocolRevision((value) => value + 1)} />}<ProtocolEditor key={`${protocolId}-${protocolRevision}`} accessToken={accessToken} initialProtocolId={protocolId} ownerId={user.id} /></div>}
      </main>
    </div>
  </div>;
}

function Row({ title, meta, action, onClick }: { title: string; meta: string; action?: string; onClick?: () => void }) { const content = <><div><div style={{ fontFamily: serif, fontSize: 22 }}>{title}</div><div style={{ color: muted, fontSize: 11, marginTop: 5 }}>{meta}</div></div><span style={{ display: 'flex', alignItems: 'center', gap: 8, color: muted, fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>{action}<ChevronRight size={16} /></span></>; return onClick ? <button type="button" onClick={onClick} style={{ width: '100%', border: 0, borderTop: `1px solid ${line}`, padding: '18px 4px', background: 'transparent', color: ink, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}>{content}</button> : <div style={{ borderTop: `1px solid ${line}`, padding: '18px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{content}</div>; }

// Scopes Guardian styling; globals.css exempts `.guardian-ui button` from the forced 16px button size.
export function GuidePortal() {
  return <div className="guardian-ui"><style>{`@media (max-width: 900px){.guardian-ui .guardian-builders{display:none !important}}`}</style><GuidePortalRoutes /></div>;
}

function GuidePortalRoutes() {
  const { user, accessToken, loading } = useAuth();
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const isWorkspaceRoute = pathname === '/guardians/workspace';
  const routeSlug = pathname.match(/^\/guardians\/([^/]+)(?:\/value-ramp\/[^/]+)?$/)?.[1] || null;
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (!user) { setProfile(null); setChecking(false); return; }
    setChecking(true); getGuideProfile(user.id).then(setProfile).catch(() => setProfile(null)).finally(() => setChecking(false));
  }, [user?.id]);
  if (routeSlug && !isWorkspaceRoute) return <GuardianWebsite slug={decodeURIComponent(routeSlug)} isSignedIn={Boolean(user)} />;
  if (!isWorkspaceRoute) return <PublicGuidePage isSignedIn={Boolean(user)} />;
  if (loading || checking) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', fontFamily: sans }}>Opening Guardian workspace…</div>;
  if (!user) return <PublicGuidePage isSignedIn={false} />;
  if (!profile && accessToken) return <Onboarding userId={user.id} accessToken={accessToken} name={user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Guardian'} email={user.email || ''} accountAvatarUrl={user.user_metadata?.avatar_url || user.user_metadata?.picture || null} onDone={setProfile} />;
  if (!profile) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', fontFamily: sans }}>Opening Guardian setup…</div>;
  return <Workspace profile={profile} onProfile={setProfile} />;
}
