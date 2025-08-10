# ChatBot EPIMex v4.0

Chatbot avanzado para el estudio de investigación **EPIMex** (Arquitectura genética de la psicosis de inicio temprano en mexicanos) con tamizaje automático, respuestas naturales con OpenAI GPT y sistema de recordatorios.

## 🔬 Sobre EPIMex

EPIMex es un estudio de investigación que busca entender mejor las causas genéticas, neuropsicológicas y socioemocionales de la psicosis de inicio temprano en población mexicana mediante análisis de factores biológicos, psicológicos y sociales.

## 🚀 Características Principales

### 🤖 Tamizaje Inteligente
- **11 preguntas principales** de tamizaje automatizado
- **Seguimiento detallado** de experiencias psicóticas (alucinaciones y delirios)
- **Clasificación automática** en probando/familiar/control
- **Validaciones robustas** para todas las respuestas

### 🧠 Respuestas Naturales
- **Integración con OpenAI GPT** para conversaciones empáticas
- **Respuestas adaptadas** al contexto y edad del participante
- **Tono profesional** pero cálido para temas sensibles
- **Fallbacks robustos** en caso de errores de API

### 📅 Sistema de Recordatorios
- **Recordatorios de citas** 24 horas antes
- **Seguimiento de participación** para usuarios que no completan el proceso
- **Recordatorios personalizados** según el estado del participante
- **Limpieza automática** de recordatorios antiguos

### 💾 Base de Datos Completa
- **7 tablas relacionales** en SQLite
- **Registro completo** de conversaciones y respuestas
- **Estadísticas detalladas** del sistema
- **Exportación de datos** para análisis

## 🏥 Sedes del Estudio

### Benito Juárez
- **Ubicación:** Grupo Médico Carracci
- **Dirección:** Carracci 107, Col. Extremadura Insurgentes, 03740
- **WhatsApp:** 55 3206 7976

### Tlalpan
- **Ubicación:** Hospital Psiquiátrico Infantil Dr. Juan N. Navarro
- **Dirección:** Av. San Fernando 86, Col. Belisario Domínguez, 14080
- **WhatsApp:** 55 7871 0328

### Contacto General
- **Email:** EPIMex@gmc.org.mx
- **Web:** www.epimex.net

## 🛠️ Instalación y Configuración

### Requisitos
- Node.js >= 16.0.0
- npm >= 8.0.0
- Cuenta de OpenAI con API key

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/nulanzagorta/EPIMex-chatbot.git
cd EPIMex-chatbot

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar en modo desarrollo
npm run dev

# O iniciar en producción
npm start
```

### Variables de Entorno Requeridas

```env
# Configuración general
NODE_ENV=production
PORT=3000

# Información del estudio
ESTUDIO_NOMBRE=EPIMex
CONTACTO_EMAIL=EPIMex@gmc.org.mx
SITIO_WEB=www.epimex.net

# Sedes
CONTACTO_WHATSAPP_BJ=55 3206 7976
CONTACTO_WHATSAPP_TLALPAN=55 7871 0328
SEDE_BJ=Carracci 107, Col. Extremadura Insurgentes, 03740, Benito Juárez, Ciudad de México
SEDE_TLALPAN=Av. San Fernando 86, Col. Belisario Domínguez, 14080, Tlalpan, Ciudad de México

# OpenAI
OPENAI_API_KEY=tu_api_key_aqui
OPENAI_MODEL=gpt-4

# WhatsApp
WHATSAPP_SESSION_NAME=epimex_production

# Horarios
HORARIOS_ATENCION=Lunes a Viernes 9:00-17:00
```

## 🌐 Despliegue en Render

### Paso 1: Preparar Repositorio
1. Subir todos los archivos a GitHub
2. Asegurar que `package.json` e `index.js` estén en la raíz

### Paso 2: Configurar Render
1. Crear nuevo Web Service en Render
2. Conectar con tu repositorio GitHub
3. Configurar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

### Paso 3: Variables de Entorno
Configurar todas las variables listadas arriba en Render Environment.

### Paso 4: Desplegar
1. Click "Create Web Service"
2. Esperar el build (5-10 minutos)
3. Verificar en la URL proporcionada

## 📱 Conexión con WhatsApp

### Obtener Código QR
```bash
# Visitar endpoint QR
https://tu-app.onrender.com/qr
```

### Escanear con WhatsApp Business
1. Abrir WhatsApp Business
2. Ir a Configuración → Dispositivos vinculados
3. Escanear código QR
4. ¡Listo! El bot responderá automáticamente

## 🔧 Endpoints de API

### Estado del Sistema
```
GET /
GET /health
GET /stats
```

### Código QR
```
GET /qr
```

### Respuestas de Ejemplo
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

## 📊 Flujo de Conversación

1. **Bienvenida** → Mensaje inicial con información de EPIMex
2. **Recolección de datos** → Nombre, edad, sexo, email, ciudad
3. **Tamizaje** → 11 preguntas principales
4. **Seguimiento psicosis** → Si es necesario (pregunta 8 positiva)
5. **Clasificación** → Automática (probando/familiar/control)
6. **Agendamiento** → Si es elegible
7. **Recordatorios** → Automáticos según el estado

## 🧪 Comandos de Desarrollo

```bash
# Desarrollo con recarga automática
npm run dev

# Resetear base de datos
npm run db:reset

# Ver estadísticas
npm run stats

# Pruebas
npm test
```

## 📈 Monitoreo y Estadísticas

El sistema incluye métricas completas:
- Total de participantes por estado
- Conversaciones por día/semana/mes
- Clasificaciones realizadas
- Recordatorios enviados
- Uptime del sistema

## 🔒 Seguridad y Privacidad

- **Datos encriptados** en base de datos
- **Sesiones seguras** de WhatsApp
- **Logs sin información personal**
- **Cumplimiento** con regulaciones de investigación médica

## 🆘 Soporte

Para soporte técnico o preguntas sobre el estudio:
- **Email:** EPIMex@gmc.org.mx
- **Issues:** GitHub Issues
- **Documentación:** Ver archivos en `/docs`

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push al branch
5. Abrir Pull Request

---

**Desarrollado para el estudio EPIMex** 🔬  
*Contribuyendo al avance de la investigación en salud mental*

