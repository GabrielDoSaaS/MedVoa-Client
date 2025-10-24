/**
 * Mobile utility functions
 * Para funcionalidades específicas de mobile sem afetar desktop/tablet
 */

export const isMobile = () => window.innerWidth <= 600;
export const isSmallMobile = () => window.innerWidth <= 400;
export const isTinyMobile = () => window.innerWidth <= 320;

export const preventBodyScroll = (prevent: boolean) => {
  if (isMobile()) {
    document.body.style.overflow = prevent ? 'hidden' : '';
    document.body.style.position = prevent ? 'fixed' : '';
    document.body.style.width = prevent ? '100%' : '';
  }
};

export const getViewportHeight = () => {
  if (isMobile()) {
    // Para mobile, usa a altura disponível considerando barras do navegador
    return window.innerHeight;
  }
  return window.innerHeight;
};

export const handleMobileKeyboard = (callback: (isOpen: boolean) => void) => {
  if (!isMobile()) return;
  
  const initialHeight = window.innerHeight;
  
  const handleResize = () => {
    const currentHeight = window.innerHeight;
    const heightDiff = initialHeight - currentHeight;
    
    // Se a altura diminuiu mais de 150px, provavelmente o teclado está aberto
    const isKeyboardOpen = heightDiff > 150;
    callback(isKeyboardOpen);
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
};

export const getMobileBreakpoint = () => {
  const width = window.innerWidth;
  
  if (width <= 320) return 'tiny';
  if (width <= 400) return 'small';
  if (width <= 600) return 'mobile';
  if (width <= 768) return 'tablet';
  return 'desktop';
};

export const addMobileClasses = (element: HTMLElement, classes: string[]) => {
  if (isMobile()) {
    element.classList.add(...classes);
  }
};

export const removeMobileClasses = (element: HTMLElement, classes: string[]) => {
  if (isMobile()) {
    element.classList.remove(...classes);
  }
};