const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorios si no existen
const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configuración para fotos de perfil
const profileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const profilesDir = path.join(__dirname, '..', 'uploads', 'profiles');
    createDirectory(profilesDir);
    cb(null, profilesDir);
  },
  filename: function(req, file, cb) {
    // Usar ID de usuario + timestamp para evitar colisiones de nombres
    const userId = req.user._id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Permitir solo archivos de imagen
    cb(null, `profile-${userId}-${timestamp}${ext}`);
  }
});

// Filtro para validar que solo se suban imágenes
const imageFilter = (req, file, cb) => {
  // Verificar si es una imagen
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo se permiten archivos de imagen'), false);
  }
  
  // Verificar extensión
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Tipo de archivo no permitido'), false);
  }
  
  cb(null, true);
};

// Límites para las imágenes de perfil (2MB máximo)
const profileLimits = {
  fileSize: 2 * 1024 * 1024 // 2MB
};

const uploadProfilePhoto = multer({ 
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: profileLimits
});

module.exports = {
  uploadProfilePhoto
};