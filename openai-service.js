const OpenAI = require('openai');

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder'
        });
        
        this.systemPrompt = `Eres un asistente especializado en el estudio de investigación EPIMex (Arquitectura genética de la psicosis de inicio temprano en mexicanos).

CARACTERÍSTICAS DE TU PERSONALIDAD:
- Empático y comprensivo
- Profesional pero cálido
- Claro y directo
- Respetuoso de la confidencialidad
- Sensible a temas de salud mental

INFORMACIÓN DEL ESTUDIO:
EPIMex busca entender las causas genéticas, neuropsicológicas y socioemocionales de la psicosis de inicio temprano en población mexicana. Se analizan factores biológicos, psicológicos y sociales mediante entrevistas clínicas, pruebas cognitivas y recolección de muestras biológicas.

SEDES:
- Benito Juárez: Grupo Médico Carracci, Carracci 107, Col. Extremadura Insurgentes
- Tlalpan: Hospital Psiquiátrico Infantil Dr. Juan N. Navarro, Av. San Fernando 86

CONTACTOS:
- Email: EPIMex@gmc.org.mx
- WhatsApp Benito Juárez: 55 3206 7976
- WhatsApp Tlalpan: 55 7871 0328
- Web: www.epimex.net

INSTRUCCIONES IMPORTANTES:
1. Mantén las respuestas concisas pero completas (máximo 200 palabras)
2. Usa un tono empático especialmente cuando se hablen de síntomas o experiencias difíciles
3. Siempre mantén la información científica precisa
4. Adapta el lenguaje a la edad del participante
5. Si no tienes información específica, deriva al equipo especializado
6. Nunca diagnostiques ni des consejos médicos
7. Respeta la confidencialidad en todo momento

EJEMPLOS DE RESPUESTAS:
- Para jóvenes: Usa lenguaje más directo y cercano
- Para adultos: Mantén formalidad profesional
- Para temas sensibles: Muestra empatía y comprensión
- Para dudas técnicas: Explica de manera simple pero precisa`;
    }

    async generarRespuesta(contexto, mensajeUsuario, tipoRespuesta = 'general') {
        try {
            let promptEspecifico = this.systemPrompt;
            
            // Adaptar prompt según el tipo de respuesta
            switch (tipoRespuesta) {
                case 'tamizaje':
                    promptEspecifico += `\n\nESTÁS EN PROCESO DE TAMIZAJE:
- Haz la pregunta de manera empática y clara
- Si la respuesta no es clara, pide clarificación amablemente
- Agradece la honestidad del participante
- Mantén un tono profesional pero cálido`;
                    break;
                    
                case 'psicosis_seguimiento':
                    promptEspecifico += `\n\nESTÁS EVALUANDO EXPERIENCIAS SENSIBLES:
- Usa un tono muy empático y sin juicio
- Normaliza las experiencias ("muchas personas han tenido...")
- Agradece la confianza al compartir
- Asegura confidencialidad
- No uses términos médicos complejos`;
                    break;
                    
                case 'clasificacion':
                    promptEspecifico += `\n\nESTÁS COMUNICANDO RESULTADOS:
- Sé positivo y alentador
- Explica los próximos pasos claramente
- Mantén expectativas realistas
- Ofrece apoyo y contacto directo`;
                    break;
                    
                case 'agendamiento':
                    promptEspecifico += `\n\nESTÁS AYUDANDO CON AGENDAMIENTO:
- Sé eficiente pero amable
- Confirma información importante
- Explica el proceso claramente
- Ofrece flexibilidad cuando sea posible`;
                    break;
            }

            const messages = [
                { role: 'system', content: promptEspecifico },
                { role: 'user', content: `Contexto: ${contexto}\n\nMensaje del usuario: ${mensajeUsuario}` }
            ];

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: messages,
                max_tokens: 300,
                temperature: 0.7,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            });

            return completion.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Error en OpenAI:', error);
            
            // Respuestas de fallback según el tipo
            const fallbackResponses = {
                general: "Gracias por tu mensaje. Nuestro equipo está disponible para ayudarte con cualquier pregunta sobre EPIMex.",
                tamizaje: "Entiendo tu respuesta. Continuemos con el siguiente paso del proceso.",
                psicosis_seguimiento: "Agradezco que compartas esta información conmigo. Es importante para el estudio.",
                clasificacion: "Hemos registrado tu información. Te contactaremos pronto con los siguientes pasos.",
                agendamiento: "Perfecto, procederemos con el agendamiento de tu cita."
            };
            
            return fallbackResponses[tipoRespuesta] || fallbackResponses.general;
        }
    }

    async reformularPregunta(preguntaOriginal, contextoParticipante) {
        try {
            const prompt = `Reformula esta pregunta de tamizaje para que sea más natural y empática, considerando el contexto del participante:

Pregunta original: "${preguntaOriginal}"
Contexto del participante: ${contextoParticipante}

Instrucciones:
- Mantén el contenido científico exacto
- Hazla más conversacional y menos formal
- Adapta el tono a la edad y situación
- Máximo 100 palabras
- Incluye una breve explicación del por qué es importante si es necesario`;

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.8
            });

            return completion.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Error reformulando pregunta:', error);
            return preguntaOriginal; // Devolver pregunta original si falla
        }
    }

    async generarMensajeClasificacion(clasificacion, datosParticipante) {
        try {
            const prompt = `Genera un mensaje empático y profesional para comunicar el resultado del tamizaje:

Clasificación: ${clasificacion.tipo}
Elegible: ${clasificacion.elegible ? 'Sí' : 'No'}
Criterios cumplidos: ${clasificacion.criteriosCumplidos.join(', ')}
${clasificacion.criteriosFaltantes.length > 0 ? `Criterios faltantes: ${clasificacion.criteriosFaltantes.join(', ')}` : ''}

Participante: ${datosParticipante.nombre}, ${datosParticipante.edad} años

Instrucciones:
- Si es elegible: Sé positivo y explica próximos pasos
- Si no es elegible: Sé empático y agradece la participación
- Mantén un tono profesional pero cálido
- Máximo 150 palabras
- No uses términos técnicos como "probando", "control", etc.
- Enfócate en la contribución al estudio`;

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.7
            });

            return completion.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Error generando mensaje de clasificación:', error);
            
            // Mensaje de fallback
            if (clasificacion.elegible) {
                return `¡Gracias ${datosParticipante.nombre}! Has completado el tamizaje inicial para EPIMex. Tu información será revisada por nuestro equipo y te contactaremos pronto para coordinar los siguientes pasos. ¡Agradecemos mucho tu interés en contribuir a esta importante investigación!`;
            } else {
                return `Gracias ${datosParticipante.nombre} por tu tiempo e interés en EPIMex. Aunque en este momento no cumples todos los criterios para participar, valoramos mucho tu disposición a contribuir a la investigación en salud mental. Si tienes preguntas, no dudes en contactarnos.`;
            }
        }
    }

    async generarRecordatorio(tipoRecordatorio, datosParticipante, datosCita = null) {
        try {
            let prompt = `Genera un recordatorio ${tipoRecordatorio} para EPIMex:

Participante: ${datosParticipante.nombre}
Tipo de recordatorio: ${tipoRecordatorio}`;

            if (datosCita) {
                prompt += `
Fecha de cita: ${datosCita.fecha_cita}
Hora: ${datosCita.hora_cita}
Sede: ${datosCita.sede}`;
            }

            prompt += `

Instrucciones:
- Tono amigable y profesional
- Incluye emojis apropiados
- Máximo 100 palabras
- Incluye información de contacto si es necesario`;

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.8
            });

            return completion.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Error generando recordatorio:', error);
            
            // Recordatorios de fallback
            const fallbacks = {
                cita: `¡Hola ${datosParticipante.nombre}! 👋 Te recordamos tu cita para EPIMex mañana. ¡Te esperamos!`,
                seguimiento: `Hola ${datosParticipante.nombre}, ¿sigues interesado/a en participar en EPIMex? Estamos aquí para ayudarte.`,
                participacion: `¡Hola ${datosParticipante.nombre}! ¿Te gustaría conocer más sobre EPIMex? Podemos resolver tus dudas.`
            };
            
            return fallbacks[tipoRecordatorio] || fallbacks.participacion;
        }
    }

    // Método para detectar intención del usuario
    async detectarIntencion(mensaje) {
        try {
            const prompt = `Analiza este mensaje y determina la intención del usuario en el contexto del estudio EPIMex:

Mensaje: "${mensaje}"

Posibles intenciones:
- saludo: Saludos iniciales
- informacion: Quiere información sobre el estudio
- participar: Quiere participar o agendar
- dudas: Tiene preguntas específicas
- confirmacion: Confirma algo (cita, participación)
- cancelacion: Quiere cancelar algo
- resultados: Pregunta por resultados
- otro: Otra intención

Responde solo con la intención detectada.`;

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 20,
                temperature: 0.3
            });

            return completion.choices[0].message.content.trim().toLowerCase();
            
        } catch (error) {
            console.error('Error detectando intención:', error);
            return 'otro';
        }
    }

    // Método para validar respuestas complejas
    async validarRespuestaCompleja(pregunta, respuesta) {
        try {
            const prompt = `Evalúa si esta respuesta es adecuada para la pregunta del tamizaje:

Pregunta: "${pregunta}"
Respuesta: "${respuesta}"

Evalúa:
1. ¿La respuesta es relevante a la pregunta?
2. ¿Contiene información suficiente?
3. ¿Necesita clarificación?

Responde en formato JSON:
{
  "esAdecuada": true/false,
  "necesitaClarificacion": true/false,
  "sugerenciaClarificacion": "texto o null"
}`;

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 100,
                temperature: 0.3
            });

            return JSON.parse(completion.choices[0].message.content.trim());
            
        } catch (error) {
            console.error('Error validando respuesta compleja:', error);
            return {
                esAdecuada: true,
                necesitaClarificacion: false,
                sugerenciaClarificacion: null
            };
        }
    }
}

module.exports = OpenAIService;

