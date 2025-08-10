require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cron = require('node-cron');

const DatabaseManager = require('./database');
const TamizajeEPIMex = require('./tamizaje');
const OpenAIService = require('./openai-service');
const SistemaRecordatorios = require('./recordatorios');

class ChatbotEPIMex {
    constructor() {
        this.db = new DatabaseManager();
        this.tamizaje = new TamizajeEPIMex();
        this.openai = new OpenAIService();
        
        // Estados de conversación por usuario
        this.estadosUsuario = new Map();
        
        // Inicializar sistema de recordatorios
        this.recordatorios = new SistemaRecordatorios(
            this.db, 
            this.openai, 
            this.enviarMensaje.bind(this)
        );
        
        // Configurar WhatsApp Client
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: process.env.WHATSAPP_SESSION_NAME || 'epimex_v4'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.setupWhatsAppEvents();
        this.setupWebServer();
        
        console.log('🤖 ChatBot EPIMex v4.0 iniciando...');
    }

    setupWhatsAppEvents() {
        this.client.on('qr', (qr) => {
            console.log('📱 Código QR generado:');
            qrcode.generate(qr, { small: true });
            this.qrCode = qr;
        });

        this.client.on('ready', () => {
            console.log('✅ ChatBot EPIMex conectado y listo!');
        });

        this.client.on('message', async (message) => {
            await this.handleMessage(message);
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ Cliente desconectado:', reason);
        });
    }

    async handleMessage(message) {
        try {
            const telefono = message.from;
            const mensajeTexto = message.body.trim();
            
            // Ignorar mensajes de grupos y del propio bot
            if (message.from.includes('@g.us') || message.fromMe) {
                return;
            }

            console.log(`📨 Mensaje de ${telefono}: ${mensajeTexto}`);

            // Obtener o crear participante
            let participante = await this.db.getParticipanteByTelefono(telefono);
            
            // Obtener estado actual del usuario
            let estadoUsuario = this.estadosUsuario.get(telefono) || {
                fase: 'inicial',
                preguntaActual: 0,
                datosTemporales: {},
                requiereSeguimiento: false,
                tipoSeguimiento: null,
                preguntaSeguimientoActual: 0
            };

            // Detectar intención del mensaje
            const intencion = await this.openai.detectarIntencion(mensajeTexto);

            // Manejar comandos globales
            if (this.esComandoGlobal(mensajeTexto)) {
                const respuesta = await this.manejarComandoGlobal(mensajeTexto, participante);
                await this.enviarMensaje(telefono, respuesta);
                return;
            }

            // Procesar según la fase actual
            let respuesta;
            switch (estadoUsuario.fase) {
                case 'inicial':
                    respuesta = await this.manejarFaseInicial(telefono, mensajeTexto, participante, intencion);
                    break;
                    
                case 'recoleccion_datos':
                    respuesta = await this.manejarRecoleccionDatos(telefono, mensajeTexto, estadoUsuario, participante);
                    break;
                    
                case 'tamizaje':
                    respuesta = await this.manejarTamizaje(telefono, mensajeTexto, estadoUsuario, participante);
                    break;
                    
                case 'seguimiento_psicosis':
                    respuesta = await this.manejarSeguimientoPsicosis(telefono, mensajeTexto, estadoUsuario, participante);
                    break;
                    
                case 'clasificacion':
                    respuesta = await this.manejarClasificacion(telefono, mensajeTexto, estadoUsuario, participante);
                    break;
                    
                case 'agendamiento':
                    respuesta = await this.manejarAgendamiento(telefono, mensajeTexto, estadoUsuario, participante);
                    break;
                    
                default:
                    respuesta = await this.manejarMensajeGeneral(telefono, mensajeTexto, participante);
            }

            // Enviar respuesta
            if (respuesta) {
                await this.enviarMensaje(telefono, respuesta);
            }

            // Guardar conversación en base de datos
            await this.db.saveConversacion(
                participante?.id || null,
                telefono,
                mensajeTexto,
                respuesta,
                estadoUsuario.fase
            );

        } catch (error) {
            console.error('Error manejando mensaje:', error);
            await this.enviarMensaje(message.from, 
                'Disculpa, hubo un error técnico. Por favor intenta de nuevo o contacta a nuestro equipo de soporte.');
        }
    }

