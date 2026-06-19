import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, Flag, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './TeamDetails.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const TeamDetails = () => {
  const { id } = useParams(); // /team/33
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/teams/${id}/`);
        const result = await res.json();
        
        if (res.ok && result.data && result.data.length > 0) {
          setTeamData(result.data[0]); // { team: {...}, venue: {...} }
        } else {
          setError("لم نتمكن من العثور على بيانات هذا الفريق.");
        }
      } catch (err) {
        setError("حدث خطأ في الاتصال بسيرفر الجرينتا.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamInfo();
  }, [id]);

  if (loading) return <div className="loader-screen">جاري فتح أبواب الملعب...</div>;
  if (error) return <div className="error-screen">{error}</div>;
  if (!teamData) return null;

  const { team, venue } = teamData;

  // ملاحظة: API-Sports لا يعيد بيانات المدرب في نفس هذا الـ Endpoint.
  // ستحتاج مستقبلاً لعمل Proxy جديد لجلب الـ Coach. وضعنا هنا واجهة جاهزة له.

  return (
    <div className="team-details-page" dir="rtl">
      <Navbar />

      <main className="team-details-wrapper">
        
        {/* ================= Hero Section (الملعب كخلفية) ================= */}
        <section className="team-hero" style={{ backgroundImage: `url(${venue.image})` }}>
          <div className="hero-overlay"></div>
          
          <div className="team-hero-content">
            <div className="team-logo-container">
              <img src={team.logo} alt={team.name} className="team-hero-logo" />
            </div>
            
            <div className="team-hero-info">
              <h1 className="team-hero-name">{team.name}</h1>
              <div className="team-badges">
                <span className="info-badge"><Flag size={14}/> {team.country}</span>
                <span className="info-badge"><Calendar size={14}/> تأسس عام {team.founded}</span>
                <span className="info-badge highlight"><ShieldCheck size={14}/> {team.national ? 'منتخب وطني' : 'نادي محلي'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Details Grid ================= */}
        <section className="team-info-grid">
          
          {/* كارت الملعب */}
          <div className="info-card">
            <div className="card-header">
              <h2>🏟️ الملعب الرسمي</h2>
            </div>
            <div className="card-body venue-body">
              <img src={venue.image} alt={venue.name} className="venue-thumb" />
              <div className="venue-details">
                <h3>{venue.name}</h3>
                <p><MapPin size={16} className="inline mr-1"/> {venue.address}, {venue.city}</p>
                <div className="capacity-box">
                  <span className="label">السعة الجماهيرية</span>
                  <span className="value">{venue.capacity ? venue.capacity.toLocaleString() : 'غير معروف'} مشجع</span>
                </div>
                <div className="surface-box">
                  <span className="label">نوع الأرضية:</span>
                  <span className="value">{venue.surface}</span>
                </div>
              </div>
            </div>
          </div>

          {/* كارت الجهاز الفني والإدارة */}
          <div className="info-card">
            <div className="card-header">
              <h2>👔 الجهاز الفني (المدرب)</h2>
            </div>
            <div className="card-body coach-body">
              <div className="coach-placeholder">
                <img src="https://placehold.co/100x100?text=Coach" alt="Coach" className="coach-avatar" />
                <div className="coach-info">
                  <h3>المدير الفني</h3>
                  <p className="text-zinc-400 text-sm">يتم تحديث بيانات المدربين دورياً عبر الـ API المخصص.</p>
                  <button className="fetch-coach-btn">تحديث بيانات الطاقم</button>
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>
      <Footer />
    </div>
  );
};

export default TeamDetails;
