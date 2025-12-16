'use client'

import { useEffect, useState } from 'react'

function IntroText() {
  const [text, setText] = useState({ line1: '', line2: '' })
  const [status, setStatus] = useState<'typing1' | 'typing2' | 'done'>('typing1')

  const FULL_TEXT_1 = '你好陌生人'
  const FULL_TEXT_2 = '今天过的可好？'

  useEffect(() => {
    let index = 0
    const intervalId = setInterval(() => {
      if (status === 'typing1') {
        if (index < FULL_TEXT_1.length) {
          setText((prev) => ({ ...prev, line1: FULL_TEXT_1.slice(0, index + 1) }))
          index++
        } else {
          // Line 1 finished, move to line 2
          setStatus('typing2')
          index = 0
        }
      } else if (status === 'typing2') {
        if (index < FULL_TEXT_2.length) {
          setText((prev) => ({ ...prev, line2: FULL_TEXT_2.slice(0, index + 1) }))
          index++
        } else {
          // Line 2 finished
          setStatus('done')
          clearInterval(intervalId)
        }
      }
    }, 200)

    return () => clearInterval(intervalId)
  }, [status])

  return (
    <div className="mb-[30px] flex flex-col items-center">
      <h2 className="text-4xl font-bold min-h-[1.5em] flex items-center">
        {text.line1}
        {status === 'typing1' && <span className="animate-pulse ml-1">|</span>}
      </h2>
      <h2 className="text-4xl font-bold min-h-[1.5em] mt-2 flex items-center">
        {text.line2}
        {status === 'typing2' && <span className="animate-pulse ml-1">|</span>}
      </h2>
    </div>
  )
}

export default function ScrollSections() {
  const [visibleSection, setVisibleSection] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const height = window.innerHeight
      // Calculate which section we are in based on scroll
      // This maps roughly to the logic in ThreeBackground, but simplified for UI
      // We assume the user scrolls down roughly 1 screen per phase for the text to appear
      const phase = Math.floor(scrollY / (height * 0.8))
      setVisibleSection(phase)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex flex-col justify-center items-center text-white mix-blend-difference">
      {/* Section 1: Intro (handled by main page content usually, but we can add the indicator) */}
      <div
        className={`absolute transition-opacity duration-700 ${
          visibleSection === 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-center mt-16">
          <IntroText />
          <p className="text-xl text-gray-400">Scroll to Articles</p>
          <div className="animate-bounce mt-4 text-2xl">↓</div>
        </div>
      </div>

      {/* Section 2: Sphere */}
      <div
        className={`absolute transition-opacity duration-700 ${
          visibleSection === 1 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="text-6xl md:text-9xl font-bold tracking-wider uppercase text-center opacity-20 select-none">
          
        </h1>
        <p className="text-center text-gray-400 mt-4 opacity-50"></p>
      </div>

      {/* Section 3: Wave */}
      <div
        className={`absolute transition-opacity duration-700 ${
          visibleSection === 2 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="text-6xl md:text-9xl font-bold tracking-wider uppercase text-center opacity-20 select-none">
          
        </h1>
        <p className="text-center text-gray-400 mt-4 opacity-50"></p>
      </div>

      {/* Section 4: Cube */}
      <div
        className={`absolute transition-opacity duration-700 ${
          visibleSection === 3 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="text-6xl md:text-9xl font-bold tracking-wider uppercase text-center opacity-20 select-none">
          
        </h1>
        <p className="text-center text-gray-400 mt-4 opacity-50"></p>
      </div>
    </div>
  )
}
