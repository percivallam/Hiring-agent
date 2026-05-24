import { useState } from 'react';
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

export function CardStorybook() {
  const [showDemo, setShowDemo] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const cards = [
    { id: 'C1', label: 'C1 候选人列表', component: renderCard1 },
    { id: 'C2', label: 'C2 候选人画像', component: renderCard2 },
    { id: 'C3', label: 'C3 候选人对比', component: renderCard3 },
    { id: 'C4', label: 'C4 岗位卡', component: renderCard4 },
    { id: 'C5', label: 'C5 岗位画像建议', component: renderCard5 },
    { id: 'C6', label: 'C6 市场分析', component: renderCard6 },
    { id: 'C7', label: 'C7 漏斗/周报', component: renderCard7 },
    { id: 'C8', label: 'C8 面试包', component: renderCard8 },
    { id: 'C9', label: 'C9 记忆唤醒', component: renderCard9 },
    { id: 'C10', label: 'C10 引导澄清', component: renderCard10 },
  ];

  const filtered = selectedCard ? cards.filter(c => c.id === `C${selectedCard}`) : cards;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">📐 Card Storybook — S3</h1>
          <p className="text-xs text-neutral-500">10 卡片 × 多态展示</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedCard(null)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!selectedCard ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'}`}
            >
              全部
            </button>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => setSelectedCard(n)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedCard === n ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'}`}
              >
                C{n}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={showDemo}
              onChange={e => setShowDemo(e.target.checked)}
              className="rounded"
            />
            显示演示数据标识
          </label>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(card => (
            <div key={card.id}>
              <h2 className="text-sm font-semibold text-neutral-400 mb-3">{card.label}</h2>
              <div className="space-y-4 max-w-md">
                {card.component(showDemo)}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function renderCard1(showDemo: boolean) {
  return (
    <>
      <C1_CandidateList card_type="candidate_list" mode="live" title="推荐系统工程师 — 匹配候选人"
        candidates={DEMO_C1} sortable filterable
        is_demo={showDemo} empty_hint="没找到匹配候选人" error_hint="搜索服务暂时不可用"
        actions={[{ label: '查看全部', message: 'list_more', variant: 'primary' }, { label: '对比 Top 3', message: 'compare_top3' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
      <C1_CandidateList card_type="candidate_list" mode="loading" title="推荐系统工程师 — 匹配候选人"
        candidates={[]} empty_hint="" error_hint=""
        actions={[]} timestamp={Date.now()} />
      <C1_CandidateList card_type="candidate_list" mode="empty" title="推荐系统工程师 — 匹配候选人"
        candidates={[]} empty_hint="没找到完全匹配的候选人。建议：1) 放宽司龄要求至 3 年 2) 加入相邻技能栈搜索"
        error_hint="" actions={[{ label: '放宽筛选', message: 'relax_search' }]} timestamp={Date.now()} />
      <C1_CandidateList card_type="candidate_list" mode="error" title="推荐系统工程师 — 匹配候选人"
        candidates={[]} empty_hint="" error_hint="搜索服务暂时不可用，请稍后重试"
        actions={[{ label: '重试搜索', message: 'retry_search' }]} timestamp={Date.now()} />
    </>
  );
}

function renderCard2(showDemo: boolean) {
  return (
    <>
      <C2_ProfileCard card_type="candidate_profile" mode="live" title="候选人画像 — 李雷"
        id="res_001" name="李雷" current_company="字节跳动" current_title="推荐系统工程师"
        experience_years={6} education="清华大学 · 计算机硕士" location="北京"
        skills={['推荐系统', 'Flink', 'TensorFlow']}
        career={[{ company: '字节跳动', title: '推荐系统工程师', period: '2022-至今', highlights: ['主导推荐引擎优化，CTR +12%'] }]}
        projects={[{ name: '实时推荐引擎', description: '支持百亿级特征', tech_stack: ['Flink', 'Kafka'] }]}
        match_score={0.92} tags={['推荐', '工程']} active_status="active" expected_salary="60-80K"
        is_demo={showDemo} empty_hint="未找到该候选人" error_hint="加载候选人信息失败"
        actions={[{ label: '查看完整简历', message: 'view_full', variant: 'primary' }]} timestamp={Date.now()}
        onActionClick={m => console.log('action:', m)} />
      <C2_ProfileCard card_type="candidate_profile" mode="loading" title="候选人画像"
        id="" name="" current_company="" current_title="" experience_years={0} education=""
        skills={[]} career={[]} projects={[]} match_score={0} tags={[]} active_status="active"
        empty_hint="" error_hint="" actions={[]} timestamp={Date.now()} />
    </>
  );
}

function renderCard3(showDemo: boolean) {
  return (
    <>
      <C3_ComparisonCard card_type="comparison" mode="live" title="候选人对比"
        candidate_a={{ id: 'a', name: '李雷' }} candidate_b={{ id: 'b', name: '韩梅梅' }}
        dimensions={DEMO_C3} recommendation="综合来看，李雷在推荐系统经验上更具优势。"
        is_demo={showDemo} empty_hint="无可对比的候选人" error_hint="对比数据加载失败"
        actions={[{ label: '查看李雷详情', message: 'view_a', variant: 'primary' }, { label: '查看韩梅梅详情', message: 'view_b' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
      <C3_ComparisonCard card_type="comparison" mode="loading" title="候选人对比"
        candidate_a={{ id: 'a', name: '...' }} candidate_b={{ id: 'b', name: '...' }}
        dimensions={[]} empty_hint="" error_hint="" actions={[]} timestamp={Date.now()} />
    </>
  );
}

function renderCard4(showDemo: boolean) {
  return (
    <>
      <C4_JDCard card_type="job_detail" mode="live" title="岗位详情" job={DEMO_C4} is_published
        is_demo={showDemo} empty_hint="未找到该岗位" error_hint="加载岗位信息失败"
        actions={[{ label: '开始招聘', message: 'start_hiring', variant: 'primary' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
      <C4_JDCard card_type="job_detail" mode="loading" title="岗位详情" job={DEMO_C4} is_published
        empty_hint="" error_hint="" actions={[]} timestamp={Date.now()} />
    </>
  );
}

function renderCard5(showDemo: boolean) {
  return (
    <>
      <C5_JobProfileCard card_type="job_profile" mode="live" title="岗位画像建议"
        requested_title="推荐系统工程师"
        profile_suggestions={DEMO_C5} search_strategy="定向搜索字节/快手/阿里推荐团队"
        similar_jobs={[{ id: 'j1', title: '推荐算法工程师', department: '推荐架构部' }]}
        is_demo={showDemo} empty_hint="无法生成岗位画像" error_hint="AI 画像生成服务暂时不可用"
        actions={[{ label: '确认并开始搜索', message: 'start_search', variant: 'primary' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
    </>
  );
}

function renderCard6(showDemo: boolean) {
  return (
    <>
      <C6_MarketAnalysisCard card_type="market_analysis" mode="live" title="市场分析"
        position="推荐系统工程师" analysis_type="distribution"
        data={[{ label: '字节跳动', value: 145, detail: '32个岗位' }, { label: '阿里', value: 120, detail: '28个岗位' }]}
        insights={['字节和阿里集中了该领域 42% 的人才']} chart_type="bar"
        is_demo={showDemo} empty_hint="暂无市场数据" error_hint="市场分析数据加载失败"
        actions={[{ label: '查看详细分析', message: 'detail', variant: 'primary' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
      <C6_MarketAnalysisCard card_type="market_analysis" mode="loading" title="市场分析"
        position="推荐系统工程师" analysis_type="distribution" data={[]} insights={[]}
        empty_hint="" error_hint="" actions={[]} timestamp={Date.now()} />
    </>
  );
}

function renderCard7(showDemo: boolean) {
  return (
    <>
      <C7_PipelineReportCard card_type="pipeline_report" mode="live" title="招聘周报"
        report_type="weekly" period="2026-W21"
        metrics={{ open_positions: 12, active_candidates: 89, hired_this_period: 3, avg_time_to_hire_days: 21, offer_accept_rate: 78 }}
        funnel={DEMO_C7} insights={['一面通过率 51%，建议优化初筛']}
        alerts={[{ job_id: 'j1', title: '推荐系统工程师', status: 'at_risk', reason: '待定超15天' }]}
        is_demo={showDemo} empty_hint="暂无数据" error_hint="报告生成失败"
        actions={[{ label: '展开详情', message: 'expand', variant: 'primary' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
    </>
  );
}

function renderCard8(showDemo: boolean) {
  return (
    <>
      <C8_InterviewKitCard card_type="interview_kit" mode="live" title="面试包"
        candidate_name="李雷" position="推荐系统工程师"
        categories={DEMO_C8} interviewer_notes="重点关注其工程落地能力和跨团队协作经验。"
        has_mock_interview
        is_demo={showDemo} empty_hint="暂无面试题" error_hint="面试题生成失败"
        actions={[{ label: '查看全部题目', message: 'view_all_q', variant: 'primary' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
      <C8_InterviewKitCard card_type="interview_kit" mode="loading" title="面试包"
        candidate_name="李雷" position="推荐系统工程师"
        categories={[]} interviewer_notes="" empty_hint="" error_hint=""
        actions={[]} timestamp={Date.now()} />
    </>
  );
}

function renderCard9(showDemo: boolean) {
  return (
    <>
      <C9_MemoryRecallCard card_type="memory_recall" mode="live" title="记忆唤醒"
        recall_context="这是您第二次提及张三。上次在 2025-11-20 二面后因薪酬未对齐暂停流程。建议：新岗位预算上浮 15%，可重新触达。"
        items={[{ id: 'm1', layer: 'candidate', summary: '二面后因薪酬未对齐暂停', created_at: Date.now(), updated_at: Date.now() }]}
        is_demo={showDemo} empty_hint="暂无相关记忆" error_hint="记忆加载失败"
        actions={[{ label: '重启流程', message: 'reopen', variant: 'primary' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
      <C9_MemoryRecallCard card_type="memory_recall" mode="loading" title="记忆唤醒"
        recall_context="" items={[]} empty_hint="" error_hint=""
        actions={[]} timestamp={Date.now()} />
    </>
  );
}

function renderCard10(showDemo: boolean) {
  return (
    <>
      <C10_ClarificationCard card_type="clarification" mode="live" title="需要更多信息"
        prompt="我注意到您想找人，但还需要一些信息来精准搜索。请问您方便补充吗？"
        options={[{ label: '帮我在简历库搜索候选人', message: 'search' }]}
        is_demo={showDemo} empty_hint="" error_hint=""
        actions={[{ label: '手动输入', message: 'free_text' }]}
        timestamp={Date.now()} onActionClick={m => console.log('action:', m)} />
    </>
  );
}

const DEMO_C1 = [
  { id: 'r1', name: '李雷', current_company: '字节跳动', current_title: '推荐系统工程师', experience_years: 6, match_score: 0.92, match_highlights: ['推荐系统经验'], gap_points: [], tags: ['推荐'], status: 'active' as const },
  { id: 'r2', name: '韩梅梅', current_company: '阿里', current_title: '搜索算法工程师', experience_years: 5, match_score: 0.88, match_highlights: [], gap_points: ['无推荐业务'], tags: ['搜索'], status: 'active' as const },
];

const DEMO_C3 = [
  { label: '推荐经验', candidate_a: '6年', candidate_b: '5年', advantage: 'a' as const },
  { label: '工程能力', candidate_a: 'Flink/Kafka', candidate_b: 'Java/Spring', advantage: 'a' as const },
  { label: '薪资期望', candidate_a: '60-80K', candidate_b: '45-60K', advantage: 'b' as const },
];

const DEMO_C4 = {
  id: 'j1', title: '推荐系统工程师', department: '推荐架构部', level: 'P6-P7',
  description: '负责公司核心推荐系统架构设计与优化',
  requirements: ['3年+推荐系统经验', '精通 Go/C++'],
  nice_to_have: ['Flink 实时计算经验'],
  salary_range: '50-80K', pipeline: [{ stage: '筛选', count: 45, target: 60 }],
  open_days: 15, status: 'open' as const,
};

const DEMO_C5 = [
  { name: '推荐经验', importance: 'critical' as const, suggestion: '3年以上推荐系统开发经验' },
  { name: '工程能力', importance: 'important' as const, suggestion: '精通分布式系统' },
];

const DEMO_C7 = [
  { stage: '筛选', count: 89, conversion_rate: 1.0 },
  { stage: '一面', count: 45, conversion_rate: 0.51 },
  { stage: '二面', count: 22, conversion_rate: 0.25 },
];

const DEMO_C8 = [
  { category: '技术基础', questions: [{ question: '推荐系统冷启动方案？', difficulty: 'medium' as const, purpose: '考察系统设计' }] },
  { category: '行为面试', questions: [{ question: '描述跨团队协作经历', difficulty: 'easy' as const, purpose: '考察协作' }] },
];
