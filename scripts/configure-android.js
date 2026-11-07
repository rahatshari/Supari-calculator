/**
 * configure-android.js
 * Automatically configures Capacitor Android native project:
 * - Permanent keystore signing (fixes "conflicting signature" / "same signature" error)
 * - Version 2.1.0 (versionCode 3)
 * - Clean Supari icons & prevents Duplicate Resources error in mipmap-anydpi-v26
 * - Completely removes Capacitor splash screen & blue logo
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const appDir = path.join(androidDir, 'app');
const resDir = path.join(appDir, 'src', 'main', 'res');

console.log('⚙️ Starting Android project configuration...');

// 1. Copy App Icons to density folders only
const icon192 = path.join(rootDir, 'public', 'pwa-192x192.png');
const icon512 = path.join(rootDir, 'public', 'pwa-512x512.png');
const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

densities.forEach((dpi) => {
  const dir = path.join(resDir, `mipmap-${dpi}`);
  if (fs.existsSync(dir)) {
    if (fs.existsSync(icon192)) {
      fs.copyFileSync(icon192, path.join(dir, 'ic_launcher.png'));
      fs.copyFileSync(icon192, path.join(dir, 'ic_launcher_round.png'));
    }
    if (fs.existsSync(icon512)) {
      fs.copyFileSync(icon512, path.join(dir, 'ic_launcher_foreground.png'));
    }
  }
});
console.log('✅ Supari icons copied to density folders');

// 2. CRITICAL: Clean mipmap-anydpi-v26 (must only contain XML files, never PNG or WEBP)
const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
if (fs.existsSync(anydpiDir)) {
  const files = fs.readdirSync(anydpiDir);
  files.forEach((file) => {
    if (file.endsWith('.png') || file.endsWith('.webp')) {
      fs.unlinkSync(path.join(anydpiDir, file));
      console.log(`🗑️ Removed invalid resource file from anydpi-v26: ${file}`);
    }
  });
}

// 3. Disable Splash Screen & remove blue Capacitor logo
const blankSplash = path.join(rootDir, 'public', 'splash.png');
if (fs.existsSync(blankSplash) && fs.existsSync(resDir)) {
  const resFolders = fs.readdirSync(resDir);
  resFolders.forEach((folder) => {
    if (folder.startsWith('drawable')) {
      const targetSplash = path.join(resDir, folder, 'splash.png');
      if (fs.existsSync(targetSplash)) {
        fs.copyFileSync(blankSplash, targetSplash);
      }
    }
  });
}

// 4. Update styles.xml & AndroidManifest.xml to eliminate launch splash screen
const stylesPath = path.join(resDir, 'values', 'styles.xml');
if (fs.existsSync(stylesPath)) {
  let styles = fs.readFileSync(stylesPath, 'utf8');
  styles = styles.replace(
    /<item name="android:background">@drawable\/splash<\/item>/g,
    '<item name="android:background">#f8fafc</item>'
  );
  fs.writeFileSync(stylesPath, styles, 'utf8');
  console.log('✅ Splash background changed to #f8fafc in styles.xml');
}

const manifestPath = path.join(appDir, 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  manifest = manifest.replace(
    'android:theme="@style/AppTheme.NoActionBarLaunch"',
    'android:theme="@style/AppTheme.NoActionBar"'
  );
  if (!manifest.includes('android.permission.WRITE_EXTERNAL_STORAGE')) {
    manifest = manifest.replace(
      '</manifest>',
      '    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />\n' +
      '    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />\n' +
      '</manifest>'
    );
  }
  if (!manifest.includes('android:requestLegacyExternalStorage')) {
    manifest = manifest.replace('<application', '<application android:requestLegacyExternalStorage="true"');
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('✅ Theme & Storage permissions set in AndroidManifest.xml');
}

const stylesV31Path = path.join(resDir, 'values-v31', 'styles.xml');
if (fs.existsSync(stylesV31Path)) {
  let styles31 = fs.readFileSync(stylesV31Path, 'utf8');
  styles31 = styles31.replace(
    /<item name="android:windowSplashScreenAnimatedIcon">.*?<\/item>/g,
    '<item name="android:windowSplashScreenAnimatedIcon">@android:color/transparent</item>'
  );
  styles31 = styles31.replace(
    /<item name="android:windowSplashScreenBackground">.*?<\/item>/g,
    '<item name="android:windowSplashScreenBackground">#f8fafc</item>'
  );
  fs.writeFileSync(stylesV31Path, styles31, 'utf8');
  console.log('✅ Android 12+ splash transparent configured in values-v31/styles.xml');
}

// 5. Update build.gradle with Version 2.1.0 and Permanent Keystore Signing
const gradlePath = path.join(appDir, 'build.gradle');
const keystoreSrc = path.join(rootDir, 'supari.keystore');
const keystoreDest = path.join(appDir, 'supari.keystore');

if (fs.existsSync(keystoreSrc)) {
  fs.copyFileSync(keystoreSrc, keystoreDest);
  console.log('✅ Permanent keystore copied to android/app/supari.keystore');
}

if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Set Version 2.9.0 (versionCode 11)
  gradle = gradle.replace(/versionCode \d+/g, 'versionCode 11');
  gradle = gradle.replace(/versionName "[^"]*"/g, 'versionName "2.9.0"');

  // Inject permanent signing configuration
  const signingConfigBlock = `
    signingConfigs {
        permanent {
            storeFile file("supari.keystore")
            storePassword "supari123"
            keyAlias "supari"
            keyPassword "supari123"
        }
    }
`;

  if (!gradle.includes('signingConfigs')) {
    gradle = gradle.replace('defaultConfig {', signingConfigBlock + '\n    defaultConfig {');
    gradle = gradle.replace(
      'buildTypes {',
      'buildTypes {\n        debug {\n            signingConfig signingConfigs.permanent\n        }'
    );
  }

  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('✅ Version 2.5.0 & Permanent Keystore injected into build.gradle');
}

console.log('🎉 Android configuration completed successfully!');
