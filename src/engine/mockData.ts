import type { 
  Candidate, Job, AnalyticsData, Session,
  ProfileData, ComparisonMessage, RiskAnalysisMessage,
  InterviewQuestionsMessage, MarketAnalysisMessage,
  SalaryBenchmarkMessage, PipelineOverviewMessage,
  ScheduleCardMessage, OfferPackageMessage,
  TeamDiagnosisMessage, OnboardingPlanMessage,
  NetworkGraphMessage, MessageTemplateMessage
} from '@/types';

// ========== 候选人数据（扩展版） ==========

export const mockCandidates: Candidate[] = [
  {
    id: 'c001',
    name: '李明',
    avatar: null,
    currentCompany: '美团',
    currentTitle: '高级推荐算法工程师',
    experience: 6,
    education: '清华大学 · 计算机硕士',
    matchScore: 95,
    matchHighlights: ['6年推荐系统经验', '千万DAU系统主导者', 'AB实验专家'],
    gapPoints: ['无社交场景经验'],
    tags: ['推荐系统', '排序模型', 'TensorFlow', 'AB实验', 'Python'],
    salary: '60-80K × 15薪',
    status: 'active',
  },
  {
    id: 'c002',
    name: '张薇',
    avatar: null,
    currentCompany: '快手',
    currentTitle: '推荐引擎架构师',
    experience: 8,
    education: '北京大学 · 计算机博士',
    matchScore: 88,
    matchHighlights: ['8年经验', '推荐架构设计能力强', '团队管理经验'],
    gapPoints: ['偏学术', '薪资预期较高'],
    tags: ['推荐架构', 'Spark', '分布式系统', '团队管理'],
    salary: '80-100K × 16薪',
    status: 'active',
  },
  {
    id: 'c003',
    name: '王强',
    avatar: null,
    currentCompany: '阿里巴巴',
    currentTitle: '搜索推荐技术专家',
    experience: 10,
    education: '浙江大学 · 计算机硕士',
    matchScore: 82,
    matchHighlights: ['10年搜推经验', '大厂P8', '从0到1经验'],
    gapPoints: ['电商推荐与社交推荐差异', '可能overqualified'],
    tags: ['搜索', '推荐', 'NLP', '架构设计', 'Java'],
    salary: '100-120K × 16薪',
    status: 'active',
  },
  {
    id: 'c004',
    name: '陈思',
    avatar: null,
    currentCompany: '字节跳动',
    currentTitle: '推荐算法工程师',
    experience: 4,
    education: '上海交通大学 · 计算机硕士',
    matchScore: 78,
    matchHighlights: ['字节推荐系统实战经验', '熟悉AB实验'],
    gapPoints: ['年限偏短', '未带过团队'],
    tags: ['推荐系统', 'PyTorch', '特征工程', 'Go'],
    salary: '50-65K × 15薪',
    status: 'active',
  },
  {
    id: 'c005',
    name: '赵晨',
    avatar: null,
    currentCompany: '小红书',
    currentTitle: '内容推荐负责人',
    experience: 7,
    education: '中科院 · 机器学习博士',
    matchScore: 91,
    matchHighlights: ['社交+内容推荐场景', '7年经验', '带10人团队'],
    gapPoints: ['可能不愿降级'],
    tags: ['内容推荐', '社交推荐', '深度学习', '团队管理', 'Python'],
    salary: '80-95K × 15薪',
    status: 'active',
  },
  {
    id: 'c006',
    name: '刘洋',
    avatar: null,
    currentCompany: '百度',
    currentTitle: 'NLP算法工程师',
    experience: 5,
    education: '复旦大学 · 计算机硕士',
    matchScore: 85,
    matchHighlights: ['5年NLP经验', '大模型微调', '论文引用500+'],
    gapPoints: ['推荐系统经验不足', '偏研究'],
    tags: ['NLP', '大模型', 'PyTorch', 'Transformer', 'Python'],
    salary: '55-75K × 15薪',
    status: 'active',
  },
  {
    id: 'c007',
    name: '周婷',
    avatar: null,
    currentCompany: '腾讯',
    currentTitle: '推荐算法专家',
    experience: 9,
    education: '中科大 · 计算机博士',
    matchScore: 93,
    matchHighlights: ['9年推荐经验', '视频推荐场景', '技术委员会成员'],
    gapPoints: ['管理意愿不强'],
    tags: ['视频推荐', '强化学习', 'TensorFlow', 'C++', '分布式'],
    salary: '90-110K × 16薪',
    status: 'active',
  },
  {
    id: 'c008',
    name: '张伟',
    avatar: null,
    currentCompany: '京东',
    currentTitle: '推荐系统负责人',
    experience: 12,
    education: '哈工大 · 计算机博士',
    matchScore: 89,
    matchHighlights: ['12年推荐系统', '电商推荐专家', '带过30人团队'],
    gapPoints: ['年龄偏大', '薪资要求高'],
    tags: ['电商推荐', '召回策略', '排序模型', '团队管理', 'Java'],
    salary: '120-150K × 16薪',
    status: 'active',
  },
];

