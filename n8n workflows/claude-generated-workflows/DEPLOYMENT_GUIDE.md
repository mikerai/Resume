# File Processing System for Mexico - Deployment Guide

## Overview

This guide covers the deployment of the specialized file processing system designed for Mexican businesses. The workflow handles:

- **CFDI (Comprobantes Fiscales Digitales)** - Mexican electronic invoices
- **Bank statements** from Mexican banks (BBVA, Santander, Banorte, Banamex)
- **Accounting reports** and general financial documents
- **Document classification and validation**
- **Knowledge base indexing** for RAG integration

## Quick Deployment

### Automated Script
```bash
./deploy_file_processing_system.sh https://your-n8n.domain.com/api/v1 your-api-key
```

### Manual API Deployment
```bash
curl -X POST "https://your-n8n.domain.com/api/v1/workflows" \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: your-api-key" \
  -d @file_processing_system_mexico.json
```

## Webhook Endpoint

After deployment, the file upload endpoint will be available at:
```
POST https://your-n8n.domain.com/webhook/upload-financial-files
```

## Test Request Example

```bash
curl -X POST "https://your-n8n.domain.com/webhook/upload-financial-files" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "EMPRESA_PRUEBA",
    "userId": "usuario_test", 
    "files": [
      {
        "name": "factura_cfdi_test.xml",
        "size": 2048
      }
    ]
  }'
```

## Workflow Features

1. **Multi-format file validation** (XML, PDF, CSV, Excel)
2. **CFDI specialized processing** with SAT compliance validation
3. **Mexican bank statement analysis** (BBVA, Santander, Banorte, Banamex)
4. **Automatic document classification**
5. **Financial data extraction and structuring**
6. **Knowledge base indexing** for RAG integration
7. **Processing insights and recommendations**

## Integration Ready

- ✅ Web RAG chatbot integration points
- ✅ Bank reconciliation service compatibility
- ✅ Vector database indexing for RAG queries
- ✅ Mexican compliance (SAT CFDI, Mexican banking formats)

## Next Steps

1. Deploy using the provided script
2. Test with sample files
3. Configure integrations with other workflows
4. Monitor processing performance

**Status**: Ready for Production
