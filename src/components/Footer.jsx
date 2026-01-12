import React from 'react';
import '../styles/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Punkontrol</h4>
          <p>פלטפורמה לשיתוף אמנות וקהילה יצירתית</p>
        </div>
        
        <div className="footer-section">
          <h4>קישורים</h4>
          <ul>
            <li><a href="/">בית</a></li>
            <li><a href="/feed">פיד</a></li>
            <li><a href="/search">חיפוש</a></li>
            <li><a href="/upload">העלאה</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>קהילה</h4>
          <ul>
            <li><a href="/about">אודות</a></li>
            <li><a href="/terms">תנאי שימוש</a></li>
            <li><a href="/privacy">מדיניות פרטיות</a></li>
            <li><a href="/contact">צור קשר</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} Punkontrol. כל הזכויות שמורות.</p>
      </div>
    </footer>
  );
}
