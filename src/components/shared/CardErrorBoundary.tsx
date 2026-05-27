import { Component } from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 text-sm text-neutral-400">
          <p>卡片渲染出错，请重试或换个问法。</p>
          <p className="text-xs text-neutral-600 mt-1">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
