<template>
  <div class="ticket-chat h-full flex flex-column">
    <!-- Messages Area -->
    <div class="flex-grow-1 overflow-y-auto p-3 border-round surface-ground mb-3" style="min-height: 300px; max-height: 500px;" ref="messagesContainer">
      <div v-if="isLoading" class="flex justify-content-center align-items-center h-full">
        <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
      </div>

      <div v-else-if="messages.length === 0" class="flex flex-column align-items-center justify-content-center h-full text-gray-500">
        <i class="pi pi-comments text-4xl mb-2"></i>
        <p>No hay mensajes aún. ¡Inicia la conversación!</p>
      </div>

      <div v-else class="flex flex-column gap-3">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="flex flex-column"
          :class="{'align-items-end': isMe(msg.sender_id), 'align-items-start': !isMe(msg.sender_id)}"
        >
          <div 
            class="p-3 border-round-xl max-w-20rem shadow-1"
            :class="{
              'bg-primary text-white': isMe(msg.sender_id), 
              'surface-card text-900': !isMe(msg.sender_id)
            }"
          >
            <div class="text-xs mb-1 opacity-80 font-semibold" v-if="!isMe(msg.sender_id)">
              {{ msg.sender_name }}
            </div>
            <div class="message-text" style="word-break: break-word;">
              {{ msg.text }}
            </div>
            <div class="text-xs mt-1 text-right opacity-70 flex align-items-center justify-content-end gap-1">
              {{ formatTime(msg.timestamp) }}
              <i v-if="isMe(msg.sender_id)" class="pi" :class="msg.read ? 'pi-check-circle' : 'pi-check'"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Typing Indicator -->
    <div v-if="someoneIsTyping" class="text-xs text-gray-500 ml-2 mb-2 h-1rem">
      <span class="font-semibold">{{ typingUserName }}</span> está escribiendo...
    </div>
    <div v-else class="h-1rem mb-2"></div>

    <!-- Input Area -->
    <div class="flex gap-2">
      <InputText 
        v-model="newMessage" 
        placeholder="Escribe un mensaje..." 
        class="flex-grow-1" 
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
  newMessage.value = ''; // Clear immediately for UX
  
  try {
    await sendMessage(text);
    setTypingStatus(false);
    scrollToBottom();
  } catch (error) {
    console.error('Error sending message:', error);
    // Restore message if failed (optional, but good UX)
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
.message-text {
  line-height: 1.4;
}
</style>
