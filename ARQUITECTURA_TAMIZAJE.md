# Chatbot EPIMex v4.0 - Sistema de Tamizaje Automático

## Resumen Ejecutivo

El Chatbot EPIMex v4.0 implementa un sistema completo de tamizaje automático que replica el proceso manual actual del estudio, eliminando la necesidad de clasificación manual de participantes y proporcionando respuestas más naturales mediante integración con OpenAI GPT.

## Arquitectura del Sistema

### 1. Flujo de Tamizaje Automático

```
Participante → Tamizaje (11 preguntas) → Clasificación Automática → Agendamiento → Recordatorios
```

#### Proceso Detallado:
1. **Invitación inicial** - Bot saluda y explica EPIMex
2. **Tamizaje principal** - 11 preguntas estructuradas
3. **Seguimiento psicosis** - Si pregunta 8 es positiva
4. **Clasificación automática** - Algoritmo determina: probando/familiar/control
5. **Agendamiento** - Si es elegible, proceso de cita
6. **Indicaciones** - Envío automático según sede
7. **Recordatorios** - 24h antes + seguimiento

### 2. Sistema de Preguntas de Tamizaje

#### Preguntas Principales (1-11):
1. **Edad y sexo biológico** - Validación de rango etario
2. **Nacionalidad** - Verificación de 4 abuelos mexicanos
3. **Diagnóstico psiquiátrico** - Identificación de condiciones
4. **Medicamentos** - Registro de tratamientos actuales
5. **Antecedentes familiares** - Historia psiquiátrica familiar
6. **Capacidades cognitivas** - Lectura, escritura, comunicación
7. **Muestras biológicas** - Capacidad de proporcionar muestras
8. **Experiencias psicóticas** - Screening inicial de síntomas
9. **Consumo de sustancias** - Historia de uso de drogas
10. **Participación familiar** - Verificación de familiares en estudio
11. **Fuente de información** - Cómo se enteró del estudio

#### Seguimiento de Psicosis (Si pregunta 8 = Sí):

**I. Alucinaciones:**
- Alucinaciones auditivas (voces, música, llamadas)
- Alucinaciones visuales (sombras, objetos, fantasmas)
- Alucinaciones olfativas
- Evaluación de convicción sobre realidad
- Contexto temporal (despierto/dormido)
- Factores precipitantes (fiebre, sustancias)

**II. Delirios:**
- Comprensión de imaginación
- Ideas no compartidas
- Delirios de persecución
- Delirios de grandeza
- Ideas de referencia
- Delirios somáticos
- Delirios apocalípticos

### 3. Algoritmo de Clasificación

#### Criterios para PROBANDO:
- Edad: 10-21 años
- Experiencias psicóticas positivas (pregunta 8 + seguimiento)
- Diagnóstico psiquiátrico en espectro psicótico
- 4 abuelos mexicanos
- Capacidad para muestras biológicas

#### Criterios para FAMILIAR:
- Familiar de probando identificado
- Edad: 10-75 años
- 4 abuelos mexicanos
- Sin exclusiones mayores

#### Criterios para CONTROL:
- Edad: 10-21 años
- Sin experiencias psicóticas
- Sin diagnóstico psiquiátrico
- Sin familiares con psicosis
- 4 abuelos mexicanos

#### Criterios de Exclusión:
- Psicosis inducida por sustancias
- Infección cerebral
- Enfermedades neurodegenerativas
- Trastornos del neurodesarrollo graves

### 4. Integración con OpenAI GPT

#### Funcionalidades:
- **Respuestas empáticas** - Adaptadas al contexto emocional
- **Clarificaciones** - Explicaciones adicionales cuando sea necesario
- **Reformulación** - Preguntas más naturales y comprensibles
- **Validación** - Confirmación de respuestas complejas

#### Prompts del Sistema:
```
Eres un asistente especializado en el estudio EPIMex. 
Debes ser empático, profesional y claro. 
Adapta tus respuestas al contexto emocional del participante.
Mantén la información científica precisa pero accesible.
```

