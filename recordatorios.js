const cron = require('node-cron');

class SistemaRecordatorios {
    constructor(db, openai, enviarMensaje) {
        this.db = db;
        this.openai = openai;
        this.enviarMensaje = enviarMensaje;
        this.tareas = new Map();
        
        this.configurarTareasRecurrentes();
        console.log('⏰ Sistema de recordatorios inicializado');
    }

    configurarTareasRecurrentes() {
        // Verificar citas próximas cada hora
        const tareaRecordatoriosCitas = cron.schedule('0 * * * *', async () => {
            await this.verificarRecordatoriosCitas();
        }, {
            scheduled: false
        });

        // Verificar seguimiento de participación cada 6 horas
        const tareaSeguimientoParticipacion = cron.schedule('0 */6 * * *', async () => {
            await this.verificarSeguimientoParticipacion();
        }, {
            scheduled: false
        });

        // Verificar participantes sin respuesta cada 12 horas
        const tareaParticipantesSinRespuesta = cron.schedule('0 */12 * * *', async () => {
            await this.verificarParticipantesSinRespuesta();
        }, {
            scheduled: false
        });

        // Limpiar recordatorios antiguos diariamente a las 2 AM
        const tareaLimpieza = cron.schedule('0 2 * * *', async () => {
            await this.limpiarRecordatoriosAntiguos();
        }, {
            scheduled: false
        });

        this.tareas.set('recordatorios_citas', tareaRecordatoriosCitas);
        this.tareas.set('seguimiento_participacion', tareaSeguimientoParticipacion);
        this.tareas.set('participantes_sin_respuesta', tareaParticipantesSinRespuesta);
        this.tareas.set('limpieza', tareaLimpieza);

        console.log('📅 Tareas de recordatorios configuradas');
    }

    iniciar() {
        this.tareas.forEach((tarea, nombre) => {
            tarea.start();
            console.log(`✅ Tarea iniciada: ${nombre}`);
        });
    }

    detener() {
        this.tareas.forEach((tarea, nombre) => {
            tarea.stop();
            console.log(`⏹️ Tarea detenida: ${nombre}`);
        });
    }

    async verificarRecordatoriosCitas() {
        try {
            console.log('🔔 Verificando recordatorios de citas...');
            
            // Obtener citas para las próximas 24 horas
            const citasProximas = await this.obtenerCitasProximas();
            
            for (const cita of citasProximas) {
                if (!cita.recordatorio_enviado) {
                    await this.enviarRecordatorioCita(cita);
                }
            }
            
            console.log(`📨 Procesadas ${citasProximas.length} citas próximas`);
            
        } catch (error) {
            console.error('Error verificando recordatorios de citas:', error);
        }
    }

    async verificarSeguimientoParticipacion() {
        try {
            console.log('🔍 Verificando seguimiento de participación...');
            
            // Obtener participantes que completaron tamizaje pero no han agendado
            const participantesPendientes = await this.obtenerParticipantesPendientes();
            
            for (const participante of participantesPendientes) {
                const ultimoRecordatorio = await this.obtenerUltimoRecordatorio(
                    participante.id, 
                    'seguimiento'
                );
                
                // Enviar recordatorio si han pasado más de 3 días
                if (this.debeEnviarSeguimiento(ultimoRecordatorio)) {
                    await this.enviarRecordatorioSeguimiento(participante);
                }
            }
            
            console.log(`📋 Procesados ${participantesPendientes.length} participantes pendientes`);
            
        } catch (error) {
            console.error('Error verificando seguimiento de participación:', error);
        }
    }

    async verificarParticipantesSinRespuesta() {
        try {
            console.log('📞 Verificando participantes sin respuesta...');
            
            // Obtener participantes que iniciaron proceso pero no completaron
            const participantesIncompletos = await this.obtenerParticipantesIncompletos();
            
            for (const participante of participantesIncompletos) {
                const ultimaConversacion = await this.obtenerUltimaConversacion(participante.id);
                
                // Enviar recordatorio si han pasado más de 2 días sin actividad
                if (this.debeSeguirParticipante(ultimaConversacion)) {
                    await this.enviarRecordatorioParticipacion(participante);
                }
            }
            
            console.log(`🔄 Procesados ${participantesIncompletos.length} participantes incompletos`);
            
        } catch (error) {
            console.error('Error verificando participantes sin respuesta:', error);
        }
    }

