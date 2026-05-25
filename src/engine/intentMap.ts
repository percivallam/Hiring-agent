/**
 * 全 Session 意图穷举映射（88个意图）
 * 按角色 × 场景展开
 */

import type { UserRole, QuickAction } from '@/types';

// 意图分类
export type IntentCategory =
  // A. 用人经理
  | 'hm_person_lookup'           // A1 找人相关
  | 'hm_market_intelligence'     // A2 岗位与市场认知
  | 'hm_jd_profile'              // A3 JD与画像
  | 'hm_resume_evaluation'       // A4 简历评估与决策支持
  | 'hm_interview'               // A5 面试相关
  | 'hm_process_management'      // A6 流程协调与进度管理
  | 'hm_offer_negotiation'       // A7 Offer与谈判
  | 'hm_team_planning'           // A8 团队与规划
  | 'hm_post_hire'               // A9 入职后闭环
  // B. 招聘HR
  | 'hr_pipeline'                // B Pipeline与运营
  // C. 候选人
  | 'candidate_self_service';    // C 候选人自助

export interface IntentPattern {
  id: number;                    // 1-88
  category: IntentCategory;
  name: string;                  // 意图名称
  description: string;           // 典型Session描述
  keywords: string[];            // 关键词（用于Mock匹配）
  roles: UserRole[];             // 适用角色
  messageTypes: string[];        // 可能返回的消息类型
  thinkingSteps: string[];       // 思考步骤
}

// ========== A. 用人经理 ==========