    async manejarFaseInicial(telefono, mensaje, participante, intencion) {
        if (!participante) {
            // Nuevo participante
            const mensajeBienvenida = await this.openai.generarRespuesta(
                'Usuario nuevo interesado en EPIMex',
                mensaje,
                'general'
            );

            const menuInicial = `
${mensajeBienvenida}

🔬 **EPIMex** es un estudio de investigación que busca entender mejor las causas genéticas y ambientales de la psicosis de inicio temprano en población mexicana.

**¿Qué puedo hacer por ti?**

1️⃣ Conocer más sobre el estudio
2️⃣ Iniciar proceso de participación
3️⃣ Resolver dudas específicas
4️⃣ Hablar con un especialista

Escribe el número de tu opción o cuéntame qué te interesa saber.`;

            this.estadosUsuario.set(telefono, {
                fase: 'menu_inicial',
                preguntaActual: 0,
                datosTemporales: {},
                requiereSeguimiento: false
            });

            return menuInicial;
        } else {
            // Participante existente
            const contexto = `Participante existente: ${participante.nombre}, estado: ${participante.estado_proceso}`;
            return await this.openai.generarRespuesta(contexto, mensaje, 'general');
        }
    }

    async manejarRecoleccionDatos(telefono, mensaje, estadoUsuario, participante) {
        const pasos = ['nombre', 'edad', 'sexo', 'email', 'ciudad'];
        const pasoActual = pasos[estadoUsuario.preguntaActual];

        switch (pasoActual) {
            case 'nombre':
                estadoUsuario.datosTemporales.nombre = mensaje;
                estadoUsuario.preguntaActual++;
                this.estadosUsuario.set(telefono, estadoUsuario);
                return "¿Cuál es tu edad?";

            case 'edad':
                const edad = parseInt(mensaje);
                if (edad >= 10 && edad <= 75) {
                    estadoUsuario.datosTemporales.edad = edad;
                    estadoUsuario.preguntaActual++;
                    this.estadosUsuario.set(telefono, estadoUsuario);
                    return "¿Cuál es tu sexo biológico asignado al nacer? (masculino/femenino/otro)";
                } else {
                    return "La edad debe estar entre 10 y 75 años para participar. ¿Podrías confirmar tu edad?";
                }

            case 'sexo':
                estadoUsuario.datosTemporales.sexo = mensaje;
                estadoUsuario.preguntaActual++;
                this.estadosUsuario.set(telefono, estadoUsuario);
                return "¿Cuál es tu correo electrónico?";

            case 'email':
                if (this.validarEmail(mensaje)) {
                    estadoUsuario.datosTemporales.email = mensaje;
                    estadoUsuario.preguntaActual++;
                    this.estadosUsuario.set(telefono, estadoUsuario);
                    return "¿En qué ciudad vives?";
                } else {
                    return "Por favor proporciona un correo electrónico válido.";
                }

            case 'ciudad':
                estadoUsuario.datosTemporales.ciudad = mensaje;
                
                // Crear participante en base de datos
                try {
                    const participanteId = await this.db.createParticipante({
                        nombre: estadoUsuario.datosTemporales.nombre,
                        edad: estadoUsuario.datosTemporales.edad,
                        sexo: estadoUsuario.datosTemporales.sexo,
                        telefono: telefono,
                        email: estadoUsuario.datosTemporales.email,
                        ciudad: mensaje,
                        sede_preferida: null
                    });

                    // Cambiar a fase de tamizaje
                    estadoUsuario.fase = 'tamizaje';
                    estadoUsuario.preguntaActual = 1;
                    estadoUsuario.participanteId = participanteId;
                    this.estadosUsuario.set(telefono, estadoUsuario);

                    await this.db.updateParticipanteEstado(participanteId, 'tamizaje_iniciado');

                    const respuestaPersonalizada = await this.openai.generarRespuesta(
                        `Participante ${estadoUsuario.datosTemporales.nombre} va a iniciar tamizaje`,
                        'Iniciar tamizaje',
                        'tamizaje'
                    );

                    const primeraPregunta = this.tamizaje.obtenerPregunta(1);
                    const preguntaReformulada = await this.openai.reformularPregunta(
                        primeraPregunta.texto,
                        `Participante de ${estadoUsuario.datosTemporales.edad} años`
                    );

                    return `${respuestaPersonalizada}\n\n**Pregunta 1 de 11:**\n${preguntaReformulada}`;

                } catch (error) {
                    console.error('Error creando participante:', error);
                    return "Hubo un error registrando tu información. Por favor intenta de nuevo.";
                }
        }
    }

