'use client'

import { useEffect } from 'react'

export function useModaal(photos: any[]) {
  useEffect(() => {
    const initModaal = () => {
      console.log('=== MODAAL INITIALIZATION START ===')
      console.log('Window available:', typeof window !== 'undefined')
      console.log('jQuery available:', typeof window !== 'undefined' && (window as any).jQuery)
      console.log('jQuery version:', typeof window !== 'undefined' && (window as any).jQuery ? (window as any).jQuery.fn.jquery : 'N/A')
      console.log('Modaal available:', typeof window !== 'undefined' && (window as any).jQuery && (window as any).jQuery.fn.modaal)
      console.log('Gallery elements:', document.querySelectorAll('#gallery > div > a').length)
      
      if (typeof window !== 'undefined' && (window as any).jQuery && (window as any).jQuery.fn.modaal) {
        console.log('Initializing modaal...')
        try {
          // 既存のインスタンスをクローズ（多重初期化ケア）
          (window as any).jQuery("#gallery > div > a").modaal('close')
          ;(window as any).jQuery("#gallery > div > a").modaal({
            overlay_close: true,
            before_open: function() {
              console.log('Modaal opening...')
              try {
                const $ = (window as any).jQuery
                const self: any = this
                const $trigger = self && (self.$elem || self.$element || self.$el)
                const href: string | null = $trigger && $trigger.attr ? $trigger.attr('href') : (document.activeElement && (document.activeElement as HTMLAnchorElement).getAttribute('href'))
                const id = href && href.startsWith('#') ? href.substring(1) : null
                if (id) {
                  const el = document.getElementById(id)
                  const img = el ? (el.querySelector('img[data-full]') as HTMLImageElement | null) : null
                  const dataFull = img?.getAttribute('data-full') || ''
                  if (img && dataFull && !img.getAttribute('src')) {
                    console.log('Setting modal image src:', dataFull)
                    img.src = dataFull
                  }
                }
              } catch (e) {
                console.error('before_open handler error', e)
              }
              document.documentElement.style.overflowY = 'hidden'
            },
            after_close: function() {
              console.log('Modaal closing...')
              document.documentElement.style.overflowY = 'scroll'
            }
          })
          console.log('Modaal initialized successfully')
        } catch (error) {
          console.error('Error initializing modaal:', error)
        }
      } else {
        console.log('jQuery or modaal not available, retrying in 1 second...')
        setTimeout(initModaal, 1000)
      }
    }

    const timer = setTimeout(initModaal, 500)
    return () => clearTimeout(timer)
  }, [photos])
} 