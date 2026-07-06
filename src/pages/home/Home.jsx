import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown, CheckCircle, Newspaper, MonitorPlay, Calendar, X, Target } from 'lucide-react';
import { Helmet } from 'react-helmet'; // إضافة مكتبة السيو القوية
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

const Home = () => {
  const mainRef = useRef(null);

  // --- حالات تخزين البيانات ---
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]); 
  const [news, setNews] = useState([]);
  const [localVideos, setLocalVideos] = useState([]);
  const [externalVideos, setExternalVideos] = useState([]);
  const [goals, setGoals] = useState([]); // حالة الأهداف الجديدة
  const [activeAds, setActiveAds] = useState([]); // تصفية الإعلانات النشطة فقط

  // --- التحكم في عرض العناصر ---
  const [visibleLive, setVisibleLive] = useState(4);
  const [visibleToday, setVisibleToday] = useState(4);
  const [visiblePast, setVisiblePast] = useState(4); 
  const [visibleNews, setVisibleNews] = useState(4);
  const [visibleLocalVideos, setVisibleLocalVideos] = useState(4);
  const [visibleExtVideos, setVisibleExtVideos] = useState(6); 
  const [visibleGoals, setVisibleGoals] = useState(4); // تحكم الأهداف

  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    // جلب البيانات بشكل مستقل ومتوازي لعدم تعطيل تحميل الصفحة (Lazy Data Fetching)
    const fetchFixtures = async () => {
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
      } catch (err) { console.error("Error loading fixtures:", err); }
    };

    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/articles/`);
        const articlesRes = await res.json();
        setNews(Array.isArray(articlesRes) ? articlesRes.sort((a, b) => new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at)) : []);
      } catch (err) { console.error("Error loading news:", err); }
    };

    const fetchLocalVideos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/videos/`);
        const videosRes = await res.json();
        setLocalVideos(Array.isArray(videosRes) ? videosRes : []);
      } catch (err) { console.error("Error loading local videos:", err); }
    };

    const fetchExternalVideos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/highlights/`);
        const extVideosRes = await res.json();
        setExternalVideos(extVideosRes?.data || Array.isArray(extVideosRes) ? extVideosRes : []);
      } catch (err) { console.error("Error loading external highlights:", err); }
    };

    const fetchGoals = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/goals-library/`);
        const goalsRes = await res.json();
        setGoals(Array.isArray(goalsRes) ? goalsRes : []);
      } catch (err) { console.error("Error loading goals:", err); }
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

    // تشغيل الكل فوراً دون أن نوقف واجهة المستخدم
    Promise.allSettled([
      fetchFixtures(), fetchNews(), fetchLocalVideos(), 
      fetchExternalVideos(), fetchGoals(), fetchAds()
    ]).catch(() => setError("حدث خطأ طفيف في مزامنة بعض البيانات."));

  }, []);

  // تحديث GSAP عند تغير البيانات لتجنب مشاكل التمرير
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.gsap-fade-in').forEach((section) => {
        gsap.fromTo(section, 
          { y: 30, opacity: 0 },
          { scrollTrigger: { trigger: section, start: "top 85%" }, y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      });
      ScrollTrigger.refresh();
    }, mainRef);
    return () => ctx.revert();
  }, [liveMatches, todayMatches, news, externalVideos, goals, activeAds, visibleLive, visibleToday, visibleNews, visibleExtVideos, visibleGoals]);

  const closeModal = () => setSelectedVideo(null);

  // تقسيم الإعلانات
  const topAd = activeAds.length > 0 ? activeAds[0] : null;
  const bottomAd = activeAds.length > 1 ? activeAds[1] : (activeAds.length === 1 ? activeAds[0] : null);

  // السكيما الخاصة بالسيو (لجوجل)
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "جرينتا",
    "url": "https://algrinta.com",
    "description": "منصة جرينتا الرياضية - تابع المباريات المباشرة، شاهد أهداف اليوم، وملخصات كروية عالمية.",
    "sameAs": [] 
  };

  return (
    <div className="home-container" dir="rtl">
      {/* 🚀 SEO Engine 🚀 */}
      <Helmet>
        <title>جرينتا | الرئيسية - بث مباشر، أهداف وملخصات حصرية</title>
        <meta name="description" content="منصة جرينتا الرياضية - الأسرع في تغطية المباريات المباشرة، أهداف الدوريات الكبرى فور حدوثها، أحدث الأخبار وملخصات عالمية حصرية." />
        <meta name="keywords" content="مباريات اليوم, بث مباشر, أهداف المباريات, ملخصات كرة قدم, أخبار الرياضة, جرينتا, دوري أبطال أوروبا, الدوري الإنجليزي" />
        <meta property="og:title" content="جرينتا | الرئيسية - بث مباشر، أهداف وملخصات حصرية" />
        <meta property="og:description" content="تابع أحدث المباريات، شاهد الأهداف فور تسجيلها، وتغطية شاملة لكل البطولات." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
      </Helmet>

      <Navbar />

      <main ref={mainRef}>
        {/* البانر الرئيسي */}
        <section className="hero-banner-section">
          <div className="hero-banner-image"></div>
          <div className="hero-banner-overlay"></div>
        </section>

        {/* 📢 إعلان علوي (يظهر فقط إذا وجد إعلان نشط) */}
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

        {/* ⚽ المباريات المباشرة */}
        {liveMatches.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Flame size={26} className="fire-glow-icon" /> المباريات الجارية الآن</h2>
            </div>
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
          </section>
        )}

        {/* 📅 مباريات اليوم (القادمة) */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Calendar size={26} className="color-primary mr-2" /> مباريات اليوم القادمة</h2>
          </div>
          {todayMatches.length > 0 ? (
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

        {/* 🏁 نتائج المباريات السابقة */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><CheckCircle size={26} className="text-gray-400 mr-2" /> نتائج المباريات السابقة</h2>
          </div>
          {pastMatches.length > 0 && (
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

        {/* 🎯 أهداف المباريات (تم إصلاح جلب الصور والأسماء لتطابق السيرفر) */}
        {goals.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Target size={26} className="color-primary mr-2" /> أحدث الأهداف</h2>
            </div>
            <div className="media-bento-grid">
              {goals.slice(0, visibleGoals).map((item, idx) => {
                const safeId = item.id || `goal-id-${idx}`;
                const videoData = { ...item, id: safeId };

                return (
                  <Link 
                    key={safeId} 
                    to={`/video/${safeId}`} 
                    state={{ video: videoData }} 
                    className="global-card-link-reset"
                    style={{ display: 'block' }}
                  >
                    <div className="premium-media-card is-video-card" style={{ cursor: 'pointer' }}>
                      <img src={item.thumbnailUrl || 'https://via.placeholder.com/720x400.png?text=Goals'} alt={item.title} className="media-card-img" loading="lazy" decoding="async" />
                      <div className="video-dark-overlay">
                        <PlayCircle size={55} className="play-icon-glow" />
                      </div>
                      <div className="media-card-gradient" style={{ padding: '1.5rem 1.2rem 1.2rem' }}>
                        <span className="media-badge" style={{
                          backgroundColor: item.platform === 'Twitter' ? '#1DA1F2' : item.platform === 'Btolat' ? '#10b981' : '#3f3f46'
                        }}>
                          {item.platform === 'Btolat' ? 'أهداف' : item.platform}
                        </span>
                        <h3 className="media-card-title">{item.title}</h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {visibleGoals < goals.length && (
              <div className="load-more-center">
                <button className="premium-more-btn" onClick={() => setVisibleGoals(prev => prev + 4)}>
                  <span>عرض المزيد من الأهداف</span> <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 📰 الأخبار */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Newspaper size={26} className="color-primary" /> أحدث الأخبار والتقارير</h2>
          </div>
          {news.length > 0 && (
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
          )}
        </section>

        {/* 📹 فيديوهات المنصة */}
        {localVideos.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><MonitorPlay size={26} className="color-primary" /> تقارير المنصة</h2>
            </div>
            <div className="media-bento-grid">
              {localVideos.slice(0, visibleLocalVideos).map((vid, index) => (
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
              ))}
            </div>
            {visibleLocalVideos < localVideos.length && (
              <div className="load-more-center">
                <button className="premium-more-btn" onClick={() => setVisibleLocalVideos(prev => prev + 4)}>
                  <span>عرض المزيد</span> <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 🌐 فيديوهات الـ API الخارجي (الملخصات) */}
        {externalVideos.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><MonitorPlay size={26} className="color-accent" /> ملخصات عالمية</h2>
            </div>
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
                    <img src={item.thumbnail} alt={item.title} className="media-card-img" loading="lazy" decoding="async" />
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
          </section>
        )}

        {/* 📢 إعلان سفلي (يظهر فقط إذا وجد إعلان نشط) */}
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

      {/* ================= Video Modal ================= */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>
              <X size={28} />
            </button>
            <h3 className="modal-video-title">{selectedVideo.title}</h3>
            <div 
              className="embed-video-container"
              style={{ height: '400px' }}
              dangerouslySetInnerHTML={{ __html: selectedVideo.embed }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

// Component كارت المباراة مع دعم الصور الكسولة (Lazy load)
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
