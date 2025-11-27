import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Play, Image as ImageIcon } from 'lucide-react';
import { memories } from '../data/memoryData';
import ImageModal from './ImageModal';
import PageTransition from './PageTransition';
import UploadModal from './UploadModal';
import CaptionModal from './CaptionModal';
import ConfirmModal from './ConfirmModal';
import MediaItem from './MediaItem';
import { useAudio } from './AudioController';
import { showToast } from './Toast';
import {
    getMedia,
    saveMedia,
    deleteMedia,
    updateMedia,
    hideStaticMedia,
    getHiddenStaticMedia,
    updateStaticCaption,
    getStaticCaptionOverrides,
    saveCoverOverride,
    getCoverOverride,
    openCloudinaryWidget,
    subscribeToMedia
} from '../utils/mediaStore';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 50 }
    }
};

const MemoryDetails = () => {
    const { id } = useParams();
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [uploadedVideos, setUploadedVideos] = useState([]);
    const [hiddenMedia, setHiddenMedia] = useState([]);
    const [captionOverrides, setCaptionOverrides] = useState({});
    const [coverImage, setCoverImage] = useState(null);
    const [coverStyle, setCoverStyle] = useState({});

    // Modal State
    const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDangerous: false
    });

    const memory = memories.find(m => m.id === parseInt(id));
    const { playImageAudio, playSfx, clearImageAudio, setIsVideoPlaying } = useAudio();

    // Parallax Header
    const { scrollY } = useScroll();
    const yHeader = useTransform(scrollY, [0, 500], [0, 200]);
    const opacityHeader = useTransform(scrollY, [0, 400], [1, 0.3]);

    useEffect(() => {
        if (!memory) return;

        // Subscribe to memory media
        const unsubscribe = subscribeToMedia(memory.id, 'memory', (media) => {
            const photos = media.filter(m => m.type === 'image');
            const videos = media.filter(m => m.type === 'video');
            setUploadedPhotos(photos);
            setUploadedVideos(videos);
        });

        setHiddenMedia(getHiddenStaticMedia());
        setCaptionOverrides(getStaticCaptionOverrides());

        getCoverOverride(memory.id, 'memory').then(cover => {
            if (cover) {
                setCoverImage(cover.url);
                setCoverStyle({
                    objectPosition: cover.position,
                    transform: `scale(${cover.scale})`
                });
            } else {
                setCoverImage(memory.cover);
                setCoverStyle({
                    objectPosition: memory.coverPosition || 'center'
                });
            }
        });

        return () => unsubscribe();
    }, [memory]);



    const [uploadingType, setUploadingType] = useState(null); // 'photo' | 'video' | null

    useEffect(() => {
        if (memory && memory.entryAudio) {
            playImageAudio(memory.entryAudio, memory.audioVolume || 0.5, true);
        }
        return () => {
            clearImageAudio();
        };
    }, [memory, playImageAudio, clearImageAudio]);

    const handleUploadClick = (type) => {
        // Set loading state based on type
        setUploadingType(type);

        openCloudinaryWidget(
            async (result) => {
                try {
                    if (type === 'cover') {
                        // ... (cover logic removed)
                    } else {
                        // Optimistic UI Update
                        const newMedia = await saveMedia(memory.id, 'memory', result.type, result.url, result.storagePath);

                        if (result.type === 'video') {
                            setUploadedVideos(prev => [...prev, newMedia]);
                        } else {
                            setUploadedPhotos(prev => [...prev, newMedia]);
                        }

                        showToast('Uploaded successfully!', 'success');

                        // Open Caption Modal immediately
                        setEditingItem(newMedia);
                        setIsCaptionModalOpen(true);

                        // fetchMedia(); // Removed manual fetch, using subscription
                    }
                } catch (error) {
                    console.error(error);
                    showToast(`Upload failed: ${error.message}`, 'error');
                } finally {
                    setUploadingType(null);
                }
            },
            () => {
                // On Widget Close / Cancel
                setUploadingType(null);
            }
        );
    };

    const handleMediaClick = (item, type) => {
        setSelectedMedia({ ...item, type });
        if (item.audio) {
            playSfx(item.audio);
        }
        if (type === 'video') {
            setIsVideoPlaying(true);
        }
    };

    const handleCloseModal = () => {
        setSelectedMedia(null);
        setIsVideoPlaying(false);
    };

    const handleDelete = (e, item) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item? This action cannot be undone.',
            isDangerous: true,
            onConfirm: async () => {
                try {
                    if (item.id) {
                        await deleteMedia(item.id);
                    } else {
                        hideStaticMedia(item.url);
                        // For static media, we might need to force a re-render or update local state if not covered by subscription
                        setHiddenMedia(getHiddenStaticMedia());
                    }
                    // fetchMedia(); // Removed manual fetch
                    showToast('Item deleted successfully', 'success');
                } catch (error) {
                    console.error('Delete failed:', error);
                    showToast('Failed to delete item', 'error');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleEditClick = (e, item) => {
        setEditingItem(item);
        setIsCaptionModalOpen(true);
    };

    const handleSaveCaption = async (newCaption) => {
        if (!editingItem) return;
        try {
            if (editingItem.id) {
                await updateMedia(editingItem.id, { caption: newCaption });
            } else {
                updateStaticCaption(editingItem.url, newCaption);
                setCaptionOverrides(getStaticCaptionOverrides());
            }
            // fetchMedia(); // Removed manual fetch
            showToast('Caption updated successfully', 'success');
        } catch (error) {
            console.error('Update failed:', error);
            showToast('Failed to update caption', 'error');
        }
    };

    if (!memory) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Memory not found</div>;
    }

    const processMedia = (items) => {
        return items
            .filter(item => !hiddenMedia.includes(item.url))
            .map(item => ({
                ...item,
                caption: captionOverrides[item.url] || item.caption
            }));
    };

    const allPhotos = [...processMedia(memory.photos || []), ...uploadedPhotos];
    const allVideos = [...processMedia(memory.videos || []), ...uploadedVideos];

    return (
        <PageTransition>
            <div style={styles.page}>
                <ImageModal
                    isOpen={!!selectedMedia}
                    mediaSrc={selectedMedia?.url}
                    type={selectedMedia?.type}
                    caption={selectedMedia?.caption}
                    onClose={handleCloseModal}
                />

                <CaptionModal
                    isOpen={isCaptionModalOpen}
                    onClose={() => setIsCaptionModalOpen(false)}
                    onSave={handleSaveCaption}
                    initialCaption={editingItem?.caption}
                    title="Edit Caption"
                />

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    isDangerous={confirmModal.isDangerous}
                    confirmText="Delete"
                />

                <div className="container">
                    <Link to="/" style={styles.backLink}>
                        <ArrowLeft size={24} /> <span style={{ marginLeft: '0.5rem' }}>Back to Gallery</span>
                    </Link>

                    <div style={styles.header}>
                        {/* Immersive Cover Section */}
                        <motion.div
                            style={{ ...styles.coverSection, y: yHeader, opacity: opacityHeader }}
                        >
                            <div style={styles.coverImageWrapper}>
                                <img
                                    src={coverImage || memory.cover}
                                    alt={memory.title}
                                    style={{
                                        ...styles.coverImage,
                                        ...coverStyle
                                    }}
                                />
                                <div style={styles.coverOverlay} />

                            </div>
                        </motion.div>

                        {/* Glass Info Card */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            style={styles.infoCard}
                            className="glass-panel"
                        >
                            <h1 style={styles.title}>{memory.title}</h1>
                            <div style={styles.divider} />
                            <p style={styles.description}>{memory.description}</p>

                            <div style={styles.actionButtons}>
                                <button
                                    onClick={() => handleUploadClick('image')}
                                    style={styles.actionBtn}
                                    disabled={uploadingType !== null}
                                >
                                    {uploadingType === 'image' ? (
                                        <span className="loader" style={{ width: 16, height: 16, border: '2px solid #d4af37', borderBottomColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'rotation 1s linear infinite' }}></span>
                                    ) : (
                                        <ImageIcon size={18} />
                                    )}
                                    <span style={{ marginLeft: '0.5rem' }}>ADD PHOTO</span>
                                </button>
                                <button
                                    onClick={() => handleUploadClick('video')}
                                    style={styles.actionBtn}
                                    disabled={uploadingType !== null}
                                >
                                    {uploadingType === 'video' ? (
                                        <span className="loader" style={{ width: 16, height: 16, border: '2px solid #d4af37', borderBottomColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'rotation 1s linear infinite' }}></span>
                                    ) : (
                                        <Play size={18} />
                                    )}
                                    <span style={{ marginLeft: '0.5rem' }}>ADD VIDEO</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Photos Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        style={styles.section}
                    >
                        <h2 style={styles.sectionTitle}>
                            <span style={styles.titleIcon}><ImageIcon size={24} /></span>
                            Captured Moments
                        </h2>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            style={styles.grid}
                        >
                            {allPhotos.length > 0 ? allPhotos.map((item, index) => (
                                <motion.div key={index} variants={itemVariants}>
                                    <MediaItem
                                        item={item}
                                        type="image"
                                        onClick={(item) => handleMediaClick(item, 'image')}
                                        onEdit={handleEditClick}
                                        onDelete={handleDelete}
                                    />
                                </motion.div>
                            )) : (
                                <p style={styles.emptyText}>No photos yet.</p>
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Videos Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        style={styles.section}
                    >
                        <h2 style={styles.sectionTitle}>
                            <span style={styles.titleIcon}><Play size={24} /></span>
                            Video Memories
                        </h2>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            style={styles.grid}
                        >
                            {allVideos.length > 0 ? allVideos.map((item, index) => (
                                <motion.div key={index} variants={itemVariants}>
                                    <MediaItem
                                        item={item}
                                        type="video"
                                        onClick={(item) => handleMediaClick(item, 'video')}
                                        onEdit={handleEditClick}
                                        onDelete={handleDelete}
                                    />
                                </motion.div>
                            )) : (
                                <p style={styles.emptyText}>No videos yet.</p>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </div>
            {/* Temporary Debug Overlay */}
            <div style={{
                position: 'fixed',
                bottom: 10,
                right: 10,
                background: 'rgba(0,0,0,0.8)',
                color: '#0f0',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '12px',
                zIndex: 9999,
                pointerEvents: 'none'
            }}>
                <p>Memory ID: {memory?.id}</p>
                <p>Photos: {uploadedPhotos.length}</p>
                <p>Videos: {uploadedVideos.length}</p>
            </div>
        </PageTransition>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#030305',
        color: '#fff',
        padding: '2rem 0',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #030305 70%)',
    },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        color: '#d4af37',
        textDecoration: 'none',
        marginBottom: '3rem',
        fontSize: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        opacity: 0.8,
        transition: 'opacity 0.3s',
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3rem',
        marginBottom: '6rem',
        position: 'relative',
    },
    coverSection: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '1200px',
    },
    coverImageWrapper: {
        width: '100%',
        height: 'clamp(300px, 50vh, 500px)',
        borderRadius: '30px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: 'contrast(1.1) saturate(1.1)',
    },
    coverOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(3,3,5,0.5) 100%)',
        pointerEvents: 'none',
    },
    editCoverBtn: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        border: '1px solid #d4af37',
        color: '#d4af37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 10,
        transition: 'transform 0.2s',
    },
    infoCard: {
        maxWidth: '900px',
        width: '90%',
        padding: '3rem',
        borderRadius: '30px',
        textAlign: 'center',
        marginTop: '-100px', // Overlap effect
        zIndex: 2,
    },
    title: {
        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
        fontFamily: "'Cormorant Garamond', serif",
        color: '#fff',
        marginBottom: '1rem',
        textShadow: '0 0 30px rgba(255,255,255,0.1)',
    },
    divider: {
        width: '80px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
        margin: '0 auto 2rem',
    },
    description: {
        fontSize: '1.2rem',
        lineHeight: '1.8',
        color: '#ccc',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 300,
        marginBottom: '2.5rem',
        maxWidth: '800px',
        margin: '0 auto 2.5rem',
    },
    actionButtons: {
        display: 'flex',
        gap: '1.5rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        padding: '0.8rem 2rem',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '50px',
        color: '#d4af37',
        cursor: 'pointer',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        transition: 'all 0.3s ease',
    },
    section: {
        marginBottom: '6rem',
    },
    sectionTitle: {
        fontSize: '2.5rem',
        fontFamily: "'Cormorant Garamond', serif",
        marginBottom: '3rem',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
    },
    titleIcon: {
        color: '#d4af37',
        display: 'flex',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        gridColumn: '1 / -1',
        padding: '2rem',
    }
};

export default MemoryDetails;
