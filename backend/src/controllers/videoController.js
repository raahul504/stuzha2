const videoService = require('../services/videoService');
const { VIDEOS_DIR } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

/**
 * Upload video
 * POST /api/videos/upload/:moduleId
 */
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No video file uploaded' } });
    }

    const contentItem = await videoService.uploadVideo(
      req.params.moduleId,
      req.body,
      req.file,
      req.user.id
    );

    res.status(201).json({
      message: 'Video uploaded successfully',
      contentItem,
    });
  } catch (error) {
    if (req.file?.path) {
        fs.unlink(req.file.path, () => {}); // cleanup orphaned file
    }
    if (error.message === 'Module not found' || error.message === 'Unauthorized') {
      return res.status(error.message === 'Module not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Stream video with range support
 * GET /api/videos/stream/:filename
 */
const streamVideo = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.id;

    // Check access
    const { allowed, message } = await videoService.canAccessVideo(userId, filename);

    if (!allowed) {
      return res.status(403).json({ error: { message } });
    }

    const videoPath = path.join(VIDEOS_DIR, filename);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: { message: 'Video file not found' } });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Range request for seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      stream.pipe(res);
    } else {
      // Full video
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  streamVideo,
};