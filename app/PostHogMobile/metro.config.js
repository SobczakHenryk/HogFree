const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Remove 'source' from resolverMainFields so that react-native-svg (and other
// packages) resolve to their compiled lib/commonjs output rather than their
// TypeScript src/ directory, which causes "Unable to resolve ../lib/..." errors.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// lucide-react-native ships exports with broken ESM (dist/esm missing).
// Prefer 'require' condition so Metro resolves the CJS entry instead.
config.resolver.unstable_conditionNames = ['require', 'react-native', 'browser', 'import'];

module.exports = withNativeWind(config, { input: './global.css' });
