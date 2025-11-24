# Mantex Project Setup Guide

## Estructura del Proyecto

```
mantex-project/
├── sakai-vue/          # Web Application (Admin Panel)
├── mantex-mobile/      # Mobile App (Ionic + Vue + Capacitor)
└── docs/              # Documentación compartida
```

## Prerrequisitos

### Herramientas Requeridas
- **Node.js** >= 18.x
- **Ruby** >= 3.1.4 (para iOS development)
- **CocoaPods** >= 1.16.x (para iOS)
- **Xcode** >= 14.x (para iOS builds)
- **Android Studio** (para Android builds)

### Cuentas y Servicios
- **Supabase** account
- **Firebase** project
- **AWS** account (S3 + Lambda)
- **Google Cloud Console** (Maps + Calendar APIs)

## Instalación Rápida

### 1. Clonar Repositorio
```bash
git clone [repo-url]
cd mantex-project
```

### 2. Configurar Web Application
```bash
cd sakai-vue
npm install
```

### 3. Configurar Mobile App
```bash
cd ../mantex-mobile
npm install
```

### 4. Variables de Entorno
Cada proyecto usa 3 archivos:
- `.env` - Variables por defecto
- `.env.development` - Desarrollo local
- `.env.production` - Producción

** IMPORTANTE**: Nunca commitear los archivos `.env` con valores reales.

## Setup iOS (Mobile App)

### 1. Instalar Ruby y CocoaPods
```bash
# Instalar rbenv (sin Homebrew)
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash

# Instalar Ruby 3.1.4
rbenv install 3.1.4
rbenv global 3.1.4

# Instalar CocoaPods
gem install cocoapods
```

### 2. Setup iOS Project
```bash
cd mantex-mobile
./setup-ios-complete.sh
```

### 3. Abrir en Xcode
```bash
npm run ios:open
```

## Configuración de Servicios

### Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Obtener URL y anon key
3. Ejecutar SQL para crear tablas (ver `database/` folder)

### Firebase
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Realtime Database
3. Configurar reglas de seguridad
4. Obtener config object

### AWS S3 + Lambda
1. Crear bucket S3
2. Configurar políticas de CORS
3. Crear funciones Lambda para upload/delete/list
4. Configurar API Gateway

### Google APIs
1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Maps API y Calendar API
3. Crear credenciales OAuth 2.0
4. Configurar pantalla de consentimiento

## Comandos de Desarrollo

### Web Application (sakai-vue/)
```bash
npm run dev              # Desarrollo (localhost:3000)
npm run dev:prod         # Desarrollo con env producción
npm run build            # Build para producción
npm run build:dev        # Build para desarrollo
```

### Mobile App (mantex-mobile/)
```bash
npm run dev              # Desarrollo web (localhost:8100)
npm run build            # Build para producción
npm run ios:sync         # Sincronizar con iOS
npm run ios:run          # Ejecutar en simulador iOS
```

## Variables de Entorno

### Variables Compartidas (Ambos Proyectos)
```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key

# Firebase
VITE_FIREBASE_API_KEY=tu-firebase-api-key
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_DATABASE_URL=https://tu-project-rtdb.firebaseio.com/
VITE_FIREBASE_VAPID_KEY=tu-vapid-key

# AWS
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=mantex-documents

# Google APIs
VITE_GOOGLE_MAPS_API_KEY=tu-maps-api-key
VITE_GOOGLE_OAUTH_CLIENT_ID=tu-oauth-client-id
```

## Base de Datos (Supabase)

### Usuarios de Prueba
```sql
-- Admin Usuario
email: admin@mantex.mx
password: admin123
role: admin.operator

-- Técnico Usuario
email: tecnico@mantex.mx
password: tecnico123
role: supplier.operator

-- Super Admin
email: m@511.mx
password: master123
role: admin.god
```

## Testing

### Web Application
```bash
cd sakai-vue
npm run test:unit       # Unit tests
npm run test:e2e        # E2E tests
npm run lint           # Linting
```

### Mobile App
```bash
cd mantex-mobile
npm run test:unit       # Unit tests
npm run test:e2e        # E2E tests (Cypress)
npm run lint           # ESLint
```

## Deployment

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones completas de deployment.

## Troubleshooting

### Problemas Comunes

**Error: CocoaPods not found**
```bash
gem install cocoapods
rbenv rehash
```

**Error: Ruby version**
```bash
rbenv install 3.1.4
rbenv global 3.1.4
```

**Error: Capacitor sync**
```bash
npx cap sync ios
npx cap sync android
```

**Error: Xcode licensing**
```bash
sudo xcodebuild -runFirstLaunch
```

### Logs Útiles
```bash
# iOS device logs
npx cap run ios --list
npx cap run ios --target=[device-id]

# Android logs
npx cap run android --list
npx cap run android --target=[device-id]
```

## Soporte

Para problemas específicos:
1. Revisar logs en consola del navegador/device
2. Verificar configuración de variables de entorno
3. Confirmar que todos los servicios externos estén configurados
4. Revisar permisos en Supabase, Firebase, AWS, etc.

---

**Última actualización**: Noviembre 2024
**Versión**: 1.0.0