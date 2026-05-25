// ============================================================
// mockData.ts — AI 招聘 Agent Demo 完整 Mock 数据
// ============================================================

// ---------- 候选人数据 ----------
export interface Candidate {
  id: string;
  name: string;
  gender: '男' | '女';
  currentCompany: string;
  currentTitle: string;
  experience: number;
  education: string;
  matchScore: number;
  matchHighlights: string[];
  gapPoints: string[];
  tags: string[];
  salary: string;
  status: 'active' | 'in_process' | 'offer' | 'hired' | 'rejected';
  location: string;
  phone: string;
  email: string;
  resumeSummary: string;
  interviewHistory?: {
    round: string;
    date: string;
    interviewer: string;
    result: 'pass' | 'fail' | 'pending';
    rating?: string;
    comment?: string;
  }[];
}

export const candidates: Record<string, Candidate> = {
  c001: {
    id: 'c001',
    name: '李明',
    gender: '男',
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
    location: '北京',
    phone: '138****1234',
    email: 'li***@example.com',
    resumeSummary: '6年推荐系统经验，先后在美团负责外卖推荐和首页feed排序。主导了排序模型从LR到深度学习的升级，CTR提升23%。有丰富的AB实验设计经验，搭建过实验平台。',
  },
  c002: {
    id: 'c002',
    name: '张薇',
    gender: '女',
    currentCompany: '快手',
    currentTitle: '推荐引擎架构师',
    experience: 8,
    education: '北京大学 · 计算机博士',
    matchScore: 88,
    matchHighlights: ['8年经验', '推荐架构设计能力强', '带过15人团队'],
    gapPoints: ['偏学术', '薪资预期较高'],
    tags: ['推荐架构', 'Spark', '分布式系统', '团队管理', 'C++'],
    salary: '80-100K × 16薪',
    status: 'active',
    location: '北京',
    phone: '139****5678',
    email: 'zh***@example.com',
    resumeSummary: '8年搜推经验，北大博士。在快手主导推荐引擎架构，支撑3亿DAU。SIGIR/KDD发表论文5篇。目前带15人团队，负责短视频推荐全链路。',
  },
  c003: {
    id: 'c003',
    name: '王强',
    gender: '男',
    currentCompany: '阿里巴巴',
    currentTitle: '搜索推荐技术专家(P8)',
    experience: 10,
    education: '浙江大学 · 计算机硕士',
    matchScore: 82,
    matchHighlights: ['10年搜推经验', '阿里P8', '从0到1搭建推荐系统'],
    gapPoints: ['电商推荐与社交推荐差异大', '可能overqualified'],
    tags: ['搜索', '推荐', 'NLP', '架构设计', 'Java'],
    salary: '100-120K × 16薪',
    status: 'active',
    location: '杭州',
    phone: '136****9012',
    email: 'wa***@example.com',
    resumeSummary: '10年搜推经验，阿里P8。先后负责淘宝搜索排序、猜你喜欢推荐。从0到1搭建过跨境电商推荐系统。擅长大规模系统架构和团队管理。',
  },
  c004: {
    id: 'c004',
    name: '陈思',
    gender: '女',
    currentCompany: '字节跳动',
    currentTitle: '推荐算法工程师',
    experience: 4,
    education: '上海交通大学 · 计算机硕士',
    matchScore: 78,
    matchHighlights: ['字节推荐实战经验', '熟悉AB实验', '成长潜力大'],
    gapPoints: ['年限偏短', '未带过团队'],
    tags: ['推荐系统', 'PyTorch', '特征工程', 'Go', 'Python'],
    salary: '50-65K × 15薪',
    status: 'active',
    location: '北京',
    phone: '137****3456',
    email: 'ch***@example.com',
    resumeSummary: '4年推荐系统经验，在字节负责短视频推荐的召回模块。熟悉特征工程和模型训练pipeline，参与过多次重大AB实验。',
  },
  c005: {
    id: 'c005',
    name: '赵晨',
    gender: '男',
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
    location: '上海',
    phone: '135****7890',
    email: 'zh***@example.com',
    resumeSummary: '7年推荐系统经验，中科院博士。在小红书负责内容推荐全链路，团队10人。擅长社交+内容场景的推荐算法，DAU千万级系统经验。',
  },
  c006: {
    id: 'c006',
    name: '刘洋',
    gender: '男',
    currentCompany: '腾讯',
    currentTitle: '后端架构师(T10)',
    experience: 12,
    education: '北京邮电大学 · 计算机硕士',
    matchScore: 94,
    matchHighlights: ['12年后端经验', '微服务架构专家', '亿级流量系统'],
    gapPoints: ['薪资预期可能超预算'],
    tags: ['微服务', 'Go', 'K8s', '分布式', '系统设计'],
    salary: '100-130K × 16薪',
    status: 'in_process',
    location: '深圳',
    phone: '133****2345',
    email: 'li***@example.com',
    resumeSummary: '12年后端架构经验，腾讯T10。主导微信支付核心系统架构设计，日均处理10亿+请求。精通微服务架构、分布式系统、高可用设计。',
    interviewHistory: [
      { round: '一面（技术面）', date: '2026-03-25', interviewer: '张总监', result: 'pass', rating: 'Strong Hire', comment: '系统设计能力极强，对高并发有深刻理解' },
      { round: '二面（架构面）', date: '2026-04-02', interviewer: '李VP', result: 'pass', rating: 'Hire', comment: '架构视野开阔，沟通表达清晰' },
      { round: '三面（文化面）', date: '2026-04-08', interviewer: 'HR总监', result: 'pending' },
    ],
  },
  c007: {
    id: 'c007',
    name: '孙婷',
    gender: '女',
    currentCompany: '百度',
    currentTitle: '前端技术负责人',
    experience: 9,
    education: '北京航空航天大学 · 软件工程硕士',
    matchScore: 89,
    matchHighlights: ['9年前端经验', '带20人团队', 'React技术栈专家'],
    gapPoints: ['百度前端架构偏老'],
    tags: ['React', 'TypeScript', '微前端', 'Node.js', '团队管理'],
    salary: '70-90K × 15薪',
    status: 'active',
    location: '北京',
    phone: '131****6789',
    email: 'su***@example.com',
    resumeSummary: '9年前端开发经验，百度前端技术负责人。带领20人团队，主导从jQuery到React的技术栈迁移。擅长微前端架构和性能优化。',
  },
  c008: {
    id: 'c008',
    name: '周航',
    gender: '男',
    currentCompany: '拼多多',
    currentTitle: '推荐系统工程师',
    experience: 5,
    education: '华中科技大学 · 计算机硕士',
    matchScore: 72,
    matchHighlights: ['5年推荐经验', '电商场景深耕', '工程能力强'],
    gapPoints: ['电商推荐逻辑与社交推荐差异大', '拼多多风格偏野路子'],
    tags: ['推荐系统', 'Java', 'Flink', '实时计算', '电商'],
    salary: '55-70K × 16薪',
    status: 'active',
    location: '上海',
    phone: '132****0123',
    email: 'zh***@example.com',
    resumeSummary: '5年推荐系统经验，在拼多多负责商品推荐的实时排序模块。擅长Flink实时计算和在线特征工程，工程落地能力强。',
  },
  c009: {
    id: 'c009',
    name: '林小雨',
    gender: '女',
    currentCompany: '网易',
    currentTitle: '高级后端工程师',
    experience: 6,
    education: '武汉大学 · 计算机硕士',
    matchScore: 76,
    matchHighlights: ['6年Go开发经验', '游戏服务端经验', '高并发处理'],
    gapPoints: ['游戏后端和互联网后端差异', '无微服务架构经验'],
    tags: ['Go', 'C++', '游戏服务端', '高并发', 'Redis'],
    salary: '50-65K × 14薪',
    status: 'active',
    location: '广州',
    phone: '134****4567',
    email: 'li***@example.com',
    resumeSummary: '6年后端开发经验，网易游戏服务端工程师。负责MMORPG游戏的核心服务端架构，支撑百万级同时在线。',
  },
  c010: {
    id: 'c010',
    name: '黄志远',
    gender: '男',
    currentCompany: 'Shopee',
    currentTitle: '搜索推荐高级工程师',
    experience: 7,
    education: '南京大学 · 人工智能硕士',
    matchScore: 85,
    matchHighlights: ['7年搜推经验', '海外电商场景', '多语言NLP'],
    gapPoints: ['电商场景为主', '新加坡base可能不愿回国'],
    tags: ['搜索推荐', 'NLP', '多语言', 'Python', 'TensorFlow'],
    salary: '70-90K × 14薪',
    status: 'active',
    location: '新加坡',
    phone: '+65****8901',
    email: 'hu***@example.com',
    resumeSummary: '7年搜推经验，Shopee搜索推荐高级工程师。负责东南亚多国电商搜索和推荐，擅长多语言NLP和跨境搜索。',
  },
};

