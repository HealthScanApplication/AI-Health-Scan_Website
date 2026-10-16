import { useEffect, useState } from 'react';
import { cloneProtocolChild, listProtocolChildren, type ProtocolChild } from '../../utils/protocolCopies';
import { listBuilderMeta } from '../../utils/protocolBuilders';
import type { AdminProtocol } from '../../utils/protocolAdmin';

export function ProtocolChildrenPanel({ token, ownerId, parentId, protocols, onEdit, onChanged }: {
  token: string; ownerId: string; parentId: string; protocols: AdminProtocol[];
  onEdit: (kind: 'diet' | 'fitness', id: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [children, setChildren] = useState<ProtocolChild[]>([]);
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof listBuilderMeta>>>({});
  const [sourceId, setSourceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([listProtocolChildren(token, parentId), listBuilderMeta(token, ownerId)])
      .then(([links, builders]) => { if (active) { setChildren(links); setMeta(builders); setError(''); } })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token, parentId, ownerId, protocols]);
  async function attach(idToCopy = sourceId) {
    setBusy(true); setError('');
    try {
      const id = await cloneProtocolChild(token, parentId, idToCopy);
      setChildren(await listProtocolChildren(token, parentId));
      await onChanged();
      onEdit(meta[idToCopy].builder_kind as 'diet' | 'fitness', id);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const button = { padding: '8px 12px', border: '1px solid #bbb', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#151515' };
  return <section aria-label="Protocol plans" style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16 }}>
    <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Diet &amp; Fitness plans</h2>
    <p style={{ fontSize: 12 }}>Edits apply only to your copy in this Protocol.</p>
    {children.map((child) => <div key={child.child_protocol_id} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0' }}>
      <span style={{ flex: 1 }}>{protocols.find((p) => p.id === child.child_protocol_id)?.name || `${child.kind} plan`}</span>
      <button type="button" style={button} onClick={() => onEdit(child.kind, child.child_protocol_id)}>Edit {child.kind === 'diet' ? 'Diet' : 'Fitness'}</button>
    </div>)}
    {(meta[parentId]?.source_protocol_ids || []).filter((id) => ['diet','fitness'].includes(meta[id]?.builder_kind || '') && !children.some((child) => child.source_protocol_id === id)).map((id) => <div key={id} style={{ margin: '8px 0' }}>
      <button type="button" disabled={busy} style={button} onClick={() => attach(id)}>Edit my {meta[id].builder_kind === 'diet' ? 'Diet' : 'Fitness'} copy</button>
    </div>)}
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <select aria-label="Plan to copy into this Protocol" value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={button}>
        <option value="">Choose a Diet or Fitness plan</option>
        {protocols.filter((p) => p.id !== parentId && ['diet', 'fitness'].includes(meta[p.id]?.builder_kind || '') && !children.some((c) => c.child_protocol_id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button type="button" disabled={busy || !sourceId} style={button} onClick={() => attach()}>{busy ? 'Copying…' : 'Add my copy'}</button>
    </div>
    {error && <p role="alert" style={{ color: '#9b281e', fontSize: 12 }}>{error}</p>}
  </section>;
}
