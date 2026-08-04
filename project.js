/**
 * project.js
 *
 * App/build information for packaging Music Stuff as a native desktop app
 * on Windows, macOS, and Linux, using electron-builder.
 *
 * This file IS the electron-builder config (loaded via `-c project.js` /
 * `--config project.js`), so editing app name, icons, or build targets
 * only needs to happen in one place.
 *
 * Docs: https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.brenninho.musicstuff',
  productName: 'Music Stuff',
  copyright: `Copyright (C) ${new Date().getFullYear()} Brenninho`,

  directories: {
    output: 'dist',
    buildResources: 'build',
  },

  // Everything the packaged app needs: the Electron main process files
  // plus the actual web app (index.html + PWA assets) one level up.
  files: [
    'main.js',
    'package.json',
    '!**/node_modules/**',
  ],
  extraResources: [
    { from: '../index.html', to: 'app/index.html' },
    { from: '../manifest.json', to: 'app/manifest.json' },
    { from: '../sw.js', to: 'app/sw.js' },
    { from: '../icons', to: 'app/icons' },
  ],

  win: {
    target: [
      { target: 'nsis', arch: ['x64', 'arm64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    icon: 'build/icon.png',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Music Stuff',
  },

  mac: {
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    icon: 'build/icon.png',
    category: 'public.app-category.music',
    darkModeSupport: true,
  },

  linux: {
    target: ['AppImage', 'deb', 'rpm'],
    icon: 'build/icon.png',
    category: 'Audio',
    synopsis: 'FLP/FLM converter & generator for FL Studio Desktop and Mobile',
  },

  // electron-builder auto-generates .ico (Windows) and .icns (macOS) from a
  // single large PNG (ideally 1024x1024, provided at build/icon.png) — no
  // need to hand-craft per-platform icon files.
};
