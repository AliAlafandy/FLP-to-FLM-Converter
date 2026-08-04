const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const APP_NAME = 'Music Stuff';
const BACKGROUND_COLOR = '#07040F';

function resolveIndexHtml() {
  // In a packaged build, the web app ships under process.resourcesPath/app
  // (see extraResources in project.js). During development it's just the
  // sibling index.html one directory up from this file.
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app', 'index.html');
  }
  return path.join(__dirname, '..', 'index.html');
}

function resolveAppIcon() {
  return path.join(__dirname, 'build', 'icon.png');
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    minWidth: 480,
    minHeight: 640,
    backgroundColor: BACKGROUND_COLOR,
    title: APP_NAME,
    icon: resolveAppIcon(),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(resolveIndexHtml());

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Any link the page tries to open in a new window/tab (e.g. GitHub links
  // in the footer, "Add your own Google Client ID" docs, etc.) opens in the
  // user's real browser instead of a second Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