    async manejarTamizaje(telefono, mensaje, estadoUsuario, participante) {
        const preguntaActual = this.tamizaje.obtenerPregunta(estadoUsuario.preguntaActual);
        
        if (!preguntaActual) {
            // Tamizaje completado
            return await this.completarTamizaje(telefono, estadoUsuario, participante);
        }

        // Validar respuesta
        const validacion = this.tamizaje.validarRespuesta(estadoUsuario.preguntaActual, mensaje);
        
        if (!validacion.valida) {
            // Respuesta inválida, pedir clarificación
            const clarificacion = await this.openai.generarRespuesta(
                `Pregunta ${estadoUsuario.preguntaActual}: ${preguntaActual.texto}`,
                mensaje,
                'tamizaje'
            );
            return `${clarificacion}\n\n${validacion.mensaje}`;
        }

        // Guardar respuesta válida
        await this.db.saveTamizajeRespuesta(
            estadoUsuario.participanteId,
            estadoUsuario.preguntaActual,
            preguntaActual.texto,
            mensaje,
            validacion.datos?.requiereSeguimiento || false
        );

        // Verificar si requiere seguimiento de psicosis
        if (estadoUsuario.preguntaActual === 8 && validacion.datos?.requiereSeguimiento) {
            estadoUsuario.requiereSeguimiento = true;
        }

        // Avanzar a siguiente pregunta
        estadoUsuario.preguntaActual++;
        const siguientePregunta = this.tamizaje.obtenerPregunta(estadoUsuario.preguntaActual);

        if (siguientePregunta) {
            this.estadosUsuario.set(telefono, estadoUsuario);
            
            const respuestaConfirmacion = await this.openai.generarRespuesta(
                `Respuesta a pregunta ${estadoUsuario.preguntaActual - 1}`,
                mensaje,
                'tamizaje'
            );

            const preguntaReformulada = await this.openai.reformularPregunta(
                siguientePregunta.texto,
                `Participante en pregunta ${estadoUsuario.preguntaActual}`
            );

            return `${validacion.mensaje}\n\n**Pregunta ${estadoUsuario.preguntaActual} de 11:**\n${preguntaReformulada}`;
        } else {
            // Completar tamizaje
            return await this.completarTamizaje(telefono, estadoUsuario, participante);
        }
    }

