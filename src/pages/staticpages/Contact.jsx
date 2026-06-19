import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './StaticPages.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // سيتم ربطها لاحقاً بـ API دجانغو لإرسال الرسالة
    alert('تم إرسال رسالتك بنجاح. سنتواصل معك قريباً!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="static-page-layout">
      <Navbar />
      
      <header className="static-hero animate-fade-in">
        <div className="static-hero-icon"><Mail size={40} /></div>
        <h1>اتصل بنا</h1>
        <p>نحن هنا للاستماع إليك. سواء كان لديك استفسار، اقتراح، أو واجهت مشكلة، لا تتردد في مراسلتنا.</p>
      </header>

      <main className="static-content-wrapper animate-slide-up">
        <div className="contact-grid">
          
          {/* معلومات التواصل */}
          <div className="contact-info-cards">
            <div className="contact-card">
              <div className="contact-card-icon"><MapPin size={24} /></div>
              <div>
                <h3>المقر الرئيسي</h3>
                <p>أسيوط، جمهورية مصر العربية</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon"><Mail size={24} /></div>
              <div>
                <h3>البريد الإلكتروني</h3>
                <p>support@grinta-app.com</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon"><Phone size={24} /></div>
              <div>
                <h3>رقم الهاتف</h3>
                <p>+20 100 000 0000</p>
              </div>
            </div>
          </div>

          {/* نموذج المراسلة */}
          <div className="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>الاسم الكامل</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="أدخل اسمك"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input 
                  type="email" 
                  className="form-control" 
                  required 
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>الرسالة</label>
                <textarea 
                  className="form-control" 
                  rows="5" 
                  required 
                  placeholder="كيف يمكننا مساعدتك؟"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="submit-btn flex justify-center items-center gap-2">
                إرسال الرسالة <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;