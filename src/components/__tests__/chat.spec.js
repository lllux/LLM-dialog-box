import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatComponent from '../chat.vue'
import flushPromises from 'flush-promises'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

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
            updatedAt: new Date()
        }
    ]

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
                    Transition: true
                }
            }
        })

        await wrapper.vm.fetchChatHistory()
        await flushPromises()
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

        // it('应开启重命名模式', async () => {
        //     wrapper.vm.showSidebar = true
        //     await wrapper.vm.$nextTick()

        //     // 2. 确保历史数据已经加载且渲染完成
        //     await flushPromises()
        //     await wrapper.vm.$nextTick()

        //     // 3. 此时再去查找 DOM
        //     const historyItem = wrapper.find('.history-item')
        //     expect(historyItem.exists()).toBe(true)  // 这里就会是 true

        //     // 悬停、点更多按钮
        //     await historyItem.trigger('mouseenter')
        //     const iconDian = wrapper.find('.icon-dian')
        //     await iconDian.trigger('click')

        //     // 点击 “重命名”
        //     const renameBtn = wrapper.find('.newname')
        //     expect(renameBtn.exists()).toBe(true)    // 不再是 false
        //     await renameBtn.trigger('click')

        //     // 检查组件状态
        //     expect(wrapper.vm.editingId).toBe('1')

        //     // 修改标题
        //     wrapper.vm.editTitle = '新标题'
        //     await wrapper.vm.$nextTick()

        //     // 失焦或回车保存
        //     await renameBtn.trigger('blur') // 或者手动调用 saveRename
        //     await flushPromises()

        //     // 验证发送了 put 请求
        //     expect(mockAxios.history.put.length).toBe(1)
        //     expect(mockAxios.history.put[0].data).toContain('"sid":"1"')
        //     expect(mockAxios.history.put[0].data).toContain('"title":"新标题"')

        //     // 验证组件里对应那条 history title 已更新
        //     expect(wrapper.vm.chatHistory[0].title).toBe('新标题')
        // })

        // it('应删除对话', async () => {
        //     await wrapper.find('textarea').setValue('你好')
        //     await wrapper.find('.icon-send').trigger('click')

        //     expect(wrapper.vm.messages[0].content).toBe('你好')

        //     // 模拟AI响应完成
        //     wrapper.vm.messages[0].complete = true
        //     await wrapper.find('.history-item').trigger('mouseenter')
        //     await wrapper.find('.icon-dian').trigger('click')
        //     await wrapper.find('.delete').trigger('click')
        //     expect(wrapper.vm.showDelete).toBe(true)

        //     await wrapper.find('.modal-actions button:first-child').trigger('click')
        //     expect(mockAxios.history.delete.length).toBe(1)
        // })
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
    })
})