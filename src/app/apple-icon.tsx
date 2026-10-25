import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0c0b09' }}>
      <div
        style={{
          position: 'absolute',
          left: 37,
          top: 58,
          width: 106,
          height: 106,
          borderRadius: 999,
          background: '#ffc21a',
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 112, bottom: 0, background: '#0c0b09' }} />
      <div
        style={{
          position: 'absolute',
          left: 22,
          right: 22,
          top: 124,
          height: 9,
          borderRadius: 9,
          background: '#ffc21a',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 50,
          top: 144,
          height: 9,
          borderRadius: 9,
          background: '#ffc21a',
          opacity: 0.55,
        }}
      />
    </div>,
    size,
  )
}