// ---------- 岗位数据 ----------
export interface Job {
  id: string;
  title: string;
  department: string;
  level: string;
  headcount: number;
  openDays: number;
  pipeline: { resume: number; screening: number; interview: number; offer: number; hired: number };
  status: 'open' | 'urgent' | 'paused' | 'closed';
  jd: string;
  requirements: string[];
  salaryRange: string;
  hiringManager: string;
  recruiter: string;
}

export const jobs: Record<string, Job> = {
  j001: {
    id: 'j001',
    title: '高级推荐算法工程师',
    department: '技术部 - 推荐团队',
    level: '高级(P6-P7)',
    headcount: 2,
    openDays: 28,
    pipeline: { resume: 45, screening: 23, interview: 8, offer: 2, hired: 1 },
    status: 'open',
    jd: '## 岗位职责\n\n1. 负责推荐系统核心排序模型的设计与优化\n2. 主导千万级DAU推荐系统的架构升级\n3. 设计和实施AB实验方案，驱动业务指标提升\n4. 与产品、工程团队紧密协作，推动算法落地\n\n## 任职要求\n\n1. 计算机相关专业硕士及以上学历\n2. 5年以上推荐系统相关经验\n3. 精通主流深度学习框架（TensorFlow/PyTorch）\n4. 有大规模推荐系统实战经验，熟悉排序模型\n5. 优秀的沟通协作能力',
    requirements: ['推荐系统', '5年+经验', '深度学习', '排序模型', '硕士+'],
    salaryRange: '60-100K × 15薪',
    hiringManager: '张明（推荐团队负责人）',
    recruiter: '王芳（HR）',
  },
  j002: {
    id: 'j002',
    title: '后端架构师',
    department: '技术部 - 架构组',
    level: '专家(P7-P8)',
    headcount: 1,
    openDays: 45,
    pipeline: { resume: 32, screening: 15, interview: 5, offer: 0, hired: 0 },
    status: 'urgent',
    jd: '## 岗位职责\n\n1. 负责公司核心业务系统的架构设计和优化\n2. 制定技术标准和最佳实践，推动架构升级\n3. 解决复杂的技术难题，保障系统高可用\n4. 指导团队技术成长\n\n## 任职要求\n\n1. 10年以上后端开发经验\n2. 精通微服务架构和分布式系统\n3. 有亿级流量系统设计经验\n4. 优秀的技术视野和架构能力',
    requirements: ['微服务', '10年+经验', '分布式系统', '亿级流量', '架构设计'],
    salaryRange: '100-150K × 16薪',
    hiringManager: '李伟（CTO）',
    recruiter: '赵敏（HR）',
  },
  j003: {
    id: 'j003',
    title: '前端技术负责人',
    department: '技术部 - 前端团队',
    level: '高级(P6-P7)',
    headcount: 1,
    openDays: 14,
    pipeline: { resume: 28, screening: 12, interview: 4, offer: 1, hired: 0 },
    status: 'open',
    jd: '## 岗位职责\n\n1. 负责前端技术团队的管理和技术方向\n2. 主导前端架构设计和技术选型\n3. 推动前端工程化和性能优化\n4. 带领团队交付高质量的产品\n\n## 任职要求\n\n1. 7年以上前端开发经验\n2. 精通React/Vue生态\n3. 有团队管理经验（10人+）\n4. 良好的沟通和项目管理能力',
    requirements: ['React', '7年+经验', '团队管理', '前端架构', '微前端'],
    salaryRange: '70-100K × 15薪',
    hiringManager: '陈刚（产品VP）',
    recruiter: '王芳（HR）',
  },
  j004: {
    id: 'j004',
    title: 'AI平台工程师',
    department: '技术部 - AI平台',
    level: '中高级(P5-P6)',
    headcount: 3,
    openDays: 7,
    pipeline: { resume: 18, screening: 8, interview: 2, offer: 0, hired: 0 },
    status: 'open',
    jd: '## 岗位职责\n\n1. 负责AI训练和推理平台的开发与优化\n2. 建设模型管理和实验管理系统\n3. 优化GPU资源调度和训练效率\n\n## 任职要求\n\n1. 3年以上相关经验\n2. 熟悉K8s和容器化技术\n3. 了解主流ML框架的底层原理',
    requirements: ['K8s', 'GPU调度', 'ML平台', 'Python', 'Go'],
    salaryRange: '40-70K × 15薪',
    hiringManager: '吴军（AI平台负责人）',
    recruiter: '赵敏（HR）',
  },
  j005: {
    id: 'j005',
    title: '产品经理（商业化）',
    department: '产品部 - 商业化',
    level: '高级',
    headcount: 1,
    openDays: 21,
    pipeline: { resume: 35, screening: 18, interview: 6, offer: 1, hired: 0 },
    status: 'open',
    jd: '负责商业化产品的规划和落地，与算法、工程团队紧密合作。',
    requirements: ['商业化', '3年+产品经验', '数据分析', '广告系统'],
    salaryRange: '50-80K × 15薪',
    hiringManager: '周颖（商业化VP）',
    recruiter: '王芳（HR）',
  },
};

