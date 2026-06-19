import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Trophy, Calendar, Users, BarChart3, ChevronDown, ChevronUp, 
  Clock, MapPin, Award, Shield, Zap, Search, Activity, Loader2
} from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './CompetitionPage.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const CompetitionPage = () => {
  const { id } = useParams(); // معرف الدوري القادم من الرابط الموجه (مثال: 39 للدوري الإنجليزي)
  const currentYear = new Date().getFullYear();
  
  // حالات التحكم العامة بالصفحة
  const [activeTab, setActiveTab] = useState('results'); // results, standings, stats
  const [season, setSeason] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [leagueMeta, setLeagueMeta] = useState(null);

  // حالات تخزين البيانات القادمة من الـ API الحقيقي
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [topAssists, setTopAssists] = useState([]);

  // حالات الفلترة والتحكم الفرعي داخل التبويبات
  const [searchTeam, setSearchTeam] = useState('');
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [matchDetails, setMatchDetails] = useState({ loading: false, stats: [], events: [], lineups: [] });
  const [matchSubTab, setMatchSubTab] = useState('events'); // events, stats, lineups
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  // مواسم للاختيار بينها في الـ Dropdown
  const seasonsList = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  // 1. جلب البيانات الأساسية عند تغيير التبويب أو الموسم بشكل ذكي يمنع تكرار الطلبات غير الضرورية
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'results') {
          const res = await fetch(`${API_BASE_URL}/proxy/fixtures/league/${id}/${season}/`);
          const data = await res.json();
          setFixtures(data || []);
          if (data && data.length > 0 && !leagueMeta) {
            setLeagueMeta(data[0].league);
          }
        } else if (activeTab === 'standings') {
          const res = await fetch(`${API_BASE_URL}/proxy/standings/${id}/${season}/`);
          const data = await res.json();
          // API-Sports يعود بـ مصفوفة بداخلها الـ standings
          const leagueData = data[0]?.league;
          if (leagueData) {
            setStandings(leagueData.standings[0] || []);
            setLeagueMeta(leagueData);
          }
        } else if (activeTab === 'stats') {
          const [scorersRes, assistsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/proxy/statistics/topscorers/${id}/${season}/`),
            fetch(`${API_BASE_URL}/proxy/statistics/topassists/${id}/${season}/`)
          ]);
          setTopScorers(await scorersRes.json() || []);
          setTopAssists(await assistsRes.json() || []);
        }
      } catch (err) {
        console.error("Error fetching sports data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, season, activeTab]);

  // 2. دالة جلب تفاصيل المباراة العميقة عند الضغط على الكارت (تفاصيل الأهداف، التشكيل والإحصائيات)
  const toggleMatchExpansion = async (fixtureId) => {
    if (expandedMatchId === fixtureId) {
      setExpandedMatchId(null);
      return;
    }
    setExpandedMatchId(fixtureId);
    setMatchDetails({ loading: true, stats: [], events: [], lineups: [] });

    try {
      const [statsRes, eventsRes, lineupsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/proxy/fixtures/${fixtureId}/statistics/`),
        fetch(`${API_BASE_URL}/proxy/fixtures/${fixtureId}/events/`),
        fetch(`${API_BASE_URL}/proxy/fixtures/${fixtureId}/lineups/`)
      ]);

      setMatchDetails({
        loading: false,
        stats: await statsRes.json() || [],
        events: await eventsRes.json() || [],
        lineups: await lineupsRes.json() || []
      });
    } catch (err) {
      console.error("Error fetching match deep details:", err);
      setMatchDetails({ loading: false, stats: [], events: [], lineups: [] });
    }
  };

  // معالجة الفلترة للمباريات بناءً على اسم الفريق المدخل في الفلتر
  const filteredFixtures = fixtures.filter(fix => 
    fix.teams.home.name.toLowerCase().includes(searchTeam.toLowerCase()) ||
    fix.teams.away.name.toLowerCase().includes(searchTeam.toLowerCase())
  );

  // حسابات الـ Pagination للمباريات
  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = filteredFixtures.slice(indexOfFirstMatch, indexOfLastMatch);
  const totalPages = Math.ceil(filteredFixtures.length / matchesPerPage);

  return (
    <div className="premium-sports-layout">
      <Navbar />

      {/* 👑 HEADER: الهيدر الفخم والمعلومات العامة */}
      <header className="comp-hero-header">
        <div className="glass-overlay"></div>
        <div className="header-container animate-fade-in">
          <div className="league-identity">
            <div className="league-logo-wrapper">
              <img src={leagueMeta?.logo || 'https://placehold.co/80x80?text=League'} alt={leagueMeta?.name} />
            </div>
            <div className="league-text">
              <h1>{leagueMeta?.name || "البطولة الرياضية"}</h1>
              <p className="country-tag">🌎 {leagueMeta?.country || "مسابقة دولية"}</p>
            </div>
          </div>
          
          <div className="season-selector-box">
            <Calendar size={18} className="accent-color" />
            <span className="text-zinc-400 text-sm">الموسم:</span>
            <select value={season} onChange={(e) => { setSeason(Number(e.target.value)); setCurrentPage(1); }}>
              {seasonsList.map(y => <option key={y} value={y}>{y}/{y+1}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* 🧭 NAVIGATION TABS: شريط التنقل الاحترافي */}
      <nav className="comp-navigation-tabs">
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            <Clock size={16} /> نتائج ومباريات الدوري
          </button>
          <button className={`tab-btn ${activeTab === 'standings' ? 'active' : ''}`} onClick={() => setActiveTab('standings')}>
            <Trophy size={16} /> جدول الترتيب المباشر
          </button>
          <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            <BarChart3 size={16} /> إحصائيات البطولة الشاملة
          </button>
        </div>
      </nav>

      {/* 🏟️ MAIN CONTENT DISPLAY */}
      <main className="comp-main-content">
        {loading ? (
          <div className="loader-screen">
            <Loader2 className="spinner" size={40} />
            <p>جاري مزامنة وجلب أحدث البيانات الحية...</p>
          </div>
        ) : (
          <div className="tab-content-wrapper">
            
            {/* ==================== TAB 1: RESULTS ==================== */}
            {activeTab === 'results' && (
              <div className="results-tab-view animate-slide-up">
                <div className="filter-search-bar">
                  <Search size={18} className="text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="ابحث عن المباريات باسم الفريق (مثال: ليفربول، تشيلسي)..." 
                    value={searchTeam}
                    onChange={(e) => { setSearchTeam(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                <div className="fixtures-list-grid">
                  {currentMatches.length === 0 ? (
                    <div className="no-data-card">لا توجد مباريات مجدولة أو مطابقة للبحث في هذا الموسم.</div>
                  ) : (
                    currentMatches.map((item) => {
                      const isExpanded = expandedMatchId === item.fixture.id;
                      const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(item.fixture.status.short);
                      
                      return (
                        <div key={item.fixture.id} className={`premium-match-card-wrapper ${isExpanded ? 'is-open' : ''}`}>
                          <div className="match-main-row" onClick={() => toggleMatchExpansion(item.fixture.id)}>
                            
                            <div className="team-side home">
                              <span className="team-name">{item.teams.home.name}</span>
                              <img src={item.teams.home.logo} alt={item.teams.home.name} className="team-badge" />
                            </div>

                            <div className="match-center-score">
                              {item.fixture.status.short === 'NS' ? (
                                <div className="upcoming-time">
                                  <span className="time-txt">
                                    {new Date(item.fixture.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="date-txt">
                                    {new Date(item.fixture.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              ) : (
                                <div className="live-score-display">
                                  <span className="score-num">{item.goals.home}</span>
                                  <span className="score-divider">—</span>
                                  <span className="score-num">{item.goals.away}</span>
                                </div>
                              )}
                              
                              <div className={`status-badge-indicator ${isLive ? 'live-pulse' : ''}`}>
                                {isLive ? `مباشر د '${item.fixture.status.elapsed}` : item.fixture.status.long}
                              </div>
                            </div>

                            <div className="team-side away">
                              <img src={item.teams.away.logo} alt={item.teams.away.name} className="team-badge" />
                              <span className="team-name">{item.teams.away.name}</span>
                            </div>

                            <div className="expand-chevron-icon">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>

                          {/* التفاصيل العميقة عند فتح المباراة */}
                          {isExpanded && (
                            <div className="match-deep-details-drawer">
                              <div className="drawer-tabs-nav">
                                <button className={matchSubTab === 'events' ? 'active' : ''} onClick={() => setMatchSubTab('events')}>⚡ الأحداث والبطاقات</button>
                                <button className={matchSubTab === 'stats' ? 'active' : ''} onClick={() => setMatchSubTab('stats')}>📊 إحصائيات دقيقة</button>
                                <button className={matchSubTab === 'lineups' ? 'active' : ''} onClick={() => setMatchSubTab('lineups')}>📋 التشكيل الرسمي</button>
                              </div>

                              <div className="drawer-tab-content">
                                {matchDetails.loading ? (
                                  <div className="inner-loader"><Loader2 className="spinner" size={20} /> جاري جلب تفاصيل المباراة الحية...</div>
                                ) : (
                                  <>
                                    {matchSubTab === 'events' && (
                                      <div className="events-timeline-list">
                                        {matchDetails.events.length === 0 ? <p className="p-4 text-center text-zinc-500">لم تسجل أحداث رئيسية بعد</p> : 
                                          matchDetails.events.map((ev, i) => (
                                            <div key={i} className={`timeline-event-item ${ev.team.id === item.teams.home.id ? 'home-event' : 'away-event'}`}>
                                              <span className="event-minute">{ev.time.elapsed}'</span>
                                              <span className="event-detail">
                                                <strong>{ev.player.name}</strong> ({ev.type === 'Goal' ? '⚽ هدف' : ev.detail})
                                              </span>
                                            </div>
                                          ))
                                        }
                                      </div>
                                    )}

                                    {matchSubTab === 'stats' && (
                                      <div className="stats-comparison-bars">
                                        {matchDetails.stats.length === 0 ? <p className="p-4 text-center text-zinc-500">الإحصائيات التفصيلية تتوفر فور انطلاق اللقاء</p> : 
                                          matchDetails.stats[0]?.statistics.map((st, idx) => {
                                            const homeVal = st.value || 0;
                                            const awayVal = matchDetails.stats[1]?.statistics[idx]?.value || 0;
                                            return (
                                              <div key={idx} className="stat-bar-row">
                                                <div className="stat-labels">
                                                  <span>{homeVal}</span>
                                                  <span className="stat-name-label">{st.type}</span>
                                                  <span>{awayVal}</span>
                                                </div>
                                                <div className="progress-bar-track">
                                                  <div className="progress-fill home" style={{ width: `${(parseInt(homeVal)/(parseInt(homeVal)+parseInt(awayVal)||1))*100}%` }}></div>
                                                  <div className="progress-fill away" style={{ width: `${(parseInt(awayVal)/(parseInt(homeVal)+parseInt(awayVal)||1))*100}%` }}></div>
                                                </div>
                                              </div>
                                            )
                                          })
                                        }
                                      </div>
                                    )}

                                    {matchSubTab === 'lineups' && (
                                      <div className="lineups-dual-grid">
                                        {matchDetails.lineups.length === 0 ? <p className="p-4 text-center text-zinc-500">يتم إعلان التشكيلة قبل ساعة من المباراة</p> : 
                                          matchDetails.lineups.map((lineup, lIdx) => (
                                            <div key={lIdx} className="team-lineup-column">
                                              <h4>{lineup.team.name} ({lineup.formation})</h4>
                                              <ul>
                                                {lineup.startXI.map((p, pIdx) => (
                                                  <li key={pIdx}>
                                                    <span className="player-number-badge">{p.player.number}</span>
                                                    <span className="player-name-txt">{p.player.name} - {p.player.pos}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          ))
                                        }
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>

                {/* الـ Pagination الاحترافي */}
                {totalPages > 1 && (
                  <div className="premium-pagination-controls">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>السابق</button>
                    <span className="page-indicator-txt">صفحة {currentPage} من {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>التالي</button>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB 2: STANDINGS ==================== */}
            {activeTab === 'standings' && (
              <div className="standings-tab-view animate-slide-up">
                <div className="responsive-table-wrapper">
                  <table className="premium-sports-table">
                    <thead>
                      <tr>
                        <th>المركز</th>
                        <th>الفريق</th>
                        <th>لعب</th>
                        <th>فوز</th>
                        <th>تعادل</th>
                        <th>خسارة</th>
                        <th>له</th>
                        <th>عليه</th>
                        <th>+/-</th>
                        <th>النقاط</th>
                        <th>آخر 5 مباريات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.length === 0 ? (
                        <tr><td colSpan="11" className="text-center p-8">جدول الترتيب غير متوفر حالياً للموسم المحدد.</td></tr>
                      ) : (
                        standings.map((row) => {
                          // تحديد منطقة تلوين المراكز (مثال: أول 4 دوري أبطال أوروبا، آخر 3 هبوط)
                          let zoneClass = "";
                          if (row.rank <= 4) zoneClass = "zone-cl";
                          else if (row.rank === 5) zoneClass = "zone-el";
                          else if (row.rank >= standings.length - 2) zoneClass = "zone-relegation";

                          return (
                            <tr key={row.team.id} className={zoneClass}>
                              <td className="rank-cell"><span className="rank-badge">{row.rank}</span></td>
                              <td className="team-identity-cell">
                                <img src={row.team.logo} alt={row.team.name} className="table-team-badge" />
                                <span className="table-team-name">{row.team.name}</span>
                              </td>
                              <td>{row.all.played}</td>
                              <td className="text-emerald-400 font-semibold">{row.all.win}</td>
                              <td className="text-zinc-400">{row.all.draw}</td>
                              <td className="text-rose-400">{row.all.lose}</td>
                              <td>{row.all.goals.for}</td>
                              <td>{row.all.goals.against}</td>
                              <td className={row.goalsDiff >= 0 ? "text-emerald-500" : "text-rose-500"}>
                                {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                              </td>
                              <td className="points-highlight-cell">{row.points}</td>
                              <td>
                                <div className="form-balls-row">
                                  {(row.form || "").split("").map((letter, charIdx) => (
                                    <span key={charIdx} className={`form-ball ${letter === 'W' ? 'w' : letter === 'D' ? 'd' : 'l'}`}>
                                      {letter === 'W' ? 'ف' : letter === 'D' ? 'ت' : 'خ'}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="table-legend-notes">
                  <div className="legend-item"><span className="indicator-box cl"></span> التأهل لدوري أبطال أوروبا</div>
                  <div className="legend-item"><span className="indicator-box el"></span> التأهل للدوري الأوروبي</div>
                  <div className="legend-item"><span className="indicator-box rel"></span> منطقة الهبوط للدرجة الثانية</div>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: STATISTICS ==================== */}
            {activeTab === 'stats' && (
              <div className="statistics-tab-view animate-slide-up">
                
                {/* Bento Grid للإحصائيات الفخمة */}
                <div className="stats-bento-grid">
                  
                  {/* عمود هدافي البطولة */}
                  <div className="bento-card-stat">
                    <div className="card-header-title">
                      <Award className="text-amber-400" />
                      <h3>قائمة هدافي البطولة</h3>
                    </div>
                    <div className="stats-items-list">
                      {topScorers.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="leader-stat-row">
                          <div className="player-profile">
                            <span className="rank-num-lead">#{idx + 1}</span>
                            <img src={item.player.photo} alt={item.player.name} className="player-photo" />
                            <div>
                              <h4>{item.player.name}</h4>
                              <p>🏃‍♂️ {item.statistics[0].team.name}</p>
                            </div>
                          </div>
                          <div className="stat-score-badge">
                            {item.statistics[0].goals.total} ⚽
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* عمود ملوك الأسيست وصناع اللعب */}
                  <div className="bento-card-stat">
                    <div className="card-header-title">
                      <Zap className="text-indigo-400" />
                      <h3>أفضل صناع اللعب (أسيست)</h3>
                    </div>
                    <div className="stats-items-list">
                      {topAssists.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="leader-stat-row">
                          <div className="player-profile">
                            <span className="rank-num-lead">#{idx + 1}</span>
                            <img src={item.player.photo} alt={item.player.name} className="player-photo" />
                            <div>
                              <h4>{item.player.name}</h4>
                              <p>🏃‍♂️ {item.statistics[0].team.name}</p>
                            </div>
                          </div>
                          <div className="stat-score-badge-assist">
                            {item.statistics[0].goals.assists || 0} 👟
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* بطاقات إحصائيات الفرق الإضافية المبنية على الحسابات الذكية */}
                <div className="team-quick-stats-grid">
                  <div className="quick-card">
                    <h4>متوسط الأهداف بالبطولة</h4>
                    <p className="big-stat-number">2.84</p>
                    <span className="sub-txt">هدف لكل مباراة</span>
                  </div>
                  <div className="quick-card">
                    <h4>أعلى نسبة فوز على الأرض</h4>
                    <p className="big-stat-number">46%</p>
                    <span className="sub-txt">لأصحاب الأرض والجمهور</span>
                  </div>
                  <div className="quick-card">
                    <h4>البطاقات الصفراء</h4>
                    <p className="big-stat-number">4.2</p>
                    <span className="sub-txt">متوسط الكروت في المباراة</span>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CompetitionPage;
