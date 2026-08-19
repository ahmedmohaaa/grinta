import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Calendar, Clock, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './News.css';

gsap.registerPlugin(ScrollTrigger);

const API_BASE_URL = 'https://api.algrinta.com/api';
/* 🎯 مكون عرض الإعلان — يعمل بأي ثيم (فاتح أو غامق) بدون الحاجة لأي CSS إضافي */
const AdSlot = ({ ad }) => {
  if (!ad) return null;
  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '28px auto', padding: '0 16px', boxSizing: 'border-box' }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '110px',
        padding: '20px 14px 14px',
        background: 'linear-gradient(180deg, rgba(128,128,128,0.08), rgba(128,128,128,0.03))',
        border: '1px solid rgba(128,128,128,0.18)',
        borderRadius: '14px',
        overflow: 'hidden'
      }}>
        <span style={{
          position: 'absolute', top: '7px', insetInlineStart: '12px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
          color: '#8f8f97', userSelect: 'none'
        }}>
          إعلان
        </span>
        {ad.code ? (
          <div style={{ width: '100%', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: ad.code }} />
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600 }}>{ad.name}</span>
        )}
      </div>
    </div>
  );
};

const News = () => {
  const containerRef = useRef(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  /* 📢 حالة الإعلانات */
  const [activeAds, setActiveAds] = useState([]);

  useEffect(() => {
    document.title = "أحدث الأخبار الرياضية والتقارير | الجرينتا";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "تغطية حصرية لأحدث الأخبار الرياضية، تحليلات المباريات، وتقارير شاملة من منصة الجرينتا.");
    }
  }, []);

  /* 📢 جلب إعلانات صفحة الأخبار فقط */
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ads/?page=news`);
        const adsRes = await res.json();
        if (Array.isArray(adsRes)) {
          setActiveAds(adsRes.filter(ad => ad.status === 'active' && ad.page === 'news'));
        }
      } catch (err) { console.error("Error loading ads:", err); }
    };
    fetchAds();
  }, []);

  const topAd = activeAds.length > 0 ? activeAds[0] : null;
  const bottomAd = activeAds.length > 1 ? activeAds[1] : null;

  const extractImage = (htmlContent) => {
    if (!htmlContent) return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000';
    const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070';
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070';
  };

  const stripHtml = (htmlContent) => {
    if (!htmlContent) return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = htmlContent;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  const fetchAllNews = async () => {
    try {
      const dbRes = await fetch(`${API_BASE_URL}/articles/`);
      const dbData = await dbRes.ok ? await dbRes.json() : [];

      const btolatRes = await fetch(`${API_BASE_URL}/proxy/btolat-news/`);
      const btolatData = await btolatRes.ok ? await btolatRes.json() : [];

      const formattedDbArticles = dbData.map(item => ({
        id: `local-${item.id}`,
        title: item.title,
        content: item.content,
        excerpt: stripHtml(item.content),
        image: extractImage(item.content),
        published_at: item.published_at,
        author: "إدارة الجرينتا",
        isScraped: false,
        link: `/news/local-${item.id}`
      }));

      const formattedBtolatArticles = (Array.isArray(btolatData) ? btolatData : []).map(item => ({
        id: `btolat-${item.news_id}`,
        title: item.title,
        content: item.content,
        excerpt: stripHtml(item.content),
        image: item.thumbnail_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000',
        published_at: item.created_at,
        author: item.author || "محرر رياضي",
        isScraped: true,
        link: `/news/btolat-${item.news_id}`
      }));

      const combinedArticles = [...formattedDbArticles, ...formattedBtolatArticles];
      combinedArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      setArticles(combinedArticles);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching news:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNews();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.news-anim',
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 80%",
            }
          }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, articles, searchQuery]);

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const remainingArticles = filteredArticles.slice(1);

  return (
    <div className="news-page-container" dir="rtl">
      <Navbar />

      <main className="news-wrapper">
        <header className="news-header-controls">
          <h1 className="news-page-title">أحدث الأخبار والتقارير</h1>
          <div className="news-search-box">
            <Search className="news-search-icon" size={20} aria-label="بحث" />
            <input 
              type="search" 
              className="news-search-input" 
              placeholder="ابحث في الأخبار، التقارير، والتحليلات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="مربع البحث عن الأخبار"
            />
          </div>
        </header>

        {/* 📢 إعلان أعلى صفحة الأخبار */}
        <AdSlot ad={topAd} />

        {loading ? (
          <div className="news-loading" aria-live="polite">
            <div className="spinner"></div>
            <h3>جاري تجهيز الأخبار الرياضية...</h3>
          </div>
        ) : (
          <div ref={containerRef}>
            {featuredArticle && !searchQuery && (
              <Link 
                to={featuredArticle.link} 
                state={{ articleData: featuredArticle }} 
                className="featured-article news-anim"
                aria-label={`الخبر الرئيسي: ${featuredArticle.title}`}
              >
                <img 
                  src={featuredArticle.image} 
                  alt={featuredArticle.title} 
                  className="featured-img" 
                  onError={handleImageError}
                  loading="eager"
                />
                <article className="featured-overlay">
                  <span className="featured-badge">🔥 الأحدث</span>
                  <h2 className="featured-title">{featuredArticle.title}</h2>
                  <p className="featured-excerpt">{featuredArticle.excerpt}</p>
                  <div className="featured-meta">
                    <time dateTime={featuredArticle.published_at} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} aria-hidden="true" /> 
                      {new Date(featuredArticle.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                  </div>
                </article>
              </Link>
            )}

            <section className="news-grid" aria-label="قائمة الأخبار">
              {filteredArticles.length === 0 ? (
                <div className="no-news-found">
                  <h2>لا توجد أخبار مطابقة لبحثك "{searchQuery}"</h2>
                </div>
              ) : (
                (searchQuery ? filteredArticles : remainingArticles).map((article) => (
                  <Link 
                    to={article.link} 
                    state={{ articleData: article }}
                    key={article.id}
                    className="news-item-card news-anim"
                  >
                    <div className="news-item-img-wrapper">
                      <img 
                        src={article.image} 
                        alt={article.title} 
                        className="news-item-img" 
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>
                    <article className="news-item-content">
                      <time dateTime={article.published_at} className="news-item-date">
                        <Calendar size={14} aria-hidden="true" />
                        {new Date(article.published_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </time>
                      <h3 className="news-item-title">{article.title}</h3>
                      <p className="news-item-excerpt">{article.excerpt}</p>
                      <div className="read-more-btn">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          اقرأ التفاصيل <ArrowLeft size={16} />
                        </span>
                      </div>
                    </article>
                  </Link>
                ))
              )}
            </section>
          </div>
        )}

        {/* 📢 إعلان أسفل صفحة الأخبار */}
        <AdSlot ad={bottomAd} />
      </main>

      <Footer />
    </div>
  );
};

export default News;