// ---------- 分析数据 ----------
export const analytics = {
  overview: {
    openPositions: 5,
    activeCandidates: 47,
    hiredThisMonth: 3,
    avgTimeToHire: 34,
    offerAcceptRate: 75,
    interviewPassRate: 42,
  },
  funnel: {
    stages: ['简历', '初筛', '面试', 'Offer', '入职'],
    values: [156, 89, 34, 12, 8],
    conversionRates: ['57%', '38%', '35%', '67%'],
  },
  byJob: {
    j001: { funnel: [45, 23, 8, 2, 1], avgDays: 28, bottleneck: '简历筛选' },
    j002: { funnel: [32, 15, 5, 0, 0], avgDays: 45, bottleneck: '面试通过率低(15%)' },
    j003: { funnel: [28, 12, 4, 1, 0], avgDays: 14, bottleneck: 'Offer谈判中' },
  },
  channelEfficiency: [
    { channel: '内推', resumes: 35, hires: 4, cost: 0, quality: '高' },
    { channel: 'Boss直聘', resumes: 48, hires: 2, cost: 12000, quality: '中' },
    { channel: '猎头A', resumes: 15, hires: 2, cost: 80000, quality: '高' },
    { channel: '猎头B', resumes: 22, hires: 0, cost: 0, quality: '低' },
    { channel: '官网', resumes: 20, hires: 0, cost: 5000, quality: '中' },
    { channel: '脉脉', resumes: 16, hires: 0, cost: 8000, quality: '中低' },
  ],
  monthlyTrend: [
    { month: '2025-11', hires: 5, offers: 8, interviews: 22 },
    { month: '2025-12', hires: 3, offers: 6, interviews: 18 },
    { month: '2026-01', hires: 6, offers: 10, interviews: 28 },
    { month: '2026-02', hires: 4, offers: 7, interviews: 20 },
    { month: '2026-03', hires: 8, offers: 12, interviews: 35 },
    { month: '2026-04', hires: 3, offers: 5, interviews: 14 },
  ],
  interviewerStats: [
    { name: '张总监', interviews: 18, passRate: 0.45, avgScore: 3.8, bias: '正常' },
    { name: '李VP', interviews: 12, passRate: 0.33, avgScore: 3.2, bias: '偏严' },
    { name: '王工', interviews: 22, passRate: 0.59, avgScore: 4.1, bias: '偏松' },
    { name: '赵工', interviews: 15, passRate: 0.40, avgScore: 3.6, bias: '正常' },
  ],
};

