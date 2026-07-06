import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown, Calendar, CheckCircle, Newspaper, MonitorPlay } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link, useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const API_BASE_URL = 'https://api.algrinta.com/api';

const isOverdue = (matchDate) => {
  if (!matchDate) return false;
  const matchTime = new Date(matchDate).getTime();
  const hoursElapsed = (Date.now() - matchTime) / (1000 * 60 * 60);
  return hoursElapsed > 3.5;
};

const Home = () => {
  const mainRef = useRef(null);
  const navigate = useNavigate();

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

  const [loadingMain, setLoadingMain] = useState(true);
  const [error, setError] = useState(null);

  // 1. تحسين هائل في السرعة: تحميل البيانات الأساسية أولاً
  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        setLoadingMain(true);
        
        // جلب المباريات والأخبار والفيديوهات المحلية فقط كأولوية قصوى
        const [fixturesRes, articlesRes, videosRes] = await Promise.all([
          fetch(`${API_BASE_URL}/fixtures/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/articles/`).then(res => res.json()).catch(() => []),
          fetch(`${API_BASE_URL}/videos/`).then(res => res.json()).catch(() => [])
        ]);

        // خوارزمية سريعة جداً لتصنيف المباريات بمرور واحد (O(N) بدلاً من O(N^2))
        const live = [];
        const finished = [];
        const upcoming = [];

        if (Array.isArray(fixturesRes)) {
          const now = Date.now();
          fixturesRes.forEach(f => {
            const isLiveStatus = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status_short);
            const isFinishedStatus = ['FT', 'AET', 'PEN'].includes(f.status_short);
            const isFinishedStr = f.status_long?.toLowerCase().includes('انتهت') || f.status_long?.toLowerCase().includes('finished');
            
            if (isLiveStatus && f.status_short !== 'FT' && !isFinishedStr && !isOverdue(f.date)) {
              live.push(f);
            } else if (isFinishedStatus || isFinishedStr || isOverdue(f.date)) {
              finished.push(f);
            } else if (['NS', 'TBD'].includes(f.status_short) && new Date(f.date).getTime() > now - (60 * 60 * 1000)) {
              upcoming.push(f);
            }
          });
        }

        setLiveMatches(live);
        setPastMatches(finished.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setTodayMatches(upcoming);
        
        setNews(Array.isArray(articlesRes) ? articlesRes.sort((a, b) => new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at)) : []);
        setLocalVideos(Array.isArray(videosRes) ? videosRes : []);
        
        setLoadingMain(false); // إخفاء شاشة التحميل فوراً!

        // 2. تحميل البيانات الثانوية (الملخصات الخارجية والإعلانات) في الخلفية لعدم إبطاء الصفحة
        fetch(`${API_BASE_URL}/proxy/highlights/`)
          .then(res => res.json())
          .then(res => {
            // دعم جميع هياكل البيانات المحتملة من الـ API الخارجي
            const externalData = res.response || res.data || (Array.isArray(res) ? res : []);
            setExternalVideos(externalData);
          }).catch(console.error);

        fetch(`${API_BASE_URL}/ads/?page=home`)
          .then(res => res.json())
          .then(res => setAds(Array.isArray(res) ? res : [])).catch(console.error);

      } catch (err) {
        console.error("Error loading core data:", err);
        setError("تعذر الاتصال بخوادم جرينتا الرياضية.");
        setLoadingMain(false);
      }
    };

    fetchCoreData();
  }, []);

  // إصلاح أداء الأنيميشن بحيث يعمل مرة واحدة ولا يسبب بطء مع كل ضغطة "عرض المزيد"
  useEffect(() => {
    if (!loadingMain && !error) {
      let ctx = gsap.context(() => {
        gsap.utils.toArray('.gsap-fade-in').forEach((section) => {
          gsap.fromTo(section, 
            { y: 30, opacity: 0 },
            { scrollTrigger: { trigger: section, start: "top 90%" }, y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
          );
        });
      }, mainRef);
      return () => ctx.revert();
    }
  }, [loadingMain, error]);

  // 3. دالة توجيه واستخراج فيديو دقيقة وقوية 100%
  const handleVideoClick = (item, isExternal = false) => {
    try {
      const safeId = item.id || `vid-${Math.random().toString(36).substring(2, 10)}`;
      let cleanEmbedUrl = '';

      if (isExternal) {
        const mainVideo = item.videos && item.videos.length > 0 ? item.videos[0] : null;
        if (!mainVideo) return; // منع الخطأ إذا لم يكن هناك فيديو
        
        // استخراج رابط الـ src بشكل قوي جداً يتجاهل أي HTML معقد
        if (mainVideo.embed) {
          const match = mainVideo.embed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          cleanEmbedUrl = match ? match[1] : mainVideo.embed; // إذا فشل البحث، يستخدم الكود كما هو لعل وعسى
        }

        navigate(`/video/${safeId}`, { 
          state: { 
            video: {
              id: safeId,
              title: item.title || 'ملخص المباراة',
              embedUrl: cleanEmbedUrl,
              thumbnailUrl: item.thumbnail,
              platform: item.channel || item.competition?.name || 'Dailymotion/Youtube',
              description: "شاهد ملخص المباراة بجودة عالية"
            } 
          } 
        });
      } else {
        navigate(`/video/${safeId}`, { 
          state: { 
            video: {
              id: safeId,
              title: item.title,
              embedUrl: item.video_url,
              thumbnailUrl: item.thumbnail || 'https://placehold.co/600x400?text=Video',
              platform: 'DirectVideo',
              description: item.competition || item.description || "تقرير وفيديو حصري"
            } 
          } 
        });
      }
    } catch (err) {
      console.error("Navigation error:", err);
    }
  };

  if (loadingMain) return <div className="grinta-loading-wrapper" dir="rtl"><div className="grinta-spinner"></div><p>جاري تحميل المنصة...</p></div>;
  if (error) return <div className="grinta-error-wrapper" dir="rtl"><AlertCircle size={50} className="error-pulse" /><p>{error}</p></div>;

  return (
    <div className="home-container" dir="rtl">
      <Navbar />

      <main ref={mainRef}>
        <section className="hero-banner-section">
          <div className="hero-banner-image"></div>
          <div className="hero-banner-overlay"></div>
        </section>

        {/* المباريات المباشرة */}
        {liveMatches.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Flame size={26} className="fire-glow-icon" /> المباريات الجارية الآن</h2>
            </div>
            <div className="matches-responsive-grid">
              {liveMatches.slice(0, visibleLive).map((match, i) => <MatchCardItem key={`live-${match.fixture_id || i}`} match={match} />)}
            </div>
            {visibleLive < liveMatches.length && (
              <div className="load-more-center"><button className="premium-more-btn" onClick={() => setVisibleLive(p => p + 4)}>عرض المزيد <ChevronDown size={18} /></button></div>
            )}
          </section>
        )}

        {/* مباريات اليوم */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar"><h2 className="title-text"><Calendar size={26} className="color-primary mr-2" /> مباريات اليوم القادمة</h2></div>
          {todayMatches.length > 0 ? (
            <>
              <div className="matches-responsive-grid">
                {todayMatches.slice(0, visibleToday).map((match, i) => <MatchCardItem key={`today-${match.fixture_id || i}`} match={match} />)}
              </div>
              {visibleToday < todayMatches.length && (
                <div className="load-more-center"><button className="premium-more-btn" onClick={() => setVisibleToday(p => p + 4)}>عرض المزيد <ChevronDown size={18} /></button></div>
              )}
            </>
          ) : <div className="empty-state-card">لا توجد مباريات مجدولة متبقية اليوم.</div>}
        </section>

        {/* ملخصات عالمية (تم إصلاح العرض والتحويل هنا) */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><MonitorPlay size={26} className="color-accent" /> ملخصات وأهداف عالمية</h2>
          </div>
          {externalVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {externalVideos.slice(0, visibleExtVideos).map((item, idx) => {
                  const safeItem = { ...item, id: item.id || `ext-${idx}` };
                  return (
                    <div key={safeItem.id} onClick={() => handleVideoClick(safeItem, true)} className="video-card-premium cursor-pointer" style={{display: 'block'}}>
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
                          {safeItem.competition?.name || safeItem.competition || 'ملخص المباراة'}
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
                <div className="load-more-center mt-6"><button className="premium-more-btn" onClick={() => setVisibleExtVideos(p => p + 6)}>عرض المزيد <ChevronDown size={18} /></button></div>
              )}
            </>
          ) : <div className="empty-state-card">جاري تحميل الملخصات أو لا توجد ملخصات متاحة الآن.</div>}
        </section>

        {/* فيديوهات المنصة الحصرية */}
        {localVideos.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar"><h2 className="title-text"><MonitorPlay size={26} className="color-primary" /> تقارير وفيديوهات حصرية</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {localVideos.slice(0, visibleLocalVideos).map((vid, index) => {
                const safeItem = { ...vid, id: vid.id || `local-${index}` };
                return (
                  <div key={safeItem.id} onClick={() => handleVideoClick(safeItem, false)} className="video-card-premium cursor-pointer" style={{display: 'block'}}>
                    <div className="video-thumbnail-wrapper relative aspect-video rounded-xl overflow-hidden group">
                      <img src={safeItem.thumbnail || 'https://placehold.co/600x400?text=Video'} alt={safeItem.title} className="thumbnail-img w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                      <div className="play-overlay absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                        <PlayCircle size={48} className="play-icon text-emerald-500" />
                      </div>
                    </div>
                    <div className="video-card-info p-3">
                      <h3 className="video-match-title text-zinc-200 text-sm font-semibold line-clamp-2 text-right group-hover:text-emerald-400 transition">{safeItem.title}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
            {visibleLocalVideos < localVideos.length && (
              <div className="load-more-center mt-6"><button className="premium-more-btn" onClick={() => setVisibleLocalVideos(p => p + 4)}>عرض المزيد <ChevronDown size={18} /></button></div>
            )}
          </section>
        )}

        {/* النتائج السابقة */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar"><h2 className="title-text"><CheckCircle size={26} className="text-gray-400 mr-2" /> نتائج المباريات السابقة</h2></div>
          {pastMatches.length > 0 ? (
            <>
              <div className="matches-responsive-grid">
                {pastMatches.slice(0, visiblePast).map((match, i) => <MatchCardItem key={`past-${match.fixture_id || i}`} match={match} isPast={true} />)}
              </div>
              {visiblePast < pastMatches.length && (
                <div className="load-more-center"><button className="premium-more-btn" onClick={() => setVisiblePast(p => p + 4)}>عرض المزيد <ChevronDown size={18} /></button></div>
              )}
            </>
          ) : <div className="empty-state-card">لا توجد نتائج لمباريات سابقة.</div>}
        </section>

        {/* الأخبار */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar"><h2 className="title-text"><Newspaper size={26} className="color-primary" /> أحدث الأخبار</h2></div>
          {news.length > 0 ? (
            <>
              <div className="media-bento-grid">
                {news.slice(0, visibleNews).map((article, i) => (
                  <Link key={`news-${article.id || i}`} to={`/news/${article.id}`} className="global-card-link-reset" style={{ display: 'block' }}>
                    <div className="premium-media-card text-only-card">
                      <div className="text-card-content">
                        <span className="media-badge">أخبار</span>
                        <h3 className="media-card-title text-only-title">{article.title}</h3>
                        <p className="news-date-text">{new Date(article.created_at || article.published_at || Date.now()).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {visibleNews < news.length && (
                <div className="load-more-center"><button className="premium-more-btn" onClick={() => setVisibleNews(p => p + 4)}>عرض المزيد <ChevronDown size={18} /></button></div>
              )}
            </>
          ) : <div className="empty-state-card">لا توجد أخبار متاحة.</div>}
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
    <Link to={`/match/${match.fixture_id}`} className="global-card-link-reset" style={{display: 'block'}}>
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