export const mockCandidatesEngineering = mockCandidates.filter(c => c.experience >= 6);

// ========== 岗位数据 ==========

export const mockJobs: Job[] = [
  {
    id: 'j001',
    title: '高级推荐算法工程师',
    department: '技术部 - 推荐团队',
    level: '高级',
    openDays: 28,
    pipeline: { resume: 45, screening: 23, interview: 8, offer: 2, hired: 1 },
    status: 'open',
  },
  {
    id: 'j002',
    title: '后端架构师',
    department: '技术部 - 架构组',
    level: '专家',
    openDays: 45,
    pipeline: { resume: 32, screening: 15, interview: 5, offer: 0, hired: 0 },
    status: 'urgent',
  },
  {
    id: 'j003',
    title: '前端技术负责人',
    department: '技术部 - 前端团队',
    level: '高级',
    openDays: 14,
    pipeline: { resume: 28, screening: 12, interview: 4, offer: 1, hired: 0 },
    status: 'open',
  },
  {
    id: 'j004',
    title: '大模型算法工程师',
    department: '技术部 - AI Lab',
    level: '高级',
    openDays: 60,
    pipeline: { resume: 67, screening: 30, interview: 12, offer: 1, hired: 0 },
    status: 'urgent',
  },
  {
    id: 'j005',
    title: '数据分析师',
    department: '数据部 - 商业分析',
    level: '中级',
    openDays: 21,
    pipeline: { resume: 38, screening: 18, interview: 6, offer: 2, hired: 1 },
    status: 'open',
  },
];

// ========== 分析数据 ==========

export const mockAnalytics: AnalyticsData = {
  funnel: {
    stages: ['简历', '初筛', '面试', 'Offer', '入职'],
    values: [156, 89, 34, 12, 8],
    conversionRates: ['57%', '38%', '35%', '67%'],
  },
  metrics: {
    openPositions: 5,
    activeCandidates: 12,
    hiredThisMonth: 3,
    avgTimeToHire: 34,
  },
  trendData: [
    { month: '1月', hires: 5, offers: 8 },
    { month: '2月', hires: 3, offers: 6 },
    { month: '3月', hires: 8, offers: 12 },
    { month: '4月', hires: 3, offers: 5 },
  ],
};

export const mockSessions: Session[] = [
  { id: 's1', title: '后端架构师招聘', timestamp: Date.now() - 1000 * 60 * 30, pinned: true, role: 'hm' },
  { id: 's2', title: 'Q2招聘报告', timestamp: Date.now() - 1000 * 60 * 60 * 2, pinned: true, role: 'hm' },
  { id: 's3', title: '推荐算法JD优化', timestamp: Date.now() - 1000 * 60 * 60 * 4, pinned: false, role: 'hm' },
  { id: 's4', title: '候选人张三评估', timestamp: Date.now() - 1000 * 60 * 60 * 6, pinned: false, role: 'hm' },
  { id: 's5', title: '前端人才搜索', timestamp: Date.now() - 1000 * 60 * 60 * 24, pinned: false, role: 'hm' },
  { id: 's6', title: 'Offer方案讨论', timestamp: Date.now() - 1000 * 60 * 60 * 26, pinned: false, role: 'hm' },
];

