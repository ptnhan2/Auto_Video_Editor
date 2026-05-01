import Link from 'next/link';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-slate-50">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold tracking-tight hover:text-indigo-400 transition-colors">
            Auto Video Editor
          </Link>
          <span className="text-zinc-600">/</span>
          <Link href="/tools" className="font-medium text-zinc-300 hover:text-white transition-colors">
            Human-in-the-loop Tools
          </Link>
        </div>
        <nav className="ml-auto flex items-center gap-6 text-sm font-medium">
          <Link href="/tools/action-previewer" className="text-zinc-400 hover:text-white transition-colors">
            Action Preview
          </Link>
          <Link href="/tools/cinematic-editor" className="text-zinc-400 hover:text-white transition-colors">
            Cinematic Test
          </Link>
          <Link href="/tools/json-override" className="text-zinc-400 hover:text-white transition-colors">
            JSON Override
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
