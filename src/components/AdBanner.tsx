import { useEffect, useRef } from 'react'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

// Replace REPLACE_WITH_YOUR_PUBLISHER_ID with your ca-pub-XXXXXXXXXXXXXXXX id
// Replace each slot prop at call sites with the slot id from your AdSense account
const AD_CLIENT = 'ca-pub-REPLACE_WITH_YOUR_PUBLISHER_ID'

export default function AdBanner({
  slot,
  format = 'auto',
  className = '',
}: {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
  className?: string
}) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <p className="text-center text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
        Advertisement
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