const hmPersonLookup: IntentPattern[] = [
  {
    id: 1,
    category: 'hm_person_lookup',
    name: '特定人名查找',
    description: '帮我找一个张伟，之前在美团做推荐的',
    keywords: ['找', '张伟', '人名', '特定人', '之前', '美团', '叫'],
    roles: ['hm'],
    messageTypes: ['profile_card', 'text'],
    thinkingSteps: ['解析人名信息...', '检索人才库...', '构建人才档案...'],
  },
  {
    id: 2,
    category: 'hm_person_lookup',
    name: '模糊记忆检索',
    description: '我之前面过一个人，忘了名字，去年Q3左右，做NLP的女生',
    keywords: ['忘了', '忘了名字', '去年', '女生', '模糊', '记得', '面过'],
    roles: ['hm'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['解析模糊描述...', '检索面试历史...', '筛选匹配结果...'],
  },
  {
    id: 3,
    category: 'hm_person_lookup',
    name: '简历调取',
    description: '把王磊的简历发给我',
    keywords: ['简历', '发给我', '调取', '王磊'],
    roles: ['hm'],
    messageTypes: ['profile_card', 'text'],
    thinkingSteps: ['定位候选人...', '调取简历档案...', '格式化展示...'],
  },
  {
    id: 4,
    category: 'hm_person_lookup',
    name: '人才动态追踪',
    description: '这个人现在在哪家公司',
    keywords: ['现在', '哪家公司', '动向', '动态', '跳槽', '离职'],
    roles: ['hm'],
    messageTypes: ['profile_card', 'text'],
    thinkingSteps: ['识别人才...', '查询最新动态...', '生成追踪报告...'],
  },
  {
    id: 5,
    category: 'hm_person_lookup',
    name: '候选人深度调研',
    description: '帮我看看这个人的GitHub/技术博客',
    keywords: ['github', '技术博客', '博客', '调研', '深度', '开源', '项目'],
    roles: ['hm'],
    messageTypes: ['profile_card', 'text'],
    thinkingSteps: ['收集在线信息...', '分析技术影响力...', '生成调研报告...'],
  },
  {
    id: 6,
    category: 'hm_person_lookup',
    name: '画像Sourcing',
    description: '帮我找3年以上推荐系统经验的候选人',
    keywords: ['找', '搜索', '候选人', '推荐系统', '经验', 'sourcing', '画像', '3年'],
    roles: ['hm'],
    messageTypes: ['candidate_list', 'text', 'quick_actions'],
    thinkingSteps: ['解析需求画像...', '搜索候选人库...', '智能匹配排序...'],
  },
  {
    id: 7,
    category: 'hm_person_lookup',
    name: '对标人才克隆',
    description: '我想找一个像李四一样的人',
    keywords: ['像', '一样', '对标', '克隆', '类似', '同类型'],
    roles: ['hm'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['分析对标人才特征...', '提取关键画像...', '搜索相似候选人...'],
  },
  {
    id: 8,
    category: 'hm_person_lookup',
    name: '内部人才流动',
    description: '内部有没有合适转岗过来的人',
    keywords: ['内部', '转岗', '流动', '内部人才', '调动'],
    roles: ['hm'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['查询内部人才库...', '评估转岗匹配度...', '推荐合适人选...'],
  },
  {
    id: 9,
    category: 'hm_person_lookup',
    name: '被动候选人触达',
    description: '帮我问问赵六有没有兴趣聊聊',
    keywords: ['问问', '触达', '兴趣', '聊聊', '被动', 'reach out'],
    roles: ['hm'],
    messageTypes: ['message_template', 'text', 'quick_actions'],
    thinkingSteps: ['分析候选人背景...', '设计触达策略...', '生成个性化消息...'],
  },
  {
    id: 10,
    category: 'hm_person_lookup',
    name: '人脉关系图谱',
    description: '这个人和我们之前拒过的某个人是同事吗',
    keywords: ['同事', '关系', '人脉', '认识', '一起', '图谱'],
    roles: ['hm'],
    messageTypes: ['network_graph', 'text'],
    thinkingSteps: ['分析人脉网络...', '查找关联关系...', '生成关系图谱...'],
  },
];

const hmMarketIntelligence: IntentPattern[] = [
  {
    id: 11,
    category: 'hm_market_intelligence',
    name: '岗位对标分析',
    description: '这个岗位有哪些类似的岗位，我想看看他们在招什么人',
    keywords: ['类似岗位', '对标', '在招', '竞品', '同类岗位'],
    roles: ['hm'],
    messageTypes: ['market_analysis', 'text'],
    thinkingSteps: ['分析岗位特征...', '搜索市场同类岗位...', '生成对标报告...'],
  },
  {
    id: 12,
    category: 'hm_market_intelligence',
    name: '人才分布地图',
    description: '做LLM的人才主要在哪些公司',
    keywords: ['人才', '分布', '哪些公司', '主要在', '地图', 'llm'],
    roles: ['hm'],
    messageTypes: ['market_analysis', 'text'],
    thinkingSteps: ['分析人才分布...', '聚合公司数据...', '生成分布地图...'],
  },
  {
    id: 13,
    category: 'hm_market_intelligence',
    name: '人才供需分析',
    description: '这个方向的人才供给怎么样，市场上有多少人',
    keywords: ['供给', '供需', '市场', '多少人', '人才市场'],
    roles: ['hm'],
    messageTypes: ['market_analysis', 'text'],
    thinkingSteps: ['分析市场供给...', '统计人才存量...', '评估供需比例...'],
  },
  {
    id: 14,
    category: 'hm_market_intelligence',
    name: '薪酬对标',
    description: '竞品公司同类岗位开什么薪资',
    keywords: ['薪资', '薪酬', '开多少', '竞品', '对标', '工资'],
    roles: ['hm'],
    messageTypes: ['salary_benchmark', 'text'],
    thinkingSteps: ['收集薪酬数据...', '分析竞品薪资...', '生成对标报告...'],
  },
  {
    id: 15,
    category: 'hm_market_intelligence',
    name: '招聘难度预判',
    description: '这个岗位的市场难度怎么样，好不好招',
    keywords: ['难度', '好不好招', '市场难度', '预判', '容易'],
    roles: ['hm'],
    messageTypes: ['market_analysis', 'text'],
    thinkingSteps: ['分析市场数据...', '评估竞争强度...', '预判招聘难度...'],
  },
  {
    id: 16,
    category: 'hm_market_intelligence',
    name: '市场趋势洞察',
    description: '最近这个方向的人才流动趋势怎么样',
    keywords: ['趋势', '流动', '人才流动', '市场趋势', '最近'],
    roles: ['hm'],
    messageTypes: ['market_analysis', 'analytics', 'text'],
    thinkingSteps: ['分析流动数据...', '识别趋势模式...', '生成趋势报告...'],
  },
  {
    id: 17,
    category: 'hm_market_intelligence',
    name: 'Title对标',
    description: '对标公司的同岗位用什么title',
    keywords: ['title', '职级', '叫什么', 'title对标', '职位名称'],
    roles: ['hm'],
    messageTypes: ['market_analysis', 'text'],
    thinkingSteps: ['收集Title数据...', '对标分析...', '生成Title映射...'],
  },
];

const hmJDProfile: IntentPattern[] = [
  {
    id: 18,
    category: 'hm_jd_profile',
    name: 'JD生成',
    description: '帮我写个JD',
    keywords: ['写jd', '写个jd', 'jd', '职位描述', '招聘文案'],
    roles: ['hm'],
    messageTypes: ['jd_card', 'text', 'quick_actions'],
    thinkingSteps: ['分析岗位需求...', '参考同类JD...', '生成草稿...'],
  },
  {
    id: 19,
    category: 'hm_jd_profile',
    name: 'JD优化',
    description: '这个JD怎么改能吸引更多人来投',
    keywords: ['优化', '改', '吸引', 'jd优化', '修改'],
    roles: ['hm'],
    messageTypes: ['jd_card', 'text'],
    thinkingSteps: ['分析当前JD...', '识别优化点...', '生成优化版本...'],
  },
  {
    id: 20,
    category: 'hm_jd_profile',
    name: '竞品JD对标',
    description: '参考XX公司的类似JD帮我改改',
    keywords: ['参考', '竞品jd', '对标jd', '改改', '类似'],
    roles: ['hm'],
    messageTypes: ['jd_card', 'text'],
    thinkingSteps: ['收集竞品JD...', '对比分析差异...', '融合生成优化版...'],
  },
  {
    id: 21,
    category: 'hm_jd_profile',
    name: '画像动态修正',
    description: '我想要的人其实不完全是JD写的那样',
    keywords: ['不完全是', '画像', '修正', '想要的人', '调整'],
    roles: ['hm'],
    messageTypes: ['text', 'quick_actions'],
    thinkingSteps: ['理解真实需求...', '对比当前画像...', '建议修正方向...'],
  },
  {
    id: 22,
    category: 'hm_jd_profile',
    name: '能力模型构建',
    description: '这个岗位的核心能力模型应该是什么',
    keywords: ['能力模型', '核心能力', '能力', '胜任力', '模型'],
    roles: ['hm'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['分析岗位需求...', '提炼核心能力...', '构建能力模型...'],
  },
  {
    id: 23,
    category: 'hm_jd_profile',
    name: '多语言多渠道发布',
    description: '把JD翻译成英文发到LinkedIn',
    keywords: ['翻译', '英文', 'linkedin', '多渠道', '发布', '外文'],
    roles: ['hm'],
    messageTypes: ['jd_card', 'text'],
    thinkingSteps: ['翻译JD内容...', '适配平台风格...', '生成多语言版本...'],
  },
];

const hmResumeEvaluation: IntentPattern[] = [
  {
    id: 24,
    category: 'hm_resume_evaluation',
    name: '简历筛选推荐',
    description: '这批简历里帮我挑最合适的5个',
    keywords: ['筛选', '挑', '最合适', '简历', '推荐', 'batch'],
    roles: ['hm'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['批量解析简历...', '智能匹配排序...', '生成推荐理由...'],
  },
  {
    id: 25,
    category: 'hm_resume_evaluation',
    name: '候选人对比分析',
    description: '这两个候选人帮我对比一下',
    keywords: ['对比', '比较', 'vs', '哪个好', 'versus'],
    roles: ['hm'],
    messageTypes: ['comparison', 'text'],
    thinkingSteps: ['提取候选人特征...', '多维度对比...', '生成对比报告...'],
  },
  {
    id: 26,
    category: 'hm_resume_evaluation',
    name: '简历疑点分析',
    description: '这个人的简历有什么需要深挖的地方',
    keywords: ['疑点', '深挖', '注意', '问题', '简历问题'],
    roles: ['hm'],
    messageTypes: ['risk_analysis', 'text'],
    thinkingSteps: ['深度解析简历...', '识别潜在疑点...', '生成追问清单...'],
  },
  {
    id: 27,
    category: 'hm_resume_evaluation',
    name: '候选人风险评估',
    description: '这个人有什么风险点',
    keywords: ['风险', '风险点', '评估风险', '有什么问题'],
    roles: ['hm'],
    messageTypes: ['risk_analysis', 'text'],
    thinkingSteps: ['全面背景核查...', '识别潜在风险...', '生成风险报告...'],
  },
  {
    id: 28,
    category: 'hm_resume_evaluation',
    name: '历史录用对标',
    description: '这个人和上次我们录用的那个比怎么样',
    keywords: ['上次', '录用', '比', '历史', '之前录用'],
    roles: ['hm'],
    messageTypes: ['comparison', 'text'],
    thinkingSteps: ['调取历史录用数据...', '多维度对比...', '生成对标分析...'],
  },
  {
    id: 29,
    category: 'hm_resume_evaluation',
    name: '录用决策辅助',
    description: '这个人值不值得给offer',
    keywords: ['值不值得', '给offer', '录用', '决策', 'hire'],
    roles: ['hm'],
    messageTypes: ['text', 'quick_actions'],
    thinkingSteps: ['综合评估候选人...', '分析匹配度...', '给出决策建议...'],
  },
  {
    id: 30,
    category: 'hm_resume_evaluation',
    name: '推荐可解释性',
    description: '为什么推荐了这个人？哪里匹配了？',
    keywords: ['为什么', '匹配', '推荐', '解释', '哪里'],
    roles: ['hm'],
    messageTypes: ['text', 'candidate_card'],
    thinkingSteps: ['回溯推荐逻辑...', '拆解匹配维度...', '生成解释报告...'],
  },
  {
    id: 31,
    category: 'hm_resume_evaluation',
    name: '历史记录查询',
    description: '这个人之前被我们拒过吗？为什么拒的？',
    keywords: ['拒过', '之前', '历史', '为什么拒', '记录'],
    roles: ['hm'],
    messageTypes: ['text', 'timeline'],
    thinkingSteps: ['查询历史记录...', '调取拒信原因...', '生成历史报告...'],
  },
];

const hmInterview: IntentPattern[] = [
  {
    id: 32,
    category: 'hm_interview',
    name: 'AI面试执行',
    description: '安排这个人做AI初筛面试',
    keywords: ['ai面试', '初筛', '安排面试', 'ai初筛'],
    roles: ['hm'],
    messageTypes: ['text', 'quick_actions'],
    thinkingSteps: ['确认候选人信息...', '配置AI面试...', '发送面试邀请...'],
  },
  {
    id: 33,
    category: 'hm_interview',
    name: '面试题推荐',
    description: '这个人我该问什么问题',
    keywords: ['问什么', '面试题', '问题', '该问', '题目'],
    roles: ['hm'],
    messageTypes: ['interview_questions', 'text'],
    thinkingSteps: ['分析候选人背景...', '匹配考察维度...', '生成面试题库...'],
  },
  {
    id: 34,
    category: 'hm_interview',
    name: '面试报告解读',
    description: '帮我看看这次面试的评估报告',
    keywords: ['面试报告', '评估报告', '解读', '看看报告'],
    roles: ['hm'],
    messageTypes: ['evaluation', 'text'],
    thinkingSteps: ['调取面试报告...', '分析评估维度...', '生成解读摘要...'],
  },
  {
    id: 35,
    category: 'hm_interview',
    name: '面试评价代写',
    description: '面试完了帮我写个评估，我口述给你',
    keywords: ['写评估', '面试评价', '口述', '代写', '评价'],
    roles: ['hm'],
    messageTypes: ['evaluation', 'text'],
    thinkingSteps: ['整理口述内容...', '结构化评估...', '生成正式评价...'],
  },
  {
    id: 36,
    category: 'hm_interview',
    name: '校准会辅助',
    description: '帮我准备校准会（Calibration）的材料',
    keywords: ['校准会', 'calibration', '材料', '准备'],
    roles: ['hm'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['收集候选人数据...', '汇总评估结果...', '生成校准材料...'],
  },
  {
    id: 37,
    category: 'hm_interview',
    name: '评估一致性分析',
    description: '几个面试官的评价差异很大，帮我分析一下',
    keywords: ['差异', '评价差异', '一致性', '分析', '面试官'],
    roles: ['hm'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['对比多份评估...', '识别差异点...', '分析原因...'],
  },
  {
    id: 38,
    category: 'hm_interview',
    name: '面试官偏差检测',
    description: '这个面试官是不是评分偏严了',
    keywords: ['评分', '偏严', '偏差', '面试官', '严格'],
    roles: ['hm'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['分析历史评分...', '计算偏差指数...', '生成偏差报告...'],
  },
];

const hmProcessManagement: IntentPattern[] = [
  {
    id: 39,
    category: 'hm_process_management',
    name: '招聘进度总览',
    description: '我的招聘进度报告是什么样的',
    keywords: ['进度报告', '招聘进度', '报告', '总览', 'overview'],
    roles: ['hm'],
    messageTypes: ['pipeline_overview', 'text'],
    thinkingSteps: ['汇总招聘数据...', '分析各岗位进度...', '生成进度报告...'],
  },
  {
    id: 40,
    category: 'hm_process_management',
    name: '岗位老化预警',
    description: '这个岗位开了多久了',
    keywords: ['开了多久', '老化', '开了', '时间', '预警'],
    roles: ['hm'],
    messageTypes: ['pipeline_overview', 'text'],
    thinkingSteps: ['查询岗位开设时间...', '分析招聘效率...', '生成老化预警...'],
  },
  {
    id: 41,
    category: 'hm_process_management',
    name: '流程瓶颈诊断',
    description: '卡在哪个环节了',
    keywords: ['卡', '瓶颈', '环节', '哪个', '卡住'],
    roles: ['hm'],
    messageTypes: ['pipeline_overview', 'text'],
    thinkingSteps: ['分析流程数据...', '识别瓶颈环节...', '生成诊断报告...'],
  },
  {
    id: 42,
    category: 'hm_process_management',
    name: '跨角色协调催办',
    description: '帮我催一下HR，这个候选人的面试安排得怎么样了',
    keywords: ['催', '催一下', '协调', '安排', '怎么样了'],
    roles: ['hm'],
    messageTypes: ['message_template', 'text', 'quick_actions'],
    thinkingSteps: ['查询当前状态...', '识别延误原因...', '生成催办消息...'],
  },
  {
    id: 43,
    category: 'hm_process_management',
    name: '面试排程',
    description: '帮我约这个候选人下周三下午面试',
    keywords: ['约', '排程', '下周', '面试', '时间', '安排'],
    roles: ['hm'],
    messageTypes: ['schedule_card', 'text'],
    thinkingSteps: ['查询可用时段...', '匹配双方时间...', '生成排程方案...'],
  },
  {
    id: 44,
    category: 'hm_process_management',
    name: '流程节点查询',
    description: '这个人的背景调查结果出了吗',
    keywords: ['背景调查', '出了吗', '节点', '结果', '背调'],
    roles: ['hm'],
    messageTypes: ['timeline', 'text'],
    thinkingSteps: ['查询流程节点...', '获取最新状态...', '反馈结果...'],
  },
  {
    id: 45,
    category: 'hm_process_management',
    name: '招聘周期预测',
    description: '按现在的节奏，这个岗位还需要多久能关',
    keywords: ['多久', '周期', '预测', '关', '完成', '还需要'],
    roles: ['hm'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['分析历史数据...', '预测剩余时间...', '给出周期预估...'],
  },
];

const hmOfferNegotiation: IntentPattern[] = [
  {
    id: 46,
    category: 'hm_offer_negotiation',
    name: '人才Sell',
    description: '帮我生成针对这个候选人的sell方案',
    keywords: ['sell', 'sell方案', '吸引', '方案', '说服'],
    roles: ['hm'],
    messageTypes: ['offer_package', 'text'],
    thinkingSteps: ['分析候选人动机...', '提炼核心卖点...', '生成sell方案...'],
  },
  {
    id: 47,
    category: 'hm_offer_negotiation',
    name: '薪酬合理性评估',
    description: '这个人期望薪资合理吗',
    keywords: ['期望薪资', '合理', '薪酬', '期望值', '薪资'],
    roles: ['hm'],
    messageTypes: ['salary_benchmark', 'text'],
    thinkingSteps: ['查询市场薪酬...', '对比候选人期望...', '评估合理性...'],
  },
  {
    id: 48,
    category: 'hm_offer_negotiation',
    name: '竞争情报',
    description: '他手上还有什么offer',
    keywords: ['offer', '手上', '竞争', '其他offer', '竞品offer'],
    roles: ['hm'],
    messageTypes: ['text', 'market_analysis'],
    thinkingSteps: ['收集竞争情报...', '分析竞品offer...', '生成竞争策略...'],
  },
  {
    id: 49,
    category: 'hm_offer_negotiation',
    name: 'Offer方案生成',
    description: '帮我出个offer方案，有竞争力又不超预算',
    keywords: ['offer方案', '有竞争力', '预算', '出offer', '方案'],
    roles: ['hm'],
    messageTypes: ['offer_package', 'text'],
    thinkingSteps: ['分析预算约束...', '设计薪酬结构...', '生成offer方案...'],
  },
  {
    id: 50,
    category: 'hm_offer_negotiation',
    name: 'Offer loss分析',
    description: '上个月为什么连续被拒了3个offer',
    keywords: ['被拒', 'loss', '为什么', '连续', '分析'],
    roles: ['hm'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['调取拒offer数据...', '分析拒绝原因...', '生成loss分析...'],
  },
  {
    id: 51,
    category: 'hm_offer_negotiation',
    name: '候选人沟通函生成',
    description: '帮我draft一封有温度的拒信',
    keywords: ['拒信', 'draft', '沟通函', '有温度', '拒绝'],
    roles: ['hm'],
    messageTypes: ['message_template', 'text'],
    thinkingSteps: ['分析候选人情况...', '设计沟通策略...', '生成温暖拒信...'],
  },
];

const hmTeamPlanning: IntentPattern[] = [
  {
    id: 52,
    category: 'hm_team_planning',
    name: '团队能力诊断',
    description: '我团队现在缺什么能力',
    keywords: ['缺什么', '团队', '能力', '诊断', '缺失'],
    roles: ['hm'],
    messageTypes: ['team_diagnosis', 'text'],
    thinkingSteps: ['分析团队现状...', '识别能力缺口...', '生成诊断报告...'],
  },
  {
    id: 53,
    category: 'hm_team_planning',
    name: '招聘影响模拟',
    description: '如果招了这个人，团队能力图谱会怎么变',
    keywords: ['如果招了', '能力图谱', '模拟', '变化', '影响'],
    roles: ['hm'],
    messageTypes: ['team_diagnosis', 'text'],
    thinkingSteps: ['分析候选人能力...', '模拟团队变化...', '生成影响预测...'],
  },
  {
    id: 54,
    category: 'hm_team_planning',
    name: '招聘优先级建议',
    description: '我应该先招哪个岗位',
    keywords: ['先招', '优先级', '哪个岗位', '应该', '顺序'],
    roles: ['hm'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['分析业务需求...', '评估各岗位紧迫度...', '给出优先级建议...'],
  },
  {
    id: 55,
    category: 'hm_team_planning',
    name: 'HC规划辅助',
    description: 'Q3的HC够不够用',
    keywords: ['hc', '够不够用', '规划', 'headcount', '编制'],
    roles: ['hm'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['分析当前HC...', '预测业务需求...', '评估HC充足度...'],
  },
  {
    id: 56,
    category: 'hm_team_planning',
    name: '历史招聘复盘',
    description: '去年这个岗位招了多久，成本是多少',
    keywords: ['去年', '成本', '多久', '复盘', '历史'],
    roles: ['hm'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['调取历史数据...', '计算招聘成本...', '生成复盘报告...'],
  },
];

const hmPostHire: IntentPattern[] = [
  {
    id: 57,
    category: 'hm_post_hire',
    name: '招聘质量回溯',
    description: '去年招的那批人现在表现怎么样',
    keywords: ['表现', '去年招的', '质量', '回溯', '现在'],
    roles: ['hm'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['调取绩效数据...', '评估招聘质量...', '生成回溯报告...'],
  },
  {
    id: 58,
    category: 'hm_post_hire',
    name: 'Onboarding规划',
    description: '帮我做个新人30天融入计划',
    keywords: ['融入计划', 'onboarding', '30天', '新人', '计划'],
    roles: ['hm'],
    messageTypes: ['onboarding_plan', 'text'],
    thinkingSteps: ['分析岗位需求...', '设计融入路径...', '生成30天计划...'],
  },
  {
    id: 59,
    category: 'hm_post_hire',
    name: '渠道质量分析',
    description: '哪个渠道招来的人留存率最高',
    keywords: ['渠道', '留存率', '质量', '哪个', '分析'],
    roles: ['hm'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['分析渠道数据...', '计算留存率...', '生成渠道质量报告...'],
  },
];

// ========== B. 招聘HR ==========

const hrPipeline: IntentPattern[] = [
  {
    id: 60,
    category: 'hr_pipeline',
    name: '全局Pipeline监控',
    description: '所有岗位的pipeline健康度一览',
    keywords: ['pipeline', '健康度', '全局', '所有岗位', '一览'],
    roles: ['hr'],
    messageTypes: ['pipeline_overview', 'text'],
    thinkingSteps: ['汇总所有岗位...', '计算健康度指标...', '生成全局视图...'],
  },
  {
    id: 61,
    category: 'hr_pipeline',
    name: '风险预警',
    description: '哪些岗位可能完不成Q2目标',
    keywords: ['完不成', '风险', 'q2', '目标', '预警'],
    roles: ['hr'],
    messageTypes: ['pipeline_overview', 'text'],
    thinkingSteps: ['分析目标进度...', '识别风险岗位...', '生成预警报告...'],
  },
  {
    id: 62,
    category: 'hr_pipeline',
    name: '流程滞留检测',
    description: '哪些候选人卡了超过7天没推进',
    keywords: ['卡了', '超过', '7天', '滞留', '没推进'],
    roles: ['hr'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['扫描流程数据...', '识别滞留候选人...', '生成催办清单...'],
  },
  {
    id: 63,
    category: 'hr_pipeline',
    name: '自动化报告生成',
    description: '月度/周度招聘报告帮我生成一份',
    keywords: ['报告', '月度', '周度', '生成', '招聘报告'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['汇总周期数据...', '生成分析图表...', '输出报告文档...'],
  },
  {
    id: 64,
    category: 'hr_pipeline',
    name: '渠道效果分析',
    description: '各渠道效果怎么样，ROI多少',
    keywords: ['渠道', 'roi', '效果', '分析', '怎么样'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['统计渠道数据...', '计算ROI...', '生成效果分析...'],
  },
  {
    id: 65,
    category: 'hr_pipeline',
    name: '供应商评估',
    description: '哪个猎头效果最好',
    keywords: ['猎头', '供应商', '效果', '最好', '评估'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['汇总供应商数据...', '评估交付质量...', '生成排名报告...'],
  },
  {
    id: 66,
    category: 'hr_pipeline',
    name: '候选人体验监控',
    description: '有多少候选人投了简历没收到任何回复',
    keywords: ['没回复', '体验', '监控', '投了', '候选人'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['查询投递数据...', '统计未回复率...', '生成体验报告...'],
  },
  {
    id: 67,
    category: 'hr_pipeline',
    name: '合规检查',
    description: '面试评价都填了吗，谁还没填',
    keywords: ['填了', '评价', '合规', '谁还没', '检查'],
    roles: ['hr'],
    messageTypes: ['text', 'analytics'],
    thinkingSteps: ['扫描评价状态...', '识别未填人员...', '生成合规报告...'],
  },
  {
    id: 68,
    category: 'hr_pipeline',
    name: '催办通知',
    description: '帮我给用人经理发个提醒，这3个候选人等反馈超过5天了',
    keywords: ['提醒', '催办', '通知', '等反馈', '超过'],
    roles: ['hr'],
    messageTypes: ['message_template', 'text'],
    thinkingSteps: ['识别待办事项...', '生成催办消息...', '发送提醒通知...'],
  },
  {
    id: 69,
    category: 'hr_pipeline',
    name: '人才复用/跨岗推荐',
    description: '这个候选人适合别的岗位吗，帮我看看能不能内部流转',
    keywords: ['适合别的', '内部流转', '复用', '跨岗', '推荐'],
    roles: ['hr'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['分析候选人能力...', '匹配其他岗位...', '生成流转建议...'],
  },
  {
    id: 70,
    category: 'hr_pipeline',
    name: '根因分析',
    description: '帮我分析一下为什么初面通过率这么低',
    keywords: ['为什么', '通过率', '根因', '分析', '低'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['分析漏斗数据...', '识别关键流失点...', '生成根因分析...'],
  },
  {
    id: 71,
    category: 'hr_pipeline',
    name: '成本核算',
    description: '招聘成本分析，人均招聘成本是多少',
    keywords: ['成本', '人均', '核算', '多少', '分析'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['汇总成本数据...', '计算人均成本...', '生成成本报告...'],
  },
  {
    id: 72,
    category: 'hr_pipeline',
    name: '汇报材料生成',
    description: '帮我准备给业务leader的招聘汇报材料',
    keywords: ['汇报', '材料', 'leader', '准备', '招聘汇报'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['汇总关键数据...', '提炼业务洞察...', '生成汇报PPT...'],
  },
  {
    id: 73,
    category: 'hr_pipeline',
    name: '候选人体验分析',
    description: '候选人满意度调研结果怎么样',
    keywords: ['满意度', '调研', '体验', '结果', '怎么样'],
    roles: ['hr'],
    messageTypes: ['analytics', 'text'],
    thinkingSteps: ['调取调研数据...', '分析满意度...', '生成体验报告...'],
  },
  {
    id: 74,
    category: 'hr_pipeline',
    name: '批量操作',
    description: '批量给这20个候选人发拒信',
    keywords: ['批量', '20个', '发拒信', '批量操作'],
    roles: ['hr'],
    messageTypes: ['message_template', 'text'],
    thinkingSteps: ['确认批量对象...', '生成批量模板...', '执行批量发送...'],
  },
  {
    id: 75,
    category: 'hr_pipeline',
    name: '竞对招聘动态',
    description: '帮我看看竞品最近在大量招什么岗位',
    keywords: ['竞对', '竞品', '动态', '大量招', '最近'],
    roles: ['hr'],
    messageTypes: ['market_analysis', 'text'],
    thinkingSteps: ['收集竞对信息...', '分析招聘动态...', '生成动态报告...'],
  },
];

// ========== C. 候选人 ==========

const candidateSelfService: IntentPattern[] = [
  {
    id: 76,
    category: 'candidate_self_service',
    name: '智能岗位推荐',
    description: '有没有适合我的岗位',
    keywords: ['适合我', '岗位', '推荐', '有没有'],
    roles: ['candidate'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['分析候选人背景...', '匹配开放岗位...', '生成推荐列表...'],
  },
  {
    id: 77,
    category: 'candidate_self_service',
    name: '岗位发现/搜索',
    description: '你们AI方向在招什么',
    keywords: ['在招什么', 'ai方向', '岗位', '搜索', '发现'],
    roles: ['candidate'],
    messageTypes: ['candidate_list', 'text'],
    thinkingSteps: ['解析搜索意图...', '查询开放岗位...', '生成岗位列表...'],
  },
  {
    id: 78,
    category: 'candidate_self_service',
    name: '进度查询',
    description: '我投的那个岗位到哪个环节了',
    keywords: ['投了', '环节', '进度', '到哪个', '查询'],
    roles: ['candidate'],
    messageTypes: ['timeline', 'text'],
    thinkingSteps: ['查询申请记录...', '获取最新进度...', '生成进度报告...'],
  },
  {
    id: 79,
    category: 'candidate_self_service',
    name: '面试预期管理',
    description: '面试大概会问什么',
    keywords: ['会问什么', '面试', '预期', '大概', '问什么'],
    roles: ['candidate'],
    messageTypes: ['interview_questions', 'text'],
    thinkingSteps: ['分析岗位要求...', '预测面试方向...', '生成准备指南...'],
  },
  {
    id: 80,
    category: 'candidate_self_service',
    name: 'AI模拟面试',
    description: '帮我模拟面试练一下',
    keywords: ['模拟', '练', '模拟面试', '练习'],
    roles: ['candidate'],
    messageTypes: ['interview_questions', 'text'],
    thinkingSteps: ['配置模拟场景...', '生成模拟题目...', '开始模拟面试...'],
  },
  {
    id: 81,
    category: 'candidate_self_service',
    name: '团队/岗位信息查询',
    description: '这个团队是做什么的，leader是谁',
    keywords: ['团队', '做什么', 'leader', '是谁', '信息'],
    roles: ['candidate'],
    messageTypes: ['text', 'profile_card'],
    thinkingSteps: ['查询团队信息...', '获取leader资料...', '生成团队介绍...'],
  },
  {
    id: 82,
    category: 'candidate_self_service',
    name: '薪酬福利咨询',
    description: '你们的薪资结构大概什么水平',
    keywords: ['薪资结构', '薪酬', '水平', '福利', '多少'],
    roles: ['candidate'],
    messageTypes: ['salary_benchmark', 'text'],
    thinkingSteps: ['查询薪酬政策...', '对标市场水平...', '生成薪酬说明...'],
  },
  {
    id: 83,
    category: 'candidate_self_service',
    name: '岗位匹配咨询',
    description: '我更适合这个岗位还是那个岗位',
    keywords: ['更适合', '这个还是那个', '匹配', '哪个'],
    roles: ['candidate'],
    messageTypes: ['comparison', 'text'],
    thinkingSteps: ['分析候选人画像...', '对比岗位匹配度...', '生成匹配建议...'],
  },
  {
    id: 84,
    category: 'candidate_self_service',
    name: '简历优化建议',
    description: '我的简历需要怎么改才能更匹配',
    keywords: ['简历', '改', '优化', '更匹配', '建议'],
    roles: ['candidate'],
    messageTypes: ['resume_tips', 'text'],
    thinkingSteps: ['分析当前简历...', '对比岗位要求...', '生成优化建议...'],
  },
  {
    id: 85,
    category: 'candidate_self_service',
    name: '面试改期',
    description: '面试时间能改到下周吗',
    keywords: ['改期', '改到', '下周', '时间', '能改'],
    roles: ['candidate'],
    messageTypes: ['schedule_card', 'text'],
    thinkingSteps: ['查询可改期时段...', '确认新时间...', '生成改期方案...'],
  },
  {
    id: 86,
    category: 'candidate_self_service',
    name: '入职引导',
    description: '入职需要准备什么材料',
    keywords: ['入职', '准备', '材料', '需要', '什么'],
    roles: ['candidate'],
    messageTypes: ['onboarding_plan', 'text'],
    thinkingSteps: ['查询入职要求...', '整理材料清单...', '生成入职指南...'],
  },
  {
    id: 87,
    category: 'candidate_self_service',
    name: '内推入口',
    description: '我有个朋友也想投，帮我推荐',
    keywords: ['朋友', '推荐', '内推', '也想投'],
    roles: ['candidate'],
    messageTypes: ['text', 'quick_actions'],
    thinkingSteps: ['生成内推链接...', '准备推荐模板...', '发送内推邀请...'],
  },
  {
    id: 88,
    category: 'candidate_self_service',
    name: '反馈解释',
    description: '拒信里说的"不匹配"具体是什么意思',
    keywords: ['不匹配', '什么意思', '反馈', '解释', '拒信'],
    roles: ['candidate'],
    messageTypes: ['text'],
    thinkingSteps: ['分析反馈内容...', '解释具体含义...', '提供改进建议...'],
  },
];

// 合并所有意图
export const ALL_INTENTS: IntentPattern[] = [
  ...hmPersonLookup,
  ...hmMarketIntelligence,
  ...hmJDProfile,
  ...hmResumeEvaluation,
  ...hmInterview,
  ...hmProcessManagement,
  ...hmOfferNegotiation,
  ...hmTeamPlanning,
  ...hmPostHire,
  ...hrPipeline,
  ...candidateSelfService,
];

// 根据角色过滤意图
export function getIntentsByRole(role: UserRole): IntentPattern[] {
  return ALL_INTENTS.filter(intent => intent.roles.includes(role));
}

// 根据ID查找意图
export function getIntentById(id: number): IntentPattern | undefined {
  return ALL_INTENTS.find(intent => intent.id === id);
}

// 根据分类查找意图
export function getIntentsByCategory(category: IntentCategory): IntentPattern[] {
  return ALL_INTENTS.filter(intent => intent.category === category);
}

// 意图匹配分数计算
export function matchIntent(input: string, role: UserRole): { intent: IntentPattern; score: number }[] {
  const lowerInput = input.toLowerCase();
  const roleIntents = getIntentsByRole(role);
  
  const results = roleIntents.map(intent => {
    let score = 0;
    for (const keyword of intent.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    // 额外加分：关键词匹配数量多、关键词在输入中占比高
    if (score > 0) {
      score += (score / intent.keywords.length) * 0.5;
    }
    return { intent, score };
  });
  
  return results.filter(r => r.score > 0).sort((a, b) => b.score - a.score);
}

// 获取分类的中文名称
export function getCategoryName(category: IntentCategory): string {
  const map: Record<IntentCategory, string> = {
    hm_person_lookup: '找人相关',
    hm_market_intelligence: '市场认知',
    hm_jd_profile: 'JD与画像',
    hm_resume_evaluation: '简历评估',
    hm_interview: '面试相关',
    hm_process_management: '流程管理',
    hm_offer_negotiation: 'Offer谈判',
    hm_team_planning: '团队规划',
    hm_post_hire: '入职闭环',
    hr_pipeline: 'HR运营',
    candidate_self_service: '候选人服务',
  };
  return map[category] || category;
}

// 获取角色欢迎语的快捷操作（基于意图分类）
export function getRoleQuickActions(role: UserRole): QuickAction[] {
  switch (role) {
    case 'hm':
      return [
        { label: '🔍 找人', icon: 'Search', message: '帮我找3年以上推荐系统经验的候选人' },
        { label: '📊 看报告', icon: 'BarChart3', message: '我的招聘进度报告是什么样的' },
        { label: '📝 写JD', icon: 'FileText', message: '帮我写个JD' },
        { label: '👤 查人才', icon: 'User', message: '帮我找一个张伟，之前在美团做推荐的' },
        { label: '💰 Sell方案', icon: 'DollarSign', message: '帮我生成针对这个候选人的sell方案' },
        { label: '⚖️ 对比', icon: 'GitCompare', message: '这两个候选人帮我对比一下' },
      ];
    case 'hr':
      return [
        { label: '📈 Pipeline', icon: 'BarChart3', message: '所有岗位的pipeline健康度一览' },
        { label: '📅 安排面试', icon: 'Calendar', message: '帮我安排面试' },
        { label: '⚠️ 风险预警', icon: 'AlertTriangle', message: '哪些岗位可能完不成Q2目标' },
        { label: '📋 报告', icon: 'FileText', message: '月度招聘报告帮我生成一份' },
        { label: '💸 成本', icon: 'DollarSign', message: '招聘成本分析，人均招聘成本是多少' },
        { label: '🔔 催办', icon: 'Bell', message: '哪些候选人卡了超过7天没推进' },
      ];
    case 'candidate':
      return [
        { label: '🔍 找岗位', icon: 'Search', message: '有没有适合我的岗位' },
        { label: '📊 查进度', icon: 'BarChart3', message: '我投的那个岗位到哪个环节了' },
        { label: '🎤 模拟面试', icon: 'Mic', message: '帮我模拟面试练一下' },
        { label: '💼 团队信息', icon: 'Users', message: '这个团队是做什么的，leader是谁' },
        { label: '📝 简历优化', icon: 'FileText', message: '我的简历需要怎么改才能更匹配' },
        { label: '💰 薪酬咨询', icon: 'DollarSign', message: '你们的薪资结构大概什么水平' },
      ];
    default:
      return [];
  }
}
