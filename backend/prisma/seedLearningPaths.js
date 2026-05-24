const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedLearningPaths() {
  console.log('Starting learning paths seed...');

  const allCategories = await prisma.category.findMany();

  const getSubId = (name) => {
    const cat = allCategories.find((c) => c.name === name);
    if (!cat) throw new Error(`Subcategory not found: "${name}"`);
    return cat.id;
  };

  const getMainId = (name) => {
    const cat = allCategories.find((c) => c.name === name && c.level === 0);
    if (!cat) throw new Error(`Main category not found: "${name}"`);
    return cat.id;
  };

  const learningPaths = [
    // ── Cloud & Infrastructure ──────────────────────────────────────────────
    {
      name: 'Cloud Administrator',
      description:
        'Manage and operate cloud infrastructure on AWS and Azure, covering administration, Linux fundamentals, and core networking.',
      goalKeywords: [
        'cloud admin', 'cloud administrator', 'aws admin', 'azure admin',
        'manage cloud', 'cloud operations', 'cloud infrastructure',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 5,
      requiredCategoryIds: [
        getSubId('AWS - Administration'),
        getSubId('Red Hat Linux Administration'),
        getSubId('Routing & Switching'),
      ],
      preferencesJson: { cloudProvider: ['AWS', 'Azure', 'Both'] },
    },
    {
      name: 'Cloud Solutions Architect',
      description:
        'Design and architect scalable, secure cloud solutions across AWS and Azure with deep knowledge of networking and security.',
      goalKeywords: [
        'solutions architect', 'cloud architect', 'cloud design',
        'architect cloud', 'aws solutions architect', 'azure architect',
      ],
      difficultyLevel: 'ADVANCED',
      //estimatedMonths: 8,
      requiredCategoryIds: [
        getSubId('AWS - Solutions Architect'),
        getSubId('AWS - Networking'),
        getSubId('AWS - Security'),
        getSubId('AWS - Professional'),
        getSubId('Routing & Switching'),
      ],
      preferencesJson: { cloudProvider: ['AWS', 'Azure', 'Both'] },
    },
    {
      name: 'Cloud Security Engineer',
      description:
        'Specialise in securing cloud environments by combining cloud security services with core cybersecurity principles.',
      goalKeywords: [
        'cloud security', 'cloud security engineer', 'aws security',
        'azure security', 'secure cloud', 'cloud compliance',
      ],
      difficultyLevel: 'ADVANCED',
      //estimatedMonths: 6,
      requiredCategoryIds: [
        getSubId('AWS - Security'),
        getSubId('Cybersecurity Principles'),
        getSubId('Cybersecurity Solutions'),
        getSubId('AWS - Networking'),
      ],
      preferencesJson: { cloudProvider: ['AWS', 'Azure', 'Both'] },
    },

    // ── DevOps & Engineering ────────────────────────────────────────────────
    {
      name: 'DevOps Engineer',
      description:
        'Automate, deploy, and manage applications using containerisation, orchestration, scripting, and Linux — the core DevOps stack.',
      goalKeywords: [
        'devops', 'devops engineer', 'ci/cd', 'automation', 'docker',
        'kubernetes', 'containers', 'infrastructure automation',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 7,
      requiredCategoryIds: [
        getSubId('Docker'),
        getSubId('Kubernetes'),
        getSubId('Python'),
        getSubId('Red Hat Linux Administration'),
        getSubId('Ubuntu Linux Administration'),
        getSubId('AWS - Administration'),
      ],
      preferencesJson: {
        scripting: ['Python', 'Bash'],
        cloudProvider: ['AWS', 'Azure', 'Both'],
      },
    },
    {
      name: 'Site Reliability Engineer',
      description:
        'Ensure uptime and reliability by combining advanced Linux engineering, containerisation, and cloud operations.',
      goalKeywords: [
        'sre', 'site reliability', 'reliability engineer', 'platform engineer',
        'infrastructure reliability', 'uptime', 'observability',
      ],
      difficultyLevel: 'ADVANCED',
      //estimatedMonths: 8,
      requiredCategoryIds: [
        getSubId('Advanced Linux Engineering'),
        getSubId('Docker'),
        getSubId('Kubernetes'),
        getSubId('Python'),
        getSubId('AWS - Administration'),
      ],
      preferencesJson: { cloudProvider: ['AWS', 'Azure', 'Both'] },
    },

    // ── Data & Analytics ────────────────────────────────────────────────────
    {
      name: 'Data Analyst',
      description:
        'Transform raw data into actionable insights using Python, SQL, and industry-standard visualisation tools.',
      goalKeywords: [
        'data analyst', 'data analysis', 'analytics', 'business intelligence',
        'data visualisation', 'reporting', 'insights from data',
      ],
      difficultyLevel: 'BEGINNER',
      //estimatedMonths: 5,
      requiredCategoryIds: [
        getSubId('Data Analytics with Python'),
        getSubId('SQL for Data Analytics'),
        getSubId('Power BI'),
        getSubId('Tableau'),
        getSubId('Advanced Excel'),
      ],
      preferencesJson: {
        visualisationTool: ['Power BI', 'Tableau', 'Both'],
      },
    },
    {
      name: 'Data Engineer',
      description:
        'Build and maintain data pipelines by combining Python, SQL, Linux, and cloud infrastructure skills.',
      goalKeywords: [
        'data engineer', 'data engineering', 'data pipeline', 'etl',
        'big data', 'data infrastructure', 'data platform',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 7,
      requiredCategoryIds: [
        getSubId('Python'),
        getSubId('SQL for Data Analytics'),
        getSubId('Data Analytics with Python'),
        getSubId('Ubuntu Linux Administration'),
        getSubId('AWS - Administration'),
      ],
      preferencesJson: { cloudProvider: ['AWS', 'Azure', 'Both'] },
    },

    // ── Cybersecurity ───────────────────────────────────────────────────────
    {
      name: 'Cybersecurity Analyst',
      description:
        'Protect systems and respond to threats using core cybersecurity principles, networking knowledge, and Linux skills.',
      goalKeywords: [
        'cybersecurity', 'cyber security', 'security analyst', 'infosec',
        'information security', 'soc analyst', 'threat analyst',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 6,
      requiredCategoryIds: [
        getSubId('Cybersecurity Principles'),
        getSubId('Cybersecurity Solutions'),
        getSubId('Routing & Switching'),
        getSubId('Red Hat Linux Administration'),
      ],
      preferencesJson: { focus: ['Defensive', 'Offensive', 'Both'] },
    },
    {
      name: 'Network Security Engineer',
      description:
        'Secure enterprise networks by combining deep networking knowledge with cloud and cybersecurity expertise.',
      goalKeywords: [
        'network security', 'network security engineer', 'firewall',
        'network protection', 'secure networking', 'network defence',
      ],
      difficultyLevel: 'ADVANCED',
      //estimatedMonths: 7,
      requiredCategoryIds: [
        getSubId('Routing & Switching'),
        getSubId('Hyperchannel Networks'),
        getSubId('Cybersecurity Principles'),
        getSubId('Cybersecurity Solutions'),
        getSubId('AWS - Security'),
        getSubId('AWS - Networking'),
      ],
      preferencesJson: {},
    },

    // ── Infrastructure & Networking ─────────────────────────────────────────
    {
      name: 'Network Engineer',
      description:
        'Design and manage enterprise networks covering switching, routing, hyperchannel, and storage networking.',
      goalKeywords: [
        'network engineer', 'networking', 'network administration',
        'network infrastructure', 'lan wan', 'enterprise networking',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 6,
      requiredCategoryIds: [
        getSubId('Routing & Switching'),
        getSubId('Hyperchannel Networks'),
        getSubId('SAN & NAS'),
        getSubId('Red Hat Linux Administration'),
      ],
      preferencesJson: {},
    },
    {
      name: 'Data Centre Engineer',
      description:
        'Operate and maintain enterprise data centres by mastering server, storage, and network architecture alongside virtualisation and Linux.',
      goalKeywords: [
        'data centre', 'data center', 'data centre engineer',
        'dc engineer', 'enterprise infrastructure', 'data center operations',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 7,
      requiredCategoryIds: [
        getSubId('Enterprise Server Architecture'),
        getSubId('Enterprise Storage Architecture'),
        getSubId('Enterprise Network Architecture'),
        getSubId('VMware Administration'),
        getSubId('Red Hat Linux Administration'),
      ],
      preferencesJson: {},
    },
    {
      name: 'Storage Engineer',
      description:
        'Specialise in enterprise storage systems covering SAN, NAS, and storage architecture with Linux administration.',
      goalKeywords: [
        'storage engineer', 'storage administration', 'san nas',
        'storage networking', 'enterprise storage', 'storage specialist',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 5,
      requiredCategoryIds: [
        getSubId('SAN & NAS'),
        getSubId('Enterprise Storage Architecture'),
        getSubId('Red Hat Linux Administration'),
      ],
      preferencesJson: {},
    },
    {
      name: 'Virtualisation Engineer',
      description:
        'Implement and manage virtualised environments using VMware and Oracle VirtualBox on top of enterprise server infrastructure.',
      goalKeywords: [
        'virtualisation', 'virtualization', 'vmware', 'virtualbox',
        'virtualisation engineer', 'vm admin', 'hypervisor',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 5,
      requiredCategoryIds: [
        getSubId('VMware Administration'),
        getSubId('Oracle VirtualBox Administration'),
        getSubId('Enterprise Server Architecture'),
        getSubId('Red Hat Linux Administration'),
      ],
      preferencesJson: { platform: ['VMware', 'VirtualBox', 'Both'] },
    },

    // ── Development ─────────────────────────────────────────────────────────
    {
      name: 'Full Stack Developer',
      description:
        'Build complete web applications covering frontend (HTML, JavaScript) and backend (Python or Java) with database skills.',
      goalKeywords: [
        'full stack', 'fullstack', 'web developer', 'full stack developer',
        'web development', 'build websites', 'web app',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 8,
      requiredCategoryIds: [
        getSubId('HTML'),
        getSubId('JavaScript'),
        getSubId('Python'),
        getSubId('SQL for Data Analytics'),
        getSubId('Ubuntu Linux Administration'),
      ],
      preferencesJson: { backendLanguage: ['Python', 'Java', 'JavaScript'] },
    },
    {
      name: 'Backend Developer',
      description:
        'Build server-side applications and APIs using Python, Java, or C++, with SQL databases and Linux environments.',
      goalKeywords: [
        'backend', 'backend developer', 'server side', 'api developer',
        'software engineer', 'backend engineering', 'server development',
      ],
      difficultyLevel: 'INTERMEDIATE',
      //estimatedMonths: 7,
      requiredCategoryIds: [
        getSubId('Python'),
        getSubId('SQL for Data Analytics'),
        getSubId('Ubuntu Linux Administration'),
      ],
      preferencesJson: { language: ['Python', 'Java', 'C++'] },
    },

    // ── Business & Management ───────────────────────────────────────────────
    {
      name: 'Project Manager',
      description:
        'Lead projects effectively by mastering project management principles, Six Sigma quality methods, and business communication.',
      goalKeywords: [
        'project manager', 'project management', 'pm', 'programme manager',
        'agile', 'scrum', 'project lead', 'delivery manager',
      ],
      difficultyLevel: 'BEGINNER',
      //estimatedMonths: 4,
      requiredCategoryIds: [
        getSubId('Project Management Principles'),
        getSubId('Six Sigma'),
        getSubId('Business Communications'),
      ],
      preferencesJson: {},
    },
    {
      name: 'Digital Marketing Specialist',
      description:
        'Drive online growth through SEO, social media, digital advertising, and sales automation.',
      goalKeywords: [
        'digital marketing', 'marketing', 'seo', 'social media marketing',
        'online marketing', 'digital advertiser', 'growth marketing',
      ],
      difficultyLevel: 'BEGINNER',
      //estimatedMonths: 4,
      requiredCategoryIds: [
        getSubId('SEO'),
        getSubId('SMO'),
        getSubId('Digital Ads Management'),
        getSubId('Sales Lead Automation'),
      ],
      preferencesJson: {
        focus: ['SEO', 'Social Media', 'Paid Ads', 'All'],
      },
    },
    {
      name: 'Business Analyst',
      description:
        'Bridge business and technology by combining data analysis, visualisation, project management, and business modelling skills.',
      goalKeywords: [
        'business analyst', 'ba', 'business analysis', 'requirements analyst',
        'process analyst', 'systems analyst', 'product analyst',
      ],
      difficultyLevel: 'BEGINNER',
      //estimatedMonths: 5,
      requiredCategoryIds: [
        getSubId('Data Analytics with Python'),
        getSubId('SQL for Data Analytics'),
        getSubId('Power BI'),
        getSubId('Project Management Principles'),
        getSubId('Business Model & Pitch'),
        getSubId('Business Communications'),
      ],
      preferencesJson: { visualisationTool: ['Power BI', 'Tableau', 'Both'] },
    },
  ];

  for (const path of learningPaths) {
    const existing = await prisma.learningPath.findFirst({
      where: { name: path.name },
    });

    if (existing) {
      await prisma.learningPath.update({ where: { id: existing.id }, data: path });
      console.log(`✓ Updated: ${path.name}`);
    } else {
      await prisma.learningPath.create({ data: path });
      console.log(`✓ Created: ${path.name}`);
    }
  }

  console.log(`\n✅ Seeded ${learningPaths.length} learning paths.`);
}

seedLearningPaths()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });