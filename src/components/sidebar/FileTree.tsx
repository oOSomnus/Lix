import React from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, FileText, FolderOpenIcon } from 'lucide-react';
import { useStore } from '@/stores/store';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileNodeProps {
  node: any;
  level: number;
}

const FileNode: React.FC<FileNodeProps> = ({ node, level }) => {
  const { toggleFolder, selectFile, selectedFile } = useStore();

  const isFolder = node.type === 'folder';
  const isSelected = selectedFile === node.path;
  const isExpanded = node.expanded;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      toggleFolder(node.path);
    } else {
      selectFile(node.path);
    }
  };

  const getIcon = () => {
    if (isFolder) {
      return isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />;
    }
    if (node.extension === '.pdf') {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-2 h-10 cursor-pointer transition-colors ${
          isSelected ? 'bg-[#262626] text-[#fafafa]' : 'text-[#737373] hover:bg-[#171717]'
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )}
            {getIcon()}
          </>
        ) : (
          <>{getIcon()}</>
        )}
        <span
          className={`text-sm truncate ${
            isSelected ? 'text-[#fafafa]' : 'text-[#a3a3a3]'
          }`}
        >
          {node.name}
        </span>
      </div>
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child: any) => (
            <FileNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface FileTreeProps {
  onOpenFolder: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ onOpenFolder }) => {
  const { files } = useStore();

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header with "Lix" logo */}
      <div className="h-[73px] border-b border-[#262626] flex items-center px-4 relative shrink-0">
        <h1 className="font-display font-medium text-[24px] leading-8 text-[#fafafa] tracking-[-0.6px]">
          Lix
        </h1>
        {/* Open folder button */}
        <button
          onClick={onOpenFolder}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#fafafa] transition-colors"
          title="Open Folder"
        >
          <FolderOpenIcon className="w-5 h-5" />
        </button>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#737373] px-4 py-8">
              <p className="text-sm text-center mb-3">Select a folder to view files</p>
              <button
                onClick={onOpenFolder}
                className="text-sm text-white hover:underline"
              >
                Open Folder
              </button>
            </div>
          ) : (
            files.map((node) => (
              <FileNode key={node.path} node={node} level={0} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
