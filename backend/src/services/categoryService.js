const prisma = require('../config/database');

const createCategory = async (name, parentCategoryId = null) => {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    throw new Error('Category already exists');
  }

  if (parentCategoryId) {
    const parent = await prisma.category.findUnique({ where: { id: parentCategoryId } });
    if (!parent) throw new Error('Parent category not found');
  }

  return await prisma.category.create({
    data: { name, parentCategoryId },
  });
};

const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      subCategories: { orderBy: { name: 'asc' } },
    },
  });
};

module.exports = { createCategory, getAllCategories };