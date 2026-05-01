import Link from 'next/link';

export default function ToolsDashboard() {
  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Trạm kiểm duyệt (Human-in-the-loop)</h1>
        <p className="text-zinc-400">
          Bộ công cụ dành cho biên tập viên để kiểm tra và ghi đè dữ liệu trước khi xuất video (Trạm 8).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/tools/action-previewer" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300">Action Previewer</h2>
          <p className="text-sm text-zinc-400">
            Xem trước Character, Action và Expression real-time. Giúp kiểm tra chéo asset IDs.
          </p>
        </Link>

        <Link href="/tools/cinematic-editor" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-300">Cinematic Tester</h2>
          <p className="text-sm text-zinc-400">
            Kiểm tra các hiệu ứng Overlay (Film Grain, Split Screen) trực tiếp trên Background.
          </p>
        </Link>

        <Link href="/tools/json-override" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300">JSON Override</h2>
          <p className="text-sm text-zinc-400">
            Tải lên kịch bản `compiled_{'{'}ep{'}'}.json` để ghi đè mọi thông số bị AI nhận diện sai.
          </p>
        </Link>
      </div>
    </div>
  );
}
