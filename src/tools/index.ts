import { searchResumes, getResumeById, getJobs, getJobById, getPipelineData, getPipelineSummary, getMarketData, getMarketRoles, getSalaryBenchmark, getSalaryRoles, getTeamData, getTeamList } from '@/data';

export interface ToolParameter { type: string; description?: string; enum?: string[]; items?: { type: string }; }
export interface ToolDefinition { type: 'function'; function: { name: string; description: string; parameters: { type: 'object'; properties: Record<string, ToolParameter>; required?: string[] } }; }
export interface ToolCall { id: string; type: 'function'; function: { name: string; arguments: string }; }
export interface ToolResult { tool_call_id: string; role: 'tool'; content: string; }

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { type: 'function', function: { name: 'search_candidates', description: '搜索候选人库。', parameters: { type: 'object', properties: { query: { type: 'string', description: '搜索关键词' }, min_experience: { type: 'number', description: '最低经验年限' }, skills: { type: 'array', items: { type: 'string' }, description: '技能列表' }, company: { type: 'string', description: '期望公司' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'get_candidate_profile', description: '获取候选人完整档案', parameters: { type: 'object', properties: { candidate_id: { type: 'string', description: '候选人ID' } }, required: ['candidate_id'] } } },
  { type: 'function', function: { name: 'compare_candidates', description: '对比两个候选人', parameters: { type: 'object', properties: { candidate_id_1: { type: 'string', description: '候选人1 ID' }, candidate_id_2: { type: 'string', description: '候选人2 ID' } }, required: ['candidate_id_1', 'candidate_id_2'] } } },
  { type: 'function', function: { name: 'analyze_pipeline', description: '查看招聘Pipeline进度', parameters: { type: 'object', properties: { job_id: { type: 'string', description: '岗位ID(可选)' } }, required: [] } } },
  { type: 'function', function: { name: 'market_analysis', description: '市场人才分析', parameters: { type: 'object', properties: { role: { type: 'string', description: '角色类型' } }, required: ['role'] } } },
  { type: 'function', function: { name: 'salary_benchmark', description: '薪酬对标', parameters: { type: 'object', properties: { role: { type: 'string', description: '角色类型' } }, required: ['role'] } } },
  { type: 'function', function: { name: 'list_jobs', description: '列出在招岗位', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'get_job_detail', description: '岗位详情', parameters: { type: 'object', properties: { job_id: { type: 'string' } }, required: ['job_id'] } } },
  { type: 'function', function: { name: 'generate_message_template', description: '生成消息模板(拒信/Offer/触达/催办)', parameters: { type: 'object', properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' }, template_type: { type: 'string', enum: ['rejection','offer','sell','reminder','reach_out'], description: '类型' } }, required: ['candidate_id','template_type'] } } },
  { type: 'function', function: { name: 'generate_interview_questions', description: '生成面试题', parameters: { type: 'object', properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' }, category: { type: 'string', enum: ['algorithm','system_design','behavioral','project_deep_dive','all'], description: '类别' }, difficulty: { type: 'string', enum: ['easy','medium','hard','mixed'], description: '难度' } }, required: ['job_id'] } } },
  { type: 'function', function: { name: 'analyze_candidate_risk', description: '分析候选人风险(跳槽/意愿/技术影响力/能力缺口)', parameters: { type: 'object', properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' } }, required: ['candidate_id'] } } },
  { type: 'function', function: { name: 'analyze_team', description: '团队能力诊断', parameters: { type: 'object', properties: { team_id: { type: 'string' } }, required: ['team_id'] } } },
];

export function executeToolCall(call: ToolCall): ToolResult {
  const args = JSON.parse(call.function.arguments); let r: unknown;
  switch (call.function.name) {
    case 'search_candidates': { const c = searchResumes(args.query, { minExperience: args.min_experience, skills: args.skills, company: args.company }); r = { total: c.length, candidates: c.map(x => ({ id: x.id, name: x.name, currentCompany: x.currentCompany, currentTitle: x.currentTitle, experience: x.experience, education: x.education, matchScore: x.matchScore, matchHighlights: x.matchHighlights, gapPoints: x.gapPoints, tags: x.tags, salary: x.salary, status: x.status })) }; break; }
    case 'get_candidate_profile': r = getResumeById(args.candidate_id) || { error: 'Not found' }; break;
    case 'compare_candidates': { const a = getResumeById(args.candidate_id_1), b = getResumeById(args.candidate_id_2); r = a && b ? { candidateA: { name: a.name, company: a.currentCompany, title: a.currentTitle, experience: a.experience, skills: a.skills }, candidateB: { name: b.name, company: b.currentCompany, title: b.currentTitle, experience: b.experience, skills: b.skills }, skillOverlap: a.skills.filter(s => b.skills.includes(s)), skillDiff_A: a.skills.filter(s => !b.skills.includes(s)), skillDiff_B: b.skills.filter(s => !a.skills.includes(s)), experienceDiff: a.experience - b.experience } : { error: 'Not found' }; break; }
    case 'analyze_pipeline': r = { summary: getPipelineSummary(), jobs: getPipelineData(args.job_id) }; break;
    case 'market_analysis': r = getMarketData(args.role) || { error: 'No data', availableRoles: getMarketRoles() }; break;
    case 'salary_benchmark': r = getSalaryBenchmark(args.role) || { error: 'No data', availableRoles: getSalaryRoles() }; break;
    case 'list_jobs': r = getJobs(); break;
    case 'get_job_detail': r = getJobById(args.job_id) || { error: 'Not found' }; break;
    case 'generate_message_template': { const p = getResumeById(args.candidate_id), j = args.job_id ? getJobById(args.job_id) : null; r = p ? { template_type: args.template_type, candidate: { name: p.name, company: p.currentCompany, title: p.currentTitle, experience: p.experience, skills: p.skills }, job: j ? { title: j.title, department: j.department, level: j.level, description: j.description } : null } : { error: 'Not found' }; break; }
    case 'generate_interview_questions': { const j = getJobById(args.job_id), p = args.candidate_id ? getResumeById(args.candidate_id) : null; r = j ? { job: { title: j.title, department: j.department, level: j.level, description: j.description }, candidate: p ? { name: p.name, skills: p.skills, experience: p.experience, projects: p.projects?.map(x => ({ name: x.name, description: x.description })) } : null, category: args.category || 'all', difficulty: args.difficulty || 'mixed' } : { error: 'Not found' }; break; }
    case 'analyze_candidate_risk': { const p = getResumeById(args.candidate_id); if (!p) { r = { error: 'Not found' }; break; } const risks: any[] = []; if ((p.careerHistory || []).length >= 4) risks.push({ category: '跳槽频率', level: 'medium', description: '多段经历需关注稳定性' }); if (p.status === 'passive') risks.push({ category: '意愿度', level: 'medium', description: '被动看机会' }); else if (p.status === 'not_interested') risks.push({ category: '意愿度', level: 'high', description: '无跳槽意向' }); const j2 = args.job_id ? getJobById(args.job_id) : null; if (j2 && j2.description?.toLowerCase().includes('管理') && !p.skills?.some((s: string) => /管理|团队|lead/i.test(s))) risks.push({ category: '能力缺口', level: 'medium', description: '岗位要求管理经验' }); r = { candidateName: p.name, risks: risks.length ? risks : [{ category: '综合', level: 'low', description: '未检测到明显风险' }], overallRisk: risks.some((x: any) => x.level === 'high') ? 'high' : risks.some((x: any) => x.level === 'medium') ? 'medium' : 'low', summary: '自动分析' }; break; }
    case 'analyze_team': r = getTeamData(args.team_id) || { error: 'Not found', availableTeams: getTeamList() }; break;
    default: r = { error: 'Unknown tool: ' + call.function.name };
  }
  return { tool_call_id: call.id, role: 'tool', content: JSON.stringify(r) };
}

export function executeToolCalls(calls: ToolCall[]): ToolResult[] { return calls.map(executeToolCall); }
