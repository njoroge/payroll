# Chat Functionality Testing Checklist

This checklist guides manual testing to ensure all new chat features are working as expected.

## I. One-on-One Chats

1.  **Initiation:**
    - [ ] **Test:** Successfully initiate a new chat with another user from a different department using the "New Chat" feature.
    - [ ] **Verify:** Conversation appears in the conversation list for both users. Chat window opens for the initiator. Recipient sees new conversation in their list (possibly highlighted).
2.  **Messaging:**
    - [ ] **Test:** Send and receive text messages.
    - [ ] **Verify:** Messages appear in real-time for both users. Sender is correctly identified (e.g., "You" vs. sender's name). Timestamps are correct and displayed appropriately.
    - [ ] **Test:** Send messages with special characters (e.g., `&, <, >, ", '`, emojis).
    - [ ] **Verify:** Messages render correctly without breaking the UI or showing unescaped characters.
    - [ ] **Test:** Send long messages that would typically require scrolling within a message bubble.
    - [ ] **Verify:** Messages render correctly and are scrollable if necessary.
3.  **Conversation History:**
    - [ ] **Test:** Close and reopen the chat page (or refresh the browser).
    - [ ] **Verify:** Existing one-on-one conversations and their full message history are loaded correctly and in the right order.
    - [ ] **Test:** Select a conversation, scroll up to load older messages (if pagination/infinite scroll is implemented - current version loads all).
    - [ ] **Verify:** Older messages load correctly.

## II. Departmental Group Chats

1.  **Auto-Creation/Joining:**
    - [ ] **Test:** A user (e.g., User A in Sales department) logs in.
    - [ ] **Verify:** User A is automatically part of their department's group chat (e.g., "Sales Group Chat"). The group chat appears in their conversation list, correctly named, and possibly with a group icon.
    - [ ] **Test:** (If possible via admin tools) A new user (User B) is created and added to the Sales department. User B logs in.
    - [ ] **Verify:** Upon next login/refresh, User B is automatically part of the "Sales Group Chat".
    - [ ] **Test:** (If possible via admin tools) An existing user (User C) is moved from Sales to Marketing department. User C logs in/refreshes.
    - [ ] **Verify:** User C is now part of "Marketing Group Chat" and (ideally) no longer sees new messages from "Sales Group Chat" unless specific logic for retaining history is in place (current design implies they would just join new ones).
2.  **Messaging:**
    - [ ] **Test:** User A sends a text message to "Sales Group Chat".
    - [ ] **Verify:** Message appears in real-time for User A and all other currently online members of the Sales department. Message is not visible to users outside the Sales department (e.g., User in Marketing). Sender is correctly identified for all members.
    - [ ] **Test:** Multiple users from the Sales department send messages concurrently or in quick succession.
    - [ ] **Verify:** Messages interleave correctly in the chat window for all members, maintaining chronological order.
3.  **Participant List (Conceptual):**
    - [ ] **Verify:** The group chat correctly includes all current members of the department. This can be implicitly checked by having all members online and confirming they receive messages. If a participant list UI were added, it would be checked directly.
4.  **Conversation History:**
    - [ ] **Test:** Close and reopen the chat page (or refresh).
    - [ ] **Verify:** Departmental group chat(s) and their message history are loaded correctly for users in those departments.

## III. File Sharing (in both One-on-One and Group Chats)

Apply these tests to both a one-on-one chat and a departmental group chat.

1.  **Image Upload & Display:**
    - [ ] **Test:** Upload a JPG image (e.g., `test.jpg`, <5MB).
    - [ ] **Verify:** Image uploads successfully. A message with an image preview appears in the chat for the sender and all other relevant participants. The image is viewable clearly within the chat UI. Filename might be optionally displayed.
    - [ ] **Test:** Upload a PNG image (e.g., `test.png`, <5MB).
    - [ ] **Verify:** Same as above.
    - [ ] **Test:** (If applicable by requirements/filter) Upload a GIF image (e.g., `animated.gif`, <5MB).
    - [ ] **Verify:** Same as above. GIF animation in preview is a bonus, not critical unless specified.
2.  **PDF Upload & Display:**
    - [ ] **Test:** Upload a PDF document (e.g., `document.pdf`, <5MB).
    - [ ] **Verify:** PDF uploads successfully. A message with a link to the PDF (showing filename) appears. Clicking the link opens the PDF in a new tab or prompts for download. A PDF icon should be visible.
3.  **File Type Validation (Client-side & Server-side):**
    - [ ] **Test:** Attempt to upload an unsupported file type (e.g., `.exe`, `.zip`, `.docx`) using the file dialog.
    - [ ] **Verify:** The file input's `accept` attribute should filter many unsupported types. If a user bypasses this (e.g., drag-drop if implemented, or changing file extension), the server should reject it, and an appropriate error message is shown to the user (e.g., "Invalid file type.").
4.  **File Size Validation (Client-side & Server-side):**
    - [ ] **Test:** Attempt to upload a file larger than the configured limit (e.g., an image or PDF >5MB).
    - [ ] **Verify:** Upload is rejected (ideally first by the client if possible, then definitely by the server), and an error message like "File is too large. Maximum size is 5MB." is shown.
5.  **Error Handling:**
    - [ ] **Test:** Simulate a network error during file upload (e.g., using browser developer tools to go offline temporarily after starting an upload).
    - [ ] **Verify:** A proper error message is shown (e.g., "Upload failed. Network error."). The UI recovers gracefully (e.g., input enabled again, no permanent loading state).
    - [ ] **Test:** Attempt to upload a file to a conversation that no longer exists or the user is no longer part of (if possible to simulate).
    - [ ] **Verify:** A relevant error message is displayed.

## IV. User Interface and Usability

1.  **Conversation List:**
    - [ ] **Verify:** Easy to distinguish between direct messages (e.g., participant names) and group chats (e.g., group name, group icon).
    - [ ] **Verify:** List updates correctly when new messages arrive in any conversation (conversation moves to top, last message preview and timestamp update).
    - [ ] **Verify:** Selecting a conversation correctly loads its history in the main chat area and visually marks the conversation as active in the list.
2.  **Message Input:**
    - [ ] **Verify:** Text input field is clear, focused when a chat is active, and easy to type in.
    - [ ] **Verify:** File attachment button (e.g., paperclip icon) is clearly visible and its purpose is understandable. Clicking it opens the file dialog.
    - [ ] **Verify:** Send button is enabled only when there's text to send or a file is ready to be uploaded (if file upload doesn't happen immediately on select). It's disabled during file uploads.
