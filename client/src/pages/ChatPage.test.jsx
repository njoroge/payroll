import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import ChatPage from './ChatPage';
import { useAuth } from '../store/authContext'; // Will be mocked
import api from '../services/api'; // Will be mocked
import io from 'socket.io-client'; // Will be mocked

// --- Mocks ---
// Explicitly mock '../store/authContext'
vi.mock('../store/authContext', () => ({
  useAuth: vi.fn(), // This will be configured in beforeEach
  AuthProvider: ({ children }) => <>{children}</>, // Minimal valid React component
}));

vi.mock('../services/api');

// Mock socket.io-client
const mockSocketInstance = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'mockSocketId123',
  connect: vi.fn(), // Added connect mock
};
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocketInstance),
}));

const mockUserInfo = {
  _id: 'user123',
  employee: { _id: 'emp123', firstName: 'Test', lastName: 'User' }, // Added names here
  token: 'fake-token',
  firstName: 'Test',
  lastName: 'User',
  company: { _id: 'comp456', name: 'Test Company' }, // Added company info
  personalEmail: 'test@example.com', // Added email
};

// Helper function to get the latest 'newMessage' callback registered on the mock socket
const getNewMessageCallback = () => {
  const call = mockSocketInstance.on.mock.calls.find(c => c[0] === 'newMessage');
  return call ? call[1] : null;
};

// Helper function to get the latest 'newConversation' callback registered on the mock socket
const getNewConversationCallback = () => {
    const call = mockSocketInstance.on.mock.calls.find(c => c[0] === 'newConversation');
    return call ? call[1] : null;
};


