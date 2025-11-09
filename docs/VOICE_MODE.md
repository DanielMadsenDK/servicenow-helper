# Voice Mode Guide

Complete technical documentation for the ServiceNow Helper voice input feature.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Browser Compatibility](#browser-compatibility)
- [Settings Configuration](#settings-configuration)
- [User Interface](#user-interface)
- [iOS PWA Limitations](#ios-pwa-limitations)
- [Technical Implementation](#technical-implementation)
- [Privacy and Security](#privacy-and-security)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

The Voice Mode feature enables users to ask questions using voice input with a WhatsApp-style press-and-hold recording interface. Voice recordings are automatically transcribed to text using speech-to-text services via N8N webhooks.

### Key Capabilities

- **Press-and-Hold Recording** - Intuitive mobile-first interaction pattern
- **Automatic Transcription** - Speech-to-text conversion via N8N
- **Configurable Workflow** - Three settings control behavior
- **Cross-Platform Support** - Desktop, Android, iOS Safari
- **Visual Feedback** - Timer, waveform animation, recording status
- **Security** - JWT authentication, HTTPS, no permanent audio storage

### Use Cases

- **Hands-Free Input** - Ask questions while working in ServiceNow
- **Mobile Users** - Easier input on mobile devices
- **Accessibility** - Alternative input method for users with typing difficulties
- **Speed** - Faster than typing for complex questions
- **Multitasking** - Record questions while performing other tasks

---

## Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Press-and-Hold Recording** | WhatsApp-style voice recording interface | ✅ Implemented |
| **Automatic Transcription** | Speech-to-text conversion via N8N | ✅ Implemented |
| **Auto-Submit** | Automatically send question after transcription | ✅ Implemented |
| **Quick Send** | Skip confirmation modal | ✅ Implemented |
| **Cross-Platform** | Desktop, Android, iOS Safari support | ✅ Implemented |
| **Visual Feedback** | Timer, waveform, recording status | ✅ Implemented |
| **iOS PWA Handling** | Detection and user guidance | ✅ Implemented |
| **Platform Detection** | Automatic audio format selection | ✅ Implemented |
| **Error Handling** | Comprehensive error messages | ✅ Implemented |
| **Keyboard Shortcuts** | Enter/Escape in confirmation modal | ✅ Implemented |

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Enable Voice Input** | ON | Show/hide microphone button in search interface |
| **Auto-Submit After Transcription** | ON | Automatically press "Get Help" button after text insertion |
| **Quick Send (Advanced)** | OFF | Skip confirmation modal, send immediately on button release |

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  VoiceRecordButton  │  VoiceRecordingModal  │  IOSPWAWarning   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Hooks Layer                           │
├─────────────────────────────────────────────────────────────────┤
│              useVoiceRecorder (MediaRecorder API)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Platform Detection Layer                      │
├─────────────────────────────────────────────────────────────────┤
│    detectPlatformCapabilities() │ getMediaRecorderMimeType()    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│             /api/voice-to-text (JWT Authentication)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      N8N Webhook Layer                           │
├─────────────────────────────────────────────────────────────────┤
│         /webhook/voice-to-text (Speech-to-Text Service)          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Press** → VoiceRecordButton detects press-and-hold
2. **Permission Request** → useVoiceRecorder requests microphone access
3. **Platform Detection** → Detect iOS/Android/Desktop, select audio format
4. **Start Recording** → MediaRecorder API begins capturing audio
5. **Visual Feedback** → Timer updates every second, button changes color
6. **User Release** → Stop recording
7. **Conditional Modal** → Show VoiceRecordingModal (if Quick Send OFF)
8. **Base64 Encoding** → Convert audio blob to base64 string
9. **API Request** → POST to /api/voice-to-text with JWT authentication
10. **N8N Processing** → Proxy to N8N webhook for transcription
11. **Text Insertion** → Insert transcribed text into question textarea
12. **Auto-Submit** → Optionally press "Get Help" button automatically

---

## Browser Compatibility

### Full Support

**Desktop Browsers:**
- ✅ Chrome 60+ (Windows, macOS, Linux)
- ✅ Edge 79+ (Windows, macOS, Linux)
- ✅ Firefox 55+ (Windows, macOS, Linux)
- ✅ Safari 14+ (macOS)

**Android:**
- ✅ Chrome 60+ (Android 6.0+)
- ✅ Firefox 55+ (Android 6.0+)
- ✅ Samsung Internet 8+ (Android 6.0+)
- ✅ Edge 79+ (Android 6.0+)

**iOS:**
- ✅ Safari 14+ in browser mode (iOS 14+)
- ⚠️ Safari in PWA standalone mode - NOT SUPPORTED (iOS limitation)

### API Requirements

**MediaRecorder API:**
- Chrome 47+
- Firefox 25+
- Safari 14+
- Edge 79+

**getUserMedia API:**
- Chrome 53+
- Firefox 36+
- Safari 11+ (browser mode only, not PWA standalone)
- Edge 79+

**WebRTC Support:**
- Required for microphone access
- All modern browsers support WebRTC
- iOS PWA standalone mode blocks WebRTC APIs

### Audio Format Support

**WebM (Opus codec):**
- ✅ Chrome (all platforms)
- ✅ Firefox (all platforms)
- ✅ Edge (all platforms)
- ❌ Safari (not supported)

**MP4 (AAC codec):**
- ✅ Safari (macOS and iOS)
- ✅ Chrome (with experimental flag)
- ⚠️ Firefox (limited support)

**Automatic Format Selection:**
The platform detection system automatically selects the optimal format:
- iOS → MP4 (AAC)
- Android/Desktop → WebM (Opus)

---

## Settings Configuration

### Enable Voice Input

**Key:** `voice_mode_enabled`
**Default:** `true`
**Type:** Boolean

**Description:**
Controls visibility of the microphone button in the search interface. When disabled, all voice input functionality is hidden.

**UI Behavior:**
- When ON → Microphone button visible in SearchInterface
- When OFF → Microphone button hidden, other voice settings disabled

**Storage:** PostgreSQL `user_settings` table, key-value pair per user

### Auto-Submit After Transcription

**Key:** `voice_auto_submit`
**Default:** `true`
**Type:** Boolean

**Description:**
Automatically presses the "Get Help" button after transcribed text is inserted into the question textarea. Creates seamless "talk to the machine" experience.

**UI Behavior:**
- When ON → "Get Help" button automatically clicked after transcription
- When OFF → User must manually click "Get Help" button
- Disabled if `voice_mode_enabled` is OFF

**Use Cases:**
- **ON**: Quick questions, casual use, seamless conversation
- **OFF**: Review transcription accuracy, make corrections, add context

### Quick Send (Advanced)

**Key:** `voice_auto_send`
**Default:** `false`
**Type:** Boolean

**Description:**
Skip the confirmation modal and immediately send recording for transcription when button is released. Advanced feature for power users.

**UI Behavior:**
- When ON → Recording sent immediately on button release (no modal)
- When OFF → VoiceRecordingModal displays with Send/Cancel options
- Disabled if `voice_mode_enabled` is OFF
- Marked "Advanced" in settings UI

**Trade-offs:**
- **Pros**: Faster workflow, fewer clicks
- **Cons**: Can't cancel after recording, can't review duration

**Recommendations:**
- First-time users: Keep OFF
- Experienced users: Enable for speed
- Critical questions: Keep OFF to review

---

## User Interface

### VoiceRecordButton Component

**Location:** Next to "Get Help" button in SearchInterface

**Visual States:**

| State | Color | Icon | Animation | Tooltip |
|-------|-------|------|-----------|---------|
| **Ready** | Blue gradient | Mic (white) | Scale on hover | "Press and hold to record" |
| **Recording** | Red gradient | Mic (white) | Pulsing red rings | "Recording... {duration}" |
| **Disabled** | Gray | Mic (gray) | None | "Voice input disabled" |
| **Error** | Red outline | Mic (red) | Shake | Error message |

**Styling:**
- Chip-style rounded-full button
- Blue-to-indigo gradient (ready state)
- Red-to-rose gradient (recording state)
- Colored shadows with opacity variants
- Scale animations: `hover:scale-105 active:scale-95`

**Interaction:**
- **Mouse**: mousedown to start, mouseup to stop
- **Touch**: touchstart to start, touchend to stop
- **Global Listeners**: Capture release even outside button
- **Disabled State**: No interaction when voice_mode_enabled is OFF

**Timer Display:**
Shows recording duration in MM:SS format during recording.

### VoiceRecordingModal Component

**Display Condition:** Shown after recording stops if `voice_auto_send` is OFF

**Features:**
- Glassmorphism design with backdrop-blur
- Recording duration display (MM:SS format)
- Animated waveform visualization (12 bars)
- Microphone icon with pulsing animation
- Send and Cancel buttons
- Keyboard shortcuts (Enter/Escape)
- Focus management and scroll prevention

**Styling:**
- Modern card with `rounded-2xl`
- `bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl`
- Blue gradient Send button
- Gray outline Cancel button
- Smooth slide-in-from-bottom animation

**Keyboard Support:**
- **Enter** → Send recording
- **Escape** → Cancel recording
- **Tab** → Navigate between buttons

**Accessibility:**
- ARIA labels and roles
- Focus trap within modal
- Screen reader announcements
- Disabled state indicators

### IOSPWAWarning Component

**Display Condition:** iOS PWA standalone mode detected AND voice not supported

**Features:**
- Yellow warning banner with AlertTriangle icon
- Explanation of iOS limitation
- "Open in Safari" button
- "Copy URL" button
- Dismissible with localStorage persistence
- Clear help text with tip

**Styling:**
- Yellow color scheme
- `bg-yellow-50 dark:bg-yellow-900/20`
- Border: `border-2 border-yellow-200 dark:border-yellow-700`
- Glassmorphism with backdrop-blur
- Chip-style action buttons

**Persistence:**
- Dismissed state saved in localStorage: `ios-pwa-voice-warning-dismissed`
- Does not reappear after dismissal
- Resets if localStorage cleared

---

## iOS PWA Limitations

### The Problem

**Apple Security Restriction:**
The `getUserMedia` API (required for microphone access) **does not work** in iOS Progressive Web Apps when running in standalone mode (installed to home screen).

**Technical Details:**
- WebRTC APIs blocked in iOS PWA standalone mode
- Security measure by Apple to prevent unauthorized audio/video access
- Affects all PWAs on iOS, not specific to this application
- No workaround exists within standalone PWA mode

**Affected APIs:**
- `navigator.mediaDevices.getUserMedia()`
- `MediaRecorder API`
- Camera access
- Microphone access

### The Solution

**Dual-Manifest Strategy:**

1. **Standard Manifest** (`/manifest.json`)
   - Used for Android and Desktop
   - `"display": "standalone"` for full-screen app experience
   - Default manifest for most users

2. **iOS-Specific Manifest** (`/manifest-ios.json`)
   - Used when iOS is detected
   - `"display": "browser"` to enable getUserMedia
   - Shows browser UI but enables microphone access
   - Dynamically injected via `ManifestLink` component

**Detection Logic:**
```typescript
const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
const canUseVoiceInput = !(iOS && isStandalone);
```

**User Guidance:**

When iOS PWA standalone mode is detected:
1. **IOSPWAWarning** banner displays automatically
2. User sees explanation of limitation
3. **Two options provided:**
   - Click "Open in Safari" to open in browser mode
   - Click "Copy URL" to manually paste in Safari
4. User can dismiss warning (saved in localStorage)

**Recommended User Flow:**
1. iOS user installs PWA from Safari
2. Opens installed app (standalone mode)
3. Tries to use voice input
4. Warning banner appears explaining limitation
5. User clicks "Open in Safari"
6. App opens in Safari browser mode
7. Voice input works perfectly
8. User can optionally add to home screen with browser display mode

### Trade-offs

**Standalone Mode (No Voice):**
- ✅ Full-screen app experience
- ✅ No browser UI
- ✅ True "native" feel
- ❌ No voice input
- ❌ No camera access

**Browser Mode (Voice Enabled):**
- ✅ Voice input works
- ✅ Camera access works
- ✅ Full WebRTC support
- ❌ Shows browser UI
- ❌ Less "native" feel

**Recommendation:**
For users who need voice input, browser mode is the only option on iOS.

---

## Technical Implementation

### Platform Detection

**File:** `src/lib/platform-detection.ts`

**Purpose:** Detect platform capabilities and determine if voice input is available.

**Key Functions:**

```typescript
export function detectPlatformCapabilities(): PlatformCapabilities {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /android/i.test(userAgent);
  const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

  const supportsMediaRecorder = typeof MediaRecorder !== 'undefined';
  const supportsGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const preferredAudioFormat: AudioFormat = isIOS ? 'mp4' : 'webm';

  let canUseVoiceInput = supportsMediaRecorder && supportsGetUserMedia;
  let warning: string | undefined = undefined;

  if (isIOS && isStandalone) {
    canUseVoiceInput = false;
    warning = 'Voice recording is not available in iOS standalone mode. Please open in Safari browser.';
  }

  return {
    isIOS,
    isAndroid,
    isStandalone,
    supportsMediaRecorder,
    supportsGetUserMedia,
    preferredAudioFormat,
    canUseVoiceInput,
    warning
  };
}
```

**Detection Criteria:**
- **iOS Detection**: User agent string matching
- **Android Detection**: User agent string matching
- **Standalone Mode**: `(display-mode: standalone)` media query
- **API Support**: Check MediaRecorder and getUserMedia availability

### Voice Recording Hook

**File:** `src/hooks/useVoiceRecorder.ts`

**Purpose:** Custom React hook managing MediaRecorder API and recording state.

**State Management:**
```typescript
const [recordingState, setRecordingState] = useState<VoiceRecordingState>(VoiceRecordingState.IDLE);
const [recordingDuration, setRecordingDuration] = useState<number>(0);
const [error, setError] = useState<string | null>(null);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [base64Audio, setBase64Audio] = useState<string | null>(null);
const [capabilities] = useState<PlatformCapabilities>(detectPlatformCapabilities());
```

**Key Functions:**

**startRecording():**
- Request microphone permission
- Create MediaRecorder with platform-specific MIME type
- Start timer interval
- Handle ondataavailable event
- Enforce maximum duration (5 minutes)

**stopRecording():**
- Stop MediaRecorder
- Stop timer interval
- Stop microphone stream
- Create audio blob from chunks
- Convert to base64

**cancelRecording():**
- Cleanup recording state
- Reset all variables
- Stop microphone stream

**convertBlobToBase64():**
- Convert Blob to base64 string using FileReader
- Promise-based for async handling

**Cleanup:**
- Automatic cleanup on component unmount
- Stop streams, clear timers, reset state

### Voice Recording Components

**VoiceRecordButton.tsx:**
- Press-and-hold interaction (mousedown/mouseup, touchstart/touchend)
- Global event listeners for release detection
- Visual state changes (blue → red)
- Timer display during recording
- Disabled state handling

**VoiceRecordingModal.tsx:**
- Modal after recording stops (if Quick Send OFF)
- Duration display (MM:SS format)
- Waveform animation (12 bars)
- Send/Cancel actions
- Keyboard shortcuts (Enter/Escape)
- Focus management

**IOSPWAWarning.tsx:**
- iOS PWA limitation warning
- "Open in Safari" button
- "Copy URL" button
- Dismissible with localStorage
- Yellow warning styling

**ManifestLink.tsx:**
- Dynamic manifest injection
- Detects iOS platform
- Updates manifest href to /manifest-ios.json or /manifest.json
- Client-side only component

### API Route

**File:** `src/app/api/voice-to-text/route.ts`

**Endpoint:** `POST /api/voice-to-text`

**Authentication:** JWT token required (httpOnly cookie)

**Request Format:**
```typescript
{
  audio: string;    // Base64-encoded audio data
  format: 'webm' | 'mp4';  // Audio format
}
```

**Response Format:**
```typescript
{
  success: boolean;
  text?: string;    // Transcribed text
  error?: string;   // Error message
}
```

**Validation:**
- JWT authentication (401 if unauthorized)
- Request body format (400 if invalid)
- Audio data presence (400 if missing)
- Audio format validation (400 if invalid)
- File size limit: 10MB (413 if exceeded)

**N8N Proxy:**
- Proxies to `{N8N_WEBHOOK_BASE_URL}/webhook/voice-to-text`
- Includes API key authentication
- 60-second timeout for transcription
- Comprehensive error handling

**Error Handling:**
- Connection refused → 503 Service Unavailable
- Timeout → 504 Gateway Timeout
- Invalid format → 400 Bad Request
- File too large → 413 Payload Too Large
- Generic errors → 500 Internal Server Error

### Settings Integration

**SettingsContext.tsx:**
- Default values for voice settings
- `voice_mode_enabled: true`
- `voice_auto_submit: true`
- `voice_auto_send: false`

**Settings API Route:**
- Validates voice setting keys
- Stores in PostgreSQL user_settings table
- Returns updated settings after save

**Settings UI:**
- Complete "Voice Input" section in Settings.tsx
- Three toggle switches with descriptions
- Dependency handling (disable when voice_mode_enabled OFF)
- Platform compatibility info box

---

## Privacy and Security

### Audio Data Handling

**Client-Side:**
- Audio captured via MediaRecorder API in browser memory
- Chunks stored temporarily in array during recording
- Converted to Blob after recording stops
- Encoded to base64 for transmission
- **No persistent storage** - cleared after transcription

**Server-Side:**
- Audio received as base64 string in API request
- Immediately proxied to N8N webhook
- **Not stored** in database or filesystem
- Discarded after transcription complete

**N8N Processing:**
- Audio sent to speech-to-text service
- Transcribed text returned
- **Audio not stored** by N8N
- Temporary processing only

### Security Measures

**Authentication:**
- JWT token required for all API requests
- Token stored in httpOnly cookie (XSS protection)
- Validated server-side before proxying to N8N
- User identity included in N8N request for audit

**Data Transmission:**
- HTTPS encryption for all requests
- Base64 encoding for binary data
- API key authentication for N8N webhook
- No audio transmitted in plaintext

**Input Validation:**
- File size limit enforced (10MB max)
- Audio format validation (webm/mp4 only)
- Base64 format validation
- Request body structure validation

**Rate Limiting:**
- Standard API rate limiting applies
- Prevents abuse of transcription service
- Per-user rate limits enforced

**Error Handling:**
- Generic error messages to users (no technical details)
- Detailed logging server-side for debugging
- No sensitive data in error responses

### Permissions

**Browser Permissions:**
- Microphone permission requested on first use
- User can deny permission (clear error message)
- Permission can be revoked anytime in browser settings
- Permission status checked before each recording

**User Control:**
- Voice input can be disabled in settings
- Recordings can be cancelled before sending
- Confirmation modal provides review opportunity (unless Quick Send enabled)
- Clear visual indicators of recording state

### Privacy Best Practices

**User Awareness:**
- Clear recording indicators (red button, timer)
- Warning banner for iOS limitations
- Settings descriptions explain behavior
- Tooltip on microphone button

**Data Minimization:**
- Only transcribed text stored, not audio
- Audio discarded immediately after transcription
- No permanent audio storage anywhere in system
- Minimal data transmitted (audio + format only)

**Transparency:**
- Documentation clearly explains data flow
- Privacy section in usage guide
- Settings descriptions mention data handling
- Open source code for audit

---

## Troubleshooting

### Microphone Button Not Visible

**Symptoms:**
- Microphone button missing from search interface
- No voice input option available

**Possible Causes & Solutions:**

1. **Voice input disabled in settings**
   - Navigate to Settings → Voice Input
   - Enable "Enable Voice Input" toggle
   - Verify setting saved successfully

2. **iOS PWA standalone mode**
   - Check if using iOS installed PWA
   - Look for IOSPWAWarning banner
   - Open in Safari browser instead

3. **Browser doesn't support MediaRecorder API**
   - Check browser version (Chrome 60+, Firefox 55+, Safari 14+)
   - Update browser to latest version
   - Try different browser

4. **Platform detection failed**
   - Check browser console for errors
   - Refresh page
   - Clear browser cache

### Recording Not Starting

**Symptoms:**
- Click microphone button, nothing happens
- No recording timer appears
- Button doesn't change color

**Possible Causes & Solutions:**

1. **Microphone permission denied**
   - Grant microphone permission when prompted
   - Check browser settings → Site permissions → Microphone
   - Allow microphone access for the domain
   - Reload page after granting permission

2. **Microphone in use by another application**
   - Close other applications using microphone (Zoom, Teams, etc.)
   - Check browser tabs using microphone
   - Restart browser

3. **No microphone available**
   - Check microphone is connected (external mic)
   - Verify microphone works in other applications
   - Check operating system sound settings
   - Try different microphone

4. **Browser console errors**
   - Open developer console (F12)
   - Look for getUserMedia errors
   - Check for NotAllowedError, NotFoundError, etc.
   - Follow error-specific troubleshooting

### Transcription Failed

**Symptoms:**
- Recording completes but transcription fails
- Error message displayed after sending
- Text not inserted into textarea

**Possible Causes & Solutions:**

1. **Network connectivity issues**
   - Check internet connection
   - Verify can access other websites
   - Check if behind firewall/proxy
   - Try again when connection stable

2. **N8N service unavailable**
   - Verify N8N container is running: `docker ps`
   - Check N8N accessible at `http://localhost:5678`
   - Restart N8N service if needed
   - Check N8N logs for errors

3. **Silent or very short recording**
   - Ensure speaking during recording
   - Check microphone input level
   - Test microphone in other applications
   - Record longer (>2 seconds optimal)

4. **Audio format not supported**
   - Platform detection may have failed
   - Try different browser
   - Check console for format errors
   - Manually test with different format

5. **Recording too long**
   - Keep recordings under 2 minutes for optimal results
   - Maximum duration: 5 minutes
   - Longer recordings may timeout
   - Split into multiple shorter recordings

6. **File size too large**
   - Maximum size: 10MB
   - Reduce recording duration
   - Check console for 413 error
   - Try again with shorter recording

### iOS Voice Not Working

**Symptoms:**
- iOS device shows no microphone button
- Warning banner appears on iOS
- Recording doesn't start on iPhone/iPad

**iOS-Specific Solutions:**

1. **Using PWA standalone mode**
   - **Solution**: Open in Safari browser instead
   - Click "Open in Safari" button on warning banner
   - Or manually open URL in Safari
   - Voice input will work in browser mode

2. **Safari microphone permission**
   - Safari → Settings → Camera & Microphone
   - Allow access for the domain
   - Reload page after granting permission

3. **iOS version too old**
   - Requires iOS 14+ for getUserMedia support
   - Update iOS to latest version
   - Check Settings → General → Software Update

4. **Private browsing mode**
   - getUserMedia may be blocked in private mode
   - Use normal Safari browsing mode
   - Disable private browsing

### Poor Transcription Quality

**Symptoms:**
- Transcribed text is inaccurate
- Words missing or incorrect
- Garbled or nonsensical text

**Solutions:**

1. **Improve audio quality**
   - Speak clearly and slowly
   - Reduce background noise (close windows, turn off fans)
   - Use quiet environment
   - Hold microphone closer (or device if using internal mic)

2. **Check microphone input level**
   - Operating system → Sound settings
   - Verify microphone level is adequate (not too low/high)
   - Adjust input volume if needed
   - Test with other applications

3. **Use external microphone**
   - Built-in microphones may have poor quality
   - Use USB or Bluetooth headset with microphone
   - Gaming headsets often have good quality
   - Ensure external microphone is selected as input

4. **Adjust speaking style**
   - Enunciate words clearly
   - Avoid talking too fast
   - Pause between sentences
   - Speak at normal volume (not too quiet/loud)

5. **Recording length**
   - Shorter recordings (30-90 seconds) often transcribe better
   - Break long questions into multiple recordings
   - Optimal length: 10-60 seconds

### Quick Send Not Working

**Symptoms:**
- Release button but modal still appears
- Quick Send setting enabled but confirmation modal shows

**Solutions:**

1. **Verify settings**
   - Settings → Voice Input → "Quick Send (Advanced)" must be ON
   - "Enable Voice Input" must also be ON
   - Refresh page after enabling
   - Settings must be saved successfully

2. **Recording too short**
   - Very short recordings (<1 second) may not register
   - Hold button for at least 1 second
   - Wait for timer to appear

3. **Button not fully released**
   - Ensure finger/mouse lifted completely
   - Global listeners should capture release
   - Try recording again

4. **Cache issues**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Reload page

---

## API Reference

### POST /api/voice-to-text

Convert voice recording to text using speech-to-text services.

**Authentication:** Required (JWT token in httpOnly cookie)

**Request:**

```typescript
POST /api/voice-to-text
Content-Type: application/json
Cookie: auth-token=<jwt_token>

{
  "audio": "base64_encoded_audio_data",
  "format": "webm" | "mp4"
}
```

**Success Response:**

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "text": "transcribed text from audio"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized. Please log in to use voice input."
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid request format. Expected JSON with audio and format fields."
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "error": "Audio file too large. Maximum size is 10MB."
}
```

**503 Service Unavailable:**
```json
{
  "success": false,
  "error": "Transcription service unavailable. Please try again later."
}
```

**504 Gateway Timeout:**
```json
{
  "success": false,
  "error": "Transcription timed out. Please try a shorter recording."
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "An unexpected error occurred. Please try again."
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio` | string | Yes | Base64-encoded audio data |
| `format` | string | Yes | Audio format: "webm" or "mp4" |

**Validation Rules:**
- `audio` must be non-empty string
- `audio` must be valid base64
- `format` must be exactly "webm" or "mp4"
- Estimated file size must be ≤ 10MB

**Rate Limiting:**
Standard API rate limits apply (same as other authenticated endpoints)

**Timeout:**
60 seconds for transcription processing

---

## Next Steps

- [Usage Guide](./USAGE.md) - Complete feature documentation
- [Architecture Documentation](./ARCHITECTURE.md) - System architecture
- [Database Configuration](./DATABASE.md) - Database setup
- [Development Guide](./DEVELOPMENT.md) - Development workflows
- [Testing Guide](./TESTING.md) - Testing strategies
