const { contextBridge, ipcRenderer } = require('electron');

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  readDirectory: (folderPath: string) => Promise<FileItem[]>;
  readFile: (filePath: string) => Promise<string>;
  getFileBuffer: (filePath: string) => Promise<string>;
  fileExists: (filePath: string) => Promise<boolean>;
  storeApiKey: (apiKey: string) => Promise<boolean>;
  getApiKey: () => Promise<string | null>;
  storeBaseUrl: (baseUrl: string) => Promise<boolean>;
  getBaseUrl: () => Promise<string | null>;
  storeModelName: (modelName: string) => Promise<boolean>;
  getModelName: () => Promise<string | null>;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  extension: string;
  size: number;
}

const electronAPI: ElectronAPI = {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readDirectory: (folderPath: string) => ipcRenderer.invoke('read-directory', folderPath),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  getFileBuffer: (filePath: string) => ipcRenderer.invoke('get-file-buffer', filePath),
  fileExists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),
  storeApiKey: (apiKey: string) => ipcRenderer.invoke('store-api-key', apiKey),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  storeBaseUrl: (baseUrl: string) => ipcRenderer.invoke('store-base-url', baseUrl),
  getBaseUrl: () => ipcRenderer.invoke('get-base-url'),
  storeModelName: (modelName: string) => ipcRenderer.invoke('store-model-name', modelName),
  getModelName: () => ipcRenderer.invoke('get-model-name'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}