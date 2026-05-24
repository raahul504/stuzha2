const prisma = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CERT_DIR = path.join(__dirname, '../../storage/certificates');

if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * Generate certificate for completed course
 */
const generateCertificate = async (userId, courseId) => {
  // Verify course completion
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
    include: {
      user: true,
      course: true,
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  if (!enrollment.completed) {
    throw new Error('Course not completed yet');
  }

  // Check if certificate already exists
  const existing = await prisma.certificate.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  if (existing) {
    return existing;
  }

  // Generate certificate number
  const certNumber = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  
  // Generate verification hash
  const verificationHash = crypto
    .createHash('sha256')
    .update(`${userId}-${courseId}-${certNumber}`)
    .digest('hex');

  const filename = `${certNumber}.pdf`;
  const filePath = path.join(CERT_DIR, filename);

  // Create PDF
  await createCertificatePDF(
    filePath,
    `${enrollment.user.firstName} ${enrollment.user.lastName}`,
    enrollment.course.title,
    certNumber,
    enrollment.completedAt
  );

  // Save to database
  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      enrollmentId: enrollment.id,
      certificateNumber: certNumber,
      fileUrl: `/api/certificates/download/${filename}`,
      verificationHash,
    },
  });

  return certificate;
};

/**
 * Create PDF certificate
 */
const createCertificatePDF = async (filePath, userName, courseName, certNumber, completionDate) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Certificate design
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    
    doc.fontSize(40).font('Helvetica-Bold').text('Certificate of Completion', 100, 100, { align: 'center' });
    
    doc.fontSize(20).font('Helvetica').text('This is to certify that', 100, 180, { align: 'center' });
    
    doc.fontSize(30).font('Helvetica-Bold').text(userName, 100, 220, { align: 'center' });
    
    doc.fontSize(18).font('Helvetica').text('has successfully completed the course', 100, 280, { align: 'center' });
    
    doc.fontSize(25).font('Helvetica-Bold').text(courseName, 100, 320, { align: 'center' });
    
    const dateStr = new Date(completionDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    doc.fontSize(14).font('Helvetica').text(`Completed on: ${dateStr}`, 100, 400, { align: 'center' });
    
    doc.fontSize(10).text(`Certificate Number: ${certNumber}`, 100, 500, { align: 'center' });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

/**
 * Verify certificate
 */
const verifyCertificate = async (certNumber) => {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: certNumber },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      course: { select: { title: true } },
    },
  });

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  return {
    valid: true,
    certificateNumber: certificate.certificateNumber,
    userName: `${certificate.user.firstName} ${certificate.user.lastName}`,
    courseName: certificate.course.title,
    issuedAt: certificate.issuedAt,
  };
};

module.exports = {
  generateCertificate,
  verifyCertificate,
  CERT_DIR,
};