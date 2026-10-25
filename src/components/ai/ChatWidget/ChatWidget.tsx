"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

import ChatSidebar from "@/components/ai/ChatSidebar";
import { useChatPersistence } from "@/components/ai/hooks/useChatPersistence";
import { useRateLimit } from "@/components/ai/hooks/useRateLimit";
import type { ChatWidgetProps } from "@/components/ai/types";
import { cn } from "@/lib/utils";
import { useSupabaseClient } from "@/utils/supabase/client";

import {
  Composer,
  ConfirmationDialog,
  HistoryPanel,
  MessageList,
  ScrollbarStyles,
  SessionMenu,
  WidgetHeader,
} from "./components";
import { DEFAULT_ACCENT_GRADIENT, DIALOG_SPRING } from "./constants";
import {
  useActionDispatcher,
  useAutoScroll,
  useChatComposer,
  useChatMenu,
  useChatStream,
  useConfirmation,
  useCopyMessage,
  useDialogA11y,
  useEnsureActiveChat,
  useHasMounted,
  usePendingAction,
  useRenameChat,
  useSpeech,
} from "./hooks";
import { sortSessions } from "./lib";
import { findLastUserText } from "./lib/lastUserText";
import { useRetryAfterCooldown } from "./hooks/useRetryAfterCooldown";

/**
 * Slide-in AI assistant. This component only wires hooks to presentational
 * components:
 *
 *   persistence   useChatPersistence   history (Supabase or localStorage)
 *   sending       useChatComposer + useChatStream   input, limits, streaming
 *   actions       usePendingAction + useActionDispatcher + useConfirmation
 *   chrome        useDialogA11y, useChatMenu, useRenameChat, useSpeech, ...
 */
export default function ChatWidget({
  isOpen,
  onClose,
  apiEndpoint,
  titleEndpoint,
  storageKey,
  assistantType,
  headerTitle,
  emptyStateTitle,
  emptyStateSubtitle,
  suggestedPrompts,
  accentGradientClassName = DEFAULT_ACCENT_GRADIENT,
}: ChatWidgetProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const supabase = useSupabaseClient();

  const { isLoaded: isUserLoaded, user } = useUser();
  const userId: string | null | undefined = !isUserLoaded
    ? undefined
    : (user?.id ?? null);

  const mounted = useHasMounted();
  const headingId = useId();
  const inputId = useId();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slotHint, setSlotHint] = useState<string | null>(null);

  /* ---- State owners ------------------------------------------------------ */

  const rateLimit = useRateLimit();
  const pending = usePendingAction(storageKey);
  const confirmation = useConfirmation();

  const {
    sessions,
    activeChatId,
    activeChat,
    setActiveChatId,
    createNewChat,
    persistUserMessage,
    updateSession,
    updateMessageByIndex,
    togglePin,
    renameChat,
    deleteChat,
    dbLoaded,
  } = useChatPersistence({ userId, assistantType, storageKey, supabase });

  const dispatchAction = useActionDispatcher({
    onClose,
    userId,
    assistantType,
    reducedMotion,
    requestConfirmation: confirmation.request,
    beginCollecting: pending.beginCollecting,
    clearPendingAction: pending.clear,
    setSlotHint,
  });

  const { loading, send } = useChatStream({
    isOpen,
    apiEndpoint,
    titleEndpoint,
    userId,
    supabase,
    startCooldown: rateLimit.startCooldown,
    persistUserMessage,
    updateSession,
    updateMessageByIndex,
  });

  const composer = useChatComposer({
    loading,
    activeChatId,
    sessions,
    canSend: rateLimit.canSend,
    tryConsume: rateLimit.tryConsume,
    startCooldown: rateLimit.startCooldown,
    pendingState: pending.pendingState,
    consumeReply: pending.consumeReply,
    dispatchAction,
    setSlotHint,
    send,
  });

  /* ---- Chrome ------------------------------------------------------------ */

  const dialogRef = useDialogA11y({ isOpen, onClose });
  const menu = useChatMenu();
  const rename = useRenameChat(renameChat);
  const { copiedMessageId, copy } = useCopyMessage();
  const { speakingMessageId, speak } = useSpeech();

  useEnsureActiveChat({
    isOpen,
    dbLoaded,
    sessions,
    activeChatId,
    setActiveChatId,
    createNewChat,
  });

  const endRef = useAutoScroll({
    messages: activeChat?.messages,
    loading,
    slotHint,
    reducedMotion,
  });

  /* ---- Handlers ---------------------------------------------------------- */

  const sortedSessions = useMemo(() => sortSessions(sessions), [sessions]);

  const handleToggleSidebar = useCallback(
    () => setIsSidebarOpen((open) => !open),
    [],
  );

  const handleNewChat = useCallback(() => {
    void createNewChat();
  }, [createNewChat]);

  const handleSelectPrompt = useCallback(
    (text: string) => {
      void composer.sendMessage(text);
    },
    [composer],
  );

  const handleCopy = useCallback(
    (messageId: string, text: string) => {
      void copy(messageId, text);
    },
    [copy],
  );

  const handleCancelPending = useCallback(() => {
    pending.clear();
    setSlotHint(null);
  }, [pending]);

  // Always points at the latest sendMessage, so stable callbacks can call it.
  const sendMessageRef = useRef(composer.sendMessage);
  useEffect(() => {
    sendMessageRef.current = composer.sendMessage;
  });

  // After a rate-limit cooldown ends, offer to re-send the last prompt.
  const lastUserText = useMemo(
    () => findLastUserText(activeChat?.messages),
    [activeChat?.messages],
  );
  const { offerRetry, dismissRetryOffer } = useRetryAfterCooldown({
    cooldownSeconds: rateLimit.cooldownSeconds,
    loading,
    resetKey: activeChatId,
    isOpen,
  });
  const showRetryNow =
    offerRetry &&
    lastUserText !== null &&
    !loading &&
    rateLimit.canSend &&
    composer.input.trim() === "" &&
    pending.pendingState === null;
  const handleRetryNow = useCallback(() => {
    dismissRetryOffer();
    if (lastUserText) void sendMessageRef.current(lastUserText);
  }, [dismissRetryOffer, lastUserText]);

  
