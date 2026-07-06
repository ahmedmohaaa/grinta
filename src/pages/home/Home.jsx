import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown, Calendar, X, CheckCircle, Newspaper, MonitorPlay } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link, useNavigate } from "react-router-dom"; // 👈 تم إضافة useNavigate هنا

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
  const navigate = useNavigate(); // 👈 تفعيل دالة التنقل بين الصفحات

  // --- حالات تخزين البيانات ---
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]); 
  const [news, setNews] = useState([]);
  const [localVideos, setLocalVideos] = useState([]);
  const [externalVideos, setExternalVideos] = useState([]);
  const [ads, setAds] = useState([]);

  // --- التحكم في عرض العناصر ---
  const [visibleLive, setVisibleLive] = useState(4);
  const [visibleToday, setVisibleToday] = useState(4);
  const [visiblePast, setVisiblePast] = useState(4); 
  const [visibleNews, setVisibleNews] = useState(4);
  const [visibleLocalVideos, setVisibleLocalVideos] = useState(4);
  const [visibleExtVideos, setVisibleExtVideos] = useState(6); 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        const [fixturesRes, articlesRes, videosRes, adsRes, extVideosRes] = await Promise.all([
          fetch(`${API_BASE_URL}/fixtures/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/articles/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/videos/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/ads/?page=home`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/proxy/highlights/`).then(res => res.json()).catch(() => null)
        ]);

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
        
        const sortedNews = Array.isArray(articlesRes) 
          ? articlesRes.sort((a, b) => new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at))
          : [];
        setNews(sortedNews);

        setLocalVideos(Array.isArray(videosRes) ? videosRes : []);
        setAds(Array.isArray(adsRes) ? adsRes : []);

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
  }, [loading, error, visibleLive, visibleToday, visiblePast, visibleNews, visibleLocalVideos, visibleExtVideos]);

  // 👈 دالة موحدة لتحويل الفيديوهات إلى صفحة التفاصيل بشكل احترافي ومتوافق
  const handleVideoClick = (item, isExternal = false) => {
    const safeId = item.id || `home-vid-${Math.random().toString(36).substr(2, 9)}`;
    
    let videoData = {};
    if (isExternal) {
      const mainVideo = item.videos && item.videos.length > 0 ? item.videos[0] : null;
      let cleanEmbedUrl = '';
      
      // استخراج الـ src فقط من وسام الـ iframe الخارجي إن وجد لمنع كسر الصفحة
      if (mainVideo && mainVideo.embed) {
        if (mainVideo.embed.includes('src=')) {
          const srcMatch = mainVideo.embed.match(/src=["']([^"']+)["']/);
          cleanEmbedUrl = srcMatch ? srcMatch[1] : mainVideo.embed;
        } else {
          cleanEmbedUrl = mainVideo.embed;
        }
      }

      videoData = {
        id: safeId,
        title: item.title,
        embedUrl: cleanEmbedUrl,
        thumbnailUrl: item.thumbnail,
        platform: item.channel || 'Dailymotion',
        description: "شاهد ملخص المباراة بجودة عالية - البث العالمي المستضاف"
      };
    } else {
      // الفيديوهات المحلية المرفوعة للمنصة
      videoData = {
        id: safeId,
        title: item.title,
        embedUrl: item.video_url,
        thumbnailUrl: item.thumbnail || 'https://placehold.co/600x400?text=Video',
        platform: 'DirectVideo',
        description: item.competition || "تقرير وفيديو حصري من عدسة المنصة"
      };
    }

    navigate(`/video/${safeId}`, { state: { video: videoData } });
  };

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

        {/* 📢 قسم الإعلانات */}
        {ads.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="ads-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', margin: '20px 0' }}>
              {ads.filter(ad => ad.status === 'active').map((ad, index) => (
                <div key={ad.id || index} className="ad-banner" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
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

        {/* 📹 فيديوهات المنصة (تقارير المنصة) */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><MonitorPlay size={26} className="color-primary" /> تقارير المنصة</h2>
          </div>
          {localVideos.length > 0 ? (
            <>
              {/* 👈 تعديل شكل الشبكة ليأخذ نفس استايل الكروت المنفصلة لصفحة الفيديوهات */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {localVideos.slice(0, visibleLocalVideos).map((vid, index) => {
                  const safeItem = { ...vid, id: vid.id || `local-${index}` };
                  return (
                    <div 
                      key={safeItem.id} 
                      className="video-card-premium cursor-pointer" 
                      onClick={() => handleVideoClick(safeItem, false)}
                    >
                      <div className="video-thumbnail-wrapper relative aspect-video rounded-xl overflow-hidden group">
                        <img 
                          src={safeItem.thumbnail || 'https://placehold.co/600x400?text=Video'} 
                          alt={safeItem.title} 
                          className="thumbnail-img w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                        />
                        <div className="play-overlay absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                          <PlayCircle size={48} className="play-icon text-emerald-500" />
                        </div>
                        <span className="competition-badge absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded font-medium">
                          {safeItem.competition || 'فيديو حصري'}
                        </span> 
                      </div>
                      <div className="video-card-info p-3">
                        <h3 className="video-match-title text-zinc-200 text-sm font-semibold line-clamp-2 text-right group-hover:text-emerald-400 transition">
                          {safeItem.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleLocalVideos < localVideos.length && (
                <div className="load-more-center mt-6">
                  <button className="premium-more-btn" onClick={() => setVisibleLocalVideos(prev => prev + 4)}>
                    <span>عرض المزيد من التقارير</span> <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-card">لا توجد فيديوهات حصرية مرفوعة حالياً.</div>
          )}
        </section>

        {/* 🌐 فيديوهات الـ API الخارجي (ملخصات عالمية) */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><MonitorPlay size={26} className="color-accent" /> ملخصات عالمية (مباشر)</h2>
          </div>
          {externalVideos.length > 0 ? (
            <>
              {/* 👈 تعديل الاستايل وتحويله لكروت مستقلة واضحة تحمل صورة وتحتها العنوان */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {externalVideos.slice(0, visibleExtVideos).map((item, idx) => {
                  const mainVideo = item.videos && item.videos.length > 0 ? item.videos[0] : null;
                  if (!mainVideo) return null;
                  const safeItem = { ...item, id: item.id || `ext-${idx}` };

                  return (
                    <div 
                      key={safeItem.id} 
                      className="video-card-premium cursor-pointer" 
                      onClick={() => handleVideoClick(safeItem, true)}
                    >
                      <div className="video-thumbnail-wrapper relative aspect-video rounded-xl overflow-hidden group">
                        <img 
                          src={safeItem.thumbnail || 'https://via.placeholder.com/720x400.png?text=Highlights'} 
                          alt={safeItem.title} 
                          className="thumbnail-img w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                        />
                        <div className="play-overlay absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                          <PlayCircle size={48} className="play-icon text-emerald-500" />
                        </div>
                        <span className="competition-badge absolute top-3 right-3 bg-teal-600 text-white text-xs px-2 py-1 rounded font-medium">
                          {safeItem.competition || 'ملخص المباراة'}
                        </span> 
                      </div>
                      <div className="video-card-info p-3">
                        <h3 className="video-match-title text-zinc-200 text-sm md:text-base font-semibold line-clamp-2 text-right group-hover:text-emerald-400 transition">
                          {safeItem.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleExtVideos < externalVideos.length && (
                <div className="load-more-center mt-6">
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
            <img src={match.home_team_logo} alt={match.home_team_name} onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
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
