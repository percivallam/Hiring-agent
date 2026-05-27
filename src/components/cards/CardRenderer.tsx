import type { AgentCard } from '@/contracts/cards';
import { C1_CandidateList } from './C1_CandidateList';
import { C2_ProfileCard } from './C2_ProfileCard';
import { C3_ComparisonCard } from './C3_ComparisonCard';
import { C4_JDCard } from './C4_JDCard';
import { C5_JobProfileCard } from './C5_JobProfileCard';
import { C6_MarketAnalysisCard } from './C6_MarketAnalysisCard';
import { C7_PipelineReportCard } from './C7_PipelineReportCard';
import { C8_InterviewKitCard } from './C8_InterviewKitCard';
import { C9_MemoryRecallCard } from './C9_MemoryRecallCard';
import { C10_ClarificationCard } from './C10_ClarificationCard';

interface CardRendererProps {
  card: AgentCard | null | undefined;
  onActionClick?: (message: string) => void;
}

const CARD_MAP: Record<string, React.FC<any>> = {
  candidate_list: C1_CandidateList,
  candidate_profile: C2_ProfileCard,
  comparison: C3_ComparisonCard,
  job_detail: C4_JDCard,
  job_profile: C5_JobProfileCard,
  market_analysis: C6_MarketAnalysisCard,
  pipeline_report: C7_PipelineReportCard,
  interview_kit: C8_InterviewKitCard,
  memory_recall: C9_MemoryRecallCard,
  clarification: C10_ClarificationCard,
};

export function CardRenderer({ card, onActionClick }: CardRendererProps) {
  const safeCard = normalizeCardForRender(card);
  const Component = CARD_MAP[safeCard.card_type];

  if (!Component) {
    return (
      <C10_ClarificationCard
        card_type="clarification"
        mode="error"
        title="未知卡片类型"
        empty_hint=""
        error_hint={`系统无法渲染卡片类型: ${safeCard.card_type ?? 'unknown'}`}
        actions={[]}
        timestamp={Date.now()}
        prompt="请重新描述您的需求，或尝试以下操作："
        options={[
          { label: '返回搜索候选人', message: '请帮我搜索候选人' },
          { label: '查看招聘进度', message: '查看招聘进度' },
        ]}
      />
    );
  }

  return <Component {...safeCard} onActionClick={onActionClick} />;
}

type CardRecord = Record<string, any>;

function normalizeCardForRender(card: unknown): AgentCard {
  const raw = asRecord(card);
  const cardType = normalizeCardType(raw.card_type ?? raw.type);
  const source = { ...asRecord(raw.data), ...raw, card_type: cardType };
  const base = normalizeBase(source, cardType);

  switch (cardType) {
    case 'candidate_list':
      return {
        ...base,
        card_type: 'candidate_list',
        candidates: array(source.candidates).map(normalizeCandidate),
        sortable: boolean(source.sortable, true),
        filterable: boolean(source.filterable, false),
      } as AgentCard;

    case 'candidate_profile':
      return {
        ...base,
        card_type: 'candidate_profile',
        id: string(source.id),
        name: string(source.name),
        current_company: string(source.current_company),
        current_title: string(source.current_title),
        experience_years: number(source.experience_years),
        education: string(source.education),
        location: string(source.location),
        skills: array(source.skills).map(toStringValue),
        career: array(source.career).map(normalizeCareer),
        projects: array(source.projects).map(normalizeProject),
        match_score: score(source.match_score),
        tags: array(source.tags).map(toStringValue),
        active_status: oneOf(source.active_status, ['active', 'passive', 'not_interested'], 'active'),
        expected_salary: string(source.expected_salary),
        interview_history: array(source.interview_history).map(normalizeInterviewRecord),
      } as AgentCard;

    case 'comparison':
      return {
        ...base,
        card_type: 'comparison',
        candidate_a: normalizeCandidateRef(source.candidate_a, '候选人 A'),
        candidate_b: normalizeCandidateRef(source.candidate_b, '候选人 B'),
        dimensions: array(source.dimensions).map(normalizeDimension),
        recommendation: string(source.recommendation),
      } as AgentCard;

    case 'job_detail':
      return {
        ...base,
        card_type: 'job_detail',
        job: normalizeJob(source.job),
        is_published: boolean(source.is_published, true),
      } as AgentCard;

    case 'job_profile':
      return {
        ...base,
        card_type: 'job_profile',
        requested_title: string(source.requested_title || source.position || source.title, '目标岗位'),
        profile_suggestions: array(source.profile_suggestions).map(normalizeProfileSuggestion),
        search_strategy: string(source.search_strategy),
        similar_jobs: array(source.similar_jobs).map(normalizeSimilarJob),
      } as AgentCard;

    case 'market_analysis':
      return {
        ...base,
        card_type: 'market_analysis',
        position: string(source.position, '目标岗位'),
        analysis_type: oneOf(source.analysis_type, ['distribution', 'supply_demand', 'trend', 'competitor'], 'distribution'),
        data: array(source.data).map(normalizeMarketPoint),
        insights: array(source.insights).map(toStringValue),
        chart_type: oneOf(source.chart_type, ['bar', 'pie', 'trend', 'map'], 'bar'),
      } as AgentCard;

    case 'pipeline_report':
      return {
        ...base,
        card_type: 'pipeline_report',
        report_type: oneOf(source.report_type, ['weekly', 'monthly', 'ad_hoc'], 'weekly'),
        period: string(source.period, '本期'),
        metrics: normalizeMetrics(source.metrics),
        funnel: array(source.funnel).map(normalizeFunnelStage),
        insights: array(source.insights).map(toStringValue),
        alerts: array(source.alerts).map(normalizeAlert),
      } as AgentCard;

    case 'interview_kit':
      return {
        ...base,
        card_type: 'interview_kit',
        candidate_name: string(source.candidate_name || source.name, '候选人'),
        position: string(source.position, '目标岗位'),
        categories: array(source.categories).map(normalizeQuestionCategory),
        interviewer_notes: string(source.interviewer_notes),
        has_mock_interview: boolean(source.has_mock_interview, false),
      } as AgentCard;

    case 'memory_recall':
      return {
        ...base,
        card_type: 'memory_recall',
        recall_context: string(source.recall_context),
        items: array(source.items).map(normalizeMemoryItem),
      } as AgentCard;

    case 'clarification':
      return {
        ...base,
        card_type: 'clarification',
        prompt: string(source.prompt, '我需要再确认一下您的需求。'),
        options: array(source.options).map(normalizeOption),
      } as AgentCard;

    default:
      return { ...base, card_type: cardType } as AgentCard;
  }
}

