<template>
    <div class="chat-window">
        <div class="chat-header">
            chat-title
        </div>
        <div class="chat-body">
            <div v-for="(message, index) in messages" :key="index" class="message">
                <div v-if="message.role === 'ai'" class="ai-message">
                    <img src="http://imgtu.oss-cn-beijing.aliyuncs.com/jpg/2025_01_25/d3bfc5f8c01b4c8b9e5a88698c660cf6.jpg"
                        alt="AI" class="side" />
                    <div class="bubble">{{ message.content }}</div>
                </div>
                <div v-if="message.role === 'user'" class="user-message">
                    <div class="bubble">{{ message.content }}</div>
                    <img src="http://imgtu.oss-cn-beijing.aliyuncs.com/jpg/2025_01_23/0861268c084c4664bb5460326159f33f.jpg"
                        alt="User" class="side" />
                </div>
            </div>
        </div>


        <div class="chat-input">
            <el-input v-model="question" :disabled="loading" type="textarea" :autosize="{ minRows: 1, maxRows: 3 }"
                placeholder="输入你的问题..." class="input-area"></el-input>
            <el-button :loading="loading" type="primary" @click="sendQuestion" :disabled="!question.trim() || loading"
                class="send-button">
                <!-- 存在小bug,关于textarea和换行的冲突 -->
                Send
            </el-button>
        </div>
    </div>
</template>

<script lang="ts" setup name="chat">
import { ref, reactive, watch, nextTick } from 'vue'
import axios from 'axios'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api';

// 使用个人访问令牌初始化客户端
// const client = new CozeAPI({
//     token: 'your_pat_token', // 从 https://www.coze.cn/open/oauth/pats 获取你的 PAT
//     // 或者
//     // token: async () => {
//     //   // 如果令牌过期则刷新
//     //   return 'your_oauth_token';
//     // },
//     baseURL: COZE_CN_BASE_URL,
// });

// 简单对话示例
// async function quickChat() {
//     const v = await client.chat.createAndPoll({
//         bot_id: 'your_bot_id',
//         additional_messages: [{
//             role: RoleType.User,
//             content: 'Hello!',
//             content_type: 'text',
//         }],
//     });

//     if (v.chat.status === ChatStatus.COMPLETED) {
//         for (const item of v.messages) {
//             console.log('[%s]:[%s]:%s', item.role, item.type, item.content);
//         }
//         console.log('usage', v.chat.usage);
//     }
// }
const question = ref('');
const messages = ref([]);
const loading = ref(false);
const sendQuestion = async () => {
    if (!question.value.trim()) return;

    const userMessage = { role: 'user', content: question.value };
    messages.value.push(userMessage);
    console.log("send数据：", userMessage);
    loading.value = true;
    try {
        const response = await axios.get('', {
            params: { question: question.value },
        });
        console.log(response)
        if (response.data.code === 200) {
            const aiMessage = { role: 'ai', content: response.data.data };
            messages.value.push(aiMessage);
        } else {
            messages.value.push({ role: 'ai', content: 'Error: Unable to get a response.' });
        }
    } catch (error) {
        messages.value.push({ role: 'ai', content: 'Error: Network issue or server error.' });
    } finally {
        loading.value = false;
        question.value = '';
    }
};
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
    margin-top: 50px;
    width: 800px;
    margin: auto;
}

.message {
    align-items: flex-start;
    margin-bottom: 15px;
    z-index: 2
}

.user-message {
    display: flex;
    justify-content: flex-end;
    z-index: 2
}

.ai-message {
    display: flex;
    flex-direction: row;
    z-index: 2
}

.bubble {
    max-width: 70%;
    padding: 12px 15px;
    border-radius: 20px;
    line-height: 1.5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 2
}

.user-message .bubble {
    background-color: #007bff;
    color: white;
    z-index: 2
}

.ai-message .bubble {
    background-color: #e5e5ea;
    color: black;
    z-index: 2
}

.side {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin: 0 10px;
    z-index: 2
}

.chat-input {
    display: flex;
    background-color: white;
    position: fixed;
    bottom: 0;
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
</style>