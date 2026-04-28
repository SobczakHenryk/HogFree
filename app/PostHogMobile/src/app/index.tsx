import { ActivityIndicator, View } from 'react-native';

// Pantalla de carga inicial — el RootLayoutNav en _layout.tsx redirige
// automáticamente a /(onboarding)/api-key o /(tabs)/ según el estado de auth.
export default function Index() {
  return (
    <View className="flex-1 bg-background dark:bg-[#0D0D0D] items-center justify-center">
      <ActivityIndicator size="large" color="#2DD4BF" />
    </View>
  );
}
