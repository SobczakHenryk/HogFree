import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useDashboardConfig } from '../hooks/useDashboardConfig';
import { useEventDefinitions } from '../hooks/useEventDefinitions';
import { usePropertyDefinitions } from '../hooks/usePropertyDefinitions';
import { useLocale, useTheme } from '../hooks';
import { getIntlLocale } from '../utils/locale-formats';
import type { AggregationMath, BarChartMode, PostHogEvent, PostHogProperty } from '../types';
import type { TranslationKey } from '../i18n/types';

// ─── Aggregation options ──────────────────────────────────────────────────────

type AggregationOption = { label: TranslationKey; value: AggregationMath | undefined };

const AGGREGATION_OPTIONS: AggregationOption[] = [
  { label: 'editChart.totalEvents', value: undefined },
  { label: 'editChart.uniqueUsers', value: 'dau' },
];

type BarChartModeOption = { label: TranslationKey; value: BarChartMode };

const BAR_CHART_MODE_OPTIONS: BarChartModeOption[] = [
  { label: 'editChart.stacked', value: 'stacked' },
  { label: 'editChart.normal', value: 'normal' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditChartScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { metrics, updateMetric, removeMetric } = useDashboardConfig();
  const { events, isLoading: eventsLoading } = useEventDefinitions();
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const metric = metrics.find((m) => m.id === id);

  // ── Local editable state ──────────────────────────────────────────────────
  const [label, setLabel] = useState(metric?.label ?? '');
  const [displayName, setDisplayName] = useState(metric?.displayName ?? '');
  const [eventName, setEventName] = useState(metric?.eventName ?? '');
  const [math, setMath] = useState<AggregationMath | undefined>(metric?.math);
  const [breakdownProperty, setBreakdownProperty] = useState<string | undefined>(metric?.breakdownProperty);
  const [barChartMode, setBarChartMode] = useState<BarChartMode>(metric?.barChartMode ?? 'stacked');
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [initialized, setInitialized] = useState(false);
  const isDeletingRef = useRef(false);

  // Sync local state once metric finishes loading from AsyncStorage
  useEffect(() => {
    if (metric && !initialized) {
      setLabel(metric.label);
      setDisplayName(metric.displayName ?? '');
      setEventName(metric.eventName);
      setMath(metric.math);
      setBreakdownProperty(metric.breakdownProperty);
      setBarChartMode(metric.barChartMode ?? 'stacked');
      setInitialized(true);
    }
  }, [metric, initialized]);

  const isFunnel = metric?.chartType === 'FunnelChart';
  const isBarChart = metric?.chartType === 'BarChart';
  const isLineChart = metric?.chartType === 'LineChart';

  // Property definitions for breakdown picker
  const { data: properties, isLoading: propertiesLoading } = usePropertyDefinitions(
    (isBarChart || isLineChart) ? eventName : '',
  );

  const filteredProperties = useMemo(() => {
    const term = propertySearch.trim().toLowerCase();
    if (!properties) return [];
    if (!term) return properties;
    return properties.filter((p) => p.name.toLowerCase().includes(term));
  }, [properties, propertySearch]);

  const hasChanges =
    label.trim() !== (metric?.label ?? '') ||
    displayName.trim() !== (metric?.displayName ?? '') ||
    (!isFunnel && eventName !== (metric?.eventName ?? '')) ||
    (!isFunnel && math !== metric?.math) ||
    (isBarChart && breakdownProperty !== metric?.breakdownProperty) ||
    (isBarChart && barChartMode !== (metric?.barChartMode ?? 'stacked')) ||
    (isLineChart && breakdownProperty !== metric?.breakdownProperty);

  const canSave = label.trim().length > 0;

  const filteredEvents = useMemo(() => {
    const term = eventSearch.trim().toLowerCase();
    if (!term) return events;
    return events.filter((e) => e.name.toLowerCase().includes(term));
  }, [events, eventSearch]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSave() {
    if (!metric || !canSave) return;

    const changes: Partial<Pick<typeof metric, 'label' | 'eventName' | 'math' | 'breakdownProperty' | 'barChartMode' | 'displayName'>> = {};

    if (label.trim() !== metric.label) {
      changes.label = label.trim();
    }
    const trimmedDisplayName = displayName.trim() || undefined;
    if (trimmedDisplayName !== (metric.displayName ?? undefined)) {
      changes.displayName = trimmedDisplayName;
    }
    if (!isFunnel && eventName !== metric.eventName) {
      changes.eventName = eventName;
    }
    if (!isFunnel && math !== metric.math) {
      changes.math = math;
    }
    if (isBarChart && breakdownProperty !== metric.breakdownProperty) {
      changes.breakdownProperty = breakdownProperty;
    }
    if (isLineChart && breakdownProperty !== metric.breakdownProperty) {
      changes.breakdownProperty = breakdownProperty;
    }
    if (isBarChart && barChartMode !== (metric.barChartMode ?? 'stacked')) {
      changes.barChartMode = barChartMode;
    }

    const eventOrMathChanged =
      changes.eventName !== undefined || changes.math !== undefined;
    const breakdownChanged = changes.breakdownProperty !== undefined;

    updateMetric(metric.id, changes).then(() => {
      if (eventOrMathChanged || breakdownChanged) {
        // Remove all cached data for this metric (all time filters)
        queryClient.removeQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key.length >= 3 && key[2] === metric.id;
          },
        });
      }
      router.back();
    });
  }

  function handleDelete() {
    if (!metric) return;
    Alert.alert(
      t('editChart.deleteTitle').replace('{label}', metric.label),
      t('editChart.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            isDeletingRef.current = true;
            removeMetric(metric.id).then(() => {
              router.dismissAll();
            });
          },
        },
      ],
    );
  }

  // ── Metric not found guard ────────────────────────────────────────────────

  if (!metric) {
    // During deletion transition: screen still mounted but metric already removed from state.
    // Return null to avoid crash — router.back() will unmount this shortly.
    if (isDeletingRef.current) return null;
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D] items-center justify-center">
        <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-medium text-base">
          {t('editChart.notFound')}
        </Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary font-inter-semibold text-base">{t('common.back')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessible
          accessibilityLabel={t('editChart.backLabel')}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={isDark ? '#FFFFFF' : '#171717'} />
        </Pressable>
        <Text className="flex-1 text-center text-text-primary dark:text-[#FFFFFF] font-inter-bold text-lg">
          {t('editChart.title')}
        </Text>
        {/* Spacer to center title */}
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        {/* ── Section: Nombre ──────────────────────────────────────────── */}
        <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2 mt-2">
          {t('editChart.nameLabel')}
        </Text>
        <View className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-3">
          <TextInput
            className="text-text-primary dark:text-[#FFFFFF] font-inter text-base"
            value={label}
            onChangeText={setLabel}
            placeholder={t('editChart.namePlaceholder')}
            placeholderTextColor="#737373"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>

        {/* ── Section: Custom Display Name ─────────────────────────────── */}
        <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2 mt-6">
          {t('editChart.displayNameLabel') ?? 'DISPLAY NAME'}
        </Text>
        <View className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-3">
          <TextInput
            className="text-text-primary dark:text-[#FFFFFF] font-inter text-base"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('editChart.displayNamePlaceholder') ?? 'Custom title (optional)'}
            placeholderTextColor="#737373"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>
        <Text className="text-text-tertiary text-xs mt-1 ml-1">
          {t('editChart.displayNameHint') ?? 'Overrides the card title. Leave empty to use label.'}
        </Text>

        {/* ── Section: Evento (solo para no-funnel) ────────────────────── */}
        {!isFunnel && (
          <>
            <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2 mt-6">
              {t('editChart.eventLabel')}
            </Text>
            <Pressable
              className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-3 flex-row items-center justify-between"
              onPress={() => {
                setEventSearch('');
                setShowEventPicker(true);
              }}
            >
              <Text className="text-text-primary dark:text-[#FFFFFF] font-inter text-base flex-1" numberOfLines={1}>
                {eventName}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#A3A3A3" />
            </Pressable>
          </>
        )}

        {/* ── Section: Agregación (solo para no-funnel) ────────────────── */}
        {!isFunnel && (
          <>
            <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2 mt-6">
              {t('editChart.aggregationLabel')}
            </Text>
            <View className="flex-row bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] overflow-hidden">
              {AGGREGATION_OPTIONS.map((opt) => {
                const isSelected = math === opt.value;
                return (
                  <Pressable
                    key={opt.label}
                    className={`flex-1 py-3 items-center ${isSelected ? 'bg-primary' : ''}`}
                    onPress={() => setMath(opt.value)}
                  >
                    <Text
                      className={`font-inter-semibold text-sm ${isSelected ? 'text-white' : 'text-text-secondary dark:text-[#A3A3A3]'}`}
                    >
                      {t(opt.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ── Section: Breakdown (BarChart y LineChart) ────────── */}
        {(isBarChart || isLineChart) && !isFunnel && (
          <>
            <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2 mt-6">
              {t('editChart.breakdownLabel')}
            </Text>
            <Pressable
              className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-3 flex-row items-center justify-between"
              onPress={() => {
                setPropertySearch('');
                setShowPropertyPicker(true);
              }}
            >
              <Text
                className={`font-inter text-base flex-1 ${breakdownProperty ? 'text-text-primary dark:text-[#FFFFFF]' : 'text-text-tertiary'}`}
                numberOfLines={1}
              >
                {breakdownProperty ?? t('editChart.noBreakdown')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#A3A3A3" />
            </Pressable>
          </>
        )}

        {/* ── Section: Modo BarChart (solo con breakdown activo) ────────── */}
        {isBarChart && breakdownProperty && (
          <>
            <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2 mt-6">
              {t('editChart.modeLabel')}
            </Text>
            <View className="flex-row bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] overflow-hidden">
              {BAR_CHART_MODE_OPTIONS.map((opt) => {
                const isSelected = barChartMode === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    className={`flex-1 py-3 items-center ${isSelected ? 'bg-primary' : ''}`}
                    onPress={() => setBarChartMode(opt.value)}
                  >
                    <Text
                      className={`font-inter-semibold text-sm ${isSelected ? 'text-white' : 'text-text-secondary dark:text-[#A3A3A3]'}`}
                    >
                      {t(opt.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ── Info for funnel ────────────────────────────── */}
        {isFunnel && (
          <View className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-3 mt-6">
            <Text className="text-text-tertiary font-inter text-sm">
              {t('editChart.funnelEditInfo')}
            </Text>
          </View>
        )}

        {/* ── Spacer ──────────────────────────────────────────────────── */}
        <View className="h-10" />

        {/* ── Save button ─────────────────────────────────────────────── */}
        <Pressable
          className={`rounded-xl py-4 items-center ${canSave && hasChanges ? 'bg-primary' : 'bg-background-tertiary dark:bg-[#262626]'}`}
          onPress={handleSave}
          disabled={!canSave || !hasChanges}
        >
          <Text
            className={`font-inter-bold text-base ${canSave && hasChanges ? 'text-white' : 'text-text-tertiary'}`}
          >
            {t('common.save')}
          </Text>
        </Pressable>

        {/* ── Delete button ─────────────────────────────────────── */}
        <Pressable
          className="rounded-xl py-4 items-center mt-4 border border-red-500/30 bg-red-500/10"
          onPress={handleDelete}
        >
          <Text className="font-inter-bold text-base text-red-400">{t('common.delete')}</Text>
        </Pressable>

        {/* Bottom padding for scroll */}
        <View className="h-8" />
      </ScrollView>

      {/* ── Event Picker Modal ─────────────────────────────────────────── */}
      <Modal visible={showEventPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D]" edges={['top']}>
          {/* Modal header */}
          <View className="flex-row items-center px-4 pt-2 pb-3">
            <Pressable
              onPress={() => setShowEventPicker(false)}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#171717'} />
            </Pressable>
            <Text className="flex-1 text-center text-text-primary dark:text-[#FFFFFF] font-inter-bold text-lg">
              {t('editChart.selectEvent')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search */}
          <View className="mx-4 mb-3 bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-2 flex-row items-center">
            <Ionicons name="search" size={18} color="#737373" />
            <TextInput
              className="flex-1 ml-2 text-text-primary dark:text-[#FFFFFF] font-inter text-base"
              placeholder={t('editChart.searchEvent')}
              placeholderTextColor="#737373"
              value={eventSearch}
              onChangeText={setEventSearch}
              autoCorrect={false}
              autoFocus
            />
          </View>

          {/* Event list */}
          <FlatList
            data={filteredEvents}
            keyExtractor={(item: PostHogEvent) => item.name}
            renderItem={({ item }: { item: PostHogEvent }) => (
              <Pressable
                className={`mx-4 px-4 py-3 rounded-xl mb-1 ${item.name === eventName ? 'bg-primary/20 border border-primary/40' : 'bg-background-secondary dark:bg-[#1A1A1A]'}`}
                onPress={() => {
                  setEventName(item.name);
                  // T013: Reset breakdown when event changes
                  setBreakdownProperty(undefined);
                  setBarChartMode('stacked');
                  setShowEventPicker(false);
                }}
              >
                <Text className="text-text-primary dark:text-[#FFFFFF] font-inter text-base" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.volume30Day != null && (
                  <Text className="text-text-tertiary font-inter text-xs mt-0.5">
                    {t('editChart.eventVolume').replace('{count}', new Intl.NumberFormat(getIntlLocale(locale)).format(item.volume30Day))}
                  </Text>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center mt-10">
                <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter text-sm">
                  {eventsLoading ? t('editChart.loadingEvents') : t('editChart.noEventsFound')}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* ── Property Picker Modal ──────────────────────────────────────── */}
      <Modal visible={showPropertyPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D]" edges={['top']}>
          {/* Modal header */}
          <View className="flex-row items-center px-4 pt-2 pb-3">
            <Pressable
              onPress={() => setShowPropertyPicker(false)}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#171717'} />
            </Pressable>
            <Text className="flex-1 text-center text-text-primary dark:text-[#FFFFFF] font-inter-bold text-lg">
              {t('editChart.breakdownPropertyTitle')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search */}
          <View className="mx-4 mb-3 bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-2 flex-row items-center">
            <Ionicons name="search" size={18} color="#737373" />
            <TextInput
              className="flex-1 ml-2 text-text-primary dark:text-[#FFFFFF] font-inter text-base"
              placeholder={t('editChart.searchProperty')}
              placeholderTextColor="#737373"
              value={propertySearch}
              onChangeText={setPropertySearch}
              autoCorrect={false}
              autoFocus
            />
          </View>

          {/* "Sin breakdown" option */}
          <Pressable
            className={`mx-4 px-4 py-3 rounded-xl mb-1 ${!breakdownProperty ? 'bg-primary/20 border border-primary/40' : 'bg-background-secondary dark:bg-[#1A1A1A]'}`}
            onPress={() => {
              setBreakdownProperty(undefined);
              setShowPropertyPicker(false);
            }}
          >
            <Text className="text-text-primary dark:text-[#FFFFFF] font-inter text-base">{t('editChart.noBreakdown')}</Text>
          </Pressable>

          {/* Property list */}
          <FlatList
            data={filteredProperties}
            keyExtractor={(item: PostHogProperty) => item.name}
            renderItem={({ item }: { item: PostHogProperty }) => (
              <Pressable
                className={`mx-4 px-4 py-3 rounded-xl mb-1 ${item.name === breakdownProperty ? 'bg-primary/20 border border-primary/40' : 'bg-background-secondary dark:bg-[#1A1A1A]'}`}
                onPress={() => {
                  setBreakdownProperty(item.name);
                  setShowPropertyPicker(false);
                }}
              >
                <Text className="text-text-primary dark:text-[#FFFFFF] font-inter text-base" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-text-tertiary font-inter text-xs mt-0.5">
                  {item.propertyType}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center mt-10">
                <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter text-sm">
                  {propertiesLoading
                    ? t('editChart.loadingProperties')
                    : t('editChart.noProperties')}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
