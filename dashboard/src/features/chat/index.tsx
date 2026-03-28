import { Bot } from 'lucide-react'
import { useCurrentWorkspace } from '@/features/auth/hooks'
import { useIsMobile } from '@/hooks/use-mobile'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'
import { DebugPanel } from './components/debug-panel'
import { useChat } from './hooks/use-chat'

export function Chat() {
  const { workspace } = useCurrentWorkspace()
  const apiKey = workspace?.api_key ?? ''
  const isMobile = useIsMobile()

  const {
    messages,
    timings,
    isStreaming,
    currentDebug,
    isLoadingHistory,
    hasMoreHistory,
    sessionId,
    sendMessage,
    loadMoreHistory,
    clearMessages,
    resetSession,
  } = useChat(apiKey)

  const handleSend = (query: string) => {
    void sendMessage(query, [])
  }

  const handleReset = () => {
    clearMessages()
    resetSession()
  }

  if (!apiKey) {
    return (
      <>
        <Header>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex h-64 items-center justify-center'>
            <div className='flex flex-col items-center space-y-4 text-center'>
              <div className='flex size-16 items-center justify-center rounded-full border-2 border-border'>
                <Bot className='size-8' />
              </div>
              <div className='space-y-1'>
                <h2 className='text-xl font-semibold'>No workspace selected</h2>
                <p className='text-sm text-muted-foreground'>
                  Select a workspace to start chatting.
                </p>
              </div>
            </div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex flex-wrap items-end justify-between gap-2 pb-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Chat</h2>
            <p className='text-muted-foreground'>
              Ask questions against your knowledge base.
            </p>
          </div>
        </div>

        <ResizablePanelGroup
          orientation={isMobile ? 'vertical' : 'horizontal'}
          className='flex-1 overflow-hidden rounded-lg border'
        >
          {/* Chat panel */}
          <ResizablePanel defaultSize={50} minSize={isMobile ? 40 : 30}>
            <div className='flex h-full flex-col overflow-hidden'>
              <ChatMessages
                messages={messages}
                timings={timings}
                isStreaming={isStreaming}
                isLoadingHistory={isLoadingHistory}
                hasMoreHistory={hasMoreHistory}
                onLoadMore={loadMoreHistory}
                sessionId={sessionId}
                apiKey={apiKey}
              />
              <ChatInput onSend={handleSend} onReset={handleReset} disabled={isStreaming} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Debug panel */}
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className='flex h-full flex-col'>
              <div className='flex-1 overflow-hidden'>
                <DebugPanel debug={currentDebug} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Main>
    </>
  )
}