// ---------- 市场数据 ----------
export const marketIntelligence = {
  talentDistribution: {
    '推荐系统': {
      totalActive: 2300,
      byCompany: [
        { company: '字节跳动', count: 380 },
        { company: '阿里巴巴', count: 320 },
        { company: '美团', count: 210 },
        { company: '快手', count: 180 },
        { company: '腾讯', count: 160 },
        { company: '百度', count: 150 },
        { company: '小红书', count: 120 },
        { company: '拼多多', count: 110 },
        { company: '其他', count: 670 },
      ],
      byCity: [
        { city: '北京', count: 920 },
        { city: '上海', count: 480 },
        { city: '杭州', count: 380 },
        { city: '深圳', count: 280 },
        { city: '广州', count: 120 },
        { city: '海外', count: 120 },
      ],
      salaryRange: { p25: '45K', p50: '65K', p75: '90K', p90: '120K' },
      difficulty: '中等偏高',
    },
    '后端架构': {
      totalActive: 1500,
      byCompany: [
        { company: '阿里巴巴', count: 250 },
        { company: '腾讯', count: 230 },
        { company: '字节跳动', count: 200 },
        { company: '美团', count: 150 },
        { company: '百度', count: 120 },
        { company: '其他', count: 550 },
      ],
      byCity: [
        { city: '北京', count: 550 },
        { city: '杭州', count: 340 },
        { city: '深圳', count: 280 },
        { city: '上海', count: 220 },
        { city: '广州', count: 110 },
      ],
      salaryRange: { p25: '60K', p50: '85K', p75: '120K', p90: '150K' },
      difficulty: '高',
    },
  },
  competitorHiring: [
    { company: '字节跳动', hotRoles: ['推荐算法', 'AI平台', '前端'], volume: '大量' },
    { company: '阿里巴巴', hotRoles: ['后端架构', '数据工程', '安全'], volume: '中等' },
    { company: '腾讯', hotRoles: ['游戏开发', '后端', 'AI'], volume: '中等' },
    { company: '美团', hotRoles: ['配送算法', '后端', '前端'], volume: '缩招' },
  ],
};

