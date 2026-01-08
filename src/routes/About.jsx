import React from 'react';
import '../styles/StaticPages.css';

export default function About() {
  return (
    <div className="static-page">
      <div className="static-page-container">
        <h1>אודות Punkontrol</h1>
        
        <section className="page-section">
          <h2>מי אנחנו?</h2>
          <p>
            Punkontrol היא פלטפורמה ייחודית לשיתוף אמנות ויצירה, שנועדה לאפשר לאמנים 
            מכל הסוגים להציג את יצירותיהם, להתחבר לקהילה תוססת ולקבל השראה מאמנים אחרים.
          </p>
        </section>

        <section className="page-section">
          <h2>החזון שלנו</h2>
          <p>
            אנחנו מאמינים שאמנות היא כוח משנה שמחבר בין אנשים ותרבויות. המטרה שלנו 
            היא ליצור מרחב בטוח, פתוח וכולל שבו כל אמן יכול למצוא את הקול שלו ולהתפתח.
          </p>
          <ul className="feature-list">
            <li>🎨 פלטפורמה פתוחה לכל סוגי האמנות</li>
            <li>🤝 קהילה תומכת ומעודדת</li>
            <li>🌟 הזדמנויות לצמיחה והתפתחות</li>
            <li>🔒 שמירה על זכויות היוצרים</li>
          </ul>
        </section>

        <section className="page-section">
          <h2>מה אנחנו מציעים?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>גלריה אישית</h3>
              <p>כל משתמש יכול ליצור גלריה אישית ולהציג את יצירותיו בצורה מקצועית</p>
            </div>
            <div className="feature-card">
              <h3>פיד מותאם אישית</h3>
              <p>פיד חכם המציג תוכן רלוונטי על בסיס העדפות והתחומים שאתם אוהבים</p>
            </div>
            <div className="feature-card">
              <h3>אינטראקציה חברתית</h3>
              <p>לייק, תגובות ומעקב אחרי האמנים האהובים עליכם</p>
            </div>
            <div className="feature-card">
              <h3>קטגוריות מגוונות</h3>
              <p>ציור, פיסול, צילום, אמנות דיגיטלית ועוד...</p>
            </div>
          </div>
        </section>

        <section className="page-section">
          <h2>הצטרפו אלינו</h2>
          <p>
            בין אם אתם אמנים מקצועיים, חובבים או פשוט אוהבי אמנות - יש לכם מקום ב-Punkontrol.
            הצטרפו לקהילה שלנו והתחילו לשתף את היצירתיות שלכם היום!
          </p>
        </section>
      </div>
    </div>
  );
}
