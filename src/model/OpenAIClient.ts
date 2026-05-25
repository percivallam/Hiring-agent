import type { 
  ChatMessage, 
  ModelResponse, 
  StreamCallbacks,
  StructuredResponse 
} from './types';
import type { ToolDefinition, ToolCall } from '@/tools';
import { BaseModelClient, STRUCTURED_OUTPUT_SCHEMA } from './BaseClient';

/** 带工具的 API 响应 */
export interface ToolChatResponse {
  content: string | null;
  toolCalls: ToolCall[] | null;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export class OpenAIClient extends BaseModelClient {
  private baseUrl: string;
  private apiPath: string;

  constructor(config: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    const baseUrl = config.baseUrl || 'https://api.openai.com';
    // 火山引擎等自定义 API 路径格式：/api/coding/v3/chat/completions（不含 /v1）
    // OpenAI 官方路径：/v1/chat/completions
    const isVolcengine = baseUrl.includes('volces.com') || baseUrl.includes('/api/coding');
    
    super({
      provider: 'openai',
      apiKey: config.apiKey,
      baseUrl: baseUrl,
      model: config.model || 'gpt-4o-mini',
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });
    this.baseUrl = this.config.baseUrl!;
    this.apiPath = isVolcengine ? '/chat/completions' : '/v1/chat/completions';
  }

  // 安全解析错误响应（兼容 JSON 和 HTML）
  private async parseError(response: Response): Promise<string> {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.error?.message || JSON.stringify(json);
    } catch {
      // 返回 HTML 或纯文本的前 200 字符
      const preview = text.trim().slice(0, 200);
      return `HTTP ${response.status}: ${preview || '未知错误'}`;
    }
  }

  // 普通对话
  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const url = `${this.baseUrl}${this.apiPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      const errorMsg = await this.parseError(response);
      throw new Error(`API 请求失败: ${errorMsg}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  }

  // 带工具调用的对话 — 返回可能包含 tool_calls 的响应
  async chatWithTools(
    messages: ChatMessage[],
    tools: ToolDefinition[]
  ): Promise<ToolChatResponse> {
    const url = `${this.baseUrl}${this.apiPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        tools,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      const errorMsg = await this.parseError(response);
      throw new Error(`API 请求失败: ${errorMsg}`);
    }

    const data = await response.json();
    const msg = data.choices[0]?.message;
    const toolCalls = msg?.tool_calls || null;

    return {
      content: msg?.content || null,
      toolCalls: toolCalls ? toolCalls.map((tc: any) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })) : null,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      } : undefined,
    };
  }

  // 流式对话
  async chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
    const url = `${this.baseUrl}${this.apiPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const errorMsg = await this.parseError(response);
      throw new Error(`API 请求失败: ${errorMsg}`);
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
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                callbacks.onContent?.(content);
              }
            } catch (e) {
              // 忽略解析错误的行
            }
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

  // 结构化输出（使用 JSON mode，对不支持 JSON mode 的模型回退到 prompt engineering）
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

    // 判断当前模型是否支持 JSON mode（o1 / o3-mini / 火山引擎 等可能不支持）
    const model = this.config.model || '';
    const supportsJsonMode = !model.startsWith('o1') && !model.startsWith('o3') && !model.startsWith('ark');

    const body: Record<string, any> = {
      model: this.config.model,
      messages: enhancedMessages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    };

    if (supportsJsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const url = `${this.baseUrl}${this.apiPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await this.parseError(response);
      
      // 如果是 JSON mode 不支持的错误，尝试回退到普通模式
      if (supportsJsonMode && errorText.includes('response_format')) {
        delete body.response_format;
        const fallbackResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(body)
        });
        if (!fallbackResponse.ok) {
          const fallbackError = await this.parseError(fallbackResponse);
          throw new Error(`API 请求失败: ${fallbackError}`);
        }
        const fallbackData = await fallbackResponse.json();
        const fallbackContent = fallbackData.choices[0]?.message?.content || '{}';
        return this.parseStructuredResponse(fallbackContent);
      }
      throw new Error(`API 请求失败: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(content);
      return parsed as StructuredResponse;
    } catch {
      // 如果不是有效 JSON，尝试用父类的解析方法提取
      return this.parseStructuredResponse(content);
    }
  }
}
