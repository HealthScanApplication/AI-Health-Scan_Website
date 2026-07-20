/*
 * MarkdownField — a lightweight, dependency-free rich-text editor for description
 * fields. It writes Markdown (so it round-trips with the existing `**bold**` /
 * bullet content and whatever renders it), with a formatting toolbar and a live
 * Preview toggle.
 *
 * No-JIT note: this project ships a prebuilt static stylesheet, so everything here
 * is inline-styled — new Tailwind utility classes would render transparent.
 */
import { useRef, useState } from 'react';
import { Bold, Italic, Heading, List, ListOrdered, Link2, Eye, Pencil } from 'lucide-react';

const C = { ink: '#111827', sub: '#6B7280', faint: '#9CA3AF', hair: '#E5E7EB', panel: '#F9FAFB', paper: '#FFFFFF', accent: '#2563EB' };

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: 13, color: C.ink, border: '1px solid ' + C.hair, borderRadius: 8, background: C.paper, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' };

/* ── minimal, safe Markdown → HTML (the subset our descriptions use) ── */
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inlineMd(t: string) {
  return escapeHtml(t)
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:#2563EB">$1</a>');
}
export function markdownToHtml(src: string) {
  const lines = (src || '').split(/\r?\n/);
  let html = ''; let inUl = false, inOl = false;
  const closeLists = () => { if (inUl) { html += '</ul>'; inUl = false; } if (inOl) { html += '</ol>'; inOl = false; } };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    let m: RegExpExecArray | null;
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { closeLists(); const lvl = m[1].length; html += `<div style="font-weight:700;font-size:${Math.max(13, 19 - lvl)}px;color:#111827;margin:10px 0 4px">${inlineMd(m[2])}</div>`; continue; }
    if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) { if (inOl) { html += '</ol>'; inOl = false; } if (!inUl) { html += '<ul style="margin:4px 0;padding-left:18px">'; inUl = true; } html += `<li style="margin:2px 0">${inlineMd(m[1])}</li>`; continue; }
    if ((m = /^\s*\d+\.\s+(.*)$/.exec(line))) { if (inUl) { html += '</ul>'; inUl = false; } if (!inOl) { html += '<ol style="margin:4px 0;padding-left:20px">'; inOl = true; } html += `<li style="margin:2px 0">${inlineMd(m[1])}</li>`; continue; }
    if (line.trim() === '') { closeLists(); html += '<div style="height:8px"></div>'; continue; }
    closeLists(); html += `<div style="margin:2px 0">${inlineMd(line)}</div>`;
  }
  closeLists();
  return html;
}

interface Props { value: string; onChange: (v: string) => void; minHeight?: number; placeholder?: string }

export function MarkdownField({ value, onChange, minHeight = 120, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  // re-select after a programmatic edit so typing/formatting stays fluid
  function apply(next: string, selStart: number, selEnd: number) {
    onChange(next);
    requestAnimationFrame(() => { const el = ref.current; if (el) { el.focus(); el.setSelectionRange(selStart, selEnd); } });
  }
  // wrap the current selection (or a placeholder) with `before`/`after`
  function wrap(before: string, after: string, placeholderText: string) {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = value.slice(s, e) || placeholderText;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    apply(next, s + before.length, s + before.length + sel.length);
  }
  // prefix every selected line (toggles for list/heading markers)
  function linePrefix(prefix: string | ((i: number) => string)) {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    let lineEnd = value.indexOf('\n', e); if (lineEnd === -1) lineEnd = value.length;
    const block = value.slice(lineStart, lineEnd);
    const out = block.split('\n').map((ln, i) => {
      const pfx = typeof prefix === 'function' ? prefix(i) : prefix;
      return ln.startsWith(pfx) ? ln.slice(pfx.length) : pfx + ln;
    }).join('\n');
    const next = value.slice(0, lineStart) + out + value.slice(lineEnd);
    apply(next, lineStart, lineStart + out.length);
  }

  const tbBtn: React.CSSProperties = { border: '1px solid ' + C.hair, background: C.paper, borderRadius: 6, cursor: 'pointer', color: C.sub, padding: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  const tool = (Icon: any, title: string, onClick: () => void) => (
    <button type="button" title={title} onClick={onClick} style={tbBtn}><Icon size={14} /></button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {tool(Bold, 'Bold  **text**', () => wrap('**', '**', 'bold text'))}
        {tool(Italic, 'Italic  *text*', () => wrap('*', '*', 'italic text'))}
        {tool(Heading, 'Heading  ## ', () => linePrefix('## '))}
        {tool(List, 'Bullet list  - ', () => linePrefix('- '))}
        {tool(ListOrdered, 'Numbered list', () => linePrefix((i) => `${i + 1}. `))}
        {tool(Link2, 'Link  [text](url)', () => wrap('[', '](https://)', 'link text'))}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => setPreview((p) => !p)} title={preview ? 'Edit' : 'Preview'}
          style={{ ...tbBtn, width: 'auto', gap: 5, padding: '5px 9px', fontSize: 12, fontWeight: 600, color: preview ? C.accent : C.sub, borderColor: preview ? C.accent : C.hair }}>
          {preview ? <Pencil size={13} /> : <Eye size={13} />}{preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? (
        <div style={{ minHeight, border: '1px solid ' + C.hair, borderRadius: 8, background: C.panel, padding: '10px 12px', fontSize: 13, color: C.ink, lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(value) || `<span style="color:${C.faint}">Nothing to preview</span>` }} />
      ) : (
        <textarea ref={ref} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, minHeight }} />
      )}
      <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Markdown — **bold**, *italic*, ## heading, - bullet. Select text, then click a button.</div>
    </div>
  );
}
