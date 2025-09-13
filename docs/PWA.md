# Progressive Web App (PWA)

This application is an advanced Progressive Web App with comprehensive offline support, intelligent install prompts, and native app-like functionality across all platforms.

## Features

### Core PWA Capabilities
- **Offline Capability**: Full functionality works without an internet connection
- **App-like Experience**: Runs in its own window with native app appearance
- **Cross-platform**: Works on desktop, mobile, and tablet devices
- **Automatic Updates**: Updates automatically in the background
- **Responsive Design**: Adapts to different screen sizes and orientations

### Advanced PWA Features
- **Smart Install Prompts**: Intelligent prompts based on user engagement
- **App Shortcuts**: Quick access to key features (New Question, Knowledge Store, Settings)
- **File Handling**: Support for drag-and-drop file uploads (text, JSON, PDF)
- **Share Target**: Receive shared content from other applications
- **Protocol Handlers**: Custom URL scheme support (`web+servicenow://`)
- **Network Resilience**: Automatic retry and connection recovery
- **Advanced Caching**: Multi-strategy caching for optimal performance

## How to Install

### Automatic Installation
The app will automatically prompt you to install after 30 seconds of engagement. The prompt includes:
- Feature highlights (offline support, desktop/mobile compatibility)
- Dismiss option (reappears after 24 hours if dismissed)
- Cross-platform compatibility detection

### Manual Installation

#### On Desktop
When you open the application in a supported browser (like Chrome or Edge), look for an **install icon** in the address bar. Click it to install the app on your computer.

#### On Mobile
In your mobile browser (like Safari or Chrome), tap the **Share** button and then select **"Add to Home Screen"** from the options.

This will add a ServiceNow Helper icon to your home screen or app launcher, allowing you to run it in its own window, just like a native application.

## Technical Implementation

### Advanced PWA Manifest
- **Framework**: Built using `next-pwa` package with enhanced configuration
- **Service Worker**: Advanced caching strategies with multiple cache layers
- **Manifest**: Comprehensive configuration in `public/manifest.json`
- **Icons**: Maskable icons in multiple sizes (48x48 to 512x512)
- **Shortcuts**: App shortcuts for quick feature access
- **File Handlers**: Support for file drag-and-drop operations
- **Share Target**: Receive shared content from external apps
- **Protocol Handlers**: Custom URL scheme handling

### PWA Features
- **Display Modes**: Support for `window-controls-overlay`, `standalone`, and `minimal-ui`
- **Theme Colors**: Dynamic theming with dark/light mode support
- **Orientation**: Supports any orientation (portrait/landscape)
- **Start URL**: `/` - launches to the main interface
- **Scope**: `/` - entire application is part of the PWA
- **Categories**: Categorized as productivity and developer tools

### Service Worker Architecture
- **Multi-tier Caching**: Different strategies for different resource types
- **API Caching**: Network-first strategy with 5-minute expiration
- **Static Assets**: Cache-first strategy with 1-year expiration
- **Images**: Optimized caching with WebP/AVIF support
- **Offline Fallback**: Dedicated offline page at `/offline`
- **Background Sync**: Handles updates and sync operations

### Installation Experience
- **Smart Prompts**: Appears after user engagement with dismiss tracking
- **Cross-platform**: iOS, Android, and Desktop PWA compatibility
- **State Tracking**: Monitors installation success and app usage
- **Feature Highlights**: Showcases offline support and native benefits

## Offline Functionality

### Available Offline Features
- **Previously Loaded Conversations**: Access cached conversation history
- **Saved Knowledge Store**: Browse saved Q&A pairs offline
- **Application Settings**: Access and modify user preferences
- **Cached AI Responses**: View previously generated responses
- **Core Navigation**: Full navigation and UI functionality

### Offline Page
When offline, users are redirected to a dedicated offline page (`/offline`) that:
- Explains offline capabilities
- Lists available features
- Provides retry functionality
- Shows connection status

### Network Monitoring
- **Real-time Status**: Network status indicator in header
- **Connection Quality**: Detects slow connections vs. offline
- **Automatic Recovery**: Handles reconnection gracefully
- **User Feedback**: Clear indicators of connection status

## Development & Configuration

### Development Notes
- PWA features are disabled in development mode
- Service worker registration is automatic in production
- Caching strategy optimized for static assets and API responses
- Bundle analysis available with `npm run build:analyze`

### Build Commands
```bash
npm run build          # Production build with PWA optimization
npm run build:analyze  # Build with webpack bundle analyzer
```

### Configuration Files
- `public/manifest.json` - PWA manifest configuration
- `next.config.ts` - Next.js PWA configuration
- `src/hooks/usePWAInstall.ts` - PWA installation hook
- `src/components/PWAInstallPrompt.tsx` - Install prompt component
- `src/components/NetworkStatusIndicator.tsx` - Network status component

## Browser Support

### Full PWA Support
- **Chrome/Chromium**: Complete PWA support including all advanced features
- **Edge**: Full PWA support with Microsoft Store integration
- **Samsung Internet**: Comprehensive PWA capabilities

### Basic PWA Support
- **Safari**: Core PWA features with "Add to Home Screen"
- **Firefox**: PWA support with manual installation process

### Limited Support
- **Older Browsers**: Basic offline functionality without advanced features

## Performance Benefits

### Caching Strategy Benefits
- **Faster Load Times**: Cached assets load instantly
- **Reduced Bandwidth**: Intelligent caching minimizes data usage
- **Better UX**: No loading delays for previously visited content
- **Offline Capability**: Full functionality without internet connection

### Advanced Features
- **Background Updates**: Service worker handles updates seamlessly
- **Lazy Loading**: Components load on-demand for better performance
- **Image Optimization**: WebP/AVIF support with responsive sizing
- **Font Optimization**: Google Fonts caching and optimization

## Troubleshooting

### Installation Issues
- **Prompt Not Appearing**: Wait 30 seconds after page load, or use manual installation
- **Installation Failed**: Check browser compatibility and try manual installation
- **App Not Launching**: Clear browser cache and reinstall

### Offline Issues
- **Content Not Available**: Ensure content was loaded while online first
- **Sync Problems**: Check network connection and retry
- **Cache Issues**: Clear service worker cache and reload

### Performance Issues
- **Slow Loading**: Check network connection and cache status
- **Large Bundle**: Use `npm run build:analyze` to identify optimization opportunities
- **Memory Issues**: Service worker automatically manages cache sizes

## Future Enhancements

### Planned Features
- **Push Notifications**: Background updates and important alerts
- **Background Sync**: Automatic data synchronization
- **Geolocation**: Location-based features and personalization
- **Device APIs**: Camera, microphone, and sensor integration

### Advanced Caching
- **Predictive Caching**: Pre-load likely needed resources
- **Dynamic Caching**: Adapt caching strategy based on usage patterns
- **Cache Optimization**: Machine learning-based cache management

This PWA implementation provides enterprise-grade offline functionality and native app-like experience across all platforms, with intelligent caching, smart install prompts, and comprehensive offline support.
