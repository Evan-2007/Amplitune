import { app, BrowserWindow, components, ipcMain } from 'electron';
import serve from 'electron-serve';
import path from 'path';

const __dirname = path.resolve(path.dirname(''));

const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, '../out'),
    })
  : null;

let mainWindow = null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      //webSecurity: false,
    },
  });

  mainWindow = win;

  win.setMenuBarVisibility(false);

  // Listen for fullscreen events and notify renderer
  win.on('enter-full-screen', () => {
    win.webContents.send('window-fullscreen-changed', true);
  });

  win.on('leave-full-screen', () => {
    win.webContents.send('window-fullscreen-changed', false);
  });

  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL('app://-');
    });
  } else {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
    win.webContents.on('did-fail-load', (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
};

app.whenReady().then(async () => {
  await components.whenReady();
  console.log('components ready:', components.status());
  createWindow();

  // IPC handlers for window fullscreen control
  ipcMain.on('window-fullscreen-enter', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(true);
    }
  });

  ipcMain.on('window-fullscreen-exit', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(false);
    }
  });

  ipcMain.on('window-fullscreen-toggle', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  ipcMain.on('window-fullscreen-query', (event) => {
    if (mainWindow) {
      event.reply('window-fullscreen-query-reply', mainWindow.isFullScreen());
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
