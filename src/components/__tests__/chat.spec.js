import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatComponent from './ChatComponent.vue'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

// 模拟 WebSocket
class WebSocketMock {
  constructor(url) {
    this.url = url
    this.onopen = vi.fn()
    this.onmessage = vi.fn()
    this.onclose = vi.fn()
    this.onerror = vi.fn()
    this.send = vi.fn()
  }
}

global.WebSocket = WebSocketMock

describe('ChatComponent', () => {
  let wrapper
  const mockAxios = new MockAdapter(axios)
  
  const mockHistory = [
    {
      sid: '1',
      title: 'Vue问题',
      messages: JSON.stringify([{ role: 'user', content: 'test' }]),
      updatedAt: new Date()
    }
  ]

  beforeEach(async () => {
    // 模拟 API 请求
    mockAxios.onGet('/lakeSword/dialog/user').reply(200, {
      data: mockHistory
    })
    
    mockAxios.onPut('/lakeSword/dialog/title').reply(200)
    mockAxios.onDelete('/lakeSword/dialog').reply(200)

    wrapper = mount(ChatComponent, {
      global: {
        mocks: {
          $emit: vi.fn()
        }
      }
    })

    await wrapper.vm.fetchChatHistory()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    mockAxios.reset()
  })

  // 基础渲染测试
  describe('Initial Render', () => {
    it('应正确渲染初始状态', () => {
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.prompt').text()).toContain('有什么可以帮忙的？')
    })
  })

  // 侧边栏功能
  describe('Sidebar', () => {
    it('应切换侧边栏显示状态', async () => {
      const initialState = wrapper.vm.showSidebar
      await wrapper.find('.icon-a-icon1beifen').trigger('click')
      expect(wrapper.vm.showSidebar).toBe(!initialState)
    })
  })

  // 历史记录操作
  describe('History Operations', () => {
    it('应加载历史记录', () => {
      expect(wrapper.vm.chatHistoryList).toHaveLength(5)
      expect(wrapper.findAll('.history-item')).toHaveLength(1)
    })

    it('应过滤历史记录', async () => {
      await wrapper.find('input[type="text"]').setValue('vue')
      expect(wrapper.vm.filteredHistoryList[0].item).toHaveLength(1)
      expect(wrapper.vm.filteredHistoryList[0].item[0].title).toBe('Vue问题')
    })

    it('应开启重命名模式', async () => {
      await wrapper.find('.icon-dian').trigger('click')
      await wrapper.find('.newname').trigger('click')
      expect(wrapper.vm.editingId).toBe('1')
      expect(wrapper.find('input.title-input').exists()).toBe(true)
    })

    it('应删除对话', async () => {
      await wrapper.find('.icon-dian').trigger('click')
      await wrapper.find('.delete').trigger('click')
      expect(wrapper.vm.showDelete).toBe(true)
      
      await wrapper.find('button:first-child').trigger('click')
      expect(mockAxios.history.delete.length).toBe(1)
    })
  })

  // 聊天功能
  describe('Chat Features', () => {
    it('应发送消息', async () => {
      await wrapper.find('textarea').setValue('你好')
      await wrapper.find('.icon-send').trigger('click')
      
      expect(wrapper.vm.messages).toHaveLength(1)
      expect(wrapper.vm.messages[0].content).toBe('你好')
    })

    it('应停止生成', async () => {
      await wrapper.find('textarea').setValue('test')
      await wrapper.find('.icon-send').trigger('click')
      await wrapper.find('.icon-status-stop').trigger('click')
      
      expect(mockAxios.history.get.length).toBe(1)
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  // 工具方法
  describe('Utility Methods', () => {
    it('应正确分类时间', () => {
      const today = new Date()
      expect(wrapper.vm.categorizeMessage(today)).toBe('今天')
      
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      expect(wrapper.vm.categorizeMessage(yesterday)).toBe('昨天')
    })

    it('应渲染Markdown内容', () => {
      const result = wrapper.vm.renderMarkdown('**test**')
      expect(result).toContain('<strong>test</strong>')
    })
  })

  // 边界情况
  describe('Edge Cases', () => {
    it('应处理空标题', async () => {
      const item = wrapper.findAll('.history-item')[0]
      expect(item.find('.history-title').text()).toContain('Vue问题')
    })

    it('应处理WebSocket错误', async () => {
      const errorSpy = vi.spyOn(console, 'error')
      await wrapper.vm.sendMessageToAi('test')
      wrapper.vm.socket.onerror(new Error('test error'))
      expect(errorSpy).toHaveBeenCalled()
    })
  })
})