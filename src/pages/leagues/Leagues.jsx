import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Search, Trophy, Globe, Filter } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Leagues.css';

const API_BASE_URL = 'http://161.97.76.160/api';

const Leagues = () => {
  const containerRef = useRef(null);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  // States الخاصة بالفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); 

  // 🌟 الـ State الخاص بالـ Pagination (الحد الابتدائي 21 دوري)
  const [visibleCount, setVisibleCount] = useState(21);

  // جلب البيانات من الـ API
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/leagues/`);
        const data = await res.json();
        setLeagues(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leagues:", error);
        setLoading(false);
      }
    };
    fetchLeagues();
  }, []);

  // 🌟 إعادة تعيين العدد إلى 21 تلقائياً عند قيام المستخدم بالبحث أو الفلترة لتجنب السلوك العشوائي
  useEffect(() => {
    setVisibleCount(21);
  }, [searchQuery, selectedCountry, selectedType]);

  // تأثير الـ GSAP للأنيميشن عند تحميل الكروت أو عرض المزيد
  useEffect(() => {
    if (!loading && leagues.length > 0) {
      gsap.fromTo('.league-anim-card', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.02, ease: 'power2.out' }
      );
    }
  }, [loading, visibleCount, searchQuery, selectedCountry, selectedType]);

  // استخراج قائمة الدول الفريدة ديناميكياً لتغذية قائمة الفلترة
  const uniqueCountries = [...new Set(leagues.map(l => l.country).filter(Boolean))];

  // لوجيك فلترة البيانات بناءً على مدخلات المستخدم
  const filteredLeagues = leagues.filter(league => {
    const matchesSearch = league.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          league.country?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || league.country === selectedCountry;
    const matchesType = selectedType === 'all' || league.type?.toLowerCase() === selectedType.toLowerCase();
    
    return matchesSearch && matchesCountry && matchesType;
  });

  // 🌟 تحسين الأداء: قص المصفوفة لعرض العدد المسموح به فقط في الـ DOM حالياً
  const displayedLeagues = filteredLeagues.slice(0, visibleCount);

  // دالة زيادة العناصر عند الضغط على زر عرض المزيد
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + 21);
  };

  return (
    <div className="leagues-wrapper" ref={containerRef}>
      <Navbar />
      <main>
        
        {/* قسم الهيدر وأدوات التحكم */}
        <section className="leagues-header">
          <div className="header-titles">
            <h1>
              <Trophy className="inline-icon" size={36} />
              تصفح الدوريات والبطولات
            </h1>
            <p>تابع ترتيب وإحصائيات أهم البطولات المحلية والعالمية المحدثة لحظة بلحظة</p>
          </div>

          <div className="leagues-controls">
            {/* صندوق البحث الحركي */}
            <div className="search-box">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن دوري أو دولة..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* فلتر الدول الفلتر */}
            <div className="filter-select-wrapper">
              <select 
                className="filter-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="all">كل الدول</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* فلتر نوع البطولة */}
 
          </div>
        </section>

        {/* قسم عرض محتوى الكروت */}
        <section className="leagues-content">
          {loading ? (
            <div className="loading">جاري تحميل الدوريات...</div>
          ) : filteredLeagues.length === 0 ? (
            <div className="no-data">لا توجد بطولات تطابق معايير البحث.</div>
          ) : (
            <>
              {/* شبكة العرض المصغرة للأداء العالي */}
              <div className="leagues-grid">
                {displayedLeagues.map(league => (
                  <div key={league.id} className="league-card league-anim-card">
                    <div className="league-card-header">
                      <img 
                        src={league.logo} 
                        alt={league.name} 
                        className="league-logo" 
                        onError={(e) => e.target.src='https://placehold.co/80x80'} 
                      />
                      <div className="status-indicator active">موسم نشط</div>
                    </div>
                    
                    <div className="league-card-body">
                      <h3 className="league-name">{league.name}</h3>
                      <div className="league-meta">
                        <span>الدولة: <strong>{league.country}</strong></span>
                        <span>الموسم: <strong>{league.season}</strong></span>
                      </div>
                    </div>
                    
                    <div className="league-card-footer">
                      <a href={`/league/${league.league_id}/${league.season}`} className="details-btn">
                        التفاصيل والترتيب
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🌟 زر عرض المزيد الذكي: يختفي تلقائياً عند انتهاء العناصر */}
              {visibleCount < filteredLeagues.length && (
                <div className="load-more-container">
                  <button onClick={handleLoadMore} className="load-more-btn">
                    عرض المزيد ⬇️
                  </button>
                </div>
              )}
            </>
          )}
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Leagues;