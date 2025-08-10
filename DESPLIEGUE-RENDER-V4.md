# 🚀 Guía de Despliegue - ChatBot EPIMex v4.0 en Render

Esta guía te llevará paso a paso para desplegar el ChatBot EPIMex v4.0 avanzado en Render.

## ⏱️ Tiempo Estimado: 20-30 minutos

## 📋 Requisitos Previos

✅ Cuenta en GitHub  
✅ Cuenta en Render (gratuita)  
✅ API Key de OpenAI  
✅ Archivos del proyecto listos  

## 🎯 Paso 1: Preparar Repositorio GitHub

### 1.1 Verificar Archivos Necesarios

Tu repositorio DEBE contener estos archivos en la raíz:

```
EPIMex-chatbot/
├── package.json          ← OBLIGATORIO
├── index.js              ← OBLIGATORIO  
├── database.js           ← OBLIGATORIO
├── tamizaje.js           ← OBLIGATORIO
├── openai-service.js     ← OBLIGATORIO
├── recordatorios.js      ← OBLIGATORIO
├── .env                  ← OBLIGATORIO
├── README.md
├── .gitignore
├── render.yaml
└── .env.example
```

### 1.2 Subir Archivos a GitHub

1. **Ve a tu repositorio:** https://github.com/nulanzagorta/EPIMex-chatbot
2. **Elimina archivos antiguos** (si los hay)
3. **Sube TODOS los archivos** del chatbot v4.0
4. **Verifica** que `package.json` e `index.js` estén en la raíz

## 🌐 Paso 2: Configurar Render

### 2.1 Crear Nuevo Servicio

1. **Ve a Render:** https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub** (si no está conectado)
4. **Selecciona** tu repositorio `EPIMex-chatbot`

### 2.2 Configuración Básica

**Configurar estos campos:**

- **Name:** `chatbot-epimex-v4`
- **Environment:** `Node`
- **Region:** `Oregon (US West)`
- **Branch:** `main` (o `master`)
- **Root Directory:** ` ` (dejar vacío)
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 2.3 Plan de Servicio

- **Selecciona:** `Free` (para empezar)
- **Auto-Deploy:** ✅ Activado

## ⚙️ Paso 3: Variables de Entorno

### 3.1 Configurar Variables Obligatorias

En la sección **Environment**, agregar estas variables:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `ESTUDIO_NOMBRE` | `EPIMex` |
| `CONTACTO_EMAIL` | `EPIMex@gmc.org.mx` |
| `SITIO_WEB` | `www.epimex.net` |
| `CONTACTO_WHATSAPP_BJ` | `55 3206 7976` |
| `CONTACTO_WHATSAPP_TLALPAN` | `55 7871 0328` |
| `SEDE_BJ` | `Carracci 107, Col. Extremadura Insurgentes, 03740, Benito Juárez, Ciudad de México` |
| `SEDE_TLALPAN` | `Av. San Fernando 86, Col. Belisario Domínguez, 14080, Tlalpan, Ciudad de México` |
| `HORARIOS_ATENCION` | `Lunes a Viernes 9:00-17:00` |
| `WHATSAPP_SESSION_NAME` | `epimex_v4_production` |
| `OPENAI_MODEL` | `gpt-4` |

### 3.2 Variable Crítica - OpenAI API Key

⚠️ **MUY IMPORTANTE:**

| Variable | Valor |
|----------|-------|
| `OPENAI_API_KEY` | `TU_API_KEY_DE_OPENAI` |

**Cómo obtener tu API Key:**
1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Cópiala y pégala en Render

## 🚀 Paso 4: Desplegar

### 4.1 Iniciar Despliegue

1. **Click "Create Web Service"**
2. **Esperar** el proceso de build (5-10 minutos)
3. **Monitorear** los logs en tiempo real

### 4.2 Verificar Build Exitoso

**Logs esperados:**
```
==> Building...
==> Installing dependencies
==> Build successful
==> Starting service
🤖 ChatBot EPIMex v4.0 iniciando...
📅 Tareas de recordatorios configuradas
⏰ Sistema de recordatorios inicializado
🌐 Servidor web ejecutándose en puerto 10000
✅ Base de datos conectada
```

## ✅ Paso 5: Verificar Funcionamiento

### 5.1 Probar Endpoints

**URL base:** `https://chatbot-epimex-v4.onrender.com`

**Probar estos endpoints:**

