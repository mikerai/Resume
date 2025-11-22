#  Estructura de Almacenamiento S3 Universal

##  Arquitectura del Bucket `mantex-documents-1763361307`

###  Estructura Base Universal para CLIENTS y SUPPLIERS

```
mantex-documents-1763361307/
├── users/
│   ├── {username}/                    # Username único del usuario
│   │   ├──  IDENTIFICACIÓN/
│   │   │   ├── ine/
│   │   │   │   ├── {timestamp}_ine_front.jpg
│   │   │   │   ├── {timestamp}_ine_back.jpg
│   │   │   │   └── {timestamp}_selfie.jpg
│   │   │
│   │   ├──  DOCUMENTOS EMPRESARIALES (SUPPLIERS)/
│   │   │   ├── insurance/
│   │   │   │   ├── {timestamp}_poliza_responsabilidad.pdf
│   │   │   │   └── {timestamp}_seguro_daños.pdf
│   │   │   ├── legal/
│   │   │   │   ├── {timestamp}_acta_constitutiva.pdf
│   │   │   │   ├── {timestamp}_rfc_empresa.pdf
│   │   │   │   └── {timestamp}_poder_notarial.pdf
│   │   │   └── certification/
│   │   │       ├── {timestamp}_titulo_profesional.pdf
│   │   │       ├── {timestamp}_certificacion_iso.pdf
│   │   │       └── {timestamp}_licencia_operacion.pdf
│   │   │
│   │   ├──  EVIDENCIAS DE TRABAJO (CLIENTS + SUPPLIERS)/
│   │   │   ├── evidence/
│   │   │   │   ├── {timestamp}_antes_trabajo.jpg
│   │   │   │   ├── {timestamp}_durante_proceso.jpg
│   │   │   │   ├── {timestamp}_despues_completado.jpg
│   │   │   │   └── {timestamp}_materiales_utilizados.jpg
│   │   │   ├── receipts/
│   │   │   │   ├── {timestamp}_comprobante_materiales.pdf
│   │   │   │   └── {timestamp}_recibo_servicio.jpg
│   │   │   └── contracts/
│   │   │       ├── {timestamp}_contrato_firmado.pdf
│   │   │       └── {timestamp}_orden_trabajo.pdf
│   │   │
│   │   ├──  REPORTES Y CONTROL (CLIENTS + SUPPLIERS)/
│   │   │   ├── reports/
│   │   │   │   ├── {timestamp}_reporte_avance.pdf
│   │   │   │   ├── {timestamp}_informe_final.docx
│   │   │   │   └── {timestamp}_analisis_calidad.pdf
│   │   │   ├── checklists/
│   │   │   │   ├── {timestamp}_checklist_seguridad.pdf
│   │   │   │   └── {timestamp}_lista_verificacion.xlsx
│   │   │   └── inspections/
│   │   │       ├── {timestamp}_inspeccion_inicial.pdf
│   │   │       └── {timestamp}_auditoria_final.pdf
│   │   │
│   │   └──  DOCUMENTOS FINANCIEROS (CLIENTS + SUPPLIERS)/
│   │       ├── invoices/
│   │       │   ├── {timestamp}_factura_001.pdf
│   │       │   └── {timestamp}_nota_credito.pdf
│   │       ├── payments/
│   │       │   ├── {timestamp}_comprobante_pago.pdf
│   │       │   └── {timestamp}_transferencia_bancaria.jpg
│   │       └── budgets/
│   │           ├── {timestamp}_presupuesto_inicial.xlsx
│   │           └── {timestamp}_cotizacion_final.pdf
```

## Casos de Uso por Rol

###  **CLIENTS (Clientes)**
```javascript
// Subir evidencias de trabajo recibido
await uploadWorkEvidence(fotos, username, jobId);

// Subir comprobantes de pago
await uploadFinancialDocuments([comprobante], username, 'payments');

// Subir checklists de satisfacción
await uploadReportsAndChecklists([checklist], username, 'checklists');

// Subir contratos firmados
await uploadMultipleDocuments([contrato], username, 'contracts');
```

###  **SUPPLIERS (Proveedores)**
```javascript
// Documentos de onboarding
await uploadINEFiles(ineFront, ineBack, selfie, username, verificationId);
await uploadMultipleDocuments(seguros, username, 'insurance');
await uploadMultipleDocuments(certificados, username, 'certification');

// Evidencias de trabajo realizado
await uploadWorkEvidence(fotosAntesDespues, username, jobId);

// Reportes de trabajo
await uploadReportsAndChecklists([reporte], username, 'reports');

// Facturas y presupuestos
await uploadFinancialDocuments([factura], username, 'invoices');
```

## 🛡️Características de Seguridad

###  **Estructura de Archivos**
- **Timestamp único:** Evita colisiones de nombres
- **Username separation:** Cada usuario tiene su espacio
- **Document categorization:** Organización lógica por tipo
- **Sanitized filenames:** Nombres de archivo seguros

###  **Metadatos Almacenados**
```javascript
metadata: {
    username: 'juan_perez',
    documentType: 'evidence',
    verificationId: 'uuid-verification',
    originalFilename: 'trabajo_completado.jpg',
    uploadTimestamp: '2024-01-15T10:30:00Z'
}
```

###  **Políticas de Acceso**
- **User isolation:** Solo acceso a sus propios archivos
- **Role-based access:** Permisos según rol (client/supplier)
- **Audit trail:** Log completo de subidas/accesos
- **Encryption:** AES256 en reposo

## Integración con Base de Datos

###  **Tabla `documents`**
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    document_type VARCHAR(50),  -- 'evidence', 'invoices', etc.
    document_name VARCHAR(255), -- Nombre original
    file_url VARCHAR(500),      -- URL pública S3
    s3_key VARCHAR(500),        -- Key interno S3
    file_size INTEGER,
    mime_type VARCHAR(100),
    verification_id UUID,       -- Opcional: referencia a verificación
    created_at TIMESTAMP DEFAULT NOW()
);
```

##  Funciones del Composable

###  **Upload Functions**
```javascript
const {
    // Básicas
    uploadFileToS3,
    uploadMultipleDocuments,

    // Especializadas
    uploadINEFiles,           // Solo onboarding
    uploadWorkEvidence,       // Clients + Suppliers
    uploadFinancialDocuments, // Clients + Suppliers
    uploadReportsAndChecklists, // Clients + Suppliers

    // Gestión
    deleteFileFromS3,
    listUserFiles
} = useS3Upload();
```

## Escalabilidad

### **Ventajas de la Estructura**
-  **Universal:** Sirve para clients y suppliers
-  **Extensible:** Fácil agregar nuevos tipos de documentos
-  **Organizada:** Estructura lógica y navegable
-  **Segura:** Separación por usuario y tipo
-  **Auditable:** Timestamps y metadatos completos
-  **Performante:** Búsquedas eficientes por usuario/tipo

###  **Métricas Estimadas**
- **Usuarios:** ~10,000 usuarios
- **Documentos por usuario:** ~100-500 archivos
- **Espacio promedio:** ~50MB por usuario
- **Total estimado:** ~500GB - 2.5TB

¡Estructura lista para escalar con el crecimiento de Mantex! 