const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../../Ticket_Selection/ticket_selection.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    console.log('Checking database content...');
    
    // Check total trains
    db.get('SELECT COUNT(*) as count FROM trains', (err, row) => {
        if (err) console.error(err);
        else console.log(`Total trains: ${row.count}`);
    });

    // Check total seats
    db.get('SELECT COUNT(*) as count FROM train_seats', (err, row) => {
        if (err) console.error(err);
        else console.log(`Total seats: ${row.count}`);
    });
    
    // Check a sample
    db.get('SELECT * FROM trains LIMIT 1', (err, row) => {
        if (err) console.error(err);
        else {
            console.log('Sample train:', row);
            if (row) {
                db.all('SELECT * FROM train_seats WHERE train_id = ?', [row.id], (err, rows) => {
                    if (err) console.error(err);
                    else console.log('Seats for sample train:', rows);
                    db.close();
                });
            } else {
                db.close();
            }
        }
    });
});
