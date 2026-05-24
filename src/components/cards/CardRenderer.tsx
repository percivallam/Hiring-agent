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
  card: AgentCard;
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
  const Component = CARD_MAP[card.card_type];

  if (!Component) {
    return (
      <C10_ClarificationCard
        card_type="clarification"
        mode="error"
        title="未知卡片类型"
        empty_hint=""
        error_hint={`系统无法渲染卡片类型: ${(card as any).card_type ?? 'unknown'}`}
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

  return <Component {...card} onActionClick={onActionClick} />;
}
