const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categoriesData = [
  {
    name: 'Cloud',
    subcategories: [
      'AWS - Administration',
      'AWS - Professional',
      'AWS - Networking',
      'AWS - Security',
      'AWS - Solutions Architect',
      'Azure - Administration',
      'Azure - Professional',
      'Azure - Networking',
      'Azure - Security',
      'Azure - Solutions Architect',
    ],
  },
  {
    name: 'Networking',
    subcategories: [
      'Routing & Switching',
      'Hyperchannel Networks',
      'SAN & NAS',
    ],
  },
  {
    name: 'Programming',
    subcategories: ['Python', 'R', 'JavaScript', 'Java', 'C', 'C++', 'HTML'],
  },
  {
    name: 'Data Analytics',
    subcategories: [
      'Data Analytics with Python',
      'SQL for Data Analytics',
      'Power BI',
      'Tableau',
      'Advanced Excel',
    ],
  },
  {
    name: 'Project Management',
    subcategories: [
      'Project Management Principles',
      'Six Sigma',
      'Business Communications',
      'Business Model & Pitch',
    ],
  },
  {
    name: 'Digital Marketing',
    subcategories: [
      'SEO',
      'SMO',
      'Digital Ads Management',
      'Sales Lead Automation',
    ],
  },
  {
    name: 'Cybersecurity',
    subcategories: [
      'Cybersecurity Principles',
      'Cybersecurity Solutions',
    ],
  },
  {
    name: 'DevOps',
    subcategories: ['Docker', 'Kubernetes'],
  },
  {
    name: 'Data Centre',
    subcategories: [
      'Enterprise Server Architecture',
      'Enterprise Storage Architecture',
      'Enterprise Network Architecture',
    ],
  },
  {
    name: 'Virtualisation',
    subcategories: [
      'VMware Administration',
      'Oracle VirtualBox Administration',
    ],
  },
  {
    name: 'Linux',
    subcategories: [
      'Red Hat Linux Administration',
      'Ubuntu Linux Administration',
      'Advanced Linux Engineering',
    ],
  },
  {
    name: 'Windows',
    subcategories: ['Windows Server Services & Features'],
  },
  {
    name: 'Database',
    subcategories: ['SQL', 'SAP', 'Oracle'],
  },
  {
    name: 'Life Technical Skills',
    subcategories: [
      'Using AI to build simple website',
      'Using AI to automate daily workflows',
      'Using AI to debug simple technical issues',
    ],
  },
  {
    name: 'Life Non-Technical Skills',
    subcategories: [
      'Business model and pitch',
      'Time management and prioritization',
      'Workplace communication and etiquette',
      'Career planning and direction',
    ],
  },
];

async function seedCategories() {
  console.log('Starting category seed...');

  for (let i = 0; i < categoriesData.length; i++) {
    const categoryData = categoriesData[i];

    const mainCategory = await prisma.category.upsert({
      where: { name: categoryData.name },
      update: { level: 0, orderIndex: i },
      create: { name: categoryData.name, level: 0, orderIndex: i },
    });

    console.log(`✓ Main category: ${mainCategory.name}`);

    for (let j = 0; j < categoryData.subcategories.length; j++) {
      const subCatName = categoryData.subcategories[j];
      await prisma.category.upsert({
        where: { name: subCatName },
        update: { parentCategoryId: mainCategory.id, level: 1, orderIndex: j },
        create: {
          name: subCatName,
          parentCategoryId: mainCategory.id,
          level: 1,
          orderIndex: j,
        },
      });
      console.log(`  ✓ Subcategory: ${subCatName}`);
    }
  }

  console.log('\n✅ Category seeding complete!');
}

seedCategories()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });