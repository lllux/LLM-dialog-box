<template>
  <div class="chat-container">
    <!-- 左侧聊天列表 -->
    <div class="top-navbar">
      <!-- 历史记录切换按钮 -->
      <el-button
        type="primary"
        class="history-toggle-btn"
        @click="toggleHistory"
      >
        {{ isHistoryVisible ? "收起历史记录" : "历史记录" }}
      </el-button>

      <!-- 新建聊天 -->
      <el-button type="success" class="new-chat-btn" @click="createNewChat">
        新建聊天
      </el-button>
    </div>

    <!-- 聊天历史列表 -->
    <div class="chat-sidebar" :class="{ visible: isHistoryVisible }">
      <ul class="chat-list">
        <li v-for="chat in chatList" :key="chat.id" class="chat-item">
          <div class="chat-item-content">
            <!-- 判断是否在编辑状态 -->
            <template v-if="editingChatId === chat.id">
              <input
                v-model="chat.name"
                @blur="saveChatName(chat)"
                @keyup.enter="saveChatName(chat)"
                class="edit-input"
                :id="'edit-input-' + chat.id"
              />
            </template>

            <template v-else>
              <el-button
                @click="switchChat(chat.id)"
                :type="chat.id === chatId ? 'success' : 'default'"
                class="chat-btn"
              >
                {{ chat.name }}
              </el-button>
            </template>

            <el-dropdown placement="top-start" trigger="click">
              <el-button size="small" class="menu-btn">···</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="renameChat(chat.id)"
                    >重命名</el-dropdown-item
                  >
                  <el-dropdown-item @click="deleteChat(chat.id)"
                    >删除</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </li>
      </ul>
    </div>

    <!-- 右侧聊天窗口 -->
    <div class="chat-window" ref="chatWindow">
      <div class="chat-body">
        <div v-for="(message, index) in messages" :key="index" class="message">
          <div v-if="message.role === 'ai'" class="ai-message">
            <img src="../assets/images/coze.png" alt="AI" class="side" />
            <div class="bubble">{{ message.content }}<copybox :message="message.content" /></div>
          </div>
          <div v-if="message.role === 'user'" class="user-message">
            <div class="bubble">{{ message.content }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input
          v-model="question"
          :disabled="loading"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          placeholder="输入你的问题..."
          class="input-area"
          @keydown.enter.prevent="sendQuestion"
        ></el-input>
        <el-button
          :loading="loading"
          type="primary"
          @click="sendQuestion"
          :disabled="!question.trim() || loading"
          class="send-button"
        >
          发送
        </el-button>
      </div>
      <div class="tips">内容由 AI 生成，请仔细甄别</div>
    </div>
  </div>
</template>

<script lang="ts" setup name="chat">
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from "vue";
import axios from "axios";
import copybox from "./copybox.vue";

const BOT_ID = "7465630144141950985";

const chatId = ref(""); // 当前聊天的 ID
const messages = ref<{ role: string; content: string }[]>([]);
const chatList = ref<{ id: string; name: string }[]>([]); // 存储所有的聊天
const question = ref("");
const loading = ref(false);
const isHistoryVisible = ref(false); // 默认不显示历史记录
const activeMenuId = ref(""); // 当前显示菜单的聊天 ID

const chatWindow = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatWindow.value) {
      chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
    }
  });
};

// 点击空白处关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const menus = document.querySelectorAll(".menu-dropdown"); // 获取所有菜单
  const buttons = document.querySelectorAll(".menu-btn"); // 获取所有菜单按钮

  let clickedInsideMenu = false;
  let clickedInsideButton = false;

  menus.forEach((menu) => {
    if (menu.contains(event.target as Node)) {
      clickedInsideMenu = true;
    }
  });

  buttons.forEach((button) => {
    if (button.contains(event.target as Node)) {
      clickedInsideButton = true;
    }
  });

  if (!clickedInsideMenu && !clickedInsideButton) {
    activeMenuId.value = ""; // 关闭菜单
  }
};

// 组件挂载时添加事件监听，销毁时移除
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const editingChatId = ref(""); // 记录当前正在编辑的聊天 ID

const renameChat = (id: string) => {
  editingChatId.value = id; // 进入编辑模式
  nextTick(() => {
    const input = document.getElementById(
      `edit-input-${id}`
    ) as HTMLInputElement;
    if (input) {
      input.focus(); // 自动聚焦输入框
    }
  });
};

const saveChatName = (chat: { id: string; name: string }) => {
  if (!chat.name.trim()) {
    chat.name = "未命名对话"; // 防止空名
  }

  // **保存 chatList 到 localStorage**
  localStorage.setItem("chatList", JSON.stringify(chatList.value));

  editingChatId.value = ""; // 退出编辑模式
};

// 删除聊天
const deleteChat = (id: string) => {
  const index = chatList.value.findIndex((chat) => chat.id === id);
  if (index !== -1) {
    chatList.value.splice(index, 1);
    // 删除对应的聊天记录
    const storedChats = localStorage.getItem("chats");
    if (storedChats) {
      const chats = JSON.parse(storedChats);
      delete chats[id]; // 删除对应聊天记录
      localStorage.setItem("chats", JSON.stringify(chats)); // 更新 localStorage
    }
    if (chatId.value === id) {
      chatId.value = ""; // 当前聊天被删除时，清空聊天记录
      messages.value = [];
    }
  }
  activeMenuId.value = ""; // 隐藏菜单
};

const toggleHistory = () => {
  isHistoryVisible.value = !isHistoryVisible.value;
};

