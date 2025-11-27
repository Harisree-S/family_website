import React, { createContext, useContext, useRef, useState, useEffect, useCallback, useMemo } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
    const bgAudioRef = useRef(new Audio());
    const sfxAudioRef = useRef(new Audio());
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null); // Track currently playing URL

    // Initialize audio settings
    useEffect(() => {
        bgAudioRef.current.loop = true;
        bgAudioRef.current.preload = "auto"; // Preload for lower latency
        sfxAudioRef.current.volume = 0.6; // Standard SFX volume
        sfxAudioRef.current.preload = "auto";
    }, []);

    // Handle video playing state - pause BG music when video plays
    useEffect(() => {
        if (isVideoPlaying) {
            bgAudioRef.current.pause();
        } else if (currentTrack && !bgAudioRef.current.ended && bgAudioRef.current.paused) {
            // Resume if we have a track and it wasn't stopped manually
            bgAudioRef.current.play().catch(e => console.log("Resume failed:", e));
        }
    }, [isVideoPlaying, currentTrack]);

    // Handle visibility change (minimize/tab switch)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (!bgAudioRef.current.paused) {
                    bgAudioRef.current.pause();
                    sessionStorage.setItem('was_bg_playing', 'true');
                } else {
                    sessionStorage.setItem('was_bg_playing', 'false');
                }
            } else {
                // Resume only if it was playing before and video is NOT playing
                const wasPlaying = sessionStorage.getItem('was_bg_playing') === 'true';
                if (wasPlaying && !isVideoPlaying && currentTrack) {
                    bgAudioRef.current.play().catch(e => console.log("Resume failed:", e));
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isVideoPlaying, currentTrack]);

    const playImageAudio = useCallback((src, volume = 0.5, loop = true) => {
        if (!src) return;

        // If the requested track is already playing, just update volume/loop
        // We need to access the ref directly or use a functional update if we were setting state,
        // but here we read state 'currentTrack'. To avoid 'currentTrack' dependency in useCallback
        // which would recreate the function when track changes, we can check the ref's src?
        // Actually, checking state is fine if we accept function recreation, BUT
        // to strictly avoid re-running effects in consumers, we should try to keep this stable.
        // However, the logic requires knowing the current track.
        // Let's rely on the fact that if currentTrack matches, we don't change state, so no re-render loop.
        // But we want the FUNCTION IDENTITY to be stable.
        // We can use a ref to track currentTrack for the comparison inside the callback?
        // Or just let it recreate?
        // If it recreates, the consumer useEffect depends on it, so it runs cleanup -> stop -> start.
        // BAD.
        // Solution: Use a ref for currentTrack inside the hook to avoid dependency?
        // Or better: The check `if (currentTrack === src)` is the problem if `currentTrack` is a dependency.

        // Let's check against the AUDIO ELEMENT'S src property!
        // bgAudioRef.current.src might be the full absolute URL, while src input might be relative or imported.
        // Imports usually give full paths in Vite dev, but let's be careful.
        // Actually, we set `bgAudioRef.current.src = src`. So we can compare that.

        const audioEl = bgAudioRef.current;
        // Note: audioEl.src is absolute. 'src' from import is usually absolute in Vite.
        // Let's try to compare. If it fails, we might need a separate ref to hold the "logical" current track.

        // Let's use a ref to hold the current logical track ID/URL to avoid state dependency in this callback.
        // We still update the state 'currentTrack' for other UI needs if any (none currently shown used it for rendering, only effect).

        // Wait, 'currentTrack' state IS used in the useEffect above for resuming.
        // So we do need state.

        // To keep playImageAudio stable, we can use a ref for the *comparison*, 
        // but we still need to update state.
        // Updating state won't change the function identity if we don't depend on the state.

        // Let's use a ref to track 'currentTrack' for the stability of this function.
    }, []);

    // Actually, simpler approach:
    // The consumer useEffect depends on `playImageAudio`.
    // We want `playImageAudio` to NOT change when `currentTrack` changes.
    // We can use a ref to store the current track value, and update it when we change the track.

    const currentTrackRef = useRef(null);

    const playImageAudioStable = useCallback((src, volume = 0.5, loop = true) => {
        if (!src) return;

        if (currentTrackRef.current === src) {
            bgAudioRef.current.volume = volume;
            bgAudioRef.current.loop = loop;
            if (bgAudioRef.current.paused && !isVideoPlaying) {
                bgAudioRef.current.play().catch(e => console.error("Play failed:", e));
            }
            return;
        }

        bgAudioRef.current.pause();
        bgAudioRef.current.src = src;
        bgAudioRef.current.volume = volume;
        bgAudioRef.current.loop = loop;

        currentTrackRef.current = src;
        setCurrentTrack(src); // This triggers re-render, but function identity remains stable!

        if (!isVideoPlaying) {
            bgAudioRef.current.play().catch(error => {
                console.log("Audio play failed:", error);
            });
        }
    }, [isVideoPlaying]); // isVideoPlaying is less frequent, but still... 
    // actually isVideoPlaying is a state. If it changes, this recreates.
    // If video plays, we pause BG. If video stops, we resume.
    // Does video playing affect 'playImageAudio'?
    // Yes: `if (!isVideoPlaying) ... play()`
    // We can use a ref for isVideoPlaying too if we want absolute stability, 
    // but video playing usually happens inside the modal, so maybe it's fine if it recreates then?
    // But wait, if it recreates, the consumer effect runs cleanup -> stop.
    // If video is playing, we WANT bg audio to stop.
    // If video stops, we want it to resume.

    // Let's use a ref for isVideoPlaying as well to ensure total stability of playImageAudio.
    const isVideoPlayingRef = useRef(false);

    // We need to keep the state for the useEffect that handles auto-resume/pause.
    // But for the callback, we use refs.

    const setIsVideoPlayingStable = useCallback((playing) => {
        setIsVideoPlaying(playing);
        isVideoPlayingRef.current = playing;
    }, []);

    const stopImageAudio = useCallback(() => {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
        currentTrackRef.current = null;
        setCurrentTrack(null);
    }, []);

    const clearImageAudio = stopImageAudio;

    const playSfx = useCallback((src) => {
        if (!src) return;
        const sfx = new Audio(src);
        sfx.volume = 0.6;
        sfx.play().catch(e => console.log("SFX play failed:", e));
    }, []);

    const setOverrideBgTrack = useCallback((src, volume) => {
        playImageAudioStable(src, volume);
    }, []); // This depends on playImageAudioStable, which we need to define first or hoist.

    // Let's define playImageAudioStable properly.

    const playImageAudioFinal = useCallback((src, volume = 0.5, loop = true) => {
        if (!src) return;

        if (currentTrackRef.current === src) {
            bgAudioRef.current.volume = volume;
            bgAudioRef.current.loop = loop;
            if (bgAudioRef.current.paused && !isVideoPlayingRef.current) {
                bgAudioRef.current.play().catch(e => console.error("Play failed:", e));
            }
            return;
        }

        bgAudioRef.current.pause();
        bgAudioRef.current.src = src;
        bgAudioRef.current.volume = volume;
        bgAudioRef.current.loop = loop;

        currentTrackRef.current = src;
        setCurrentTrack(src);

        if (!isVideoPlayingRef.current) {
            bgAudioRef.current.play().catch(error => {
                console.log("Audio play failed:", error);
            });
        }
    }, []); // No dependencies! Stable forever.

    const value = useMemo(() => ({
        playImageAudio: playImageAudioFinal,
        stopImageAudio,
        clearImageAudio,
        playSfx,
        setOverrideBgTrack: playImageAudioFinal, // Reuse
        setIsVideoPlaying: setIsVideoPlayingStable
    }), [playImageAudioFinal, stopImageAudio, clearImageAudio, playSfx, setIsVideoPlayingStable]);

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
};
