const db = require('../data/dbStore');
const { calculateSubtotal } = require('../utils/currency');

// @desc    Get all machinery listings with rich filters & sorting
// @route   GET /api/machinery
// @access  Public
const getMachinery = async (req, res, next) => {
  try {
    const { machineryType, district, rentalUnit, search, minPrice, maxPrice, availabilityStatus, sort } = req.query;

    let list = await db.machinery.find({});

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.machineryType.toLowerCase().includes(q) ||
          m.location?.town?.toLowerCase().includes(q) ||
          m.location?.district?.toLowerCase().includes(q) ||
          m.ownerName.toLowerCase().includes(q)
      );
    }

    if (machineryType && machineryType !== 'All') {
      list = list.filter((m) => m.machineryType.toLowerCase() === machineryType.toLowerCase());
    }

    if (district && district !== 'All') {
      list = list.filter((m) => m.location?.district?.toLowerCase() === district.toLowerCase());
    }

    if (rentalUnit && rentalUnit !== 'All') {
      list = list.filter((m) => m.rentalUnit === rentalUnit);
    }

    if (availabilityStatus && availabilityStatus !== 'All') {
      list = list.filter((m) => m.availabilityStatus === availabilityStatus);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      list = list.filter((m) => m.rentalPrice >= Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      list = list.filter((m) => m.rentalPrice <= Number(maxPrice));
    }

    // Sorting
    if (sort === 'price_asc') {
      list.sort((a, b) => a.rentalPrice - b.rentalPrice);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.rentalPrice - a.rentalPrice);
    } else {
      // Default: newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    res.status(200).json({
      success: true,
      count: list.length,
      machinery: list,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single machinery details
// @route   GET /api/machinery/:id
// @access  Public
const getMachineryById = async (req, res, next) => {
  try {
    const item = await db.machinery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }
    res.status(200).json({ success: true, machinery: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Create machinery listing
// @route   POST /api/machinery
// @access  Private (Machinery Owner, Admin)
const createMachinery = async (req, res, next) => {
  try {
    const {
      title,
      machineryType,
      description,
      rentalPrice,
      rentalUnit,
      specifications,
      location,
      images,
      bookingRules,
    } = req.body;

    if (!title || !machineryType || !description || rentalPrice === undefined || !rentalUnit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, machineryType, description, rentalPrice, and rentalUnit.',
      });
    }

    const newMachinery = await db.machinery.create({
      title: title.trim(),
      machineryType,
      description: description.trim(),
      ownerId: req.user._id,
      ownerName: req.user.name,
      ownerPhone: req.user.phone,
      rentalPrice: Number(rentalPrice),
      currency: 'INR',
      rentalUnit,
      specifications: {
        horsepower: specifications?.horsepower || '',
        fuelType: specifications?.fuelType || 'Diesel',
        modelYear: specifications?.modelYear || '',
        attachments: specifications?.attachments || [],
      },
      location: {
        state: location?.state || 'Tamil Nadu',
        district: location?.district || 'Coimbatore',
        town: location?.town || '',
      },
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&auto=format&fit=crop&q=80'
      ],
      bookingRules: bookingRules || 'Operator included. Fuel cost according to distance.',
      availabilityStatus: 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Machinery listing created successfully.',
      machinery: newMachinery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book machinery
// @route   POST /api/machinery/:id/book
// @access  Private (Farmer, Buyer, etc.)
const bookMachinery = async (req, res, next) => {
  try {
    const { startDate, endDate, durationUnits, bookingLocation, notes } = req.body;

    const machine = await db.machinery.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machinery listing not found.' });
    }

    if (machine.availabilityStatus === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'This machine is currently under maintenance and cannot be reserved.',
      });
    }

    const duration = Number(durationUnits) || 1;
    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration units must be greater than zero.',
      });
    }

    // Check existing accepted bookings for date collision
    const existingBookings = await db.machineryBookings.find({
      machineryId: machine._id,
      status: 'accepted',
    });

    const reqStart = new Date(startDate || Date.now());
    const reqEnd = new Date(endDate || Date.now());

    const hasConflict = existingBookings.some((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return (reqStart <= bEnd && reqEnd >= bStart);
    });

    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'This machinery is already reserved by another farmer for the selected dates. Please choose different dates.',
      });
    }

    // Calculate validated total amount on server
    const totalAmount = calculateSubtotal(machine.rentalPrice, duration);

    const booking = await db.machineryBookings.create({
      machineryId: machine._id,
      machineryTitle: machine.title,
      ownerId: machine.ownerId,
      renterId: req.user._id,
      renterName: req.user.name,
      renterPhone: req.user.phone,
      startDate: reqStart,
      endDate: reqEnd,
      durationUnits: duration,
      unitType: machine.rentalUnit,
      unitPrice: machine.rentalPrice,
      totalAmount,
      currency: 'INR',
      bookingLocation: {
        state: bookingLocation?.state || req.user.location?.state || 'Tamil Nadu',
        district: bookingLocation?.district || req.user.location?.district || 'Coimbatore',
        address: bookingLocation?.address || '',
      },
      status: 'pending',
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Machinery rental request submitted to owner.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's machinery bookings (as renter)
// @route   GET /api/machinery/bookings/my
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await db.machineryBookings.find({ renterId: req.user._id });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incoming bookings for machinery owner
// @route   GET /api/machinery/bookings/owner
// @access  Private (Machinery Owner, Admin)
const getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await db.machineryBookings.find({ ownerId: req.user._id });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (accept, reject, complete, cancel)
// @route   PATCH /api/machinery/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await db.machineryBookings.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isOwner = String(booking.ownerId) === String(req.user._id);
    const isRenter = String(booking.renterId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isRenter && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (isRenter && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Renters can only cancel bookings.' });
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    const updated = await db.machineryBookings.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Machinery booking status changed to ${status}.`,
      booking: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMachinery,
  getMachineryById,
  createMachinery,
  bookMachinery,
  getMyBookings,
  getOwnerBookings,
  updateBookingStatus,
};