export const jdContent = `## 岗位职责

1. 负责推荐系统核心排序模型的设计与优化
2. 主导千万级DAU推荐系统的架构升级
3. 设计和实施AB实验方案，驱动业务指标提升
4. 与产品、工程团队紧密协作，推动算法落地

## 任职要求

1. 计算机相关专业硕士及以上学历
2. 5年以上推荐系统相关经验
3. 精通主流深度学习框架
4. 有大规模推荐系统实战经验
5. 优秀的沟通协作能力`;

// ========== 新增：人才档案数据 ==========

export const mockProfiles: ProfileData[] = [
  {
    id: 'p001',
    name: '张伟',
    avatar: null,
    currentCompany: '美团',
    currentTitle: '高级推荐算法工程师',
    experience: 6,
    education: '清华大学 · 计算机硕士',
    location: '北京',
    email: 'zhangwei@example.com',
    skills: ['推荐系统', '排序模型', 'TensorFlow', 'AB实验', 'Python', 'Spark', 'Flink'],
    careerHistory: [
      { company: '美团', title: '高级推荐算法工程师', period: '2021-至今', highlights: ['主导推荐系统重构', 'DAU提升15%', 'AB实验平台负责人'] },
      { company: '字节跳动', title: '推荐算法工程师', period: '2018-2021', highlights: ['短视频推荐优化', '点击率提升20%'] },
    ],
    projects: [
      { name: '美团推荐系统重构', description: '主导千万级DAU推荐系统从TF1.x迁移到TF2.x', techStack: ['TensorFlow', 'Kubernetes', 'Redis'] },
    ],
    onlinePresence: { github: 'github.com/zhangwei-ml', blog: 'zhangwei.dev', linkedin: 'linkedin.com/in/zhangwei' },
    status: 'passive',
    lastActive: '2024-03-15',
    notes: ['技术能力强，工程落地经验足', '对管理岗兴趣不大'],
  },
  {
    id: 'p002',
    name: '王磊',
    avatar: null,
    currentCompany: '阿里巴巴',
    currentTitle: '搜索推荐技术专家',
    experience: 10,
    education: '浙江大学 · 计算机硕士',
    location: '杭州',
    skills: ['搜索', '推荐', 'NLP', '架构设计', 'Java', 'C++'],
    careerHistory: [
      { company: '阿里巴巴', title: '搜索推荐技术专家', period: '2019-至今', highlights: ['搜索推荐一体化', 'P8级别', '团队30人'] },
      { company: '百度', title: '高级算法工程师', period: '2015-2019', highlights: ['搜索排序优化', '核心成员'] },
      { company: '华为', title: '算法工程师', period: '2014-2015', highlights: ['信息流推荐'] },
    ],
    projects: [
      { name: '淘宝搜索推荐一体化', description: '推动搜索和推荐系统架构统一，QPS提升40%', techStack: ['Java', 'TensorFlow', 'Flink'] },
    ],
    status: 'active',
    notes: ['大厂背景强', '可能overqualified'],
  },
  {
    id: 'p003',
    name: '赵六',
    avatar: null,
    currentCompany: '小红书',
    currentTitle: '内容推荐负责人',
    experience: 7,
    education: '中科院 · 机器学习博士',
    location: '上海',
    skills: ['内容推荐', '社交推荐', '深度学习', '团队管理', 'Python'],
    careerHistory: [
      { company: '小红书', title: '内容推荐负责人', period: '2020-至今', highlights: ['内容推荐系统', '带10人团队', '留存提升10%'] },
      { company: '腾讯', title: '推荐算法工程师', period: '2017-2020', highlights: ['新闻推荐优化'] },
    ],
    projects: [
      { name: '小红书内容理解中台', description: '构建内容标签体系，覆盖100+标签维度', techStack: ['PyTorch', 'BERT', 'Spark'] },
    ],
    status: 'passive',
    lastActive: '2024-04-01',
    notes: ['社交推荐场景经验 valuable', '管理经验丰富'],
  },
];

