import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Share2, ExternalLink } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './NewsDetail.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const NewsDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  // دالة ذكية لمعالجة الصور المعطوبة واستبدالها بافتراضية
  const handleImageError = (e) => {
    e.target.onerror = null; // يمنع الدخول في حلقة مفرغة
    e.target.src = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070';
  };

  useEffect(() => {
    const fetchArticleDetails = async () => {
      // 1. إذا تم تمرير بيانات الخبر عبر React Router (الأداء الأسرع)
      if (location.state && location.state.article) {
        setArticle(location.state.article);
        setLoading(false);
        window.scrollTo(0, 0);
        return;
      }

      // 2. إذا دخل الزائر عبر رابط مباشر أو قام بتحديث الصفحة (Refresh)
      try {
        const isLocal = !id.toString().startsWith('ext-');
        const cleanId = id.toString().replace('local-', '');

        if (isLocal) {
          // جلب خبر محلي
          const res = await fetch(`${API_BASE_URL}/articles/${cleanId}/`);
          if (res.ok) {
            const data = await res.json();
            setArticle({
              title: data.title,
              content: data.content,
              published_at: data.published_at,
              image: null, // الصور المحلية بداخل محتوى CKEditor
              isExternal: false
            });
          }
        } else {
          // جلب خبر خارجي من البروكسي والبحث عنه
          const res = await fetch(`${API_BASE_URL}/proxy/articles/`);
          if (res.ok) {
            const proxyData = await res.json();
            const timestamp = id.split('-')[2]; // استخراج وقت النشر من الـ ID
            const matchedArticle = proxyData.find(item => 
              new Date(item.publishedAt).getTime().toString() === timestamp
            );

            if (matchedArticle) {
              setArticle({
                title: matchedArticle.title,
                content: matchedArticle.description || matchedArticle.content || "التفاصيل غير متاحة حالياً.",
                published_at: matchedArticle.publishedAt,
                image: matchedArticle.urlToImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000',
                isExternal: true,
                link: matchedArticle.url // الرابط الأصلي لمن يود الاستزادة
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

  if (loading) {
    return (
      <div className="news-detail-container" dir="rtl">
        <Navbar />
        <div className="news-detail-loading">
          <div className="spinner"></div>
          <h3>جاري تجهيز التفاصيل...</h3>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="news-detail-container" dir="rtl">
        <Navbar />
        <div className="news-detail-error">
          <h2>عذراً، هذا الخبر غير موجود أو تم حذفه.</h2>
          <Link to="/news" className="back-to-news-btn">العودة للأخبار</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="news-detail-container" dir="rtl">
      <Navbar />

      <main className="article-wrapper">
        <div className="article-header">
          <Link to="/news" className="back-link">
            <ArrowRight size={20} /> عودة إلى الأخبار
          </Link>
          
          <h1 className="article-main-title">{article.title}</h1>
          
          <div className="article-meta-info">
            <span className="meta-item">
              <Calendar size={18} />
              {new Date(article.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="meta-item">
              <Clock size={18} />
              {new Date(article.published_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button className="share-btn" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <Share2 size={18} /> نسخ الرابط
            </button>
          </div>
        </div>

        {/* عرض الصورة البارزة للأخبار الخارجية فقط (لأن المحلية صورها بداخل CKEditor) */}
        {article.isExternal && article.image && (
          <div className="external-article-img-wrapper">
            <img 
              src={article.image} 
              alt={article.title} 
              className="external-article-img" 
              onError={handleImageError}
            />
          </div>
        )}

        {/* عرض المحتوى بناءً على مصدر الخبر */}
        {article.isExternal ? (
          <div className="article-rich-content external-content-wrapper">
            <p className="external-text">{article.content}</p>
            {article.link && (
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="read-source-btn">
                قراءة الخبر من المصدر <ExternalLink size={18} />
              </a>
            )}
          </div>
        ) : (
          <article 
            className="article-rich-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;
