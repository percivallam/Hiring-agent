import type { 
  ChatMessage, 
  ModelResponse, 
  StreamCallbacks,
  StructuredResponse 
} from './types';
import { BaseModelClient, STRUCTURED_OUTPUT_SCHEMA } from './BaseClient';

export class ClaudeClient extends BaseModelClient {
  private baseUrl: string;

  constructor(config: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    super({
      provider: 'claude',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.anthropic.com',
      model: config.model || 'claude-sonnet-4-20250514',
      temperature: config.temperature,
      maxTokens: config.maxTokens || 2000
    });
    this.baseUrl = this.config.baseUrl!;
  }

  // 转换消息格式为 Claude 格式
  private convertMessages(messages: ChatMessage[]) {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    return { systemMessage, chatMessages };
  }

  // 普通对话
  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const { systemMessage, chatMessages } = this.convertMessages(messages);

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        system: systemMessage?.content,
        messages: chatMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API 请求失败');
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }
    };
  }

  // 流式对话
  async chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
    const { systemMessage, chatMessages } = this.convertMessages(messages);

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        system: systemMessage?.content,
        messages: chatMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API 请求失败');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const event = JSON.parse(dataStr);
            
            // 处理不同类型的流式事件
            if (event.type === 'content_block_delta' && event.delta?.text) {
              const text = event.delta.text;
              fullContent += text;
              callbacks.onContent?.(text);
            }
          } catch (e) {
            // 忽略解析错误的行
          }
        }
      }

      callbacks.onComplete?.({
        content: fullContent,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      });
    } catch (error) {
      callbacks.onError?.(error as Error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  // 结构化输出
  async chatWithStructuredOutput(
    messages: ChatMessage[],
    _outputSchema: object = STRUCTURED_OUTPUT_SCHEMA
  ): Promise<StructuredResponse> {
    // 在系统提示词中说明需要 JSON 输出
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const enhancedSystemPrompt = `${systemPrompt}\n\n重要：你的响应必须是有效的 JSON 格式。请直接返回 JSON，不要包含 markdown 代码块标记。格式如下：\n\n{\n  "thinking": "你的思考过程",\n  "text": "纯文本回复（可选）",\n  "cards": [...],\n  "quickActions": [...]\n}`;

    const enhancedMessages = messages.map(m => 
      m.role === 'system' ? { ...m, content: enhancedSystemPrompt } : m
    );

    const response = await this.chat(enhancedMessages);
    return this.parseStructuredResponse(response.content);
  }

  // 覆盖父类的解析方法，增加更多容错
  protected parseStructuredResponse(content: string): StructuredResponse {
    // 先尝试标准的 JSON 解析
    try {
      return JSON.parse(content);
    } catch {
      // 尝试提取 JSON 代码块
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          // 继续尝试其他方法
        }
      }

      // 尝试找到 JSON 对象
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(jsonStr);
        } catch {
          // 继续
        }
      }

      // 所有方法都失败，当作纯文本
      return { text: content };
    }
  }
}
