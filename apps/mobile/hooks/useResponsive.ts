import { useWindowDimensions } from 'react-native';

export type ScreenBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveData {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: ScreenBreakpoint;
}

export function useResponsive(): ResponsiveData {
  const { width, height } = useWindowDimensions();
  
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;
  
  const breakpoint: ScreenBreakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  
  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
}