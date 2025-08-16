import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ContentContainerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function ContentContainer({ children, style }: ContentContainerProps) {
  const { isTablet, isDesktop } = useResponsive();
  
  const containerStyle = [
    styles.container,
    isTablet && styles.tabletContainer,
    isDesktop && styles.desktopContainer,
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  tabletContainer: {
    paddingHorizontal: 32,
  },
  desktopContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 48,
  },
});