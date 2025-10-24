import * as React from "react"

const MOBILE_BREAKPOINT = 600
const SMALL_MOBILE_BREAKPOINT = 400
const TINY_MOBILE_BREAKPOINT = 320

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsSmallMobile() {
  const [isSmallMobile, setIsSmallMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT}px)`)
    const onChange = () => {
      setIsSmallMobile(window.innerWidth <= SMALL_MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsSmallMobile(window.innerWidth <= SMALL_MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isSmallMobile
}

export function useIsTinyMobile() {
  const [isTinyMobile, setIsTinyMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TINY_MOBILE_BREAKPOINT}px)`)
    const onChange = () => {
      setIsTinyMobile(window.innerWidth <= TINY_MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsTinyMobile(window.innerWidth <= TINY_MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTinyMobile
}

export function useMobileBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'tiny' | 'small' | 'mobile' | 'tablet' | 'desktop'>('desktop')

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width <= TINY_MOBILE_BREAKPOINT) setBreakpoint('tiny')
      else if (width <= SMALL_MOBILE_BREAKPOINT) setBreakpoint('small')
      else if (width <= MOBILE_BREAKPOINT) setBreakpoint('mobile')
      else if (width <= 768) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}
