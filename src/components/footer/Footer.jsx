import React, { useEffect, useRef } from 'react';
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";
import { Link } from 'react-router-dom'; // استيراد كائن التوجيه الديناميكي
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Footer.css'; 

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // حركة الأعمدة عند التمرير
      gsap.from('.footer-col', {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 85%',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
      
      // حركة الشريط السفلي
      gsap.from('.footer-bottom-anim', {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 95%',
        },
        opacity: 0,
        duration: 1,
        delay: 0.5,
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="footer-wrapper">
      {/* توهج النيون */}
      <div className="footer-neon-glow"></div>

      <div className="footer-container">
        <div className="footer-grid">
          
          {/* العمود الأول */}
          <div className="footer-col">
            <div className="footer-brand">
              <div className="nav-logo-icon">
                <span style={{ color: '#000', fontWeight: '900', fontSize: '1.25rem', fontStyle: 'italic' }}>G</span>
              </div>
              <span className="nav-logo-text">Grinta</span>
            </div>
            <p className="footer-desc">
              منصة الجرينتا الرياضية. وجهتك الأولى والموثوقة لتغطية حية للمباريات، إحصائيات دقيقة، وتحليلات معمقة تضعك في قلب الحدث الكروي لحظة بلحظة.
            </p>
            <div className="social-links">
              <SocialIcon icon={<FaFacebook size={18} />} url="https://facebook.com" />
              <SocialIcon icon={<FaTwitter size={18} />} url="https://twitter.com" />
              <SocialIcon icon={<FaInstagram size={18} />} url="https://instagram.com" />
              <SocialIcon icon={<FaYoutube size={18} />} url="https://youtube.com" />
            </div>
          </div>

          {/* العمود الثاني - الروابط السريعة */}
          <div className="footer-col">
            <h3 className="footer-col-title">روابط سريعة</h3>
            <ul className="footer-links-list">
              <FooterLink title="المباريات والنتائج" to="/matches" />
              <FooterLink title="أحدث الأخبار" to="/news" />
              <FooterLink title="ملخصات الفيديو" to="/videos" />
              <FooterLink title="جدول الترتيب" to="/standings" />
              <FooterLink title="إحصائيات البطولات" to="/stats" />
            </ul>
          </div>

          {/* العمود الثالث - الصفحات الثابتة والقانونية */}
          <div className="footer-col">
            <h3 className="footer-col-title">جرينتا</h3>
            <ul className="footer-links-list">
              <FooterLink title="من نحن" to="/about" />
              <FooterLink title="اتصل بنا" to="/contact" />
              <FooterLink title="سياسة الخصوصية" to="/privacy" />
              <FooterLink title="الشروط والأحكام" to="/terms" />
            </ul>
          </div>

          {/* العمود الرابع */}
          <div className="footer-col">
            <h3 className="footer-col-title">النشرة الرياضية</h3>
            <p className="footer-desc">
              اشترك الآن ليصلك ملخص لأهم الأحداث وأهداف المباريات الكبرى مباشرة إلى بريدك.
            </p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="بريدك الإلكتروني..." 
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-btn">
                اشتراك
              </button>
            </form>
          </div>

        </div>

        {/* الحقوق */}
        <div className="footer-bottom footer-bottom-anim">
          <p className="copyright">
            © {new Date().getFullYear()} <span className="brand-highlight">GRINTA</span>. جميع الحقوق محفوظة.
          </p>
          <div className="footer-credits">
            <span>صُنع بشغف لعشاق كرة القدم</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// تحديث المكون الفرعي ليدعم التوجيه الداخلي السلس دون كسر أنيميشن السيرفر والـ CSS
const FooterLink = ({ title, to }) => (
  <li className="footer-link-item">
    <Link to={to}>
      <span className="link-indicator"></span>
      {title}
    </Link>
  </li>
);

// تحديث مكون أيقونات التواصل لتدعم روابط خارجية حقيقية
const SocialIcon = ({ icon, url }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="social-icon">
    {icon}
  </a>
);

export default Footer;