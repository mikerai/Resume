// src/composables/useFirebaseChat.js
// Real-time chat for tickets using Firebase Realtime Database

import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
    ref as dbRef,
    onValue,
    push,
    set,
    update,
    serverTimestamp,
    off
} from 'firebase/database';
import { useAuth } from '@/composables/useAuth';
import { database } from '@/lib/firebaseConfig';

export function useFirebaseChat(ticketId) {
    const { user, profile } = useAuth();
    const messages = ref([]);
    const isTyping = ref({});
    const isLoading = ref(false);
    const error = ref(null);

    let messagesUnsubscribe = null;
    let typingUnsubscribe = null;

    const chatPath = `chats/ticket_${ticketId}`;

    /**
     * Send a message to the chat
     */
    const sendMessage = async (text) => {
        try {
            if (!database) {
                throw new Error('Firebase not initialized');
            }

            if (!text.trim()) {
                return;
            }

            const messagesRef = dbRef(database, `${chatPath}/messages`);
            const newMessageRef = push(messagesRef);

            await set(newMessageRef, {
                sender_id: user.value.id,
                sender_name: profile.value.username || 'Usuario',
                sender_role: profile.value.role,
                text: text.trim(),
                timestamp: serverTimestamp(),
                read: false
            });

            // Update last message metadata
            await set(dbRef(database, `${chatPath}/lastMessage`), {
                text: text.trim(),
                sender_name: profile.value.username || 'Usuario',
                timestamp: serverTimestamp()
            });

            console.log('✅ Message sent to Firebase');

        } catch (error) {
            console.error('Error sending message:', error);
            error.value = error.message;
            throw error;
        }
    };

    /**
     * Mark messages as read
     */
    const markAsRead = async () => {
        try {
            if (!database || !messages.value.length) return;

            const updates = {};

            messages.value.forEach((msg) => {
                if (msg.sender_id !== user.value.id && !msg.read) {
                    updates[`${chatPath}/messages/${msg.id}/read`] = true;
                }
            });

            if (Object.keys(updates).length > 0) {
                const dbReference = dbRef(database);
                await update(dbReference, updates);
            }

        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    /**
     * Set typing status
     */
    const setTypingStatus = async (typing) => {
        try {
            if (!database) return;

            await set(dbRef(database, `${chatPath}/typing/${user.value.id}`), {
                name: profile.value.username || 'Usuario',
                typing,
                timestamp: serverTimestamp()
            });

        } catch (error) {
            console.error('Error setting typing status:', error);
        }
    };

    /**
     * Initialize chat listeners
     */
    const initializeChat = () => {
        if (!database) {
            error.value = 'Firebase not initialized';
            return;
        }

        isLoading.value = true;

        // Listen to messages
        const messagesRef = dbRef(database, `${chatPath}/messages`);
        messagesUnsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                messages.value = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => {
                    // Handle serverTimestamp (which is null initially)
                    const aTime = a.timestamp || 0;
                    const bTime = b.timestamp || 0;
                    return aTime - bTime;
                });
            } else {
                messages.value = [];
            }

            isLoading.value = false;
        }, (err) => {
            console.error('Error listening to messages:', err);
            error.value = err.message;
            isLoading.value = false;
        });

        // Listen to typing indicators
        const typingRef = dbRef(database, `${chatPath}/typing`);
        typingUnsubscribe = onValue(typingRef, (snapshot) => {
            isTyping.value = snapshot.val() || {};
        });
    };

    /**
     * Cleanup listeners
     */
    const cleanup = () => {
        if (messagesUnsubscribe) {
            const messagesRef = dbRef(database, `${chatPath}/messages`);
            off(messagesRef);
            messagesUnsubscribe = null;
        }

        if (typingUnsubscribe) {
            const typingRef = dbRef(database, `${chatPath}/typing`);
            off(typingRef);
            typingUnsubscribe = null;
        }
    };

    // Computed properties
    const someoneIsTyping = computed(() => {
        if (!isTyping.value) return false;

        return Object.keys(isTyping.value).some(
            id => id !== user.value?.id && isTyping.value[id]?.typing
        );
    });

    const typingUserName = computed(() => {
        if (!isTyping.value) return '';

        const typingId = Object.keys(isTyping.value).find(
            id => id !== user.value?.id && isTyping.value[id]?.typing
        );

        return typingId ? isTyping.value[typingId].name : '';
    });

    const unreadCount = computed(() => {
        return messages.value.filter(
            msg => msg.sender_id !== user.value?.id && !msg.read
        ).length;
    });

    // Lifecycle
    onMounted(() => {
        initializeChat();
    });

    onUnmounted(() => {
        cleanup();
    });

    return {
        // State
        messages,
        isTyping,
        isLoading,
        error,

        // Computed
        someoneIsTyping,
        typingUserName,
        unreadCount,

        // Methods
        sendMessage,
        markAsRead,
        setTypingStatus,
        initializeChat,
        cleanup
    };
}
