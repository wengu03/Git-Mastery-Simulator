'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Cloud, Code2, FileCode2, GitBranch, Play, RotateCcw, Terminal, UserPlus } from 'lucide-react';

type Commit = { id: string; message: string; branch: string; parent?: string; mergeParent?: string; content: string };
type Branch = { head: string; content: string };
type Line = { kind: 'cmd' | 'ok' | 'info' | 'error'; text: string };
type Lesson = { title: string; goal: string; steps: { command: string; watch: string }[] };
type Stage = { title: string; subtitle: string; lessons: Lesson[] };

const commandHelp: Record<string, string> = {
  'git status': '读取当前工作区和暂存区，不修改任何内容。重点确认文件处于“未修改、未暂存、已暂存”中的哪一种状态。',
  'git diff': '比较当前工作区与当前分支最近一次提交，只显示尚未放入暂存区的代码变化。',
  'git add .': '把当前项目的修改从工作区复制到暂存区，为下一次提交选择内容；它还没有产生提交。',
  'git commit -m "完成第一次修改"': '把暂存区保存为当前分支 main 上的新提交，main 与 HEAD 会一起移动到新节点。',
  'git commit -m "完善首页"': '把暂存内容提交到当前 feature/home 分支，不会影响 main 分支。',
  'git commit -m "解决合并冲突"': '把人工解决后的文件保存为新提交，记录这次冲突解决的最终结果。',
  'git log': '从当前分支的 HEAD 开始查看提交历史，不会改变分支、文件或暂存区。',
  'git branch yhx': '从当前 HEAD 创建 yhx 指针，但仍停留在原分支；右下应新增 yhx，HEAD 不移动。',
  'git switch yhx': '把 HEAD 从当前分支切换到 yhx，并把工作区代码替换为 yhx 最近一次提交的快照。',
  'git switch -c feature/home': '从当前提交创建 feature/home，并立刻把 HEAD 切换到这个新分支。',
  'git switch main': '把 HEAD 切回 main，并把编辑器恢复为 main 分支自己的代码快照。',
  'git merge main': '把 main 分支的提交合入当前分支；目标永远是当前分支，来源是 main。',
  'git merge feature/home': '当前应位于 main：把 feature/home 的提交合入 main，来源是 feature/home，目标是 main。',
  'git merge origin/main': '把上一次 fetch 得到的 origin/main 合入当前本地分支；不会直接修改远端服务器。',
  'git restore src/App.tsx': '丢弃 src/App.tsx 尚未提交的编辑，恢复为当前分支最近一次提交中的内容。',
  'git fetch': '从真实远端下载最新提交并更新 origin/* 跟踪指针；当前本地分支和工作区代码保持不变。',
  'git pull': '先 fetch 当前远端分支，再把 origin/当前分支合入本地当前分支，相当于两个步骤的组合。',
  'git push': '把本地当前分支的新提交上传到同名远端分支；若远端领先，本次推送会被拒绝。',
};

