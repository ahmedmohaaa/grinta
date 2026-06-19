import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './MatchDetails.css';

const API_BASE_URL = 'http://161.97.76.160/api';

const MatchDetails = () => {
  const { id } = useParams(); // رقم المباراة القادم من الرابط
  
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // حالات البيانات الحقيقية
  const [matchInfo, setMatchInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [lineups, setLineups] = useState([]);

  useEffect(() => {
    if (!id) return;

    const fetchMatchData = async () => {
      setLoading(true);
      try {
        // تنفيذ 4 طلبات متوازية لضمان أقصى سرعة للمستخدم
        const [infoRes, eventsRes, statsRes, lineupsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/proxy/fixtures/${id}/info/`),
          fetch(`${API_BASE_URL}/proxy/fixtures/${id}/events/`),
          fetch(`${API_BASE_URL}/proxy/fixtures/${id}/statistics/`),
          fetch(`${API_BASE_URL}/proxy/fixtures/${id}/lineups/`)
        ]);

        const infoJson = await infoRes.json();
        const eventsJson = await eventsRes.json();
        const statsJson = await statsRes.json();
        const lineupsJson = await lineupsRes.json();

        // الـ Proxy في دجانغو يرجع البيانات داخل كائن { data: [...] }
        if (infoJson.data && infoJson.data.length > 0) {
          setMatchInfo(infoJson.data[0]); // بيانات المباراة الأساسية
        } else {
          throw new Error("لا توجد بيانات أساسية لهذه المباراة.");
        }

        setEvents(eventsJson.data || []);
        setStatistics(statsJson.data || []);
        setLineups(lineupsJson.data || []);

      } catch (err) {
        console.error("Error fetching match data:", err);
        setError("تعذر الاتصال بسيرفر الجرينتا لجلب تفاصيل اللقاء.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [id]);

  if (loading) return (
    <div className="loader-screen">
      <Loader2 className="spinner" size={40} />
      <p>جاري الاتصال بملعب المباراة وتجهيز الإحصائيات...</p>
    </div>
  );

  if (error || !matchInfo) return (
    <div className="error-screen">
      <AlertCircle size={50} className="text-red-500 mb-4" />
      <p>{error || "عذراً، المباراة غير متوفرة."}</p>
    </div>
  );

  // استخراج الكائنات لتنظيف الكود
  const { fixture, league, teams, goals } = matchInfo;
  const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(fixture.status.short);

  return (
    <div className="premium-sports-layout">
      <Navbar />

      {/* ================= 1. لوحة النتيجة العلوية (Scoreboard Hero) ================= */}
      <header className="standalone-match-header animate-fade-in">
        <div className="match-league-info">
          <span>🏆 {league.name} {league.round ? `- ${league.round}` : ''}</span>
          <span><MapPin size={16} className="inline mr-1" /> {fixture.venue?.name || 'ملعب غير محدد'}</span>
        </div>

        <div className="scoreboard-container">
          <div className="team-block home-team">
            <img src={teams.home.logo} alt={teams.home.name} />
            <h2>{teams.home.name}</h2>
          </div>

          <div className="score-block">
            <div className={`match-status-badge ${isLive ? 'live-badge-pulse' : ''}`}>
              {isLive ? `مباشر ${fixture.status.elapsed}'` : fixture.status.long}
            </div>
            
            <div className="main-score">
              {fixture.status.short === 'NS' ? (
                <span className="time-only">
                  {new Date(fixture.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <>
                  <span>{goals.home ?? 0}</span>
                  <span className="divider">-</span>
                  <span>{goals.away ?? 0}</span>
                </>
              )}
            </div>
            
            <div className="match-date">
              <Clock size={14} className="inline mr-1" />
              {new Date(fixture.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="team-block away-team">
            <img src={teams.away.logo} alt={teams.away.name} />
            <h2>{teams.away.name}</h2>
          </div>
        </div>
      </header>

      {/* ================= 2. محتوى المباراة والتبويبات ================= */}
      <main className="match-content-body animate-slide-up">
        
        <div className="match-tabs-bar">
          <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>أحداث المباراة</button>
          <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>الإحصائيات</button>
          <button className={activeTab === 'lineups' ? 'active' : ''} onClick={() => setActiveTab('lineups')}>التشكيلات</button>
        </div>

        <div className="match-tab-container">
          
          {/* ----- تبويب الأحداث ----- */}
          {activeTab === 'events' && (
            <div className="standalone-events-list">
              {events.length === 0 ? (
                <div className="empty-state text-zinc-500 p-8 text-center">لا توجد أحداث مسجلة لهذه المباراة حتى الآن.</div>
              ) : (
                events.map((ev, i) => (
                  <div key={i} className={`event-row ${ev.team.id === teams.home.id ? 'home-side' : 'away-side'}`}>
                    <div className="event-time">{ev.time.elapsed}'</div>
                    <div className="event-info">
                      <span className="event-player-name">{ev.player.name}</span>
                      <span className="event-type-desc">
                        {ev.type === 'Goal' ? '⚽ هدف' : ev.type === 'Card' ? '🟨 بطاقة' : ev.type === 'subst' ? '🔄 تبديل' : ev.detail}
                        {ev.assist?.name && ` (بواسطة: ${ev.assist.name})`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ----- تبويب الإحصائيات ----- */}
          {activeTab === 'stats' && (
            <div className="standalone-stats-view">
               {statistics.length < 2 ? (
                 <div className="empty-state text-zinc-500 p-8 text-center">الإحصائيات التفصيلية تتوفر فور انطلاق المباراة.</div>
               ) : (
                 statistics[0].statistics.map((stat, idx) => {
                    const homeVal = stat.value === null ? 0 : stat.value;
                    const awayVal = statistics[1].statistics[idx].value === null ? 0 : statistics[1].statistics[idx].value;
                    
                    // تنظيف القيم من علامة % للحساب الرياضي الخاص بـ Progress Bar
                    const cleanHome = parseInt(homeVal.toString().replace('%', '')) || 0;
                    const cleanAway = parseInt(awayVal.toString().replace('%', '')) || 0;
                    const total = cleanHome + cleanAway || 1; // 1 لتجنب القسمة على صفر
                    
                    return (
                      <div key={idx} className="stat-comparison-row">
                        <div className="stat-values-text">
                          <span>{homeVal}</span>
                          <span className="stat-label">{stat.type}</span>
                          <span>{awayVal}</span>
                        </div>
                        <div className="stat-progress-bars">
                          <div className="bar home-bar" style={{ width: `${(cleanHome / total) * 100}%` }}></div>
                          <div className="bar away-bar" style={{ width: `${(cleanAway / total) * 100}%` }}></div>
                        </div>
                      </div>
                    );
                 })
               )}
            </div>
          )}

          {/* ----- تبويب التشكيلات ----- */}
          {activeTab === 'lineups' && (
            <div className="standalone-lineups-view">
              {lineups.length < 2 ? (
                <div className="empty-state text-zinc-500 p-8 text-center">التشكيلات غير متوفرة حالياً (يتم إعلانها قبل المباراة بساعة).</div>
              ) : (
                <div className="lineups-dual-grid">
                  {lineups.map((lineup, index) => (
                    <div key={index} className="team-lineup-column">
                      <div className="lineup-team-header">
                        <img src={lineup.team.logo} alt={lineup.team.name} />
                        <h4>{lineup.team.name}</h4>
                      </div>
                      <div className="formation-badge">الخطة: {lineup.formation}</div>
                      
                      <h5 className="squad-title">التشكيلة الأساسية (Start XI)</h5>
                      <ul className="squad-list">
                        {lineup.startXI.map((p, pIdx) => (
                          <li key={pIdx}>
                            <span className="player-number-badge">{p.player.number}</span>
                            <span className="player-name-txt">{p.player.name}</span>
                            <span className="player-pos">{p.player.pos}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <h5 className="squad-title mt-6">المدير الفني</h5>
                      <div className="coach-box">
                        <ShieldAlert size={16} className="inline mr-2 text-emerald-500" /> 
                        {lineup.coach?.name || 'غير مدرج'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MatchDetails;