const fs = require('fs');
const path = require('path');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();

// ================= CONFIGURATION =================
const TARGET_DB_PATH = path.resolve(__dirname, '../../../Ticket_Selection/ticket_selection.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const LOG_FILE = path.join(__dirname, 'update_log.txt');
const CRAWLED_DATA_FILE = path.join(__dirname, 'crawled_data.json');

const USE_MOCK = true; // Set to false to attempt real crawling (Note: 12306 has strict anti-bot)
const CITIES = [
    { name: '北京', code: 'BJP' },
    { name: '上海', code: 'SHH' },
    { name: '南京', code: 'NJH' },
    { name: '广州', code: 'GZQ' },
    { name: '深圳', code: 'SZQ' }
];
const DAYS_TO_CRAWL = 15;

// ================= UTILS =================
function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(LOG_FILE, logLine + '\n');
}

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// ================= DB HELPERS =================
function openDb(dbPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) reject(err);
            else resolve(db);
        });
    });
}

function runSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function execSql(db, sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// ================= BACKUP =================
async function backupDatabase() {
    log('Starting backup process...');
    if (!fs.existsSync(TARGET_DB_PATH)) {
        log('Target database does not exist, skipping backup.');
        return null;
    }
    
    await ensureDir(BACKUP_DIR);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `ticket_selection_${timestamp}.db`);
    
    fs.copyFileSync(TARGET_DB_PATH, backupPath);
    log(`Database backed up to: ${backupPath}`);
    return backupPath;
}

// ================= CRAWLER =================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockTrain(date, from, to) {
    const trainTypes = ['G', 'D', 'K', 'T', 'Z'];
    const type = trainTypes[getRandomInt(0, trainTypes.length - 1)];
    const num = getRandomInt(1, 9999);
    const trainNo = `${type}${num}`;
    
    const startHour = getRandomInt(6, 22);
    const startMin = getRandomInt(0, 59);
    const durationHours = getRandomInt(1, 12);
    const durationMins = getRandomInt(0, 59);
    
    const departTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    
    let arriveHour = startHour + durationHours;
    let arriveMin = startMin + durationMins;
    if (arriveMin >= 60) {
        arriveHour += 1;
        arriveMin -= 60;
    }
    // Simple logic: arrive next day if hour >= 24
    const arriveTime = `${String(arriveHour % 24).padStart(2, '0')}:${String(arriveMin).padStart(2, '0')}`;
    
    const seats = [];
    if (['G', 'D'].includes(type)) {
        seats.push({ type: '商务座', count: getRandomInt(0, 10) > 2 ? '有' : '无', price: getRandomInt(1000, 2000) });
        seats.push({ type: '一等座', count: getRandomInt(0, 10) > 1 ? '有' : '无', price: getRandomInt(500, 1000) });
        seats.push({ type: '二等座', count: '有', price: getRandomInt(200, 500) });
    } else {
        seats.push({ type: '软卧', count: getRandomInt(0, 10) > 5 ? '有' : '无', price: getRandomInt(300, 600) });
        seats.push({ type: '硬卧', count: '有', price: getRandomInt(150, 300) });
        seats.push({ type: '硬座', count: '有', price: getRandomInt(50, 150) });
    }
    
    return {
        date,
        trainNo,
        fromStation: from.name + '站',
        toStation: to.name + '站',
        departTime,
        arriveTime,
        duration: `${durationHours}小时${durationMins}分`,
        startingPrice: Math.min(...seats.map(s => s.price)),
        seats
    };
}

async function crawlReal(date, from, to) {
    // This is a skeleton for real crawling. 
    // In reality, this requires complex handling of cookies, tokens, and IP rotation.
    log(`[Real Crawl Attempt] Fetching ${from.name} -> ${to.name} on ${date}`);
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'kyfw.12306.cn',
            path: `/otn/leftTicket/query?leftTicketDTO.train_date=${date}&leftTicketDTO.from_station=${from.code}&leftTicketDTO.to_station=${to.code}&purpose_codes=ADULT`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Cookie': '_jc_save_fromStation=...; _jc_save_toStation=...;' // Needs valid cookies
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.result) {
                        // Parse 12306 weird format here
                        // For now, return empty as we don't have valid cookies
                        resolve([]); 
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    resolve([]);
                }
            });
        });
        
        req.on('error', (e) => {
            log(`Request error: ${e.message}`);
            resolve([]);
        });
        req.end();
    });
}