const curriculum: Stage[] = [
  { title: '第一阶段 · 入门', subtitle: '认识 Git 与核心指令', lessons: [
    { title: '01 观察仓库状态', goal: '先学会问 Git：现在发生了什么？', steps: [{ command: 'git status', watch: '看终端如何区分工作区、暂存区状态' }, { command: 'git diff', watch: '修改右上代码后，看未提交的差异' }] },
    { title: '02 保存一次版本', goal: '理解工作区 → 暂存区 → 提交的三步流转。', steps: [{ command: 'git add .', watch: '看代码区状态变成“已暂存”' }, { command: 'git commit -m "完成第一次修改"', watch: '看右下提交树新增节点' }, { command: 'git log', watch: '在终端查看提交历史' }] },
    { title: '03 分支与切换', goal: '理解分支只是指向某次提交的路标。', steps: [{ command: 'git branch yhx', watch: '看右下出现 yhx，但 HEAD 仍在 main' }, { command: 'git switch yhx', watch: '看 HEAD 和代码视图一起切换' }] },
    { title: '04 合并与恢复', goal: '练习整合分支，并学会安全撤销未提交修改。', steps: [{ command: 'git merge main', watch: '看提交指针是否快进或产生冲突' }, { command: 'git restore src/App.tsx', watch: '看工作区恢复到最近提交' }] },
  ]},
  { title: '第二阶段 · 个人项目', subtitle: '独立完成一个小项目', lessons: [
    { title: '01 功能分支开发', goal: '每个功能使用独立分支，保持 main 稳定。', steps: [{ command: 'git switch -c feature/home', watch: '看新分支从当前提交分叉' }, { command: 'git status', watch: '编辑代码并确认修改范围' }] },
    { title: '02 小步提交', goal: '把一个功能拆成清晰、可回退的提交。', steps: [{ command: 'git add .', watch: '确认暂存内容' }, { command: 'git commit -m "完善首页"', watch: '看 feature 分支向前移动' }] },
    { title: '03 合回主线', goal: '完成自检后，把功能分支合入 main。', steps: [{ command: 'git switch main', watch: '确认代码回到主线快照' }, { command: 'git merge feature/home', watch: '观察 fast-forward 或合并冲突' }] },
    { title: '04 发布前检查', goal: '用状态、差异和历史确认可发布版本。', steps: [{ command: 'git status', watch: '确保工作区干净' }, { command: 'git log', watch: '检查提交信息是否表达清楚' }] },
  ]},
  { title: '第三阶段 · 团队协作', subtitle: '远端、同步与冲突', lessons: [
    { title: '01 认识三个仓库状态', goal: '区分本地分支、origin/* 跟踪分支和真实远端。', steps: [{ command: 'git fetch', watch: '看 origin/* 更新，但当前代码不变' }, { command: 'git merge origin/main', watch: '再把远端变化合入本地' }] },
    { title: '02 拉取与推送', goal: '掌握团队中最常见的同步闭环。', steps: [{ command: 'git pull', watch: '观察 fetch + merge 两阶段反馈' }, { command: 'git push', watch: '看远端指针移动或被拒绝' }] },
    { title: '03 处理协作冲突', goal: '理解冲突不是报错，而是需要人做决定。', steps: [{ command: 'git merge origin/main', watch: '在编辑器寻找 <<<<<<< 冲突标记' }, { command: 'git add .', watch: '删除冲突标记后标记为已解决' }, { command: 'git commit -m "解决合并冲突"', watch: '看提交树记录解决结果' }] },
    { title: '04 团队工作习惯', goal: '形成先同步、短分支、小提交、再推送的节奏。', steps: [{ command: 'git fetch', watch: '开始工作前确认远端变化' }, { command: 'git status', watch: '提交前确认文件范围' }, { command: 'git push', watch: '把经过验证的提交分享给团队' }] },
  ]},
];

const firstCode = `export default function App() {
  return <h1>你好，Git！</h1>;
}`;
const firstCommits: Commit[] = [
  { id: 'a1b2c3d', message: '初始化项目', branch: 'main', content: 'export default function App() {}' },
  { id: 'd4e5f6a', message: '完成首页', branch: 'main', parent: 'a1b2c3d', content: firstCode },
];

function shortId() { return Math.random().toString(16).slice(2, 9); }

