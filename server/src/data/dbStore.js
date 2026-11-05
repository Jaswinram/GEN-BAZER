const mongoose = require('mongoose');
const { getInitialData } = require('./seedData');

// Collection stores for memory mode
const memoryStore = {
  users: [],
  products: [],
  machinery: [],
  transport: [],
  marketPrices: [],
  orders: [],
  machineryBookings: [],
  transportBookings: [],
  payments: [],
  reports: [],
  isInitialized: false,
  isMongooseActive: false,
};

function generateId() {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.floor(Math.random() * 16)).toString(16)).toLowerCase();
}

async function initStore() {
  if (memoryStore.isInitialized) return;
  const initial = await getInitialData();
  memoryStore.users = [...initial.users];
  memoryStore.products = [...initial.products];
  memoryStore.machinery = [...initial.machinery];
  memoryStore.transport = [...initial.transport];
  memoryStore.marketPrices = [...initial.marketPrices];
  memoryStore.orders = [...initial.orders];
  memoryStore.machineryBookings = [...initial.machineryBookings];
  memoryStore.transportBookings = [...initial.transportBookings];
  memoryStore.reports = [...initial.reports];
  memoryStore.isInitialized = true;
  console.log('[Gen Baazar DB] In-Memory / Hybrid store initialized with standard seed data.');
}

// Check if mongoose is actively connected
function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