function normalizeBase(source: CardRecord, cardType: string) {
  return {
    card_type: cardType,
    title: string(source.title, defaultTitle(cardType)),
    mode: oneOf(source.mode, ['loading', 'empty', 'error', 'demo', 'live'], 'live'),
    loading_text: string(source.loading_text),
    empty_hint: string(source.empty_hint, '暂时没有找到足够的数据，我可以换个角度继续帮您查。'),
    error_hint: string(source.error_hint, '这张卡片的数据不完整，我先保留上下文，您可以继续提问或换一个条件。'),
    is_demo: boolean(source.is_demo, false),
    actions: array(source.actions).map(normalizeAction),
    timestamp: number(source.timestamp, Date.now()),
  };
}

function normalizeCardType(value: unknown): string {
  const type = string(value, 'clarification');
  const legacyTypes: Record<string, string> = {
    profile_card: 'candidate_profile',
    jd_card: 'job_detail',
    pipeline_overview: 'pipeline_report',
  };
  return legacyTypes[type] ?? type;
}

function normalizeCandidate(value: unknown) {
  const item = asRecord(value);
  return {
    id: string(item.id, string(item.name, 'candidate')),
    name: string(item.name, '候选人'),
    current_company: string(item.current_company || item.company),
    current_title: string(item.current_title || item.title),
    experience_years: number(item.experience_years || item.experience, 0),
    match_score: score(item.match_score),
    match_highlights: array(item.match_highlights).map(toStringValue),
    gap_points: array(item.gap_points).map(toStringValue),
    tags: array(item.tags).map(toStringValue),
    status: oneOf(item.status, ['active', 'interview', 'hired', 'rejected'], 'active'),
  };
}

function normalizeCareer(value: unknown) {
  const item = asRecord(value);
  return {
    company: string(item.company),
    title: string(item.title),
    period: string(item.period),
    highlights: array(item.highlights).map(toStringValue),
  };
}

function normalizeProject(value: unknown) {
  const item = asRecord(value);
  return {
    name: string(item.name, '项目经历'),
    description: string(item.description),
    tech_stack: array(item.tech_stack).map(toStringValue),
  };
}

function normalizeInterviewRecord(value: unknown) {
  const item = asRecord(value);
  return {
    date: string(item.date),
    feedback: string(item.feedback),
    rating: number(item.rating, 0),
  };
}

function normalizeCandidateRef(value: unknown, fallbackName: string) {
  const item = asRecord(value);
  return {
    id: string(item.id, fallbackName),
    name: string(item.name, fallbackName),
  };
}

function normalizeDimension(value: unknown) {
  const item = asRecord(value);
  return {
    label: string(item.label, '对比维度'),
    candidate_a: string(item.candidate_a),
    candidate_b: string(item.candidate_b),
    advantage: oneOf(item.advantage, ['a', 'b', 'neutral'], 'neutral'),
  };
}

