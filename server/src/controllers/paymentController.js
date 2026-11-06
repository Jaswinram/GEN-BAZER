const db = require('../data/dbStore');
const { formatINR } = require('../utils/currency');

// @desc    Initiate payment for an order
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await db.orders.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (String(order.buyerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized for this order.' });
    }

    if (order.paymentStatus === 'successful') {
      return res.status(400).json({ success: false, message: 'This order is already paid.' });
    }

    const payRef = `PAY-DEV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await db.payments.create({
      paymentReference: payRef,
      orderId: order._id,
      userId: req.user._id,
      amount: order.totalAmount,
      currency: 'INR',
      status: 'pending',
      gateway: 'mock_development_gateway',
      mode: 'development_safe_mode',
      metadata: {
        buyerName: order.buyerName,
        orderReference: order.orderReference,
        initiatedAt: new Date().toISOString(),
        gatewayNotice: 'Safe Test Gateway (No actual bank account debited). Real Razorpay/UPI credentials can be attached in .env',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment session created.',
      payment: {
        paymentReference: payment.paymentReference,
        orderId: order._id,
        orderReference: order.orderReference,
        amount: order.totalAmount,
        currency: 'INR',
        formattedAmount: formatINR(order.totalAmount),
        gateway: 'mock_development_gateway',
        mode: 'development_safe_mode',
        supportedMethods: ['UPI (Google Pay / PhonePe / Paytm Simulation)', 'Net Banking', 'RuPay Debit Card'],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment and update order
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { paymentReference, status = 'successful', simulatedTransactionId } = req.body;

    const payment = await db.payments.findOne({ paymentReference });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment transaction record not found.' });
    }

    // Ownership Verification (Prevent IDOR / Payment Hijacking)
    const isOwner = String(payment.userId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to verify or modify this transaction.',
      });
    }

    const order = await db.orders.findById(payment.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found.' });
    }

    const isSuccessful = status === 'successful';

    // Update payment record
    const updatedPayment = await db.payments.findByIdAndUpdate(
      payment._id,
      {
        status: isSuccessful ? 'successful' : 'failed',
        gatewayPaymentId: simulatedTransactionId || `TXN-SIM-${Date.now()}`,
        'metadata.completedAt': new Date().toISOString(),
      },
      { new: true }
    );

    // Update order payment status
    const updatedOrder = await db.orders.findByIdAndUpdate(
      order._id,
      {
        paymentStatus: isSuccessful ? 'successful' : 'failed',
        paymentReference,
        ...(isSuccessful && order.orderStatus === 'pending' && { orderStatus: 'accepted' }),
      },
      { new: true }
    );

    res.status(200).json({
      success: isSuccessful,
      message: isSuccessful
        ? 'Payment verified successfully in Safe Development Mode. Order is confirmed.'
        : 'Payment transaction failed or was declined.',
      payment: updatedPayment,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:reference
// @access  Private
const getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await db.payments.findOne({ paymentReference: req.params.reference });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment reference not found.' });
    }
    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  getPaymentStatus,
};

