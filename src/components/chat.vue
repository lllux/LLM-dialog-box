<template>
    <div class="chat-container">

        <div class="iconbg iconside">
            <i class="iconfont icon-a-icon1beifen" @click="toggleSidebar"></i>
        </div>


        <transition name="slide">
            <div v-if="showSidebar" class="sidebar">
                <div class="history-header">
                    <div class="iconbg">
                        <i class="iconfont icon-a-icon1beifen" @click="toggleSidebar"></i>
                    </div>
                    <div class="iconbg">
                        <i class="iconfont icon-xinliaotian2" @click="newchat"></i>
                    </div>
                </div>
                <div class="history-list">
                    <div v-for=" history in filteredHistoryList">
                        <div class="timetitle" v-if="history.item != ''">{{ history.title }}</div>
                        <ul style="list-style: none;" class="timeblock">
                            <li class="history-item" v-for="item in history.item" @mouseenter="hoverItem = item.sid"
                                @mouseleave="hoverItem = null" @click="loadHistory(item)"
                                :class="{ 'active': currentSid === item.sid }" :data-sid="item.sid"
                                data-testid="history-item">
                                <div class="title-container">
                                    <input v-if="editingId === item.sid" v-model="editTitle" ref="titleInput"
                                        @keyup.enter="saveRename(item)" @blur="saveRename(item)" @keyup.esc="cancelRename"
                                        class="title-input" />
                                    <div v-else class="history-title">
                                        <div class="hazy"></div>
                                        {{ item.title || '未命名对话' }}
                                    </div>
                                </div>
                                <div class="item-actions">
                                    <i class="iconfont icon-dian" data-testid="menu-button"
                                        :class="{ 'show1': hoverItem === item.sid, 'show2': currentSid === item.sid }"
                                        @click.stop="toggleMenu(item.sid)"></i>
                                </div>
                                <teleport to="body">
                                    <div v-if="activeMenuId === item.sid" class="action-menu" v-on-click-outside="closeMenu"
                                        :style="getMenuPosition(item.sid)" data-testid="action-menu">
                                        <div @click.stop="startRename(item)" class="newname" data-testid="rename-button">
                                            <i class="iconfont icon-zhongmingming"></i>重命名
                                        </div>
                                        <div @click.stop="showDeleteModal(item.sid)" class="delete"
                                            data-testid="delete-button">
                                            <i class="iconfont icon-shanchu"></i>删除
                                        </div>
                                    </div>
                                </teleport>
                            </li>

                            <div v-if="showDelete" class="modal-mask">
                                <div class="modal-container">
                                    <div class="modal-header">
                                        <h3>删除确认</h3>
                                    </div>
                                    <div class="modal-content">
                                        <p>确定要删除此对话记录吗？</p>
                                    </div>
                                    <div class="modal-actions">
                                        <button @click="confirmDelete" data-testid="confirm-delete">确认删除</button>
                                        <button @click="showDelete = false">取消</button>
                                    </div>
                                </div>
                            </div>
                        </ul>
                    </div>
                </div>
                <div class="history-search">
                    <input type="text" v-model="searchKeyword" placeholder="搜索历史记录">
                    <div class="iconfont icon-Magnifier"></div>
                </div>

            </div>
        </transition>



        <div class="chat-window" :class="{ 'shifted': showSidebar }">

            <div v-if="messages.length === 0" class="empty">
                <div class="prompt">有什么可以帮忙的？</div>
                <div class="chat-input">
                    <textarea placeholder="给Heng发送消息" v-model="question" @keyup.enter="sendQuestion" class="input-area"
                        @input="autoResize"></textarea>

                    <div class="bottom">
                        <i class="iconfont icon-lianjie"></i>
                        <i class="iconfont icon-ds-iconf-pload-status icon-send" @click="sendQuestion"></i>
                    </div>
                </div>
                <div class="tips">内容由 AI 生成，请仔细甄别</div>
            </div>



            <div v-else class="noempty">
                <div class="header">
                    <div class="chat-header">
                        {{ currentTitle }}
                    </div>
                    <div class="hazy"></div>
                </div>


                <div class="chat-body">
                    <div v-for="(message, index) in messages" :key="index" class="message">
                        <div v-if="message.role === 'assistant'" class="ai-message">
                            <i class="iconfont icon-airec side"></i>
                            <div class="bubble markdown-body">
                                <div v-html="renderMarkdown(message.content)"></div>
                                <div v-if="message.complete === false" class="typing-indicator">
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                </div>
                            </div>
                        </div>
                        <div v-if="message.role === 'user'" class="user-message">
                            <div class="bubble">{{ message.content }}</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="chat-input">
                        <textarea placeholder="给Heng发送消息" v-model="question" @keyup.enter="sendQuestion" class="input-area"
                            @input="autoResize"></textarea>

                        <div class="bottom">
                            <i class="iconfont icon-lianjie"></i>
                            <i class="iconfont icon-status-stop icon-send" @click="stopQuestion"
                                v-if="messages.length > 0 && messages[messages.length - 1].complete === false"></i>
                            <i class="iconfont icon-ds-iconf-pload-status icon-send" @click="sendQuestion" v-else></i>
                        </div>
                    </div>
                    <div class="tips">内容由 AI 生成，请仔细甄别</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup name="chat">
