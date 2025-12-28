# PWA Setup Instructions

## Icon Generation

To generate the required PWA icons (192x192 and 512x512 PNG files), you have two options:

### Option 1: Using the provided script (requires sharp)

1. Install sharp:
   ```bash
   npm install --save-dev sharp
   ```

2. Run the icon generation script:
   ```bash
   node scripts/generate-icons.js
   ```

### Option 2: Manual generation

1. Use an online tool like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/

2. Upload the `public/icon.svg` file or create your own icon

3. Generate icons with sizes:
   - 192x192 pixels → save as `public/icon-192x192.png`
   - 512x512 pixels → save as `public/icon-512x512.png`

## Testing PWA

### On Desktop (Chrome/Edge):
1. Open DevTools (F12)
2. Go to Application tab
3. Check "Service Workers" and "Manifest"
4. Click "Install" button in the address bar

### On Android:
1. Open the app in Chrome
2. Tap the menu (3 dots)
3. Select "Add to Home screen" or "Install app"

### On iOS (Safari):
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## Features Included

- ✅ Web App Manifest
- ✅ Service Worker for offline support
- ✅ Apple-specific meta tags
- ✅ Theme colors matching Healing Sage palette
- ✅ Standalone display mode
- ✅ App shortcuts

## Notes

- The service worker caches the main page and assets for offline access
- Icons should be optimized PNG files for best performance
- The app will work offline after the first visit

