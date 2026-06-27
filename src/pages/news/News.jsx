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

const News = () => {
  const containerRef = useRef(null);
  
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // استخراج نص نقي من HTML لإظهار مقتطف
  const stripHtml = (htmlContent) => {
    if (!htmlContent) return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = htmlContent;
    return tmp.textContent || tmp.innerText || "";
  };

  // دالة جلب الأخبار من المصدرين
  const fetchAllNews = async () => {
    try {
      const dbRes = await fetch(`${API_BASE_URL}/articles/`);
      const dbData = await dbRes.ok ? await dbRes.json() : [];

      const proxyRes = await fetch(`${API_BASE_URL}/proxy/articles/`);
      const proxyData = await proxyRes.ok ? await proxyRes.json() : [];

      // معالجة الأخبار المحلية
      const formattedDbArticles = dbData.map(item => ({
        id: `local-${item.id}`,
        realId: item.id,
        title: item.title,
        content: stripHtml(item.content),
        published_at: item.published_at,
        isExternal: false,
        link: `/news/local-${item.id}`
      }));

      // معالجة الأخبار الخارجية
      const formattedProxyArticles = (Array.isArray(proxyData) ? proxyData : []).map((item, index) => {
        const uniqueId = `ext-${index}-${new Date(item.publishedAt).getTime()}`;
        return {
          id: uniqueId,
          title: item.title,
          content: item.description || stripHtml(item.content) || "",
          published_at: item.publishedAt,
          isExternal: true,
          link: `/news/${uniqueId}`,
          originalLink: item.url
        };
      });

      const combinedArticles = [...formattedDbArticles, ...formattedProxyArticles];
      const uniqueArticlesMap = new Map();
      combinedArticles.forEach(article => {
        if (!uniqueArticlesMap.has(article.title)) {
          uniqueArticlesMap.set(article.title, article);
        }
      });
      
      const finalArticles = Array.from(uniqueArticlesMap.values());
      finalArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      setArticles(finalArticles);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching news:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNews();
    const intervalId = setInterval(() => {
      fetchAllNews();
    }, 60000);
    return () => clearInterval(intervalId);
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
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const remainingArticles = filteredArticles.slice(1);

  return (
    <div className="news-page-container" dir="rtl">
      <Navbar />

      <main className="news-wrapper">
        <div className="news-header-controls">
          <h1 className="news-page-title">أحدث الأخبار والتقارير</h1>
          
          <div className="news-search-box">
            <Search className="news-search-icon" size={20} />
            <input 
              type="text" 
              className="news-search-input" 
              placeholder="ابحث في الأخبار، التقارير، والتحليلات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="news-loading">
            <div className="spinner"></div>
            <h3>جاري تجهيز الأخبار الرياضية...</h3>
          </div>
        ) : (
          <div ref={containerRef}>
            
            {/* ================= الخبر الرئيسي (Hero) ================= */}
            {featuredArticle && !searchQuery && (
              <Link 
                to={featuredArticle.link} 
                state={{ articleData: featuredArticle }} 
                className="featured-article news-anim"
              >
                <div className="featured-overlay">
                  <span className="featured-badge">🔥 أحدث الأخبار</span>
                  <h2 className="featured-title">{featuredArticle.title}</h2>
                  
                  <div className="featured-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} /> 
                      {new Date(featuredArticle.published_at || new Date()).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} />
                      {new Date(featuredArticle.published_at || new Date()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* ================= شبكة الأخبار ================= */}
            <div className="news-grid">
              {filteredArticles.length === 0 ? (
                <div className="no-news-found">
                  <h2>لا توجد أخبار مطابقة لبحثك "{searchQuery}"</h2>
                  <p>حاول البحث بكلمات مختلفة أو اسم فريق آخر.</p>
                </div>
              ) : (
                (searchQuery ? filteredArticles : remainingArticles).map((article) => (
                  <Link 
                    to={article.link} 
                    state={{ articleData: article }}
                    key={article.id}
                    className="news-item-card news-anim"
                  >
                    <div className="news-item-content">
                      <div className="news-item-date">
                        <Calendar size={14} />
                        {new Date(article.published_at || new Date()).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      <h3 className="news-item-title">{article.title}</h3>
                      <p className="news-item-excerpt">{article.content}</p>
                      
                      <div className="read-more-btn">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          اقرأ التفاصيل <ArrowLeft size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default News;
