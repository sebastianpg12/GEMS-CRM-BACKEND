const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Wiki = require('../models/Wiki');

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Obtener todos los artículos de la wiki
router.get('/', async (req, res) => {
  try {
    const { categoria, search } = req.query;
    let query = {};
    if (categoria) query.categoria = categoria;
    if (search) {
      query.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    const articles = await Wiki.find(query).populate('autor', 'name email').sort({ updatedAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Obtener un artículo por ID
router.get('/:id', async (req, res) => {
  try {
    const article = await Wiki.findById(req.params.id).populate('autor', 'name email');
    if (!article) return res.status(404).json({ message: 'Artículo no encontrado' });
    article.vistas += 1;
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo artículo
router.post('/', upload.array('archivos', 5), async (req, res) => {
  try {
    const wikiData = { ...req.body };
    if (req.files) {
      wikiData.archivos = req.files.map(file => ({
        nombre: file.originalname,
        url: `/uploads/${file.filename}`,
        tipo: file.mimetype
      }));
    }
    const article = new Wiki(wikiData);
    const newArticle = await article.save();
    res.status(201).json(newArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Actualizar un artículo
router.put('/:id', upload.array('archivos', 5), async (req, res) => {
  try {
    const updateData = { ...req.body };
    const article = await Wiki.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Artículo no encontrado' });

    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        nombre: file.originalname,
        url: `/uploads/${file.filename}`,
        tipo: file.mimetype
      }));
      updateData.archivos = [...(article.archivos || []), ...newFiles];
    }

    const updatedArticle = await Wiki.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Eliminar un artículo
router.delete('/:id', async (req, res) => {
  try {
    await Wiki.findByIdAndDelete(req.params.id);
    res.json({ message: 'Artículo eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
