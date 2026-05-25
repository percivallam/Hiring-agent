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
  QuickAction
} from '@/types';
import { 
  mockCandidates, 
  mockCandidatesEngineering, 
  mockAnalytics, 
  jdContent,
  getWelcomeMessage 
} from './mockData';

// 引擎响应类型
type EngineResponse = 
  | Omit<TextMessage, 'id' | 'timestamp'>
  | Omit<CandidateCardMessage, 'id' | 'timestamp'>
  | Omit<CandidateListMessage, 'id' | 'timestamp'>
  | Omit<AnalyticsMessage, 'id' | 'timestamp'>
  | Omit<JDCardMessage, 'id' | 'timestamp'>
  | Omit<EvaluationMessage, 'id' | 'timestamp'>
  | Omit<QuickActionsMessage, 'id' | 'timestamp'>
  | Omit<TimelineMessage, 'id' | 'timestamp'>;

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

// 对话规则接口
interface ConversationRule {
  keywords: string[];
  role?: UserRole;
  handler: (context: EngineContext) => EngineResult;
}

// 引擎上下文
interface EngineContext {
  role: UserRole;
  input: string;
  history: string[];
}

export class ConversationEngine {
  private role: UserRole;
  private history: string[] = [];
  private rules: ConversationRule[] = [];

  constructor(role: UserRole) {
    this.role = role;
    this.initRules();
  }

