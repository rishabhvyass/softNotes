# SoftNotes

A personal, offline-first notes app inspired by the supplied UI-animation video.
React Native CLI (not Expo), Reanimated 4, and a Bun + SQLite API. The app remains
usable without the server; sync is optional.

## What is implemented

- Layered folder home, pastel glass-like icons, floating Home/Saved dock, tactile
  press/release springs, icon picker, writer, and paper-to-folder save motion.
- Create/edit notes, comma-separated tags, full-text filtering, favorites,
  archive/unarchive, recoverable trash, and confirmed permanent deletion.
- Local persistence, automatic compose-draft recovery, serialized storage writes,
  and sync that preserves edits made while a request is in flight.
- Server deletion records prevent offline devices from resurrecting permanently
  deleted notes. Conflicts use latest `updatedAt` (not collaborative text merging).
- Light/dark/system theme, haptic preferences, reduced-motion support, JSON backup
  sharing and validated non-destructive import.
- Token-protected server access and continuous type/lint/test checks on GitHub.

The supplied video is the visual reference, not a functional specification for
features outside notes. Pixel-for-pixel equivalence and real-device frame-rate
benchmarks are not claimed. There are no attachments, rich-text editing, accounts,
public cloud hosting, or end-to-end encryption in this version.

## Location and structure

Current local project: `/Users/rishabvyas/Desktop/SoftNotes`.
Repository: <https://github.com/rishabhvyass/softNotes>.

```text
apps/mobile/       React Native iOS/Android application
apps/api/          Bun HTTP API and SQLite repository
apps/api/data/     Local runtime database (ignored by Git)
work/             Local reference analysis and build logs (ignored)
outputs/          Local screenshots/build artifacts (ignored)
```

## Install

Use Node 22.11+ (CI uses Node 24), Bun 1.3+, Xcode and CocoaPods for iOS,
and JDK 17 plus the Android SDK for Android. This React Native template requests
Android compile SDK 37, Build Tools 37.0.0, and NDK 27.1.12297006.

```sh
cd /Users/rishabvyas/Desktop/SoftNotes
npm --prefix apps/mobile ci
cd apps/api
bun install --frozen-lockfile
cd ../mobile/ios
pod install
cd ../../..
```

Native dependencies are locked in `package-lock.json`, `bun.lock`, and
`Podfile.lock`. Re-run `pod install` after adding native dependencies or moving
the checkout. The generated `SoftNotes.xcworkspace` is the iOS entry point.

## Run on this Mac

Use separate terminals from the project root:

```sh
# Terminal 1: optional local sync server, port 4000
bun run api

# Terminal 2: this app's Metro server, port 8088
npm run mobile:start

# Terminal 3: native application
npm run mobile:ios
# or
npm run mobile:android
```

Metro uses 8088 to avoid interfering with other React Native apps on 8081.
iOS simulators use `localhost:8088` in Debug. Override the host with the
`SOFTNOTES_METRO_HOST` launch environment variable if needed. Android CLI receives
the same port. Do not point this app at another project's Metro server.

Default API address: iOS `http://127.0.0.1:4000`; Android emulator
`http://10.0.2.2:4000`. Open **Saved → Settings** to change it or sync manually.

For a direct Android debug build:

```sh
cd apps/mobile/android
./gradlew :app:assembleDebug -PreactNativeDevServerPort=8088
```

The APK is under `apps/mobile/android/app/build/outputs/apk/debug/`.
Debug builds require Metro. Release signing and distribution to a physical phone
are separate setup steps; the template debug signing configuration is not for
publishing to a store.

## Sync from a physical phone

1. Keep the Mac and phone on the same trusted local network.
2. Generate a long random token, store it in a local `.env` file, and set
   `HOST=0.0.0.0`. The server refuses non-loopback binding without `API_TOKEN`.
3. In **Saved → Settings**, enter `http://YOUR_MAC_LAN_IP:4000` and the matching
   token. The simulator loopback addresses do not point at your Mac from a phone.
4. For an iPhone Debug build, configure the React Native development server to
   `YOUR_MAC_LAN_IP:8088` in the developer menu; choose your signing team in Xcode.
5. Use HTTPS through a separately configured trusted reverse proxy for any sync
   beyond local development. Android release builds disallow cleartext traffic.

The API is single-user. Do not expose an unauthenticated server to the internet.
Tokens and local notes are stored in ordinary device app storage, not an
encrypted vault. Local HTTP and JSON backups are not encrypted. Tokens and
server settings are excluded from exported backups. No telemetry is added.

## Data and backup

New installs start with three sample notes. Existing local data is preserved.
Edits are persisted locally first. A compose draft is retained when closing the
writer and is resumed the next time you tap plus. Saving clears that draft.
For existing-note edits, leaving offers Save & leave / Discard / Keep editing.

**Saved → Settings → Backup & restore** shares the full library as JSON text.
Copy it from the native share sheet or send it to your own private storage.
Restore by pasting that JSON. Imports validate every note before modifying the
library, merge by ID, keep newer local copies, and respect pending deletions.
This is a text-sharing workflow, not a native file picker.

If a local snapshot becomes unreadable, its original text is preserved and a
recovery notice is shown; it is not silently discarded. Backup & restore then
offers a raw recovery export for repair. Unlike regular backups, this raw snapshot
can include server settings and the API token. Do not send it to other people or
uninstall the app before recovering it. Recovery snapshots require repair before
they can be imported as a regular version 1 backup.

The server database defaults to `apps/api/data/soft-notes.sqlite`. To back it up,
use SQLite's backup command rather than copying only the main file while WAL is
active:

```sh
sqlite3 apps/api/data/soft-notes.sqlite ".backup '/absolute/private/path/softnotes-backup.sqlite'"
```

`GET /api/export` returns the server's library (include the Bearer token when
configured). Local-only, unsynced notes are available through the app's export,
not the server export. Permanently deleting a note removes its content from the
active database but keeps its ID for sync. Existing backups/WAL pages may retain
old content; this is not a secure-erasure guarantee.

Device clocks matter for last-write-wins conflicts. Multi-device text edits are
not automatically merged. The API and app should be upgraded together because
the sync endpoint includes deletion records.

## Checks and API

```sh
npm run check
```

This runs both TypeScript checks, mobile ESLint, Bun API tests, and React Native
tests. Native iOS/Android compilation is separate from this unit-test workflow.
The GitHub workflow uses pinned official action revisions, with read-only repo
permissions.

API routes:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Local readiness |
| GET | `/api/notes?scope=active&q=text` | List/filter notes |
| POST | `/api/notes` | Create/upsert a note |
| GET/PATCH/DELETE | `/api/notes/:id` | Read/edit/soft-trash |
| DELETE | `/api/notes/:id?permanent=true` | Idempotent permanent deletion |
| POST | `/api/notes/:id/restore` | Restore from archive/trash |
| GET | `/api/sync` | All notes and permanent deletion IDs |
| GET | `/api/export` | Server-side JSON export |

Reference documentation: [React Native](https://reactnative.dev/docs/environment-setup),
[Reanimated](https://docs.swmansion.com/react-native-reanimated/),
[Bun](https://bun.com/docs), and [official Bun CI setup](https://github.com/oven-sh/setup-bun).
