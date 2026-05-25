import { Component } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatView } from '@/components/chat/ChatView';
import { TopNav } from '@/components/layout/TopNav';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { err: Error | null }> {
  constructor(p: any) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e: Error) { return { err: e }; }
  render() {
    if (this.state.err) return <div style={{color:'#f44',padding:40,background:'#111',height:'100vh',fontFamily:'monospace',overflow:'auto'}}><h1>React Error</h1><pre>{this.state.err.message}</pre><pre style={{fontSize:12}}>{this.state.err.stack}</pre></div>;
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 min-h-0 relative">
            <ChatView />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
