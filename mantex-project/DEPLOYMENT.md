# 🚀 Mantex Project Deployment Guide

## Overview

Guía completa para deployment de los dos proyectos Mantex:
- **Web Application** (sakai-vue): Panel administrativo
- **Mobile App** (mantex-mobile): App móvil para técnicos

## 🌐 Web Application Deployment

### Opciones de Hosting

#### 1. Netlify (Recomendado - Gratis/Fácil)
```bash
cd sakai-vue

# Build para producción
npm run build

# Deploy manual (primera vez)
npm install -g netlify-cli
netlify deploy --dir dist --prod

# Auto-deploy con Git
netlify init
```

**Configuración Netlify:**
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: Configurar en Netlify dashboard

#### 2. Vercel
```bash
cd sakai-vue

# Build
npm run build

# Deploy
npm install -g vercel
vercel --prod
```

#### 3. AWS S3 + CloudFront
```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://tu-bucket-web --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id ABCD123 --paths "/*"
```

### Variables de Entorno para Web

**Netlify/Vercel Environment Variables:**
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_FIREBASE_API_KEY=AIzaSyXXX...
VITE_FIREBASE_PROJECT_ID=mantex-prod
VITE_FIREBASE_DATABASE_URL=https://mantex-prod-rtdb.firebaseio.com/
VITE_GOOGLE_MAPS_API_KEY=AIzaSyYYY...
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG...
AWS_S3_BUCKET=mantex-documents
```

## 📱 Mobile App Deployment

### iOS App Store

#### 1. Preparar Build de Producción
```bash
cd mantex-mobile

# Build para producción
npm run build

# Sync con iOS
npm run ios:sync

# Abrir Xcode
npm run ios:open
```

#### 2. Configurar Xcode
1. **Signing & Capabilities**:
   - Team: Seleccionar Apple Developer account
   - Bundle Identifier: `com.mantex.technicians`
   - Signing Certificate: Distribution certificate

2. **Build Settings**:
   - Code Signing Identity: iPhone Distribution
   - Provisioning Profile: App Store distribution profile

3. **Info.plist Verificar**:
   - Version: Incrementar para cada release
   - Display Name: "Mantex"
   - Permissions: Camera, Location, Notifications

#### 3. Archive y Upload
```bash
# En Xcode:
# Product > Archive
# Window > Organizer > Upload to App Store
```

#### 4. App Store Connect
1. Crear nueva versión en App Store Connect
2. Completar metadata (descripción, screenshots, etc.)
3. Configurar precios y disponibilidad
4. Enviar para review

### Android Play Store

#### 1. Preparar Build
```bash
cd mantex-mobile

# Agregar plataforma Android (si no existe)
npx cap add android

# Build
npm run build
npx cap sync android

# Abrir Android Studio
npx cap open android
```

#### 2. Configurar Android Studio
1. **Signing Config**:
   - Crear keystore: `keytool -genkey -v -keystore mantex.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias mantex`
   - Configurar en `android/app/build.gradle`

2. **Build Variants**:
   - Seleccionar "release"
   - Build > Generate Signed Bundle/APK

#### 3. Upload a Play Store
1. Crear aplicación en Play Console
2. Completar información de la tienda
3. Upload AAB file
4. Configurar release tracks (internal/alpha/beta/production)

### Configuración de Push Notifications

#### iOS (APNs)
```bash
# 1. Configurar en Apple Developer Portal
# - Certificates: Apple Push Notification service SSL
# - Identifiers: App ID con Push Notifications enabled
# - Profiles: Provisioning profile actualizado

# 2. Configurar en Firebase
# - Project Settings > Cloud Messaging
# - Upload APNs certificate (.p8 key)
```

#### Android (FCM)
```bash
# 1. Descargar google-services.json de Firebase
# 2. Colocar en android/app/google-services.json
# 3. Verificar en android/app/build.gradle:
# apply plugin: 'com.google.gms.google-services'
```

## 🔧 CI/CD Automation

### GitHub Actions para Web

`.github/workflows/web-deploy.yml`:
```yaml
name: Deploy Web App
on:
  push:
    branches: [main]
    paths: ['sakai-vue/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: cd sakai-vue && npm ci

      - name: Build
        run: cd sakai-vue && npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './sakai-vue/dist'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### GitHub Actions para Mobile

`.github/workflows/mobile-build.yml`:
```yaml
name: Build Mobile App
on:
  push:
    branches: [main]
    paths: ['mantex-mobile/**']

jobs:
  ios-build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: cd mantex-mobile && npm ci

      - name: Capacitor sync
        run: cd mantex-mobile && npx cap sync ios

      - name: Build iOS
        run: |
          cd mantex-mobile/ios/App
          xcodebuild -scheme App -configuration Release -archivePath App.xcarchive archive
```

## 🌍 Configuración de Dominios

### Web Application
1. **Dominio personalizado**: `admin.mantex.mx`
2. **SSL Certificate**: Auto-configurado por Netlify/Vercel
3. **DNS**: Apuntar CNAME a hosting provider

### Mobile Deep Links
```javascript
// capacitor.config.ts
{
  plugins: {
    App: {
      appUrlScheme: 'mantex'
    }
  }
}

// URLs como: mantex://job/123
```

## 📊 Monitoreo y Analytics

### Error Tracking
```bash
# Instalar Sentry
npm install @sentry/vue @sentry/capacitor

# Configurar en main.js
import * as Sentry from "@sentry/vue";
Sentry.init({
  dsn: "your-sentry-dsn"
});
```

### Analytics
```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID', {
  app_name: 'Mantex',
  app_version: '1.0.0'
});
```

## 🔒 Seguridad

### Secrets Management
- **Never commit** .env files
- Use hosting provider's environment variables
- Rotate API keys regularly
- Use least-privilege access for AWS IAM

### Content Security Policy
```javascript
// Para web app
{
  "Content-Security-Policy":
    "default-src 'self'; connect-src 'self' https://*.supabase.co https://*.googleapis.com"
}
```

## 🧪 Testing en Producción

### Web Application
```bash
# Health checks
curl https://admin.mantex.mx/health
curl https://admin.mantex.mx/api/status
```

### Mobile App
```bash
# TestFlight (iOS)
# - Upload build to App Store Connect
# - Add internal/external testers
# - Distribute test build

# Play Console Internal Testing (Android)
# - Upload AAB to internal track
# - Add test users
# - Share testing link
```

## 📋 Checklist de Deploy

### Pre-Deploy
- [ ] Todos los tests pasan
- [ ] Build exitoso localmente
- [ ] Variables de entorno configuradas
- [ ] Backups de base de datos
- [ ] SSL certificates válidos

### Post-Deploy
- [ ] Health checks passed
- [ ] Logs sin errores críticos
- [ ] Funcionalidad core probada
- [ ] Performance monitoring activo
- [ ] Error tracking funcionando

## 🚨 Rollback Plan

### Web Application
```bash
# Netlify
netlify rollback

# Vercel
vercel rollback [deployment-url]

# Manual
git revert [commit-hash]
npm run build
netlify deploy --prod
```

### Mobile Apps
- iOS: Remover versión de App Store Connect
- Android: Promover versión anterior en Play Console

## 📞 Support & Monitoring

### Status Pages
- Web: https://status.mantex.mx
- Uptime monitoring: UptimeRobot, Pingdom

### Alerting
- Slack/Discord webhooks para errores críticos
- Email notifications para downtime
- SMS para incidentes de seguridad

---

**Última actualización**: Noviembre 2024
**Versión**: 1.0.0