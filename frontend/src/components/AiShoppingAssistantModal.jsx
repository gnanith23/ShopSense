import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, ShoppingBag, Check, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../api/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

const PRESET_PROMPTS = [
  'Best keyboard for gaming',
  'What electronics are available under ₹500?',
  'Top recommended products currently in stock',
  'Show me shirts or clothing',
];

export default function AiShoppingAssistantModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your ShopSense RAG AI Shopping Assistant. Ask me anything about our product catalog, specifications, or price recommendations!',
      products: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  async function handleSend(queryToSend) {
    const q = queryToSend || inputQuery;
    if (!q || !q.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/shopping-assistant', { query: q.trim() });
      const aiMessage = {
        sender: 'ai',
        text: res.data.answer,
        products: res.data.retrievedProducts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Shopping assistant error:', err);
      const errorMessage = {
        sender: 'ai',
        text: 'Sorry, I encountered an issue retrieving recommendations. Please try again.',
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#FFFFFF', width: '100%', maxWidth: '640px', maxHeight: '90vh',
        borderRadius: '16px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        border: '1px solid #E2E8F0'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>AI Shopping Assistant</div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.9 }}>
                RAG-Powered Grounded Product Recommendations
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div style={{
          padding: '0.625rem 1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
          display: 'flex', gap: '0.35rem', overflowX: 'auto'
        }}>
          {PRESET_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                padding: '3px 9px', borderRadius: 999, border: '1px solid #E2E8F0',
                background: '#FFFFFF', fontSize: '0.6875rem', color: '#4F46E5', fontWeight: 500,
                whiteSpace: 'nowrap', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3
              }}
            >
              <Sparkles size={10} />
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat message body */}
        <div style={{
          flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem',
          minHeight: '320px', maxHeight: '50vh', background: '#F8FAFC'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '0.35rem'
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '0.75rem 1rem',
                borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.sender === 'user' ? '#4F46E5' : '#FFFFFF',
                color: msg.sender === 'user' ? '#FFFFFF' : '#1E293B',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                whiteSpace: 'pre-line'
              }}>
                {msg.text}
              </div>

              {/* Retrieved Product Cards if any */}
              {msg.products && msg.products.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem', width: '100%', maxWidth: '90%', marginTop: '0.25rem'
                }}>
                  {msg.products.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: '#FFFFFF', padding: '0.75rem', borderRadius: 8,
                        border: '1px solid #C7D2FE', display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', gap: '0.35rem'
                      }}
                    >
                      <div>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2
                        }}>
                          <span style={{
                            fontSize: '0.625rem', fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase'
                          }}>
                            {p.category}
                          </span>
                          <span style={{
                            fontSize: '0.625rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                            background: '#F0FDF4', color: '#166534'
                          }}>
                            {p.stock} in stock
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                          {p.name}
                        </div>
                        <div style={{
                          fontSize: '0.6875rem', color: '#64748B', marginTop: 3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {p.description}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
                        paddingTop: 4, borderTop: '1px solid #F1F5F9'
                      }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(p.price)}
                        </div>
                        <span style={{ fontSize: '0.625rem', color: '#6366F1', fontWeight: 600 }}>
                          Grounded Match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <span style={{ fontSize: '0.625rem', color: '#94A3B8', margin: '0 4px' }}>
                {msg.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4F46E5', fontSize: '0.75rem' }}>
              <Bot size={16} className="animate-spin" />
              <span>Retrieving relevant products and grounding response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '0.75rem 1rem', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask about products, specs, budget (e.g. Best laptop under ₹80000)..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            style={{ flex: 1, fontSize: '0.8125rem' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            style={{
              padding: '0 1rem', background: '#4F46E5', color: 'white',
              border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
              cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !inputQuery.trim() ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            <Send size={15} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
