# End-of-Day Guidelines

## Daily Closing Routine

Al finalizar cada sesión de trabajo, se deben actualizar los siguientes archivos para mantener la documentación del proyecto al día:

### Archivos a Actualizar

1. **`master_implementation_plan.md`** (Ubicación: `.gemini/antigravity/brain/{conversation_id}/`)
   - Agregar nuevos capítulos si se completó una funcionalidad mayor.
   - Actualizar el roadmap con nuevas tareas identificadas.
   - Marcar como completadas las tareas finalizadas.

2. **`session-summary.md`** (Ubicación: `.agent/` en raíz del proyecto)
   - Crear resumen detallado de lo realizado en la sesión.
   - Incluir: objetivos completados, bugs resueltos, decisiones técnicas, aprendizajes.
   - Listar tareas pendientes identificadas durante la sesión.
   - Añadir estadísticas (archivos modificados, funciones creadas, etc.).

3. **`BUGS.md`** (Ubicación: raíz del proyecto)
   - Marcar como resueltos los bugs que se corrigieron.
   - Agregar nuevos bugs descubiertos.
   - Actualizar prioridades si es necesario.

4. **`tasks.md` / `backlog.md`** (Si existen en el proyecto)
   - Actualizar el estado de las tareas completadas.
   - Agregar nuevas tareas identificadas.
   - Reorganizar prioridades según lo discutido.

5. **`walkthrough.md`** (Si existe)
   - Actualizar con nuevos flujos implementados.
   - Documentar cambios en la arquitectura.

6. **Archivos Markdown (.md)**
    - Todos los **nuevos** archivos de documentación (`.md`) que se generen en el proyecto DEBEN guardarse dentro de la carpeta `/documentation` en la raíz del proyecto.
    - Excepción: Los archivos de configuración de agente que viven en `.agent/`.

---

## Formato del Session Summary

Cada `session-summary.md` debe incluir:

### Estructura Recomendada

```markdown
# Session Summary - [Fecha]

## Overview
Breve descripción de los objetivos principales de la sesión.

## Objetivos Completados
- Lista de funcionalidades implementadas
- Componentes creados o modificados
- Integraciones realizadas

## Bugs Resueltos
- Descripción del bug
- Solución aplicada
- Archivos modificados

## Decisiones Técnicas
- Decisiones arquitectónicas tomadas
- Justificación de las decisiones
- Alternativas consideradas

## Aprendizajes
- Lecciones aprendidas
- Mejores prácticas identificadas
- Errores a evitar

## Tareas Pendientes
- Lista priorizada de próximas tareas
- Nuevas funcionalidades identificadas
- Refactorización pendiente

## Estadísticas
- Archivos modificados
- Líneas de código agregadas/eliminadas
- Componentes creados
- Bugs resueltos

## Próximos Pasos
- Plan para la siguiente sesión
- Prioridades para el día siguiente
```

---

## Flujo de Cierre

1. **Revisión de Cambios**:
   - Verificar que todos los cambios importantes estén commiteados.
   - Asegurar que no haya archivos críticos sin versionar.

2. **Actualización de Documentación**:
   - Ejecutar la rutina de actualización de archivos mencionados arriba.
   - Verificar que los archivos `.env` no tengan credenciales reales commiteadas.

3. **Commit Final**:
   - Hacer commit con mensaje descriptivo: `docs: end-of-day update - [breve resumen]`
   - Push a la rama correspondiente.

4. **Verificación**:
   - Confirmar que el build de producción funciona (si aplica).
   - Verificar que los deploys críticos estén completos.

---

## Protocolo de Despliegue (Staging)

El despliegue a `dev.mantex.mx` se realiza mediante carga manual a S3.

**Comando Oficial:**
```bash
cd sakai-vue
npm run build
aws s3 sync dist/ s3://dev.mantex.mx
```
*Nota: JAMÁS usar la bandera `--delete` para evitar borrar archivos existentes que no estén en el build local.*

---

## Checklist de Cierre de Día

- [ ] `master_implementation_plan.md` actualizado
- [ ] `session-summary.md` creado con resumen detallado
- [ ] `BUGS.md` actualizado (bugs resueltos y nuevos)
- [ ] `tasks.md` / `backlog.md` actualizado
- [ ] `walkthrough.md` actualizado (si aplica)
- [ ] Archivos `.env` verificados (sin credenciales reales en git)
- [ ] Commit de documentación realizado
- [ ] Push completado
- [ ] Build de producción verificado (si hubo cambios críticos)

---

## Notas Importantes

- **Consistencia**: Mantener el formato consistente a lo largo de todas las sesiones.
- **Detalle**: Ser específico en los resúmenes, incluir contexto suficiente para que otra persona (o el yo futuro) entienda las decisiones.
- **Priorización**: Actualizar siempre las prioridades en el backlog según lo aprendido en la sesión.
- **Honestidad**: Documentar tanto éxitos como errores/aprendizajes.

---

## Automatización (Opcional)

Para futuras mejoras, considerar crear un script que:
- Genere automáticamente el template del session-summary.
- Extraiga estadísticas de git (commits, archivos modificados).
- Solicite input del usuario para secciones clave.
- Actualice automáticamente el master plan basado en inputs.
