import { describe, expect, it } from 'vitest';
import { claimsBedAnchor } from '../../protocolDomain/sleepAnchorClaim';
import { computeSleepWindow } from '../../protocolDomain/sleepWindow';
import { getItemTod } from '../../protocolDomain/timeOfDay';
import { hygieneSlotName } from '../../protocolDomain/hygieneWindows';
import { applyWakeShift } from '../../protocolDomain/wakeReschedule';
import { expandOccurrences, resolveOptionForDay } from '../../protocolDomain/occurrences';

describe('website/mobile protocol-domain parity', () => {
  it('does not let a consume item named Bedtime Snack replace the bedtime anchor', () => {
    const snack = { display_name: 'Bedtime Snack', category: 'consume' };
    expect(claimsBedAnchor(snack)).toBe(false);

    const bedtime = { display_name: 'Start Sleep', category: 'sleep', scheduled_time: '22:00', sleep_anchor: 'bed' as const };
    const wake = { display_name: 'End Sleep', category: 'sleep', scheduled_time: '06:00', sleep_anchor: 'wake' as const };
    const window = computeSleepWindow([snack, bedtime, wake]);
    expect(window.bedItem).toBe(bedtime);
    expect(window.wakeItem).toBe(wake);
    expect(window.durationMins).toBe(8 * 60);
  });

  it('honours an explicit post-midnight bedtime role instead of guessing wake from the hour', () => {
    const bedtime = { display_name: 'Sleep', category: 'sleep', scheduled_time: '02:01', sleep_anchor: 'bed' as const };
    const wake = { display_name: 'Recorded wake', category: 'sleep', scheduled_time: '08:55', sleep_anchor: 'wake' as const };
    const window = computeSleepWindow([bedtime, wake]);
    expect(window.bedItem).toBe(bedtime);
    expect(window.wakeItem).toBe(wake);
    expect(window.durationMins).toBe(414);
  });

  it('keeps every pre-noon activity in Morning even after a late wearable wake', () => {
    expect(getItemTod({ display_name: 'Hydrate', scheduled_time: '06:30' }, 9)).toBe('Morning');
  });

  it('keeps ordinary morning hygiene visible after an anomalous 1am sleep endpoint', () => {
    expect(hygieneSlotName({ kind: 'action', subtype: 'hygiene', scheduled_time: '07:00' }, 1))
      .toBe('Morning Hygiene');
  });

  it('does not re-anchor a one-off item that was placed at an absolute clock time', () => {
    const item = { display_name: 'Achilles Stretch', scheduled_time: '00:08', scheduled_date: '2026-08-07' };
    const shifted = applyWakeShift([item], { plannedWakeMins: 360, actualWakeMins: 600 });
    expect(shifted[0]).toBe(item);
    expect(shifted[0].scheduled_time).toBe('00:08');
  });

  it('expands repeated activities and resolves a per-occurrence option before the day default', () => {
    const occurrences = expandOccurrences(
      { id: 'brush', scheduled_time: '07:00' },
      [
        { id: 'pm', scheduled_time: '21:00', sort_order: 2 },
        { id: 'am', scheduled_time: '07:00', sort_order: 1 },
      ],
    );
    expect(occurrences.map((o) => o.completionId)).toEqual(['am', 'pm']);

    const resolved = resolveOptionForDay(
      [{ id: 'oatmeal', is_default: true }, { id: 'eggs' }],
      [
        { local_date: '2026-10-13', option_id: 'oatmeal' },
        { local_date: '2026-10-13', occurrence_id: 'am', option_id: 'eggs' },
      ],
      '2026-10-13',
      'am',
    );
    expect(resolved.option?.id).toBe('eggs');
    expect(resolved.source).toBe('day');
  });
});
