require('dotenv').config();
const pool = require('./config/database');

async function fixPromotionData() {
  try {
    console.log('🔧 Fixing promotion application data...\n');
    
    // Check existing data
    console.log('📊 Checking existing promotion applications...');
    const existing = await pool.query('SELECT * FROM khuyenmai_apdung ORDER BY makm');
    
    if (existing.rows.length > 0) {
      console.log('Found existing data:');
      existing.rows.forEach(row => {
        console.log(`  - Promotion ${row.makm}: ${row.object_type} (ID: ${row.object_id})`);
      });
      
      console.log('\n🗑️ Cleaning existing data...');
      await pool.query('DELETE FROM khuyenmai_apdung WHERE makm IN (1, 2, 3)');
      console.log('✅ Old data cleaned');
    } else {
      console.log('No existing data found');
    }
    
    // Insert correct data
    console.log('\n📝 Inserting correct promotion applications...');
    
    const insertData = [
      [1, 'ToanBo', 0],
      [2, 'ToanBo', 0],
      [3, 'SetBuffet', 3]
    ];
    
    for (const [makm, object_type, object_id] of insertData) {
      try {
        await pool.query(`
          INSERT INTO khuyenmai_apdung (makm, object_type, object_id)
          VALUES ($1, $2, $3)
        `, [makm, object_type, object_id]);
        
        console.log(`✅ Inserted: Promotion ${makm} -> ${object_type} (ID: ${object_id})`);
      } catch (error) {
        if (error.code === '23505') { // Duplicate key
          console.log(`⚠️  Skipped: Promotion ${makm} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Verify the result
    console.log('\n🔍 Verifying results...');
    const result = await pool.query(`
      SELECT km.makm, km.tenkm, kma.object_type, 
             CASE 
               WHEN kma.object_id = 0 THEN 'Áp dụng toàn bộ' 
               ELSE 'Set buffet #' || kma.object_id 
             END as ap_dung
      FROM khuyenmai_apdung kma
      JOIN khuyenmai km ON kma.makm = km.makm
      ORDER BY kma.makm
    `);
    
    console.log('\n🎉 Final result:');
    if (result.rows.length === 0) {
      console.log('❌ No promotion applications found!');
    } else {
      result.rows.forEach(row => {
        console.log(`  ✓ ${row.tenkm}: ${row.object_type} (${row.ap_dung})`);
      });
    }
    
    console.log('\n✅ Promotion data fixed successfully!');
    console.log('🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error fixing promotion data:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === '42P01') {
      console.error('💡 Hint: Table does not exist. Please create database schema first.');
    } else if (error.code === '23503') {
      console.error('💡 Hint: Referenced promotion or buffet set does not exist.');
    }
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixPromotionData();
}

module.exports = fixPromotionData;
