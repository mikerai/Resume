<template>
  <div class="ticket-chat-container">
    <!-- Header -->
    <div class="chat-header">
      <h3>Chat del Ticket</h3>
      <ion-badge v-if="unreadCount > 0" color="danger">
        {{ unreadCount }}
      </ion-badge>
    </div>

    <!-- Messages -->
    <div class="messages-scroll" ref="scrollContainer">
      <div v-if="isLoading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Cargando mensajes...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <ion-icon :icon="chatbubbleEllipsesOutline"></ion-icon>
        <p>No hay mensajes aún</p>
        <small>Envía el primer mensaje</small>
      </div>

      <div v-else class="messages-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message', msg.sender_id === currentUserId ? 'sent' : 'received']"
        >
          <div class="message-header">
            <span class="sender-name">{{ msg.sender_name }}</span>
            <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-bubble">
            <p>{{ msg.text }}</p>
            <ion-icon 
              v-if="msg.sender_id === currentUserId" 
              :icon="msg.read ? checkmarkDone : checkmark" 
              :class="['read-indicator', msg.read ? 'read' : 'sent']"
            />
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="someoneIsTyping" class="typing-indicator">
          <span>{{ typingUserName }} está escribiendo</span>
          <div class="dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-container">
      <ion-input
        v-model="newMessage"
        placeholder="Escribe un mensaje..."
        @ionInput="handleTyping"
        @keyup.enter="send"
        :disabled="isLoading"
      />
      <ion-button 
        @click="send" 
        :disabled="!newMessage.trim() || isLoading"
        fill="solid"
        color="primary"
      >
        <ion-icon :icon="sendOutline"></ion-icon>
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { 
  IonInput, 
  IonButton, 
  IonIcon, 
  IonSpinner, 
  IonBadge 
} from '@ionic/vue';
import { 
  sendOutline, 
  checkmark, 
  checkmarkDone,
  chatbubbleEllipsesOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { useFirebaseChat } from '@/composables/useFirebaseChat';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
  ticketId: {
    type: String,
    required: true
  }
});

const { user } = useAuth();
const currentUserId = computed(() => user.value?.id);

const {
  messages,
  isLoading,
  error,
  someoneIsTyping,
  typingUserName,
  unreadCount,
  sendMessage,
  markAsRead,
  setTypingStatus
} = useFirebaseChat(props.ticketId);

const newMessage = ref('');
const scrollContainer = ref(null);
let typingTimeout = null;

const handleTyping = () => {
  setTypingStatus(true);
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    setTypingStatus(false);
  }, 2000);
};

const send = async () => {
  if (!newMessage.value.trim()) return;
  
  try {
    await sendMessage(newMessage.value);
    newMessage.value = '';
    setTypingStatus(false);
    
    // Scroll to bottom
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const scrollToBottom = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  
  return date.toLocaleDateString('es-MX', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Auto-scroll on new messages
watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// Mark as read when viewing
onMounted(() => {
  markAsRead();
});

watch(messages, () => {
  markAsRead();
});
</script>

<style scoped>
.ticket-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--mantex-primary, #011126);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--mantex-surface, #0F3740);
  border-bottom: 1px solid var(--mantex-accent, #5BA6A6);
}

.chat-header h3 {
  margin: 0;
  color: var(--mantex-light, #F2F2F2);
  font-size: 18px;
}

.messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--mantex-primary, #011126);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--mantex-text-secondary, rgba(242, 242, 242, 0.6));
}

.empty-state ion-icon {
  font-size: 64px;
  color: var(--mantex-accent, #5BA6A6);
  opacity: 0.5;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.message.sent {
  align-self: flex-end;
  align-items: flex-end;
}

.message.received {
  align-self: flex-start;
  align-items: flex-start;
}

.message-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--mantex-text-secondary, rgba(242, 242, 242, 0.6));
}

.sender-name {
  font-weight: 600;
}

.timestamp {
  opacity: 0.7;
}

.message-bubble {
  background: var(--mantex-surface, #0F3740);
  border-radius: 12px;
  padding: 12px 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.message.sent .message-bubble {
  background: var(--mantex-accent, #5BA6A6);
  color: var(--mantex-primary, #011126);
}

.message-bubble p {
  margin: 0;
  word-wrap: break-word;
  line-height: 1.4;
}

.read-indicator {
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 14px;
}

.read-indicator.read {
  color: var(--mantex-success, #37A667);
}

.read-indicator.sent {
  color: rgba(1, 17, 38, 0.5);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--mantex-surface, #0F3740);
  border-radius: 12px;
  max-width: fit-content;
  color: var(--mantex-text-secondary, rgba(242, 242, 242, 0.6));
  font-size: 14px;
}

.dots {
  display: flex;
  gap: 4px;
}

.dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--mantex-accent, #5BA6A6);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dots span:nth-child(1) { animation-delay: -0.32s; }
.dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.input-container {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: var(--mantex-surface, #0F3740);
  border-top: 1px solid var(--mantex-accent, #5BA6A6);
}

.input-container ion-input {
  flex: 1;
  --background: var(--mantex-primary, #011126);
  --color: var(--mantex-light, #F2F2F2);
  --placeholder-color: rgba(242, 242, 242, 0.4);
  --padding-start: 12px;
  --padding-end: 12px;
  border-radius: 8px;
}

.input-container ion-button {
  --padding-start: 16px;
  --padding-end: 16px;
}
</style>
