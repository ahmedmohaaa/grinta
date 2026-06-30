import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown, Newspaper, MonitorPlay, Calendar, X, CheckCircle, Target } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet';

gsap.registerPlugin(ScrollTrigger);

const API_BASE_URL = 'https://api.algrinta.com/api';

// دالة مساعدة للتحقق مما إذا كان قد مر وقت طويل على المباراة (أكثر من 3.5 ساعات)
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
  const [goalsData, setGoalsData] = useState([]); 
  const [ads, setAds] = useState([]);

  // --- التحكم في عرض العناصر ---
  const [visibleLive, setVisibleLive] = useState(4);
  const [visibleToday, setVisibleToday] = useState(4);
  const [visiblePast, setVisiblePast] = useState(4); 
  const [visibleNews, setVisibleNews] = useState(4);
  const [visibleLocalVideos, setVisibleLocalVideos] = useState(4);
  const [visibleExtVideos, setVisibleExtVideos] = useState(6); 
  const [visibleGoals, setVisibleGoals] = useState(4);

  // حالة النافذة المنبثقة للفيديو
  const [selectedVideo, setSelectedVideo] = useState(null);

  // =====================================================================
  // 🚀 استراتيجية التحميل المستقل (Independent Fetching for Max Speed)
  // =====================================================================
  useEffect(() => {
    
    // 1. جلب المباريات
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
        
        const upcoming = fixturesRes.filter?.(f => {
            const isUpcomingStatus = ['NS', 'TBD'].includes(f.status_short);
            const notLiveOrFinished = !live.some(lm => lm.fixture_id === f.fixture_id) && !finished.some(fm => fm.fixture_id === f.fixture_id);
            const isFuture = new Date(f.date).getTime() > new Date().getTime() - (60 * 60 * 1000);
            return isUpcomingStatus && notLiveOrFinished && isFuture;
        }) || [];

        setLiveMatches(live);
        setPastMatches(finished.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setTodayMatches(upcoming);
      } catch (err) { console.error("Error fetching fixtures:", err); }
    };

    // 2. جلب الأهداف (مع دعم قوي لهيكل الـ JSON)
    const fetchGoals = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/goals-library/`);
        const data = await res.json();
        // دعم لـ data.data أو المصفوفة المباشرة لضمان عدم اختفاء الفيديوهات
        setGoalsData(data?.data || (Array.isArray(data) ? data : []));
      } catch (err) { console.error("Error fetching goals:", err); }
    };

    // 3. جلب الأخبار
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/articles/`);
        const data = await res.json();
        const articles = data?.data || (Array.isArray(data) ? data : []);
        setNews(articles.sort((a, b) => new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at)));
      } catch (err) { console.error("Error fetching news:", err); }
    };

    // 4. جلب الإعلانات
    const fetchAds = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ads/?page=home`);
        const data = await res.json();
        setAds(data?.data || (Array.isArray(data) ? data : []));
      } catch (err) { console.error("Error fetching ads:", err); }
    };

    // 5. جلب الفيديوهات المحلية
    const fetchLocalVideos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/videos/`);
        const data = await res.json();
        setLocalVideos(data?.data || (Array.isArray(data) ? data : []));
      } catch (err) { console.error("Error fetching local videos:", err); }
    };

    // 6. جلب الملخصات الخارجية
    const fetchExternalVideos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/highlights/`);
        const data = await res.json();
        setExternalVideos(data?.data || (Array.isArray(data) ? data : []));
      } catch (err) { console.error("Error fetching external highlights:", err); }
    };

    // استدعاء جميع الدوال لتعمل بشكل موازي دون أن تعطل بعضها البعض
    fetchFixtures();
    fetchGoals();
    fetchNews();
    fetchAds();
    fetchLocalVideos();
    fetchExternalVideos();
  }, []);

  // تشغيل GSAP عند تغير البيانات
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.gsap-fade-in').forEach((section) => {
        gsap.fromTo(section, 
          { y: 25, opacity: 0 },
          { scrollTrigger: { trigger: section, start: "top 88%" }, y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        );
      });
    }, mainRef);
    return () => ctx.revert();
  }, [liveMatches.length, todayMatches.length, goalsData.length, news.length]);

  const closeModal = () => setSelectedVideo(null);
  const activeAds = ads.filter(ad => ad.status === 'active');

  // تم إزالة شاشة التحميل المعطلة (loading). الصفحة ستفتح فوراً.

  return (
    <div className="home-container" dir="rtl">
      
      <Helmet>
        <title>الجرينتا | مباريات اليوم، أهداف وملخصات حصرية</title>
        <meta name="description" content="منصة الجرينتا الرياضية - تابع نتائج المباريات بث مباشر، شاهد أحدث الأهداف، الملخصات العالمية، وأخبار كرة القدم الموثوقة لحظة بلحظة." />
      </Helmet>

      <Navbar />

      <main ref={mainRef}>
        {/* البانر الرئيسي */}
        <header className="hero-banner-section" aria-label="البانر الرئيسي للموقع">
          <div className="hero-banner-image"></div>
          <div className="hero-banner-overlay"></div>
        </header>

        {/* 📢 الإعلان العلوي */}
        {activeAds.length > 0 && (
          <section className="top-ad-wrapper gsap-fade-in" style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem', background: 'var(--grinta-dark-bg)' }}>
            <div className="ad-banner" style={{ width: '100%', maxWidth: '900px', borderRadius: '12px', overflow: 'hidden' }}>
              {activeAds[0].code ? (
                <div dangerouslySetInnerHTML={{ __html: activeAds[0].code }} />
              ) : (
                <div style={{ padding: '20px', background: '#1e293b', textAlign: 'center', color: '#94a3b8' }}>
                  {activeAds[0].name} - مساحة إعلانية
                </div>
              )}
            </div>
          </section>
        )}

        {/* ⚽ المباريات المباشرة */}
        {liveMatches.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h1 className="title-text"><Flame size={26} className="fire-glow-icon" /> المباريات الجارية الآن</h1>
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

        {/* 📅 مباريات اليوم (القادمة) */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Calendar size={26} className="color-primary mr-2" /> مباريات اليوم القادمة</h2>
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

        {/* 🎯 مكتبة الأهداف الحصرية (تم معالجة المشكلة والتسريع) */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Target size={26} className="color-primary mr-2" /> أحدث الأهداف</h2>
          </div>
          {goalsData.length > 0 ? (
            <>
              <div className="media-bento-grid">
                {goalsData.slice(0, visibleGoals).map((item, idx) => (
                  <div 
                    key={idx} 
                    className="premium-media-card is-video-card" 
                    onClick={() => setSelectedVideo({ 
                      title: `أهداف مباراة ${item.home_team} و ${item.away_team}`, 
                      embed: `<iframe src="${item.embed_url}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture" style="width:100%; height:500px; border:none; border-radius:12px;" loading="lazy"></iframe>`
                    })}
                    style={{ cursor: 'pointer', backgroundImage: `url(${item.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    <div className="video-dark-overlay">
                      <PlayCircle size={55} className="play-icon-glow" />
                    </div>
                    <div className="media-card-gradient">
                      <span className="media-badge badge-external">{item.platform}</span>
                      <h3 className="media-card-title">{item.home_team} ضد {item.away_team}</h3>
                      <p className="text-emerald-400 font-bold mt-1 text-sm">النتيجة: {item.score}</p>
                    </div>
                  </div>
                ))}
              </div>
              {visibleGoals < goalsData.length && (
                <div className="load-more-center">
                  <button className="premium-more-btn" onClick={() => setVisibleGoals(prev => prev + 4)}>
                    <span>عرض المزيد من الأهداف</span> <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-card">جاري تحديث مكتبة الأهداف... (البيانات ستظهر تلقائياً فور توفرها)</div>
          )}
        </section>

        {/* 🏁 نتائج المباريات السابقة */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><CheckCircle size={26} className="text-gray-400 mr-2" /> نتائج المباريات السابقة</h2>
          </div>
          {pastMatches.length > 0 ? (
            <>
              <div className="matches-responsive-grid">
                {pastMatches.slice(0, visiblePast).map(match => (
                  <MatchCardItem key={match.id} match={match} isPast={true} />
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
          ) : (
            <div className="empty-state-card">لا توجد نتائج لمباريات سابقة.</div>
          )}
        </section>

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
                    <article className="premium-media-card text-only-card">
                      <div className="text-card-content">
                        <span className="media-badge">أخبار عاجلة</span>
                        <h3 className="media-card-title text-only-title">{article.title}</h3>
                        <time className="news-date-text" dateTime={article.created_at || article.published_at}>
                          {new Date(article.created_at || article.published_at || Date.now()).toLocaleDateString('ar-EG')}
                        </time>
                      </div>
                    </article>
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
                      onClick={() => setSelectedVideo({ title: vid.title, embed: `<video src="${vid.video_url}" controls autoplay style="width:100%; border-radius:8px; outline: none;"></video>` })}
                      style={{ cursor: 'pointer', backgroundImage: `url(${vid.thumbnail || 'https://placehold.co/600x400?text=Video'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                      <div className="video-dark-overlay">
                        <PlayCircle size={45} className="play-icon-glow" />
                      </div>
                      <div className="media-card-gradient text-card-content justify-end" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.95) 10%, transparent 100%)', height: '100%'}}>
                        <span className="media-badge badge-local">{vid.competition || 'فيديو حصري'}</span>
                        <h3 className="media-card-title text-white">{vid.title}</h3>
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

        {/* 🌐 ملخصات عالمية */}
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
                      {/* تفعيل التحميل الكسول للصور */}
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
            </>
          ) : (
            <div className="empty-state-card">لا توجد ملخصات عالمية متاحة الآن.</div>
          )}
        </section>

        {/* 📢 قسم الإعلانات السفلي */}
        {activeAds.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="ads-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', margin: '20px 0' }}>
              {activeAds.map((ad, index) => (
                <div key={ad.id || index} className="ad-banner" style={{ width: '100%', maxWidth: '900px', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                  {ad.code ? (
                    <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: ad.code }} />
                  ) : (
                    <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', width: '100%' }}>
                      {ad.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer />

      {/* ================= Video Modal ================= */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={closeModal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal} aria-label="إغلاق الفيديو">
              <X size={28} />
            </button>
            <h3 id="modal-title" className="modal-video-title">{selectedVideo.title}</h3>
            
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

const MatchCardItem = ({ match, isPast = false }) => {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status_short);
  const showScore = isLive || isPast || ['FT', 'AET', 'PEN'].includes(match.status_short);

  return (
    <Link to={`/match/${match.fixture_id}`} className="global-card-link-reset" title={`مباراة ${match.home_team_name} ضد ${match.away_team_name}`}>
      <article className={`premium-match-card ${isLive ? 'border-pulse-live' : ''}`}>
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
            <img src={match.home_team_logo} alt={`شعار ${match.home_team_name}`} loading="lazy" decoding="async" onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
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
            <img src={match.away_team_logo} alt={`شعار ${match.away_team_name}`} loading="lazy" decoding="async" onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
            <span className="team-name-text">{match.away_team_name}</span>
          </div>
        </div>
        <div className="match-card-footer-info">{match.status_long}</div>
      </article>
    </Link>
  );
};

export default Home;
