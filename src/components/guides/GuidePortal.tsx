import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, ChevronRight, FileText, HeartPulse, LogOut,
  Mail, Package, Plus, Salad, Sparkles, Users, Globe2, Loader2,
  Upload, Check, Instagram, Youtube, Link2, AtSign,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProtocolEditor } from '../admin/ProtocolEditor';
import { buildProtocolWithAI, createProtocol, createProtocolItem, listProtocols, type AdminProtocol } from '../../utils/protocolAdmin';
import {
  createGuideLead, createGuideOffer, createGuideRecipe, getGuideProfile, getGuideProfileBySlug,
  importGuideProfile, listGuideLeads, listGuideOffers, listGuideRecipes, saveGuideProfile,
  updateGuideRecipe, uploadGuideFile, uploadGuideImage, type GuideLead, type GuideOffer, type GuideProfile, type GuideRecipe,
  type ImportedGuideProfile,
} from '../../utils/guidePortal';

const ink = '#F5F2EA';
const muted = '#9B9A94';
const line = 'rgba(245,242,234,0.16)';
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

function ExpertiseTags({ tags, color = '#667245', compact = false }: { tags: string[]; color?: string; compact?: boolean }) {
  if (!tags.length) return null;
  return <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: compact ? 5 : 7, margin: compact ? '0 0 11px' : '0 0 18px' }}>
    {tags.map((tag) => <span key={tag} style={{ border: `1px solid ${color}66`, borderRadius: 999, color, padding: compact ? '4px 7px' : '6px 10px', fontSize: compact ? 6.5 : 9, fontWeight: 700, letterSpacing: '.055em', textTransform: 'uppercase', background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(5px)' }}>{tag}</span>)}
  </div>;
}

type Tab = 'home' | 'profile' | 'leads' | 'offers' | 'recipes' | 'protocols';
type FreeOfferKind = 'ebook' | 'one_to_one_call' | 'recipe_book' | 'routine';
type UpsellKind = 'ebook' | 'routine' | 'routine_guidance' | 'recipe_book' | 'group_call' | 'one_to_one_call' | 'in_person' | 'festival';
type DeliveryFormat = 'Downloadable PDF' | 'Interactive Protocol' | 'PDF + Interactive Protocol' | 'Live online' | 'In person' | 'Event';
type BookingProvider = 'ROUTINE³ Booking' | 'Cal.com' | 'Google appointment schedule' | 'Calendly' | 'Other';
type StoryTemplateId = 'editorial' | 'ritual' | 'human' | 'clinical' | 'kitchen' | 'night' | 'coastal' | 'movement' | 'collage' | 'herbal' | 'future' | 'community';
type CurrencyCode = 'GBP' | 'EUR' | 'USD';
type HeaderStyle = 'white' | 'tone' | 'black';
type OfferNextStep = 'builder' | 'link' | 'video' | 'booking';

const pricingRegions: { region: string; currency: CurrencyCode; label: string }[] = [
  { region: 'United Kingdom', currency: 'GBP', label: 'UK · Pound' },
  { region: 'Europe', currency: 'EUR', label: 'Europe · Euro' },
  { region: 'United States', currency: 'USD', label: 'US · Dollar' },
];
function defaultPricingRegion() {
  if (typeof navigator === 'undefined') return pricingRegions[0];
  const locale = navigator.language.toUpperCase();
  if (locale.includes('-US')) return pricingRegions[2];
  if (locale.includes('-GB')) return pricingRegions[0];
  return pricingRegions[1];
}
function formatMoney(value: number | string, currency: string = 'GBP') {
  const amount = Number(value || 0);
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount); }
  catch { return `${currency} ${amount}`; }
}
function readableText(background: string) {
  const value = background.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#11120F';
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((part) => parseInt(part, 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#11120F' : '#FFFFFF';
}

const storyTemplates: { id: StoryTemplateId; name: string; style: string; description: string; image: string; heading: string; body: string; page: string; accent: string; header: HeaderStyle; treatment: 'color' | 'greyscale' }[] = [
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
  { name: 'English', code: 'en' }, { name: 'Polish', code: 'pl' }, { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' }, { name: 'German', code: 'de' }, { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' }, { name: 'Dutch', code: 'nl' }, { name: 'Arabic', code: 'ar' },
];

const freeValueSuggestions: Record<FreeOfferKind, string> = {
  ebook: 'Learn one useful method they can apply today.',
  one_to_one_call: 'Leave with clarity on the right next step for their goal.',
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
  { id: 'leads', label: 'Leads', Icon: Users },
  { id: 'offers', label: 'Products', Icon: Package },
  { id: 'recipes', label: 'Recipes', Icon: Salad },
  { id: 'protocols', label: 'Protocols', Icon: HeartPulse },
  { id: 'profile', label: 'Profile', Icon: FileText },
];

const guidePlates: Record<string, string> = {
  home: '/images/guides/guide-plate.png',
  profile: '/images/guides/guide-plate.png',
  leads: '/images/guides/lead-plate.png',
  offers: '/images/guides/offer-plate.png',
  recipes: '/images/guides/build-plate.png',
  protocols: '/images/guides/build-plate.png',
};

const input: React.CSSProperties = {
  width: '100%', height: 46, boxSizing: 'border-box', border: `1px solid ${line}`,
  background: '#0D0E0C', color: ink, borderRadius: 2, padding: '0 13px',
  fontFamily: sans, fontSize: 14, outline: 'none',
};
const label: React.CSSProperties = { display: 'block', color: muted, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7 };
const btn: React.CSSProperties = { height: 44, border: `1px solid ${line}`, background: ink, color: black, padding: '0 18px', borderRadius: 4, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, lineHeight: 1.2 };

interface TagArt { src: string; cols: number; rows: number; index: number; cellAspect: number }
const atlas = (src: string, cols: number, rows: number, labels: readonly string[], cellAspect = 1) => Object.fromEntries(labels.map((name, index) => [name, { src, cols, rows, index, cellAspect } as TagArt]));
const specialtyArt: Record<GuideRealm, Record<string, TagArt>> = {
  Body: atlas('/images/guides/tags/body.webp', 4, 3, specialtyGroups.Body),
  Mind: atlas('/images/guides/tags/mind.webp', 3, 3, specialtyGroups.Mind),
  Soul: atlas('/images/guides/tags/soul.webp', 5, 3, specialtyGroups.Soul),
};
const audienceArt = atlas('/images/guides/tags/audience.webp', 4, 2, ['Everyone', 'Busy families', 'Women', 'Men', 'Children', 'Athletes', 'Adults 50+']);
const supportArt = atlas('/images/guides/tags/support-v3.webp', 3, 2, ['ROUTINE³ (physical + digital)', 'Recipes', 'Group call', '1:1 online', 'In person', 'Event']);
const offerArt: Record<string, TagArt> = atlas('/images/guides/tags/offers-v2.webp', 4, 3, ['Starter guide', 'Recipe pack', 'ROUTINE³', '1:1 call', 'Group call', 'Journey', 'Event', 'eBook', 'Recipe book', 'Team program', 'Upload', 'Paid'], .75);
const freeOfferArt: Record<FreeOfferKind, TagArt> = {
  ebook: offerArt.eBook,
  one_to_one_call: offerArt['1:1 call'],
  recipe_book: offerArt['Recipe pack'],
  routine: offerArt['ROUTINE³'],
};

function TagChoice({ text, description, active, art, onClick, compact = false, badge, tone = 'accent' }: { text: string; description?: string; active: boolean; art: TagArt; onClick: () => void; compact?: boolean; badge?: string; tone?: 'accent' | 'free' }) {
  const col = art.index % art.cols;
  const row = Math.floor(art.index / art.cols);
  const activeBg = tone === 'free' ? ink : acid;
  const iconHeight = compact ? 42 : 52;
  const iconWidth = iconHeight * art.cellAspect;
  return <button className="guardian-card" type="button" onClick={onClick} aria-pressed={active} style={{ position: 'relative', minHeight: compact ? 76 : description ? 104 : 92, padding: badge ? '24px 12px 10px' : compact ? '8px 10px' : '10px 12px', border: `1px solid ${active ? activeBg : line}`, color: active ? black : ink, background: active ? activeBg : 'transparent', fontFamily: sans, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', minWidth: 0, overflow: 'hidden' }}>
    {badge && <span style={{ position: 'absolute', top: 6, left: 7, color: active ? black : badge === 'FREE' ? acid : '#C88A66', fontSize: 8, fontWeight: 700, letterSpacing: '.14em' }}>{badge}</span>}
    {active && <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, display: 'grid', placeItems: 'center', border: `1px solid ${black}`, background: black, color: tone === 'free' ? ink : acid }}><Check size={11} strokeWidth={2.5} /></span>}
    <span role="img" aria-label="" style={{ width: iconWidth, height: iconHeight, flex: '0 0 auto', backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${art.cols === 1 ? 0 : col * 100 / (art.cols - 1)}% ${art.rows === 1 ? 0 : row * 100 / (art.rows - 1)}%`, filter: active ? 'brightness(.2)' : 'grayscale(1) contrast(.92) brightness(.92)' }} />
    <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: compact ? 10 : 11, fontWeight: 600, lineHeight: 1.25 }}>{text}</span>{description && <span style={{ display: 'block', color: active ? 'rgba(9,10,8,.62)' : muted, fontSize: 8, fontWeight: 400, lineHeight: 1.35, marginTop: 5 }}>{description}</span>}</span>
  </button>;
}

function FunnelStage({ number, eyebrow, title, copy, last = false, children }: { number: string; eyebrow: string; title: string; copy: string; last?: boolean; children: React.ReactNode }) {
  return <div style={{ position: 'relative', padding: '0 0 34px 44px', borderLeft: last ? '1px solid transparent' : `1px solid ${line}` }}>
    <span aria-hidden="true" style={{ position: 'absolute', left: -16, top: -2, width: 30, height: 30, borderRadius: '50%', border: `1px solid ${acid}`, background: black, color: acid, display: 'grid', placeItems: 'center', fontFamily: sans, fontSize: 9, fontWeight: 700 }}>{number}</span>
    <div style={{ ...label, color: acid }}>{eyebrow}</div>
    <h2 style={{ fontFamily: serif, fontSize: 32, fontWeight: 300, lineHeight: 1.05, margin: '9px 0 8px' }}>{title}</h2>
    <p style={{ color: muted, fontSize: 11, lineHeight: 1.6, margin: '0 0 17px', maxWidth: 600 }}>{copy}</p>
    {children}
  </div>;
}

function DeliveryPicker({ value, recommended, onChange }: { value: DeliveryFormat[]; recommended: DeliveryFormat; onChange: (value: DeliveryFormat[]) => void }) {
  const toggle = (option: DeliveryFormat) => onChange(value.includes(option) ? (value.length === 1 ? value : value.filter((item) => item !== option)) : [...value, option]);
  return <div style={{ marginTop: 12 }}>
    <label style={label}>Value unlocked at this level <span style={{ color: acid }}>· choose all that apply · suggested: {recommended}</span></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 7 }}>
      {deliveryFormats.map((option) => { const active = value.includes(option.value); const best = recommended === option.value; return <button className="guardian-card" type="button" key={option.value} onClick={() => toggle(option.value)} aria-pressed={active} style={{ minHeight: 76, border: `1px solid ${active ? acid : line}`, background: active ? acid : 'transparent', color: active ? black : ink, padding: '8px 10px', textAlign: 'left', cursor: 'pointer', fontFamily: sans, position: 'relative', display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 9, alignItems: 'center', overflow: 'hidden' }}>
        <img src={option.image} alt="" loading="lazy" style={{ width: 44, height: 44, objectFit: 'contain', filter: active ? 'grayscale(1) brightness(.2)' : 'grayscale(1) contrast(.95) brightness(.88)', flexShrink: 0 }} />
        <span style={{ minWidth: 0 }}>{best && <span style={{ display: 'block', color: active ? black : acid, fontSize: 7, fontWeight: 700, letterSpacing: '.12em', marginBottom: 5 }}>BEST FIT</span>}
        <strong style={{ display: 'block', fontSize: 10, lineHeight: 1.2 }}>{option.value}</strong>
        <span style={{ display: 'block', color: active ? 'rgba(9,10,8,.65)' : muted, fontSize: 8, lineHeight: 1.3, marginTop: 4 }}>{option.note}</span></span>
      </button>; })}
    </div>
  </div>;
}

function FreeOfferCard({ eyebrow, title, copy, art, active, recommended = false, onClick }: { eyebrow: string; title: string; copy: string; art: TagArt; active: boolean; recommended?: boolean; onClick: () => void }) {
  const col = art.index % art.cols;
  const row = Math.floor(art.index / art.cols);
  return <button className="guardian-card" type="button" onClick={onClick} aria-pressed={active} style={{ minHeight: 150, border: 0, borderRight: `1px solid ${active ? black : line}`, borderBottom: `1px solid ${active ? black : line}`, background: active ? ink : recommended ? 'rgba(199,216,163,.08)' : 'transparent', color: active ? black : ink, padding: 12, textAlign: 'left', cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
    <span style={{ color: active ? black : recommended ? acid : muted, fontSize: 7, fontWeight: 700, letterSpacing: '.13em', minHeight: 17 }}>{eyebrow}</span>
    <strong style={{ color: active ? black : ink, fontSize: 10, lineHeight: 1.35, margin: '6px 0 12px', minHeight: 40 }}>{copy}</strong>
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, marginTop: 'auto', paddingTop: 9, borderTop: `1px solid ${active ? 'rgba(9,10,8,.18)' : line}` }}>
      <span aria-hidden="true" style={{ width: 42 * art.cellAspect, height: 42, flex: '0 0 auto', backgroundImage: `url(${art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${art.cols * 100}% ${art.rows * 100}%`, backgroundPosition: `${art.cols === 1 ? 0 : col * 100 / (art.cols - 1)}% ${art.rows === 1 ? 0 : row * 100 / (art.rows - 1)}%`, filter: active ? 'brightness(.2)' : 'grayscale(1) contrast(.92) brightness(.92)' }} />
      <span><span style={{ display: 'block', color: active ? 'rgba(9,10,8,.62)' : muted, fontSize: 7, fontWeight: 700, letterSpacing: '.12em', marginBottom: 4 }}>FORMAT</span><strong style={{ display: 'block', fontSize: 10, lineHeight: 1.25 }}>{title}</strong></span>
    </span>
  </button>;
}

function Brand({ centered = false }: { centered?: boolean }) {
  return <a href="/" aria-label="ROUTINE³ Guardians" style={{ height: 31, width: 'fit-content', margin: centered ? '0 auto' : undefined, color: ink, border: `1px solid rgba(245,242,234,0.58)`, textDecoration: 'none', display: 'flex', alignItems: 'stretch', fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', lineHeight: 1 }}>
    <span style={{ padding: '0 14px', display: 'inline-flex', alignItems: 'center' }}>ROUTINE³</span>
    <span style={{ padding: '0 12px', borderLeft: `1px solid rgba(245,242,234,0.58)`, display: 'inline-flex', alignItems: 'center' }}>GUARDIANS</span>
  </a>;
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

function AuthPanel() {
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
      setBusy(false);
      return;
    }

    // Existing HealthScan users are already valid guide users. Sign them into
    // the same account first; GuidePortal will then open guide onboarding when
    // no guide profile exists yet.
    const login = await signIn(email, password);
    if (!login.error) { setBusy(false); return; }

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
    <form id="guide-signin" onSubmit={submit} style={{ border: `1px solid ${line}`, background: panel, padding: 'clamp(24px,4vw,48px)', maxWidth: 460 }}>
      <div style={{ ...label, color: acid }}>Step 1 · Sign in</div>
      <h2 style={{ margin: '12px 0 10px', fontFamily: serif, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.045em' }}>Build with ROUTINE³.</h2>
      <p style={{ color: muted, fontFamily: sans, fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>Create your profile, collect leads, and publish paid resources, recipes and protocols from one workspace.</p>
      {mode === 'signup' && <div style={{ marginBottom: 12 }}><label style={label}>Your name</label><input value={name} onChange={(e) => setName(e.target.value)} required style={input} /></div>}
      <div style={{ marginBottom: 12 }}><label style={label}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={input} /></div>
      <div style={{ marginBottom: 16 }}><label style={label}>Password</label><input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required style={input} /></div>
      {error && <div style={{ color: '#F0A7A7', fontSize: 12, fontFamily: sans, marginBottom: 14 }}>{error}</div>}
      <button disabled={busy} style={{ ...btn, width: '100%', opacity: busy ? 0.55 : 1 }}>{busy ? 'Please wait' : mode === 'login' ? 'Sign in' : 'Create Guardian account'} <ArrowRight size={14} /></button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ border: 0, background: 'none', color: muted, width: '100%', marginTop: 15, cursor: 'pointer', fontFamily: sans, fontSize: 12 }}>
        {mode === 'login' ? 'New Guardian? Create an account' : 'Already have an account? Sign in'}
      </button>
    </form>
  );
}

function PublicGuidePage() {
  return (
    <div style={{ minHeight: '100vh', background: black, color: ink, fontFamily: sans }}>
      <header style={{ height: 58, borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,5vw,72px)' }}>
        <Brand /><a href="#guide-signin" style={{ color: ink, textDecoration: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em' }}>BECOME A GUARDIAN →</a>
      </header>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(70px,10vw,140px) clamp(20px,5vw,72px)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: muted, marginBottom: 70 }}>LEARN / BUILD / GUARD</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 'clamp(48px,8vw,120px)', alignItems: 'end' }}>
          <div>
            <div style={{ width: 82, height: 82, border: `1px solid ${line}`, display: 'grid', placeItems: 'center', marginBottom: 42 }}><BookOpen size={37} strokeWidth={1} /></div>
            <h1 style={{ margin: 0, fontFamily: serif, fontWeight: 300, fontSize: 'clamp(58px,9vw,124px)', lineHeight: .86, letterSpacing: '-0.065em' }}>The Guardians</h1>
            <p style={{ maxWidth: 660, margin: '30px 0 12px', fontSize: 'clamp(17px,2vw,22px)', lineHeight: 1.55, fontWeight: 600 }}>Experts who turn experience into routines people can actually follow.</p>
            <p style={{ maxWidth: 660, color: muted, fontSize: 15, lineHeight: 1.7 }}>Build a public profile, capture leads, sell an eBook or program, and create recipes and protocols connected to recommended products and affiliate links.</p>
          </div>
          <AuthPanel />
        </div>
        <div style={{ marginTop: 100, borderTop: `1px solid ${line}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          {[
            ['01', 'Guardian', 'Your expertise, audience and public Guardian page.', '/images/guides/guide-plate.png'],
            ['02', 'Lead', 'A simple funnel for enquiries and clients.', '/images/guides/lead-plate.png'],
            ['03', 'Offer', 'eBooks, paid programs and affiliate products.', '/images/guides/offer-plate.png'],
            ['04', 'Build', 'Recipes and protocols for age, gender and goal.', '/images/guides/build-plate.png'],
          ].map(([n, title, copy, image]) => (
            <div key={n} style={{ padding: '25px 20px 30px', borderRight: `1px solid ${line}`, minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ color: acid, fontSize: 10, letterSpacing: '.14em' }}>{n}</div>
              <img src={image} alt="" loading="lazy" decoding="async" style={{ width: 112, height: 112, objectFit: 'contain', objectPosition: 'center', margin: '15px 0 10px', filter: 'grayscale(1) contrast(0.9) brightness(0.86)', opacity: 0.92 }} />
              <div style={{ fontFamily: serif, fontSize: 27, fontWeight: 300, margin: '0 0 9px' }}>{title}</div>
              <div style={{ color: muted, fontSize: 12, lineHeight: 1.55, maxWidth: 210 }}>{copy}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function GuardianWebsite({ slug, isSignedIn }: { slug: string; isSignedIn: boolean }) {
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [offers, setOffers] = useState<GuideOffer[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getGuideProfileBySlug(slug).then(async (found) => {
      setProfile(found);
      setOffers(found ? await listGuideOffers(found.user_id) : []);
    }).catch(() => { setProfile(null); setOffers([]); }).finally(() => setLoading(false));
  }, [slug]);
  if (loading) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', fontFamily: sans }}>Building Guardian page…</div>;
  if (!profile) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', padding: 24, fontFamily: sans, textAlign: 'center' }}><div><Brand /><h1 style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, margin: '48px 0 12px' }}>This page is not published yet.</h1><a href="/guides" style={{ color: acid }}>Return to Guardians</a></div></div>;
  const freeOffers = offers.filter((offer) => offer.access_model === 'free');
  const paidOffers = offers.filter((offer) => offer.access_model === 'paid');
  const firstVisibleOffer = freeOffers[0] || paidOffers[0];
  const socials = profile.social_links || {};
  const publicHeadingFont = themeFont(socials.theme_heading || 'Fraunces');
  const publicBodyFont = themeFont(socials.theme_body || 'Inter');
  const publicPageColor = socials.theme_page_color || '#F2EFE7';
  const publicAccent = socials.theme_accent_color || '#667245';
  const publicBrand = socials.brand_name || 'ROUTINE³ · GUARDIAN';
  const publicLanguage = languageOptions.find((language) => language.name === socials.language)?.code || 'en';
  const publicBackgroundIsVideo = socials.theme_background_type === 'video' || /\.(mp4|webm)(?:\?|$)/i.test(socials.theme_background || '');
  const publicGreyscale = socials.theme_image_treatment === 'greyscale';
  const publicHeaderStyle = (socials.theme_header_style || 'white') as HeaderStyle;
  const publicHeaderBackground = publicHeaderStyle === 'black' ? '#11120F' : publicHeaderStyle === 'tone' ? publicAccent : '#FFFFFF';
  const publicHeaderText = publicHeaderStyle === 'tone' ? readableText(publicAccent) : publicHeaderStyle === 'black' ? '#FFFFFF' : '#11120F';
  const publicExpertiseTags = parseExpertiseTags(socials.expertise_tags);
  return <div lang={publicLanguage} dir={publicLanguage === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: publicPageColor, color: '#11120F', fontFamily: publicBodyFont }}>
    <header style={{ minHeight: 64, background: publicHeaderBackground, color: publicHeaderText, borderBottom: `1px solid ${publicHeaderText === '#FFFFFF' ? 'rgba(255,255,255,.24)' : 'rgba(17,18,15,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '0 clamp(20px,6vw,84px)', flexWrap: 'wrap' }}>
      <a href="/" style={{ color: publicHeaderText, textDecoration: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '.13em', display: 'flex', alignItems: 'center', gap: 9 }}>{socials.logo_url && <img src={socials.logo_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}{publicBrand}</a>
      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
        {socials.instagram && <a href={socials.instagram} aria-label="Instagram" title="Instagram" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Instagram size={15} /></a>}
        {socials.tiktok && <a href={socials.tiktok} aria-label="TikTok" title="TikTok" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><AtSign size={15} /></a>}
        {socials.youtube && <a href={socials.youtube} aria-label="YouTube" title="YouTube" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Youtube size={16} /></a>}
        {socials.linktree && <a href={socials.linktree} aria-label="Linktree" title="Linktree" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Link2 size={15} /></a>}
        {socials.website && <a href={socials.website} aria-label="Website" title="Website" style={{ color: publicHeaderText, display: 'grid', placeItems: 'center' }}><Globe2 size={15} /></a>}
        {isSignedIn && <a href="/guides" style={{ color: publicHeaderText, fontSize: 10, fontWeight: 700 }}>Guardian workspace →</a>}
      </div>
    </header>
    <main>
      <section style={{ minHeight: 'min(760px,calc(100vh - 64px))', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(52px,9vw,130px) clamp(24px,8vw,110px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundImage: socials.theme_background && !publicBackgroundIsVideo ? `linear-gradient(rgba(242,239,231,.66),rgba(242,239,231,.66)),url(${socials.theme_background})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: publicGreyscale ? 'luminosity' : 'normal' }}>
          {publicBackgroundIsVideo && <><video src={socials.theme_background} autoPlay muted loop playsInline aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: publicGreyscale ? 'grayscale(1)' : 'none' }} /><span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(242,239,231,.66)' }} /></>}
          <span style={{ position: 'relative', zIndex: 2, color: publicAccent, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>{profile.specialties.slice(0, 3).join(' · ') || 'Personal guidance'}</span>
          <h1 style={{ position: 'relative', zIndex: 2, fontFamily: publicHeadingFont, fontWeight: 300, fontSize: 'clamp(58px,9vw,118px)', lineHeight: .86, letterSpacing: '-.035em', margin: '24px 0' }}>{profile.headline || profile.display_name}</h1>
          <ExpertiseTags tags={publicExpertiseTags} color={publicAccent} />
          <p style={{ position: 'relative', zIndex: 2, color: '#66645F', fontSize: 15, lineHeight: 1.75, maxWidth: 560 }}>{profile.bio}</p>
          {freeOffers[0] && <a href={freeOffers[0].booking_url || '#offers'} style={{ position: 'relative', zIndex: 2, marginTop: 24, width: 'fit-content', minHeight: 40, borderRadius: 4, background: publicAccent, color: readableText(publicAccent), padding: '0 16px', textDecoration: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 22px rgba(17,18,15,.14)' }}>Get guide <ArrowRight size={14} /></a>}
        </div>
        <div style={{ minHeight: 520, background: '#11120F', display: 'grid', placeItems: 'center', padding: 40 }}>
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width: 'min(74%,520px)', maxHeight: 620, objectFit: 'contain', filter: publicGreyscale ? 'grayscale(1) contrast(1.05)' : 'none' }} /> : <img src="/images/guides/guide-plate.png" alt="" style={{ width: 'min(74%,420px)', objectFit: 'contain', filter: publicGreyscale ? 'grayscale(1)' : 'none' }} />}
        </div>
      </section>
      <section id="offers" style={{ padding: 'clamp(60px,9vw,120px) clamp(24px,8vw,110px)', borderTop: '1px solid rgba(17,18,15,.2)' }}>
        <span style={{ color: '#667245', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>Work with {profile.display_name}</span>
        <h2 style={{ fontFamily: publicHeadingFont, fontWeight: 300, fontSize: 'clamp(44px,7vw,82px)', lineHeight: .95, margin: '18px 0 36px' }}>Begin here.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          {firstVisibleOffer && [firstVisibleOffer].map((offer, index) => <a key={offer.id} href={offer.booking_url || offer.affiliate_url || '#'} style={{ color: '#11120F', textDecoration: 'none', minHeight: 220, border: '1px solid rgba(17,18,15,.2)', borderRadius: 6, background: 'rgba(255,255,255,.48)', padding: 26, display: 'flex', flexDirection: 'column', boxShadow: '0 14px 36px rgba(17,18,15,.07)' }}>
            <span style={{ color: publicAccent, fontSize: 9, fontWeight: 700, letterSpacing: '.14em' }}>{String(index + 1).padStart(2, '0')} · {offer.access_model === 'free' ? 'FREE' : offer.price_cents ? formatMoney(offer.price_cents / 100, offer.currency || 'GBP') : 'ENQUIRE'}</span>
            <strong style={{ fontFamily: publicHeadingFont, fontSize: 34, lineHeight: 1.05, fontWeight: 300, margin: '28px 0 10px' }}>{offer.title}</strong>
            <span style={{ color: '#66645F', fontSize: 12, lineHeight: 1.55 }}>{offer.description || 'Discover the next step in your journey.'}</span>
            <span style={{ width: 'fit-content', marginTop: 'auto', paddingTop: 24, color: '#11120F', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 8 }}>Open offer <ArrowRight size={13} /></span>
          </a>)}
        </div>
      </section>
    </main>
  </div>;
}

function Onboarding({ userId, accessToken, name, email, onDone }: { userId: string; accessToken: string; name: string; email: string; onDone: (p: GuideProfile) => void }) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(name);
  const [mainLanguage, setMainLanguage] = useState('English');
  const [contactEmail, setContactEmail] = useState(email);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linktreeUrl, setLinktreeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [bookingProvider, setBookingProvider] = useState<BookingProvider>('ROUTINE³ Booking');
  const [bookingUrl, setBookingUrl] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [realm, setRealm] = useState<GuideRealm>('Body');
  const [audience, setAudience] = useState<string[]>(['Everyone']);
  const [format, setFormat] = useState<string[]>(['Protocol (Physical + Interactive)']);
  const [intro, setIntro] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(defaultAvatars[0].image);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [storyTemplate, setStoryTemplate] = useState<StoryTemplateId>('editorial');
  const [headingTypeface, setHeadingTypeface] = useState('Archivo');
  const [bodyTypeface, setBodyTypeface] = useState('Inter');
  const [pageColor, setPageColor] = useState('#F2EFE7');
  const [accentColor, setAccentColor] = useState('#667245');
  const [imageTreatment, setImageTreatment] = useState<'color' | 'greyscale'>('color');
  const [selectedHeadline, setSelectedHeadline] = useState('');
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [expertiseTagDraft, setExpertiseTagDraft] = useState('');
  const [funnelPreviewStage, setFunnelPreviewStage] = useState(0);
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>('white');
  const [pricingRegion, setPricingRegion] = useState(defaultPricingRegion().region);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultPricingRegion().currency);
  const [importedProfile, setImportedProfile] = useState<ImportedGuideProfile | null>(null);
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingOffer, setUploadingOffer] = useState(false);
  const [freeOfferType, setFreeOfferType] = useState<FreeOfferKind>('ebook');
  const [freeDelivery, setFreeDelivery] = useState<DeliveryFormat[]>(['Downloadable PDF']);
  const [leadMagnetTitle, setLeadMagnetTitle] = useState('');
  const [freeAudienceValue, setFreeAudienceValue] = useState(freeValueSuggestions.ebook);
  const [leadMagnetPath, setLeadMagnetPath] = useState<string | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<UpsellKind[]>([]);
  const [upsellDrafts, setUpsellDrafts] = useState<Record<UpsellKind, { title: string; price: string; url: string; delivery: DeliveryFormat[]; audienceValue: string; nextStep: OfferNextStep }>>({
    ebook: { title: 'Complete eBook', price: '29', url: '', delivery: ['Downloadable PDF'], audienceValue: 'Understand the complete method and put it into practice.', nextStep: 'link' },
    routine: { title: 'Protocol · PDF + Interactive', price: '19', url: '', delivery: ['PDF + Interactive Protocol'], audienceValue: 'Receive a personalised protocol they can follow every day.', nextStep: 'builder' },
    routine_guidance: { title: 'Protocol + live guidance', price: '99', url: '', delivery: ['Interactive Protocol'], audienceValue: 'Stay accountable while your Guardian reviews your progress and suggests the right next action.', nextStep: 'builder' },
    recipe_book: { title: 'Recipe collection', price: '24', url: '', delivery: ['Downloadable PDF'], audienceValue: 'Make a complete collection of practical recipes with confidence.', nextStep: 'builder' },
    group_call: { title: 'Live group session', price: '59', url: '', delivery: ['Live online'], audienceValue: 'Get live guidance, shared learning and answers to their questions.', nextStep: 'booking' },
    one_to_one_call: { title: 'Private 1:1 session', price: '149', url: '', delivery: ['Live online'], audienceValue: 'Receive focused personal guidance and a clear action plan.', nextStep: 'booking' },
    in_person: { title: 'In-person session', price: '349', url: '', delivery: ['In person'], audienceValue: 'Experience tailored hands-on support and individual attention.', nextStep: 'booking' },
    festival: { title: 'Annual live event', price: '1500', url: '', delivery: ['Event'], audienceValue: 'Experience an immersive transformation with direct guidance and a like-minded community.', nextStep: 'booking' },
  });
  const [routineGender, setRoutineGender] = useState('Everyone');
  const [routineAge, setRoutineAge] = useState('Adults 25–44');
  const [routineLifeStage, setRoutineLifeStage] = useState('Not specified');
  const activeStoryTemplate = storyTemplates.find((template) => template.id === storyTemplate) || storyTemplates[0];
  const effectiveBackground = backgroundUrl || activeStoryTemplate.image;
  const previewHeaderBackground = headerStyle === 'black' ? '#11120F' : headerStyle === 'tone' ? accentColor : '#FFFFFF';
  const previewHeaderText = headerStyle === 'tone' ? readableText(accentColor) : headerStyle === 'black' ? '#FFFFFF' : '#11120F';

  function addExpertiseTags(raw: string) {
    const additions = raw.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (!additions.length) return;
    setExpertiseTags((current) => Array.from(new Set([...current, ...additions])).slice(0, 10));
    setExpertiseTagDraft('');
  }

  function applyStoryTemplate(id: StoryTemplateId) {
    const template = storyTemplates.find((item) => item.id === id);
    if (!template) return;
    setStoryTemplate(id);
    setBackgroundUrl(null);
    setBackgroundType('image');
    setHeadingTypeface(template.heading);
    setBodyTypeface(template.body);
    setPageColor(template.page);
    setAccentColor(template.accent);
    setHeaderStyle(template.header);
    setImageTreatment(template.treatment);
  }
  const [guidanceReviewCadence, setGuidanceReviewCadence] = useState('Real-time');
  const [eventsPerYear, setEventsPerYear] = useState('1');
  const [importMessage, setImportMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const audiences = ['Everyone', 'Busy families', 'Women', 'Men', 'Children', 'Athletes', 'Adults 50+'];
  const formats: { label: string; value: string; description: string; art: TagArt }[] = [
    { label: 'Protocol (Physical + Interactive)', value: 'PHYSICAL + APP', description: 'A guide to keep with interactive steps in the app', art: supportArt['ROUTINE³ (physical + digital)'] },
    { label: 'Protocol + Guidance', value: 'INTERACTIVE', description: 'Review progress and suggest the next action', art: offerArt['ROUTINE³'] },
    { label: 'Recipes', value: 'DOWNLOAD', description: 'Practical recipes people can use at home', art: supportArt.Recipes },
    { label: 'Group call', value: 'LIVE GROUP', description: 'Teach, discuss and answer together', art: supportArt['Group call'] },
    { label: '1:1 online', value: 'PRIVATE LIVE', description: 'Tailored guidance for one person', art: supportArt['1:1 online'] },
    { label: 'In person', value: 'PHYSICAL', description: 'Hands-on personal support', art: supportArt['In person'] },
    { label: 'Event', value: 'PHYSICAL EVENT', description: 'A shared immersive experience', art: supportArt.Event },
  ];
  const websiteGoalCta: Record<string, string> = { 'Collect leads': 'Get guide', 'Sell an offer': 'View offer', 'Book calls': 'Book call', 'Share recipes': 'See recipes', 'Publish Protocol': 'Start Protocol' };
  const upsellSuggestions: { kind: UpsellKind; label: string; value: string; why: string; art: TagArt }[] = [
    { kind: 'ebook', label: 'Paid eBook', value: 'Entry', why: 'The complete method after the free introductory version.', art: offerArt.eBook },
    { kind: 'recipe_book', label: 'Paid recipes', value: 'Entry', why: 'A complete practical collection after the free sampler.', art: offerArt['Recipe book'] },
    { kind: 'routine', label: 'Paid Protocol', value: 'Personalised', why: 'A personalised protocol delivered as a downloadable PDF and an interactive checklist.', art: offerArt['ROUTINE³'] },
    { kind: 'routine_guidance', label: 'Protocol + live guidance', value: 'Ongoing', why: 'Your Guardian can review protocol completion and check-ins, then suggest timely adjustments and the next action.', art: offerArt['ROUTINE³'] },
    { kind: 'festival', label: 'Annual event', value: 'Premium', why: 'One or two high-value events per year create a rare, immersive experience.', art: offerArt.Event },
    { kind: 'group_call', label: 'Group call', value: 'Shared', why: 'More access to you while the group shares the cost.', art: offerArt['Group call'] },
    { kind: 'one_to_one_call', label: 'Paid 1:1 call', value: 'High', why: 'The paid consultation follows the free discovery call.', art: offerArt['1:1 call'] },
    { kind: 'in_person', label: 'In person', value: 'Highest', why: 'Your time, presence and tailored attention make this most valuable.', art: supportArt['In person'] },
  ];
  const freeOfferTypes: { value: FreeOfferKind; label: string; eyebrow: string; copy: string }[] = [
    { value: 'ebook', label: 'eBook', eyebrow: 'GUIDE', copy: 'A short useful guide that introduces your method.' },
    { value: 'one_to_one_call', label: 'Call', eyebrow: 'DISCOVERY', copy: 'A discovery call that qualifies the right clients.' },
    { value: 'recipe_book', label: 'Recipes', eyebrow: 'COLLECTION', copy: 'A small recipe sampler people can use today.' },
    { value: 'routine', label: 'Protocol', eyebrow: 'PDF + APP', copy: 'A starter protocol delivered as a downloadable PDF and an interactive checklist.' },
  ];
  const websiteGoal = freeOfferType === 'one_to_one_call' ? 'Book calls' : freeOfferType === 'recipe_book' ? 'Share recipes' : freeOfferType === 'routine' ? 'Publish Protocol' : 'Collect leads';
  const headlineSuggestions = useMemo(() => guardianHeadlineSuggestions(chosen, audience), [chosen, audience]);
  const generatedHeadline = selectedHeadline || headlineSuggestions[0];
  useEffect(() => { setSelectedHeadline(''); }, [chosen.join('|'), audience.join('|')]);
  const suggestedFreeOffer = useMemo(() => {
    const subject = chosen[0] || 'wellness';
    if (format.includes('Recipes') || chosen.includes('Nutrition')) return { kind: 'recipe_book' as const, title: `3 free ${subject} recipes` };
    if (format.includes('1:1 online') || format.includes('In person')) return { kind: 'one_to_one_call' as const, title: `A free ${subject} discovery call` };
    if (format.includes('Protocol (Physical + Interactive)') || chosen.includes('Breathwork')) return { kind: 'routine' as const, title: `A free 3-day ${subject} Protocol` };
    return { kind: 'ebook' as const, title: `A free introduction to ${subject}` };
  }, [chosen, format]);
  const suggestedUpsellKind: UpsellKind = format.includes('Protocol + Guidance')
    ? 'routine_guidance'
    : format.includes('Recipes') || chosen.includes('Nutrition')
      ? 'recipe_book'
      : format.includes('1:1 online') || format.includes('In person')
        ? 'one_to_one_call'
        : 'routine';
  const pickStyle = (active: boolean): React.CSSProperties => ({ height: 38, padding: '0 13px', border: `1px solid ${active ? acid : line}`, color: active ? black : ink, background: active ? acid : 'transparent', fontFamily: sans, fontSize: 11, fontWeight: 500, cursor: 'pointer' });
  async function importPublicProfile(urls: string[]) {
    if (!urls.length) return;
    setImporting(true); setImportMessage('');
    try {
      const imported = await importGuideProfile(urls, accessToken);
      setImportedProfile(imported);
      if (imported.name) setDisplayName(imported.name);
      if (imported.bio) setIntro(imported.bio);
      if (imported.avatarUrl) setAvatarUrl(imported.avatarUrl);
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
      setImportMessage('Portrait uploaded. The original is preserved for the future stone portrait.');
    } catch (e: any) {
      setImportMessage(e.message || 'Could not upload that portrait.');
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

  async function uploadLogo(file?: File) {
    if (!file) return;
    setUploadingLogo(true); setImportMessage('');
    try { setLogoUrl(await uploadGuideImage(userId, file)); }
    catch (e: any) { setImportMessage(e.message || 'Could not upload that logo.'); }
    finally { setUploadingLogo(false); }
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
    if (step === 1 && whatsappPhone.replace(/\D/g, '').length < 8) { setError('Add a WhatsApp number with country code.'); return; }
    if (step === 2 && !chosen.length) { setError('Choose at least one area you can help with.'); return; }
    if (step === 3 && !audience.length) { setError('Choose at least one audience.'); return; }
    if (step === 3 && !format.length) { setError('Choose at least one way you support people.'); return; }
    if (step === 1) {
      const profileUrls = Array.from(new Set([instagramUrl, tiktokUrl, youtubeUrl, linktreeUrl, websiteUrl].map((value) => value.trim()).filter(Boolean)));
      if (profileUrls.length) await importPublicProfile(profileUrls);
    }
    setStep((current) => Math.min(5, current + 1));
  }

  function toggleAudience(value: string) {
    setAudience((current) => {
      if (value === 'Everyone') return current.includes('Everyone') ? [] : ['Everyone'];
      const withoutEveryone = current.filter((item) => item !== 'Everyone');
      return withoutEveryone.includes(value) ? withoutEveryone.filter((item) => item !== value) : [...withoutEveryone, value];
    });
  }

  function toggleUpsell(kind: UpsellKind) {
    setSelectedUpsells((current) => current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]);
  }

  function moveUpsell(kind: UpsellKind, direction: -1 | 1) {
    setSelectedUpsells((current) => {
      const from = current.indexOf(kind);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  function toggleFormat(value: string) {
    setFormat((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function updateUpsell(kind: UpsellKind, patch: Partial<{ title: string; price: string; url: string; delivery: DeliveryFormat[]; audienceValue: string; nextStep: OfferNextStep }>) {
    setUpsellDrafts((current) => ({ ...current, [kind]: { ...current[kind], ...patch } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (!displayName.trim()) throw new Error('Add the name people should call you.');
      if (!/^\S+@\S+\.\S+$/.test(contactEmail.trim())) throw new Error('Add a valid contact email.');
      if (whatsappPhone.replace(/\D/g, '').length < 8) throw new Error('Add a WhatsApp number with country code.');
      if (!chosen.length) throw new Error('Choose at least one area you can help with.');
      const slug = displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || userId.slice(0, 8);
      const audienceText = audience.join(', ').toLowerCase();
      const headline = generatedHeadline;
      const bio = intro.trim() || `I help ${audienceText} with ${chosen.join(', ').toLowerCase()} through ${format.join(', ').toLowerCase()}.`;
      const profile = await saveGuideProfile({ user_id: userId, slug, display_name: displayName, headline, bio, avatar_url: avatarUrl, contact_email: contactEmail.trim(), whatsapp_phone: whatsappPhone.trim(), social_links: { instagram: instagramUrl.trim(), tiktok: tiktokUrl.trim(), youtube: youtubeUrl.trim(), linktree: linktreeUrl.trim(), website: websiteUrl.trim(), language: mainLanguage, pricing_region: pricingRegion, currency, site_goal: websiteGoal, booking_provider: bookingProvider, booking_url: bookingUrl.trim(), brand_name: brandName.trim(), logo_url: logoUrl || '', expertise_tags: expertiseTags.join(','), theme_template: storyTemplate, theme_background: effectiveBackground, theme_background_type: backgroundType, theme_image_treatment: imageTreatment, theme_header_style: headerStyle, theme_heading: headingTypeface, theme_body: bodyTypeface, theme_page_color: pageColor, theme_accent_color: accentColor }, specialties: chosen, status: 'submitted', onboarding_step: 5 });
      const drafts: Promise<GuideOffer>[] = [];
      if (leadMagnetTitle.trim()) drafts.push(createGuideOffer(userId, { kind: freeOfferType, title: leadMagnetTitle.trim(), description: `${freeAudienceValue.trim()} Delivery: ${freeDelivery.join(', ')}.`.trim(), price_cents: 0, currency, affiliate_url: null, access_model: 'free', file_path: leadMagnetPath, booking_url: null }));
      selectedUpsells.forEach((kind) => {
        const suggestion = upsellSuggestions.find((item) => item.kind === kind);
        const draft = upsellDrafts[kind];
        if (!draft.title.trim()) return;
        const targeting = kind === 'routine' || kind === 'routine_guidance'
          ? ` Target: ${routineGender}, ${routineAge}; life stage: ${routineLifeStage}; goal: ${chosen[0] || 'general wellbeing'}.${kind === 'routine_guidance' ? ` Guardian review: ${guidanceReviewCadence.toLowerCase()}. Shared activity: routine completion and check-ins.` : ''}`
          : kind === 'festival' ? ` Frequency: ${eventsPerYear} event${eventsPerYear === '1' ? '' : 's'} per year.` : '';
        const destination = draft.url.trim() || (draft.nextStep === 'booking' ? bookingUrl.trim() : '');
        drafts.push(createGuideOffer(userId, { kind, title: draft.title.trim(), description: `${draft.audienceValue.trim() || suggestion?.why || ''} Delivery: ${draft.delivery.join(', ')}. Next action: ${nextStepLabels[draft.nextStep].title}.${targeting}`.trim() || null, price_cents: Math.max(0, Math.round(Number(draft.price || 0) * 100)), currency, affiliate_url: null, access_model: 'paid', file_path: null, booking_url: destination || null }));
      });
      if (drafts.length) await Promise.all(drafts);
      const wantsRecipes = freeOfferType === 'recipe_book' || selectedUpsells.some((kind) => kind === 'recipe_book' && upsellDrafts[kind].nextStep === 'builder');
      const wantsRoutine = freeOfferType === 'routine' || selectedUpsells.some((kind) => (kind === 'routine' || kind === 'routine_guidance') && upsellDrafts[kind].nextStep === 'builder');
      const recipeBuilderKind = selectedUpsells.find((kind) => kind === 'recipe_book' && upsellDrafts[kind].nextStep === 'builder');
      const protocolBuilderKind = selectedUpsells.find((kind) => (kind === 'routine' || kind === 'routine_guidance') && upsellDrafts[kind].nextStep === 'builder');
      if (wantsRecipes) await createGuideRecipe(userId, { title: recipeBuilderKind ? upsellDrafts[recipeBuilderKind].title : leadMagnetTitle.trim() || suggestedFreeOffer.title, description: recipeBuilderKind ? upsellDrafts[recipeBuilderKind].audienceValue : freeAudienceValue.trim() || 'Recipe collection draft', meal_slot: 'any' });
      if (wantsRoutine) await createProtocol(accessToken, { user_id: userId, name: protocolBuilderKind ? upsellDrafts[protocolBuilderKind].title : leadMagnetTitle.trim() || suggestedFreeOffer.title, description: `${protocolBuilderKind ? upsellDrafts[protocolBuilderKind].audienceValue : freeAudienceValue.trim()} Profile: ${routineGender}, ${routineAge}, ${routineLifeStage}. Goal: ${chosen[0] || 'General wellbeing'}.`, target_gender: routineGender, total_days: 3 });
      window.history.pushState({}, '', `/guides/${profile.slug}`);
      onDone(profile);
    } catch (e: any) { setError(e.message?.includes('guide_profiles') ? 'Guardian database is not installed yet. Apply the portal migration first.' : e.message); }
    finally { setBusy(false); }
  }
  const steps = [
    { n: 1, label: 'Profile', title: 'Start with what you know.', copy: 'Add your name and any public profile you want us to learn from.', image: '/images/guides/guide-plate.png' },
    { n: 2, label: 'Guidance', title: 'Where can you help?', copy: 'Choose the areas where your experience is most useful.', image: '/images/guides/build-plate.png' },
    { n: 3, label: 'Audience', title: 'Who do you help?', copy: 'Tell us who you work with and how you prefer to support them.', image: '/images/guides/lead-plate.png' },
    { n: 4, label: 'Offers', title: 'Build a path of value.', copy: 'Begin with one useful gift, then shape a natural path into deeper guidance. Your knowledge can become a guide, recipe collection, interactive routine or personal experience.', image: '/images/guides/offer-plate.png' },
    { n: 5, label: 'Funnel', title: 'Walk through their journey.', copy: 'Click through the value path exactly as your visitor will experience it, then publish your Guardian profile.', image: '/images/guides/guide-plate.png' },
  ];
  const activeStep = steps[step - 1];
  const activeStepImage = step === 2 ? realmImages[realm] : activeStep.image;
  const availableUpsells = upsellSuggestions
    .filter((offer) => !selectedUpsells.includes(offer.kind))
    .sort((a, b) => Number(b.kind === suggestedUpsellKind) - Number(a.kind === suggestedUpsellKind));
  const funnelStages = [
    { title: leadMagnetTitle || suggestedFreeOffer.title, value: freeAudienceValue, meta: `Free · ${freeDelivery.join(' + ')}`, action: websiteGoalCta[websiteGoal] },
    ...selectedUpsells.map((kind) => ({ title: upsellDrafts[kind].title, value: upsellDrafts[kind].audienceValue, meta: `${formatMoney(upsellDrafts[kind].price, currency)} · ${upsellDrafts[kind].delivery.join(' + ')}`, action: nextStepLabels[upsellDrafts[kind].nextStep].title })),
  ];
  const activeFunnelStage = funnelStages[Math.min(funnelPreviewStage, funnelStages.length - 1)];
  return <div style={{ minHeight: '100vh', background: black, color: ink, padding: '30px clamp(20px,6vw,90px)', fontFamily: sans }}>
    <style>{`.guardian-card{transition:transform 180ms ease,border-color 180ms ease,box-shadow 180ms ease,background-color 180ms ease;transform-origin:center}.guardian-card:not([aria-pressed="true"]):hover{transform:translateY(-4px) rotate(-.3deg);border-color:#A56B48!important;background-color:#171811!important;box-shadow:0 12px 24px rgba(0,0,0,.28)}.guardian-card:not([aria-pressed="true"]):nth-child(even):hover{transform:translateY(-4px) rotate(.3deg)}.guardian-card:focus-visible{outline:2px solid #C7D8A3;outline-offset:3px}@media(prefers-reduced-motion:reduce){.guardian-card{transition:none}.guardian-card:hover{transform:none!important}}`}</style>
    <Brand centered />
    <div aria-label="Guardian setup progress" style={{ maxWidth: 1100, margin: '42px auto 0', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` }}>
      {steps.map((item) => <button type="button" key={item.n} onClick={() => setStep(item.n)} aria-current={step === item.n ? 'step' : undefined} style={{ height: 54, border: 0, borderRight: item.n < 5 ? `1px solid ${line}` : 0, background: step === item.n ? ink : 'transparent', color: step === item.n ? black : item.n < step ? acid : muted, fontFamily: sans, cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>{String(item.n).padStart(2, '0')} · {item.label}</button>)}
    </div>
    <form onSubmit={submit} style={{ maxWidth: 1100, margin: '52px auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(34px,7vw,100px)', alignItems: 'flex-start' }}>
        <aside style={{ position: 'sticky', top: 28, flex: '1 1 180px', maxWidth: 250 }}>
          <div style={{ ...label, color: acid }}>Step {step} · {activeStep.label}</div>
          <img src={activeStepImage} alt="" style={{ width: '100%', maxWidth: 220, height: 220, objectFit: 'contain', filter: 'grayscale(1) contrast(.92) brightness(.8)', opacity: .92, margin: '12px 0 18px' }} />
          <p style={{ color: muted, fontSize: 12, lineHeight: 1.65, maxWidth: 220, margin: 0 }}>{activeStep.copy}</p>
        </aside>
        <section style={{ flex: '3 1 500px', minWidth: 0 }}>
          <div style={{ ...label, color: acid }}>Guardian setup · {step} of 5</div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(48px,7vw,84px)', fontWeight: 300, lineHeight: .95, margin: '18px 0 15px' }}>{activeStep.title}</h1>
          <p style={{ color: muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 36px' }}>Your answers are saved while you move between steps.</p>

      {step === 1 && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <div><label style={label}>What should people call you?</label><input style={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
        <div><label style={label}>Main language</label><select style={input} value={mainLanguage} onChange={(event) => setMainLanguage(event.target.value)}>{languageOptions.map((language) => <option key={language.code}>{language.name}</option>)}</select></div>
      </div>
      <p style={{ color: muted, fontSize: 10, lineHeight: 1.5, margin: '9px 0 0' }}>This sets the language for your page, offers, recipes and Protocols.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 18 }}>
        <div><label style={label}>Contact email</label><input type="email" style={input} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <div><label style={label}>WhatsApp number</label><input type="tel" inputMode="tel" style={input} value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="+44 7700 900000" required /></div>
      </div>
      <p style={{ color: muted, fontSize: 10, lineHeight: 1.5, margin: '9px 0 0' }}>Use the international country code. These details can be changed before your Guardian page is published.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 22 }}>
        <SocialUrlField label="Instagram" Icon={Instagram} value={instagramUrl} onChange={setInstagramUrl} placeholder="https://instagram.com/yourname" />
        <SocialUrlField label="TikTok" Icon={AtSign} value={tiktokUrl} onChange={setTiktokUrl} placeholder="https://tiktok.com/@yourname" />
        <SocialUrlField label="YouTube" Icon={Youtube} value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/@yourname" />
        <SocialUrlField label="Linktree" Icon={Link2} value={linktreeUrl} onChange={setLinktreeUrl} placeholder="https://linktr.ee/yourname" />
        <SocialUrlField label="Personal website" Icon={Globe2} value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://yourwebsite.com" />
      </div>
      <div style={{ borderTop: `1px solid ${line}`, paddingTop: 24, marginTop: 24 }}>
        <label style={{ ...label, color: ink }}>Portrait <span style={{ color: muted }}>· optional</span></label>
        <p style={{ color: muted, fontSize: 11, lineHeight: 1.5, margin: '0 0 12px' }}>We automatically learn from every public profile entered above when you continue.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          {avatarUrl && <img src={avatarUrl} alt="Selected profile" referrerPolicy="no-referrer" style={{ width: 46, height: 46, objectFit: 'cover', filter: 'grayscale(1)', border: `1px solid ${line}` }} />}
          <label style={{ ...btn, height: 38, boxSizing: 'border-box', background: 'transparent', color: ink, fontSize: 9 }}>
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}{uploading ? 'Uploading' : avatarUrl ? 'Replace portrait' : 'Upload portrait'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPortrait(event.target.files?.[0])} style={{ display: 'none' }} />
          </label>
          {avatarUrl && <span style={{ color: muted, fontSize: 10, lineHeight: 1.4 }}>Original preserved for a future stone portrait.</span>}
        </div>
        {importMessage && <p style={{ color: importMessage.startsWith('Imported') ? acid : muted, fontSize: 11, lineHeight: 1.5, margin: '10px 0 0' }}>{importMessage}</p>}
        {importedProfile && <div style={{ borderTop: `1px solid ${line}`, marginTop: 15, paddingTop: 15, display: 'grid', gap: 14 }}>
          {importedProfile.topics.length > 0 && <div><span style={label}>Detected guidance</span><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{importedProfile.topics.map((topic) => <span key={topic} style={{ border: `1px solid ${acid}`, color: acid, padding: '6px 9px', fontSize: 10 }}>{topic}</span>)}</div></div>}
          {importedProfile.images.length > 0 && <div><span style={label}>Choose a public profile image</span><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{importedProfile.images.map((image) => { const active = avatarUrl === image.url; return <button type="button" key={image.url} onClick={() => setAvatarUrl(image.url)} aria-label="Use this profile image" style={{ width: 64, height: 64, padding: 0, border: `1px solid ${active ? acid : line}`, background: panel, position: 'relative', cursor: 'pointer' }}><img src={image.url} alt="Profile option" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }} />{active && <span style={{ position: 'absolute', right: 3, bottom: 3, width: 17, height: 17, display: 'grid', placeItems: 'center', background: acid, color: black }}><Check size={11} /></span>}</button>; })}</div></div>}
        </div>}
      </div>
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
        <div><label style={label}>Who do you usually help? <span style={{ color: acid }}>· choose all that apply</span></label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 8 }}>{audiences.map((x) => <TagChoice key={x} text={x} active={audience.includes(x)} art={audienceArt[x]} onClick={() => toggleAudience(x)} />)}</div></div>
        <div style={{ marginTop: 28 }}><label style={label}>How do you prefer to support people? <span style={{ color: acid }}>· choose all that apply</span></label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 8 }}>{formats.map((item) => <TagChoice badge={item.value.toUpperCase()} key={item.label} text={item.label} description={item.description} active={format.includes(item.label)} art={item.art} onClick={() => toggleFormat(item.label)} />)}</div></div>
        <div style={{ marginTop: 28, border: `1px solid ${line}`, padding: 16 }}>
          <label style={{ ...label, color: acid }}>Build their value path · Level {selectedUpsells.length + 2}</label>
          <p style={{ color: muted, fontSize: 10, lineHeight: 1.5, margin: '0 0 12px' }}>After the free first stage, choose what this audience should receive next. Each choice adds another level to their path.</p>
          {selectedUpsells.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>{selectedUpsells.map((kind, index) => { const offer = upsellSuggestions.find((item) => item.kind === kind); return <button type="button" key={kind} onClick={() => toggleUpsell(kind)} title="Remove from path" style={{ ...pickStyle(true), height: 32, fontSize: 9 }}>Level {index + 2} · {offer?.label} ×</button>; })}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 8 }}>
            {availableUpsells.map((offer) => { const recommended = offer.kind === suggestedUpsellKind; return <button className="guardian-card" key={offer.kind} type="button" onClick={() => toggleUpsell(offer.kind)} style={{ border: `1px solid ${recommended ? acid : line}`, background: recommended ? 'rgba(199,216,163,.08)' : 'transparent', color: ink, minHeight: 88, padding: 10, cursor: 'pointer', fontFamily: sans, textAlign: 'left', display: 'grid', gridTemplateColumns: '52px minmax(0,1fr)', gap: 10, alignItems: 'center' }}>
              <span role="img" aria-hidden="true" style={{ width: 44 * offer.art.cellAspect, height: 44, backgroundImage: `url(${offer.art.src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${offer.art.cols * 100}% ${offer.art.rows * 100}%`, backgroundPosition: `${(offer.art.index % offer.art.cols) * 100 / Math.max(1, offer.art.cols - 1)}% ${Math.floor(offer.art.index / offer.art.cols) * 100 / Math.max(1, offer.art.rows - 1)}%`, filter: 'grayscale(1) contrast(.92) brightness(.9)' }} />
              <span>{recommended && <span style={{ display: 'block', color: acid, fontSize: 7, fontWeight: 700, letterSpacing: '.12em', marginBottom: 5 }}>SUGGESTED FOR THIS AUDIENCE</span>}<strong style={{ display: 'block', fontSize: 11 }}>+ {offer.label}</strong><span style={{ display: 'block', color: recommended ? acid : muted, fontSize: 8, fontWeight: 700, letterSpacing: '.08em', marginTop: 5 }}>{offer.value.toUpperCase()} · {formatMoney(upsellDrafts[offer.kind].price, currency)} · {pricingRegion.toUpperCase()}</span><span style={{ display: 'block', color: muted, fontSize: 8, lineHeight: 1.35, marginTop: 5 }}>{offer.why}</span></span>
            </button>; })}
          </div>
        </div>
      </>}

      {step === 4 && <>
        <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginBottom: 34 }}>
          <label style={{ ...label, color: ink }}>Pricing region <span style={{ color: acid }}>· applies to every paid stage</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 7 }}>
            {pricingRegions.map((option) => <button type="button" key={option.region} onClick={() => { setPricingRegion(option.region); setCurrency(option.currency); }} aria-pressed={pricingRegion === option.region} style={{ ...pickStyle(pricingRegion === option.region), minWidth: 0 }}>{option.label}</button>)}
          </div>
        </div>
        <FunnelStage number="01" eyebrow="Free · Build trust" title="Give your audience one useful win." copy="Help them achieve something useful before asking them to buy. A focused free resource demonstrates your value and builds trust. We recommend starting here.">
          <label style={label}>Choose the free format</label>
          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(145px,1fr))', gap: 0, minWidth: 725, borderTop: `1px solid ${line}`, borderLeft: `1px solid ${line}` }}>
              {freeOfferTypes.map((offer) => <FreeOfferCard key={offer.value} eyebrow={offer.eyebrow} title={offer.label} copy={offer.copy} active={freeOfferType === offer.value} art={freeOfferArt[offer.value]} onClick={() => { setFreeOfferType(offer.value); setFreeDelivery([suggestedDelivery(offer.value)]); setFreeAudienceValue(freeValueSuggestions[offer.value]); }} />)}
              <FreeOfferCard eyebrow="RECOMMENDED" title={suggestedFreeOffer.title} copy="Best fit for your audience and guidance." active={false} recommended art={freeOfferArt[suggestedFreeOffer.kind]} onClick={() => { setFreeOfferType(suggestedFreeOffer.kind); setFreeDelivery([suggestedDelivery(suggestedFreeOffer.kind)]); setFreeAudienceValue(freeValueSuggestions[suggestedFreeOffer.kind]); setLeadMagnetTitle(suggestedFreeOffer.title); }} />
            </div>
          </div>
          <label style={label}>Mechanism / offer name <span style={{ color: muted }}>· how you deliver the win</span></label>
          <input style={input} value={leadMagnetTitle} onChange={(e) => setLeadMagnetTitle(e.target.value)} placeholder="Name your free offer" />
          <div style={{ marginTop: 10 }}><label style={label}>Customer value / outcome <span style={{ color: acid }}>· what changes for them?</span></label><textarea style={{ ...input, minHeight: 76, height: 76, paddingTop: 12, resize: 'vertical' }} value={freeAudienceValue} onChange={(e) => setFreeAudienceValue(e.target.value)} placeholder="Describe the useful result your audience receives" /></div>
          <DeliveryPicker value={freeDelivery} recommended={suggestedDelivery(freeOfferType)} onChange={setFreeDelivery} />
          {freeOfferType !== 'one_to_one_call' ? <div style={{ border: `1px dashed ${line}`, padding: 14, marginTop: 10 }}>
            <label style={{ ...label, color: ink }}>Upload source material <span style={{ color: muted }}>· optional</span></label>
            <p style={{ color: muted, fontSize: 10, lineHeight: 1.55, margin: '0 0 10px' }}>Attach a PDF, EPUB or ZIP. The Protocol builder will preserve it with the draft so it can become structured recipes, a recipe book or guided steps.</p>
            <label style={{ ...btn, height: 38, boxSizing: 'border-box', background: 'transparent', color: ink, fontSize: 9 }}>
              {uploadingOffer ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}{uploadingOffer ? 'Uploading' : leadMagnetPath ? 'Source file attached' : 'Upload source file'}
              <input type="file" accept="application/pdf,application/epub+zip,application/zip,.pdf,.epub,.zip" onChange={(event) => uploadLeadMagnet(event.target.files?.[0])} style={{ display: 'none' }} />
            </label>
          </div> : <div style={{ border: `1px dashed ${line}`, padding: 14, marginTop: 10, color: muted, fontSize: 10, lineHeight: 1.5 }}>No file is needed for a free discovery call. Add the booking link under the offer ladder below.</div>}
        </FunnelStage>
        {selectedUpsells.map((kind, index) => {
          const offer = upsellSuggestions.find((item) => item.kind === kind);
          const draft = upsellDrafts[kind];
          const nextSteps: OfferNextStep[] = kind === 'recipe_book' || kind === 'routine' || kind === 'routine_guidance' ? ['builder', 'link', 'video'] : kind === 'one_to_one_call' || kind === 'group_call' || kind === 'in_person' || kind === 'festival' ? ['booking', 'link', 'video'] : ['link', 'video'];
          if (!offer) return null;
          return <FunnelStage key={kind} number={String(index + 2).padStart(2, '0')} eyebrow={`Value · ${offer.value.split(' · ')[0]} · ${formatMoney(draft.price, currency)} · ${pricingRegion}`} title={draft.audienceValue || 'Define the result they receive.'} copy={`Mechanism: ${draft.title || offer.label}. ${offer.why}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(105px,140px)', gap: 9 }}>
              <div><label style={label}>Mechanism / product name <span style={{ color: muted }}>· how you deliver the value</span></label><input style={input} value={draft.title} onChange={(e) => updateUpsell(kind, { title: e.target.value })} /></div>
              <div><label style={label}>Cost · {currency}</label><div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 12, top: 15, color: muted, fontSize: 12 }}>{currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}</span><input type="number" min="0" step="0.01" style={{ ...input, paddingLeft: 28 }} value={draft.price} onChange={(e) => updateUpsell(kind, { price: e.target.value })} /></div></div>
            </div>
            <div style={{ marginTop: 10 }}><label style={label}>Customer value / outcome <span style={{ color: acid }}>· what changes for them?</span></label><textarea style={{ ...input, minHeight: 76, height: 76, paddingTop: 12, resize: 'vertical' }} value={draft.audienceValue} onChange={(e) => updateUpsell(kind, { audienceValue: e.target.value })} placeholder="Describe the result, benefit or transformation" /></div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>What happens next? <span style={{ color: acid }}>· choose the visitor action</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 7 }}>
                {nextSteps.map((nextStep) => { const active = draft.nextStep === nextStep; return <button className="guardian-card" type="button" key={nextStep} onClick={() => updateUpsell(kind, { nextStep })} aria-pressed={active} style={{ ...pickStyle(active), minHeight: 58, justifyContent: 'flex-start', textAlign: 'left' }}><span><strong style={{ display: 'block', fontSize: 9 }}>{nextStepLabels[nextStep].title}</strong><span style={{ display: 'block', marginTop: 4, color: active ? 'rgba(9,10,8,.65)' : muted, fontSize: 8, lineHeight: 1.35 }}>{nextStepLabels[nextStep].note}</span></span></button>; })}
              </div>
            </div>
            {draft.nextStep === 'builder' ? <div style={{ marginTop: 10, padding: 12, border: `1px solid ${acid}`, background: 'rgba(199,216,163,.08)' }}><strong style={{ display: 'block', color: acid, fontSize: 9 }}>{kind === 'recipe_book' ? 'Recipe Builder will be created' : 'Protocol Builder will be created'}</strong><span style={{ display: 'block', color: muted, fontSize: 8, lineHeight: 1.45, marginTop: 4 }}>After setup, the Guardian can add images, audio, ingredients or steps and publish when ready.</span></div> : <div style={{ marginTop: 10 }}><label style={label}>{draft.nextStep === 'booking' ? 'Booking link' : draft.nextStep === 'video' ? 'Video link' : 'Offer or checkout link'} <span style={{ color: muted }}>· optional</span></label><input type="url" style={input} value={draft.url} onChange={(e) => updateUpsell(kind, { url: e.target.value })} placeholder={draft.nextStep === 'booking' ? bookingUrl || 'https://cal.com/yourname' : draft.nextStep === 'video' ? 'https://youtube.com/watch?v=...' : 'https://yourwebsite.com/offer'} /></div>}
            <DeliveryPicker value={draft.delivery} recommended={suggestedDelivery(kind)} onChange={(delivery) => updateUpsell(kind, { delivery })} />
            {(kind === 'routine' || kind === 'routine_guidance') && draft.nextStep === 'builder' && <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginTop: 10 }}>
              <label style={{ ...label, color: ink }}>{kind === 'routine_guidance' ? 'Protocol + guidance setup' : 'Protocol targeting'}</label>
              <p style={{ color: muted, fontSize: 9, lineHeight: 1.45, margin: '0 0 10px' }}>{kind === 'routine_guidance' ? 'With their permission, the Guardian sees routine completion and check-ins, then suggests adjustments and the next action.' : 'Personalise this routine using the Guardian’s selected goal, gender and age range.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 }}>
                <div><label style={label}>Gender</label><select style={input} value={routineGender} onChange={(e) => setRoutineGender(e.target.value)}><option>Everyone</option><option>Women</option><option>Men</option><option>Non-binary</option><option>Custom</option></select></div>
                <div><label style={label}>Age range</label><select style={input} value={routineAge} onChange={(e) => setRoutineAge(e.target.value)}><option>Children 1–5</option><option>Children 6–12</option><option>Teens 13–17</option><option>Adults 18–24</option><option>Adults 25–44</option><option>Adults 45–64</option><option>Adults 65+</option><option>All ages</option></select></div>
                <div><label style={label}>Life stage</label><select style={input} value={routineLifeStage} onChange={(e) => setRoutineLifeStage(e.target.value)}><option>Not specified</option><option>Premenopause</option><option>Perimenopause</option><option>Menopause</option><option>Postmenopause</option><option>Pregnancy</option><option>Postpartum</option></select></div>
                <div><label style={label}>Primary goal</label><input style={input} readOnly value={chosen[0] || 'General wellbeing'} /></div>
                {kind === 'routine_guidance' && <div><label style={label}>Guardian review</label><select style={input} value={guidanceReviewCadence} onChange={(e) => setGuidanceReviewCadence(e.target.value)}><option>Real-time</option><option>Daily review</option><option>Weekly review</option></select></div>}
              </div>
              {kind === 'routine_guidance' && <div style={{ marginTop: 10, borderTop: `1px solid ${line}`, paddingTop: 10, color: acid, fontSize: 9, lineHeight: 1.5 }}>Shared with the Guardian: completed routine items and voluntary check-ins. Private account and health data remain outside this offer.</div>}
            </div>}
            {kind === 'festival' && <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginTop: 10 }}>
              <label style={{ ...label, color: ink }}>Annual event plan</label>
              <p style={{ color: muted, fontSize: 9, lineHeight: 1.45, margin: '0 0 10px' }}>Keep the event rare and valuable. We recommend one flagship event per year, with two as the maximum.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                {['1', '2'].map((count) => <button type="button" key={count} onClick={() => setEventsPerYear(count)} style={{ ...pickStyle(eventsPerYear === count), height: 52 }}>{count} event{count === '1' ? '' : 's'} per year{count === '1' ? ' · recommended' : ''}</button>)}
              </div>
              <p style={{ color: acid, fontSize: 9, lineHeight: 1.45, margin: '10px 0 0' }}>Suggested starting value: {formatMoney(1000, currency)}–{formatMoney(2000, currency)}. Default: {formatMoney(1500, currency)}.</p>
            </div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ color: muted, fontSize: 9 }}>Step {index + 2} of the visitor journey</span>
              <span style={{ display: 'flex', gap: 7 }}>
                <button type="button" disabled={index === 0} onClick={() => moveUpsell(kind, -1)} style={{ ...btn, height: 34, padding: '0 11px', background: 'transparent', color: index === 0 ? muted : ink, borderColor: line, fontSize: 8, opacity: index === 0 ? .45 : 1 }}>Move up</button>
                <button type="button" disabled={index === selectedUpsells.length - 1} onClick={() => moveUpsell(kind, 1)} style={{ ...btn, height: 34, padding: '0 11px', background: 'transparent', color: index === selectedUpsells.length - 1 ? muted : ink, borderColor: line, fontSize: 8, opacity: index === selectedUpsells.length - 1 ? .45 : 1 }}>Move down</button>
                <button type="button" onClick={() => toggleUpsell(kind)} style={{ ...btn, height: 34, padding: '0 13px', background: 'transparent', color: ink, borderColor: line, fontSize: 8 }}>Remove</button>
              </span>
            </div>
          </FunnelStage>;
        })}
        <FunnelStage number={String(selectedUpsells.length + 2).padStart(2, '0')} eyebrow="Preview · Your page" title={`${displayName || 'Your'}${displayName ? '’s' : ''} story.`} copy="Visitors see one clear promise at a time. The next stage appears only after they complete the current action." last>
          <div style={{ border: `1px solid ${line}`, background: panel, padding: 14, marginBottom: 12 }}>
            <label style={{ ...label, color: ink }}>Style your page</label>
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
            <label style={label}>Header and navigation</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 7, marginBottom: 16 }}>
              {([['white', 'White'], ['tone', 'Brand tone'], ['black', 'Black']] as const).map(([value, text]) => { const active = headerStyle === value; const sampleBackground = value === 'black' ? '#11120F' : value === 'tone' ? accentColor : '#FFFFFF'; const sampleText = value === 'tone' ? readableText(accentColor) : value === 'black' ? '#FFFFFF' : '#11120F'; return <button className="guardian-card" type="button" key={value} onClick={() => setHeaderStyle(value)} aria-pressed={active} style={{ minWidth: 0, minHeight: 54, padding: 7, border: `1px solid ${active ? acid : line}`, background: 'transparent', color: ink, cursor: 'pointer', fontFamily: sans, textAlign: 'left' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 22, padding: '0 6px', background: sampleBackground, color: sampleText, border: '1px solid rgba(127,127,127,.25)', fontSize: 6, fontWeight: 700, letterSpacing: '.1em' }}><span>LOGO</span><span>MENU</span></span>
                <strong style={{ display: 'block', marginTop: 6, fontSize: 8 }}>{text}</strong>
              </button>; })}
            </div>
            <label style={label}>Choose a story template</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginBottom: 16 }}>
              {storyTemplates.map((template) => { const active = storyTemplate === template.id && !backgroundUrl; return <button className="guardian-card" type="button" key={template.id} onClick={() => applyStoryTemplate(template.id)} aria-pressed={active} style={{ position: 'relative', minWidth: 0, padding: 0, overflow: 'hidden', border: `1px solid ${active ? acid : line}`, background: active ? acid : '#0D0E0C', color: active ? black : ink, textAlign: 'left', cursor: 'pointer', fontFamily: sans }}>
                <img src={template.image} alt="" loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', objectPosition: 'center' }} />
                {active && <span style={{ position: 'absolute', top: 7, right: 7, width: 19, height: 19, display: 'grid', placeItems: 'center', background: black, color: acid }}><Check size={11} /></span>}
                <span style={{ display: 'block', padding: '10px 11px 11px' }}><span style={{ display: 'block', color: active ? 'rgba(9,10,8,.62)' : acid, fontSize: 7, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>{template.style}</span><strong style={{ display: 'block', fontSize: 11 }}>{template.name}</strong><span style={{ display: 'block', marginTop: 5, color: active ? 'rgba(9,10,8,.65)' : muted, fontSize: 8, lineHeight: 1.4 }}>{template.description}</span></span>
              </button>; })}
            </div>
            <label style={label}>Choose an avatar</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(92px,1fr))', gap: 7, marginBottom: 16 }}>
              {defaultAvatars.map((avatar) => { const active = avatarUrl === avatar.image; return <button className="guardian-card" type="button" key={avatar.name} onClick={() => setAvatarUrl(avatar.image)} aria-pressed={active} style={{ position: 'relative', minWidth: 0, minHeight: 94, padding: '8px 6px 7px', border: `1px solid ${active ? acid : line}`, background: active ? acid : 'transparent', color: active ? black : ink, cursor: 'pointer', fontFamily: sans }}>
                {active && <span style={{ position: 'absolute', top: 5, right: 5, width: 17, height: 17, display: 'grid', placeItems: 'center', background: black, color: acid }}><Check size={10} /></span>}
                <img src={avatar.image} alt="" style={{ display: 'block', width: 58, height: 58, maxWidth: '100%', objectFit: 'contain', margin: '0 auto 5px', filter: active ? 'grayscale(1) brightness(.25)' : 'grayscale(1) contrast(.95) brightness(.9)' }} />
                <span style={{ display: 'block', fontSize: 8, fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>{avatar.name}</span>
              </button>; })}
            </div>
            <label style={label}>Image style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 7, marginBottom: 16 }}>
              {(['color', 'greyscale'] as const).map((treatment) => { const active = imageTreatment === treatment; return <button className="guardian-card" type="button" key={treatment} onClick={() => setImageTreatment(treatment)} aria-pressed={active} style={{ ...pickStyle(active), minHeight: 48, justifyContent: 'flex-start', textAlign: 'left' }}>
                <span style={{ width: 24, height: 24, flex: '0 0 auto', border: `1px solid ${active ? 'rgba(9,10,8,.3)' : line}`, background: treatment === 'color' ? 'linear-gradient(135deg,#A56B48 0 33%,#C7D8A3 33% 66%,#507785 66%)' : 'linear-gradient(135deg,#E8E8E4 0 33%,#999 33% 66%,#242522 66%)' }} />
                <span><strong style={{ display: 'block', fontSize: 10, textTransform: 'capitalize' }}>{treatment}</strong><span style={{ display: 'block', marginTop: 3, color: active ? 'rgba(9,10,8,.65)' : muted, fontSize: 8 }}>{treatment === 'color' ? 'Keep photography in full color' : 'Use a restrained black-and-white treatment'}</span></span>
              </button>; })}
            </div>
            <label style={label}>Fine tune your style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 }}>
              <div><label style={label}>Typeface 1 · headings</label><select style={input} value={headingTypeface} onChange={(e) => setHeadingTypeface(e.target.value)}><option>Archivo</option><option>Fraunces</option><option>Instrument Serif</option><option>Inter</option><option>DM Sans</option><option>Poppins</option></select></div>
              <div><label style={label}>Typeface 2 · body</label><select style={input} value={bodyTypeface} onChange={(e) => setBodyTypeface(e.target.value)}><option>Inter</option><option>Archivo</option><option>Instrument Serif</option><option>Fraunces</option><option>DM Sans</option><option>Poppins</option></select></div>
              <div><label style={label}>Page color</label><input type="color" style={{ ...input, padding: 5 }} value={pageColor} onChange={(e) => setPageColor(e.target.value)} /></div>
              <div><label style={label}>Accent color</label><input type="color" style={{ ...input, padding: 5 }} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <label style={{ ...btn, height: 36, background: 'transparent', color: ink, fontSize: 8 }}>{uploadingLogo ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}{logoUrl ? 'Replace logo' : 'Upload logo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadLogo(event.target.files?.[0])} style={{ display: 'none' }} /></label>
              <label style={{ ...btn, height: 36, background: 'transparent', color: ink, fontSize: 8 }}><Upload size={11} />{avatarUrl ? 'Replace avatar' : 'Upload avatar'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPortrait(event.target.files?.[0])} style={{ display: 'none' }} /></label>
              <label style={{ ...btn, height: 36, background: 'transparent', color: ink, fontSize: 8 }}>{uploadingBackground ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}{backgroundUrl ? 'Replace photo / video' : 'Upload photo / video'}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => uploadBackground(event.target.files?.[0])} style={{ display: 'none' }} /></label>
            </div>
          </div>
          <div style={{ position: 'relative', border: `1px solid ${line}`, backgroundColor: pageColor, backgroundImage: backgroundType === 'image' ? `linear-gradient(rgba(242,239,231,.66),rgba(242,239,231,.66)),url(${effectiveBackground})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: imageTreatment === 'greyscale' ? 'luminosity' : 'normal', color: '#11120F', overflow: 'hidden', fontFamily: themeFont(bodyTypeface) }}>
            {backgroundType === 'video' && <><video src={effectiveBackground} autoPlay muted loop playsInline aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: imageTreatment === 'greyscale' ? 'grayscale(1)' : 'none' }} /><span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(242,239,231,.66)' }} /></>}
            <div style={{ position: 'relative', zIndex: 2, height: 34, background: previewHeaderBackground, color: previewHeaderText, borderBottom: `1px solid ${previewHeaderText === '#FFFFFF' ? 'rgba(255,255,255,.24)' : 'rgba(17,18,15,.16)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: 7, fontWeight: 700, letterSpacing: '.12em' }}><span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{logoUrl && <img src={logoUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}{brandName.trim() || 'ROUTINE³ · GUARDIAN'}</span><span>routine3.com/{displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'your-name'}</span></div>
            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(18px,4vw,34px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 24, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', filter: imageTreatment === 'greyscale' ? 'grayscale(1)' : 'none' }} /> : <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#D7D4CC', display: 'grid', placeItems: 'center', fontFamily: serif, fontSize: 18 }}>{(displayName || 'G')[0]}</span>}<span><strong style={{ display: 'block', fontSize: 11 }}>{displayName || 'Your name'}</strong><span style={{ display: 'block', marginTop: 3, fontSize: 8, color: '#6B6963' }}>{chosen.slice(0, 3).join(' · ') || 'Your guidance'}</span></span></div>
                <h3 style={{ fontFamily: themeFont(headingTypeface), fontWeight: 300, fontSize: 'clamp(28px,4vw,46px)', lineHeight: .95, letterSpacing: '-.035em', margin: '0 0 12px' }}>{generatedHeadline}</h3>
                <ExpertiseTags tags={expertiseTags} color={accentColor} compact />
                <p style={{ color: '#66645F', fontSize: 10, lineHeight: 1.55, margin: 0 }}>{intro || `A practical ${chosen.slice(0, 2).join(' and ').toLowerCase() || 'guidance'} path shaped for ${audience.join(' and ').toLowerCase()}.`}</p>
              </div>
              <div style={{ display: 'grid', gap: 9 }}>
                <div style={{ border: '1px solid rgba(17,18,15,.16)', borderRadius: 5, padding: 16, background: 'rgba(255,255,255,.94)', boxShadow: '0 10px 28px rgba(17,18,15,.09)' }}><span style={{ display: 'block', color: accentColor, fontSize: 7, fontWeight: 700, letterSpacing: '.12em', marginBottom: 7 }}>STAGE 01 · {freeDelivery.join(' + ').toUpperCase()}</span><strong style={{ display: 'block', fontSize: 12, lineHeight: 1.35 }}>{leadMagnetTitle || suggestedFreeOffer.title}</strong><span style={{ display: 'block', color: '#66645F', fontSize: 8, lineHeight: 1.5, marginTop: 7 }}>{freeAudienceValue}</span><button type="button" style={{ marginTop: 11, width: 'fit-content', minHeight: 28, padding: '0 10px', border: 0, borderRadius: 3, background: accentColor, color: readableText(accentColor), fontFamily: sans, fontSize: 7, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{websiteGoalCta[websiteGoal]} <ArrowRight size={9} /></button></div>
                <span style={{ color: '#66645F', fontSize: 8, lineHeight: 1.45 }}>The next stage is revealed only after this action is completed.</span>
              </div>
            </div>
          </div>
        </FunnelStage>
      </>}

      {step === 5 && <>
        <div style={{ border: `1px solid ${line}`, background: panel, padding: 16, marginBottom: 24 }}>
          <label style={{ ...label, color: acid }}>Click funnel · visitor preview</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '5px 0 14px' }}>
            {funnelStages.map((stage, index) => <button type="button" key={`${stage.title}-${index}`} onClick={() => setFunnelPreviewStage(index)} aria-current={funnelPreviewStage === index ? 'step' : undefined} style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', border: `1px solid ${index <= funnelPreviewStage ? acid : line}`, background: funnelPreviewStage === index ? acid : 'transparent', color: funnelPreviewStage === index ? black : index < funnelPreviewStage ? acid : muted, fontFamily: sans, fontSize: 8, fontWeight: 700, cursor: 'pointer' }}>{String(index + 1).padStart(2, '0')}</button>)}
          </div>
          <div style={{ minHeight: 220, border: `1px solid ${line}`, background: '#F2EFE7', color: '#11120F', padding: 'clamp(20px,4vw,38px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))', gap: 24, alignItems: 'center' }}>
            <div><span style={{ color: accentColor, fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>Stage {String(funnelPreviewStage + 1).padStart(2, '0')} · {activeFunnelStage.meta}</span><h3 style={{ fontFamily: themeFont(headingTypeface), fontSize: 'clamp(26px,4vw,44px)', fontWeight: 300, lineHeight: 1, margin: '12px 0 0' }}>{activeFunnelStage.title}</h3></div>
            <div><p style={{ color: '#66645F', fontSize: 11, lineHeight: 1.55, margin: '0 0 14px' }}>{activeFunnelStage.value}</p><button type="button" onClick={() => setFunnelPreviewStage((current) => Math.min(current + 1, funnelStages.length - 1))} style={{ ...btn, height: 32, padding: '0 12px', fontSize: 8 }}>{funnelPreviewStage < funnelStages.length - 1 ? <>{activeFunnelStage.action} <ArrowRight size={11} /></> : <>Journey complete <Check size={11} /></>}</button>{funnelPreviewStage < funnelStages.length - 1 && <span style={{ display: 'block', color: '#77746E', fontSize: 8, marginTop: 8 }}>The next stage appears after this action.</span>}</div>
          </div>
          <button type="button" onClick={() => setFunnelPreviewStage(0)} style={{ marginTop: 10, border: 0, background: 'transparent', color: muted, fontFamily: sans, fontSize: 8, cursor: 'pointer', textDecoration: 'underline' }}>Restart funnel</button>
        </div>
        <div><label style={label}>Add one personal sentence <span style={{ color: muted }}>· optional</span></label><input style={input} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Why people come to you — or leave this blank" /></div>
        <div style={{ borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, padding: '22px 0', marginTop: 28, display: 'grid', gap: 13 }}>
          <div><span style={label}>Guardian</span><span style={{ fontFamily: serif, fontSize: 26 }}>{displayName}</span></div>
          <div><span style={label}>Main language</span><span style={{ color: ink, fontSize: 12 }}>{mainLanguage}</span></div>
          <div><span style={label}>Contact</span><span style={{ color: ink, fontSize: 12 }}>{contactEmail} · {whatsappPhone}</span></div>
          {bookingUrl && <div><span style={label}>Booking</span><span style={{ color: ink, fontSize: 12 }}>{bookingProvider} · {bookingUrl}</span></div>}
          <div><span style={label}>Guidance</span><span style={{ color: ink, fontSize: 12 }}>{chosen.join(' · ')}</span></div>
          <div><span style={label}>Audience and format</span><span style={{ color: ink, fontSize: 12 }}>{audience.join(' · ')} · {format.join(' · ')}</span></div>
          {(leadMagnetTitle || selectedUpsells.length > 0) && <div><span style={label}>Offer ladder · {pricingRegion}</span><span style={{ color: ink, fontSize: 12 }}>{[leadMagnetTitle && `Free: ${leadMagnetTitle} · ${freeDelivery.join(' + ')}`, ...selectedUpsells.map((kind) => `${upsellDrafts[kind].title}${upsellDrafts[kind].price ? ` · ${formatMoney(upsellDrafts[kind].price, currency)}` : ''} · ${upsellDrafts[kind].delivery.join(' + ')}`)].filter(Boolean).join(' → ')}</span></div>}
          <div><span style={label}>Website goal</span><span style={{ color: ink, fontSize: 12 }}>{websiteGoal}</span></div>
        </div>
      </>}

      {error && <p style={{ color: '#F0A7A7', fontSize: 12 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 34 }}>
        {step > 1 ? <button type="button" onClick={() => { setError(''); setStep((current) => current - 1); }} style={{ ...btn, background: 'transparent', color: ink }}>← Back</button> : <span />}
        {step < 5 ? <button type="button" onClick={continueSetup} disabled={importing} style={btn}>{importing ? <><Loader2 size={14} className="animate-spin" /> Reading profiles</> : <>Continue <ArrowRight size={14} /></>}</button> : <button disabled={busy} style={btn}>{busy ? 'Creating your Guardian' : 'Create my Guardian profile'} <ArrowRight size={14} /></button>}
      </div>
        </section>
      </div>
    </form>
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

function GuardianProtocolAI({ accessToken, protocol, onBuilt }: { accessToken: string; protocol: AdminProtocol; onBuilt: () => void }) {
  const [request, setRequest] = useState('Build a practical Protocol for this selected profile. Include safe daily actions, useful adaptations, and when to seek clinical advice.');
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState('');

  async function buildDraft() {
    if (!request.trim()) return;
    setBuilding(true);
    setMessage('');
    try {
      const draft = await buildProtocolWithAI(accessToken, protocol.id, request.trim());
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
      onBuilt();
    } catch (error: any) {
      setMessage(error?.message || 'The AI draft could not be created.');
    } finally {
      setBuilding(false);
    }
  }

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

function Workspace({ profile, onProfile }: { profile: GuideProfile; onProfile: (p: GuideProfile) => void }) {
  const { user, accessToken, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [leads, setLeads] = useState<GuideLead[]>([]);
  const [offers, setOffers] = useState<GuideOffer[]>([]);
  const [recipes, setRecipes] = useState<GuideRecipe[]>([]);
  const [protocols, setProtocols] = useState<AdminProtocol[]>([]);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [protocolRevision, setProtocolRevision] = useState(0);
  const profileBookingProvider = (profile.social_links?.booking_provider as BookingProvider) || 'ROUTINE³ Booking';
  const profileBookingUrl = profile.social_links?.booking_url || '';
  const profileLanguage = profile.social_links?.language || 'English';
  const updateProfileLink = (key: string, value: string) => onProfile({ ...profile, social_links: { ...(profile.social_links || {}), [key]: value } });
  useEffect(() => { if (!user) return; Promise.all([listGuideLeads(user.id), listGuideOffers(user.id), listGuideRecipes(user.id), accessToken ? listProtocols(accessToken, user.id) : Promise.resolve([])]).then(([l,o,r,p]) => { setLeads(l); setOffers(o); setRecipes(r); setProtocols(p); }).catch(() => {}); }, [user?.id, accessToken]);
  const metric = useMemo(() => [{ n: leads.length, l: 'Leads' }, { n: offers.length, l: 'Offers' }, { n: recipes.length, l: 'Recipes' }, { n: protocols.length, l: 'Protocols' }], [leads.length, offers.length, recipes.length, protocols.length]);
  async function quickAdd() {
    if (!user || !newTitle.trim()) return;
    setAdding(true);
    try {
      if (tab === 'leads') { const x = await createGuideLead(user.id, { name: newTitle, email: newEmail, goal: newGoal || null }); setLeads([x, ...leads]); }
      if (tab === 'offers') { const x = await createGuideOffer(user.id, { kind: 'ebook', title: newTitle, description: newGoal || null, price_cents: 0, affiliate_url: null, access_model: 'paid', file_path: null, booking_url: null }); setOffers([x, ...offers]); }
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
        {tab === 'home' && <><div style={{ ...label, color: acid }}>Guardian workspace</div><h1 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(44px,6vw,76px)', lineHeight: .95, margin: '15px 0 18px' }}>Build what people follow.</h1><p style={{ color: muted, maxWidth: 650, lineHeight: 1.6 }}>Turn your expertise into a simple path: Guardian → lead → paid offer → recipe → protocol.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', borderTop: `1px solid ${line}`, marginTop: 55 }}>{metric.map((m) => <div key={m.l} style={{ borderRight: `1px solid ${line}`, padding: '25px 18px 25px 0' }}><div style={{ fontFamily: serif, fontSize: 42 }}>{m.n}</div><div style={{ ...label, margin: '7px 0 0' }}>{m.l}</div></div>)}</div><div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>{nav.slice(1,5).map(({ id, label: title }) => <button key={id} onClick={() => setTab(id)} style={{ border: `1px solid ${line}`, background: panel, color: ink, minHeight: 210, padding: 22, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}><span><img src={guidePlates[id]} alt="" style={{ width: 86, height: 86, objectFit: 'contain', filter: 'grayscale(1) contrast(.9) brightness(.75)', opacity: .82 }} /><span style={{ display: 'block', fontFamily: serif, fontSize: 25, fontWeight: 300, marginTop: 12 }}>{title}</span></span><ChevronRight size={17} color={muted} /></button>)}</div></>}
        {tab === 'profile' && <>
          <h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 350 }}>Your profile</h1>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <div><label style={label}>Public name</label><input style={input} value={profile.display_name} onChange={(e) => onProfile({ ...profile, display_name: e.target.value })} /></div>
              <div><label style={label}>Main language</label><select style={input} value={profileLanguage} onChange={(event) => updateProfileLink('language', event.target.value)}>{languageOptions.map((language) => <option key={language.code}>{language.name}</option>)}</select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 18 }}>
              <div><label style={label}>Contact email</label><input type="email" style={input} value={profile.contact_email || ''} onChange={(e) => onProfile({ ...profile, contact_email: e.target.value })} /></div>
              <div><label style={label}>WhatsApp number</label><input type="tel" style={input} value={profile.whatsapp_phone || ''} onChange={(e) => onProfile({ ...profile, whatsapp_phone: e.target.value })} /></div>
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
        {(['leads','offers','recipes','protocols'] as Tab[]).includes(tab) && !protocolId && !recipeId && <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><img src={guidePlates[tab]} alt="" style={{ width: 74, height: 74, objectFit: 'contain', filter: 'grayscale(1) contrast(.9) brightness(.74)', opacity: .86 }} /><div><div style={{ ...label, color: acid }}>Build</div><h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 300, margin: '8px 0 0', textTransform: 'capitalize' }}>{tab}</h1></div></div><button onClick={() => setAdding(!adding)} style={btn}><Plus size={14} /> Add {tab === 'offers' ? 'product' : tab === 'protocols' ? 'protocol' : tab.slice(0,-1)}</button></div>{adding && <div style={{ display: 'grid', gridTemplateColumns: tab === 'leads' ? '1fr 1fr 1.2fr auto' : '1fr 1.4fr auto', gap: 9, margin: '28px 0' }}><input style={input} placeholder={tab === 'leads' ? 'Name' : 'Title'} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />{tab === 'leads' && <input style={input} type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />}<input style={input} placeholder={tab === 'leads' ? 'Goal' : 'Short description'} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} /><button onClick={quickAdd} disabled={adding && !newTitle} style={btn}>Create</button></div>}<div style={{ marginTop: 30 }}>{tab === 'leads' && (leads.length ? leads.map((x) => <Row key={x.id} title={x.name} meta={`${x.email} · ${x.goal || 'No goal yet'}`} />) : <Empty image={guidePlates.leads} title="No leads yet" copy="Add a lead or share your public guide page." />)}{tab === 'offers' && (offers.length ? offers.map((x) => <Row key={x.id} title={x.title} meta={`${x.kind} · ${x.status}`} />) : <Empty image={guidePlates.offers} title="Create your first offer" copy="Start with a focused paid eBook, then add products and programs." />)}{tab === 'recipes' && (recipes.length ? recipes.map((x) => <Row key={x.id} title={x.title} meta={`${x.meal_slot || 'Any meal'} · ${x.status}`} action="Open builder" onClick={() => setRecipeId(x.id)} />) : <Empty image={guidePlates.recipes} title="No recipes yet" copy="Choose a recipe offer during setup or create a recipe here." />)}{tab === 'protocols' && (protocols.length ? protocols.map((x) => <Row key={x.id} title={x.name} meta={`${x.total_days || 1} days · ${x.is_public ? 'Published' : 'Draft'}`} action="Open builder" onClick={() => setProtocolId(x.id)} />) : <Empty image={guidePlates.protocols} title="No Protocol drafts yet" copy="Choose a Protocol offer during setup or create one here." />)}</div></>}
        {tab === 'recipes' && recipeId && <RecipeBuilder recipe={recipes.find((recipe) => recipe.id === recipeId)!} onBack={() => setRecipeId(null)} onSaved={(saved) => setRecipes((current) => current.map((recipe) => recipe.id === saved.id ? saved : recipe))} />}
        {tab === 'protocols' && protocolId && accessToken && user && <div style={{ background: '#F5F4EF', color: '#151515', padding: 18, minHeight: 700 }}><button onClick={() => setProtocolId(null)} style={{ ...btn, marginBottom: 14, background: '#151515', color: '#FFF' }}>← Protocols</button>{protocols.find((protocol) => protocol.id === protocolId) && <GuardianProtocolAI accessToken={accessToken} protocol={protocols.find((protocol) => protocol.id === protocolId)!} onBuilt={() => setProtocolRevision((value) => value + 1)} />}<ProtocolEditor key={`${protocolId}-${protocolRevision}`} accessToken={accessToken} initialProtocolId={protocolId} ownerId={user.id} /></div>}
      </main>
    </div>
  </div>;
}

function Row({ title, meta, action, onClick }: { title: string; meta: string; action?: string; onClick?: () => void }) { const content = <><div><div style={{ fontFamily: serif, fontSize: 22 }}>{title}</div><div style={{ color: muted, fontSize: 11, marginTop: 5 }}>{meta}</div></div><span style={{ display: 'flex', alignItems: 'center', gap: 8, color: muted, fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>{action}<ChevronRight size={16} /></span></>; return onClick ? <button type="button" onClick={onClick} style={{ width: '100%', border: 0, borderTop: `1px solid ${line}`, padding: '18px 4px', background: 'transparent', color: ink, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}>{content}</button> : <div style={{ borderTop: `1px solid ${line}`, padding: '18px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{content}</div>; }

export function GuidePortal() {
  const { user, accessToken, loading } = useAuth();
  const routeSlug = window.location.pathname.match(/^\/guides\/([^/]+)\/?$/)?.[1] || null;
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (!user) { setProfile(null); setChecking(false); return; }
    setChecking(true); getGuideProfile(user.id).then(setProfile).catch(() => setProfile(null)).finally(() => setChecking(false));
  }, [user?.id]);
  if (loading || checking) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', fontFamily: sans }}>Opening Guardian workspace…</div>;
  if (routeSlug) return <GuardianWebsite slug={decodeURIComponent(routeSlug)} isSignedIn={Boolean(user)} />;
  if (!user) return <PublicGuidePage />;
  if (!profile && accessToken) return <Onboarding userId={user.id} accessToken={accessToken} name={user.user_metadata?.name || user.email?.split('@')[0] || 'Guardian'} email={user.email || ''} onDone={setProfile} />;
  if (!profile) return <div style={{ minHeight: '100vh', background: black, color: ink, display: 'grid', placeItems: 'center', fontFamily: sans }}>Opening Guardian setup…</div>;
  return <Workspace profile={profile} onProfile={setProfile} />;
}
