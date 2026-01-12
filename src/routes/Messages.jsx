import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUserConversations,
  getConversation,
  sendMessage,
  markConversationAsRead,
  subscribeToConversation,
} from "../services/messages.api";
import { formatRelativeTime } from "../lib/dateUtils";
import { getUserByUsername } from "../lib/queries";

export default function Messages() {
  const { username } = useParams(); // אם יש username בURL, פתח שיחה איתו
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // טעינת רשימת שיחות
  useEffect(() => {
    if (!userProfile?.uid) return;

    loadConversations();
  }, [userProfile]);

  // אם יש username בURL, פתח שיחה איתו
  useEffect(() => {
    if (!username || !userProfile) return;

    openConversationByUsername(username);
  }, [username, userProfile]);

  // האזנה בזמן אמת לשיחה נבחרת
  useEffect(() => {
    if (!selectedConversation || !userProfile) return;

    const unsubscribe = subscribeToConversation(
      userProfile.uid,
      selectedConversation.otherUserId,
      (msgs) => {
        setMessages(msgs);
        scrollToBottom();
        
        // סמן כנקרא
        markConversationAsRead(userProfile.uid, selectedConversation.otherUserId);
      }
    );

    return unsubscribe;
  }, [selectedConversation, userProfile]);

  const loadConversations = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      const convs = await getUserConversations(userProfile.uid);
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const openConversationByUsername = async (username) => {
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        alert("משתמש לא נמצא");
        return;
      }

      // בדוק אם כבר יש שיחה
      const existing = conversations.find((c) => c.otherUserId === user.uid);
      
      if (existing) {
        setSelectedConversation(existing);
      } else {
        // יצירת שיחה חדשה (רק הגדרה מקומית)
        setSelectedConversation({
          conversationId: [userProfile.uid, user.uid].sort().join("_"),
          otherUserId: user.uid,
          otherUsername: user.username,
          otherAvatar: user.avatarUrl || null,
          lastMessage: null,
          unreadCount: 0,
        });
      }
    } catch (error) {
      console.error("Error opening conversation:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      await sendMessage({
        senderId: userProfile.uid,
        senderUsername: userProfile.username,
        senderAvatar: userProfile.avatarUrl,
        receiverId: selectedConversation.otherUserId,
        receiverUsername: selectedConversation.otherUsername,
        text: messageText.trim(),
      });

      setMessageText("");
      await loadConversations(); // רענון רשימת השיחות
    } catch (error) {
      console.error("Error sending message:", error);
      alert("שגיאה בשליחת ההודעה");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!userProfile) {
    return (
      <div className="container py-5 text-center">
        <h3>נדרשת התחברות</h3>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/login")}
        >
          התחבר
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3" style={{ height: "calc(100vh - 80px)" }}>
      <div className="row h-100">
        {/* Conversations Sidebar */}
        <div className="col-md-4 col-lg-3 h-100 border-end">
          <div className="d-flex flex-column h-100">
            <h5 className="mb-3">💬 הודעות</h5>

            {loading ? (
              <div className="text-center py-5">טוען...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize: "3rem" }}>📭</div>
                <p>אין שיחות עדיין</p>
              </div>
            ) : (
              <div className="flex-grow-1 overflow-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    className={`p-3 border-bottom ${
                      selectedConversation?.conversationId === conv.conversationId
                        ? "bg-light"
                        : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="d-flex gap-2">
                      <img
                        src={
                          conv.otherAvatar || "https://placehold.co/40x40?text=👤"
                        }
                        alt={conv.otherUsername}
                        className="rounded-circle"
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                      />
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start">
                          <strong>@{conv.otherUsername}</strong>
                          {conv.unreadCount > 0 && (
                            <span className="badge bg-primary rounded-pill">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <div>
                            <small className="text-muted text-truncate d-block">
                              {conv.lastMessage.text}
                            </small>
                            <small className="text-muted">
                              {formatRelativeTime(conv.lastMessage.createdAt)}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-md-8 col-lg-9 h-100">
          {selectedConversation ? (
            <div className="d-flex flex-column h-100">
              {/* Chat Header */}
              <div className="p-3 border-bottom bg-light">
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={
                      selectedConversation.otherAvatar ||
                      "https://placehold.co/40x40?text=👤"
                    }
                    alt={selectedConversation.otherUsername}
                    className="rounded-circle"
                    style={{ width: "40px", height: "40px", objectFit: "cover" }}
                  />
                  <strong>@{selectedConversation.otherUsername}</strong>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-grow-1 overflow-auto p-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <p>אין הודעות בשיחה זו עדיין</p>
                    <p>התחל שיחה!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === userProfile.uid;
                    return (
                      <div
                        key={idx}
                        className={`d-flex mb-3 ${
                          isMe ? "justify-content-end" : "justify-content-start"
                        }`}
                      >
                        {!isMe && (
                          <img
                            src={
                              msg.senderAvatar ||
                              "https://placehold.co/30x30?text=👤"
                            }
                            alt={msg.senderUsername}
                            className="rounded-circle me-2"
                            style={{
                              width: "30px",
                              height: "30px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div
                          className={`px-3 py-2 rounded ${
                            isMe
                              ? "bg-primary text-white"
                              : "bg-light text-dark"
                          }`}
                          style={{ maxWidth: "70%" }}
                        >
                          <p className="mb-1" style={{ whiteSpace: "pre-wrap" }}>
                            {msg.text}
                          </p>
                          <small
                            className={isMe ? "text-white-50" : "text-muted"}
                            style={{ fontSize: "0.75rem" }}
                          >
                            {formatRelativeTime(msg.createdAt)}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-top">
                <form onSubmit={handleSendMessage}>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="כתוב הודעה..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sending}
                      maxLength={1000}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!messageText.trim() || sending}
                    >
                      {sending ? "שולח..." : "שלח"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
              <div className="text-center">
                <div style={{ fontSize: "5rem" }}>💬</div>
                <p>בחר שיחה כדי להתחיל</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
