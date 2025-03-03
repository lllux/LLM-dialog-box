<template>
<div class="hang" ref="chatContainer"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const BOT_ID = "7465630144141950985"
const COZE_TOKEN ="pat_DETPThWqMVhXXMhhF8SNIkrQ29gsoWQZq5djyDdjXQJeS4Wd0DMBgki3m9iJziVE"

const chatContainer = ref(null); 

const refreshToken = async () => {
  try {
    const response = await fetch('/api/refresh-token');
    const { token } = await response.json();
    return token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return '';
  }
};

const initCozeChat = () => {

  new CozeWebSDK.WebChatClient({
    config: {
      bot_id: BOT_ID,
    },
    auth: {
      type: 'token',
      token: COZE_TOKEN,
      onRefreshToken: refreshToken,
    },
    userInfo: {
      id: 'user',
    //   url: 'https://lf-coze-web-cdn.coze.cn/obj/coze-web-cn/obric/coze/favicon.1970.png',
      url:"https://res.volccdn.com/obj/volc-console-fe/vconsole-static/cloudidentity.avartar-huoshan.9f69c68a.jpg",
      nickname: 'User',
    },
    ui: {
      base: {
        icon: 'http://imgtu.oss-cn-beijing.aliyuncs.com/aitest/2025_02_28/6ccac14a440e4994bfd58439dcaba244.png',
        layout: 'layout',
        lang: 'en',
        zIndex: 9999,
      },
      chatBot: {
        title: 'Chat Bot',
        uploadable: true,
        width: '450px',
        el: chatContainer.value, 
      },
      asstBtn: {
        isNeed: true,
      },
      footer: {
        isShow: true,
        expressionText: 'Quick Reply',
      },
    },
  });
};

onMounted(() => {
    initCozeChat();
});


</script>
<style>
.hang{
    height: 90vh;
}
</style>
