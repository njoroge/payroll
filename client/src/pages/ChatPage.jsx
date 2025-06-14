import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/authContext'; // For user info and token
import api from '../services/api'; // For REST API calls (fetching initial data)
import io from 'socket.io-client'; // For WebSocket connection
import ErrorBoundary from '../components/common/ErrorBoundary';

const ChatPage = () => {
    const auth = useAuth();
    const userInfo = auth?.userInfo;
    const loadingAuth = auth?.loading;

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
            const newSocket = io('/', { auth: { token: userInfo.token } });
            setSocket(newSocket);
            newSocket.on('connect', () => console.log('Socket connected:', newSocket.id));
            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                setErrorConversations('Failed to connect to messaging service. Please try refreshing.');
            });
            newSocket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
            newSocket.on('sendMessageError', (errorData) => {
                console.error('Error sending message:', errorData.message);
                alert(`Message error: ${errorData.message}`);
            });
            newSocket.on('newMessage', ({ message, conversation: updatedConversation }) => {
                setSelectedConversationId(prevSelectedId => {
                    if (prevSelectedId === message.conversationId) {
                        setMessages(prevMessages => [...prevMessages, message]);
                    }
                    return prevSelectedId;
                });
                setConversations(prevConversations => {
                    const newConversations = prevConversations.filter(conv => conv._id !== updatedConversation._id);
                    return [updatedConversation, ...newConversations];
                });
                if (userInfo && message.senderId?._id === userInfo.employee?._id) {
                    setNewMessage('');
                }
            });
            newSocket.on('newConversation', (newConversation) => {
                setConversations(prevConversations => {
                    if (prevConversations.find(c => c._id === newConversation._id)) {
                        return prevConversations.map(c => c._id === newConversation._id ? newConversation : c);
                    }
                    return [newConversation, ...prevConversations];
                });
            });
            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [userInfo]);

    useEffect(() => {
        if (!userInfo || !socket) return;
        setLoadingConversations(true);
        api.get('/messages/conversations')
            .then(response => setConversations(response.data || []))
            .catch(err => setErrorConversations(err.response?.data?.message || "Failed to fetch conversations."))
            .finally(() => setLoadingConversations(false));
    }, [userInfo, socket]);

    useEffect(() => {
        if (socket) {
            if (previousConversationIdRef.current && previousConversationIdRef.current !== selectedConversationId) {
                socket.emit('leaveConversationRoom', previousConversationIdRef.current);
            }
            if (selectedConversationId) {
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
        if (selectedConversationId === conversationId && !pendingRecipient) return;
        setPendingRecipient(null);
        setSelectedConversationId(conversationId);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;
        if (selectedConversationId) {
            socket.emit('sendMessage', { conversationId: selectedConversationId, content: newMessage.trim() });
        } else if (pendingRecipient?._id) {
            socket.emit('sendMessage', { recipientId: pendingRecipient._id, content: newMessage.trim() });
        } else {
            alert("Please select a conversation or a recipient to send a message.");
        }
    };

    useEffect(() => {
        if (socket) {
            const newConversationHandler = (newlyCreatedConv) => {
                const isInitiator = newlyCreatedConv.participants.some(p => p._id === userInfo?.employee?._id);
                const hasPendingRecipient = pendingRecipient && newlyCreatedConv.participants.some(p => p._id === pendingRecipient._id);
                if (isInitiator && hasPendingRecipient) {
                    setSelectedConversationId(newlyCreatedConv._id);
                    setPendingRecipient(null);
                }
            };
            socket.on('newConversation', newConversationHandler);
            return () => socket.off('newConversation', newConversationHandler);
        }
    }, [socket, pendingRecipient, userInfo?.employee?._id]);

    const getParticipantNames = (conversation) => {
        if (!conversation) return 'N/A';
        if (conversation.type === 'group') return conversation.name || 'Group Chat';
        if (!userInfo || !conversation.participants) return 'N/A';
        const otherParticipants = conversation.participants.filter(p => p._id !== userInfo?.employee?._id);
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

    // Define these handlers inside ChatPage component
    const handleFileSelect = (e) => {
        console.log("File selected:", e.target.files[0]);
        // Placeholder for actual file upload logic
        if (fileInputRef.current) {
           fileInputRef.current.value = "";
        }
    };

    const handleUserSelectForNewChat = (user, isExistingConversation) => {
        console.log("User selected for new chat:", user, "isExisting:", isExistingConversation);
        setIsUserSearchModalOpen(false);
        if (isExistingConversation) {
            const existingConv = conversations.find(conv =>
                conv.type === 'direct' &&
                conv.participants.length === 2 &&
                conv.participants.some(p => p._id === user._id) &&
                conv.participants.some(p => p._id === userInfo?.employee?._id)
            );
            if (existingConv) {
                setSelectedConversationId(existingConv._id);
                setPendingRecipient(null);
            } else {
                // This case (isExistingConversation true but not found) should ideally not happen if data is consistent
                // Defaulting to treating as a new chat with the selected user
                setPendingRecipient(user);
                setSelectedConversationId(null);
            }
        } else {
            setPendingRecipient(user);
            setSelectedConversationId(null);
        }
    };

    if (loadingAuth) return <p>Loading user information...</p>;
    if (!userInfo) return <p>User information not available. You might need to log in.</p>;

    // ***** START OF DIAGNOSTIC LOGS *****
    console.log('[ChatPage] Debug: Right before UserSearchModal. userInfo:', userInfo);
    if (userInfo) console.log('[ChatPage] Debug: userInfo.employee:', userInfo.employee);
    console.log('[ChatPage] Debug: Condition for UserSearchModal:', (userInfo && userInfo.employee));
    // ***** END OF DIAGNOSTIC LOGS *****

    return (
        <ErrorBoundary>
            <div className="container-fluid mt-3" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <h3>Messaging</h3>
                <div style={{ display: 'flex', flexGrow: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '300px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
                        <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}><h5>Conversations</h5></div>
                        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                            {loadingConversations && <p className="p-2">Loading conversations...</p>}
                            {errorConversations && <p className="text-danger p-2">{errorConversations}</p>}
                            {!loadingConversations && !errorConversations && conversations.length === 0 && (<p className="p-2">No conversations yet.</p>)}
                            {conversations.map(conv => (
                                <div key={conv._id} onClick={() => handleSelectConversation(conv._id)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: selectedConversationId === conv._id ? '#e9ecef' : 'transparent' }} title={conv.participants?.map(p => p.email).join(', ')}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span className="text-truncate" style={{maxWidth: '180px', display: 'flex', alignItems: 'center'}}>
                                            {conv.type === 'group' && <i className="bi bi-people-fill me-2"></i>}
                                            <strong>{getParticipantNames(conv)}</strong>
                                        </span>
                                        <small className="text-muted" style={{fontSize: '0.75em'}}>{conv.lastMessage ? formatTimestamp(conv.lastMessage.createdAt) : formatTimestamp(conv.updatedAt)}</small>
                                    </div>
                                    <small className="d-block text-muted text-truncate" style={{fontSize: '0.85em'}}>{conv.lastMessage ? `${conv.lastMessage.senderId?._id === userInfo?.employee?._id ? 'You: ' : (conv.lastMessage.senderId?.firstName ? conv.lastMessage.senderId?.firstName + ': ' : '')}${conv.lastMessage.contentType === 'text' ? conv.lastMessage.content : (conv.lastMessage.fileName || conv.lastMessage.contentType)}` : 'No messages yet'}</small>
                                </div>
                            ))}
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
                                    {messages.map((msg) => (
                                        <div key={msg._id} style={{ marginBottom: '10px', textAlign: msg.senderId?._id === userInfo?.employee?._id ? 'right' : 'left' }}>
                                            <div style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '15px', backgroundColor: msg.senderId?._id === userInfo?.employee?._id ? '#007bff' : '#e9ecef', color: msg.senderId?._id === userInfo?.employee?._id ? 'white' : 'black', maxWidth: '70%', wordWrap: 'break-word' }}>
                                                <strong style={{display: 'block', marginBottom: '5px'}}>{msg.senderId?._id === userInfo?.employee?._id ? 'You' : (msg.senderId?.firstName || 'Sender')}</strong>
                                                {msg.contentType === 'text' && <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{msg.content}</p>}
                                                {msg.contentType === 'image' && msg.fileUrl && (<img src={`${FILE_BASE_URL}${msg.fileUrl}`} alt={msg.fileName || 'Uploaded image'} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', maxHeight: '300px' }} />)}
                                                {msg.contentType === 'pdf' && msg.fileUrl && (<a href={`${FILE_BASE_URL}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{color: msg.senderId?._id === userInfo?.employee?._id ? '#fff' : '#000'}}><i className="bi bi-file-earmark-pdf-fill me-1"></i>{msg.fileName || 'View PDF'}</a>)}
                                                {(msg.contentType === 'file' || (msg.contentType !== 'text' && msg.contentType !== 'image' && msg.contentType !== 'pdf')) && msg.fileUrl && (<a href={`${FILE_BASE_URL}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{color: msg.senderId?._id === userInfo?.employee?._id ? '#fff' : '#000'}}><i className="bi bi-file-earmark-arrow-down-fill me-1"></i>{msg.fileName || 'Download File'}</a>)}
                                                {msg.contentType !== 'text' && !msg.content && msg.fileName && (<p className="mb-0 text-muted" style={{fontSize: '0.8em', marginTop: '4px'}}>{msg.fileName}</p>)}
                                                <small className="text-muted" style={{fontSize: '0.75rem', display: 'block', marginTop: '4px', color: msg.senderId?._id === userInfo?.employee?._id ? '#f0f0f0' : '#6c757d !important'}}>{formatTimestamp(msg.createdAt)}</small>
                                            </div>
                                        </div>
                                    ))}
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
                {userInfo && userInfo.employee && (
                    <UserSearchModal isOpen={isUserSearchModalOpen} onClose={() => setIsUserSearchModalOpen(false)} onSelectUser={handleUserSelectForNewChat} loggedInUserInfo={userInfo} currentUserId={userInfo.employee._id} conversations={conversations} />
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

    const useDebounce = (value, delay) => {
        const [debouncedValue, setDebouncedValue] = useState(value);
        useEffect(() => {
            const handler = setTimeout(() => setDebouncedValue(value), delay);
            return () => clearTimeout(handler);
        }, [value, delay]);
        return debouncedValue;
    };
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearchTerm) {
            setLoadingSearch(true);
            setSearchError('');
            const companyId = loggedInUserInfo?.company?._id;
            console.log('UserSearchModal: companyId for search:', companyId);
            if (companyId) {
                console.log("Mock API: Searching users for:", debouncedSearchTerm, "in company:", companyId);
                setTimeout(() => {
                    let mockUsers = [
                        { _id: 'mockUserId123', firstName: 'Test', lastName: 'User', email: 'test@example.com' },
                        { _id: 'mockUserId456', firstName: 'Another', lastName: 'Person', email: 'another@example.com'},
                        { _id: 'knownUserId789', firstName: 'Known', lastName: 'Contact', email: 'known@example.com'}
                    ];
                    // Filtering logic
                    setSearchResults(mockUsers.filter(u => (u.firstName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || u.lastName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) && u._id !== currentUserId ));
                    setLoadingSearch(false);
                }, 500);
            } else {
                setSearchResults([]); setLoadingSearch(false);
            }
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchTerm, currentUserId, loggedInUserInfo]);

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
                        {searchResults.length > 0 ? (<ul className="list-group">{searchResults.map(user => (<li key={user._id} className="list-group-item list-group-item-action" onClick={() => handleSelect(user)} style={{cursor: 'pointer'}}>{user.firstName} {user.lastName} ({user.email})</li>))}</ul>) : (!loadingSearch && debouncedSearchTerm && <p>No users found matching "{debouncedSearchTerm}".</p>)}
                        {!loadingSearch && !debouncedSearchTerm && <p className="text-muted">Start typing to search for users in your company.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
