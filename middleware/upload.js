const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../public/images');
const dishesDir = path.join(uploadDir, 'dishes');
const buffetDir = path.join(uploadDir, 'buffet');

// Tạo thư mục nếu chưa tồn tại
[uploadDir, dishesDir, buffetDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Xác định thư mục dựa trên entity type
    let uploadPath = uploadDir;
    
    if (req.params.type === 'dish' || req.body.entity_type === 'monan') {
      uploadPath = dishesDir;
    } else if (req.params.type === 'buffet' || req.body.entity_type === 'setbuffet') {
      uploadPath = buffetDir;
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// Kiểm tra file type
const fileFilter = (req, file, cb) => {
  // Chỉ cho phép hình ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file hình ảnh (jpg, png, gif, webp)'), false);
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    files: 1 // Chỉ cho phép 1 file
  }
});

// Middleware xử lý lỗi upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa là 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được upload 1 file.'
      });
    }
  }
  
  if (error.message.includes('hình ảnh')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Helper function để tạo URL từ file path
const getImageUrl = (filename, type = 'dishes') => {
  if (!filename) return null;
  
  // Nếu đã là URL đầy đủ thì return luôn
  if (filename.startsWith('http') || filename.startsWith('/images')) {
    return filename;
  }
  
  return `/images/${type}/${filename}`;
};

// Helper function để xóa file cũ
const deleteOldImage = (imagePath) => {
  if (!imagePath) return;
  
  try {
    // Chuyển từ URL về file path
    let filePath;
    if (imagePath.startsWith('/images/')) {
      filePath = path.join(__dirname, '../public', imagePath);
    } else {
      filePath = imagePath;
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Đã xóa file cũ: ${filePath}`);
    }
  } catch (error) {
    console.error('Lỗi khi xóa file cũ:', error.message);
  }
};

module.exports = {
  upload,
  handleUploadError,
  getImageUrl,
  deleteOldImage
};
