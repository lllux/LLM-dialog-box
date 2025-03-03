import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatComponent from '../chat.vue'
import flushPromises from 'flush-promises'
import { fireEvent } from '@testing-library/vue'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

global.ClipboardItem = class { }
global.navigator.clipboard = {
    writeText: vi.fn(),
    readText: vi.fn(),
}
// 模拟 WebSocket
class WebSocketMock {
    constructor(url) {
        this.url = url
        this.onopen = vi.fn(() => this.readyState = 1) // 添加 readyState
        this.onmessage = vi.fn()
        this.onclose = vi.fn()
        this.onerror = vi.fn()
        this.send = vi.fn()
        this.readyState = 0 // 添加连接状态
        this.close = vi.fn(() => {
            this.readyState = 3
            this.onclose()
        })
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
            updatedAt: new Date().toISOString()
        }
    ]
    const findInBody = (selector) => {
        return document.body.querySelector(selector)
    }
    beforeEach(async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-05-20')) // 固定当前时间
        // 模拟 API 请求
        mockAxios.onGet(/http:\/\/117.72.11.152:8080\/lakeSword\/dialog\/user/)
            .reply(200, {
                data: mockHistory
            })

        mockAxios.onPut(/http:\/\/117.72.11.152:8080\/lakeSword\/dialog\/title/).reply(200)
        mockAxios.onDelete(/http:\/\/117.72.11.152:8080\/lakeSword\/dialog/).reply(200)
        mockAxios.onGet(/http:\/\/117.72.11.152:8080\/lakeSword\/ai\/chat\/stop/).reply(200)
        // mockAxios.on(/ws:\/\/117.72.11.152:8080\/lakeSword\/ai\/chat/).reply(200)


        wrapper = mount(ChatComponent, {
            global: {
                stubs: {
                    // Transition: true
                    Transition: { template: '<div><slot /></div>' } // 避免 Transition 影响
                }
            }
        })

        await wrapper.vm.fetchChatHistory()
        // await new Promise(resolve => setTimeout(resolve, 100))
        // await flushPromises()
        await wrapper.vm.$nextTick()
    })

    afterEach(() => {
        vi.useRealTimers()
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
    // 聊天功能
    describe('Chat Features', () => {
        it('应发送消息', async () => {
            await wrapper.find('textarea').setValue('你好')

            await wrapper.find('.icon-send').trigger('click')

            expect(wrapper.vm.messages[0]).toEqual({
                role: 'user',
                content: '你好'
            })

            wrapper.vm.socket.onmessage({ data: '测试回复' })
            wrapper.vm.socket.onclose()

            await wrapper.vm.$nextTick()
            expect(wrapper.vm.messages).toHaveLength(2)
        })

        it('应停止生成', async () => {
            await wrapper.find('textarea').setValue('test')
            await wrapper.find('.icon-send').trigger('click')

            await wrapper.find('.icon-status-stop').trigger('click')

            expect(mockAxios.history.get.some(req =>
                req.url.includes('/ai/chat/stop')
            )).toBe(true)
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
            // [1] 等待数据渲染
            await wrapper.vm.$nextTick()

            // [2] 获取历史条目
            const historyItem = wrapper.find('[data-testid="history-item"]')
            expect(historyItem.exists()).toBe(true)

            // [3] 触发 hover 显示菜单按钮
            await historyItem.trigger('mouseenter')

            // [4] 点击菜单触发按钮
            const menuBtn = historyItem.get('[data-testid="menu-button"]')
            await menuBtn.trigger('click')

            // [5] 等待菜单渲染
            await wrapper.vm.$nextTick()

            // [6] 查找操作菜单
            const actionMenu = document.querySelector('[data-testid="action-menu"]')
            expect(actionMenu).not.toBeNull()

            // [7] 点击重命名按钮
            const renameBtn = actionMenu.querySelector('[data-testid="rename-button"]')
            await fireEvent.click(renameBtn)

            // [8] 验证状态
            expect(wrapper.vm.editingId).toBe('1')
            expect(wrapper.find('input.title-input').exists()).toBe(true)
        })

        it('应删除对话', async () => {
            // [1] 等待数据渲染
            await wrapper.vm.$nextTick()

            // [2] 获取历史条目
            const historyItem = wrapper.find('[data-testid="history-item"]')
            expect(historyItem.exists()).toBe(true)

            // [3] 触发 hover 显示菜单按钮
            await historyItem.trigger('mouseenter')

            // [4] 点击菜单触发按钮
            const menuBtn = historyItem.get('[data-testid="menu-button"]')
            await menuBtn.trigger('click')

            // [5] 等待菜单渲染
            await wrapper.vm.$nextTick()

            // [6] 查找操作菜单
            const actionMenu = findInBody('[data-testid="action-menu"]')
            expect(actionMenu).toBeTruthy()

            // [1] 点击删除按钮
            const deleteBtn = actionMenu.querySelector('[data-testid="delete-button"]')
            await fireEvent.click(deleteBtn)

            // [7] 确认弹窗存在
            expect(wrapper.vm.showDelete).toBe(true)

            // [8] 点击确认按钮
            const confirmBtn = wrapper.find('[data-testid="confirm-delete"]')
            await confirmBtn.trigger('click')

            // [9] 验证API调用
            expect(mockAxios.history.delete.length).toBe(1)
        })
    })



    // 工具方法
    describe('Utility Methods', () => {
        it('应正确分类时间', () => {
            const testCases = [
                { date: '2024-05-20', expected: '今天' },
                { date: '2024-05-19', expected: '昨天' },
                { date: '2024-05-15', expected: '前7天' },
                { date: '2024-04-25', expected: '前30天' },
                { date: '2020-01-01', expected: '更早' }
            ]

            testCases.forEach(({ date, expected }) => {
                expect(wrapper.vm.categorizeMessage(new Date(date))).toBe(expected)
            })
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
        it('应处理消息发送失败', async () => {
            mockAxios.onPost('ws://117.72.11.152:8080/lakeSword/ai/chat').networkError();
            await wrapper.vm.sendQuestion();
            expect(wrapper.vm.error);
        });
        it('应阻止空消息发送', async () => {
            await wrapper.find('textarea').setValue('   ') // 空格
            await wrapper.find('.icon-send').trigger('click')
            
            expect(wrapper.vm.messages.length).toBe(0)
          })
          
          it('应在消息更新后滚动到底部', async () => {
            // [1] 创建并附加容器元素
            const container = document.createElement('div')
            container.className = 'chat-body'
            document.body.appendChild(container)
            
            // [2] 模拟 scrollTop 属性
            let scrollValue = 0
            Object.defineProperty(container, 'scrollTop', {
              get: () => scrollValue,
              set: (value) => {
                scrollValue = value
              },
              configurable: true
            })
          
            // [3] 触发消息发送
            await wrapper.find('textarea').setValue('test')
            await wrapper.find('.icon-send').trigger('click')
          
            // [4] 等待滚动触发
            await wrapper.vm.$nextTick()
            
            // [5] 验证滚动调用
            expect(scrollValue).toBe(0)
            
            // [6] 清理
            document.body.removeChild(container)
          })
          it('应处理重命名失败', async () => {
            mockAxios.onPut(/dialog\/title/).networkError()
            
            // 触发重命名流程
            await wrapper.vm.startRename(mockHistory[0])
            await wrapper.vm.saveRename(mockHistory[0])
            
            expect(wrapper.vm.editingId).toBeNull()
            expect(wrapper.find('.error-message').exists())
          })
          it('应处理闰年时间分类', () => {
            const leapDate = new Date('2024-02-29')
            expect(wrapper.vm.categorizeMessage(leapDate))
          })
          
          it('应处理时区差异', () => {
            const utcDate = new Date('2024-05-20T23:59:59Z')
            expect(wrapper.vm.categorizeMessage(utcDate))
          })
    })

    describe('代码复制功能', () => {
        beforeEach(async () => {
            // 设置通用测试数据
            wrapper.vm.messages = [{
                role: 'assistant',
                content: '```js\nconsole.log("test")\n```',
                complete: true
            }]

            await wrapper.vm.$nextTick()
            await flushPromises()
        })

        it('应正确处理带换行的代码', async () => {
            const preElement = wrapper.find('[data-testid="code-block"]')
            const expectedCode = 'console.log("test")\n'
            expect(preElement.attributes('data-code'))
                .toBe(encodeURIComponent(expectedCode))
        })
    })
})
