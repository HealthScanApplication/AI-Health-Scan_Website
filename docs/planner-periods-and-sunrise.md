# Planner periods and sunrise

The weekly diet grid is grouped into Morning (breakfast), Afternoon (lunch and
optional snack), and Evening (dinner). Each group immediately includes its seven
per-day supplement controls. Meal/drink IDs, independent supplement times,
fasting settings, and existing builder configuration remain unchanged.

The planner header lets users choose a city, displays today's approximate local
sunrise, and adds dates/sunrise times to the seven day headers. These dates refer
to the current Monday–Sunday calendar week in the selected city's timezone, not
the start date of an assigned Protocol. This does not shift meal/alarm times.

City selection is saved with the diet's existing private builder configuration.
Old plans without a city continue to work. There is no automatic geolocation
request: "Use my location" requests coarse browser location once, resolves the
nearest city locally, and retains only that city's centre. Results are approximate
and editable, particularly near timezone borders. Exact device coordinates are
not sent to a geocoder or saved. Manual search works without location permission.

The lazy-loaded `city-timezones` dataset supplies named cities/timezones, and
`suncalc` computes sunrise locally. There are no external city/weather API calls
or new API keys. Their licenses ship in the installed packages. Small places may
require choosing a nearby city. Polar dates with no sunrise are labelled, rather
than shown as midnight. Civil-date handling includes date-line locations and
uses the city's timezone/DST when formatting sunrise.

Verification includes grouped-order checks, manual city search/clear, denied
geolocation, timezone/date-line weeks, Samoa civil-date regression, Warsaw sunrise,
and polar night. Full tests and production build must pass before merge.

Live-payment guards and backend configuration are not changed.
