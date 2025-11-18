#!/bin/bash

echo "🍎 Configurando Mantex Mobile para iOS..."

# 1. Verificar dependencias
echo "📋 Verificando dependencias..."
if ! command -v npx &> /dev/null; then
    echo "❌ npm/npx no encontrado. Instala Node.js primero."
    exit 1
fi

# 2. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# 3. Instalar dependencias si es necesario
echo "📦 Verificando dependencias del proyecto..."
npm install

# 4. Agregar plataforma iOS si no existe
if [ ! -d "ios" ]; then
    echo "📱 Agregando plataforma iOS..."
    npx cap add ios
else
    echo "✅ Plataforma iOS ya existe"
fi

# 5. Copiar archivos web a nativo
echo "🔄 Construyendo proyecto..."
npm run build

# 6. Sincronizar con Capacitor
echo "🔄 Sincronizando con Capacitor..."
npx cap sync ios

# 7. Configurar capacitor.config.js para notificaciones
echo "⚙️ Verificando configuración de Capacitor..."

if ! grep -q "PushNotifications" capacitor.config.js 2>/dev/null; then
    echo "📝 Configurando push notifications en capacitor.config.js..."

    # Backup del archivo original
    cp capacitor.config.js capacitor.config.js.backup 2>/dev/null || true

    cat > capacitor.config.js << 'EOF'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mantex.mobile',
  appName: 'Mantex Mobile',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    }
  },
  ios: {
    scheme: 'Mantex Mobile'
  }
};

export default config;
EOF
    echo "✅ Capacitor configurado"
else
    echo "✅ Capacitor ya está configurado"
fi

# 8. Verificar Info.plist para notificaciones
echo "📋 Verificando permisos de iOS..."
INFO_PLIST="ios/App/App/Info.plist"

if [ -f "$INFO_PLIST" ]; then
    if ! grep -q "UIBackgroundModes" "$INFO_PLIST"; then
        echo "📝 Agregando permisos de background a Info.plist..."
        # Esto se hace mejor desde Xcode, pero lo mencionamos
        echo "⚠️  MANUAL: Agregar en Xcode -> Info.plist:"
        echo "   - UIBackgroundModes: remote-notification"
        echo "   - NSUserNotificationsUsageDescription"
    fi
else
    echo "⚠️  Info.plist no encontrado. Se creará cuando abras en Xcode."
fi

# 9. Crear archivos de configuración para Firebase
echo "🔥 Configuración de Firebase..."
if [ ! -f "ios/App/App/GoogleService-Info.plist" ]; then
    echo "⚠️  MANUAL: Descargar GoogleService-Info.plist de Firebase Console"
    echo "   y colocarlo en ios/App/App/"
fi

# 10. Mostrar instrucciones finales
echo ""
echo "🎉 ¡Setup completado!"
echo ""
echo "📋 SIGUIENTES PASOS:"
echo "1. Abre Xcode:"
echo "   npx cap open ios"
echo ""
echo "2. En Xcode, configura:"
echo "   - Team/Signing & Capabilities"
echo "   - Push Notifications capability"
echo "   - Background Modes -> Remote notifications"
echo ""
echo "3. Para probar:"
echo "   - Conecta tu iPhone"
echo "   - Select target: tu iPhone"
echo "   - Build and Run (⌘+R)"
echo ""
echo "4. En la app, ve a Tab 3 (Perfil) → 'Probar Notificaciones'"
echo ""
echo "🔔 Las notificaciones reales de Firebase necesitan:"
echo "   - GoogleService-Info.plist configurado"
echo "   - Certificados APNs en Firebase Console"
echo "   - Device token registrado"

# 11. Abrir Xcode automáticamente si está disponible
if command -v xcode-select &> /dev/null; then
    echo ""
    read -p "¿Abrir Xcode ahora? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Abriendo Xcode..."
        npx cap open ios
    fi
fi

echo ""
echo "✅ ¡Listo para probar notificaciones!"