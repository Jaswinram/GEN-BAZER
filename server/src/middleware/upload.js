const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  // Prohibit SVG uploads to prevent Stored Cross-Site Scripting (XSS) via embedded <script> tags
  const allowedExts = /jpeg|jpg|png|webp/;
  const allowedMimes = /^image\/(jpeg|png|webp)$/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (allowedExts.test(ext) && allowedMimes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only secure image formats (JPG, PNG, WEBP) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
});

module.exports = upload;

