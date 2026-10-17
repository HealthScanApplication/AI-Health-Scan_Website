import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { DietBuilder } from '../../components/guides/GuardianBuilders';
it('places per-day supplement editors and fasting timelines in the shared weekly planner', () => {
  const html = renderToStaticMarkup(<DietBuilder accessToken="token" ownerId="owner" protocols={[]} recipes={[]} onSaved={() => {}} onOpen={() => {}} />).replace(/<!--.*?-->/g,'');
  expect(html).toContain('Edit Mon morning supplements');
  expect(html).toContain('Edit Sun evening supplements');
  expect(html).toContain('Mon fasting periods');
  expect(html).not.toContain('aria-label="Supplements"');
  for(const period of ['Morning','Afternoon','Evening']) expect(html).toContain(`${period} · meals`);
  expect(html.indexOf('Morning · meals')).toBeLessThan(html.indexOf('Add 1:breakfast meal'));
  expect(html.indexOf('Edit Mon morning supplements')).toBeLessThan(html.indexOf('Afternoon · meals'));
  expect(html.indexOf('Edit Mon afternoon supplements')).toBeLessThan(html.indexOf('Evening · meals'));
  expect(html).toContain('Planner city');
  expect(html).toContain('Choose a city for sunrise');
});
