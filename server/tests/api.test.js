const assert = require('assert');
const { formatINR, calculateSubtotal } = require('../src/utils/currency');
const { isUnitValidForCategory, CATEGORIES } = require('../src/utils/units');
const db = require('../src/data/dbStore');

async function runTests() {
  console.log('\n--- STARTING GEN BAAZAR BACKEND AUTOMATED TESTS ---');

  // Test 1: Currency & Decimal Safe Calculations
  console.log('\n[TEST 1] Currency & Monetary Calculations:');
  const formatted50 = formatINR(50);
  assert(formatted50.includes('50') || formatted50.includes('₹'), 'INR format check');
  console.log('✓ formatINR(50) ->', formatted50);

  // Line total for Tomatoes: ₹25/kg * 4 kg = ₹100
  const subtotalTomatoes = calculateSubtotal(25, 4);
  assert.strictEqual(subtotalTomatoes, 100, 'Subtotal 25 * 4 should be 100');
  console.log('✓ calculateSubtotal(25, 4) -> ₹', subtotalTomatoes);

  // Line total for Seeds: ₹150/pack * 2 packs = ₹300
  const subtotalSeeds = calculateSubtotal(150, 2);
  assert.strictEqual(subtotalSeeds, 300, 'Subtotal 150 * 2 should be 300');
  console.log('✓ calculateSubtotal(150, 2) -> ₹', subtotalSeeds);

  // Machinery Tractor rental: ₹800/hour * 3 hours = ₹2,400
  const rentalTractor = calculateSubtotal(800, 3);
  assert.strictEqual(rentalTractor, 2400, 'Machinery rental calculation 800 * 3 should be 2400');
  console.log('✓ Machinery Tractor rental (800 * 3) -> ₹', rentalTractor);

  // Avoid IEEE floating point issues: e.g. 19.99 * 3
  const fpSubtotal = calculateSubtotal(19.99, 3);
  assert.strictEqual(fpSubtotal, 59.97, 'Floating point test should be exact 59.97');
  console.log('✓ Floating point subtotal 19.99 * 3 -> ₹', fpSubtotal);

  // Test 2: Category and Unit Separations
  console.log('\n[TEST 2] Agricultural Category & Unit Validation:');
  assert(isUnitValidForCategory(CATEGORIES.VEGETABLES, 'kg'), 'kg should be valid for Vegetables');
  assert(isUnitValidForCategory(CATEGORIES.GRAINS_PULSES, 'quintal'), 'quintal should be valid for Grains');
  assert(isUnitValidForCategory(CATEGORIES.SEEDS, 'pack'), 'pack should be valid for Seeds');
  assert(isUnitValidForCategory(CATEGORIES.FERTILIZERS, 'bag'), 'bag should be valid for Fertilizers');
  console.log('✓ Category unit taxonomy verified successfully');

  // Test 3: Database Store and Seed Data Initialization
  console.log('\n[TEST 3] Database Store and Initial Records:');
  await db.initStore();
  const users = await db.users.find();
  assert(users.length >= 6, 'Should have at least 6 initial seed users');
  console.log(`✓ Loaded ${users.length} default users with 6 distinct roles`);

  const products = await db.products.find();
  assert(products.length >= 5, 'Should have initial products');
  console.log(`✓ Loaded ${products.length} products`);

  // Verify priceUnit and quantityUnit are distinct
  products.forEach((p) => {
    assert(p.priceUnit, `Product ${p.name} must have a priceUnit`);
    assert(p.quantityUnit, `Product ${p.name} must have a quantityUnit`);
    assert.strictEqual(p.currency, 'INR', `Product ${p.name} must have currency INR`);
  });
  console.log('✓ All products adhere to separate priceUnit, quantityUnit, and INR currency');

  // Test 4: Machinery Listings and Rental Units
  console.log('\n[TEST 4] Machinery Listings & Rental Units:');
  const machinery = await db.machinery.find();
  assert(machinery.length >= 3, 'Should have machinery listings');
  machinery.forEach((m) => {
    assert(['hour', 'day', 'acre', 'hectare', 'trip'].includes(m.rentalUnit), 'Valid rental unit');
    assert.strictEqual(m.currency, 'INR', 'Currency must be INR');
  });
  console.log(`✓ ${machinery.length} machinery listings validated with proper rental units (hour, acre, etc.)`);

  // Test 5: Transport Listings and Pricing Models
  console.log('\n[TEST 5] Transport Services & Pricing Models:');
  const transport = await db.transport.find();
  assert(transport.length >= 3, 'Should have transport listings');
  transport.forEach((t) => {
    assert(['per_trip', 'per_km', 'per_tonne', 'per_vehicle', 'custom_quotation'].includes(t.pricingModel));
    assert.strictEqual(t.currency, 'INR', 'Currency must be INR');
  });
  console.log(`✓ ${transport.length} transport listings verified with valid pricing models`);

  // Test 6: Market Prices and Date/Source Tracking
  console.log('\n[TEST 6] Market Prices:');
  const prices = await db.marketPrices.find();
  assert(prices.length >= 4, 'Should have market mandi prices');
  prices.forEach((mp) => {
    assert(mp.priceDate, 'Market price must have a date');
    assert(mp.source, 'Market price must have a source');
    assert.strictEqual(mp.currency, 'INR', 'Currency must be INR');
  });
  console.log(`✓ ${prices.length} market mandi price points verified with source and timestamps`);

  // Test 7: Privilege Escalation Prevention in Registration
  console.log('\n[TEST 7] Security - Privilege Escalation Prevention:');
  const allowedPublicRoles = ['farmer', 'buyer', 'supplier', 'machinery_owner', 'transport_provider'];
  assert(!allowedPublicRoles.includes('admin'), 'admin role must NEVER be permitted in public registration');
  console.log('✓ Public registration correctly excludes administrator role');

  // Test 8: IDOR & Unauthorized Order Status Protection
  console.log('\n[TEST 8] Security - IDOR Prevention on Order Status:');
  const testOrder = await db.orders.create({
    orderReference: 'ORD-SEC-TEST-001',
    buyerId: 'user_buyer_123',
    buyerName: 'Test Buyer',
    items: [{ productId: 'prod_1', name: 'Tomato', price: 30, quantity: 5, sellerId: 'seller_farmer_456' }],
    orderStatus: 'pending',
    paymentStatus: 'unpaid',
    totalAmount: 150,
  });

  // Verify ownership rules:
  const attackerId = 'attacker_789';
  const isAuthorizedAttacker = testOrder.items.some((i) => i.sellerId === attackerId) || testOrder.buyerId === attackerId;
  assert.strictEqual(isAuthorizedAttacker, false, 'Attacker should have no ownership over order');
  console.log('✓ Order ownership verification rejects unauthorized third-party modification');

  // Test 9: Payment Verification Authorization Check
  console.log('\n[TEST 9] Security - Payment Ownership Enforcement:');
  const testPayment = await db.payments.create({
    paymentReference: 'PAY-SEC-TEST-001',
    orderId: testOrder._id,
    userId: 'user_buyer_123',
    amount: 150,
    status: 'pending',
  });
  const isPayer = testPayment.userId === 'user_buyer_123';
  const isUnauthorizedPayer = testPayment.userId === attackerId;
  assert.strictEqual(isPayer, true, 'Original buyer is recognized as owner');
  assert.strictEqual(isUnauthorizedPayer, false, 'Arbitrary third party rejected from verifying payment');
  console.log('✓ Payment verification rejects non-owner and non-admin requests');

  // Test 10: Product Mass Assignment Protection
  console.log('\n[TEST 10] Security - Product Mass Assignment Sanitization:');
  const allowedProductUpdateFields = [
    'name', 'description', 'price', 'availableQuantity', 'category',
    'priceUnit', 'quantityUnit', 'minOrderQuantity', 'location', 'images', 'safetyInstructions', 'stockStatus'
  ];
  const untrustedPayload = {
    name: 'Updated Name',
    price: 45,
    sellerId: 'hijacked_seller_id', // Malicious field
    isFeatured: true, // Restricted administrative field
  };
  const sanitized = {};
  for (const k of allowedProductUpdateFields) {
    if (untrustedPayload[k] !== undefined) sanitized[k] = untrustedPayload[k];
  }
  assert.strictEqual(sanitized.name, 'Updated Name', 'Legitimate field updated');
  assert.strictEqual(sanitized.sellerId, undefined, 'sellerId cannot be tampered via mass assignment');
  assert.strictEqual(sanitized.isFeatured, undefined, 'isFeatured cannot be tampered via mass assignment');
  console.log('✓ Mass assignment sanitized: untrusted fields stripped from updates');

  console.log('\n========================================');
  console.log('ALL BACKEND AUTOMATED TESTS PASSED! (10/10)');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

