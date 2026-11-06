const db = require('../data/dbStore');
const { isUnitValidForCategory } = require('../utils/units');

// @desc    Get all products with filters, search, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      district,
      sellerRole,
      minPrice,
      maxPrice,
      stockOnly,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    let products = await db.products.find({});

    // Filter by search keyword
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sellerName.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category && category !== 'All') {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by district / location
    if (district && district !== 'All') {
      products = products.filter(
        (p) => p.location?.district?.toLowerCase() === district.toLowerCase()
      );
    }

    // Filter by seller role (farmer vs supplier)
    if (sellerRole && sellerRole !== 'All') {
      products = products.filter((p) => p.sellerRole === sellerRole);
    }

    // Filter by price range
    if (minPrice) {
      products = products.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter((p) => p.price <= Number(maxPrice));
    }

    // Filter by in-stock only
    if (stockOnly === 'true') {
      products = products.filter((p) => p.availableQuantity > 0 && p.stockStatus !== 'out_of_stock');
    }

    // Sorting: Popular, Lowest Price, Highest Price, Newest
    if (sort === 'price_asc' || sort === 'lowest_price') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc' || sort === 'highest_price') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      products.sort((a, b) => {
        if (b.isFeatured !== a.isFeatured) {
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      // Default: newest first
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Pagination
    const total = products.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = products.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      count: paginated.length,
      products: paginated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await db.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found.',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product listing (Farmer or Supplier only)
// @route   POST /api/products
// @access  Private (Farmer, Supplier, Admin)
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      price,
      priceUnit,
      availableQuantity,
      quantityUnit,
      minOrderQuantity,
      location,
      images,
      safetyInstructions,
    } = req.body;

    if (!name || !description || !category || price === undefined || !priceUnit || availableQuantity === undefined || !quantityUnit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, description, category, price, priceUnit, availableQuantity, and quantityUnit.',
      });
    }

    if (Number(price) < 0 || Number(availableQuantity) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price and quantity must be non-negative numbers.',
      });
    }

    // Validate category unit compatibility
    if (!isUnitValidForCategory(category, priceUnit) || !isUnitValidForCategory(category, quantityUnit)) {
      console.warn(`[Unit Notice] Category ${category} paired with units ${priceUnit}/${quantityUnit}`);
    }

    const newProduct = await db.products.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: Number(price),
      currency: 'INR',
      priceUnit: priceUnit.trim(),
      availableQuantity: Number(availableQuantity),
      quantityUnit: quantityUnit.trim(),
      minOrderQuantity: Number(minOrderQuantity) || 1,
      sellerId: req.user._id,
      sellerName: req.user.name,
      sellerRole: req.user.role,
      sellerPhone: req.user.phone || '',
      location: {
        state: location?.state || req.user.location?.state || 'Tamil Nadu',
        district: location?.district || req.user.location?.district || 'Coimbatore',
        villageOrTaluk: location?.villageOrTaluk || '',
      },
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
      ],
      safetyInstructions: safetyInstructions || '',
    });

    res.status(201).json({
      success: true,
      message: 'Product listed successfully on Gen Baazar.',
      product: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private (Owner or Admin)
const updateProduct = async (req, res, next) => {
  try {
    const product = await db.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check ownership
    if (String(product.sellerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing.',
      });
    }

    // Whitelist allowed fields to prevent Mass Assignment vulnerability
    const allowedFields = [
      'name',
      'description',
      'price',
      'availableQuantity',
      'category',
      'priceUnit',
      'quantityUnit',
      'minOrderQuantity',
      'location',
      'images',
      'safetyInstructions',
      'stockStatus',
    ];

    const sanitizedUpdate = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        sanitizedUpdate[key] = req.body[key];
      }
    }
    sanitizedUpdate.updatedAt = new Date();

    const updated = await db.products.findByIdAndUpdate(req.params.id, sanitizedUpdate, { new: true });

    res.status(200).json({
      success: true,
      message: 'Product listing updated successfully.',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product listing
// @route   DELETE /api/products/:id
// @access  Private (Owner or Admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await db.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check ownership
    if (String(product.sellerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing.',
      });
    }

    await db.products.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product listing removed.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get listings created by current user
// @route   GET /api/products/my/listings
// @access  Private
const getMyProducts = async (req, res, next) => {
  try {
    const myProducts = await db.products.find({ sellerId: req.user._id });
    res.status(200).json({
      success: true,
      count: myProducts.length,
      products: myProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};

