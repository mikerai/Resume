<template>
  <div class="ticket-chat">
    <!-- Messages Scroll -->
    <div class="messages-scroll" ref="messagesContainer">
      <div v-if="isLoading" class="flex justify-content-center align-items-center h-full">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="messages.length === 0" class="flex flex-column align-items-center justify-content-center h-full text-500">
        <i class="pi pi-comments text-4xl mb-2"></i>
        <p>No hay mensajes aún. ¡Inicia la conversación!</p>
      </div>

      <div v-else class="messages-list">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          :class="['message', isMe(msg.sender_id) ? 'sent' : 'received']"
        >
          <div class="message-header">
            <span class="sender-name">{{ msg.sender_name }}</span>
            <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-bubble">
            <p>{{ msg.text }}</p>
            <i v-if="isMe(msg.sender_id)" class="pi read-indicator" :class="msg.read ? 'pi-check-circle' : 'pi-check'"></i>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="someoneIsTyping" class="text-xs text-500">
          <span class="font-semibold">{{ typingUserName }}</span> está escribiendo...
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-container">
      <InputText 
        v-model="newMessage" 
        placeholder="Escribe un mensaje..." 
        @keyup.enter="handleSend"
        @input="handleTyping"
        :disabled="isLoading"
      />
      <Button 
        icon="pi pi-send" 
        @click="handleSend" 
        :disabled="!newMessage.trim() || isLoading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { useFirebaseChat } from '@/composables/useFirebaseChat';
import { useAuth } from '@/composables/useAuth';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps({
  ticketId: {
    type: String,
    required: true
  }
});

const { user } = useAuth();
const { 
  messages, 
  sendMessage, 
  isLoading, 
  markAsRead, 
  setTypingStatus, 
  someoneIsTyping, 
  typingUserName 
} = useFirebaseChat(props.ticketId);

const newMessage = ref('');
const messagesContainer = ref(null);
let typingTimeout = null;

const isMe = (senderId) => {
  return user.value && senderId === user.value.id;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const handleSend = async () => {
  if (!newMessage.value.trim()) return;
  
  const text = newMessage.value;
  newMessage.value = '';
  
  try {
    await sendMessage(text);
    setTypingStatus(false);
    scrollToBottom();
  } catch (error) {
    console.error('Error sending message:', error);
    newMessage.value = text; 
  }
};

const handleTyping = () => {
  setTypingStatus(true);
  
  if (typingTimeout) clearTimeout(typingTimeout);
  
  typingTimeout = setTimeout(() => {
    setTypingStatus(false);
  }, 2000);
};

// Watchers
watch(messages, () => {
  scrollToBottom();
  markAsRead();
}, { deep: true });

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.ticket-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.sender-name {
  font-weight: 600;
}

.timestamp {
  opacity: 0.7;
}

.message-bubble {
  background: var(--surface-card);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message.sent .message-bubble {
  background: var(--primary-color);
  color: var(--primary-color-text);
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
  font-size: 0.875rem;
  opacity: 0.7;
}

.input-container {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
  background: var(--surface-ground);
}

.input-container .p-inputtext {
  flex: 1;
}
</style>
