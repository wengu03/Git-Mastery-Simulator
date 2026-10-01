'use client';

import { FormEvent, useMemo, useState } from 'react';
import { BookOpen, Cloud, Code2, FileCode2, GitBranch, Play, RotateCcw, Terminal, Wifi } from 'lucide-react';

type Commit = { id: string; message: string; parent?: string; lane: 'main' | 'feature' };
type Line = { kind: 'cmd' | 'ok' | 'info' | 'error'; text: string };
const initialCommits: Commit[] = [{ id: 'a1b2c3d', message: '初始化项目', lane: 'main' }, { id: 'd4e5f6a', message: '完成首页', parent: 'a1b2c3d', lane: 'main' }];
const lessons = [
  { no: '01', title: '保存第一次修改', hint: 'add · commit', done: true },
  { no: '02', title: '创建功能分支', hint: 'switch · branch', done: false },
  { no: '03', title: '连接远端仓库', hint: 'remote · push', done: false },
  { no: '04', title: '同步队友的代码', hint: 'fetch · pull', done: false },
];

export default function Home() {
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState<Line[]>([{ kind: 'info', text: '欢迎来到 Git 练习场。这里的一切都是模拟的，请放心操作。' }, { kind: 'info', text: '试试：git status' }]);
  const [commits, setCommits] = useState<Commit[]>(initialCommits);
  const [branch, setBranch] = useState('main');
  const [remoteHead, setRemoteHead] = useState('a1b2c3d');
  const [staged, setStaged] = useState(false);
  const [modified, setModified] = useState(true);
  const head = commits.at(-1)?.id ?? '—';
  const ahead = useMemo(() => head === remoteHead ? 0 : Math.max(0, commits.findIndex(c => c.id === head) - commits.findIndex(c => c.id === remoteHead)), [head, remoteHead, commits]);

  function reply(cmd: string): Line[] {
    const p = cmd.trim().split(/\s+/);
    if (cmd === 'git status') return [{ kind: 'info', text: staged ? '变更已暂存：src/App.tsx' : modified ? '尚未暂存：src/App.tsx' : '工作区干净，没有待提交的变更' }];
    if (cmd === 'git add .' || cmd === 'git add src/App.tsx') { setStaged(true); setModified(false); return [{ kind: 'ok', text: '✓ 已将 src/App.tsx 放入暂存区' }]; }
    if (p[0] === 'git' && p[1] === 'commit') {
      if (!staged) return [{ kind: 'error', text: '没有已暂存的修改。先试试 git add .' }];
      const message = cmd.match(/-m\s+["'](.+)["']/)?.[1] ?? '更新代码';
      const id = Math.random().toString(16).slice(2, 9);
      setCommits(c => [...c, { id, message, parent: c.at(-1)?.id, lane: branch === 'main' ? 'main' : 'feature' }]); setStaged(false);
      return [{ kind: 'ok', text: `[${branch} ${id}] ${message}` }];
    }
    if ((p[1] === 'switch' && p[2] === '-c') || (p[1] === 'checkout' && p[2] === '-b')) { const name = p[3]; if (!name) return [{ kind: 'error', text: '请提供分支名称，例如：git switch -c feature/login' }]; setBranch(name); return [{ kind: 'ok', text: `✓ 已创建并切换到分支 ${name}` }]; }
    if (p[1] === 'switch' || p[1] === 'checkout') { setBranch(p[2] || 'main'); return [{ kind: 'ok', text: `✓ 已切换到分支 ${p[2] || 'main'}` }]; }
    if (p[1] === 'branch') return [{ kind: 'info', text: `* ${branch}\n  main` }];
    if (p[1] === 'remote' && p[2] === 'add') return [{ kind: 'ok', text: `✓ 已添加远端 ${p[3] || 'origin'} → ${p[4] || 'https://example.com/team/demo.git'}` }];
    if (p[1] === 'push') { setRemoteHead(head); return [{ kind: 'ok', text: `✓ 推送成功：${branch} → origin/${branch}` }, { kind: 'info', text: '远端分支指针已经移动，请观察右侧橙色标签。' }]; }
    if (p[1] === 'fetch') return [{ kind: 'ok', text: '✓ 已获取 origin 的最新状态，本地文件不会改变' }];
    if (p[1] === 'pull') { setRemoteHead(head); return [{ kind: 'ok', text: '✓ 已拉取并合并 origin/main' }]; }
    if (p[1] === 'log') return commits.slice().reverse().map(c => ({ kind: 'info', text: `${c.id} ${c.message}` }));
    if (cmd === 'help' || cmd === '帮助') return [{ kind: 'info', text: '可用：status、add、commit、branch、switch、remote、push、fetch、pull、log' }];
    return [{ kind: 'error', text: `暂不支持“${cmd}”。输入 help 查看可用命令。` }];
  }
  function run(e: FormEvent) { e.preventDefault(); const cmd = command.trim(); if (!cmd) return; setLines(v => [...v, { kind: 'cmd', text: `$ ${cmd}` }, ...reply(cmd)]); setCommand(''); }
  function reset() { setCommits(initialCommits); setBranch('main'); setRemoteHead('a1b2c3d'); setStaged(false); setModified(true); setLines([{ kind: 'info', text: '练习场已重置。试试：git status' }]); }

  return <main className="min-h-screen bg-[#f6f2e9] text-[#19231e]">
    <header className="flex h-16 items-center justify-between border-b border-[#203b2c]/15 bg-[#fbf8f0] px-5 lg:px-8">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#153d2a] text-[#fff9e8]"><GitBranch size={20}/></span><div><b className="text-[17px]">Git 好好学</b><span className="ml-2 rounded-full bg-[#e8ead7] px-2 py-0.5 text-[10px] font-bold text-[#49604f]">练习版</span></div></div>
      <div className="hidden items-center gap-2 text-xs text-[#667269] sm:flex"><Wifi size={14} className="text-[#2c8d55]"/> 无需登录 · 数据仅保存在浏览器</div>
      <button onClick={reset} className="flex items-center gap-2 rounded-lg border border-[#203b2c]/20 bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f0eee6]"><RotateCcw size={14}/> 重置练习</button>
    </header>
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#203b2c]/15 bg-[#fbf8f0] p-5 xl:block">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#788078]">学习路径</p>
        <div className="space-y-2">{lessons.map((x, i) => <button key={x.no} className={`w-full rounded-xl border p-3 text-left ${i === 1 ? 'border-[#d18435] bg-[#fff5df] shadow-sm' : 'border-transparent hover:bg-[#f2efe6]'}`}><div className="flex gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${x.done ? 'bg-[#2d7049] text-white' : i === 1 ? 'bg-[#d18435] text-white' : 'bg-[#e8e7df] text-[#647168]'}`}>{x.done ? '✓' : x.no}</span><div><p className="text-sm font-semibold">{x.title}</p><p className="mt-1 font-mono text-[10px] text-[#7a817b]">{x.hint}</p></div></div></button>)}</div>
        <div className="mt-8 rounded-xl bg-[#153d2a] p-4 text-[#f9f1d6]"><BookOpen size={18}/><p className="mt-3 text-sm font-semibold">现在卡住了？</p><p className="mt-1 text-xs leading-5 text-[#cfddce]">输入 <code>help</code> 查看支持的命令。犯错也没关系，随时可以重置。</p></div>
      </aside>
      <section className="flex min-w-0 flex-col">
        <div className="border-b border-[#203b2c]/15 bg-[#fbf8f0] px-5 py-3 lg:px-6"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-bold">任务 02</span><span className="text-[#9a9e96]">/</span><span>创建功能分支并把修改推送到远端</span><span className="ml-auto rounded-full bg-[#e4efe4] px-2.5 py-1 font-semibold text-[#35704b]">自由练习模式</span></div></div>
        <div className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(360px,.86fr)_minmax(480px,1.14fr)] lg:p-4">
          <div className="grid min-h-[640px] grid-rows-[1fr_1.15fr] gap-3">
            <section className="overflow-hidden rounded-2xl border border-[#203b2c]/15 bg-[#fffdf7] shadow-[0_8px_24px_rgba(25,35,30,.06)]"><div className="panel-title"><span><FileCode2 size={15}/> 文件变化</span><span className="tag-yellow">1 个文件已修改</span></div><div className="grid h-[calc(100%-46px)] grid-cols-[130px_1fr]"><div className="border-r border-[#203b2c]/10 bg-[#f3f0e8] p-3 text-xs"><p className="mb-2 text-[10px] font-bold text-[#888f89]">项目文件</p><p className="rounded-md bg-white px-2 py-1.5 font-mono text-[#245e3e]">▾ src</p><p className="mt-1 px-4 font-mono">App.tsx <b className="text-[#cb792c]">M</b></p></div><pre className="overflow-auto p-4 font-mono text-xs leading-6"><span className="text-[#9a9f9a]">1</span>  export default function App() {'{'}{`\n`}<span className="text-[#9a9f9a]">2</span>  <mark className="bg-[#dff1df] text-[#23633e]">+ return &lt;h1&gt;你好，Git！&lt;/h1&gt;</mark>{`\n`}<span className="text-[#9a9f9a]">3</span>  {'}'}</pre></div></section>
            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#10271b] bg-[#10271b] shadow-[0_8px_28px_rgba(16,39,27,.18)]"><div className="flex h-11 items-center justify-between border-b border-white/10 px-4 text-[#dbe7db]"><span className="flex items-center gap-2 text-xs font-bold"><Terminal size={15}/> 命令行</span><span className="text-[10px] text-[#93a699]">~/我的项目 <b className="text-[#f0ad5d]">({branch})</b></span></div><div className="flex-1 overflow-auto p-4 font-mono text-xs leading-6">{lines.map((l, i) => <div key={i} className={l.kind === 'error' ? 'text-[#ff9b83]' : l.kind === 'ok' ? 'text-[#8de1a7]' : l.kind === 'cmd' ? 'mt-2 text-white' : 'whitespace-pre-line text-[#b7c6ba]'}>{l.text}</div>)}</div><form onSubmit={run} className="flex items-center border-t border-white/10 bg-[#0c2015] px-4"><span className="font-mono text-sm text-[#f0ad5d]">$</span><input value={command} onChange={e => setCommand(e.target.value)} aria-label="Git 命令" placeholder="输入 git 命令，例如 git status" className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-white outline-none placeholder:text-[#698071]"/><button aria-label="运行命令" className="rounded-lg bg-[#e9a44f] p-2 text-[#173522] hover:bg-[#f4b560]"><Play size={14} fill="currentColor"/></button></form></section>
          </div>
          <section className="min-h-[640px] overflow-hidden rounded-2xl border border-[#203b2c]/15 bg-[#fffdf7] shadow-[0_8px_24px_rgba(25,35,30,.06)]"><div className="panel-title"><span><GitBranch size={15}/> 仓库时间线</span><div className="flex gap-2"><span className="tag-green">本地 {branch}</span><span className="tag-orange">远端 origin/{branch}</span></div></div><div className="border-b border-[#203b2c]/10 bg-[#f8f5ed] px-5 py-3"><div className="flex items-center gap-3 text-xs"><span className="state-dot bg-[#d89949]"/><span>本地比远端领先 <b>{ahead}</b> 个提交</span><span className="ml-auto text-[#768078]">运行 <code className="rounded bg-[#e9e6dd] px-1.5 py-1">git push</code> 同步</span></div></div><div className="relative p-6 lg:p-8"><div className="absolute bottom-8 left-[51px] top-8 w-px bg-[#bdd0c0]"/><div className="absolute bottom-8 left-[83px] top-28 w-px bg-[#e1b77f]"/>{commits.slice().reverse().map((c, i) => { const isHead = c.id === head, isRemote = c.id === remoteHead; return <div key={c.id} className="relative mb-8 flex min-h-14 items-start gap-5"><div className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-[4px] border-[#fffdf7] ring-2 ${c.lane === 'feature' ? 'ml-8 bg-[#d99243] ring-[#d99243]' : 'bg-[#3e7953] ring-[#3e7953]'}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2">{isHead && <span className="branch-label local">HEAD → {branch}</span>}{isRemote && <span className="branch-label remote"><Cloud size={11}/> origin/{branch}</span>}</div><p className="mt-2 font-semibold">{c.message}</p><p className="mt-1 font-mono text-[11px] text-[#879087]">{c.id} · {i === 0 ? '刚刚' : `${i + 1} 步之前`}</p></div></div>})}</div><div className="mx-5 mb-5 rounded-xl border border-dashed border-[#d4b17b] bg-[#fff8e9] p-4 text-xs leading-5 text-[#6f552f]"><b>看图提示：</b>绿色代表本地分支，橙色代表远端跟踪分支。它们只是指向某次提交的“路标”，运行 push 后远端路标会前进。</div></section>
        </div>
        <footer className="flex items-center gap-4 border-t border-[#203b2c]/15 bg-[#fbf8f0] px-6 py-2 text-[10px] text-[#7c857e]"><Code2 size={13}/><span>所有操作均在浏览器内模拟，不会修改真实文件</span><span className="ml-auto">支持键盘 Enter 执行</span></footer>
      </section>
    </div>
  </main>;
}
