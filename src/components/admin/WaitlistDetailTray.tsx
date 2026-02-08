import React from 'react';
import { Button } from '../ui/button';
import { Mail, Trash2, Edit } from 'lucide-react';
import { AdminModal } from '../ui/AdminModal';
import type { AdminRecord, GeoInfo } from '../../utils/adminHelpers';

interface WaitlistDetailTrayProps {
  record: AdminRecord;
  open: boolean;
  onClose: () => void;
  onEdit: (record: AdminRecord) => void;
  onDelete: (record: AdminRecord) => void;
  onResendEmail: (id: string, email: string) => void;
  resendingEmail: string | null;
  ipGeoData: Record<string, GeoInfo>;
}

export function WaitlistDetailTray({
  record,
  open,
  onClose,
  onEdit,
  onDelete,
  onResendEmail,
  resendingEmail,
  ipGeoData,
}: WaitlistDetailTrayProps) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={record.email || 'User'}
      subtitle={record.name || undefined}
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onResendEmail(record.id, record.email || '')}
              disabled={resendingEmail === record.id}
              className={`gap-1.5 text-xs ${!record.confirmed ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
              variant={record.confirmed ? 'outline' : 'default'}
            >
              <Mail className="w-3.5 h-3.5" />
              {resendingEmail === record.id
                ? 'Sending...'
                : record.confirmed
                  ? 'Resend Email'
                  : 'Send Confirmation'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(record)}
              className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => {
              onEdit(record);
              onClose();
            }}
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      }
    >
      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            record.confirmed
              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
              : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${record.confirmed ? 'bg-green-500' : 'bg-amber-500'}`}
          />
          {record.confirmed ? 'Confirmed' : 'Unconfirmed'}
        </span>

        {record.position && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10">
            #{record.position} in queue
          </span>
        )}

        {(record.referrals || 0) > 0 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10">
            {record.referrals} referral{record.referrals !== 1 ? 's' : ''}
          </span>
        )}

        {record.referredBy && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Referred
          </span>
        )}
      </div>

      {/* Details — description list */}
      <dl className="divide-y divide-gray-100">
        <DetailRow label="Email" value={record.email} breakAll />
        <DetailRow label="Name" value={record.name || '—'} />
        <DetailRow
          label="Signed Up"
          value={
            record.signupDate
              ? new Date(record.signupDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—'
          }
        />
        <DetailRow label="Referral Code" value={record.referralCode || '—'} mono />
        {record.referredBy && (
          <DetailRow label="Referred By" value={record.referredBy} mono />
        )}
        {record.ipAddress && (
          <DetailRow
            label="Location"
            value={(() => {
              const ip = String(record.ipAddress).split(',')[0].trim();
              const geo = ipGeoData[ip];
              return geo ? `${geo.flag} ${geo.city}, ${geo.country}` : ip;
            })()}
          />
        )}
      </dl>

      {/* Activity Timeline */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Activity
        </h3>
        <div className="space-y-0 border-l-2 border-gray-200 ml-2">
          {record.signupDate && (
            <TimelineEvent
              color="bg-blue-500"
              title="Joined waitlist"
              date={record.signupDate}
            />
          )}

          {(record.emailsSent || record.email_sent) && (
            <TimelineEvent
              color="bg-orange-400"
              title="Confirmation email sent"
              subtitle={
                typeof record.emailsSent === 'number' && record.emailsSent > 1
                  ? `Sent ${record.emailsSent} times`
                  : 'Sent 1 time'
              }
              date={record.lastEmailSent}
              datePrefix="last "
            />
          )}

          {record.confirmed && (
            <TimelineEvent
              color="bg-green-500"
              title="Email confirmed"
              date={record.emailConfirmedAt}
              fallbackText="Confirmed"
            />
          )}

          {(record.referrals || 0) > 0 && (
            <TimelineEvent
              color="bg-purple-500"
              title={`Referred ${record.referrals} user${record.referrals !== 1 ? 's' : ''}`}
              date={record.lastReferralDate}
              datePrefix="Last referral "
              fallbackText="Via referral link"
            />
          )}

          {!record.confirmed && (
            <div className="relative pl-5 pb-1">
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300 ring-2 ring-gray-100" />
              <p className="text-xs text-gray-400 italic">Awaiting email confirmation...</p>
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

/* ------------------------------------------------------------------ */
/*  Small private sub-components                                       */
/* ------------------------------------------------------------------ */

function DetailRow({
  label,
  value,
  mono,
  breakAll,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  breakAll?: boolean;
}) {
  return (
    <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd
        className={`mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 ${mono ? 'font-mono' : ''} ${breakAll ? 'break-all' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function TimelineEvent({
  color,
  title,
  subtitle,
  date,
  datePrefix = '',
  fallbackText,
}: {
  color: string;
  title: string;
  subtitle?: string;
  date?: string;
  datePrefix?: string;
  fallbackText?: string;
}) {
  const formatted = date
    ? `${datePrefix}${new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : fallbackText || '';

  return (
    <div className="relative pl-5 pb-3">
      <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${color}`} />
      <p className="text-xs font-medium text-gray-900">{title}</p>
      <p className="text-[10px] text-gray-400">
        {subtitle && `${subtitle}`}
        {subtitle && formatted && ' — '}
        {formatted}
      </p>
    </div>
  );
}
