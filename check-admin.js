require('dotenv').config();
const pool = require('./config/database');
const { verifyPassword } = require('./utils/helpers');

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin user details...\n');
    
    // Get admin user info
    const result = await pool.query(`
      SELECT nv.*, vt.tenvaitro 
      FROM nhanvien nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      WHERE nv.tendangnhap = 'admin'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    const admin = result.rows[0];
    console.log('👤 Admin user details:');
    console.log(`   ID: ${admin.manv}`);
    console.log(`   Name: ${admin.hoten}`);
    console.log(`   Username: ${admin.tendangnhap}`);
    console.log(`   Role ID: ${admin.mavaitro}`);
    console.log(`   Role Name: ${admin.tenvaitro}`);
    console.log(`   Phone: ${admin.sodienthoai}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Active: ${admin.is_active}`);
    console.log(`   Created: ${admin.created_at}`);
    console.log(`   Password hash: ${admin.matkhauhash ? 'EXISTS' : 'MISSING'}`);
    
    if (admin.matkhauhash) {
      console.log(`   Hash starts with: ${admin.matkhauhash.substring(0, 20)}...`);
    }
    
    // Test password verification
    if (admin.matkhauhash) {
      console.log('\n🔐 Testing password verification...');
      try {
        const isValid = await verifyPassword('admin123', admin.matkhauhash);
        console.log(`   Password 'admin123' is: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!isValid) {
          console.log('\n🔧 Password mismatch detected. Creating new admin...');
          const { hashPassword } = require('./utils/helpers');
          const newHash = await hashPassword('admin123');
          
          await pool.query(
            'UPDATE nhanvien SET matkhauhash = $1 WHERE tendangnhap = $2',
            [newHash, 'admin']
          );
          
          console.log('✅ Admin password updated');
          
          // Test again
          const isValidNow = await verifyPassword('admin123', newHash);
          console.log(`   New password verification: ${isValidNow ? '✅ VALID' : '❌ STILL INVALID'}`);
        }
      } catch (error) {
        console.error('❌ Password verification error:', error.message);
      }
    }
    
    // Check if user is active and has proper role
    if (!admin.is_active) {
      console.log('\n⚠️  Admin user is not active. Activating...');
      await pool.query('UPDATE nhanvien SET is_active = true WHERE tendangnhap = $1', ['admin']);
      console.log('✅ Admin user activated');
    }
    
    if (!admin.mavaitro || admin.mavaitro !== 1) {
      console.log('\n⚠️  Admin user does not have Admin role. Fixing...');
      await pool.query('UPDATE nhanvien SET mavaitro = 1 WHERE tendangnhap = $1', ['admin']);
      console.log('✅ Admin role assigned');
    }
    
    console.log('\n🎉 Admin check completed!');
    console.log('\n🧪 Test login again with:');
    console.log('   POST: http://localhost:3000/api/auth/login');
    console.log('   Body: {"tendangnhap": "admin", "matkhau": "admin123"}');
    
  } catch (error) {
    console.error('❌ Error checking admin:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmin();
