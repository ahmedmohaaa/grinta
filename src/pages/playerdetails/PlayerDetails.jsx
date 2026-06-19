import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Flag, Activity, Calendar, Trophy, AlertCircle } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './PlayerDetails.css';

const API_BASE_URL = 'http://161.97.76.160/api';

const PlayerDetails = () => {
  const { id } = useParams(); // /player/276
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        // نستخدم الـ Proxy الذي برمجته أنت مسبقاً (PlayerInfoProxyView)
        // المسار هو: /proxy/players/<id>/<season>/
        const res = await fetch(`${API_BASE_URL}/proxy/players/${id}/2026/`);
        const result = await res.json();
        
        if (res.ok && result.data && result.data.length > 0) {
          setPlayerData(result.data[0]); // API-Sports يعيد مصفوفة، نأخذ أول عنصر
        }
      } catch (error) {
        console.error("Error fetching player:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerDetails();
  }, [id]);

  if (loading) return <div className="loader">جاري جلب ملف اللاعب...</div>;
  if (!playerData) return <div className="error-state">لا توجد بيانات متاحة لهذا اللاعب.</div>;

  const { player, statistics } = playerData;
  // إحصائيات الموسم الحالي (عادة تكون أول عنصر في المصفوفة)
  const currentStats = statistics[0] || {};
  const team = currentStats.team || {};
  const games = currentStats.games || {};
  const goals = currentStats.goals || {};
  const cards = currentStats.cards || {};

  return (
    <div className="player-details-page" dir="rtl">
      <Navbar />

      <main className="player-details-wrapper">
        
        {/* ================= 1. Hero Section ================= */}
        <section className="player-hero-bento">
          <div className="hero-visual">
            <div className="player-number-bg">{games.number || '00'}</div>
            <img src={player.photo} alt={player.name} className="hero-player-img" />
          </div>
          
          <div className="hero-info">
            <div className="hero-tags">
              <span className="hero-tag"><Flag size={14}/> {player.nationality}</span>
              <span className="hero-tag"><Activity size={14}/> {games.position}</span>
            </div>
            
            <h1 className="hero-name">{player.name}</h1>
            
            <div className="hero-club">
              <img src={team.logo} alt={team.name} />
              <h2>{team.name}</h2>
            </div>
          </div>
        </section>

        <div className="details-grid-layout">
          
          {/* ================= 2. معلومات اللاعب (Personal Info) ================= */}
          <section className="info-card personal-info">
            <h3 className="card-title">البطاقة الشخصية</h3>
            <ul className="info-list">
              <li>
                <span className="label">الاسم الكامل</span>
                <span className="value">{player.firstname} {player.lastname}</span>
              </li>
              <li>
                <span className="label">تاريخ الميلاد</span>
                <span className="value">{player.birth.date} ({player.age} عاماً)</span>
              </li>
              <li>
                <span className="label">محل الميلاد</span>
                <span className="value">{player.birth.place}, {player.birth.country}</span>
              </li>
              <li>
                <span className="label">الطول / الوزن</span>
                <span className="value" dir="ltr">{player.height} / {player.weight}</span>
              </li>
            </ul>
          </section>

          {/* ================= 3. معلومات النادي (Club Info) ================= */}
          <section className="info-card club-info">
            <h3 className="card-title">البيانات الرياضية</h3>
            <div className="club-big-logo">
              <img src={team.logo} alt={team.name} />
            </div>
            <ul className="info-list">
              <li>
                <span className="label">النادي الحالي</span>
                <span className="value font-bold">{team.name}</span>
              </li>
              <li>
                <span className="label">رقم القميص</span>
                <span className="value">{games.number || 'غير محدد'}</span>
              </li>
              <li>
                <span className="label">التقييم العام</span>
                <span className="value rating-value">{games.rating ? parseFloat(games.rating).toFixed(2) : 'N/A'}</span>
              </li>
            </ul>
          </section>

          {/* ================= 4. الإحصائيات (Statistics) ================= */}
          <section className="info-card stats-info">
            <h3 className="card-title">إحصائيات الموسم ({currentStats.league?.name})</h3>
            
            <div className="stats-grid">
              <div className="stat-box">
                <Trophy size={24} className="stat-icon text-emerald-400" />
                <span className="stat-num">{games.appearences || 0}</span>
                <span className="stat-name">مباراة لعبها</span>
              </div>
              
              <div className="stat-box">
                <Activity size={24} className="stat-icon text-emerald-400" />
                <span className="stat-num">{games.minutes || 0}</span>
                <span className="stat-name">دقائق اللعب</span>
              </div>
              
              <div className="stat-box">
                <img src="https://cdn-icons-png.flaticon.com/512/53/53283.png" alt="Goal" className="stat-img-icon filter-white" />
                <span className="stat-num">{goals.total || 0}</span>
                <span className="stat-name">الأهداف</span>
              </div>
              
              <div className="stat-box">
                <img src="https://cdn-icons-png.flaticon.com/512/1505/1505581.png" alt="Assist" className="stat-img-icon filter-white" />
                <span className="stat-num">{goals.assists || 0}</span>
                <span className="stat-name">صناعة (Assists)</span>
              </div>
            </div>

            <div className="cards-stats">
              <div className="card-box yellow">
                <AlertCircle size={16} /> بطاقات صفراء: <strong>{cards.yellow || 0}</strong>
              </div>
              <div className="card-box red">
                <AlertCircle size={16} /> بطاقات حمراء: <strong>{cards.red || 0}</strong>
              </div>
            </div>

          </section>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default PlayerDetails;