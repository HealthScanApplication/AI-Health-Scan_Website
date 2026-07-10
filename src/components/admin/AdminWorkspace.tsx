/**
 * AdminWorkspace (DEV-318) — thin tab shell around the existing admin panel so
 * the new Catalog Data-QA view sits alongside it without bloating the
 * 8k-line SimplifiedAdminPanel. PageRenderer renders this in the admin page.
 *
 * Also owns the admin theme (Supabase-style light/dark): the `.sb-admin` root
 * class + `sb-dark` modifier drive the token layer in adminTheme.css. The
 * choice persists in localStorage('admin-theme').
 */

import React, { Suspense, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { CatalogQADashboard } from './CatalogQADashboard';
import './adminTheme.css';

// Keep SimplifiedAdminPanel lazy (it's large) — same code-split as before.
const SimplifiedAdminPanel = React.lazy(() =>
  import('../SimplifiedAdminPanel').then((m) => ({ default: m.SimplifiedAdminPanel })),
);

type AdminTab = 'panel' | 'qa';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
        active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

export function AdminWorkspace({ user, accessToken }: { user: any; accessToken: string }): React.ReactElement {
  const [tab, setTab] = useState<AdminTab>('panel');
  const [jumpSearch, setJumpSearch] = useState<string | undefined>(undefined);
  // dark is the DEFAULT (Supabase look) — light only when explicitly chosen
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem('admin-theme') !== 'light'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('admin-theme', dark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [dark]);

  // DEV-318: from a Data-QA offender row → switch to the Admin Panel with its
  // search pre-filled so the admin lands on that item to fix it.
  const openInAdmin = (term: string) => {
    setJumpSearch(term);
    setTab('panel');
  };

  return (
    <div className={`sb-admin${dark ? ' sb-dark' : ''}`} style={{ background: 'var(--sb-page)', borderRadius: 12, padding: 16 }}>
      <div className="mb-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-2">
          <TabButton active={tab === 'panel'} onClick={() => setTab('panel')}>Admin Panel</TabButton>
          <TabButton active={tab === 'qa'} onClick={() => setTab('qa')}>Data QA</TabButton>
        </div>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="mb-1 flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          {dark ? <Sun size={13} /> : <Moon size={13} />}
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      {tab === 'panel' ? (
        <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading admin…</div>}>
          <SimplifiedAdminPanel user={user} accessToken={accessToken} initialSearch={jumpSearch} />
        </Suspense>
      ) : (
        <CatalogQADashboard onOpenInAdmin={openInAdmin} />
      )}
    </div>
  );
}

export default AdminWorkspace;
