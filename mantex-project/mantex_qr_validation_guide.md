# Guía de Implementación: Validación de Técnicos (Mantex)

Esta guía describe cómo implementar un sistema de validación de identidad para proveedores (técnicos) en el proyecto **Mantex**, inspirado en la lógica de "Promotores BpB".

El objetivo es permitir que los **Clientes** validen la identidad y asignación de un **Técnico** mediante dos métodos:
1.  **Escaneo de QR Dinámico**: Validación rápida y segura en sitio.
2.  **Búsqueda Manual**: Validación remota o alternativa mediante ID, Correo o Usuario.

## 1. Arquitectura General

El sistema consta de tres partes:
1.  **App del Técnico (Provider)**: Genera y muestra el código QR dinámico.
2.  **Portal/App del Cliente**:
    *   **Escáner QR**: Lee el código para validación inmediata.
    *   **Buscador de Proveedores**: Formulario para validar manualmente por credenciales.
3.  **Backend (API)**: Genera los tokens seguros y valida la información en tiempo real.

## 2. Estrategia de QR Dinámico

A diferencia de un QR estático (que solo contiene un ID fijo), un QR dinámico debe contener un **Token** que cambie según las reglas de negocio (diario o por ticket).

### Opción Recomendada: Token por Ticket (Servicio)
Esta es la opción más segura. El QR valida no solo *quién* es el técnico, sino *a qué* va (a atender el Ticket #12345).

*   **Contenido del QR**: URL de validación con un token único.
    *   Ejemplo: `https://mantex.com/validar?token=eyJhbGciOiJIUz...`
*   **Validez**: El token expira cuando se cierra el ticket o después de X horas.

## 3. Implementación en la App (Técnico)

La App debe solicitar al backend un token válido antes de renderizar el QR.

### Componente: `TechnicianQr.vue`

```vue
<template>
  <ion-page>
    <ion-content>
      <div class="qr-container">
        <h2>Mi Identificación Mantex</h2>
        
        <!-- Muestra el QR solo si tenemos el token -->
        <qrcode-vue 
          v-if="qrToken"
          :value="qrContent" 
          :size="300" 
          level="H" 
        />
        
        <div class="info">
          <p>Técnico: {{ technician.name }}</p>
          <p>ID Público: {{ technician.public_id }}</p>
          <p class="expiry">Válido hasta: {{ tokenExpiry }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<!-- ... (Script similar al anterior, solicitando token al backend) ... -->
```

## 4. Implementación en el Portal Web / App Cliente

El cliente tendrá una sección dedicada a "Validación de Proveedor" que soporta ambos flujos.

### Componente: `ProviderValidation.vue`

Este componente maneja tanto la entrada por URL (QR escaneado) como la búsqueda manual.

```vue
<template>
  <div class="validation-page">
    
    <!-- 1. Formulario de Búsqueda Manual (Si no hay token en URL) -->
    <div v-if="!token && !isValid" class="search-section">
      <h2>Validar Proveedor</h2>
      <p>Ingrese el ID, Correo o Usuario del técnico para verificar su identidad.</p>
      
      <form @submit.prevent="searchProvider">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Ej: TEC-12345, juan@mantex.com" 
          class="form-control"
        />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Buscando...' : 'Validar' }}
        </button>
      </form>
    </div>

    <!-- 2. Resultados de Validación -->
    
    <!-- Estado: Válido -->
    <div v-if="isValid" class="success-card">
      <div class="header">
        <img src="/img/check-verified.png" alt="Verificado" />
        <h1>Técnico Verificado</h1>
      </div>
      
      <div class="provider-details">
        <img :src="provider.photo_url" class="avatar" />
        <h2>{{ provider.full_name }}</h2>
        <p><strong>ID:</strong> {{ provider.public_id }}</p>
        <p><strong>Estatus:</strong> <span class="badge-success">Activo</span></p>
        <p><strong>Empresa:</strong> {{ provider.company_name }}</p>
      </div>

      <!-- Información del Ticket (Solo si se validó por QR/Token de servicio) -->
      <div class="service-details" v-if="ticket">
        <h3>Servicio Asignado</h3>
        <p>Ticket #{{ ticket.id }}: {{ ticket.description }}</p>
      </div>
      
      <button @click="resetSearch" class="btn-secondary">Nueva Búsqueda</button>
    </div>

    <!-- Estado: No Encontrado / Inválido -->
    <div v-if="error" class="error-card">
      <h1>No se pudo validar</h1>
      <p>{{ errorMessage }}</p>
      <p>Verifique los datos o solicite al técnico que actualice su aplicación.</p>
      <button @click="resetSearch" class="btn-secondary">Intentar de nuevo</button>
    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '',
      token: null,
      loading: false,
      isValid: false,
      error: false,
      errorMessage: '',
      provider: {},
      ticket: null
    }
  },
  async created() {
    // Caso 1: Validación por QR (Token en URL)
    const token = this.$route.query.t;
    if (token) {
      this.token = token;
      await this.validateToken(token);
    }
  },
  methods: {
    // Flujo A: Búsqueda Manual
    async searchProvider() {
      if (!this.searchQuery) return;
      
      this.loading = true;
      this.error = false;
      this.isValid = false;

      try {
        // Endpoint que busca por campos públicos (ID, email, username)
        const response = await this.$api.post('/public/search-provider', { 
          query: this.searchQuery 
        });
        
        if (response.data.found) {
          this.isValid = true;
          this.provider = response.data.provider;
          // Nota: La búsqueda manual generalmente no retorna info de ticket específico
          // a menos que se cruce con los tickets activos del cliente logueado.
        } else {
          this.error = true;
          this.errorMessage = 'No se encontró ningún técnico con esos datos.';
        }
      } catch (e) {
        this.error = true;
        this.errorMessage = 'Error de conexión al validar.';
      } finally {
        this.loading = false;
      }
    },

    // Flujo B: Validación por Token (QR)
    async validateToken(token) {
      this.loading = true;
      try {
        const response = await this.$api.post('/public/validate-provider-qr', { token });
        
        if (response.data.valid) {
          this.isValid = true;
          this.provider = response.data.provider;
          this.ticket = response.data.ticket;
        } else {
          this.error = true;
          this.errorMessage = 'El código QR ha expirado o no es válido.';
        }
      } catch (e) {
        this.error = true;
        this.errorMessage = 'Error al verificar el código.';
      } finally {
        this.loading = false;
      }
    },

    resetSearch() {
      this.searchQuery = '';
      this.token = null;
      this.isValid = false;
      this.error = false;
      this.provider = {};
      this.ticket = null;
      // Limpiar query params si es necesario
      this.$router.replace({ query: null });
    }
  }
}
</script>
```

## 5. Backend (Lógica Sugerida)

### Endpoint: `POST /public/search-provider` (Nuevo)
1.  Recibe `{ query: "juan@mantex.com" }` (o ID, Username).
2.  Busca en la tabla de proveedores.
3.  **Importante**: Solo retorna proveedores con estado "Activo".
4.  Retorna datos públicos limitados (Nombre, Foto, ID, Empresa).

### Endpoint: `POST /public/validate-provider-qr`
1.  Recibe `{ token: "xyz..." }`.
2.  Decodifica y valida expiración.
3.  Retorna datos del proveedor y contexto del servicio (Ticket).

---

## Resumen
Con esta actualización, el cliente tiene flexibilidad total:
*   **En sitio**: Usa la cámara para escanear el QR del técnico.
*   **Remoto / Sin cámara**: Pide el ID o correo al técnico y lo ingresa manualmente en el portal.