  // 初始化对话规则
  private initRules() {
    this.rules = [
      {
        keywords: ['找人', '搜索', '候选人', '推荐系统', '帮我找', '推荐'],
        role: 'hm',
        handler: () => ({
          thinkingSteps: ['解析你的需求...', '搜索候选人库...', '智能匹配排序...'],
          delay: 2000,
          responses: [
            { 
              type: 'text', 
              role: 'agent',
              content: '在候选人库中为你找到 **23 位**匹配的推荐系统人才，以下是匹配度最高的 5 位：' 
            },
            { 
              type: 'candidate_list', 
              title: '推荐候选人（按匹配度排序）',
              candidates: mockCandidates 
            },
            { 
              type: 'text', 
              role: 'agent',
              content: '需要我调整搜索条件吗？比如限定年限、公司背景或细分方向。' 
            },
          ],
        }),
      },
      {
        keywords: ['太偏算法', '要能落地', '工程', '不要研究', '不要学术', '落地'],
        role: 'hm',
        handler: () => ({
          thinkingSteps: ['理解你的修正...', '调整匹配权重...', '重新排序...'],
          delay: 1500,
          responses: [
            { 
              type: 'text', 
              role: 'agent',
              content: '明白，你更看重**工程落地能力**，我调整了排序权重：\n· 工程经验权重 ↑↑\n· 学术背景权重 ↓\n\n更新后的推荐：' 
            },
            { 
              type: 'candidate_list', 
              title: '调整后的推荐（侧重工程能力）',
              candidates: mockCandidatesEngineering 
            },
          ],
        }),
      },
      {
        keywords: ['进度', '报告', '数据', '漏斗', '怎么样了', '情况'],
        role: 'hm',
        handler: () => ({
          thinkingSteps: ['汇总招聘数据...', '分析转化率...', '生成洞察...'],
          delay: 2500,
          responses: [
            { 
              type: 'analytics', 
              chartType: 'metric_grid',
              title: '关键指标',
              data: mockAnalytics.metrics 
            },
            { 
              type: 'analytics', 
              chartType: 'funnel',
              title: '招聘漏斗',
              data: mockAnalytics.funnel 
            },
            { 
              type: 'text', 
              role: 'agent',
              content: '⚠️ 值得关注：\n· **后端架构师**已开放 45 天，面试通过率仅 15%\n· **推荐算法**本周新增 5 份高匹配简历' 
            },
            { 
              type: 'quick_actions', 
              title: '下一步操作',
              actions: [
                { label: '查看架构师详情', icon: 'FileText', message: '后端架构师岗位详情' },
                { label: '分析面试瓶颈', icon: 'BarChart3', message: '为什么面试通过率这么低' },
              ] 
            },
          ],
        }),
      },
      {
        keywords: ['写JD', '职位描述', '岗位描述', 'JD', '招聘文案'],
        role: 'hm',
        handler: () => ({
          thinkingSteps: ['分析岗位需求...', '参考同类JD...', '生成草稿...'],
          delay: 3000,
          responses: [
            { 
              type: 'jd_card', 
              title: '高级推荐算法工程师',
              content: jdContent,
              status: 'draft',
              actions: ['edit', 'publish', 'copy']
            },
            { 
              type: 'text', 
              role: 'agent',
              content: 'JD 草稿已生成。你可以直接编辑，或告诉我需要调整什么。' 
            },
          ],
        }),
      },
      {
        keywords: ['面试', '安排面试', '约面'],
        role: 'hm',
        handler: () => ({
          delay: 1000,
          responses: [
            {
              type: 'text',
              role: 'agent',
              content: '我来帮你安排面试。以下是待安排面试的候选人：'
            },
            {
              type: 'candidate_list',
              title: '待安排面试',
              candidates: mockCandidates.slice(0, 3)
            },
            {
              type: 'quick_actions',
              title: '快速操作',
              actions: [
                { label: '自动安排', icon: 'Calendar', message: '帮我自动安排所有面试' },
                { label: '查看面试官', icon: 'Users', message: '查看可用面试官' }
              ]
            }
          ],
        }),
      },
      {
        keywords: ['适合', '有什么岗位', '推荐岗位', '职位'],
        role: 'candidate',
        handler: () => ({
          thinkingSteps: ['分析你的简历...', '匹配开放岗位...'],
          delay: 2000,
          responses: [
            { 
              type: 'text', 
              role: 'agent',
              content: '基于你的简历，我为你推荐以下岗位：' 
            },
            { 
              type: 'text', 
              role: 'agent',
              content: '**高级推荐算法工程师**（92% 匹配）\n\n你的推荐系统经验和这个岗位非常契合。\n\n要我详细介绍某个岗位吗？' 
            },
          ],
        }),
      },
      {
        keywords: ['到哪了', '进度', '面试到', '申请状态', '状态'],
        role: 'candidate',
        handler: () => ({
          delay: 1000,
          responses: [
            { 
              type: 'text', 
              role: 'agent',
              content: '你申请的**高级推荐算法工程师**目前进展：' 
            },
            { 
              type: 'timeline', 
              candidateName: '你',
              stages: [
                { name: '简历投递', status: 'completed', date: '3月20日' },
                { name: '简历筛选通过', status: 'completed', date: '3月22日' },
                { name: '一面（技术面）通过', status: 'completed', date: '3月28日' },
                { name: '二面（团队面）', status: 'current', date: '4月10日 14:00' },
                { name: '终面', status: 'pending' },
                { name: 'Offer', status: 'pending' },
              ] 
            },
            { 
              type: 'text', 
              role: 'agent',
              content: '二面将由技术总监主持，主要考察系统设计和团队协作。\n\n需要我帮你准备面试吗？' 
            },
          ],
        }),
      },
      {
        keywords: ['你好', 'hi', 'hello', '在吗'],
        handler: () => ({
          delay: 500,
          responses: [
            {
              type: 'text',
              role: 'agent',
              content: '你好！有什么我可以帮你的吗？'
            },
            {
              type: 'quick_actions',
              title: '快捷入口',
              actions: this.getQuickActionsForRole()
            }
          ],
        }),
      },
    ];
  }

  // 根据角色获取快捷操作
  private getQuickActionsForRole(): QuickAction[] {
    switch (this.role) {
      case 'hm':
        return [
          { label: '找人', icon: 'Search', message: '帮我找人' },
          { label: '看报告', icon: 'BarChart3', message: '查看招聘报告' },
          { label: '写JD', icon: 'FileText', message: '帮我写JD' }
        ];
      case 'hr':
        return [
          { label: '安排面试', icon: 'Calendar', message: '帮我安排面试' },
          { label: '看进度', icon: 'BarChart3', message: '查看招聘进度' },
          { label: '候选人', icon: 'Search', message: '搜索候选人' }
        ];
      case 'candidate':
        return [
          { label: '搜索职位', icon: 'Search', message: '有什么适合我的岗位' },
          { label: '我的申请', icon: 'FileText', message: '我的申请进度' },
          { label: '面试准备', icon: 'Calendar', message: '帮我准备面试' }
        ];
      default:
        return [];
    }
  }

