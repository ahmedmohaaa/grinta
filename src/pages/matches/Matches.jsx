import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; // 👈 استيراد هام جداً للتنقل الداخلي
import gsap from 'gsap';
import { Search, MapPin, Tv, Clock, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Matches.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const Matches = () => {
  const containerRef = useRef(null);
  
  // States للبيانات
  const [allFixtures, setAllFixtures] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States للفلاتر
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // توليد شريط الأيام
  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = -2; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      let label = '';
      if (i === -1) label = 'أمس';
      else if (i === 0) label = 'اليوم';
      else if (i === 1) label = 'غداً';
      else {
        label = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
      }
      
      const dayName = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long' }).format(date);
      days.push({ id: dateString, label, dayName, rawDate: date });
    }
    return days;
  };
  
  const daysBar = generateDays();

  // جلب البيانات من الـ API
  useEffect(() => {
    const fetchMatchesData = async () => {
      setLoading(true);
      try {
        const [fixturesRes, leaguesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/fixtures/`).then(res => res.json()),
          fetch(`${API_BASE_URL}/leagues/`).then(res => res.json())
        ]);
        
        setAllFixtures(fixturesRes);
        setLeagues(leaguesRes);
      } catch (error) {
        console.error("Failed to fetch matches data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchesData();
  }, []);

  // فلترة المباريات
  const filteredMatches = allFixtures.filter(match => {
    const matchDateStr = new Date(match.date).toISOString().split('T')[0];
    if (matchDateStr !== selectedDateStr) return false;
    if (selectedLeagueId !== 'all' && match.league.id.toString() !== selectedLeagueId) return false;

    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'];
    const finishedStatuses = ['FT', 'AET', 'PEN'];
    
    if (selectedStatus === 'live' && !liveStatuses.includes(match.status_short)) return false;
    if (selectedStatus === 'finished' && !finishedStatuses.includes(match.status_short)) return false;
    if (selectedStatus === 'upcoming' && match.status_short !== 'NS') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchText = `${match.home_team_name} ${match.away_team_name} ${match.league.name}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  // تجميع المباريات
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const leagueName = match.league.name;
    if (!groups[leagueName]) {
      groups[leagueName] = { logo: match.league.logo, matches: [] };
    }
    groups[leagueName].matches.push(match);
    return groups;
  }, {});

  // GSAP Animation
  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo('.match-anim-card', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [filteredMatches, loading]);

  return (
    <div className="matches-page-container" dir="rtl">
      <Navbar />

      <main className="matches-wrapper">
        <section className="controls-section">
          <div className="search-bar">
            <input 
              type="text" 
              className="search-input" 
              placeholder="ابحث عن فريق، بطولة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters-row">
            <div className="status-pills">
              <button className={`status-pill ${selectedStatus === 'all' ? 'active' : ''}`} onClick={() => setSelectedStatus('all')}>الكل</button>
              <button className={`status-pill ${selectedStatus === 'live' ? 'live-active' : ''}`} onClick={() => setSelectedStatus('live')}>🔴 مباشر</button>
              <button className={`status-pill ${selectedStatus === 'upcoming' ? 'active' : ''}`} onClick={() => setSelectedStatus('upcoming')}>قادمة</button>
              <button className={`status-pill ${selectedStatus === 'finished' ? 'active' : ''}`} onClick={() => setSelectedStatus('finished')}>انتهت</button>
            </div>

            <select className="filter-select" value={selectedLeagueId} onChange={(e) => setSelectedLeagueId(e.target.value)}>
              <option value="all">كل الدوريات</option>
              {leagues.map(l => (
                <option key={l.id} value={l.league_id}>{l.name}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="days-bar">
          {daysBar.map((day) => (
            <button 
              key={day.id}
              className={`day-btn ${selectedDateStr === day.id ? 'active' : ''}`}
              onClick={() => setSelectedDateStr(day.id)}
            >
              <span className="day-name">{day.label}</span>
              <span className="day-date">{day.dayName}</span>
            </button>
          ))}
        </section>

        <section className="matches-list" ref={containerRef}>
          {loading ? (
            <div className="text-center py-10 text-zinc-400">جاري جلب المباريات...</div>
          ) : Object.keys(groupedMatches).length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-400">
              <Trophy size={48} className="mx-auto mb-4 opacity-50" />
              لا توجد مباريات تطابق شروط البحث أو الفلترة في هذا اليوم.
            </div>
          ) : (
            Object.keys(groupedMatches).map(leagueName => (
              <div key={leagueName} className="league-group">
                <div className="league-group-title match-anim-card">
                  <img src={groupedMatches[leagueName].logo} alt={leagueName} onError={(e) => e.target.src='https://placehold.co/30x30'} />
                  <h3 className="text-xl font-bold text-white">{leagueName}</h3>
                </div>
                
                <div className="flex flex-col gap-4">
                  {groupedMatches[leagueName].matches.map(match => (
                    <MatchDetailCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

// ========================================================
// 🛡️ التعديل الجوهري هنا لمنع الأخطاء وضبط الروابط
// ========================================================
const MatchDetailCard = ({ match }) => {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status_short);
  const isFinished = ['FT', 'AET', 'PEN'].includes(match.status_short);
  
  const matchTime = new Date(match.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`match-card-adv match-anim-card ${isLive ? 'is-live' : ''}`}>
      
      <div className="team-side home">
        <span className="team-name-lg">{match.home_team_name}</span>
        <img src={match.home_team_logo} alt={match.home_team_name} className="team-logo-lg" onError={(e) => e.target.src='https://placehold.co/60x60'} />
      </div>

      <div className="match-center">
        {isLive ? (
          <>
            <span className="status-badge live-badge">مباشر {match.elapsed}'</span>
            <div className="score-display live-score">{match.home_score} - {match.away_score}</div>
          </>
        ) : isFinished ? (
          <>
            <span className="status-badge">انتهت</span>
            <div className="score-display">{match.home_score} - {match.away_score}</div>
          </>
        ) : (
          <>
            <span className="status-badge">لم تبدأ</span>
            <div className="match-time-lg">{matchTime}</div>
            <div className="match-extra-info flex items-center gap-1">
              <Clock size={12} /> بتوقيتك المحلي
            </div>
          </>
        )}
      </div>

      <div className="team-side away">
        <img src={match.away_team_logo} alt={match.away_team_name} className="team-logo-lg" onError={(e) => e.target.src='https://placehold.co/60x60'} />
        <span className="team-name-lg">{match.away_team_name}</span>
      </div>

      {/* 👈 تم استبدال الـ (a href) بـ (Link to) 
        👈 وتم تغيير match.id إلى match.fixture_id ليقرأها السيرفر بشكل صحيح
      */}
      <div className="match-actions">
        {isLive && (
          <>
            <Link to={`/match/${match.fixture_id}`} className="action-btn">أحداث المباراة ⚡</Link>
            <Link to={`/match/${match.fixture_id}`} className="action-btn">التفاصيل</Link>
          </>
        )}
        
        {isFinished && (
          <>
            <Link to={`/match/${match.fixture_id}`} className="action-btn">الإحصائيات والأهداف 📊</Link>
            <Link to={`/videos`} className="action-btn">ملخص الفيديو ⏯️</Link>
          </>
        )}
        
        {!isLive && !isFinished && (
          <>
            <div className="text-zinc-500 text-sm flex items-center gap-4">
              <span className="flex items-center gap-1"><MapPin size={14} /> ملعب المباراة المجدول</span>
              <span className="flex items-center gap-1"><Tv size={14} /> القنوات الناقلة</span>
            </div>
            <Link to={`/match/${match.fixture_id}`} className="action-btn ml-auto">التشكيلة المتوقعة</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Matches;
