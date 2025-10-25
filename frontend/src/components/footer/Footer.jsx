import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>HP Printer Shop</h3>
          <p>Your trusted source for HP printers, ink, toner, and accessories. Quality products with excellent customer service.</p>
          <div className="social-links">
            <a href="https://facebook.com" aria-label="Facebook">📘</a>
            <a href="https://twitter.com" aria-label="Twitter">🐦</a>
            <a href="https://instagram.com" aria-label="Instagram">📷</a>
            <a href="https://linkedin.com" aria-label="LinkedIn">💼</a>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/shop">Shop</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Product Categories</h4>
          <ul>
            <li><a href="/products/laser">Laser Printers</a></li>
            <li><a href="/products/inkjet">Inkjet Printers</a></li>
            <li><a href="/products/ink">Ink & Toner</a></li>
            <li><a href="/products/accessories">Accessories</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="/support">Support</a></li>
            <li><a href="/shipping">Shipping Info</a></li>
            <li><a href="/returns">Returns</a></li>
            <li><a href="/warranty">Warranty</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p>&copy; 2024 HP Printer Shop. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;