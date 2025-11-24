# 💬 Chat Testing Guide - Mantex

## Requisitos Previos

1. **Firebase Realtime Database** ya está configurado ✅
   - URL: `https://mantex-production-1cd9d-default-rtdb.firebaseio.com/`
   - Configuración en `.env` ya existe

2. **Database Migration** ejecutada ✅
   - Tabla `ticket_chat_metadata` creada

3. **Componentes creados** ✅
   - `useFirebaseChat.js` composable
   - `TicketChat.vue` component
   - Integrado en `TicketDetail.vue`

---

## Opción 1: Testing en Desarrollo Local (Más Fácil)

### Paso 1: Verificar Firebase Rules

Ve a [Firebase Console](https://console.firebase.google.com/project/mantex-production-1cd9d/database/mantex-production-1cd9d-default-rtdb/rules) y verifica que las reglas permitan lectura/escritura:

```json
{
  "rules": {
    "chats": {
      "$ticketId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

**Temporalmente para testing**, puedes usar reglas más permisivas (⚠️ NO en producción):

```json
{
  "rules": {
    "chats": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Paso 2: Iniciar la App Mobile

```bash
cd mantex-mobile
npm run dev
```

Esto abrirá la app en el navegador (localhost:5173 o similar).

### Paso 3: Login con Dos Usuarios Diferentes

**Usuario 1 - Cliente:**
1. Abre el navegador en modo normal
2. Login como cliente (ej: `flynn@mantex.mx`)
3. Ve a un ticket existente

**Usuario 2 - Técnico:**
1. Abre el navegador en modo incógnito/privado
2. Login como técnico/supplier
3. Ve al mismo ticket

### Paso 4: Probar el Chat

1. En la ventana del Cliente, escribe un mensaje: "Hola, ¿cuándo llegas?"
2. En la ventana del Técnico, deberías ver el mensaje aparecer en tiempo real
3. Responde desde el Técnico: "Llego en 15 minutos"
4. El Cliente debería ver la respuesta instantáneamente

### Paso 5: Verificar en Firebase Console

Ve a [Firebase Realtime Database](https://console.firebase.google.com/project/mantex-production-1cd9d/database/mantex-production-1cd9d-default-rtdb/data) y verifica que los mensajes se estén guardando en:

```
chats/
  ticket_{ticket_id}/
    messages/
      {message_id}/
        sender_id: "uuid"
        sender_name: "Flynn"
        sender_role: "client"
        text: "Hola, ¿cuándo llegas?"
        timestamp: 1234567890
        read: false
```

---

## Opción 2: Testing en Dispositivos Físicos

### Preparación

```bash
cd mantex-mobile
npm run build
npx cap sync ios
npx cap open ios
```

### En Xcode

1. Conecta dos iPhones físicos (o un iPhone + iPad)
2. Selecciona Device 1 en Xcode
3. Click Run (Cmd+R)
4. Espera a que instale
5. Cambia a Device 2
6. Click Run nuevamente

### Testing

1. **Device 1:** Login como cliente
2. **Device 2:** Login como técnico
3. Ambos abren el mismo ticket
4. Envían mensajes de ida y vuelta
5. Verifica que aparezcan en tiempo real

---

## Opción 3: Testing con Simulador + Navegador

Si solo tienes un dispositivo:

1. **Simulador iOS:** 
   ```bash
   npx cap run ios
   ```
   Login como cliente

2. **Navegador (Chrome):**
   ```bash
   npm run dev
   ```
   Login como técnico (en modo incógnito)

3. Prueba mensajes entre simulador y navegador

---

## Funcionalidades a Probar

### ✅ Mensajería Básica
- [ ] Enviar mensaje desde cliente
- [ ] Recibir mensaje en técnico (tiempo real)
- [ ] Enviar mensaje desde técnico
- [ ] Recibir mensaje en cliente (tiempo real)

### ✅ Indicadores de Escritura
- [ ] Ver "Escribiendo..." cuando el otro usuario está escribiendo
- [ ] Desaparecer cuando deja de escribir

### ✅ Marcado de Leídos
- [ ] Mensajes marcados como leídos al abrir el chat
- [ ] Indicador visual de mensajes no leídos

### ✅ Persistencia
- [ ] Cerrar y reabrir la app
- [ ] Mensajes siguen ahí
- [ ] Historial completo visible

### ✅ UI/UX
- [ ] Scroll automático a último mensaje
- [ ] Burbujas de chat con colores diferentes (cliente vs técnico)
- [ ] Timestamps visibles
- [ ] Nombres de usuario mostrados

---

## Troubleshooting

### Problema: Mensajes no aparecen en tiempo real

**Solución 1:** Verifica Firebase Rules
```bash
# Ve a Firebase Console → Realtime Database → Rules
# Asegúrate que auth != null o temporalmente true
```

**Solución 2:** Verifica la conexión
```javascript
// En el navegador, abre DevTools Console
// Deberías ver logs como:
// "🔥 Firebase chat initialized for ticket: {id}"
// "📨 Message sent successfully"
```

**Solución 3:** Verifica las credenciales de Firebase
```bash
# En mantex-mobile/.env
VITE_FIREBASE_API_KEY=AIzaSyBqtN...
VITE_FIREBASE_DATABASE_URL=https://mantex-production-1cd9d-default-rtdb.firebaseio.com/
```

### Problema: "Permission denied" en Firebase

**Causa:** Firebase Rules muy restrictivas

**Solución temporal:**
```json
{
  "rules": {
    "chats": {
      ".read": true,
      ".write": true
    }
  }
}
```

**Solución permanente:**
```json
{
  "rules": {
    "chats": {
      "$ticketId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['sender_id', 'text', 'timestamp'])"
          }
        }
      }
    }
  }
}
```

### Problema: Chat no se muestra en TicketDetail

**Solución:** Verifica que el ticket tenga un ID válido
```javascript
// En DevTools Console
console.log(ticket.value?.id)
// Debe mostrar un UUID válido
```

### Problema: Typing indicators no funcionan

**Causa:** Listeners no configurados correctamente

**Solución:** Verifica en `useFirebaseChat.js` que los listeners estén activos:
```javascript
// Deberías ver en console:
// "👀 Listening to typing indicators"
```

---

## Testing Checklist Completo

### Preparación
- [ ] Firebase Rules configuradas
- [ ] Dos usuarios de prueba (cliente + técnico)
- [ ] Al menos un ticket existente
- [ ] App corriendo en dev mode

### Tests Funcionales
- [ ] Enviar mensaje cliente → técnico
- [ ] Enviar mensaje técnico → cliente
- [ ] Mensajes aparecen en tiempo real (< 1 segundo)
- [ ] Typing indicators funcionan
- [ ] Read receipts funcionan
- [ ] Scroll automático al último mensaje
- [ ] Historial persiste al recargar

### Tests de UI
- [ ] Burbujas de chat tienen colores correctos
- [ ] Timestamps son legibles
- [ ] Nombres de usuario visibles
- [ ] Input field funciona correctamente
- [ ] Botón de enviar funciona
- [ ] Diseño responsive (mobile + web)

### Tests de Edge Cases
- [ ] Enviar mensaje vacío (debería bloquearse)
- [ ] Enviar mensaje muy largo (> 500 caracteres)
- [ ] Múltiples mensajes rápidos
- [ ] Conexión intermitente
- [ ] Usuario desconectado

---

## Comandos Rápidos

```bash
# Iniciar en dev mode
cd mantex-mobile && npm run dev

# Build para iOS
npm run build && npx cap sync ios && npx cap open ios

# Ver logs de Firebase en tiempo real
# Ve a Firebase Console → Realtime Database → Data
# Expande: chats → ticket_{id} → messages

# Limpiar cache si hay problemas
rm -rf node_modules/.vite
npm run dev
```

---

## Próximos Pasos Después del Testing

1. **Ajustar Firebase Rules** para producción
2. **Agregar notificaciones push** cuando llega un mensaje
3. **Implementar contador de mensajes no leídos** en el badge del ticket
4. **Agregar soporte para imágenes** en el chat
5. **Implementar chat en web portal** (sakai-vue)

---

## Notas Importantes

⚠️ **Firebase Rules Temporales:** Las reglas permisivas (`.read: true, .write: true`) son SOLO para testing. En producción DEBES usar autenticación.

✅ **Ya Configurado:** Firebase ya está integrado y funcionando en el proyecto. Solo necesitas probar la funcionalidad del chat.

🔥 **Realtime:** Los mensajes deberían aparecer instantáneamente (< 1 segundo de latencia).

💾 **Persistencia:** Todos los mensajes se guardan permanentemente en Firebase Realtime Database.