    async obtenerCitasProximas() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, p.nombre, p.telefono, p.email 
                FROM citas_agendadas c
                JOIN participantes p ON c.participante_id = p.id
                WHERE c.fecha_cita = date('now', '+1 day')
                AND c.estado_cita = 'agendada'
                AND c.recordatorio_enviado = 0
            `;
            
            this.db.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    async obtenerParticipantesPendientes() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.* 
                FROM participantes p
                LEFT JOIN citas_agendadas c ON p.id = c.participante_id
                WHERE p.estado_proceso = 'elegible'
                AND c.id IS NULL
                AND p.fecha_registro <= datetime('now', '-1 day')
            `;
            
            this.db.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    async obtenerParticipantesIncompletos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.* 
                FROM participantes p
                WHERE p.estado_proceso IN ('nuevo', 'tamizaje_iniciado')
                AND p.fecha_registro <= datetime('now', '-2 days')
            `;
            
            this.db.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    async obtenerUltimoRecordatorio(participanteId, tipo) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM recordatorios 
                WHERE participante_id = ? AND tipo_recordatorio = ?
                ORDER BY fecha_envio DESC 
                LIMIT 1
            `;
            
            this.db.db.get(sql, [participanteId, tipo], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async obtenerUltimaConversacion(participanteId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM conversaciones 
                WHERE participante_id = ?
                ORDER BY timestamp DESC 
                LIMIT 1
            `;
            
            this.db.db.get(sql, [participanteId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async enviarRecordatorioCita(cita) {
        try {
            const mensaje = await this.openai.generarRecordatorio(
                'cita',
                { nombre: cita.nombre },
                {
                    fecha_cita: cita.fecha_cita,
                    hora_cita: cita.hora_cita,
                    sede: cita.sede
                }
            );

            await this.enviarMensaje(cita.telefono, mensaje);

            // Registrar recordatorio enviado
            await this.registrarRecordatorio(cita.participante_id, 'cita', mensaje);

            // Marcar recordatorio como enviado
            await this.marcarRecordatorioEnviado(cita.id);

            console.log(`📨 Recordatorio de cita enviado a ${cita.nombre}`);

        } catch (error) {
            console.error('Error enviando recordatorio de cita:', error);
        }
    }

    async enviarRecordatorioSeguimiento(participante) {
        try {
            const mensaje = await this.openai.generarRecordatorio(
                'seguimiento',
                { nombre: participante.nombre }
            );

            await this.enviarMensaje(participante.telefono, mensaje);

            // Registrar recordatorio
            await this.registrarRecordatorio(participante.id, 'seguimiento', mensaje);

            console.log(`📋 Recordatorio de seguimiento enviado a ${participante.nombre}`);

        } catch (error) {
            console.error('Error enviando recordatorio de seguimiento:', error);
        }
    }

    async enviarRecordatorioParticipacion(participante) {
        try {
            const mensaje = await this.openai.generarRecordatorio(
                'participacion',
                { nombre: participante.nombre }
            );

            await this.enviarMensaje(participante.telefono, mensaje);

            // Registrar recordatorio
            await this.registrarRecordatorio(participante.id, 'participacion', mensaje);

            console.log(`🔄 Recordatorio de participación enviado a ${participante.nombre}`);

        } catch (error) {
            console.error('Error enviando recordatorio de participación:', error);
        }
    }

    async registrarRecordatorio(participanteId, tipo, mensaje) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO recordatorios (participante_id, tipo_recordatorio, mensaje_enviado) 
                VALUES (?, ?, ?)
            `;
            
            this.db.db.run(sql, [participanteId, tipo, mensaje], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async marcarRecordatorioEnviado(citaId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE citas_agendadas SET recordatorio_enviado = 1 WHERE id = ?`;
            
            this.db.db.run(sql, [citaId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    debeEnviarSeguimiento(ultimoRecordatorio) {
        if (!ultimoRecordatorio) {
            return true; // Nunca se ha enviado recordatorio
        }

        const fechaUltimoRecordatorio = new Date(ultimoRecordatorio.fecha_envio);
        const ahora = new Date();
        const diferenciaDias = (ahora - fechaUltimoRecordatorio) / (1000 * 60 * 60 * 24);

        return diferenciaDias >= 3; // Enviar cada 3 días
    }

    debeSeguirParticipante(ultimaConversacion) {
        if (!ultimaConversacion) {
            return false; // No hay conversación previa
        }

        const fechaUltimaConversacion = new Date(ultimaConversacion.timestamp);
        const ahora = new Date();
        const diferenciaDias = (ahora - fechaUltimaConversacion) / (1000 * 60 * 60 * 24);

        return diferenciaDias >= 2; // Seguir después de 2 días sin actividad
    }

    async limpiarRecordatoriosAntiguos() {
        try {
            console.log('🧹 Limpiando recordatorios antiguos...');
            
            // Eliminar recordatorios de más de 30 días
            const sql = `
                DELETE FROM recordatorios 
                WHERE fecha_envio <= datetime('now', '-30 days')
            `;
            
            return new Promise((resolve, reject) => {
                this.db.db.run(sql, [], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`🗑️ Eliminados ${this.changes} recordatorios antiguos`);
                        resolve(this.changes);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error limpiando recordatorios antiguos:', error);
        }
    }

    // Métodos para programar recordatorios específicos
    async programarRecordatorioCita(participanteId, fechaCita, horaCita) {
        try {
            const fechaRecordatorio = new Date(fechaCita);
            fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 1); // 24 horas antes
            
            // Programar tarea específica
            const nombreTarea = `recordatorio_cita_${participanteId}_${Date.now()}`;
            
            const tarea = cron.schedule(this.convertirFechaACron(fechaRecordatorio), async () => {
                const participante = await this.obtenerParticipantePorId(participanteId);
                const cita = await this.obtenerCitaPorParticipante(participanteId);
                
                if (participante && cita) {
                    await this.enviarRecordatorioCita({
                        ...cita,
                        nombre: participante.nombre,
                        telefono: participante.telefono
                    });
                }
                
                // Eliminar tarea después de ejecutar
                this.tareas.delete(nombreTarea);
                tarea.stop();
                
            }, {
                scheduled: false
            });
            
            this.tareas.set(nombreTarea, tarea);
            tarea.start();
            
            console.log(`⏰ Recordatorio programado para ${fechaRecordatorio.toISOString()}`);
            
        } catch (error) {
            console.error('Error programando recordatorio de cita:', error);
        }
    }

    async programarSeguimientoPersonalizado(participanteId, diasEspera, tipoSeguimiento) {
        try {
            const fechaSeguimiento = new Date();
            fechaSeguimiento.setDate(fechaSeguimiento.getDate() + diasEspera);
            
            const nombreTarea = `seguimiento_${tipoSeguimiento}_${participanteId}_${Date.now()}`;
            
            const tarea = cron.schedule(this.convertirFechaACron(fechaSeguimiento), async () => {
                const participante = await this.obtenerParticipantePorId(participanteId);
                
                if (participante) {
                    if (tipoSeguimiento === 'participacion') {
                        await this.enviarRecordatorioParticipacion(participante);
                    } else if (tipoSeguimiento === 'seguimiento') {
                        await this.enviarRecordatorioSeguimiento(participante);
                    }
                }
                
                // Eliminar tarea después de ejecutar
                this.tareas.delete(nombreTarea);
                tarea.stop();
                
            }, {
                scheduled: false
            });
            
            this.tareas.set(nombreTarea, tarea);
            tarea.start();
            
            console.log(`📅 Seguimiento ${tipoSeguimiento} programado para ${fechaSeguimiento.toISOString()}`);
            
        } catch (error) {
            console.error('Error programando seguimiento personalizado:', error);
        }
    }

    convertirFechaACron(fecha) {
        // Convertir fecha a formato cron (segundo minuto hora día mes día_semana)
        return `${fecha.getSeconds()} ${fecha.getMinutes()} ${fecha.getHours()} ${fecha.getDate()} ${fecha.getMonth() + 1} *`;
    }

    async obtenerParticipantePorId(participanteId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM participantes WHERE id = ?`;
            
            this.db.db.get(sql, [participanteId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async obtenerCitaPorParticipante(participanteId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM citas_agendadas WHERE participante_id = ? ORDER BY fecha_cita DESC LIMIT 1`;
            
            this.db.db.get(sql, [participanteId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Método para obtener estadísticas de recordatorios
    async obtenerEstadisticasRecordatorios() {
        return new Promise((resolve, reject) => {
            const queries = [
                'SELECT COUNT(*) as total_recordatorios FROM recordatorios',
                'SELECT tipo_recordatorio, COUNT(*) as count FROM recordatorios GROUP BY tipo_recordatorio',
                'SELECT COUNT(*) as recordatorios_hoy FROM recordatorios WHERE date(fecha_envio) = date("now")',
                'SELECT COUNT(*) as citas_con_recordatorio FROM citas_agendadas WHERE recordatorio_enviado = 1'
            ];

            Promise.all(queries.map(query => {
                return new Promise((res, rej) => {
                    this.db.db.all(query, [], (err, rows) => {
                        if (err) rej(err);
                        else res(rows);
                    });
                });
            })).then(results => {
                resolve({
                    totalRecordatorios: results[0][0].total_recordatorios,
                    recordatoriosPorTipo: results[1],
                    recordatoriosHoy: results[2][0].recordatorios_hoy,
                    citasConRecordatorio: results[3][0].citas_con_recordatorio,
                    tareasActivas: this.tareas.size
                });
            }).catch(reject);
        });
    }
}

module.exports = SistemaRecordatorios;

