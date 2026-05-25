// 导出对话引擎（旧版 — 向后兼容）
export { ConversationEngine, createEngine } from './ConversationEngine';
export { SmartConversationEngine, createSmartEngine } from './SmartConversationEngine';
export type { EngineResult, EngineResponse, CardActionPayload } from './ConversationEngine';

// 导出新版 AIEngine（S1）
export { AIEngine } from './AIEngine';
export type { AIEngineResult } from './AIEngine';

// 导出止损模块
export { checkMaxSteps, checkMaxToolCalls, checkTimeout, detectLoop } from './stop_guards';
export type { StopReason, CallRecord } from './stop_guards';

// 导出事件模块
export {
  roleToEnum,
  emitUserMessage,
  emitAgentMessage,
  emitToolCall,
  emitToolResult,
  emitLLMRound,
  emitError,
} from './events';

// 导出 Mock（仅测试用）
export { MockToolExecutor, createMockToolExecutor, emptyHandler, slowHandler, errorHandler } from './__mocks__/mockTools';
export type { ToolExecutor, MockHandler } from './__mocks__/mockTools';

// 导出 Mock 数据（旧版向后兼容）
export {
  mockCandidates,
  mockCandidatesEngineering,
  mockJobs,
  mockAnalytics,
  mockSessions,
  jdContent,
  getWelcomeMessage,
} from './mockData';