export default function Home() {
  const [stageIndex, setStageIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [commits, setCommits] = useState(firstCommits);
  const [branches, setBranches] = useState<Record<string, Branch>>({ main: { head: 'd4e5f6a', content: firstCode } });
  const [current, setCurrent] = useState('main');
  const [code, setCode] = useState(firstCode);
  const [staged, setStaged] = useState(false);
  const [remoteHeads, setRemoteHeads] = useState<Record<string, string>>({ main: 'a1b2c3d' });
  const [remoteCode, setRemoteCode] = useState<Record<string, string>>({ main: 'export default function App() {}' });
  const [serverHeads, setServerHeads] = useState<Record<string, string>>({ main: 'a1b2c3d' });
  const [serverCode, setServerCode] = useState<Record<string, string>>({ main: 'export default function App() {}' });
  const [viewRef, setViewRef] = useState('local:main');
  const [selectedFile, setSelectedFile] = useState<'src/App.tsx' | 'README.md'>('src/App.tsx');
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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
  function isAncestor(ancestor: string, descendant: string): boolean {
    if (ancestor === descendant) return true;
    const seen = new Set<string>(), queue = [descendant];
    while (queue.length) { const id = queue.shift()!; if (seen.has(id)) continue; seen.add(id); const c = commits.find(x => x.id === id); for (const parent of [c?.parent, c?.mergeParent]) { if (parent === ancestor) return true; if (parent) queue.push(parent); } }
    return false;
  }
  function sourceRef(name: string): Branch | undefined {
    if (name.startsWith('origin/')) { const n = name.slice(7); return remoteHeads[n] ? { head: remoteHeads[n], content: remoteCode[n] } : undefined; }
    return branches[name];
  }
  function mergeSource(sourceName: string, source: Branch): Line[] {
    const target = branches[current];
    if (source.head === target.head || isAncestor(source.head, target.head)) return [out('info', 'Already up to date.')];
    if (isAncestor(target.head, source.head)) { setCode(source.content); setBranches(v => ({ ...v, [current]: { head: source.head, content: source.content } })); return [out('ok', `✓ Fast-forward：${current} 已前进到 ${sourceName}`), out('info', '工作区代码已同步更新')]; }
    const merged = `<<<<<<< ${current}\n${code}\n=======\n${source.content}\n>>>>>>> ${sourceName}`; setCode(merged); setConflict(true); setStaged(false);
    return [out('error', 'CONFLICT：src/App.tsx 内容冲突'), out('info', '请编辑并删除冲突标记，再运行 git add . 和 git commit')];
  }
  function switchTo(name: string): Line[] {
    const target = branches[name];
    if (!target) return [out('error', `分支 ${name} 不存在。用 git branch 查看分支。`)];
    if (dirty || staged) return [out('error', '当前代码尚未提交。请先提交或恢复后再切换分支。')];
    setCurrent(name); setCode(target.content); setViewRef(`local:${name}`); setStaged(false); setConflict(false);
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
      setBranches(v => ({ ...v, [name]: { head: v[current].head, content: code } })); setCurrent(name); setViewRef(`local:${name}`); setStaged(false);
      return [out('ok', `✓ 从 ${current} 创建并切换到 ${name}`)];
    }
    if (p[1] === 'switch' || p[1] === 'checkout') return switchTo(p[p[1] === 'checkout' && p[2] === '-b' ? 3 : 2] || '');
    if (p[1] === 'branch') {
      const name = p[2];
      if (!name) return Object.keys(branches).map(n => out('info', `${n === current ? '*' : ' '} ${n}  ${branches[n].head}`));
      if (name.startsWith('-')) return [out('error', `暂不支持选项 ${name}`)];
      if (branches[name]) return [out('error', `fatal: 分支“${name}”已经存在`)];
      setBranches(v => ({ ...v, [name]: { head: v[current].head, content: v[current].content } }));
      return [out('ok', `✓ 已创建分支 ${name}（当前仍在 ${current}）`), out('info', `下一步可运行：git switch ${name}`)];
    }
    if (p[1] === 'merge') {
      const sourceName = p[2]; if (!sourceName) return [out('error', '用法：git merge <分支名>')]; const source = sourceRef(sourceName); if (!source) return [out('error', `分支 ${sourceName} 不存在；远端分支要先 git fetch`)];
      if (dirty || staged) return [out('error', '请先提交或恢复当前修改，再执行 merge')];
      return mergeSource(sourceName, source);
    }
    if (p[1] === 'push') {
      const tracked = remoteHeads[current], server = serverHeads[current];
      if (server && tracked !== server) return [out('error', '! [rejected] 远端包含你本地不知道的新提交'), out('info', '请先运行 git fetch，再 merge origin/' + current)];
      if (server && !isAncestor(server, branches[current].head)) return [out('error', '! [rejected] non-fast-forward'), out('info', '需要先合并远端分支')];
      const head = branches[current].head, content = branches[current].content; setServerHeads(v => ({ ...v, [current]: head })); setServerCode(v => ({ ...v, [current]: content })); setRemoteHeads(v => ({ ...v, [current]: head })); setRemoteCode(v => ({ ...v, [current]: content }));
      return [out('ok', `✓ ${current} → origin/${current}`), out('info', '远端服务器和 origin 跟踪指针均已更新')];
    }
    if (p[1] === 'fetch') { setRemoteHeads({ ...serverHeads }); setRemoteCode({ ...serverCode }); const changed = Object.keys(serverHeads).filter(n => remoteHeads[n] !== serverHeads[n]); return changed.length ? [out('ok', `✓ 已获取：${changed.map(n => `origin/${n}`).join('、')}`), out('info', 'fetch 只更新 origin/*，当前分支和代码没有改变')] : [out('info', 'Already up to date. 远端跟踪分支没有变化')]; }
    if (p[1] === 'pull') {
      if (dirty || staged) return [out('error', '请先提交或恢复当前修改，再执行 pull')];
      const source = serverHeads[current] ? { head: serverHeads[current], content: serverCode[current] } : undefined; if (!source) return [out('error', `远端没有 ${current} 分支`)];
      setRemoteHeads(v => ({ ...v, [current]: source.head })); setRemoteCode(v => ({ ...v, [current]: source.content }));
      return [out('ok', `✓ fetch origin/${current}`), ...mergeSource(`origin/${current}`, source)];
    }
    if (p[1] === 'diff') return [out('info', dirty ? `--- 已提交的 src/App.tsx\n+++ 工作区 src/App.tsx\n@@ 代码内容已发生变化 @@` : '没有差异')];
    if (p[1] === 'restore' && p[2]) { setCode(branches[current].content); setStaged(false); setConflict(false); return [out('ok', `✓ 已恢复 ${p[2]}`)]; }
    if (p[1] === 'log') return commits.slice().reverse().map(c => out('info', `${c.id}  ${c.message}  (${c.branch})`));
    if (cmd === 'help' || cmd === '帮助') return [out('info', 'status · diff · add · commit · restore · branch · switch · merge · log · push · fetch · pull')];
    return [out('error', `暂不支持“${cmd}”。输入 help 查看命令。`)];
  }

  function run(e: FormEvent) { e.preventDefault(); const cmd = command.trim(); if (!cmd) return; setLines(v => [...v, out('cmd', `$ ${cmd}`), ...execute(cmd)]); const key = `${stageIndex}-${lessonIndex}-${cmd}`; if (curriculum[stageIndex].lessons[lessonIndex].steps.some(s => s.command === cmd)) setCompleted(v => ({ ...v, [key]: true })); setHistory(v => [...v.filter(x => x !== cmd), cmd]); setHistoryIndex(-1); setCommand(''); }
  function browseHistory(direction: 'up' | 'down') { if (!history.length) return; const next = direction === 'up' ? Math.min(historyIndex + 1, history.length - 1) : Math.max(historyIndex - 1, -1); setHistoryIndex(next); setCommand(next === -1 ? '' : history[history.length - 1 - next]); }
  function simulateTeammate() { const branch = 'main', parent = serverHeads[branch], id = shortId(), content = `${serverCode[branch]}\n\n// 队友刚刚更新了远端代码`; setCommits(v => [...v, { id, message: '队友更新了远端代码', branch: 'remote/main', parent, content }]); setServerHeads(v => ({ ...v, [branch]: id })); setServerCode(v => ({ ...v, [branch]: content })); setLines(v => [...v, out('info', '☁ 队友已向远端 main 推送了一个提交'), out('info', '你的 origin/main 尚未更新；请运行 git fetch')]); }
  function resetWorkspace(message = '练习场已重置。') { setCommits(firstCommits); setBranches({ main: { head: 'd4e5f6a', content: firstCode } }); setCurrent('main'); setCode(firstCode); setStaged(false); setConflict(false); setRemoteHeads({ main: 'a1b2c3d' }); setRemoteCode({ main: 'export default function App() {}' }); setServerHeads({ main: 'a1b2c3d' }); setServerCode({ main: 'export default function App() {}' }); setViewRef('local:main'); setSelectedFile('src/App.tsx'); setLines([out('info', message)]); setCommand(''); setHistory([]); setHistoryIndex(-1); }
  function chooseLesson(si: number, li: number) { setStageIndex(si); setLessonIndex(li); resetWorkspace(`已进入“${curriculum[si].lessons[li].title}”，仓库与终端已恢复为初始状态。`); }

  const visible = commits.slice().reverse();
  const [viewKind, viewName] = viewRef.split(':');
  const viewingCurrent = viewKind === 'local' && viewName === current;
  const viewedCode = viewKind === 'remote' ? (remoteCode[viewName] ?? '') : viewingCurrent ? code : (branches[viewName]?.content ?? '');
  const editorValue = selectedFile === 'README.md' ? `# Git 好好学示例项目\n\n当前正在查看：${viewKind === 'remote' ? 'origin/' : ''}${viewName}\n\n请切换到 src/App.tsx 练习代码修改。` : viewedCode;
  const lesson = curriculum[stageIndex].lessons[lessonIndex];
  return <main className="h-screen overflow-hidden bg-[#f3efe5] text-[#18251e]">
    <header className="flex h-14 items-center justify-between border-b border-[#1d3d2b]/15 bg-[#fbf8f0] px-4 lg:px-6">
      <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#173e2b] text-white"><GitBranch size={18}/></span><b>Git 好好学</b><span className="rounded-full bg-[#e5eadc] px-2 py-1 text-[10px] font-bold text-[#52705c]">可编辑实验室</span></div>
      <div className="text-xs text-[#657168]">当前分支：<b className="rounded bg-[#dcebdd] px-2 py-1 font-mono text-[#27613f]">{current}</b></div>
      <div className="flex gap-2"><button onClick={simulateTeammate} className="flex items-center gap-2 rounded-lg border border-[#b7732e]/25 bg-[#fff2dc] px-3 py-2 text-xs font-semibold text-[#86501e]"><UserPlus size={13}/>模拟队友提交</button><button onClick={() => resetWorkspace()} className="flex items-center gap-2 rounded-lg border border-[#1d3d2b]/20 bg-white px-3 py-2 text-xs font-semibold"><RotateCcw size={13}/>重置</button></div>
    </header>

    <div className="grid h-[calc(100vh-56px)] min-h-0 grid-cols-1 xl:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="hidden min-h-0 overflow-y-auto border-r border-[#1d3d2b]/15 bg-[#fbf8f0] p-3 xl:block"><p className="px-2 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#7d877f]">从入门到团队协作</p>{curriculum.map((stage, si) => <div key={stage.title} className="mb-3"><button onClick={() => chooseLesson(si, 0)} className={`w-full rounded-xl p-3 text-left ${si === stageIndex ? 'bg-[#173e2b] text-white shadow-sm' : 'hover:bg-[#eeece3]'}`}><p className="text-xs font-bold">{stage.title}</p><p className={`mt-1 text-[10px] ${si === stageIndex ? 'text-[#c9dacd]' : 'text-[#7b847d]'}`}>{stage.subtitle}</p></button>{si === stageIndex && <div className="ml-3 mt-2 border-l border-[#b8c8bb] pl-2">{stage.lessons.map((l, li) => <button key={l.title} onClick={() => chooseLesson(si, li)} className={`mb-1 w-full rounded-lg px-2 py-2 text-left text-[11px] ${li === lessonIndex ? 'bg-[#fff0d6] font-bold text-[#86501e]' : 'text-[#59665e] hover:bg-white'}`}>{l.title}</button>)}</div>}</div>)}</aside>
      <div className="grid min-h-0 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(340px,40%)_minmax(0,60%)]">
      <div className="grid min-h-[620px] grid-rows-[auto_minmax(0,1fr)] gap-3 lg:min-h-0">
      <section className="max-h-[250px] overflow-y-auto rounded-2xl border border-[#d9c59f] bg-[#fff9eb] p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#a06b2e]">{curriculum[stageIndex].title}</p><h2 className="mt-1 text-base font-bold">{lesson.title}</h2><p className="mt-1 text-xs leading-5 text-[#657168]">{lesson.goal}</p></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#667269]">{lesson.steps.filter(s => completed[`${stageIndex}-${lessonIndex}-${s.command}`]).length}/{lesson.steps.length}</span></div><div className="mt-3 space-y-2">{lesson.steps.map((step, i) => <button key={step.command} onClick={() => setCommand(step.command)} className={`w-full rounded-lg border px-3 py-2 text-left ${completed[`${stageIndex}-${lessonIndex}-${step.command}`] ? 'border-[#83ad8d] bg-[#e3f0e5]' : 'border-[#e2c996] bg-white hover:border-[#c59245]'}`}><span className="mr-2 text-[10px] font-bold text-[#a06b2e]">步骤 {i + 1}</span><code className="text-[10px] font-bold">{step.command}</code><small className="mt-1 block text-[10px] leading-4 text-[#59665e]">作用：{commandHelp[step.command] ?? '执行本节练习命令并观察仓库状态变化。'}</small><small className="mt-1 block text-[10px] leading-4 text-[#7b827c]">观察：{step.watch}</small></button>)}</div></section>
      <section className="flex min-h-[360px] flex-col overflow-hidden rounded-2xl bg-[#0d2417] shadow-[0_14px_32px_rgba(13,36,23,.18)]">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4 text-[#dae7db]"><span className="flex items-center gap-2 text-xs font-bold"><Terminal size={15}/>命令行</span><span className="font-mono text-[10px] text-[#8ca092]">~/git-lab ({current})</span></div>
        <div ref={outputRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 font-mono text-xs leading-6">
          {lines.map((l, i) => <div key={i} className={l.kind === 'error' ? 'text-[#ff9a83]' : l.kind === 'ok' ? 'text-[#82dda2]' : l.kind === 'cmd' ? 'mt-2 text-white' : 'whitespace-pre-line text-[#aec1b2]'}>{l.text}</div>)}
        </div>
        <div className="shrink-0 border-t border-white/10 bg-[#091c11] p-3">
          <form onSubmit={run} className="flex items-center rounded-xl border border-white/10 bg-white/[.04] px-3"><span className="font-mono text-sm text-[#eea74f]">$</span><input value={command} onChange={e => setCommand(e.target.value)} onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); browseHistory('up'); } if (e.key === 'ArrowDown') { e.preventDefault(); browseHistory('down'); } }} aria-label="Git 命令" placeholder="输入 git 命令…" className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-white outline-none placeholder:text-[#5f7767]"/><button className="rounded-lg bg-[#eca44d] p-2 text-[#173522]"><Play size={14} fill="currentColor"/></button></form>
          <p className="mt-2 text-[10px] text-[#718678]">↑ / ↓ 查看历史命令 · 输出区固定并自动滚动</p>
        </div>
      </section>
      </div>

      <div className="grid min-h-[680px] grid-rows-[minmax(300px,1fr)_minmax(300px,1fr)] gap-3 lg:min-h-0">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1d3d2b]/15 bg-[#fffdf7] shadow-sm">
          <div className="panel-title shrink-0"><span><FileCode2 size={15}/>代码浏览与编辑</span><div className="flex items-center gap-2"><select aria-label="选择本地或远端分支" value={viewRef} onChange={e => setViewRef(e.target.value)} className="rounded-md border border-[#1d3d2b]/15 bg-white px-2 py-1 font-mono text-[10px] outline-none"><optgroup label="本地分支">{Object.keys(branches).map(n => <option key={`local:${n}`} value={`local:${n}`}>{n}{n === current ? '（当前）' : ''}</option>)}</optgroup><optgroup label="远端分支">{Object.keys(remoteHeads).map(n => <option key={`remote:${n}`} value={`remote:${n}`}>origin/{n}</option>)}</optgroup></select><span className={viewKind === 'remote' ? 'tag-orange' : !viewingCurrent ? 'tag-muted' : conflict ? 'tag-red' : staged ? 'tag-green' : dirty ? 'tag-yellow' : 'tag-muted'}>{viewKind === 'remote' ? '远端只读' : !viewingCurrent ? '其他分支只读' : conflict ? '冲突待解决' : staged ? '已暂存' : dirty ? '未提交修改' : '代码已同步'}</span></div></div>
          <div className="grid min-h-0 flex-1 grid-cols-[132px_minmax(0,1fr)]"><aside className="border-r border-[#1d3d2b]/10 bg-[#f5f2e9] p-3"><p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[#7d857f]">文件</p><button onClick={() => setSelectedFile('src/App.tsx')} className={`mb-1 w-full rounded-md px-2 py-2 text-left font-mono text-[10px] ${selectedFile === 'src/App.tsx' ? 'bg-white font-bold text-[#27613f] shadow-sm' : ''}`}><Code2 size={11} className="mr-1 inline"/>src/App.tsx</button><button onClick={() => setSelectedFile('README.md')} className={`w-full rounded-md px-2 py-2 text-left font-mono text-[10px] ${selectedFile === 'README.md' ? 'bg-white font-bold text-[#27613f] shadow-sm' : ''}`}>README.md</button></aside><div className="flex min-h-0 flex-col"><div className="flex h-8 shrink-0 items-center justify-between border-b border-[#1d3d2b]/10 bg-[#faf8f2] px-3"><span className="font-mono text-[10px]">{selectedFile}</span><span className="text-[9px] text-[#7d857f]">{viewingCurrent && selectedFile === 'src/App.tsx' ? '可编辑' : '只读预览'}</span></div><textarea value={editorValue} readOnly={!viewingCurrent || selectedFile !== 'src/App.tsx'} onChange={e => { if (viewingCurrent && selectedFile === 'src/App.tsx') { setCode(e.target.value); setStaged(false); } }} spellCheck={false} aria-label={`${viewName} 分支 ${selectedFile}`} className={`min-h-0 flex-1 resize-none p-4 font-mono text-[12px] leading-6 text-[#23342a] outline-none ${viewingCurrent && selectedFile === 'src/App.tsx' ? 'bg-[#fffdf7]' : 'bg-[#f7f5ee] text-[#657168]'}`}/></div></div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1d3d2b]/15 bg-[#fffdf7] shadow-sm">
          <div className="panel-title shrink-0"><span><GitBranch size={15}/>分支与提交树</span><div className="flex gap-2"><span className="tag-green">本地</span><span className="tag-orange">origin 跟踪</span>{Object.keys(serverHeads).some(n => serverHeads[n] !== remoteHeads[n]) && <span className="tag-red">远端有新提交</span>}</div></div>
          <div className="grid min-h-0 flex-1 grid-cols-[150px_minmax(0,1fr)] overflow-hidden">
            <aside className="overflow-y-auto border-r border-[#1d3d2b]/10 bg-[#f6f3ea] p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#7f877f]">本地分支</p>{Object.entries(branches).map(([name, b]) => <button key={name} onClick={() => setViewRef(`local:${name}`)} className={`mb-1 w-full rounded-lg px-2 py-2 text-left font-mono text-[11px] ${viewRef === `local:${name}` ? 'bg-[#dcebdd] font-bold text-[#27613f]' : 'hover:bg-white'}`}><span className="mr-1">{name === current ? '●' : '○'}</span>{name}<small className="mt-1 block pl-4 text-[9px] opacity-60">{b.head}</small></button>)}<p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a16a2c]">远端分支</p>{Object.entries(remoteHeads).map(([name, head]) => <button key={`origin/${name}`} onClick={() => setViewRef(`remote:${name}`)} className={`mb-1 w-full rounded-lg px-2 py-2 text-left font-mono text-[11px] ${viewRef === `remote:${name}` ? 'bg-[#fae7ce] font-bold text-[#955d22]' : 'hover:bg-white'}`}><Cloud size={10} className="mr-1 inline"/>origin/{name}<small className="mt-1 block pl-4 text-[9px] opacity-60">{head}</small></button>)}</aside>
            <div className="relative overflow-y-auto p-5"><div className="absolute bottom-5 left-[30px] top-5 w-px bg-[#b8ceb9]"/>{visible.map((c, i) => { const heads = Object.entries(branches).filter(([, b]) => b.head === c.id).map(([n]) => n); const remotes = Object.entries(remoteHeads).filter(([, id]) => id === c.id).map(([n]) => n); return <div key={c.id} className="relative mb-5 flex gap-4"><span className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-[4px] border-[#fffdf7] ring-2 ${c.branch === 'main' ? 'bg-[#377550] ring-[#377550]' : 'bg-[#d68b38] ring-[#d68b38]'}`}/><div className="min-w-0"><div className="flex flex-wrap gap-1">{heads.map(n => <span key={n} className="branch-label local">{n === current ? `HEAD → ${n}` : n}</span>)}{remotes.map(n => <span key={n} className="branch-label remote"><Cloud size={10}/>origin/{n}</span>)}</div><p className="mt-1 text-xs font-semibold">{c.message}</p><p className="font-mono text-[10px] text-[#89918b]">{c.id} · {c.branch}{c.mergeParent ? ' · merge' : ''}</p></div></div>})}</div>
          </div>
        </section>
      </div>
      </div>
    </div>
  </main>;
}