1. **Estado general:**
   ```
   GET https://chatbot-epimex-v4.onrender.com/
   ```
   **Respuesta esperada:**
   ```json
   {
     "status": "Bot EPIMex v4.0 funcionando",
     "version": "4.0.0",
     "features": [
       "Tamizaje automático (11 preguntas)",
       "Seguimiento de psicosis",
       "Clasificación automática",
       "Respuestas con OpenAI GPT",
       "Base de datos completa",
       "Recordatorios automáticos"
     ]
   }
   ```

2. **Estado de salud:**
   ```
   GET https://chatbot-epimex-v4.onrender.com/stats
   ```

3. **Código QR:**
   ```
   GET https://chatbot-epimex-v4.onrender.com/qr
   ```

### 5.2 Verificar Logs

En Render Dashboard:
1. **Ve a tu servicio**
2. **Click "Logs"**
3. **Verificar** que no hay errores críticos

## 📱 Paso 6: Conectar WhatsApp Business

### 6.1 Obtener Código QR

1. **Ve a:** `https://chatbot-epimex-v4.onrender.com/qr`
2. **Copia el código QR** o usa la URL directa

### 6.2 Escanear con WhatsApp Business

1. **Abre WhatsApp Business** en tu teléfono
2. **Ve a Configuración** → **Dispositivos vinculados**
3. **Toca "Vincular un dispositivo"**
4. **Escanea el código QR**
5. **Espera confirmación** de conexión

### 6.3 Probar Bot

1. **Envía "hola"** desde cualquier número
2. **Verifica** que el bot responde automáticamente
3. **Prueba** el flujo completo de tamizaje

## 🔧 Troubleshooting

### Error: "Build failed"

**Causa:** Archivos faltantes o `package.json` incorrecto

**Solución:**
1. Verificar que `package.json` esté en la raíz
2. Verificar que `index.js` esté en la raíz
3. Revisar logs de build para errores específicos

### Error: "Application failed to start"

**Causa:** Variables de entorno faltantes

**Solución:**
1. Verificar que `OPENAI_API_KEY` esté configurada
2. Verificar todas las variables obligatorias
3. Revisar logs de runtime

### Error: "WhatsApp no se conecta"

**Causa:** Código QR expirado o problemas de red

**Solución:**
1. Reiniciar el servicio en Render
2. Obtener nuevo código QR
3. Intentar desde red diferente

### Error: "Bot no responde"

**Causa:** OpenAI API key inválida o límites excedidos

**Solución:**
1. Verificar API key en OpenAI dashboard
2. Verificar límites de uso
3. Revisar logs para errores de API

## 📊 Monitoreo Continuo

### Métricas Importantes

**Verificar regularmente:**
- **Uptime:** Debe ser >99%
- **Response time:** <2 segundos
- **Memory usage:** <512MB (plan gratuito)
- **API calls:** Monitorear uso de OpenAI

### Logs a Monitorear

**Buscar estos patrones:**
- ✅ `ChatBot EPIMex v4.0 iniciando...`
- ✅ `Sistema de recordatorios iniciado`
- ❌ `Error en OpenAI:`
- ❌ `Error manejando mensaje:`

## 🔄 Actualizaciones

### Despliegue Automático

**Configurado para auto-deploy:**
1. **Push cambios** a GitHub
2. **Render detecta** cambios automáticamente
3. **Redespliega** en 5-10 minutos

### Despliegue Manual

**Si necesitas forzar redepliegue:**
1. **Ve a Render Dashboard**
2. **Click "Manual Deploy"**
3. **Esperar** completar

## 🎯 URLs Finales

Una vez desplegado exitosamente:

- **Bot principal:** `https://chatbot-epimex-v4.onrender.com/`
- **Estado:** `https://chatbot-epimex-v4.onrender.com/stats`
- **QR Code:** `https://chatbot-epimex-v4.onrender.com/qr`

## 🏆 ¡Éxito!

Si todos los pasos se completaron correctamente:

✅ **ChatBot EPIMex v4.0** está funcionando  
✅ **WhatsApp Business** conectado  
✅ **Tamizaje automático** operativo  
✅ **OpenAI GPT** respondiendo  
✅ **Recordatorios** programados  
✅ **Base de datos** registrando  

**¡Tu chatbot avanzado está listo para recibir participantes de EPIMex!** 🔬

---

**Soporte:** EPIMex@gmc.org.mx  
**Documentación:** GitHub Repository  
**Versión:** 4.0.0

