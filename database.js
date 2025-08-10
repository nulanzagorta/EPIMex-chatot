const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseManager {
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || './epimex_database.sqlite';
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error al conectar con la base de datos:', err);
            } else {
                console.log('✅ Base de datos conectada:', this.dbPath);
                this.createTables();
            }
        });
    }

    createTables() {
        const tables = [
            // Tabla de participantes
            `CREATE TABLE IF NOT EXISTS participantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                edad INTEGER,
                sexo TEXT,
                telefono TEXT UNIQUE,
                email TEXT,
                ciudad TEXT,
                sede_preferida TEXT,
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                estado_proceso TEXT DEFAULT 'nuevo',
                clasificacion TEXT,
                elegible BOOLEAN DEFAULT 0,
                notas TEXT
            )`,

            // Tabla de respuestas de tamizaje
            `CREATE TABLE IF NOT EXISTS tamizaje_respuestas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participante_id INTEGER,
                pregunta_numero INTEGER,
                pregunta_texto TEXT,
                respuesta TEXT,
                fecha_respuesta DATETIME DEFAULT CURRENT_TIMESTAMP,
                requiere_seguimiento BOOLEAN DEFAULT 0,
                FOREIGN KEY (participante_id) REFERENCES participantes (id)
            )`,

            // Tabla de seguimiento de psicosis
            `CREATE TABLE IF NOT EXISTS psicosis_seguimiento (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participante_id INTEGER,
                tipo_evaluacion TEXT, -- 'alucinaciones' o 'delirios'
                pregunta_especifica TEXT,
                respuesta TEXT,
                puntuacion INTEGER DEFAULT 0,
                fecha_evaluacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (participante_id) REFERENCES participantes (id)
            )`,

            // Tabla de clasificación
            `CREATE TABLE IF NOT EXISTS clasificacion_participantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participante_id INTEGER,
                tipo_clasificado TEXT, -- 'probando', 'familiar', 'control'
                puntuacion_alucinaciones INTEGER DEFAULT 0,
                puntuacion_delirios INTEGER DEFAULT 0,
                puntuacion_total INTEGER DEFAULT 0,
                criterios_cumplidos TEXT,
                criterios_faltantes TEXT,
                fecha_clasificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (participante_id) REFERENCES participantes (id)
            )`,

            // Tabla de citas
            `CREATE TABLE IF NOT EXISTS citas_agendadas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participante_id INTEGER,
                fecha_cita DATE,
                hora_cita TIME,
                sede TEXT,
                estado_cita TEXT DEFAULT 'agendada',
                recordatorio_enviado BOOLEAN DEFAULT 0,
                confirmacion_recibida BOOLEAN DEFAULT 0,
                fecha_agendamiento DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (participante_id) REFERENCES participantes (id)
            )`,

            // Tabla de recordatorios
            `CREATE TABLE IF NOT EXISTS recordatorios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participante_id INTEGER,
                tipo_recordatorio TEXT, -- 'cita', 'seguimiento', 'participacion'
                mensaje_enviado TEXT,
                fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
                respuesta_recibida TEXT,
                fecha_respuesta DATETIME,
                FOREIGN KEY (participante_id) REFERENCES participantes (id)
            )`,

            // Tabla de conversaciones
            `CREATE TABLE IF NOT EXISTS conversaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participante_id INTEGER,
                telefono TEXT,
                mensaje_usuario TEXT,
                respuesta_bot TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                estado_conversacion TEXT,
                FOREIGN KEY (participante_id) REFERENCES participantes (id)
            )`
        ];

        tables.forEach((tableSQL, index) => {
            this.db.run(tableSQL, (err) => {
                if (err) {
                    console.error(`Error creando tabla ${index + 1}:`, err);
                } else {
                    console.log(`✅ Tabla ${index + 1} creada/verificada`);
                }
            });
        });
    }

    // Métodos para participantes
    async createParticipante(data) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO participantes (nombre, edad, sexo, telefono, email, ciudad, sede_preferida) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [data.nombre, data.edad, data.sexo, data.telefono, data.email, data.ciudad, data.sede_preferida], 
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
        });
    }

    async getParticipanteByTelefono(telefono) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM participantes WHERE telefono = ?`;
            
            this.db.get(sql, [telefono], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateParticipanteEstado(participanteId, estado) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE participantes SET estado_proceso = ? WHERE id = ?`;
            
            this.db.run(sql, [estado, participanteId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Métodos para tamizaje
    async saveTamizajeRespuesta(participanteId, preguntaNumero, preguntaTexto, respuesta, requiereSeguimiento = false) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO tamizaje_respuestas (participante_id, pregunta_numero, pregunta_texto, respuesta, requiere_seguimiento) 
                         VALUES (?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [participanteId, preguntaNumero, preguntaTexto, respuesta, requiereSeguimiento], 
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
        });
    }

    async getTamizajeRespuestas(participanteId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tamizaje_respuestas WHERE participante_id = ? ORDER BY pregunta_numero`;
            
            this.db.all(sql, [participanteId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Métodos para seguimiento de psicosis
    async savePsicosisEvaluacion(participanteId, tipoEvaluacion, preguntaEspecifica, respuesta, puntuacion) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO psicosis_seguimiento (participante_id, tipo_evaluacion, pregunta_especifica, respuesta, puntuacion) 
                         VALUES (?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [participanteId, tipoEvaluacion, preguntaEspecifica, respuesta, puntuacion], 
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
        });
    }

    // Métodos para clasificación
    async saveClasificacion(participanteId, clasificacionData) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO clasificacion_participantes 
                         (participante_id, tipo_clasificado, puntuacion_alucinaciones, puntuacion_delirios, 
                          puntuacion_total, criterios_cumplidos, criterios_faltantes) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [
                participanteId, 
                clasificacionData.tipo, 
                clasificacionData.puntuacionAlucinaciones,
                clasificacionData.puntuacionDelirios,
                clasificacionData.puntuacionTotal,
                JSON.stringify(clasificacionData.criteriosCumplidos),
                JSON.stringify(clasificacionData.criteriosFaltantes)
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Métodos para citas
    async agendarCita(participanteId, fechaCita, horaCita, sede) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO citas_agendadas (participante_id, fecha_cita, hora_cita, sede) 
                         VALUES (?, ?, ?, ?)`;
            
            this.db.run(sql, [participanteId, fechaCita, horaCita, sede], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Métodos para conversaciones
    async saveConversacion(participanteId, telefono, mensajeUsuario, respuestaBot, estadoConversacion) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO conversaciones (participante_id, telefono, mensaje_usuario, respuesta_bot, estado_conversacion) 
                         VALUES (?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [participanteId, telefono, mensajeUsuario, respuestaBot, estadoConversacion], 
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
        });
    }

    // Métodos de estadísticas
    async getEstadisticas() {
        return new Promise((resolve, reject) => {
            const queries = [
                'SELECT COUNT(*) as total_participantes FROM participantes',
                'SELECT clasificacion, COUNT(*) as count FROM participantes WHERE clasificacion IS NOT NULL GROUP BY clasificacion',
                'SELECT estado_proceso, COUNT(*) as count FROM participantes GROUP BY estado_proceso',
                'SELECT COUNT(*) as citas_agendadas FROM citas_agendadas WHERE estado_cita = "agendada"'
            ];

            Promise.all(queries.map(query => {
                return new Promise((res, rej) => {
                    this.db.all(query, [], (err, rows) => {
                        if (err) rej(err);
                        else res(rows);
                    });
                });
            })).then(results => {
                resolve({
                    totalParticipantes: results[0][0].total_participantes,
                    clasificaciones: results[1],
                    estadosProceso: results[2],
                    citasAgendadas: results[3][0].citas_agendadas
                });
            }).catch(reject);
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error cerrando la base de datos:', err);
                } else {
                    console.log('Base de datos cerrada correctamente');
                }
            });
        }
    }
}

module.exports = DatabaseManager;

