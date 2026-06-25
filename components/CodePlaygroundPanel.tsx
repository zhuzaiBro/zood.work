'use client'

import {
  buildPlaygroundEmbedUrl,
  getPlaygroundTitle,
  isRunnableLanguage,
  PLAYGROUND_IFRAME_SANDBOX,
} from '@/lib/codePlayground'

export interface PlaygroundSnippet {
  code: string
  language: string
  title: string
}

interface CodePlaygroundPanelProps {
  snippet: PlaygroundSnippet
  runToken: number
  onClose: () => void
  onDragHandlePointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
}

function MacTrafficLights({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center gap-2" onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="group relative h-3 w-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] transition hover:brightness-95"
      >
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#4d0000]/0 group-hover:text-[#4d0000]/80">
          ×
        </span>
      </button>
      <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" />
    </div>
  )
}

export default function CodePlaygroundPanel({
  snippet,
  runToken,
  onClose,
  onDragHandlePointerDown,
}: CodePlaygroundPanelProps) {
  if (!isRunnableLanguage(snippet.language)) {
    return null
  }

  const embedUrl = buildPlaygroundEmbedUrl(snippet.language, snippet.code)
  const playgroundTitle = getPlaygroundTitle(snippet.language)

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-black/10 bg-[#f5f5f7] shadow-[0_28px_80px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.04]">
      <div
        className="grid grid-cols-[88px_1fr_88px] items-center border-b border-black/[0.08] bg-[linear-gradient(180deg,#fafafa_0%,#ececec_100%)] px-4 py-3 select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onDragHandlePointerDown}
      >
        <MacTrafficLights onClose={onClose} />

        <div className="min-w-0 px-2 text-center">
          <p className="truncate text-[13px] font-medium text-slate-600">
            {snippet.title}
          </p>
          <p className="truncate text-[11px] text-slate-400">{playgroundTitle}</p>
        </div>

        <div className="w-[88px]" />
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        <iframe
          key={`${runToken}:${embedUrl}`}
          title={playgroundTitle}
          src={embedUrl}
          width="100%"
          height="100%"
          className="absolute inset-0 h-full w-full border-0 bg-white"
          loading="lazy"
          scrolling="no"
          allowTransparency
          allowFullScreen
          sandbox={PLAYGROUND_IFRAME_SANDBOX}
        />
      </div>
    </aside>
  )
}
