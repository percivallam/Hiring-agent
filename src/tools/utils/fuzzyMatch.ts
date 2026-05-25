/**
 * 模糊匹配 + 评分工具
 *
 * 从 src/data/index.ts 迁移并适配 contracts 类型。
 * 提供中文分词、同义词扩展、匹配度评分、亮点/差距提取。
 */

import type { RawResume } from './mappers';

// ══════════════════════════════════════════
// 分词
// ══════════════════════════════════════════

/** 简单中文分词 + 关键词提取 */
export function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens: string[] = [];
  for (const part of normalized.split(/[,，、/()\s]+/)) {
    const trimmed = part.trim();
    if (trimmed) tokens.push(trimmed);
  }
  return tokens;
}

// ══════════════════════════════════════════
// 同义词映射
// ══════════════════════════════════════════

export const SKILL_SYNONYMS: Record<string, string[]> = {
  '推荐系统': ['推荐算法', '推荐引擎', '个性化推荐', 'recommendation', 'ctr预估', '排序模型', '召回', '精排'],
  '大模型': ['llm', '大语言模型', '预训练', 'transformer', 'gpt', '语言模型', 'nlp', '自然语言处理', 'chatgpt'],
  '后端': ['后端开发', '服务端', 'java', 'go', '分布式', '微服务', '高并发'],
  '前端': ['react', 'vue', 'typescript', 'javascript', 'web', 'h5', 'css', 'node.js'],
  '数据工程': ['数据仓库', '数仓', 'etl', 'spark', 'flink', 'hive', '数据平台'],
  '产品经理': ['pm', '产品设计', '产品策划', '策略产品'],
  '广告': ['广告算法', '商业化', 'ctr', 'cvr', '出价', 'dsp', 'ssp'],
  '搜索': ['搜索引擎', '信息检索', '排序', 'query理解', '搜索算法'],
  'devops': ['sre', '运维', 'k8s', 'kubernetes', 'docker', 'cicd', 'terraform'],
  '项目管理': ['tpm', '项目经理', '敏捷', 'scrum', 'pmo'],
  'ui': ['ux', '设计', '交互', '视觉', 'figma', 'sketch'],
  'bsp': ['嵌入式', '嵌入式底层', 'bsp工程师', '驱动开发', '底层系统', 'rtos', 'linux内核', '板级支持包'],
  '深度学习': ['deep learning', 'pytorch', 'tensorflow', '神经网络', 'cnn', 'rnn'],
  '机器学习': ['machine learning', 'ml', 'gbdt', 'xgboost', 'lr'],
  '数据': ['数据分析', 'data', 'sql', '数据挖掘'],
};

/** 展开查询词的同义词 */
export function expandTokens(tokens: string[]): string[] {
  const expanded = [...tokens];
  for (const token of tokens) {
    for (const [key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
      if (token.includes(key) || key.includes(token)) {
        expanded.push(...synonyms);
      }
    }
  }
  return expanded;
}

// ══════════════════════════════════════════
// 匹配度评分 0-100
// ══════════════════════════════════════════

export function computeMatchScore(
  query: string,
  resume: RawResume,
  filters?: { experience_min?: number; experience_max?: number; skills?: string[] },
): number {
  const queryTokens = tokenize(query);
  const expandedTokens = expandTokens(queryTokens);
  let score = 0;

  // 技能匹配 (权重 40)
  for (const skill of resume.skills) {
    for (const qt of expandedTokens) {
      if (skill.toLowerCase().includes(qt) || qt.includes(skill.toLowerCase())) {
        score += 40 / Math.max(resume.skills.length, 1);
      }
    }
  }

  // 职位/公司匹配 (权重 25)
  for (const qt of expandedTokens) {
    if (resume.currentTitle.toLowerCase().includes(qt)) score += 15;
    if (resume.currentCompany.toLowerCase().includes(qt)) score += 10;
  }

  // 标签匹配 (权重 20)
  for (const tag of resume.tags) {
    for (const qt of expandedTokens) {
      if (tag.toLowerCase().includes(qt)) score += 20 / Math.max(resume.tags.length, 1);
    }
  }

  // 经验年限匹配 (权重 10)
  if (filters?.experience_min && resume.experience >= filters.experience_min) {
    score += 10;
  }
  if (filters?.experience_max && resume.experience <= filters.experience_max) {
    score += 5;
  }

  // 教育背景匹配 (权重 5)
  for (const qt of queryTokens) {
    if (resume.education.toLowerCase().includes(qt)) score += 5;
  }

  return Math.min(Math.round(score), 100);
}

// ══════════════════════════════════════════
// 亮点/差距提取
// ══════════════════════════════════════════

export function extractHighlights(query: string, resume: RawResume): string[] {
  const highlights: string[] = [];
  const qt = tokenize(query);
  const expandedQt = expandTokens(qt);

  for (const skill of resume.skills) {
    for (const q of expandedQt) {
      if (skill.toLowerCase().includes(q) || q.includes(skill.toLowerCase())) {
        highlights.push(`技能匹配: ${skill}`);
        break;
      }
    }
  }

  if (highlights.length === 0 && resume.tags.length > 0) {
    return resume.tags.slice(0, 3).map((t) => `标签: ${t}`);
  }

  return highlights.slice(0, 3);
}

export function extractGaps(query: string, resume: RawResume): string[] {
  const gaps: string[] = [];
  const qt = tokenize(query);
  const expandedQt = expandTokens(qt);

  // 检查查询中提到的技能是否在简历中存在
  const allSkills = new Set(resume.skills.map((s) => s.toLowerCase()));
  for (const q of expandedQt) {
    if (q.length < 2) continue;
    const found = [...allSkills].some((s) => s.includes(q) || q.includes(s));
    if (!found) {
      // 只对看起来像技能的关键词报缺
      const looksLikeSkill =
        q.length >= 3 &&
        !['经验', '以上', '北京', '上海', '深圳', '杭州', '硕士', '本科', '博士', '优先'].includes(q);
      if (looksLikeSkill) {
        gaps.push(`缺少: ${q}`);
      }
    }
  }

  return gaps.slice(0, 3);
}
