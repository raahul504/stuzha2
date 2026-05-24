const prisma = require('../config/database');

/**
 * Create module in a course
 */
const createModule = async (courseId, moduleData, userId) => {
  // Verify course exists and user has permission
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Allow if user is the creator OR if user is an ADMIN
  if (course.createdBy !== userId && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to modify this course');
  }

  // Get next order index
  const lastModule = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { orderIndex: 'desc' },
  });

  const orderIndex = lastModule ? lastModule.orderIndex + 1 : 0;

  const module = await prisma.module.create({
    data: {
      courseId,
      title: moduleData.title,
      description: moduleData.description,
      orderIndex,
    },
  });

  return module;
};

/**
 * Get all modules for a course
 */
const getModulesByCourse = async (courseId) => {
  const modules = await prisma.module.findMany({
    where: { courseId },
    include: {
      contentItems: {
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { orderIndex: 'asc' },
  });

  return modules;
};

/**
 * Update module
 */
const updateModule = async (moduleId, updateData, userId) => {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module) {
    throw new Error('Module not found');
  }

  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Allow if user is the creator OR if user is an ADMIN
  if (module.course.createdBy !== userId && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to modify this module');
  }

  const updated = await prisma.module.update({
    where: { id: moduleId },
    data: updateData,
  });

  return updated;
};

/**
 * Delete module
 */
const deleteModule = async (moduleId, userId) => {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module) {
    throw new Error('Module not found');
  }

  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Allow if user is the creator OR if user is an ADMIN
  if (module.course.createdBy !== userId && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to delete this module');
  }

  await prisma.module.delete({
    where: { id: moduleId },
  });

  return { message: 'Module deleted successfully' };
};

/**
 * Reorder modules
 */
const reorderModules = async (courseId, moduleOrders, userId) => {
  
  // Verify permission
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Allow if user is the creator OR if user is an ADMIN
  if (course.createdBy !== userId && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to modify this course');
  }

  // Update all module orders in transaction using two-phase approach
  // Phase 1: Set all modules to temporary negative indices to avoid unique constraint conflicts
  // Phase 2: Update to final indices
  try {
    await prisma.$transaction(async (tx) => {
      // Phase 1: Set temporary negative indices
      console.log('Phase 1: Setting temporary negative indices...');
      await Promise.all(
        moduleOrders.map((item, idx) =>
          tx.module.update({
            where: { id: item.moduleId },
            data: { orderIndex: -1000 - idx }, // Use negative indices temporarily
          })
        )
      );
      // Phase 2: Set final indices
      console.log('Phase 2: Setting final indices...');
      await Promise.all(
        moduleOrders.map(({ moduleId, orderIndex }) =>
          tx.module.update({
            where: { id: moduleId },
            data: { orderIndex },
          })
        )
      );
    });
    console.log('Module reorder successful');
  } catch (error) {
    console.error('Error in module reorder transaction:', error);
    throw error;
  }

  return { message: 'Modules reordered successfully' };
};

module.exports = {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule,
  reorderModules,
};