'use client'

import { useEffect, useRef } from 'react'
import { isTouch, prefersReducedMotion } from './gsap'

/**
 * A soft warm light following the pointer across the whole site (desktop only).
 * It sits above the content with a `screen` blend, so dark photography warms up under it.
 */
export function PointerLight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || isTouch() || prefersReducedMotion()) return
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let tx = x
    let ty = y
    let frame = 0
    let visible = false

    const loop = () => {
      x += (tx - x) * 0.14
      y += (ty - y) * 0.14
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0
    }
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!visible) {
        visible = true
        el.style.opacity = '1'
      }
      if (!frame) frame = requestAnimationFrame(loop)
    }
    const onLeave = () => {
      visible = false
      el.style.opacity = '0'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        zIndex: 80,
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity .6s',
        mixBlendMode: 'screen',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '56vmax',
          height: '56vmax',
          left: '-28vmax',
          top: '-28vmax',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgb(255 186 40 / .14) 0%, rgb(255 150 30 / .05) 32%, transparent 62%)',
        }}
      />
    </div>
  )
}
