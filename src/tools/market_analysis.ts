/**
 * T6: market_analysis — 市场分析
 *
 * 数据源: market.json
 * 参数: position (岗位关键词), location?
 * 返回: MarketAnalysisData
 */

import type {
  MarketAnalysisParams,
  MarketAnalysisResult,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawMarketToAnalysisData, type RawMarketRole } from './utils/mappers';

/** position 关键词到 market.json 中 role key 的模糊映射 */
const ROLE_ALIASES: Record<string, string[]> = {
  recommendation_engineer: ['推荐', '推荐系统', '推荐算法', '推荐引擎', '推荐工程师', '推荐工程'],
  llm_engineer: ['大模型', 'llm', '大语言模型', '语言模型', 'nlp', '自然语言处理', 'gpt'],
  backend_architect: ['后端', '架构', '后端架构', '后端开发', '后端工程师', '服务端', 'java', 'go'],
  frontend_expert: ['前端', '前端技术', '前端开发', 'react', 'vue', 'web'],
  data_platform_lead: ['数据平台', '数据工程', '数据仓库', '数仓', '大数据', '数据'],
};

function resolveRoleKey(position: string): string | null {
  const pos = position.toLowerCase();
  for (const [key, aliases] of Object.entries(ROLE_ALIASES)) {
    for (const alias of aliases) {
      if (pos.includes(alias)) return key;
    }
  }
  return null;
}

export async function market_analysis(params: MarketAnalysisParams): Promise<MarketAnalysisResult> {
  try {
    const marketData = loadData<Record<string, RawMarketRole>>('market');
    if (!marketData || typeof marketData !== 'object') {
      return err('市场数据暂时不可用。请稍后再试。');
    }

    const roleKey = resolveRoleKey(params.position);
    if (!roleKey || !marketData[roleKey]) {
      // 查找不到 → 不是错误，而是告知无此方向数据
      return ok(
        {
          title: `${params.position} — 市场分析`,
          analysis_type: 'supply_demand',
          data: [],
          insights: [
            `暂无「${params.position}」方向的详细市场数据`,
            '建议尝试相近方向查询，如"推荐系统"、"大模型"、"后端架构"',
          ],
        },
        `「${params.position}」方向的详细市场数据暂时不全，但根据我了解的情况，我先给你一个大概判断：这个方向目前人才供给偏紧，竞争较激烈。建议拓宽搜索范围或调整薪酬预期。`,
      );
    }

    const role = marketData[roleKey];
    return ok(rawMarketToAnalysisData(roleKey, role));
  } catch (e) {
    return err('这个方向的详细市场数据暂时不全，但根据我了解的情况，我先给你一个大概判断……');
  }
}