// ========== 新增：对比分析数据 ==========

export const mockComparison: Omit<ComparisonMessage, 'id' | 'timestamp' | 'type'> = {
  title: '候选人对比分析',
  candidateA: { name: '李明', avatar: null },
  candidateB: { name: '赵晨', avatar: null },
  items: [
    { label: '推荐系统经验', candidateA: '6年（美团千万DAU）', candidateB: '7年（小红书内容推荐）', advantage: 'B' },
    { label: '管理经验', candidateA: '无', candidateB: '带10人团队', advantage: 'B' },
    { label: '技术深度', candidateA: '排序模型专家', candidateB: '深度学习+内容理解', advantage: 'neutral' },
    { label: '场景匹配', candidateA: '电商/本地生活', candidateB: '社交/内容', advantage: 'B' },
    { label: '工程能力', candidateA: '强（AB实验平台）', candidateB: '中等', advantage: 'A' },
    { label: '薪资预期', candidateA: '60-80K', candidateB: '80-95K', advantage: 'A' },
    { label: '稳定性', candidateA: '高（3年+）', candidateB: '中（可能不愿降级）', advantage: 'A' },
  ],
  recommendation: '如果更看重**管理能力和社交推荐场景经验**，推荐赵晨；如果更看重**工程落地能力和性价比**，推荐李明。',
};

// ========== 新增：风险分析数据 ==========

export const mockRiskAnalysis: Omit<RiskAnalysisMessage, 'id' | 'timestamp' | 'type'> = {
  candidateName: '王强',
  overallRisk: 'medium',
  risks: [
    { category: 'Overqualified风险', level: 'medium', description: 'P8级别应聘高级岗，可能存在降级顾虑', suggestion: '确认职业动机，了解是否接受平级或降级' },
    { category: '场景差异风险', level: 'medium', description: '电商推荐 vs 社交推荐，技术栈和优化目标有差异', suggestion: '增加场景适配性考察' },
    { category: '薪资预算风险', level: 'high', description: '期望100-120K，超出岗位预算上限', suggestion: '评估预算弹性或调整岗位级别' },
    { category: '稳定性风险', level: 'low', description: '阿里P8，跳槽动机需深入了解', suggestion: '面试中重点考察跳槽动机' },
  ],
  summary: '总体风险中等。主要关注**薪资预算**和**overqualified**问题，建议面试中重点验证场景适配性和职业动机。',
};

// ========== 新增：面试题数据 ==========

export const mockInterviewQuestions: Omit<InterviewQuestionsMessage, 'id' | 'timestamp' | 'type'> = {
  candidateName: '李明',
  position: '高级推荐算法工程师',
  categories: [
    {
      category: '推荐系统基础',
      questions: [
        { question: '请简述推荐系统的经典架构，包括召回、排序、重排各层的作用', difficulty: 'easy', purpose: '考察基础理解' },
        { question: '在千万级DAU场景下，如何设计高效的召回策略？请对比几种召回方法的优劣', difficulty: 'medium', purpose: '考察召回设计能力' },
        { question: '冷启动问题在推荐系统中如何解决？请给出至少3种不同场景的解决方案', difficulty: 'medium', purpose: '考察问题解决能力' },
      ],
    },
    {
      category: '排序模型',
      questions: [
        { question: 'Wide&Deep和DeepFM的异同是什么？什么场景下应该选择哪种？', difficulty: 'medium', purpose: '考察模型理解' },
        { question: '你在美团做过的AB实验中，印象最深刻的一个是什么？如何设计实验并验证效果？', difficulty: 'hard', purpose: '考察实战经验' },
        { question: '如何处理排序中的位置偏差（Position Bias）？请介绍至少2种方法', difficulty: 'hard', purpose: '考察深度优化能力' },
      ],
    },
    {
      category: '工程实践',
      questions: [
        { question: '推荐系统的在线 Serving 如何保障低延迟和高可用？', difficulty: 'medium', purpose: '考察工程能力' },
        { question: '特征工程在推荐系统中扮演什么角色？你有哪些实践经验？', difficulty: 'medium', purpose: '考察特征工程能力' },
      ],
    },
  ],
};

