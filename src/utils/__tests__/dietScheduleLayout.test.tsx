import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { DietBuilder } from '../../components/guides/GuardianBuilders';
it('places per-day supplement editors and fasting timelines in the shared weekly planner', () => {
  const html = renderToStaticMarkup(<DietBuilder accessToken="token" ownerId="owner" protocols={[]} recipes={[]} onSaved={() => {}} onOpen={() => {}} />);
  expect(html).toContain('Edit Mon morning supplements');
  expect(html).toContain('Edit Sun evening supplements');
  expect(html).toContain('Mon fasting periods');
  expect(html).not.toContain('aria-label="Supplements"');
});
