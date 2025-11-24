# APNs Configuration Checklist - Mantex

## Pasos Pendientes para Activar Push Notifications

### 1. Apple Developer Portal (15 min)

**Generar APNs Auth Key:**
1. Ir a [developer.apple.com/account](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles → **Keys**
3. Click **+** para crear nueva key
4. Nombre: `Mantex APNs Key`
5. Habilitar: **Apple Push Notifications service (APNs)**
6. Click **Continue** → **Register**
7. **IMPORTANTE:** Descargar el archivo `.p8` (solo se puede descargar una vez)
8. Anotar:
   - **Key ID** (ej: `ABC123XYZ`)
   - **Team ID** (esquina superior derecha del portal)  

### 2. Firebase Console (10 min)

**Subir APNs Key a Firebase:**
1. Ir a [Firebase Console](https://console.firebase.google.com/project/mantex-production-1cd9d)
2. Project Settings (⚙️) → **Cloud Messaging**
3. Scroll a **Apple app configuration**
4. Click **Upload** en "APNs Authentication Key"
5. Subir el archivo `.p8`
6. Ingresar:
   - **Key ID**: `ABC123XYZ`
   - **Team ID**: `YOUR_TEAM_ID`
7. Click **Upload**

### 3. Xcode Configuration (5 min)

**Habilitar Push Notifications:**
1. Abrir proyecto:
   ```bash
   cd mantex-mobile
   npx cap open ios
   ```

2. Seleccionar target **App**
3. Tab **Signing & Capabilities**
4. Click **+ Capability**
5. Agregar **Push Notifications**
6. Agregar **Background Modes**
   - Check ✅ **Remote notifications**

### 4. Verificar Configuración

**Archivos que deben existir:**
- ✅ `mantex-mobile/capacitor.config.ts` - Ya configurado
- ✅ `mantex-mobile/src/composables/usePushNotifications.js` - Ya creado
- ⏳ `.p8` file - Descargar de Apple Developer Portal
- ⏳ APNs key en Firebase - Subir después de descargar .p8

**Variables de entorno ya configuradas:**
```bash
VITE_FIREBASE_VAPID_KEY=BMiffToTzycBHCUjBn27VlyV7ZFBfc68gvv30BkgofmIKjoxtTFwpDnuqdS_1HVVdelfd24sy2YOWfjaJ2IF8O0
```

### 5. Testing (Requiere dispositivo físico)

**IMPORTANTE:** Push notifications NO funcionan en simulador iOS

**Probar en dispositivo real:**
```bash
cd mantex-mobile
npm run build
npx cap sync ios
npx cap open ios
```

En Xcode:
1. Conectar iPhone físico
2. Seleccionar dispositivo (no simulador)
3. Click **Run** (Cmd+R)
4. Aceptar permisos de notificaciones
5. Revisar console logs para device token

**Enviar notificación de prueba:**
1. Firebase Console → Cloud Messaging
2. **Send your first message**
3. Título: "Test Mantex"
4. Texto: "Probando notificaciones"
5. **Send test message**
6. Pegar device token del console log
7. Click **Test**

---

## Resumen

**Lo que YA está hecho:**
- ✅ Composable `usePushNotifications.js`
- ✅ Configuración en `capacitor.config.ts`
- ✅ Database migration para `notification_subscriptions`
- ✅ VAPID key configurado

**Lo que FALTA hacer:**
1. ⏳ Descargar APNs Auth Key (.p8) de Apple Developer Portal
2. ⏳ Subir .p8 a Firebase Console
3. ⏳ Habilitar Push Notifications capability en Xcode
4. ⏳ Probar en dispositivo físico iOS

**Tiempo estimado:** ~30 minutos

---

## Notas de Seguridad

- **NUNCA** commitear el archivo `.p8` al repositorio
- Agregar a `.gitignore`:
  ```
  *.p8
  *.p12
  GoogleService-Info.plist
  google-services.json
  ```

- El archivo `.p8` debe guardarse en un lugar seguro (1Password, etc.)
- Solo se puede descargar UNA VEZ desde Apple Developer Portal