    async completarTamizaje(telefono, estadoUsuario, participante) {
        if (estadoUsuario.requiereSeguimiento) {
            // Iniciar seguimiento de psicosis
            estadoUsuario.fase = 'seguimiento_psicosis';
            estadoUsuario.tipoSeguimiento = 'alucinaciones';
            estadoUsuario.preguntaSeguimientoActual = 0;
            this.estadosUsuario.set(telefono, estadoUsuario);

            const mensajeTransicion = await this.openai.generarRespuesta(
                'Transición a evaluación detallada de experiencias',
                'Iniciar seguimiento psicosis',
                'psicosis_seguimiento'
            );

            const preguntasAlucinaciones = this.tamizaje.obtenerPreguntasSeguimiento('alucinaciones');
            return `${mensajeTransicion}\n\n${preguntasAlucinaciones[0]}`;
        } else {
            // Proceder directamente a clasificación
            return await this.procesarClasificacion(telefono, estadoUsuario, participante);
        }
    }

    async manejarSeguimientoPsicosis(telefono, mensaje, estadoUsuario, participante) {
        const tipoActual = estadoUsuario.tipoSeguimiento;
        const preguntas = this.tamizaje.obtenerPreguntasSeguimiento(tipoActual);
        const preguntaActual = preguntas[estadoUsuario.preguntaSeguimientoActual];

        // Guardar respuesta
        await this.db.savePsicosisEvaluacion(
            estadoUsuario.participanteId,
            tipoActual,
            preguntaActual,
            mensaje,
            this.evaluarPuntuacionRespuesta(mensaje)
        );

        estadoUsuario.preguntaSeguimientoActual++;

        // Verificar si hay más preguntas del tipo actual
        if (estadoUsuario.preguntaSeguimientoActual < preguntas.length) {
            this.estadosUsuario.set(telefono, estadoUsuario);
            const siguientePregunta = preguntas[estadoUsuario.preguntaSeguimientoActual];
            
            const respuestaEmpática = await this.openai.generarRespuesta(
                `Evaluación de ${tipoActual}`,
                mensaje,
                'psicosis_seguimiento'
            );

            return `${respuestaEmpática}\n\n${siguientePregunta}`;
        } else {
            // Cambiar al siguiente tipo de evaluación
            if (tipoActual === 'alucinaciones') {
                estadoUsuario.tipoSeguimiento = 'delirios';
                estadoUsuario.preguntaSeguimientoActual = 0;
                this.estadosUsuario.set(telefono, estadoUsuario);

                const preguntasDelirios = this.tamizaje.obtenerPreguntasSeguimiento('delirios');
                
                const transicion = await this.openai.generarRespuesta(
                    'Transición de alucinaciones a delirios',
                    'Continuar evaluación',
                    'psicosis_seguimiento'
                );

                return `${transicion}\n\n${preguntasDelirios[0]}`;
            } else {
                // Completar seguimiento de psicosis
                return await this.procesarClasificacion(telefono, estadoUsuario, participante);
            }
        }
    }

    async procesarClasificacion(telefono, estadoUsuario, participante) {
        try {
            // Obtener todas las respuestas del tamizaje
            const respuestasTamizaje = await this.db.getTamizajeRespuestas(estadoUsuario.participanteId);
            
            // Obtener respuestas de seguimiento de psicosis si existen
            const respuestasPsicosis = []; // Implementar método en DB si es necesario

            // Clasificar participante
            const clasificacion = this.tamizaje.clasificarParticipante(respuestasTamizaje, respuestasPsicosis);

            // Guardar clasificación en base de datos
            await this.db.saveClasificacion(estadoUsuario.participanteId, clasificacion);

            // Actualizar estado del participante
            await this.db.updateParticipanteEstado(
                estadoUsuario.participanteId, 
                clasificacion.elegible ? 'elegible' : 'no_elegible'
            );

            // Generar mensaje personalizado
            const mensajeClasificacion = await this.openai.generarMensajeClasificacion(
                clasificacion,
                { nombre: estadoUsuario.datosTemporales.nombre, edad: estadoUsuario.datosTemporales.edad }
            );

            if (clasificacion.elegible) {
                // Cambiar a fase de agendamiento
                estadoUsuario.fase = 'agendamiento';
                estadoUsuario.preguntaActual = 0;
                this.estadosUsuario.set(telefono, estadoUsuario);

                return `${mensajeClasificacion}\n\n¿Te gustaría agendar tu cita ahora? Responde 'sí' para continuar.`;
            } else {
                // Finalizar proceso
                this.estadosUsuario.delete(telefono);
                return `${mensajeClasificacion}\n\nSi tienes preguntas, puedes contactarnos en EPIMex@gmc.org.mx o visitar www.epimex.net`;
            }

        } catch (error) {
            console.error('Error en clasificación:', error);
            return "Hubo un error procesando tu información. Nuestro equipo revisará tu caso y te contactará pronto.";
        }
    }

