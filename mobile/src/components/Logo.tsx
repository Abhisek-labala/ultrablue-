import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: object;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', style }) => {
  const dimensions = {
    small: { height: 36, width: 140 },
    medium: { height: 50, width: 200 },
    large: { height: 75, width: 280 },
    xlarge: { height: 100, width: 340 },
  };

  const dim = dimensions[size] || dimensions.medium;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/images/ultrablue_brand_logo.png')}
        style={[styles.image, { height: dim.height, width: dim.width }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
  },
});
