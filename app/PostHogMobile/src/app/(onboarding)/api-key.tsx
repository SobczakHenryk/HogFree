import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import * as Haptics from 'expo-haptics';

import { POSTHOG_CLOUD_LABELS } from '../../constants';
import { ApiKeyField, CloudRegionSelector, SelfHostedUrlInput } from '../../components';
import { useAuth, useLocale } from '../../hooks';
import type { PostHogCloud } from '../../types';
import type { TranslationKey } from '../../i18n/types';
import { validateSelfHostedUrl } from '../../utils/url';

export default function ApiKeyScreen() {
  const { validateAndStore, cloudRegion, isLoading, error, clearError } = useAuth();
  const { t } = useLocale();
  const [key, setKey] = useState('');
  const [selectedCloud, setSelectedCloud] = useState<PostHogCloud>(cloudRegion);
  const [selfHostedUrl, setSelfHostedUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  function handleChangeText(text: string) {
    if (error) clearError();
    // FR-010: trim automático visible al escribir (espacios al inicio/fin)
    setKey(text.trimStart());
  }

  function handleChangeCloud(next: PostHogCloud) {
    if (error) clearError();
    setUrlError(null);
    setSelectedCloud(next);
  }

  function handleChangeSelfHostedUrl(text: string) {
    if (urlError) setUrlError(null);
    if (error) clearError();
    setSelfHostedUrl(text);
  }

  async function handleSave() {
    // Validate self-hosted URL locally before calling remote validation
    if (selectedCloud === 'self-hosted') {
      const urlResult = validateSelfHostedUrl(selfHostedUrl);
      if (!urlResult.isValid) {
        setUrlError(urlResult.errorKey);
        return;
      }
    }
    await validateAndStore(key, selectedCloud, selectedCloud === 'self-hosted' ? selfHostedUrl : undefined);
  }

  // T014: Haptic feedback — se dispara cuando isLoading transiciona true → false
  const wasLoading = useRef(false);
  React.useEffect(() => {
    if (wasLoading.current && !isLoading) {
      if (error) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    wasLoading.current = isLoading;
  }, [isLoading, error]);

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-[#0D0D0D]"
      contentContainerClassName="flex-grow items-center justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo / Icono PostHog */}
      <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-8">
        <Text className="text-white font-inter-bold text-2xl">PH</Text>
      </View>

      {/* Título y descripción */}
      <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-bold text-2xl text-center mb-3">
        {t('onboarding.title')}
      </Text>
      <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter text-base text-center mb-10 leading-6">
        {t('onboarding.subtitle')}
      </Text>

      <View className="w-full mb-4">
        <CloudRegionSelector
          value={selectedCloud}
          onChange={handleChangeCloud}
          disabled={isLoading}
        />
      </View>

      {selectedCloud === 'self-hosted' && (
        <View className="w-full mb-4">
          <SelfHostedUrlInput
            value={selfHostedUrl}
            onChangeText={handleChangeSelfHostedUrl}
            errorKey={urlError}
            editable={!isLoading}
          />
        </View>
      )}

      {/* Campo de ingreso — vacío por defecto (FR-009), tipo contraseña (FR-005) */}
      <View className="w-full mb-2">
        <ApiKeyField
          value={key}
          onChangeText={handleChangeText}
          placeholder={t('onboarding.placeholder')}
          editable={!isLoading}
        />
      </View>

      {/* Mensaje de error diferenciado (FR-006) */}
      {error && (
        <Text
          className="w-full text-red-400 font-inter text-sm mb-6 leading-5"
          testID="api-key-error-message"
        >
          {(error.message.startsWith('errors.') || error.message.startsWith('selfHosted.')) ? t(error.message as TranslationKey) : error.message}
        </Text>
      )}

      {!error && <View className="mb-6" />}

      {/* Botón Guardar */}
      <Pressable
        className="w-full bg-primary rounded-xl py-4 items-center active:bg-primary-dark disabled:opacity-50"
        onPress={handleSave}
        disabled={isLoading}
        testID="api-key-save-button"
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.saveLabel')}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white font-inter-semibold text-base">
            {t('common.save')}
          </Text>
        )}
      </Pressable>

      {/* Enlace de ayuda */}
      <Text className="text-text-tertiary font-inter text-sm mt-6 text-center leading-5">
        {selectedCloud === 'self-hosted'
          ? t('onboarding.helpText').replace('{cloud}', POSTHOG_CLOUD_LABELS['self-hosted'])
          : t('onboarding.helpText').replace('{cloud}', POSTHOG_CLOUD_LABELS[selectedCloud])}
      </Text>
    </ScrollView>
  );
}
