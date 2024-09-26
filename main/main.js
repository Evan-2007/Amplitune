import { app, BrowserWindow } from "electron";
import path from "path";
import serve from "electron-serve";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, "../out")
}) : null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,

    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL("app://-");
    });
  } else {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
}

app.on("ready", () => {
    createWindow();
});

app.on("window-all-closed", () => {
    if(process.platform !== "darwin"){
        app.quit();
    }
});



import { ipcMain } from 'electron';
import Store from 'electron-store';


const store = new Store();

ipcMain.handle('electron-store-get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('electron-store-set', async (event, { key, value }) => {
  store.set(key, value);
});

ipcMain.handle('electron-store-delete', async (event, key) => {
  store.delete(key);
});

ipcMain.handle('electron-store-clear', async () => {
  store.clear();
});

ipcMain.handle('electron-store-key', async (event, index) => {
  const keys = Object.keys(store.store);
  return index < keys.length ? keys[index] : null;
});

ipcMain.handle('electron-store-length', async () => {
  return Object.keys(store.store).length;
});

ipcMain.handle('close-window', async () => {
  BrowserWindow.getFocusedWindow().close();
});

ipcMain.handle('minimize-window', async () => {
  BrowserWindow.getFocusedWindow().minimize();
} );

ipcMain.handle('maximize-window', async () => {
  if (BrowserWindow.getFocusedWindow().isMaximized()) {
    BrowserWindow.getFocusedWindow().unmaximize();
  }
  else {
    BrowserWindow.getFocusedWindow().maximize();
  }
} );

ipcMain.handle('quit-app', async () => {
  app.quit();
} );