    async manejarAgendamiento(telefono, mensaje, estadoUsuario, participante) {
        // Implementar lógica de agendamiento
        const respuestaPositiva = ['sí', 'si', 'yes', 'claro', 'por favor'];
        
        if (respuestaPositiva.some(palabra => mensaje.toLowerCase().includes(palabra))) {
            const mensajeAgendamiento = `Perfecto! Para agendar tu cita necesitamos coordinar con nuestro equipo.

**Nuestras sedes:**
📍 **Benito Juárez:** Grupo Médico Carracci
📍 **Tlalpan:** Hospital Psiquiátrico Infantil Dr. Juan N. Navarro

**Contacto directo:**
📞 Benito Juárez: ${process.env.CONTACTO_WHATSAPP_BJ}
📞 Tlalpan: ${process.env.CONTACTO_WHATSAPP_TLALPAN}
📧 Email: ${process.env.CONTACTO_EMAIL}

Nuestro equipo se pondrá en contacto contigo en las próximas 24-48 horas para coordinar fecha y hora.

¡Gracias por tu participación en EPIMex! 🔬`;

            this.estadosUsuario.delete(telefono);
            return mensajeAgendamiento;
        } else {
            return "Entiendo. Si cambias de opinión, puedes contactarnos cuando gustes. ¡Gracias por tu interés en EPIMex!";
        }
    }

    async manejarMensajeGeneral(telefono, mensaje, participante) {
        const contexto = participante ? 
            `Participante existente: ${participante.nombre}` : 
            'Usuario general consultando sobre EPIMex';
            
        return await this.openai.generarRespuesta(contexto, mensaje, 'general');
    }

    esComandoGlobal(mensaje) {
        const comandos = ['menu', 'inicio', 'hola', 'ayuda', 'info', 'contacto'];
        return comandos.some(cmd => mensaje.toLowerCase().includes(cmd));
    }

    async manejarComandoGlobal(mensaje, participante) {
        const mensajeLower = mensaje.toLowerCase();
        
        if (mensajeLower.includes('menu') || mensajeLower.includes('inicio')) {
            return this.generarMenuPrincipal(participante);
        }
        
        if (mensajeLower.includes('hola')) {
            return await this.openai.generarRespuesta(
                participante ? `Participante conocido: ${participante.nombre}` : 'Saludo inicial',
                mensaje,
                'general'
            );
        }
        
        if (mensajeLower.includes('contacto')) {
            return this.generarInfoContacto();
        }
        
        return this.generarMenuPrincipal(participante);
    }

    generarMenuPrincipal(participante) {
        const saludo = participante ? 
            `¡Hola de nuevo ${participante.nombre}!` : 
            '¡Hola! Bienvenido/a a EPIMex';

        return `${saludo} 👋

🔬 **EPIMex** - Estudio de investigación sobre psicosis de inicio temprano

**¿En qué puedo ayudarte?**

1️⃣ Información sobre el estudio
2️⃣ Proceso de participación
3️⃣ Requisitos para participar
4️⃣ Sedes y contacto
5️⃣ Preguntas frecuentes
6️⃣ Hablar con especialista

Escribe el número de tu opción.`;
    }

