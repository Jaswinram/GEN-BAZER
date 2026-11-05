const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/my/listings', protect, getMyProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorizeRoles('farmer', 'supplier', 'admin'), createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;

