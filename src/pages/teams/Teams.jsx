import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Search, Shield, Globe, Users } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Teams.css';

const API_BASE_URL = 'http://161.97.76.160/api';

const Teams = () => {
  const containerRef = useRef(null);
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('39'); // افتراضي: الدوري الإنجليزي
  const [selectedSeason, setSelectedSeason] = useState('2026');

  // 1. جلب الدوريات المتاحة من قاعدة بياناتك (Django) لملء الفلتر
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/leagues/`);
        if (res.ok) {
          const data = await res.json();
          setLeagues(data);
          // إذا كان هناك دوريات مسجلة، نجعل أول دوري هو الافتراضي
          if (data.length > 0) {
            setSelectedLeague(data[0].league_id.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching leagues:", error);
      }
    };
    fetchLeagues();
  }, []);

  // 2. جلب الفرق بناءً على الدوري المحدد من الـ API الخاص بنا مع التحديث كل دقيقة
  useEffect(() => {
    let intervalId;

    const fetchTeamsByLeague = async (isBackgroundUpdate = false) => {
      // لا نظهر حالة التحميل إذا كان هذا التحديث التلقائي الخفي (حتى لا ترمش الشاشة كل دقيقة)
      if (!isBackgroundUpdate) {
        setLoading(true);
      }
      
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/teams/league/${selectedLeague}/${selectedSeason}/`);
        if (res.ok) {
          const responseJson = await res.json();
          // الـ BaseProxyView يرجع البيانات بداخل كائن { source: '...', data: [...] }
          setTeams(responseJson.data || []);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teams:", error);
        setLoading(false);
      }
    };

    if (selectedLeague && selectedSeason) {
      // الجلب الأول عند تحميل الصفحة أو تغيير الدوري
      fetchTeamsByLeague(false);
      
      // إعداد التحديث التلقائي كل 60 ثانية (التحديث بالخلفية)
      intervalId = setInterval(() => {
        fetchTeamsByLeague(true);
      }, 60000);
    }

    // تنظيف الـ Interval عند مغادرة الصفحة أو تغيير الدوري
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedLeague, selectedSeason]);

  // فلترة الفرق بالبحث
  const filteredTeams = teams.filter(t => 
    t.team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // GSAP Animation
  useEffect(() => {
    if (!loading && containerRef.current && filteredTeams.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.team-anim-card', 
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [filteredTeams, loading]);

  return (
    <div className="teams-page" dir="rtl">
      <Navbar />

      <main className="teams-wrapper">
        
        {/* ================= Header & Controls ================= */}
        <section className="teams-header">
          <div className="header-titles">
            <h1><Shield className="inline-icon" size={36} /> الأندية والفرق</h1>
            <p>تصفح بيانات وأرقام أندية كرة القدم حول العالم.</p>
          </div>

          <div className="teams-controls">
            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder="ابحث عن اسم النادي (مثال: ريال مدريد)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filters-box">
              <div className="filter-item">
                <Globe size={18} />
                <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}>
                  {leagues.length > 0 ? (
                    leagues.map(l => (
                      <option key={l.id} value={l.league_id}>{l.name}</option>
                    ))
                  ) : (
                    <>
                      {/* خيارات احتياطية في حال لم يتم جلب الدوريات من الداتابيز */}
                      <option value="39">الدوري الإنجليزي الممتاز</option>
                      <option value="140">الدوري الإسباني</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Teams Grid ================= */}
        <section className="all-teams" ref={containerRef}>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div> {/* يمكن إضافة سبينر CSS هنا */}
              جاري استدعاء كتيبة الفرق...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="no-data">لم نجد فريقاً بهذا الاسم.</div>
          ) : (
            <div className="teams-grid">
              {filteredTeams.map(item => (
                <div key={item.team.id} className="team-card team-anim-card">
                  <div className="team-card-header">
                    <img src={item.team.logo} alt={item.team.name} className="team-logo-main" />
                  </div>
                  
                  <div className="team-card-body">
                    <h3 className="team-name">{item.team.name}</h3>
                    <p className="team-country">{item.team.country}</p>
                    
                    <div className="team-quick-stats">
                      <div className="stat-pill">
                        <span className="stat-label">التأسيس</span>
                        <span className="stat-value">{item.team.founded || 'غير محدد'}</span>
                      </div>
                      <div className="stat-pill">
                        <span className="stat-label">سعة الملعب</span>
                        <span className="stat-value">{item.venue.capacity ? item.venue.capacity.toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="team-card-footer">
                    <a href={`/teams/${item.team.id}`} className="details-btn">
                      غرفة الملابس والتفاصيل <Users size={16} className="mr-2 inline" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Teams;