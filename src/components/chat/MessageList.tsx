import { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import type { CardActionPayload } from '@/engine/ConversationEngine';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { CandidateCard } from '@/components/cards/CandidateCard';
import { CandidateList } from '@/components/cards/CandidateList';
import { AnalyticsCard } from '@/components/cards/AnalyticsCard';
import { JDCard } from '@/components/cards/JDCard';
import { EvaluationCard } from '@/components/cards/EvaluationCard';
import { QuickActionBar } from '@/components/cards/QuickActionBar';
import { TimelineCard } from '@/components/cards/TimelineCard';
// 新增卡片导入
import { ProfileCard } from '@/components/cards/ProfileCard';
import { ComparisonCard } from '@/components/cards/ComparisonCard';
import { RiskAnalysisCard } from '@/components/cards/RiskAnalysisCard';
import { InterviewQuestionsCard } from '@/components/cards/InterviewQuestionsCard';
import { MarketAnalysisCard } from '@/components/cards/MarketAnalysisCard';
import { SalaryBenchmarkCard } from '@/components/cards/SalaryBenchmarkCard';
import { PipelineOverviewCard } from '@/components/cards/PipelineOverviewCard';
import { ScheduleCard } from '@/components/cards/ScheduleCard';
import { OfferPackageCard } from '@/components/cards/OfferPackageCard';
import { TeamDiagnosisCard } from '@/components/cards/TeamDiagnosisCard';
import { OnboardingPlanCard } from '@/components/cards/OnboardingPlanCard';
import { NetworkGraphCard } from '@/components/cards/NetworkGraphCard';
import { MessageTemplateCard } from '@/components/cards/MessageTemplateCard';
import { CardRenderer } from '@/components/cards/CardRenderer';

import { CardErrorBoundary } from '@/components/shared/CardErrorBoundary';

interface MessageListProps {
  messages: Message[];
  thinkingSteps: string[];
  currentStep: number;
  isTyping: boolean;
  onQuickAction?: (message: string) => void;
  onCardClick?: (cardId: string, payload: CardActionPayload) => void;
  onCandidateOpen?: (candidate: any) => void;
  onDrawerOpen?: (kind: 'candidate' | 'jd' | 'pipeline' | 'diagnosis', payload?: any) => void;
  className?: string;
}

function MessageItem({
  message,
  onQuickAction,
  onCardClick,
  onCandidateOpen,
  onDrawerOpen,
}: {
  message: Message;
  onQuickAction?: (message: string) => void;
  onCardClick?: (cardId: string, payload: CardActionPayload) => void;
  onCandidateOpen?: (candidate: any) => void;
  onDrawerOpen?: (kind: 'candidate' | 'jd' | 'pipeline' | 'diagnosis', payload?: any) => void;
}) {
  const shouldIgnoreDrawerClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement | null;
    return Boolean(target?.closest('button,a,input,textarea,select,[role="button"]'));
  };

  if ((message as any).card_type) {
    const cardType = (message as any).card_type;
    return (
      <div
        className={cn(
          'ml-9',
          cardType === 'job_detail' || cardType === 'pipeline_report' || cardType === 'market_analysis'
            ? 'hai-card-clickable'
            : ''
        )}
        onClick={(event) => {
          if (shouldIgnoreDrawerClick(event)) return;
          if (cardType === 'job_detail') onDrawerOpen?.('jd', message);
          if (cardType === 'pipeline_report') onDrawerOpen?.('pipeline', message);
          if (cardType === 'market_analysis') onDrawerOpen?.('diagnosis', message);
        }}
      >
        <CardRenderer
          card={message as any}
          onActionClick={(msg) => onQuickAction?.(msg)}
          onCandidateOpen={onCandidateOpen}
        />
      </div>
    );
  }

  switch (message.type) {
    case 'text':
      return <MessageBubble message={message} />;

    case 'candidate_card':
      return (
        <div className="ml-9">
          <CandidateCard
            data={message.data}
            actions={message.actions}
            onActionClick={(action) => {
              if (onCardClick) {
                onCardClick(message.data.id, {
                  action,
                  candidateId: message.data.id
                });
              }
            }}
          />
        </div>
      );

    case 'candidate_list':
      return (
        <div className="ml-9">
          <CandidateList
            title={message.title}
            candidates={message.candidates}
            sortable={message.sortable}
            onCandidateAction={(candidateId, action) => {
              const candidate = message.candidates.find((item) => item.id === candidateId);
              if (action === 'view_resume' && candidate) {
                onCandidateOpen?.(candidate);
                return;
              }
              if (onCardClick) {
                onCardClick(candidateId, {
                  action,
                  candidateId
                });
              }
            }}
          />
        </div>
      );

    case 'analytics':
      return (
        <div className="ml-9">
          <AnalyticsCard
            chartType={message.chartType}
            title={message.title}
            data={message.data}
            insights={message.insights}
          />
        </div>
      );

    case 'jd_card':
      return (
        <div className="ml-9 hai-card-clickable" onClick={(event) => {
          if (!shouldIgnoreDrawerClick(event)) onDrawerOpen?.('jd', message);
        }}>
          <JDCard
            title={message.title}
            content={message.content}
            status={message.status}
            actions={message.actions}
          />
        </div>
      );

    case 'evaluation':
      return (
        <div className="ml-9">
          <EvaluationCard
            candidateName={message.candidateName}
            dimensions={message.dimensions}
            overallRating={message.overallRating}
            summary={message.summary}
          />
        </div>
      );

    case 'quick_actions':
      return (
        <div className="ml-9">
          <QuickActionBar
            title={message.title}
            actions={message.actions}
            onActionClick={(msg) => {
              if (onQuickAction) {
                onQuickAction(msg);
              }
            }}
          />
        </div>
      );

    case 'timeline':
      return (
        <div className="ml-9">
          <TimelineCard
            candidateName={message.candidateName}
            stages={message.stages}
          />
        </div>
      );

    case 'thinking':
      return (
        <div className="ml-9">
          <ThinkingIndicator
            steps={message.steps}
            currentStep={message.currentStep}
          />
        </div>
      );

    // ========== 新增消息类型渲染 ==========

    case 'profile_card':
      return (
        <div className="ml-9 hai-card-clickable" onClick={(event) => {
          if (!shouldIgnoreDrawerClick(event)) onCandidateOpen?.(message.data);
        }}>
          <ProfileCard
            data={message.data}
            actions={message.actions}
            onActionClick={(action) => {
              if (onCardClick) {
                onCardClick(message.data.id, { action });
              }
            }}
          />
        </div>
      );

    case 'comparison':
      return (
        <div className="ml-9">
          <ComparisonCard
            title={message.title}
            candidateA={message.candidateA}
            candidateB={message.candidateB}
            items={message.items}
            recommendation={message.recommendation}
          />
        </div>
      );

    case 'risk_analysis':
      return (
        <div className="ml-9">
          <RiskAnalysisCard
            candidateName={message.candidateName}
            risks={message.risks}
            overallRisk={message.overallRisk}
            summary={message.summary}
          />
        </div>
      );

    case 'interview_questions':
      return (
        <div className="ml-9">
          <InterviewQuestionsCard
            candidateName={message.candidateName}
            position={message.position}
            categories={message.categories}
          />
        </div>
      );

    case 'market_analysis':
      return (
        <div className="ml-9 hai-card-clickable" onClick={(event) => {
          if (!shouldIgnoreDrawerClick(event)) onDrawerOpen?.('diagnosis', message);
        }}>
          <MarketAnalysisCard
            title={message.title}
            analysisType={message.analysisType}
            data={message.data}
            insights={message.insights}
            chartType={message.chartType}
          />
        </div>
      );

    case 'salary_benchmark':
      return (
        <div className="ml-9">
          <SalaryBenchmarkCard
            title={message.title}
            position={message.position}
            benchmarks={message.benchmarks}
            marketMedian={message.marketMedian}
            recommendation={message.recommendation}
          />
        </div>
      );

    case 'pipeline_overview':
      if ((message as any).card_type === 'pipeline_report') {
        return (
          <div className="ml-9 hai-card-clickable" onClick={(event) => {
            if (!shouldIgnoreDrawerClick(event)) onDrawerOpen?.('pipeline', message);
          }}>
            <CardRenderer
              card={message as any}
              onActionClick={(msg) => onQuickAction?.(msg)}
              onCandidateOpen={onCandidateOpen}
            />
          </div>
        );
      }
      return (
        <div className="ml-9 hai-card-clickable" onClick={(event) => {
          if (!shouldIgnoreDrawerClick(event)) onDrawerOpen?.('pipeline', message);
        }}>
          <PipelineOverviewCard
            title={message.title}
            jobs={message.jobs}
            summary={message.summary}
          />
        </div>
      );

    case 'schedule_card':
      return (
        <div className="ml-9">
          <ScheduleCard
            candidateName={message.candidateName}
            position={message.position}
            suggestedSlots={message.suggestedSlots}
            notes={message.notes}
          />
        </div>
      );

    case 'offer_package':
      return (
        <div className="ml-9">
          <OfferPackageCard
            candidateName={message.candidateName}
            position={message.position}
            components={message.components}
            totalValue={message.totalValue}
            competitiveness={message.competitiveness}
            sellPoints={message.sellPoints}
            risks={message.risks}
          />
        </div>
      );

    case 'team_diagnosis':
      return (
        <div className="ml-9">
          <TeamDiagnosisCard
            teamName={message.teamName}
            members={message.members}
            gaps={message.gaps}
            recommendations={message.recommendations}
            afterHireSimulation={message.afterHireSimulation}
          />
        </div>
      );

    case 'onboarding_plan':
      return (
        <div className="ml-9">
          <OnboardingPlanCard
            candidateName={message.candidateName}
            position={message.position}
            startDate={message.startDate}
            plan={message.plan}
            milestones={message.milestones}
          />
        </div>
      );

    case 'network_graph':
      return (
        <div className="ml-9">
          <NetworkGraphCard
            centerPerson={message.centerPerson}
            connections={message.connections}
            insights={message.insights}
          />
        </div>
      );

    case 'message_template':
      return (
        <div className="ml-9">
          <MessageTemplateCard
            templateType={message.templateType}
            subject={message.subject}
            content={message.content}
            recipient={message.recipient}
            tone={message.tone}
            editable={message.editable}
          />
        </div>
      );

    default:
      // S3 新卡片渲染 — Engine 返回的 AgentCard（type 不在旧联合类型中）
      if ((message as any).type === 's3_card' && (message as any).card) {
        return (
          <div className="ml-9">
            <CardRenderer
              card={(message as any).card}
              onActionClick={(msg) => onQuickAction?.(msg)}
              onCandidateOpen={onCandidateOpen}
            />
          </div>
        );
      }
      return null;
  }
}

export function MessageList({
  messages,
  thinkingSteps,
  currentStep,
  isTyping,
  onQuickAction,
  onCardClick,
  onCandidateOpen,
  onDrawerOpen,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'h-full overflow-y-auto',
        className
      )}
    >
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <CardErrorBoundary key={message.id}>
              <MessageItem
                message={message}
                onQuickAction={onQuickAction}
                onCardClick={onCardClick}
                onCandidateOpen={onCandidateOpen}
                onDrawerOpen={onDrawerOpen}
              />
            </CardErrorBoundary>
          ))}
        </AnimatePresence>

        {isTyping && thinkingSteps.length > 0 && (
          <div className="ml-9">
            <ThinkingIndicator
              steps={thinkingSteps}
              currentStep={currentStep}
            />
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
