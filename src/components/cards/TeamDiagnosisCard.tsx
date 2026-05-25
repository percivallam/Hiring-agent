import { motion } from 'framer-motion';
import { Users, Wrench, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamDiagnosisMessage } from '@/types';

interface TeamDiagnosisCardProps {
  teamName: string;
  members: TeamDiagnosisMessage['members'];
  gaps: TeamDiagnosisMessage['gaps'];
  recommendations: string[];
  afterHireSimulation?: TeamDiagnosisMessage['afterHireSimulation'];
  className?: string;
}

export function TeamDiagnosisCard({
  teamName,
  members,
  gaps,
  recommendations,
  afterHireSimulation,
  className
}: TeamDiagnosisCardProps) {
  const urgencyConfig = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden',
        className
      )}
    >
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold text-neutral-100">{teamName} - 能力诊断</h3>
      </div>

      {/* Members */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-300">团队成员</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m, idx) => (
            <div key={idx} className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700">
              <span className="text-xs font-medium text-neutral-200">{m.name}</span>
              <span className="text-xs text-neutral-500 ml-1">{m.role} · {m.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-300">能力缺口</span>
        </div>
        <div className="space-y-3">
          {gaps.map((gap, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', urgencyConfig[gap.urgency])}>
                  {gap.urgency === 'high' ? '紧急' : gap.urgency === 'medium' ? '重要' : '一般'}
                </span>
                <span className="text-sm font-medium text-neutral-300">{gap.skill}</span>
              </div>
              <p className="text-xs text-neutral-500">{gap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* After Hire Simulation */}
      {afterHireSimulation && (
        <div className="p-4 border-b border-neutral-800 bg-emerald-500/5">
          <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            招聘「{afterHireSimulation.candidateName}」后预测
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-emerald-400 mb-1">✅ 补强能力</p>
              <div className="flex flex-wrap gap-1">
                {afterHireSimulation.improvedSkills.map((s, i) => (
                  <span key={i} className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-amber-400 mb-1">⚠️ 剩余缺口</p>
              <div className="flex flex-wrap gap-1">
                {afterHireSimulation.newGaps.map((s, i) => (
                  <span key={i} className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="p-4 bg-neutral-800/30">
        <h4 className="text-sm font-medium text-neutral-300 mb-2">招聘建议</h4>
        <ul className="space-y-1.5">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="text-xs text-neutral-400">· {rec}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
