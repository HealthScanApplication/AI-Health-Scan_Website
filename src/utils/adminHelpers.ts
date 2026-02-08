import { type FieldConfig, badgeColorMap } from '../config/adminFieldConfig';

/**
 * Shared admin record type used across detail trays and the admin panel.
 */
export interface AdminRecord {
  id: string;
  name?: string;
  name_common?: string;
  email?: string;
  title?: string;
  category?: string;
  description?: string;
  image_url?: string;
  avatar_url?: string;
  created_at?: string;
  emailsSent?: number;
  email_sent?: boolean;
  referrals?: number;
  referralCode?: string;
  position?: number;
  confirmed?: boolean;
  lastEmailSent?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  referredBy?: string;
  [key: string]: any;
}

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

/**
 * Best-effort display name for any admin record.
 */
export function getDisplayName(record: AdminRecord): string {
  return record.name_common || record.name || record.email || record.title || 'Unnamed';
}

/**
 * Resolve the best image URL for a record, falling back to PLACEHOLDER_IMAGE.
 * `activeTab` is needed because recipes store images differently.
 */
export function getImageUrl(record: AdminRecord, activeTab: string): string {
  let imageUrl = record.image_url || record.avatar_url;

  if (!imageUrl && activeTab === 'recipes') {
    if (Array.isArray(record.images) && record.images.length > 0) {
      imageUrl = record.images[0];
    } else if (typeof record.images === 'string') {
      imageUrl = record.images;
    } else if (record.image) {
      imageUrl = record.image;
    }
  }

  return imageUrl || PLACEHOLDER_IMAGE;
}

/**
 * Geo-lookup result shape (matches ipGeoData values).
 */
export interface GeoInfo {
  city?: string;
  country?: string;
  countryCode?: string;
  flag?: string;
}

/**
 * Render a single field value to a React node.
 * Extracted so both detail trays and future components can reuse it.
 */
export function renderFieldValue(
  field: FieldConfig,
  val: any,
  ipGeoData: Record<string, GeoInfo>,
): React.ReactNode {
  // Lazy-import React so this stays a plain .ts file
  // — callers already live in .tsx so JSX is fine at call-site.
  // We return primitives / strings here; JSX rendering stays in the component.
  //
  // NOTE: This helper intentionally returns `any` so that the caller can
  // embed it directly in JSX without type gymnastics.

  if (val == null || val === '' || val === 'null') return null;

  if (field.type === 'boolean') return val ? 'Yes' : 'No';

  if (field.type === 'date' && val) {
    const d = new Date(val);
    return `${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }

  if (field.key === 'ipAddress' && val) {
    const ip = String(val).split(',')[0].trim();
    const geo = ipGeoData[ip];
    if (geo) return `${geo.flag} ${geo.city}, ${geo.country} (${ip})`;
    return ip;
  }

  if (
    (field.key === 'signupDate' ||
      field.key === 'created_at' ||
      field.key === 'lastActiveDate' ||
      field.key === 'lastReferralDate') &&
    val
  ) {
    const d = new Date(val);
    return `${d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
  }

  if (field.type === 'badge') return String(val);

  if (field.type === 'json' && typeof val === 'object' && val !== null) {
    if (Array.isArray(val)) return val;
    return val;
  }

  if (field.type === 'array' && Array.isArray(val)) return val;

  return String(val);
}

export { badgeColorMap };
export type { FieldConfig };
