# New Chat Features - Technical Overview

## Overview

This document outlines the key technical aspects of the recently implemented chat functionalities. The system now supports:
-   **One-on-One Direct Chats:** Private conversations between two users.
-   **Departmental Group Chats:** Automatic group chats for all members of a department.
-   **File Sharing:** Users can upload and share images (JPG, PNG, GIF) and PDF documents within chats.

## Key Backend Changes

1.  **`Conversation` Model (`server/models/Conversation.js`)**
    *   Added `type`: (String, enum: `['direct', 'group']`, default: `'direct'`) to distinguish conversation types.
    *   Added `name`: (String) for naming group chats (e.g., department name).

2.  **`Message` Model (`server/models/Message.js`)**
    *   Added fields to support file attachments:
        *   `fileName`: (String) Original name of the uploaded file.
        *   `fileUrl`: (String) Server-relative path to the stored file.
        *   `fileType`: (String) MIME type of the file.
        *   `fileSize`: (Number) Size of the file in bytes.
    *   `contentType` field is used to indicate message type (e.g., 'text', 'image', 'pdf').

3.  **Message Controller (`server/controllers/messageController.js`)**
    *   **Departmental Group Chat Logic:**
        *   `getOrCreateDepartmentGroupChat`: Helper function to find or create group chats for departments when users fetch their conversations. It populates participants based on department membership.
    *   **File Upload Handling:**
        *   `uploadFileForConversation`: New controller function to handle file uploads.
        *   Uses `multer` for parsing `multipart/form-data` and storing files.
        *   Configuration includes file type filtering (images, PDFs) and size limits (5MB).
        *   Saves file metadata to the `Message` model.
    *   **WebSocket Integration:**
        *   After a file is uploaded and its message is saved, `uploadFileForConversation` now retrieves the `io` instance (Socket.IO) and emits a `newMessage` event to the relevant conversation room. This ensures clients receive file messages in real-time.

4.  **API Routes (`server/routes/messageRoutes.js`)**
    *   Added new `POST /api/messages/upload/:conversationId` route to handle file uploads for a specific conversation. This route uses the `protect` middleware for authentication and the configured `multer` instance for file processing.

5.  **WebSocket Events (`server/server.js`)**
    *   `newMessage`: Existing event now also handles broadcasting file messages. The payload includes the message object (with file details if applicable) and the updated conversation object.
    *   `newConversation`: Existing event used to notify clients when a new conversation is created (e.g., when a user starts a new direct chat).

## Key Frontend Changes (`client/src/pages/ChatPage.jsx`)

1.  **UI for Group/Direct Chats:**
    *   Conversation list now visually distinguishes group chats (e.g., using group name and an icon) from direct messages (participant names).
    *   The `getParticipantNames` utility was updated to handle conversation types.

2.  **UI for Initiating New One-on-One Chats:**
    *   A "New Chat" button opens a `UserSearchModal`.
    *   The modal allows searching for users (currently mock search, needs backend API for full functionality).
    *   Selecting a user initiates a new chat by setting a `pendingRecipient`. The first message sent to this recipient triggers conversation creation on the backend.
    *   The `handleSendMessage` function was updated to handle sending messages to a `pendingRecipient`.
    *   The `newConversation` socket event updates the UI when the new chat is confirmed.

3.  **Rendering File Messages:**
    *   Messages with `contentType` 'image' are rendered as `<img>` previews.
    *   Messages with `contentType` 'pdf' are rendered as links with a PDF icon, opening the file in a new tab.
    *   Other file types are rendered as generic downloadable links.
    *   `fileUrl`s are prepended with the base server URL for correct display.

4.  **File Attachment UI and Upload Logic:**
    *   A paperclip icon button allows users to select files.
    *   An `<input type="file">` is used, configured with `accept` attributes for allowed file types.
    *   `handleFileSelect` function manages client-side logic:
        *   Creates `FormData` for the selected file.
        *   POSTs to the `/api/messages/upload/:conversationId` endpoint.
        *   Handles loading states (disabling buttons, showing spinners) and displays errors.
        *   Successful uploads are confirmed via the `newMessage` WebSocket event.

5.  **State Management:**
    *   New state variables manage file upload status (`fileUploading`, `fileUploadError`).
    *   State for user search modal (`isUserSearchModalOpen`) and the selected recipient for a new chat (`pendingRecipient`).
    *   Logic enhanced to handle UI updates for pending chats vs. established conversations.

## File Storage

*   Uploaded files are currently stored locally on the server in the `server/uploads/` directory.
*   This directory has been added to `server/.gitignore` to prevent accidental versioning of uploaded content. For production, a dedicated file storage solution (e.g., cloud storage like AWS S3, Google Cloud Storage) would be recommended.

## Testing

*   A detailed manual testing checklist is available in `CHAT_TESTING_CHECKLIST.md`. This document covers various scenarios for one-on-one chats, group chats, file sharing, UI/UX, and edge cases.

This summary provides a high-level guide to the new chat system's architecture and key implementation points. For more detailed information, refer to the specific code files mentioned.
