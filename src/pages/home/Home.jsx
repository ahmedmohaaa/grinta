import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown, Trophy, Newspaper, MonitorPlay, Calendar, X } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const API_BASE_URL = 'https://api.algrinta.com/api';

const Home = () => {
  const mainRef = useRef(null);

  // --- حالات تخزين البيانات ---
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [localVideos, setLocalVideos] = useState([]);
  const [externalVideos, setExternalVideos] = useState([]);
  const [ads, setAds] = useState([]);

  // --- التحكم في عرض العناصر ---
  const [visibleLive, setVisibleLive] = useState(4);
  const [visibleToday, setVisibleToday] = useState(4);
  const [visibleNews, setVisibleNews] = useState(4);
  const [visibleLocalVideos, setVisibleLocalVideos] = useState(4);
  const [visibleExtVideos, setVisibleExtVideos] = useState(6); 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- حالة التحكم بالنافذة المنبثقة للفيديو ---
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // إزالة طلب الدوريات لتخفيف الحمل والاكتفاء بالبيانات المطلوبة
        const [fixturesRes, articlesRes, videosRes, adsRes, extVideosRes] = await Promise.all([
          fetch(`${API_BASE_URL}/fixtures/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/articles/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/videos/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/ads/?page=home`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/proxy/highlights/`).then(res => res.json()).catch(() => null)
        ]);

        // 1. المباريات
        const live = fixturesRes.filter?.(f => ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status_short)) || [];
        const upcoming = fixturesRes.filter?.(f => f.status_short === 'NS' || f.status_short === 'TBD') || [];
        setLiveMatches(live);
        setTodayMatches(upcoming);
        
        // 2. ترتيب الأخبار من الأحدث للأقدم
        const sortedNews = Array.isArray(articlesRes) 
          ? articlesRes.sort((a, b) => new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at))
          : [];
        setNews(sortedNews);

        // 3. الفيديوهات والإعلانات
        setLocalVideos(Array.isArray(videosRes) ? videosRes : []);
        setAds(Array.isArray(adsRes) ? adsRes : []);

        // 4. الفيديوهات الخارجية 
        if (extVideosRes && extVideosRes.data) {
          setExternalVideos(extVideosRes.data);
        } else if (Array.isArray(extVideosRes)) {
          setExternalVideos(extVideosRes);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading infrastructure data:", err);
        setError("تعذر الاتصال بخوادم جرينتا الرياضية. يرجى مراجعة إعدادات السيرفر.");
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      const ctx = gsap.context(() => {
        gsap.utils.toArray('.gsap-fade-in').forEach((section) => {
          gsap.fromTo(section, 
            { y: 25, opacity: 0 },
            { scrollTrigger: { trigger: section, start: "top 88%" }, y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
          );
        });
      }, mainRef);
      return () => ctx.revert();
    }
  }, [loading, error, visibleLive, visibleToday, visibleNews, visibleLocalVideos, visibleExtVideos]);

  const closeModal = () => setSelectedVideo(null);

  if (loading) return <div className="grinta-loading-wrapper" dir="rtl"><div className="grinta-spinner"></div><p>جاري مزامنة البيانات المباشرة...</p></div>;
  if (error) return <div className="grinta-error-wrapper" dir="rtl"><AlertCircle size={50} className="error-pulse" /><p>{error}</p></div>;

  return (
    <div className="home-container" dir="rtl">
      <Navbar />

      <main ref={mainRef}>
        {/* البانر الرئيسي */}
        <section className="hero-banner-section">
          <div className="hero-banner-image"></div>
          <div className="hero-banner-overlay"></div>
        </section>

        {/* ⚽ المباريات المباشرة */}
        {liveMatches.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Flame size={26} className="fire-glow-icon" /> المباريات الجارية الآن</h2>
            </div>
            <div className="matches-responsive-grid">
              {liveMatches.slice(0, visibleLive).map(match => (
                <MatchCardItem key={match.id} match={match} />
              ))}
            </div>
            {visibleLive < liveMatches.length && (
              <div className="load-more-center">
                <button className="premium-more-btn" onClick={() => setVisibleLive(prev => prev + 4)}>
                  <span>عرض المزيد من المباريات</span> <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 📅 مباريات اليوم */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Trophy size={26} className="color-primary" /> جدول مباريات اليوم</h2>
          </div>
          {todayMatches.length > 0 ? (
            <>
              <div className="matches-responsive-grid">
                {todayMatches.slice(0, visibleToday).map(match => (
                  <MatchCardItem key={match.id} match={match} />
                ))}
              </div>
              {visibleToday < todayMatches.length && (
                <div className="load-more-center">
                  <button className="premium-more-btn" onClick={() => setVisibleToday(prev => prev + 4)}>
                    <span>عرض المزيد من المباريات</span> <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-card">لا توجد مباريات مجدولة متبقية اليوم.</div>
          )}
        </section>

        {/* 📢 قسم الإعلانات */}
        {ads.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="ads-container" style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', margin: '20px 0' }}>
              {ads.map((ad, index) => (
                <div key={ad.id || index} className="ad-banner" style={{ width: '100%', maxWidth: '800px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {/* دعم عرض صورة الإعلان برابط، أو عرض كود إعلاني مثل Google Adsense */}
                  {ad.image ? (
                    <a href={ad.link || '#'} target="_blank" rel="noopener noreferrer">
                      <img src={ad.image} alt={ad.name || 'إعلان'} style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </a>
                  ) : ad.code ? (
                    <div dangerouslySetInnerHTML={{ __html: ad.code }} />
                  ) : (
                    <div style={{ padding: '20px', background: '#f5f5f5', textAlign: 'center', color: '#666' }}>
                      {ad.name || 'مساحة إعلانية'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 📰 الأخبار */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Newspaper size={26} className="color-primary" /> أحدث الأخبار والتقارير</h2>
          </div>
          {news.length > 0 ? (
            <>
              <div className="media-bento-grid">
                {news.slice(0, visibleNews).map(article => (
                  <Link key={article.id} to={`/news/${article.id}`} className="global-card-link-reset" style={{ display: 'block' }}>
                    <div className="premium-media-card text-only-card">
                      <div className="text-card-content">
                        <span className="media-badge">أخبار عاجلة</span>
                        <h3 className="media-card-title text-only-title">{article.title}</h3>
                        <p className="news-date-text">
                          {new Date(article.created_at || article.published_at || Date.now()).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {visibleNews < news.length && (
                <div className="load-more-center">
                  <button className="premium-more-btn" onClick={() => setVisibleNews(prev => prev + 4)}>
                    <span>عرض المزيد من الأخبار</span> <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-card">لا توجد أخبار متاحة في الوقت الحالي.</div>
          )}
        </section>

        {/* 📹 فيديوهات المنصة */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><MonitorPlay size={26} className="color-primary" /> تقارير المنصة</h2>
          </div>
          {localVideos.length > 0 ? (
            <>
              <div className="media-bento-grid">
                {localVideos.slice(0, visibleLocalVideos).map((vid, index) => {
                  return (
                    <div 
                      key={index} 
                      className="premium-media-card is-video-card" 
                      onClick={() => setSelectedVideo({ title: vid.title, embed: `<video src="${vid.video_url}" controls autoplay style="width:100%; border-radius:8px;"></video>` })}
                      style={{ cursor: 'pointer', backgroundImage: `url(${vid.thumbnail || 'https://placehold.co/600x400?text=Video'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                      <div className="video-dark-overlay">
                        <PlayCircle size={45} className="play-icon-glow" />
                      </div>
                      <div className="text-card-content justify-end">
                        <span className="media-badge badge-local">{vid.competition || 'فيديو حصري'}</span>
                        <h3 className="media-card-title text-only-title text-white">{vid.title}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleLocalVideos < localVideos.length && (
                <div className="load-more-center">
                  <button className="premium-more-btn" onClick={() => setVisibleLocalVideos(prev => prev + 4)}>
                    <span>عرض المزيد</span> <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-card">لا توجد فيديوهات حصرية مرفوعة حالياً.</div>
          )}
        </section>

        {/* 🌐 فيديوهات الـ API الخارجي */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><MonitorPlay size={26} className="color-accent" /> ملخصات عالمية (مباشر)</h2>
          </div>
          {externalVideos.length > 0 ? (
            <>
              <div className="media-bento-grid">
                {externalVideos.slice(0, visibleExtVideos).map((item, idx) => {
                  const mainVideo = item.videos && item.videos.length > 0 ? item.videos[0] : null;
                  if (!mainVideo) return null;

                  return (
                    <div 
                      key={idx} 
                      className="premium-media-card is-video-card" 
                      onClick={() => setSelectedVideo({ title: item.title, embed: mainVideo.embed })}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={item.thumbnail} alt={item.title} className="media-card-img" />
                      <div className="video-dark-overlay">
                        <PlayCircle size={55} className="play-icon-glow" />
                      </div>
                      <div className="media-card-gradient">
                        <span className="media-badge badge-external">{item.competition}</span>
                        <h3 className="media-card-title">{item.title}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleExtVideos < externalVideos.length && (
                <div className="load-more-center">
                  <button className="premium-more-btn" onClick={() => setVisibleExtVideos(prev => prev + 6)}>
                    <span>عرض المزيد من الملخصات</span> <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-card">لا توجد ملخصات عالمية متاحة الآن. تأكد من مزامنة الـ API الخارجي.</div>
          )}
        </section>

      </main>
      <Footer />

      {/* ================= Video Modal (النافذة المنبثقة للعرض السينمائي) ================= */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>
              <X size={28} />
            </button>
            <h3 className="modal-video-title">{selectedVideo.title}</h3>
            
            <div 
              className="embed-video-container"
              dangerouslySetInnerHTML={{ __html: selectedVideo.embed }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

const MatchCardItem = ({ match }) => {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status_short);
  return (
    <Link to={`/match/${match.fixture_id}`} className="global-card-link-reset">
      <div className={`premium-match-card ${isLive ? 'border-pulse-live' : ''}`}>
        <div className="match-card-meta">
          <span className="league-badge-text">{match.league?.name || 'بطولة كروية'}</span>
          {isLive ? (
            <span className="live-status-indicator"><span className="pulse-dot"></span>بث مباشر '{match.elapsed}</span>
          ) : (
            <span className="scheduled-time-indicator">
              <Calendar size={13} style={{ marginLeft: '4px' }} />
              {new Date(match.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="match-card-teams-area">
          <div className="team-meta-block align-left">
            <img src={match.home_team_logo} alt={match.home_team_name} onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
            <span className="team-name-text">{match.home_team_name}</span>
          </div>
          <div className="score-display-center">
            {isLive || match.status_short === 'FT' ? (
              <span className={`score-numbers ${isLive ? 'text-live-red' : ''}`}>{match.home_score} : {match.away_score}</span>
            ) : (
              <span className="vs-badge">VS</span>
            )}
          </div>
          <div className="team-meta-block align-right">
            <img src={match.away_team_logo} alt={match.away_team_name} onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
            <span className="team-name-text">{match.away_team_name}</span>
          </div>
        </div>
        <div className="match-card-footer-info">{match.status_long}</div>
      </div>
    </Link>
  );
};

export default Home;
