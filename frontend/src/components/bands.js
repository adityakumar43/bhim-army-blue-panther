// Pages that open with the dark title band: [heading, optional intro line, optional inner width]
// The inner width matches the page's own container, so the band's title starts where the content does
export const BANDS = {
  '/about': ['about.title', null, 'max-w-4xl px-5 lg:px-16'],
  '/campaigns': ['sections.campaigns', 'home.campaignsIntro', 'max-w-6xl px-5 lg:px-10'],
  '/news': ['sections.news', 'home.newsIntro'],
  '/events': ['cal.title', 'cal.intro'],
  '/polls': ['poll.title', 'poll.intro'],
  '/gallery': ['nav.gallery'],
  '/contact': ['contact.title', null, 'max-w-6xl px-5 lg:px-10'],
  '/join': ['join.title', 'join.intro'],
  '/donate': ['donate.title', 'donate.intro'],
  '/leadership/states': ['leaders.statesTitle', 'leaders.statesIntro'],
  '/inspirations': ['inspire.title', 'inspire.intro'],
  '/membership/status': ['status.title', 'status.intro'],
  '/leaderboard': ['board.title', 'board.intro'],
  '/samvidhan': ['samvidhan.title', 'samvidhan.intro'],
  '/help': ['help.title', 'help.intro'],
  '/volunteer': ['vol.title', 'vol.intro'],
  '/downloads': ['dl.title', 'dl.intro'],
  '/videos': ['videos.title', 'videos.intro'],
  '/privacy': ['privacy.title', 'privacy.intro'],
}

// Pages with a band get the light grey background. Each state's page draws its own band (with the state's name).
export const hasBand = (pathname) => Object.hasOwn(BANDS, pathname) || pathname.startsWith('/leadership/states/') || pathname.startsWith('/inspirations/')
    || pathname.startsWith('/news/') || pathname.startsWith('/events/') // one news item or event: a white card on the grey background
