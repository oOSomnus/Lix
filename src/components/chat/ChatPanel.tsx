import React, { useEffect, useState } from 'react';
import { Send, Bot } from 'lucide-react';
import { useStore } from '@/stores/store';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/ui/button';
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
  } = useStore();

  const [input, setInput] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  useEffect(() => {
    // Auto-scroll to bottom
    const container = document.querySelector('[data-chat-scroll]');
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
      const response = await chatWithOpenAI(apiKey, '', messages);
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
      setIsApiKeyModalOpen(false);
      setTempApiKey('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e5e5] h-[84px] px-6 py-4 flex flex-col gap-1 shrink-0">
        <h2 className="font-medium text-[18px] leading-7 text-[#0a0a0a]">Chat</h2>
        {currentPdfName && (
          <p className="text-[14px] leading-5 text-[#737373]">{currentPdfName}</p>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-6">
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
            className="w-12 h-11 bg-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-[#d4d4d4] transition-colors"
          >
            <Send className="w-4 h-4 text-[#0a0a0a]" />
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-medium text-[#0a0a0a] mb-4">
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
              <Button
                variant="outline"
                onClick={() => {
                  setIsApiKeyModalOpen(false);
                  setTempApiKey('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleApiKeySave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};