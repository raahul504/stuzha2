import { useState, useEffect } from 'react';

export function useOfflineVideo(videoId) {
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const isElectron = !!window.electronAPI?.offline;

    useEffect(() => {
        if (!isElectron || !videoId) return;
        checkStatus();
    }, [videoId]);

    useEffect(() => {
        if (!isElectron) return;
        window.electronAPI.offline.onProgress(({ videoId: vid, progress: p }) => {
            if (vid === videoId) setProgress(p);
        });
        return () => window.electronAPI.offline.removeProgressListener();
    }, [videoId]);

    const checkStatus = async () => {
        const result = await window.electronAPI.offline.status({ videoId });
        setIsDownloaded(result.downloaded);
    };

    const download = async (videoUrl, title) => {
        setDownloading(true);
        setProgress(0);
        try {
            await window.electronAPI.offline.download({ videoId, videoUrl, title });
            setIsDownloaded(true);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(false);
            setProgress(0);
        }
    };

    const deleteVideo = async () => {
        await window.electronAPI.offline.delete({ videoId });
        setIsDownloaded(false);
    };

    const getOfflineUrl = async () => {
        return window.electronAPI.offline.getStreamUrl(videoId);
    };

    return { isDownloaded, downloading, progress, isElectron, download, deleteVideo, getOfflineUrl };
}