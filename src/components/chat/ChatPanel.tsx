import React, { useEffect, useState } from 'react';
import { Send, Bot, Settings } from 'lucide-react';
import { useStore } from '@/stores/store';
import { ChatMessage } from './ChatMessage';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { chatWithOpenAI } from '@/lib/openai';

export const ChatPanel: React.FC = () => {
  const {
    messages,
    isTyping,
    currentPdfName,
    addMessage,
    setIsTyping,
    apiKey,
    baseUrl,
    modelName,
  } = useStore();

  const [input, setInput] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempBaseUrl, setTempBaseUrl] = useState('');
  const [tempModelName, setTempModelName] = useState('');
  const [tempApiKeySettings, setTempApiKeySettings] = useState('');

  useEffect(() => {
    // Auto-scroll to bottom of Radix viewport.
    const container = document.querySelector('[data-chat-scroll] [data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });

    setIsTyping(true);
    try {
      const response = await chatWithOpenAI(apiKey, baseUrl, modelName, '', messages);
      addMessage({ role: 'assistant', content: response });
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApiKeySave = () => {
    if (tempApiKey.trim()) {
      useStore.getState().setApiKey(tempApiKey.trim());
      if (window.electronAPI) {
        window.electronAPI.storeApiKey(tempApiKey.trim());
      } else {
        localStorage.setItem('apiKey', tempApiKey.trim());
      }
      setIsApiKeyModalOpen(false);
      setTempApiKey('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e5e5] h-[84px] px-6 py-4 flex items-start justify-between shrink-0 gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-[18px] leading-[27px] text-[#0a0a0a]">Chat</h2>
          <p className="text-[14px] leading-5 text-[#737373] truncate max-w-[420px]">
            {currentPdfName || 'No document selected'}
          </p>
        </div>
        <button
          onClick={() => {
            setIsSettingsModalOpen(true);
            setTempBaseUrl(baseUrl);
            setTempModelName(modelName);
            setTempApiKeySettings(apiKey || '');
          }}
          className="mt-1 text-[#a3a3a3] hover:text-[#0a0a0a] transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 pt-6" data-chat-scroll>
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex gap-3 items-start">
              <Avatar className="w-8 h-8 bg-[#0a0a0a] flex-shrink-0">
                <AvatarFallback>
                  <Bot className="w-4 h-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-[#f5f5f5] rounded-lg p-3 max-w-[479.594px] shrink-0">
                <p className="text-[16px] leading-6 text-[#0a0a0a]">
                  Hello! I'm ready to help you with "{currentPdfName || 'this document'}". What would you like to know?
                </p>
                <p className="text-[12px] leading-4 text-[#737373] mt-1.5">
                  01:18
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 bg-[#0a0a0a] flex-shrink-0">
                <AvatarFallback>
                  <Bot className="w-4 h-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-[#f5f5f5] rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#737373] rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-[#737373] rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-[#737373] rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-white border-t border-[#e5e5e5] h-[79px] px-6 py-[17px] shrink-0">
        <div className="flex gap-3 h-[46px]">
          <div className="flex-1 bg-white border border-[#e5e5e5] rounded-lg flex items-center px-4">
            <input
              type="text"
              placeholder="Ask about this document..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-[16px] leading-5 text-[#737373] placeholder:text-[#737373]"
              disabled={!apiKey}
            />
          </div>
          <button
            onClick={apiKey ? handleSend : () => setIsApiKeyModalOpen(true)}
            disabled={apiKey ? !input.trim() : false}
            className="w-12 h-[46px] bg-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-[#d4d4d4] active:bg-[#d4d4d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-[#0a0a0a]" />
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-[420px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] border border-[#e5e5e5]">
            <h3 className="text-[18px] leading-7 font-medium text-[#0a0a0a] mb-4">
              Set OpenAI API Key
            </h3>
            <Input
              type="password"
              placeholder="sk-..."
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApiKeySave();
                }
              }}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsApiKeyModalOpen(false);
                  setTempApiKey('');
                }}
                className="h-9 px-4 rounded-lg border border-[#e5e5e5] text-[#0a0a0a] text-sm hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApiKeySave}
                className="h-9 px-4 rounded-lg bg-[#0a0a0a] text-white text-sm hover:bg-[#171717] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-[420px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] border border-[#e5e5e5]">
            <h3 className="text-[18px] leading-7 font-medium text-[#0a0a0a] mb-4">
              AI Settings
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#737373] mb-2">
                  API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={tempApiKeySettings}
                  onChange={(e) => setTempApiKeySettings(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#737373] mb-2">
                  Base URL
                </label>
                <Input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={tempBaseUrl}
                  onChange={(e) => setTempBaseUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#737373] mb-2">
                  Model Name
                </label>
                <Input
                  type="text"
                  placeholder="gpt-4o-mini"
                  value={tempModelName}
                  onChange={(e) => setTempModelName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setTempBaseUrl('');
                  setTempModelName('');
                  setTempApiKeySettings('');
                }}
                className="h-9 px-4 rounded-lg border border-[#e5e5e5] text-[#0a0a0a] text-sm hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (tempApiKeySettings.trim()) {
                    useStore.getState().setApiKey(tempApiKeySettings.trim());
                    if (window.electronAPI) {
                      window.electronAPI.storeApiKey(tempApiKeySettings.trim());
                    } else {
                      localStorage.setItem('apiKey', tempApiKeySettings.trim());
                    }
                  }
                  if (tempBaseUrl.trim()) {
                    useStore.getState().setBaseUrl(tempBaseUrl.trim());
                    if (window.electronAPI) {
                      window.electronAPI.storeBaseUrl(tempBaseUrl.trim());
                    } else {
                      localStorage.setItem('baseUrl', tempBaseUrl.trim());
                    }
                  }
                  if (tempModelName.trim()) {
                    useStore.getState().setModelName(tempModelName.trim());
                    if (window.electronAPI) {
                      window.electronAPI.storeModelName(tempModelName.trim());
                    } else {
                      localStorage.setItem('modelName', tempModelName.trim());
                    }
                  }
                  setIsSettingsModalOpen(false);
                }}
                className="h-9 px-4 rounded-lg bg-[#0a0a0a] text-white text-sm hover:bg-[#171717] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
