import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './LeagueDetails.css';

const API_BASE_URL = 'https://161.97.76.160/api';

const LeagueDetails = () => {
  const { id, season } = useParams(); // يتم تمريرهم عبر الـ Router مثل /league/39/2026
  
  const [standingsData, setStandingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeagueStandings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/standings/${id}/${season}/`);
        const result = await res.json();
        
        if (res.ok && result.data && result.data.length > 0) {
          // الـ API يرجع المصفوفة، الترتيب يكون عادة في أول عنصر
          setStandingsData(result.data[0].league);
        } else {
          setError("لا تتوفر بيانات ترتيب لهذا الدوري حالياً.");
        }
      } catch (err) {
        setError("حدث خطأ أثناء الاتصال بالخادم.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueStandings();
  }, [id, season]);

  if (loading) return <div className="loader-screen">جاري تحميل بيانات الدوري...</div>;
  if (error) return <div className="error-screen">{error}</div>;
  if (!standingsData) return null;

  // غالباً الترتيب متاح في standings[0] (مجموعة واحدة للدوريات العادية)
  const standings = standingsData.standings[0] || [];

  return (
    <div className="league-details-page" dir="rtl">
      <Navbar />

      <main className="details-wrapper">
        
        {/* ================= Header ================= */}
        <section className="league-hero">
          <img src={standingsData.logo} alt={standingsData.name} className="hero-league-logo" />
          <div className="hero-league-info">
            <h1>{standingsData.name}</h1>
            <p>{standingsData.country} • موسم {standingsData.season}</p>
          </div>
        </section>

        {/* ================= جدول الترتيب (Standings) ================= */}
        <section className="standings-section">
          <div className="section-title-box">
            <h2>جدول الترتيب</h2>
            <span className="live-update-badge">يتم التحديث تلقائياً</span>
          </div>

          <div className="table-container">
            <table className="standings-table">
              <thead>
                <tr>
                  <th className="text-center">#</th>
                  <th>الفريق</th>
                  <th className="text-center">لعب</th>
                  <th className="text-center">فاز</th>
                  <th className="text-center">تعادل</th>
                  <th className="text-center">خسر</th>
                  <th className="text-center hide-mobile">أهداف له</th>
                  <th className="text-center hide-mobile">أهداف عليه</th>
                  <th className="text-center hide-mobile">الفرق</th>
                  <th className="text-center font-bold">النقاط</th>
                  <th className="text-center hide-mobile">النموذج</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team) => (
                  <tr key={team.team.id} className="team-row">
                    <td className="text-center rank-cell">
                      <span className="rank-number">{team.rank}</span>
                    </td>
                    <td>
                      <div className="team-name-cell">
                        <img src={team.team.logo} alt={team.team.name} />
                        <span className="font-bold">{team.team.name}</span>
                      </div>
                    </td>
                    <td className="text-center">{team.all.played}</td>
                    <td className="text-center text-emerald-400">{team.all.win}</td>
                    <td className="text-center text-zinc-400">{team.all.draw}</td>
                    <td className="text-center text-red-400">{team.all.lose}</td>
                    <td className="text-center hide-mobile">{team.all.goals.for}</td>
                    <td className="text-center hide-mobile">{team.all.goals.against}</td>
                    <td className="text-center hide-mobile" dir="ltr">{team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}</td>
                    <td className="text-center font-black text-lg text-emerald-400">{team.points}</td>
                    <td className="text-center hide-mobile">
                      <div className="form-badges">
                        {team.form?.split('').map((f, i) => (
                          <span key={i} className={`form-badge ${f === 'W' ? 'win' : f === 'D' ? 'draw' : 'lose'}`}>{f}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default LeagueDetails;
