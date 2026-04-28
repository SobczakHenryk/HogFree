import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { useLocale } from '../hooks';
import type { TranslationKey } from '../i18n/types';

interface SelfHostedUrlInputProps {
  value: string;
  onChangeText: (text: string) => void;
  errorKey?: string | null;
  editable?: boolean;
}

export function SelfHostedUrlInput({
  value,
  onChangeText,
  errorKey,
  editable = true,
}: SelfHostedUrlInputProps) {
  const { t } = useLocale();

  return (
    <View className="w-full">
      <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-medium text-sm mb-2">
        {t('selfHosted.label')}
      </Text>
      <TextInput
        className="w-full rounded-xl border border-border dark:border-[#262626] bg-background-secondary dark:bg-[#1A1A1A] px-4 py-3 text-text-primary dark:text-[#FFFFFF] font-inter text-base"
        value={value}
        onChangeText={onChangeText}
        placeholder={t('selfHosted.placeholder')}
        placeholderTextColor="#737373"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={editable}
        testID="self-hosted-url-input"
      />
      {errorKey && (
        <Text className="text-red-400 font-inter text-sm mt-1">
          {t(errorKey as TranslationKey)}
        </Text>
      )}
    </View>
  );
}
