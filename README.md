# FLP → FLM Converter

Literally an FLP to FLM file converter — a feature many people have been requesting.

A single-file, client-side tool that reads FL Studio Desktop project files (`.flp`), reconstructs their internal structure, and lets you export that data as MIDI, JSON, or an experimental `.flm` file for FL Studio Mobile. No install, no backend, no upload — everything runs in the browser tab.

**Live logic, zero setup.** Open `index.html`, drop a file, done.

---

## Why this exists

FL Studio Mobile can import MIDI, but it has no supported way to open a desktop `.flp` project. This tool bridges that gap as far as it can be bridged without an official spec:

- It **parses** the binary `.flp` event stream into a readable project model (title, tempo, channels, patterns, notes, arrangements, mixer, automation, time markers).
- It **exports** that model as standard MIDI (which FL Studio Mobile *can* import via its Channel Menu → *Import MIDI Tracks* feature).
- It also **attempts** to write a `.flm` file directly. This part is explicitly a guess — Image-Line has never published the FL Studio Mobile format, and the app was rewritten from scratch around version 3, so there may be more than one incompatible `.flm` format across releases. Two structurally different variants are offered so you can test which (if either) your version of FL Studio Mobile accepts.

Everything is labeled **best-effort**. Nothing here claims to be a verified, lossless converter.

## Features

### Converter mode
Drop a file and get an immediate breakdown:

- **Project info** — title, tempo, time signature, PPQ, author/genre/comment, FL version string, created/time-spent timestamps, loop and pan-law flags.
- **Channels** — name, color, volume, pan, enabled state, and kind (Sampler / Native / Layer / Instrument / Automation), plus channel-level extras (root note, fine tune, reverb, group, sample path) when present.
- **Patterns** — name, color, and a real note list per pattern (position, length, key, velocity, pan, fine pitch, release) rendered as an interactive piano roll.
- **Arrangements & playlist** — every arrangement's tracks, with pattern blocks / audio clips placed on a proportional timeline per track.
- **Mixer** — inserts with name, color, icon, routing, and (where available) volume/pan decoded from the global mixer-parameters block, plus the detected effect chain (plugin names per slot) when present.
- **Instruments & effects** — the generator plugin on each channel (e.g. "Sytrus", "FLEX") and the effect plugins on each mixer insert are decoded from the project and shown as labels — useful context even though the actual plugin processing can never carry over to MIDI/FLM.
- **Slide notes** — portamento notes are read from the real flag bit (not just guessed), preserved on `.flm` export, and exported to `.mid` as real MIDI Portamento (CC5 + CC65) so a portamento-capable synth actually glides between them instead of playing two disconnected notes.
- **Time markers** — tempo/signature markers with position and name.
- **Automation** — automation-type channels get their point curve (position, value, tension) decoded.

### Showcase mode
Toggle to **🔍 Showcase** before dropping a file to preview the *raw* structure first:

- File size, header fields (format, PPQ, header channel count)
- Event counts broken down by wire type (byte / word / dword / variable-length)
- A histogram of the most frequent event IDs, resolved to their known names where possible
- A hex dump of the first 128 bytes

A **▶ Convert now** button then runs the same full parse used by Converter mode, so you can inspect before committing.

### Exports
- **Download format toggle** — a `.mid` / `.flm` switch above the main download button picks what the primary "⬇ Download" and "📤 Share" buttons produce, so you don't have to dig into the lab section for a quick `.flm`.
- **Per-channel `.mid`** — one clean single-track MIDI file per channel, matching the documented *Channel Menu → Import MIDI Tracks* workflow in FL Studio Mobile.
- **Combined `.mid`** — every channel on its own MIDI channel in one file, useful for a quick listen in any DAW.
- **`.analysis.json`** — the full parsed project model, for scripting or debugging.
- **`.flm` (Variant A — FLP container)** — reuses FL Studio's own `FLhd`/`FLdt` event-chunk format under a `.flm` extension, including reconstructed tracks, playlist, inserts, and time markers.
- **`.flm` (Variant B — JSON envelope)** — a 4-byte tag plus a length-prefixed JSON blob, a guess at what a from-scratch v3+ rewrite might use.

If you test either `.flm` variant against a real device, feedback on what happens is genuinely useful — this is the one part of the tool nobody can currently verify from the outside.

## Supported FLP versions