// ========== 新增：市场分析数据 ==========

export const mockMarketAnalysis: Omit<MarketAnalysisMessage, 'id' | 'timestamp' | 'type'> = {
  title: 'LLM人才分布地图',
  analysisType: 'distribution',
  data: [
    { label: '字节跳动', value: 320, detail: 'AI Lab + 搜索团队' },
    { label: '阿里巴巴', value: 280, detail: '达摩院 + 通义千问' },
    { label: '百度', value: 250, detail: '文心一言团队' },
    { label: '腾讯', value: 200, detail: '混元大模型' },
    { label: '智谱AI', value: 150, detail: 'ChatGLM团队' },
    { label: '月之暗面', value: 80, detail: 'Kimi团队' },
    { label: 'Minimax', value: 60, detail: 'abab模型' },
    { label: '其他', value: 120, detail: '创业公司/高校' },
  ],
  insights: [
    '北京是LLM人才最集中的城市，占比约55%',
    '字节跳动和阿里巴巴是LLM人才密度最高的公司',
    '创业公司（智谱、月之暗面）虽然人数少，但人均影响力高',
    '博士占比显著高于传统算法岗位，约40%',
  ],
  chartType: 'bar',
};

export const mockMarketTrend: Omit<MarketAnalysisMessage, 'id' | 'timestamp' | 'type'> = {
  title: 'LLM人才流动趋势（2024Q1）',
    analysisType: 'trend',
    data: [
      { label: '1月', value: 45, detail: '年初跳槽高峰' },
      { label: '2月', value: 38, detail: '春节后回暖' },
      { label: '3月', value: 62, detail: '金三银四启动' },
      { label: '4月', value: 55, detail: '持续活跃' },
    ],
    insights: [
      'Q1 LLM方向人才流动率同比增长120%',
      '大厂→创业公司的流动趋势明显',
      '薪资涨幅中位数达35%',
      '海外回流人才占比提升至15%',
    ],
    chartType: 'trend',
};

// ========== 新增：薪酬对标数据 ==========

export const mockSalaryBenchmark: Omit<SalaryBenchmarkMessage, 'id' | 'timestamp' | 'type'> = {
  title: '高级推荐算法工程师 - 薪酬对标',
  position: '高级推荐算法工程师',
  benchmarks: [
    { company: '字节跳动', level: '2-2', salaryRange: '70-100K × 18薪', median: 85 },
    { company: '阿里巴巴', level: 'P7', salaryRange: '65-95K × 16薪', median: 80 },
    { company: '腾讯', level: 'T10', salaryRange: '60-90K × 16薪', median: 75 },
    { company: '美团', level: 'L8', salaryRange: '55-85K × 15薪', median: 70 },
    { company: '快手', level: 'k3a', salaryRange: '55-80K × 16薪', median: 68 },
    { company: '小红书', level: 'R7', salaryRange: '50-75K × 15薪', median: 62 },
  ],
  marketMedian: 73,
  recommendation: '当前岗位预算（60-80K × 15薪）处于市场中位水平。建议对特别优秀的候选人，总包可上浮10-15%以提升竞争力。',
};

// ========== 新增：Pipeline总览数据 ==========

