import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        {/* Subtle grid background overlay */}
        <div className="absolute inset-0 bg-zinc-950/90 [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        
        <div className="relative h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  );
}

