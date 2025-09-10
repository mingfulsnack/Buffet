require('dotenv').config();
const pool = require('./config/database');
const { hashPassword } = require('./utils/helpers');

async function checkAndInitData() {
  try {
    console.log('🔍 Checking database data...\n');
    
    // 1. Check tables exist
    console.log('📋 Checking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Found ${tables.rows.length} tables:`);
    const tableNames = tables.rows.map(row => row.table_name);
    tableNames.forEach(name => console.log(`  ✓ ${name}`));
    
    // 2. Check if we have required tables
    const requiredTables = ['vai_tro', 'nhanvien', 'hangthanhvien', 'vung', 'ban'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
      console.log('💡 Please run the database schema script first');
      return;
    }
    
    // 3. Check roles
    console.log('\n👤 Checking roles...');
    const roles = await pool.query('SELECT * FROM vai_tro ORDER BY mavaitro');
    if (roles.rows.length === 0) {
      console.log('📝 Creating roles...');
      await pool.query(`
        INSERT INTO vai_tro (tenvaitro) VALUES
        ('Admin'), ('Manager'), ('Staff'), ('Cashier')
      `);
      console.log('✅ Roles created');
    } else {
      console.log('Existing roles:');
      roles.rows.forEach(role => console.log(`  - ${role.mavaitro}: ${role.tenvaitro}`));
    }
    
    // 4. Check employees
    console.log('\n👥 Checking employees...');
    const employees = await pool.query('SELECT * FROM nhanvien ORDER BY manv');
    if (employees.rows.length === 0) {
      console.log('📝 Creating admin user...');
      
      const adminPassword = await hashPassword('admin123');
      await pool.query(`
        INSERT INTO nhanvien (hoten, tendangnhap, matkhauhash, mavaitro, sodienthoai, email, calam)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'Administrator',
        'admin', 
        adminPassword,
        1, // Admin role
        '0900000000',
        'admin@buffet.com',
        'Full-time'
      ]);
      
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('Existing employees:');
      employees.rows.forEach(emp => console.log(`  - ${emp.tendangnhap}: ${emp.hoten} (Role: ${emp.mavaitro})`));
    }
    
    // 5. Test login credentials
    console.log('\n🔐 Testing admin login...');
    const adminUser = await pool.query(`
      SELECT nv.*, vt.tenvaitro 
      FROM nhanvien nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      WHERE nv.tendangnhap = 'admin' AND nv.is_active = true
    `);
    
    if (adminUser.rows.length === 0) {
      console.log('❌ Admin user not found!');
    } else {
      console.log('✅ Admin user found:');
      const admin = adminUser.rows[0];
      console.log(`   ID: ${admin.manv}`);
      console.log(`   Name: ${admin.hoten}`);
      console.log(`   Username: ${admin.tendangnhap}`);
      console.log(`   Role: ${admin.tenvaitro}`);
      console.log(`   Active: ${admin.is_active}`);
      console.log(`   Password hash exists: ${admin.matkhauhash ? 'Yes' : 'No'}`);
    }
    
    // 6. Check other essential data
    console.log('\n📊 Checking other data...');
    
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM hangthanhvien'),
      pool.query('SELECT COUNT(*) as count FROM vung'),
      pool.query('SELECT COUNT(*) as count FROM ban'),
      pool.query('SELECT COUNT(*) as count FROM danhmucmonan'),
      pool.query('SELECT COUNT(*) as count FROM monan')
    ]);
    
    console.log(`Membership tiers: ${counts[0].rows[0].count}`);
    console.log(`Areas: ${counts[1].rows[0].count}`);
    console.log(`Tables: ${counts[2].rows[0].count}`);
    console.log(`Menu categories: ${counts[3].rows[0].count}`);
    console.log(`Dishes: ${counts[4].rows[0].count}`);
    
    console.log('\n🎉 Data check completed!');
    console.log('\n🚀 You can now test login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

checkAndInitData();