async function collectData() {
    log('Starting data collection...');
    const allTrains = [];
    const today = new Date();
    
    // Generate pairs
    const pairs = [];
    for (let i = 0; i < CITIES.length; i++) {
        for (let j = 0; j < CITIES.length; j++) {
            if (i !== j) pairs.push([CITIES[i], CITIES[j]]);
        }
    }

    for (let d = 0; d < DAYS_TO_CRAWL; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() + d);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        
        for (const [from, to] of pairs) {
            let trains = [];
            if (USE_MOCK) {
                // Generate 5-10 trains per route
                const count = getRandomInt(5, 10);
                for (let k = 0; k < count; k++) {
                    trains.push(generateMockTrain(dateStr, from, to));
                }
            } else {
                trains = await crawlReal(dateStr, from, to);
                // Fallback to mock if real fails (which it likely will without setup)
                if (trains.length === 0) {
                    log(`Real crawl returned no data for ${from.name}->${to.name}, falling back to mock.`);
                    const count = getRandomInt(3, 5);
                    for (let k = 0; k < count; k++) {
                        trains.push(generateMockTrain(dateStr, from, to));
                    }
                }
            }
            allTrains.push(...trains);
        }
    }
    
    log(`Collected ${allTrains.length} train records.`);
    fs.writeFileSync(CRAWLED_DATA_FILE, JSON.stringify(allTrains, null, 2));
    return allTrains;
}

// ================= UPDATE DB =================
async function updateDatabase(trains) {
    log('Updating database...');
    const db = await openDb(TARGET_DB_PATH);
    
    try {
        await execSql(db, 'BEGIN TRANSACTION');
        
        // 1. Clear old data
        log('Clearing old data...');
        await execSql(db, 'DELETE FROM train_seats');
        await execSql(db, 'DELETE FROM trains');
        
        // 2. Insert new data
        log('Inserting new data...');
        const stmtTrain = db.prepare(`INSERT INTO trains(date, train_no, from_station, to_station, depart_time, arrive_time, duration, starting_price) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`);
        const stmtSeat = db.prepare(`INSERT INTO train_seats(train_id, seat_type, seat_count, seat_price) VALUES(?, ?, ?, ?)`);
        
        let insertedCount = 0;
        
        for (const t of trains) {
            await new Promise((resolve, reject) => {
                stmtTrain.run([t.date, t.trainNo, t.fromStation, t.toStation, t.departTime, t.arriveTime, t.duration, t.startingPrice], function(err) {
                    if (err) {
                        // Ignore unique constraint violations (duplicates)
                        if (err.message.includes('UNIQUE constraint failed')) resolve();
                        else reject(err);
                    } else {
                        const trainId = this.lastID;
                        const seatPromises = t.seats.map(s => {
                            return new Promise((res, rej) => {
                                stmtSeat.run([trainId, s.type, s.count, s.price], (e) => e ? rej(e) : res());
                            });
                        });
                        Promise.all(seatPromises).then(() => {
                            insertedCount++;
                            resolve();
                        }).catch(reject);
                    }
                });
            });
        }
        
        stmtTrain.finalize();
        stmtSeat.finalize();
        
        await execSql(db, 'COMMIT');
        log(`Database updated successfully. Inserted ${insertedCount} trains.`);
        
    } catch (e) {
        await execSql(db, 'ROLLBACK');
        log(`Error updating database: ${e.message}`);
        throw e;
    } finally {
        db.close();
    }
}

// ================= MAIN =================
async function main() {
    log('==================================================');
    log('Starting crawl and update process...');
    
    try {
        // Step 1: Backup
        await backupDatabase();
        
        // Step 2: Crawl
        const trains = await collectData();
        
        // Step 3: Validate
        if (!trains || trains.length === 0) {
            throw new Error('No data collected!');
        }
        log('Data validation passed.');
        
        // Step 4: Update
        await updateDatabase(trains);
        
        log('Process completed successfully.');
        
    } catch (e) {
        log(`CRITICAL ERROR: ${e.message}`);
        log(e.stack);
        process.exit(1);
    }
}

main();
