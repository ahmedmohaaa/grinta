import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircle, Flame, AlertCircle, ChevronDown } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Home.css';
import { Link } from "react-router-dom";
gsap.registerPlugin(ScrollTrigger);

const API_BASE_URL = 'https://api.algrinta.com/api';
// ضع هنا رابط الـ API الخارجي الخاص بالفيديوهات
const EXTERNAL_VIDEO_API_URL = 'https://your-external-api.com/videos'; 

const Home = () => {
  const mainRef = useRef(null);

  // حالات البيانات
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [externalVideos, setExternalVideos] = useState([]); // حالة الفيديوهات الخارجية
  const [ads, setAds] = useState([]);

  // حالات "عرض المزيد" (Booleans)
  const [showAllLive, setShowAllLive] = useState(false);
  const [showAllToday, setShowAllToday] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showAllExternalVideos, setShowAllExternalVideos] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // 1. جلب بيانات الباك إند الخاص بك
        const [fixturesRes, leaguesRes, articlesRes, videosRes, adsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/fixtures/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/leagues/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/articles/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/videos/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/ads/?page=home`).then(res => res.json())
        ]);

        const live = fixturesRes.filter(f => ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status_short));
        const upcoming = fixturesRes.filter(f => f.status_short === 'NS');
        
        setLiveMatches(live);
        setTodayMatches(upcoming);
        setLeagues(leaguesRes.slice(0, 8));
        setNews(articlesRes); // تخزين الكل، وسنقوم بالقص في الـ Render
        setVideos(videosRes);
        setAds(adsRes);

        // 2. جلب بيانات الـ API الخارجي (في Try-Catch منفصل لكي لا يكسر الموقع لو تعطل)
        try {
          const extRes = await fetch(EXTERNAL_VIDEO_API_URL);
          if (extRes.ok) {
            const extData = await extRes.json();
            // اضبط هذا السطر بناءً على شكل الرد (Response) من الـ API الخارجي
            setExternalVideos(extData.response || extData || []); 
          }
        } catch (extErr) {
          console.warn("External Video API failed:", extErr);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("عذراً، حدث خطأ أثناء الاتصال بالسيرفر.");
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

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
  }, [loading, error, showAllLive, showAllToday, showAllNews, showAllVideos, showAllExternalVideos]);

  const renderAd = (position) => {
    const activeAd = ads.find(ad => ad.position === position && ad.status === 'active');
    if (!activeAd) return null;
    return (
      <div 
        className="adsense-container gsap-section" 
        dangerouslySetInnerHTML={{ __html: activeAd.code }} 
      />
    );
  };

  if (loading) return <div className="loading-screen" dir="rtl"><div className="loader-spinner"></div></div>;
  if (error) return <div className="error-screen" dir="rtl"><AlertCircle size={48} className="text-red-500" /><p>{error}</p></div>;

  return (
    <div className="home-container" dir="rtl">
      <Navbar />

      <main ref={mainRef}>
        {/* ================= 1. HERO SECTION (الصورة فقط) ================= */}
        <section className="hero-section">
          <div className="hero-bg"></div>
          <div className="hero-gradient"></div>
        </section>

        {renderAd('top')}

        {/* ================= 2. المباريات المباشرة ================= */}
        {liveMatches.length > 0 && (
          <section className="section-container gsap-section">
            <div className="section-header">
              <h2 className="section-title">
                 <Flame size={28} className="live-fire-icon" /> 
                 المباريات الجارية الآن (Live)
              </h2>
            </div>
            
            <div className="matches-grid">
              {liveMatches.slice(0, showAllLive ? liveMatches.length : 4).map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
            
            {!showAllLive && liveMatches.length > 4 && (
              <div className="show-more-wrapper">
                <button className="show-more-btn" onClick={() => setShowAllLive(true)}>
                  عرض المزيد <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* ================= 3. مباريات اليوم ================= */}
        <section className="section-container gsap-section">
          <div className="section-header">
            <h2 className="section-title">مباريات اليوم القادمة</h2>
          </div>
          
          {todayMatches.length > 0 ? (
            <>
              <div className="matches-grid">
                {todayMatches.slice(0, showAllToday ? todayMatches.length : 4).map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
              
              {!showAllToday && todayMatches.length > 4 && (
                <div className="show-more-wrapper">
                  <button className="show-more-btn" onClick={() => setShowAllToday(true)}>
                    عرض المزيد <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-data-box">لا توجد مباريات أخرى مجدولة لليوم.</div>
          )}
        </section>

        {/* ================= 4. الدوريات الشائعة ================= */}
        <section className="section-container gsap-section">
          <div className="section-header">
            <h2 className="section-title">الدوريات الشائعة</h2>
          </div>
          <div className="leagues-container">
            {leagues.map((league) => (
              <Link key={league.id} to={`/league/${league.league_id}/2026`} className="league-card-link">
                <div className="league-card">
                  <img src={league.logo} alt={league.name} onError={(e) => e.target.src = "https://placehold.co/60x60?text=League"} />
                  <span>{league.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {renderAd('middle')}

        {/* ================= 5. الأخبار (News) ================= */}
        <section className="section-container gsap-section">
          <div className="section-header">
            <h2 className="section-title">أحدث التقارير الرياضية</h2>
          </div>
          
          <div className="bento-grid">
            {news.slice(0, showAllNews ? news.length : 4).map(article => (
              <div key={article.id} className="news-card">
                <img src={article.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600'} alt={article.title} className="news-img" />
                <div className="news-overlay">
                  <span className="news-tag">أخبار</span>
                  <h3 className="news-title">{article.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {!showAllNews && news.length > 4 && (
            <div className="show-more-wrapper">
              <button className="show-more-btn" onClick={() => setShowAllNews(true)}>
                عرض المزيد <ChevronDown size={18} />
              </button>
            </div>
          )}
        </section>

        {/* ================= 6. فيديوهات المنصة ================= */}
        <section className="section-container gsap-section">
          <div className="section-header">
            <h2 className="section-title">فيديوهات وملخصات جرينتا</h2>
          </div>
          
          <div className="bento-grid">
            {videos.slice(0, showAllVideos ? videos.length : 4).map(vid => (
              <div key={vid.id} className="news-card video-card">
                <div className="video-placeholder-bg">
                  <PlayCircle size={50} className="video-play-icon" />
                </div>
                <div className="news-overlay">
                  <span className="news-tag bg-red-600">فيديو</span>
                  <h3 className="news-title">{vid.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {!showAllVideos && videos.length > 4 && (
            <div className="show-more-wrapper">
              <button className="show-more-btn" onClick={() => setShowAllVideos(true)}>
                عرض المزيد <ChevronDown size={18} />
              </button>
            </div>
          )}
        </section>

        {/* ================= 7. فيديوهات الـ API الخارجي ================= */}
        {externalVideos.length > 0 && (
          <section className="section-container gsap-section">
            <div className="section-header">
              <h2 className="section-title">ملخصات عالمية (مباشر)</h2>
            </div>
            
            <div className="bento-grid">
              {externalVideos.slice(0, showAllExternalVideos ? externalVideos.length : 4).map((extVid, idx) => (
                // تأكد من تغيير extVid.title و extVid.thumbnail بناء على الـ API الخارجي
                <div key={idx} className="news-card video-card">
                  <img src={extVid.thumbnail || 'https://images.unsplash.com/photo-1518605368461-1e1e38ce8ba4?q=80&w=600'} alt="thumbnail" className="news-img" />
                  <div className="video-placeholder-bg" style={{background: 'rgba(0,0,0,0.3)'}}>
                    <PlayCircle size={50} className="video-play-icon" />
                  </div>
                  <div className="news-overlay">
                    <span className="news-tag bg-blue-600">عالمي</span>
                    <h3 className="news-title">{extVid.title || 'ملخص مباراة'}</h3>
                  </div>
                </div>
              ))}
            </div>

            {!showAllExternalVideos && externalVideos.length > 4 && (
              <div className="show-more-wrapper">
                <button className="show-more-btn" onClick={() => setShowAllExternalVideos(true)}>
                  عرض المزيد <ChevronDown size={18} />
                </button>
              </div>
            )}
          </section>
        )}

        {renderAd('bottom')}
      </main>

      <Footer />
    </div>
  );
};

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
