import type { ModelConfig, IModelClient } from './types';
import { OpenAIClient } from './OpenAIClient';
import { ClaudeClient } from './ClaudeClient';
import { BaseModelClient, BASE_SYSTEM_PROMPT, STRUCTURED_OUTPUT_SCHEMA } from './BaseClient';

// 模型工厂：根据配置创建对应的客户端
export function createModelClient(config: ModelConfig): IModelClient {
  switch (config.provider) {
    case 'openai':
      return new OpenAIClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });
    
    case 'claude':
      return new ClaudeClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });
    
    case 'moonshot':
      // Moonshot（月之暗面）兼容 OpenAI 接口
      return new OpenAIClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://api.moonshot.cn',
        model: config.model || 'moonshot-v1-8k',
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });
    
    case 'deepseek':
      // DeepSeek 兼容 OpenAI 接口
      return new OpenAIClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://api.deepseek.com',
        model: config.model || 'deepseek-chat',
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });
    
    default:
      throw new Error(`不支持的模型提供商: ${config.provider}`);
  }
}

// 导出类型
export type {
  ModelConfig,
  ModelProvider,
  ChatMessage,
  ModelResponse,
  StreamCallbacks,
  StructuredResponse,
  CardResponse,
  IModelClient
} from './types';

// 导出类和常量
export { OpenAIClient } from './OpenAIClient';
export type { ToolChatResponse } from './OpenAIClient';
export { ClaudeClient } from './ClaudeClient';
export { BaseModelClient, BASE_SYSTEM_PROMPT, STRUCTURED_OUTPUT_SCHEMA };

// 默认导出
export default {
  createModelClient,
  BASE_SYSTEM_PROMPT,
  STRUCTURED_OUTPUT_SCHEMA
};
