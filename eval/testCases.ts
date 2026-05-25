/**
 * 评测用例定义
 * 覆盖：意图识别（工具选择）、响应卡片类型、边界/异常情况
 */

export type UserRole = 'hm' | 'hr' | 'candidate';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  role: UserRole;
  input: string;
  expectedToolCalls?: string[];
  expectedCardTypes?: string[];
  expectText: boolean;
  expectNoError: boolean;
  relaxed?: boolean;
}

export const TEST_CASES: TestCase[] = [
  {
    id: 'E01',
    name: '意图识别 - 搜索候选人',
    description: '用户在找推荐系统方向的人才，应触发 search_candidates 工具并返回 candidate_list 卡片',
    role: 'hm',
    input: '帮我找几个做推荐系统的人，要5年以上经验的',
    expectedToolCalls: ['search_candidates'],
    expectedCardTypes: ['candidate_list'],
    expectText: true,
    expectNoError: true,
  },
  {
    id: 'E02',
    name: '意图识别 - 查看招聘进度',
    description: '用户询问招聘 Pipeline，应触发 analyze_pipeline 工具',
    role: 'hm',
    input: '我的招聘进度怎么样了',
    expectedToolCalls: ['analyze_pipeline'],
    expectText: true,
    expectNoError: true,
  },
  {
    id: 'E03',
    name: '意图识别 - 薪酬对标',
    description: '用户询问推荐算法薪酬行情，应触发 salary_benchmark 工具',
    role: 'hm',
    input: '推荐算法 P7 级别的市场薪酬大概多少',
    expectedToolCalls: ['salary_benchmark'],
    expectText: true,
    expectNoError: true,
  },
  {
    id: 'E04',
    name: '意图识别 - 列出岗位',
    description: '用户想看所有在招岗位，应触发 list_jobs',
    role: 'hm',
    input: '现在有哪些岗位在招',
    expectedToolCalls: ['list_jobs'],
    expectText: true,
    expectNoError: true,
  },
  {
    id: 'E05',
    name: '意图识别 - 市场分析',
    description: '用户询问大模型人才市场情况，应触发 market_analysis',
    role: 'hr',
    input: '现在大模型工程师好招吗，市场情况怎么样',
    expectedToolCalls: ['market_analysis'],
    expectText: true,
    expectNoError: true,
    relaxed: true,
  },
  {
    id: 'F01',
    name: '卡片格式 - candidate_list',
    description: '搜索推荐系统候选人，确认返回 candidate_list 卡片且包含必要字段',
    role: 'hm',
    input: '找推荐系统方向的人',
    expectedCardTypes: ['candidate_list'],
    expectText: true,
    expectNoError: true,
  },
  {
    id: 'F02',
    name: '卡片格式 - text 消息必有',
    description: '任何情况下 text 回复不应为空',
    role: 'hm',
    input: '你好，介绍一下你能做什么',
    expectText: true,
    expectNoError: true,
    relaxed: true,
  },
  {
    id: 'X01',
    name: '异常处理 - 无关问题',
    description: '用户问无关话题（天气），系统应友好引导而非崩溃',
    role: 'hm',
    input: '今天天气怎么样',
    expectText: true,
    expectNoError: true,
    relaxed: true,
  },
  {
    id: 'X02',
    name: '异常处理 - 极短输入',
    description: '用户输入极短内容，系统不应崩溃',
    role: 'hm',
    input: '好',
    expectText: true,
    expectNoError: true,
    relaxed: true,
  },
  {
    id: 'X03',
    name: '异常处理 - 无匹配候选人',
    description: '搜索一个不存在的技能方向，系统应友好告知无结果',
    role: 'hm',
    input: '帮我找做量子计算的人',
    expectText: true,
    expectNoError: true,
    relaxed: true,
  },
  {
    id: 'R01',
    name: '多角色 - HR 视角',
    description: 'HR 询问 Pipeline 和数据，应理解角色上下文',
    role: 'hr',
    input: '这周招聘数据怎么样',
    expectedToolCalls: ['analyze_pipeline'],
    expectText: true,
    expectNoError: true,
  },
  {
    id: 'R02',
    name: '多角色 - 候选人视角',
    description: '候选人询问岗位，应友好回应',
    role: 'candidate',
    input: '我想找一个算法工程师的岗位',
    expectText: true,
    expectNoError: true,
    relaxed: true,
  },
];

export function getTestStats() {
  const byCategory = {
    intent: TEST_CASES.filter(c => c.id.startsWith('E')),
    format: TEST_CASES.filter(c => c.id.startsWith('F')),
    exception: TEST_CASES.filter(c => c.id.startsWith('X')),
    role: TEST_CASES.filter(c => c.id.startsWith('R')),
  };
  return { total: TEST_CASES.length, byCategory };
}
