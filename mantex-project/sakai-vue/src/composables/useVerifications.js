// src/composables/useVerifications.js

import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient.js';

export function useVerifications() {
    const isLoading = ref(false);

    // ==============================================
    // INE VERIFICATIONS
    // ==============================================

    /**
     * Guarda una verificación INE con su response completo de Nubarium
     */
    async function saveINEVerification(userId, verificationData) {
        try {
            isLoading.value = true;
            console.log('💾 Guardando verificación INE para usuario:', userId);

            const { data, error } = await supabase
                .from('ine_verifications')
                .insert([{
                    user_id: userId,
                    curp: verificationData.curp,
                    ine_number: verificationData.ine_number,
                    verification_status: verificationData.verification_status || 'pending',
                    verification_response: verificationData.verification_response,
                    verified_at: verificationData.verified_at || new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('❌ Error guardando verificación INE:', error);
                throw error;
            }

            console.log('✅ Verificación INE guardada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('💥 Error crítico guardando verificación INE:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Actualiza el status de una verificación INE
     */
    async function updateINEVerificationStatus(userId, verificationId, status, response = null) {
        try {
            const updateData = {
                verification_status: status,
                updated_at: new Date().toISOString()
            };

            if (response) {
                updateData.verification_response = response;
                updateData.verified_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('ine_verifications')
                .update(updateData)
                .eq('id', verificationId)
                .eq('user_id', userId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error actualizando verificación INE:', error);
            throw error;
        }
    }

    /**
     * Obtiene las verificaciones INE de un usuario
     */
    async function getINEVerifications(userId) {
        try {
            const { data, error } = await supabase
                .from('ine_verifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo verificaciones INE:', error);
            throw error;
        }
    }

    // ==============================================
    // SAT VERIFICATIONS
    // ==============================================

    /**
     * Guarda una verificación SAT con su response completo de Nubarium
     */
    async function saveSATVerification(userId, verificationData) {
        try {
            isLoading.value = true;
            console.log('💾 Guardando verificación SAT para usuario:', userId);

            const { data, error } = await supabase
                .from('sat_verifications')
                .insert([{
                    user_id: userId,
                    rfc: verificationData.rfc,
                    ciec: verificationData.ciec || null, // Encriptado
                    verification_status: verificationData.verification_status || 'pending',
                    tax_status: verificationData.tax_status,
                    verification_response: verificationData.verification_response,
                    verified_at: verificationData.verified_at || new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('❌ Error guardando verificación SAT:', error);
                throw error;
            }

            console.log('✅ Verificación SAT guardada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('💥 Error crítico guardando verificación SAT:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Obtiene las verificaciones SAT de un usuario
     */
    async function getSATVerifications(userId) {
        try {
            const { data, error } = await supabase
                .from('sat_verifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo verificaciones SAT:', error);
            throw error;
        }
    }

    // ==============================================
    // SIGER VERIFICATIONS
    // ==============================================

    /**
     * Guarda una verificación SIGER
     */
    async function saveSIGERVerification(userId, verificationData) {
        try {
            isLoading.value = true;
            console.log('💾 Guardando verificación SIGER para usuario:', userId);

            const { data, error } = await supabase
                .from('siger_verifications')
                .insert([{
                    user_id: userId,
                    siger_number: verificationData.siger_number,
                    verification_status: verificationData.verification_status || 'pending',
                    verification_response: verificationData.verification_response,
                    verified_at: verificationData.verified_at || new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('❌ Error guardando verificación SIGER:', error);
                throw error;
            }

            console.log('✅ Verificación SIGER guardada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('💥 Error crítico guardando verificación SIGER:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    // ==============================================
    // BLOCKLIST VERIFICATIONS
    // ==============================================

    /**
     * Guarda una verificación de listas negras (Query 69 o 69-B)
     */
    async function saveBlocklistVerification(userId, verificationData) {
        try {
            isLoading.value = true;
            console.log('💾 Guardando verificación blocklist para usuario:', userId);

            const { data, error } = await supabase
                .from('blocklist_verifications')
                .insert([{
                    user_id: userId,
                    rfc: verificationData.rfc,
                    query_type: verificationData.query_type, // '69' o '69-B'
                    verification_status: verificationData.verification_status || 'pending',
                    is_blocked: verificationData.is_blocked || false,
                    verification_response: verificationData.verification_response,
                    verified_at: verificationData.verified_at || new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('❌ Error guardando verificación blocklist:', error);
                throw error;
            }

            console.log('✅ Verificación blocklist guardada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('💥 Error crítico guardando verificación blocklist:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    // ==============================================
    // DOCUMENT MANAGEMENT
    // ==============================================

    /**
     * Guarda un documento en S3 y registra la referencia en la BD
     */
    async function saveDocument(userId, documentData) {
        try {
            isLoading.value = true;
            console.log('💾 Guardando documento para usuario:', userId);

            const { data, error } = await supabase
                .from('documents')
                .insert([{
                    user_id: userId,
                    document_type: documentData.document_type, // 'ine', 'rfc', 'sat', etc.
                    document_name: documentData.document_name,
                    file_url: documentData.file_url, // S3 URL
                    s3_key: documentData.s3_key, // S3 Object Key
                    file_size: documentData.file_size,
                    mime_type: documentData.mime_type,
                    verification_id: documentData.verification_id || null
                }])
                .select();

            if (error) {
                console.error('❌ Error guardando documento:', error);
                throw error;
            }

            console.log('✅ Documento guardado:', data[0]);
            return data[0];
        } catch (error) {
            console.error('💥 Error crítico guardando documento:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Obtiene los documentos de un usuario
     */
    async function getUserDocuments(userId, documentType = null) {
        try {
            let query = supabase
                .from('documents')
                .select('*')
                .eq('user_id', userId);

            if (documentType) {
                query = query.eq('document_type', documentType);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo documentos:', error);
            throw error;
        }
    }

    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================

    /**
     * Obtiene el resumen de verificaciones de un usuario
     */
    async function getUserVerificationSummary(userId) {
        try {
            const [ineVerifications, satVerifications, sigerVerifications, blocklistVerifications] = await Promise.all([
                getINEVerifications(userId),
                getSATVerifications(userId),
                supabase.from('siger_verifications').select('*').eq('user_id', userId),
                supabase.from('blocklist_verifications').select('*').eq('user_id', userId)
            ]);

            return {
                ine: ineVerifications,
                sat: satVerifications,
                siger: sigerVerifications.data || [],
                blocklist: blocklistVerifications.data || []
            };
        } catch (error) {
            console.error('Error obteniendo resumen de verificaciones:', error);
            throw error;
        }
    }

    return {
        // Estado
        isLoading,

        // INE
        saveINEVerification,
        updateINEVerificationStatus,
        getINEVerifications,

        // SAT
        saveSATVerification,
        getSATVerifications,

        // SIGER
        saveSIGERVerification,

        // Blocklist
        saveBlocklistVerification,

        // Documents
        saveDocument,
        getUserDocuments,

        // Utilities
        getUserVerificationSummary
    };
}