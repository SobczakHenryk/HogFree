import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Heart,
  Key,
  Languages,
  Moon,
  Pencil,
  Server,
  Smartphone,
  Sun,
  Trash2,
} from 'lucide-react-native';

import { KOFI_URL, POSTHOG_CLOUD_LABELS } from '../../constants';
import { ApiKeyField, CloudRegionSelector, SelfHostedUrlInput } from '../../components';
import { useAuth, useLocale, useTheme } from '../../hooks';
import type { ThemePreference } from '../../hooks';
import type { PostHogCloud } from '../../types';
import type { Locale, TranslationKey } from '../../i18n/types';
import { validateSelfHostedUrl } from '../../utils/url';

// ─── Shared row component ────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  isLast?: boolean;
  destructive?: boolean;
  testID?: string;
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  trailing,
  isLast = false,
  destructive = false,
  testID,
}: SettingsRowProps) {
  return (
    <Pressable
      className={`flex-row items-center px-4 py-3.5 active:opacity-70 ${
        !isLast ? 'border-b border-border dark:border-[#262626]' : ''
      }`}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      testID={testID}
    >
      <View className="w-8 h-8 rounded-lg bg-background-tertiary dark:bg-[#262626] items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1 flex-row items-center justify-between">
        <Text
          className={`font-inter-medium text-base ${
            destructive ? 'text-red-500' : 'text-text-primary dark:text-[#FFFFFF]'
          }`}
        >
          {label}
        </Text>
        <View className="flex-row items-center gap-2">
          {value != null && (
            <Text className="text-text-tertiary font-inter text-sm">{value}</Text>
          )}
          {trailing}
          {onPress && !trailing && (
            <ChevronRight size={16} color="#737373" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Section card wrapper ────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-background-secondary dark:bg-[#1A1A1A] border border-border dark:border-[#262626] rounded-2xl overflow-hidden">
      {children}
    </View>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="text-text-tertiary font-inter-medium text-xs uppercase tracking-widest mb-2 ml-1">
      {children}
    </Text>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const {
    hasApiKey,
    maskedValue,
    cloudRegion,
    selfHostedUrl,
    isLoading,
    error,
    updateApiKey,
    deleteApiKey,
    clearError,
  } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const { themePreference, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [isEditingKey, setIsEditingKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newCloudRegion, setNewCloudRegion] = useState<PostHogCloud>(cloudRegion);
  const [newSelfHostedUrl, setNewSelfHostedUrl] = useState(selfHostedUrl ?? '');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleOpenEdit() {
    clearError();
    setNewKey('');
    setNewCloudRegion(cloudRegion);
    setNewSelfHostedUrl(selfHostedUrl ?? '');
    setUrlError(null);
    setIsEditingKey(true);
  }

  function handleCancelEdit() {
    setIsEditingKey(false);
    setNewKey('');
    clearError();
  }

  function handleChangeNewKey(text: string) {
    if (error) clearError();
    setNewKey(text.trimStart());
  }

  function handleChangeCloudRegion(next: PostHogCloud) {
    if (error) clearError();
    setUrlError(null);
    setNewCloudRegion(next);
  }

  function handleChangeNewSelfHostedUrl(text: string) {
    if (urlError) setUrlError(null);
    if (error) clearError();
    setNewSelfHostedUrl(text);
  }

  async function handleConfirmUpdate() {
    if (newCloudRegion === 'self-hosted') {
      const urlResult = validateSelfHostedUrl(newSelfHostedUrl);
      if (!urlResult.isValid) {
        setUrlError(urlResult.errorKey);
        return;
      }
    }
    await updateApiKey(newKey, newCloudRegion, newCloudRegion === 'self-hosted' ? newSelfHostedUrl : undefined);
  }

  const wasLoadingUpdate = React.useRef(false);
  React.useEffect(() => {
    if (!isEditingKey) return;
    if (wasLoadingUpdate.current && !isLoading) {
      if (error) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsEditingKey(false);
        setNewKey('');
      }
    }
    wasLoadingUpdate.current = isLoading;
  }, [isLoading, error, isEditingKey]);

  function handleDeletePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      t('settings.deleteApiKeyTitle'),
      t('settings.deleteApiKeyMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteApiKey(),
        },
      ],
    );
  }

  async function handleCopyKey() {
    if (!maskedValue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(maskedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isDonationPending = React.useRef(false);
  function handleDonation() {
    if (isDonationPending.current) return;
    isDonationPending.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(KOFI_URL).finally(() => {
      isDonationPending.current = false;
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D]" edges={['top']}>
      {/* Header — Large title */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-bold text-3xl tracking-tight">
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-12 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* ── API Section ──────────────────────────────────────────── */}
        {hasApiKey && (
          <View className="mb-6">
            <SectionHeader>{t('settings.apiKeySection')}</SectionHeader>
            <SectionCard>
              {/* API Key row with eye toggle + copy */}
              <View className="flex-row items-center px-4 py-3.5 border-b border-border dark:border-[#262626]">
                <View className="w-8 h-8 rounded-lg bg-background-tertiary dark:bg-[#262626] items-center justify-center mr-3">
                  <Key size={16} color="#A3A3A3" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-tertiary font-inter text-xs mb-0.5">
                    {t('settings.apiKeyActive')}
                  </Text>
                  <Text
                    className="text-text-primary dark:text-[#FFFFFF] font-inter-medium text-sm"
                    testID="settings-masked-api-key"
                    selectable={false}
                  >
                    {showApiKey ? maskedValue : maskedValue?.replace(/[A-Za-z0-9]/g, '•')}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3 ml-2">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowApiKey((v) => !v);
                    }}
                    hitSlop={8}
                    className="active:opacity-70"
                    accessibilityLabel={showApiKey ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showApiKey ? (
                      <EyeOff size={18} color="#A3A3A3" />
                    ) : (
                      <Eye size={18} color="#A3A3A3" />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={handleCopyKey}
                    hitSlop={8}
                    className="active:opacity-70"
                    accessibilityLabel="Copy API Key"
                  >
                    <Copy size={18} color={copied ? '#14B8A6' : '#A3A3A3'} />
                  </Pressable>
                </View>
              </View>

              {/* Instance URL row */}
              <SettingsRow
                icon={<Server size={16} color="#A3A3A3" />}
                label={t('settings.instanceUrl')}
                value={cloudRegion === 'self-hosted' && selfHostedUrl ? selfHostedUrl : POSTHOG_CLOUD_LABELS[cloudRegion]}
                isLast={!isEditingKey}
              />

              {/* Edit form (inline) */}
              {isEditingKey && (
                <View className="px-4 py-4 border-t border-border dark:border-[#262626]">
                  <View className="mb-3">
                    <CloudRegionSelector
                      value={newCloudRegion}
                      onChange={handleChangeCloudRegion}
                      disabled={isLoading}
                    />
                  </View>
                  {newCloudRegion === 'self-hosted' && (
                    <View className="mb-3">
                      <SelfHostedUrlInput
                        value={newSelfHostedUrl}
                        onChangeText={handleChangeNewSelfHostedUrl}
                        errorKey={urlError}
                        editable={!isLoading}
                      />
                    </View>
                  )}
                  <ApiKeyField
                    value={newKey}
                    onChangeText={handleChangeNewKey}
                    placeholder={t('settings.newKeyPlaceholder')}
                    editable={!isLoading}
                  />
                  {error && (
                    <Text className="text-red-400 font-inter text-sm mt-2" testID="settings-update-error">
                      {(error.message.startsWith('errors.') || error.message.startsWith('selfHosted.')) ? t(error.message as TranslationKey) : error.message}
                    </Text>
                  )}
                  <View className="flex-row gap-3 mt-4">
                    <Pressable
                      className="flex-1 border border-border dark:border-[#262626] rounded-xl py-3 items-center active:opacity-70"
                      onPress={handleCancelEdit}
                      disabled={isLoading}
                      testID="settings-cancel-update"
                      accessibilityRole="button"
                      accessibilityLabel={t('settings.cancelChangeLabel')}
                    >
                      <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-medium text-sm">
                        {t('common.cancel')}
                      </Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 overflow-hidden rounded-xl active:opacity-90 disabled:opacity-50"
                      onPress={handleConfirmUpdate}
                      disabled={isLoading}
                      testID="settings-confirm-update"
                      accessibilityRole="button"
                      accessibilityLabel={t('settings.confirmKeyLabel')}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#14B8A6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 12 }}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-white font-inter-semibold text-sm">
                            {t('common.confirm')}
                          </Text>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              )}
            </SectionCard>

            {/* Action buttons below the card */}
            {!isEditingKey && (
              <View className="flex-row gap-3 mt-3">
                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-2 bg-background-secondary dark:bg-[#1A1A1A] border border-border dark:border-[#262626] rounded-2xl py-3 active:opacity-70"
                  onPress={handleOpenEdit}
                  testID="settings-change-api-key"
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.changeKeyLabel')}
                >
                  <Pencil size={14} color="#A3A3A3" />
                  <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-medium text-sm">
                    {t('common.change')}
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-2 bg-background-secondary dark:bg-[#1A1A1A] border border-red-500/30 rounded-2xl py-3 active:opacity-70"
                  onPress={handleDeletePress}
                  testID="settings-delete-api-key"
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.deleteKeyLabel')}
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text className="text-red-500 font-inter-medium text-sm">
                    {t('common.delete')}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ── Preferences Section ───────────────────────────────────── */}
        <View className="mb-6">
          <SectionHeader>{t('settings.preferencesSection')}</SectionHeader>
          <SectionCard>
            {/* Language row */}
            {(['es', 'en'] as const).map((lang: Locale, index) => {
              const isActive = locale === lang;
              const label = lang === 'es' ? t('settings.languageSpanish') : t('settings.languageEnglish');
              return (
                <Pressable
                  key={lang}
                  className={`flex-row items-center px-4 py-3.5 active:opacity-70 ${
                    index === 0 ? 'border-b border-border dark:border-[#262626]' : ''
                  }`}
                  onPress={() => {
                    if (!isActive) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLocale(lang);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  testID={`settings-language-${lang}`}
                >
                  <View className="w-8 h-8 rounded-lg bg-background-tertiary dark:bg-[#262626] items-center justify-center mr-3">
                    {index === 0 ? (
                      <Languages size={16} color="#A3A3A3" />
                    ) : (
                      <Globe size={16} color="#A3A3A3" />
                    )}
                  </View>
                  <Text
                    className={`flex-1 font-inter-medium text-base ${
                      isActive ? 'text-text-primary dark:text-[#FFFFFF]' : 'text-text-secondary dark:text-[#A3A3A3]'
                    }`}
                  >
                    {label}
                  </Text>
                  {isActive && (
                    <View className="w-5 h-5 rounded-full items-center justify-center overflow-hidden">
                      <LinearGradient
                        colors={['#3B82F6', '#14B8A6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <View className="w-2 h-2 rounded-full bg-white" />
                      </LinearGradient>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </SectionCard>
        </View>

        {/* ── Theme Selector (3-state: System / Light / Dark) ──────── */}
        <View className="mb-6">
          <SectionHeader>{t('settings.themeSection')}</SectionHeader>
          <SectionCard>
            {([
              { key: 'system' as ThemePreference, label: 'settings.themeSystem' as const, Icon: Smartphone },
              { key: 'light' as ThemePreference, label: 'settings.themeLight' as const, Icon: Sun },
              { key: 'dark' as ThemePreference, label: 'settings.themeDark' as const, Icon: Moon },
            ]).map((option, index) => {
              const isActive = themePreference === option.key;
              const IconComp = option.Icon;
              return (
                <Pressable
                  key={option.key}
                  className={`flex-row items-center px-4 py-3.5 active:opacity-70 ${
                    index < 2 ? 'border-b border-border dark:border-[#262626]' : ''
                  }`}
                  onPress={() => {
                    if (!isActive) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTheme(option.key);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  testID={`settings-theme-${option.key}`}
                >
                  <View className="w-8 h-8 rounded-lg bg-background-tertiary dark:bg-[#262626] items-center justify-center mr-3">
                    <IconComp size={16} color="#A3A3A3" />
                  </View>
                  <Text
                    className={`flex-1 font-inter-medium text-base ${
                      isActive ? 'text-text-primary dark:text-[#FFFFFF]' : 'text-text-secondary dark:text-[#A3A3A3]'
                    }`}
                  >
                    {t(option.label)}
                  </Text>
                  {isActive && (
                    <View className="w-5 h-5 rounded-full items-center justify-center overflow-hidden">
                      <LinearGradient
                        colors={['#3B82F6', '#14B8A6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <View className="w-2 h-2 rounded-full bg-white" />
                      </LinearGradient>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </SectionCard>
        </View>

        {/* ── Support Section ───────────────────────────────────────── */}
        <View className="mb-6">
          <SectionHeader>{t('settings.donationSection')}</SectionHeader>
          <Pressable
            className="overflow-hidden rounded-2xl active:opacity-80"
            onPress={handleDonation}
            accessibilityRole="link"
            accessibilityLabel={t('settings.donationLabel')}
          >
            <LinearGradient
              colors={isDark ? ['#1E293B', '#0F172A'] : ['#F0FDFA', '#E0F7F3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isDark ? '#1E3A5F' : '#99F6E4',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(20, 184, 166, 0.15)',
                }}
              >
                <Heart size={20} color="#14B8A6" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-base">
                  {t('settings.supportDeveloper')}
                </Text>
                <Text className="text-text-tertiary font-inter text-xs mt-0.5">
                  {t('settings.donationDescription')}
                </Text>
              </View>
              <ChevronRight size={16} color="#14B8A6" style={{ marginLeft: 8, flexShrink: 0 }} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── Version footer ────────────────────────────────────────── */}
        <Text className="text-text-tertiary font-inter text-xs text-center mt-2">
          Hog Free v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