if (!mounted) return null;

  // Prefer the state-derived prompt; the transient `slotHint` covers the
  // "failed to parse" case. Both are set from the same code path.
  const activeSlotHint = pending.pendingPrompt ?? slotHint;
  const menuSession = menu.isOpen
    ? sessions.find((session) => session.id === menu.activeMenuId)
    : undefined;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <ScrollbarStyles />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            tabIndex={-1}
            initial={{ x: reducedMotion ? 0 : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: reducedMotion ? 0 : "-100%" }}
            transition={reducedMotion ? { duration: 0 } : DIALOG_SPRING}
            className={cn(
              "fixed inset-y-0 left-0 z-[9999] flex h-dvh w-full flex-col sm:max-w-lg",
              "border-r border-cafe-border bg-cafe-bg shadow-2xl",
              "outline-none",
            )}
          >
            <WidgetHeader
              title={activeChat?.title || headerTitle}
              headingId={headingId}
              accentGradientClassName={accentGradientClassName}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onNewChat={handleNewChat}
              onClose={onClose}
            />

            <div className="relative flex min-h-0 flex-1 overflow-hidden">
              {isSidebarOpen && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Close chat history"
                  onClick={handleToggleSidebar}
                  className="absolute inset-0 z-10 bg-black/40 sm:hidden"
                />
              )}

              <div className="absolute inset-y-0 left-0 z-20 flex sm:static sm:z-auto">
              <HistoryPanel isOpen={isSidebarOpen} reducedMotion={reducedMotion}>
                <ChatSidebar
                  sessions={sortedSessions}
                  activeChatId={activeChatId}
                  editingChatId={rename.editingChatId}
                  editingTitle={rename.editingTitle}
                  onSelectChat={setActiveChatId}
                  onChangeTitle={rename.setEditingTitle}
                  onCommitRename={rename.commitRename}
                  onCancelRename={rename.cancelRename}
                  onOpenMenu={menu.openMenu}
                />
              </HistoryPanel>
              </div>

              <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <MessageList
                  messages={activeChat?.messages}
                  loading={loading}
                  reducedMotion={reducedMotion}
                  accentGradientClassName={accentGradientClassName}
                  emptyStateTitle={emptyStateTitle}
                  emptyStateSubtitle={emptyStateSubtitle}
                  suggestedPrompts={suggestedPrompts}
                  promptsDisabled={!rateLimit.canSend}
                  speakingMessageId={speakingMessageId}
                  copiedMessageId={copiedMessageId}
                  endRef={endRef}
                  onSelectPrompt={handleSelectPrompt}
                  onCopy={handleCopy}
                  onSpeak={speak}
                  onExecuteAction={dispatchAction}
                />
              </div>
            </div>

            <Composer
              inputId={inputId}
              input={composer.input}
              loading={loading}
              canSend={rateLimit.canSend}
              cooldownSeconds={rateLimit.cooldownSeconds}
              hasPendingAction={pending.pendingState !== null}
              slotHint={activeSlotHint}
              reducedMotion={reducedMotion}
              accentGradientClassName={accentGradientClassName}
              onChange={composer.handleInputChange}
              onKeyDown={composer.handleInputKeyDown}
              onSend={() => void composer.sendMessage()}
              showRetryNow={showRetryNow}
              onRetryNow={handleRetryNow}
              
onCancelPending={handleCancelPending}
            />

            {confirmation.pending && (
              <ConfirmationDialog
                action={confirmation.pending.action}
                onConfirm={confirmation.confirm}
                onCancel={confirmation.cancel}
                accentGradientClassName={accentGradientClassName}
              />
            )}
          </motion.div>

          {menuSession && (
            <SessionMenu
              session={menuSession}
              position={menu.position}
              menuRef={menu.menuRef}
              registerItem={menu.registerItem}
              onKeyDown={menu.handleKeyDown}
              onTogglePin={() => {
                togglePin(menuSession.id);
                menu.closeMenu();
              }}
              onRename={() => {
                rename.startRename(menuSession);
                menu.closeMenu();
              }}
              onDelete={() => {
                deleteChat(menuSession.id);
                menu.closeMenu();
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
