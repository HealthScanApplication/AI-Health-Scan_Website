/**
 * AdminWorkspace (DEV-318) — thin tab shell around the existing admin panel so
 * the new Catalog Data-QA view sits alongside it without bloating the
 * 8k-line SimplifiedAdminPanel. PageRenderer renders this in the admin page.
 */

import React, { Suspense, useState } from 'react';
import { CatalogQADashboard } from './CatalogQADashboard';

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
  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <TabButton active={tab === 'panel'} onClick={() => setTab('panel')}>Admin Panel</TabButton>
        <TabButton active={tab === 'qa'} onClick={() => setTab('qa')}>Data QA</TabButton>
      </div>

      {tab === 'panel' ? (
        <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading admin…</div>}>
          <SimplifiedAdminPanel user={user} accessToken={accessToken} />
        </Suspense>
      ) : (
        <CatalogQADashboard />
      )}
    </div>
  );
}

export default AdminWorkspace;