3.  **Message Display:**
    - [ ] **Verify:** Messages from the current user ("You") are clearly differentiated from messages from other participants (e.g., alignment, background color).
    - [ ] **Verify:** Sender's name is displayed for messages from others in group chats.
    - [ ] **Verify:** Timestamps for messages are readable and make sense (e.g., "10:30 AM", "Yesterday", "Sep 15").
    - [ ] **Verify:** File previews (images) and links (PDFs, other files) are clear, well-integrated into the message bubble, and don't break the layout.
    - [ ] **Verify:** The chat area automatically scrolls to the latest message when a new message is sent or received, or when a conversation is first loaded.
4.  **New Chat Flow:**
    - [ ] **Verify:** The process of initiating a new chat (click "New Chat", search user, select user) is intuitive.
    - [ ] **Verify:** User search (even if mock for now) provides clear feedback (loading, results, no results).
    - [ ] **Verify:** Once a recipient for a new chat is selected, the UI clearly indicates who the user is about to message (e.g., "New chat with [User Name]").
5.  **Responsiveness (if applicable):**
    - [ ] **Test:** View the chat page on different screen sizes (desktop, tablet, mobile - if the application is intended to be responsive).
    - [ ] **Verify:** Layout remains usable, elements don't overlap awkwardly, text is readable, buttons are tappable.

## V. Edge Cases & General

1.  **No Conversation Selected:**
    - [ ] **Verify:** When the page first loads or if no conversation is selected (e.g. after deselecting or if `pendingRecipient` is cleared without selecting another chat), the message input area and file attachment button are disabled. A placeholder message like "Select a conversation to start messaging" is shown.
2.  **Empty Chat:**
    - [ ] **Verify:** When a new chat is opened (either a brand new one-on-one or a group chat with no prior messages), a message like "No messages in this conversation yet. Say hi!" is displayed in the message area.
3.  **User Permissions (Implicit - primarily backend enforced but UI should reflect):**
    - [ ] **Verify:** A user can only see conversations (direct and group) they are a legitimate participant of. They should not be able to access or receive messages from conversations they don't belong to.
4.  **Logout/Login:**
    - [ ] **Test:** User logs out while on the chat page.
    - [ ] **Verify:** User is redirected to login, socket connection is terminated.
    - [ ] **Test:** User logs back in.
    - [ ] **Verify:** Chat state (conversations, etc.) is correctly reloaded. No errors from previous session. Socket connects successfully.
5.  **Multiple Browser Tabs/Sessions:**
    - [ ] **Test:** (If possible) Log in as the same user in two different browser tabs or browsers.
    - [ ] **Verify:** Messages sent from one session appear in the other in real-time. New conversations initiated in one session appear in the other. State remains consistent. (This heavily tests WebSocket backend and client-side handlers).

This checklist should be executed in a suitable test environment, ideally with multiple user accounts representing different roles and departments to cover various scenarios.Okay, I've created the testing checklist as `CHAT_TESTING_CHECKLIST.md` in the project root.