/** 加载所有聊天记录（包括聊天列表） */
const loadChatList = () => {
  const storedChatList = localStorage.getItem("chatList");
  if (storedChatList) {
    chatList.value = JSON.parse(storedChatList); // **直接加载存储的聊天列表**
    return;
  }

  // 如果 `chatList` 为空，就从 `chats` 里生成默认的聊天列表
  const storedChats = localStorage.getItem("chats");
  if (storedChats) {
    const chats = JSON.parse(storedChats);
    chatList.value = Object.keys(chats).map((id) => ({
      id,
      name: `对话 ${id.replace("chat-", "")}`, // 默认名称
    }));
  }
};

/** 选择一个聊天，加载它的历史记录 */
const switchChat = (id: string) => {
  chatId.value = id;
  const storedChats = localStorage.getItem("chats");
  if (storedChats) {
    const chats = JSON.parse(storedChats);
    messages.value = chats[id] || [];
  }
  scrollToBottom();
};

/** 新建聊天 */
const createNewChat = () => {
  chatId.value = `chat-${Date.now()}`; // 生成新 ID
  messages.value = []; // 清空当前聊天
  chatList.value.push({
    id: chatId.value,
    name: `对话 ${chatId.value.replace("chat-", "")}`,
  });
  saveChatsToStorage(); // 立即保存到 localStorage
};

/** 发送消息 */
const sendMessageToCoze = async (message: string) => {
  try {
    const response = await fetch("/api/coze/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, botId: BOT_ID }),
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let result = "";
    const aiMessage = { role: "ai", content: "" };

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      result += decoder.decode(value, { stream: true });
      aiMessage.content = result;
      if (
        messages.value.length &&
        messages.value[messages.value.length - 1].role === "ai"
      ) {
        messages.value[messages.value.length - 1] = aiMessage;
      } else {
        messages.value.push(aiMessage);
      }

      scrollToBottom();
    }

    saveChatsToStorage(); // 🚀 发送完毕后保存聊天记录
    return result;
  } catch (error) {
    console.error("Error calling Coze API:", error);
    return null;
  }
};

/** 发送用户输入 */
const sendQuestion = async () => {
  if (!question.value.trim()) return;

  if (!chatId.value) {
    createNewChat();
  }

  messages.value.push({ role: "user", content: question.value });
  scrollToBottom();
  loading.value = true;
  try {
    await sendMessageToCoze(question.value);
  } catch (error) {
    messages.value.push({
      role: "ai",
      content: "请求出错，请检查 API Key 或网络连接。",
    });
  }
  question.value = "";
  loading.value = false;
};

/** 监听聊天记录变化，自动存储到 localStorage */
const saveChatsToStorage = () => {
  if (!chatId.value) return; // 避免在 `chatId` 为空时存储

  const storedChats = localStorage.getItem("chats");
  let chats = storedChats ? JSON.parse(storedChats) : {};

  //只更新当前 `chatId` 的消息，不要覆盖整个 `localStorage`
  chats[chatId.value] = messages.value;

  localStorage.setItem("chats", JSON.stringify(chats));
  ///
  localStorage.setItem("chatList", JSON.stringify(chatList.value)); // 🔥 这里新增存储 `chatList`
};

watch(messages, saveChatsToStorage, { deep: true });

loadChatList(); //页面加载时，获取所有聊天
</script>

<style>
.chat-container {
  display: flex;
}

.chat-window {
  width: 100%;
  height: 690px; /* 适配输入框和 header */
  overflow-y: auto;
}

.chat-body {
  width: 800px;
  margin: 50px auto;
}

.message {
  margin-bottom: 15px;
  width: 100%; /* 确保消息宽度适应容器 */
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.ai-message {
  display: flex;
}

.bubble {
  padding: 10px 20px;
  border-radius: 20px;
  line-height: 1.5;
  color: #0d0d0d;
}
.user-message .bubble {
  background-color: #e8e8e880;
  max-width: 70%;
}

.side {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.chat-input {
  display: flex;
  background-color: white;
  position: fixed;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  width: 800px;
}

.input-area {
  resize: none;
}

.input-area >>> .el-textarea__inner {
  z-index: 2;
}

.send-button {
  background: linear-gradient(to bottom right, #338cf9, #35bbbd);
  width: 100px;
  min-width: 80px;
  height: 50px;
  z-index: 2;
}

.tips {
  position: fixed;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0 auto;
  font-size: 12px;
  color: #999;
}

/* 左侧历史记录 */
.top-navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff; /* 背景色 */
  padding: 10px;
  z-index: 1000; /* 确保在最上层 */
}

.history-toggle-btn,
.new-chat-btn {
  margin: 0 10px;
}

/* 侧边栏（默认隐藏，左侧滑入） */
.chat-sidebar {
  position: fixed;
  top: 47px; /* 确保不会遮挡顶部导航栏 */
  left: -300px; /* 初始状态在左侧隐藏 */
  width: 260px;
  height: 100vh;
  background: #f8f9fa;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease-in-out; /* 过渡动画 */
  padding: 10px;
  overflow-y: auto;
  z-index: 99; /* 确保在最上层 */
}

/* 侧边栏可见状态 */
.chat-sidebar.visible {
  left: 0; /* 展开时移动到可见位置 */
  overflow: auto;
}

/* 聊天列表样式 */
.chat-list {
  list-style: none;
  padding: 0;
}

.chat-item {
  margin-bottom: 10px;
}

.chat-btn {
  width: 80%;
}

/* 聊天项的容器 */
.chat-item-content {
  display: flex;
  align-items: center;
}

/* 鼠标悬停时增加阴影 */
.chat-item-content:hover {
  background-color: #f5f5f5; /* 可选，增加悬停时的背景变化 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}

/* 菜单按钮 */
.menu-btn {
  margin-left: 8px;
  cursor: pointer;
  font-size: larger;
}

.edit-input {
  border: 1px solid #ccc;
  padding: 5px;
  font-size: 14px;
  width: 200px;
}
</style>
