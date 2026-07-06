import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PlayCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './VideoDetails.css'; 

const API_BASE_URL = 'https://api.algrinta.com/api';

const VideoDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(location.state?.video || null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(!video);

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

        // إذا لم تكن الداتا ممررة عبر الـ State، نقوم بالبحث عنها بالـ id
        if (!video) {
          const currentVideo = 
            highlightsList.find(item => String(item.id) === String(id)) || 
            goalsList.find(item => String(item.id) === String(id));
          
          if (currentVideo) {
            setVideo(currentVideo.channel ? { ...currentVideo, platform: 'Dailymotion', thumbnailUrl: currentVideo.imgUrl } : currentVideo);
          }
        }

        // 👈 رابعاً: جعل الـ 6 فيديوهات المقترحة في الأسفل من فيديوهات الأهداف فقط واستبعاد الملخصات
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
    // 👈 ثانياً وثالثاً: تعديل الحاويات وتنسيق الخطوط ليأخذ المشغل 100% من عرض الموقع
    <div className="bg-zinc-950 min-h-screen text-zinc-100" style={{ direction: 'rtl' }}>
      <Navbar />
      
      {/* مشغل الفيديو بكامل عرض الموقع */}
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

      {/* تفاصيل وعنوان الفيديو المقسمة بشكل مريح للعين */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-10 border-b border-zinc-800/60 pb-6">
          {/* 👈 ثالثاً: تنسيق العنوان ليكون باللون الأبيض، حجم رائع، متناسق وغير متداخل */}
          <h1 className="video-title-premium ">
            {video.title}
          </h1>
          {video.description && (
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed text-right mt-2 max-w-3xl">
              {video.description}
            </p>
          )}
        </div>

        {/* عرض الفيديوهات الـ 6 المقترحة من الأهداف فقط */}
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
      </main>

      <Footer />
    </div>
  );
};

export default VideoDetails;
