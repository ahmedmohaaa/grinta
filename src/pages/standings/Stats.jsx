import React, { useState, useEffect } from 'react';
import { BarChart3, Loader2, AlertCircle, Award, Zap } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './StandingsPage.css'; // يمكننا مشاركة CSS الترتيب أو إنشاء واحد مخصص

const API_BASE_URL = 'https://api.algrinta.com/api';

const StatsPage = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('39');
  const [selectedSeason, setSelectedSeason] = useState('2026');

  const [topScorers, setTopScorers] = useState([]);
  const [topAssists, setTopAssists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // جلب الدوريات للفلتر
  useEffect(() => {
    const fetchLeagues = async () => {
      const res = await fetch(`${API_BASE_URL}/leagues/`);
      if (res.ok) setLeagues(await res.json());
    };
    fetchLeagues();
  }, []);

  // جلب الهدافين وصناع اللعب بالتوازي
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [scorersRes, assistsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/proxy/statistics/topscorers/${selectedLeague}/${selectedSeason}/`),
          fetch(`${API_BASE_URL}/proxy/statistics/topassists/${selectedLeague}/${selectedSeason}/`)
        ]);

        if (scorersRes.status === 503 || assistsRes.status === 503) {
           setError("إحصائيات هذا الموسم غير متاحة. الرجاء اختيار موسم مدعوم.");
           setTopScorers([]); setTopAssists([]);
           setLoading(false);
           return;
        }

        const scorersJson = await scorersRes.json();
        const assistsJson = await assistsRes.json();

        // الـ View الخاص بالهدافين والأسيست يرجع الـ data مباشرة بدون {'source':..., 'data':...} لأنه يرث من APIView وليس BaseProxyView
        setTopScorers(scorersJson || []);
        setTopAssists(assistsJson || []);

      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("حدث خطأ أثناء الاتصال بالخادم.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedLeague, selectedSeason]);

  return (
    <div className="premium-sports-layout">
      <Navbar />

      <main className="standings-page-wrapper">
        <header className="page-header-premium animate-fade-in">
          <BarChart3 size={40} className="header-icon text-indigo-500" />
          <h1>إحصائيات وأرقام البطولات</h1>
          <p>اكتشف الهدافين وصناع اللعب وأرقام النجوم في بطولتك المفضلة.</p>
          
          <div className="header-controls">
            <select className="premium-select" value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}>
              {leagues.map(l => <option key={l.id} value={l.league_id}>{l.name}</option>)}
              {leagues.length === 0 && <option value="39">الدوري الإنجليزي</option>}
            </select>
            <select className="premium-select" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
              <option value="2026">موسم 2026</option>
              <option value="2025">موسم 2025</option>
              <option value="2024">موسم 2024</option>
              <option value="2023">موسم 2023</option>
              <option value="2022">موسم 2022</option>
              <option value="2021">موسم 2021</option>
              <option value="2020">موسم 2020</option>
            </select>
          </div>
        </header>

        <section className="stats-bento-grid-container animate-slide-up">
          {loading ? (
             <div className="loader-screen">
               <Loader2 className="spinner" size={40} />
               <p>جاري حساب الأرقام والإحصائيات...</p>
             </div>
          ) : error ? (
             <div className="error-screen"><AlertCircle size={50} className="text-red-500 mb-4" /><p>{error}</p></div>
          ) : (
            <div className="stats-dual-grid">
              
              {/* قائمة الهدافين */}
              <div className="stat-card-column">
                <div className="stat-column-header">
                  <Award size={24} className="text-amber-400" />
                  <h2>قائمة الهدافين (Top Scorers)</h2>
                </div>
                <div className="stat-list">
                  {topScorers.length === 0 ? <p className="empty-state">لا توجد بيانات متاحة.</p> : 
                    topScorers.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="stat-player-row">
                        <span className="stat-rank">#{idx + 1}</span>
                        <img src={item.player.photo} alt={item.player.name} className="stat-player-img" onError={(e) => e.target.src='https://placehold.co/40'} />
                        <div className="stat-player-info">
                          <h4>{item.player.name}</h4>
                          <span className="stat-team-name">{item.statistics[0]?.team?.name}</span>
                        </div>
                        <div className="stat-score-value goals-color">
                          {item.statistics[0]?.goals?.total} ⚽
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* قائمة صناع اللعب */}
              <div className="stat-card-column">
                <div className="stat-column-header">
                  <Zap size={24} className="text-indigo-400" />
                  <h2>أفضل صناع اللعب (Top Assists)</h2>
                </div>
                <div className="stat-list">
                  {topAssists.length === 0 ? <p className="empty-state">لا توجد بيانات متاحة.</p> : 
                    topAssists.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="stat-player-row">
                        <span className="stat-rank">#{idx + 1}</span>
                        <img src={item.player.photo} alt={item.player.name} className="stat-player-img" onError={(e) => e.target.src='https://placehold.co/40'} />
                        <div className="stat-player-info">
                          <h4>{item.player.name}</h4>
                          <span className="stat-team-name">{item.statistics[0]?.team?.name}</span>
                        </div>
                        <div className="stat-score-value assists-color">
                          {item.statistics[0]?.goals?.assists || 0} 👟
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StatsPage;
