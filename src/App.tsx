import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      <Dashboard />
    </div>
  );
}

