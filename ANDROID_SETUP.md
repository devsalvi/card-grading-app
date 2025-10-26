# Android App Setup Guide

This guide will help you build and deploy the Card Grading App as a native Android application using Capacitor.

## Overview

The Android app is built using **Capacitor**, which wraps the existing React web app into a native Android application. This provides:
- Native Android app experience
- Access to device camera and storage
- Installable APK for distribution
- Full web app functionality on mobile

## Prerequisites

Before building the Android app, you need:

1. **Node.js and npm** (already installed)
2. **Android Studio** - Download from https://developer.android.com/studio
3. **Java Development Kit (JDK)** - JDK 17 is recommended
4. **Android SDK** - Installed via Android Studio

### Installing Android Studio

1. Download and install Android Studio from https://developer.android.com/studio
2. During installation, ensure you install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (for emulator testing)
3. After installation, open Android Studio and go to `Tools > SDK Manager`
4. Install the latest Android SDK Platform (API Level 33 or higher)
5. Install Android SDK Build-Tools (latest version)

### Setting up Environment Variables

Add these to your `.bashrc`, `.zshrc`, or equivalent:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk        # Linux
# export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Restart your terminal after adding these.

## Project Structure

After running `npx cap add android`, you'll have:

```
card-grading-app/
├── android/                          # Native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml  # App permissions and config
│   │   │   ├── assets/public/       # Web app files (synced from dist/)
│   │   │   ├── res/                 # Android resources (icons, splash)
│   │   │   └── java/                # Native Android code
│   │   └── build.gradle             # App-level Gradle config
│   ├── build.gradle                 # Project-level Gradle config
│   └── gradle.properties            # Gradle properties
├── capacitor.config.json            # Capacitor configuration
└── dist/                            # Built web app (synced to Android)
```

## Quick Start Commands

The following npm scripts have been added for convenience:

```bash
# Build web app and sync to Android
npm run android:sync

# Open Android project in Android Studio
npm run android:open

# Build, sync, and run on connected device/emulator
npm run android:run
```

## Development Workflow

### 1. Make Changes to Web App

Edit your React components in `src/` as usual:

```bash
npm run dev  # Test in browser
```

### 2. Build and Sync to Android

After making changes, rebuild and sync:

```bash
npm run android:sync
```

This command:
1. Builds the web app (`npm run build`)
2. Copies the built files to `android/app/src/main/assets/public/`
3. Updates Capacitor plugins

### 3. Open in Android Studio

```bash
npm run android:open
```

Or manually open `android/` folder in Android Studio.

### 4. Run on Device/Emulator

**Option A: Using npm script**
```bash
npm run android:run
```

**Option B: Using Android Studio**
1. Open the Android project in Android Studio
2. Connect a physical device (with USB debugging enabled) OR start an emulator
3. Click the green "Run" button (▶️) or press `Shift+F10`

**Option C: Using ADB directly**
```bash
# List connected devices
adb devices

# Run on connected device
cd android
./gradlew installDebug
adb shell am start -n com.cardgrading.app/.MainActivity
```

## Building for Production

### Debug Build (for testing)

```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for distribution)

#### Step 1: Generate a Signing Key

```bash
keytool -genkey -v -keystore card-grading-app.keystore \
  -alias card-grading-key -keyalg RSA -keysize 2048 -validity 10000
