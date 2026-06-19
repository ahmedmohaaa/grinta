import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Trophy, ChevronLeft, Flame, AlertCircle } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link } from "react-router-dom";
gsap.registerPlugin(ScrollTrigger);

// تحديد الرابط الأساسي للباك إند الخاص بك في دجانغو
const API_BASE_URL = 'https://api.algrinta.com/api';

const Home = () => {
  const mainRef = useRef(null);

  // حالات تخزين البيانات القادمة من الـ API الحقيقي
  const [heroMatch, setHeroMatch] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [ads, setAds] = useState([]);

  // حالات التحميل والخطأ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // جلب كل البيانات بالتوازي لضمان أفضل أداء وسرعة للموقع
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        const [
          fixturesRes, 
          leaguesRes, 
          articlesRes, 
          videosRes, 
          adsRes
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/fixtures/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/leagues/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/articles/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/videos/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/ads/?page=home`).then(res => res.json()) // فلترة الإعلانات الخاصة بالصفحة الرئيسية
        ]);

        // 1. معالجة المباريات (مباشر / اليوم / قمة اليوم)
        // بناءً على الموديل الخاص بك: status_short يحتوي على حالة المباراة
        // الحالات المباشرة الشهيرة في API-Sports مثل: 1H, 2H, HT, ET, P
        const live = fixturesRes.filter(f => ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status_short));
        const upcoming = fixturesRes.filter(f => f.status_short === 'NS'); // NS = Not Started
        
        setLiveMatches(live);
        setTodayMatches(upcoming);
        
        // اختيار أول مباراة كبرى قادمة أو مباشرة لتكون الـ Hero Section
        if (live.length > 0) {
          setHeroMatch(live[0]);
        } else if (upcoming.length > 0) {
          setHeroMatch(upcoming[0]);
        }

        // 2. تخزين باقي البيانات القادمة من الموديلز الأخرى
        setLeagues(leaguesRes.slice(0, 8)); // جلب أول 8 دوريات شائعة
        setNews(articlesRes.slice(0, 6));   // جلب آخر 6 أخبار
        setVideos(videosRes.slice(0, 4));   // جلب آخر 4 فيديوهات
        setAds(adsRes);                     // تخزين الإعلانات النشطة

        setLoading(false);
      } catch (err) {
        console.error("Error fetching Grinta data:", err);
        setError("عذراً، حدث خطأ أثناء الاتصال بالسيرفر. يرجى التحقق من تشغيل دجانغو وسيليري.");
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // تشغيل حركات GSAP بعد انتهاء التحميل وظهور العناصر في الـ DOM
  useEffect(() => {
    if (!loading && !error) {
      const ctx = gsap.context(() => {
        gsap.utils.toArray('.gsap-section').forEach((sec) => {
          gsap.fromTo(sec, 
            { y: 40, opacity: 0 },
            {
              scrollTrigger: {
                trigger: sec,
                start: "top 85%",
              },
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out"
            }
          );
        });
      }, mainRef);
      return () => ctx.revert();
    }
  }, [loading, error]);

  // دالة مساعدة لجلب كود الإعلان بناءً على الموضع المضاف في الـ Django Admin (top, middle, bottom)
  const renderAd = (position) => {
    const activeAd = ads.find(ad => ad.position === position && ad.status === 'active');
    if (!activeAd) return null;
    
    // حقن كود أدسنس الذي قمت بكتابته في قاعدة البيانات بأمان
    return (
      <div 
        className="adsense-container gsap-section" 
        dangerouslySetInnerHTML={{ __html: activeAd.code }} 
      />
    );
  };

  if (loading) {
    return (
      <div className="loading-screen" dir="rtl">
        <div className="loader-spinner"></div>
        <p>جاري تحميل منصة جرينتا الرياضية...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen" dir="rtl">
        <AlertCircle size={48} className="text-red-500" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="hero-btn">إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="home-container" dir="rtl">
      <Navbar />

      <main ref={mainRef}>
        {/* ================= 2. HERO SECTION (ديناميكي بالكامل) ================= */}
        {heroMatch && (
          <section className="hero-section">
            <div className="hero-bg" ></div>
            <div className="hero-gradient"></div>
            
            <div className="hero-content">
              <div className="hero-badge">
                {['1H', '2H', 'HT'].includes(heroMatch.status_short) ? 'مباراة مباشرة الآن ⚽' : 'أبرز مباريات اليوم 🏆'}
              </div>
              <div className="hero-match-card">
                <div className="hero-team">
                  <img src={heroMatch.home_team_logo} alt={heroMatch.home_team_name} className="hero-team-logo" />
                  <span className="hero-team-name">{heroMatch.home_team_name}</span>
                </div>
                
                <div className="hero-score-area">
                  {['1H', '2H', 'HT'].includes(heroMatch.status_short) ? (
                    <span className="hero-live-score">{heroMatch.home_score} - {heroMatch.away_score}</span>
                  ) : (
                    <span className="hero-time">
                      {new Date(heroMatch.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="hero-vs">VS</span>
                  <span className="hero-status-text">{heroMatch.status_long}</span>
                </div>

                <div className="hero-team">
                  <img src={heroMatch.away_team_logo} alt={heroMatch.away_team_name} className="hero-team-logo" />
                  <span className="hero-team-name">{heroMatch.away_team_name}</span>
                </div>
              </div>
              
<Link to={`/match/${heroMatch.fixture_id}`} className="hero-btn-link">
                <button className="hero-btn">مشاهدة الإحصائيات والتفاصيل</button>
              </Link>
            </div>
          </section>
        )}

        {/* الإعلان العلوي من دجانغو */}
        {renderAd('top')}

        {/* ================= 3. المباريات المباشرة ================= */}
        {liveMatches.length > 0 && (
          <section className="section-container gsap-section">
            <div className="section-header">
              <h2 className="section-title">
                 <Flame size={28} className="live-fire-icon" /> 
                 المباريات الجارية الآن (Live)
              </h2>
              <a href="/live-scores" className="view-all">شاشة النتائج المباشرة <ChevronLeft size={16} /></a>
            </div>
            
            <div className="matches-grid">
              {liveMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* ================= 4. مباريات اليوم ================= */}
        <section className="section-container gsap-section">
          <div className="section-header">
            <h2 className="section-title">مباريات اليوم القادمة</h2>
            <a href="/matches" className="view-all">جدول المباريات بالكامل <ChevronLeft size={16} /></a>
          </div>
          {todayMatches.length > 0 ? (
            <div className="matches-grid">
              {todayMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="no-data-box">لا توجد مباريات أخرى مجدولة لليوم.</div>
          )}
        </section>

        {/* ================= 5. الدوريات الشائعة ================= */}
        <section className="section-container gsap-section">
          <div className="section-header">
            <h2 className="section-title">الدوريات الشائعة</h2>
          </div>
          <div className="leagues-container">
{leagues.map((league) => (
  <Link
    key={league.id}
    to={`/league/${league.league_id}/2026`}
    className="league-card-link"
  >
    <div className="league-card">
      <img
        src={league.logo}
        alt={league.name}
        onError={(e) => {
          e.target.src =
            "https://placehold.co/60x60?text=League";
        }}
      />

      <span>{league.name}</span>
    </div>
  </Link>
))}
          </div>
        </section>

        {/* الإعلان الأوسط من دجانغو */}
        {renderAd('middle')}

        {/* ================= 6 & 7. الأخبار والأهداف (بنتو جريد احترافي) ================= */}
        <section className="section-container gsap-section">
          <div className="section-header">
            <h2 className="section-title">أحدث التقارير والميديا الرياضية</h2>
          </div>
          
          <div className="bento-grid">
            {/* عرض آخر الأخبار القادمة من الـ NewsAPI وعبر الـ Article Model */}
            {news.map(article => (
              <div key={article.id} className="news-card">
                {/* إذا لم تتوفر صورة في الموديل، نضع صورة ملعب كروية كـ Fallback */}
                <img src={article.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600'} alt={article.title} className="news-img" />
                <div className="news-overlay">
                  <span className="news-tag">أخبار Grinta</span>
                  <h3 className="news-title">{article.title}</h3>
                  <p className="text-zinc-400 text-xs">
                    {article.published_at ? new Date(article.published_at).toLocaleDateString('ar-EG') : 'الآن'}
                  </p>
                </div>
              </div>
            ))}

            {/* عرض الفيديوهات المرفوعة عبر الـ Video Model في الـ Admin */}
            {videos.map(vid => (
              <div key={vid.id} className="news-card video-card">
                <div className="video-placeholder-bg">
                  <PlayCircle size={50} className="video-play-icon" />
                </div>
                <div className="news-overlay">
                  <span className="news-tag bg-red-600">فيديو وملخصات</span>
                  <h3 className="news-title">{vid.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* الإعلان السفلي قبل الفوتر */}
        {renderAd('bottom')}
      </main>

      <Footer />
    </div>
  );
};

// كمبوننت فرعي وذكي لعرض كارت المباراة بناءً على بيانات دجانغو الدقيقة
const MatchCard = ({ match }) => {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status_short);
  
  return (
    <Link to={`/match/${match.fixture_id}`} className="match-card-anchor">
      <div className={`match-card ${isLive ? 'is-live' : ''}`}>
        <div className="match-header">
          <span className="league-name-tag">{match.league?.name || 'بطولة رياضية'}</span>
          {isLive ? (
            <span className="live-indicator">
              <span className="live-pulse-dot"></span> 
              مباشر {match.elapsed}'
            </span>
          ) : (
            <span className="match-time-tag">
              {new Date(match.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        <div className="match-teams">
          <div className="team-row">
            <img src={match.home_team_logo} alt={match.home_team_name} onError={(e) => { e.target.src='https://placehold.co/40x40?text=Team' }} />
            <span>{match.home_team_name}</span>
          </div>
          
          <div className="match-score-box">
            {isLive || match.status_short === 'FT' ? `${match.home_score} - ${match.away_score}` : 'vs'}
          </div>
          
          <div className="team-row away">
            <img src={match.away_team_logo} alt={match.away_team_name} onError={(e) => { e.target.src='https://placehold.co/40x40?text=Team' }} />
            <span>{match.away_team_name}</span>
          </div>
        </div>
        
        <div className="match-footer-status">
          {match.status_long}
        </div>
      </div>
</Link>

  );
};

export default Home;








