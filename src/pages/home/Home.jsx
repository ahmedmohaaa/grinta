import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown, CheckCircle, Newspaper, MonitorPlay, Calendar, X, Target } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const API_BASE_URL = 'https://api.algrinta.com/api';

const isOverdue = (matchDate) => {
  if (!matchDate) return false;
  const matchTime = new Date(matchDate).getTime();
  const now = new Date().getTime();
  const hoursElapsed = (now - matchTime) / (1000 * 60 * 60);
  return hoursElapsed > 3.5;
};

// 🔥 مكون مصغر لعرض علامة التحميل بداخل الأقسام
const SectionLoader = ({ message = "جاري تحميل البيانات..." }) => {
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <div className="grinta-spinner"></div>
      <p style={{ marginTop: '1.2rem', fontSize: '1.05rem', fontWeight: '600', color: '#a1a1aa' }}>{message}</p>
    </div>
  );
};

const Home = () => {
  const mainRef = useRef(null);

  // --- حالات المباريات ---
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]); 
  const [visibleLive, setVisibleLive] = useState(4);
  const [visibleToday, setVisibleToday] = useState(4);
  const [visiblePast, setVisiblePast] = useState(4);
  const [matchesLoading, setMatchesLoading] = useState(true); // 👈 حالة تحميل المباريات

  // --- حالات البيانات المعتمدة على الـ API Pagination ---
  const [news, setNews] = useState([]);
  const [newsPage, setNewsPage] = useState(1);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [allNewsData, setAllNewsData] = useState([]);

  const [localVideos, setLocalVideos] = useState([]);
  const [localVideosPage, setLocalVideosPage] = useState(1);
  const [hasMoreLocalVideos, setHasMoreLocalVideos] = useState(true);

  const [externalVideos, setExternalVideos] = useState([]);
  const [extVideosPage, setExtVideosPage] = useState(1);
  const [hasMoreExtVideos, setHasMoreExtVideos] = useState(true);

  const [goals, setGoals] = useState([]);
  const [goalsPage, setGoalsPage] = useState(1);
  const [hasMoreGoals, setHasMoreGoals] = useState(true);
  const [visibleGoals, setVisibleGoals] = useState(6);
  const [goalsLoading, setGoalsLoading] = useState(true); // 👈 حالة تحميل الأهداف

  const [activeAds, setActiveAds] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  
  // 1. دوال جلب البيانات
  const extractImageFromHtml = (htmlContent) => {
    if (!htmlContent) return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=500';
    const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=500';
  };

  const stripHtmlTags = (htmlContent) => {
    if (!htmlContent) return '';
    const cleanText = htmlContent.replace(/<\/?[^>]+(>|$)/g, "");
    return cleanText.length > 120 ? cleanText.substring(0, 120) + "..." : cleanText;
  };

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      
      const dbRes = await fetch(`${API_BASE_URL}/articles/`);
      const dbData = dbRes.ok ? await dbRes.json() : [];

      const btolatRes = await fetch(`${API_BASE_URL}/proxy/btolat-news/`);
      const btolatData = btolatRes.ok ? await btolatRes.json() : [];

      const formattedDbArticles = (Array.isArray(dbData) ? dbData : []).map(item => ({
        id: `local-${item.id}`,
        title: item.title,
        excerpt: stripHtmlTags(item.content),
        content: item.content, 
        image: extractImageFromHtml(item.content),
        published_at: item.published_at,
        link: `/news/local-${item.id}`,
        isExternal: false 
      }));

      const formattedBtolatArticles = (Array.isArray(btolatData) ? btolatData : []).map(item => ({
        id: `btolat-${item.news_id}`,
        title: item.title,
        excerpt: stripHtmlTags(item.content),
        content: item.content, 
        image: item.thumbnail_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=500',
        published_at: item.created_at,
        link: `/news/btolat-${item.news_id}`,
        isExternal: true 
      }));

      const allCombinedNews = [...formattedDbArticles, ...formattedBtolatArticles];
      allCombinedNews.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      setAllNewsData(allCombinedNews);

      const initialNews = allCombinedNews.slice(0, 6);
      setNews(initialNews);
      
      setHasMoreNews(allCombinedNews.length > 6);
      setNewsLoading(false);
    } catch (err) { 
      console.error("Error loading combined news:", err); 
      setNewsLoading(false);
    }
  };

  const handleLoadMoreNews = () => {
    const nextPage = newsPage + 1;
    setNewsPage(nextPage);
    
    const limit = 6;
    const endIndex = nextPage * limit;
    
    const newVisibleNews = allNewsData.slice(0, endIndex);
    setNews(newVisibleNews);

    if (endIndex >= allNewsData.length) {
      setHasMoreNews(false);
    }
  };

  const handleLoadMoreGoals = () => {
    if (visibleGoals < goals.length) {
      setVisibleGoals(prev => prev + 5);
    } else if (hasMoreGoals) {
      loadMoreGoals();
      setVisibleGoals(prev => prev + 5);
    }
  };

  const fetchGoals = async (page) => {
    try {
      if (page === 1) setGoalsLoading(true);
      const res = await fetch(`${API_BASE_URL}/proxy/goals-library/?page=${page}&limit=4`);
      const goalsRes = await res.json();
      const newGoals = Array.isArray(goalsRes) ? goalsRes : [];
      
      if (newGoals.length < 4) setHasMoreGoals(false);
      setGoals(prev => page === 1 ? newGoals : [...prev, ...newGoals]);
    } catch (err) { 
      console.error("Error loading goals:", err); 
    } finally {
      if (page === 1) setGoalsLoading(false);
    }
  };

  const fetchLocalVideos = async (page) => {
    try {
      const res = await fetch(`${API_BASE_URL}/videos/?page=${page}&limit=4`);
      const videosRes = await res.json();
      const newVideos = Array.isArray(videosRes) ? videosRes : [];
      
      if (newVideos.length < 4) setHasMoreLocalVideos(false);
      setLocalVideos(prev => page === 1 ? newVideos : [...prev, ...newVideos]);
    } catch (err) { console.error("Error loading local videos:", err); }
  };

  const fetchExternalVideos = async (page) => {
    try {
      const res = await fetch(`${API_BASE_URL}/proxy/highlights/?page=${page}&limit=6`);
      const extVideosRes = await res.json();
      const newExtVideos = extVideosRes?.data || (Array.isArray(extVideosRes) ? extVideosRes : []);
      
      if (newExtVideos.length < 6) setHasMoreExtVideos(false);
      setExternalVideos(prev => page === 1 ? newExtVideos : [...prev, ...newExtVideos]);
    } catch (err) { console.error("Error loading external highlights:", err); }
  };

  // 2. جلب البيانات الأولية عند تحميل الصفحة
  useEffect(() => {
    const fetchFixtures = async () => {
      setMatchesLoading(true); // 👈 تشغيل التحميل
      try {
        const res = await fetch(`${API_BASE_URL}/fixtures/`);
        const fixturesRes = await res.json();

        const live = fixturesRes.filter?.(f => {
            const isLiveStatus = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status_short);
            const isFinishedStr = f.status_long?.toLowerCase().includes('انتهت') || f.status_long?.toLowerCase().includes('finished');
            return isLiveStatus && f.status_short !== 'FT' && !isFinishedStr && !isOverdue(f.date);
        }) || [];

        const finished = fixturesRes.filter?.(f => {
            const isFinishedStatus = ['FT', 'AET', 'PEN'].includes(f.status_short);
            const isFinishedStr = f.status_long?.toLowerCase().includes('انتهت') || f.status_long?.toLowerCase().includes('finished');
            return isFinishedStatus || isFinishedStr || isOverdue(f.date);
        }) || [];
        
        const sortedFinished = finished.sort((a, b) => new Date(b.date) - new Date(a.date));

        const upcoming = fixturesRes.filter?.(f => {
            const isUpcomingStatus = ['NS', 'TBD'].includes(f.status_short);
            const notLiveOrFinished = !live.some(lm => lm.fixture_id === f.fixture_id) && !finished.some(fm => fm.fixture_id === f.fixture_id);
            const isFuture = new Date(f.date).getTime() > new Date().getTime() - (60 * 60 * 1000);
            return isUpcomingStatus && notLiveOrFinished && isFuture;
        }) || [];

        setLiveMatches(live);
        setPastMatches(sortedFinished);
        setTodayMatches(upcoming);
      } catch (err) { 
        console.error("Error loading fixtures:", err); 
      } finally {
        setMatchesLoading(false); // 👈 إيقاف التحميل
      }
    };

    const fetchAds = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ads/?page=home`);
        const adsRes = await res.json();
        if (Array.isArray(adsRes)) {
          setActiveAds(adsRes.filter(ad => ad.status === 'active'));
        }
      } catch (err) { console.error("Error loading ads:", err); }
    };

    Promise.allSettled([
      fetchFixtures(), 
      fetchNews(1), 
      fetchLocalVideos(1), 
      fetchExternalVideos(1), 
      fetchGoals(1), 
      fetchAds()
    ]).catch(() => setError("حدث خطأ طفيف في مزامنة بعض البيانات."));

  }, []);

  // 3. دوال زر "عرض المزيد"
  const loadMoreNews = () => {
    const nextPage = newsPage + 1;
    setNewsPage(nextPage);
    fetchNews(nextPage);
  };

  const loadMoreGoals = () => {
    const nextPage = goalsPage + 1;
    setGoalsPage(nextPage);
    fetchGoals(nextPage);
  };

  const loadMoreLocalVideos = () => {
    const nextPage = localVideosPage + 1;
    setLocalVideosPage(nextPage);
    fetchLocalVideos(nextPage);
  };

  const loadMoreExtVideos = () => {
    const nextPage = extVideosPage + 1;
    setExtVideosPage(nextPage);
    fetchExternalVideos(nextPage);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.gsap-fade-in').forEach((section) => {
        gsap.fromTo(section, 
          { y: 30, opacity: 0 },
          { 
            scrollTrigger: { 
              trigger: section, 
              start: "top 85%",
              toggleActions: "play none none none" 
            }, 
            y: 0, 
            opacity: 1, 
            duration: 0.5, 
            ease: "power2.out" 
          }
        );
      });
    }, mainRef);
    
    return () => ctx.revert();
  }, []); 

  useEffect(() => {
    ScrollTrigger.refresh(); 
  }, [liveMatches, todayMatches, news, externalVideos, goals, activeAds]); 

  const closeModal = () => setSelectedVideo(null);

  const topAd = activeAds.length > 0 ? activeAds[0] : null;
  const bottomAd = activeAds.length > 1 ? activeAds[1] : (activeAds.length === 1 ? activeAds[0] : null);

  return (
    <div className="home-container" dir="rtl">
        <title>جرينتا | الرئيسية - بث مباشر، أهداف وملخصات حصرية</title>
        <meta name="description" content="منصة جرينتا الرياضية - الأسرع في تغطية المباريات المباشرة..." />

      <Navbar />

      <main ref={mainRef}>
        <section className="hero-banner-section">
          <div className="hero-banner-image"></div>
          <div className="hero-banner-overlay"></div>
        </section>

        {topAd && (
          <div className="ad-section-wrapper px-4 mt-8">
            <div className="ad-banner-container">
              {topAd.code ? (
                <div dangerouslySetInnerHTML={{ __html: topAd.code }} />
              ) : (
                <div className="p-4 bg-slate-900 text-slate-400">{topAd.name}</div>
              )}
            </div>
          </div>
        )}

        {/* ⚽ المباريات */}
        {(matchesLoading || liveMatches.length > 0) && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Flame size={26} className="fire-glow-icon" /> المباريات الجارية الآن</h2>
            </div>
            {matchesLoading ? (
              <SectionLoader message="جاري جلب المباريات المباشرة..." />
            ) : (
              <>
                <div className="matches-responsive-grid">
                  {liveMatches.slice(0, visibleLive).map(match => (
                    <MatchCardItem key={match.fixture_id || match.id} match={match} />
                  ))}
                </div>
                {visibleLive < liveMatches.length && (
                  <div className="load-more-center">
                    <button className="premium-more-btn" onClick={() => setVisibleLive(prev => prev + 4)}>
                      <span>عرض المزيد من المباريات</span> <ChevronDown size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* 📅 مباريات اليوم */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Calendar size={26} className="color-primary mr-2" /> مباريات اليوم القادمة</h2>
          </div>
          {matchesLoading ? (
            <SectionLoader message="جاري جلب مباريات اليوم..." />
          ) : todayMatches.length > 0 ? (
            <>
              <div className="matches-responsive-grid">
                {todayMatches.slice(0, visibleToday).map(match => (
                  <MatchCardItem key={match.fixture_id || match.id} match={match} />
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

        {/* 🏁 نتائج سابقة */}
        {(matchesLoading || pastMatches.length > 0) && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><CheckCircle size={26} className="text-gray-400 mr-2" /> نتائج المباريات السابقة</h2>
            </div>
            {matchesLoading ? (
              <SectionLoader message="جاري جلب النتائج..." />
            ) : (
              <>
                <div className="matches-responsive-grid">
                  {pastMatches.slice(0, visiblePast).map(match => (
                    <MatchCardItem key={match.fixture_id || match.id} match={match} isPast={true} />
                  ))}
                </div>
                {visiblePast < pastMatches.length && (
                  <div className="load-more-center">
                    <button className="premium-more-btn" onClick={() => setVisiblePast(prev => prev + 4)}>
                      <span>عرض المزيد من النتائج</span> <ChevronDown size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* 🎯 الأهداف */}
        {(goalsLoading || goals.length > 0) && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Target size={26} className="color-primary mr-2" /> أحدث الأهداف</h2>
            </div>
            {goalsLoading ? (
              <SectionLoader message="جاري تحميل أهداف وملخصات المباريات..." />
            ) : (
              <>
                <div className="media-bento-grid">
                  {goals.slice(0, visibleGoals).map((item, idx) => {
                    const safeId = item.id || `goal-id-${idx}`;
                    return (
                      <Link key={safeId} to={`/video/${safeId}`} state={{ video: { ...item, id: safeId } }} className="global-card-link-reset" style={{ display: 'block' }}>
                        <div className="premium-media-card is-video-card" style={{ cursor: 'pointer' }}>
                          <img src={item.thumbnailUrl || 'https://via.placeholder.com/720x400.png?text=Goals'} alt={item.title} className="media-card-img" loading="lazy" decoding="async" />
                          <div className="video-dark-overlay">
                            <PlayCircle size={55} className="play-icon-glow" />
                          </div>
                          <div className="media-card-gradient" style={{ padding: '1.5rem 1.2rem 1.2rem' }}>
                            <span className="media-badge" style={{ backgroundColor: item.platform === 'Twitter' ? '#1DA1F2' : item.platform === 'Btolat' ? '#10b981' : '#3f3f46' }}>
                              {item.platform === 'Btolat' ? 'أهداف' : item.platform}
                            </span>
                            <h3 className="media-card-title">{item.title}</h3>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {(visibleGoals < goals.length || hasMoreGoals) && (
                  <div className="load-more-center">
                    <button className="premium-more-btn" onClick={handleLoadMoreGoals}>
                      <span>عرض المزيد من الأهداف</span> <ChevronDown size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* 📰 قسم أحدث الأخبار والتقارير */}
        <section className="news-section-wrapper global-section-padding">
          <div className="section-header-flex">
            <div className="section-title-block">
              <Newspaper className="section-title-icon" size={24} />
              <h2 className="section-main-heading">أحدث الأخبار والتقارير</h2>
            </div>
          </div>

          <div className="news-cards-layout-grid">
            {newsLoading && allNewsData.length === 0 ? (
              <SectionLoader message="جاري تحميل آخر الأخبار والتقارير..." />
            ) : (
              news.map((newsItem) => (
                <Link 
                  to={newsItem.link} 
                  key={newsItem.id} 
                  className="news-card-item-box"
                  state={{ article: newsItem }} 
                >
                  <div className="news-card-img-container">
                    <img 
                      src={newsItem.image} 
                      alt={newsItem.title} 
                      loading="lazy" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=500';
                      }}
                    />
                  </div>
                  <div className="news-card-info-content">
                    <h3 className="news-card-item-title">{newsItem.title}</h3>
                    <p className="news-card-item-snippet">{newsItem.excerpt}</p>
                    <div className="news-card-footer-meta">
                      <span className="news-card-date-text">
                        {new Date(newsItem.published_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="news-read-more-link">اقرأ المزيد ←</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {hasMoreNews && news.length > 0 && (
            <div className="load-more-container-center">
              <button 
                className="global-load-more-btn" 
                onClick={handleLoadMoreNews}
                disabled={newsLoading}
              >
                {newsLoading ? 'جاري التحميل...' : 'عرض المزيد من الأخبار'}
                <ChevronDown size={18} style={{ marginRight: '8px' }} />
              </button>
            </div>
          )}

          {!newsLoading && news.length === 0 && (
            <div className="no-data-placeholder-box">
              <AlertCircle size={32} />
              <p>لا توجد أخبار متاحة حالياً.</p>
            </div>
          )}
        </section>

        {/* 📹 فيديوهات المنصة */}
        {localVideos.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><MonitorPlay size={26} className="color-primary" /> تقارير المنصة</h2>
            </div>
            <div className="media-bento-grid">
              {localVideos.map((vid, index) => (
                <div key={index} className="premium-media-card is-video-card" onClick={() => setSelectedVideo({ title: vid.title, embed: `<video src="${vid.video_url}" controls autoplay style="width:100%; border-radius:8px;"></video>` })} style={{ cursor: 'pointer', backgroundImage: `url(${vid.thumbnail || 'https://placehold.co/600x400?text=Video'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="video-dark-overlay">
                    <PlayCircle size={45} className="play-icon-glow" />
                  </div>
                  <div className="text-card-content justify-end">
                    <span className="media-badge badge-local">{vid.competition || 'فيديو حصري'}</span>
                    <h3 className="media-card-title text-only-title text-white">{vid.title}</h3>
                  </div>
                </div>
              ))}
            </div>
            {hasMoreLocalVideos && (
              <div className="load-more-center">
                <button className="premium-more-btn" onClick={loadMoreLocalVideos}>
                  <span>عرض المزيد</span> <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 🌐 ملخصات عالمية */}


        {bottomAd && (
          <div className="ad-section-wrapper px-4 mb-8">
            <div className="ad-banner-container">
              {bottomAd.code ? (
                <div dangerouslySetInnerHTML={{ __html: bottomAd.code }} />
              ) : (
                <div className="p-4 bg-slate-900 text-slate-400">{bottomAd.name}</div>
              )}
            </div>
          </div>
        )}

      </main>
      <Footer />

      {selectedVideo && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>
              <X size={28} />
            </button>
            <h3 className="modal-video-title">{selectedVideo.title}</h3>
            <div className="embed-video-container" style={{ height: '400px' }} dangerouslySetInnerHTML={{ __html: selectedVideo.embed }} />
          </div>
        </div>
      )}

    </div>
  );
};

const MatchCardItem = ({ match, isPast = false }) => {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status_short);
  const showScore = isLive || isPast || ['FT', 'AET', 'PEN'].includes(match.status_short);

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
            <img src={match.home_team_logo} alt={match.home_team_name} loading="lazy" onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
            <span className="team-name-text">{match.home_team_name}</span>
          </div>
          <div className="score-display-center">
            {showScore ? (
              <span className={`score-numbers ${isLive ? 'text-live-red' : ''}`}>{match.home_score} : {match.away_score}</span>
            ) : (
              <span className="vs-badge">VS</span>
            )}
          </div>
          <div className="team-meta-block align-right">
            <img src={match.away_team_logo} alt={match.away_team_name} loading="lazy" onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
            <span className="team-name-text">{match.away_team_name}</span>
          </div>
        </div>
        <div className="match-card-footer-info">{match.status_long}</div>
      </div>
    </Link>
  );
};

export default Home;
