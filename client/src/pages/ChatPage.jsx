import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/authContext';
import api from '../services/api';
import io from 'socket.io-client';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Reusable conversation sorting function
const sortConversationsGlobally = (conversationsArray) => {
    if (!conversationsArray) return [];
    return [...conversationsArray].sort((a, b) => {
        // Prioritize direct messages
        if (a.type === 'direct' && b.type === 'group') {
            return -1; // a comes first
        }
        if (a.type === 'group' && b.type === 'direct') {
            return 1; // b comes first
        }

        // If types are the same, sort by date
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
        return dateB - dateA; // Most recent first
    });
};

// Define useDebounce hook (can be moved to a separate utility file later)
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const ChatPage = () => {
    const auth = useAuth();
    const userInfo = auth?.userInfo;
    const loadingAuth = auth?.loading;

    if (loadingAuth) {
        return <p>Loading user information...</p>;
    }

    if (!userInfo) {
        return <p>User information not available. You might need to log in.</p>;
    }

    const currentChatUserId = userInfo._id;

    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [errorConversations, setErrorConversations] = useState(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [errorMessages, setErrorMessages] = useState(null);
    const [fileUploading, setFileUploading] = useState(false);
    const [fileUploadError, setFileUploadError] = useState(null);
    const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);
    const [pendingRecipient, setPendingRecipient] = useState(null);
    const [activeMessageMenu, setActiveMessageMenu] = useState(null); // To store msg._id of open menu
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    const previousConversationIdRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (pendingRecipient) {
            setSelectedConversationId(null);
            setMessages([]);
            setErrorMessages(null);
        }
    }, [pendingRecipient]);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
        }
    };

    useEffect(() => {
        if (userInfo && userInfo.token) {
            const newSocket = io('http://localhost:5001', { auth: { token: userInfo.token } });
            setSocket(newSocket);
            newSocket.on('connect', () => {
                console.log('[ChatPage] Socket successfully connected to server. Socket ID:', newSocket.id);
            });
            newSocket.on('connect_error', (err) => {
                console.error('[ChatPage] Socket connection error. Message:', err.message, 'Data:', err.data, 'Description:', err.description, 'Full error object:', err);
                setErrorConversations('Failed to connect to messaging service. Please try refreshing.');
            });
            newSocket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
            newSocket.on('sendMessageError', (errorData) => {
                console.error('Error sending message:', errorData.message);
                alert(`Message error: ${errorData.message}`);
            });
            newSocket.on('newMessage', ({ message, conversation: updatedConversation }) => {
                console.log('[User B Client] Received newMessage event. Message:', message, 'Updated Conversation:', updatedConversation);

                // Input validation for the message object itself
                if (!message || !message._id) {
                    console.warn("ChatPage: Received newMessage event with invalid message object (ID missing):", message);
                    return; // Skip processing if message or message._id is missing
                }

                setSelectedConversationId(prevSelectedId => {
                    if (prevSelectedId === message.conversationId) {
                        setMessages(prevMessages => {
                            // Check if message already exists
                            if (prevMessages.some(m => m._id === message._id)) {
                                return prevMessages; // If exists, return current messages, no change
                            }
                            return [...prevMessages, message]; // If not, add new message
                        });
                    }
                    return prevSelectedId;
                });
                setConversations(prevConversations => {
                    if (!updatedConversation || !updatedConversation._id) {
                        console.error("ChatPage: Received newMessage with invalid updatedConversation data (ID missing):", updatedConversation);
                        return prevConversations;
                    }
                    const updatedConvId = updatedConversation._id;

                    // Create a new list by filtering out any existing version of this conversation.
                    const listWithoutThisConv = prevConversations.filter(conv => {
                        return conv && conv._id && conv._id !== updatedConvId;
                    });

                    // Prepend the new/updated version of the conversation and sort.
                    return sortConversationsGlobally([updatedConversation, ...listWithoutThisConv]);
                });
                if (message.senderId?._id === currentChatUserId) {
                    setNewMessage('');
                } else {
                    // Show notification for messages from others
                    const senderName = message.senderId?.firstName || 'Someone';
                    setNotificationMessage(`New message from ${senderName}: ${message.contentType === 'text' ? message.content.substring(0, 30) + '...' : (message.fileName || 'attachment')}`);
                    setShowNotification(true);
                    setTimeout(() => {
                        setShowNotification(false);
                    }, 5000); // Auto-dismiss after 5 seconds
                }
            });
            newSocket.on('newConversation', (newConversationObject) => { // Renamed parameter
                console.log('[Client] Received newConversation event:', newConversationObject); // Adjusted log

                // Update conversations state (using the robust logic from previous steps)
                setConversations(prevConversations => {
                    if (!newConversationObject || !newConversationObject._id) {
                        console.error("ChatPage: Received newConversation event with invalid data (ID missing):", newConversationObject);
                        return prevConversations;
                    }
                    const newConvId = newConversationObject._id;
                    const existingConvIndex = prevConversations.findIndex(conv => conv && conv._id === newConvId);

                    let newList;
                    if (existingConvIndex !== -1) {
                        // This case should be rare for a 'newConversation' event, but handle it by updating.
                        console.warn(`ChatPage: 'newConversation' event received for an already existing conversation ID: ${newConvId}. Updating it in the list.`);
                        const updatedList = [...prevConversations];
                        updatedList[existingConvIndex] = newConversationObject;
                        newList = updatedList;
                    } else {
                        // Add the new conversation to the beginning of the list.
                        newList = [newConversationObject, ...prevConversations.filter(c => c && c._id)];
                    }
                    return sortConversationsGlobally(newList);
                });

                // --- BEGIN NEW LOGIC ---
                // After the state update for conversations is queued,
                // automatically join the room for this new conversation and select it.
                if (newConversationObject && newConversationObject._id && socket) { // Check if socket is available
                    console.log(`[Client] Auto-joining room and selecting new conversation: ${newConversationObject._id}`);
                    socket.emit('joinConversationRoom', newConversationObject._id);
                    setSelectedConversationId(newConversationObject._id);
                }
                // --- END NEW LOGIC ---
            });
            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [userInfo, currentChatUserId]); // Added currentChatUserId as it's used in newMessage handler logic

    useEffect(() => {
        if (!userInfo || !socket) return;
        setLoadingConversations(true);
        api.get('/messages/conversations')
            .then(response => {
                setConversations(sortConversationsGlobally(response.data || []));
            })
            .catch(err => setErrorConversations(err.response?.data?.message || "Failed to fetch conversations."))
            .finally(() => setLoadingConversations(false));
    }, [userInfo, socket]);

    useEffect(() => {
        if (socket) {
            if (previousConversationIdRef.current && previousConversationIdRef.current !== selectedConversationId) {
                socket.emit('leaveConversationRoom', previousConversationIdRef.current);
            }
            if (selectedConversationId) {
                console.log('[ChatPage DEBUG] useEffect[selectedConversationId]: Joining room and fetching messages for conversationId:', selectedConversationId);
                console.log('[User B Client] Emitting joinConversationRoom for ID:', selectedConversationId);
                socket.emit('joinConversationRoom', selectedConversationId);
                setLoadingMessages(true);
                setErrorMessages(null);
                setMessages([]);
                api.get(`/messages/conversations/${selectedConversationId}/messages`)
                    .then(response => setMessages(response.data || []))
                    .catch(err => setErrorMessages(err.response?.data?.message || "Failed to fetch messages."))
                    .finally(() => setLoadingMessages(false));
            } else {
                setMessages([]);
            }
            previousConversationIdRef.current = selectedConversationId;
        }
    }, [selectedConversationId, socket]);

    const handleSelectConversation = (conversationId) => {
        console.log('[ChatPage DEBUG] handleSelectConversation: selected conversationId:', conversationId);
        if (selectedConversationId === conversationId && !pendingRecipient) return;
        setPendingRecipient(null);
        setSelectedConversationId(conversationId);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        console.log('[ChatPage DEBUG] handleSendMessage: selectedConversationId:', selectedConversationId);
        console.log('[ChatPage DEBUG] handleSendMessage: pendingRecipient:', pendingRecipient);
        const messagePayload = selectedConversationId ?
            { conversationId: selectedConversationId, content: newMessage.trim() } :
            { recipientId: pendingRecipient._id, content: newMessage.trim() };
        console.log('[ChatPage DEBUG] handleSendMessage: messagePayload:', messagePayload);

        if (selectedConversationId) {
            socket.emit('sendMessage', messagePayload);
            setNewMessage(''); // Clear input after sending
        } else if (pendingRecipient?._id) {
            socket.emit('sendMessage', messagePayload);
            setNewMessage(''); // Clear input after sending
        } else {
            alert("Please select a conversation or a recipient to send a message.");
        }
    };

    useEffect(() => {
        if (socket) {
            const newConversationHandler = (newlyCreatedConv) => {
                console.log('[User B Client] Received newConversation event (handler 2 - for pending recipient):', newlyCreatedConv);
                const isInitiator = newlyCreatedConv.participants.some(p => p._id === currentChatUserId);
                const hasPendingRecipient = pendingRecipient && newlyCreatedConv.participants.some(p => p._id === pendingRecipient._id);
                if (isInitiator && hasPendingRecipient) {
                    setSelectedConversationId(newlyCreatedConv._id);
                    setPendingRecipient(null);
                }
            };
            socket.on('newConversation', newConversationHandler);
            return () => socket.off('newConversation', newConversationHandler);
        }
    }, [socket, pendingRecipient, currentChatUserId]);

    const getParticipantNames = (conversation) => {
        if (!conversation) return 'N/A';
        if (conversation.type === 'group') return conversation.name || 'Group Chat';
        if (!userInfo || !conversation.participants) return 'N/A';
        const otherParticipants = conversation.participants.filter(p => p._id !== currentChatUserId);
        if (otherParticipants.length === 0 && conversation.participants.length > 0) {
            return conversation.participants[0]?.firstName || conversation.participants[0]?.email || 'Self';
        }
        return otherParticipants.map(p => p.firstName || p.email).join(', ') || 'Unknown User';
    };

    const getChatHeaderName = (conversationId) => {
        const conversation = conversations.find(c => c._id === conversationId);
        return conversation ? getParticipantNames(conversation) : "Chat";
    };

    const FILE_BASE_URL = api.defaults.baseURL.replace('/api', '');

    const handleFileSelect = (e) => {
        console.log("File selected:", e.target.files[0]);
        // Placeholder for actual file upload logic: api.post('/messages/upload', formData) etc.
        // For now, just clear the input to allow selecting the same file again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUserSelectForNewChat = (user, isExistingConversation) => {
        console.log('[ChatPage DEBUG] handleUserSelectForNewChat: user:', user, 'isExistingConversation:', isExistingConversation);
        // console.log("User selected for new chat:", user, "isExisting:", isExistingConversation); // Original log, can be removed or kept
        setIsUserSearchModalOpen(false);
        if (isExistingConversation) {
            const existingConv = conversations.find(conv =>
                conv.type === 'direct' &&
                conv.participants.length === 2 &&
                conv.participants.some(p => p._id === user._id) &&
                conv.participants.some(p => p._id === currentChatUserId)
            );
            if (existingConv) {
                setSelectedConversationId(existingConv._id);
                setPendingRecipient(null);
            } else {
                setPendingRecipient(user);
                setSelectedConversationId(null);
            }
        } else {
            setPendingRecipient(user);
            setSelectedConversationId(null);
        }
    };

    const handleDeleteForEveryone = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message for everyone? This action cannot be undone.')) {
            return;
        }
        try {
            // Optimistic UI update can be tricky if the message content changes structure
            // Relying on socket event 'messageUpdated' is generally safer for "delete for everyone"
            // to ensure all clients see the same final state.

            // We could temporarily mark it as "deleting..." locally if needed.
            // For now, just call the API. The socket event will handle the UI change.

            await api.put(`/messages/${messageId}/delete-for-everyone`);
            // console.log('Delete for everyone successful for message:', messageId);
            // No explicit client-side removal here; wait for 'messageUpdated' socket event
        } catch (err) {
            console.error('Error deleting message for everyone:', err);
            alert(`Failed to delete message: ${err.response?.data?.message || err.message}`);
        }
        setActiveMessageMenu(null); // Close the menu regardless of outcome
    };

    const handleDeleteForMyself = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message only for yourself? Others will still see it.')) {
            return;
        }
        try {
            await api.post(`/messages/${messageId}/delete-for-myself`);
            // Optimistically remove the message from the local state
            setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
            // console.log('Delete for myself successful for message:', messageId);
        } catch (err) {
            console.error('Error deleting message for myself:', err);
            alert(`Failed to delete message for yourself: ${err.response?.data?.message || err.message}`);
        }
        setActiveMessageMenu(null); // Close the menu
    };

    // Diagnostic logs (placed after all hooks and handlers, before return)
    console.log('[ChatPage] Debug: Right before UserSearchModal. userInfo:', userInfo);
    if (userInfo) console.log('[ChatPage] Debug: userInfo.employee:', userInfo.employee);
    console.log('[ChatPage] Debug: currentChatUserId:', currentChatUserId);
    console.log('[ChatPage] Debug: Condition for UserSearchModal:', (userInfo && true)); // Changed from userInfo.employee to just userInfo for modal rendering

    return (
        <ErrorBoundary>
            {/* Notification Area */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '15px',
                    backgroundColor: '#28a745', // Bootstrap success green
                    color: 'white',
                    borderRadius: '5px',
                    zIndex: 1050, // High z-index
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    {notificationMessage}
                    <button onClick={() => setShowNotification(false)} style={{
                        marginLeft: '15px',
                        color: 'white',
                        background: 'none',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1.2em',
                        lineHeight: '1' // Ensure consistent vertical alignment
                    }}>
                        &times; {/* Close icon */}
                    </button>
                </div>
            )}
            {/* Main Chat Layout */}
            <div className="container-fluid mt-3" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <h3>Messaging</h3>
                <div style={{ display: 'flex', flexGrow: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '300px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
                        <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}><h5>Conversations</h5></div>
                        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                            {loadingConversations && <p className="p-2">Loading conversations...</p>}
                            {errorConversations && <p className="text-danger p-2">{errorConversations}</p>}
                            {!loadingConversations && !errorConversations && conversations.length === 0 && (<p className="p-2">No conversations yet.</p>)}
                            {conversations.map(conv => {
                                if (!conv || !conv._id) {
                                    console.warn("ChatPage: Rendering conversation with missing _id:", conv);
                                    return null;
                                }
                                return (
                                <div key={conv._id.toString()} onClick={() => handleSelectConversation(conv._id)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: selectedConversationId === conv._id ? '#e9ecef' : 'transparent' }} title={conv.participants?.map(p => p.email).join(', ')}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span className="text-truncate" style={{maxWidth: '180px', display: 'flex', alignItems: 'center'}}>
                                            {conv.type === 'group' && <i className="bi bi-people-fill me-2"></i>}
                                            <strong>{getParticipantNames(conv)}</strong>
                                        </span>
                                        <small className="text-muted" style={{fontSize: '0.75em'}}>{conv.lastMessage ? formatTimestamp(conv.lastMessage.createdAt) : formatTimestamp(conv.updatedAt)}</small>
                                    </div>
                                    <small className="d-block text-muted text-truncate" style={{fontSize: '0.85em'}}>{conv.lastMessage ? `${conv.lastMessage.senderId?._id === currentChatUserId ? 'You: ' : (conv.lastMessage.senderId?.firstName ? conv.lastMessage.senderId?.firstName + ': ' : '')}${conv.lastMessage.contentType === 'text' ? conv.lastMessage.content : (conv.lastMessage.fileName || conv.lastMessage.contentType)}` : 'No messages yet'}</small>
                                </div>
                                )
                            })}
                        </div>
                        <div style={{ padding: '10px', borderTop: '1px solid #ccc' }}><button className="btn btn-outline-primary w-100" onClick={() => setIsUserSearchModalOpen(true)}><i className="bi bi-plus-circle-fill me-2"></i>New Chat</button></div>
                    </div>
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        {selectedConversationId || pendingRecipient ? (
                            <>
                                <div style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f8f9fa' }}><h5>{selectedConversationId ? getChatHeaderName(selectedConversationId) : (pendingRecipient ? `New chat with ${pendingRecipient.firstName || pendingRecipient.email}` : "Chat")}</h5></div>
                                <div style={{ overflowY: 'auto', flexGrow: 1, padding: '10px' }}>
                                    {selectedConversationId && loadingMessages && <p>Loading messages...</p>}
                                    {errorMessages && <p className="text-danger">{errorMessages}</p>}
                                    {messages.map(msg => {
                                        if (!msg || !msg._id) {
                                            console.warn("ChatPage: Rendering message with missing _id:", msg);
                                            return null;
                                        }
                                        const isMyMessage = msg.senderId?._id === currentChatUserId;
                                        return (
                                            <div
                                                key={msg._id.toString()}
                                                style={{
                                                    marginBottom: '10px',
                                                    display: 'flex',
                                                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start'
                                                }}
                                                onMouseLeave={() => setActiveMessageMenu(null)} // Close menu when mouse leaves the whole message area
                                            >
                                                <div
                                                    style={{
                                                        position: 'relative', // For menu positioning
                                                        padding: '8px 12px',
                                                        borderRadius: '15px',
                                                        backgroundColor: isMyMessage ? '#007bff' : '#e9ecef',
                                                        color: isMyMessage ? 'white' : 'black',
                                                        maxWidth: '70%',
                                                        wordWrap: 'break-word'
                                                    }}
                                                    onMouseEnter={() => {/* Potentially show dots icon on hover here if it's initially hidden */}}
                                                >
                                                    {/* Existing content: sender name, message content, timestamp */}
                                                    <strong style={{display: 'block', marginBottom: '5px'}}>
                                                        {isMyMessage ? 'You' : (() => {
                                                            let senderDisplayName = 'Sender'; // Default
                                                            if (msg.senderId) {
                                                                if (msg.senderId.firstName && msg.senderId.lastName) {
                                                                    senderDisplayName = `${msg.senderId.firstName} ${msg.senderId.lastName}`;
                                                                } else if (msg.senderId.firstName) {
                                                                    senderDisplayName = msg.senderId.firstName;
                                                                } else if (msg.senderId.email) { // Fallback to email if no name parts
                                                                    senderDisplayName = msg.senderId.email;
                                                                }
                                                            }
                                                            return senderDisplayName;
                                                        })()}
                                                    </strong>

                                                    {/* Message Content (text, image, file, etc.) - RENDER AS IS */}
                                                    {msg.contentType === 'text' && <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{msg.content}</p>}
                                                    {msg.contentType === 'image' && msg.fileUrl && (<img src={`${FILE_BASE_URL}${msg.fileUrl}`} alt={msg.fileName || 'Uploaded image'} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', maxHeight: '300px' }} />)}
                                                    {msg.contentType === 'pdf' && msg.fileUrl && (<a href={`${FILE_BASE_URL}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{color: isMyMessage ? '#fff' : '#000'}}><i className="bi bi-file-earmark-pdf-fill me-1"></i>{msg.fileName || 'View PDF'}</a>)}
                                                    {(msg.contentType === 'file' || (msg.contentType !== 'text' && msg.contentType !== 'image' && msg.contentType !== 'pdf')) && msg.fileUrl && (<a href={`${FILE_BASE_URL}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{color: isMyMessage ? '#fff' : '#000'}}><i className="bi bi-file-earmark-arrow-down-fill me-1"></i>{msg.fileName || 'Download File'}</a>)}
                                                    {msg.contentType !== 'text' && !msg.content && msg.fileName && (<p className="mb-0 text-muted" style={{fontSize: '0.8em', marginTop: '4px'}}>{msg.fileName}</p>)}

                                                    <small className="text-muted" style={{fontSize: '0.75rem', display: 'block', marginTop: '4px', color: isMyMessage ? '#f0f0f0' : '#6c757d !important'}}>{formatTimestamp(msg.createdAt)}</small>

                                                    {/* "More Options" Button (Three Dots) */}
                                                    {!msg.isDeletedForAll && ( // Don't show options for already deleted messages
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg._id ? null : msg._id); }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: isMyMessage ? 'white' : 'grey',
                                                                position: 'absolute',
                                                                top: '2px',
                                                                right: isMyMessage ? '2px' : 'auto', // Adjust based on message alignment
                                                                left: !isMyMessage ? '2px' : 'auto',
                                                                cursor: 'pointer',
                                                                padding: '2px',
                                                                fontSize: '0.8rem', // Smaller icon
                                                                lineHeight: '1'
                                                            }}
                                                            title="More options"
                                                        >
                                                            <i className="bi bi-three-dots-vertical"></i>
                                                        </button>
                                                    )}

                                                    {/* Context Menu */}
                                                    {activeMessageMenu === msg._id && !msg.isDeletedForAll && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                top: '25px', // Adjust as needed
                                                                right: isMyMessage ? '5px' : 'auto',
                                                                left: !isMyMessage ? '5px' : 'auto',
                                                                backgroundColor: 'white',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                padding: '5px 0',
                                                                zIndex: 10,
                                                                minWidth: '150px',
                                                                boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                                                            }}
                                                            // onMouseLeave={() => setActiveMessageMenu(null)} // This might make it hard to click items
                                                        >
                                                            <button
                                                                className="dropdown-item" // Using Bootstrap class for styling if available
                                                                style={{display: 'block', width: '100%', padding: '5px 10px', textAlign: 'left', background: 'none', border: 'none', color: 'black'}}
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteForMyself(msg._id); /* setActiveMessageMenu is called within the handler */ }}
                                                            >
                                                                Delete for Myself
                                                            </button>
                                                            {isMyMessage && !msg.isDeletedForAll && (
                                                                <button
                                                                    className="dropdown-item"
                                                                    style={{display: 'block', width: '100%', padding: '5px 10px', textAlign: 'left', background: 'none', border: 'none', color: 'black'}}
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteForEveryone(msg._id); /* setActiveMessageMenu is called within the handler */ }}
                                                                >
                                                                    Delete for Everyone
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!loadingMessages && messages.length === 0 && !errorMessages && <p>No messages in this conversation yet. Say hi!</p>}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div style={{ padding: '10px', borderTop: '1px solid #ccc', background: '#f8f9fa' }}>
                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="file" id="chatFileInput" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg, image/png, image/gif, application/pdf" onChange={handleFileSelect} />
                                        <button type="button" className="btn btn-outline-secondary me-2" onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Attach file" disabled={fileUploading || (!selectedConversationId && !pendingRecipient)}> {fileUploading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="bi bi-paperclip"></i>} </button>
                                        <input type="text" className="form-control me-2" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={!socket || fileUploading} />
                                        <button type="submit" className="btn btn-primary" disabled={!socket || !newMessage.trim() || fileUploading}>Send</button>
                                    </form>
                                    {fileUploadError && <p className="text-danger mt-1 ms-2"><small>{fileUploadError}</small></p>}
                                </div>
                            </>
                        ) : ( <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#aaa' }}><p>Select or start a conversation to begin messaging.</p></div> )}
                    </div>
                </div>
                {userInfo && (
                    <UserSearchModal isOpen={isUserSearchModalOpen} onClose={() => setIsUserSearchModalOpen(false)} onSelectUser={handleUserSelectForNewChat} loggedInUserInfo={userInfo} currentUserId={currentChatUserId} conversations={conversations} />
                )}
            </div>
        </ErrorBoundary>
    );
};

