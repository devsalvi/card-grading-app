# iOS App Setup Guide

This guide will help you build and deploy the Card Grading App as a native iOS application (iPhone/iPad) using Capacitor.

## Overview

The iOS app is built using **Capacitor**, which wraps the existing React web app into a native iOS application. This provides:
- Native iOS app experience
- Access to device camera and photo library
- Installable IPA for distribution via App Store or TestFlight
- Full web app functionality on iPhone and iPad

## Prerequisites

Before building the iOS app, you need:

1. **macOS** - iOS development requires a Mac
2. **Node.js and npm** (already installed)
3. **Xcode** - Download from the Mac App Store (free)
4. **CocoaPods** - Dependency manager for iOS
5. **Apple Developer Account** (free for testing, $99/year for App Store distribution)

### Installing Xcode

1. Open the **Mac App Store**
2. Search for "Xcode"
3. Click **Get** or **Install** (this is a large download, ~15GB)
4. After installation, open Xcode
5. Accept the license agreement
6. Install additional components when prompted

### Installing Command Line Tools

After installing Xcode:

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Set Xcode path
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Installing CocoaPods

CocoaPods is required for managing iOS dependencies:

```bash
# Install CocoaPods using Homebrew (recommended)
brew install cocoapods

# Or install using gem
sudo gem install cocoapods

# Initialize CocoaPods (first time only)
pod setup
```

Verify installation:
```bash
pod --version
```

## Project Structure

After running `npx cap add ios`, you'll have:

```
card-grading-app/
├── ios/                              # Native iOS project
│   ├── App/
│   │   ├── App/
│   │   │   ├── Info.plist           # App permissions and config
│   │   │   ├── public/              # Web app files (synced from dist/)
│   │   │   └── Assets.xcassets/     # App icons and images
│   │   ├── App.xcodeproj            # Xcode project file
│   │   ├── App.xcworkspace          # Xcode workspace (use this)
│   │   ├── Podfile                  # CocoaPods dependencies
│   │   └── Pods/                    # Installed pods
├── capacitor.config.json            # Capacitor configuration
└── dist/                            # Built web app (synced to iOS)
```

## Quick Start Commands

The following npm scripts have been added for convenience:

```bash
# Build web app and sync to iOS
npm run ios:sync

# Open iOS project in Xcode
npm run ios:open

# Build, sync, and run on connected device/simulator
npm run ios:run
```

## Development Workflow

### 1. Make Changes to Web App

Edit your React components in `src/` as usual:

```bash
npm run dev  # Test in browser
```

### 2. Build and Sync to iOS

After making changes, rebuild and sync:

```bash
npm run ios:sync
```

This command:
1. Builds the web app (`npm run build`)
2. Copies the built files to `ios/App/App/public/`
3. Updates Capacitor plugins
4. Runs `pod install` to update iOS dependencies

### 3. Install CocoaPods Dependencies

If this is your first time or after adding new plugins:

```bash
cd ios/App
pod install
cd ../..
```

### 4. Open in Xcode

```bash
npm run ios:open
```

**IMPORTANT**: Always open `App.xcworkspace`, NOT `App.xcodeproj`

### 5. Run on Simulator/Device

**Option A: Using npm script**
```bash
npm run ios:run
```

**Option B: Using Xcode**
1. Open the iOS project in Xcode (`npm run ios:open`)
2. Select a simulator or connected device from the toolbar
3. Click the "Run" button (▶️) or press `Cmd+R`

