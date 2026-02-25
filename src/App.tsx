import { useEffect } from 'react';
import { FileTree } from './components/sidebar/FileTree';
import { PdfViewer } from './components/pdf-viewer/PdfViewer';
import { ChatPanel } from './components/chat/ChatPanel';
import { useStore } from './stores/store';
import { Separator } from './components/ui/separator';
import { Menu } from 'lucide-react';

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
  } = useStore();

  // Load API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      if (window.electronAPI) {
        const key = await window.electronAPI.getApiKey();
        if (key) {
          setApiKey(key);
        }
      }
    };
    loadApiKey();
  }, [setApiKey]);

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
      {/* Left Sidebar - File Tree (256px) */}
      <div className="w-[256px] flex-shrink-0 bg-[#0a0a0a] border-r border-[#262626] flex flex-col">
        <FileTree onOpenFolder={handleOpenFolder} />
      </div>

      {/* Right Panel Container (1295px) */}
      <div className="flex-1 relative overflow-hidden">
        {/* Chat Panel - Left in right container (647.5px) */}
        <div className="w-[647.5px] flex-shrink-0 h-full">
          <ChatPanel />
        </div>

        <Separator orientation="vertical" />

        {/* PDF Viewer - Right in right container (647.5px) */}
        <div className="absolute right-0 top-0 w-[647.5px] h-full">
          <PdfViewer />
        </div>
      </div>

      {/* Menu Button */}
      <button className="absolute top-4 left-4 w-9 h-9 bg-[#0a0a0a] rounded-lg flex items-center justify-center shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]">
        <Menu className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

export default App;