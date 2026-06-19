import React, { useState, useEffect } from 'react';
import { Trophy, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './StandingsPage.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const StandingsPage = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('39'); // افتراضي: الدوري الإنجليزي
  const [selectedSeason, setSelectedSeason] = useState('2026'); // موسم ثابت لتجنب مشاكل الـ API المجاني
  
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. جلب قائمة الدوريات المتاحة من قاعدة بياناتك لملء القائمة المنسدلة
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/leagues/`);
        if (res.ok) {
          const data = await res.json();
          setLeagues(data);
        }
      } catch (err) {
        console.error("Failed to fetch leagues:", err);
      }
    };
    fetchLeagues();
  }, []);

  // 2. جلب جدول الترتيب عند تغيير الدوري
  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/standings/${selectedLeague}/${selectedSeason}/`);
        const json = await res.json();

        if (res.ok && json.data && json.data.length > 0) {
          // جلب مصفوفة الترتيب
          setStandings(json.data[0].league.standings[0] || []);
        } else if (res.status === 503) {
          setError("بيانات هذا الموسم غير متاحة حالياً. جرب موسماً أقدم.");
          setStandings([]);
        } else {
          setError("لا تتوفر بيانات ترتيب لهذا الدوري حالياً.");
          setStandings([]);
        }
      } catch (err) {
        console.error("Error fetching standings:", err);
        setError("تعذر الاتصال بخوادم الجرينتا لجلب الترتيب.");
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [selectedLeague, selectedSeason]);

  return (
    <div className="premium-sports-layout">
      <Navbar />

      <main className="standings-page-wrapper">
        <header className="page-header-premium animate-fade-in">
          <Trophy size={40} className="header-icon" />
          <h1>مركز جدول الترتيب</h1>
          <p>تابع ترتيب الأندية ومراكز الصدارة في أقوى الدوريات المحلية والعالمية.</p>
          
          <div className="header-controls">
            <select 
              className="premium-select"
              value={selectedLeague} 
              onChange={(e) => setSelectedLeague(e.target.value)}
            >
              {leagues.map(l => (
                <option key={l.id} value={l.league_id}>{l.name}</option>
              ))}
              {leagues.length === 0 && <option value="39">الدوري الإنجليزي (افتراضي)</option>}
            </select>

            <select 
              className="premium-select"
              value={selectedSeason} 
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              <option value="2021">موسم 2021</option>
              <option value="2022">موسم 2022</option>
              <option value="2023">موسم 2023</option>
              <option value="2024">موسم 2024</option>
              <option value="2025">موسم 2025</option>
              <option value="2026">موسم 2026</option>
              
            </select>
          </div>
        </header>

        <section className="standings-table-section animate-slide-up">
          {loading ? (
            <div className="loader-screen">
              <Loader2 className="spinner" size={40} />
              <p>جاري مزامنة مراكز الفرق والنقاط...</p>
            </div>
          ) : error ? (
            <div className="error-screen">
              <AlertCircle size={50} className="text-red-500 mb-4" />
              <p>{error}</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="empty-state">الجدول فارغ أو الموسم لم يبدأ بعد.</div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="premium-sports-table">
                <thead>
                  <tr>
                    <th>المركز</th>
                    <th>الفريق</th>
                    <th>لعب</th>
                    <th>فاز</th>
                    <th>تعادل</th>
                    <th>خسر</th>
                    <th className="hide-mobile">له</th>
                    <th className="hide-mobile">عليه</th>
                    <th className="hide-mobile">+/-</th>
                    <th className="points-col">نقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => (
                    <tr key={team.team.id}>
                      <td className="rank-cell"><span className="rank-badge">{team.rank}</span></td>
                      <td className="team-identity-cell">
                        <img src={team.team.logo} alt={team.team.name} className="table-team-badge" />
                        <span className="table-team-name">{team.team.name}</span>
                      </td>
                      <td>{team.all.played}</td>
                      <td className="text-emerald-400">{team.all.win}</td>
                      <td className="text-zinc-400">{team.all.draw}</td>
                      <td className="text-rose-400">{team.all.lose}</td>
                      <td className="hide-mobile">{team.all.goals.for}</td>
                      <td className="hide-mobile">{team.all.goals.against}</td>
                      <td className={`hide-mobile ${team.goalsDiff > 0 ? "text-emerald-500" : team.goalsDiff < 0 ? "text-rose-500" : ""}`}>
                        {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                      </td>
                      <td className="points-highlight-cell">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StandingsPage;
