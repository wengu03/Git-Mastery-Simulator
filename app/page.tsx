'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Cloud, Code2, FileCode2, GitBranch, Play, RotateCcw, Terminal } from 'lucide-react';

type Commit = { id: string; message: string; branch: string; parent?: string; mergeParent?: string; content: string };
type Branch = { head: string; content: string };
type Line = { kind: 'cmd' | 'ok' | 'info' | 'error'; text: string };

const firstCode = `export default function App() {
  return <h1>你好，Git！</h1>;
}`;
const firstCommits: Commit[] = [
  { id: 'a1b2c3d', message: '初始化项目', branch: 'main', content: 'export default function App() {}' },
  { id: 'd4e5f6a', message: '完成首页', branch: 'main', parent: 'a1b2c3d', content: firstCode },
];

function shortId() { return Math.random().toString(16).slice(2, 9); }

export default function Home() {
  const [commits, setCommits] = useState(firstCommits);
  const [branches, setBranches] = useState<Record<string, Branch>>({ main: { head: 'd4e5f6a', content: firstCode } });
  const [current, setCurrent] = useState('main');
  const [code, setCode] = useState(firstCode);
  const [staged, setStaged] = useState(false);
  const [remoteHeads, setRemoteHeads] = useState<Record<string, string>>({ main: 'a1b2c3d' });
  const [command, setCommand] = useState('');
  const [conflict, setConflict] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { kind: 'info', text: '这是安全的模拟环境。编辑右上方代码，然后试试 git status。' },
    { kind: 'info', text: '提示：git switch -c feature/login' },
  ]);
  const outputRef = useRef<HTMLDivElement>(null);
  const savedCode = branches[current]?.content ?? '';
  const dirty = code !== savedCode;

  useEffect(() => { outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' }); }, [lines]);

  function out(kind: Line['kind'], text: string): Line { return { kind, text }; }
  function switchTo(name: string): Line[] {
    const target = branches[name];
    if (!target) return [out('error', `分支 ${name} 不存在。用 git branch 查看分支。`)];
    if (dirty || staged) return [out('error', '当前代码尚未提交。请先提交或恢复后再切换分支。')];
    setCurrent(name); setCode(target.content); setStaged(false); setConflict(false);
    return [out('ok', `✓ 已切换到 ${name}，编辑器已载入该分支的代码`)];
  }

  function execute(cmd: string): Line[] {
    const p = cmd.trim().match(/(?:[^\s"']+|["'][^"']*["'])+/g) ?? [];
    if (cmd === 'git status') return [out('info', conflict ? '存在合并冲突：请编辑冲突标记，然后 git add .' : staged ? '已暂存：src/App.tsx' : dirty ? '未暂存：src/App.tsx' : '工作区干净')];
    if (p[0] === 'git' && p[1] === 'add') { if (!dirty && !conflict) return [out('info', '没有需要暂存的修改')]; setStaged(true); return [out('ok', '✓ src/App.tsx 已进入暂存区')]; }
    if (p[0] === 'git' && p[1] === 'commit') {
      if (!staged) return [out('error', '暂存区为空。先运行 git add .')];
      if (code.includes('<<<<<<<') || code.includes('>>>>>>>')) return [out('error', '代码中仍有冲突标记，请先解决冲突')];
      const id = shortId(); const message = cmd.match(/-m\s+["'](.+)["']/)?.[1] ?? '更新代码'; const previous = branches[current].head;
      setCommits(v => [...v, { id, message, branch: current, parent: previous, content: code }]);
      setBranches(v => ({ ...v, [current]: { head: id, content: code } })); setStaged(false); setConflict(false);
      return [out('ok', `[${current} ${id}] ${message}`), out('info', '提交已保存当前分支的代码快照')];
    }
    if (p[1] === 'switch' && p[2] === '-c') {
      const name = p[3]; if (!name) return [out('error', '用法：git switch -c <分支名>')]; if (branches[name]) return [out('error', `分支 ${name} 已存在`)];
      setBranches(v => ({ ...v, [name]: { head: v[current].head, content: code } })); setCurrent(name); setStaged(false);
      return [out('ok', `✓ 从 ${current} 创建并切换到 ${name}`)];
    }
    if (p[1] === 'switch' || p[1] === 'checkout') return switchTo(p[p[1] === 'checkout' && p[2] === '-b' ? 3 : 2] || '');
    if (p[1] === 'branch') return Object.keys(branches).map(name => out('info', `${name === current ? '*' : ' '} ${name}  ${branches[name].head}`));
    if (p[1] === 'merge') {
      const sourceName = p[2]; const source = branches[sourceName]; if (!source) return [out('error', `分支 ${sourceName} 不存在`)];
      if (source.content === code) return [out('info', 'Already up to date.')];
      const common = commits.find(c => c.id === source.head)?.parent; const currentChanged = branches[current].head !== common;
      if (currentChanged) { const merged = `<<<<<<< ${current}\n${code}\n=======\n${source.content}\n>>>>>>> ${sourceName}`; setCode(merged); setConflict(true); setStaged(false); return [out('error', 'CONFLICT：src/App.tsx 内容冲突'), out('info', '请在编辑器里保留正确代码并删除冲突标记，然后 add、commit')]; }
      const id = shortId(); setCode(source.content); setCommits(v => [...v, { id, message: `合并 ${sourceName}`, branch: current, parent: branches[current].head, mergeParent: source.head, content: source.content }]); setBranches(v => ({ ...v, [current]: { head: id, content: source.content } }));
      return [out('ok', `✓ 已将 ${sourceName} 合并到 ${current}`)];
    }
    if (p[1] === 'push') { setRemoteHeads(v => ({ ...v, [current]: branches[current].head })); return [out('ok', `✓ ${current} → origin/${current}`)]; }
    if (p[1] === 'fetch') return [out('ok', '✓ 已更新远端跟踪分支，工作区未改变')];
    if (p[1] === 'pull') return [out('info', '当前模拟仓库没有新的远端提交')];
    if (p[1] === 'log') return commits.slice().reverse().map(c => out('info', `${c.id}  ${c.message}  (${c.branch})`));
    if (cmd === 'help' || cmd === '帮助') return [out('info', 'status · add · commit · branch · switch · merge · log · push · fetch · pull')];
    return [out('error', `暂不支持“${cmd}”。输入 help 查看命令。`)];
  }

  function run(e: FormEvent) { e.preventDefault(); const cmd = command.trim(); if (!cmd) return; setLines(v => [...v, out('cmd', `$ ${cmd}`), ...execute(cmd)]); setCommand(''); }
  function reset() { setCommits(firstCommits); setBranches({ main: { head: 'd4e5f6a', content: firstCode } }); setCurrent('main'); setCode(firstCode); setStaged(false); setConflict(false); setRemoteHeads({ main: 'a1b2c3d' }); setLines([out('info', '练习场已重置。')]); }

  const visible = commits.slice().reverse();
  return <main className="h-screen overflow-hidden bg-[#f3efe5] text-[#18251e]">
    <header className="flex h-14 items-center justify-between border-b border-[#1d3d2b]/15 bg-[#fbf8f0] px-4 lg:px-6">
      <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#173e2b] text-white"><GitBranch size={18}/></span><b>Git 好好学</b><span className="rounded-full bg-[#e5eadc] px-2 py-1 text-[10px] font-bold text-[#52705c]">可编辑实验室</span></div>
      <div className="text-xs text-[#657168]">当前分支：<b className="rounded bg-[#dcebdd] px-2 py-1 font-mono text-[#27613f]">{current}</b></div>
      <button onClick={reset} className="flex items-center gap-2 rounded-lg border border-[#1d3d2b]/20 bg-white px-3 py-2 text-xs font-semibold"><RotateCcw size={13}/>重置</button>
    </header>

    <div className="grid h-[calc(100vh-56px)] min-h-0 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(340px,40%)_minmax(0,60%)]">
      <section className="flex min-h-[360px] flex-col overflow-hidden rounded-2xl bg-[#0d2417] shadow-[0_14px_32px_rgba(13,36,23,.18)]">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4 text-[#dae7db]"><span className="flex items-center gap-2 text-xs font-bold"><Terminal size={15}/>命令行</span><span className="font-mono text-[10px] text-[#8ca092]">~/git-lab ({current})</span></div>
        <div ref={outputRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 font-mono text-xs leading-6">
          {lines.map((l, i) => <div key={i} className={l.kind === 'error' ? 'text-[#ff9a83]' : l.kind === 'ok' ? 'text-[#82dda2]' : l.kind === 'cmd' ? 'mt-2 text-white' : 'whitespace-pre-line text-[#aec1b2]'}>{l.text}</div>)}
        </div>
        <div className="shrink-0 border-t border-white/10 bg-[#091c11] p-3">
          <form onSubmit={run} className="flex items-center rounded-xl border border-white/10 bg-white/[.04] px-3"><span className="font-mono text-sm text-[#eea74f]">$</span><input value={command} onChange={e => setCommand(e.target.value)} aria-label="Git 命令" placeholder="输入 git 命令…" className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-white outline-none placeholder:text-[#5f7767]"/><button className="rounded-lg bg-[#eca44d] p-2 text-[#173522]"><Play size={14} fill="currentColor"/></button></form>
          <p className="mt-2 text-[10px] text-[#718678]">输出区高度固定，历史命令会自动向上滚动</p>
        </div>
      </section>

      <div className="grid min-h-[680px] grid-rows-[minmax(300px,1fr)_minmax(300px,1fr)] gap-3 lg:min-h-0">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1d3d2b]/15 bg-[#fffdf7] shadow-sm">
          <div className="panel-title shrink-0"><span><FileCode2 size={15}/>代码编辑器</span><div className="flex items-center gap-2"><span className="text-[10px] text-[#788179]">分支 {current}</span><span className={conflict ? 'tag-red' : staged ? 'tag-green' : dirty ? 'tag-yellow' : 'tag-muted'}>{conflict ? '冲突待解决' : staged ? '已暂存' : dirty ? '未提交修改' : '代码已同步'}</span></div></div>
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#1d3d2b]/10 bg-[#f5f2e9] px-4"><span className="flex items-center gap-2 font-mono text-[11px]"><Code2 size={13}/>src/App.tsx</span><span className="text-[10px] text-[#7d857f]">可直接编辑</span></div>
          <textarea value={code} onChange={e => { setCode(e.target.value); setStaged(false); }} spellCheck={false} aria-label={`${current} 分支代码编辑器`} className="min-h-0 flex-1 resize-none bg-[#fffdf7] p-5 font-mono text-[13px] leading-6 text-[#23342a] outline-none"/>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1d3d2b]/15 bg-[#fffdf7] shadow-sm">
          <div className="panel-title shrink-0"><span><GitBranch size={15}/>分支与提交树</span><div className="flex gap-2"><span className="tag-green">本地</span><span className="tag-orange">origin</span></div></div>
          <div className="grid min-h-0 flex-1 grid-cols-[150px_minmax(0,1fr)] overflow-hidden">
            <aside className="overflow-y-auto border-r border-[#1d3d2b]/10 bg-[#f6f3ea] p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#7f877f]">分支</p>{Object.entries(branches).map(([name, b]) => <button key={name} onClick={() => { if (name !== current) setLines(v => [...v, out('cmd', `$ git switch ${name}`), ...switchTo(name)]); }} className={`mb-1 w-full rounded-lg px-2 py-2 text-left font-mono text-[11px] ${name === current ? 'bg-[#dcebdd] font-bold text-[#27613f]' : 'hover:bg-white'}`}><span className="mr-1">{name === current ? '●' : '○'}</span>{name}<small className="mt-1 block pl-4 text-[9px] opacity-60">{b.head}</small></button>)}</aside>
            <div className="relative overflow-y-auto p-5"><div className="absolute bottom-5 left-[30px] top-5 w-px bg-[#b8ceb9]"/>{visible.map((c, i) => { const heads = Object.entries(branches).filter(([, b]) => b.head === c.id).map(([n]) => n); const remotes = Object.entries(remoteHeads).filter(([, id]) => id === c.id).map(([n]) => n); return <div key={c.id} className="relative mb-5 flex gap-4"><span className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-[4px] border-[#fffdf7] ring-2 ${c.branch === 'main' ? 'bg-[#377550] ring-[#377550]' : 'bg-[#d68b38] ring-[#d68b38]'}`}/><div className="min-w-0"><div className="flex flex-wrap gap-1">{heads.map(n => <span key={n} className="branch-label local">{n === current ? `HEAD → ${n}` : n}</span>)}{remotes.map(n => <span key={n} className="branch-label remote"><Cloud size={10}/>origin/{n}</span>)}</div><p className="mt-1 text-xs font-semibold">{c.message}</p><p className="font-mono text-[10px] text-[#89918b]">{c.id} · {c.branch}{c.mergeParent ? ' · merge' : ''}</p></div></div>})}</div>
          </div>
        </section>
      </div>
    </div>
  </main>;
}
