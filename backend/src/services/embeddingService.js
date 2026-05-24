const axios = require('axios');
const prisma = require('../config/database');

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text';

/**
 * Generate embedding vector for a text string using Ollama
 */
const generateEmbedding = async (text) => {
  const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
    model: EMBED_MODEL,
    prompt: text,
  });
  return response.data.embedding;
};

/**
 * Build the text representation of a course for embedding
 * This is carefully engineered to maximise cross-category relevance
 * It includes title, description, category names, subcategory names,
 * and related technology keywords derived from the course content
 */
const buildCourseEmbeddingText = (course) => {
  const parts = [];

  parts.push(course.title);

  if (course.shortDescription) parts.push(course.shortDescription);
  if (course.description) parts.push(course.description.substring(0, 500));

  const categoryNames = course.categories
    ?.map(cc => cc.category.name)
    .filter(Boolean)
    .join(', ');
  if (categoryNames) parts.push(`Categories: ${categoryNames}`);

  if (course.requirements) parts.push(`Requirements: ${course.requirements}`);
  if (course.targetAudience) parts.push(`Target audience: ${course.targetAudience}`);
  if (course.courseIncludes) parts.push(`Includes: ${course.courseIncludes}`);

  return parts.join('. ');
};

/**
 * Compute and store embedding for a single course
 */
const embedCourse = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      categories: {
        include: { category: true },
      },
    },
  });

  if (!course || !course.isPublished) return null;

  const text = buildCourseEmbeddingText(course);
  const embedding = await generateEmbedding(text);

  return await prisma.courseEmbedding.upsert({
    where: { courseId },
    update: { embedding, embeddedText: text },
    create: { courseId, embedding, embeddedText: text },
  });
};

/**
 * Compute and store embeddings for all published courses
 * Used for initial seeding and bulk refresh
 */
const embedAllCourses = async () => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      categories: { include: { category: true } },
    },
  });

  console.log(`Embedding ${courses.length} courses...`);
  let success = 0;
  let failed = 0;

  for (const course of courses) {
    try {
      const text = buildCourseEmbeddingText(course);
      const embedding = await generateEmbedding(text);
      await prisma.courseEmbedding.upsert({
        where: { courseId: course.id },
        update: { embedding, embeddedText: text },
        create: { courseId: course.id, embedding, embeddedText: text },
      });
      console.log(`✓ Embedded: ${course.title}`);
      success++;
    } catch (err) {
      console.error(`✗ Failed: ${course.title} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
};

/**
 * Cosine similarity between two vectors
 */
const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Search for most relevant courses given a natural language query
 * Returns top N courses ranked by semantic similarity
 * Works cross-category by design
 */
const searchCoursesByEmbedding = async (queryText, topN = 5, threshold = 0.6) => {
  const queryEmbedding = await generateEmbedding(queryText);

  const allEmbeddings = await prisma.courseEmbedding.findMany({
    include: {
      course: {
        include: {
          categories: {
            include: { category: true },
          },
        },
      },
    },
  });

  // Filter out unpublished courses that may still have embeddings
  const published = allEmbeddings.filter(e => e.course.isPublished);

  const scored = published.map(e => ({
    course: e.course,
    score: cosineSimilarity(queryEmbedding, e.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  scored.slice(0, 8).forEach(s => 
    console.log(`${s.score.toFixed(3)} — ${s.course.title}`)
  );
  // Apply threshold filter before topN slice
  const filtered = scored.filter(s => s.score >= threshold);
  return filtered.slice(0, topN).map(s => s.course);
};

/**
 * Delete embedding for a course (called when course is unpublished or deleted)
 */
const deleteEmbedding = async (courseId) => {
  await prisma.courseEmbedding.deleteMany({ where: { courseId } });
};

/**
 * Compute and store embedding for a user query message in a conversation session
 */
const embedUserQuery = async (sessionToken, queryText) => {
  const embedding = await generateEmbedding(queryText);

  return await prisma.userQueryEmbedding.create({
    data: { sessionToken, queryText, embedding },
  });
};

/**
 * Delete all query embeddings for a conversation session
 */
const deleteQueryEmbeddingsForSession = async (sessionToken) => {
  await prisma.userQueryEmbedding.deleteMany({ where: { sessionToken } });
};

module.exports = {
  generateEmbedding,
  embedCourse,
  embedAllCourses,
  searchCoursesByEmbedding,
  deleteEmbedding,
  buildCourseEmbeddingText,
  embedUserQuery,
  deleteQueryEmbeddingsForSession,
};