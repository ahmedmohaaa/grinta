import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Share2, User } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './NewsDetail.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const NewsDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.src = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070';
  };

  useEffect(() => {
    const fetchArticleDetails = async () => {
      // 1. استخدام البيانات الممررة من الصفحة السابقة لسرعة صاروخية (0ms)
      if (location.state && location.state.articleData) {
        setArticle(location.state.articleData);
        setLoading(false);
        window.scrollTo(0, 0);
        return;
      }

      // 2. إذا دخل الزائر عبر رابط مباشر (Direct Link) أو عمل Refresh
      try {
        const isBtolat = id.toString().startsWith('btolat-');
        const cleanId = id.toString().replace('local-', '').replace('btolat-', '');

        if (!isBtolat) {
          // جلب خبر محلي
          const res = await fetch(`${API_BASE_URL}/articles/${cleanId}/`);
          if (res.ok) {
            const data = await res.json();
            setArticle({
              title: data.title,
              content: data.content,
              published_at: data.published_at,
              image: null, 
              author: "إدارة الجرينتا",
              isScraped: false
            });
          }
        } else {
          // جلب خبر مسحوب (مخزن في السيرفر)
          const res = await fetch(`${API_BASE_URL}/proxy/btolat-news/`);
          if (res.ok) {
            const proxyData = await res.json();
            const matchedArticle = proxyData.find(item => item.news_id === cleanId);

            if (matchedArticle) {
              setArticle({
                title: matchedArticle.title,
                content: matchedArticle.content, // HTML كامل
                published_at: matchedArticle.created_at,
                image: matchedArticle.thumbnail_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000',
                author: matchedArticle.author || "محرر رياضي",
                isScraped: true
              });
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching article details:", error);
        setLoading(false);
      }
    };

    fetchArticleDetails();
    window.scrollTo(0, 0);
  }, [id, location.state]);

  // SEO: تحديث Meta Tags و Schema Markup عند تحميل الخبر
  useEffect(() => {
    if (article) {
      document.title = `${article.title} | الجرينتا`;
      
      // تحديث وصف الصفحة لجوجل
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && article.excerpt) {
        metaDescription.setAttribute("content", article.excerpt);
      }
    }
  }, [article]);

  // تجهيز كود JSON-LD لمحركات البحث (SEO قوى جداً)
  const generateSchemaMarkup = () => {
    if (!article) return null;
    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "image": [article.image],
      "datePublished": article.published_at,
      "author": [{
          "@type": "Person",
          "name": article.author || "الجرينتا"
      }]
    };
    return JSON.stringify(schema);
  };

  if (loading) {
    return (
      <div className="news-detail-container" dir="rtl">
        <Navbar />
        <div className="news-detail-loading" aria-live="polite">
          <div className="spinner"></div>
          <h3>جاري تحميل تفاصيل الخبر...</h3>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="news-detail-container" dir="rtl">
        <Navbar />
        <div className="news-detail-error" role="alert">
          <h2>عذراً، هذا الخبر غير موجود أو تم حذفه.</h2>
          <Link to="/news" className="back-to-news-btn">العودة للأخبار</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="news-detail-container" dir="rtl">
      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateSchemaMarkup() }} />
      
      <Navbar />

      <main className="article-wrapper">
        <header className="article-header">
          <Link to="/news" className="back-link" aria-label="العودة لصفحة الأخبار">
            <ArrowRight size={20} aria-hidden="true" /> عودة إلى الأخبار
          </Link>
          
          <h1 className="article-main-title">{article.title}</h1>
          
          <div className="article-meta-info">
            <time dateTime={article.published_at} className="meta-item">
              <Calendar size={18} aria-hidden="true" />
              {new Date(article.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <time dateTime={article.published_at} className="meta-item">
              <Clock size={18} aria-hidden="true" />
              {new Date(article.published_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </time>
            {article.author && (
              <span className="meta-item">
                <User size={18} aria-hidden="true" />
                {article.author}
              </span>
            )}
            <button 
              className="share-btn" 
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              aria-label="نسخ رابط الخبر للمشاركة"
            >
              <Share2 size={18} aria-hidden="true" /> نسخ الرابط
            </button>
          </div>
        </header>

        {/* عرض الصورة البارزة للأخبار (خاصة المسحوبة) */}
        {article.image && article.isScraped && (
          <figure className="external-article-img-wrapper">
            <img 
              src={article.image} 
              alt={article.title} 
              className="external-article-img" 
              onError={handleImageError}
              loading="eager"
            />
          </figure>
        )}

        {/* عرض المحتوى: حالياً كلاهما (المحلي والمسحوب) يعتمدان على تنسيق HTML */}
        <article 
          className="article-rich-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;
