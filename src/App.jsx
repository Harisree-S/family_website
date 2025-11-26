import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Hero from './components/Hero';
import MemberCard from './components/MemberCard';
import EventsSection from './components/EventsSection';
import Gallery from './components/Gallery';
// Lazy load route components
const MemberDetails = lazy(() => import('./components/MemberDetails'));
const MemoryDetails = lazy(() => import('./components/MemoryDetails'));

import { familyMembers } from './data/familyData';
import { AnimatePresence } from 'framer-motion';

import ScrollToTop from './components/ScrollToTop';
import { AudioProvider } from './components/AudioController';
import CustomCursor from './components/CustomCursor';
import PageTransition from './components/PageTransition';
import Login from './components/Login';
import NavigationDock from './components/NavigationDock';
import BackgroundParticles from './components/BackgroundParticles';

const PASSWORD = "Shunnani@2025"; // Simple client-side password

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const auth = sessionStorage.getItem('is_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (password) => {
    if (password === PASSWORD) {
      sessionStorage.setItem('is_authenticated', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  if (!isAuthenticated) {
    return (
      <AudioProvider>
        <CustomCursor />
        <BackgroundParticles />
        <Login onLogin={handleLogin} />
      </AudioProvider>
    );
  }

  return (
    <AudioProvider>
      <CustomCursor />
      <BackgroundParticles />
      <ScrollToTop />
      <NavigationDock />
      <AnimatePresence mode="wait">
        <Suspense fallback={
          <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d4af37',
            backgroundColor: '#030305'
          }}>
            Loading...
          </div>
        }>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/member/:id" element={<MemberDetails />} />
            <Route path="/memory/:id" element={<MemoryDetails />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </AudioProvider>
  );
}

const Home = () => {
  const [opacity, setOpacity] = React.useState(0);

  React.useLayoutEffect(() => {
    // Small delay to allow scroll restoration to happen first
    const timer = setTimeout(() => setOpacity(1), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageTransition>
      <Hero />

      <section style={styles.membersSection}>
        <div className="container">
          <h2 className="section-title">The Family</h2>
          <div className="members-grid">
            {familyMembers.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
          </div>
        </div>
      </section>

      <EventsSection />

      <Gallery />

      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Lalitham Sundaram. All rights reserved.</p>
        <p style={styles.footerNote}>Made with love for the family.</p>
      </footer>
    </PageTransition>
  );
};


const styles = {
  membersSection: {
    padding: '5rem 0',
    // Removed background color to let particles show through
  },

  footer: {
    backgroundColor: 'rgba(0,0,0,0.8)', // Semi-transparent
    color: '#fff',
    textAlign: 'center',
    padding: '3rem 2rem',
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  },
  footerNote: {
    fontSize: '0.8rem',
    color: '#888',
    marginTop: '0.5rem',
    letterSpacing: '1px',
  }
};

export default App;
