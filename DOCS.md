# Music Stuff — User Documentation

Music Stuff is a single self-contained web app (`index.html`) that reads, writes, previews, and now *generates* FL Studio project data — entirely in your browser, with no upload and no account required for the core features. This document walks through everything it can do.

---

## Table of contents

1. [The four tabs](#the-four-tabs)
2. [Converter](#converter)
3. [Generator](#generator)
4. [Showcase](#showcase)
5. [Community](#community)
6. [Editing a project before you export](#editing-a-project-before-you-export)
7. [Settings](#settings)
8. [History](#history)
9. [Exports explained](#exports-explained)
10. [Batch conversion & .zip files](#batch-conversion--zip-files)
11. [Installing as an app](#installing-as-an-app)
12. [Google Sign-In](#google-sign-in)
13. [Desktop vs. mobile](#desktop-vs-mobile)
14. [Technical notes for the curious](#technical-notes-for-the-curious)
15. [Limitations — please read this one](#limitations--please-read-this-one)
16. [Troubleshooting](#troubleshooting)

---

## The four tabs

At the top of the app, under the header, there are four tabs:

| Tab | What it's for |
|---|---|
| ⚙ **Converter** | Drop in an existing `.flp` or `.flm` file and get a full breakdown: channels, patterns, notes, mixer, effects, everything. Export it as `.mid`, `.flm`, or `.json`. |
| 🎼 **Generator** | Build a small project *from scratch* — no file needed — using the same export engine as the Converter. |
| 🔍 **Showcase** | A raw, low-level preview mode. See the file's byte structure before committing to a full parse. |
| 🌐 **Community** | An optional social feed where people can post about their conversions. Needs a server you run yourself (see the main README). |

Converter and Generator are the two main modes — one reads, one creates. Showcase and Community are secondary tools that sit alongside them.

---

## Converter

This is the main mode and the reason the app exists.

1. Drop a `.flp` (FL Studio Desktop) or `.flm` (FL Studio Mobile) file onto the drop zone, or tap it to browse your files.
2. The app parses the binary file client-side and shows you:
   - **Project info** — title, tempo, time signature, PPQ, author/genre/comment, FL version, creation date.
   - **Channels** — name, color, volume, pan, kind (Sampler/Instrument/Audio/Master/etc.), and the detected instrument plugin name where available.
   - **Patterns** — every pattern with its actual notes, shown on an interactive piano roll. Slide (portamento) notes are outlined in white.
   - **Time markers**, **Arrangement/playlist**, **Mixer** (inserts + detected effect chain), and an **Instruments & effects detected** list pulled straight from the project data.
   - Any **warnings** the parser ran into (missing data, unsupported revisions, etc.) — these are never hidden from you.
3. Use the checkboxes next to each channel and pattern to control exactly what gets included in your export. "select all" / "select none" / "hide empty" (for FLM projects with audio-only clips) are available above each list.
4. Hit **▶ Play pattern** to hear any pattern using an in-browser synth, or use the **🎧 test banner** that appears after a successful conversion to preview the busiest pattern with one tap.
5. Pick a download format (`.mid` or `.flm`) with the toggle above the download button, then hit **⬇ Download**. `.json` and (on supported browsers) **📤 Share** are also available.

### Slide notes and effects detection

Portamento/slide notes are read from the real flag bit in both formats and preserved through export — including as genuine MIDI Portamento (CC5 + CC65) in `.mid` exports, so a portamento-capable synth actually glides between them instead of playing two disconnected notes.

Instrument and effect names are decoded from the project's plugin/preset data (for `.flp`: `PLUGIN_NAME`/`INTERNAL_NAME` events; for `.flm`: the `RACK`/`PRST` chunk tree) and shown as an "Instruments & effects detected" tag list.

---

## Generator

Sometimes you don't have a file — you just want to build something small and get a real `.mid`/`.flm`/`.json` out of it. That's what the Generator tab is for.

1. Set the **project info**: title, tempo, PPQ, time signature.
2. Add one or more **channels** by typing a name and hitting **+ Add channel**.
3. Add **notes** one at a time: pick a channel, a key (60 = C5, matching FL Studio's own numbering), a position and length in beats, and a velocity. Hit **+ Add note**. Notes appear in a list below, each removable individually.
4. Hit **🎼 Generate project**. This builds a real project object and hands it to the exact same rendering and export pipeline the Converter uses — so from this point on, it behaves *exactly* like a converted file: you get the piano roll, the editable fields, the download-format toggle, everything.
5. Use **↺ Reset** to clear the form and start over.

The Generator is intentionally simple (one pattern, no automation, no effects) — it's meant for quickly sketching an idea or testing the export pipeline, not for composing a full track.

---

## Showcase

Toggle to Showcase *before* dropping a file if you want to see its raw structure first, without committing to a full parse.

- For `.flp` files: header fields, a breakdown of event counts by wire type (byte/word/dword/variable-length), a histogram of the most common event IDs, and a hex dump of the first 128 bytes.
- For `.flm` files: the same file-size/title/tempo summary, plus a **chunk tree** — every `TAG + length + payload` chunk the scanner could walk into, shown with indentation for nesting. This is genuinely useful for spotting chunk types the app doesn't decode yet (effect rack internals, mixer automation, etc.).

A **▶ Convert now** button at the bottom runs the full parse and takes you into the normal detected-project view whenever you're ready.

---

## Community

An optional, opt-in social feed. It is the *only* part of the app that talks to a network — everything else runs 100% locally.

- Browse posts, search them, like them.
- Post your own (name, title, message) — you get a one-time key that lets you delete your own post later, stored locally in your browser.
- If the configured server isn't reachable, you'll see a friendly message instead of a broken page. The Converter, Generator, and Showcase tabs never depend on this.

Setting up the server is covered in the main `README.md` (short version: `cd server && npm install && npm start`, then point `COMMUNITY_API_URL` in `index.html` at wherever you deployed it).

---

## Editing a project before you export

If something looks wrong after a conversion — a garbled title, a tempo that's clearly off, a channel name you want to clean up — you don't have to start over.

- **Title** and **Tempo** in the info-card grid are editable directly. Click into them, change the value, and it applies immediately (you'll see a small confirmation in the status bar).
- **Channel name, volume, and pan** are editable inline in the channel list — the name is a plain text field, volume and pan are small number boxes next to the channel's badges.
- Any edit you make updates the in-memory project immediately. Every export button downstream (`.mid`, `.flm`, `.json`, Share) uses the *current, edited* state — so fix it once, then export.

Editing is intentionally limited to the fields most likely to need a quick correction. Deeper editing (moving individual notes, rewriting the piano roll) isn't implemented — for that, going back into FL Studio itself is still the right tool.

---

## Settings

Tap the ⚙ icon (fixed in the top-left corner) to open Settings.

- **Language** — English or Portuguese. Auto-detected from your browser on first visit, remembered after that.
- **Theme** — Dark or Light.
- **Export overrides** — force a specific tempo and/or PPQ on export, overriding what was detected. Changing PPQ automatically rescales every note's position and length so the timing stays correct.
- **Time units** — show durations as beats or as seconds throughout the app.
- **Account** — optional Google Sign-In (see below).

---

## History

Tap the 🕘 icon to see your last few conversions. Clicking one reloads it instantly — no re-upload needed — because the original file bytes are cached locally (base64, in `localStorage`, capped at ~1.5 MB per file and 6 entries total). "Clear history" wipes it.

---

## Exports explained

| Export | What you get |
|---|---|
| **⬇ Download .mid** | All selected channels combined, each on its own MIDI channel. Good for a quick listen in any DAW. |
| **↓ .mid (per channel)** | One clean single-track MIDI file per channel — matches FL Studio Mobile's documented *Channel Menu → Import MIDI Tracks* workflow, which is the most reliable way to get notes back into the app today. |
| **⬇ Download .flm** | Uses the real, reverse-engineered FL Studio Mobile format (see [Technical notes](#technical-notes-for-the-curious)). Structurally verified, but still best-effort — some things (effect racks, chord-pad metadata) aren't reconstructed. |
| **⬇ .json** | The full parsed project as JSON — every field the app decoded, for your own scripting or debugging. |
| **📤 Share** | Uses your OS's native share sheet (where supported) instead of a direct download — handy on mobile for sending the result straight to another app. |
| **.flm lab (Variant A/B)** | Two older, superseded guesses at the `.flm` format, kept for reference. Prefer the main **⬇ Download .flm** button. |

---

## Batch conversion & .zip files

- Select or drop **more than one** `.flp`/`.flm` file and the app switches to batch mode: each one is parsed, and you get a compact list with per-item quick-export buttons plus an "open full view" link for a deep dive into any single one.
- Drop a **.zip** file and it's extracted in-browser (via JSZip) — any `.flp`/`.flm` files inside, including in subfolders, are picked up automatically. One match converts immediately; more than one runs as a batch. Non-project files in the zip are ignored.

---

## Installing as an app

This is a full PWA. On Chrome/Edge (desktop or Android) an **Install app** button appears automatically once the browser decides it's installable — tap it to get a standalone, offline-capable app icon. On iOS Safari (no one-tap install support), the button instead reminds you to use Share → Add to Home Screen.

---

## Google Sign-In

Purely cosmetic. It decodes your name/photo client-side and shows a small account badge — nothing is uploaded, there's no gating of features. It needs your own Google Cloud OAuth Client ID to actually activate (see the main README for setup steps); until configured, the sign-in area just explains that instead of showing a broken button.

---

## Desktop vs. mobile

The layout is responsive from narrow phones up through wide desktop monitors:

- Below ~400px: tighter padding, stacked fields, shorter track-name columns.
- Standard mobile/tablet: the layout you'll see most of the time.
- 900px and up: channel and community lists switch to a two-column grid, and the page gets extra top padding so the fixed Settings/History icons don't feel cramped against a mouse cursor.
- 1200px and up: the whole page widens further to make better use of large monitors.

Touch targets, tap highlighting, and iOS's input-zoom quirk are all handled specifically so the app feels native on a phone, not like a shrunk desktop page.

---

## Technical notes for the curious

- **`.flp` parsing** is based on the well-established FL Studio Desktop project format: a stream of `byte`/`word`/`dword`/variable-length events. The event-ID map was cross-checked against the [PyFLP](https://github.com/demberto/PyFLP) project.
- **`.flm` parsing and writing** is based on reverse-engineering *real* FL Studio Mobile project files (not guesswork): the file starts with an 8-byte `"10LFHEAD"` magic, followed by a recursive `TAG + 4-byte length + payload` chunk container. Notes live in 20-byte binary records inside `EVN2` chunks (position encoded as Q14 fixed-point beats, i.e. divide by 16384). Effect/instrument names live inside `RACK` → `PRST` chunks as length-prefixed path strings. This structure has been validated against four independent real `.flm` files from different projects and genres, using an exact-offset verifier (not just the app's own tolerant scanner) to confirm every chunk boundary lines up with zero bytes lost.
- Everything runs synchronously in your browser tab. There is no backend for the Converter, Generator, or Showcase tabs — only Community talks to a server, and only if you've set one up.

---

## Limitations — please read this one

- **`.flm` writing is best-effort.** The structure is verified and self-consistent, but effect racks, chord-pad/scale metadata, and some header fields are not reconstructed (they're either omitted or left at safe defaults). Whether FL Studio Mobile fully accepts a given output can vary — if you hit an issue, the per-channel `.mid` + *Import MIDI Tracks* path is the most reliable way to get notes in today.
- **Plugin/effect *processing* never carries over** — only their *names* are detected and shown. Audio itself (samples, renders) isn't extracted or converted.
- **The Community tab needs a server.** Without one configured, it will just tell you it can't connect — this is expected, not a bug.
- **Deep note editing isn't supported** — only the fields listed in [Editing a project before you export](#editing-a-project-before-you-export).

---

## Troubleshooting

- **"Only the .mid works, .flm comes out wrong/empty"** — make sure you're using the main **⬇ Download .flm** button (real format), not the "lab" Variant A/B buttons further down (older, superseded guesses).
- **A `.zip` says no files found** — the app only looks for `.flp`/`.flm` inside; everything else is ignored on purpose.
- **The Community tab won't load anything** — the API server isn't reachable. Check `COMMUNITY_API_URL` in `index.html` and confirm `server.js` is actually running.
- **The install button never shows up** — some browsers only offer PWA installation over HTTPS on a real domain (not `file://`), and only after some engagement heuristics are met. It's not required for the site to work.
- Found something genuinely broken? The warnings box in the Converter view is your friend — it tells you exactly what the parser couldn't make sense of.
