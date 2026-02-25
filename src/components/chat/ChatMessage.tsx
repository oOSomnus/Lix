import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={isUser ? 'bg-blue-500' : 'bg-[#0a0a0a]'}>
          {isUser ? 'U' : <Bot className="w-4 h-4 text-white" />}
        </AvatarFallback>
      </Avatar>
      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-[479.594px] shrink-0`}>
        <div
          className={`rounded-lg p-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-[#f5f5f5] text-[#0a0a0a]'
          }`}
        >
          <p className="text-[16px] leading-6 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <p className="text-[12px] leading-4 text-[#737373]">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};