/**
 * Product image mapping and resolution utility
 * Maps all 40 verified agricultural products across Vegetables, Fruits, Flowers, and Seeds
 * to their dedicated local Wikimedia Commons image files.
 */

export interface ProductImageDefinition {
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Flowers' | 'Seeds' | 'Grains & Cereals' | 'Pulses' | 'Spices' | 'Organic Manure';
  imagePath: string;
  keywords: string[];
}

export const PRODUCT_IMAGE_REGISTRY: ProductImageDefinition[] = [
  // 1. Vegetables (12)
  {
    name: 'Tomato',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/tomato.jpg',
    keywords: ['tomato', 'tomatoes', 'thakkali'],
  },
  {
    name: 'Onion',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/onion.jpg',
    keywords: ['onion', 'onions', 'shallot', 'vengayam', 'sambar onion'],
  },
  {
    name: 'Potato',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/potato.jpg',
    keywords: ['potato', 'potatoes', 'urulaikizhangu', 'aloo'],
  },
  {
    name: 'Carrot',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/carrot.jpg',
    keywords: ['carrot', 'carrots', 'ooty carrot'],
  },
  {
    name: 'Brinjal',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/brinjal.jpg',
    keywords: ['brinjal', 'eggplant', 'kathirikai', 'baingan', 'aubergine'],
  },
  {
    name: 'Cabbage',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/cabbage.jpg',
    keywords: ['cabbage', 'muttakose', 'patta gobhi'],
  },
  {
    name: 'Cauliflower',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/cauliflower.jpg',
    keywords: ['cauliflower', 'gobi', 'phool gobhi'],
  },
  {
    name: 'Beans',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/beans.jpg',
    keywords: ['beans', 'french beans', 'green beans', 'avarai'],
  },
  {
    name: 'Green Chilli',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/green-chilli.jpg',
    keywords: ['green chilli', 'green chili', 'chili pepper', 'pachai milagai'],
  },
  {
    name: 'Ladies Finger',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/ladies-finger.jpg',
    keywords: ['ladies finger', "lady's finger", 'okra', 'bhindi', 'vendakkai'],
  },
  {
    name: 'Drumstick',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/drumstick.jpg',
    keywords: ['drumstick', 'drumsticks', 'moringa', 'murungai'],
  },
  {
    name: 'Beetroot',
    category: 'Vegetables',
    imagePath: '/images/marketplace/vegetables/beetroot.jpg',
    keywords: ['beetroot', 'beet', 'red beet'],
  },

  // 2. Fruits (11)
  {
    name: 'Mango',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/mango.jpg',
    keywords: ['mango', 'mangoes', 'mambazham', 'alphonso', 'banganapalli', 'malgova'],
  },
  {
    name: 'Banana',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/banana.jpg',
    keywords: ['banana', 'bananas', 'vazhaipazham', 'robusta', 'cavendish'],
  },
  {
    name: 'Apple',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/apple.jpg',
    keywords: ['apple', 'apples', 'red apple', 'kashmiri apple'],
  },
  {
    name: 'Orange',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/orange.jpg',
    keywords: ['orange', 'oranges', 'mandarin', 'nagpur orange'],
  },
  {
    name: 'Grapes',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/grapes.jpg',
    keywords: ['grapes', 'grape', 'drakshi', 'paneer grapes'],
  },
  {
    name: 'Papaya',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/papaya.jpg',
    keywords: ['papaya', 'pappali', 'red lady papaya'],
  },
  {
    name: 'Watermelon',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/watermelon.jpg',
    keywords: ['watermelon', 'tharpoosani'],
  },
  {
    name: 'Pineapple',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/pineapple.jpg',
    keywords: ['pineapple', 'annasi'],
  },
  {
    name: 'Guava',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/guava.jpg',
    keywords: ['guava', 'koyyapazham', 'amrood'],
  },
  {
    name: 'Pomegranate',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/pomegranate.jpg',
    keywords: ['pomegranate', 'mathulai', 'anar'],
  },
  {
    name: 'Coconut',
    category: 'Fruits',
    imagePath: '/images/marketplace/fruits/coconut.jpg',
    keywords: ['coconut', 'tender coconut', 'elaneer', 'thengai', 'pollachi coconut'],
  },

  // 3. Flowers (8)
  {
    name: 'Jasmine',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/jasmine.jpg',
    keywords: ['jasmine', 'malli', 'madurai malli', 'gundu malli'],
  },
  {
    name: 'Rose',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/rose.jpg',
    keywords: ['rose', 'roses', 'red rose', 'paneer rose', 'gulab'],
  },
  {
    name: 'Marigold',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/marigold.jpg',
    keywords: ['marigold', 'samandhi', 'chendumalli', 'genda'],
  },
  {
    name: 'Lotus',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/lotus.jpg',
    keywords: ['lotus', 'kamal', 'thamarai'],
  },
  {
    name: 'Chrysanthemum',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/chrysanthemum.jpg',
    keywords: ['chrysanthemum', 'sevvanthi'],
  },
  {
    name: 'Hibiscus',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/hibiscus.jpg',
    keywords: ['hibiscus', 'sembaruthi', 'gudhhal'],
  },
  {
    name: 'Tuberose',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/tuberose.jpg',
    keywords: ['tuberose', 'sampangi', 'rajanigandha'],
  },
  {
    name: 'Sunflower',
    category: 'Flowers',
    imagePath: '/images/marketplace/flowers/sunflower.jpg',
    keywords: ['sunflower', 'sooriyakanthi', 'surajmukhi'],
  },

  // 4. Seeds (9)
  {
    name: 'Paddy Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/paddy-seeds.jpg',
    keywords: ['paddy seeds', 'paddy seed', 'rice seeds', 'rice seed', 'adt 45', 'nel vithai'],
  },
  {
    name: 'Maize Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/maize-seeds.jpg',
    keywords: ['maize seeds', 'maize seed', 'corn seeds', 'corn seed', 'makka cholam'],
  },
  {
    name: 'Groundnut Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/groundnut-seeds.jpg',
    keywords: ['groundnut seeds', 'groundnut seed', 'peanut seeds', 'kadala vithai'],
  },
  {
    name: 'Cotton Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/cotton-seeds.jpg',
    keywords: ['cotton seeds', 'cotton seed', 'paruthi vithai', 'bt cotton'],
  },
  {
    name: 'Sunflower Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/sunflower-seeds.jpg',
    keywords: ['sunflower seeds', 'sunflower seed'],
  },
  {
    name: 'Sesame Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/sesame-seeds.jpg',
    keywords: ['sesame seeds', 'sesame seed', 'ellu', 'til seeds'],
  },
  {
    name: 'Tomato Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/tomato-seeds.jpg',
    keywords: ['tomato seeds', 'tomato seed', 'thakkali vithai'],
  },
  {
    name: 'Chilli Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/chilli-seeds.jpg',
    keywords: ['chilli seeds', 'chilli seed', 'chili seeds', 'teja chilli seeds', 'milagai vithai'],
  },
  {
    name: 'Brinjal Seeds',
    category: 'Seeds',
    imagePath: '/images/marketplace/seeds/brinjal-seeds.jpg',
    keywords: ['brinjal seeds', 'brinjal seed', 'eggplant seeds', 'kathiri vithai'],
  },
];

