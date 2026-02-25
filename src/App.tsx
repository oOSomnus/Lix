import { useEffect } from 'react';
import { FileTree } from './components/sidebar/FileTree';
import { PdfViewer } from './components/pdf-viewer/PdfViewer';
import { ChatPanel } from './components/chat/ChatPanel';
import { useStore } from './stores/store';
import { Separator } from './components/ui/separator';
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
    toggleFileTreeCollapse,
    togglePdfViewerCollapse,
  } = useStore();

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
      }
    };
    loadConfig();
  }, [setApiKey, setBaseUrl, setModelName]);

  // Load PDF when file is selected
  useEffect(() => {
    if (selectedFile && selectedFile.endsWith('.pdf') && window.electronAPI) {
      const loadPdfContent = async () => {
        try {
          const buffer = await window.electronAPI.getFileBuffer(selectedFile);
          loadPdf(selectedFile, buffer);
        } catch (error) {
          console.error('Error loading PDF:', error);
        }
      };
      loadPdfContent();
    }
  }, [selectedFile, loadPdf]);

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return;

    try {
      const path = await window.electronAPI.selectFolder();
      if (path) {
        const fileItems = await window.electronAPI.readDirectory(path);
        const tree = buildFileTree(fileItems, path);
        setFiles(tree);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden relative">
      {/* Left Sidebar - File Tree (256px or 0 when collapsed) */}
      {!fileTreeCollapsed ? (
        <>
          <div className="w-64 flex-shrink-0 bg-[#0a0a0a] border-r border-[#262626] flex flex-col">
            <FileTree onOpenFolder={handleOpenFolder} />
          </div>
          {/* Collapse button */}
          <button
            onClick={toggleFileTreeCollapse}
            className="absolute left-64 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-[#262626] rounded-full flex items-center justify-center hover:bg-[#404040] z-10 transition-all"
          >
            <PanelLeftClose className="w-3 h-3 text-[#a3a3a3]" />
          </button>
        </>
      ) : (
        <button
          onClick={toggleFileTreeCollapse}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#262626] rounded-full flex items-center justify-center hover:bg-[#404040] z-10 transition-all"
        >
          <PanelLeftOpen className="w-3 h-3 text-[#a3a3a3]" />
        </button>
      )}

      {/* Middle Panel - Chat (flexible) */}
      <div className={`flex flex-col bg-white ${fileTreeCollapsed ? 'flex-1' : 'flex-1'}`}>
        <ChatPanel />
      </div>

      <Separator orientation="vertical" />

      {/* Right Panel - PDF Viewer (flexible or 0 when collapsed) */}
      {!pdfViewerCollapsed ? (
        <>
          <div className="flex-1 bg-[#fafafa] relative">
            <PdfViewer />
            {/* Collapse button */}
            <button
              onClick={togglePdfViewerCollapse}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-[#262626] rounded-full flex items-center justify-center hover:bg-[#404040] z-10 transition-all"
            >
              <PanelRightClose className="w-3 h-3 text-[#a3a3a3]" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={togglePdfViewerCollapse}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-[#262626] rounded-full flex items-center justify-center hover:bg-[#404040] z-10 transition-all"
        >
          <PanelRightOpen className="w-3 h-3 text-[#a3a3a3]" />
        </button>
      )}
    </div>
  );
}

export default App;