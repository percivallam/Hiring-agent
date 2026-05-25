import { motion } from 'framer-motion';
import { Calendar, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleCardMessage } from '@/types';

interface ScheduleCardProps {
  candidateName: string;
  position: string;
  suggestedSlots: ScheduleCardMessage['suggestedSlots'];
  notes?: string;
  className?: string;
}

export function ScheduleCard({
  candidateName,
  position,
  suggestedSlots,
  notes,
  className
}: ScheduleCardProps) {
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
        <h3 className="font-semibold text-neutral-100">面试排程</h3>
        <p className="text-xs text-neutral-500 mt-1">{candidateName} · {position}</p>
      </div>

      <div className="divide-y divide-neutral-800">
        {suggestedSlots.map((slot, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={cn(
              'p-4 flex items-center gap-3',
              !slot.available && 'opacity-50'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              slot.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-600'
            )}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-200">{slot.date}</span>
                <span className="text-xs text-neutral-500 flex items-center gap-1"><Clock className="w-3 h-3" />{slot.time}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-500 flex items-center gap-1"><User className="w-3 h-3" />{slot.interviewer}</span>
                <span className="text-xs text-neutral-500">· {slot.type}</span>
              </div>
            </div>
            {slot.available ? (
              <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">可预约</span>
            ) : (
              <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-800 text-neutral-500 border border-neutral-700">已满</span>
            )}
          </motion.div>
        ))}
      </div>

      {notes && (
        <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
          <p className="text-xs text-neutral-500">📝 {notes}</p>
        </div>
      )}
    </motion.div>
  );
}
