export { loadData, ok, err, meta } from './loadData';
export type { DataModule } from './loadData';
export {
  rawToCandidateSummary,
  rawToCandidateProfile,
  rawToJobSummary,
  rawToJobDetail,
  rawToPipelineSnapshot,
  rawPipelineToAnalysisData,
  rawMarketToAnalysisData,
  rawSalaryToBenchmarkData,
  extractTrend,
} from './mappers';
export type {
  RawResume,
  RawCareer,
  RawProject,
  RawJob,
  RawPipelineStage,
  RawPipelineJob,
  RawPipeline,
  RawMarketRole,
  RawSalaryRole,
  WeeklyHistoryEntry,
} from './mappers';
export {
  tokenize,
  expandTokens,
  SKILL_SYNONYMS,
  computeMatchScore,
  extractHighlights,
  extractGaps,
} from './fuzzyMatch';
