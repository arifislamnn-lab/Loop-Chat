/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeProvider } from './components/ThemeProvider';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-500/30">
        <Header />
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
          <ChatInterface />
        </main>
      </div>
    </ThemeProvider>
  );
}