// ---------- 评估数据 ----------
export const evaluationTemplates = {
  '推荐系统': {
    dimensions: [
      { name: '算法基础', weight: 0.2, description: '机器学习/深度学习基础知识' },
      { name: '系统设计', weight: 0.25, description: '推荐系统架构设计能力' },
      { name: '工程落地', weight: 0.25, description: '将算法落地到生产系统的能力' },
      { name: '业务理解', weight: 0.15, description: '对推荐业务指标的理解和驱动' },
      { name: '沟通协作', weight: 0.15, description: '跨团队沟通和协作能力' },
    ],
    interviewQuestions: [
      { q: '描述一个你主导的推荐系统优化项目，从发现问题到上线的完整过程', type: '行为题', target: '工程落地+业务理解' },
      { q: '如何设计一个千万DAU级别的推荐系统架构？请画出核心模块', type: '系统设计', target: '系统设计' },
      { q: '排序模型中，如何处理position bias？你用过哪些方法？', type: '技术题', target: '算法基础' },
      { q: '如何设计AB实验来验证推荐算法的效果？有哪些常见的坑？', type: '技术题', target: '工程落地' },
      { q: '推荐系统的核心指标有哪些？如何平衡短期点击率和长期用户留存？', type: '开放题', target: '业务理解' },
    ],
  },
  '后端架构': {
    dimensions: [
      { name: '架构设计', weight: 0.3, description: '系统架构设计和技术选型能力' },
      { name: '分布式系统', weight: 0.25, description: '分布式理论和实践' },
      { name: '性能优化', weight: 0.2, description: '系统性能分析和优化能力' },
      { name: '技术领导力', weight: 0.15, description: '技术方向判断和团队影响力' },
      { name: '沟通协作', weight: 0.1, description: '跨团队沟通和协作能力' },
    ],
    interviewQuestions: [
      { q: '设计一个支撑10亿级请求/天的支付系统，需要考虑哪些关键点？', type: '系统设计', target: '架构设计' },
      { q: '分布式系统中的CAP理论，在实际项目中你是如何做取舍的？', type: '技术题', target: '分布式系统' },
      { q: '描述你做过的最有挑战的性能优化，效果如何？', type: '行为题', target: '性能优化' },
    ],
  },
};

export default {
  candidates,
  jobs,
  analytics,
  marketIntelligence,
  evaluationTemplates,
};