**Option C: Using Xcode command line**
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -destination 'platform=iOS Simulator,name=iPhone 15' build
```

## Building for Distribution

### Debug Build (for testing)

Build from Xcode:
1. Open `App.xcworkspace` in Xcode
2. Select **Product > Build** (Cmd+B)
3. The app will be built for the selected destination

### Release Build (for TestFlight/App Store)

#### Step 1: Join Apple Developer Program

1. Visit https://developer.apple.com/programs/
2. Enroll in the Apple Developer Program ($99/year)
3. Complete enrollment verification

#### Step 2: Configure App in Xcode

1. Open `App.xcworkspace` in Xcode
2. Select the **App** project in the navigator
3. Select the **App** target
4. Go to **Signing & Capabilities** tab
5. Check **Automatically manage signing**
6. Select your **Team** (Apple Developer account)
7. Set a unique **Bundle Identifier** (e.g., `com.yourcompany.cardgradingapp`)

#### Step 3: Set Version and Build Number

In Xcode:
1. Select the **App** target
2. Go to **General** tab
3. Set **Version** (e.g., "1.0.0" - user-visible version)
4. Set **Build** (e.g., "1" - increment for each upload)

#### Step 4: Archive the App

1. In Xcode, select **Any iOS Device** or a connected device (not a simulator)
2. Select **Product > Archive** from the menu
3. Wait for the archive to complete
4. The Organizer window will open automatically

#### Step 5: Distribute via TestFlight (Beta Testing)

1. In the Organizer window, select your archive
2. Click **Distribute App**
3. Choose **App Store Connect**
4. Click **Upload**
5. Select your signing certificate and provisioning profile
6. Click **Upload**
7. Wait for processing (10-30 minutes)
8. Add beta testers in App Store Connect

#### Step 6: Submit to App Store

1. Go to https://appstoreconnect.apple.com
2. Create a new app listing
3. Fill in app information, screenshots, description
4. Select the build you uploaded
5. Complete all required sections
6. Submit for review

## Camera and Photo Library Permissions

The iOS app requires permissions for camera and photo library access. These are already configured in `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to your camera to take photos of your cards for grading submission.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to your photo library to select card images for grading submission.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>This app needs permission to save card photos to your photo library.</string>
```

Users will see these messages when the app first requests camera/photo access.

## Testing

### On iOS Simulator

1. Open Xcode
2. Select a simulator from the device menu (e.g., "iPhone 15")
3. Click the Run button (▶️)
4. **Note**: Camera doesn't work on simulators, only on physical devices

### On Physical iPhone/iPad

#### Enable Developer Mode (iOS 16+)

1. Connect your device via USB
2. On the device, go to **Settings > Privacy & Security > Developer Mode**
3. Enable **Developer Mode**
4. Restart the device when prompted

#### Trust the Computer

1. Connect device via USB
2. Unlock the device
3. Tap **Trust** when prompted "Trust This Computer?"

#### Run from Xcode

1. Select your connected device from the device menu in Xcode
2. Click the Run button (▶️)
3. First time: You'll need to trust the developer certificate on the device:
   - Go to **Settings > General > VPN & Device Management**
   - Tap on your developer certificate
   - Tap **Trust**
4. Run the app again from Xcode

## App Icons and Splash Screen

### Changing the App Icon

1. Create app icons at all required sizes (you can use https://www.appicon.co/)
2. Open `App.xcworkspace` in Xcode
3. In the navigator, go to `App > App > Assets.xcassets > AppIcon`
4. Drag and drop your icon images into the appropriate slots

Required sizes:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 76x76, 152x152 (iPad)

### Changing the Splash Screen

1. Create splash screen images
2. In Xcode, go to `App > App > Assets.xcassets > Splash`
3. Add your splash screen images
4. Configure in `capacitor.config.json`:

```json
"plugins": {
  "SplashScreen": {
    "launchShowDuration": 2000,
    "backgroundColor": "#667eea",
    "iosSpinnerStyle": "small",
    "showSpinner": false
  }
}
```

## Troubleshooting

### Error: "No such module 'Capacitor'"

**Solution**: Install CocoaPods dependencies:
```bash
cd ios/App
pod install
cd ../..
```

### Error: "xcode-select: error: tool 'xcodebuild' requires Xcode"

**Solution**: Install Xcode from the Mac App Store and run:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Error: "CocoaPods could not find compatible versions for pod..."

**Solution**: Update CocoaPods and dependencies:
```bash
cd ios/App
pod repo update
pod install
cd ../..
```

### App Shows Blank Screen

1. Check that web build succeeded: `npm run build`
2. Verify `dist/` folder contains files
3. Sync again: `npm run ios:sync`
4. Check console in Xcode for errors (View > Debug Area > Show Debug Area)

### Camera Not Working

1. Check permissions in Info.plist (already configured)
2. **Camera only works on physical devices, not simulators**
3. Grant permissions when app first requests them
4. Check device camera is working in the native Camera app

### Build Errors After Updating Dependencies

1. Clean build folder: In Xcode, **Product > Clean Build Folder** (Cmd+Shift+K)
2. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
3. Reinstall pods:
   ```bash
   cd ios/App
   pod deintegrate
   pod install
   cd ../..
   ```

### "Signing for 'App' requires a development team"

**Solution**:
1. Open Xcode
2. Select the **App** target
3. Go to **Signing & Capabilities**
4. Select your Apple ID team from the dropdown
5. Or create a free Apple ID at https://appleid.apple.com

## Version Management

Update version in Xcode:

1. Open `App.xcworkspace`
2. Select the **App** project
3. Select the **App** target
4. Go to **General** tab
5. Update:
   - **Version**: User-visible version (e.g., "1.0", "1.1", "2.0")
   - **Build**: Build number (must increase for each upload, e.g., 1, 2, 3...)

**Important for App Store:**
- Version can be the same with higher build number (e.g., 1.0 build 2)
- Each App Store submission requires a unique build number
- Build number must be an integer or string of integers

## Simulator List

Common iOS simulators:
- iPhone 15 Pro Max
- iPhone 15 Pro
- iPhone 15
- iPhone 15 Plus
- iPhone 14 Pro
- iPhone SE (3rd generation)
- iPad Pro (12.9-inch)
- iPad Air

Add simulators: **Xcode > Window > Devices and Simulators**

## Updating the App

When you make changes to the web app:

```bash
# 1. Make your changes in src/
npm run dev  # Test in browser