import { ref, reactive, watch, nextTick, onMounted, computed } from 'vue'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { v4 as uuidv4 } from 'uuid';
import MarkdownIt from 'markdown-it';
// import { onClickOutside } from '@vueuse/core'
import { vOnClickOutside } from '@vueuse/components'


onMounted(() => {
    fetchChatHistory()

    document.body.addEventListener('click', async (e) => {
        const copyBtn = e.target.closest('.copy-btn')
        if (copyBtn) {
            const pre = e.target.closest('pre[data-code]')
            const code = decodeURIComponent(pre.dataset.code)
            const originalText = copyBtn.innerText
            try {
                copyBtn.disabled = true
                await navigator.clipboard.writeText(code)
                console.log("已复制test")
                copyBtn.innerText = '√ 已复制'

                setTimeout(() => {
                    copyBtn.innerText = originalText
                    copyBtn.disabled = false
                }, 3000)

            } catch (err) {
                console.error('复制失败:', err)
                copyBtn.disabled = true
                const textarea = document.createElement('textarea')
                textarea.value = code
                document.body.appendChild(textarea)
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
                copyBtn.innerText = '√ 已复制'

                setTimeout(() => {
                    copyBtn.innerText = originalText
                    copyBtn.disabled = false
                }, 3000)
            }
        }
    })
});
const md = new MarkdownIt({
    html: true,
    breaks: true,
    highlight: (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(code, { language }).value;
        return `<pre data-testid="code-block" data-language="${language}" data-code="${encodeURIComponent(code)}"><code class="${"language-" + language}">${highlighted}</code></pre>`;
    }
});

