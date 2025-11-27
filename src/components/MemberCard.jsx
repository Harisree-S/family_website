import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { getCoverOverride } from '../utils/mediaStore';
import clickAudio from '../assets/audio/click.mp3';
import { useAudio } from './AudioController';

const MemberCard = ({ member }) => {
    const ref = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [coverOverride, setCoverOverride] = useState(null);
    const { playSfx } = useAudio();

    // Magnetic Effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7]);

    useEffect(() => {
        getCoverOverride(member.id, 'member').then(cover => {
            if (cover) setCoverOverride(cover);
        });
    }, [member.id]);

    const handleMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXPos = e.clientX - rect.left;
        const mouseYPos = e.clientY - rect.top;
        const xPct = mouseXPos / width - 0.5;
        const yPct = mouseYPos / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    };

    const displayImage = coverOverride ? coverOverride.url : member.photo;
    const displayStyle = coverOverride ? {
        objectPosition: coverOverride.position,
        transform: `scale(${coverOverride.scale})`
    } : {
        objectPosition: member.imagePosition || 'center',
        transform: 'scale(1)'
    };

    return (
        <Link
            to={`/member/${member.id}`}
            style={{ textDecoration: 'none', perspective: 1000 }}
            onClick={(e) => {
                const isTouch = window.matchMedia("(pointer: coarse)").matches;
                if (isTouch && !isHovered) {
                    e.preventDefault();
                    setIsHovered(true);
                } else {
                    playSfx(clickAudio);
                }
            }}
        >
            <motion.div
                ref={ref}
                style={{
                    ...styles.card,
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={() => setIsHovered(true)}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div style={styles.innerCard}>
                    <div style={styles.imageContainer}>
                        <motion.img
                            src={displayImage}
                            alt={member.name}
                            style={{
                                ...styles.image,
                                ...displayStyle,
                            }}
                            animate={{
                                scale: isHovered ? 1.1 : 1,
                                filter: isHovered ? 'contrast(1.2) saturate(1.2) brightness(1.1)' : 'contrast(1) saturate(1)'
                            }}
                            transition={{ duration: 0.6 }}
                        />
                        <motion.div
                            style={styles.glowOverlay}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                        />
                        <div style={styles.overlay} />
                        <div style={styles.reflection} />
                    </div>

                    <motion.div
                        style={styles.info}
                        animate={{
                            y: isHovered ? 0 : 10,
                            opacity: isHovered ? 1 : 0.8
                        }}
                    >
                        <h2 style={styles.name}>{member.name}</h2>
                        <motion.p
                            style={styles.relation}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{
                                opacity: isHovered ? 1 : 0,
                                height: isHovered ? 'auto' : 0
                            }}
                        >
                            {member.relation}
                        </motion.p>
                        <motion.div
                            style={styles.line}
                            animate={{ width: isHovered ? '50px' : '0px' }}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </Link>
    );
};

const styles = {
    card: {
        position: 'relative',
        height: '450px',
        width: '100%',
        cursor: 'pointer',
    },
    innerCard: {
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#111',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        transform: 'translateZ(0)', // Hardware acceleration
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    overlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
        pointerEvents: 'none',
    },
    reflection: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)',
        pointerEvents: 'none',
    },
    glowOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 2,
    },
    info: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 2,
        transform: 'translateZ(20px)', // Lift text off the card
    },
    name: {
        fontSize: '2rem',
        color: '#fff',
        fontFamily: "'Cormorant Garamond', serif",
        margin: 0,
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        fontWeight: 600,
        letterSpacing: '0.02em',
    },
    relation: {
        fontSize: '0.9rem',
        color: '#d4af37',
        fontFamily: "'Outfit', sans-serif",
        marginTop: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
    },
    line: {
        height: '1px',
        background: '#d4af37',
        marginTop: '1rem',
    }
};

export default MemberCard;
