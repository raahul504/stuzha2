const categoryService = require('../services/categoryService');
const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  parentCategoryId: Joi.string().optional().allow(null),
});

const createCategory = async (req, res, next) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: { message: error.details[0].message } });
    }

    const category = await categoryService.createCategory(value.name, value.parentCategoryId);
    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    if (err.message === 'Category already exists') {
      return res.status(409).json({ error: { message: err.message } });
    }
    if (err.message === 'Parent category not found') {
      return res.status(404).json({ error: { message: err.message } });
    }
    next(err);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCategory, getAllCategories };