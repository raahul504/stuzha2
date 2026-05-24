require('dotenv').config();
const { embedAllCourses } = require('../src/services/embeddingService');

embedAllCourses()
  .catch((e) => { console.error(e); process.exit(1); });