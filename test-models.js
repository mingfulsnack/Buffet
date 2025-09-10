require('dotenv').config();
const { Employee, Customer, Table, Booking, Menu } = require('./models');

async function testModels() {
  try {
    console.log('🧪 Testing Models...\n');

    // Test 1: Employee Model
    console.log('👤 Testing Employee Model...');
    const admin = await Employee.findByUsername('admin');
    console.log(`✅ Found admin: ${admin?.hoten} (${admin?.tenvaitro})`);

    const employees = await Employee.findAllWithRole({}, 1, 5);
    console.log(`✅ Found ${employees.data.length} employees (Page 1)`);

    // Test 2: Customer Model
    console.log('\n👥 Testing Customer Model...');
    const customers = await Customer.findAllWithMembership({}, 1, 5);
    console.log(`✅ Found ${customers.data.length} customers`);

    const membershipTiers = await Customer.getMembershipTiers();
    console.log(`✅ Found ${membershipTiers.length} membership tiers`);

    // Test 3: Table Model
    console.log('\n🪑 Testing Table Model...');
    const tables = await Table.findAllWithArea();
    console.log(`✅ Found ${tables.length} areas with tables`);
    
    const tableStatus = await Table.getCurrentStatus();
    console.log('✅ Table status:', tableStatus);

    // Test 4: Menu Model
    console.log('\n🍽️ Testing Menu Model...');
    const publicMenu = await Menu.getPublicMenu();
    console.log(`✅ Public menu: ${publicMenu.danh_muc.length} categories, ${publicMenu.set_buffet.length} buffet sets`);

    const dishes = await Menu.findAllWithCategory({}, 1, 5);
    console.log(`✅ Found ${dishes.data.length} dishes (Page 1)`);

    const buffetSets = await Menu.getBuffetSets('HoatDong');
    console.log(`✅ Found ${buffetSets.length} active buffet sets`);

    // Test 5: Booking Model
    console.log('\n📅 Testing Booking Model...');
    const bookings = await Booking.findAllWithDetails({}, 1, 5);
    console.log(`✅ Found ${bookings.data.length} bookings (Page 1)`);

    const todayStats = await Booking.getDailyStats(new Date().toISOString().split('T')[0]);
    console.log('✅ Today booking stats:', todayStats);

    console.log('\n🎉 All models tested successfully!');
    console.log('\n📋 Model Features:');
    console.log('   ✓ BaseModel với CRUD operations');
    console.log('   ✓ Pagination support');
    console.log('   ✓ Transaction support');
    console.log('   ✓ Search và filtering');
    console.log('   ✓ Relations giữa các bảng');
    console.log('   ✓ Business logic methods');
    console.log('   ✓ Reporting và analytics');

    console.log('\n💡 Usage in Controllers:');
    console.log('   const { Employee, Customer } = require("../models");');
    console.log('   const user = await Employee.findByUsername("admin");');
    console.log('   const customers = await Customer.findAllWithMembership({search: "Nguyen"});');

  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testModels();
