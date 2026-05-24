const moduleService = require('../services/moduleService');
const Joi = require('joi');

const createModuleSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().optional(),
});

const updateModuleSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().optional(),
});

const reorderSchema = Joi.object({
  orders: Joi.array().items(
    Joi.object({
      moduleId: Joi.string().required(),
      orderIndex: Joi.number().integer().min(0).required(),
    })
  ).required(),
});

/**
 * Create module
 * POST /api/courses/:courseId/modules
 */
const createModule = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { error, value } = createModuleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const module = await moduleService.createModule(courseId, value, req.user.id);

    res.status(201).json({
      message: 'Module created successfully',
      module,
    });
  } catch (error) {
    if (error.message === 'Course not found' || error.message === 'Unauthorized to modify this course') {
      return res.status(error.message === 'Course not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Get modules for course
 * GET /api/courses/:courseId/modules
 */
const getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const modules = await moduleService.getModulesByCourse(courseId);

    res.json({ modules });
  } catch (error) {
    next(error);
  }
};

/**
 * Update module
 * PUT /api/modules/:id
 */
const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateModuleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const module = await moduleService.updateModule(id, value, req.user.id);

    res.json({
      message: 'Module updated successfully',
      module,
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
 * Delete module
 * DELETE /api/modules/:id
 */
const deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await moduleService.deleteModule(id, req.user.id);

    res.json(result);
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized to delete this module') {
      return res.status(error.message === 'Module not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Reorder modules
 * PUT /api/courses/:courseId/modules/reorder
 */
const reorderModules = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { error, value } = reorderSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const result = await moduleService.reorderModules(courseId, value.orders, req.user.id);

    res.json(result);
  } catch (error) {
    if (error.message === 'Course not found' || error.message === 'Unauthorized to modify this course') {
      return res.status(error.message === 'Course not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

module.exports = {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule,
  reorderModules,
};