// Fallback images for any category
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Vegetables: '/categories/vegetables.jpg',
  Fruits: '/categories/fruits.jpg',
  Seeds: '/categories/seeds.jpg',
  Flowers: '/categories/flowers.jpg',
  'Grains & Cereals': '/categories/grains.jpg',
  Pulses: '/categories/pulses.jpg',
  Spices: '/categories/spices.jpg',
  'Organic Manure': '/categories/organic_manure.jpg',
};

/**
 * Resolves the accurate image path for a product by checking:
 * 1. Explicit local path already set in images array
 * 2. Exact match in the 40-product registry
 * 3. Keyword match across product names and keywords
 * 4. High-quality category fallback
 */
export function resolveProductImage(
  productName: string = '',
  category: string = '',
  images?: string[]
): string {
  // If the product already has a verified local image starting with /images/marketplace/, return it
  if (images && images.length > 0 && images[0]) {
    const firstImg = images[0];
    if (firstImg.startsWith('/images/marketplace/') || firstImg.startsWith('/categories/')) {
      return firstImg;
    }
  }

  const cleanName = productName.toLowerCase().trim();

  // 1. Direct registry keyword match
  for (const def of PRODUCT_IMAGE_REGISTRY) {
    if (def.category.toLowerCase() === category.toLowerCase()) {
      for (const kw of def.keywords) {
        if (cleanName.includes(kw)) {
          return def.imagePath;
        }
      }
    }
  }

  // 2. Global keyword match if category is loosely specified
  for (const def of PRODUCT_IMAGE_REGISTRY) {
    for (const kw of def.keywords) {
      if (cleanName.includes(kw)) {
        return def.imagePath;
      }
    }
  }

  // 3. If remote unsplash/uploaded image exists, use it
  if (images && images.length > 0 && images[0] && images[0].startsWith('http')) {
    return images[0];
  }

  // 4. Default to attractive category fallback
  return CATEGORY_FALLBACK_IMAGES[category] || '/categories/vegetables.jpg';
}

