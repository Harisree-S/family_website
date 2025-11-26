import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import heroBg from '../assets/hero-bg.jpg';
import { ChevronDown } from 'lucide-react';

const Hero = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [hasPlayed, setHasPlayed] = useState(false);

    // 3D Tilt Effects
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [5, -5]);
    const rotateY = useTransform(x, [-100, 100], [-5, 5]);

    // Parallax Effects
    const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const scaleImg = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
    const yText = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
    const smoothYText = useSpring(yText, { stiffness: 100, damping: 20 });
    const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.5
            }
        }
    };

    const letterVariants = {
        hidden: { y: 50, opacity: 0, rotateX: -90 },
        visible: {
            y: 0,
            opacity: 1,
            rotateX: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100
            }
        }
    };

    // Mobile Auto-Tilt
    useEffect(() => {
        if (isMobile) {
            const animate = () => {
                const time = Date.now() / 1000;
                rotateX.set(Math.sin(time) * 5);
                rotateY.set(Math.cos(time * 0.8) * 5);
                requestAnimationFrame(animate);
            };
            const animationId = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationId);
        }
    }, [isMobile, rotateX, rotateY]);

    const handleMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 200);
        y.set(yPct * 200);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const played = sessionStorage.getItem('hero_played');
        if (played) {
            setHasPlayed(true);
        } else {
            sessionStorage.setItem('hero_played', 'true');
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const styles = getStyles(isMobile);

    return (
        <section
            ref={ref}
            style={styles.hero}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Cinematic Background Layer */}
            <motion.div style={{ ...styles.bgLayer, y: yBg, scale: scaleImg }}>
                <div style={styles.blurredBg} />
                <div style={styles.vignette} />
                <div style={styles.noise} />
            </motion.div>

            <div style={styles.container}>
                {/* 3D Image Section */}
                <div style={styles.imageSection}>
                    <motion.div
                        style={{
                            ...styles.imageContainer,
                            rotateX: rotateX, // Always use the value (driven by mouse or auto)
                            rotateY: rotateY,
                            perspective: 1000
                        }}
                        initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        <img
                            src={heroBg}
                            alt="Family"
                            style={styles.mainImage}
                        />
                        <div style={styles.imageGlow} />
                        <div style={styles.reflection} />
                    </motion.div>
                </div>

                {/* Cinematic Title Section */}
                <motion.div
                    style={{
                        ...styles.subtitleSection,
                        y: isMobile ? 0 : smoothYText,
                        opacity: opacityText
                    }}
                    variants={containerVariants}
                    initial={hasPlayed ? "visible" : "hidden"}
                    animate="visible"
                >
                    <div style={styles.subtitleWrapper}>
                        <div style={styles.line} />
                        <h2 style={styles.subtitle}>
                            {"Celebrating Love, Family, and Togetherness".split(" ").map((word, index) => (
                                <motion.span key={index} variants={letterVariants} style={{ display: 'inline-block' }}>
                                    {word}
                                </motion.span>
                            ))}
                        </h2>
                        <div style={styles.line} />
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ delay: 2, duration: 2, repeat: Infinity }}
                style={styles.scrollIndicator}
            >
                <ChevronDown color="#d4af37" size={32} />
            </motion.div>
        </section>
    );
};

function getStyles(isMobile) {
    return {
        hero: {
            height: '100vh',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#030305',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '2000px'
        },
        bgLayer: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '120%',
            zIndex: 0,
        },
        blurredBg: {
            width: '100%',
            height: '100%',
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.3) saturate(1.2)',
        },
        vignette: {
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 0%, #030305 90%)',
        },
        noise: {
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        },
        container: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            maxWidth: '1600px',
            margin: '0 auto',
            zIndex: 10,
            position: 'relative',
            padding: isMobile ? '2rem 1rem' : '4rem 2rem',
            justifyContent: 'center',
            alignItems: 'center',
        },
        imageSection: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            perspective: '1000px',
        },
        imageContainer: {
            position: 'relative',
            width: '100%',
            height: '100%',
            maxWidth: isMobile ? '100%' : '1100px',
            maxHeight: isMobile ? '45vh' : '65vh', // Reduced height on mobile
            borderRadius: '20px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(212, 175, 55, 0.1)',
            transformStyle: 'preserve-3d',
        },
        mainImage: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'contrast(1.1) saturate(1.1)',
            borderRadius: '20px',
        },
        imageGlow: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(3,3,5,0.4) 100%)',
            pointerEvents: 'none',
            borderRadius: '20px',
        },
        reflection: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 100%)',
            pointerEvents: 'none',
            borderRadius: '20px 20px 0 0',
        },
        subtitleSection: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: isMobile ? '2rem' : '3rem',
            marginBottom: isMobile ? '2rem' : '2rem',
            zIndex: 20,
            padding: isMobile ? '0 1rem' : '0', // Add padding on mobile
        },
        subtitleWrapper: {
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            width: '100%',
            justifyContent: 'center',
        },
        subtitle: {
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? '1.5rem' : '1.8rem',
            letterSpacing: isMobile ? '0.05em' : '0.2em',
            color: '#d4af37',
            textTransform: 'uppercase',
            margin: '0 10px',
            textAlign: 'center',
            fontWeight: 400,
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            maxWidth: '100%',
            lineHeight: 1.4,
            display: 'flex',
            flexWrap: 'wrap', // Ensure wrapping
            justifyContent: 'center',
            gap: isMobile ? '0.5rem' : '0.8rem', // Gap between words
        },
        line: {
            height: '1px',
            width: isMobile ? '40px' : '120px', // Shorter lines on mobile
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
            opacity: 0.8,
            flexShrink: 0, // Prevent line from disappearing
        },
        scrollIndicator: {
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            translateX: '-50%',
            zIndex: 20,
            cursor: 'pointer',
        }
    };
}

export default Hero;
