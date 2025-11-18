#!/bin/bash

echo "🍎 Setup Completo iOS + Ícono - Mantex Mobile"
echo "=============================================="

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar dependencias
echo -e "${BLUE}📋 Verificando dependencias...${NC}"

if ! command -v sips &> /dev/null; then
    echo -e "${RED}❌ sips no encontrado (necesario para redimensionar íconos)${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npm/npx no encontrado. Instala Node.js primero.${NC}"
    exit 1
fi

# Verificar CocoaPods
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods no encontrado. Instalando...${NC}"
    if command -v brew &> /dev/null; then
        brew install cocoapods
    else
        echo -e "${RED}❌ Homebrew no encontrado. Instala CocoaPods manualmente:${NC}"
        echo "sudo gem install cocoapods"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Todas las dependencias están instaladas${NC}"

# 2. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ No se encontró package.json. Ejecuta desde la raíz del proyecto.${NC}"
    exit 1
fi

if [ ! -f "icon.png" ]; then
    echo -e "${RED}❌ No se encontró icon.png en la raíz del proyecto.${NC}"
    exit 1
fi

# 3. Instalar dependencias del proyecto
echo -e "${BLUE}📦 Instalando dependencias del proyecto...${NC}"
npm install

# 4. Agregar plataforma iOS si no existe
if [ ! -d "ios" ]; then
    echo -e "${BLUE}📱 Agregando plataforma iOS...${NC}"
    npx cap add ios
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error agregando plataforma iOS${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Plataforma iOS ya existe${NC}"
fi

# 5. Crear directorio para íconos iOS
ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"
mkdir -p "$ICON_DIR"

echo -e "${BLUE}🎨 Generando íconos iOS en todos los tamaños...${NC}"

# 6. Generar todos los tamaños de íconos para iOS
declare -A ios_sizes=(
    ["Icon-App-20x20@1x.png"]="20"
    ["Icon-App-20x20@2x.png"]="40"
    ["Icon-App-20x20@3x.png"]="60"
    ["Icon-App-29x29@1x.png"]="29"
    ["Icon-App-29x29@2x.png"]="58"
    ["Icon-App-29x29@3x.png"]="87"
    ["Icon-App-40x40@1x.png"]="40"
    ["Icon-App-40x40@2x.png"]="80"
    ["Icon-App-40x40@3x.png"]="120"
    ["Icon-App-60x60@2x.png"]="120"
    ["Icon-App-60x60@3x.png"]="180"
    ["Icon-App-76x76@1x.png"]="76"
    ["Icon-App-76x76@2x.png"]="152"
    ["Icon-App-83.5x83.5@2x.png"]="167"
    ["Icon-App-1024x1024@1x.png"]="1024"
)

for filename in "${!ios_sizes[@]}"; do
    size=${ios_sizes[$filename]}
    echo "  Generando ${filename} (${size}x${size})"
    sips -z $size $size icon.png --out "$ICON_DIR/$filename" > /dev/null 2>&1

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error generando $filename${NC}"
        exit 1
    fi
done

# 7. Crear Contents.json para iOS
echo -e "${BLUE}📝 Configurando Contents.json...${NC}"

cat > "$ICON_DIR/Contents.json" << 'EOF'
{
  "images" : [
    {
      "filename" : "Icon-App-20x20@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-20x20@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-29x29@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-29x29@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-40x40@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-40x40@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-60x60@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "filename" : "Icon-App-60x60@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "filename" : "Icon-App-20x20@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-20x20@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-29x29@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-29x29@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-40x40@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-40x40@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-76x76@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "76x76"
    },
    {
      "filename" : "Icon-App-76x76@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76"
    },
    {
      "filename" : "Icon-App-83.5x83.5@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5"
    },
    {
      "filename" : "Icon-App-1024x1024@1x.png",
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

echo -e "${GREEN}✅ Íconos iOS generados correctamente (15 tamaños)${NC}"

# 8. Actualizar capacitor.config.js
echo -e "${BLUE}⚙️ Configurando Capacitor...${NC}"

if [ -f "capacitor.config.js" ]; then
    cp capacitor.config.js capacitor.config.js.backup
fi

cat > capacitor.config.js << 'EOF'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mantex.mobile',
  appName: 'Mantex Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Mantex Mobile',
    backgroundColor: '#E6F0F0'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#E6F0F0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#4A8C8C',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true
    }
  }
};

export default config;
EOF

echo -e "${GREEN}✅ Capacitor configurado${NC}"

# 9. Build del proyecto
echo -e "${BLUE}🔨 Construyendo proyecto...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en build del proyecto${NC}"
    exit 1
fi

# 10. Sync con Capacitor
echo -e "${BLUE}🔄 Sincronizando con Capacitor...${NC}"
npx cap sync ios

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error sincronizando con Capacitor${NC}"
    exit 1
fi

# 11. Instalar CocoaPods
echo -e "${BLUE}📦 Instalando CocoaPods...${NC}"
cd ios/App
pod install --repo-update

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando CocoaPods${NC}"
    cd ../..
    exit 1
fi

cd ../..

# 12. Crear splash screen
echo -e "${BLUE}🎨 Generando splash screen...${NC}"
SPLASH_DIR="ios/App/App/Assets.xcassets/Splash.imageset"
mkdir -p "$SPLASH_DIR"

# Crear splash simple con ícono centrado
sips -z 2048 2048 icon.png --out "$SPLASH_DIR/splash-2048x2048.png" > /dev/null 2>&1
sips -z 1536 1536 icon.png --out "$SPLASH_DIR/splash-1536x1536.png" > /dev/null 2>&1
sips -z 1024 1024 icon.png --out "$SPLASH_DIR/splash-1024x1024.png" > /dev/null 2>&1

cat > "$SPLASH_DIR/Contents.json" << 'EOF'
{
  "images" : [
    {
      "filename" : "splash-1024x1024.png",
      "idiom" : "universal",
      "scale" : "1x"
    },
    {
      "filename" : "splash-1536x1536.png",
      "idiom" : "universal",
      "scale" : "2x"
    },
    {
      "filename" : "splash-2048x2048.png",
      "idiom" : "universal",
      "scale" : "3x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

# 13. Mostrar resumen
echo ""
echo -e "${GREEN}🎉 ¡Setup iOS Completado!${NC}"
echo "========================="
echo ""
echo -e "${BLUE}📊 Resumen:${NC}"
echo "✅ Plataforma iOS agregada"
echo "✅ 15 íconos generados automáticamente"
echo "✅ Splash screen configurado"
echo "✅ Capacitor configurado"
echo "✅ CocoaPods instalado"
echo "✅ Proyecto sincronizado"
echo ""
echo -e "${YELLOW}📱 SIGUIENTES PASOS:${NC}"
echo ""
echo "1. Abrir Xcode:"
echo -e "   ${BLUE}npx cap open ios${NC}"
echo ""
echo "2. En Xcode configurar:"
echo "   • Team (Signing & Capabilities)"
echo "   • Bundle Identifier: com.mantex.mobile"
echo "   • Deployment Target: iOS 13.0+"
echo ""
echo "3. Conectar iPhone y hacer Build & Run (⌘+R)"
echo ""
echo -e "${GREEN}🚀 ¡Listo para compilar en tu iPhone!${NC}"

# 14. Ofrecer abrir Xcode
echo ""
read -p "¿Abrir Xcode ahora? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Abriendo Xcode...${NC}"
    npx cap open ios
fi