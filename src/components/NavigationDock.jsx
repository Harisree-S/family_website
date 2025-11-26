import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Grid, ArrowLeft } from 'lucide-react';

const NavigationDock = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
            style={styles.dockContainer}
        >
            <div style={styles.dock} className="glass-panel">
                {!isHome && (
                    <Link to="/" style={styles.iconLink} title="Back">
                        <ArrowLeft size={24} color="#fff" />
                    </Link>
                )}

                <Link to="/" style={styles.iconLink} title="Home">
                    <Home size={24} color={isHome ? "#d4af37" : "#fff"} />
                </Link>

                {/* Placeholder for future gallery route or scroll to grid */}
                <div style={{ ...styles.iconLink, opacity: 0.5, cursor: 'not-allowed' }} title="Gallery (Coming Soon)">
                    <Grid size={24} color="#fff" />
                </div>
            </div>
        </motion.div>
    );
};

const styles = {
    dockContainer: {
        position: 'fixed',
        bottom: 'max(2rem, env(safe-area-inset-bottom) + 1rem)',
        left: '50%',
        // transform: 'translateX(-50%)', // Handled by framer-motion
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
    },
    dock: {
        display: 'flex',
        gap: '2rem',
        padding: '1rem 2rem',
        borderRadius: '50px',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    },
    iconLink: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
        cursor: 'pointer',
    }
};

export default NavigationDock;
