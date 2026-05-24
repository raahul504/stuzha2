const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'llama3.2:latest'; 

/**
 * Build system prompt for course advisor agent
 */
const buildSystemPrompt = (learningPaths, categories, courses) => {
  const mainCategoryTree = categories.map(main =>
    `  ${main.name}:\n${main.subCategories.map(sub => `    - ${sub.name}`).join('\n')}`
  ).join('\n');

  const subCategoryTree = categories.map(main =>
    `  ${main.name}:\n${main.subCategories.map(sub => `    - ${sub.name}`).join('\n')}`
  ).join('\n');

  const courseList = courses.length > 0
    ? courses.map(c => {
        const tags = c.categories.map(cc => cc.category.name).join(', ');
        return `  - ${c.title}${tags ? ` [${tags}]` : ''}`;
      }).join('\n')
    : '  No courses published yet.';

  const pathsList = learningPaths.map(p =>
    `  - ${p.name} (${p.difficultyLevel})`
  ).join('\n');

  return `You are a helpful career and course advisor AI for Data Centre Skills platform.

You help users in two distinct ways depending on what they want:
1. CAREER PATH recommendation — when the user has a specific job role or career goal in mind
2. INDIVIDUAL TOPIC recommendation — when the user wants to explore or learn a specific subject area

Understanding the three levels of our platform:

MAIN CATEGORIES (broad subject domains):
${mainCategoryTree}

SUBCATEGORIES (specific learnable skills or certification tracks within a main category):
${subCategoryTree}

AVAILABLE COURSES ON OUR PLATFORM (these are the only real courses we offer):
${courseList}

CAREER PATHS (cross-category roadmaps tied to real-world job roles):
${pathsList}

The relationship between these levels:
- A Main Category is a broad subject domain (e.g. Linux, DevOps, Cloud)
- A Subcategory is a specific learnable skill or certification track within that domain (e.g. Docker under DevOps, Red Hat Linux Administration under Linux)
- A Course is actual learning content available on our platform tagged to one or more subcategories
- A Career Path spans multiple categories and subcategories — it is a structured roadmap for a specific job role (e.g. DevOps Engineer requires Python, Linux, Docker, Kubernetes, and Cloud skills)

Examples of when to recommend a Career Path vs a Topic:
- User says "I want to become a DevOps engineer" → Career Path
- User says "I want to learn Docker" → Individual subcategory topic
- User says "I am interested in cloud" → ask further to determine if they want a specific role or just explore cloud topics

Rules:
1. Have a natural conversation to understand the user's career goals, experience level and interests
2. ONLY discuss topics relevant to the above areas and categories
3. NEVER mention or invent courses that are not listed in the AVAILABLE COURSES section above
4. NEVER mention external platforms or other online sources (online courses from Udemy, Coursera, YouTube, W3Schools, books, etc.) or anything that is not present on the platform. Everything the user needs is available on our platform.
5. If a user asks about a specific topic and no course exists for it yet, honestly tell them we are working on adding courses in that area
6. Ask 4-5 focused questions before concluding — experience level, specific interests, career goal or topic exploration
7. Keep responses to 2-3 sentences
8. Only add [READY] when you have enough clarity to make a recommendation of a career path or a subcategory topic
9. When ready, add [READY] on a new line at the very end. Nothing else on that line.`;
};

/**
 * Extract recommendation from LLM response


const extractRecommendation = (response, learningPaths) => {
  const match = response.match(/RECOMMENDATION:\s*([^\n]+)/i);
  if (!match) return null;

  const raw = match[1].trim().toLowerCase();

  // Exact match first
  const exact = learningPaths.find(p => p.name.toLowerCase() === raw);
  if (exact) return exact;

  // Strict contains — path name must be fully contained in response segment
  return learningPaths.find(p => raw.includes(p.name.toLowerCase())) || null;
  // Removed the reverse includes() that caused false positives
};
 */

/**
 * Extract user preferences from conversation
 */
const extractPreferences = (conversationHistory) => {
  // Simple keyword extraction for preferences
  const allMessages = conversationHistory
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const preferences = {};

  // Framework preferences
  if (allMessages.includes('react')) preferences.framework = 'React';
  else if (allMessages.includes('vue')) preferences.framework = 'Vue';
  else if (allMessages.includes('angular')) preferences.framework = 'Angular';

  // Cloud provider
  if (allMessages.includes('aws')) preferences.cloudProvider = 'AWS';
  else if (allMessages.includes('azure')) preferences.cloudProvider = 'Azure';
  else if (allMessages.includes('gcp') || allMessages.includes('google cloud')) {
    preferences.cloudProvider = 'Google Cloud';
  }

  // Experience level
  if (allMessages.includes('beginner') || allMessages.includes('new to') || allMessages.includes('never')) {
    preferences.experienceLevel = 'beginner';
  } else if (allMessages.includes('intermediate') || allMessages.includes('some experience')) {
    preferences.experienceLevel = 'intermediate';
  } else if (allMessages.includes('advanced') || allMessages.includes('experienced')) {
    preferences.experienceLevel = 'advanced';
  }

  return preferences;
};

/**
 * Call Ollama API for chat completion
 */
const generateResponse = async (messages, learningPaths, categories, courses) => {
  try {
    const systemPrompt = buildSystemPrompt(learningPaths, categories, courses);

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    const assistantMessage = response.data.message.content;
    return { message: assistantMessage };
  } catch (error) {
    console.error('Ollama API error:', error.message);
    return {
      message: "I'm having trouble connecting right now. Could you tell me what you're interested in learning?",
      error: true,
    };
  }
};

/**
 * Check if Ollama is available
 */
const checkOllamaHealth = async () => {
  try {
    await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    return true;
  } catch (error) {
    console.error('Ollama not available:', error.message);
    return false;
  }
};

module.exports = {
  generateResponse,
  extractPreferences,
  checkOllamaHealth,
  OLLAMA_BASE_URL,
  MODEL_NAME,
};