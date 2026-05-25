import { useState, useEffect } from 'react';
import { Bot, User, Users, Briefcase, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { ModelConfigPanel } from '@/components/ModelConfigPanel';
import type { ModelConfig } from '@/model';

const roles: { id: UserRole; label: string; icon: typeof User }[] = [
  { id: 'hm', label: '用人经理', icon: Briefcase },
  { id: 'hr', label: '招聘HR', icon: Users },
  { id: 'candidate', label: '候选人', icon: User },
];

export function TopNav() {
  const { role, setRole } = useUserStore();
  const { clearMessages } = useChatStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [isUsingModel, setIsUsingModel] = useState(false);

  useEffect(() => {
    const checkModelStatus = () => {
      const usingModel = (window as any).__isUsingModel?.() || false;
      const config = (window as any).__getModelConfig?.();
      setIsUsingModel(usingModel);
      setModelConfig(config);
    };
    const timer = setInterval(checkModelStatus, 1000);
    checkModelStatus();
    return () => clearInterval(timer);
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole !== role) {
      setRole(newRole);
      clearMessages();
    }
    setShowRoleMenu(false);
  };

  const handleModelConfigChange = (config: ModelConfig | null) => {
    setModelConfig(config);
    (window as any).__setModelConfig?.(config);
  };

  const currentRole = roles.find(r => r.id === role);
  const CurrentIcon = currentRole?.icon || User;

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-neutral-100 tracking-tight">HireAgent</span>
        {isUsingModel && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full font-medium border border-emerald-500/20">
            AI
          </span>
        )}
      </div>

      {/* Center: Role Switcher */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors text-sm"
          >
            <CurrentIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-300">{currentRole?.label}</span>
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-neutral-500 transition-transform',
              showRoleMenu && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {showRoleMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden z-50 min-w-[160px]"
                >
                  {roles.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleRoleChange(r.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-sm',
                          role === r.id
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'text-neutral-300 hover:bg-neutral-800'
                        )}
                      >
                        <Icon className={cn(
                          'w-4 h-4',
                          role === r.id ? 'text-amber-400' : 'text-neutral-500'
                        )} />
                        {r.label}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Model Config */}
      <div className="flex items-center gap-2">
        <ModelConfigPanel
          currentConfig={modelConfig}
          onConfigChange={handleModelConfigChange}
          isUsingModel={isUsingModel}
        />
      </div>
    </header>
  );
}
