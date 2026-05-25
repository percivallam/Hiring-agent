import type { 
  UserRole, 
  TextMessage, 
  CandidateCardMessage,
  CandidateListMessage, 
  AnalyticsMessage,
  JDCardMessage,
  EvaluationMessage,
  QuickActionsMessage,
  TimelineMessage,
  ProfileCardMessage,
  ComparisonMessage,
  RiskAnalysisMessage,
  InterviewQuestionsMessage,
  MarketAnalysisMessage,
  SalaryBenchmarkMessage,
  PipelineOverviewMessage,
  ScheduleCardMessage,
  OfferPackageMessage,
  TeamDiagnosisMessage,
  OnboardingPlanMessage,
  NetworkGraphMessage,
  MessageTemplateMessage,
  QuickAction
} from '@/types';
import { 
  createModelClient, 
  type ModelConfig, 
  type ChatMessage,
  type StructuredResponse,
  type IModelClient,
  BASE_SYSTEM_PROMPT 
} from '@/model';
import { 
  mockCandidates, 
  mockAnalytics, 
  jdContent,
  getWelcomeMessage,
  mockProfiles,
  mockComparison,
  mockRiskAnalysis,
  mockInterviewQuestions,
  mockMarketAnalysis,
  mockMarketTrend,
  mockSalaryBenchmark,
  mockPipelineOverview,
  mockSchedule,
  mockOfferPackage,
  mockTeamDiagnosis,
  mockOnboardingPlan,
  mockNetworkGraph,
  mockMessageTemplates,
} from './mockData';
import { 
  matchIntent, 
  getRoleQuickActions,
  type IntentPattern 
} from './intentMap';

// 引擎响应类型（扩展新版）
type EngineResponse = 
  | Omit<TextMessage, 'id' | 'timestamp'>
  | Omit<CandidateCardMessage, 'id' | 'timestamp'>
  | Omit<CandidateListMessage, 'id' | 'timestamp'>
  | Omit<AnalyticsMessage, 'id' | 'timestamp'>
  | Omit<JDCardMessage, 'id' | 'timestamp'>
  | Omit<EvaluationMessage, 'id' | 'timestamp'>
  | Omit<QuickActionsMessage, 'id' | 'timestamp'>
  | Omit<TimelineMessage, 'id' | 'timestamp'>
  | Omit<ProfileCardMessage, 'id' | 'timestamp'>
  | Omit<ComparisonMessage, 'id' | 'timestamp'>
  | Omit<RiskAnalysisMessage, 'id' | 'timestamp'>
  | Omit<InterviewQuestionsMessage, 'id' | 'timestamp'>
  | Omit<MarketAnalysisMessage, 'id' | 'timestamp'>
  | Omit<SalaryBenchmarkMessage, 'id' | 'timestamp'>
  | Omit<PipelineOverviewMessage, 'id' | 'timestamp'>
  | Omit<ScheduleCardMessage, 'id' | 'timestamp'>
  | Omit<OfferPackageMessage, 'id' | 'timestamp'>
  | Omit<TeamDiagnosisMessage, 'id' | 'timestamp'>
  | Omit<OnboardingPlanMessage, 'id' | 'timestamp'>
  | Omit<NetworkGraphMessage, 'id' | 'timestamp'>
  | Omit<MessageTemplateMessage, 'id' | 'timestamp'>;

interface EngineResult {
  responses: EngineResponse[];
  delay: number;
  thinkingSteps?: string[];
}

interface CardActionPayload {
  action: string;
  candidateId?: string;
  message?: string;
  [key: string]: any;
}

// 智能对话引擎 - 使用真实模型API + 完整意图覆盖
export class SmartConversationEngine {
  private role: UserRole;
  private history: ChatMessage[] = [];
  private modelClient: IModelClient | null = null;
  private useMockFallback: boolean = true;

  constructor(role: UserRole, modelConfig?: ModelConfig) {
    this.role = role;
    
    if (modelConfig?.apiKey) {
      try {
        this.modelClient = createModelClient(modelConfig);
        this.useMockFallback = false;
        console.log(`[SmartEngine] 使用模型: ${modelConfig.provider}/${modelConfig.model}`);
      } catch (error) {
        console.warn('[SmartEngine] 模型初始化失败，使用 Mock 模式:', error);
        this.useMockFallback = true;
      }
    } else {
      console.log('[SmartEngine] 使用 Mock 模式（无 API Key）');
    }
  }

  private getSystemPrompt(): string {
    return BASE_SYSTEM_PROMPT.replace('{ROLE}', this.role);
  }

  async processInput(input: string): Promise<EngineResult> {
    this.history.push({ role: 'user', content: input });

    if (this.modelClient && !this.useMockFallback) {
      return await this.processWithModel(input);
    }

    return this.processWithMock(input);
  }

