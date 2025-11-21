# 🚀 Guía Completa de Deployment - Mantex

## 🎯 Resumen

Esta guía te lleva paso a paso para hacer el deployment completo de Mantex con:
- **Frontend**: Vue.js + Vite + PrimeVue
- **Backend**: Supabase (PostgreSQL + Auth)
- **Storage**: AWS S3
- **Webhooks**: AWS Lambda + API Gateway
- **APIs**: Nubarium integration

## 📋 Pre-requisitos

### 1. Herramientas Requeridas
```bash
# Node.js 18+
node --version

# AWS CLI
aws --version

# Git
git --version
```

### 2. Cuentas Necesarias
- ✅ Supabase account (supabase.com)
- ✅ AWS account (aws.amazon.com)
- ✅ Nubarium credentials (ya configuradas)

## 🗃️ Step 1: Setup Supabase Database

### 1.1 Crear Proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Anota tu `Project URL` y `anon key`

### 1.2 Ejecutar Schema
```sql
-- Copia y pega todo el contenido de database/supabase-schema.sql
-- En el Supabase SQL Editor
```

### 1.3 Obtener Service Key
1. Settings > API
2. Copia el `service_role` key (para Lambda)

## ☁️ Step 2: AWS Infrastructure

### 2.1 Configurar AWS CLI
```bash
aws configure
# AWS Access Key ID: tu_access_key
# AWS Secret Access Key: tu_secret_key
# Default region: us-east-1
# Default output format: json
```

### 2.2 Setup Automático (Recomendado)
```bash
# Configurar variables para Lambda
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_KEY="tu_service_role_key"

# Ejecutar setup completo
chmod +x aws-setup.sh
./aws-setup.sh
```

El script automático creará:
- ✅ S3 bucket con security
- ✅ IAM roles para Lambda
- ✅ Lambda function
- ✅ API Gateway endpoint
- ✅ Todas las permissions

### 2.3 Setup Manual (Alternativo)
Si prefieres hacerlo paso a paso:

#### S3 Bucket
```bash
aws s3 mb s3://mantex-documents-$(date +%s) --region us-east-1
```

#### Lambda Function
```bash
cd lambda/nubarium-webhook
chmod +x deploy.sh
./deploy.sh
```

## 🌐 Step 3: Frontend Configuration

### 3.1 Variables de Entorno
Crea `.env.development` y `.env.production`:

```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# AWS S3
VITE_AWS_S3_BUCKET=mantex-documents-123456789
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=tu_access_key
VITE_AWS_SECRET_ACCESS_KEY=tu_secret_key

# Lambda Webhook (del output de aws-setup.sh)
VITE_LAMBDA_WEBHOOK_URL=https://api-id.execute-api.us-east-1.amazonaws.com/dev/webhook/sat
```

### 3.2 Instalar Dependencias
```bash
npm install
```

### 3.3 Desarrollo Local
```bash
npm run dev
```

### 3.4 Build para Producción
```bash
npm run build
```

## 🧪 Step 4: Testing

### 4.1 Test Frontend Local
```bash
npm run dev
# Abrir http://localhost:5173
```

### 4.2 Test Lambda Webhook
```bash
curl -X POST https://tu-webhook-url/webhook/sat \
  -H "Content-Type: application/json" \
  -d '{"codigoValidacion": "test123", "estatus": "OK"}'
```

### 4.3 Test Nubarium APIs
En la consola del browser:
```javascript
// Test OCR
const result = await nubariumService.validateINEOCR(base64Image);
console.log(result);
```

## 🎯 URLs Importantes

Después del deployment tendrás:
- **Frontend Dev**: http://localhost:5173
- **Supabase**: https://app.supabase.com/project/tu-proyecto
- **AWS Console**: https://console.aws.amazon.com
- **Lambda Webhook**: https://api-id.execute-api.us-east-1.amazonaws.com/dev/webhook/sat

## 📊 Servicios Implementados

### ✅ Nubarium APIs:
- OCR INE/IFE: `nubariumService.validateINEOCR()`
- Lista Nominal: `nubariumService.validateINENominalList()`
- Face Comparison: `nubariumService.validateFaceComparison()`
- RFC Validation: `nubariumService.validateRFC()`
- SAT Invoices: `nubariumService.getInvoicesFromSAT()`
- Block Lists 69: `nubariumService.queryBlockList69()`
- Block Lists 69-B: `nubariumService.queryBlockList69B()`

### ✅ Flujos Completos:
- Clients: OCR + Lista Nominal + Face Comparison
- Suppliers: OCR + SAT + Block Lists
- Documents: Upload automático a S3
- Webhooks: Recepción async de resultados SAT

## 🚀 Deployment a Producción

### Opción 1: Vercel (Frontend)
```bash
npm install -g vercel
vercel --prod
```

### Opción 2: Netlify (Frontend)
```bash
npm run build
# Subir carpeta dist/ a Netlify
```

### AWS Lambda (Backend)
```bash
# Ya deployado con aws-setup.sh
# Para updates:
cd lambda/nubarium-webhook
./deploy.sh
```

## 🛠️ Troubleshooting

### Error: AWS CLI not configured
```bash
aws configure
```

### Error: Supabase connection failed
- Verificar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
- Verificar que el proyecto Supabase esté activo

### Error: Lambda deployment failed
```bash
# Verificar IAM permissions
aws sts get-caller-identity

# Verificar variables de entorno
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY
```

### Error: S3 upload failed
- Verificar AWS credentials
- Verificar bucket permissions
- Verificar region configuration

## ✅ Checklist Final

- [ ] Supabase proyecto creado y schema ejecutado
- [ ] AWS CLI configurado
- [ ] aws-setup.sh ejecutado exitosamente
- [ ] Variables de entorno configuradas
- [ ] Frontend corriendo local
- [ ] Lambda webhook respondiendo
- [ ] Tests de Nubarium APIs funcionando
- [ ] S3 uploads funcionando

## 🎉 ¡Listo para Rockear!

Tu stack completo está listo:
- 🔐 **Auth**: Supabase
- 📊 **Database**: PostgreSQL (Supabase)
- 📁 **Storage**: AWS S3
- ⚡ **APIs**: Nubarium integration
- 🔄 **Webhooks**: AWS Lambda
- 🎨 **UI**: Vue.js + PrimeVue + Sakai

¡A mover datos! 🤘