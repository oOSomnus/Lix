import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useStore } from '@/stores/store';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker using the exact version from react-pdf
const pdfWorker = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export const PdfViewer: React.FC = () => {
  const { pdfFile, pdfBuffer, currentPage, totalPages, zoomLevel, setTotalPages, next, prev, zoomIn, zoomOut } = useStore();

  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (numPages > 0 && numPages !== totalPages) {
      setTotalPages(numPages);
    }
  }, [numPages, totalPages, setTotalPages]);

  const handleLoadSuccess = ({ numPages: loadedNumPages }: { numPages: number }) => {
    setNumPages(loadedNumPages);
    setError(null);
  };

  const handleLoadError = (err: any) => {
    console.error('Error loading PDF:', err);
    console.error('Error details:', err.message, err.name, err.stack);
    setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
  };

  const zoomPercentage = Math.round(zoomLevel * 100);

  if (!pdfFile || !pdfBuffer) {
    return (
      <div className="flex flex-col h-full bg-[#fafafa]">
        <div className="bg-white border-b border-[#e5e5e5] h-[104px] px-6 py-4 flex flex-col gap-3 shrink-0">
          <h2 className="font-medium text-[18px] leading-[27px] text-[#0a0a0a]">Document Preview</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#737373] text-sm">No PDF selected</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-[#fafafa]">
        <div className="bg-white border-b border-[#e5e5e5] h-[104px] px-6 py-4 flex flex-col gap-3 shrink-0">
          <h2 className="font-medium text-[18px] leading-[27px] text-[#0a0a0a]">Document Preview</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#737373] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e5e5] h-[104px] px-6 py-4 flex flex-col justify-start gap-3 shrink-0">
        <h2 className="font-medium text-[18px] leading-7 text-[#0a0a0a]">Document Preview</h2>

        {/* Toolbar */}
        <div className="flex items-center justify-between w-full">
          {/* Page Navigation */}
          <div className="flex items-center gap-2 h-8">
            <button
              onClick={prev}
              disabled={currentPage <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4 text-[#0a0a0a]" />
            </button>
            <span className="text-[14px] leading-5 text-[#737373] min-w-[100px] text-center">
              Page {currentPage} of {totalPages || numPages}
            </span>
            <button
              onClick={next}
              disabled={currentPage >= (totalPages || numPages)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4 text-[#0a0a0a]" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 h-8">
            <button
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Minus className="w-4 h-4 text-[#0a0a0a]" />
            </button>
            <span className="text-[14px] leading-5 text-[#737373] min-w-[60px] text-center">
              {zoomPercentage}%
            </span>
            <button
              onClick={zoomIn}
              disabled={zoomLevel >= 2}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Plus className="w-4 h-4 text-[#0a0a0a]" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 flex items-start justify-center pr-[15px] pt-8 overflow-hidden">
        {pdfBuffer && (
          <div className="bg-white border border-[#e5e5e5] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] w-[569px] shrink-0">
            <Document
              file={`data:application/pdf;base64,${pdfBuffer}`}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={<div className="text-[#737373] text-sm">Loading PDF...</div>}
            >
              <Page
                pageNumber={currentPage}
                scale={zoomLevel}
                className="p-[48px]"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
};
