import { Sidebar } from '@/components/layout/Sidebar';
import { ChatView } from '@/components/chat/ChatView';
import { TopNav } from '@/components/layout/TopNav';
import { CardStorybook } from '@/dev/CardStorybook';

function App() {
  // Hash 路由：/dev/cards → Card Storybook
  if (window.location.hash === '#/dev/cards') {
    return <CardStorybook />;
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 min-h-0 relative">
          <ChatView />
        </main>
      </div>
    </div>
  );
}

export default App;
