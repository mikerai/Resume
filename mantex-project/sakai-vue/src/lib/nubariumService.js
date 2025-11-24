// src/lib/nubariumService.js
// Servicio para integración con API de Nubarium

const NUBARIUM_PROXY_URL = import.meta.env.VITE_NUBARIUM_PROXY_URL || 'https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev';
const NUBARIUM_BASE_URL = NUBARIUM_PROXY_URL; // Usa Lambda proxy para localhost, dev y prod
const NUBARIUM_CREDENTIALS = {
    username: 'mantex',
    password: 'M#tifk_#c'
};

class NubariumService {
    constructor() {
        this.bearerToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Genera o renueva el token de acceso JWT
     * @param {number} expireAfter - Tiempo de expiración en segundos (1-3600)
     * @returns {Promise<string>} Bearer token
     */
    async generateAccessToken(expireAfter = 3600) {
        try {
            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/global/account/v1/generate-jwt?expire=${expireAfter}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify({ expireAfter })
            });

            const data = await response.json();

            if (data.status === 'OK') {
                this.bearerToken = data.bearer_token;
                this.tokenExpiresAt = Date.now() + (expireAfter * 1000);
                return this.bearerToken;
            } else {
                throw new Error(`Nubarium token error: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error generating Nubarium token:', error);
            throw error;
        }
    }

    /**
     * Verifica si el token actual es válido
     * @returns {boolean}
     */
    isTokenValid() {
        return this.bearerToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt;
    }

    /**
     * Obtiene un token válido (genera uno nuevo si es necesario)
     * @returns {Promise<string>}
     */
    async getValidToken() {
        if (!this.isTokenValid()) {
            await this.generateAccessToken();
        }
        return this.bearerToken;
    }

    /**
     * Realiza una petición autenticada a la API de Nubarium
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Object>}
     */
    async authenticatedRequest(endpoint, options = {}) {
        const token = await this.getValidToken();

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const requestOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        const response = await fetch(`${NUBARIUM_BASE_URL}${endpoint}`, requestOptions);
        return response.json();
    }

    // ==============================================
    // MÉTODOS PARA VALIDACIONES DE CLIENTES
    // ==============================================

    /**
     * Validación OCR de INE/IFE - Extrae datos de imágenes de identificación mexicana
     * @param {string} frontImageBase64 - Imagen frontal del INE/IFE en base64
     * @param {string} backImageBase64 - Imagen trasera del INE/IFE en base64 (opcional)
     * @returns {Promise<Object>}
     */
    async validateINEOCR(frontImageBase64, backImageBase64 = null) {
        try {
            const payload = {
                id: frontImageBase64
            };

            // Agregar imagen trasera si está disponible
            if (backImageBase64) {
                payload.idReverso = backImageBase64;
            }

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/ocr/v1/obtener_datos_id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium OCR error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                // Campos normalizados para fácil acceso
                normalized: {
                    tipo: data.tipo,
                    folio: data.folio,
                    curp: data.curp,
                    claveElector: data.claveElector,
                    nombre: data.nombres,
                    primerApellido: data.primerApellido,
                    segundoApellido: data.segundoApellido,
                    nombreCompleto: `${data.nombres} ${data.primerApellido} ${data.segundoApellido || ''}`.trim(),
                    sexo: data.sexo,
                    edad: data.edad,
                    direccion: {
                        calle: data.calle,
                        colonia: data.colonia,
                        ciudad: data.ciudad,
                        estado: data.estado,
                        municipio: data.municipio,
                        localidad: data.localidad,
                        seccion: data.seccion
                    },
                    vigencia: data.vigencia,
                    emision: data.emision,
                    codigoValidacion: data.codigoValidacion
                }
            };
        } catch (error) {
            console.error('Error en OCR de INE:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Validación contra Lista Nominal del INE
     * @param {Object} ineData - Datos del INE obtenidos del OCR
     * @param {string} credentialType - Tipo de credencial (C, D, E, F, G, H) - determina qué campos enviar
     * @returns {Promise<Object>}
     */
    async validateINENominalList(ineData, credentialType = 'C') {
        try {
            let payload = {};

            // Determinar campos obligatorios según el tipo de credencial
            switch (credentialType) {
                case 'C':
                    payload = {
                        claveElector: ineData.claveElector,
                        numeroEmision: ineData.emision,
                        ocr: ineData.ocr
                    };
                    break;
                case 'D':
                    payload = {
                        cic: ineData.cic,
                        ocr: ineData.ocr
                    };
                    break;
                case 'E':
                case 'F':
                case 'G':
                case 'H':
                    payload = {
                        cic: ineData.cic,
                        identificadorCiudadano: ineData.identificadorCiudadano
                    };
                    break;
                default:
                    // Tipo C por defecto (más común)
                    payload = {
                        claveElector: ineData.claveElector,
                        numeroEmision: ineData.emision,
                        ocr: ineData.ocr
                    };
            }

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/ine/v2/valida_ine`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium Lista Nominal error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                // Campos normalizados
                normalized: {
                    valido: data.estatus === 'OK',
                    mensaje: data.mensaje,
                    claveMensaje: data.claveMensaje,
                    vigencia: data.vigencia,
                    puedeVotar: data.mensaje.toLowerCase().includes('puede votar'),
                    claveElector: data.claveElector,
                    numeroEmision: data.numeroEmision,
                    ocr: data.ocr,
                    cic: data.cic,
                    anioRegistro: data.anioRegistro,
                    anioEmision: data.anioEmision,
                    codigoValidacion: data.codigoValidacion
                }
            };
        } catch (error) {
            console.error('Error en validación Lista Nominal:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Comparación facial entre INE y selfie
     * @param {string} ineImageBase64 - Imagen de la credencial INE en base64
     * @param {string} selfieBase64 - Imagen de selfie o video en base64
     * @param {string} tipo - Tipo de captura: "imagen" o "video"
     * @param {number} limiteInferior - Límite inferior de similitud aceptable (default: 80)
     * @returns {Promise<Object>}
     */
    async validateFaceComparison(ineImageBase64, selfieBase64, tipo = 'imagen', limiteInferior = 80) {
        try {
            const payload = {
                credencial: ineImageBase64,
                captura: selfieBase64,
                tipo: tipo,
                limiteInferior: limiteInferior.toString()
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/biometrics/antifraude/reconocimiento_facial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium Face Comparison error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                normalized: {
                    valido: data.estatus === 'OK',
                    mensaje: data.mensaje,
                    similitud: data.similitud,
                    similitudPorcentaje: `${data.similitud}%`,
                    pasaLimite: data.similitud >= limiteInferior,
                    codigoValidacion: data.codigoValidacion,
                    limiteUtilizado: limiteInferior
                }
            };
        } catch (error) {
            console.error('Error en comparación facial:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Validación completa de INE para clientes (OCR + Lista Nominal + Face Comparison)
     * @param {string} frontImageBase64 - Imagen frontal del INE
     * @param {string} backImageBase64 - Imagen trasera del INE (opcional)
     * @param {string} selfieBase64 - Selfie del usuario (opcional, para face comparison)
     * @param {number} similitudMinima - Similitud mínima para face comparison (default: 80)
     * @returns {Promise<Object>}
     */
    async validateClientINE(frontImageBase64, backImageBase64 = null, selfieBase64 = null, similitudMinima = 80) {
        console.log('🔍 Validando INE de cliente (OCR + Lista Nominal + Face Comparison)...');

        try {
            // Paso 1: OCR para extraer datos
            const ocrResult = await this.validateINEOCR(frontImageBase64, backImageBase64);

            if (!ocrResult.success) {
                return ocrResult;
            }

            // Paso 2: Validar contra Lista Nominal
            const nominalResult = await this.validateINENominalList(ocrResult.data, ocrResult.data.subTipo || 'C');

            let faceResult = null;
            // Paso 3: Comparación facial (opcional)
            if (selfieBase64) {
                faceResult = await this.validateFaceComparison(frontImageBase64, selfieBase64, 'imagen', similitudMinima);
            }

            return {
                success: true,
                data: {
                    ocr: ocrResult.data,
                    nominalList: nominalResult.data,
                    faceComparison: faceResult?.data || null
                },
                normalized: {
                    ...ocrResult.normalized,
                    listaNominal: nominalResult.normalized,
                    comparacionFacial: faceResult?.normalized || null
                }
            };
        } catch (error) {
            console.error('Error en validación completa de INE:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Validación de RFC en el SAT
     * @param {string} rfc - RFC a validar
     * @returns {Promise<Object>}
     */
    async validateRFC(rfc) {
        try {
            const payload = {
                rfc: rfc.toUpperCase() // Normalizar a mayúsculas
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/sat/valida_rfc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium RFC Validation error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                normalized: {
                    valido: data.estatus === 'OK',
                    mensaje: data.mensaje,
                    informacionAdicional: data.informacionAdicional,
                    tipoPersona: data.tipoPersona,
                    esPersonaFisica: data.tipoPersona === 'F',
                    esPersonaMoral: data.tipoPersona === 'M',
                    puedeRecibirFacturas: data.informacionAdicional?.toLowerCase().includes('recibir facturas'),
                    claveMensaje: data.claveMensaje,
                    codigoValidacion: data.codigoValidacion,
                    rfc: rfc.toUpperCase()
                }
            };
        } catch (error) {
            console.error('Error en validación de RFC:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Obtiene la razón social o nombre de una persona/empresa a partir del RFC
     * @param {string} rfc - RFC a consultar
     * @returns {Promise<Object>}
     */
    async getRFCName(rfc) {
        try {
            const payload = {
                rfc: rfc.toUpperCase()
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/sat/v1/obtener-razonsocial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium RFC Name error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                normalized: {
                    valido: data.estatus === 'OK',
                    rfc: data.rfc,
                    nombre: data.nombre,
                    razonSocial: data.nombre, // Alias para compatibilidad
                    mensaje: data.mensaje || '',
                    claveMensaje: data.claveMensaje,
                    codigoValidacion: data.codigoValidacion,
                    tieneNombre: !!data.nombre,
                    tieneFIELoCSD: true // Si retorna nombre, significa que tiene FIEL o CSD
                }
            };
        } catch (error) {
            console.error('Error obteniendo nombre/razón social del RFC:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Validación de RFC para clientes
     * @param {string} rfc - RFC a validar
     * @returns {Promise<Object>}
     */
    async validateClientRFC(rfc) {
        console.log('🔍 Validando RFC de cliente:', rfc);
        return this.validateRFC(rfc);
    }

    /**
     * Validación opcional de CIEC para clientes
     * @param {Object} ciecData - Datos de CIEC
     * @returns {Promise<Object>}
     */
    async validateClientCIEC(ciecData) {
        // TODO: Implementar endpoint específico para CIEC
        console.log('Validating client CIEC:', ciecData);
        // return this.authenticatedRequest('/client/ciec/validate', {
        //     method: 'POST',
        //     body: JSON.stringify(ciecData)
        // });
    }

    // ==============================================
    // MÉTODOS PARA VALIDACIONES DE PROVEEDORES
    // ==============================================

    /**
     * Validación completa de INE para proveedores (OCR + Lista Nominal + Face Comparison)
     * @param {string} frontImageBase64 - Imagen frontal del INE
     * @param {string} backImageBase64 - Imagen trasera del INE (opcional)
     * @param {string} selfieBase64 - Selfie del usuario (opcional, para face comparison)
     * @param {number} similitudMinima - Similitud mínima para face comparison (default: 80)
     * @returns {Promise<Object>}
     */
    async validateSupplierINE(frontImageBase64, backImageBase64 = null, selfieBase64 = null, similitudMinima = 80) {
        console.log('🔍 Validando INE de proveedor (OCR + Lista Nominal + Face Comparison)...');

        try {
            // Paso 1: OCR para extraer datos
            const ocrResult = await this.validateINEOCR(frontImageBase64, backImageBase64);

            if (!ocrResult.success) {
                return ocrResult;
            }

            // Paso 2: Validar contra Lista Nominal
            const nominalResult = await this.validateINENominalList(ocrResult.data, ocrResult.data.subTipo || 'C');

            let faceResult = null;
            // Paso 3: Comparación facial (opcional)
            if (selfieBase64) {
                faceResult = await this.validateFaceComparison(frontImageBase64, selfieBase64, 'imagen', similitudMinima);
            }

            return {
                success: true,
                data: {
                    ocr: ocrResult.data,
                    nominalList: nominalResult.data,
                    faceComparison: faceResult?.data || null
                },
                normalized: {
                    ...ocrResult.normalized,
                    listaNominal: nominalResult.normalized,
                    comparacionFacial: faceResult?.normalized || null
                }
            };
        } catch (error) {
            console.error('Error en validación completa de INE proveedor:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Obtiene facturas del SAT usando RFC y CIEC (vía webhook)
     * @param {string} rfc - RFC del contribuyente
     * @param {string} ciec - Contraseña CIEC del SAT
     * @param {number} mes - Mes a consultar (1-12)
     * @param {number} anio - Año a consultar (formato 4 dígitos)
     * @param {string} webhookUrl - URL donde recibir los resultados
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<Object>}
     */
    async getInvoicesFromSAT(rfc, ciec, mes, anio, webhookUrl, options = {}) {
        try {
            const payload = {
                rfc: rfc.toUpperCase(),
                password: ciec,
                mes: mes,
                anio: anio,
                url: webhookUrl,
                ordenarPor: options.ordenarPor || 'fecha',
                incluirXML: options.incluirXML || false,
                incluirPDF: options.incluirPDF || false
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/sat/v2/get-invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium SAT Invoices error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                normalized: {
                    codigoValidacion: data.codigoValidacion,
                    proceso: 'iniciado',
                    webhookUrl: webhookUrl,
                    parametros: {
                        rfc: rfc.toUpperCase(),
                        mes: mes,
                        anio: anio,
                        ordenarPor: options.ordenarPor || 'fecha',
                        incluirXML: options.incluirXML || false,
                        incluirPDF: options.incluirPDF || false
                    }
                }
            };
        } catch (error) {
            console.error('Error al obtener facturas del SAT:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Validación CIEC mediante obtención de facturas (verificación indirecta)
     * @param {string} rfc - RFC del contribuyente
     * @param {string} ciec - Contraseña CIEC del SAT
     * @param {string} webhookUrl - URL donde recibir los resultados
     * @returns {Promise<Object>}
     */
    async validateCIEC(rfc, ciec, webhookUrl) {
        console.log('🔍 Validando CIEC mediante consulta de facturas...');

        // Usar el mes/año actual para la validación
        const now = new Date();
        const mes = now.getMonth() + 1; // getMonth() es 0-indexed
        const anio = now.getFullYear();

        return this.getInvoicesFromSAT(rfc, ciec, mes, anio, webhookUrl, {
            ordenarPor: 'fecha',
            incluirXML: false,
            incluirPDF: false
        });
    }

    /**
     * Validación SAT (RFC y CIEC) para proveedores
     * @param {string} rfc - RFC del proveedor
     * @param {string} ciec - CIEC del proveedor (opcional)
     * @param {string} webhookUrl - URL para recibir resultados de CIEC (si se proporciona)
     * @returns {Promise<Object>}
     */
    async validateSupplierSAT(rfc, ciec = null, webhookUrl = null) {
        console.log('🔍 Validando SAT de proveedor (RFC + CIEC)...');

        try {
            // Paso 1: Validar RFC
            const rfcResult = await this.validateRFC(rfc);

            if (!rfcResult.success) {
                return rfcResult;
            }

            // Paso 2: Validar CIEC si se proporciona
            let ciecResult = null;
            if (ciec && webhookUrl) {
                ciecResult = await this.validateCIEC(rfc, ciec, webhookUrl);
            } else if (ciec && !webhookUrl) {
                console.log('⚠️ CIEC proporcionado pero sin webhook URL - validación omitida');
            }

            return {
                success: true,
                data: {
                    rfc: rfcResult.data,
                    ciec: ciecResult?.data || null
                },
                normalized: {
                    rfc: rfcResult.normalized,
                    ciec: ciecResult?.normalized || null,
                    validacionCompleta: rfcResult.normalized.valido && (ciec ? !!ciecResult?.success : true)
                }
            };
        } catch (error) {
            console.error('Error en validación SAT:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // ==============================================
    // MÉTODOS PARA BLOCK LISTS (AMBOS ROLES)
    // ==============================================

    /**
     * Consulta Query 69 en Block Lists del SAT
     * @param {string} rfc - RFC a consultar en listas bloqueadas
     * @returns {Promise<Object>}
     */
    async queryBlockList69(rfc) {
        try {
            const payload = {
                rfc: rfc.toUpperCase()
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/sat/consultar_69`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium Block List 69 error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                normalized: {
                    rfc: rfc.toUpperCase(),
                    consultaRealizada: true,
                    // Estos campos dependerán de la respuesta real de Nubarium
                    // Los ajustaremos cuando veas la estructura completa
                    estatus: data.estatus || 'unknown',
                    mensaje: data.mensaje || '',
                    enListaBloqueada: data.bloqueado || false,
                    codigoValidacion: data.codigoValidacion || null,
                    tipoConsulta: 'query_69'
                }
            };
        } catch (error) {
            console.error('Error en Query 69:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Consulta Query 69-B en Block Lists del SAT (Lista Negra Artículo 69-B)
     * @param {string} rfc - RFC a consultar en listas bloqueadas
     * @returns {Promise<Object>}
     */
    async queryBlockList69B(rfc) {
        try {
            const payload = {
                rfc: rfc.toUpperCase()
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/sat/consultar_69b`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Nubarium Block List 69-B error: ${data.error || response.status}`);
            }

            return {
                success: true,
                data: data,
                normalized: {
                    rfc: data.rfc || rfc.toUpperCase(),
                    nombreContribuyente: data.nombreContribuyente || '',
                    consultaRealizada: true,
                    estatus: data.estatus || 'unknown',
                    claveMensaje: data.claveMensaje || '',
                    codigoValidacion: data.codigoValidacion || '',

                    // Información de la situación fiscal
                    situacion: data.situacion || '',
                    esDefinitivo: data.situacion === 'Definitivo',
                    esPresunto: data.situacion === 'Presunto',

                    // Fechas y oficios - Presunto
                    numeroOficioPresunto: data.numeroFechaOficioPresunto || '',
                    publicacionSatPresunto: data.publicacionSatPresunto || '',
                    publicacionDofPresunto: data.publicacionDofPresunto || '',

                    // Fechas y oficios - Definitivo
                    numeroOficioDefinitivo: data.numeroFechaOficioDefinitivo || '',
                    publicacionSatDefinitivo: data.publicacionSatDefinitivo || '',
                    publicacionDofDefinitivo: data.publicacionDofDefinitivo || '',

                    // Fechas y oficios - Desvirtuado
                    numeroOficioDesvirtuado: data.numeroFechaOficioDesvirtuado || '',
                    publicacionSatDesvirtuado: data.publicacionSatDesvirtuado || '',
                    publicacionDofDesvirtuado: data.publicacionDofDesvirtuado || '',

                    // Fechas y oficios - Favorable
                    numeroOficioFavorable: data.numeroFechaOficioFavorable || '',
                    publicacionSatFavorable: data.publicacionSatFavorable || '',
                    publicacionDofFavorable: data.publicacionDofFavorable || '',

                    // Estado general
                    enListaNegra: !!data.situacion && data.situacion !== '',
                    tipoConsulta: 'query_69b'
                }
            };
        } catch (error) {
            console.error('Error en Query 69-B:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Consulta AMBAS Block Lists (Query 69 y 69-B) para validación completa
     * @param {string} rfc - RFC a consultar
     * @returns {Promise<Object>}
     */
    async queryAllBlockLists(rfc) {
        console.log('🔍 Consultando TODAS las Block Lists para RFC:', rfc);

        try {
            // Ejecutar ambas consultas en paralelo para mayor velocidad
            const [query69Result, query69BResult] = await Promise.all([
                this.queryBlockList69(rfc),
                this.queryBlockList69B(rfc)
            ]);

            return {
                success: true,
                data: {
                    query69: query69Result.data,
                    query69B: query69BResult.data
                },
                normalized: {
                    rfc: rfc.toUpperCase(),
                    query69: query69Result.normalized,
                    query69B: query69BResult.normalized,

                    // Estado general de todas las consultas
                    todasConsultasExitosas: query69Result.success && query69BResult.success,
                    enAlgunaListaBloqueada:
                        query69Result.normalized?.enListaBloqueada ||
                        query69BResult.normalized?.enListaNegra || false,

                    // Resumen ejecutivo
                    resumen: {
                        consultasRealizadas: ['query_69', 'query_69b'],
                        alertas: []
                    }
                }
            };
        } catch (error) {
            console.error('Error en consulta completa de Block Lists:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // ==============================================
    // PROOF OF ADDRESS VALIDATION (NEW)
    // ==============================================

    /**
     * Validación de Comprobante de Domicilio (OCR)
     * Detecta automáticamente el tipo: CFE, TELMEX, TELCEL, MEGACABLE, SKY, IZZI
     * @param {string} comprobanteBase64 - Imagen (JPG/PNG) o PDF en base64
     * @returns {Promise<Object>}
     */
    async validateProofOfAddress(comprobanteBase64) {
        try {
            console.log('📄 Validando comprobante de domicilio con Nubarium OCR...');

            const payload = {
                comprobante: comprobanteBase64
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/ocr/v2/comprobante_domicilio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'ERROR') {
                console.error('❌ Error en validación de comprobante:', data.mensaje);
                return {
                    success: false,
                    error: data.mensaje || 'No se identificó el documento',
                    data: null
                };
            }

            // Normalizar respuesta según tipo detectado
            const normalized = {
                tipo: data.tipo, // CFE, TELMEX, TELCEL, MEGACABLE, SKY, IZZI
                nombre: data.nombre,
                direccion: {
                    calle: data.calle,
                    referencia: data.referencia || '',
                    colonia: data.colonia,
                    ciudad: data.ciudad,
                    cp: data.cp
                },
                fechaEmision: data.fecha || data.fechaEmision || data.fechaCorte,
                pagarAntesDe: data.pagarAntesDe || data.fechaLimitePago,
                cuenta: data.cuenta || data.numeroFactura || data.suscriptor,
                codigoValidacion: data.codigoValidacion,
                validado: data.status === 'OK'
            };

            console.log(`✅ Comprobante validado: ${normalized.tipo}`);
            console.log(`   Titular: ${normalized.nombre}`);
            console.log(`   Dirección: ${normalized.direccion.calle}, ${normalized.direccion.colonia}`);

            return {
                success: true,
                data: data,
                normalized
            };
        } catch (error) {
            console.error('💥 Error validando comprobante de domicilio:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Validación de CFE por nombre y número de servicio
     * @param {string} name - Nombre completo del titular
     * @param {string} serviceNumber - Número de servicio CFE (RPU)
     * @returns {Promise<Object>}
     */
    async validateCFE(name, serviceNumber) {
        try {
            console.log('⚡ Validando CFE con Nubarium...');
            console.log(`   Titular: ${name}`);
            console.log(`   RPU: ${serviceNumber}`);

            const payload = {
                name,
                serviceNumber
            };

            const response = await fetch(`${NUBARIUM_BASE_URL}/nubarium/mex/documents/validate-cfe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${NUBARIUM_CREDENTIALS.username}:${NUBARIUM_CREDENTIALS.password}`)}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'ERROR') {
                console.error('❌ Error en validación CFE:', data.message);
                return {
                    success: false,
                    error: data.message || 'Data not found',
                    messageCode: data.messageCode,
                    data: null
                };
            }

            const normalized = {
                validado: data.status === 'OK',
                rpu: data.data?.datos?.rpu,
                nombre: data.data?.datos?.cliente?.nombre,
                direccion: {
                    calle: data.data?.datos?.cliente?.calle,
                    calle2: data.data?.datos?.cliente?.calle2,
                    colonia: data.data?.datos?.cliente?.colonia,
                    codigoPostal: data.data?.datos?.cliente?.codigoPostal,
                    ciudad: data.data?.datos?.cliente?.ciudad,
                    estado: data.data?.datos?.cliente?.estado
                }
            };

            console.log('✅ CFE validado exitosamente');
            console.log(`   RPU: ${normalized.rpu}`);
            console.log(`   Nombre: ${normalized.nombre}`);
            console.log(`   Dirección: ${normalized.direccion.calle}, ${normalized.direccion.colonia}`);

            return {
                success: true,
                data: data.data,
                normalized
            };
        } catch (error) {
            console.error('💥 Error validando CFE:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
}

// Exportar instancia singleton
export const nubariumService = new NubariumService();
export default nubariumService;