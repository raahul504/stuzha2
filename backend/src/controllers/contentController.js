const prisma = require('../config/database');
const contentService = require('../services/contentService');
const Joi = require('joi');
const { ARTICLES_DIR } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Add after imports
JSON.stringify = ((stringify) => {
  return function(value, replacer, space) {
    return stringify(value, (key, val) => {
      return typeof val === 'bigint' ? val.toString() : val;
    }, space);
  };
})(JSON.stringify);

const createContentSchema = Joi.object({
  contentType: Joi.string().valid('VIDEO', 'ARTICLE', 'ASSESSMENT').required(),
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().optional(),
  isPreview: Joi.boolean().default(false),
  
  // Video fields
  videoUrl: Joi.string().when('contentType', {
    is: 'VIDEO',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  videoDurationSeconds: Joi.number().integer().min(1).when('contentType', {
    is: 'VIDEO',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  videoSizeBytes: Joi.number().integer().min(1).when('contentType', {
    is: 'VIDEO',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  
  // Article fields
  articleContent: Joi.string().when('contentType', {
    is: 'ARTICLE',
    then: Joi.optional().allow(''),
    otherwise: Joi.forbidden(),
  }),
  articleFileUrl: Joi.string().when('contentType', {
    is: 'ARTICLE',
    then: Joi.optional().allow(''),
    otherwise: Joi.forbidden(),
  }),
  
  // Assessment fields
  assessmentPassPercentage: Joi.number().integer().min(0).max(100).when('contentType', {
    is: 'ASSESSMENT',
    then: Joi.optional().default(70),
    otherwise: Joi.forbidden(),
  }),
  assessmentTimeLimitMinutes: Joi.number().integer().min(1).when('contentType', {
    is: 'ASSESSMENT',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

const reorderContentSchema = Joi.object({
  orders: Joi.array().items(
    Joi.object({
      contentId: Joi.string().required(),
      orderIndex: Joi.number().integer().min(0).required(),
    })
  ).required(),
});

/**
 * Create content item
 * POST /api/modules/:moduleId/content
 */
const createContentItem = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { error, value } = createContentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const content = await contentService.createContentItem(moduleId, value, req.user.id);

    res.status(201).json({
      message: 'Content item created successfully',
      content,
    });
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized to modify this module') {
      return res.status(error.message === 'Module not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Get content items for module
 * GET /api/modules/:moduleId/content
 */
const getContentByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const content = await contentService.getContentByModule(moduleId);

    res.json({ content });
  } catch (error) {
    next(error);
  }
};

/**
 * Update content item
 * PUT /api/content/:id
 */
const updateContentItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const content = await contentService.updateContentItem(id, req.body, req.user.id);

    res.json({
      message: 'Content item updated successfully',
      content,
    });
  } catch (error) {
    if (error.message === 'Content item not found' || error.message === 'Unauthorized to modify this content') {
      return res.status(error.message === 'Content item not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Delete content item
 * DELETE /api/content/:id
 */
const deleteContentItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await contentService.deleteContentItem(id, req.user.id);

    res.json(result);
  } catch (error) {
    if (error.message === 'Content item not found' || error.message === 'Unauthorized to delete this content') {
      return res.status(error.message === 'Content item not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Reorder content items
 * PUT /api/modules/:moduleId/content/reorder
 */
const reorderContentItems = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { error, value } = reorderContentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const result = await contentService.reorderContentItems(moduleId, value.orders, req.user.id);

    res.json(result);
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized to modify this module') {
      return res.status(error.message === 'Module not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

const uploadArticle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { moduleId } = req.params;
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      return res.status(403).json({ error: { message: 'Unauthorized' } });
    }
    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    // Allow if user is the creator OR if user is an ADMIN
    if (module.course.createdBy !== req.user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: { message: 'Unauthorized' } });}

    const lastContent = await prisma.contentItem.findFirst({
      where: { moduleId },
      orderBy: { orderIndex: 'desc' },
    });

    const articleFileUrl = `/api/articles/view/${req.file.filename}`;

    const contentItem = await prisma.contentItem.create({
      data: {
        moduleId,
        contentType: 'ARTICLE',
        title: req.body.title,
        description: req.body.description || '',
        articleFileUrl,
        orderIndex: lastContent ? lastContent.orderIndex + 1 : 0,
        isPreview: req.body.isPreview === 'true',
      },
    });

    res.status(201).json({
      message: 'Article uploaded successfully',
      contentItem,
    });
  } catch (error) {
    next(error);
  }
};

const downloadArticle = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(ARTICLES_DIR, filename);
    
    if (fs.existsSync(filePath)) {
    }

    if (!fs.existsSync(filePath)) {
      console.log('ERROR: File not found!');
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000',
    });
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('SendFile error:', err);
        next(err);
      } else {
      }
    });
  } catch (error) {
    console.error('Article serve error:', error);
    next(error);
  }
};

module.exports = {
  createContentItem,
  getContentByModule,
  updateContentItem,
  deleteContentItem,
  reorderContentItems,
  uploadArticle,
  downloadArticle,
};

// GET /api/modules/:moduleId/content
module.exports.getModuleContent = async (req, res) => {
  const items = await prisma.contentItem.findMany({
    where: { moduleId: req.params.moduleId },
    orderBy: { orderIndex: 'asc' },
  });
  res.json({ items });
};

// GET /api/content/:contentItemId
module.exports.getContentItem = async (req, res) => {
  const item = await prisma.contentItem.findUnique({
    where: { id: req.params.contentItemId },
  });
  res.json({ item });
};