The parser targets the common event layout used from **FL Studio 10 through the current 25 / 2026 releases** (Image-Line moved to year-based version numbers in 2025). It degrades gracefully on older or unusual files: unrecognized or malformed events are skipped individually (with a warning) rather than aborting the whole parse, so a handful of unknown events won't leave you with nothing. Playlist items auto-detect the pre-FL21 (32-byte) vs FL21+ (60-byte) struct size.

## Reading real .flm files

This tool can also open genuine FL Studio Mobile project files (not just desktop `.flp`), based on reverse-engineering an actual sample: the `10LFHEAD` magic header, its recursive `TAG+length+payload` chunk container, and the exact 20-byte note-event layout inside each clip (position, length, key, velocity, release). Drop a `.flm` file the same way as a `.flp` — Showcase mode shows the raw chunk tree for it. Writing a fully valid `.flm` (the reverse direction) is not solved yet — see "What's not covered" below.

## What's *not* covered

- Actual plugin/instrument state (VST parameters, synth presets) — only the channel rack shell (volume, pan, name, color, type) is read.
- Audio sample data itself — sample *paths* are read where present, but the raw audio isn't extracted or re-encoded.
- A verified `.flm` write path — see the disclaimer above.
- Full mixer EQ/effect chains — inserts expose routing/volume/pan; per-slot effect plugin data is not parsed.

## Usage

1. Open `index.html` in any modern desktop or mobile browser.
2. Pick **Converter** (parse immediately) or **Showcase** (preview raw structure first).
3. Drop a `.flp` file onto the drop zone, or tap it to browse.
4. Review the detected project data.
5. Download whichever export you need — per-channel `.mid` is the safest bet for actually getting notes into FL Studio Mobile today.

No server, no network request, no account. The file never leaves your device.

## Google Sign-In (optional)

There's an optional "Sign in with Google" button in Settings → Account. It's purely cosmetic — it decodes your name/email/photo client-side (via [Google Identity Services](https://developers.google.com/identity/gsi/web)) to show a small account badge, and stores that locally in the browser. **Nothing is uploaded anywhere; there's no server, no Drive access, no gating of features.**

It ships with a placeholder and does nothing until you configure your own OAuth Client ID:

1. Go to the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials) and create (or pick) a project.
2. Create an **OAuth 2.0 Client ID** of type **Web application**.
3. Under **Authorized JavaScript origins**, add the exact origin(s) you'll host the site on (e.g. `https://yourname.github.io` — no path, no trailing slash). `http://localhost:PORT` works too for local testing, but `file://` does not; Google Identity Services requires a real HTTP(S) origin.
4. Copy the generated Client ID (ends in `.apps.googleusercontent.com`).
5. In `index.html`, find the line near the top of the `<script>` block:
   ```js
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';
   ```
   and replace it with your own Client ID.

Until you do that, the sign-in area just shows a note pointing back here instead of a broken button.

## Installing as an app

This is a full [PWA](https://web.dev/progressive-web-apps/) — you can install it like a native app instead of just bookmarking it.

- **Android / desktop Chrome, Edge:** an **📲 Install app** button appears automatically once the browser decides it's installable. Tap it, confirm, and it launches full-screen from your home screen / app list — no browser chrome, works offline after the first load.
- **iOS Safari:** doesn't support one-tap install, so the button instead reminds you to use Share → **Add to Home Screen**.
- **Offline:** a service worker (`sw.js`) caches the app shell on first visit, so it keeps working with no connection after that.

To deploy it yourself (e.g. GitHub Pages):
1. Rename `FLP-to-FLM-Converter.html` to `index.html` at the repo root (the manifest's `start_url` expects that).
2. Keep `manifest.json`, `sw.js`, and the `icons/` folder alongside it at the same level.
3. Serve over HTTPS — service workers and install prompts require it (GitHub Pages does this automatically).

## Technical notes

- Written in vanilla HTML/CSS/JS — no build step, no dependencies.
- The event-ID map was cross-referenced against the [PyFLP](https://github.com/demberto/PyFLP) project's reverse-engineered format reference to keep offsets accurate (channel, pattern, arrangement, track, mixer, insert, plugin, and time-marker event IDs).
- Note structs are the standard 24-byte layout (`position`, `length`, `key`, `velocity`, `pan`, `release`, `fine pitch`, `group`, `MIDI channel`, `rack channel`).
- Playlist items are read as either the 32-byte (pre-FL 21) or 60-byte (FL 21+) struct, auto-detected from the block size.
- Text events are decoded as UTF-16LE when the byte pattern matches, falling back to UTF-8 and then Latin-1.

## License

Apache 2.0.

## Repository

github.com/Brenninho123/FLP-to-FLM-Converter
