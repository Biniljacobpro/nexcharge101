const mongoose = require('mongoose');
const Station = require('../models/station.model.js');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/nexcharge_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample charging stations data
const sampleStations = [
  {
    name: 'MG Road Charging Station',
    code: 'MG001',
    description: 'Central charging station in downtown Bangalore',
    location: {
      address: '123 MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560001',
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    },
    capacity: {
      totalChargers: 10,
      chargerTypes: ['ccs2', 'chademo', 'type2'],
      maxPowerPerCharger: 50
    },
    pricing: {
      pricePerMinute: 2.5,
      basePrice: 10
    },
    operational: {
      status: 'active',
      open24Hours: true,
      openingTime: '00:00',
      closingTime: '23:59'
    }
  },
  {
    name: 'Koramangala Charging Hub',
    code: 'KM001',
    description: 'Popular charging hub in Koramangala',
    location: {
      address: '456 Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560034',
      coordinates: {
        latitude: 12.9352,
        longitude: 77.6245
      }
    },
    capacity: {
      totalChargers: 8,
      chargerTypes: ['ccs2', 'type2'],
      maxPowerPerCharger: 60
    },
    pricing: {
      pricePerMinute: 3.0,
      basePrice: 15
    },
    operational: {
      status: 'active',
      open24Hours: true,
      openingTime: '00:00',
      closingTime: '23:59'
    }
  },
  {
    name: 'Whitefield Green Station',
    code: 'WF001',
    description: 'Eco-friendly charging station in Whitefield',
    location: {
      address: '789 Whitefield Road',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560066',
      coordinates: {
        latitude: 12.9719,
        longitude: 77.7499
      }
    },
    capacity: {
      totalChargers: 12,
      chargerTypes: ['ccs2', 'chademo', 'type2', 'bharat_dc_001'],
      maxPowerPerCharger: 100
    },
    pricing: {
      pricePerMinute: 2.0,
      basePrice: 8
    },
    operational: {
      status: 'active',
      open24Hours: true,
      openingTime: '00:00',
      closingTime: '23:59'
    }
  }
];

async function seedStations() {
  try {
    // Clear existing stations
    await Station.deleteMany({});
    console.log('Cleared existing stations');
    
    // Insert sample stations
    const insertedStations = await Station.insertMany(sampleStations);
    console.log(`Inserted ${insertedStations.length} sample stations`);
    
    // Verify insertion
    const stations = await Station.find({});
    console.log('Current stations in database:');
    stations.forEach(station => {
      console.log(`- ${station.name} (${station.operational.status})`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding stations:', error);
    mongoose.connection.close();
  }
}

seedStations();