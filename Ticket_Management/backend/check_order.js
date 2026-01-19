// 检查订单数据的脚本
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'ticket_management.db');
const db = new sqlite3.Database(dbPath);

const orderId = process.argv[2];

if (!orderId) {
  console.log('用法: node check_order.js <order_id>');
  process.exit(1);
}

db.serialize(() => {
  console.log(`\n检查订单: ${orderId}\n`);
  
  // 查询订单主表
  db.get('SELECT * FROM orders WHERE order_id = ?', [orderId], (err, order) => {
    if (err) {
      console.error('查询订单错误:', err);
      return;
    }
    if (!order) {
      console.log('订单不存在');
      db.close();
      return;
    }
    
    console.log('订单信息:');
    console.log(JSON.stringify(order, null, 2));
    
    // 查询座位信息
    db.all('SELECT * FROM order_seats WHERE order_id = ?', [orderId], (err, seats) => {
      if (err) {
        console.error('查询座位错误:', err);
        db.close();
        return;
      }
      
      console.log('\n座位信息:');
      console.log(JSON.stringify(seats, null, 2));
      
      // 查询乘客信息
      db.all('SELECT * FROM order_passengers WHERE order_id = ?', [orderId], (err, passengers) => {
        if (err) {
          console.error('查询乘客错误:', err);
        } else {
          console.log('\n乘客信息:');
          console.log(JSON.stringify(passengers, null, 2));
        }
        
        db.close();
      });
    });
  });
});
