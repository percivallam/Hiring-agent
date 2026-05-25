// 模型API类型定义

export type ModelProvider = 'openai' | 'claude' | 'moonshot' | 'deepseek';

export interface ModelConfig {
  provider: ModelProvider;
  apiKey: string;
  baseUrl?: string;  // 自定义API地址（用于代理或国内模型）
  model: string;     // 模型名称，如 'gpt-4', 'claude-3-opus'
  temperature?: number;
  maxTokens?: number;
}

// 对话消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];    // assistant 消息中的工具调用
  tool_call_id?: string;  // tool 消息中的工具调用 ID
}

// 流式响应回调
export interface StreamCallbacks {
  onThinking?: (thinking: string) => void;      // 思考过程（如Claude的thinking）
  onContent?: (content: string) => void;        // 内容片段
  onToolCall?: (toolCall: ToolCall) => void;    // 工具调用
  onComplete?: (fullResponse: ModelResponse) => void;
  onError?: (error: Error) => void;
}

// 工具调用
export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

// 模型响应
export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 卡片类型定义（用于结构化输出）
export interface CardResponse {
  type: 'text' | 'candidate_list' | 'analytics' | 'jd_card' | 'timeline' | 'quick_actions' | 'profile_card' | 'comparison' | 'risk_analysis' | 'interview_questions' | 'market_analysis' | 'salary_benchmark' | 'pipeline_overview' | 'schedule_card' | 'offer_package' | 'team_diagnosis' | 'onboarding_plan' | 'network_graph' | 'message_template';
  content?: string;
  data?: any;
}

// 完整的结构化响应
export interface StructuredResponse {
  thinking?: string;           // 模型的思考过程
  text?: string;               // 纯文本回复
  cards?: CardResponse[];      // 卡片数组
  quickActions?: {             // 快捷操作
    label: string;
    message: string;
  }[];
}

// 模型客户端接口
export interface IModelClient {
  config: ModelConfig;
  chat(messages: ChatMessage[]): Promise<ModelResponse>;
  chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void>;
  chatWithStructuredOutput(
    messages: ChatMessage[], 
    outputSchema?: object
  ): Promise<StructuredResponse>;
}
