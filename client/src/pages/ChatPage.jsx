import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/authContext'; // For user info and token
import api from '../services/api'; // For REST API calls (fetching initial data)
import io from 'socket.io-client'; // For WebSocket connection

const ChatPage = () => {
    const { userInfo } = useAuth();
    const [socket, setSocket] = useState(null);

    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const [loadingConversations, setLoadingConversations] = useState(false);
    const [errorConversations, setErrorConversations] = useState(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [errorMessages, setErrorMessages] = useState(null);

    const previousConversationIdRef = useRef(null);
    const messagesEndRef = useRef(null); // For scrolling to bottom

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]); // Scroll whenever messages change

    // Format timestamp for display
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

    // Effect for establishing and managing WebSocket connection
    useEffect(() => {
        if (userInfo && userInfo.token) {
            const newSocket = io('/', {
                auth: { token: userInfo.token }
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });
            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                setErrorConversations('Failed to connect to messaging service. Please try refreshing.');
            });
            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });

            newSocket.on('sendMessageError', (errorData) => {
                console.error('Error sending message:', errorData.message);
                alert(`Message error: ${errorData.message}`);
            });

            newSocket.on('newMessage', ({ message, conversation: updatedConversation }) => {
                console.log('New message received:', message);

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
                console.log('New conversation event received on client:', newConversation);
                setConversations(prevConversations => {
                    if (prevConversations.find(c => c._id === newConversation._id)) {
                        return prevConversations.map(c => c._id === newConversation._id ? newConversation : c);
                    }
                    return [newConversation, ...prevConversations];
                });
            });

            return () => {
                console.log('Disconnecting socket and cleaning up listeners...');
                newSocket.off('connect');
                newSocket.off('connect_error');
                newSocket.off('disconnect');
                newSocket.off('sendMessageError');
                newSocket.off('newMessage');
                newSocket.off('newConversation');
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [userInfo]);

    // Effect to fetch initial conversations (REST API)
    useEffect(() => {
        if (!userInfo || !socket) return;

        setLoadingConversations(true);
        api.get('/messages/conversations')
            .then(response => {
                setConversations(response.data || []);
            })
            .catch(err => {
                console.error("Error fetching conversations:", err);
                setErrorConversations(err.response?.data?.message || "Failed to fetch conversations.");
            })
            .finally(() => {
                setLoadingConversations(false);
            });
    }, [userInfo, socket]);

    // Effect to fetch messages when selectedConversationId changes (REST API)
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
                    .then(response => {
                        setMessages(response.data || []);
                    })
                    .catch(err => {
                        console.error(`Error fetching messages for ${selectedConversationId}:`, err);
                        setErrorMessages(err.response?.data?.message || "Failed to fetch messages.");
                    })
                    .finally(() => {
                        setLoadingMessages(false);
                    });
            } else {
                setMessages([]);
            }
            previousConversationIdRef.current = selectedConversationId;
        }
    }, [selectedConversationId, socket]);


    const handleSelectConversation = (conversationId) => {
        if (selectedConversationId === conversationId) return;
        setSelectedConversationId(conversationId);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !selectedConversationId) {
            if (!selectedConversationId) alert("Please select a conversation to send a message.");
            return;
        }
        socket.emit('sendMessage', {
            conversationId: selectedConversationId,
            content: newMessage.trim(),
        });
    };

    const getParticipantNames = (participants) => {
        if (!userInfo || !participants) return 'N/A';
        const otherParticipants = participants.filter(p => p._id !== userInfo.employee?._id);
        if (otherParticipants.length === 0 && participants.length > 0) {
             return participants[0]?.firstName || participants[0]?.email || 'Self';
        }
        return otherParticipants.map(p => p.firstName || p.email).join(', ') || 'Unknown User';
    };

    return (
        <div className="container-fluid mt-3" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <h3>Messaging</h3>
            <div style={{ display: 'flex', flexGrow: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Conversations Sidebar */}
                <div style={{ width: '300px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
                    <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                        <h5>Conversations</h5>
                    </div>
                    <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                        {loadingConversations && <p className="p-2">Loading conversations...</p>}
                        {errorConversations && <p className="text-danger p-2">{errorConversations}</p>}
                        {!loadingConversations && !errorConversations && conversations.length === 0 && (
                            <p className="p-2">No conversations yet.</p>
                        )}
                        {conversations.map(conv => (
                            <div
                                key={conv._id}
                                onClick={() => handleSelectConversation(conv._id)}
                                style={{
                                    padding: '10px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: selectedConversationId === conv._id ? '#e9ecef' : 'transparent'
                                }}
                                title={conv.participants?.map(p => p.email).join(', ')}
                            >
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <strong className="text-truncate" style={{maxWidth: '180px'}}>{getParticipantNames(conv.participants)}</strong>
                                    <small className="text-muted" style={{fontSize: '0.75em'}}>
                                        {conv.lastMessage ? formatTimestamp(conv.lastMessage.createdAt) : formatTimestamp(conv.updatedAt)}
                                    </small>
                                </div>
                                <small className="d-block text-muted text-truncate" style={{fontSize: '0.85em'}}>
                                    {conv.lastMessage ?
                                     `${conv.lastMessage.senderId?._id === userInfo.employee?._id ? 'You: ' : ''}${conv.lastMessage.content}`
                                     : 'No messages yet'}
                                </small>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {selectedConversationId ? (
                        <>
                            <div style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f8f9fa' }}>
                                <h5>
                                    Chat with {
                                        getParticipantNames(conversations.find(c=>c._id === selectedConversationId)?.participants)
                                    }
                                </h5>
                            </div>
                            <div style={{ overflowY: 'auto', flexGrow: 1, padding: '10px' }}>
                                {loadingMessages && <p>Loading messages...</p>}
                                {errorMessages && <p className="text-danger">{errorMessages}</p>}
                                {messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        style={{
                                            marginBottom: '10px',
                                            textAlign: msg.senderId?._id === userInfo.employee?._id ? 'right' : 'left'
                                        }}
                                    >
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '8px 12px',
                                            borderRadius: '15px',
                                            backgroundColor: msg.senderId?._id === userInfo.employee?._id ? '#007bff' : '#e9ecef',
                                            color: msg.senderId?._id === userInfo.employee?._id ? 'white' : 'black',
                                            maxWidth: '70%',
                                            wordWrap: 'break-word'
                                        }}>
                                            <strong>{msg.senderId?._id === userInfo.employee?._id ? 'You' : (msg.senderId?.firstName || 'Sender')}:</strong>
                                            <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{msg.content}</p>
                                            <small className="text-muted" style={{fontSize: '0.75rem', display: 'block', marginTop: '4px'}}>
                                                {formatTimestamp(msg.createdAt)}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                                {!loadingMessages && messages.length === 0 && !errorMessages && <p>No messages in this conversation yet. Say hi!</p>}
                                <div ref={messagesEndRef} />
                            </div>
                            <div style={{ padding: '10px', borderTop: '1px solid #ccc', background: '#f8f9fa' }}>
                                <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
                                    <input
                                        type="text"
                                        className="form-control me-2"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        disabled={!socket}
                                    />
                                    <button type="submit" className="btn btn-primary" disabled={!socket || !newMessage.trim()}>Send</button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#aaa' }}>
                            <p>Select or start a conversation to begin messaging.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
