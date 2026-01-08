import React, { useState } from 'react';
import '../styles/StaticPages.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // כאן תוסיפו את הלוגיקה לשליחת הטופס (למשל לשרת או Firebase)
    console.log('Form submitted:', formData);
    setSubmitted(true);
    
    // איפוס הטופס אחרי 3 שניות
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="static-page">
      <div className="static-page-container">
        <h1>צור קשר</h1>
        
        <section className="page-section">
          <p className="intro-text">
            יש לכם שאלה, הצעה או משוב? נשמח לשמוע מכם! 
            מלאו את הטופס למטה ונחזור אליכם בהקדם האפשרי.
          </p>
        </section>

        {submitted ? (
          <div className="success-message">
            <h2>✓ ההודעה נשלחה בהצלחה!</h2>
            <p>תודה שפניתם אלינו. נחזור אליכם בקרוב.</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">שם מלא *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="הכנס את שמך"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">אימייל *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">נושא *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">בחר נושא</option>
                <option value="general">שאלה כללית</option>
                <option value="technical">תמיכה טכנית</option>
                <option value="content">דיווח על תוכן</option>
                <option value="partnership">שיתוף פעולה</option>
                <option value="feedback">משוב והצעות</option>
                <option value="other">אחר</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">הודעה *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="כתבו את הודעתכם כאן..."
              />
            </div>

            <button type="submit" className="submit-btn">
              שלח הודעה
            </button>
          </form>
        )}

        <section className="page-section contact-info">
          <h2>דרכי התקשרות נוספות</h2>
          <div className="contact-methods">
            <div className="contact-method">
              <h3>📧 אימייל</h3>
              <p>support@punkontrol.com</p>
            </div>
            <div className="contact-method">
              <h3>💬 רשתות חברתיות</h3>
              <p>עקבו אחרינו ושלחו לנו הודעה!</p>
            </div>
            <div className="contact-method">
              <h3>⏰ זמני תגובה</h3>
              <p>אנו משיבים בדרך כלל תוך 24-48 שעות</p>
            </div>
          </div>
        </section>

        <section className="page-section">
          <h2>שאלות נפוצות</h2>
          <div className="faq">
            <div className="faq-item">
              <h3>איך אני מעלה יצירות לאתר?</h3>
              <p>לחץ על "העלאה" בתפריט העליון ועקוב אחר ההוראות.</p>
            </div>
            <div className="faq-item">
              <h3>האם השירות בחינם?</h3>
              <p>כן! Punkontrol בחינם לחלוטין לכל המשתמשים.</p>
            </div>
            <div className="faq-item">
              <h3>מי הבעלים על היצירות שאני מעלה?</h3>
              <p>אתם שומרים על כל הזכויות ליצירות שלכם. ראו את <a href="/terms">תנאי השימוש</a> לפרטים.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