describe('ChatPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Setup useAuth mock
    useAuth.mockReturnValue({ userInfo: mockUserInfo, loading: false });

    // Setup api mock
    api.get = vi.fn((url) => {
      if (url.includes('/messages/conversations') && !url.includes('/messages')) {
        return Promise.resolve({ data: [{ _id: 'conv1', name: 'General', type: 'group', participants: [{_id: mockUserInfo.employee._id}], lastMessage: { createdAt: new Date().toISOString(), content: "Hello" } }] });
      }
      if (url.includes('/messages')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/employees/search')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unhandled API GET request: ${url}`));
    });
    api.post = vi.fn(() => Promise.resolve({ data: {} }));
    api.put = vi.fn(() => Promise.resolve({ data: {} }));
    api.defaults = { baseURL: 'http://localhost:5001/api' };

    // Setup socket.io-client mock
    io.mockReturnValue(mockSocketInstance);

    // Mock console.warn and console.error to avoid cluttering test output
    // vi.spyOn(console, 'warn').mockImplementation(() => {});
    // vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // vi.restoreAllMocks(); // Restore console mocks if they were used
  });

  test('renders loading state initially if auth is loading', () => {
    useAuth.mockReturnValueOnce({ userInfo: null, loading: true });
    render(<ChatPage />);
    expect(screen.getByText(/Loading user information.../i)).toBeInTheDocument();
  });

  test('renders user info not available if auth loaded but no user info', () => {
    useAuth.mockReturnValueOnce({ userInfo: null, loading: false });
    render(<ChatPage />);
    expect(screen.getByText(/User information not available. You might need to log in./i)).toBeInTheDocument();
  });

  test('renders chat interface when user is authenticated', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText('Messaging')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });
  });

  test('clears input field after sending a message', async () => {
    render(<ChatPage />);

    await waitFor(() => { // Ensure conversations are loaded and component is stable
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    // Simulate selecting the "General" conversation
    fireEvent.click(screen.getByText('General'));

    await waitFor(() => { // Wait for messages for "General" to be "loaded" (even if empty)
        expect(screen.getByText(/No messages in this conversation yet. Say hi!/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello there' } });
    expect(input.value).toBe('Hello there');

    fireEvent.click(sendButton);

    // The input should clear immediately due to direct `setNewMessage('')` in `handleSendMessage`
    await waitFor(() => {
      expect(input.value).toBe('');
    });

    // Also verify socket.emit was called for 'sendMessage'
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'sendMessage',
        expect.objectContaining({ content: 'Hello there', conversationId: 'conv1' })
    );
  });

  test('shows notification for new message from another user and it disappears', async () => {
    vi.useFakeTimers();
    render(<ChatPage />);

    await waitFor(() => expect(mockSocketInstance.on).toHaveBeenCalledWith('newMessage', expect.any(Function)));

    const newMessageCallback = getNewMessageCallback();
    expect(newMessageCallback).not.toBeNull();

    act(() => {
      if (newMessageCallback) {
        newMessageCallback({
          message: {
            _id: 'msg1',
            senderId: { _id: 'otherUserEmp1', firstName: 'Other' },
            content: 'Hello from other user',
            conversationId: 'conv1', // Assume it's for the currently selected/first conversation
            contentType: 'text',
            createdAt: new Date().toISOString(),
          },
          conversation: {
            _id: 'conv1',
            participants: [{_id: 'otherUserEmp1'}, {_id: mockUserInfo.employee._id}],
            lastMessage: { content: 'Hello from other user', createdAt: new Date().toISOString()}
          }
        });
      }
    });

    const notification = await screen.findByText(/New message from Other: Hello from other user.../i);
    expect(notification).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText(/New message from Other: Hello from other user.../i)).not.toBeInTheDocument();
    });
    vi.useRealTimers();
  });

  test('does not show notification for own message', async () => {
    render(<ChatPage />);

    await waitFor(() => expect(mockSocketInstance.on).toHaveBeenCalledWith('newMessage', expect.any(Function)));
    const newMessageCallback = getNewMessageCallback();
    expect(newMessageCallback).not.toBeNull();

    act(() => {
      if (newMessageCallback) {
        newMessageCallback({
          message: {
            _id: 'msg2',
            senderId: { _id: mockUserInfo.employee._id, firstName: 'Test' }, // Own user ID
            content: 'This is my own message',
            conversationId: 'conv1',
            contentType: 'text',
            createdAt: new Date().toISOString(),
          },
          conversation: {
             _id: 'conv1',
             participants: [{_id: mockUserInfo.employee._id}],
             lastMessage: { content: 'This is my own message', createdAt: new Date().toISOString()}
          }
        });
      }
    });

    // Wait a bit to ensure no notification appears
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.queryByText(/New message from Test: This is my own message.../i)).not.toBeInTheDocument();
  });

  test('aligns sent messages to flex-end and received messages to flex-start', async () => {
    // Mock API to return one sent and one received message for a specific conversation
    api.get = vi.fn((url) => {
      if (url.includes('/messages/conversations/conv1/messages')) {
        return Promise.resolve({
          data: [
            { _id: 'msg1', senderId: { _id: mockUserInfo.employee._id }, content: 'My message', contentType: 'text', createdAt: new Date().toISOString() },
            { _id: 'msg2', senderId: { _id: 'otherUserEmp2', firstName: 'Jane' }, content: 'Other message', contentType: 'text', createdAt: new Date().toISOString() },
          ],
        });
      }
      if (url.includes('/messages/conversations') && !url.includes('/messages')) {
         return Promise.resolve({ data: [{ _id: 'conv1', name: 'General', type: 'group', participants: [{_id: mockUserInfo.employee._id}, { _id: 'otherUserEmp2'}], lastMessage: {content: "Other message"} }] });
      }
      return Promise.reject(new Error(`Unhandled API GET request: ${url}`));
    });

    render(<ChatPage />);

    // Wait for "General" conversation to load and click it
    const generalConversation = await screen.findByText('General');
    fireEvent.click(generalConversation);

    // Check for messages and their alignment
    const myMessage = await screen.findByText('My message');
    const otherMessage = await screen.findByText('Other message');

    // Message container is the grandparent of the text content, typically.
    // div (key, style) -> div (style, content) -> strong, p (text)
    // We need to find the div that has 'display: flex'
    const myMessageContainer = myMessage.closest('div[style*="display: flex"]');
    const otherMessageContainer = otherMessage.closest('div[style*="display: flex"]');

    expect(myMessageContainer).toHaveStyle('justify-content: flex-end');
    expect(otherMessageContainer).toHaveStyle('justify-content: flex-start');
  });

  test('New chat button opens user search modal', async () => {
    render(<ChatPage />);
    const newChatButton = await screen.findByRole('button', { name: /new chat/i });
    fireEvent.click(newChatButton);
    expect(await screen.findByText('Start New Chat')).toBeInTheDocument();
  });

});
