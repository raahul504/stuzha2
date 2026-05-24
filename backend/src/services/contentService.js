const prisma = require('../config/database');
const xss = require('xss');

// XSS sanitization options for rich text article content
const xssOptions = {
  whiteList: {
    ...xss.whiteList,
    p: [], br: [], strong: [], em: [], u: [], h1: [], h2: [], h3: [],
    h4: [], h5: [], h6: [], ul: [], ol: [], li: [], blockquote: [],
    a: ['href', 'title', 'target', 'style', 'class'], img: ['src', 'alt', 'width', 'height', 'style', 'class'],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [], pre: [], code: [],
    span: ['style', 'class'],
    div: ['style', 'class'],
    iframe: ['src', 'frameborder', 'allowfullscreen', 'width', 'height', 'allow'],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};


/**
 * Create content item in a module
 */
const createContentItem = async (moduleId, contentData, userId) => {
  // Verify module exists and user has permission
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

  // Get next order index
  const lastContent = await prisma.contentItem.findFirst({
    where: { moduleId },
    orderBy: { orderIndex: 'desc' },
  });

  const orderIndex = lastContent ? lastContent.orderIndex + 1 : 0;

  // Validate content type specific fields
  const { contentType, ...rest } = contentData;

  let contentItemData = {
    moduleId,
    contentType,
    orderIndex,
    title: rest.title,
    description: rest.description,
    isPreview: rest.isPreview || false,
  };

  // Add type-specific fields
  if (contentType === 'VIDEO') {
    contentItemData = {
      ...contentItemData,
      videoUrl: rest.videoUrl,
      videoDurationSeconds: rest.videoDurationSeconds,
      videoSizeBytes: rest.videoSizeBytes,
    };
  } else if (contentType === 'ARTICLE') {
    contentItemData = {
      ...contentItemData,
      articleContent: rest.articleContent ? xss(rest.articleContent, xssOptions) : undefined,
      articleFileUrl: rest.articleFileUrl,
    };
  } else if (contentType === 'ASSESSMENT') {
    contentItemData = {
      ...contentItemData,
      assessmentPassPercentage: rest.assessmentPassPercentage || 70,
      assessmentTimeLimitMinutes: rest.assessmentTimeLimitMinutes,
    };
  }

  const contentItem = await prisma.contentItem.create({
    data: contentItemData,
  });

  return contentItem;
};

/**
 * Get content items for a module
 */
const getContentByModule = async (moduleId) => {
  const contentItems = await prisma.contentItem.findMany({
    where: { moduleId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { orderIndex: 'asc' },
  });

  return contentItems;
};

/**
 * Update content item
 */
const updateContentItem = async (contentId, updateData, userId) => {
  const content = await prisma.contentItem.findUnique({
    where: { id: contentId },
    include: { module: { include: { course: true } } },
  });

  if (!content) {
    throw new Error('Content item not found');
  }

  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Allow if user is the creator OR if user is an ADMIN
  if (content.module.course.createdBy !== userId && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to modify this content');
  }

  const updated = await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      ...updateData,
      articleContent: updateData.articleContent ? xss(updateData.articleContent, xssOptions) : undefined,
    },
  });


  return updated;
};

/**
 * Delete content item
 */
const deleteContentItem = async (contentId, userId) => {
  const content = await prisma.contentItem.findUnique({
    where: { id: contentId },
    include: { module: { include: { course: true } } },
  });

  if (!content) {
    throw new Error('Content item not found');
  }

  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Allow if user is the creator OR if user is an ADMIN
  if (content.module.course.createdBy !== userId && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to delete this content');
  }

  await prisma.contentItem.delete({
    where: { id: contentId },
  });

  return { message: 'Content item deleted successfully' };
};

/**
 * Reorder content items
 */
const reorderContentItems = async (moduleId, contentOrders, userId) => {
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

  // Use two-phase approach to avoid unique constraint conflicts
  // Phase 1: Set to temporary negative indices
  // Phase 2: Set to final indices
  try {
    await prisma.$transaction(async (tx) => {
      // Phase 1: Set temporary negative indices
      await Promise.all(
        contentOrders.map((item, idx) =>
          tx.contentItem.update({
            where: { id: item.contentId },
            data: { orderIndex: -1000 - idx },
          })
        )
      );

      // Phase 2: Set final indices
      await Promise.all(
        contentOrders.map(({ contentId, orderIndex }) =>
          tx.contentItem.update({
            where: { id: contentId },
            data: { orderIndex },
          })
        )
      );
    });
  } catch (error) {
    console.error('Error in content reorder transaction:', error);
    throw error;
  }

  return { message: 'Content items reordered successfully' };
};

module.exports = {
  createContentItem,
  getContentByModule,
  updateContentItem,
  deleteContentItem,
  reorderContentItems,
};