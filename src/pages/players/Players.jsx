import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Search, Filter, ChevronLeft, ChevronRight, Star, Activity, User, CalendarDays } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Players.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const Players = () => {
  const containerRef = useRef(null);
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('39'); // 39 = Premier League
  // تم تغيير الموسم لـ 2026 كافتراضي لتجنب قيود الباقة المجانية لـ API-Sports
  const [selectedSeason, setSelectedSeason] = useState('2026'); 
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('rating'); // 'goals', 'assists', 'rating', 'age_asc', 'age_desc'

  // 1. جلب البيانات الحقيقية من دجانغو
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/players/search/?league=${selectedLeague}&season=${selectedSeason}&page=${page}&search=${searchQuery}`);
        
        if (res.ok) {
          const responseJson = await res.json();
          // استخراج البيانات الحقيقية من كائن الرد الخاص بـ BaseProxyView
          const apiData = responseJson.data || [];

          // 2. فرز البيانات (Sorting) بناءً على هياكل API-Sports الفعلية
          let sortedData = [...apiData];
          if (sortBy === 'goals') sortedData.sort((a, b) => (b.statistics[0]?.goals?.total || 0) - (a.statistics[0]?.goals?.total || 0));
          if (sortBy === 'assists') sortedData.sort((a, b) => (b.statistics[0]?.goals?.assists || 0) - (a.statistics[0]?.goals?.assists || 0));
          if (sortBy === 'rating') sortedData.sort((a, b) => parseFloat(b.statistics[0]?.games?.rating || 0) - parseFloat(a.statistics[0]?.games?.rating || 0));
          if (sortBy === 'age_asc') sortedData.sort((a, b) => (a.player?.age || 0) - (b.player?.age || 0));
          if (sortBy === 'age_desc') sortedData.sort((a, b) => (b.player?.age || 0) - (a.player?.age || 0));

          setPlayers(sortedData);
        } else if (res.status === 503) {
          setError("بيانات هذا الموسم غير متاحة في الوقت الحالي. جرب موسماً آخر.");
          setPlayers([]);
        } else {
          setError("لم نتمكن من جلب بيانات اللاعبين.");
          setPlayers([]);
        }
      } catch (err) {
        console.error("Error fetching real players data:", err);
        setError("تعذر الاتصال بخوادم الجرينتا.");
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    // تطبيق Debounce بـ 800ms لحماية الـ API من الاستهلاك السريع عند الكتابة
    const timeoutId = setTimeout(() => {
      fetchPlayers();
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedLeague, selectedSeason, page, sortBy]);

  // أنيميشن الدخول
  useEffect(() => {
    if (!loading && !error && containerRef.current && players.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.player-card-anim', 
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [players, loading, error]);

  // استخراج اللاعبين الأكثر تألقاً للمحاكاة بالواجهة
  const trendingPlayers = [...players]
    .sort((a, b) => parseFloat(b.statistics[0]?.games?.rating || 0) - parseFloat(a.statistics[0]?.games?.rating || 0))
    .slice(0, 4);

  return (
    <div className="players-page" dir="rtl">
      <Navbar />

      <main className="players-wrapper" ref={containerRef}>
        
        {/* ================= 1. Header ================= */}
        <section className="players-header">
          <h1><User className="inline-icon" size={36}/> نجوم الساحرة المستديرة</h1>
          <p>ابحث عن لاعبيك المفضلين، تصفح إحصائياتهم، وقارن بين أساطير كرة القدم.</p>
        </section>

        {/* ================= 2 & 3 & 6. Search, Filters & Sorting ================= */}
        <section className="players-controls-bento">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الفريق، أو الجنسية..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <Filter size={16} className="text-emerald-400" />
              <select value={selectedLeague} onChange={(e) => { setSelectedLeague(e.target.value); setPage(1); }}>
                <option value="39">الدوري الإنجليزي</option>
                <option value="140">الدوري الإسباني</option>
                <option value="135">الدوري الإيطالي</option>
                <option value="61">الدوري الفرنسي</option>
              </select>
            </div>

            <div className="filter-group">
              <CalendarDays size={16} className="text-emerald-400" />
              <select value={selectedSeason} onChange={(e) => { setSelectedSeason(e.target.value); setPage(1); }}>

                <option value="2025">موسم 2025</option>
                <option value="2024">موسم 2024</option>
                <option value="2023">موسم 2023</option>
                                <option value="2022">موسم 2022</option>

                <option value="2021">موسم 2021</option>

                <option value="2020">موسم 2020</option>

              </select>
            </div>

            <div className="filter-group">
              <Activity size={16} className="text-emerald-400" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rating">الأعلى تقييماً</option>
                <option value="goals">الأكثر أهدافاً</option>
                <option value="assists">الأكثر صناعة</option>
                <option value="age_asc">الأصغر عمراً</option>
                <option value="age_desc">الأكبر عمراً</option>
              </select>
            </div>
          </div>
        </section>

        {/* ================= 4. Trending Players ================= */}
        {!searchQuery && page === 1 && trendingPlayers.length > 0 && (
          <section className="trending-players">
            <h2>🔥 اللاعبون الأكثر تألقاً</h2>
            <div className="trending-grid">
              {trendingPlayers.map(p => (
                <div key={`trend-${p.player.id}`} className="trending-card player-card-anim">
                  <div className="trend-img-wrapper">
                    <img src={p.player.photo} alt={p.player.name} onError={(e) => e.target.src='https://placehold.co/60x60?text=Player'} />
                  </div>
                  <div className="trend-info">
                    <h3>{p.player.name}</h3>
                    <div className="trend-meta">
                      <img src={p.statistics[0]?.team?.logo} alt="team" className="tiny-logo" onError={(e) => e.target.style.display='none'} />
                      <span>{p.statistics[0]?.team?.name || 'غير محدد'}</span> • <span>{p.statistics[0]?.games?.position || 'N/A'}</span>
                    </div>
                    <div className="trend-rating">
                      <Star size={14} fill="#fbbf24" color="#fbbf24"/> 
                      {parseFloat(p.statistics[0]?.games?.rating || 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= 5. Players Grid ================= */}
        <section className="all-players-section">
          <h2>قائمة اللاعبين {players.length > 0 ? `(${players.length})` : ''}</h2>
          
          {loading ? (
            <div className="loader text-center py-10 text-emerald-500 font-bold">جاري البحث في السجلات الحية...</div>
          ) : error ? (
            <div className="no-data text-center text-red-500 py-10 bg-red-500/10 rounded-xl">{error}</div>
          ) : players.length === 0 ? (
            <div className="no-data text-center py-10 bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-400">لم نجد أي لاعب يطابق بحثك.</div>
          ) : (
            <div className="players-grid">
              {players.map(p => (
                <div key={p.player.id} className="player-card player-card-anim">
                  <div className="player-photo-container">
                    <img src={p.player.photo} alt={p.player.name} className="player-photo" onError={(e) => e.target.src='https://placehold.co/120x120?text=Player'} />
                    <span className="player-number">{p.statistics[0]?.games?.number || '-'}</span>
                  </div>
                  
                  <div className="player-card-body">
                    <h3 className="player-name">{p.player.name}</h3>
                    <div className="player-team-row">
                      <img src={p.statistics[0]?.team?.logo} alt="team" onError={(e) => e.target.style.display='none'} />
                      <span>{p.statistics[0]?.team?.name || 'مستقل'}</span>
                    </div>
                    
                    <div className="player-meta-tags">
                      <span className="tag">{p.statistics[0]?.games?.position || 'لاعب'}</span>
                      <span className="tag">{p.player.nationality}</span>
                      <span className="tag">{p.player.age} سنة</span>
                    </div>
                  </div>
                  
                  <div className="player-card-footer">
                    <a href={`/players/${p.player.id}`} className="view-profile-btn">
                      الملف الشخصي
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 7. Pagination ================= */}
        {players.length > 0 && !loading && (
          <section className="pagination-controls">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="page-btn"
            >
              <ChevronRight size={20} /> السابق
            </button>
            <span className="page-indicator">صفحة {page}</span>
            {/* في حال إرجاع الـ API مصفوفة كاملة يمكن ترك الزر مفعلاً للتقدم */}
            <button 
              onClick={() => setPage(p => p + 1)}
              className="page-btn"
            >
              التالي <ChevronLeft size={20} />
            </button>
          </section>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default Players;
