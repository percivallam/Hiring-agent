/**
 * T3: search_candidates — 搜索候选人
 *
 * 数据源: resumes.json
 * 参数: query, experience_min?, experience_max?, education?, location?, limit?, sort_by_match?
 * 返回: CandidateSummary[]
 *
 * 核心逻辑：模糊中文分词 + 技能同义词扩展 + 匹配度评分 + 亮点/差距提取
 */

import type {
  SearchCandidatesParams,
  SearchCandidatesResult,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawToCandidateSummary, type RawResume } from './utils/mappers';
import { computeMatchScore, extractHighlights, extractGaps } from './utils/fuzzyMatch';

export async function search_candidates(params: SearchCandidatesParams): Promise<SearchCandidatesResult> {
  try {
    const resumes: RawResume[] = loadData<RawResume[]>('resumes');
    if (!Array.isArray(resumes)) {
      return err('候选人数据暂时不可用。请换个方向试试，或者告诉我你需要的技能栈，我用市场经验帮你分析。');
    }

    const query = params.query?.trim();
    if (!query) {
      return err('搜索词不能为空。请告诉我你想找什么方向的候选人，比如"推荐系统"、"Go 后端"、"NLP 算法"。');
    }

    const limit = params.limit && params.limit > 0 ? params.limit : 10;

    // 计算匹配度
    let results = resumes
      .map((r) => ({
        resume: r,
        score: computeMatchScore(query, r, {
          experience_min: params.experience_min,
          experience_max: params.experience_max,
        }),
      }))
      .filter(({ score }) => score > 0);

    // 附加筛选（匹配度之外的硬过滤）
    if (params.education) {
      const edu = params.education.toLowerCase();
      results = results.filter(({ resume }) => resume.education.toLowerCase().includes(edu));
    }
    if (params.location) {
      const loc = params.location.toLowerCase();
      results = results.filter(({ resume }) => resume.location?.toLowerCase().includes(loc));
    }

    // 排序
    if (params.sort_by_match !== false) {
      results.sort((a, b) => b.score - a.score);
    }

    // 截断
    results = results.slice(0, limit);

    const candidates = results.map(({ resume, score }) =>
      rawToCandidateSummary(
        resume,
        score,
        extractHighlights(query, resume),
        extractGaps(query, resume),
      ),
    );

    if (candidates.length === 0) {
      return ok(
        [],
        '我这边搜下来没有完全匹配的候选人。建议你试试放宽条件（比如不限经验年限），或者换个关键词（用技术栈而非岗位名）。我也可以先给你分析一下市场上这类人才的分布情况。',
      );
    }

    return ok(candidates, `找到 ${candidates.length} 位匹配候选人`);
  } catch (e) {
    return err(
      '候选人搜索暂时出错了。请换个关键词试试，或告诉我你需要什么方向的候选人，我用经验先帮你梳理。',
    );
  }
}
