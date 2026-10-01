import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const sans = Geist({ variable: '--font-sans-app', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono-app', subsets: ['latin'] });
export const metadata: Metadata = { title: 'Git 好好学｜中文可视化 Git 模拟器', description: '在浏览器中练习 Git 命令，同时观察文件、暂存区、本地分支和远端分支的变化。' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>; }
