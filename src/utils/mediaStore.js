import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
    updateDoc,
    setDoc,
    getDoc,
    orderBy,
    onSnapshot
} from 'firebase/firestore';

const UPLOADS_COLLECTION = 'uploads';
const COVERS_COLLECTION = 'covers';
const CLOUDINARY_CLOUD_NAME = 'dpfxu4gkw';
const CLOUDINARY_UPLOAD_PRESET = 'ls_family';

// Helper to open Cloudinary Widget
export const openCloudinaryWidget = (onSuccess, onClosed) => {
    if (!window.cloudinary) {
        console.error("Cloudinary script not loaded");
        alert("Upload widget failed to load. Please refresh the page or check your connection.");
        if (onClosed) onClosed();
        return;
    }

    const myWidget = window.cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        showAdvancedOptions: false,
        cropping: false,
        resourceType: "auto",
        clientAllowedFormats: null, // Allow all formats
        multiple: false,
        defaultSource: "local",
        styles: {
            palette: {
                window: "#030305",
                windowBorder: "#d4af37",
                tabIcon: "#d4af37",
                menuIcons: "#d4af37",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#d4af37",
                action: "#d4af37",
                inactiveTabIcon: "#666666",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#1a1a1a"
            },
            fonts: {
                default: null,
                "'Outfit', sans-serif": {
                    url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap",
                    active: true
                }
            }
        }
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            console.log('Done! Here is the image info: ', result.info);
            onSuccess({
                url: result.info.secure_url,
                storagePath: result.info.public_id,
                type: result.info.resource_type
            });
        }
        if (result && result.event === "close") {
            if (onClosed) onClosed();
        }
    });

    myWidget.open();
};

// --- Media Management (Photos/Videos) ---

export const saveMedia = async (parentId, category, type, url, storagePath, caption = '', scale = 1, position = 'center') => {
    try {
        // Metadata is saved to Firestore
        const mediaItem = {
            parentId: parseInt(parentId),
            category, // 'member' or 'memory'
            type,
            url: url,
            storagePath: storagePath,
            caption: caption || `Uploaded ${type}`,
            scale,
            position,
            timestamp: Date.now()
        };

        const docRef = await addDoc(collection(db, UPLOADS_COLLECTION), mediaItem);
        return { ...mediaItem, id: docRef.id };

    } catch (error) {
        console.error("Error saving media:", error);
        throw error;
    }
};

export const getMedia = async (parentId, category) => {
    try {
        const q = query(
            collection(db, UPLOADS_COLLECTION),
            where("parentId", "==", parseInt(parentId)),
            where("category", "==", category),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching media:", error);
        return [];
    }
};

export const subscribeToMedia = (parentId, category, onUpdate, onError) => {
    const q = query(
        collection(db, UPLOADS_COLLECTION),
        where("parentId", "==", parseInt(parentId)),
        where("category", "==", category),
        orderBy("timestamp", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
        const media = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        onUpdate(media);
    }, (error) => {
        console.error("Error subscribing to media:", error);
        if (onError) onError(error);
    });
};

export const deleteMedia = async (id) => {
    try {
        // 1. Get document
        const docRef = doc(db, UPLOADS_COLLECTION, id);

        // 2. Delete from Firestore (We leave the file in Cloudinary for now as it requires signed API to delete)
        await deleteDoc(docRef);

    } catch (error) {
        console.error("Error deleting media:", error);
        throw error;
    }
};

export const updateMedia = async (id, updates) => {
    try {
        const docRef = doc(db, UPLOADS_COLLECTION, id);
        await updateDoc(docRef, updates);
        return { id, ...updates };
    } catch (error) {
        console.error("Error updating media:", error);
        throw error;
    }
};

// --- Cover Overrides ---

export const saveCoverOverride = async (parentId, type, url, storagePath, scale = 1, position = 'center') => {
    try {
        // Save/Update in Firestore
        const id = `${type}-${parentId}`;
        const coverItem = {
            url: url,
            storagePath: storagePath,
            scale,
            position,
            timestamp: Date.now()
        };

        await setDoc(doc(db, COVERS_COLLECTION, id), coverItem);
        return coverItem;

    } catch (error) {
        console.error("Error saving cover:", error);
        throw error;
    }
};

export const getCoverOverride = async (parentId, type) => {
    try {
        const id = `${type}-${parentId}`;
        const docRef = doc(db, COVERS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching cover:", error);
        return null;
    }
};

// --- Static Media Management (Keep LocalStorage for now as it's user-specific preference) ---
// Or we could move this to Firestore too, but let's keep it simple for now.

const STATIC_HIDDEN_KEY = 'lalitham_hidden_static_media';

export const hideStaticMedia = (url) => {
    const hidden = JSON.parse(localStorage.getItem(STATIC_HIDDEN_KEY) || '[]');
    if (!hidden.includes(url)) {
        hidden.push(url);
        localStorage.setItem(STATIC_HIDDEN_KEY, JSON.stringify(hidden));
    }
};

export const getHiddenStaticMedia = () => {
    return JSON.parse(localStorage.getItem(STATIC_HIDDEN_KEY) || '[]');
};

// Static Caption Overrides (LocalStorage)
const STATIC_CAPTIONS_KEY = 'lalitham_static_captions';

export const updateStaticCaption = (url, newCaption) => {
    const captions = JSON.parse(localStorage.getItem(STATIC_CAPTIONS_KEY) || '{}');
    captions[url] = newCaption;
    localStorage.setItem(STATIC_CAPTIONS_KEY, JSON.stringify(captions));
};

export const getStaticCaptionOverrides = () => {
    return JSON.parse(localStorage.getItem(STATIC_CAPTIONS_KEY) || '{}');
};

export const deleteAllUploads = async () => {
    try {
        const q = query(collection(db, UPLOADS_COLLECTION));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log("All uploads deleted from Firestore");
    } catch (error) {
        console.error("Error deleting all uploads:", error);
        throw error;
    }
};