export const mockPipelineOverview: Omit<PipelineOverviewMessage, 'id' | 'timestamp' | 'type'> = {
  title: '招聘Pipeline健康度总览',
  jobs: [
    {
      jobId: 'j001',
      title: '高级推荐算法工程师',
      department: '技术部-推荐团队',
      openDays: 28,
      status: 'healthy',
      pipeline: [
        { stage: '简历', count: 45, target: 30 },
        { stage: '初筛', count: 23, target: 15 },
        { stage: '面试', count: 8, target: 8 },
        { stage: 'Offer', count: 2, target: 3 },
        { stage: '入职', count: 1, target: 2 },
      ],
    },
    {
      jobId: 'j002',
      title: '后端架构师',
      department: '技术部-架构组',
      openDays: 45,
      status: 'at_risk',
      pipeline: [
        { stage: '简历', count: 32, target: 25 },
        { stage: '初筛', count: 15, target: 12 },
        { stage: '面试', count: 5, target: 8 },
        { stage: 'Offer', count: 0, target: 2 },
        { stage: '入职', count: 0, target: 1 },
      ],
      bottlenecks: ['面试通过率仅15%', '候选人普遍要求P8+级别'],
    },
    {
      jobId: 'j004',
      title: '大模型算法工程师',
      department: '技术部-AI Lab',
      openDays: 60,
      status: 'stuck',
      pipeline: [
        { stage: '简历', count: 67, target: 40 },
        { stage: '初筛', count: 30, target: 20 },
        { stage: '面试', count: 12, target: 10 },
        { stage: 'Offer', count: 1, target: 3 },
        { stage: '入职', count: 0, target: 2 },
      ],
      bottlenecks: ['Offer接受率仅33%', '候选人被竞品高薪截胡'],
    },
  ],
  summary: '整体Pipeline健康度：**2个健康，1个风险，1个停滞**。重点关注大模型岗位和后端架构师的瓶颈。',
};

// ========== 新增：面试排程数据 ==========

export const mockSchedule: Omit<ScheduleCardMessage, 'id' | 'timestamp' | 'type'> = {
  candidateName: '李明',
  position: '高级推荐算法工程师',
  suggestedSlots: [
    { date: '4月24日（周三）', time: '14:00-15:30', interviewer: '技术总监 王工', type: '技术面', available: true },
    { date: '4月24日（周三）', time: '16:00-17:00', interviewer: '推荐团队负责人 张经理', type: '团队面', available: true },
    { date: '4月25日（周四）', time: '10:00-11:00', interviewer: 'HRD 李总', type: 'HR面', available: true },
    { date: '4月26日（周五）', time: '14:00-15:00', interviewer: 'VP 技术 陈总', type: '终面', available: false },
  ],
  notes: '建议安排2轮技术面试+1轮HR面+1轮终面。候选人倾向下午时段。',
};

// ========== 新增：Offer方案数据 ==========

export const mockOfferPackage: Omit<OfferPackageMessage, 'id' | 'timestamp' | 'type'> = {
  candidateName: '赵晨',
  position: '推荐算法专家',
  components: [
    { name: '基本月薪', value: '85K/月', note: '高于市场中位15%' },
    { name: '年终奖', value: '3个月（保底）', note: '表现优秀可达4-5个月' },
    { name: '签字费', value: '10万', note: '一次性发放' },
    { name: '期权', value: '50万股（4年归属）', note: '当前估值约200万' },
    { name: '搬家补贴', value: '3万', note: '跨城搬家一次性补贴' },
  ],
  totalValue: '首年总包约 **156万**',
  competitiveness: 'above_market',
  sellPoints: [
    '技术挑战：主导千万级DAU推荐系统重构',
    '团队空间：直接带8人团队，向VP汇报',
    '业务影响力：推荐是核心变现场景，ROI直接可见',
    '成长路径：1年内有机会晋升技术总监',
  ],
  risks: ['候选人手上还有字节和阿里offer', '配偶在上海工作，需协调异地问题'],
};

// ========== 新增：团队诊断数据 ==========

