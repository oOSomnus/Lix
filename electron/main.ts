import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1551,
    height: 908,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('read-directory', async (_, folderPath: string) => {
  try {
    const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
    const result = [];

    for (const file of files) {
      const filePath = path.join(folderPath, file.name);
      const stats = await fs.promises.stat(filePath);

      result.push({
        name: file.name,
        path: filePath,
        type: file.isDirectory() ? 'folder' : 'file',
        extension: file.isFile() ? path.extname(file.name).toLowerCase() : '',
        size: stats.size,
      });
    }

    return result;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('get-file-buffer', async (_, filePath: string) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const base64 = buffer.toString('base64');
    return base64;
  } catch (error) {
    console.error('Error reading file buffer:', error);
    throw error;
  }
});

ipcMain.handle('file-exists', async (_, filePath: string) => {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('store-api-key', async (_, apiKey: string) => {
  // In a real app, you might want to encrypt this
  // For now, we'll store it in a simple config file
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    let config: Record<string, string> = {};
    if (await fs.promises.access(configPath).then(() => true).catch(() => false)) {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    }
    config.apiKey = apiKey;
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error storing API key:', error);
    return false;
  }
});

ipcMain.handle('get-api-key', async () => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    if (await fs.promises.access(configPath).then(() => true).catch(() => false)) {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.apiKey || null;
    }
  } catch (error) {
    console.error('Error getting API key:', error);
  }
  return null;
});