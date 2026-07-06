import React, { useState, useEffect } from 'react';
import { PlayCircle, X, Loader2, AlertCircle, Film, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tweet } from 'react-tweet'; 
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './Videos.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

const Videos = () => {
  const [highlightsData, setHighlightsData] = useState([]);
  const [goalsData, setGoalsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null); 
  
  const [activeTab, setActiveTab] = useState('goals');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
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
          setGoalsData(goalsJson);
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

  // 👈 التعديل هنا: توليد ID مؤقت إذا كان مفقوداً بسبب الكاش القديم في الباك إند
  const handleVideoClick = (item, isHighlight = false) => {
    if (!isHighlight && item.platform === 'Twitter') {
      setSelectedVideo(item);
    } else {
      // بناء ID آمن لتجنب مشكلة /video/undefined
      const safeId = item.id || `temp-id-${Math.random().toString(36).substr(2, 9)}`;
      
      const videoData = isHighlight 
        ? { ...item, id: safeId, platform: item.channel ? 'Dailymotion' : 'Other', thumbnailUrl: item.imgUrl }
        : { ...item, id: safeId };
        
      navigate(`/video/${safeId}`, { state: { video: videoData } });
    }
  };

  return (
    <div className="videos-page-wrapper">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <header className="videos-hero-header">
          <h1>🎬 مكتبة الفيديوهات</h1>
          <p>شاهد أحدث أهداف وملخصات مباريات الدوريات الكبرى بجودة عالية</p>
        </header>

        <div className="tabs-wrapper">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveTab('goals')}
            >
              <Target size={18} />
              <span>مكتبة الأهداف</span>
            </button>

            <button 
              className={`tab-btn ${activeTab === 'highlights' ? 'active' : ''}`}
              onClick={() => setActiveTab('highlights')}
            >
              <Film size={18} />
              <span>ملخصات المباريات</span>
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
            {activeTab === 'goals' && (
              <section className="videos-grid-container">
                {goalsData.length === 0 && (
                  <div className="col-span-full text-center py-10 text-zinc-500">لا توجد أهداف متاحة حالياً.</div>
                )}
                {goalsData.map((item, idx) => {
                  // 👈 تأمين الـ Key في حال كان الـ id غير موجود
                  const safeItem = { ...item, id: item.id || `fallback-goal-${idx}` };
                  return (
                    <div key={safeItem.id} className="video-card-premium cursor-pointer" onClick={() => handleVideoClick(safeItem, false)}>
                      <div className="video-thumbnail-wrapper">
                        <img src={safeItem.thumbnailUrl || 'https://via.placeholder.com/720x400.png?text=Goals'} alt={safeItem.title} className="thumbnail-img" />
                        <div className="play-overlay">
                          <PlayCircle size={48} className="play-icon" />
                        </div>
                        <span className="competition-badge" style={{
                          backgroundColor: safeItem.platform === 'Twitter' ? '#1DA1F2' : safeItem.platform === 'Btolat' ? '#10b981' : '#3f3f46'
                        }}>
                          {safeItem.platform === 'Btolat' ? 'أهداف' : safeItem.platform}
                        </span> 
                      </div>
                      <div className="video-card-info">
                        <h3 className="video-match-title" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                          {safeItem.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {activeTab === 'highlights' && (
              <section className="videos-grid-container">
                {highlightsData.length === 0 && (
                  <div className="col-span-full text-center py-10 text-zinc-500">لا توجد ملخصات متاحة حالياً.</div>
                )}
                {highlightsData.map((item, idx) => {
                  const safeItem = { ...item, id: item.id || `fallback-highlight-${idx}` };
                  return (
                    <div key={safeItem.id} className="video-card-premium cursor-pointer" onClick={() => handleVideoClick(safeItem, true)}>
                      <div className="video-thumbnail-wrapper">
                        <img src={safeItem.imgUrl} alt={safeItem.title} className="thumbnail-img" />
                        <div className="play-overlay">
                          <PlayCircle size={48} className="play-icon" />
                        </div>
                        <span className="competition-badge">{safeItem.channel || "ملخص المباراة"}</span>
                      </div>
                      <div className="video-card-info">
                        <h3 className="video-match-title">{safeItem.title}</h3>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>

      {/* المودال محذوف منه الـ Video المباشر ومقتصر على تويتر فقط كما اتفقنا */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedVideo(null)}>
              <X size={24} />
            </button>
            <h2 className="modal-video-title" style={{ color: '#fff', marginBottom: '15px', fontSize: '1.2rem', textAlign: 'right' }}>
              {selectedVideo.title}
            </h2>
            <div className="modal-video-body">
              {selectedVideo.platform === 'Twitter' ? (
                <div className="tweet-container flex justify-center text-white" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <Tweet id={selectedVideo.embedUrl} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Videos;