export const mockTeamDiagnosis: Omit<TeamDiagnosisMessage, 'id' | 'timestamp' | 'type'> = {
  teamName: '推荐算法团队',
  members: [
    { name: '张三', role: '推荐算法负责人', skills: ['推荐系统', '团队管理', 'AB实验'], level: 'P8' },
    { name: '李四', role: '排序算法工程师', skills: ['排序模型', '深度学习', 'TensorFlow'], level: 'P6' },
    { name: '王五', role: '召回算法工程师', skills: ['向量检索', 'Embedding', 'Faiss'], level: 'P6' },
    { name: '赵六', role: '工程开发', skills: ['Java', 'Redis', 'Kafka'], level: 'P5' },
    { name: '孙七', role: '数据分析师', skills: ['SQL', 'Python', '数据可视化'], level: 'P5' },
  ],
  gaps: [
    { skill: '大模型/LLM应用', urgency: 'high', description: '团队暂无LLM经验，但业务急需内容理解能力' },
    { skill: '推荐架构设计', urgency: 'medium', description: '当前架构师离职，缺乏系统级架构能力' },
    { skill: '多模态推荐', urgency: 'medium', description: '视频+图文混合推荐能力不足' },
    { skill: '工程效能', urgency: 'low', description: '特征工程效率偏低，需要平台化思维' },
  ],
  recommendations: [
    '优先招聘：LLM方向算法工程师（P7+）',
    '次优招聘：推荐架构师（P7+，能独立设计系统）',
    '内部培养：送2名工程师参加多模态推荐培训',
    '短期方案：与AI Lab建立借调合作',
  ],
  afterHireSimulation: {
    candidateName: '赵晨',
    improvedSkills: ['内容推荐', '社交推荐', '团队管理（10人经验）', '深度学习'],
    newGaps: ['大模型/LLM应用仍需补充', '工程架构能力仍需补充'],
  },
};

// ========== 新增：入职计划数据 ==========

export const mockOnboardingPlan: Omit<OnboardingPlanMessage, 'id' | 'timestamp' | 'type'> = {
  candidateName: '李明',
  position: '高级推荐算法工程师',
  startDate: '2024-05-06',
  plan: [
    {
      day: '第1周（5/6-5/10）',
      tasks: [
        { title: '入职手续办理', owner: 'HR', type: 'hr' },
        { title: '环境配置+代码权限', owner: 'Buddy', type: 'buddy' },
        { title: '团队介绍+1:1沟通', owner: 'Manager', type: 'manager' },
        { title: '熟悉推荐系统架构文档', owner: 'Self', type: 'self' },
      ],
    },
    {
      day: '第2周（5/13-5/17）',
      tasks: [
        { title: '参加推荐系统周会', owner: 'Self', type: 'self' },
        { title: 'Shadow一位同事的工作', owner: 'Buddy', type: 'buddy' },
        { title: '确定第一个月OKR', owner: 'Manager', type: 'manager' },
        { title: '完成第一个小Feature', owner: 'Self', type: 'self' },
      ],
    },
    {
      day: '第3-4周（5/20-5/31）',
      tasks: [
        { title: '独立负责一个AB实验', owner: 'Self', type: 'self' },
        { title: '完成推荐系统代码Review', owner: 'Buddy', type: 'buddy' },
        { title: '30天回顾会议', owner: 'Manager', type: 'manager' },
        { title: '制定Q3个人发展计划', owner: 'Self', type: 'self' },
      ],
    },
  ],
  milestones: ['完成环境配置（Day 1）', '提交第一个PR（Day 5）', '独立上线第一个实验（Day 14）', '30天融入评估通过（Day 30）'],
};

// ========== 新增：人脉关系数据 ==========

export const mockNetworkGraph: Omit<NetworkGraphMessage, 'id' | 'timestamp' | 'type'> = {
  centerPerson: '李明',
  connections: [
    { id: 'n1', name: '张薇', relation: '快手前同事', company: '快手', connectionStrength: 8 },
    { id: 'n2', name: '王磊', relation: '清华校友', company: '阿里巴巴', connectionStrength: 6 },
    { id: 'n3', name: '刘洋', relation: '美团现同事', company: '美团', connectionStrength: 9 },
    { id: 'n4', name: '陈刚', relation: '字节前Leader', company: '字节跳动', connectionStrength: 7 },
    { id: 'n5', name: '赵六', relation: '行业会议认识', company: '小红书', connectionStrength: 4 },
    { id: 'n6', name: '周婷', relation: '技术社区朋友', company: '腾讯', connectionStrength: 5 },
  ],
  insights: [
    '李明与2位之前我们拒过的候选人有间接联系（通过张薇和陈刚）',
    '李明和王磊是清华校友，关系较紧密',
    '李明的技术圈子主要集中在美团/字节系',
    '建议通过张薇或陈刚进行背调',
  ],
};