const UserSearchModal = ({ isOpen, onClose, onSelectUser, loggedInUserInfo, currentUserId, conversations }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) { // Added length check
            setLoadingSearch(true);
            setSearchError('');
            // const companyId = loggedInUserInfo?.company?._id; // Not needed for the API call as backend handles company context

            api.get(`/employees/search?term=${debouncedSearchTerm}`) // Use the new endpoint
                .then(response => {
                    setSearchResults(response.data || []);
                })
                .catch(err => {
                    console.error("Error searching users:", err);
                    setSearchError(err.response?.data?.message || "Failed to search users.");
                    setSearchResults([]); // Clear results on error
                })
                .finally(() => {
                    setLoadingSearch(false);
                });
        } else {
            setSearchResults([]);
            setLoadingSearch(false); // Ensure loading is false if no search term
        }
    }, [debouncedSearchTerm, currentUserId, loggedInUserInfo]); // Keep dependencies as they might be relevant for other logic or if companyId was used directly

    const handleSelect = (user) => {
        const existingDirectConv = conversations.find(conv => conv.type === 'direct' && conv.participants.length === 2 && conv.participants.some(p => p._id === user._id) && conv.participants.some(p => p._id === currentUserId));
        onSelectUser(user, !!existingDirectConv);
        onClose();
    };

    useEffect(() => { if (isOpen) { setSearchTerm(''); setSearchResults([]); setSearchError(''); } }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header"><h5 className="modal-title">Start New Chat</h5><button type="button" className="btn-close" onClick={onClose}></button></div>
                    <div className="modal-body">
                        <input type="text" className="form-control mb-3" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        {loadingSearch && <p>Searching...</p>}
                        {searchError && <p className="text-danger">{searchError}</p>}
                        {searchResults.length > 0 ? (<ul className="list-group">{searchResults.map(user => (<li key={user._id} className="list-group-item list-group-item-action" onClick={() => handleSelect(user)} style={{cursor: 'pointer'}}>{user.firstName} {user.lastName} ({user.personalEmail})</li>))}</ul>) : (!loadingSearch && debouncedSearchTerm && <p>No users found matching "{debouncedSearchTerm}".</p>)}
                        {!loadingSearch && !debouncedSearchTerm && <p className="text-muted">Start typing to search for users in your company.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