### 5. Sistema de Base de Datos

#### Tablas Principales:

**participantes:**
- id, nombre, edad, sexo, telefono, email
- nacionalidad_abuelos, ciudad, sede_preferida
- fecha_registro, estado_proceso

**tamizaje_respuestas:**
- participante_id, pregunta_numero, respuesta
- fecha_respuesta, requiere_seguimiento

**clasificacion_participantes:**
- participante_id, tipo_clasificado, elegible
- criterios_cumplidos, criterios_faltantes
- fecha_clasificacion

**citas_agendadas:**
- participante_id, fecha_cita, hora_cita, sede
- estado_cita, recordatorio_enviado
- fecha_agendamiento

**recordatorios:**
- participante_id, tipo_recordatorio, fecha_envio
- mensaje_enviado, respuesta_recibida

### 6. Sistema de Recordatorios

#### Tipos de Recordatorios:

**Recordatorio de Cita (24h antes):**
```
¡Hola [nombre]! 👋

Te recordamos tu cita para EPIMex:
📅 Fecha: [fecha]
🕐 Hora: [hora]
📍 Sede: [sede]

Recuerda seguir las indicaciones que te enviamos.
¿Confirmas tu asistencia?
```

**Seguimiento de Participación:**
```
Hola [nombre], 

Hace unos días te contactamos sobre EPIMex.
¿Sigues interesado/a en participar?

Si tienes dudas, estamos aquí para ayudarte.
```

**Recordatorio Post-Tamizaje:**
```
Hola [nombre],

Completaste el tamizaje para EPIMex.
Nuestro equipo revisará tu información y te contactaremos pronto.

¿Tienes alguna pregunta mientras tanto?
```

### 7. Estados del Participante

```
nuevo → tamizaje_iniciado → tamizaje_completo → clasificado → 
elegible/no_elegible → agendado → recordatorio_enviado → 
cita_confirmada → completado
```

### 8. Métricas y Reportes

#### Métricas Automáticas:
- Tasa de completación de tamizaje
- Distribución de clasificaciones
- Tiempo promedio de tamizaje
- Tasa de elegibilidad por criterio
- Efectividad de recordatorios

#### Reportes para el Equipo:
- Dashboard de participantes activos
- Lista de citas próximas
- Participantes que requieren seguimiento
- Estadísticas de reclutamiento

## Beneficios del Sistema v4.0

### Para Participantes:
- ✅ Proceso más natural y empático
- ✅ Disponibilidad 24/7
- ✅ Respuestas inmediatas
- ✅ Recordatorios automáticos

### Para el Equipo EPIMex:
- ✅ Automatización del tamizaje
- ✅ Clasificación automática precisa
- ✅ Reducción de carga manual
- ✅ Base de datos centralizada
- ✅ Métricas en tiempo real

### Para el Estudio:
- ✅ Mayor eficiencia en reclutamiento
- ✅ Estandarización del proceso
- ✅ Mejor seguimiento de participantes
- ✅ Datos más completos y precisos

## Implementación Técnica

### Stack Tecnológico:
- **Backend:** Node.js + Express
- **WhatsApp:** whatsapp-web.js
- **IA:** OpenAI GPT-4
- **Base de Datos:** SQLite/PostgreSQL
- **Hosting:** Render/Railway
- **Recordatorios:** Cron jobs

### Seguridad y Privacidad:
- ✅ Encriptación de datos sensibles
- ✅ Cumplimiento con regulaciones de salud
- ✅ Backup automático de datos
- ✅ Logs de auditoría

## Cronograma de Implementación

**Fase 1 (2 horas):** Sistema de tamizaje + OpenAI
**Fase 2 (1 hora):** Base de datos + recordatorios
**Fase 3 (30 min):** Pruebas y despliegue

**Total:** 3.5 horas para sistema completo