const renderMarkdown = (content) => {
    const cleaned = content
        // 1. 移除未闭合的代码块开始标记
        .replace(/(^|\n)```\s*$/g, '$1')
        // 2. 删除空代码块
        .replace(/```\s*?```/gs, '')
        // 3. 处理结尾孤立的`
        .replace(/`+$/, '');

    // 渲染并二次过滤
    let html = md.render(cleaned)
        .replace(/<pre><code><\/code><\/pre>/g, '');

    // 复制功能
    const container = document.createElement('div');
    container.innerHTML = html;

    container.querySelectorAll('pre[data-language]').forEach(pre => {
        const language = pre.dataset.language;
        const rawCode = decodeURIComponent(pre.dataset.code);

        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';

        const langSpan = document.createElement('span');
        langSpan.className = 'language-tag';
        langSpan.textContent = language;

        const copyBtn = document.createElement('a');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '复制';
        copyBtn.setAttribute("testid", "copy-button")

        toolbar.appendChild(langSpan);
        toolbar.appendChild(copyBtn);
        pre.insertBefore(toolbar, pre.firstChild);
    });

    html = container.innerHTML;

    const separator = '以上为思考过程';
    const separatorIndex = html.indexOf(separator);

    if (separatorIndex !== -1) {
        const thinkingHtml = html.substring(0, separatorIndex);
        const answerHtml = html.substring(separatorIndex + separator.length);
        return `
            <div class="thinking-process">${thinkingHtml}</div>
            <div class="answer-content">${answerHtml}</div>
        `;
    }
    return `<div class="thinking-process">${html}</div>`;
    // return DOMPurify.sanitize(html);

};

const showSidebar = ref(true)
const chatHistory = ref([])
const chatHistoryList = ref([])
const loadingHistory = ref(false)
const searchKeyword = ref('')

const todayHistory = ref([]),
    yesterdayHistory = ref([]),
    last7DaysHistory = ref([]),
    last30DaysHistory = ref([]),
    olderHistory = ref([]);

const question = ref('');
const messages = ref([]);
const loading = ref(false);

let currentTitle = ref('')
let socket = null;
let userId = 443;
let currentSid = ref('');

const sendMessageToAi = (message) => {
    return new Promise((resolve, reject) => {
        const sid = currentSid.value ? currentSid.value : uuidv4()
        currentSid.value = sid
        console.log(sid)

        const aiMessage = { role: 'assistant', content: '', complete: false };
        messages.value.push(aiMessage);

        socket = new WebSocket('ws://117.72.11.152:8080/lakeSword/ai/chat');
        socket.onopen = () => {
            const messageData = {
                "userId": userId,
                "sid": sid,
                "content": message
            };
            socket.send(JSON.stringify(messageData));
            console.log("Message sent:", messageData);
        };

        socket.onmessage = (event) => {
            aiMessage.content += event.data;
            messages.value = [...messages.value.slice(0, -1), aiMessage]
            console.log(111)

            scrollToBottom()
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            aiMessage.content += '\n\n**对话异常中断，请重试**';
            aiMessage.complete = true;
            reject(error);
        };

        socket.onclose = () => {
            if (!aiMessage.complete) {
                // aiMessage.content += '\n\n**连接已关闭**';
                // aiMessage.complete = true;
                // messages.value = [...messages.value.slice(0, -1), aiMessage]
                messages.value[messages.value.length - 1].complete = true
            }
            resolve();
        };
    });
};


const sendQuestion = async () => {
    if (!question.value.trim() || loading.value) return;

    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.complete === false) {
        alert('请等待当前回复完成');
        return;
    }

    messages.value.push({ role: "user", content: question.value });

    scrollToBottom()

    if (currentSid.value === "") {
        currentTitle.value = question.value
    }
    const currentQuestion = question.value;
    question.value = '';
    loading.value = true;

    try {
        await sendMessageToAi(currentQuestion);
        // messages.value[messages.value.length - 1].complete = true;
        console.log("最终:" + messages.value[messages.value.length - 1].complete)
        if (messages.value.length === 2) fetchChatHistory()
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false;
        socket = null;
    }
}
// const BOT_ID = "7465630144141950985";

const stopQuestion = async () => {
    const lastMessage = messages.value[messages.value.length - 1]
    lastMessage.complete = true
    loading.value = false
    const response = await axios.get("http://117.72.11.152:8080/lakeSword/ai/chat/stop", {
        params: { sid: currentSid.value }
    })
    console.log(response.data)
}
const scrollToBottom = () => {
    const container = document.querySelector('.chat-body')
    if (container) {
        nextTick(() => {
            container.scrollTop = container.scrollHeight
        })
    }
}
const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
    if (showSidebar.value) {
        fetchChatHistory()
    }
}
const fetchChatHistory = async () => {
    try {
        loadingHistory.value = true
        const response = await axios.get('http://117.72.11.152:8080/lakeSword/dialog/user', {
            params: { userId }
        })
        chatHistory.value = response.data.data
        chatHistory.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        todayHistory.value = []
        yesterdayHistory.value = []
        last7DaysHistory.value = []
        last30DaysHistory.value = []
        olderHistory.value = []

        chatHistory.value.forEach(message => {
            if (categorizeMessage(message.updatedAt) === "今天") {
                todayHistory.value.push(message);
            } else if (categorizeMessage(message.updatedAt) === "昨天") {
                yesterdayHistory.value.push(message);
            } else if (categorizeMessage(message.updatedAt) === "前7天") {
                last7DaysHistory.value.push(message);
            } else if (categorizeMessage(message.updatedAt) === "前30天") {
                last30DaysHistory.value.push(message);
            } else {
                olderHistory.value.push(message);
            }
        });
        chatHistoryList.value = []
        chatHistoryList.value.push(
            { title: "今天", item: todayHistory.value },
            { title: "昨天", item: yesterdayHistory.value },
            { title: "前7天", item: last7DaysHistory.value },
            { title: "前30天", item: last30DaysHistory.value },
            { title: "更早", item: olderHistory.value }
        )
        console.log(chatHistoryList.value)
    } catch (error) {
        console.error('获取历史记录失败' + error)
    } finally {
        loadingHistory.value = false
    }
}

const loadHistory = (history) => {
    if (history.sid != currentSid.value) question.value = ''
    messages.value = JSON.parse(history.messages)
    currentSid.value = history.sid
    currentTitle.value = history.title
    scrollToBottom()
}
const filteredHistoryList = computed(() => {
    if (!searchKeyword.value) return chatHistoryList.value

    const keyword = searchKeyword.value.toLowerCase()
    return chatHistoryList.value.map(group => ({
        ...group,
        item: group.item.filter(item => {
            const title = item.title?.toLowerCase() || '未命名对话'
            return title.includes(keyword)
        })
    })).filter(group => group.item.length > 0)
})
const newchat = () => {
    messages.value = []
    currentTitle.value = ""
    currentSid.value = ""
    console.log("newchat")
}


//关于时间
const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
};
const categorizeMessage = (date) => {
    const messageDate = new Date(date)
    const now = new Date();
    const diffDays = (now - messageDate) / (1000 * 3600 * 24);
    if (isToday(messageDate)) return '今天';
    if (isYesterday(messageDate)) return '昨天';
    if (diffDays <= 7) return '前7天';
    if (diffDays <= 30) return '前30天';
    return '更早';
}

const hoverItem = ref(null)
const activeMenuId = ref(null)
const editingId = ref(null)
const editTitle = ref('')
const showDelete = ref(false)
const deletingId = ref(null)
const titleInput = ref(null)

const toggleMenu = (id) => {
    activeMenuId.value = activeMenuId.value === id ? null : id
    console.log(activeMenuId.value)
}
const closeMenu = (e) => {
    if (e.target.classList.contains('icon-dian')) return
    activeMenuId.value = null
}
const getMenuPosition = (sid) => {
    const trigger = document.querySelector(`[data-sid="${sid}"] .icon-dian`)
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    console.log(rect.top, rect.left)
    console.log(window.scrollX, window.scrollY)
    return {
        top: `${rect.top + 40}px`,
        left: `${rect.left}px`
    }
}
const startRename = (history) => {
    editingId.value = history.sid
    editTitle.value = history.title
    activeMenuId.value = null
    nextTick(() => {
        titleInput.value[0].focus()
    })
}

const saveRename = async (history) => {
    const newname = {
        sid: history.sid,
        title: editTitle.value
    }
    try {
        await axios.put('http://117.72.11.152:8080/lakeSword/dialog/title', newname)
        history.title = editTitle.value
        editingId.value = null
    } catch (error) {
        alert('重命名失败')
    }
}

const cancelRename = () => {
    editingId.value = null
}

const showDeleteModal = (id) => {
    deletingId.value = id
    showDelete.value = true
    activeMenuId.value = null
}

const confirmDelete = async () => {
    if (deletingId.value) {
        try {
            const response = await axios.delete('http://117.72.11.152:8080/lakeSword/dialog', {
                params: { sid: deletingId.value }
            })
            console.log(deletingId.value, response.data)
            await fetchChatHistory()
            if (currentSid === deletingId.value) {
                newchat()
            }
        } catch (error) {
            alert('删除失败')
        }
    }
    showDelete.value = false
    deletingId.value = null
}

const autoResize = (e) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 170)
    textarea.style.height = `${newHeight}px`
}
</script>

<style scoped>
@import './icons/iconfont.css';

.chat-container {
    position: relative;
    overflow-y: auto;
    height: 100vh;
    background-color: #fff;
}

.iconbg {
    cursor: pointer;
    text-align: center;
    line-height: 40px;
    width: 45px;
    height: 45px;
    border-radius: 5px;
}

.iconbg:hover {
    background-color: #eee;
}

/* .iconreturn {
    position: fixed;
    top: 20px;
    right: 20px;
  }
  
  .icon-fanhui {
    font-size: 30px;
  } */

.iconside {
    position: absolute;
    top: 10px;
    left: 20px;
}

.icon-a-icon1beifen {
    font-size: 30px;
}

.icon-xinliaotian2 {
    font-size: 25px;
}

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-100%);
}

.sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 260px;
    background: #F9F9F9;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    overflow-x: visible;
    padding: 0 10px;
}

.history-header {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.history-list {
    width: 250px;
    height: 83vh;
    padding-right: 10px;
    overflow-y: auto;
    overflow-x: visible;
}

.timetitle {
    position: sticky;
    top: 0;
    width: 100%;
    background-color: #F9F9F9;
    padding: 12px 8px 8px;
    font-size: 12px;
    font-weight: 700;
    z-index: 10;
}

.timeblock {
    margin-bottom: 10px;
}

.history-item {
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
}

.history-item.active {
    background: #E3E3E3;
}

.history-item.active:hover {
    background: #ECECEC;
}

.history-item:hover {
    background: #ECECEC;
}

.title-container {
    width: 100%;
    /* padding: 0 10px; */
    position: relative;
    overflow: hidden;
}


.history-title {
    font-size: 14px;
    color: #333;
    line-height: 25px;
    white-space: nowrap;
}

.history-title .hazy {
    background: linear-gradient(90deg, rgba(249, 251, 255, 0) 0%, #F9F9F9 50%, #F9F9F9 100%);
    width: 25px;
    position: absolute;
    top: 0;
    left: auto;
    right: 0;
}

.icon-dian {
    position: relative;
    opacity: 0;
    cursor: pointer;
    width: 25px;
    height: 25px;
    z-index: 20;
    text-align: end;
    /* background-color: #ECECEC; */
}

.icon-dian.show1,
.icon-dian.show2 {
    opacity: 1;
}

.icon-dian::before {
    position: absolute;
    top: -2px;
    right: 0;
    width: 70px;
    height: 100%;
    z-index: 15;
}

.icon-dian.show2::before {
    background-image: linear-gradient(to right, rgba(249, 251, 255, 0) 0%, #E3E3E3 100%);
}

.icon-dian.show1::before {
    background-image: linear-gradient(to right, rgba(249, 251, 255, 0) 0%, #ECECEC 100%);
}

.item-actions {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 10px;
    width: 25px;
    height: 25px;
    line-height: 25px;
    text-align: center;
    z-index: 20;
}

.action-menu {
    position: absolute;
    /* transform: translateX(-50%); */
    left: auto;
    top: auto;
    width: 120px;
    height: 100px;
    padding: 0 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: start;
    background: white;
    border: 1px solid #eee;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
}

.action-menu div {
    border-radius: 10px;
    padding: 6px 16px;
    cursor: pointer;
}

.newname:hover {
    background: #F5F5F5;
}

.delete {
    color: #EF4444;
}

.delete:hover {
    background-color: #FEF4F4;
}

.icon-zhongmingming,
.icon-shanchu {
    font-size: 20px;
    margin-right: 5px;
}


.modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    min-width: 300px;
}

.modal-header {
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;
}

.modal-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.modal-actions button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.modal-actions button:first-child {
    background-color: #ff4d4f;
    color: white;
}

.modal-actions button:last-child {
    background-color: #f0f0f0;
}

.history-search {
    position: relative;
    height: 30px;
    width: 220px;
    background-color: #fff;
    border-radius: 15px;
    margin: 15px 10px;
    padding: 0 10px;
    border: 1px solid #e3e3e3;
}

.history-search input {
    line-height: 28px;
    width: 90%;
    border: none;
    outline: none;
    color: #333;
}

.icon-Magnifier {
    position: absolute;
    top: 0;
    right: 10px;
    line-height: 28px;
    z-index: 1;
}



.chat-window {
    position: relative;
    width: 800px;
    height: 100vh;
    margin: 0 auto;
    transition: transform 0.3s ease;
}

.chat-window.shifted {
    transform: translateX(140px);
}

.empty {
    height: 100vh;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.prompt {
    font-size: 30px;
    font-weight: 700;
    margin: 0 auto;
    /* color: #0d0d0d; */
    background-image: linear-gradient(90deg, #044bb5, #1ec191);
    -webkit-background-clip: text;
    color: transparent;
    margin-bottom: 20px;
}

.empty .tips {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.recommendations {
    /* padding: 20px; */
    max-width: 400px;
    /* margin: 0 auto; */
    /* text-align: center; */
}

.topic {
    padding: 12px 20px;
    margin: 10px;
    background: #f0f4ff;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.topic:hover {
    background: #2db1ba;
    color: white;
    transform: translateY(-2px);
}

.header {
    position: sticky;
    top: 0;
    z-index: 5;
}

.noempty {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.chat-header {
    width: 800px;
    height: 50px;
    display: flex;
    flex-direction: column;
    justify-content: end;
    text-align: center;
    background-color: #fff;
    font-weight: 700;
    padding-bottom: 5px;
}

.hazy {
    z-index: 10;
    pointer-events: none;
    background: linear-gradient(rgba(255, 255, 255, .8) 0%, rgba(255, 255, 255, 0) 100%);
    width: 100%;
    height: 32px;
    position: absolute;
    top: 100%;
    left: 1px;
}

.chat-body {
    flex: 1 1 auto;
    padding: 20px 0;
    overflow-y: auto;

    scroll-behavior: smooth;
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

.bubble {
    padding: 10px 20px;
    border-radius: 20px;
    line-height: 1.5;
    color: #0d0d0d;
}

.ai-message .bubble {
    max-width: calc(100% - 32px);
}

.user-message .bubble {
    background-color: #e8e8e880;
    max-width: 70%;
}

.icon-airec {
    width: 32px;
    height: 32px;
    font-size: 32px;
    color: #2db1ba;
}

.footer {
    position: sticky;
    bottom: 0;
    z-index: 100;
    margin-top: auto;
    display: flex;
    flex-direction: column;
    background-color: #fff;
}

.chat-input {
    background: #eee;
    padding: 10px 15px;
    box-shadow: 0 0 3px 1px rgba(122, 147, 177, 0.1);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.input-area {
    background-color: #eee;
    resize: none;
    border: none;
    outline: none;
    width: 100%;
    height: auto;
    overflow-y: scroll;
    font: 16px/1.5 Microsoft Yahei,
        Hiragino Sans GB, Heiti SC, WenQuanYi Micro Hei, sans-serif;
    color: #404040;

}

.icon-lianjie {
    font-size: 24px;
}

.icon-send {
    font-size: 30px;
    height: 30px;
    line-height: 30px;
    color: #2db1ba;
    cursor: pointer;
    margin-left: 10px;
}

.icon-send:hover {
    color: #35bbbd;
}

.tips {
    margin: 5px auto;
    font-size: 12px;
    color: #999;
    z-index: 5;
}



/* 渲染AI生成内容的样式 */
.markdown-body :deep(.thinking-process) {
    font-size: 14px;
    border-left: 2px solid #e5e5e5;
    padding-left: 13px;
    margin: 0 0 10px 0;
    color: #8e8e8e;
    font-style: italic;
}

.markdown-body {
    font-size: 16px;
    line-height: 1.5;
}

.markdown-body :deep(.code-toolbar) {
    display: flex;
    justify-content: space-between;
    font: 12px/1.5 ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
    color: #5d5d5d;
    color: #5d5d5d;
    margin-bottom: 16px;

}

.markdown-body :deep(.copy-btn) {
    cursor: pointer;
    font: 12px/1.5 ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
    color: #5d5d5d;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
    margin: 0.67em 0;
    font-weight: 700;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
    padding-left: 26px;
}

.markdown-body :deep(p) {
    word-break: break-all;
}

.markdown-body :deep(code) {
    font: 14px/1.5 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    background-color: #ECECEC;
    padding: 0.2em 0.4em;
    border-radius: 6px;
}

.markdown-body :deep(pre) {
    /* background-color: #f6f8fa; */
    border: .5px solid rgba(0, 0, 0, .15);
    background-color: #F9F9F9;
    margin: 10px 0;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    word-break: break-all;
}

.markdown-body :deep(pre code) {
    background-color: transparent;
}

.markdown-body :deep(blockquote) {
    border-left: 4px solid #dfe2e5;
    color: #6a737d;
    padding: 0 1em;
    margin: 0;
}

.typing-indicator {
    display: flex;
    padding: 8px 0;
}

.dot {
    width: 6px;
    height: 6px;
    margin: 0 3px;
    background-color: #999;
    border-radius: 50%;
    animation: typing 1.4s infinite;
}

@keyframes typing {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-4px);
    }
}

.dot:nth-child(2) {
    animation-delay: 0.2s;
}

.dot:nth-child(3) {
    animation-delay: 0.4s;
}</style>