# 2. Build and sync to iOS
npm run ios:sync

# 3. Test on simulator or device
npm run ios:run

# 4. If everything works, archive and distribute
# (Use Xcode: Product > Archive)
```

## App Store Submission Checklist

Before submitting to the App Store:

- [ ] App icons added (all required sizes)
- [ ] Launch screen configured
- [ ] App tested on multiple devices/simulators
- [ ] All features working (camera, photo library, network)
- [ ] Privacy policy URL ready
- [ ] App Store screenshots prepared (all required sizes)
- [ ] App description written
- [ ] Keywords selected
- [ ] Support URL ready
- [ ] Age rating determined
- [ ] Version and build number set correctly
- [ ] Archive created and uploaded via Xcode
- [ ] TestFlight beta testing completed (recommended)

## Resources

- Capacitor iOS Documentation: https://capacitorjs.com/docs/ios
- Capacitor Camera Plugin: https://capacitorjs.com/docs/apis/camera
- Apple Developer Documentation: https://developer.apple.com/documentation/
- App Store Connect: https://appstoreconnect.apple.com
- Xcode Documentation: https://developer.apple.com/documentation/xcode
- CocoaPods: https://cocoapods.org
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

## Support

For issues specific to:
- Web app functionality: Check `src/` code and browser console
- iOS build issues: Check Xcode console and build logs
- Capacitor issues: https://capacitorjs.com/docs/troubleshooting
- Camera issues: https://capacitorjs.com/docs/apis/camera#troubleshooting
- App Store submission: https://developer.apple.com/support/

## Next Steps

1. **Install Xcode** from the Mac App Store
2. **Install CocoaPods**: `brew install cocoapods`
3. **Install dependencies**: `cd ios/App && pod install`
4. **Open in Xcode**: `npm run ios:open`
5. **Run on simulator or device**
6. **Start developing!**
