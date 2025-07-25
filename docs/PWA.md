# Progressive Web App (PWA)

This application is a Progressive Web App, which means you can install it on your desktop or mobile device for a more integrated, app-like experience.

## Features

- **Offline Capability**: Basic functionality works without an internet connection
- **App-like Experience**: Runs in its own window with native app appearance
- **Cross-platform**: Works on desktop, mobile, and tablet devices
- **Automatic Updates**: Updates automatically in the background
- **Responsive Design**: Adapts to different screen sizes and orientations

## How to Install

### On Desktop
When you open the application in a supported browser (like Chrome or Edge), look for an **install icon** in the address bar. Click it to install the app on your computer.

### On Mobile
In your mobile browser (like Safari or Chrome), tap the **Share** button and then select **"Add to Home Screen"** from the options.

This will add a ServiceNow Helper icon to your home screen or app launcher, allowing you to run it in its own window, just like a native application.

## Technical Implementation

### PWA Configuration
- **Framework**: Built using `next-pwa` package
- **Service Worker**: Automatically generated for caching and offline functionality
- **Manifest**: Configured in `public/manifest.json` with app metadata
- **Icons**: Maskable icons in multiple sizes (48x48 to 512x512)

### PWA Features
- **Display Mode**: `standalone` - runs like a native app
- **Theme Colors**: Configured for consistent branding
- **Orientation**: Supports any orientation (portrait/landscape)
- **Start URL**: `/` - launches to the main interface
- **Scope**: `/` - entire application is part of the PWA

### Development Notes
- PWA features are disabled in development mode
- Service worker registration is automatic in production
- Caching strategy optimized for static assets and API responses

### Browser Support
- **Chrome/Chromium**: Full PWA support including installation
- **Safari**: Basic PWA features with "Add to Home Screen"
- **Firefox**: PWA support with manual installation
- **Edge**: Full PWA support similar to Chrome