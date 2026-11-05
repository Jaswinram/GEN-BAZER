export type Language = 'en' | 'ta';

export interface TranslationDictionary {
  brandName: string;
  tagline: string;
  navHome: string;
  navProducts: string;
  navMachinery: string;
  navTransport: string;
  navMarketPrices: string;
  navDashboard: string;
  navLogin: string;
  navRegister: string;
  navCart: string;
  navLogout: string;
  searchPlaceholder: string;
  voiceSearchPrompt: string;
  listening: string;
  speechNotSupported: string;
  searchBtn: string;
  categoryAll: string;
  featuredProducts: string;
  recentlyAdded: string;
  machineryRentals: string;
  transportServices: string;
  marketMandiPrices: string;
  viewAll: string;
  perUnit: string;
  availableStock: string;
  addToCart: string;
  addedToCart: string;
  buyNow: string;
  minOrder: string;
  bookNow: string;
  requestTransport: string;
  requestQuotation: string;
  seller: string;
  owner: string;
  provider: string;
  location: string;
  price: string;
  quantity: string;
  subtotal: string;
  deliveryCharges: string;
  total: string;
  emptyCart: string;
  emptyCartPrompt: string;
  checkout: string;
  placeOrder: string;
  payNow: string;
  paymentModeNotice: string;
  safeTestPayment: string;
  orderSuccess: string;
  orderRef: string;
  statusPending: string;
  statusAccepted: string;
  statusShipped: string;
  statusDelivered: string;
  statusCancelled: string;
  roleFarmer: string;
  roleBuyer: string;
  roleSupplier: string;
  roleMachineryOwner: string;
  roleTransportProvider: string;
  roleAdmin: string;
  farmerBenefitTitle: string;
  farmerBenefitDesc: string;
  buyerBenefitTitle: string;
  buyerBenefitDesc: string;
  machineryBenefitTitle: string;
  machineryBenefitDesc: string;
  transportBenefitTitle: string;
  transportBenefitDesc: string;
  footerRights: string;
  safetyInstructions: string;
  currencyNote: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    brandName: 'Gen Baazar',
    tagline: 'Direct Agricultural Marketplace & Farming Services Ecosystem',
    navHome: 'Home',
    navProducts: 'Marketplace',
    navMachinery: 'Machinery Rentals',
    navTransport: 'Transport',
    navMarketPrices: 'Mandi Prices',
    navDashboard: 'Dashboard',
    navLogin: 'Login',
    navRegister: 'Register',
    navCart: 'Cart',
    navLogout: 'Logout',
    searchPlaceholder: 'Search fresh crops, seeds, machinery, trucks...',
    voiceSearchPrompt: 'Click microphone to speak (Tamil or English)',
    listening: 'Listening... Please speak your search query',
    speechNotSupported: 'Speech recognition is not supported in this browser.',
    searchBtn: 'Search',
    categoryAll: 'All Categories',
    featuredProducts: 'Featured Farm Harvest & Inputs',
    recentlyAdded: 'Recently Listed Products',
    machineryRentals: 'Agricultural Machinery for Rent',
    transportServices: 'Farm-to-Mandi Transport Services',
    marketMandiPrices: 'Live Wholesale Mandi Benchmark Rates',
    viewAll: 'View All',
    perUnit: 'per',
    availableStock: 'Available Stock',
    addToCart: 'Add to Cart',
    addedToCart: 'Added to Cart',
    buyNow: 'Buy Now',
    minOrder: 'Min. Order',
    bookNow: 'Book Machinery',
    requestTransport: 'Book Vehicle',
    requestQuotation: 'Request Quotation',
    seller: 'Seller',
    owner: 'Owner',
    provider: 'Provider',
    location: 'Location',
    price: 'Price',
    quantity: 'Quantity',
    subtotal: 'Subtotal',
    deliveryCharges: 'Delivery / Transit Fee',
    total: 'Grand Total',
    emptyCart: 'Your cart is empty',
    emptyCartPrompt: 'Discover fresh produce directly from farmers & verified suppliers.',
    checkout: 'Proceed to Checkout',
    placeOrder: 'Confirm & Place Order',
    payNow: 'Pay with Safe Test Gateway',
    paymentModeNotice: 'Development Safe Mode: Simulates instant payment confirmation without real bank deduction.',
    safeTestPayment: 'Simulate UPI / Net Banking Payment',
    orderSuccess: 'Order Placed Successfully!',
    orderRef: 'Order Reference',
    statusPending: 'Pending',
    statusAccepted: 'Accepted',
    statusShipped: 'Shipped',
    statusDelivered: 'Delivered',
    statusCancelled: 'Cancelled',
    roleFarmer: 'Farmer',
    roleBuyer: 'Merchant / Buyer',
    roleSupplier: 'Agri Supplier',
    roleMachineryOwner: 'Machinery Provider',
    roleTransportProvider: 'Transport Logistics',
    roleAdmin: 'Administrator',
    farmerBenefitTitle: 'Direct Farmer Earnings',
    farmerBenefitDesc: 'Sell harvest directly to commercial buyers at fair transparent prices without middleman cuts.',
    buyerBenefitTitle: 'Fresh Harvest Quality',
    buyerBenefitDesc: 'Source fresh farm crops directly from fields with verified quantity and origin traceability.',
    machineryBenefitTitle: 'Affordable Mechanization',
    machineryBenefitDesc: 'Rent tractors, combine harvesters, and tilling implements on-demand per hour or acre.',
    transportBenefitTitle: 'Reliable Agri Logistics',
    transportBenefitDesc: 'Find dedicated mini trucks and multi-axle freight to transport produce quickly to mandis.',
    footerRights: 'All rights reserved. Dedicated to empowered Indian agriculture.',
    safetyInstructions: 'Safety & Usage Guidelines',
    currencyNote: 'All prices in Indian Rupees (₹ / INR).',
  },
  ta: {
    brandName: 'ஜென் பஜார்',
    tagline: 'விவசாயிகள் மற்றும் வர்த்தகர்களுக்கான நேரடி சந்தை தளம்',
    navHome: 'முகப்பு',
    navProducts: 'சந்தை பொருட்கள்',
    navMachinery: 'இயந்திர வாடகை',
    navTransport: 'சரக்கு போக்குவரத்து',
    navMarketPrices: 'மண்டி விலை நிலவரம்',
    navDashboard: 'டாஷ்போர்டு',
    navLogin: 'உள்நுழைக',
    navRegister: 'பதிவு செய்க',
    navCart: 'கூடை',
    navLogout: 'வெளியேறு',
    searchPlaceholder: 'பயிர்கள், விதைகள், உழவு இயந்திரங்கள், லாரிகள் தேடுக...',
    voiceSearchPrompt: 'குரல் மூலம் தேட மைக்கை அழுத்தவும்',
    listening: 'கேட்கிறது... தேட வேண்டியதை பேசுங்கள்',
    speechNotSupported: 'இந்த உலாவியில் குரல் தேடல் ஆதரிக்கப்படவில்லை.',
    searchBtn: 'தேடுக',
    categoryAll: 'அனைத்து பிரிவுகள்',
    featuredProducts: 'சிறப்பு விவசாய விளைபொருட்கள்',
    recentlyAdded: 'புதிய விளைபொருட்கள்',
    machineryRentals: 'விவசாய இயந்திரங்கள் வாடகைக்கு',
    transportServices: 'விளைபொருள் போக்குவரத்து சேவைகள்',
    marketMandiPrices: 'மொத்த விற்பனை மண்டி விலை நிலவரம்',
    viewAll: 'அனைத்தும் காண்க',
    perUnit: 'ஒரு',
    availableStock: 'கையிருப்பு அளவு',
    addToCart: 'கூடையில் சேர்',
    addedToCart: 'சேர்க்கப்பட்டது',
    buyNow: 'இப்போதே வாங்கு',
    minOrder: 'குறைந்தபட்ச கொள்முதல்',
    bookNow: 'வாடகைக்கு பதிவு செய்',
    requestTransport: 'வாகனம் பதிவு செய்',
    requestQuotation: 'விலைப்புள்ளி கோருக',
    seller: 'விற்பனையாளர்',
    owner: 'உரிமையாளர்',
    provider: 'சேவை வழங்குநர்',
    location: 'இடம்',
    price: 'விலை',
    quantity: 'அளவு',
    subtotal: 'கூட்டுத்தொகை',
    deliveryCharges: 'போக்குவரத்து கட்டணம்',
    total: 'மொத்த தொகை',
    emptyCart: 'உங்கள் கூடை காலியாக உள்ளது',
    emptyCartPrompt: 'விவசாயிகளிடமிருந்து நேரடியாக புதிய விளைபொருட்களை வாங்கவும்.',
    checkout: 'பணம் செலுத்த செல்க',
    placeOrder: 'ஆர்டரை உறுதிப்படுத்துக',
    payNow: 'பாதுகாப்பான சோதனை வழியில் செலுத்தவும்',
    paymentModeNotice: 'சோதனை முறை: வங்கி கணக்கிலிருந்து பணம் எடுக்கப்படாமல் மாதிரி பரிவர்த்தனை செய்யப்படுகிறது.',
    safeTestPayment: 'மாதிரி UPI / நெட் பேங்கிங் மூலம் செலுத்துக',
    orderSuccess: 'ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டது!',
    orderRef: 'ஆர்டர் எண்',
    statusPending: 'நிலுவையில்',
    statusAccepted: 'ஏற்றுக்கொள்ளப்பட்டது',
    statusShipped: 'அனுப்பப்பட்டது',
    statusDelivered: 'வழங்கப்பட்டது',
    statusCancelled: 'ரத்து செய்யப்பட்டது',
    roleFarmer: 'விவசாயி',
    roleBuyer: 'வணிகர் / வாங்குபவர்',
    roleSupplier: 'விவசாய இடுபொருள் விற்பனையாளர்',
    roleMachineryOwner: 'இயந்திர உரிமையாளர்',
    roleTransportProvider: 'போக்குவரத்து சேவை',
    roleAdmin: 'நிர்வாகி',
    farmerBenefitTitle: 'விவசாயிகளுக்கு நேரடி லாபம்',
    farmerBenefitDesc: 'இடைத்தரகர்கள் இன்றி விளைபொருட்களுக்கு நியாயமான விலையை நேரடியாக பெறுங்கள்.',
    buyerBenefitTitle: 'தரமான புதிய விளைபொருட்கள்',
    buyerBenefitDesc: 'நேரடியாக விளைநிலங்களில் இருந்து புதிய காய்கறிகள் மற்றும் தானியங்களை வாங்குங்கள்.',
    machineryBenefitTitle: 'குறைந்த வாடகையில் நவீன இயந்திரங்கள்',
    machineryBenefitDesc: 'டிராக்டர், நெல் அறுவடை இயந்திரங்களை மணிநேரம் அல்லது ஏக்கர் கணக்கில் வாடகைக்கு பெறுங்கள்.',
    transportBenefitTitle: 'நம்பகமான சரக்கு போக்குவரத்து',
    transportBenefitDesc: 'விளைபொருட்களை சரியான நேரத்தில் சந்தைக்கு எடுத்துச் செல்ல மினி லாரிகள் மற்றும் சரக்கு வாகனங்கள்.',
    footerRights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. இந்திய விவசாய மேம்பாட்டிற்காக அர்ப்பணிக்கப்பட்டது.',
    safetyInstructions: 'பாதுகாப்பு & பயன்பாட்டு வழிகாட்டுதல்',
    currencyNote: 'விலைகள் அனைத்தும் இந்திய ரூபாயில் (₹ / INR).',
  },
};

