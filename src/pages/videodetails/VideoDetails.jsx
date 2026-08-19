import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PlayCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './VideoDetails.css';

const API_BASE_URL = 'https://api.algrinta.com/api';

/* 🎯 مكون عرض الإعلان */
const AdSlot = ({ ad }) => {
  if (!ad) return null;
  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '28px auto', padding: '0 16px', boxSizing: 'border-box' }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '110px',
        padding: '20px 14px 14px',
        background: 'linear-gradient(180deg, rgba(128,128,128,0.08), rgba(128,128,128,0.03))',
        border: '1px solid rgba(128,128,128,0.18)',
        borderRadius: '14px',
        overflow: 'hidden'
      }}>
        <span style={{
          position: 'absolute', top: '7px', insetInlineStart: '12px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
          color: '#8f8f97', userSelect: 'none'
        }}>
          إعلان
        </span>
        {ad.code ? (
          <div style={{ width: '100%', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: ad.code }} />
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600 }}>{ad.name}</span>
        )}
      </div>
    </div>
  );
};

const VideoDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [video, setVideo] = useState(location.state?.video || null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(!video);

  /* 📢 حالة الإعلانات */
  const [activeAds, setActiveAds] = useState([]);

  /* 📢 جلب إعلانات صفحة تفاصيل الفيديو فقط */
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ads/?page=video-details`);
        const adsRes = await res.json();
        if (Array.isArray(adsRes)) {
          setActiveAds(adsRes.filter(ad => ad.status === 'active' && ad.page === 'video-details'));
        }
      } catch (err) { console.error("Error loading ads:", err); }
    };
    fetchAds();
  }, []);

  const topAd = activeAds.length > 0 ? activeAds[0] : null;
  const bottomAd = activeAds.length > 1 ? activeAds[1] : null;

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchAllVideos = async () => {
      try {
        const [highlightsRes, goalsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/proxy/highlights/`),
          fetch(`${API_BASE_URL}/proxy/goals-library/`)
        ]);

        const highlightsJson = await highlightsRes.json();
        const goalsJson = await goalsRes.json();

        const highlightsList = highlightsJson.data && Array.isArray(highlightsJson.data) ? highlightsJson.data : [];
        const goalsList = Array.isArray(goalsJson) ? goalsJson : [];

        if (!video) {
          const currentVideo = 
            highlightsList.find(item => String(item.id) === String(id)) || 
            goalsList.find(item => String(item.id) === String(id));

          if (currentVideo) {
            setVideo(currentVideo.channel ? { ...currentVideo, platform: 'Dailymotion', thumbnailUrl: currentVideo.imgUrl } : currentVideo);
          }
        }

        const filteredGoals = goalsList.filter(item => String(item.id) !== String(id));
        const random6Goals = filteredGoals.sort(() => 0.5 - Math.random()).slice(0, 6);
        setRelatedVideos(random6Goals);
      } catch (err) {
        console.error("Error loading video details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllVideos();
  }, [id, video]);

  const handleVideoClick = (item) => {
    navigate(`/video/${item.id}`, { state: { video: item } });
    setVideo(item);
  };

  if (loading) {
    return (
      <div className="min-height-60vh flex flex-col items-center justify-center bg-zinc-950 text-white gap-3">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-zinc-400">جاري تحميل تفاصيل ومستجدات المباراة...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-height-60vh bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-xl font-semibold">الفيديو غير موجود أو تم حذفه.</p>
        <button onClick={() => navigate('/videos')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition">
          <ArrowRight size={18} /> العودة لمكتبة الفيديوهات
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100" style={{ direction: 'rtl' }}>
      <Navbar />

      {/* مشغل الفيديو بكامل عرض الموقع */}
      <section className="video-section-wrapper">
        <div className="youtube-style-player">
          <iframe
            src={video.embedUrl}
            frameBorder="0"
            allowFullScreen
            referrerPolicy="no-referrer"
            allow="autoplay; encrypted-media; picture-in-picture"
            title={video.title}
          ></iframe>
        </div>
      </section>

      {/* 📢 إعلان بعد مشغل الفيديو مباشرة (أعلى موضع) */}
      <AdSlot ad={topAd} />

      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-10 border-b border-zinc-800/60 pb-6">
          <h1 className="video-title-premium">
            {video.title}
          </h1>
          {video.description && (
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed text-right mt-2 max-w-3xl">
              {video.description}
            </p>
          )}
        </div>

        {relatedVideos.length > 0 && (
          <section className="mt-12 mb-16">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 border-r-4 border-emerald-500 pr-3 text-right">
              أهداف أخرى قد تعجبك
            </h2>
            <div className="videos-grid-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedVideos.map((item, idx) => (
                <div key={idx} className="video-card-premium cursor-pointer" onClick={() => handleVideoClick(item)}>
                  <div className="video-thumbnail-wrapper relative aspect-video rounded-xl overflow-hidden group">
                    <img src={item.thumbnailUrl || 'https://via.placeholder.com/720x400.png?text=Goals'} alt={item.title} className="thumbnail-img w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="play-overlay absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                      <PlayCircle size={48} className="play-icon text-emerald-500" />
                    </div>
                    <span className="competition-badge absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded font-medium">
                      أهداف
                    </span> 
                  </div>
                  <div className="video-card-info p-3">
                    <h3 className="video-match-title text-zinc-200 text-sm md:text-base font-semibold line-clamp-2 text-right group-hover:text-emerald-400 transition">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 📢 إعلان أسفل صفحة تفاصيل الفيديو */}
        <AdSlot ad={bottomAd} />
      </main>

      <Footer />
    </div>
  );
};

export default VideoDetails;
