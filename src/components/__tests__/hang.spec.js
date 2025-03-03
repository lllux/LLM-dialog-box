import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Hang from '../hang.vue'
import flushPromises from 'flush-promises'

// 模拟全局 CozeWebSDK
global.CozeWebSDK = {
  WebChatClient: vi.fn()
}

// 模拟 fetch API
global.fetch = vi.fn()

describe('Hang.vue', () => {
  let wrapper
  const mockWebChatClient = vi.fn()

  beforeEach(async () => {
    // 重置所有模拟
    vi.clearAllMocks()
    
    // 初始化模拟 SDK
    global.CozeWebSDK.WebChatClient = mockWebChatClient
    global.CozeWebSDK.WebChatClient.mockImplementation(() => ({
      // 可以添加需要的方法模拟
    }))

    // 挂载组件
    wrapper = mount(Hang, {
      attachTo: document.body
    })

    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // 基础功能测试
  describe('基础功能', () => {
    it('应正确挂载组件', () => {
      expect(wrapper.find('.hang').exists()).toBe(true)
    })

    it('应在 mounted 时调用初始化方法', () => {
      expect(mockWebChatClient).toHaveBeenCalled()
    })
  })

  // SDK 初始化测试
  describe('SDK 初始化', () => {
    it('应使用正确的配置参数初始化 SDK', () => {
      const expectedConfig = {
        config: {
          bot_id: "7465630144141950985"
        },
        auth: {
          type: 'token',
          token: "pat_DETPThWqMVhXXMhhF8SNIkrQ29gsoWQZq5djyDdjXQJeS4Wd0DMBgki3m9iJziVE",
          onRefreshToken: expect.any(Function)
        },
        userInfo: {
          id: 'user',
          url: expect.stringContaining('volc-console-fe'),
          nickname: 'User'
        },
        ui: {
          base: {
            icon: expect.stringContaining('.png'),
            layout: 'layout',
            lang: 'en',
            zIndex: 9999
          },
          chatBot: {
            title: 'Chat Bot',
            uploadable: true,
            width: '450px',
            el: wrapper.vm.$refs.chatContainer
          },
          asstBtn: {
            isNeed: true
          },
          footer: {
            isShow: true,
            expressionText: 'Quick Reply'
          }
        }
      }

      expect(mockWebChatClient).toHaveBeenCalledWith(expectedConfig)
    })

  })

  // Token 刷新测试
  describe('Token 刷新功能', () => {
    it('应成功刷新 token', async () => {
      const mockToken = 'new_token_123'
      fetch.mockResolvedValue({
        json: () => ({ token: mockToken })
      })

      const token = await wrapper.vm.refreshToken()
      expect(fetch).toHaveBeenCalledWith('/api/refresh-token')
      expect(token).toBe(mockToken)
    })

    it('应处理 token 刷新失败', async () => {
      console.error = vi.fn()
      fetch.mockRejectedValue(new Error('Network error'))

      const token = await wrapper.vm.refreshToken()
      expect(console.error).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error))
      expect(token).toBe('')
    })
    it('应处理多次 token 刷新请求', async () => {
        const mockToken1 = 'token_1'
        const mockToken2 = 'token_2'
        
        fetch
          .mockResolvedValueOnce({ json: () => ({ token: mockToken1 }) })
          .mockResolvedValueOnce({ json: () => ({ token: mockToken2 }) })
      
        const token1 = await wrapper.vm.refreshToken()
        const token2 = await wrapper.vm.refreshToken()
        
        expect(token1).toBe(mockToken1)
        expect(token2).toBe(mockToken2)
      })
      
  })

  // DOM 元素测试
  describe('DOM 元素验证', () => {

    it('应将聊天容器传递给 SDK', () => {
      const sdkCall = mockWebChatClient.mock.calls[0][0]
      expect(sdkCall.ui.chatBot.el).toBeInstanceOf(HTMLElement)
      expect(sdkCall.ui.chatBot.el).toBe(wrapper.vm.$refs.chatContainer)
    })
  })
})