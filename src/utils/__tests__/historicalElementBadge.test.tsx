import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ElementDetailView } from '../../components/admin/ElementDetailView';

it('does not show historical membership for string false or a wrongly flagged additive', () => {
  for (const record of [{ id: 'calcium', name_common: 'Calcium', essential_90: 'false' }, { id: 'calcium_propionate', name_common: 'Calcium Propionate', essential_90: 'true' }]) {
    const html = renderToStaticMarkup(<ElementDetailView record={record as any} />);
    expect(html).not.toContain('>Essential 90<');
    expect(html).not.toContain('>Wallach historical core90<');
  }
});