```

Save this keystore file securely and remember the passwords!

#### Step 2: Configure Signing

Create `android/app/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=card-grading-key
storeFile=../../card-grading-app.keystore
```

Add to `.gitignore`:
```
android/app/keystore.properties
*.keystore
```

#### Step 3: Update app/build.gradle

Add this before the `android` block in `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("app/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside the `android` block, add:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### Step 4: Build Release APK

```bash
cd android
./gradlew assembleRelease
```

The signed APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

#### Step 5: Build App Bundle (AAB) for Google Play

```bash
cd android
./gradlew bundleRelease
```

The AAB will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

## Configuration

### App Information

Edit `capacitor.config.json`:

```json
{
  "appId": "com.cardgrading.app",
  "appName": "Card Grading App",
  "webDir": "dist"
}
```

- `appId`: Unique package identifier (reverse domain notation)
- `appName`: Display name shown on device
- `webDir`: Location of built web assets

### Android Permissions

Permissions are configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<uses-feature android:name="android.hardware.camera" android:required="false" />
```

### App Icon and Splash Screen

#### Changing the App Icon

1. Generate icons at https://capacitorjs.com/docs/guides/splash-screens-and-icons
2. Place icon files in `android/app/src/main/res/` folders:
   - `mipmap-hdpi/` (72x72)
   - `mipmap-mdpi/` (48x48)
   - `mipmap-xhdpi/` (96x96)
   - `mipmap-xxhdpi/` (144x144)
   - `mipmap-xxxhdpi/` (192x192)

#### Changing the Splash Screen

1. Create splash screen images
2. Place in `android/app/src/main/res/drawable/`
3. Configure in `capacitor.config.json`:

```json
"plugins": {
  "SplashScreen": {
    "launchShowDuration": 2000,
    "backgroundColor": "#667eea",
    "androidSplashResourceName": "splash"
  }
}
```

### Camera Plugin Configuration

Camera settings in `capacitor.config.json`:

```json
"Camera": {
  "saveToGallery": false,
  "allowEditing": false,
  "resultType": "uri"
}
```

## Testing

### On Physical Device

1. Enable Developer Options on your Android device:
   - Go to Settings > About phone
   - Tap "Build number" 7 times
2. Enable USB Debugging:
   - Go to Settings > Developer options
   - Enable "USB debugging"
3. Connect device via USB
4. Run: `npm run android:run`

### On Emulator

1. Open Android Studio
2. Go to `Tools > Device Manager`
3. Create a new Virtual Device (recommended: Pixel 6, API Level 33+)
4. Start the emulator
5. Run: `npm run android:run`

## Troubleshooting

### Build Errors

**Error: "SDK location not found"**
```bash
# Create local.properties in android/
echo "sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk" > android/local.properties
# Replace with your actual Android SDK path
```

**Error: "Execution failed for task ':app:mergeDebugResources'"**
- Clean the build: `cd android && ./gradlew clean`
- Delete `android/app/build` folder
- Sync again: `npm run android:sync`

**Error: Gradle version issues**
- Update Gradle wrapper: `cd android && ./gradlew wrapper --gradle-version=8.2`

### Camera Not Working

1. Check permissions in AndroidManifest.xml
2. Test on physical device (emulator cameras may not work properly)
3. Grant permissions when app first requests them

### App Shows Blank Screen

1. Check that web build succeeded: `npm run build`
2. Verify `dist/` folder contains files
3. Sync again: `npx cap sync android`
4. Check browser console in Android Studio (View > Tool Windows > Logcat)

### Network Requests Failing

1. Ensure `android:usesCleartextTraffic="true"` in AndroidManifest.xml (if using HTTP)
2. Check `capacitor.config.json` server settings
3. Verify API endpoint URLs in `.env` file

## Distribution

### Google Play Store

1. Build release AAB: `cd android && ./gradlew bundleRelease`
2. Create a Google Play Developer account ($25 one-time fee)
3. Create a new app in Google Play Console
4. Fill in store listing details (description, screenshots, etc.)
5. Upload the AAB file
6. Complete content rating questionnaire
7. Submit for review

### Direct APK Distribution

1. Build release APK: `cd android && ./gradlew assembleRelease`
2. Share the APK file from `android/app/build/outputs/apk/release/app-release.apk`
3. Users need to enable "Install from unknown sources" in their device settings

## Updating the App

When you make changes to the web app:

```bash
# 1. Make your changes in src/
npm run dev  # Test in browser

# 2. Build and sync to Android
npm run android:sync

# 3. Test on device/emulator
npm run android:run

# 4. If everything works, build release
cd android && ./gradlew assembleRelease
```

## Version Management

Update version in `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1      // Increment for each release (integer)
        versionName "1.0"  // User-visible version (string)
    }
}
```

**Important:**
- `versionCode` must increase with each Play Store upload
- `versionName` is displayed to users (e.g., "1.0", "1.1", "2.0")

## Resources

- Capacitor Documentation: https://capacitorjs.com/docs
- Capacitor Camera Plugin: https://capacitorjs.com/docs/apis/camera
- Android Developer Guides: https://developer.android.com/guide
- Capacitor Android Guides: https://capacitorjs.com/docs/android

## Support

For issues specific to:
- Web app functionality: Check `src/` code and browser console
- Android build issues: Check Android Studio Logcat
- Capacitor issues: https://capacitorjs.com/docs/troubleshooting
- Camera issues: https://capacitorjs.com/docs/apis/camera#troubleshooting
