const db = require('../data/dbStore');
const { calculateSubtotal } = require('../utils/currency');

// Generate distinct human-readable order reference
function generateOrderRef() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${rand}`;
}

// @desc    Create new order (revalidating all items, prices, and stock)
// @route   POST /api/orders
// @access  Private (Buyer, Farmer, etc.)
const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add agricultural products to order.',
      });
    }

    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.addressLine || !deliveryAddress.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required delivery address fields.',
      });
    }

    // Server-side validation of every product item
    const validatedItems = [];
    let serverSubtotal = 0;

    for (const item of items) {
      const product = await db.products.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product "${item.name || item.productId}" is no longer available.`,
        });
      }

      const requestedQty = Number(item.quantity) || 0;
      if (requestedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product "${product.name}".`,
        });
      }

      if (product.minOrderQuantity && requestedQty < product.minOrderQuantity) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for "${product.name}" is ${product.minOrderQuantity} ${product.quantityUnit}.`,
        });
      }

      if (requestedQty > product.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.availableQuantity} ${product.quantityUnit} available.`,
        });
      }

      // Compute item subtotal on server using product's database price
      const itemSubtotal = calculateSubtotal(product.price, requestedQty);
      serverSubtotal = calculateSubtotal(serverSubtotal + itemSubtotal, 1);

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        currency: 'INR',
        priceUnit: product.priceUnit,
        quantity: requestedQty,
        quantityUnit: product.quantityUnit,
        subtotal: itemSubtotal,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        image: product.images && product.images[0] ? product.images[0] : '',
      });
    }

    // Delivery charges: transparent flat charge of ₹80 for local farm transit if subtotal < ₹1000, else free
    const deliveryCharges = serverSubtotal >= 1000 ? 0 : 80;
    const taxAmount = 0; // Agriculture products are largely GST-exempt in India
    const totalAmount = calculateSubtotal(serverSubtotal + deliveryCharges, 1);

    // Decrement stock for purchased items
    for (const vItem of validatedItems) {
      const product = await db.products.findById(vItem.productId);
      if (product) {
        const remaining = Math.max(0, product.availableQuantity - vItem.quantity);
        await db.products.findByIdAndUpdate(product._id, {
          availableQuantity: remaining,
        });
      }
    }

    const orderRef = generateOrderRef();

    const order = await db.orders.create({
      orderReference: orderRef,
      buyerId: req.user._id,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      buyerPhone: req.user.phone || deliveryAddress.phone,
      items: validatedItems,
      subtotalAmount: serverSubtotal,
      deliveryCharges,
      taxAmount,
      totalAmount,
      currency: 'INR',
      deliveryAddress: {
        fullName: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        addressLine: deliveryAddress.addressLine,
        district: deliveryAddress.district || 'Coimbatore',
        state: deliveryAddress.state || 'Tamil Nadu',
        pincode: deliveryAddress.pincode,
      },
      orderStatus: 'pending',
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'unpaid',
      paymentMethod: paymentMethod || 'online_development',
      paymentReference: '',
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's orders (as buyer)
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await db.orders.find({ buyerId: req.user._id });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders received by seller (farmer or supplier)
// @route   GET /api/orders/seller
// @access  Private (Farmer, Supplier, Admin)
const getSellerOrders = async (req, res, next) => {
  try {
    const allOrders = await db.orders.find({});
    // Filter orders where at least one item belongs to this seller
    const sellerOrders = allOrders.filter((order) =>
      order.items && order.items.some((item) => String(item.sellerId) === String(req.user._id))
    );

    res.status(200).json({
      success: true,
      count: sellerOrders.length,
      orders: sellerOrders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await db.orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify authorized user
    const isBuyer = String(order.buyerId) === String(req.user._id);
    const isSeller = order.items.some((item) => String(item.sellerId) === String(req.user._id));
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const order = await db.orders.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const validStatuses = ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status transition.' });
    }

    // If cancelled, restore stock
    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = await db.products.findById(item.productId);
        if (product) {
          await db.products.findByIdAndUpdate(product._id, {
            availableQuantity: product.availableQuantity + item.quantity,
          });
        }
      }
    }

    const updated = await db.orders.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}.`,
      order: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
};

