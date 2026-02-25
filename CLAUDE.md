# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Full Electron app (requires desktop GUI)
pnpm dev

# Web-only mode (for WSL or environments without GUI)
pnpm dev:web

# Build for production
pnpm build

# Build Electron main/preload scripts
pnpm build:electron

# Preview built app
pnpm preview

# Package for distribution
pnpm dist
```

Note: `pnpm dev` uses `vite-plugin-electron` which requires a GUI display server. In WSL, use `pnpm dev:web` which only runs the Vite dev server (file system access will be unavailable).

## Architecture

### Electron IPC Bridge Pattern

The app uses Electron's contextBridge for secure communication between main and renderer processes:

- **electron/main.ts**: Main process with IPC handlers (`ipcMain.handle`) for file system operations (select-folder, read-directory, get-file-buffer, store/get-api-key)
- **electron/preload.ts**: Exposes `window.electronAPI` to renderer process via `contextBridge`
- **Renderer process**: Accesses `window.electronAPI` (types defined in preload.ts) for file system access

Files are read as base64 strings (`get-file-buffer`) to enable react-pdf rendering without direct file access.

### State Management (Zustand)

`src/stores/store.ts` is the single source of truth using Zustand. Key state domains:

- **File tree**: `folderPath`, `files`, `selectedFile`, `toggleFolder`, `selectFile`
- **PDF viewer**: `pdfFile`, `pdfBuffer`, `currentPage`, `totalPages`, `zoomLevel`, `next/prev/zoomIn/zoomOut`
- **Chat**: `messages`, `isTyping`, `currentPdfName`, `addMessage`, `clearMessages`
- **Config**: `apiKey`, `setApiKey`

The store is used directly via `useStore()` hooks throughout components.

### File Tree Building

`src/App.tsx` contains `buildFileTree()` which transforms Electron's flat file list into a hierarchical tree structure. This function:
1. Groups files by relative path from the selected folder
2. Creates nested folder nodes with `children` arrays
3. Sorts: folders first, then files alphabetically

The FileTree component recursively renders nodes, using the `expanded` state to show/hide children.

### PDF Loading Flow

1. User selects PDF file in FileTree → `selectFile()` updates state
2. `App.tsx` useEffect detects `selectedFile` change
3. Calls `window.electronAPI.getFileBuffer()` to get base64-encoded PDF
4. `loadPdf()` updates store with file path and buffer
5. `PdfViewer.tsx` renders using `react-pdf` with `data:application/pdf;base64,...` URL

### Three-Column Layout

`src/App.tsx` renders the main layout:
- Left: 256px fixed width (FileTree)
- Middle: `flex-1`, `min-w-[400px]` (PdfViewer)
- Right: `flex-1`, `min-w-[300px]`, `max-w-[500px]` (ChatPanel)

Separators use Radix UI's `Separator` component between columns.

### OpenAI Integration

`src/lib/openai.ts` wraps the OpenAI SDK. Key points:
- Uses `gpt-4o-mini` model
- System prompt is in Chinese, instructs AI to answer based on PDF content
- `dangerouslyAllowBrowser: true` is set (acceptable for Electron app with context isolation)
- Messages from the store's `messages` array are passed with their role/content

### UI Components

`src/components/ui/` contains shadcn/ui primitives (Button, Input, ScrollArea, Separator, Avatar, Collapsible). All use Tailwind CSS with the `@/*` path alias (`@/components/ui/*`).

Colors match the Figma design:
- Sidebar background: `#0a0a0a`
- Selected item: `#262626`
- PDF viewer background: `#fafafa`
- Text: `#fafafa` (white), `#a3a3a3` (gray), `#737373` (medium gray)