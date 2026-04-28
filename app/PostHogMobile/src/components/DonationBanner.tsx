import React, { useState } from 'react';
import { Image, Pressable, Text } from 'react-native';

interface DonationBannerProps {
  /** Callback when the banner is pressed */
  onPress: () => void;
  /** Accessibility label for screen readers */
  accessibilityLabel: string;
  /** Fallback text shown if the image fails to load */
  fallbackText: string;
}

const bannerSource = require('../assets/donation-banner.png');

export function DonationBanner({ onPress, accessibilityLabel, fallbackText }: DonationBannerProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable
      className="bg-background-secondary dark:bg-[#1A1A1A] border border-border dark:border-[#262626] rounded-2xl overflow-hidden active:opacity-70"
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
    >
      {imageError ? (
        <Text className="text-primary font-inter-medium text-base text-center py-6 px-4">
          {fallbackText}
        </Text>
      ) : (
        <Image
          source={bannerSource}
          className="w-full"
          style={{ aspectRatio: 2 }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}
    </Pressable>
  );
}
