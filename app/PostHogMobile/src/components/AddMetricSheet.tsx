import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput, useBottomSheetScrollableCreator } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import React, { forwardRef, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEventDefinitions } from '../hooks/useEventDefinitions';
import { usePropertyDefinitions } from '../hooks/usePropertyDefinitions';
import { useLocale, useTheme } from '../hooks';
import type { BarChartMode, ChartType, LineChartMode, PostHogEvent } from '../types';

const FUNNEL_MAX_STEPS = 10;

interface AddMetricSheetProps {
  onConfirm: (input: {
    eventName: string;
    label: string;
    chartType: ChartType;
    funnelEvents?: string[];
    breakdownProperty?: string;
    barChartMode?: BarChartMode;
    lineChartMode?: LineChartMode;
  }) => Promise<void>;
}

type Step = 'event' | 'chartType' | 'funnelSteps' | 'barChartConfig' | 'lineChartConfig';

export const AddMetricSheet = forwardRef<BottomSheet, AddMetricSheetProps>(function AddMetricSheet(
  { onConfirm },
  ref,
) {
  const snapPoints = useMemo(() => ['70%', '92%'], []);
  const { top: topInset } = useSafeAreaInsets();
  const { events, isLoading, isError, refetch } = useEventDefinitions();
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const bottomSheetScrollableCreator = useBottomSheetScrollableCreator();
  const [search, setSearch] = useState('');
  const [funnelSearch, setFunnelSearch] = useState('');
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [step, setStep] = useState<Step>('event');
  const [selectedEvent, setSelectedEvent] = useState<PostHogEvent | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('MetricCard');
  const [funnelSteps, setFunnelSteps] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [funnelName, setFunnelName] = useState('');
  const [breakdownProperty, setBreakdownProperty] = useState<string | undefined>(undefined);
  const [barChartMode, setBarChartMode] = useState<BarChartMode>('stacked');
  const [lineChartMode, setLineChartMode] = useState<LineChartMode>('line');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');

  // Property definitions for breakdown picker (only loads when on barChartConfig step with an event)
  const { data: properties, isLoading: propertiesLoading } = usePropertyDefinitions(
    (step === 'barChartConfig' || step === 'lineChartConfig') && selectedEvent ? selectedEvent.name : '',
  );

  const filteredProperties = useMemo(() => {
    const term = propertySearch.trim().toLowerCase();
    if (!properties) return [];
    if (!term) return properties;
    return properties.filter((p) => p.name.toLowerCase().includes(term));
  }, [properties, propertySearch]);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return events;
    return events.filter((event) => event.name.toLowerCase().includes(term));
  }, [events, search]);

  const filteredFunnelEvents = useMemo(() => {
    const term = funnelSearch.trim().toLowerCase();
    if (!term) return events;
    return events.filter((event) => event.name.toLowerCase().includes(term));
  }, [events, funnelSearch]);

  function resetSheet() {
    setSearch('');
    setFunnelSearch('');
    setShowEventPicker(false);
    setShowPropertyPicker(false);
    setPropertySearch('');
    setStep('event');
    setSelectedEvent(null);
    setSelectedChartType('MetricCard');
    setFunnelSteps([]);
    setCustomLabel('');
    setFunnelName('');
    setBreakdownProperty(undefined);
    setBarChartMode('stacked');
    setLineChartMode('line');
  }

  function handleChartTypeNext() {
    if (selectedChartType === 'FunnelChart' && selectedEvent) {
      setFunnelSteps([selectedEvent.name]);
      setFunnelName(selectedEvent.name);
      setFunnelSearch('');
      setStep('funnelSteps');
    } else if (selectedChartType === 'BarChart') {
      setBreakdownProperty(undefined);
      setBarChartMode('stacked');
      setStep('barChartConfig');
    } else if (selectedChartType === 'LineChart') {
      setBreakdownProperty(undefined);
      setLineChartMode('line');
      setStep('lineChartConfig');
    } else {
      handleConfirm();
    }
  }

  async function handleConfirm() {
    if (!selectedEvent) return;
    setIsSubmitting(true);
    try {
      if (selectedChartType === 'FunnelChart') {
        await onConfirm({
          eventName: funnelSteps[0] ?? selectedEvent.name,
          label: funnelName.trim(),
          chartType: 'FunnelChart',
          funnelEvents: funnelSteps,
        });
      } else if (selectedChartType === 'BarChart') {
        await onConfirm({
          eventName: selectedEvent.name,
          label: customLabel.trim(),
          chartType: 'BarChart',
          ...(breakdownProperty ? { breakdownProperty, barChartMode } : {}),
        });
      } else if (selectedChartType === 'LineChart') {
        await onConfirm({
          eventName: selectedEvent.name,
          label: customLabel.trim(),
          chartType: 'LineChart',
          lineChartMode,
          ...(breakdownProperty ? { breakdownProperty } : {}),
        });
      } else {
        await onConfirm({
          eventName: selectedEvent.name,
          label: customLabel.trim(),
          chartType: selectedChartType,
        });
      }
      resetSheet();
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderEvent = ({ item }: { item: PostHogEvent }) => {
    const isSelected = selectedEvent?.name === item.name;
    return (
      <Pressable
        onPress={() => {
          setSelectedEvent(item);
          setCustomLabel(item.name);
          setStep('chartType');
        }}
        className={`mx-4 mb-3 rounded-xl border p-4 ${
          isSelected ? 'border-primary bg-primary/10' : 'border-border dark:border-[#262626] bg-background-secondary dark:bg-[#1A1A1A]'
        }`}
      >
        <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-base">{item.name}</Text>
        <Text className="text-text-tertiary text-sm mt-1">
          {t('addMetric.last30Days').replace('{count}', String(item.volume30Day ?? '—'))}
        </Text>
      </Pressable>
    );
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      topInset={topInset}
      enablePanDownToClose
      keyboardBehavior="extend"
      keyboardBlursBehavior="restore"
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      backgroundStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: '#737373' }}
      onChange={(index) => {
        if (index === -1) {
          resetSheet();
        }
      }}
    >
      <View className="flex-1">
        <View className="px-4 pb-4 border-b border-border dark:border-[#262626]">
          <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-bold text-xl">
            {step === 'event'
              ? t('addMetric.stepAddTitle')
              : step === 'chartType'
              ? t('addMetric.stepChartTypeTitle')
              : step === 'barChartConfig'
              ? t('addMetric.stepBarConfigTitle')
              : step === 'lineChartConfig'
              ? t('addMetric.stepLineConfigTitle')
              : t('addMetric.stepFunnelTitle')}
          </Text>
          <Text className="text-text-tertiary text-sm mt-1">
            {step === 'event'
              ? t('addMetric.stepAddDescription')
              : step === 'chartType'
              ? t('addMetric.stepChartTypeDescription')
              : step === 'barChartConfig'
              ? t('addMetric.stepBarConfigDescription')
              : step === 'lineChartConfig'
              ? t('addMetric.stepLineConfigDescription')
              : t('addMetric.stepFunnelDescription').replace('{max}', String(FUNNEL_MAX_STEPS))}
          </Text>
        </View>

        {step === 'event' ? (
          <View className="flex-1 pt-4">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('addMetric.searchEvent')}
              placeholderTextColor="#737373"
              className="mx-4 mb-4 rounded-xl bg-background dark:bg-[#0D0D0D] px-4 py-3 text-text-primary dark:text-[#FFFFFF]"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#2DD4BF" />
              </View>
            ) : isError ? (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-base text-center">
                  {t('addMetric.eventsLoadError')}
                </Text>
                <Pressable
                  onPress={() => refetch()}
                  className="mt-4 rounded-full bg-primary px-5 py-3"
                >
                  <Text className="text-white font-inter-semibold">{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : (
              <FlashList
                data={filteredEvents}
                renderItem={renderEvent}
                keyExtractor={(item: PostHogEvent) => item.name}
                renderScrollComponent={bottomSheetScrollableCreator}
                contentContainerStyle={{ paddingVertical: 4, paddingBottom: 40 }}
              />
            )}
          </View>
        ) : step === 'chartType' ? (
          <BottomSheetScrollView
            className="flex-1 px-4 pt-6"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            <Pressable
              onPress={() => setStep('event')}
              className="self-start rounded-full border border-border dark:border-[#262626] px-3 py-1"
            >
              <Text className="text-text-secondary dark:text-[#A3A3A3] text-sm">{t('common.back')}</Text>
            </Pressable>

            {/* Chart type options */}
            <View className="mt-5 gap-3">
              {([
                {
                  type: 'MetricCard' as ChartType,
                  icon: 'analytics-outline' as const,
                  title: 'MetricCard',
                  description: t('addMetric.chartMetricCardDescription'),
                },
                {
                  type: 'BarChart' as ChartType,
                  icon: 'bar-chart-outline' as const,
                  title: 'BarChart',
                  description: t('addMetric.chartBarChartDescription'),
                },
                {
                  type: 'LineChart' as ChartType,
                  icon: 'trending-up-outline' as const,
                  title: 'LineChart',
                  description: t('addMetric.chartLineChartDescription'),
                },
                {
                  type: 'FunnelChart' as ChartType,
                  icon: 'funnel-outline' as const,
                  title: 'FunnelChart',
                  description: t('addMetric.chartFunnelChartDescription'),
                },
              ] as const).map(({ type, icon, title, description }) => {
                const isSelected = selectedChartType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedChartType(type)}
                    className={`rounded-2xl border p-4 flex-row items-center gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border dark:border-[#262626] bg-background dark:bg-[#0D0D0D]'
                    }`}
                  >
                    <Ionicons
                      name={icon}
                      size={24}
                      color={isSelected ? '#2DD4BF' : '#737373'}
                    />
                    <View className="flex-1">
                      <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-base">
                        {title}
                      </Text>
                      <Text className="text-text-secondary dark:text-[#A3A3A3] text-sm mt-0.5">{description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-4 rounded-xl bg-background dark:bg-[#0D0D0D] p-4">
              <Text className="text-text-tertiary text-xs uppercase tracking-widest">{t('common.event')}</Text>
              <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-base mt-1">
                {selectedEvent?.name}
              </Text>
            </View>

            <View className="mt-4 rounded-xl bg-background dark:bg-[#0D0D0D] p-4">
              <Text className="text-text-tertiary text-xs uppercase tracking-widest mb-2">{t('common.name')}</Text>
              <BottomSheetTextInput
                value={customLabel}
                onChangeText={setCustomLabel}
                placeholder={t('addMetric.visualizationName')}
                placeholderTextColor="#737373"
                style={{
                  borderRadius: 12,
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: isDark ? '#FFFFFF' : '#171717',
                  fontFamily: 'Inter',
                  fontSize: 16,
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Pressable
              onPress={handleChartTypeNext}
              disabled={isSubmitting || (selectedChartType !== 'FunnelChart' && selectedChartType !== 'BarChart' && selectedChartType !== 'LineChart' && customLabel.trim().length === 0)}
              className={`mt-5 rounded-full px-5 py-4 items-center ${
                isSubmitting || (selectedChartType !== 'FunnelChart' && selectedChartType !== 'BarChart' && selectedChartType !== 'LineChart' && customLabel.trim().length === 0)
                  ? 'bg-background-tertiary dark:bg-[#262626]'
                  : 'bg-primary'
              }`}
            >
              <Text
                className={`font-inter-semibold text-base ${
                  isSubmitting || (selectedChartType !== 'FunnelChart' && selectedChartType !== 'BarChart' && selectedChartType !== 'LineChart' && customLabel.trim().length === 0)
                    ? 'text-text-tertiary'
                    : 'text-white'
                }`}
              >
                {isSubmitting
                  ? t('common.adding')
                  : selectedChartType === 'FunnelChart' || selectedChartType === 'BarChart' || selectedChartType === 'LineChart'
                  ? t('common.continue')
                  : t('common.add')}
              </Text>
            </Pressable>
          </BottomSheetScrollView>
        ) : step === 'barChartConfig' ? (
          /* ── BarChart config step ──────────────────────────────────────── */
          <View className="flex-1 px-4 pt-4">
            <Pressable
              onPress={() => setStep('chartType')}
              className="self-start rounded-full border border-border dark:border-[#262626] px-3 py-1 mb-3"
            >
              <Text className="text-text-secondary dark:text-[#A3A3A3] text-sm">{t('common.back')}</Text>
            </Pressable>

            {/* Event info */}
            <View className="rounded-xl bg-background dark:bg-[#0D0D0D] p-4 mb-4">
              <Text className="text-text-tertiary text-xs uppercase tracking-widest">{t('common.event')}</Text>
              <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-base mt-1">
                {selectedEvent?.name}
              </Text>
            </View>

            {/* Breakdown property picker */}
            <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2">
              {t('addMetric.breakdownOptional')}
            </Text>
            <Pressable
              className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-3 flex-row items-center justify-between mb-4"
              onPress={() => {
                setPropertySearch('');
                setShowPropertyPicker(true);
              }}
            >
              <Text
                className={`font-inter text-base flex-1 ${breakdownProperty ? 'text-text-primary dark:text-[#FFFFFF]' : 'text-text-tertiary'}`}
                numberOfLines={1}
              >
                {breakdownProperty ?? t('addMetric.noBreakdown')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#A3A3A3" />
            </Pressable>

            {/* Bar chart mode selector (only when breakdown is active) */}
            {breakdownProperty && (
              <>
                <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2">
                  {t('addMetric.modeLabel')}
                </Text>
                <View className="flex-row bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] overflow-hidden mb-4">
                  {([
                    { label: t('charts.stacked'), value: 'stacked' as BarChartMode },
                    { label: t('charts.normal'), value: 'normal' as BarChartMode },
                  ]).map((opt) => {
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
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Property picker modal */}
            <Modal
              visible={showPropertyPicker}
              animationType="slide"
              transparent
              onRequestClose={() => {
                setShowPropertyPicker(false);
                setPropertySearch('');
              }}
            >
              <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View
                  className="rounded-t-2xl bg-background-secondary dark:bg-[#1A1A1A]"
                  style={{ maxHeight: '80%' }}
                >
                  {/* Header */}
                  <View className="px-4 pt-4 pb-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3">
                    <TextInput
                      value={propertySearch}
                      onChangeText={setPropertySearch}
                      placeholder={t('addMetric.searchProperty')}
                      placeholderTextColor="#737373"
                      className="flex-1 bg-background dark:bg-[#0D0D0D] rounded-xl px-4 py-3 text-text-primary dark:text-[#FFFFFF]"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                    <Pressable
                      onPress={() => {
                        setShowPropertyPicker(false);
                        setPropertySearch('');
                      }}
                      hitSlop={8}
                    >
                      <Text className="text-primary font-inter-semibold">{t('common.cancel')}</Text>
                    </Pressable>
                  </View>

                  {/* Property list */}
                  {propertiesLoading ? (
                    <View className="items-center justify-center py-10">
                      <ActivityIndicator size="large" color="#2DD4BF" />
                    </View>
                  ) : (
                    <FlatList
                      data={filteredProperties}
                      keyExtractor={(item) => item.name}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingBottom: 32 }}
                      ListHeaderComponent={
                        <Pressable
                          onPress={() => {
                            setBreakdownProperty(undefined);
                            setShowPropertyPicker(false);
                            setPropertySearch('');
                          }}
                          className="px-4 py-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3"
                        >
                          <Ionicons name="close-circle-outline" size={20} color="#737373" />
                          <Text className="text-text-secondary dark:text-[#A3A3A3] text-sm">{t('addMetric.noBreakdown')}</Text>
                        </Pressable>
                      }
                      ListEmptyComponent={
                        <View className="items-center justify-center py-10">
                          <Text className="text-text-tertiary text-sm">
                            {t('addMetric.noProperties')}
                          </Text>
                        </View>
                      }
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() => {
                            setBreakdownProperty(item.name);
                            setShowPropertyPicker(false);
                            setPropertySearch('');
                          }}
                          className="px-4 py-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3"
                        >
                          <Ionicons
                            name={breakdownProperty === item.name ? 'checkmark-circle' : 'ellipse-outline'}
                            size={20}
                            color={breakdownProperty === item.name ? '#2DD4BF' : '#737373'}
                          />
                          <View className="flex-1">
                            <Text className="text-text-primary dark:text-[#FFFFFF] text-sm" numberOfLines={1}>
                              {item.name}
                            </Text>
                          </View>
                        </Pressable>
                      )}
                    />
                  )}
                </View>
              </View>
            </Modal>

            {/* Add button */}
            <Pressable
              onPress={handleConfirm}
              disabled={isSubmitting || customLabel.trim().length === 0}
              className={`mt-3 rounded-full px-5 py-4 items-center ${
                isSubmitting || customLabel.trim().length === 0
                  ? 'bg-background-tertiary dark:bg-[#262626]'
                  : 'bg-primary'
              }`}
            >
              <Text
                className={`font-inter-semibold text-base ${
                  isSubmitting || customLabel.trim().length === 0
                    ? 'text-text-tertiary'
                    : 'text-white'
                }`}
              >
                {isSubmitting ? t('common.adding') : t('common.add')}
              </Text>
            </Pressable>
          </View>
        ) : step === 'lineChartConfig' ? (
          /* ── LineChart config step ─────────────────────────────────────── */
          <View className="flex-1 px-4 pt-4">
            <Pressable
              onPress={() => setStep('chartType')}
              className="self-start rounded-full border border-border dark:border-[#262626] px-3 py-1 mb-3"
            >
              <Text className="text-text-secondary dark:text-[#A3A3A3] text-sm">{t('common.back')}</Text>
            </Pressable>

            {/* Event info */}
            <View className="rounded-xl bg-background dark:bg-[#0D0D0D] p-4 mb-4">
              <Text className="text-text-tertiary text-xs uppercase tracking-widest">{t('common.event')}</Text>
              <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-base mt-1">
                {selectedEvent?.name}
              </Text>
            </View>

            {/* Line chart mode selector */}
            <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2">
              {t('addMetric.lineChartTypeLabel')}
            </Text>
            <View className="flex-row bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] overflow-hidden mb-4">
              {([
                { label: t('addMetric.lineModeLine'), value: 'line' as LineChartMode },
                { label: t('addMetric.lineModeCumulative'), value: 'cumulative' as LineChartMode },
              ]).map((opt) => {
                const isSelected = lineChartMode === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    className={`flex-1 py-3 items-center ${isSelected ? 'bg-primary' : ''}`}
                    onPress={() => setLineChartMode(opt.value)}
                  >
                    <Text
                      className={`font-inter-semibold text-sm ${isSelected ? 'text-white' : 'text-text-secondary dark:text-[#A3A3A3]'}`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Breakdown property picker */}
            <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-xs uppercase tracking-wider mb-2">
              {t('addMetric.breakdownOptional')}
            </Text>
            <Pressable
              className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl border border-border dark:border-[#262626] px-4 py-3 flex-row items-center justify-between mb-4"
              onPress={() => {
                setPropertySearch('');
                setShowPropertyPicker(true);
              }}
            >
              <Text
                className={`font-inter text-base flex-1 ${breakdownProperty ? 'text-text-primary dark:text-[#FFFFFF]' : 'text-text-tertiary'}`}
                numberOfLines={1}
              >
                {breakdownProperty ?? t('addMetric.noBreakdown')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#A3A3A3" />
            </Pressable>

            {/* Property picker modal (reuses same state/modal used by barChartConfig) */}
            <Modal
              visible={showPropertyPicker}
              animationType="slide"
              transparent
              onRequestClose={() => {
                setShowPropertyPicker(false);
                setPropertySearch('');
              }}
            >
              <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View
                  className="rounded-t-2xl bg-background-secondary dark:bg-[#1A1A1A]"
                  style={{ maxHeight: '80%' }}
                >
                  <View className="px-4 pt-4 pb-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3">
                    <TextInput
                      value={propertySearch}
                      onChangeText={setPropertySearch}
                      placeholder={t('addMetric.searchProperty')}
                      placeholderTextColor="#737373"
                      className="flex-1 bg-background dark:bg-[#0D0D0D] rounded-xl px-4 py-3 text-text-primary dark:text-[#FFFFFF]"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                    <Pressable
                      onPress={() => {
                        setShowPropertyPicker(false);
                        setPropertySearch('');
                      }}
                      hitSlop={8}
                    >
                      <Text className="text-primary font-inter-semibold">{t('common.cancel')}</Text>
                    </Pressable>
                  </View>

                  {propertiesLoading ? (
                    <View className="items-center justify-center py-10">
                      <ActivityIndicator size="large" color="#2DD4BF" />
                    </View>
                  ) : (
                    <FlatList
                      data={filteredProperties}
                      keyExtractor={(item) => item.name}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingBottom: 32 }}
                      ListHeaderComponent={
                        <Pressable
                          onPress={() => {
                            setBreakdownProperty(undefined);
                            setShowPropertyPicker(false);
                            setPropertySearch('');
                          }}
                          className="px-4 py-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3"
                        >
                          <Ionicons name="close-circle-outline" size={20} color="#737373" />
                          <Text className="text-text-secondary dark:text-[#A3A3A3] text-sm">{t('addMetric.noBreakdown')}</Text>
                        </Pressable>
                      }
                      ListEmptyComponent={
                        <View className="items-center justify-center py-10">
                          <Text className="text-text-tertiary text-sm">
                            {t('addMetric.noProperties')}
                          </Text>
                        </View>
                      }
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() => {
                            setBreakdownProperty(item.name);
                            setShowPropertyPicker(false);
                            setPropertySearch('');
                          }}
                          className="px-4 py-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3"
                        >
                          <Ionicons
                            name={breakdownProperty === item.name ? 'checkmark-circle' : 'ellipse-outline'}
                            size={20}
                            color={breakdownProperty === item.name ? '#2DD4BF' : '#737373'}
                          />
                          <View className="flex-1">
                            <Text className="text-text-primary dark:text-[#FFFFFF] text-sm" numberOfLines={1}>
                              {item.name}
                            </Text>
                          </View>
                        </Pressable>
                      )}
                    />
                  )}
                </View>
              </View>
            </Modal>

            {/* Add button */}
            <Pressable
              onPress={handleConfirm}
              disabled={isSubmitting || customLabel.trim().length === 0}
              className={`mt-3 rounded-full px-5 py-4 items-center ${
                isSubmitting || customLabel.trim().length === 0
                  ? 'bg-background-tertiary dark:bg-[#262626]'
                  : 'bg-primary'
              }`}
            >
              <Text
                className={`font-inter-semibold text-base ${
                  isSubmitting || customLabel.trim().length === 0
                    ? 'text-text-tertiary'
                    : 'text-white'
                }`}
              >
                {isSubmitting ? t('common.adding') : t('common.add')}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* ── Funnel steps step ──────────────────────────────────────────── */
          <View className="flex-1 px-4 pt-4">
            <Pressable
              onPress={() => setStep('chartType')}
              className="self-start rounded-full border border-border dark:border-[#262626] px-3 py-1 mb-3"
            >
              <Text className="text-text-secondary dark:text-[#A3A3A3] text-sm">{t('common.back')}</Text>
            </Pressable>

            {/* Current steps list */}
            <ScrollView style={{ maxHeight: 180 }} className="mb-3">
              {funnelSteps.map((eventName, index) => (
                <View
                  key={`${eventName}-${index}`}
                  className="flex-row items-center bg-background dark:bg-[#0D0D0D] rounded-xl px-3 py-2 mb-2 border border-border dark:border-[#262626]"
                >
                  <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3">
                    <Text className="text-white text-xs font-inter-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-text-primary dark:text-[#FFFFFF] text-sm flex-1" numberOfLines={1}>
                    {eventName}
                  </Text>
                  {funnelSteps.length > 2 && (
                    <Pressable
                      onPress={() =>
                        setFunnelSteps((prev) => prev.filter((_, i) => i !== index))
                      }
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle" size={18} color="#737373" />
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Counter */}
            <Text className="text-xs text-text-tertiary mb-2">
              {t('addMetric.stepsCounter').replace('{count}', String(funnelSteps.length)).replace('{max}', String(FUNNEL_MAX_STEPS))}
            </Text>

            {/* Dropdown to add more events */}
            {funnelSteps.length < FUNNEL_MAX_STEPS && (
              <Pressable
                onPress={() => setShowEventPicker(true)}
                className="rounded-xl border border-dashed border-primary/60 bg-background dark:bg-[#0D0D0D] px-4 py-3 flex-row items-center justify-between mb-2"
              >
                <Text className="text-text-tertiary text-sm">{t('addMetric.addStep')}</Text>
                <Ionicons name="chevron-down" size={18} color="#737373" />
              </Pressable>
            )}

            {/* Funnel name input */}
            <View className="mt-2 rounded-xl bg-background dark:bg-[#0D0D0D] p-4">
              <Text className="text-text-tertiary text-xs uppercase tracking-widest mb-2">{t('addMetric.funnelNameLabel')}</Text>
              <TextInput
                value={funnelName}
                onChangeText={setFunnelName}
                placeholder={t('addMetric.funnelNamePlaceholder')}
                placeholderTextColor="#737373"
                className="rounded-xl bg-background-secondary dark:bg-[#1A1A1A] px-4 py-3 text-text-primary dark:text-[#FFFFFF]"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Event picker modal */}
            <Modal
              visible={showEventPicker}
              animationType="slide"
              transparent
              onRequestClose={() => {
                setShowEventPicker(false);
                setFunnelSearch('');
              }}
            >
              <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View
                  className="rounded-t-2xl bg-background-secondary dark:bg-[#1A1A1A]"
                  style={{ maxHeight: '80%' }}
                >
                  {/* Header */}
                  <View className="px-4 pt-4 pb-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3">
                    <TextInput
                      value={funnelSearch}
                      onChangeText={setFunnelSearch}
                      placeholder={t('addMetric.searchFunnelEvent')}
                      placeholderTextColor="#737373"
                      className="flex-1 bg-background dark:bg-[#0D0D0D] rounded-xl px-4 py-3 text-text-primary dark:text-[#FFFFFF]"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                    <Pressable
                      onPress={() => {
                        setShowEventPicker(false);
                        setFunnelSearch('');
                      }}
                      hitSlop={8}
                    >
                      <Text className="text-primary font-inter-semibold">{t('common.cancel')}</Text>
                    </Pressable>
                  </View>

                  {/* Event list */}
                  <FlatList
                    data={filteredFunnelEvents.filter((e) => !funnelSteps.includes(e.name))}
                    keyExtractor={(item) => item.name}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 32 }}
                    ListEmptyComponent={
                      <View className="items-center justify-center py-10">
                        <Text className="text-text-tertiary text-sm">
                          {t('addMetric.noEventsFound')}
                        </Text>
                      </View>
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          setFunnelSteps((prev) => [...prev, item.name]);
                          setShowEventPicker(false);
                          setFunnelSearch('');
                        }}
                        className="px-4 py-3 border-b border-border dark:border-[#262626] flex-row items-center gap-3"
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#2DD4BF" />
                        <View className="flex-1">
                          <Text className="text-text-primary dark:text-[#FFFFFF] text-sm" numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.volume30Day != null && (
                            <Text className="text-text-tertiary text-xs mt-0.5">
                              {t('addMetric.last30Days').replace('{count}', String(item.volume30Day))}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    )}
                  />
                </View>
              </View>
            </Modal>

            <Pressable
              onPress={handleConfirm}
              disabled={isSubmitting || funnelSteps.length < 2 || funnelName.trim().length === 0}
              className={`mt-3 rounded-full px-5 py-4 items-center ${
                funnelSteps.length < 2 || isSubmitting || funnelName.trim().length === 0
                  ? 'bg-background-tertiary dark:bg-[#262626]'
                  : 'bg-primary'
              }`}
            >
              <Text
                className={`font-inter-semibold text-base ${
                  funnelSteps.length < 2 || isSubmitting || funnelName.trim().length === 0
                    ? 'text-text-tertiary'
                    : 'text-white'
                }`}
              >
                {isSubmitting ? t('common.adding') : t('addMetric.addFunnelButton').replace('{count}', String(funnelSteps.length))}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </BottomSheet>
  );
});
