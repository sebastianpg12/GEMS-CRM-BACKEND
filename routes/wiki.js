const express = require('express');
const router = express.Router();
const Wiki = require('../models/Wiki');

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
    
    // Incrementar vistas
    article.vistas += 1;
    await article.save();
    
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo artículo
router.post('/', async (req, res) => {
  const article = new Wiki(req.body);
  try {
    const newArticle = await article.save();
    res.status(201).json(newArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Actualizar un artículo
router.put('/:id', async (req, res) => {
  try {
    const updatedArticle = await Wiki.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
