import { useEffect, useRef, useState } from 'react';
import { FileTree } from './components/sidebar/FileTree';
import { PdfViewer } from './components/pdf-viewer/PdfViewer';
import { ChatPanel } from './components/chat/ChatPanel';
import { useStore } from './stores/store';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

// Build file tree from flat file list
const buildFileTree = (files: any[], basePath: string): any[] => {
  const root: any[] = [];

  // Group files by parent directories
  const structure: Record<string, any> = {};

  files.forEach((file) => {
    const relativePath = file.path.replace(basePath, '').replace(/^\//, '');
    const parts = relativePath.split('/');

    if (parts.length === 1) {
      // Direct child
      root.push({
        ...file,
        expanded: false,
      });
    } else {
      // Nested in folder
      let current = structure;
      parts.forEach((part: string, index: number) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? file.type : 'folder',
            extension: index === parts.length - 1 ? file.extension : '',
            size: index === parts.length - 1 ? file.size : 0,
            children: [],
            expanded: false,
          };
          if (index === parts.length - 1) {
            current[part] = {
              ...current[part],
              ...file,
            };
          }
        }
        if (index < parts.length - 1 && !current[part].children) {
          current[part].children = {};
        }
        current = index < parts.length - 1 ? current[part].children : root;
      });
    }
  });

  // Sort: folders first, then files alphabetically
  const sortNodes = (nodes: any[]): any[] => {
    return nodes.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  };

  return sortNodes(root);
};