    generarInfoContacto() {
        return `📞 **Contacto EPIMex**

**Sedes:**
📍 **Benito Juárez:** ${process.env.SEDE_BJ}
📱 WhatsApp: ${process.env.CONTACTO_WHATSAPP_BJ}

📍 **Tlalpan:** ${process.env.SEDE_TLALPAN}
📱 WhatsApp: ${process.env.CONTACTO_WHATSAPP_TLALPAN}

**General:**
📧 Email: ${process.env.CONTACTO_EMAIL}
🌐 Web: ${process.env.SITIO_WEB}
🕐 Horarios: ${process.env.HORARIOS_ATENCION}`;
    }

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    evaluarPuntuacionRespuesta(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        
        if (respuestaLower.includes('sí') || respuestaLower.includes('si')) {
            return 1;
        }
        
        if (respuestaLower.includes('frecuente') || respuestaLower.includes('siempre')) {
            return 2;
        }
        
        if (respuestaLower.includes('real') || respuestaLower.includes('verdad')) {
            return 2;
        }
        
        return 0;
    }

    async enviarMensaje(telefono, mensaje) {
        try {
            await this.client.sendMessage(telefono, mensaje);
            console.log(`📤 Mensaje enviado a ${telefono}`);
        } catch (error) {
            console.error('Error enviando mensaje:', error);
        }
    }

    setupWebServer() {
        const app = express();
        const port = process.env.PORT || 3000;

        app.use(express.json());

        app.get('/', (req, res) => {
            res.json({
                status: 'Bot EPIMex v4.0 funcionando',
                version: '4.0.0',
                timestamp: new Date().toISOString(),
                features: [
                    'Tamizaje automático (11 preguntas)',
                    'Seguimiento de psicosis',
                    'Clasificación automática',
                    'Respuestas con OpenAI GPT',
                    'Base de datos completa',
                    'Recordatorios automáticos'
                ]
            });
        });

        app.get('/stats', async (req, res) => {
            try {
                const stats = await this.db.getEstadisticas();
                const statsRecordatorios = await this.recordatorios.obtenerEstadisticasRecordatorios();
                
                res.json({
                    status: 'healthy',
                    database: 'connected',
                    whatsapp: this.client.info ? 'connected' : 'disconnected',
                    estadisticas: stats,
                    recordatorios: statsRecordatorios,
                    uptime: process.uptime()
                });
            } catch (error) {
                res.status(500).json({
                    status: 'error',
                    error: error.message
                });
            }
        });

        app.get('/qr', (req, res) => {
            if (this.qrCode) {
                res.json({
                    qr: this.qrCode,
                    status: 'available'
                });
            } else {
                res.json({
                    status: 'not_available',
                    message: 'QR code not generated yet or already connected'
                });
            }
        });

        app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 Servidor web ejecutándose en puerto ${port}`);
        });
    }

    setupRecordatorios() {
        // Recordatorios cada hora para verificar citas próximas
        cron.schedule('0 * * * *', async () => {
            console.log('🔔 Verificando recordatorios...');
            // Implementar lógica de recordatorios
        });

        console.log('⏰ Sistema de recordatorios configurado');
    }

    async iniciar() {
        try {
            await this.client.initialize();
            
            // Iniciar sistema de recordatorios después de conectar WhatsApp
            this.recordatorios.iniciar();
            console.log('✅ Sistema de recordatorios iniciado');
            
        } catch (error) {
            console.error('Error iniciando el bot:', error);
        }
    }

    async detener() {
        console.log('🛑 Deteniendo ChatBot EPIMex...');
        
        // Detener sistema de recordatorios
        this.recordatorios.detener();
        
        await this.client.destroy();
        this.db.close();
    }
}

// Inicializar bot
const bot = new ChatbotEPIMex();
bot.iniciar();

// Manejo de señales de terminación
process.on('SIGINT', async () => {
    await bot.detener();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await bot.detener();
    process.exit(0);
});

module.exports = ChatbotEPIMex;

