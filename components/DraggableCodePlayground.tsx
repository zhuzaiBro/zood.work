'use client'

import { useCallback, useEffect, useState } from 'react'
import CodePlaygroundPanel, {
  type PlaygroundSnippet,
} from '@/components/CodePlaygroundPanel'

const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 760
const MIN_WIDTH = 520
const MIN_HEIGHT = 420
const VIEWPORT_PADDING = 16
const TOP_SAFE = 72

interface DraggableCodePlaygroundProps {
  snippet: PlaygroundSnippet
  runToken: number
  onClose: () => void
}

type Point = { x: number; y: number }
type Size = { width: number; height: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getInitialLayout(): { position: Point; size: Size } {
  if (typeof window === 'undefined') {
    return {
      position: { x: VIEWPORT_PADDING, y: TOP_SAFE },
      size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    }
  }

  const width = Math.min(DEFAULT_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2)
  const height = Math.min(
    DEFAULT_HEIGHT,
    window.innerHeight - TOP_SAFE - VIEWPORT_PADDING,
  )

  return {
    size: { width, height },
    position: {
      x: Math.max(VIEWPORT_PADDING, (window.innerWidth - width) / 2),
      y: Math.max(TOP_SAFE, (window.innerHeight - height) / 2),
    },
  }
}

export default function DraggableCodePlayground({
  snippet,
  runToken,
  onClose,
}: DraggableCodePlaygroundProps) {
  const [layout, setLayout] = useState(getInitialLayout)
  const [interaction, setInteraction] = useState<
    | { kind: 'drag'; startX: number; startY: number; origin: Point }
    | { kind: 'resize'; startX: number; startY: number; origin: Size; position: Point }
    | null
  >(null)

  const handleDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setInteraction({
        kind: 'drag',
        startX: event.clientX,
        startY: event.clientY,
        origin: layout.position,
      })
    },
    [layout.position],
  )

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      setInteraction({
        kind: 'resize',
        startX: event.clientX,
        startY: event.clientY,
        origin: layout.size,
        position: layout.position,
      })
    },
    [layout.position, layout.size],
  )

  useEffect(() => {
    if (!interaction) return

    const handlePointerMove = (event: PointerEvent) => {
      const maxWidth = window.innerWidth - VIEWPORT_PADDING * 2
      const maxHeight = window.innerHeight - TOP_SAFE - VIEWPORT_PADDING

      if (interaction.kind === 'drag') {
        const deltaX = event.clientX - interaction.startX
        const deltaY = event.clientY - interaction.startY
        setLayout((current) => ({
          ...current,
          position: {
            x: clamp(
              interaction.origin.x + deltaX,
              VIEWPORT_PADDING,
              window.innerWidth - current.size.width - VIEWPORT_PADDING,
            ),
            y: clamp(
              interaction.origin.y + deltaY,
              TOP_SAFE,
              window.innerHeight - current.size.height - VIEWPORT_PADDING,
            ),
          },
        }))
        return
      }

      const deltaX = event.clientX - interaction.startX
      const deltaY = event.clientY - interaction.startY
      const nextWidth = clamp(
        interaction.origin.width + deltaX,
        MIN_WIDTH,
        maxWidth,
      )
      const nextHeight = clamp(
        interaction.origin.height + deltaY,
        MIN_HEIGHT,
        maxHeight,
      )

      setLayout({
        size: { width: nextWidth, height: nextHeight },
        position: {
          x: clamp(
            interaction.position.x,
            VIEWPORT_PADDING,
            window.innerWidth - nextWidth - VIEWPORT_PADDING,
          ),
          y: clamp(
            interaction.position.y,
            TOP_SAFE,
            window.innerHeight - nextHeight - VIEWPORT_PADDING,
          ),
        },
      })
    }

    const handlePointerUp = () => {
      setInteraction(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [interaction])

  return (
    <div
      className="fixed z-[70]"
      style={{
        left: layout.position.x,
        top: layout.position.y,
        width: layout.size.width,
        height: layout.size.height,
      }}
    >
      <div className="relative h-full w-full">
        <CodePlaygroundPanel
          snippet={snippet}
          runToken={runToken}
          onClose={onClose}
          onDragHandlePointerDown={handleDragStart}
        />
        <div
          role="separator"
          aria-label="拉伸代码运行窗口"
          className="absolute bottom-2 right-2 z-10 flex h-4 w-4 cursor-nwse-resize items-end justify-end"
          onPointerDown={handleResizeStart}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 text-slate-400/80"
            aria-hidden="true"
          >
            <path
              d="M14 14L8 14M14 14L14 8M14 10L10 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
