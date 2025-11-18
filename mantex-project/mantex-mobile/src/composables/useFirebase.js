// src/composables/useFirebase.js

import { ref, onMounted, onUnmounted } from 'vue';
import { useAuth } from './useAuth.js';

export function useFirebase() {
    // Estados reactivos
    const isFirebaseInitialized = ref(false);
    const database = ref(null);
    const messaging = ref(null);
    const analytics = ref(null);
    // NO USAR Firebase Auth - ya tenemos Supabase Auth
    const activeConnections = ref(new Map());
    const error = ref(null);

    // Configuración Firebase
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    // Composables
    const { user, profile } = useAuth();

    /**
     * Inicializa Firebase SDK
     */
    const initializeFirebase = async () => {
        try {
            console.log('🔥 Inicializando Firebase...');

            // Verificar configuración
            if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                throw new Error('Configuración Firebase incompleta');
            }

            // Cargar Firebase SDK dinámicamente
            await loadFirebaseSDK();

            // Inicializar Firebase App
            const app = window.firebase.initializeApp(firebaseConfig);

            // Inicializar servicios - SOLO los que necesitamos
            database.value = window.firebase.database();
            messaging.value = window.firebase.messaging();
            analytics.value = window.firebase.analytics();
            // NO inicializar Firebase Auth - usamos Supabase Auth

            // Configurar reglas de base de datos en memoria
            setupDatabaseRules();

            isFirebaseInitialized.value = true;
            console.log('✅ Firebase inicializado exitosamente');

            // Configurar notificaciones push
            await setupPushNotifications();

            // Configurar Analytics si hay usuario autenticado
            if (user.value) {
                setupAnalytics();
            }

            return true;

        } catch (error) {
            console.error('💥 Error inicializando Firebase:', error);
            error.value = error.message;
            return false;
        }
    };

    /**
     * Carga Firebase SDK de forma dinámica
     */
    const loadFirebaseSDK = () => {
        return new Promise((resolve, reject) => {
            if (window.firebase) {
                resolve();
                return;
            }

            // Cargar Firebase SDK modular - VERSIÓN CORREGIDA para fix de indexing bug
            const scripts = [
                'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
                'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js',
                'https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics-compat.js'
                // NO cargar firebase-auth-compat.js - usamos Supabase Auth
            ];

            let loadedCount = 0;
            const totalScripts = scripts.length;

            scripts.forEach((src) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalScripts) {
                        console.log('✅ Firebase SDK cargado');
                        resolve();
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
    };

    /**
     * Configura las reglas de base de datos
     */
    const setupDatabaseRules = () => {
        // Las reglas se configuran desde Firebase Console
        // Aquí establecemos la estructura de datos esperada

        console.log('📋 Configurando estructura de base de datos');

        // Estructura de datos:
        // - locations/{userId}: ubicaciones tiempo real
        // - notifications/{userId}: notificaciones personales
        // - jobs/{jobId}: estado de trabajos
        // - chat/{roomId}: mensajes tiempo real
    };

    /**
     * Configura notificaciones push
     */
    const setupPushNotifications = async () => {
        try {
            if (!messaging.value) {
                console.warn('⚠️ Firebase Messaging no disponible');
                return false;
            }

            // Solicitar permisos
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('✅ Permisos de notificación concedidos');

                // Obtener token FCM
                const token = await messaging.value.getToken({
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
                });

                if (token) {
                    console.log('🔐 Token FCM obtenido:', token);

                    // Guardar token en Supabase para el usuario actual
                    await saveNotificationToken(token);

                    // Configurar listener para mensajes en primer plano
                    messaging.value.onMessage((payload) => {
                        console.log('📱 Mensaje recibido en primer plano:', payload);
                        handleForegroundMessage(payload);
                    });

                    return token;
                }
            } else {
                console.warn('⚠️ Permisos de notificación denegados');
                return false;
            }

        } catch (error) {
            console.error('❌ Error configurando notificaciones:', error);
            return false;
        }
    };

    /**
     * Guarda el token de notificación en Supabase
     */
    const saveNotificationToken = async (token) => {
        try {
            if (!user.value) return;

            // Aquí se conectaría con Supabase para guardar el token
            // Por ahora lo guardamos localmente
            localStorage.setItem(`fcm_token_${user.value.id}`, token);

            console.log('💾 Token FCM guardado');

        } catch (error) {
            console.error('❌ Error guardando token:', error);
        }
    };

    /**
     * Maneja mensajes recibidos en primer plano
     */
    const handleForegroundMessage = (payload) => {
        const { title, body, icon, data } = payload.notification || {};

        // Mostrar notificación personalizada
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title || 'Mantex Notification', {
                    body: body || 'Nueva notificación',
                    icon: icon || '/favicon.ico',
                    tag: data?.tag || 'mantex-notification',
                    data: data,
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'view',
                            title: 'Ver detalles'
                        },
                        {
                            action: 'dismiss',
                            title: 'Cerrar'
                        }
                    ]
                });
            });
        }
    };

    /**
     * Suscribe a actualizaciones en tiempo real de una ruta
     * @param {string} path - Ruta en Firebase (ej: 'locations/userId')
     * @param {Function} callback - Función a ejecutar con los datos
     */
    const subscribeToRealTimeUpdates = (path, callback) => {
        if (!database.value) {
            console.error('❌ Firebase Database no inicializada');
            return null;
        }

        console.log(`🔄 Suscribiendo a actualizaciones: ${path}`);

        const ref = database.value.ref(path);

        const handleUpdate = (snapshot) => {
            const data = snapshot.val();
            console.log(`📡 Actualización recibida en ${path}:`, data);
            callback(data);
        };

        const handleError = (error) => {
            console.error(`❌ Error en suscripción ${path}:`, error);
        };

        // Suscribirse a cambios
        ref.on('value', handleUpdate, handleError);

        // Guardar referencia para cleanup
        activeConnections.value.set(path, ref);

        // Retornar función para desuscribirse
        return () => {
            ref.off('value', handleUpdate);
            activeConnections.value.delete(path);
            console.log(`🛑 Desuscrito de: ${path}`);
        };
    };

    /**
     * Envía datos en tiempo real a Firebase
     * @param {string} path - Ruta en Firebase
     * @param {Object} data - Datos a enviar
     */
    const sendRealTimeUpdate = async (path, data) => {
        if (!database.value) {
            throw new Error('Firebase Database no inicializada');
        }

        try {
            console.log(`📤 Enviando datos a ${path}:`, data);

            const ref = database.value.ref(path);
            await ref.set({
                ...data,
                timestamp: Date.now()
            });

            console.log(`✅ Datos enviados a ${path}`);
            return true;

        } catch (error) {
            console.error(`❌ Error enviando datos a ${path}:`, error);
            throw error;
        }
    };

    /**
     * Obtiene datos una sola vez de Firebase
     * @param {string} path - Ruta en Firebase
     */
    const getDataOnce = async (path) => {
        if (!database.value) {
            throw new Error('Firebase Database no inicializada');
        }

        try {
            console.log(`📖 Obteniendo datos de: ${path}`);

            const ref = database.value.ref(path);
            const snapshot = await ref.once('value');
            const data = snapshot.val();

            console.log(`✅ Datos obtenidos de ${path}:`, data);
            return data;

        } catch (error) {
            console.error(`❌ Error obteniendo datos de ${path}:`, error);
            throw error;
        }
    };

    /**
     * Elimina datos de Firebase
     * @param {string} path - Ruta a eliminar
     */
    const removeData = async (path) => {
        if (!database.value) {
            throw new Error('Firebase Database no inicializada');
        }

        try {
            console.log(`🗑️ Eliminando datos de: ${path}`);

            const ref = database.value.ref(path);
            await ref.remove();

            console.log(`✅ Datos eliminados de ${path}`);
            return true;

        } catch (error) {
            console.error(`❌ Error eliminando datos de ${path}:`, error);
            throw error;
        }
    };

    /**
     * Envía notificación push a un usuario específico
     * @param {string} userId - ID del usuario destinatario
     * @param {Object} notification - Datos de la notificación
     */
    const sendPushNotification = async (userId, notification) => {
        try {
            console.log(`📱 Enviando notificación a usuario: ${userId}`);

            // Guardar notificación en Firebase para que el cliente la reciba
            await sendRealTimeUpdate(`notifications/${userId}/${Date.now()}`, {
                title: notification.title,
                body: notification.body,
                icon: notification.icon || '/favicon.ico',
                data: notification.data || {},
                read: false,
                createdAt: Date.now()
            });

            console.log('✅ Notificación enviada');
            return true;

        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            throw error;
        }
    };

    /**
     * Obtiene notificaciones no leídas del usuario actual
     */
    const getUnreadNotifications = async () => {
        if (!user.value) return [];

        try {
            const notifications = await getDataOnce(`notifications/${user.value.id}`);

            if (!notifications) return [];

            // Filtrar solo no leídas y ordenar por fecha
            const unreadNotifications = Object.entries(notifications)
                .filter(([key, notification]) => !notification.read)
                .map(([key, notification]) => ({ id: key, ...notification }))
                .sort((a, b) => b.createdAt - a.createdAt);

            console.log(`📬 ${unreadNotifications.length} notificaciones no leídas`);
            return unreadNotifications;

        } catch (error) {
            console.error('❌ Error obteniendo notificaciones:', error);
            return [];
        }
    };

    /**
     * Marca una notificación como leída
     * @param {string} notificationId - ID de la notificación
     */
    const markNotificationAsRead = async (notificationId) => {
        if (!user.value) return;

        try {
            await sendRealTimeUpdate(
                `notifications/${user.value.id}/${notificationId}/read`,
                true
            );

            console.log(`✅ Notificación ${notificationId} marcada como leída`);
            return true;

        } catch (error) {
            console.error('❌ Error marcando notificación:', error);
            return false;
        }
    };

    /**
     * Configura Analytics con información del usuario
     */
    const setupAnalytics = () => {
        if (!analytics.value || !user.value) return;

        try {
            // Establecer user properties básicas
            analytics.value.setUserId(user.value.id);

            analytics.value.setUserProperties({
                user_role: profile.value?.role || 'unknown',
                user_email: user.value.email,
                onboarding_complete: profile.value?.onboarding_complete || false
            });

            console.log('📊 Analytics configurado para usuario:', user.value.email);

        } catch (error) {
            console.error('❌ Error configurando Analytics:', error);
        }
    };

    /**
     * Registra un evento básico en Analytics
     * @param {string} eventName - Nombre del evento
     * @param {Object} parameters - Parámetros del evento
     */
    const logAnalyticsEvent = (eventName, parameters = {}) => {
        if (!analytics.value) {
            console.warn('⚠️ Analytics no inicializado');
            return;
        }

        try {
            // Agregar información contextual automática
            const enrichedParameters = {
                ...parameters,
                user_role: profile.value?.role || 'unknown',
                timestamp: Date.now()
            };

            analytics.value.logEvent(eventName, enrichedParameters);
            console.log(`📈 Evento analítico: ${eventName}`, enrichedParameters);

        } catch (error) {
            console.error('❌ Error registrando evento:', error);
        }
    };

    /**
     * Registra navegación de página
     * @param {string} pageName - Nombre de la página
     * @param {string} pageTitle - Título de la página
     */
    const logPageView = (pageName, pageTitle = '') => {
        logAnalyticsEvent('page_view', {
            page_name: pageName,
            page_title: pageTitle || pageName
        });
    };

    /**
     * Limpia todas las conexiones activas
     */
    const disconnectAll = () => {
        activeConnections.value.forEach((ref, path) => {
            ref.off();
            console.log(`🔌 Desconectado de: ${path}`);
        });

        activeConnections.value.clear();
        console.log('🛑 Todas las conexiones Firebase cerradas');
    };

    // Inicialización automática
    onMounted(() => {
        if (Object.values(firebaseConfig).every(value => value)) {
            initializeFirebase();
        } else {
            console.warn('⚠️ Configuración Firebase incompleta');
        }
    });

    // Cleanup al desmontar
    onUnmounted(() => {
        disconnectAll();
    });

    return {
        // Estado
        isFirebaseInitialized,
        database,
        messaging,
        analytics,
        error,

        // Inicialización
        initializeFirebase,

        // Real-time data
        subscribeToRealTimeUpdates,
        sendRealTimeUpdate,
        getDataOnce,
        removeData,

        // Notificaciones
        sendPushNotification,
        getUnreadNotifications,
        markNotificationAsRead,

        // Analytics
        setupAnalytics,
        logAnalyticsEvent,
        logPageView,

        // Utilidades
        disconnectAll
    };
}