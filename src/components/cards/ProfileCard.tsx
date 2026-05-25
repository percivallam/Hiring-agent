import { motion } from 'framer-motion';
import { MapPin, Github, BookOpen, Linkedin, Briefcase, GraduationCap, Wrench, FileText, Send, Bookmark, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProfileData } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { TagGroup } from '@/components/shared/TagGroup';

interface ProfileCardProps {
  data: ProfileData;
  actions?: ('view_resume' | 'reach_out' | 'save' | 'track')[];
  onActionClick?: (action: string) => void;
  className?: string;
}

export function ProfileCard({ data, actions = [], onActionClick, className }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-start gap-3">
          <Avatar name={data.name} src={data.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-100 text-lg">{data.name}</h3>
            <p className="text-sm text-neutral-400">{data.currentCompany} · {data.currentTitle}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-500">
              {data.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{data.location}</span>}
              {data.education && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{data.education}</span>}
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{data.experience}年经验</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-300">技能</span>
        </div>
        <TagGroup tags={data.skills} size="sm" />
      </div>

      {/* Career History */}
      {data.careerHistory && data.careerHistory.length > 0 && (
        <div className="px-4 py-3 border-b border-neutral-800">
          <h4 className="text-sm font-medium text-neutral-300 mb-2">职业经历</h4>
          <div className="space-y-3">
            {data.careerHistory.map((job, idx) => (
              <div key={idx} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">{job.company}</span>
                  <span className="text-xs text-neutral-500">{job.period}</span>
                </div>
                <p className="text-neutral-400">{job.title}</p>
                {job.highlights.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {job.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="text-xs text-neutral-500">· {h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Online Presence */}
      {data.onlinePresence && (
        <div className="px-4 py-3 border-b border-neutral-800">
          <h4 className="text-sm font-medium text-neutral-300 mb-2">在线信息</h4>
          <div className="flex flex-wrap gap-3">
            {data.onlinePresence.github && (
              <a href={`https://${data.onlinePresence.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {data.onlinePresence.blog && (
              <a href={`https://${data.onlinePresence.blog}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300">
                <BookOpen className="w-3.5 h-3.5" /> 博客
              </a>
            )}
            {data.onlinePresence.linkedin && (
              <a href={`https://${data.onlinePresence.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {data.notes && data.notes.length > 0 && (
        <div className="px-4 py-3 border-b border-neutral-800">
          <h4 className="text-sm font-medium text-neutral-300 mb-2">备注</h4>
          <ul className="space-y-1">
            {data.notes.map((note, idx) => (
              <li key={idx} className="text-xs text-neutral-500">· {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="px-4 py-3 bg-neutral-900 flex gap-2">
          {actions.includes('view_resume') && (
            <button onClick={() => onActionClick?.('view_resume')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors">
              <FileText className="w-4 h-4" /> 查看简历
            </button>
          )}
          {actions.includes('reach_out') && (
            <button onClick={() => onActionClick?.('reach_out')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors">
              <Send className="w-4 h-4" /> 触达
            </button>
          )}
          {actions.includes('save') && (
            <button onClick={() => onActionClick?.('save')} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800 border border-neutral-700 text-neutral-500 hover:bg-neutral-700 transition-colors">
              <Bookmark className="w-4 h-4" />
            </button>
          )}
          {actions.includes('track') && (
            <button onClick={() => onActionClick?.('track')} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800 border border-neutral-700 text-neutral-500 hover:bg-neutral-700 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
