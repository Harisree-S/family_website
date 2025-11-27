import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Play } from 'lucide-react';
import clickAudio from '../assets/audio/click.mp3';
import { useAudio } from './AudioController';

const MediaItem = ({ item, type, onClick, onEdit, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const { playSfx } = useAudio();

    // Helper to safely optimize Cloudinary URLs
    const getOptimizedUrl = (url, isVideo = false) => {
        if (!url) return '';
        if (!url.includes('cloudinary.com')) return url;
        // Check if already transformed
        if (url.includes('f_auto,q_auto')) return url;
        // Inject transformation
        return url.replace('/upload/', '/upload/f_auto,q_auto/');
    };

    // Helper for video poster
    const getVideoPoster = (url) => {
        if (!url) return null;
        if (item.thumbnail) return item.thumbnail;
        if (url.includes('cloudinary.com')) {
            // Force jpg extension for poster
            return url.replace(/\.[^/.]+$/, ".jpg").replace('/upload/', '/upload/so_0/'); // so_0 = start offset 0 (first frame)
        }
        return null;
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = (e) => {
        console.error(`Failed to load ${type}:`, item.url);
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <motion.div
            layout
            animate={{
                scale: isHovered ? 1.03 : 1,
                y: isHovered ? -5 : 0
            }}
            onHoverStart={() => !window.matchMedia("(pointer: coarse)").matches && setIsHovered(true)}
            onHoverEnd={() => !window.matchMedia("(pointer: coarse)").matches && setIsHovered(false)}
            onClick={() => {
                const isTouch = window.matchMedia("(pointer: coarse)").matches;
                if (isTouch && !isHovered) {
                    setIsHovered(true);
                } else {
                    playSfx(clickAudio);
                    onClick && onClick(item);
                }
            }}
            style={styles.container}
        >
            <div style={styles.mediaWrapper}>
                {type === 'video' ? (
                    <>
                        <video
                            src={item.url}
                            style={styles.media}
                            muted
                            playsInline
                            controls={false}
                        />
                        <div style={styles.playOverlay}>
                            <Play size={40} fill="rgba(255,255,255,0.8)" color="transparent" />
                        </div>
                    </>
                ) : (
                    <img
                        src={item.url}
                        alt={item.caption}
                        style={{
                            ...styles.media,
                            objectPosition: item.position || '50% 20%',
                            transform: item.scale ? `scale(${item.scale})` : 'scale(1)',
                        }}
                    />
                )}

                {/* Gradient Overlay */}
                <div style={styles.overlay} />

                {/* Hover Glow */}
                <motion.div
                    style={styles.glowOverlay}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <div style={styles.footer}>
                <motion.div
                    style={styles.captionContainer}
                    animate={{
                        x: isHovered ? -20 : 0,
                        paddingRight: isHovered ? '60px' : '0px'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <span style={styles.caption}>{item.caption}</span>
                </motion.div>

                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            style={styles.actions}
                        >
                            <motion.button
                                whileHover={{ scale: 1.2, color: '#d4af37' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onEdit(e, item); }}
                                style={styles.actionBtn}
                                title="Edit Caption"
                            >
                                <Edit2 size={16} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.2, color: '#ff4444' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onDelete(e, item); }}
                                style={{ ...styles.actionBtn, color: '#ff6b6b' }}
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const styles = {
    container: {
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        aspectRatio: '4/5', // Standardize aspect ratio for grid
        display: 'flex',
        flexDirection: 'column',
    },
    mediaWrapper: {
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
    },
    media: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.5s ease',
    },
    playOverlay: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '50%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
    },
    glowOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // Center caption by default
        zIndex: 10,
    },
    captionContainer: {
        width: '100%',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    caption: {
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '500',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        fontFamily: 'Outfit, sans-serif',
    },
    actions: {
        position: 'absolute',
        right: '1rem',
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        padding: '0.4rem',
        borderRadius: '20px',
    },
    actionBtn: {
        background: 'none',
        border: 'none',
        color: '#ccc',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loader: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        zIndex: 2,
    },
    errorState: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        gap: '0.5rem',
        zIndex: 2,
    }
};

// Add global style for spinner if not present
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(212, 175, 55, 0.3);
  border-top: 3px solid #d4af37;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
`;
document.head.appendChild(styleSheet);

export default MediaItem;
