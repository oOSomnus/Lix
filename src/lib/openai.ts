import OpenAI from 'openai';
import type { Message } from '@/stores/store';

export async function chatWithOpenAI(
  apiKey: string,
  pdfContent: string,
  messages: Message[]
): Promise<string> {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const systemPrompt = `你是一个 AI 助手，帮助用户理解 PDF 文档内容。
以下是当前对话的上下文信息：

${pdfContent ? `当前关联的 PDF 文档内容：\n${pdfContent}\n\n` : ''}

请基于文档内容回答用户的问题。如果无法从文档中找到答案，请诚实告知用户。`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  });

  return completion.choices[0]?.message?.content || 'No response generated';
}