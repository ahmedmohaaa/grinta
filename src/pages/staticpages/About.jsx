import React from 'react';
import { Info } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import './StaticPages.css';

const About = () => {
  return (
    <div className="static-page-layout">
      <Navbar />
      
      <header className="static-hero animate-fade-in">
        <div className="static-hero-icon"><Info size={40} /></div>
        <h1>من نحن</h1>
        <p>تعرف على قصة منصة الجرينتا والهدف الذي نسعى لتحقيقه من أجل عشاق كرة القدم.</p>
      </header>

      <main className="static-content-wrapper animate-slide-up">
        <div className="prose-text">
          <h2>مرحباً بك في الجرينتا</h2>
          <p>
            الجرينتا ليست مجرد منصة رياضية، بل هي الملعب الرقمي المتكامل لكل عاشق لكرة القدم. 
            تأسست المنصة لتلبية احتياجات المشجع العربي الذي يبحث عن دقة المعلومات، وسرعة نقل الأحداث، 
            والتغطية الشاملة للبطولات المحلية والعالمية.
          </p>

          <h2>رؤيتنا</h2>
          <p>
            أن نكون المصدر الأول والموثوق عربياً للأرقام، الإحصائيات، والتحليلات الرياضية. نحن نؤمن بأن كرة القدم 
            هي لغة عالمية، وهدفنا هو تقديم محتوى يضاهي جودة المنصات العالمية ولكن بصبغة تناسب شغف المشجع العربي.
          </p>

          <h2>ماذا نقدم؟</h2>
          <ul>
            <li>تغطية حية ومباشرة لنتائج المباريات فور حدوثها.</li>
            <li>إحصائيات دقيقة وشاملة للفرق واللاعبين في مختلف الدوريات.</li>
            <li>أحدث الأخبار والتقارير الرياضية الحصرية.</li>
            <li>مكتبة متكاملة لملخصات وأهداف المباريات.</li>
          </ul>

          <h2>فريق العمل</h2>
          <p>
            يقف خلف الجرينتا فريق من المطورين والمحللين وعشاق الرياضة الذين يعملون على مدار الساعة 
            لضمان تقديم أفضل تجربة مستخدم خالية من التعقيد وسريعة الاستجابة.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;