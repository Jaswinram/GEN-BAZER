const db = require('../data/dbStore');
const { calculateSubtotal } = require('../utils/currency');

// @desc    Get all transport listings with payload and location filters
// @route   GET /api/transport
// @access  Public
const getTransportListings = async (req, res, next) => {
  try {
    const { vehicleType, pricingModel, district, search, pickupLocation, deliveryLocation, weightKg } = req.query;

    let list = await db.transport.find({});

    // Filter by goods weight (in kg) — must NOT exceed vehicle verified payload capacity
    if (weightKg && Number(weightKg) > 0) {
      const requiredWeight = Number(weightKg);
      list = list.filter((t) => {
        const capacity = t.carryingCapacityKg || (t.carryingCapacityTonnes ? t.carryingCapacityTonnes * 1000 : 0);
        return capacity >= requiredWeight;
      });
    }

    // Filter by pickup location
    if (pickupLocation && pickupLocation.trim()) {
      const p = pickupLocation.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.pickupLocation?.town?.toLowerCase().includes(p) ||
          t.pickupLocation?.district?.toLowerCase().includes(p) ||
          t.serviceAreas.some((area) => area.toLowerCase().includes(p))
      );
    }

    // Filter by delivery location
    if (deliveryLocation && deliveryLocation.trim()) {
      const d = deliveryLocation.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.serviceAreas.some((area) => area.toLowerCase().includes(d)) ||
          t.pickupLocation?.district?.toLowerCase().includes(d)
      );
    }

    // General text search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.vehicleName && t.vehicleName.toLowerCase().includes(q)) ||
          t.vehicleType.toLowerCase().includes(q) ||
          t.vehicleNumber.toLowerCase().includes(q) ||
          t.providerName.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.serviceAreas.some((area) => area.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (vehicleType && vehicleType !== 'All') {
      list = list.filter((t) => t.vehicleType.toLowerCase() === vehicleType.toLowerCase());
    }

    // Pricing model filter
    if (pricingModel && pricingModel !== 'All') {
      list = list.filter((t) => t.pricingModel === pricingModel);
    }

    // District filter
    if (district && district !== 'All') {
      list = list.filter(
        (t) =>
          t.pickupLocation?.district?.toLowerCase() === district.toLowerCase() ||
          t.serviceAreas.some((a) => a.toLowerCase() === district.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      count: list.length,
      transport: list,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transport listing
// @route   GET /api/transport/:id
// @access  Public
const getTransportById = async (req, res, next) => {
  try {
    const item = await db.transport.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Transport listing not found.' });
    }
    res.status(200).json({ success: true, transport: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Create transport vehicle listing
// @route   POST /api/transport
// @access  Private (Transport Provider, Admin)
const createTransportListing = async (req, res, next) => {
  try {
    const {
      vehicleName,
      vehicleType,
      vehicleNumber,
      carryingCapacityKg,
      pricingModel,
      baseRate,
      additionalCharges,
      pickupLocation,
      serviceAreas,
      images,
      description,
    } = req.body;

    if (!vehicleType || !vehicleNumber || !carryingCapacityKg || !pricingModel || baseRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicleType, vehicleNumber, verified payload capacity in kg, pricingModel, and baseRate.',
      });
    }

    const capacityKg = Number(carryingCapacityKg);
    const newListing = await db.transport.create({
      providerId: req.user._id,
      providerName: req.user.name,
      providerPhone: req.user.phone,
      vehicleName: vehicleName || `${vehicleType.replace('_', ' ')} (${capacityKg} kg)`,
      vehicleType,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      carryingCapacityKg: capacityKg,
      carryingCapacityTonnes: capacityKg / 1000,
      pricingModel,
      baseRate: Number(baseRate),
      additionalCharges: Number(additionalCharges || 0),
      currency: 'INR',
      pickupLocation: {
        state: pickupLocation?.state || 'Tamil Nadu',
        district: pickupLocation?.district || req.user.location?.district || 'Salem',
        town: pickupLocation?.town || '',
      },
      serviceAreas: Array.isArray(serviceAreas) && serviceAreas.length > 0 ? serviceAreas : ['Tamil Nadu Statewide'],
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
      ],
      availabilityStatus: 'available',
      goodsPermitVerified: true,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Transport vehicle registered successfully.',
      transport: newListing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request transport or custom quotation
// @route   POST /api/transport/:id/request
// @access  Private
const requestTransport = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      pickupAddress,
      deliveryAddress,
      cargoType,
      cargoWeightKg,
      pickupTime,
      specialInstructions,
      distanceKm,
      scheduledDate,
    } = req.body;

    const vehicle = await db.transport.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Transport listing not found.' });
    }

    if (!pickupAddress || !deliveryAddress || !cargoType || !cargoWeightKg) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pickup address, delivery address, goods description, and goods weight in kg.',
      });
    }

    const weightKg = Number(cargoWeightKg);
    const vehicleMaxCapacityKg = vehicle.carryingCapacityKg || (vehicle.carryingCapacityTonnes ? vehicle.carryingCapacityTonnes * 1000 : 0);

    // Strict validation: Never allow a booking to exceed the vehicle's permitted payload
    if (weightKg > vehicleMaxCapacityKg) {
      return res.status(400).json({
        success: false,
        message: `Goods weight (${weightKg} kg) exceeds vehicle's verified carrying capacity (${vehicleMaxCapacityKg} kg). Please choose a higher capacity vehicle.`,
      });
    }

    let vehicleCharge = 0;
    let additionalCharges = vehicle.additionalCharges || 0;
    let estimatedPrice = 0;
    let isQuotationRequired = false;

    // Calculate transparently depending on pricing model
    switch (vehicle.pricingModel) {
      case 'per_trip':
        vehicleCharge = vehicle.baseRate;
        estimatedPrice = vehicleCharge + additionalCharges;
        break;
      case 'per_km':
        const distance = Number(distanceKm) > 0 ? Number(distanceKm) : 10;
        vehicleCharge = calculateSubtotal(vehicle.baseRate, distance);
        estimatedPrice = vehicleCharge + additionalCharges;
        break;
      case 'custom_quotation':
      default:
        isQuotationRequired = true;
        vehicleCharge = 0;
        estimatedPrice = 0;
        break;
    }

    const booking = await db.transportBookings.create({
      transportListingId: vehicle._id,
      vehicleName: vehicle.vehicleName || vehicle.vehicleType,
      vehicleNumber: vehicle.vehicleNumber,
      providerId: vehicle.providerId,
      providerName: vehicle.providerName,
      providerPhone: vehicle.providerPhone || '',
      requesterId: req.user._id,
      requesterName: customerName || req.user.name,
      requesterPhone: customerPhone || req.user.phone || '',
      pickupAddress: pickupAddress.trim(),
      deliveryAddress: deliveryAddress.trim(),
      cargoType: cargoType.trim(),
      cargoWeightKg: weightKg,
      cargoWeightTonnes: weightKg / 1000,
      pickupTime: pickupTime || '',
      specialInstructions: specialInstructions || '',
      pricingModel: vehicle.pricingModel,
      vehicleCharge,
      additionalCharges,
      isQuotationRequired,
      estimatedOrQuotedPrice: estimatedPrice,
      currency: 'INR',
      status: 'pending',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: isQuotationRequired
        ? 'Quotation request submitted to transport provider.'
        : 'Transport request submitted successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's transport requests
// @route   GET /api/transport/requests/my
// @access  Private
const getMyRequests = async (req, res, next) => {
  try {
    const list = await db.transportBookings.find({ requesterId: req.user._id });
    res.status(200).json({ success: true, count: list.length, requests: list });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transport provider's incoming requests
// @route   GET /api/transport/requests/provider
// @access  Private (Transport Provider, Admin)
const getProviderRequests = async (req, res, next) => {
  try {
    const list = await db.transportBookings.find({ providerId: req.user._id });
    res.status(200).json({ success: true, count: list.length, requests: list });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transport request status or quote price
// @route   PATCH /api/transport/requests/:id
// @access  Private
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, quotedPrice, providerNotes, driverInfo } = req.body;
    const booking = await db.transportBookings.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const isProvider = String(booking.providerId) === String(req.user._id);
    const isRequester = String(booking.requesterId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isProvider && !isRequester && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Cancellation rule: requester can cancel only if status is pending or accepted
    if (isRequester && !isProvider && !isAdmin && status === 'cancelled') {
      if (!['pending', 'accepted'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a transport booking that is already in '${booking.status}' state.`,
        });
      }
    }

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (providerNotes !== undefined) updatePayload.providerNotes = providerNotes;
    if (driverInfo) updatePayload.driverInfo = driverInfo;
    if (quotedPrice !== undefined && isProvider) {
      updatePayload.estimatedOrQuotedPrice = Number(quotedPrice);
      updatePayload.status = 'quoted';
    }

    const updated = await db.transportBookings.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

    res.status(200).json({
      success: true,
      message: 'Transport request updated successfully.',
      booking: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransportListings,
  getTransportById,
  createTransportListing,
  requestTransport,
  getMyRequests,
  getProviderRequests,
  updateRequestStatus,
};


