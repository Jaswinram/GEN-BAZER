/**
 * Agricultural units taxonomy and validation
 */

const CATEGORIES = {
  VEGETABLES: 'Vegetables',
  FRUITS: 'Fruits',
  SEEDS: 'Seeds',
  GRAINS_CEREALS: 'Grains & Cereals',
  PULSES: 'Pulses',
  SPICES: 'Spices',
  FLOWERS: 'Flowers',
  ORGANIC_MANURE: 'Organic Manure',
};

// Distinct valid measurement units for each product category
const CATEGORY_UNITS = {
  [CATEGORIES.VEGETABLES]: ['kg', 'quintal', 'g', 'box', 'bag'],
  [CATEGORIES.FRUITS]: ['kg', 'quintal', 'box', 'piece', 'bundle'],
  [CATEGORIES.SEEDS]: ['pack', 'kg', 'g', 'bag'],
  [CATEGORIES.GRAINS_CEREALS]: ['kg', 'quintal', 'bag', 'tonne'],
  [CATEGORIES.PULSES]: ['kg', 'quintal', 'bag', 'pack'],
  [CATEGORIES.SPICES]: ['kg', 'g', 'pack', 'quintal'],
  [CATEGORIES.FLOWERS]: ['kg', 'bundle', 'pack', 'basket'],
  [CATEGORIES.ORGANIC_MANURE]: ['bag', 'kg', 'tonne', 'pack'],
};

// All allowed units across products
const ALL_QUANTITY_UNITS = [
  'kg',
  'quintal',
  'tonne',
  'g',
  'litre',
  'ml',
  'bag',
  'pack',
  'box',
  'piece',
  'item',
  'bundle',
  'unit',
  'set',
  'bottle',
];

// Machinery rental units
const MACHINERY_RENTAL_UNITS = ['hour', 'day', 'acre', 'hectare', 'trip'];

// Transport pricing models
const TRANSPORT_PRICING_MODELS = [
  'per_trip',
  'per_km',
  'per_tonne',
  'per_vehicle',
  'custom_quotation',
];

// Role definitions
const USER_ROLES = {
  FARMER: 'farmer',
  BUYER: 'buyer',
  SUPPLIER: 'supplier',
  MACHINERY_OWNER: 'machinery_owner',
  TRANSPORT_PROVIDER: 'transport_provider',
  ADMIN: 'admin',
};

/**
 * Validates if the selected unit is valid for given category
 */
function isUnitValidForCategory(category, unit) {
  const allowed = CATEGORY_UNITS[category];
  if (!allowed) return ALL_QUANTITY_UNITS.includes(unit);
  return allowed.includes(unit);
}

module.exports = {
  CATEGORIES,
  CATEGORY_UNITS,
  ALL_QUANTITY_UNITS,
  MACHINERY_RENTAL_UNITS,
  TRANSPORT_PRICING_MODELS,
  USER_ROLES,
  isUnitValidForCategory,
};