const db = {
  initStore,
  generateId,

  // Users
  users: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('User').find(filter);
      }
      return memoryStore.users.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      });
    },
    async findOne(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('User').findOne(filter);
      }
      return memoryStore.users.find((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]).toLowerCase() !== String(filter[key]).toLowerCase()) return false;
        }
        return true;
      }) || null;
    },
    async findById(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('User').findById(id);
      }
      return memoryStore.users.find((item) => String(item._id) === String(id)) || null;
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('User').create(data);
      }
      const record = {
        _id: generateId(),
        ...data,
        status: data.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.users.push(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('User').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.users.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.users[index] = {
        ...memoryStore.users[index],
        ...update,
        updatedAt: new Date(),
      };
      return memoryStore.users[index];
    },
    async countDocuments(filter = {}) {
      const list = await this.find(filter);
      return list.length;
    },
  },

  // Products
  products: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Product').find(filter).sort({ createdAt: -1 });
      }
      return memoryStore.products.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (filter[key] && typeof filter[key] === 'object' && filter[key].$regex) {
            const regex = new RegExp(filter[key].$regex, filter[key].$options || 'i');
            if (!regex.test(item[key])) return false;
          } else if (String(item[key]) !== String(filter[key])) {
            return false;
          }
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Product').findById(id);
      }
      return memoryStore.products.find((item) => String(item._id) === String(id)) || null;
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Product').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        stockStatus: data.availableQuantity <= 0 ? 'out_of_stock' : data.availableQuantity <= 5 ? 'low_stock' : 'in_stock',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.products.unshift(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Product').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.products.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      const updated = {
        ...memoryStore.products[index],
        ...update,
        currency: 'INR',
        updatedAt: new Date(),
      };
      if (updated.availableQuantity <= 0) {
        updated.stockStatus = 'out_of_stock';
      } else if (updated.availableQuantity <= 5) {
        updated.stockStatus = 'low_stock';
      } else {
        updated.stockStatus = 'in_stock';
      }
      memoryStore.products[index] = updated;
      return updated;
    },
    async findByIdAndDelete(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Product').findByIdAndDelete(id);
      }
      const index = memoryStore.products.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      const [removed] = memoryStore.products.splice(index, 1);
      return removed;
    },
    async countDocuments(filter = {}) {
      const list = await this.find(filter);
      return list.length;
    },
  },

  // Machinery
  machinery: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryListing').find(filter).sort({ createdAt: -1 });
      }
      return memoryStore.machinery.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryListing').findById(id);
      }
      return memoryStore.machinery.find((item) => String(item._id) === String(id)) || null;
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryListing').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        availabilityStatus: data.availabilityStatus || 'available',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.machinery.unshift(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryListing').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.machinery.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.machinery[index] = {
        ...memoryStore.machinery[index],
        ...update,
        currency: 'INR',
        updatedAt: new Date(),
      };
      return memoryStore.machinery[index];
    },
    async countDocuments(filter = {}) {
      const list = await this.find(filter);
      return list.length;
    },
  },

  // Machinery Bookings
  machineryBookings: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryBooking').find(filter).sort({ createdAt: -1 });
      }
      return memoryStore.machineryBookings.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryBooking').findById(id);
      }
      return memoryStore.machineryBookings.find((item) => String(item._id) === String(id)) || null;
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryBooking').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        status: 'pending',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.machineryBookings.unshift(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MachineryBooking').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.machineryBookings.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.machineryBookings[index] = {
        ...memoryStore.machineryBookings[index],
        ...update,
        updatedAt: new Date(),
      };
      return memoryStore.machineryBookings[index];
    },
  },

  // Transport Listings
  transport: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportListing').find(filter).sort({ createdAt: -1 });
      }
      return memoryStore.transport.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportListing').findById(id);
      }
      return memoryStore.transport.find((item) => String(item._id) === String(id)) || null;
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportListing').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        availabilityStatus: data.availabilityStatus || 'available',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.transport.unshift(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportListing').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.transport.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.transport[index] = {
        ...memoryStore.transport[index],
        ...update,
        currency: 'INR',
        updatedAt: new Date(),
      };
      return memoryStore.transport[index];
    },
    async countDocuments(filter = {}) {
      const list = await this.find(filter);
      return list.length;
    },
  },

  // Transport Bookings
  transportBookings: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportBooking').find(filter).sort({ createdAt: -1 });
      }
      return memoryStore.transportBookings.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportBooking').findById(id);
      }
      return memoryStore.transportBookings.find((item) => String(item._id) === String(id)) || null;
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportBooking').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        status: data.isQuotationRequired ? 'pending' : 'accepted',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.transportBookings.unshift(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('TransportBooking').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.transportBookings.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.transportBookings[index] = {
        ...memoryStore.transportBookings[index],
        ...update,
        updatedAt: new Date(),
      };
      return memoryStore.transportBookings[index];
    },
  },

  // Orders
  orders: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Order').find(filter).sort({ createdAt: -1 });
      }
      return memoryStore.orders.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Order').findById(id);
      }
      return memoryStore.orders.find((item) => String(item._id) === String(id)) || null;
    },
    async findOne(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Order').findOne(filter);
      }
      return memoryStore.orders.find((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }) || null;
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Order').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        orderStatus: 'pending',
        paymentStatus: data.paymentStatus || 'unpaid',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.orders.unshift(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Order').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.orders.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.orders[index] = {
        ...memoryStore.orders[index],
        ...update,
        updatedAt: new Date(),
      };
      return memoryStore.orders[index];
    },
    async countDocuments(filter = {}) {
      const list = await this.find(filter);
      return list.length;
    },
  },

  // Payments
  payments: {
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Payment').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.payments.unshift(record);
      return record;
    },
    async findOne(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Payment').findOne(filter);
      }
      return memoryStore.payments.find((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }) || null;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Payment').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.payments.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.payments[index] = {
        ...memoryStore.payments[index],
        ...update,
        updatedAt: new Date(),
      };
      return memoryStore.payments[index];
    },
  },

  // Market Prices
  marketPrices: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MarketPrice').find(filter).sort({ priceDate: -1 });
      }
      return memoryStore.marketPrices.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (filter[key] && typeof filter[key] === 'object' && filter[key].$regex) {
            const regex = new RegExp(filter[key].$regex, filter[key].$options || 'i');
            if (!regex.test(item[key])) return false;
          } else if (String(item[key]) !== String(filter[key])) {
            return false;
          }
        }
        return true;
      }).sort((a, b) => new Date(b.priceDate) - new Date(a.priceDate));
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('MarketPrice').create(data);
      }
      const record = {
        _id: generateId(),
        currency: 'INR',
        isVerified: true,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.marketPrices.unshift(record);
      return record;
    },
  },

  // Reports
  reports: {
    async find(filter = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Report').find(filter).sort({ createdAt: -1 });
      }
      return memoryStore.reports.filter((item) => {
        for (const key of Object.keys(filter)) {
          if (String(item[key]) !== String(filter[key])) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async create(data) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Report').create(data);
      }
      const record = {
        _id: generateId(),
        status: 'open',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.reports.unshift(record);
      return record;
    },
    async findByIdAndUpdate(id, update, options = {}) {
      await initStore();
      if (isMongoConnected()) {
        return await mongoose.model('Report').findByIdAndUpdate(id, update, options);
      }
      const index = memoryStore.reports.findIndex((item) => String(item._id) === String(id));
      if (index === -1) return null;
      memoryStore.reports[index] = {
        ...memoryStore.reports[index],
        ...update,
        updatedAt: new Date(),
      };
      return memoryStore.reports[index];
    },
  },
};

module.exports = db;

