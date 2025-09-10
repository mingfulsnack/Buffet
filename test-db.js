require('dotenv').config();
const pool = require('./config/database');

async function testDatabase() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log('⏰ Current time:', result.rows[0].current_time);
    
    // Test table existence
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test khuyenmai_apdung structure
    console.log('\n🔍 Testing khuyenmai_apdung table...');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'khuyenmai_apdung'
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Test insert khuyenmai_apdung with object_id = 0
    console.log('\n🧪 Testing insert with object_id = 0...');
    
    // First, ensure we have a promotion to reference
    const promotionCheck = await pool.query('SELECT COUNT(*) as count FROM khuyenmai');
    
    if (parseInt(promotionCheck.rows[0].count) === 0) {
      console.log('📝 Creating test promotion...');
      await pool.query(`
        INSERT INTO khuyenmai (tenkm, loai_km, giatri, ngay_batdau, ngay_ketthuc, is_active)
        VALUES ('Test Promotion', 'percentage', 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true)
      `);
    }
    
    // Get first promotion ID
    const promotion = await pool.query('SELECT makm FROM khuyenmai LIMIT 1');
    const promotionId = promotion.rows[0].makm;
    
    // Try to insert with object_id = 0
    try {
      await pool.query(`
        INSERT INTO khuyenmai_apdung (makm, object_type, object_id)
        VALUES ($1, 'ToanBo', 0)
        ON CONFLICT DO NOTHING
      `, [promotionId]);
      
      console.log('✅ Successfully inserted khuyenmai_apdung with object_id = 0');
    } catch (insertError) {
      console.log('❌ Insert failed:', insertError.message);
    }
    
    // Check the inserted data
    const checkData = await pool.query(`
      SELECT * FROM khuyenmai_apdung 
      WHERE makm = $1 AND object_type = 'ToanBo'
    `, [promotionId]);
    
    console.log('📊 Inserted data:', checkData.rows);
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();
