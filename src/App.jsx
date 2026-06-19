import { Routes, Route } from "react-router-dom";

// الصفحات الأساسية
import Home from "./pages/home/Home";
import CompetitionPage from "./pages/competitionpage/CompetitionPage";

// الدوريات
import Leagues from "./pages/leagues/Leagues";
import LeagueDetails from "./pages/leaguedetails/LeagueDetails";

// الفرق
import Teams from "./pages/teams/Teams";
import TeamDetails from "./pages/teamdetails/TeamDetails";

// اللاعبين
import Players from "./pages/players/Players";
import PlayerDetails from "./pages/playerdetails/PlayerDetails";

// المباريات
import Matches from "./pages/matches/Matches";
import MatchDetails from "./pages/matchdetails/MatchDetails"; // 👈 تمت الإضافة

// الأخبار
import News from "./pages/news/News";
import NewsDetails from "./pages/newsdetails/NewsDetails"; // 👈 تمت الإضافة

// الإحصائيات (إن قمت بإنشاء صفحة مجمعة لها)
import Videos from "./pages/videos/Videos"; // 👈 تمت الإضافة
import About from "./pages/staticpages/About";
import Contact from "./pages/staticpages/Contact";
import Privacy from "./pages/staticpages/Privacy";
import Terms from "./pages/staticpages/Terms";
import StandingsPage from "./pages/standings/StandingsPage"; // 👈 تمت 
import Stats from "./pages/standings/Stats"; // 👈 تمت الإضافة
function App() {
  return (
    <Routes>
      {/* الصفحة الرئيسية */}
      <Route path="/" element={<Home />} />

      {/* البطولات */}

      {/* الدوريات */}
      <Route path="/leagues" element={<Leagues />} />
<Route
  path="/league/:id/:season"
  element={<LeagueDetails />}
/>
      {/* الفرق */}
      <Route path="/teams" element={<Teams />} />
      <Route path="/teams/:id" element={<TeamDetails />} />

      {/* اللاعبين */}
      <Route path="/players" element={<Players />} />
      <Route path="/players/:id" element={<PlayerDetails />} />

      {/* المباريات تفصيلياً */}
      <Route path="/matches" element={<Matches />} />
<Route path="/match/:id" element={<MatchDetails />} />      {/* الأخبار تفصيلياً */}
      <Route path="/news" element={<News />} />
<Route path="/news/:id" element={<NewsDetails />} />      {/* الإحصائيات */}
      
      <Route path="/videos" element={<Videos />} />
      <Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
<Route path="/standings" element={<StandingsPage />} />
<Route path="/stats" element={<Stats />} />
    </Routes>
  );
}

export default App;