  private async processWithModel(input: string): Promise<EngineResult> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: this.getSystemPrompt() },
        ...this.history
      ];

      const structuredResponse = await this.modelClient!.chatWithStructuredOutput(messages);
      const responses = this.convertStructuredToEngineResponses(structuredResponse);

      if (structuredResponse.text) {
        this.history.push({ role: 'assistant', content: structuredResponse.text });
      }

      return {
        responses,
        delay: 500,
        thinkingSteps: structuredResponse.thinking ? [structuredResponse.thinking] : undefined
      };
    } catch (error) {
      console.error('[SmartEngine] 模型调用失败:', error);
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      const mockResult = this.processWithMock(input);
      mockResult.responses.unshift({
        type: 'text',
        role: 'agent',
        content: `⚠️ **模型 API 调用失败**：${errorMsg}\n\n已自动切换至 Mock 模式展示示例数据。请检查：\n1. API Key 是否正确\n2. 模型名称是否有效（当前使用 ${this.modelClient?.config.model}）\n3. 网络连接是否正常`
      });
      return mockResult;
    }
  }

  private convertStructuredToEngineResponses(structured: StructuredResponse): EngineResponse[] {
    const responses: EngineResponse[] = [];

    if (structured.cards && structured.cards.length > 0) {
      for (const card of structured.cards) {
        const engineResponse = this.convertCardToEngineResponse(card);
        if (engineResponse) {
          responses.push(engineResponse);
        }
      }
    }

    if (responses.length === 0 && structured.text) {
      responses.push({
        type: 'text',
        role: 'agent',
        content: structured.text
      });
    }

    if (structured.quickActions && structured.quickActions.length > 0) {
      const quickActions: QuickAction[] = structured.quickActions.map(qa => ({
        label: qa.label,
        icon: this.inferIconForAction(qa.label),
        message: qa.message
      }));

      responses.push({
        type: 'quick_actions',
        title: '快捷操作',
        actions: quickActions
      });
    }

    return responses;
  }

  private convertCardToEngineResponse(card: any): EngineResponse | null {
    switch (card.type) {
      case 'text':
        return { type: 'text', role: 'agent', content: card.content || card.data?.content || '' };
      case 'candidate_list':
        return { type: 'candidate_list', title: card.title || '推荐候选人', candidates: card.data?.candidates || mockCandidates, sortable: true };
      case 'analytics':
        return { type: 'analytics', chartType: card.chartType || 'metric_grid', title: card.title || '数据分析', data: card.data || mockAnalytics, insights: card.data?.insights };
      case 'jd_card':
        return { type: 'jd_card', title: card.title || '职位描述', content: card.data?.content || jdContent, status: card.data?.status || 'draft', actions: ['edit', 'publish', 'copy'] };
      case 'timeline':
        return { type: 'timeline', candidateName: card.data?.candidateName || '候选人', stages: card.data?.stages || [] };
      case 'quick_actions':
        return { type: 'quick_actions', title: card.title || '快捷操作', actions: (card.data?.actions || []).map((a: any) => ({ label: a.label, icon: this.inferIconForAction(a.label), message: a.message })) };
      case 'profile_card':
        return { type: 'profile_card', data: card.data || mockProfiles[0], actions: ['view_resume', 'reach_out', 'save', 'track'] };
      case 'comparison':
        return { type: 'comparison', title: card.title || '对比分析', candidateA: card.data?.candidateA || mockComparison.candidateA, candidateB: card.data?.candidateB || mockComparison.candidateB, items: card.data?.items || mockComparison.items, recommendation: card.data?.recommendation || mockComparison.recommendation };
      case 'risk_analysis':
        return { type: 'risk_analysis', candidateName: card.data?.candidateName || mockRiskAnalysis.candidateName, risks: card.data?.risks || mockRiskAnalysis.risks, overallRisk: card.data?.overallRisk || mockRiskAnalysis.overallRisk, summary: card.data?.summary || mockRiskAnalysis.summary };
      case 'interview_questions':
        return { type: 'interview_questions', candidateName: card.data?.candidateName || mockInterviewQuestions.candidateName, position: card.data?.position || mockInterviewQuestions.position, categories: card.data?.categories || mockInterviewQuestions.categories };
      case 'market_analysis':
        return { type: 'market_analysis', title: card.title || '市场分析', analysisType: card.data?.analysisType || 'distribution', data: card.data?.data || mockMarketAnalysis.data, insights: card.data?.insights || mockMarketAnalysis.insights, chartType: card.data?.chartType || 'bar' };
      case 'salary_benchmark':
        return { type: 'salary_benchmark', title: card.title || '薪酬对标', position: card.data?.position || mockSalaryBenchmark.position, benchmarks: card.data?.benchmarks || mockSalaryBenchmark.benchmarks, marketMedian: card.data?.marketMedian || mockSalaryBenchmark.marketMedian, recommendation: card.data?.recommendation || mockSalaryBenchmark.recommendation };
      case 'pipeline_overview':
        return { type: 'pipeline_overview', title: card.title || 'Pipeline总览', jobs: card.data?.jobs || mockPipelineOverview.jobs, summary: card.data?.summary || mockPipelineOverview.summary };
      case 'schedule_card':
        return { type: 'schedule_card', candidateName: card.data?.candidateName || mockSchedule.candidateName, position: card.data?.position || mockSchedule.position, suggestedSlots: card.data?.suggestedSlots || mockSchedule.suggestedSlots, notes: card.data?.notes || mockSchedule.notes };
      case 'offer_package':
        return { type: 'offer_package', candidateName: card.data?.candidateName || mockOfferPackage.candidateName, position: card.data?.position || mockOfferPackage.position, components: card.data?.components || mockOfferPackage.components, totalValue: card.data?.totalValue || mockOfferPackage.totalValue, competitiveness: card.data?.competitiveness || mockOfferPackage.competitiveness, sellPoints: card.data?.sellPoints || mockOfferPackage.sellPoints, risks: card.data?.risks || mockOfferPackage.risks };
      case 'team_diagnosis':
        return { type: 'team_diagnosis', teamName: card.data?.teamName || mockTeamDiagnosis.teamName, members: card.data?.members || mockTeamDiagnosis.members, gaps: card.data?.gaps || mockTeamDiagnosis.gaps, recommendations: card.data?.recommendations || mockTeamDiagnosis.recommendations, afterHireSimulation: card.data?.afterHireSimulation || mockTeamDiagnosis.afterHireSimulation };
      case 'onboarding_plan':
        return { type: 'onboarding_plan', candidateName: card.data?.candidateName || mockOnboardingPlan.candidateName, position: card.data?.position || mockOnboardingPlan.position, startDate: card.data?.startDate || mockOnboardingPlan.startDate, plan: card.data?.plan || mockOnboardingPlan.plan, milestones: card.data?.milestones || mockOnboardingPlan.milestones };
      case 'network_graph':
        return { type: 'network_graph', centerPerson: card.data?.centerPerson || mockNetworkGraph.centerPerson, connections: card.data?.connections || mockNetworkGraph.connections, insights: card.data?.insights || mockNetworkGraph.insights };
      case 'message_template':
        return { type: 'message_template', templateType: card.data?.templateType || 'rejection', subject: card.data?.subject, content: card.data?.content || mockMessageTemplates.rejection.content, recipient: card.data?.recipient || '候选人', tone: card.data?.tone || 'warm', editable: true };
      default:
        return null;
    }
  }

  private inferIconForAction(label: string): string {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('查看') || labelLower.includes('看')) return 'FileText';
    if (labelLower.includes('搜索') || labelLower.includes('找')) return 'Search';
    if (labelLower.includes('分析') || labelLower.includes('报告')) return 'BarChart3';
    if (labelLower.includes('安排') || labelLower.includes('面试')) return 'Calendar';
    if (labelLower.includes('写') || labelLower.includes('生成')) return 'FileText';
    if (labelLower.includes('人') || labelLower.includes('用户')) return 'User';
    if (labelLower.includes('对比') || labelLower.includes('比较')) return 'GitCompare';
    if (labelLower.includes('钱') || labelLower.includes('薪') || labelLower.includes('sell')) return 'DollarSign';
    if (labelLower.includes('风险') || labelLower.includes('预警')) return 'AlertTriangle';
    if (labelLower.includes('提醒') || labelLower.includes('通知')) return 'Bell';
    if (labelLower.includes('模拟') || labelLower.includes('练习')) return 'Mic';
    return 'Lightbulb';
  }

  // ==================== Mock 意图处理核心 ====================

  private processWithMock(input: string): EngineResult {
    const matched = matchIntent(input, this.role);
    
    if (matched.length > 0 && matched[0].score >= 0.5) {
      const bestIntent = matched[0].intent;
      return this.generateResponseForIntent(bestIntent, input);
    }

    // 兜底：基于关键词的粗略匹配
    return this.fallbackKeywordMatch(input);
  }

  private generateResponseForIntent(intent: IntentPattern, _input: string): EngineResult {
    switch (intent.category) {
      case 'hm_person_lookup':
        return this.handleHMPersonLookup(intent.id);
      case 'hm_market_intelligence':
        return this.handleHMMarketIntel(intent.id);
      case 'hm_jd_profile':
        return this.handleHMJDProfile(intent.id);
      case 'hm_resume_evaluation':
        return this.handleHMResumeEval(intent.id);
      case 'hm_interview':
        return this.handleHMInterview(intent.id);
      case 'hm_process_management':
        return this.handleHMProcessMgmt(intent.id);
      case 'hm_offer_negotiation':
        return this.handleHMOffer(intent.id);
      case 'hm_team_planning':
        return this.handleHMTeamPlanning(intent.id);
      case 'hm_post_hire':
        return this.handleHMPostHire(intent.id);
      case 'hr_pipeline':
        return this.handleHRPipeline(intent.id);
      case 'candidate_self_service':
        return this.handleCandidateSelfService(intent.id);
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A1. 找人相关 ==========
  private handleHMPersonLookup(intentId: number): EngineResult {
    switch (intentId) {
      case 1: // 特定人名查找
        return {
          thinkingSteps: ['解析人名信息...', '检索人才库...', '构建人才档案...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '找到了！这是张伟的最新档案：' },
            { type: 'profile_card', data: mockProfiles[0], actions: ['view_resume', 'reach_out', 'save', 'track'] },
            { type: 'quick_actions', title: '下一步', actions: [
              { label: '查看完整简历', icon: 'FileText', message: '把张伟的简历发给我' },
              { label: '发起触达', icon: 'Mail', message: '帮我问问张伟有没有兴趣聊聊' },
              { label: '查看人脉', icon: 'Users', message: '张伟和我们之前拒过的人有关系吗' },
            ]},
          ]
        };
      case 2: // 模糊记忆检索
        return {
          thinkingSteps: ['解析模糊描述...', '检索面试历史...', '筛选匹配结果...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '根据你的描述（去年Q3、NLP、女生），我找到了以下可能匹配的人选：' },
            { type: 'candidate_list', title: '模糊检索结果（按匹配度排序）', candidates: mockCandidates.filter(c => c.tags.includes('NLP') || c.education.includes('博士')).slice(0, 3), sortable: true },
            { type: 'text', role: 'agent', content: '第2位刘洋（百度NLP算法工程师，5年经验，复旦硕士）最符合你的描述。需要我调出她的完整档案吗？' },
          ]
        };
      case 3: // 简历调取
        return {
          thinkingSteps: ['定位候选人...', '调取简历档案...', '格式化展示...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '王磊的简历档案已调取：' },
            { type: 'profile_card', data: mockProfiles[1], actions: ['view_resume', 'reach_out', 'save', 'track'] },
          ]
        };
      case 4: // 人才动态追踪
        return {
          thinkingSteps: ['识别人才...', '查询最新动态...', '生成追踪报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '**李明** 的最新动态追踪：\n\n📍 **当前状态**：在职（美团）\n📅 **最近更新**：2024年3月15日更新了GitHub\n🔍 **信号**：近期在脉脉更新了职业状态，可能处于观望期\n📊 **技术活跃度**：过去30天GitHub有12次commit，主要贡献在推荐系统开源项目' },
            { type: 'quick_actions', title: '追踪操作', actions: [
              { label: '设置变动提醒', icon: 'Bell', message: '李明有变动时提醒我' },
              { label: '查看详细档案', icon: 'FileText', message: '把李明的简历发给我' },
            ]},
          ]
        };
      case 5: // 候选人深度调研
        return {
          thinkingSteps: ['收集在线信息...', '分析技术影响力...', '生成调研报告...'],
          delay: 2000,
          responses: [
            { type: 'text', role: 'agent', content: '**张伟** 的在线影响力调研报告：\n\n🐙 **GitHub** (github.com/zhangwei-ml)\n·  followers: 2,340\n·  主要项目：RecSys-Toolkit (⭐ 1.2k)、AB-Test-Framework (⭐ 856)\n·  最近活跃度：每周3-5次commit\n\n📝 **技术博客** (zhangwei.dev)\n·  月均访问量：8,000+\n·  热门文章：《千万级推荐系统的AB实验设计》（阅读量 12k+）\n·  更新频率：约每月1篇深度文章\n\n🔗 **LinkedIn**：500+ connections，主要连接在美团/字节系' },
            { type: 'profile_card', data: { ...mockProfiles[0], notes: ['GitHub活跃度高，开源影响力好', '技术写作能力强，是社区KOL'] }, actions: ['view_resume', 'reach_out', 'save'] },
          ]
        };
      case 6: // 画像Sourcing
        return {
          thinkingSteps: ['解析需求画像...', '搜索候选人库...', '智能匹配排序...'],
          delay: 2000,
          responses: [
            { type: 'text', role: 'agent', content: '在候选人库中为你找到 **23 位**匹配的推荐系统人才，以下是匹配度最高的 5 位：' },
            { type: 'candidate_list', title: '推荐候选人（按匹配度排序）', candidates: mockCandidates.slice(0, 5), sortable: true },
            { type: 'text', role: 'agent', content: '需要我调整搜索条件吗？比如限定年限、公司背景或细分方向。' },
          ]
        };
      case 7: // 对标人才克隆
        return {
          thinkingSteps: ['分析对标人才特征...', '提取关键画像...', '搜索相似候选人...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '基于李四的画像（社交推荐+管理经验+深度学习背景），我为你找到了以下相似候选人：' },
            { type: 'candidate_list', title: '对标克隆结果（与李四相似度排序）', candidates: [mockCandidates[4], mockCandidates[6], mockCandidates[0]], sortable: true },
            { type: 'text', role: 'agent', content: '赵晨（小红书内容推荐负责人）与李四的画像重合度最高，均为社交/内容推荐场景+带团队经验。' },
          ]
        };
      case 8: // 内部人才流动
        return {
          thinkingSteps: ['查询内部人才库...', '评估转岗匹配度...', '推荐合适人选...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '内部人才库中，以下同事可能适合转岗到推荐团队：' },
            { type: 'candidate_list', title: '内部转岗推荐', candidates: [
              { ...mockCandidates[3], currentCompany: '本公司', currentTitle: '搜索算法工程师', matchScore: 82, matchHighlights: ['熟悉公司技术栈', '搜索经验可迁移'], gapPoints: ['缺乏推荐场景经验'] },
              { ...mockCandidates[5], currentCompany: '本公司', currentTitle: 'NLP工程师（AI Lab）', matchScore: 75, matchHighlights: ['大模型经验', '内容理解能力强'], gapPoints: ['无推荐系统经验'] },
            ], sortable: true },
            { type: 'text', role: 'agent', content: '建议优先考虑陈思，他在搜索团队有4年经验，搜索→推荐的技能迁移成本较低。' },
          ]
        };
      case 9: // 被动候选人触达
        return {
          thinkingSteps: ['分析候选人背景...', '设计触达策略...', '生成个性化消息...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '已为你生成针对赵六的个性化触达方案：' },
            { type: 'message_template', templateType: 'reach_out', subject: '关于推荐算法方向的一个机会', content: mockMessageTemplates.reach_out.content, recipient: '赵六', tone: 'professional', editable: true },
            { type: 'quick_actions', title: '触达操作', actions: [
              { label: '发送消息', icon: 'Send', message: '发送触达消息给赵六' },
              { label: '调整语气', icon: 'Edit', message: '把语气改得更随意一些' },
              { label: '查看档案', icon: 'User', message: '查看赵六的完整档案' },
            ]},
          ]
        };
      case 10: // 人脉关系图谱
        return {
          thinkingSteps: ['分析人脉网络...', '查找关联关系...', '生成关系图谱...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '李明的人脉关系分析：' },
            { type: 'network_graph', centerPerson: mockNetworkGraph.centerPerson, connections: mockNetworkGraph.connections, insights: mockNetworkGraph.insights },
            { type: 'text', role: 'agent', content: '⚠️ **重要发现**：李明与2位之前我们拒过的候选人（通过张薇和陈刚）有间接联系。建议谨慎处理背景调查。' },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A2. 岗位与市场认知 ==========
  private handleHMMarketIntel(intentId: number): EngineResult {
    switch (intentId) {
      case 11: // 岗位对标分析
        return {
          thinkingSteps: ['分析岗位特征...', '搜索市场同类岗位...', '生成对标报告...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '「高级推荐算法工程师」的同类岗位对标分析：' },
            { type: 'market_analysis', title: '同类岗位对标', analysisType: 'competitor', data: [
              { label: '字节跳动', value: 45, detail: '推荐算法工程师（2-2到3-1）' },
              { label: '阿里巴巴', value: 38, detail: '搜索推荐专家（P7-P8）' },
              { label: '腾讯', value: 32, detail: '推荐算法工程师（T10-T11）' },
              { label: '美团', value: 28, detail: '推荐算法工程师（L8-L9）' },
              { label: '快手', value: 22, detail: '推荐引擎工程师（k3a-k3b）' },
            ], insights: [
              '字节和阿里在推荐方向的HC最多，竞争最激烈',
              '同等level下，字节的薪资包通常比市场高10-15%',
              '腾讯的推荐岗位更侧重视频/内容推荐场景',
            ], chartType: 'bar' },
          ]
        };
      case 12: // 人才分布地图
        return {
          thinkingSteps: ['分析人才分布...', '聚合公司数据...', '生成分布地图...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '**LLM人才分布地图**（基于公开数据估算）：' },
            { type: 'market_analysis', title: 'LLM人才分布地图', analysisType: 'distribution', data: mockMarketAnalysis.data, insights: mockMarketAnalysis.insights, chartType: 'bar' },
          ]
        };
      case 13: // 人才供需分析
        return {
          thinkingSteps: ['分析市场供给...', '统计人才存量...', '评估供需比例...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「推荐系统方向」人才供需分析：' },
            { type: 'market_analysis', title: '推荐系统人才供需', analysisType: 'supply_demand', data: [
              { label: '市场存量人才', value: 8500, detail: '全国范围' },
              { label: '当前开放HC', value: 3200, detail: '主要互联网公司' },
              { label: '月均新增人才', value: 280, detail: '含校招+转行' },
              { label: '月均流失人才', value: 190, detail: '转行/出海/创业' },
            ], insights: [
              '供需比约 2.7:1，属于相对紧缺的技能方向',
              '3-5年经验段竞争最激烈（供给少，需求大）',
              '10年+专家级人才严重稀缺，市场上仅约800人',
            ], chartType: 'pie' },
          ]
        };
      case 14: // 薪酬对标
        return {
          thinkingSteps: ['收集薪酬数据...', '分析竞品薪资...', '生成对标报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「高级推荐算法工程师」薪酬对标报告：' },
            { type: 'salary_benchmark', title: mockSalaryBenchmark.title, position: mockSalaryBenchmark.position, benchmarks: mockSalaryBenchmark.benchmarks, marketMedian: mockSalaryBenchmark.marketMedian, recommendation: mockSalaryBenchmark.recommendation },
          ]
        };
      case 15: // 招聘难度预判
        return {
          thinkingSteps: ['分析市场数据...', '评估竞争强度...', '预判招聘难度...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '**「大模型算法工程师」招聘难度评估**\n\n📊 **难度指数：⭐⭐⭐⭐⭐（极高）**\n\n**关键原因：**\n· 市场存量人才仅约1,460人，而开放HC超过600个\n· 字节、阿里、百度三巨头占据60%的人才资源\n· 候选人平均持有2.3个offer，竞价激烈\n· 博士占比40%，对学历门槛要求高\n\n**预估招聘周期：**\n· 普通候选人：60-90天\n· 优秀候选人：90-120天（需多轮竞价）\n· 顶级候选人：可能被大厂内部消化，外部几乎无法触及' },
            { type: 'quick_actions', title: '建议操作', actions: [
              { label: '调整岗位级别', icon: 'Edit', message: '把岗位级别调高来吸引更多人' },
              { label: '拓宽渠道', icon: 'Search', message: '帮我找其他渠道来招大模型人才' },
            ]},
          ]
        };
      case 16: // 市场趋势洞察
        return {
          thinkingSteps: ['分析流动数据...', '识别趋势模式...', '生成趋势报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「LLM方向」人才流动趋势（2024Q1）：' },
            { type: 'market_analysis', title: mockMarketTrend.title, analysisType: 'trend', data: mockMarketTrend.data, insights: mockMarketTrend.insights, chartType: 'trend' },
          ]
        };
      case 17: // Title对标
        return {
          thinkingSteps: ['收集Title数据...', '对标分析...', '生成Title映射...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「高级推荐算法工程师」Title对标映射：\n\n| 公司 | 对应Title | 职级 |\n|------|----------|------|\n| 字节跳动 | 推荐算法工程师 | 2-2 / 3-1 |\n| 阿里巴巴 | 搜索推荐专家 | P7 / P8 |\n| 腾讯 | 推荐算法工程师 | T10 / T11 |\n| 美团 | 高级算法工程师 | L8 / L9 |\n| 快手 | 推荐引擎工程师 | k3a / k3b |\n| 百度 | 机器学习工程师 | T6 / T7 |\n\n💡 **建议**：对外招聘时，标题写成「推荐算法专家（P7+）」更容易吸引阿里系候选人。' },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A3. JD与画像 ==========
  private handleHMJDProfile(intentId: number): EngineResult {
    switch (intentId) {
      case 18: // JD生成
        return {
          thinkingSteps: ['分析岗位需求...', '参考同类JD...', '生成草稿...'],
          delay: 2500,
          responses: [
            { type: 'jd_card', title: '高级推荐算法工程师', content: jdContent, status: 'draft', actions: ['edit', 'publish', 'copy'] },
            { type: 'text', role: 'agent', content: 'JD 草稿已生成。你可以直接编辑，或告诉我需要调整什么。' },
            { type: 'quick_actions', title: 'JD操作', actions: [
              { label: '优化吸引力', icon: 'Edit', message: '这个JD怎么改能吸引更多人来投' },
              { label: '翻译成英文', icon: 'Globe', message: '把JD翻译成英文发到LinkedIn' },
              { label: '竞品对标', icon: 'GitCompare', message: '参考字节的类似JD帮我改改' },
            ]},
          ]
        };
      case 19: // JD优化
        return {
          thinkingSteps: ['分析当前JD...', '识别优化点...', '生成优化版本...'],
          delay: 2000,
          responses: [
            { type: 'text', role: 'agent', content: 'JD优化建议：\n\n**问题诊断：**\n1. 「优秀的沟通协作能力」过于笼统，缺乏场景描述\n2. 缺少技术栈的具体版本（如 TensorFlow 2.x）\n3. 没有提到业务影响力（DAU、GMV等）\n4. 缺少团队氛围/技术挑战的描述\n\n**优化方向：**\n· 增加具体业务指标（如「负责千万级DAU推荐系统」）\n· 补充技术细节（如「精通 TensorFlow 2.x / PyTorch」）\n· 加入团队亮点（如「算法-工程-产品三方紧密协作」）\n· 强调成长空间（如「直接向VP汇报，有明确晋升路径」）' },
            { type: 'jd_card', title: '高级推荐算法工程师（优化版）', content: jdContent + '\n\n## 团队亮点\n\n- 算法-工程-产品三方紧密协作，每个idea从构思到上线平均2周\n- 技术氛围开放，每周有Paper Reading和内部技术分享\n- 直接向VP汇报，有明确晋升到技术总监的路径\n\n## 技术栈\n\n- TensorFlow 2.x / PyTorch\n- Spark / Flink\n- Kubernetes / Docker\n- Redis / Kafka', status: 'draft', actions: ['edit', 'publish', 'copy'] },
          ]
        };
      case 20: // 竞品JD对标
        return {
          thinkingSteps: ['收集竞品JD...', '对比分析差异...', '融合生成优化版...'],
          delay: 2000,
          responses: [
            { type: 'text', role: 'agent', content: '参考字节跳动同类JD的优化建议：\n\n**字节JD的亮点（我们可以借鉴）：**\n· 「技术挑战」描述具体：如「支持亿级用户、百万级QPS」\n· 「成长空间」明确：如「1-1 mentorship + 季度晋升窗口」\n· 「技术影响力」量化：如「你的优化将直接影响X亿用户的体验」\n\n**我们的差异化优势（应强调）：**\n· 更扁平的汇报线（我们直接向VP汇报，字节可能需要经过3层）\n· 更大的业务自主权（我们推荐团队独立闭环，字节可能需要跨部门协调）\n· 更早期的期权价值（我们是B轮，字节已无期权空间）' },
            { type: 'jd_card', title: '高级推荐算法工程师（对标优化版）', content: jdContent, status: 'draft', actions: ['edit', 'publish', 'copy'] },
          ]
        };
      case 21: // 画像动态修正
        return {
          thinkingSteps: ['理解真实需求...', '对比当前画像...', '建议修正方向...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '明白，JD上写的和实际要的人可能有偏差。请告诉我：\n\n1. **实际工作中最核心的问题是什么？**（如「推荐CTR下滑需要有人来解决」）\n2. **这个人入职后前3个月最关键的事是什么？**\n3. **你理想中这个人的一天是什么样的？**\n\n基于你的回答，我会重新调整人才画像和JD。' },
            { type: 'quick_actions', title: '快速调整', actions: [
              { label: '要工程强的', icon: 'Wrench', message: '其实我要的是工程能力强的，不要纯算法' },
              { label: '要管理经验的', icon: 'Users', message: '其实需要能带小团队的' },
              { label: '要业务敏感的', icon: 'TrendingUp', message: '其实需要懂业务、能落地的' },
            ]},
          ]
        };
      case 22: // 能力模型构建
        return {
          thinkingSteps: ['分析岗位需求...', '提炼核心能力...', '构建能力模型...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '「高级推荐算法工程师」核心能力模型：\n\n**硬技能（权重60%）：**\n· 推荐系统架构设计（20%）\n· 排序/召回模型优化（20%）\n· AB实验与数据分析（10%）\n· 工程落地能力（10%）\n\n**软技能（权重25%）：**\n· 跨团队协作（10%）\n· 业务理解力（10%）\n· 技术影响力（5%）\n\n**潜力指标（权重15%）：**\n· 学习能力（5%）\n· 成长意愿（5%）\n· Ownership（5%）' },
            { type: 'analytics', chartType: 'pie', title: '能力模型权重分布', data: [
              { name: '推荐架构', value: 20 },
              { name: '模型优化', value: 20 },
              { name: '实验分析', value: 10 },
              { name: '工程能力', value: 10 },
              { name: '团队协作', value: 10 },
              { name: '业务理解', value: 10 },
              { name: '技术影响', value: 5 },
              { name: '潜力指标', value: 15 },
            ] },
          ]
        };
      case 23: // 多语言多渠道发布
        return {
          thinkingSteps: ['翻译JD内容...', '适配平台风格...', '生成多语言版本...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '已生成LinkedIn英文版JD：' },
            { type: 'jd_card', title: 'Senior Recommendation Algorithm Engineer (LinkedIn)', content: `## About the Role\n\nWe are looking for a Senior Recommendation Algorithm Engineer to lead the design and optimization of our core ranking models.\n\n## Responsibilities\n1. Lead the architecture upgrade of our recommendation system serving 10M+ DAU\n2. Design and implement AB testing frameworks to drive business metrics\n3. Collaborate closely with Product and Engineering teams\n\n## Requirements\n1. MS/PhD in Computer Science or related field\n2. 5+ years of experience in recommendation systems\n3. Proficiency in TensorFlow/PyTorch\n4. Experience with large-scale recommendation systems`, status: 'draft', actions: ['edit', 'publish', 'copy'] },
            { type: 'quick_actions', title: '发布操作', actions: [
              { label: '发布到LinkedIn', icon: 'Globe', message: '发布到LinkedIn' },
              { label: '生成中文版', icon: 'FileText', message: '再生成一个脉脉版的' },
            ]},
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A4. 简历评估与决策支持 ==========
  private handleHMResumeEval(intentId: number): EngineResult {
    switch (intentId) {
      case 24: // 简历筛选推荐
        return {
          thinkingSteps: ['批量解析简历...', '智能匹配排序...', '生成推荐理由...'],
          delay: 2000,
          responses: [
            { type: 'text', role: 'agent', content: '在 **156 份**简历中，我为你筛选出最匹配的 **5 位**：' },
            { type: 'candidate_list', title: 'Top 5 推荐候选人', candidates: mockCandidates.slice(0, 5), sortable: true },
            { type: 'text', role: 'agent', content: '筛选逻辑：优先匹配推荐系统经验（权重40%）+ 工程落地能力（权重30%）+ 管理经验（权重20%）+ 稳定性（权重10%）。' },
          ]
        };
      case 25: // 候选人对比分析
        return {
          thinkingSteps: ['提取候选人特征...', '多维度对比...', '生成对比报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「李明」vs「赵晨」多维度对比分析：' },
            { type: 'comparison', title: mockComparison.title, candidateA: mockComparison.candidateA, candidateB: mockComparison.candidateB, items: mockComparison.items, recommendation: mockComparison.recommendation },
          ]
        };
      case 26: // 简历疑点分析
        return {
          thinkingSteps: ['深度解析简历...', '识别潜在疑点...', '生成追问清单...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「王强」简历疑点分析：\n\n🔍 **需要深挖的点：**\n\n1. **「主导搜索推荐一体化」的具体贡献是什么？**\n   - 简历描述较笼统，需确认是技术owner还是参与者\n\n2. **「团队30人」的管理深度？**\n   - 是实线汇报还是虚线？绩效评估权？\n\n3. **2014-2015华为仅1年，原因是什么？**\n   - 是否存在被动离职或试用期未通过？\n\n4. **论文/专利情况缺失**\n   - P8级别通常有技术影响力输出，但简历未提及' },
            { type: 'risk_analysis', candidateName: mockRiskAnalysis.candidateName, risks: mockRiskAnalysis.risks, overallRisk: mockRiskAnalysis.overallRisk, summary: '建议面试中重点验证上述疑点，特别是管理深度和项目主导权。' },
          ]
        };
      case 27: // 候选人风险评估
        return {
          thinkingSteps: ['全面背景核查...', '识别潜在风险...', '生成风险报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「王强」候选人风险评估报告：' },
            { type: 'risk_analysis', candidateName: mockRiskAnalysis.candidateName, risks: mockRiskAnalysis.risks, overallRisk: mockRiskAnalysis.overallRisk, summary: mockRiskAnalysis.summary },
          ]
        };
      case 28: // 历史录用对标
        return {
          thinkingSteps: ['调取历史录用数据...', '多维度对比...', '生成对标分析...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「李明」 vs 「去年录用的张三」对标分析：' },
            { type: 'comparison', title: '历史录用对标', candidateA: { name: '李明（当前候选人）', avatar: null }, candidateB: { name: '张三（去年录用）', avatar: null }, items: [
              { label: '技术深度', candidateA: '排序模型专家（6年）', candidateB: '推荐全栈（4年）', advantage: 'A' },
              { label: '场景匹配', candidateA: '本地生活推荐', candidateB: '电商推荐', advantage: 'neutral' },
              { label: '入职表现', candidateA: '未知', candidateB: '绩效A（前20%）', advantage: 'B' },
              { label: '性价比', candidateA: '60-80K', candidateB: '入职时50K', advantage: 'A' },
            ], recommendation: '李明的技术深度优于张三，但场景匹配度相当。参考张三的优秀入职表现，李明有较高概率复刻成功。建议推进。' },
          ]
        };
      case 29: // 录用决策辅助
        return {
          thinkingSteps: ['综合评估候选人...', '分析匹配度...', '给出决策建议...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '**录用决策建议：赵晨**\n\n✅ **推荐理由：**\n· 匹配度91%，是目前候选人中最高的\n· 社交+内容推荐场景与我们业务高度契合\n· 带团队经验可直接填补管理缺口\n· 小红书的推荐方法论与我们互补\n\n⚠️ **需注意：**\n· 薪资预期80-95K，接近预算上限\n· 可能不愿接受「负责人」title（当前已是）\n· 需要确认离职动机（是被挖还是主动看机会）\n\n**建议：Strong Hire，尽快推进到offer阶段，同时准备sell方案应对竞品offer。' },
            { type: 'quick_actions', title: '下一步', actions: [
              { label: '生成Sell方案', icon: 'DollarSign', message: '帮我生成针对赵晨的sell方案' },
              { label: '生成Offer', icon: 'FileText', message: '帮我出个offer方案' },
              { label: '查看风险', icon: 'AlertTriangle', message: '赵晨有什么风险点' },
            ]},
          ]
        };
      case 30: // 推荐可解释性
        return {
          thinkingSteps: ['回溯推荐逻辑...', '拆解匹配维度...', '生成解释报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '为什么推荐「李明」？\n\n**匹配维度拆解：**\n\n1. **技能匹配（权重40%，得分38/40）**\n   ✅ 推荐系统经验6年（要求5年+）\n   ✅ TensorFlow + Python（技术栈完全匹配）\n   ✅ AB实验专家（JD明确要求）\n\n2. **场景匹配（权重30%，得分28/30）**\n   ✅ 千万级DAU系统（与我们的量级一致）\n   ✅ 美团本地生活推荐 → 可迁移到我们的场景\n\n3. **文化匹配（权重20%，得分18/20）**\n   ✅ 美团文化强调「以客户为中心」，与我们一致\n   ✅ 有从0到1经验，适应创业公司节奏\n\n4. **稳定性（权重10%，得分9/10）**\n   ✅ 每段工作经历3年+，跳槽频率合理' },
            { type: 'candidate_card', data: mockCandidates[0], actions: ['view_resume', 'shortlist', 'schedule_interview'] },
          ]
        };
      case 31: // 历史记录查询
        return {
          thinkingSteps: ['查询历史记录...', '调取拒信原因...', '生成历史报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「赵六」的历史记录查询：\n\n🔍 **查询结果：赵六曾于2023年6月投递过「推荐算法工程师」岗位**\n\n**当时流程：**' },
            { type: 'timeline', candidateName: '赵六', stages: [
              { name: '简历投递', status: 'completed', date: '2023年6月10日' },
              { name: '简历筛选通过', status: 'completed', date: '2023年6月12日' },
              { name: '一面（技术面）', status: 'completed', date: '2023年6月20日' },
              { name: '二面（团队面）', status: 'completed', date: '2023年6月28日' },
              { name: '终面', status: 'completed', date: '2023年7月5日' },
              { name: 'Offer', status: 'completed', date: '2023年7月12日' },
              { name: '入职', status: 'completed', date: '2023年7月25日', note: '已入职！' },
            ] },
            { type: 'text', role: 'agent', content: '💡 **提示**：赵六已经是我司员工（2023年7月入职），目前在推荐团队。你可能是想查询另一位候选人？' },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A5. 面试相关 ==========
  private handleHMInterview(intentId: number): EngineResult {
    switch (intentId) {
      case 32: // AI面试执行
        return {
          thinkingSteps: ['确认候选人信息...', '配置AI面试...', '发送面试邀请...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '已为你安排李明的AI初筛面试：\n\n📅 **时间**：2024年4月24日 10:00\n⏱️ **时长**：45分钟\n📋 **考察维度**：\n· 推荐系统基础（15分钟）\n· 排序模型深度（15分钟）\n· 工程实践能力（15分钟）\n\n✅ **已发送邀请邮件**\n✅ **已生成AI面试题库**\n✅ **候选人已确认参加**' },
            { type: 'quick_actions', title: '面试操作', actions: [
              { label: '查看面试题', icon: 'FileText', message: '帮我看看AI面试的题库' },
              { label: '人工面试安排', icon: 'Calendar', message: '安排人工面试' },
            ]},
          ]
        };
      case 33: // 面试题推荐
        return {
          thinkingSteps: ['分析候选人背景...', '匹配考察维度...', '生成面试题库...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '针对「李明」的个性化面试题库：' },
            { type: 'interview_questions', candidateName: mockInterviewQuestions.candidateName, position: mockInterviewQuestions.position, categories: mockInterviewQuestions.categories },
          ]
        };
      case 34: // 面试报告解读
        return {
          thinkingSteps: ['调取面试报告...', '分析评估维度...', '生成解读摘要...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「李明」面试评估报告解读：\n\n**总体评价：Hire（推荐录用）**\n\n**亮点：**\n· 推荐系统基础扎实，对召回→排序→重排全流程理解透彻\n· AB实验设计能力强，能清晰阐述实验方法论\n· 工程落地经验丰富，有千万级DAU系统的实战经验\n\n**需关注的点：**\n· 对多模态推荐（视频+图文）的经验较少\n· 管理意愿不强，未来带团队可能需要培养\n\n**与JD匹配度：92%**' },
            { type: 'evaluation', candidateName: '李明', dimensions: [
              { name: '技术深度', score: 5, comment: '推荐系统全流程掌握，排序模型有深入见解' },
              { name: '工程能力', score: 4, comment: 'AB实验和系统优化经验丰富' },
              { name: '沟通能力', score: 4, comment: '表达清晰，能深入浅出解释技术方案' },
              { name: '文化匹配', score: 4, comment: '美团背景与我们的创业文化适配' },
            ], overallRating: 'hire', summary: '技术能力强，工程经验丰富，是理想的推荐算法人选。建议尽快推进到offer阶段。' },
          ]
        };
      case 35: // 面试评价代写
        return {
          thinkingSteps: ['整理口述内容...', '结构化评估...', '生成正式评价...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '已根据你的口述生成正式面试评价：\n\n**候选人：李明**\n**面试官：你**\n**日期：2024年4月20日**\n\n---\n\n**综合评价：Hire**\n\n李明在技术面试中表现出色。他对推荐系统的理解不仅停留在理论层面，更有大量工程实践支撑。特别是在AB实验设计方面，他能清晰阐述实验分组、样本量计算、显著性检验等关键环节，这与我们当前的需求高度匹配。\n\n**优势：**\n1. 推荐系统全流程经验（召回→排序→重排）\n2. 千万级DAU系统的优化实战\n3. AB实验方法论成熟\n\n**劣势：**\n1. 多模态推荐经验不足\n2. 管理意愿待确认\n\n**建议：**尽快推进到offer阶段，同时安排HR面试确认职业动机。' },
            { type: 'quick_actions', title: '评价操作', actions: [
              { label: '提交评价', icon: 'Check', message: '提交面试评价' },
              { label: '修改评价', icon: 'Edit', message: '帮我修改一下评价' },
            ]},
          ]
        };
      case 36: // 校准会辅助
        return {
          thinkingSteps: ['收集候选人数据...', '汇总评估结果...', '生成校准材料...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '校准会（Calibration）材料已准备：\n\n**本次校准候选人：李明、赵晨、王强**\n\n**评估一致性检查：**\n· 李明：3位面试官均评Hire（一致✅）\n· 赵晨：2位Hire，1位Lean Hire（轻微分歧⚠️）\n· 王强：1位Hire，1位Lean Hire，1位No Hire（分歧较大❌）\n\n**需要讨论的点：**\n1. 赵晨的「管理意愿」评价不一致\n2. 王强的「overqualified风险」评估差异\n3. 3位候选人的相对排序' },
            { type: 'analytics', chartType: 'bar', title: '面试官评分分布', data: [
              { name: '李明-技术面', value: 5 },
              { name: '李明-团队面', value: 4 },
              { name: '赵晨-技术面', value: 5 },
              { name: '赵晨-团队面', value: 3 },
              { name: '王强-技术面', value: 4 },
              { name: '王强-团队面', value: 2 },
            ] },
          ]
        };
      case 37: // 评估一致性分析
        return {
          thinkingSteps: ['对比多份评估...', '识别差异点...', '分析原因...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「赵晨」评估一致性分析：\n\n**差异点：**\n· 技术总监：Strong Hire（技术深度惊艳）\n· 团队负责人：Hire（能力匹配，但管理风格偏强硬）\n· HR：Lean Hire（薪资预期高，动机待确认）\n\n**根因分析：**\n1. **技术总监侧重技术深度** → 赵晨的深度学习背景恰好是其强项\n2. **团队负责人关注协作** → 赵晨在小红书的「强势推进」风格可能引发担忧\n3. **HR关注综合性价比** → 薪资预期+竞品offer风险拉低了评分\n\n**建议：**安排一次补充面试，重点考察团队协作风格和职业动机。' },
          ]
        };
      case 38: // 面试官偏差检测
        return {
          thinkingSteps: ['分析历史评分...', '计算偏差指数...', '生成偏差报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '面试官「王工」的评分偏差分析：\n\n**统计数据（近6个月）：**\n· 平均评分：3.2/5（团队平均：3.8/5）\n· Hire率：28%（团队平均：42%）\n· Strong Hire率：5%（团队平均：12%）\n\n**偏差类型：偏严（Strict）**\n\n**影响：**\n· 可能导致优秀候选人流失\n· 其他面试官需要额外校准其评分\n\n**建议：**\n1. 与王工1:1沟通，了解其评分标准\n2. 在校准会上适当上调其评分权重\n3. 考虑安排其参与更多「标准制定」工作，统一认知' },
            { type: 'analytics', chartType: 'bar', title: '面试官评分分布对比', data: [
              { name: '王工-平均', value: 3.2 },
              { name: '张经理-平均', value: 3.8 },
              { name: '李总-平均', value: 4.1 },
              { name: '团队平均', value: 3.8 },
            ] },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A6. 流程协调与进度管理 ==========
  private handleHMProcessMgmt(intentId: number): EngineResult {
    switch (intentId) {
      case 39: // 招聘进度总览
        return {
          thinkingSteps: ['汇总招聘数据...', '分析各岗位进度...', '生成进度报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '你的招聘进度总览：' },
            { type: 'pipeline_overview', title: mockPipelineOverview.title, jobs: mockPipelineOverview.jobs, summary: mockPipelineOverview.summary },
          ]
        };
      case 40: // 岗位老化预警
        return {
          thinkingSteps: ['查询岗位开设时间...', '分析招聘效率...', '生成老化预警...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '**岗位老化预警**\n\n⚠️ **后端架构师** 已开放 **45天**，超过平均招聘周期（34天）\n\n**老化原因分析：**\n· 面试通过率仅15%（正常约35%）\n· 候选人普遍要求P8+级别，与岗位级别不匹配\n· 市场上后端架构师供需比为1.5:1，相对紧缺\n\n**建议：**\n1. 上调岗位级别至「专家」或「资深架构师」\n2. 放宽部分非核心要求（如「必须有云原生经验」→「有则加分」）\n3. 考虑从内部晋升或猎头渠道补充' },
            { type: 'pipeline_overview', title: '岗位老化详情', jobs: [mockPipelineOverview.jobs[1]], summary: '该岗位已开放45天，建议尽快调整策略。' },
          ]
        };
      case 41: // 流程瓶颈诊断
        return {
          thinkingSteps: ['分析流程数据...', '识别瓶颈环节...', '生成诊断报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '**流程瓶颈诊断**\n\n🔴 **最大瓶颈：Offer→入职（转化率67% → 行业平均85%）**\n\n**原因分析：**\n1. **Offer竞争力不足**：我们的薪资包比字节低10-15%\n2. **决策周期过长**：从终面到offer平均12天（竞品平均5天）\n3. **候选人体验差**：offer阶段缺乏1对1沟通，纯邮件往来\n\n**次要瓶颈：初筛→面试（转化率38%）**\n· 初筛标准过严，可能筛掉了潜在合适候选人\n· 建议引入AI初筛，提升效率和覆盖面' },
            { type: 'analytics', chartType: 'funnel', title: '招聘漏斗分析', data: mockAnalytics.funnel },
          ]
        };
      case 42: // 跨角色协调催办
        return {
          thinkingSteps: ['查询当前状态...', '识别延误原因...', '生成催办消息...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '已生成催办消息，正在发送给HR：' },
            { type: 'message_template', templateType: 'reminder', subject: '候选人反馈提醒', content: mockMessageTemplates.reminder.content, recipient: '招聘HR', tone: 'professional', editable: true },
            { type: 'quick_actions', title: '催办操作', actions: [
              { label: '发送催办', icon: 'Send', message: '发送催办消息' },
              { label: '查看详情', icon: 'FileText', message: '查看这3个候选人的详细进度' },
            ]},
          ]
        };
      case 43: // 面试排程
        return {
          thinkingSteps: ['查询可用时段...', '匹配双方时间...', '生成排程方案...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '为「李明」匹配的面试时段：' },
            { type: 'schedule_card', candidateName: mockSchedule.candidateName, position: mockSchedule.position, suggestedSlots: mockSchedule.suggestedSlots, notes: mockSchedule.notes },
            { type: 'quick_actions', title: '排程操作', actions: [
              { label: '确认排程', icon: 'Check', message: '确认这个排程' },
              { label: '换其他时间', icon: 'Calendar', message: '帮我换其他时间' },
            ]},
          ]
        };
      case 44: // 流程节点查询
        return {
          thinkingSteps: ['查询流程节点...', '获取最新状态...', '反馈结果...'],
          delay: 1000,
          responses: [
            { type: 'text', role: 'agent', content: '「李明」的背景调查状态：\n\n📋 **背调进度：**\n· 学历验证：✅ 已完成（清华大学硕士，验证通过）\n· 工作经历：✅ 已完成（美团、字节经历核实无误）\n· 离职原因：⏳ 进行中（已联系美团HR，等待回复）\n· 参考人访谈：⏳ 待安排（已联系2位推荐人，1位确认时间）\n\n**预计完成时间**：4月25日（本周四）' },
            { type: 'timeline', candidateName: '李明', stages: [
              { name: '简历投递', status: 'completed', date: '4月1日' },
              { name: '简历筛选', status: 'completed', date: '4月3日' },
              { name: '一面（技术面）', status: 'completed', date: '4月10日' },
              { name: '二面（团队面）', status: 'completed', date: '4月15日' },
              { name: '终面', status: 'completed', date: '4月18日' },
              { name: '背景调查', status: 'current', date: '预计4月25日' },
              { name: 'Offer', status: 'pending' },
            ] },
          ]
        };
      case 45: // 招聘周期预测
        return {
          thinkingSteps: ['分析历史数据...', '预测剩余时间...', '给出周期预估...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「大模型算法工程师」岗位招聘周期预测：\n\n📅 **当前状态**：已开放60天，1个offer pending\n\n**预测模型（基于历史数据+当前pipeline）：**\n\n· **乐观情况**：候选人接受offer → 15天内关闭\n· **最可能情况**：需要发出第2个offer → 30-45天\n· **悲观情况**：前2个offer都被拒 → 60-90天\n\n**加速建议：**\n1. 同时推进2-3个候选人到终面，增加offer冗余\n2. 提前准备sell方案，缩短offer决策时间\n3. 考虑放宽1-2项非核心要求，扩大候选人池' },
            { type: 'analytics', chartType: 'trend', title: '该岗位历史招聘周期趋势', data: [
              { month: '岗位1', hires: 45, offers: 8 },
              { month: '岗位2', hires: 60, offers: 6 },
              { month: '岗位3', hires: 38, offers: 5 },
              { month: '当前岗位', hires: 60, offers: 1 },
            ] },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A7. Offer与谈判 ==========
  private handleHMOffer(intentId: number): EngineResult {
    switch (intentId) {
      case 46: // 人才Sell
        return {
          thinkingSteps: ['分析候选人动机...', '提炼核心卖点...', '生成sell方案...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '已为你生成针对「赵晨」的Sell方案：' },
            { type: 'offer_package', candidateName: mockOfferPackage.candidateName, position: mockOfferPackage.position, components: mockOfferPackage.components, totalValue: mockOfferPackage.totalValue, competitiveness: mockOfferPackage.competitiveness, sellPoints: mockOfferPackage.sellPoints, risks: mockOfferPackage.risks },
            { type: 'message_template', templateType: 'sell', subject: '邀请你加入我们的推荐团队', content: mockMessageTemplates.sell.content, recipient: '赵晨', tone: 'warm', editable: true },
          ]
        };
      case 47: // 薪酬合理性评估
        return {
          thinkingSteps: ['查询市场薪酬...', '对比候选人期望...', '评估合理性...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「李明」期望薪资合理性评估：\n\n**候选人期望：60-80K × 15薪（总包约90-120万）**\n\n**市场对标：**' },
            { type: 'salary_benchmark', title: '薪酬合理性评估', position: '高级推荐算法工程师', benchmarks: mockSalaryBenchmark.benchmarks, marketMedian: mockSalaryBenchmark.marketMedian, recommendation: '李明的期望处于市场中位水平（70K vs 市场 median 73K），完全合理。考虑到他的美团背景和项目经验，建议总包可以给到上限（80K × 15薪 + 10万签字费），以增强竞争力。' },
          ]
        };
      case 48: // 竞争情报
        return {
          thinkingSteps: ['收集竞争情报...', '分析竞品offer...', '生成竞争策略...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「赵晨」的竞争情报：\n\n🔍 **已知offer情况：**\n\n1. **字节跳动**（已发offer）\n   · 职级：3-1\n   · 总包：约180万（含期权）\n   · 岗位：抖音推荐算法专家\n\n2. **阿里巴巴**（口头offer）\n   · 职级：P8\n   · 总包：约170万\n   · 岗位：淘宝推荐技术专家\n\n**我们的劣势：**\n· 总包比字节低约15%\n· 品牌知名度不如大厂\n\n**我们的优势：**\n· 直接向VP汇报，决策链更短\n· 期权升值空间更大（B轮vs上市）\n· 业务自主权更高，不受大厂流程束缚' },
            { type: 'quick_actions', title: '应对策略', actions: [
              { label: '调整offer', icon: 'DollarSign', message: '帮我调整offer增强竞争力' },
              { label: '强调期权', icon: 'TrendingUp', message: '帮我算一下期权升值空间' },
            ]},
          ]
        };
      case 49: // Offer方案生成
        return {
          thinkingSteps: ['分析预算约束...', '设计薪酬结构...', '生成offer方案...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '为「赵晨」设计的offer方案：' },
            { type: 'offer_package', candidateName: mockOfferPackage.candidateName, position: mockOfferPackage.position, components: mockOfferPackage.components, totalValue: mockOfferPackage.totalValue, competitiveness: mockOfferPackage.competitiveness, sellPoints: mockOfferPackage.sellPoints, risks: mockOfferPackage.risks },
            { type: 'text', role: 'agent', content: '**设计思路：**\n· 月薪85K高于市场中位15%，体现诚意\n· 3个月年终奖保底，降低候选人风险感知\n· 10万签字费用于对冲竞品的短期利益\n· 50万股期权按当前估值约200万，上市后潜在增值空间大' },
          ]
        };
      case 50: // Offer loss分析
        return {
          thinkingSteps: ['调取拒offer数据...', '分析拒绝原因...', '生成loss分析...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '3月Offer Loss根因分析：\n\n**总体情况：发出4个offer，被拒3个，接受率仅25%（行业平均60%）**\n\n**被拒原因分布：**\n· 薪资不满意：2个（候选人拿到了更高offer）\n· 岗位级别不够：1个（候选人期望P8+，我们给的是P7）\n· 家庭原因：0个\n\n**根因分析：**\n1. **薪资竞争力不足**：我们的总包比字节/阿里低10-20%\n2. **岗位title缺乏吸引力**：「高级算法工程师」vs「专家/负责人」\n3. **sell阶段缺乏1对1深度沟通**：offer纯邮件发送，缺乏温度\n\n**改进建议：**\n· 建立「offer竞争力快速评估」机制\n· 高优先级候选人由总监亲自sell\n· 增加「签约奖金」作为灵活调节手段' },
            { type: 'analytics', chartType: 'bar', title: 'Offer Loss原因分布', data: [
              { name: '薪资不满意', value: 2 },
              { name: '岗位级别不够', value: 1 },
              { name: '家庭原因', value: 0 },
              { name: '竞品截胡', value: 2 },
            ] },
          ]
        };
      case 51: // 候选人沟通函生成
        return {
          thinkingSteps: ['分析候选人情况...', '设计沟通策略...', '生成温暖拒信...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '已生成温暖拒信：' },
            { type: 'message_template', templateType: 'rejection', subject: '关于高级推荐算法工程师岗位的反馈', content: mockMessageTemplates.rejection.content, recipient: '李明', tone: 'warm', editable: true },
            { type: 'quick_actions', title: '操作', actions: [
              { label: '发送拒信', icon: 'Send', message: '发送拒信' },
              { label: '调整语气', icon: 'Edit', message: '把语气改得更正式一些' },
            ]},
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A8. 团队与规划 ==========
  private handleHMTeamPlanning(intentId: number): EngineResult {
    switch (intentId) {
      case 52: // 团队能力诊断
        return {
          thinkingSteps: ['分析团队现状...', '识别能力缺口...', '生成诊断报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「推荐算法团队」能力诊断报告：' },
            { type: 'team_diagnosis', teamName: mockTeamDiagnosis.teamName, members: mockTeamDiagnosis.members, gaps: mockTeamDiagnosis.gaps, recommendations: mockTeamDiagnosis.recommendations },
          ]
        };
      case 53: // 招聘影响模拟
        return {
          thinkingSteps: ['分析候选人能力...', '模拟团队变化...', '生成影响预测...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '如果招聘「赵晨」，团队能力图谱变化预测：' },
            { type: 'team_diagnosis', teamName: mockTeamDiagnosis.teamName, members: mockTeamDiagnosis.members, gaps: mockTeamDiagnosis.gaps, recommendations: mockTeamDiagnosis.recommendations, afterHireSimulation: mockTeamDiagnosis.afterHireSimulation },
            { type: 'text', role: 'agent', content: '**模拟结论：**\n招聘赵晨后，团队在「社交推荐」「内容理解」「团队管理」三个维度将得到显著补强。但「大模型应用」和「工程架构」仍有缺口，建议Q3继续招聘。' },
          ]
        };
      case 54: // 招聘优先级建议
        return {
          thinkingSteps: ['分析业务需求...', '评估各岗位紧迫度...', '给出优先级建议...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '招聘优先级建议（基于业务紧迫度+市场难度）：\n\n**P0（立即招聘）：**\n1. 大模型算法工程师 - 业务急需内容理解能力，市场上人才稀缺\n2. 后端架构师 - 当前系统负载接近瓶颈，技术债累积\n\n**P1（Q2内完成）：**\n3. 高级推荐算法工程师 - 团队扩容，分担现有成员压力\n4. 前端技术负责人 - 产品体验升级需要前端能力补强\n\n**P2（Q3规划）：**\n5. 数据分析师 - 现有团队可临时支持，非最紧迫' },
            { type: 'quick_actions', title: '调整优先级', actions: [
              { label: '我要调整', icon: 'Edit', message: '我觉得后端架构师应该排第一' },
              { label: '看详细分析', icon: 'BarChart3', message: '帮我看每个岗位的详细分析' },
            ]},
          ]
        };
      case 55: // HC规划辅助
        return {
          thinkingSteps: ['分析当前HC...', '预测业务需求...', '评估HC充足度...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: 'Q3 HC规划评估：\n\n**当前状态：**\n· 已用HC：12人\n· 剩余HC：3人\n· Q3计划招聘：5人\n\n**缺口分析：**\n· **缺口2人** - 当前剩余HC不足以覆盖Q3招聘需求\n\n**建议：**\n1. 申请追加2个HC（推荐算法×1 + 后端架构×1）\n2. 内部转岗填补1个缺口（搜索团队有合适人选）\n3. 考虑实习生转正方案，降低HC压力\n\n**预算影响：**\n追加2个HC将增加约200万/年人力成本，但可支撑业务增长目标。' },
            { type: 'analytics', chartType: 'metric_grid', title: 'HC使用情况', data: { used: 12, remaining: 3, planned: 5, gap: 2 } },
          ]
        };
      case 56: // 历史招聘复盘
        return {
          thinkingSteps: ['调取历史数据...', '计算招聘成本...', '生成复盘报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '「后端架构师」历史招聘复盘（2023年）：\n\n**招聘周期：**\n· 岗位开放：2023年3月1日\n· 首个人入职：2023年6月15日\n· **总耗时：106天**\n\n**招聘成本：**\n· 猎头费用：15万（按年薪20%计算）\n· 面试官时间成本：约8万（20场面试 × 人均4小时 × 时薪1K）\n· 推广费用：2万\n· **人均招聘成本：25万**\n\n**效率分析：**\n· 简历→入职转化率：1.2%（行业平均2%）\n· 主要瓶颈：终面→offer（转化率40%，行业平均60%）\n\n**改进建议：**\n· 优化终面体验，增加总监1对1sell环节\n· 缩短offer决策周期至5天内' },
            { type: 'analytics', chartType: 'bar', title: '各环节转化率', data: [
              { name: '简历→初筛', value: 57 },
              { name: '初筛→面试', value: 35 },
              { name: '面试→终面', value: 42 },
              { name: '终面→offer', value: 40 },
              { name: 'offer→入职', value: 83 },
            ] },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== A9. 入职后闭环 ==========
  private handleHMPostHire(intentId: number): EngineResult {
    switch (intentId) {
      case 57: // 招聘质量回溯
        return {
          thinkingSteps: ['调取绩效数据...', '评估招聘质量...', '生成回溯报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '2023年招聘批次质量回溯报告：\n\n**总体评估：良好（入职12人，绩效B+以上占比75%）**\n\n**高绩效员工（绩效A）：**\n· 张三（推荐算法）：入职1年晋升P7，主导项目获业务方好评\n· 李四（后端开发）：解决核心系统瓶颈，QPS提升3倍\n\n**需关注员工（绩效B或以下）：**\n· 王五（产品经理）：入职后3个月离职，离职原因「文化不匹配」\n· 赵六（数据分析师）：绩效B，成长速度低于预期\n\n**复盘洞察：**\n· 技术岗位招聘质量高（绩效A占比80%）\n· 产品/运营岗位匹配度待提升\n· 离职员工中60%因「文化不匹配」，建议加强面试中的文化匹配考察' },
            { type: 'analytics', chartType: 'pie', title: '入职员工绩效分布', data: [
              { name: '绩效A（前20%）', value: 3 },
              { name: '绩效B+', value: 6 },
              { name: '绩效B', value: 2 },
              { name: '已离职', value: 1 },
            ] },
          ]
        };
      case 58: // Onboarding规划
        return {
          thinkingSteps: ['分析岗位需求...', '设计融入路径...', '生成30天计划...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '为「李明」生成的30天融入计划：' },
            { type: 'onboarding_plan', candidateName: mockOnboardingPlan.candidateName, position: mockOnboardingPlan.position, startDate: mockOnboardingPlan.startDate, plan: mockOnboardingPlan.plan, milestones: mockOnboardingPlan.milestones },
          ]
        };
      case 59: // 渠道质量分析
        return {
          thinkingSteps: ['分析渠道数据...', '计算留存率...', '生成渠道质量报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '各招聘渠道质量分析（基于2023-2024数据）：\n\n**留存率排名：**\n1. **内部推荐** - 留存率92%（13人中12人仍在职）\n2. **猎头** - 留存率78%（18人中14人仍在职）\n3. **校招** - 留存率75%（20人中15人仍在职）\n4. **Boss直聘** - 留存率65%（23人中15人仍在职）\n5. **脉脉** - 留存率55%（11人中6人仍在职）\n\n**人均成本排名（从低到高）：**\n1. 内部推荐：3万/人\n2. 校招：5万/人\n3. Boss直聘：8万/人\n4. 猎头：18万/人\n5. 脉脉：10万/人\n\n**结论：内部推荐是性价比最高的渠道，建议加大内推激励力度。**' },
            { type: 'analytics', chartType: 'bar', title: '渠道留存率对比', data: [
              { name: '内部推荐', value: 92 },
              { name: '猎头', value: 78 },
              { name: '校招', value: 75 },
              { name: 'Boss直聘', value: 65 },
              { name: '脉脉', value: 55 },
            ] },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== B. 招聘HR ==========
  private handleHRPipeline(intentId: number): EngineResult {
    switch (intentId) {
      case 60: // 全局Pipeline监控
        return {
          thinkingSteps: ['汇总所有岗位...', '计算健康度指标...', '生成全局视图...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '所有岗位Pipeline健康度一览：' },
            { type: 'pipeline_overview', title: '全局Pipeline健康度', jobs: mockPipelineOverview.jobs, summary: '共5个开放岗位，2个健康，2个风险，1个停滞。建议优先关注大模型和后端架构岗位。' },
          ]
        };
      case 61: // 风险预警
        return {
          thinkingSteps: ['分析目标进度...', '识别风险岗位...', '生成预警报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '⚠️ **Q2目标风险预警**\n\n**可能完不成Q2目标的岗位：**\n\n1. **后端架构师**（风险等级：🔴 高）\n   · Q2目标：2人\n   · 当前进度：0人\n   · 剩余时间：38天\n   · 原因：面试通过率极低，岗位老化\n\n2. **大模型算法工程师**（风险等级：🟡 中）\n   · Q2目标：3人\n   · 当前进度：0人（1个offer pending）\n   · 剩余时间：38天\n   · 原因：offer接受率低，竞品激烈\n\n**建议措施：**\n· 后端架构师：立即上调级别+放宽要求\n· 大模型：同时推进3个候选人到终面' },
            { type: 'pipeline_overview', title: '风险岗位详情', jobs: mockPipelineOverview.jobs.filter(j => j.status !== 'healthy'), summary: '建议立即采取干预措施。' },
          ]
        };
      case 62: // 流程滞留检测
        return {
          thinkingSteps: ['扫描流程数据...', '识别滞留候选人...', '生成催办清单...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '以下候选人卡了超过7天未推进：' },
            { type: 'candidate_list', title: '滞留候选人（>7天）', candidates: [
              { ...mockCandidates[0], status: 'interview', matchHighlights: ['初筛通过'], gapPoints: ['等待一面安排，已滞留9天'] },
              { ...mockCandidates[2], status: 'interview', matchHighlights: ['三面完成'], gapPoints: ['等待终面反馈，已滞留12天'] },
              { ...mockCandidates[4], status: 'interview', matchHighlights: ['终面通过'], gapPoints: ['等待offer审批，已滞留8天'] },
            ], sortable: false },
            { type: 'quick_actions', title: '催办操作', actions: [
              { label: '一键催办', icon: 'Bell', message: '批量催办所有滞留候选人' },
              { label: '查看详情', icon: 'FileText', message: '查看每个滞留候选人的详细原因' },
            ]},
          ]
        };
      case 63: // 自动化报告生成
        return {
          thinkingSteps: ['汇总周期数据...', '生成分析图表...', '输出报告文档...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '4月招聘月报已生成：' },
            { type: 'analytics', chartType: 'metric_grid', title: '4月关键指标', data: { openPositions: 5, newResumes: 156, interviews: 34, offers: 3, hired: 2, avgTimeToHire: 34 } },
            { type: 'analytics', chartType: 'funnel', title: '4月招聘漏斗', data: mockAnalytics.funnel },
            { type: 'text', role: 'agent', content: '**本月亮点：**\n· 简历量环比增长35%\n· 面试通过率稳定在38%\n· 2人成功入职\n\n**本月问题：**\n· offer接受率仅67%（目标80%）\n· 后端架构师岗位仍无进展\n\n**下月计划：**\n· 推进大模型岗位至少2个offer\n· 启动校招提前批' },
          ]
        };
      case 64: // 渠道效果分析
        return {
          thinkingSteps: ['统计渠道数据...', '计算ROI...', '生成效果分析...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '各渠道效果及ROI分析：' },
            { type: 'analytics', chartType: 'bar', title: '渠道ROI对比', data: [
              { name: '内部推荐', value: 12.5 },
              { name: '校招', value: 8.3 },
              { name: 'Boss直聘', value: 5.2 },
              { name: '脉脉', value: 3.8 },
              { name: '猎头', value: 2.1 },
            ] },
            { type: 'text', role: 'agent', content: '**ROI定义：** 候选人入职后1年绩效价值 / 渠道成本\n\n**结论：** 内部推荐ROI最高（12.5），建议将内推奖金从5K提升到8K。' },
          ]
        };
      case 65: // 供应商评估
        return {
          thinkingSteps: ['汇总供应商数据...', '评估交付质量...', '生成排名报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '猎头供应商评估排名（Q1）：\n\n**🥇 第一名：科锐国际**\n· 推荐人数：28人\n· 入职人数：5人\n· 转化率：17.9%\n· 平均招聘周期：42天\n· 综合评分：A\n\n**🥈 第二名：猎聘**\n· 推荐人数：45人\n· 入职人数：6人\n· 转化率：13.3%\n· 平均招聘周期：50天\n· 综合评分：B+\n\n**🥉 第三名：BOSS直聘猎头**\n· 推荐人数：32人\n· 入职人数：3人\n· 转化率：9.4%\n· 平均招聘周期：58天\n· 综合评分：B' },
          ]
        };
      case 66: // 候选人体验监控
        return {
          thinkingSteps: ['查询投递数据...', '统计未回复率...', '生成体验报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '候选人体验监控（本月）：\n\n📊 **关键指标：**\n· 投递总数：312人\n· 收到回复：267人（85.6%）\n· **未收到回复：45人（14.4%）** ⚠️\n· 平均回复时间：2.3天\n\n**未回复原因分析：**\n· 系统漏发：12人（需技术修复）\n· HR遗漏：18人（需加强流程管理）\n· 简历格式异常：8人（系统无法解析）\n· 其他：7人\n\n**改进措施：**\n1. 技术团队修复自动回复bug\n2. 建立「48小时未回复」自动预警\n3. 对格式异常简历增加人工复核环节' },
            { type: 'analytics', chartType: 'pie', title: '未回复原因分布', data: [
              { name: '系统漏发', value: 12 },
              { name: 'HR遗漏', value: 18 },
              { name: '格式异常', value: 8 },
              { name: '其他', value: 7 },
            ] },
          ]
        };
      case 67: // 合规检查
        return {
          thinkingSteps: ['扫描评价状态...', '识别未填人员...', '生成合规报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '面试评价合规检查：\n\n✅ **已填写评价**：28人\n❌ **未填写评价**：5人\n\n**未填写名单：**\n1. 王工 - 李明终面评价（超时3天）\n2. 张经理 - 赵晨二面评价（超时1天）\n3. 李总 - 王强HR面评价（超时2天）\n4. 陈工 - 刘洋一面评价（当天，正常）\n5. 周工 - 陈思终面评价（当天，正常）\n\n**合规率：84.8%（目标95%）**\n\n建议对王工、张经理、李总发送提醒。' },
            { type: 'quick_actions', title: '操作', actions: [
              { label: '发送提醒', icon: 'Bell', message: '帮我给用人经理发提醒' },
              { label: '查看详情', icon: 'FileText', message: '查看每个未填评价的详情' },
            ]},
          ]
        };
      case 68: // 催办通知
        return {
          thinkingSteps: ['识别待办事项...', '生成催办消息...', '发送提醒通知...'],
          delay: 1000,
          responses: [
            { type: 'text', role: 'agent', content: '已生成催办通知，发送给用人经理：' },
            { type: 'message_template', templateType: 'reminder', subject: '候选人反馈提醒', content: mockMessageTemplates.reminder.content, recipient: '用人经理', tone: 'professional', editable: true },
          ]
        };
      case 69: // 人才复用/跨岗推荐
        return {
          thinkingSteps: ['分析候选人能力...', '匹配其他岗位...', '生成流转建议...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「刘洋」的跨岗推荐分析：\n\n**当前岗位匹配：大模型算法工程师（匹配度：65%）**\n· 优势：NLP背景、大模型微调经验\n· 劣势：无推荐系统经验\n\n**更匹配的岗位：**\n1. **NLP算法工程师（AI Lab）** - 匹配度92%\n   · 技能完全对口\n   · 团队有HC\n\n2. **搜索算法工程师** - 匹配度78%\n   · 搜索与NLP技术栈相近\n   · 当前团队急缺人手\n\n**建议：**推荐流转到AI Lab的NLP岗位，技能匹配度最高。' },
            { type: 'candidate_list', title: '跨岗推荐', candidates: [
              { ...mockCandidates[5], matchScore: 92, matchHighlights: ['NLP经验完全对口', '大模型微调经验'], gapPoints: [] },
            ], sortable: false },
          ]
        };
      case 70: // 根因分析
        return {
          thinkingSteps: ['分析漏斗数据...', '识别关键流失点...', '生成根因分析...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '初面通过率偏低根因分析：\n\n**数据表现：**\n· 初面通过率：15%（行业平均35%，团队历史平均28%）\n\n**根因拆解：**\n\n1. **面试官问题（贡献40%）**\n   · 王工评分偏严（已识别）\n   · 新面试官缺乏培训，提问标准不统一\n\n2. **简历筛选问题（贡献30%）**\n   · 初筛标准过松，导致大量不匹配候选人进入面试\n   · 建议引入AI初筛，提升筛选精度\n\n3. **岗位定位问题（贡献20%）**\n   · JD描述与实际需求有偏差，候选人预期错位\n   · 建议校准JD和实际要求\n\n4. **候选人质量问题（贡献10%）**\n   · 市场上优秀人才稀缺，简历质量整体下滑' },
            { type: 'analytics', chartType: 'bar', title: '根因贡献度', data: [
              { name: '面试官', value: 40 },
              { name: '简历筛选', value: 30 },
              { name: '岗位定位', value: 20 },
              { name: '候选人质量', value: 10 },
            ] },
          ]
        };
      case 71: // 成本核算
        return {
          thinkingSteps: ['汇总成本数据...', '计算人均成本...', '生成成本报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: 'Q1招聘成本核算：\n\n**总招聘成本：186万**\n· 猎头费用：98万\n· 渠道推广：28万\n· 面试官时间成本：42万\n· 招聘系统/工具：12万\n· 校招差旅/物料：6万\n\n**入职人数：12人**\n\n**人均招聘成本：15.5万**\n\n**对标：**\n· 行业平均：12-18万/人\n· 我们处于行业中位\n\n**优化空间：**\n· 提升内部推荐占比（当前25% → 目标40%），可降低人均成本至12万\n· 优化猎头使用（聚焦高难度岗位，减少通用岗位使用）' },
            { type: 'analytics', chartType: 'pie', title: '成本结构分布', data: [
              { name: '猎头费用', value: 98 },
              { name: '面试官时间', value: 42 },
              { name: '渠道推广', value: 28 },
              { name: '系统工具', value: 12 },
              { name: '校招物料', value: 6 },
            ] },
          ]
        };
      case 72: // 汇报材料生成
        return {
          thinkingSteps: ['汇总关键数据...', '提炼业务洞察...', '生成汇报PPT大纲...'],
          delay: 1800,
          responses: [
            { type: 'text', role: 'agent', content: '给业务leader的招聘汇报材料已生成：\n\n**汇报大纲：**\n\n1. **Q1招聘成果（2分钟）**\n   · 入职12人，完成率80%\n   · 关键岗位：推荐算法×3、后端架构×2、产品×2\n   · 人均招聘成本15.5万（行业中位）\n\n2. **当前挑战（3分钟）**\n   · 后端架构师岗位老化（45天0进展）\n   · offer接受率偏低（67% vs 目标80%）\n   · Q2 HC缺口2人\n\n3. **需要业务支持（2分钟）**\n   · 请总监参与终面sell环节\n   · 申请上调后端架构师岗位级别\n   · 审批追加2个HC' },
            { type: 'analytics', chartType: 'metric_grid', title: 'Q1招聘核心指标', data: { hired: 12, completionRate: 80, avgCost: 15.5, openPositions: 5 } },
          ]
        };
      case 73: // 候选人体验分析
        return {
          thinkingSteps: ['调取调研数据...', '分析满意度...', '生成体验报告...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '候选人满意度调研结果（N=89）：\n\n**总体满意度：4.2/5.0**\n\n**各维度评分：**\n· 面试流程清晰度：4.5/5 ✅\n· 面试官专业度：4.3/5 ✅\n· 反馈及时性：3.6/5 ⚠️\n· offer沟通体验：3.8/5 ⚠️\n· 入职前关怀：4.0/5\n\n**负面反馈Top 3：**\n1. 「等了一周才收到面试结果」（出现23次）\n2. 「offer只是邮件通知，缺少电话沟通」（出现15次）\n3. 「面试官迟到」（出现8次）\n\n**改进建议：**\n· 建立「48小时反馈」SLA\n· offer阶段增加总监电话沟通\n· 加强面试官时间管理培训' },
            { type: 'analytics', chartType: 'bar', title: '各维度满意度', data: [
              { name: '流程清晰度', value: 4.5 },
              { name: '面试官专业度', value: 4.3 },
              { name: '入职前关怀', value: 4.0 },
              { name: 'offer沟通', value: 3.8 },
              { name: '反馈及时性', value: 3.6 },
            ] },
          ]
        };
      case 74: // 批量操作
        return {
          thinkingSteps: ['确认批量对象...', '生成批量模板...', '执行批量发送...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '已为你准备批量拒信模板（20位候选人）：\n\n**批量对象：**\n· 后端架构师岗位：8人\n· 大模型算法岗位：7人\n· 前端技术负责人岗位：5人\n\n**模板预览：**' },
            { type: 'message_template', templateType: 'rejection', subject: '关于XX岗位的反馈', content: '你好：\n\n感谢你对XX公司的关注和投递。经过慎重评估，我们认为你的背景与该岗位的要求存在一定差距。\n\n这绝不意味着你的能力不足——我们会将你的档案保留在人才库中，如果有更匹配的岗位开放，我们会第一时间联系你。\n\n再次感谢你的信任，祝你早日找到合适的机会！\n\n此致\nXX公司招聘团队', recipient: '20位候选人', tone: 'professional', editable: true },
            { type: 'quick_actions', title: '批量操作', actions: [
              { label: '确认发送', icon: 'Send', message: '确认发送批量拒信' },
              { label: '调整模板', icon: 'Edit', message: '帮我调整一下模板内容' },
            ]},
          ]
        };
      case 75: // 竞对招聘动态
        return {
          thinkingSteps: ['收集竞对信息...', '分析招聘动态...', '生成动态报告...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '竞品招聘动态（近30天）：\n\n**字节跳动：**\n· 新增HC：320个（主要集中在AI/推荐/大模型）\n· 重点岗位：大模型算法（+45）、推荐算法（+38）、AI infra（+25）\n· 薪资策略：总包上调10-15%，签字费最高20万\n\n**阿里巴巴：**\n· 新增HC：180个\n· 重点岗位：通义千问相关（+60）、淘宝推荐（+30）\n· 特色动作：启动「AI精英计划」，博士起薪 package 200万+\n\n**腾讯：**\n· 新增HC：150个\n· 重点岗位：混元大模型（+40）、视频号推荐（+35）\n· 特色动作：推出「技术专家回流计划」，吸引海外人才\n\n**对我们的影响：**\n· 大模型人才竞价将进一步白热化\n· 建议尽快锁定已面试的优秀候选人\n· 考虑启动「海外招聘」补充国内缺口' },
            { type: 'market_analysis', title: '竞品新增HC分布', analysisType: 'competitor', data: [
              { label: '字节跳动', value: 320, detail: 'AI/推荐/大模型' },
              { label: '阿里巴巴', value: 180, detail: '通义千问/淘宝推荐' },
              { label: '腾讯', value: 150, detail: '混元/视频号' },
              { label: '美团', value: 85, detail: '本地生活算法' },
              { label: '其他', value: 120, detail: '创业公司' },
            ], insights: ['字节跳动HC增速最快，是我们的主要竞争对手', '大模型方向是所有大厂的重点'], chartType: 'bar' },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== C. 候选人自助 ==========
  private handleCandidateSelfService(intentId: number): EngineResult {
    switch (intentId) {
      case 76: // 智能岗位推荐
        return {
          thinkingSteps: ['分析候选人背景...', '匹配开放岗位...', '生成推荐列表...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '基于你的背景，我为你推荐以下岗位：' },
            { type: 'candidate_list', title: '适合你的岗位', candidates: [
              { avatar: null, id: 'j001', name: '高级推荐算法工程师', currentCompany: '技术部-推荐团队', currentTitle: '高级', experience: 0, education: '92%匹配', matchScore: 92, matchHighlights: ['你的推荐系统经验非常契合'], gapPoints: [], tags: ['推荐系统', '算法', '深度学习'], status: 'active' },
              { avatar: null, id: 'j004', name: '大模型算法工程师', currentCompany: '技术部-AI Lab', currentTitle: '高级', experience: 0, education: '78%匹配', matchScore: 78, matchHighlights: ['NLP经验可迁移到大模型'], gapPoints: ['缺乏LLM微调经验'], tags: ['大模型', 'NLP', 'PyTorch'], status: 'active' },
              { avatar: null, id: 'j005', name: '数据分析师', currentCompany: '数据部-商业分析', currentTitle: '中级', experience: 0, education: '65%匹配', matchScore: 65, matchHighlights: ['数据分析能力通用'], gapPoints: ['非技术核心岗位'], tags: ['SQL', '数据分析', '可视化'], status: 'active' },
            ], sortable: true },
          ]
        };
      case 77: // 岗位发现/搜索
        return {
          thinkingSteps: ['解析搜索意图...', '查询开放岗位...', '生成岗位列表...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「AI方向」当前开放的岗位：' },
            { type: 'candidate_list', title: 'AI方向开放岗位', candidates: [
              { avatar: null, id: 'j001', name: '高级推荐算法工程师', currentCompany: '技术部-推荐团队', currentTitle: '高级', experience: 0, education: '5年以上经验', matchScore: 0, matchHighlights: ['推荐系统核心岗'], gapPoints: [], tags: ['推荐系统', '排序模型', 'AB实验'], status: 'active' },
              { avatar: null, id: 'j004', name: '大模型算法工程师', currentCompany: '技术部-AI Lab', currentTitle: '高级', experience: 0, education: '3年以上经验', matchScore: 0, matchHighlights: ['大模型核心岗'], gapPoints: [], tags: ['大模型', 'NLP', 'RLHF'], status: 'active' },
              { avatar: null, id: 'j002', name: '后端架构师', currentCompany: '技术部-架构组', currentTitle: '专家', experience: 0, education: '8年以上经验', matchScore: 0, matchHighlights: ['AI infra支撑'], gapPoints: [], tags: ['架构', 'Java', '分布式'], status: 'active' },
            ], sortable: false },
            { type: 'text', role: 'agent', content: '需要我详细介绍某个岗位吗？' },
          ]
        };
      case 78: // 进度查询
        return {
          thinkingSteps: ['查询申请记录...', '获取最新进度...', '生成进度报告...'],
          delay: 1000,
          responses: [
            { type: 'text', role: 'agent', content: '你申请的**高级推荐算法工程师**目前进展：' },
            { type: 'timeline', candidateName: '你', stages: [
              { name: '简历投递', status: 'completed', date: '3月20日' },
              { name: '简历筛选通过', status: 'completed', date: '3月22日' },
              { name: '一面（技术面）通过', status: 'completed', date: '3月28日' },
              { name: '二面（团队面）', status: 'current', date: '4月10日 14:00' },
              { name: '终面', status: 'pending' },
              { name: 'Offer', status: 'pending' },
            ] },
            { type: 'text', role: 'agent', content: '二面将由技术总监主持，主要考察系统设计和团队协作。\n\n需要我帮你准备面试吗？' },
          ]
        };
      case 79: // 面试预期管理
        return {
          thinkingSteps: ['分析岗位要求...', '预测面试方向...', '生成准备指南...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「高级推荐算法工程师」面试指南：\n\n**面试轮次：**\n1. 一面（技术面，60分钟）\n2. 二面（团队面/系统设计，60分钟）\n3. 终面（总监面，45分钟）\n\n**重点考察方向：**\n· 推荐系统全流程（召回→排序→重排）\n· 排序模型（Wide&Deep、DeepFM、DIN等）\n· AB实验设计与分析\n· 工程落地能力（特征工程、模型Serving）\n\n**建议准备：**\n· 梳理你最得意的1-2个项目，准备STAR式讲述\n· 复习常见的推荐算法面试题\n· 准备2-3个反问问题（展示你的思考深度）' },
            { type: 'interview_questions', candidateName: '你', position: '高级推荐算法工程师', categories: [
              { category: '高频面试题', questions: [
                { question: '请简述推荐系统的经典架构', difficulty: 'easy', purpose: '基础理解' },
                { question: '冷启动问题如何解决？', difficulty: 'medium', purpose: '问题解决' },
                { question: 'AB实验中如何判断结果是否显著？', difficulty: 'medium', purpose: '数据分析' },
              ]},
            ] },
          ]
        };
      case 80: // AI模拟面试
        return {
          thinkingSteps: ['配置模拟场景...', '生成模拟题目...', '开始模拟面试...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '好的，我们开始模拟面试！\n\n**场景**：你是高级推荐算法工程师候选人，我是技术面试官。\n\n---\n\n**第一题（基础）：**\n"请简述推荐系统的经典架构，包括召回、排序、重排各层的作用。"\n\n💡 **你可以现在回答，我会给你反馈和追问。**\n\n（输入你的回答，或说「下一题」跳过）' },
            { type: 'quick_actions', title: '模拟面试', actions: [
              { label: '获取提示', icon: 'Lightbulb', message: '给我一些答题提示' },
              { label: '下一题', icon: 'ArrowRight', message: '下一题' },
              { label: '结束模拟', icon: 'X', message: '结束模拟面试' },
            ]},
          ]
        };
      case 81: // 团队/岗位信息查询
        return {
          thinkingSteps: ['查询团队信息...', '获取leader资料...', '生成团队介绍...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「推荐算法团队」介绍：\n\n**团队定位：**\n负责公司核心推荐系统的算法研发和优化，直接影响DAU和GMV。\n\n**团队规模：**\n· 算法工程师：8人\n· 工程开发：5人\n· 产品经理：2人\n\n**Leader：王工（技术总监）**\n· 背景：前美团推荐算法负责人，10年经验\n· 风格：技术导向，重视数据驱动，鼓励创新\n· 团队文化：开放、扁平、结果导向\n\n**技术栈：**\nTensorFlow 2.x / PyTorch / Spark / Flink / Kubernetes\n\n**近期重点项目：**\n· 推荐系统架构重构（千万级DAU）\n· 多模态推荐（视频+图文）\n· 大模型在推荐中的应用探索' },
            { type: 'profile_card', data: { id: 'leader001', name: '王工', avatar: null, currentCompany: '本公司', currentTitle: '技术总监', experience: 10, education: '清华博士', skills: ['推荐系统', '团队管理', '架构设计'], careerHistory: [{ company: '本公司', title: '技术总监', period: '2022-至今', highlights: ['搭建推荐团队', 'DAU提升30%'] }, { company: '美团', title: '推荐算法负责人', period: '2015-2022', highlights: ['主导推荐系统重构'] }], projects: [] }, actions: ['view_resume'] },
          ]
        };
      case 82: // 薪酬福利咨询
        return {
          thinkingSteps: ['查询薪酬政策...', '对标市场水平...', '生成薪酬说明...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「高级推荐算法工程师」薪酬结构：\n\n**现金部分：**\n· 月薪：60-80K（根据面试表现定级）\n· 年终奖：2-4个月（根据绩效）\n· 签字费：5-10万（特殊人才）\n\n**期权部分：**\n· 期权：20-50万股（4年归属）\n· 当前估值：每股4元\n· 预期上市估值：每股15-20元\n\n**福利：**\n· 六险一金（全额缴纳）\n· 免费三餐\n· 租房补贴：3K/月（前6个月）\n· 年度体检\n· 带薪年假：15天\n\n**总包参考：**\n· P7级别：约100-130万/年\n· P8级别：约140-180万/年' },
          ]
        };
      case 83: // 岗位匹配咨询
        return {
          thinkingSteps: ['分析候选人画像...', '对比岗位匹配度...', '生成匹配建议...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '「高级推荐算法工程师」vs「大模型算法工程师」匹配度对比：' },
            { type: 'comparison', title: '岗位匹配度对比', candidateA: { name: '高级推荐算法工程师', avatar: null }, candidateB: { name: '大模型算法工程师', avatar: null }, items: [
              { label: '你的技能匹配', candidateA: '95%（推荐系统经验完全对口）', candidateB: '70%（NLP可迁移，但缺LLM经验）', advantage: 'A' },
              { label: '职业发展', candidateA: '路径清晰（专家→架构师→总监）', candidateB: '新兴方向，机会多但不确定性高', advantage: 'neutral' },
              { label: '团队成熟度', candidateA: '团队成熟，有人带', candidateB: '新团队，需要一起搭建', advantage: 'A' },
              { label: '业务影响力', candidateA: '直接关联GMV，ROI可见', candidateB: '探索性项目，短期难量化', advantage: 'A' },
              { label: '薪资竞争力', candidateA: '市场中位', candidateB: '溢价15-20%（人才稀缺）', advantage: 'B' },
            ], recommendation: '综合来看，「高级推荐算法工程师」更适合你——技能匹配度高、团队成熟、职业路径清晰。除非你特别看好大模型方向且愿意承担不确定性。' },
          ]
        };
      case 84: // 简历优化建议
        return {
          thinkingSteps: ['分析当前简历...', '对比岗位要求...', '生成优化建议...'],
          delay: 1500,
          responses: [
            { type: 'text', role: 'agent', content: '简历优化建议（针对「高级推荐算法工程师」）：\n\n**亮点（保持）：**\n· 美团千万级DAU推荐系统经验非常亮眼\n· AB实验方法论成熟，有数据支撑\n\n**建议优化：**\n\n1. **量化成果**\n   ❌ "负责推荐系统优化"\n   ✅ "主导推荐系统排序模型优化，CTR提升12%，DAU增长15%"\n\n2. **补充技术细节**\n   ❌ "使用TensorFlow搭建模型"\n   ✅ "基于TensorFlow 2.x搭建DeepFM排序模型，Serving QPS从5K提升到20K"\n\n3. **突出团队协作**\n   · 增加与产品/工程团队协作的案例\n   · 展示跨部门推动项目的能力\n\n4. **补充开源/影响力**\n   · 如有GitHub项目、技术博客、专利，务必补充' },
            { type: 'quick_actions', title: '优化操作', actions: [
              { label: '生成优化版', icon: 'FileText', message: '帮我生成一份优化后的简历' },
              { label: '模拟投递', icon: 'Send', message: '模拟投递这个岗位看看匹配度' },
            ]},
          ]
        };
      case 85: // 面试改期
        return {
          thinkingSteps: ['查询可改期时段...', '确认新时间...', '生成改期方案...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '已为你查询可改期的时段：\n\n你当前的二面时间：**4月10日 14:00**\n\n可选改期时段：' },
            { type: 'schedule_card', candidateName: '你', position: '高级推荐算法工程师-二面', suggestedSlots: [
              { date: '4月11日（周四）', time: '10:00-11:00', interviewer: '技术总监 王工', type: '二面', available: true },
              { date: '4月11日（周四）', time: '14:00-15:00', interviewer: '技术总监 王工', type: '二面', available: true },
              { date: '4月12日（周五）', time: '10:00-11:00', interviewer: '技术总监 王工', type: '二面', available: false },
            ], notes: '请尽快确认，以免影响后续流程安排。' },
            { type: 'quick_actions', title: '改期操作', actions: [
              { label: '确认改期', icon: 'Check', message: '帮我改到4月11日10点' },
              { label: '其他时间', icon: 'Calendar', message: '还有其他时间吗' },
            ]},
          ]
        };
      case 86: // 入职引导
        return {
          thinkingSteps: ['查询入职要求...', '整理材料清单...', '生成入职指南...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '入职准备清单：\n\n**必须材料（入职当天携带）：**\n· 身份证原件及复印件（2份）\n· 学历证书、学位证书原件及复印件\n· 离职证明原件（需盖公章）\n· 银行卡（用于工资发放）\n· 1寸白底证件照（2张）\n\n**电子材料（提前发送至HR邮箱）：**\n· 个人简历（最新版）\n· 社保/公积金转移单\n· 体检报告（3个月内有效）\n\n**入职流程：**\nDay 1：上午办理入职手续 → 下午IT配置+团队介绍\nDay 2-3：参加新员工培训\nDay 4-5：跟随Buddy熟悉业务\n\n**有问题随时联系HR：hr@company.com' },
            { type: 'onboarding_plan', candidateName: '你', position: '高级推荐算法工程师', startDate: '待定', plan: [
              { day: 'Day 1', tasks: [
                { title: '入职手续办理', owner: 'HR', type: 'hr' },
                { title: 'IT环境配置', owner: 'IT', type: 'hr' },
                { title: '团队介绍', owner: 'Buddy', type: 'buddy' },
              ]},
              { day: 'Day 2-3', tasks: [
                { title: '新员工培训', owner: 'HR', type: 'hr' },
                { title: '企业文化介绍', owner: 'HR', type: 'hr' },
              ]},
              { day: 'Day 4-5', tasks: [
                { title: '业务熟悉', owner: 'Buddy', type: 'buddy' },
                { title: '代码环境配置', owner: 'Self', type: 'self' },
              ]},
            ], milestones: ['完成入职手续', '通过新员工培训', '提交第一个PR'] },
          ]
        };
      case 87: // 内推入口
        return {
          thinkingSteps: ['生成内推链接...', '准备推荐模板...', '发送内推邀请...'],
          delay: 1000,
          responses: [
            { type: 'text', role: 'agent', content: '内推邀请已生成！\n\n**你的专属内推码：NEITUI_2024_XYZ**\n\n**内推奖励：**\n· 被推荐人成功入职，你获得 **5,000元** 奖金\n· 被推荐人通过试用期，额外获得 **3,000元** 奖金\n\n**分享方式：**\n1. 复制内推链接发送给朋友\n2. 让朋友投递时填写你的内推码\n3. 你可以在内推后台查看进度\n\n**内推链接：** https://company.com/jobs?ref=NEITUI_2024_XYZ' },
            { type: 'quick_actions', title: '分享', actions: [
              { label: '复制链接', icon: 'Copy', message: '复制内推链接' },
              { label: '分享到微信', icon: 'Share', message: '生成微信分享卡片' },
            ]},
          ]
        };
      case 88: // 反馈解释
        return {
          thinkingSteps: ['分析反馈内容...', '解释具体含义...', '提供改进建议...'],
          delay: 1200,
          responses: [
            { type: 'text', role: 'agent', content: '关于「不匹配」的详细解释：\n\n**「不匹配」通常有以下几种含义：**\n\n1. **技能方向不匹配（最常见）**\n   · 你的技术栈与岗位核心要求有偏差\n   · 例如：岗位需要推荐系统经验，你的背景偏NLP\n\n2. **经验年限不匹配**\n   · 岗位要求5年+，你的经验略低于要求\n   · 或岗位是P7级别，你的能力接近P6\n\n3. **场景经验不匹配**\n   · 岗位需要特定行业经验（如电商、社交）\n   · 你的经验来自不同场景（如金融、医疗）\n\n4. **文化/价值观不匹配**\n   · 面试中展现的工作风格与团队文化有冲突\n\n**如何改进：**\n· 如果技能方向有偏差，可以在简历中突出可迁移能力\n· 如果年限不足，可以强调项目深度和学习能力\n· 建议投递更匹配你背景的岗位（如我们的NLP算法工程师岗位）\n\n**你的档案已保留在人才库**，有更匹配的岗位我们会主动联系你。' },
          ]
        };
      default:
        return this.getDefaultResponse();
    }
  }

  // ========== 兜底关键词匹配 ==========
  private fallbackKeywordMatch(input: string): EngineResult {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('找人') || lowerInput.includes('搜索') || lowerInput.includes('候选人')) {
      return {
        thinkingSteps: ['解析需求...', '搜索候选人库...'],
        delay: 1500,
        responses: [
          { type: 'text', role: 'agent', content: '为你找到以下匹配的候选人（Mock 数据模式）：' },
          { type: 'candidate_list', title: '推荐候选人', candidates: mockCandidates.slice(0, 3) }
        ]
      };
    }

    if (lowerInput.includes('进度') || lowerInput.includes('报告') || lowerInput.includes('数据')) {
      return {
        thinkingSteps: ['汇总数据...', '生成报告...'],
        delay: 1500,
        responses: [
          { type: 'analytics', chartType: 'metric_grid', title: '招聘概况', data: mockAnalytics.metrics },
          { type: 'text', role: 'agent', content: '以上是当前的招聘数据（Mock 数据模式）。配置 API Key 后可获取智能分析。' }
        ]
      };
    }

    if (lowerInput.includes('面试') || lowerInput.includes('安排')) {
      return {
        delay: 1000,
        responses: [
          { type: 'text', role: 'agent', content: '我来帮你安排面试。以下是待安排面试的候选人：' },
          { type: 'candidate_list', title: '待安排面试', candidates: mockCandidates.slice(0, 3) },
          { type: 'quick_actions', title: '快速操作', actions: [
            { label: '自动安排', icon: 'Calendar', message: '帮我自动安排所有面试' },
            { label: '查看面试官', icon: 'Users', message: '查看可用面试官' }
          ]},
        ]
      };
    }

    return this.getDefaultResponse();
  }

  // ========== 默认响应 ==========
  private getDefaultResponse(): EngineResult {
    const roleName = this.role === 'hm' ? '用人经理' : this.role === 'hr' ? '招聘HR' : '候选人';
    
    return {
      delay: 800,
      responses: [
        {
          type: 'text',
          role: 'agent',
          content: this.modelClient 
            ? `收到你的问题。作为你的招聘合伙人，我需要更多信息来给你最精准的帮助。\n\n你可以尝试这样问我：\n\n**找人相关：**\n· "帮我找3年经验的推荐算法工程师"\n· "把李明的简历发给我"\n· "这两个人对比一下"\n\n**数据报告：**\n· "这个岗位招聘进度怎么样"\n· "团队缺什么能力"\n\n**文档生成：**\n· "帮我写个高级后端工程师的JD"\n· "生成一封温暖的拒信"\n\n或者告诉我你当前遇到的具体招聘问题，我会像资深猎头顾问一样帮你分析。`
            : `我是你的 AI 招聘合伙人，目前已覆盖 **88 种招聘场景**。\n\n作为**${roleName}**，你可以这样和我对话：\n\n**找人：**\n· "帮我找一个张伟，之前在美团做推荐的"\n· "这批简历里挑最合适的5个"\n· "我想找一个像李四一样的人"\n\n**分析：**\n· "这个岗位的市场难度怎么样"\n· "做LLM的人才主要在哪些公司"\n· "团队现在缺什么能力"\n\n**决策：**\n· "这个人值不值得给offer"\n· "这两个人帮我对比一下"\n· "为什么推荐了这个人"\n\n**流程：**\n· "我的招聘进度报告是什么样的"\n· "帮我约这个候选人下周三下午面试"\n· "卡在哪个环节了"\n\n配置 API Key 后，我会调用真实模型给你更智能的分析。`
        },
        {
          type: 'quick_actions',
          title: '你可以这样开始',
          actions: getRoleQuickActions(this.role)
        }
      ]
    };
  }

  // ========== 卡片点击处理 ==========
  handleCardClick(_cardId: string, payload: CardActionPayload): EngineResult {
    const { action } = payload;
    
    if (action === 'quick_action' && payload.message) {
      return this.processWithMock(payload.message);
    }

    switch (action) {
      case 'shortlist':
        return {
          delay: 500,
          responses: [
            { type: 'text', role: 'agent', content: `已将候选人加入面试流程。` + (this.modelClient ? '' : '（Mock 模式）') }
          ]
        };
      case 'reject':
        return {
          delay: 500,
          responses: [
            { type: 'text', role: 'agent', content: '已标记该候选人为不匹配。' }
          ]
        };
      default:
        return {
          delay: 300,
          responses: [
            { type: 'text', role: 'agent', content: `操作已执行: ${action}` + (this.modelClient ? '' : '（Mock 模式）') }
          ]
        };
    }
  }

  // ========== 欢迎消息 ==========
  getWelcomeMessage(): EngineResult {
    const welcomeContent = getWelcomeMessage(this.role);
    const modeHint = this.modelClient ? '' : '\n\n⚠️ **当前处于 Mock 模式**。已覆盖 **88种招聘场景**，点击设置按钮配置 API Key 可启用智能模型。';
    
    return {
      delay: 0,
      responses: [
        { type: 'text', role: 'agent', content: welcomeContent + modeHint },
        { type: 'quick_actions', title: '快速开始', actions: getRoleQuickActions(this.role) }
      ]
    };
  }

  // ========== 工具方法 ==========
  switchRole(newRole: UserRole) {
    this.role = newRole;
    this.history = [];
  }

  getRole(): UserRole {
    return this.role;
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  isUsingModel(): boolean {
    return !!this.modelClient && !this.useMockFallback;
  }

  updateModelConfig(config: ModelConfig) {
    try {
      this.modelClient = createModelClient(config);
      this.useMockFallback = false;
      console.log(`[SmartEngine] 已切换到模型: ${config.provider}/${config.model}`);
    } catch (error) {
      console.error('[SmartEngine] 更新模型配置失败:', error);
      this.useMockFallback = true;
    }
  }
}

// 工厂函数
export function createSmartEngine(role: UserRole, modelConfig?: ModelConfig): SmartConversationEngine {
  return new SmartConversationEngine(role, modelConfig);
}

export type { EngineResult, EngineResponse, CardActionPayload };
