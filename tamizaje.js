class TamizajeEPIMex {
    constructor() {
        this.preguntasPrincipales = [
            {
                numero: 1,
                texto: "¿Cuál es tu edad y sexo biológico asignado al nacer?",
                tipo: "edad_sexo",
                validacion: this.validarEdadSexo,
                requerida: true
            },
            {
                numero: 2,
                texto: "¿Cuál es la nacionalidad de tus padres, abuelos y tuya?",
                tipo: "nacionalidad",
                validacion: this.validarNacionalidad,
                requerida: true
            },
            {
                numero: 3,
                texto: "¿Te han dado algún diagnóstico psiquiátrico? Si la respuesta es 'sí', indicar cuál es el diagnóstico",
                tipo: "diagnostico_psiquiatrico",
                validacion: this.validarDiagnostico,
                requerida: true
            },
            {
                numero: 4,
                texto: "¿Tomas algún medicamento? Si la respuesta es 'sí', indicar los medicamentos y para qué los recetaron, por favor",
                tipo: "medicamentos",
                validacion: this.validarMedicamentos,
                requerida: true
            },
            {
                numero: 5,
                texto: "¿En tu familia hay algún diagnóstico psiquiátrico? Si la respuesta es 'sí' indicar cuál o cuáles son los diagnósticos y qué familiares lo tienen",
                tipo: "antecedentes_familiares",
                validacion: this.validarAntecedentesFamiliares,
                requerida: true
            },
            {
                numero: 6,
                texto: "¿Tienes algún problema para leer, escribir, comunicarte o comprender?",
                tipo: "capacidades_cognitivas",
                validacion: this.validarCapacidadesCognitivas,
                requerida: true
            },
            {
                numero: 7,
                texto: "¿Eres capaz de proporcionar muestras biológicas (sangre, saliva y epitelio bucal)?",
                tipo: "muestras_biologicas",
                validacion: this.validarMuestrasBiologicas,
                requerida: true
            },
            {
                numero: 8,
                texto: "Tú o alguien en tu familia ha presentado alguna de las siguientes experiencias: ¿Ver sombras, espíritus, escuchar voces, sentir que los persiguen/observan, percibir olores que nadie más percibe, ideas extrañas, comportamientos raros o alguna otra?",
                tipo: "experiencias_psicoticas",
                validacion: this.validarExperienciasPsicoticas,
                requerida: true,
                activaSeguimiento: true
            },
            {
                numero: 9,
                texto: "¿Has consumido alguna droga? Si la respuesta es positiva por favor indicar cuál o cuáles han sido, desde cuándo, dosis y con qué frecuencia",
                tipo: "consumo_sustancias",
                validacion: this.validarConsumoSustancias,
                requerida: true
            },
            {
                numero: 10,
                texto: "¿Algún familiar tuyo ha participado en este estudio?",
                tipo: "participacion_familiar",
                validacion: this.validarParticipacionFamiliar,
                requerida: true
            },
            {
                numero: 11,
                texto: "¿Cómo te enteraste de esta investigación?",
                tipo: "fuente_informacion",
                validacion: this.validarFuenteInformacion,
                requerida: true
            }
        ];

        this.seguimientoPsicosis = {
            alucinaciones: [
                "¿Alguna vez has oído voces estando solo? ¿Qué oíste?",
                "¿Alguna vez has oído a alguien llamarte por tu nombre cuando no había nadie cerca?",
                "¿Alguna vez has oído música que otras personas no podían oír?",
                "¿Alguna vez has visto cosas que no existían?",
                "¿Qué hay de sombras u otros objetos en movimiento?",
                "¿Viste fantasmas?",
                "¿Cuándo ocurrió? ¿Solo de noche mientras intentabas dormir o también durante el día?",
                "¿Qué creyó que era?",
                "¿Pensó que era su imaginación o real?",
                "¿Pensó que era real cuando lo oyó/vio?",
                "¿Qué hizo cuando lo oyó/vio?",
                "¿Ocurrieron cuando estaba despierto o dormido? ¿Pudo haber sido un sueño?",
                "¿Tenía fiebre cuando ocurrieron?",
                "¿Había estado bebiendo o tomando drogas cuando ocurrió?",
                "¿Fue como un pensamiento o más bien como una voz/ruido/visión real?"
            ],
            delirios: [
                "¿Sabes qué es la imaginación? Cuéntame.",
                "¿Alguna vez tu imaginación te ha jugado una mala pasada?",
                "¿Tuviste ideas sobre cosas que no le dijiste a nadie por miedo a que no las entendieran?",
                "¿Creías en cosas en las que otras personas no creían?",
                "¿Alguna vez sentiste que alguien quería hacerte daño?",
                "¿Alguna vez pensaste que eras una persona importante o grandiosa?",
                "Cuando estabas con desconocidos, ¿pensabas que estaban hablando de ti?",
                "¿Hubo alguna vez en que sentiste que algo le estaba pasando a tu cuerpo?",
                "¿Creías que se estaba pudriendo por dentro o que algo andaba muy mal?",
                "¿Alguna vez sentiste que el mundo se estaba acabando?",
                "¿Con qué frecuencia pensaste en estas experiencias?"
            ]
        };
    }

    // Métodos de validación
    validarEdadSexo(respuesta) {
        const regex = /(\d+).*?(masculino|femenino|hombre|mujer|otro)/i;
        const match = respuesta.match(regex);
        
        if (match) {
            const edad = parseInt(match[1]);
            const sexo = match[2].toLowerCase();
            
            if (edad >= 10 && edad <= 75) {
                return {
                    valida: true,
                    datos: { edad, sexo },
                    mensaje: "Edad y sexo registrados correctamente."
                };
            } else {
                return {
                    valida: false,
                    mensaje: "La edad debe estar entre 10 y 75 años para participar en el estudio."
                };
            }
        }
        
        return {
            valida: false,
            mensaje: "Por favor, proporciona tu edad y sexo biológico. Ejemplo: '25 años, masculino'"
        };
    }

    validarNacionalidad(respuesta) {
        const mexicanoKeywords = ['mexicano', 'mexicana', 'méxico', 'mexico'];
        const respuestaLower = respuesta.toLowerCase();
        
        // Verificar si menciona que todos son mexicanos
        const todosMexicanos = mexicanoKeywords.some(keyword => 
            respuestaLower.includes(keyword) && 
            (respuestaLower.includes('todos') || respuestaLower.includes('abuelos'))
        );
        
        if (todosMexicanos || (mexicanoKeywords.every(keyword => respuestaLower.includes(keyword)))) {
            return {
                valida: true,
                datos: { nacionalidadValida: true },
                mensaje: "Nacionalidad verificada. Cumples el criterio de ancestría mexicana."
            };
        }
        
        return {
            valida: false,
            mensaje: "Para participar en EPIMex, es necesario que tus 4 abuelos sean mexicanos. ¿Podrías confirmar la nacionalidad de tus abuelos?"
        };
    }

    validarDiagnostico(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const noKeywords = ['no', 'ninguno', 'nunca'];
        const siKeywords = ['sí', 'si', 'tengo', 'me diagnosticaron'];
        
        const diagnosticosPsicoticos = [
            'esquizofrenia', 'esquizofreniforme', 'esquizoafectivo', 
            'delirante', 'psicótico', 'psicotico', 'bipolar', 'depresión mayor'
        ];
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { tieneDiagnostico: false },
                mensaje: "Sin diagnóstico psiquiátrico registrado."
            };
        }
        
        if (siKeywords.some(keyword => respuestaLower.includes(keyword))) {
            const diagnosticoPsicotico = diagnosticosPsicoticos.some(diag => 
                respuestaLower.includes(diag)
            );
            
            return {
                valida: true,
                datos: { 
                    tieneDiagnostico: true, 
                    diagnostico: respuesta,
                    esPsicotico: diagnosticoPsicotico
                },
                mensaje: "Diagnóstico registrado. Continuamos con el tamizaje."
            };
        }
        
        return {
            valida: false,
            mensaje: "Por favor, responde 'sí' o 'no'. Si tienes algún diagnóstico, especifica cuál."
        };
    }

    validarMedicamentos(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const noKeywords = ['no', 'ninguno', 'no tomo'];
        
        const antipsicoticos = [
            'risperidona', 'olanzapina', 'quetiapina', 'aripiprazol', 
            'haloperidol', 'clozapina', 'paliperidona'
        ];
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { tomaMedicamentos: false },
                mensaje: "Sin medicamentos registrados."
            };
        }
        
        const tomaAntipsicoticos = antipsicoticos.some(med => 
            respuestaLower.includes(med)
        );
        
        return {
            valida: true,
            datos: { 
                tomaMedicamentos: true, 
                medicamentos: respuesta,
                tomaAntipsicoticos
            },
            mensaje: "Medicamentos registrados. Continuamos con el tamizaje."
        };
    }

    validarAntecedentesFamiliares(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const noKeywords = ['no', 'ninguno', 'nadie'];
        
        const familiarPrimerGrado = ['padre', 'madre', 'hermano', 'hermana', 'hijo', 'hija'];
        const diagnosticosPsiquiatricos = [
            'esquizofrenia', 'bipolar', 'depresión', 'ansiedad', 'psicosis'
        ];
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { antecedentesFamiliares: false },
                mensaje: "Sin antecedentes familiares psiquiátricos registrados."
            };
        }
        
        const familiarAfectado = familiarPrimerGrado.some(familiar => 
            respuestaLower.includes(familiar)
        );
        
        const diagnosticoPresente = diagnosticosPsiquiatricos.some(diag => 
            respuestaLower.includes(diag)
        );
        
        return {
            valida: true,
            datos: { 
                antecedentesFamiliares: true,
                detalles: respuesta,
                familiarPrimerGrado: familiarAfectado,
                diagnosticoPresente
            },
            mensaje: "Antecedentes familiares registrados. Continuamos con el tamizaje."
        };
    }

    validarCapacidadesCognitivas(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const noKeywords = ['no', 'ninguno', 'no tengo'];
        const siKeywords = ['sí', 'si', 'tengo', 'problemas'];
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { problemasCapacidades: false },
                mensaje: "Capacidades cognitivas adecuadas para el estudio."
            };
        }
        
        if (siKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { 
                    problemasCapacidades: true,
                    detalles: respuesta
                },
                mensaje: "Problemas de capacidades registrados. Evaluaremos si afectan la participación."
            };
        }
        
        return {
            valida: false,
            mensaje: "Por favor, responde 'sí' o 'no' sobre si tienes problemas para leer, escribir, comunicarte o comprender."
        };
    }

    validarMuestrasBiologicas(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const siKeywords = ['sí', 'si', 'puedo', 'capaz'];
        const noKeywords = ['no', 'no puedo', 'incapaz'];
        
        if (siKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { puedeProporcionarMuestras: true },
                mensaje: "Capacidad para proporcionar muestras biológicas confirmada."
            };
        }
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { puedeProporcionarMuestras: false },
                mensaje: "No puede proporcionar muestras biológicas. Esto puede afectar la elegibilidad."
            };
        }
        
        return {
            valida: false,
            mensaje: "Por favor, responde 'sí' o 'no' sobre si puedes proporcionar muestras de sangre, saliva y epitelio bucal."
        };
    }

    validarExperienciasPsicoticas(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const noKeywords = ['no', 'ninguno', 'nunca', 'nadie'];
        const siKeywords = ['sí', 'si', 'he visto', 'he oído', 'he sentido', 'mi familia'];
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { 
                    experienciasPsicoticas: false,
                    requiereSeguimiento: false
                },
                mensaje: "Sin experiencias psicóticas reportadas."
            };
        }
        
        if (siKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { 
                    experienciasPsicoticas: true,
                    requiereSeguimiento: true,
                    detalles: respuesta
                },
                mensaje: "Experiencias reportadas. Necesitamos hacer algunas preguntas adicionales para evaluar mejor."
            };
        }
        
        return {
            valida: false,
            mensaje: "Por favor, responde 'sí' o 'no' sobre si tú o alguien en tu familia ha tenido estas experiencias."
        };
    }

    validarConsumoSustancias(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const noKeywords = ['no', 'nunca', 'jamás'];
        
        const sustancias = [
            'marihuana', 'cocaína', 'alcohol', 'anfetaminas', 
            'heroína', 'lsd', 'éxtasis', 'crack'
        ];
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { consumeSustancias: false },
                mensaje: "Sin consumo de sustancias reportado."
            };
        }
        
        const sustanciaDetectada = sustancias.some(sustancia => 
            respuestaLower.includes(sustancia)
        );
        
        return {
            valida: true,
            datos: { 
                consumeSustancias: true,
                detalles: respuesta,
                sustanciaDetectada
            },
            mensaje: "Consumo de sustancias registrado. Continuamos con el tamizaje."
        };
    }

    validarParticipacionFamiliar(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        const noKeywords = ['no', 'ninguno', 'nadie'];
        const siKeywords = ['sí', 'si', 'mi hermano', 'mi padre', 'mi madre'];
        
        if (noKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { familiarParticipa: false },
                mensaje: "Sin familiares participantes registrados."
            };
        }
        
        if (siKeywords.some(keyword => respuestaLower.includes(keyword))) {
            return {
                valida: true,
                datos: { 
                    familiarParticipa: true,
                    detalles: respuesta
                },
                mensaje: "Familiar participante registrado. Esto nos ayuda a coordinar la participación."
            };
        }
        
        return {
            valida: false,
            mensaje: "Por favor, responde 'sí' o 'no' sobre si algún familiar ha participado en este estudio."
        };
    }

    validarFuenteInformacion(respuesta) {
        return {
            valida: true,
            datos: { fuenteInformacion: respuesta },
            mensaje: "Fuente de información registrada. ¡Hemos completado el tamizaje inicial!"
        };
    }

    // Método para evaluar seguimiento de psicosis
    evaluarSeguimientoPsicosis(respuestas) {
        let puntuacionAlucinaciones = 0;
        let puntuacionDelirios = 0;
        
        // Evaluar alucinaciones
        const alucinacionesRespuestas = respuestas.filter(r => 
            r.tipo_evaluacion === 'alucinaciones'
        );
        
        alucinacionesRespuestas.forEach(respuesta => {
            const respuestaLower = respuesta.respuesta.toLowerCase();
            
            // Puntuación basada en convicción y frecuencia
            if (respuestaLower.includes('real') || respuestaLower.includes('verdad')) {
                puntuacionAlucinaciones += 2;
            } else if (respuestaLower.includes('imaginación') || respuestaLower.includes('sueño')) {
                puntuacionAlucinaciones += 1;
            }
            
            if (respuestaLower.includes('frecuente') || respuestaLower.includes('siempre')) {
                puntuacionAlucinaciones += 1;
            }
        });
        
        // Evaluar delirios
        const deliriosRespuestas = respuestas.filter(r => 
            r.tipo_evaluacion === 'delirios'
        );
        
        deliriosRespuestas.forEach(respuesta => {
            const respuestaLower = respuesta.respuesta.toLowerCase();
            
            if (respuestaLower.includes('sí') || respuestaLower.includes('si')) {
                puntuacionDelirios += 1;
            }
            
            if (respuestaLower.includes('frecuente') || respuestaLower.includes('siempre')) {
                puntuacionDelirios += 1;
            }
        });
        
        return {
            puntuacionAlucinaciones: Math.min(puntuacionAlucinaciones, 3),
            puntuacionDelirios: Math.min(puntuacionDelirios, 3),
            puntuacionTotal: puntuacionAlucinaciones + puntuacionDelirios
        };
    }

    // Método principal de clasificación
    clasificarParticipante(respuestasTamizaje, respuestasPsicosis = []) {
        const datos = {};
        
        // Extraer datos de las respuestas
        respuestasTamizaje.forEach(respuesta => {
            const validacion = this.validarRespuesta(respuesta.pregunta_numero, respuesta.respuesta);
            if (validacion.valida) {
                Object.assign(datos, validacion.datos);
            }
        });
        
        // Evaluar psicosis si hay seguimiento
        let evaluacionPsicosis = { puntuacionTotal: 0 };
        if (respuestasPsicosis.length > 0) {
            evaluacionPsicosis = this.evaluarSeguimientoPsicosis(respuestasPsicosis);
        }
        
        // Criterios de clasificación
        const criteriosCumplidos = [];
        const criteriosFaltantes = [];
        
        // Verificar criterios básicos
        if (datos.nacionalidadValida) {
            criteriosCumplidos.push("Ancestría mexicana");
        } else {
            criteriosFaltantes.push("4 abuelos mexicanos");
        }
        
        if (datos.puedeProporcionarMuestras) {
            criteriosCumplidos.push("Puede proporcionar muestras biológicas");
        } else {
            criteriosFaltantes.push("Capacidad para muestras biológicas");
        }
        
        if (!datos.problemasCapacidades) {
            criteriosCumplidos.push("Capacidades cognitivas adecuadas");
        } else {
            criteriosFaltantes.push("Problemas de capacidades cognitivas");
        }
        
        // Determinar clasificación
        let tipoClasificado = 'no_elegible';
        
        if (criteriosFaltantes.length === 0) {
            // Clasificación por edad y síntomas
            if (datos.edad >= 10 && datos.edad <= 21) {
                if (evaluacionPsicosis.puntuacionTotal >= 3 || datos.esPsicotico) {
                    tipoClasificado = 'probando';
                    criteriosCumplidos.push("Síntomas psicóticos presentes");
                } else if (!datos.experienciasPsicoticas && !datos.antecedentesFamiliares) {
                    tipoClasificado = 'control';
                    criteriosCumplidos.push("Sin síntomas psicóticos");
                }
            } else if (datos.edad >= 22 && datos.edad <= 75) {
                if (datos.familiarParticipa || datos.antecedentesFamiliares) {
                    tipoClasificado = 'familiar';
                    criteriosCumplidos.push("Familiar de participante");
                }
            }
        }
        
        const elegible = tipoClasificado !== 'no_elegible';
        
        return {
            tipo: tipoClasificado,
            elegible,
            puntuacionAlucinaciones: evaluacionPsicosis.puntuacionAlucinaciones || 0,
            puntuacionDelirios: evaluacionPsicosis.puntuacionDelirios || 0,
            puntuacionTotal: evaluacionPsicosis.puntuacionTotal,
            criteriosCumplidos,
            criteriosFaltantes
        };
    }

    validarRespuesta(numeroPregunta, respuesta) {
        const pregunta = this.preguntasPrincipales.find(p => p.numero === numeroPregunta);
        if (!pregunta) {
            return { valida: false, mensaje: "Pregunta no encontrada" };
        }
        
        return pregunta.validacion.call(this, respuesta);
    }

    obtenerPregunta(numero) {
        return this.preguntasPrincipales.find(p => p.numero === numero);
    }

    obtenerSiguientePregunta(numeroActual) {
        const siguienteNumero = numeroActual + 1;
        return this.preguntasPrincipales.find(p => p.numero === siguienteNumero);
    }

    obtenerPreguntasSeguimiento(tipo) {
        return this.seguimientoPsicosis[tipo] || [];
    }
}

module.exports = TamizajeEPIMex;

