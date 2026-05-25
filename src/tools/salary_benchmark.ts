/**
 * T7: salary_benchmark — 薪酬对标
 *
 * 数据源: salary.json
 * 参数: position, level?, location?
 * 返回: SalaryBenchmarkData
 */

import type {
  SalaryBenchmarkParams,
  SalaryBenchmarkResult,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawSalaryToBenchmarkData, type RawSalaryRole } from './utils/mappers';

/** position 关键词到 salary.json 中 role key 的模糊映射 */
const ROLE_ALIASES: Record<string, string[]> = {
  recommendation_engineer: ['推荐', '推荐系统', '推荐算法', '推荐引擎', '推荐工程师'],
  llm_engineer: ['大模型', 'llm', '大语言模型', '语言模型', 'nlp'],
  backend_architect: ['后端', '架构', '后端架构', '后端开发', '服务端'],
  frontend_expert: ['前端', '前端技术', '前端开发', 'react', 'vue', 'web'],
  data_platform_lead: ['数据平台', '数据工程', '数据仓库', '大数据'],
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

export async function salary_benchmark(params: SalaryBenchmarkParams): Promise<SalaryBenchmarkResult> {
  try {
    const salaryData = loadData<Record<string, RawSalaryRole>>('salary');
    if (!salaryData || typeof salaryData !== 'object') {
      return err('薪酬数据暂时不可用。请稍后再试。');
    }

    const roleKey = resolveRoleKey(params.position);
    if (!roleKey || !salaryData[roleKey]) {
      return ok(
        {
          title: `${params.position} — 薪酬对标`,
          position: params.position,
          benchmarks: [],
          market_median: 0,
          recommendation: `暂无「${params.position}」方向的薪酬对标数据。建议参考同级别通用行情：P7 100-150万，P8 150-220万。`,
        },
        `这个岗位的薪酬对标数据暂时不全，我先给你同级别通用行情作为参考。`,
      );
    }

    const role = salaryData[roleKey];
    let result = rawSalaryToBenchmarkData(role);

    // 按 level 过滤
    if (params.level) {
      const lv = params.level.toLowerCase();
      result = {
        ...result,
        benchmarks: result.benchmarks.filter((b) => b.level.toLowerCase().includes(lv)),
      };
    }

    return ok(result);
  } catch (e) {
    return err('这个岗位的薪酬对标数据暂时不全，我先给你同级别通用行情作为参考。');
  }
}
