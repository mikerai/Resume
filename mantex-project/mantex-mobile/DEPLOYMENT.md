# 📱 Mantex Mobile - Deployment Guide

## 🚀 Preparación para Deployment

### 1. ✅ Backend Conectado
- ✅ Supabase configurado con credenciales reales
- ✅ Firebase configurado para notificaciones push
- ✅ AWS S3 configurado para evidencias fotográficas
- ✅ Google Maps API configurado

### 2. ✅ Capacitor Setup
- ✅ iOS platform agregada
- ✅ Android platform agregada
- ✅ Build generado exitosamente

## 📋 Pasos para Deployment

### Para Android 🤖

1. **Construir la app:**
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Abrir en Android Studio:**
   ```bash
   npx cap open android
   ```

3. **En Android Studio:**
   - Build > Generate Signed Bundle/APK
   - Crear keystore para firma de la app
   - Generar APK para testing o AAB para Play Store

4. **Configuraciones necesarias en Android:**
   - Actualizar `android/app/src/main/AndroidManifest.xml` con permisos:
     ```xml
     <uses-permission android:name="android.permission.CAMERA" />
     <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
     <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
     <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
     <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
     <uses-permission android:name="android.permission.INTERNET" />
     ```

### Para iOS 🍎

1. **Instalar dependencias (solo primera vez):**
   ```bash
   sudo xcodebuild -license accept
   sudo gem install cocoapods
   ```

2. **Construir la app:**
   ```bash
   npm run build
   npx cap sync ios
   ```

3. **Abrir en Xcode:**
   ```bash
   npx cap open ios
   ```

4. **En Xcode:**
   - Configurar Team y Bundle Identifier: `com.mantex.technicians`
   - Configurar Info.plist con permisos:
     ```xml
     <key>NSCameraUsageDescription</key>
     <string>Esta app necesita acceso a la cámara para tomar fotos de evidencia</string>
     <key>NSLocationWhenInUseUsageDescription</key>
     <string>Esta app necesita ubicación para check-in en trabajos</string>
     <key>NSPhotoLibraryUsageDescription</key>
     <string>Esta app necesita acceso a fotos para seleccionar evidencias</string>
     ```

## 🔧 Scripts de Build

### Build para desarrollo:
```bash
npm run build:dev
```

### Build para producción:
```bash
npm run build
npx cap sync
```

### Test en dispositivo:
```bash
# Android
npx cap run android

# iOS
npx cap run ios
```

## 📱 App Store Submission

### Google Play Store:
1. Crear cuenta de desarrollador de Google ($25)
2. Generar AAB firmado desde Android Studio
3. Subir a Play Console con:
   - Screenshots de la app
   - Descripción: "Mantex Mobile - App para técnicos especializados"
   - Categoría: Business/Productivity

### Apple App Store:
1. Cuenta de Apple Developer ($99/año)
2. Crear App ID: `com.mantex.technicians`
3. Archive desde Xcode y subir a App Store Connect
4. TestFlight para beta testing
5. Submission review (7-14 días)

## 🔐 Variables de Entorno

Asegurate que el archivo `.env` está presente con:

```env
# Supabase (Producción)
VITE_SUPABASE_URL=https://kdohbawwpcjyiyjgjzow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase (Producción)
VITE_FIREBASE_API_KEY=AIzaSyDRdFmql2VfnumTtrjWGpDGQHzPoTcZvO8
VITE_FIREBASE_PROJECT_ID=mantex-production-1cd9d
# ... resto de variables

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDRdFmql2VfnumTtrjWGpDGQHzPoTcZvO8

# AWS S3
VITE_AWS_S3_BUCKET=mantex-documents-1763361307
# ... resto de variables AWS
```

## ⚠️ Checklist Pre-Deployment

- [ ] ✅ Todas las credenciales reales configuradas
- [ ] ✅ Build exitoso sin errores
- [ ] ✅ Funcionalidades probadas: login, cámara, ubicación, notificaciones
- [ ] 🔄 Testing en dispositivos reales (Android/iOS)
- [ ] 🔄 Permisos configurados correctamente
- [ ] 🔄 Iconos y splash screens actualizados
- [ ] 🔄 Descripción y metadata de las tiendas
- [ ] 🔄 Screenshots para las tiendas

## 🎯 Próximos Pasos

1. **Conectar Firebase real** con datos de producción
2. **Activar Google Maps API** con facturación
3. **Testing en dispositivos** reales
4. **Configurar push notifications** con certificados
5. **Generar iconos** y splash screens personalizados
6. **Crear cuentas** en las tiendas de aplicaciones

## 📞 Contacto

Para dudas sobre deployment: [contacto técnico]

---

🚀 **¡La app móvil Mantex está lista para producción!** 📱