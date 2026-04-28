# Research: Donation Button in Settings

**Feature**: 013-donation-button  
**Date**: 2026-03-20  
**Status**: Complete

---

## R1: Donation Platform Selection

**Decision**: Ko-fi  
**Rationale**: 0% platform commission (only standard PayPal/Stripe ~2.9%), supports one-time donations without requiring creators to set up subscriptions, clean creator-oriented interface. No account required for donors to complete a donation via PayPal or card.  
**Alternatives considered**:
- Buy Me a Coffee: 5% platform fee — higher cost for same functionality
- GitHub Sponsors: 0% fee but requires GitHub account from donor — too restrictive for general mobile app users
- PayPal.me: simple but lacks the creator-friendly landing page and branding
- Cafecito: regional (LATAM only), limited payment methods outside Argentina

---

## R2: External URL Opening on React Native / Expo

**Decision**: Use `expo-linking` (already installed ~8.0.11) with `Linking.openURL(url)`  
**Rationale**: `expo-linking` is the official Expo module for handling deep links and external URLs. It wraps the native platform APIs (`UIApplication.openURL` on iOS, `Intent.ACTION_VIEW` on Android). Already installed in the project.  
**Implementation**:
```typescript
import * as Linking from 'expo-linking';

// Opens URL in the device's default browser
await Linking.openURL('https://ko-fi.com/{username}');
```
**Key behaviors**:
- Returns a Promise that resolves when the URL is opened
- On failure (e.g., no browser available), the promise rejects
- Works identically on iOS and Android
- No special permissions required
- Handles `https://` URLs natively — no need for `canOpenURL` check (all devices have a browser)  
**Alternatives considered**:
- `react-native` Linking API: works but `expo-linking` is the recommended wrapper for Expo projects
- In-app WebView: Would require extra dependency and create a suboptimal UX (user stays in app instead of their preferred browser)

---

## R3: Local Image Asset for Banner

**Decision**: Bundle a local PNG image as an app asset using `require()` in React Native `Image` component  
**Rationale**: Guarantees offline availability (FR requirement), zero latency rendering, no network dependency. The image is statically analyzed and bundled by Metro at build time.  
**Implementation**:
```typescript
import { Image } from 'react-native';

// Local asset — bundled in the app binary
<Image
  source={require('../../assets/donation-banner.png')}
  style={{ width: '100%', height: undefined, aspectRatio: 16/9 }}
  resizeMode="cover"
/>
```
**Best practices**:
- Provide @2x and @3x versions for optimal resolution on different screen densities
- Use PNG format with transparency for best quality on dark background
- Keep file size under 200KB for minimal bundle impact
- Use `aspectRatio` to maintain proportions without fixed pixel heights  
**Alternatives considered**:
- Remote image URL: Would break offline requirement and add loading latency
- SVG illustration: More complex to maintain, harder for non-developers to update

---

## R4: Pressable Image Pattern

**Decision**: Wrap `Image` inside `Pressable` with `active:opacity-70` (NativeWind) for visual feedback  
**Rationale**: Consistent with the existing interaction pattern in the Settings screen (all buttons use `Pressable` with opacity feedback, as mandated by the constitution §4.6). Haptic feedback uses `Haptics.ImpactFeedbackStyle.Light` for light actions.  
**Implementation**:
```typescript
<Pressable
  className="active:opacity-70"
  onPress={handleDonation}
  accessibilityRole="link"
  accessibilityLabel={t('settings.donationLabel')}
>
  <Image source={require('...')} ... />
</Pressable>
```
**Debounce**: Use a simple `useRef` flag to prevent multiple rapid presses from opening the browser multiple times.  
**Alternatives considered**:
- `TouchableOpacity`: Explicitly prohibited by constitution §4.6
- Animated scale effect: Over-engineering for a simple link action

---

## R5: App Store / Play Store Compliance for External Donation Links

**Decision**: External Ko-fi link is compliant for both stores  
**Rationale**:
- **Apple App Store**: Apps may link to external websites for donations/tips as long as they don't attempt to circumvent the in-app purchase requirement for digital goods/services consumed within the app. Voluntary donations for free apps are permitted via external links (Apple Review Guidelines §3.1.1 — "reader" and "free" app exceptions).
- **Google Play Store**: External links for donations/tips are allowed. Google Play's billing policy requires in-app billing only for digital goods consumed in the app. Voluntary donations to the developer are not considered digital goods.
- Key: The app MUST remain fully functional without donations. The donation is voluntary and doesn't unlock any features.  
**Risk**: Low. The app is free, donation is optional, no features are gated behind payment.

---

## R6: i18n Keys for Donation Section

**Decision**: Add ~6 new translation keys under the `settings.donation*` namespace  
**Rationale**: Follow existing i18n pattern in the project (all UI text goes through `useLocale().t()` function). Settings section keys follow the `settings.*` namespace convention.  
**Keys needed**:
| Key | Spanish | English |
|-----|---------|---------|
| `settings.donationSection` | `Apoyar la app` | `Support the app` |
| `settings.donationDescription` | `Esta app es totalmente gratis. Si te resulta útil, puedes apoyar su desarrollo con una donación voluntaria.` | `This app is completely free. If you find it useful, you can support its development with a voluntary donation.` |
| `settings.donationLabel` | `Hacer una donación en Ko-fi` | `Make a donation on Ko-fi` |
| `settings.donationFallback` | `Apoyar con una donación` | `Support with a donation` |
