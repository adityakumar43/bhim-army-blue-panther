import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import News from './pages/News.jsx'
import Gallery from './pages/Gallery.jsx'
import Join from './pages/Join.jsx'
import About from './pages/About.jsx'
import Campaigns from './pages/Campaigns.jsx'
import Contact from './pages/Contact.jsx'
import Donate from './pages/Donate.jsx'
import Receipt from './pages/Receipt.jsx'
import Card from './pages/Card.jsx'
import Login from './pages/admin/Login.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Perm from './pages/admin/Perm.jsx'
import Overview from './pages/admin/Overview.jsx'
import Content from './pages/admin/Content.jsx'
import Members from './pages/admin/Members.jsx'
import Messages from './pages/admin/Messages.jsx'
import Donations from './pages/admin/Donations.jsx'
import Team from './pages/admin/Team.jsx'
import Security from './pages/admin/Security.jsx'

export default function App() {
  
  const isAdmin = useLocation().pathname.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/join" element={<Join />} />
          <Route path="/about" element={<About />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/receipt/:token" element={<Receipt />} />
          <Route path="/card/:token" element={<Card />} />

          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="news" element={<Perm perm="content"><Content key="news" kind="news" /></Perm>} />
            <Route path="events" element={<Perm perm="content"><Content key="events" kind="events" /></Perm>} />
            <Route path="gallery" element={<Perm perm="content"><Content key="gallery" kind="gallery" /></Perm>} />
            <Route path="slides" element={<Perm perm="content"><Content key="slides" kind="slides" /></Perm>} />
            <Route path="members" element={<Perm perm="members"><Members /></Perm>} />
            <Route path="messages" element={<Perm perm="messages"><Messages /></Perm>} />
            <Route path="donations" element={<Perm perm="donations"><Donations /></Perm>} />
            <Route path="team" element={<Perm perm="admins"><Team /></Perm>} />
            <Route path="security" element={<Security />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}
