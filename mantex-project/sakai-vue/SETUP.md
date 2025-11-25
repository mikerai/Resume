# Setup Completo - Mantex + Nubarium

## Variables de Entorno Requeridas

### 1. Frontend (Vue.js)
Crea `.env.development` y `.env.production`:

```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# AWS S3 (para frontend)
VITE_AWS_S3_BUCKET=mantex-documents
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=tu_access_key
VITE_AWS_SECRET_ACCESS_KEY=tu_secret_key

# Lambda Webhook URL
VITE_LAMBDA_WEBHOOK_URL=https://tu-api-gateway.execute-api.us-east-1.amazonaws.com/dev/webhook/sat
```

### 2. Lambda Webhook
En `lambda/nubarium-webhook/`:

```bash
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_KEY="tu_service_role_key"
```

## Setup de Base de Datos (Supabase)

1. **Ejecutar el schema**:
   ```sql
   -- Ejecuta todo el contenido de database/supabase-schema.sql
   ```

## Setup de AWS

### 1. Crear S3 Bucket
```bash
aws s3 mb s3://mantex-documents --region us-east-1
```

### 2. Deploy Lambda Webhook
```bash
cd lambda/nubarium-webhook
npm install

# Opción 1: Con Serverless Framework
npm install -g serverless
sls deploy


### 3. Configurar IAM Role para Lambda
Permisos requeridos:
- `AWSLambdaBasicExecutionRole`
- `AmazonS3FullAccess` (o más restrictivo)

## Servicios Implementados

### Nubarium API Completa:
- **OCR INE/IFE**: `nubariumService.validateINEOCR()`
- **Lista Nominal**: `nubariumService.validateINENominalList()`
- **Face Comparison**: `nubariumService.validateFaceComparison()`
- **RFC Validation**: `nubariumService.validateRFC()`
- **SAT Invoices**: `nubariumService.getInvoicesFromSAT()`
- **Block Lists 69**: `nubariumService.queryBlockList69()`
- **Block Lists 69-B**: `nubariumService.queryBlockList69B()`

### Flujos Completos:
- **Clients**: `nubariumService.validateClientINE()` (OCR + Lista Nominal + Face)
- **Suppliers**: `nubariumService.validateSupplierINE()` + `validateSupplierSAT()`
- **Block Lists**: `nubariumService.queryAllBlockLists()` (ambas consultas)

## Testing

### Frontend:
```bash
npm run dev
```

### Lambda Local:
```bash
cd lambda/nubarium-webhook
node test.js
```

### Webhook Testing:
```bash
curl -X POST https://tu-webhook-url/webhook/sat \
  -H "Content-Type: application/json" \
  -d '{"codigoValidacion": "test123", "estatus": "OK"}'
```

## URLs importantes

- **Frontend**: http://localhost:5173
- **Supabase Dashboard**: https://app.supabase.com/project/tu-proyecto
- **AWS Console**: https://console.aws.amazon.com
- **Lambda Webhook**: Tu API Gateway URL

## Credenciales Nubarium

Ya configuradas en el código:
- **Username**: mantex
- **Password**: M#tifk_#c

¡Todo listo para rockear!