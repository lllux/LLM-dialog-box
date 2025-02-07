import express from 'express';
import axios from 'axios';
import { CozeAPI, COZE_CN_BASE_URL, ChatEventType,ChatStatus, RoleType } from '@coze/api';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

 //const API_KEY = "pat_k0vWWCKQTgIANYGL7JKWjsdgeKt6ocOsJjcie7d8LF7jb0oeOt0eIi42npaKepcE";
 //const COZE_API_URL = "https://api.coze.cn/v3/chat";

const cozeClient = new CozeAPI({
  token: "pat_kStXyB189qqhDKxfD89fxIA0SFJzqoUQ8C2m55WzCGsna1NiUJc7YO8zPRvw308R",
  // 默认基于 "https://api.coze.cn"
  // 如果需要，在此指定 allowPersonalAccessTokenInBrowser、baseURL 等
  baseURL: COZE_CN_BASE_URL,
});

app.post('/api/coze/chat', async (req, res) => {
  const { message, botId } = req.body;
  try {
    const stream = await cozeClient.chat.stream({
      bot_id: botId,
      additional_messages: [
        {
          role: 'user',
          content: message,
          content_type: 'text',
        },
      ],
    });

    let fullResponse = '';

    for await (const part of stream) {
      if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
        const content = part.data.content;
        console.log('[Bot]:', content);  

        fullResponse += content;
        res.write(content);  
      }
    }
    res.end();  

    console.log('Complete response:', fullResponse);

     //if (result.chat.status === ChatStatus.COMPLETED) {
     //     for (const item of result.messages) {
     //         console.log('[%s]:[%s]:%s', item.role, item.type, item.content);
     //     }
     //}
     //console.log('usage', result.chat.usage);
     //res.json(result);
  } catch (error) {
    console.error("server.js:Error calling Coze API:", error);  
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
