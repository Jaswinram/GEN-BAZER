const db = require('../data/dbStore');

// @desc    Get comprehensive platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getPlatformStats = async (req, res, next) => {
  try {
    const users = await db.users.find({});
    const products = await db.products.find({});
    const machinery = await db.machinery.find({});
    const transport = await db.transport.find({});
    const orders = await db.orders.find({});
    const machineryBookings = await db.machineryBookings.find({});
    const transportBookings = await db.transportBookings.find({});
    const reports = await db.reports.find({});

    const usersByRole = {
      farmer: 0,
      buyer: 0,
      supplier: 0,
      machinery_owner: 0,
      transport_provider: 0,
      admin: 0,
    };

    users.forEach((u) => {
      if (usersByRole[u.role] !== undefined) {
        usersByRole[u.role]++;
      }
    });

    let totalSalesINR = 0;
    orders.forEach((o) => {
      if (o.paymentStatus === 'successful' || o.orderStatus === 'delivered') {
        totalSalesINR += Number(o.totalAmount) || 0;
      }
    });

    let totalMachineryRentalINR = 0;
    machineryBookings.forEach((b) => {
      if (b.status === 'accepted' || b.status === 'completed') {
        totalMachineryRentalINR += Number(b.totalAmount) || 0;
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: users.length,
        usersByRole,
        totalProducts: products.length,
        totalMachinery: machinery.length,
        totalTransportVehicles: transport.length,
        totalOrders: orders.length,
        totalSalesINR: Math.round(totalSalesINR),
        totalMachineryBookings: machineryBookings.length,
        totalMachineryRentalINR: Math.round(totalMachineryRentalINR),
        totalTransportRequests: transportBookings.length,
        openReports: reports.filter((r) => r.status === 'open').length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await db.users.find({});
    const cleanUsers = users.map((u) => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });

    res.status(200).json({
      success: true,
      count: cleanUsers.length,
      users: cleanUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (active / suspended)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await db.users.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const clean = { ...updated };
    delete clean.password;

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
      user: clean,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports / complaints
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getReports = async (req, res, next) => {
  try {
    const reports = await db.reports.find({});
    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PATCH /api/admin/reports/:id
// @access  Private (Admin only)
const updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const updated = await db.reports.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Report updated.',
      report: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user report/complaint
// @route   POST /api/admin/reports
// @access  Private
const submitReport = async (req, res, next) => {
  try {
    const { targetType, targetId, targetTitle, reason, details } = req.body;
    if (!targetType || !targetId || !targetTitle || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all report details.' });
    }

    const report = await db.reports.create({
      reporterId: req.user._id,
      reporterName: req.user.name,
      targetType,
      targetId,
      targetTitle,
      reason,
      details: details || '',
      status: 'open',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted for administrator review.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers,
  updateUserStatus,
  getReports,
  updateReport,
  submitReport,
};