function normalizeJob(value: unknown) {
  const item = asRecord(value);
  return {
    id: string(item.id, 'job'),
    title: string(item.title, '目标岗位'),
    department: string(item.department),
    level: string(item.level),
    description: string(item.description),
    requirements: array(item.requirements).map(toStringValue),
    nice_to_have: array(item.nice_to_have).map(toStringValue),
    salary_range: string(item.salary_range),
    pipeline: array(item.pipeline).map(normalizePipelineStage),
    open_days: number(item.open_days, 0),
    status: oneOf(item.status, ['open', 'urgent', 'closed'], 'open'),
  };
}

function normalizePipelineStage(value: unknown) {
  const item = asRecord(value);
  return {
    stage: string(item.stage, '阶段'),
    count: number(item.count, 0),
    target: number(item.target, 0),
  };
}

function normalizeProfileSuggestion(value: unknown) {
  const item = asRecord(value);
  return {
    name: string(item.name),
    importance: oneOf(item.importance, ['critical', 'important', 'nice_to_have'], 'important'),
    suggestion: string(item.suggestion),
  };
}

function normalizeSimilarJob(value: unknown) {
  const item = asRecord(value);
  return {
    id: string(item.id, string(item.title, 'job')),
    title: string(item.title, '相近岗位'),
    department: string(item.department),
  };
}

function normalizeMarketPoint(value: unknown) {
  const item = asRecord(value);
  return {
    label: string(item.label, '数据项'),
    value: number(item.value, 0),
    detail: string(item.detail),
  };
}

function normalizeMetrics(value: unknown) {
  const item = asRecord(value);
  return {
    open_positions: number(item.open_positions, 0),
    active_candidates: number(item.active_candidates, 0),
    hired_this_period: number(item.hired_this_period, 0),
    avg_time_to_hire_days: number(item.avg_time_to_hire_days, 0),
    offer_accept_rate: number(item.offer_accept_rate, 0),
  };
}

function normalizeFunnelStage(value: unknown) {
  const item = asRecord(value);
  return {
    stage: string(item.stage, '阶段'),
    count: number(item.count, 0),
    conversion_rate: number(item.conversion_rate, 0),
  };
}

function normalizeAlert(value: unknown) {
  const item = asRecord(value);
  return {
    job_id: string(item.job_id, 'job'),
    title: string(item.title, '风险岗位'),
    status: oneOf(item.status, ['at_risk', 'stuck'], 'at_risk'),
    reason: string(item.reason),
  };
}

function normalizeQuestionCategory(value: unknown) {
  const item = asRecord(value);
  return {
    category: string(item.category, '面试问题'),
    questions: array(item.questions).map(normalizeQuestion),
  };
}

function normalizeQuestion(value: unknown) {
  const item = asRecord(value);
  return {
    question: string(item.question),
    difficulty: oneOf(item.difficulty, ['easy', 'medium', 'hard'], 'medium'),
    purpose: string(item.purpose),
  };
}

function normalizeMemoryItem(value: unknown) {
  const item = asRecord(value);
  return {
    id: string(item.id, 'memory'),
    layer: oneOf(item.layer, ['session', 'user', 'candidate'], 'session'),
    summary: string(item.summary),
    created_at: number(item.created_at, Date.now()),
    updated_at: number(item.updated_at, Date.now()),
  };
}

function normalizeOption(value: unknown) {
  const item = asRecord(value);
  return {
    label: string(item.label, '继续'),
    message: string(item.message || item.label, '继续'),
    icon: string(item.icon),
  };
}

function normalizeAction(value: unknown) {
  const item = asRecord(value);
  return {
    label: string(item.label, '继续'),
    message: string(item.message || item.label, '继续'),
    icon: string(item.icon),
    variant: oneOf(item.variant, ['primary', 'secondary'], 'secondary'),
  };
}

function defaultTitle(cardType: string): string {
  const titles: Record<string, string> = {
    candidate_list: '候选人列表',
    candidate_profile: '候选人画像',
    comparison: '候选人对比',
    job_detail: '岗位详情',
    job_profile: '岗位画像建议',
    market_analysis: '市场分析',
    pipeline_report: '招聘报告',
    interview_kit: '面试包',
    memory_recall: '记忆唤醒',
    clarification: '需要更多信息',
  };
  return titles[cardType] ?? '卡片';
}

function asRecord(value: unknown): CardRecord {
  return value && typeof value === 'object' ? (value as CardRecord) : {};
}

function array<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function boolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function score(value: unknown): number {
  const n = number(value, 0);
  return n > 1 ? n / 100 : n;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}
