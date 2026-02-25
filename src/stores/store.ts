import { create } from 'zustand';

export interface FileNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  extension: string;
  size: number;
  children?: FileNode[];
  expanded?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Store {
  // File tree
  folderPath: string | null;
  files: FileNode[];
  selectedFile: string | null;
  fileTreeCollapsed: boolean;

  // PDF viewer
  pdfFile: string | null;
  pdfBuffer: string | null;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  pdfViewerCollapsed: boolean;

  // Chat
  messages: Message[];
  isTyping: boolean;
  currentPdfName: string | null;

  // OpenAI config
  apiKey: string | null;
  baseUrl: string;
  modelName: string;

  // Actions
  setFolderPath: (path: string) => void;
  setFiles: (files: FileNode[]) => void;
  toggleFolder: (path: string) => void;
  selectFile: (file: string) => void;
  loadPdf: (file: string, buffer: string) => void;
  setPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setZoom: (zoom: number) => void;
  next: () => void;
  prev: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setIsTyping: (typing: boolean) => void;
  setApiKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setModelName: (name: string) => void;
  resetPdf: () => void;
  toggleFileTreeCollapse: () => void;
  togglePdfViewerCollapse: () => void;
}

const initialZoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2];
const defaultZoomIndex = 2; // 1.0

export const useStore = create<Store>((set) => ({
  // Initial state
  folderPath: null,
  files: [],
  selectedFile: null,
  fileTreeCollapsed: false,
  pdfFile: null,
  pdfBuffer: null,
  currentPage: 1,
  totalPages: 0,
  zoomLevel: initialZoomLevels[defaultZoomIndex],
  pdfViewerCollapsed: false,
  messages: [],
  isTyping: false,
  currentPdfName: null,
  apiKey: null,
  baseUrl: 'https://api.openai.com/v1',
  modelName: 'gpt-4o-mini',

  // Actions
  setFolderPath: (path) => set({ folderPath: path }),

  setFiles: (files) => set({ files }),

  toggleFolder: (path) =>
    set((state) => {
      const toggleNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            return { ...node, expanded: !node.expanded };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });
      };
      return { files: toggleNode(state.files) };
    }),

  selectFile: (file) =>
    set({
      selectedFile: file,
      currentPdfName: file.split('/').pop() || null,
    }),

  loadPdf: (file, buffer) =>
    set({
      pdfFile: file,
      pdfBuffer: buffer,
      currentPage: 1,
      totalPages: 0,
      currentPdfName: file.split('/').pop() || null,
      messages: [], // Clear messages when loading a new PDF
    }),

  setPage: (page) => set({ currentPage: page }),

  setTotalPages: (total) => set({ totalPages: total }),

  setZoom: (zoom) => set({ zoomLevel: zoom }),

  next: () =>
    set((state) => ({
      currentPage: Math.min(state.currentPage + 1, state.totalPages),
    })),

  prev: () =>
    set((state) => ({
      currentPage: Math.max(state.currentPage - 1, 1),
    })),

  zoomIn: () =>
    set((state) => {
      const currentIndex = initialZoomLevels.indexOf(state.zoomLevel);
      const newIndex = Math.min(currentIndex + 1, initialZoomLevels.length - 1);
      return { zoomLevel: initialZoomLevels[newIndex] };
    }),

  zoomOut: () =>
    set((state) => {
      const currentIndex = initialZoomLevels.indexOf(state.zoomLevel);
      const newIndex = Math.max(currentIndex - 1, 0);
      return { zoomLevel: initialZoomLevels[newIndex] };
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),

  setIsTyping: (typing) => set({ isTyping: typing }),

  setApiKey: (key) => set({ apiKey: key }),

  setBaseUrl: (url) => set({ baseUrl: url }),

  setModelName: (name) => set({ modelName: name }),

  resetPdf: () =>
    set({
      pdfFile: null,
      pdfBuffer: null,
      currentPage: 1,
      totalPages: 0,
      currentPdfName: null,
    }),

  toggleFileTreeCollapse: () =>
    set((state) => ({ fileTreeCollapsed: !state.fileTreeCollapsed })),

  togglePdfViewerCollapse: () =>
    set((state) => ({ pdfViewerCollapsed: !state.pdfViewerCollapsed })),
}));