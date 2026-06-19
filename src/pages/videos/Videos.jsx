import React, { useState, useEffect } from 'react';
import { PlayCircle, Calendar, X, Loader2, AlertCircle, Film } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Videos.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const Videos = () => {
  const [videosData, setVideosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // حالة التحكم بالـ Modal (النافذة المنبثقة)
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proxy/highlights/`);
        const json = await res.json();
        
        if (res.ok && json.data) {
          setVideosData(json.data);
        } else {
          throw new Error("لم نتمكن من جلب الفيديوهات.");
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("حدث خطأ أثناء تحميل ملخصات المباريات.");
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  // إغلاق المودال وإيقاف الفيديو
  const closeModal = () => setSelectedVideo(null);

  // دالة لتنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="premium-sports-layout">
      <Navbar />

      <main className="videos-page-wrapper">
        
        {/* ================= Header ================= */}
        <section className="videos-hero-header animate-fade-in">
          <div className="header-content">
            <h1><Film className="inline-icon text-emerald-500 mr-2" size={38} /> مكتبة الفيديوهات والملخصات</h1>
            <p>شاهد أحدث أهداف وملخصات مباريات الدوريات الكبرى فور انتهائها.</p>
          </div>
        </section>

        {/* ================= Content ================= */}
        {loading ? (
          <div className="loader-screen">
            <Loader2 className="spinner" size={40} />
            <p>جاري تحميل أحدث الأهداف والملخصات...</p>
          </div>
        ) : error ? (
          <div className="error-screen">
            <AlertCircle size={50} className="text-red-500 mb-4" />
            <p>{error}</p>
          </div>
        ) : (
          <section className="videos-grid-container animate-slide-up">
            {videosData.map((item, index) => {
              // ScoreBat يرسل مصفوفة videos، نأخذ أول فيديو (الذي يكون غالباً الملخص الرئيسي)
              const mainVideo = item.videos && item.videos.length > 0 ? item.videos[0] : null;
              
              if (!mainVideo) return null;

              return (
                <div key={index} className="video-card-premium">
                  {/* حاوية الصورة المصغرة (Thumbnail) وزر التشغيل */}
                  <div 
                    className="video-thumbnail-wrapper"
                    onClick={() => setSelectedVideo({ title: item.title, embed: mainVideo.embed })}
                  >
                    <img src={item.thumbnail} alt={item.title} className="thumbnail-img" />
                    <div className="play-overlay">
                      <PlayCircle size={60} className="play-icon" />
                    </div>
                    <span className="competition-badge">{item.competition}</span>
                  </div>

                  {/* تفاصيل الكارت السفلى */}
                  <div className="video-card-info">
                    <h3 className="video-match-title">{item.title}</h3>
                    <div className="video-meta">
                      <span className="video-date"><Calendar size={14} className="inline mr-1" /> {formatDate(item.date)}</span>
                      <span className="video-type">{mainVideo.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      <Footer />

      {/* ================= Video Modal (نافذة العرض السينمائية) ================= */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>
              <X size={24} />
            </button>
            <h3 className="modal-video-title">{selectedVideo.title}</h3>
            
            {/* حقن الـ iframe الخاص بـ ScoreBat بأمان */}
            <div 
              className="embed-video-container"
              dangerouslySetInnerHTML={{ __html: selectedVideo.embed }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;
