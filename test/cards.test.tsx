import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { C1_CandidateList } from '@/components/cards/C1_CandidateList';
import { C2_ProfileCard } from '@/components/cards/C2_ProfileCard';
import { C3_ComparisonCard } from '@/components/cards/C3_ComparisonCard';
import { C4_JDCard } from '@/components/cards/C4_JDCard';
import { C5_JobProfileCard } from '@/components/cards/C5_JobProfileCard';
import { C6_MarketAnalysisCard } from '@/components/cards/C6_MarketAnalysisCard';
import { C7_PipelineReportCard } from '@/components/cards/C7_PipelineReportCard';
import { C8_InterviewKitCard } from '@/components/cards/C8_InterviewKitCard';
import { C9_MemoryRecallCard } from '@/components/cards/C9_MemoryRecallCard';
import { C10_ClarificationCard } from '@/components/cards/C10_ClarificationCard';

const base = {
  timestamp: Date.now(),
  empty_hint: '暂无数据，请尝试其他查询',
  error_hint: '服务暂不可用，请稍后重试',
  actions: [] as const,
};

describe('C1 CandidateList', () => {
  it('renders live mode with candidates', () => {
    const { container } = render(
      <C1_CandidateList
        card_type="candidate_list" mode="live" title="匹配候选人"
        candidates={[
          { id: 'r1', name: '李雷', current_company: '字节', current_title: '推荐工程师', experience_years: 6, match_score: 0.92, match_highlights: [], gap_points: [], tags: [], status: 'active' },
        ]}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders empty mode with hint', () => {
    const { container } = render(
      <C1_CandidateList
        card_type="candidate_list" mode="empty" title="匹配候选人"
        candidates={[]} empty_hint="没找到候选人，请放宽条件" error_hint="" {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C2 ProfileCard', () => {
  it('renders live mode with full profile', () => {
    const { container } = render(
      <C2_ProfileCard
        card_type="candidate_profile" mode="live" title="候选人画像"
        id="r1" name="李雷" current_company="字节跳动" current_title="推荐系统工程师"
        experience_years={6} education="清华硕士"
        skills={['推荐系统', 'Flink']}
        career={[{ company: '字节', title: '推荐工程师', period: '2022-至今', highlights: ['CTR+12%'] }]}
        projects={[{ name: '实时推荐引擎', description: '支持百亿级特征', tech_stack: ['Flink'] }]}
        match_score={0.92} tags={['推荐']} active_status="active"
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C2_ProfileCard
        card_type="candidate_profile" mode="loading" title="候选人画像"
        id="" name="" current_company="" current_title="" experience_years={0} education=""
        skills={[]} career={[]} projects={[]} match_score={0} tags={[]} active_status="active"
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C3 ComparisonCard', () => {
  it('renders live mode', () => {
    const { container } = render(
      <C3_ComparisonCard
        card_type="comparison" mode="live" title="候选人对比"
        candidate_a={{ id: 'a', name: '李雷' }} candidate_b={{ id: 'b', name: '韩梅梅' }}
        dimensions={[
          { label: '推荐经验', candidate_a: '6年', candidate_b: '5年', advantage: 'a' },
          { label: '工程能力', candidate_a: 'Flink', candidate_b: 'Spring', advantage: 'a' },
        ]}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C3_ComparisonCard
        card_type="comparison" mode="loading" title="候选人对比"
        candidate_a={{ id: 'a', name: '...' }} candidate_b={{ id: 'b', name: '...' }}
        dimensions={[]} {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C4 JDCard', () => {
  const job = { id: 'j1', title: '推荐工程师', department: '推荐架构部', level: 'P6-P7', description: '负责推荐系统', requirements: ['3年经验'], nice_to_have: [], pipeline: [{ stage: '筛选', count: 45, target: 60 }], open_days: 15, status: 'open' as const };

  it('renders live mode', () => {
    const { container } = render(
      <C4_JDCard card_type="job_detail" mode="live" title="岗位详情" job={job} is_published {...base} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C4_JDCard card_type="job_detail" mode="loading" title="岗位详情" job={job} is_published {...base} />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C5 JobProfileCard', () => {
  it('renders live mode', () => {
    const { container } = render(
      <C5_JobProfileCard
        card_type="job_profile" mode="live" title="岗位画像建议"
        requested_title="推荐工程师"
        profile_suggestions={[
          { name: '推荐经验', importance: 'critical' as const, suggestion: '3年以上推荐系统经验' },
          { name: '工程能力', importance: 'important' as const, suggestion: '精通分布式系统' },
        ]}
        search_strategy="定向搜索头部公司" similar_jobs={[]}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C5_JobProfileCard
        card_type="job_profile" mode="loading" title="岗位画像建议"
        requested_title="推荐工程师" profile_suggestions={[]} search_strategy="" similar_jobs={[]}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C6 MarketAnalysisCard', () => {
  it('renders live mode', () => {
    const { container } = render(
      <C6_MarketAnalysisCard
        card_type="market_analysis" mode="live" title="市场分析"
        position="推荐工程师" analysis_type="distribution"
        data={[{ label: '字节', value: 145 }, { label: '阿里', value: 120 }]}
        insights={['人才集中在头部公司']}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C6_MarketAnalysisCard
        card_type="market_analysis" mode="loading" title="市场分析"
        position="推荐工程师" analysis_type="distribution" data={[]} insights={[]}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C7 PipelineReportCard', () => {
  const metrics = { open_positions: 12, active_candidates: 89, hired_this_period: 3, avg_time_to_hire_days: 21, offer_accept_rate: 78 };

  it('renders live mode', () => {
    const { container } = render(
      <C7_PipelineReportCard
        card_type="pipeline_report" mode="live" title="招聘周报"
        report_type="weekly" period="2026-W21"
        metrics={metrics}
        funnel={[{ stage: '筛选', count: 89, conversion_rate: 1.0 }]}
        insights={['一面通过率偏低']}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C7_PipelineReportCard
        card_type="pipeline_report" mode="loading" title="招聘周报"
        report_type="weekly" period="2026-W21"
        metrics={metrics} funnel={[]} insights={[]} {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C8 InterviewKitCard', () => {
  it('renders live mode', () => {
    const { container } = render(
      <C8_InterviewKitCard
        card_type="interview_kit" mode="live" title="面试包"
        candidate_name="李雷" position="推荐工程师"
        categories={[
          { category: '技术基础', questions: [{ question: '冷启动方案？', difficulty: 'medium' as const, purpose: '考察系统设计' }] },
        ]}
        interviewer_notes="关注工程能力"
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C8_InterviewKitCard
        card_type="interview_kit" mode="loading" title="面试包"
        candidate_name="李雷" position="推荐工程师"
        categories={[]} interviewer_notes="" {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C9 MemoryRecallCard', () => {
  it('renders live mode', () => {
    const stableTime = new Date('2026-05-27T00:00:00+08:00').getTime();
    const { container } = render(
      <C9_MemoryRecallCard
        card_type="memory_recall" mode="live" title="记忆唤醒"
        recall_context="这是您第二次提及张三"
        items={[{ id: 'm1', layer: 'candidate', summary: '二面后暂停', created_at: stableTime, updated_at: stableTime }]}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C9_MemoryRecallCard
        card_type="memory_recall" mode="loading" title="记忆唤醒"
        recall_context="" items={[]} {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('C10 ClarificationCard', () => {
  it('renders live mode', () => {
    const { container } = render(
      <C10_ClarificationCard
        card_type="clarification" mode="live" title="需要更多信息"
        prompt="请问您方便补充吗？"
        options={[{ label: '搜索候选人', message: 'search' }]}
        {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders loading mode', () => {
    const { container } = render(
      <C10_ClarificationCard
        card_type="clarification" mode="loading" title="需要更多信息"
        prompt="" options={[]} {...base}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
