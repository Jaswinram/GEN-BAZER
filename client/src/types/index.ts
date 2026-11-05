export type UserRole =
  | 'farmer'
  | 'buyer'
  | 'supplier'
  | 'machinery_owner'
  | 'transport_provider'
  | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  location: {
    state: string;
    district: string;
    address?: string;
    pincode?: string;
  };
  farmOrBusinessName?: string;
  bio?: string;
  status: 'active' | 'suspended';
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerRole: 'farmer' | 'supplier';
  sellerPhone?: string;
  price: number;
  currency: 'INR';
  priceUnit: string;
  availableQuantity: number;
  quantityUnit: string;
  minOrderQuantity?: number;
  location: {
    state: string;
    district: string;
    villageOrTaluk?: string;
  };
  safetyInstructions?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  isFeatured?: boolean;
  createdAt?: string;
}

export interface MachineryListing {
  _id: string;
  title: string;
  machineryType:
    | 'tractor'
    | 'rotavator'
    | 'cultivator'
    | 'power_tiller'
    | 'combine_harvester'
    | 'paddy_transplanter'
    | 'seed_drill'
    | 'sprayer'
    | 'thresher'
    | 'water_pump'
    | 'tractor_trailer'
    | 'brush_cutter'
    | 'harvester'
    | 'ploughing_equipment'
    | 'other';
  description: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  rentalPrice: number;
  currency: 'INR';
  rentalUnit: 'hour' | 'day' | 'acre' | 'hectare' | 'trip' | 'custom_quotation';
  specifications: {
    horsepower?: string;
    fuelType?: string;
    modelYear?: string;
    attachments?: string[];
  };
  location: {
    state: string;
    district: string;
    town?: string;
  };
  images: string[];
  availabilityStatus: 'available' | 'booked' | 'maintenance';
  bookingRules?: string;
  createdAt?: string;
}

export interface MachineryBooking {
  _id: string;
  machineryId: string;
  machineryTitle: string;
  ownerId: string;
  renterId: string;
  renterName: string;
  renterPhone: string;
  startDate: string;
  endDate: string;
  durationUnits: number;
  unitType: string;
  unitPrice: number;
  totalAmount: number;
  currency: 'INR';
  bookingLocation: {
    state: string;
    district: string;
    address?: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
}

export interface TransportListing {
  _id: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  vehicleName?: string;
  vehicleType:
    | 'bike'
    | 'moped_carrier'
    | 'electric_scooter'
    | 'auto_rickshaw'
    | 'electric_auto'
    | 'mini_three_wheeler'
    | 'mini_pickup'
    | 'cargo_bike'
    | 'mini_truck'
    | 'pickup'
    | 'tractor_trolley';
  vehicleNumber: string;
  carryingCapacityKg: number;
  carryingCapacityTonnes?: number;
  pricingModel: 'per_trip' | 'per_km' | 'custom_quotation' | 'per_tonne' | 'per_vehicle';
  baseRate: number;
  additionalCharges?: number;
  currency: 'INR';
  pickupLocation: {
    state: string;
    district: string;
    town?: string;
  };
  serviceAreas: string[];
  images: string[];
  availabilityStatus: 'available' | 'busy' | 'offline';
  description?: string;
  goodsPermitVerified?: boolean;
  createdAt?: string;
}

export interface TransportBooking {
  _id: string;
  transportListingId: string;
  vehicleName?: string;
  vehicleNumber?: string;
  providerId: string;
  providerName?: string;
  providerPhone?: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  cargoType: string;
  cargoWeightKg: number;
  cargoWeightTonnes?: number;
  pickupTime?: string;
  specialInstructions?: string;
  pricingModel: string;
  vehicleCharge?: number;
  additionalCharges?: number;
  isQuotationRequired: boolean;
  estimatedOrQuotedPrice: number;
  currency: 'INR';
  status:
    | 'pending'
    | 'accepted'
    | 'driver_assigned'
    | 'pickup_completed'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'quoted'
    | 'rejected';
  driverInfo?: {
    name?: string;
    phone?: string;
  };
  providerNotes?: string;
  scheduledDate?: string;
  createdAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: 'INR';
  priceUnit: string;
  quantity: number;
  quantityUnit: string;
  availableQuantity: number;
  minOrderQuantity: number;
  image: string;
  sellerId: string;
  sellerName: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  currency: 'INR';
  priceUnit: string;
  quantity: number;
  quantityUnit: string;
  subtotal: number;
  sellerId: string;
  sellerName?: string;
  image?: string;
}

export interface Order {
  _id: string;
  orderReference: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: OrderItem[];
  subtotalAmount: number;
  deliveryCharges: number;
  taxAmount: number;
  totalAmount: number;
  currency: 'INR';
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    district: string;
    state: string;
    pincode: string;
  };
  orderStatus: 'pending' | 'accepted' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'pending' | 'successful' | 'failed' | 'refunded';
  paymentMethod: 'online_development' | 'cash_on_delivery' | 'mock_gateway';
  paymentReference?: string;
  createdAt?: string;
}

export interface MarketPrice {
  _id: string;
  cropName: string;
  variety: string;
  marketName: string;
  state: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  currency: 'INR';
  priceUnit: 'kg' | 'quintal';
  priceDate: string;
  source: string;
  isVerified: boolean;
}

export interface PlatformReport {
  _id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'product' | 'machinery' | 'transport' | 'user';
  targetId: string;
  targetTitle: string;
  reason: string;
  details?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt?: string;
}

