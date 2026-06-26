import React, { useState, useEffect } from 'react';
import { PlayCircle, X, Loader2, AlertCircle, Film, Target } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Videos.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Videos = () => {
  const [highlightsData, setHighlightsData] = useState([]);
  const [goalsData, setGoalsData] = useState([]); // حالة جديدة للأهداف
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  const [activeTab, setActiveTab] = useState('highlights');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        // جلب الملخصات من Highlightly والأهداف من الداتابيز/يوتيوب في نفس الوقت بالتوازي
        const [highlightsRes, goalsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/proxy/highlights/`),
          fetch(`${API_BASE_URL}/proxy/goals-library/`)
        ]);

        const highlightsJson = await highlightsRes.json();
        const goalsJson = await goalsRes.json();

        if (highlightsRes.ok && highlightsJson.data) {
          setHighlightsData(highlightsJson.data);
        }
        if (goalsRes.ok) {
          setGoalsData(goalsJson); // الكود الخاص بك يرجع المصفوفة مباشرة
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("حدث خطأ أثناء تحميل الفيديوهات.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const closeModal = () => setSelectedVideo(null);

  return (
    <div className="videos-page-wrapper">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <header className="videos-hero-header">
          <h1>🎬 مكتبة الفيديوهات</h1>
          <p>شاهد أحدث أهداف وملخصات مباريات الدوريات الكبرى بجودة عالية</p>
        </header>

 {/* ================= Tabs Section ================= */}
<div className="tabs-wrapper">
  <div className="tabs-container">
    <button 
      className={`tab-btn ${activeTab === 'highlights' ? 'active' : ''}`}
      onClick={() => setActiveTab('highlights')}
    >
      <Film size={18} />
      <span>ملخصات المباريات</span>
    </button>
    
    <button 
      className={`tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
      onClick={() => setActiveTab('goals')}
    >
      <Target size={18} />
      <span>مكتبة الأهداف</span>
    </button>
  </div>
</div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-zinc-400">جاري تحميل الفيديوهات الحصرية...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-900 text-red-400 p-4 rounded-xl max-w-md mx-auto">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* عرض الملخصات */}
            {activeTab === 'highlights' && (
              <section className="videos-grid-container">
                {highlightsData.length === 0 && (
                  <div className="col-span-full text-center py-10 text-zinc-500">لا توجد ملخصات متاحة حالياً.</div>
                )}
                {highlightsData.map((item) => (
                  <div key={item.id} className="video-card-premium cursor-pointer" onClick={() => setSelectedVideo({
                      title: item.title,
                      embedUrl: item.embedUrl || item.url,
                      description: item.description
                  })}>
                    <div className="video-thumbnail-wrapper">
                      <img src={item.imgUrl} alt={item.title} className="thumbnail-img" />
                      <div className="play-overlay">
                        <PlayCircle size={48} className="play-icon" />
                      </div>
                      <span className="competition-badge">{item.channel || "فيديو رياضي"}</span>
                    </div>
                    <div className="video-card-info">
                      <h3 className="video-match-title">{item.title}</h3>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* عرض الأهداف (بناءً على دالة الـ Youtube التي صممتها) */}
{/* عرض الأهداف */}
            {activeTab === 'goals' && (
              <section className="videos-grid-container">
                {goalsData.length === 0 && (
                  <div className="col-span-full text-center py-10 text-zinc-500">لا توجد أهداف متاحة حالياً.</div>
                )}
                {goalsData.map((item, idx) => (
                  <div key={idx} className="video-card-premium cursor-pointer" onClick={() => setSelectedVideo({
                      title: `أهداف مباراة ${item.home_team} و ${item.away_team}`,
                      embedUrl: item.embed_url, // 👈 تم التحديث ليأخذ الرابط المباشر من الباك-إند
                      description: `نتيجة المباراة: ${item.score}`
                  })}>
                    <div className="video-thumbnail-wrapper">
                      {/* 👈 تم التحديث لتأخذ الصورة من الباك-إند مباشرة حسب المنصة */}
                      <img src={item.thumbnail_url} alt="أهداف المباراة" className="thumbnail-img" />
                      <div className="play-overlay">
                        <PlayCircle size={48} className="play-icon" />
                      </div>
                      <span className="competition-badge">{item.platform}</span> {/* عرض اسم المنصة */}
                    </div>
                    <div className="video-card-info">
                      <h3 className="video-match-title">{item.home_team} ضد {item.away_team}</h3>
                      <div className="video-meta mt-2 text-emerald-400 font-bold">
                        النتيجة: {item.score}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <Footer />

      {selectedVideo && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>
              <X size={24} />
            </button>
            <h3 className="modal-video-title">{selectedVideo.title}</h3>
            <div className="embed-video-container">
              <iframe
                src={selectedVideo.embedUrl}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                title={selectedVideo.title}
              ></iframe>
            </div>
            {selectedVideo.description && (
              <p className="p-4 text-sm text-zinc-400">{selectedVideo.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;
