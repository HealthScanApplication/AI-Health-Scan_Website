import { describe, it, expect } from 'vitest';
import { gateProtocolItem, onGateWarnings } from '../protocolGate';

const create = (p: Record<string, any>) => gateProtocolItem({ kind: 'action', ...p }).item;

describe('hard gate on every web save', () => {
  it('sleep anchors', () => {
    expect(create({ display_name: 'Wake up', category: 'sleep', scheduled_time: '06:30:00' }).display_name).toBe('End Sleep');
    expect(create({ display_name: 'Bedtime', category: 'sleep', scheduled_time: '22:00:00' }).display_name).toBe('Start Sleep');
    const advice = gateProtocolItem({ kind: 'action', display_name: 'Sleep in complete darkness', category: 'sleep' });
    expect(advice.item.display_name).toBe('Sleep in complete darkness'); // unchanged, warned
    expect(advice.warnings[0].message).toMatch(/do on Start Sleep/);
  });
  it('meals: no verb, slot from title or time, Kitchari lunch moved into lunch', () => {
    expect(create({ display_name: 'Eat oats', category: 'consume', subtype: 'meal', scheduled_time: '08:00:00' })).toMatchObject({ display_name: 'Oats', group_name: 'Breakfast' });
    expect(create({ display_name: 'Kitchari Lunch Bowl', category: 'consume', subtype: 'meal', scheduled_time: '08:00:00', group_name: 'Breakfast' })).toMatchObject({ scheduled_time: '12:30:00', group_name: 'Lunch' });
    expect(create({ display_name: 'Drink green tea', category: 'consume', subtype: 'meal', scheduled_time: '08:00:00' })).toMatchObject({ display_name: 'Green tea', subtype: 'drink', group_name: 'Breakfast' });
  });
  it('custom section names are kept (warned), Supplements untouched', () => {
    const r = gateProtocolItem({ kind: 'action', display_name: 'Bone broth', category: 'consume', subtype: 'meal', scheduled_time: '19:00:00', group_name: 'Recovery' });
    expect(r.item.group_name).toBe('Recovery'); // kept, warned
    expect(r.warnings.some((w) => /Custom group/.test(w.message))).toBe(true);
    expect(create({ display_name: 'Eat flaxseed', category: 'consume', subtype: 'meal', scheduled_time: '07:30:00', group_name: 'Supplement' })).toMatchObject({ display_name: 'Eat flaxseed', group_name: 'Supplement' });
  });
  it('rules saved as steps become group rules', () => {
    expect(create({ display_name: 'Limit caffeine', category: 'consume', subtype: 'meal', scheduled_time: '08:00:00' })).toMatchObject({ kind: 'rule_do', scope: 'consume', subtype: 'drink', scheduled_time: null });
    expect(create({ display_name: 'Avoid added sugar', category: 'consume', subtype: 'meal' })).toMatchObject({ kind: 'rule_dont', subtype: 'meal' });
    expect(create({ display_name: 'Avoid screens', category: 'do', subtype: 'wellness' })).toMatchObject({ kind: 'rule_dont', scope: 'outside' });
  });
  it('set info from the title; calendar entries and rule rows untouched', () => {
    expect(create({ display_name: '3x10 squats', category: 'do', subtype: 'exercise', scheduled_time: '07:00:00' })).toMatchObject({ sets: 3, reps: 10 });
    expect(create({ display_name: 'Flight to Warsaw (LO 574)', category: 'do', subtype: 'wellness', scheduled_time: '09:00:00' })).toEqual({ kind: 'action', display_name: 'Flight to Warsaw (LO 574)', category: 'do', subtype: 'wellness', scheduled_time: '09:00:00' });
    expect(gateProtocolItem({ kind: 'rule_do', display_name: 'Eat slowly' }).item.display_name).toBe('Eat slowly');
  });
  it('update with only a new title uses the stored row', () => {
    const r = gateProtocolItem({ display_name: 'Have lunch' }, { id: 'x', kind: 'action', category: 'consume', subtype: 'meal', scheduled_time: '12:30:00', group_name: null });
    expect(r.item).toMatchObject({ display_name: 'Lunch', group_name: 'Lunch' });
  });
  it('keeps the old title as "Was" and tells listeners', () => {
    const seen: string[] = [];
    const off = onGateWarnings((t) => seen.push(t));
    const r = gateProtocolItem({ kind: 'action', display_name: 'Wake', category: 'sleep', scheduled_time: '06:00:00' });
    off();
    expect(r.item.filter.original_title).toBe('Wake');
    expect(seen).toEqual(['End Sleep']);
  });
  it('a step with no time is warned', () => {
    expect(gateProtocolItem({ kind: 'action', display_name: 'Meditate', category: 'do', subtype: 'wellness' }).warnings.map((w) => w.field)).toContain('scheduled_time');
  });
});
