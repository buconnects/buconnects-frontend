import { ArrowRight, CalendarDays, Home, Megaphone, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const communityFeatures = [
  {
    icon: Megaphone,
    title: 'Campus updates',
    description: 'Keep up with announcements and news shared across the Busitema community.',
  },
  {
    icon: CalendarDays,
    title: 'Student events',
    description: 'Discover campus activities, workshops, and events in one place.',
  },
  {
    icon: Home,
    title: 'Accommodation',
    description: 'Browse student hostel and accommodation listings around campus.',
  },
  {
    icon: ShoppingBag,
    title: 'Student marketplace',
    description: 'Find and share items with other students in the campus community.',
  },
  {
    icon: MessageCircle,
    title: 'Connect with students',
    description: 'Meet fellow students and continue conversations through private chat.',
  },
];

const campuses = [
  'Busitema',
  'Nagongera',
  'Mbale',
  'Arapai',
  'Namasagali',
  'Pallisa',
  'Kaliro',
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="buCONNECTS home">
          <img src="/bu-CONNECTS-logo.png" alt="buCONNECTS" />
        </Link>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#community">Community</a>
          <a href="#campuses">Campuses</a>
          <Link className="landing-nav-login" to="/login">Sign in</Link>
          <Link className="landing-nav-join" to="/register">
            Join buCONNECTS <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-content">
            <p className="landing-eyebrow">The Busitema University student community</p>
            <h1 id="landing-title">Your campus community, all in one place.</h1>
            <p className="landing-hero-description">
              Find campus updates and events, explore student accommodation and marketplace
              listings, and connect with fellow students across Busitema University.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-button landing-button-primary" to="/register">
                Join the community <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="landing-button landing-button-secondary" to="/login">
                I already have an account
              </Link>
            </div>
            <p className="landing-hero-note">Built for students across Busitema University campuses.</p>
          </div>
          <div className="landing-hero-art" aria-hidden="true">
            <div className="landing-art-orbit landing-art-orbit-outer" />
            <div className="landing-art-orbit landing-art-orbit-inner" />
            <div className="landing-art-card landing-art-card-top">
              <Megaphone size={20} />
              <span>Campus updates</span>
            </div>
            <div className="landing-art-logo">
              <img src="/bu-CONNECTS-logo.png" alt="" />
            </div>
            <div className="landing-art-card landing-art-card-bottom">
              <MessageCircle size={20} />
              <span>Student connections</span>
            </div>
          </div>
        </section>

        <section className="landing-community" id="community" aria-labelledby="community-title">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Made for campus life</p>
            <h2 id="community-title">Everything you need to stay connected</h2>
            <p>
              buCONNECTS brings useful student resources and campus conversations together
              in one online community.
            </p>
          </div>
          <div className="landing-feature-grid">
            {communityFeatures.map(({ icon: Icon, title, description }) => (
              <article className="landing-feature-card" key={title}>
                <span className="landing-feature-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-campuses" id="campuses" aria-labelledby="campuses-title">
          <div>
            <p className="landing-eyebrow">One university, many campuses</p>
            <h2 id="campuses-title">Connect across Busitema University</h2>
            <p>
              Join students and keep up with campus life at Busitema, Nagongera, Mbale,
              Arapai, Namasagali, Pallisa, and Kaliro.
            </p>
          </div>
          <ul className="landing-campus-list" aria-label="Busitema University campuses">
            {campuses.map((campus) => <li key={campus}>{campus}</li>)}
          </ul>
        </section>

        <section className="landing-cta" aria-labelledby="join-title">
          <div>
            <p className="landing-eyebrow">Your campus community is here</p>
            <h2 id="join-title">Make more of student life.</h2>
            <p>Create an account to explore buCONNECTS and connect with fellow students.</p>
          </div>
          <Link className="landing-button landing-button-primary" to="/register">
            Get started <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="landing-brand" to="/" aria-label="buCONNECTS home">
          <img src="/bu-CONNECTS-logo.png" alt="buCONNECTS" />
        </Link>
        <p>Connecting the Busitema University student community.</p>
        <div>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create an account</Link>
        </div>
      </footer>
    </div>
  );
}
