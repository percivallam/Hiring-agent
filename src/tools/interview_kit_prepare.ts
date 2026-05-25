/**
 * T11: interview_kit_prepare — 准备面试包（演示型工具）
 *
 * mode = 'demo'，返回精心构造的 mock 面试题 + 面试官建议。
 * 基于 candidate_id + job_id 生成个性化面试包。
 */

import type {
  InterviewKitPrepareParams,
  InterviewKitPrepareResult,
  InterviewKitData,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { type RawResume, type RawJob } from './utils/mappers';

export async function interview_kit_prepare(params: InterviewKitPrepareParams): Promise<InterviewKitPrepareResult> {
  try {
    const resumes: RawResume[] = loadData<RawResume[]>('resumes');
    const jobs: RawJob[] = loadData<RawJob[]>('jobs');

    const resume = resumes.find((r) => r.id === params.candidate_id);
    const job = jobs.find((j) => j.id === params.job_id);

    if (!resume) {
      return err(`未找到候选人 ${params.candidate_id}，无法准备面试包。请确认 ID 是否正确。`);
    }
    if (!job) {
      return err(`未找到岗位 ${params.job_id}，无法准备面试包。请确认 ID 是否正确。`);
    }

    const data: InterviewKitData = {
      candidate_name: resume.name,
      position: job.title,
      categories: [
        {
          category: '技术基础',
          questions: [
            {
              question: `请描述你在 ${resume.currentCompany} 负责的核心系统架构，以及你在其中的角色。`,
              difficulty: 'medium',
              purpose: '验证候选人自述工作经验的真实性，考察系统设计思维',
            },
            {
              question: resume.skills.length >= 2
                ? `在 ${resume.skills[0]} 和 ${resume.skills[1]} 的项目实战中，你遇到过最大的技术挑战是什么？怎么解决的？`
                : `在过往的项目中，你遇到过最大的技术挑战是什么？怎么解决的？`,
              difficulty: 'medium',
              purpose: '考察问题解决能力和技术深度',
            },
            {
              question: '如果让你从零设计一个高并发系统，你会考虑哪些核心要素？请用白板画一画架构图。',
              difficulty: 'hard',
              purpose: '考察系统设计能力和对分布式系统的理解',
            },
            {
              question: `针对 ${job.title} 这个岗位，你觉得你最匹配和最不匹配的点分别是什么？`,
              difficulty: 'easy',
              purpose: '考察自我认知和岗位理解',
            },
          ],
        },
        {
          category: '行为面试',
          questions: [
            {
              question: '请分享一个你主导的跨团队协作项目，遇到过分歧吗？如何推动达成共识？',
              difficulty: 'medium',
              purpose: '考察沟通协作能力和推动力',
            },
            {
              question: '描述一次项目上线后出现严重问题的经历。你是怎么处理的？学到了什么？',
              difficulty: 'medium',
              purpose: '考察抗压能力和复盘习惯',
            },
            {
              question: '你理想中的团队文化是什么样的？在之前的团队中，你做过什么来推动这种文化？',
              difficulty: 'easy',
              purpose: '考察文化契合度',
            },
          ],
        },
        {
          category: '岗位匹配',
          questions: [
            {
              question: `${job.title}这个岗位的核心挑战是 ${job.description.slice(0, 50)}…… 你认为你的哪些经验可以直接应对这些挑战？`,
              difficulty: 'medium',
              purpose: '考察岗位匹配度和业务理解',
            },
            {
              question: `如果你加入团队，入职前 90 天你的计划是什么？`,
              difficulty: 'medium',
              purpose: '考察规划能力和落地意识',
            },
          ],
        },
      ],
      interviewer_notes: [
        `候选人来自 ${resume.currentCompany}，${resume.experience}年经验，擅长 ${resume.skills.slice(0, 3).join('、')}`,
        `重点关注：${resume.careerHistory?.[0]?.highlights?.[0] ?? '过往项目经验'} — 深入追问技术细节和量化结果`,
        `注意考察：候选人是否具备 ${job.title} 所需的业务理解和推动力`,
        `薪资预期 ${resume.salary}，需在面试后与 HR 确认预算匹配度`,
      ].join('\n'),
    };

    return ok(data, '面试包已准备就绪，共包含技术基础、行为面试、岗位匹配三个模块，9 道题目。', 'demo');
  } catch (e) {
    return err('面试包暂时生成不了，但我可以先根据岗位要求给你几个方向性建议。');
  }
}
