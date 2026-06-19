import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown, Trophy, Newspaper, MonitorPlay, Calendar } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

// الاعتماد المباشر على سيرفر الدومين الخاص بك
const API_BASE_URL = 'https://api.algrinta.com/api';

// معرفات الدوريات الكبرى المستهدفة من API-Sports (الانجليزي، الاسباني، الإيطالي، الفرنسي، المصري، السعودي)
const TARGET_LEAGUE_IDS = [39, 140, 135, 61, 233, 307];

const Home = () => {
  const mainRef = useRef(null);

  // --- حالات تخزين البيانات القادمة من الـ API الحقيقي ---
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [news, setNews] = useState([]);
  const [localVideos, setLocalVideos] = useState([]);
  const [externalVideos, setExternalVideos] = useState([]);
  const [ads, setAds] = useState([]);

  // --- التحكم في عرض 4 عناصر فقط في كل مرة عند ضغط "عرض المزيد" ---
  const [visibleLive, setVisibleLive] = useState(4);
  const [visibleToday, setVisibleToday] = useState(4);
  const [visibleNews, setVisibleNews] = useState(4);
  const [visibleLocalVideos, setVisibleLocalVideos] = useState(4);
  const [visibleExtVideos, setVisibleExtVideos] = useState(4);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // جلب البيانات المتوازية لسرعة تحميل فائقة للمنصة
        const [fixturesRes, leaguesRes, articlesRes, videosRes, adsRes, extVideosRes] = await Promise.all([
          fetch(`${API_BASE_URL}/fixtures/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/leagues/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/articles/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/videos/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/ads/?page=home`).then(res => res.json()),
          // جلب الفيديوهات الخارجية من الـ Proxy المقابل لـ MatchHighlightsProxyView في urls.py الخاص بك
          fetch(`${API_BASE_URL}/proxy/matches/highlights/`).then(res => res.json()).catch(() => null)
        ]);

        // 1. فلترة وتوزيع المباريات (مباشر ومجدول) بناءً على الحقول الحقيقية في داتا المزامنة لديك
        const live = fixturesRes.filter(f => ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status_short));
        const upcoming = fixturesRes.filter(f => f.status_short === 'NS' || f.status_short === 'TBD');
        
        setLiveMatches(live);
        setTodayMatches(upcoming);
        
        // 2. فلترة الدوريات الشائعة لتعرض فقط الدوريات الكبرى المطلوبة بدقة
        const filteredLeagues = leaguesRes.filter(league => 
          TARGET_LEAGUE_IDS.includes(Number(league.league_id))
        );
        // إذا كان الباك إند لم يقم بمزامنة كل الدوريات بعد، نعرض المتاح أو أول 6 عناصر مرتبة
        setLeagues(filteredLeagues.length > 0 ? filteredLeagues : leaguesRes.slice(0, 6));
        
        // 3. ترتيب الأخبار برمجياً للتأكد من عرض "آخر وأحدث الأخبار أولاً" (Descending Order)
        const sortedNews = articlesRes.sort((a, b) => {
          return new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at);
        });
        setNews(sortedNews);

        // 4. ضبط فيديوهات المنصة الداخلية
        setLocalVideos(videosRes);
        setAds(adsRes);

        // 5. معالجة داتا الفيديوهات الخارجية القادمة من الـ ScoreBat Proxy الخاص بك
        if (extVideosRes && extVideosRes.data) {
          setExternalVideos(extVideosRes.data);
        } else if (extVideosRes && Array.isArray(extVideosRes)) {
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

  // تشغيل حركات ومؤثرات دخول العناصر الاحترافية GSAP
  useEffect(() => {
    if (!loading && !error) {
      const ctx = gsap.context(() => {
        gsap.utils.toArray('.gsap-fade-in').forEach((section) => {
          gsap.fromTo(section, 
            { y: 25, opacity: 0 },
            {
              scrollTrigger: { trigger: section, start: "top 88%" },
              y: 0, opacity: 1, duration: 0.6, ease: "power3.out"
            }
          );
        });
      }, mainRef);
      return () => ctx.revert();
    }
  }, [loading, error, visibleLive, visibleToday, visibleNews, visibleLocalVideos, visibleExtVideos]);

  if (loading) return <div className="grinta-loading-wrapper" dir="rtl"><div className="grinta-spinner"></div><p>جاري مزامنة البيانات المباشرة...</p></div>;
  if (error) return <div className="grinta-error-wrapper" dir="rtl"><AlertCircle size={50} className="error-pulse" /><p>{error}</p></div>;

  return (
    <div className="home-container" dir="rtl">
      <Navbar />

      <main ref={mainRef}>
        {/* البانر الرئيسي - صورة جمالية نظيفة */}
        <section className="hero-banner-section">
          <div className="hero-banner-image"></div>
          <div className="hero-banner-overlay"></div>
        </section>

        {/* ⚽ قسـم المباريات المباشرة الآن */}
        {liveMatches.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Flame size={26} className="fire-glow-icon" /> المباريات الجارية الآن المباشرة</h2>
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

        {/* 📅 قسـم مباريات اليوم القادمة */}
        <section className="section-layout gsap-fade-in">
          <div className="section-title-bar">
            <h2 className="title-text"><Trophy size={26} className="color-primary" /> جدول مباريات اليوم المجدولة</h2>
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

        {/* 🏆 قسـم الدوريات الشائعة (الدوريات الستة الكبرى) */}
        {leagues.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text">الدوريات الشائعة والكبرى</h2>
            </div>
            <div className="leagues-horizontal-scroll">
              {leagues.map((league) => (
                <Link key={league.id} to={`/league/${league.league_id}/2026`} className="league-card-anchor">
                  <div className="league-glass-card">
                    <img src={league.logo} alt={league.name} onError={(e) => e.target.src = "https://placehold.co/80x80?text=League"} />
                    <span className="league-card-title">{league.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 📰 قسـم أحدث الأخبار الرياضية (مرتبة تلقائياً من الأحدث للأقدم) */}
        {news.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><Newspaper size={26} className="color-primary" /> أحدث الأخبار والتقارير الحصرية</h2>
            </div>
            
            <div className="media-bento-grid">
              {news.slice(0, visibleNews).map(article => (
                <div key={article.id} className="premium-media-card">
                  <img src={article.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600'} alt={article.title} className="media-card-img" />
                  <div className="media-card-gradient">
                    <span className="media-badge">أخبار عاجلة</span>
                    <h3 className="media-card-title">{article.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            {visibleNews < news.length && (
              <div className="load-more-center">
                <button className="premium-more-btn" onClick={() => setVisibleNews(prev => prev + 4)}>
                  <span>عرض المزيد من الأخبار</span> <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 📹 قسـم فيديوهات المنصة (الداخلية) */}
        {localVideos.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><MonitorPlay size={26} className="color-primary" /> تقارير وفيديوهات منصة جرينتا</h2>
            </div>
            
            <div className="media-bento-grid">
              {localVideos.slice(0, visibleLocalVideos).map(vid => (
                <div key={vid.id} className="premium-media-card is-video-card">
                  <div className="video-dark-overlay">
                    <PlayCircle size={55} className="play-icon-glow" />
                  </div>
                  <div className="media-card-gradient">
                    <span className="media-badge badge-local">فيديو حصري</span>
                    <h3 className="media-card-title">{vid.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            {visibleLocalVideos < localVideos.length && (
              <div className="load-more-center">
                <button className="premium-more-btn" onClick={() => setVisibleLocalVideos(prev => prev + 4)}>
                  <span>عرض المزيد من الفيديوهات</span> <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 🌐 قسـم فيديوهات الـ API الخارجي (ScoreBat Highlights) */}
        {externalVideos.length > 0 && (
          <section className="section-layout gsap-fade-in">
            <div className="section-title-bar">
              <h2 className="title-text"><MonitorPlay size={26} className="color-accent" /> أهداف وملخصات الملاعب العالمية</h2>
            </div>
            
            <div className="media-bento-grid">
              {externalVideos.slice(0, visibleExtVideos).map((extVid, idx) => (
                <div key={idx} className="premium-media-card is-video-card" onClick={() => extVid.url && window.open(extVid.url, '_blank')}>
                  <img src={extVid.thumbnail || 'https://images.unsplash.com/photo-1518605368461-1e1e38ce8ba4?q=80&w=600'} alt={extVid.title} className="media-card-img" />
                  <div className="video-dark-overlay">
                    <PlayCircle size={55} className="play-icon-glow" />
                  </div>
                  <div className="media-card-gradient">
                    <span className="media-badge badge-external">ملخص عالمي</span>
                    <h3 className="media-card-title">{extVid.title || 'أهداف المباراة'}</h3>
                  </div>
                </div>
              ))}
            </div>

            {visibleExtVideos < externalVideos.length && (
              <div className="load-more-center">
                <button className="premium-more-btn" onClick={() => setVisibleExtVideos(prev => prev + 4)}>
                  <span>عرض المزيد من الملخصات</span> <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

// مكون كارت المباراة الفرعي المنفصل لضمان جودة ونظافة الكود المعماري
const MatchCardItem = ({ match }) => {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status_short);
  
  return (
    <Link to={`/match/${match.fixture_id}`} className="global-card-link-reset">
      <div className={`premium-match-card ${isLive ? 'border-pulse-live' : ''}`}>
        <div className="match-card-meta">
          <span className="league-badge-text">{match.league?.name || 'بطولة كروية'}</span>
          {isLive ? (
            <span className="live-status-indicator">
              <span className="pulse-dot"></span>
              بث مباشر '{match.elapsed}
            </span>
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
              <span className={`score-numbers ${isLive ? 'text-live-red' : ''}`}>
                {match.home_score} : {match.away_score}
              </span>
            ) : (
              <span className="vs-badge">VS</span>
            )}
          </div>
          
          <div className="team-meta-block align-right">
            <img src={match.away_team_logo} alt={match.away_team_name} onError={(e) => e.target.src='https://placehold.co/45x45?text=Team'} />
            <span className="team-name-text">{match.away_team_name}</span>
          </div>
        </div>
        
        <div className="match-card-footer-info">
          {match.status_long}
        </div>
      </div>
    </Link>
  );
};

export default Home;