function App() {
  const {
    setFiles,
    selectedFile,
    loadPdf,
    setApiKey,
    setBaseUrl,
    setModelName,
    fileTreeCollapsed,
    pdfViewerCollapsed,
    fileTreeWidth,
    pdfViewerWidth,
    toggleFileTreeCollapse,
    togglePdfViewerCollapse,
    setFileTreeWidth,
    setPdfViewerWidth,
  } = useStore();

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoCollapsedLeft = useRef(false);
  const autoCollapsedRight = useRef(false);

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (window.electronAPI) {
        const key = await window.electronAPI.getApiKey();
        if (key) {
          setApiKey(key);
        }
        const baseUrl = await window.electronAPI.getBaseUrl();
        if (baseUrl) {
          setBaseUrl(baseUrl);
        }
        const modelName = await window.electronAPI.getModelName();
        if (modelName) {
          setModelName(modelName);
        }
      } else {
        // Web mode: load from localStorage
        const key = localStorage.getItem('apiKey');
        if (key) {
          setApiKey(key);
        }
        const baseUrl = localStorage.getItem('baseUrl');
        if (baseUrl) {
          setBaseUrl(baseUrl);
        }
        const modelName = localStorage.getItem('modelName');
        if (modelName) {
          setModelName(modelName);
        }
      }
    };
    loadConfig();
  }, [setApiKey, setBaseUrl, setModelName]);

  // Store for web file handles
  const webDirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const webFileHandleRef = useRef<FileSystemFileHandle | null>(null);

  // Helper to recursively read directory handles (web mode)
  const readDirectoryHandle = async (dirHandle: any, path: string = ''): Promise<any[]> => {
    const files: any[] = [];
    // Use the async iterator with proper types
    for await (const [name, entry] of dirHandle as AsyncIterable<[string, any]>) {
      const entryPath = path ? `${path}/${name}` : name;
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const extension = name.includes('.') ? '.' + name.split('.').pop()?.toLowerCase() : '';
        files.push({
          name,
          path: entryPath,
          type: 'file',
          extension,
          size: file.size,
        });
      } else if (entry.kind === 'directory') {
        const children = await readDirectoryHandle(entry, entryPath);
        files.push(...children);
      }
    }
    return files;
  };

  // Helper to navigate to a file using the stored directory handle
  const navigateToFile = async (filePath: string): Promise<FileSystemFileHandle | null> => {
    if (!webDirHandleRef.current) return null;

    const parts = filePath.split('/');
    let currentHandle = webDirHandleRef.current;

    try {
      for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
      }
      return await currentHandle.getFileHandle(parts[parts.length - 1]);
    } catch (error) {
      console.error('Error navigating to file:', error);
      return null;
    }
  };

  const handleOpenFolder = async () => {
    try {
      if (window.electronAPI) {
        // Electron mode
        const path = await window.electronAPI.selectFolder();
        if (path) {
          const fileItems = await window.electronAPI.readDirectory(path);
          const tree = buildFileTree(fileItems, path);
          setFiles(tree);
        }
      } else {
        // Web mode: use File System Access API
        const dirHandle = await (window as any).showDirectoryPicker();
        webDirHandleRef.current = dirHandle;
        const fileItems = await readDirectoryHandle(dirHandle);
        const tree = buildFileTree(fileItems, '');
        setFiles(tree);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error opening folder:', error);
      }
    }
  };

  const handleSelectFile = async (filePath: string) => {
    if (!window.electronAPI && webDirHandleRef.current) {
      const fileHandle = await navigateToFile(filePath);
      if (fileHandle) {
        webFileHandleRef.current = fileHandle;
      }
    }
  };

  // Override selectFile in store to handle web mode
  useEffect(() => {
    const originalSelectFile = useStore.getState().selectFile;
    const wrappedSelectFile = (filePath: string) => {
      originalSelectFile(filePath);
      if (!window.electronAPI) {
        handleSelectFile(filePath);
      }
    };
    useStore.setState({ selectFile: wrappedSelectFile });
  }, []);

  // Load PDF when file is selected
  useEffect(() => {
    if (selectedFile && selectedFile.endsWith('.pdf')) {
      const loadPdfContent = async () => {
        try {
          let buffer: string;
          if (window.electronAPI) {
            // Electron mode
            buffer = await window.electronAPI.getFileBuffer(selectedFile);
          } else if (webFileHandleRef.current) {
            // Web mode: use File System Access API
            const file = await webFileHandleRef.current.getFile();
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
            buffer = btoa(binaryString);
          } else {
            return;
          }
          loadPdf(selectedFile, buffer);
        } catch (error) {
          console.error('Error loading PDF:', error);
        }
      };
      loadPdfContent();
    }
  }, [selectedFile, loadPdf]);

  // Resize handlers
  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    if (!isResizingLeft && !isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const minCenterWidth = 360;

      if (isResizingLeft) {
        const rightWidth = pdfViewerCollapsed ? 0 : pdfViewerWidth + 4;
        const maxLeft = Math.max(220, containerRect.width - rightWidth - minCenterWidth);
        const newWidth = Math.max(180, Math.min(maxLeft, e.clientX - containerRect.left));
        setFileTreeWidth(newWidth);
      } else if (isResizingRight) {
        const leftWidth = fileTreeCollapsed ? 0 : fileTreeWidth + 1;
        const maxRight = Math.max(320, containerRect.width - leftWidth - minCenterWidth);
        const newPdfWidth = Math.max(320, Math.min(maxRight, containerRect.right - e.clientX));
        setPdfViewerWidth(newPdfWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    fileTreeCollapsed,
    fileTreeWidth,
    isResizingLeft,
    isResizingRight,
    pdfViewerCollapsed,
    pdfViewerWidth,
    setFileTreeWidth,
    setPdfViewerWidth,
  ]);

  useEffect(() => {
    const syncResponsiveCollapse = () => {
      const width = window.innerWidth;
      const shouldCollapseRight = width < 1024;
      const shouldCollapseLeft = width < 768;

      if (shouldCollapseRight && !pdfViewerCollapsed) {
        togglePdfViewerCollapse();
        autoCollapsedRight.current = true;
      } else if (!shouldCollapseRight && autoCollapsedRight.current && pdfViewerCollapsed) {
        togglePdfViewerCollapse();
        autoCollapsedRight.current = false;
      }

      if (shouldCollapseLeft && !fileTreeCollapsed) {
        toggleFileTreeCollapse();
        autoCollapsedLeft.current = true;
      } else if (!shouldCollapseLeft && autoCollapsedLeft.current && fileTreeCollapsed) {
        toggleFileTreeCollapse();
        autoCollapsedLeft.current = false;
      }
    };

    syncResponsiveCollapse();
    window.addEventListener('resize', syncResponsiveCollapse);

    return () => {
      window.removeEventListener('resize', syncResponsiveCollapse);
    };
  }, [
    fileTreeCollapsed,
    pdfViewerCollapsed,
    toggleFileTreeCollapse,
    togglePdfViewerCollapse,
  ]);

  return (
    <div ref={containerRef} className="flex h-screen w-screen bg-white overflow-hidden relative">
      {/* Left Sidebar - File Tree (resizable) */}
      {!fileTreeCollapsed ? (
        <>
          <div
            className="flex-shrink-0 bg-[#0a0a0a] border-r border-[#262626] flex flex-col"
            style={{ width: `${fileTreeWidth}px` }}
          >
            <FileTree onOpenFolder={handleOpenFolder} />
          </div>
          {/* Resize handle */}
          <div
            data-separator="left"
            onMouseDown={handleMouseDownLeft}
            className="w-px bg-[#262626] hover:bg-[#404040] cursor-col-resize transition-colors group relative flex-shrink-0"
          >
            {/* Collapse button */}
            <button
              onClick={toggleFileTreeCollapse}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a0a0a] rounded-lg shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-[#171717] z-10 transition-all opacity-0 group-hover:opacity-100"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-white" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            data-separator="left"
            className="w-px bg-[#262626] hover:bg-[#404040] cursor-col-resize transition-colors group relative flex-shrink-0"
          >
            <button
              onClick={toggleFileTreeCollapse}
              className="absolute left-1/2 top-6 -translate-x-1/2 w-9 h-9 bg-[#0a0a0a] rounded-lg shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-[#171717] z-10 transition-all"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-white" />
            </button>
          </div>
        </>
      )}

      {/* Middle Panel - Chat */}
      <div
        data-chat-panel
        className="flex flex-col bg-white relative flex-1 min-w-[280px]"
      >
        <ChatPanel />
        {/* PDF expand button (shown when PDF is collapsed) */}
        {pdfViewerCollapsed && (
          <button
            onClick={togglePdfViewerCollapse}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 bg-[#0a0a0a] rounded-lg shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-[#171717] z-10 transition-all"
            title="Expand document preview"
          >
            <PanelRightOpen className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Separator and Right Panel - PDF Viewer (resizable) */}
      {!pdfViewerCollapsed && (
        <>
          <div
            data-separator="right"
            onMouseDown={handleMouseDownRight}
            className="w-[4px] bg-[#e5e5e5] hover:bg-[#d4d4d4] cursor-col-resize transition-colors group relative flex-shrink-0"
          >
            {/* Collapse button */}
            <button
              onClick={togglePdfViewerCollapse}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a0a0a] rounded-lg shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-[#171717] z-10 transition-all opacity-0 group-hover:opacity-100"
              title="Collapse document preview"
            >
              <PanelRightClose className="w-4 h-4 text-white" />
            </button>
          </div>
          <div
            className="bg-[#fafafa] relative flex-shrink-0 overflow-hidden"
            style={{ width: `${pdfViewerWidth}px` }}
          >
            <PdfViewer />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