  // 处理用户输入
  processInput(input: string): EngineResult {
    const lowerInput = input.toLowerCase();
    
    // 保存到历史
    this.history.push(input);
    
    // 查找匹配的规则
    for (const rule of this.rules) {
      // 检查角色限制
      if (rule.role && rule.role !== this.role) continue;
      
      // 检查关键词匹配
      const matched = rule.keywords.some(keyword => 
        lowerInput.includes(keyword.toLowerCase())
      );
      
      if (matched) {
        const context: EngineContext = {
          role: this.role,
          input,
          history: this.history
        };
        return rule.handler(context);
      }
    }
    
    // 默认响应
    return this.getDefaultResponse();
  }

  // 处理卡片点击
  handleCardClick(_cardId: string, payload: CardActionPayload): EngineResult {
    const { action, candidateId } = payload;
    
    switch (action) {
      case 'shortlist':
        return {
          delay: 500,
          responses: [
            {
              type: 'text',
              role: 'agent',
              content: `已将候选人加入面试流程。需要我帮你安排面试时间吗？`
            },
            {
              type: 'quick_actions',
              title: '下一步',
              actions: [
                { label: '安排面试时间', icon: 'Calendar', message: '帮我安排面试时间' },
                { label: '生成面试题', icon: 'FileText', message: '生成面试题' },
                { label: '查看完整简历', icon: 'User', message: '查看完整简历' }
              ]
            }
          ]
        };
        
      case 'reject':
        return {
          delay: 500,
          responses: [
            {
              type: 'text',
              role: 'agent',
              content: '已标记该候选人为不匹配。需要我为你推荐其他候选人吗？'
            }
          ]
        };
        
      case 'view_resume':
        const candidate = mockCandidates.find(c => c.id === candidateId);
        return {
          delay: 800,
          responses: [
            {
              type: 'text',
              role: 'agent',
              content: candidate 
                ? `**${candidate.name}** 的简历详情：\n\n**基本信息**\n- 目前就职：${candidate.currentCompany}\n- 职位：${candidate.currentTitle}\n- 工作年限：${candidate.experience}年\n- 学历：${candidate.education}\n\n**技能标签**：${candidate.tags.join('、')}\n\n**匹配分析**\n- 匹配度：${candidate.matchScore}%\n- 亮点：${candidate.matchHighlights.join('、')}\n- 差距：${candidate.gapPoints.join('、')}`
                : '候选人信息未找到。'
            }
          ]
        };
        
      case 'schedule_interview':
        return {
          delay: 800,
          responses: [
            {
              type: 'text',
              role: 'agent',
              content: '面试安排成功！\n\n时间：下周三 14:00\n地点：线上腾讯会议\n面试官：技术总监 王工\n\n已发送邮件通知候选人。'
            }
          ]
        };
        
      case 'quick_action':
        // 处理快捷操作点击
        const { message } = payload;
        if (message) {
          return this.processInput(message);
        }
        return this.getDefaultResponse();
        
      default:
        return this.getDefaultResponse();
    }
  }

  // 获取欢迎消息
  getWelcomeMessage(): EngineResult {
    const welcomeContent = getWelcomeMessage(this.role);
    
    return {
      delay: 0,
      responses: [
        {
          type: 'text',
          role: 'agent',
          content: welcomeContent
        },
        {
          type: 'quick_actions',
          title: '快速开始',
          actions: this.getQuickActionsForRole()
        }
      ]
    };
  }

  // 默认响应
  private getDefaultResponse(): EngineResult {
    return {
      delay: 800,
      responses: [
        {
          type: 'text',
          role: 'agent',
          content: '抱歉，我还在学习中，暂时不太理解你的意思。\n\n你可以尝试：\n· 输入「找人」来搜索候选人\n· 输入「进度」查看招聘报告\n· 输入「写JD」生成职位描述'
        },
        {
          type: 'quick_actions',
          title: '试试这些',
          actions: this.getQuickActionsForRole()
        }
      ]
    };
  }

  // 切换角色
  switchRole(newRole: UserRole) {
    this.role = newRole;
    this.history = [];
  }

  // 获取当前角色
  getRole(): UserRole {
    return this.role;
  }

  // 获取对话历史
  getHistory(): string[] {
    return [...this.history];
  }
}

// 工厂函数：创建引擎实例
export function createEngine(role: UserRole): ConversationEngine {
  return new ConversationEngine(role);
}

// 导出类型
export type { EngineResult, EngineResponse, CardActionPayload };
