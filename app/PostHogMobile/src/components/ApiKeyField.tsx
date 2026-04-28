import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useLocale } from '../hooks';

interface ApiKeyFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function ApiKeyField({
  value,
  onChangeText,
  placeholder = 'phx_...',
  editable = true,
}: ApiKeyFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLocale();

  return (
    <View className="flex-row items-center bg-background-tertiary dark:bg-[#262626] rounded-lg px-4 border border-border dark:border-[#262626]">
      <TextInput
        className="flex-1 py-3 text-base font-inter text-text-primary dark:text-[#FFFFFF]"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#737373"
        secureTextEntry={!isVisible}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        editable={editable}
        testID="api-key-input"
      />
      <Pressable
        onPress={() => setIsVisible((v) => !v)}
        hitSlop={8}
        accessibilityLabel={isVisible ? t('apiKeyField.hideKeyLabel') : t('apiKeyField.showKeyLabel')}
        testID="api-key-toggle-visibility"
      >
        <Ionicons
          name={isVisible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#A3A3A3"
        />
      </Pressable>
    </View>
  );
}
