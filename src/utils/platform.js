import { Capacitor } from '@capacitor/core'

/**
 * Check if the app is running as a native mobile app (iOS/Android)
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform()
}

/**
 * Check if the app is running on Android
 */
export function isAndroid() {
  return Capacitor.getPlatform() === 'android'
}

/**
 * Check if the app is running on iOS
 */
export function isIOS() {
  return Capacitor.getPlatform() === 'ios'
}

/**
 * Check if the app is running in a web browser
 */
export function isWeb() {
  return Capacitor.getPlatform() === 'web'
}

/**
 * Get the current platform name
 */
export function getPlatform() {
  return Capacitor.getPlatform()
}
