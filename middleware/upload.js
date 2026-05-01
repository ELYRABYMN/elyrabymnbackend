const multer = require('multer');
const path = require('path');
const fs = require('fs');

<<<<<<< HEAD
// 🔥 Production pe Render persistent disk, local dev pe project folder
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/var/data/uploads'
  : path.join(__dirname, '..', 'uploads');

=======
const uploadDir = path.join(__dirname, '..', 'uploads');
>>>>>>> 4cc74f4b0beeb518f0c2f0a3d4e76f76662e9922
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const types = /jpeg|jpg|png|webp|gif|avif/;
  const extname = types.test(path.extname(file.originalname).toLowerCase());
  const mimetype = types.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

<<<<<<< HEAD
module.exports = upload;
=======
module.exports = upload;
>>>>>>> 4cc74f4b0beeb518f0c2f0a3d4e76f76662e9922
