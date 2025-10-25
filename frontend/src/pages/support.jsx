import React, { useState } from 'react';
import './support.css';

function Support() {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I track my order?",
      answer: "You can track your order by logging into your account and visiting the 'My Orders' section. You'll receive tracking updates via email and SMS."
    },
    {
      id: 2,
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for most items. Products must be unused and in original packaging. Some items may have different return conditions."
    },
    {
      id: 3,
      question: "How can I contact customer service?",
      answer: "You can reach our customer service team via live chat, email at support@ecomm.com, or call us at 1-800-ECOMM-1. We're available 24/7."
    },
    {
      id: 4,
      question: "Do you ship internationally?",
      answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. You can check availability during checkout."
    },
    {
      id: 5,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers."
    }
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="support-container">
      <div className="support-hero">
        <div className="hero-content">
          <h1>How can we help you?</h1>
          <p>Find answers to common questions or get in touch with our support team</p>
          <div className="search-box">
            <input type="text" placeholder="Search for help..." />
            <button className="search-btn">Search</button>
          </div>
        </div>
      </div>

      <div className="support-content">
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </button>
          <button 
            className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            Contact Us
          </button>
          <button 
            className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'faq' && (
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <div key={faq.id} className="faq-item">
                    <div 
                      className="faq-question"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <h3>{faq.question}</h3>
                      <span className={`faq-icon ${expandedFaq === faq.id ? 'expanded' : ''}`}>
                        {expandedFaq === faq.id ? '−' : '+'}
                      </span>
                    </div>
                    {expandedFaq === faq.id && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="contact-section">
              <h2>Get in Touch</h2>
              <div className="contact-grid">
                <div className="contact-form">
                  <h3>Send us a message</h3>
                  <form>
                    <div className="form-group">
                      <label>Name</label>
                      <input type="text" placeholder="Your full name" />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" placeholder="your.email@example.com" />
                    </div>
                    <div className="form-group">
                      <label>Subject</label>
                      <select>
                        <option>Select a topic</option>
                        <option>Order Issues</option>
                        <option>Returns & Refunds</option>
                        <option>Product Questions</option>
                        <option>Technical Support</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea rows="5" placeholder="Describe your issue or question..."></textarea>
                    </div>
                    <button type="submit" className="submit-btn">Send Message</button>
                  </form>
                </div>
                <div className="contact-info">
                  <h3>Other ways to reach us</h3>
                  <div className="contact-methods">
                    <div className="contact-method">
                      <div className="method-icon">📞</div>
                      <div className="method-details">
                        <h4>Phone Support</h4>
                        <p>1-800-ECOMM-1</p>
                        <span>24/7 Available</span>
                      </div>
                    </div>
                    <div className="contact-method">
                      <div className="method-icon">✉️</div>
                      <div className="method-details">
                        <h4>Email Support</h4>
                        <p>support@ecomm.com</p>
                        <span>Response within 24h</span>
                      </div>
                    </div>
                    <div className="contact-method">
                      <div className="method-icon">💬</div>
                      <div className="method-details">
                        <h4>Live Chat</h4>
                        <p>Chat with us now</p>
                        <span>Instant response</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="resources-section">
              <h2>Helpful Resources</h2>
              <div className="resources-grid">
                <div className="resource-card">
                  <div className="resource-icon">📖</div>
                  <h3>User Guide</h3>
                  <p>Learn how to use our platform effectively</p>
                  <button className="resource-btn">Read Guide</button>
                </div>
                <div className="resource-card">
                  <div className="resource-icon">📋</div>
                  <h3>Order Status</h3>
                  <p>Check the status of your current orders</p>
                  <button className="resource-btn">Track Order</button>
                </div>
                <div className="resource-card">
                  <div className="resource-icon">🔄</div>
                  <h3>Return Center</h3>
                  <p>Start a return or exchange process</p>
                  <button className="resource-btn">Start Return</button>
                </div>
                <div className="resource-card">
                  <div className="resource-icon">📱</div>
                  <h3>Mobile App</h3>
                  <p>Download our mobile app for better experience</p>
                  <button className="resource-btn">Download</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Support; 