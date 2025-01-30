<template>
    <div class="chat-window">
        <div class="chat-header">
            chat-title
        </div>
        <div class="chat-body">
            <div v-for="(message, index) in messages" :key="index" class="message">
                <div v-if="message.role === 'ai'" class="ai-message">
                    <img src="../assets/images/coze.png"
                        alt="AI" class="side" />
                    <div class="bubble">{{ message.content }}</div>
                </div>
                <div v-if="message.role === 'user'" class="user-message">
                    <div class="bubble">{{ message.content }}</div>
                </div>
            </div>
        </div>


        <div class="chat-input">
            <el-input v-model="question" :disabled="loading" type="textarea" :autosize="{ minRows: 1, maxRows: 3 }"
                placeholder="输入你的问题..." class="input-area"></el-input>
            <el-button :loading="loading" type="primary" @click="sendQuestion" :disabled="!question.trim() || loading"
                class="send-button">
                Send
            </el-button>
        </div>
        <div class="tips">内容由 AI 生成，请仔细甄别</div>
    </div>
</template>

<script lang="ts" setup name="chat">
import { ref, reactive, watch, nextTick } from 'vue'
import axios from 'axios'

const BOT_ID = "7465630144141950985";

const sendMessageToCoze = async (message:string) => {
    try {
        const response = await axios.post("/api/coze/chat", {
            message,
            botId: "7465630144141950985"
        });
        console.log("AI返回:", response.data); 
        return response.data;
    } catch (error) {
        console.error("Error calling Coze API:", error);
        return null;
    }
};

const question = ref('');
const messages = ref<{ role: string; content: string }[]>([]);
const loading = ref(false);
const sendQuestion = async () => {
    if (!question.value.trim()) return;

    messages.value.push({ role: "user", content: question.value });

    loading.value = true;

    try {
        const response = await sendMessageToCoze(question.value);
        if (response) {
            messages.value.push({ role: "ai", content: response.messages[0].content });
        } else {
            messages.value.push({ role: "ai", content: "AI 没有返回结果，请稍后再试。" });
        }
    } catch (error) {
        messages.value.push({ role: "ai", content: "请求出错，请检查 API Key 或网络连接。" });
    } finally {
        loading.value = false;
        question.value = "";
    }
}
</script>

<style>
.chat-window {
    border-radius: 8px;
    width: 100%;
    height: 100%;
}

.chat-header{
    width: 100%;
    height: 50px;
    line-height: 50px;
    text-align: center;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 5;
    background-color: #fff;
}
.chat-body {
    width: 800px;
    margin: 50px auto;
}

.message {
    margin-bottom: 15px;
}

.user-message {
    display: flex;
    justify-content: flex-end;
}

.ai-message {
    display: flex;
}

.bubble{
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

.input-area>>>.el-textarea__inner {
    resize: none;
    z-index: 2
}

.send-button {
    background: linear-gradient(to bottom right, #338cf9, #35bbbd);
    width: 100px;
    min-width: 80px;
    z-index: 2
}

.tips{
    position: fixed;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    margin: 0 auto;
    font-size: 12px;
    color: #999;
}
</style>