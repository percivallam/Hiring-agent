import { useState, useEffect } from 'react';
import { Settings, X, Check, AlertCircle, Key, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ModelProvider, ModelConfig } from '@/model';

interface ModelConfigPanelProps {
  currentConfig?: ModelConfig | null;
  onConfigChange: (config: ModelConfig | null) => void;
  isUsingModel: boolean;
}

const PROVIDERS: { id: ModelProvider; name: string; models: string[]; hint: string }[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4.5-preview', 'gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1', 'o1-mini', 'gpt-4-turbo'],
    hint: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    models: [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ],
    hint: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'moonshot',
    name: 'Moonshot (月之暗面)',
    models: ['kimi-latest', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    hint: 'https://platform.moonshot.cn/console/api-keys'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
    hint: 'https://platform.deepseek.com/api_keys'
  }
];

export function ModelConfigPanel({ currentConfig, onConfigChange, isUsingModel }: ModelConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<ModelProvider>(currentConfig?.provider || 'openai');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [model, setModel] = useState(currentConfig?.model || PROVIDERS[0].models[0]);
  const [baseUrl, setBaseUrl] = useState(currentConfig?.baseUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (isOpen && currentConfig) {
      setProvider(currentConfig.provider);
      setApiKey(currentConfig.apiKey);
      setModel(currentConfig.model);
      setBaseUrl(currentConfig.baseUrl || '');
    }
  }, [isOpen, currentConfig]);

  useEffect(() => {
    const providerInfo = PROVIDERS.find(p => p.id === provider);
    if (providerInfo && !providerInfo.models.includes(model)) {
      setModel(providerInfo.models[0]);
    }
  }, [provider]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      onConfigChange(null);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    const config: ModelConfig = {
      provider,
      apiKey: apiKey.trim(),
      model,
      baseUrl: baseUrl.trim() || undefined,
      temperature: 0.7,
      maxTokens: 2000
    };

    try {
      const { createModelClient } = await import('@/model');
      const client = createModelClient(config);
      await client.chat([
        { role: 'system', content: '你是一个助手' },
        { role: 'user', content: 'Hi' }
      ]);

      setTestResult('success');
      setTimeout(() => {
        onConfigChange(config);
        setIsOpen(false);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('API 测试失败:', error);
      setTestResult('error');
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    onConfigChange(null);
    setIsOpen(false);
  };

  const selectedProvider = PROVIDERS.find(p => p.id === provider);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
          isUsingModel
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300'
        )}
      >
        {isUsingModel ? <Cpu className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
        {isUsingModel ? 'AI 模式' : 'Mock'}
        <Settings className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-neutral-900 rounded-2xl shadow-2xl z-50 p-6 border border-neutral-800"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-100">模型配置</h2>
                  <p className="text-sm text-neutral-500 mt-1">配置 API Key 以启用智能模型</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">选择模型提供商</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setProvider(p.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors border',
                          provider === p.id
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                            : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 bg-neutral-900'
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">选择模型</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={selectedProvider?.models[0] || '输入模型名称'}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 placeholder:text-neutral-700"
                  />
                  <p className="text-xs text-neutral-600 mt-1">
                    常用：ark-code-latest / doubao-lite-4k / doubao-pro-4k / gpt-4o
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    API Key
                    <span className="text-xs text-neutral-600 ml-2">{selectedProvider?.hint}</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full pl-10 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 placeholder:text-neutral-700"
                    />
                  </div>
                  <p className="text-xs text-neutral-600 mt-1.5">
                    API Key 仅存储在本地浏览器中，不会发送到任何服务器
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    自定义 API 地址（可选）
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 placeholder:text-neutral-700"
                  />
                </div>

                {testResult && (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    testResult === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  )}>
                    {testResult === 'success' ? (
                      <><Check className="w-4 h-4" /> API 连接成功！</>
                    ) : (
                      <><AlertCircle className="w-4 h-4" /> API 连接失败，请检查 Key 是否正确</>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors',
                      isLoading ? 'bg-neutral-700' : 'bg-amber-600 hover:bg-amber-500'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <><Check className="w-4 h-4" /> 保存并测试</>
                    )}
                  </button>
                  {currentConfig && (
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 border border-neutral-800 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