// ========== 新增：消息模板数据 ==========

export const mockMessageTemplates: Record<string, Omit<MessageTemplateMessage, 'id' | 'timestamp' | 'type'>> = {
  rejection: {
    templateType: 'rejection',
    subject: '关于高级推荐算法工程师岗位的反馈',
    recipient: '李明',
    tone: 'warm',
    content: `李明，你好：

非常感谢你抽出宝贵时间参加我们的面试。经过慎重评估，我们认为你在技术能力上非常优秀，但**当前岗位在管理经验和场景匹配度上与你的背景存在一定差距**。

这绝不意味着你的能力不足——恰恰相反，你的推荐系统经验给我们留下了深刻印象。我们会将你的档案保留在人才库中，如果有更匹配的岗位开放，我会第一时间联系你。

再次感谢你的信任，祝你早日找到合适的机会！

此致
招聘团队`,
    editable: true,
  },
  sell: {
    templateType: 'sell',
    subject: '邀请你加入我们的推荐团队',
    recipient: '赵晨',
    tone: 'warm',
    content: `赵晨，你好：

很高兴和你聊了这么多！我想再和你分享几个让我特别兴奋的点：

**1. 技术挑战的真实感**
我们正在做的不是"维护一个成熟系统"，而是**从0到1重构推荐架构**——这意味着你的每一个设计决策都会直接影响千万用户。这种"亲手搭建"的机会，在大厂里越来越稀缺。

**2. 团队空间**
你带10人团队的经验非常匹配。这个岗位直接带8人，向VP汇报，1年内有明确的晋升路径。我们希望找到能**独立扛起一条业务线**的人。

**3. 业务影响力**
推荐是核心变现场景，ROI直接可见。你做的每一次优化，都能在财报里找到痕迹。

期待你的回复！

Best,
技术总监 王工`,
    editable: true,
  },
  reach_out: {
    templateType: 'reach_out',
    subject: '关于推荐算法方向的一个机会',
    recipient: '赵六',
    tone: 'professional',
    content: `赵六，你好：

我是XX公司的技术总监，一直在关注你在内容推荐领域的实践（特别是你在小红书做的内容理解中台，非常有启发）。

我们目前正在拓展社交推荐方向，缺一位有经验的负责人。不知道你近期是否有兴趣聊聊？即使不跳槽，我也很希望能和你交流一下推荐系统的前沿实践。

期待你的回复！

此致
XX公司 技术总监`,
    editable: true,
  },
  reminder: {
    templateType: 'reminder',
    subject: '候选人反馈提醒 - 3位候选人等待评估超过5天',
    recipient: '用人经理',
    tone: 'professional',
    content: `你好：

以下候选人的面试反馈已超时，请尽快处理：

1. **李明** - 高级推荐算法工程师 | 等待反馈：7天
2. **张薇** - 推荐引擎架构师 | 等待反馈：5天
3. **王强** - 搜索推荐技术专家 | 等待反馈：6天

如有任何问题，请随时联系我。

此致
招聘HR`,
    editable: true,
  },
};

// ========== 欢迎消息 ==========

export const getWelcomeMessage = (role: 'hm' | 'hr' | 'candidate'): string => {
  switch (role) {
    case 'hm':
      return `👋 你好！我是你的 AI 招聘助手。

今天有 3 条新动态：
· 后端架构师岗位有 2 位新推荐候选人
· 张三的面试评估报告已生成
· Q2招聘进度报告已更新

我能帮你做什么？`;
    case 'hr':
      return `👋 你好！我是你的 AI 招聘助手。

今天需要关注：
· 3 位候选人等待安排面试
· 2 份 Offer 等待审批
· 5 位新候选人等待初筛

有什么可以帮你的？`;
    case 'candidate':
      return `👋 你好！欢迎来到 XX 公司招聘平台。

我可以帮你：
· 了解职位信息
· 查看申请进度
· 准备面试

你想了解什么？`;
    default:
      return '你好！有什么可以帮你的？';
  }
};
