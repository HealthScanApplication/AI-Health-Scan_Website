import { expect, it } from 'vitest';
import { plannerWeek, sunriseForDate, searchPlannerCities, nearestPlannerCity } from '../plannerSunrise';
const warsaw = { name:'Warsaw', country:'Poland', latitude:52.23, longitude:21.01, timezone:'Europe/Warsaw' };
it('uses the chosen city calendar date, including across the international date line', () => {
  expect(plannerWeek('Pacific/Auckland',new Date('2026-10-18T23:30:00Z'))).toEqual(['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25']);
  expect(plannerWeek('America/Los_Angeles',new Date('2026-10-19T02:00:00Z'))[0]).toBe('2026-10-12');
});
it('calculates approximate sunrise in the city timezone and handles polar night', () => {
  expect(sunriseForDate(warsaw,'2026-10-17')).toMatch(/^07:[01]\d$/);
  expect(sunriseForDate({...warsaw,latitude:78.22,longitude:15.65,timezone:'Arctic/Longyearbyen'},'2026-12-21')).toBeNull();
});
it('uses the civil date in Samoa, not the following solar date west of the date line',()=>{
  expect(sunriseForDate({name:'Apia',country:'Samoa',latitude:-13.83,longitude:-171.75,timezone:'Pacific/Apia'},'2026-10-17')).toBe('06:00');
});
it('finds cities locally and resolves approximate device coordinates to a named city', async () => {
  const cities = await searchPlannerCities('Warsaw');
  expect(cities.some(c=>c.name==='Warsaw' && c.timezone==='Europe/Warsaw')).toBe(true);
  expect((await nearestPlannerCity(52.23,21.01)).timezone).toBe('Europe/Warsaw');
  expect(await searchPlannerCities('')).toEqual([]);
});
