import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import PageBand, { hasBand } from './components/PageBand.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RouteSeo from './components/Seo.jsx'
import InstallApp from './components/InstallApp.jsx'
import { NotifyPrompt } from './components/Notify.jsx'
import Home from './pages/Home.jsx'
import SessionWatch from './pages/admin/SessionWatch.jsx'
import Perm from './pages/admin/Perm.jsx'
import Loading from './components/Loading.jsx'


// Pages other than Home load only when someone opens them, so the first visit downloads much less.
// After a new version is put online, a page left open may ask for a file that no longer exists:
// then reload once to get the new version (the flag stops it reloading again and again).
const page = (load) => lazy(() => load().then((m) => { try { sessionStorage.removeItem('chunk-reload') } catch { /* ignore */ } return m }).catch((err) => {
  let reloaded = false
  try { reloaded = sessionStorage.getItem('chunk-reload') === '1'; sessionStorage.setItem('chunk-reload', '1') } catch { /* ignore */ }
  if (!reloaded) { window.location.reload(); return new Promise(() => { }) }
  throw err
}))
const News = page(() => import('./pages/News.jsx'))
const Detail = page(() => import('./pages/Detail.jsx'))
const Certificate = page(() => import('./pages/Certificate.jsx'))
const Certificates = page(() => import('./pages/admin/Certificates.jsx'))
const Gallery = page(() => import('./pages/Gallery.jsx'))
const Join = page(() => import('./pages/Join.jsx'))
const About = page(() => import('./pages/About.jsx'))
const StatesList = page(() => import('./pages/StatesList.jsx'))
const StateLeaders = page(() => import('./pages/StateLeaders.jsx'))
const Inspirations = page(() => import('./pages/Inspirations.jsx'))
const Inspiration = page(() => import('./pages/Inspiration.jsx'))
const Campaigns = page(() => import('./pages/Campaigns.jsx'))
const Contact = page(() => import('./pages/Contact.jsx'))
const Donate = page(() => import('./pages/Donate.jsx'))
const Receipt = page(() => import('./pages/Receipt.jsx'))
const Card = page(() => import('./pages/Card.jsx'))
const Login = page(() => import('./pages/admin/Login.jsx'))
const AdminLayout = page(() => import('./pages/admin/AdminLayout.jsx'))
const Overview = page(() => import('./pages/admin/Overview.jsx'))
const Content = page(() => import('./pages/admin/Content.jsx'))
const Members = page(() => import('./pages/admin/Members.jsx'))
const Messages = page(() => import('./pages/admin/Messages.jsx'))
const Donations = page(() => import('./pages/admin/Donations.jsx'))
const Team = page(() => import('./pages/admin/Team.jsx'))
const Leaders = page(() => import('./pages/admin/Leaders.jsx'))
const Updates = page(() => import('./pages/admin/Updates.jsx'))
const Security = page(() => import('./pages/admin/Security.jsx'))
const Activity = page(() => import('./pages/admin/Activity.jsx'))
const Backup = page(() => import('./pages/admin/Backup.jsx'))
const MemberStatus = page(() => import('./pages/MemberStatus.jsx'))
const HelpDesk = page(() => import('./pages/HelpDesk.jsx'))
const HelpDeskAdmin = page(() => import('./pages/admin/HelpDeskAdmin.jsx'))
const Volunteer = page(() => import('./pages/Volunteer.jsx'))
const Volunteers = page(() => import('./pages/admin/Volunteers.jsx'))
const Downloads = page(() => import('./pages/Downloads.jsx'))
const DownloadsAdmin = page(() => import('./pages/admin/DownloadsAdmin.jsx'))
const Videos = page(() => import('./pages/Videos.jsx'))
const VideosAdmin = page(() => import('./pages/admin/VideosAdmin.jsx'))
const Privacy = page(() => import('./pages/Privacy.jsx'))
const Unsubscribe = page(() => import('./pages/Unsubscribe.jsx'))
const Mailouts = page(() => import('./pages/admin/Mailouts.jsx'))
const Growth = page(() => import('./pages/admin/Growth.jsx'))
const Notifications = page(() => import('./pages/admin/Notifications.jsx'))
const UpdateDetails = page(() => import('./pages/UpdateDetails.jsx'))

export default function App() {

  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      <RouteSeo />
      {!isAdmin && <Navbar />}
      <main className={hasBand(pathname) ? 'bg-[#f3f6fb]' : undefined}>
        {!isAdmin && <PageBand />}
        <Suspense fallback={<Loading page />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<Detail kind="news" />} />
            <Route path="/events/:id" element={<Detail kind="events" />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/join" element={<Join />} />
            <Route path="/about" element={<About />} />
            <Route path="/leadership/states" element={<StatesList />} />
            <Route path="/leadership/states/:code" element={<StateLeaders />} />
            <Route path="/inspirations" element={<Inspirations />} />
            <Route path="/inspirations/:slug" element={<Inspiration />} />
            <Route path="/membership/status" element={<MemberStatus />} />
            <Route path="/membership/update" element={<UpdateDetails />} />
            <Route path="/help" element={<HelpDesk />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/receipt/:token" element={<Receipt />} />
            <Route path="/card/:token" element={<Card />} />
            <Route path="/certificate/:token" element={<Certificate />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/unsubscribe/:token" element={<Unsubscribe />} />

            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><SessionWatch /><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="news" element={<Perm perm="content"><Content key="news" kind="news" /></Perm>} />
              <Route path="events" element={<Perm perm="content"><Content key="events" kind="events" /></Perm>} />
              <Route path="gallery" element={<Perm perm="content"><Content key="gallery" kind="gallery" /></Perm>} />
              <Route path="slides" element={<Perm perm="content"><Content key="slides" kind="slides" /></Perm>} />
              <Route path="leaders" element={<Perm perm="leaders"><Leaders /></Perm>} />
              <Route path="updates" element={<Perm perm="content"><Updates /></Perm>} />
              <Route path="members" element={<Perm perm={['members', 'district']}><Members /></Perm>} />
              <Route path="videos" element={<Perm perm="content"><VideosAdmin /></Perm>} />
              <Route path="downloads" element={<Perm perm="content"><DownloadsAdmin /></Perm>} />
              <Route path="volunteers" element={<Perm perm={['members', 'district']}><Volunteers /></Perm>} />
              <Route path="certificates" element={<Perm perm="members"><Certificates /></Perm>} />
              <Route path="helpdesk" element={<Perm perm={['helpdesk', 'district']}><HelpDeskAdmin /></Perm>} />
              <Route path="messages" element={<Perm perm="messages"><Messages /></Perm>} />
              <Route path="donations" element={<Perm perm="donations"><Donations /></Perm>} />
              <Route path="team" element={<Perm perm="team"><Team /></Perm>} />
              <Route path="activity" element={<Perm perm="admins"><Activity /></Perm>} />
              <Route path="backup" element={<Perm perm="admins"><Backup /></Perm>} />
              <Route path="mailouts" element={<Perm perm="members"><Mailouts /></Perm>} />
              <Route path="growth" element={<Perm perm="members"><Growth /></Perm>} />
              <Route path="notifications" element={<Perm perm="content"><Notifications /></Perm>} />
              <Route path="security" element={<Security />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <InstallApp />}
      {!isAdmin && <NotifyPrompt />}
    </>
  )
}
