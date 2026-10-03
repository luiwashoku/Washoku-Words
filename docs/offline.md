# Offline lesson downloads

Publish `sw.js`, `offline.js`, the updated app/index/styles, and all existing data,
assets and audio files together over HTTPS. Open the updated app online in Safari,
then add it to the Home Screen. The first visit saves the app shell and catalog.

Each lesson has a Download for offline button. Keep the app open until it says
Available offline. This saves lesson data, its referenced images, and its recorded
audio. Game downloads also include vocabulary examples and the Money Cat assets.
Remove download deletes that lesson's local copy without changing study progress.

Downloads are separate from ordinary browser caching. A completion marker is
written only after all files succeed; failed partial downloads are deleted. The
service worker ignores incomplete downloads. Audio range requests are answered
from the saved full recording, including suffix ranges used by media players.

The site must run over HTTPS (localhost is allowed for development). Storage can
be cleared by the user or browser. Saved status is read from Cache Storage rather
than localStorage, so removed cache entries do not leave a false saved indicator.
Undownloaded lessons and recordings still require an internet connection.

## iPhone acceptance check

1. Open the published update online and download a small lesson, such as page83.
2. Wait for Available offline, close the app, enable airplane mode, and reopen it.
3. Open that lesson, view its diagram, and play question, choice and explanation audio.
4. Download the listening word game online, then test Money Cat and vocabulary audio offline.
5. Remove a lesson download and confirm its saved indicator disappears; study progress remains.
6. Interrupt a download or disconnect the network; confirm no Available offline indicator
   appears and retry succeeds after reconnecting.

Local checks: JavaScript parsing, existing Money Cat tests, shell-file existence,
and catalog/lesson asset-reference validation. Real Safari storage and audio
playback require the device acceptance check above.
