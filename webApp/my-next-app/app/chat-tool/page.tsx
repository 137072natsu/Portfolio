'use client';

import { FormEvent, useState } from 'react';
import { askAi } from './ai_client';

const initialResponse = 'ここにAIの応答が表示されます。';

export default function ChatToolPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(initialResponse);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setResponse('入力内容を入れてから送信してください。');
      return;
    }

    setIsLoading(true);
    setResponse('応答を生成中です...');

    try {
      const aiResponse = await askAi(trimmedPrompt);
      setResponse(aiResponse);
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'AI応答の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setResponse(initialResponse);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_48%),linear-gradient(135deg,_#020617_0%,_#0f172a_65%,_#111827_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Chat Tool UI
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            AI chat-tool 
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            model: gpt-5.5
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="flex min-h-[420px] flex-col rounded-3xl border border-sky-400/20 bg-slate-900/80 p-6 shadow-2xl shadow-sky-950/40">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                  Input
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">入力欄</h2>
              </div>
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
                Left Panel
              </span>
            </div>

            <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
              <label htmlFor="prompt" className="mb-2 text-sm font-medium text-slate-300">
                プロンプト
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="ここに入力してください"
                className="min-h-[220px] flex-1 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-100 outline-none ring-0 transition focus:border-sky-400"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? '送信中...' : '送信する'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  クリア
                </button>
              </div>
            </form>
          </section>

          <section className="flex min-h-[420px] flex-col rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  Response
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">応答欄</h2>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                Right Panel
              </span>
            </div>

            <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Result
              </p>
              <div className="mt-4 flex-1 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-8 text-slate-200">
                {response}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
