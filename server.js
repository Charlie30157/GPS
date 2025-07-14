const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Add security headers for iOS and Chrome
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https://nominatim.openstreetmap.org;");
    next();
});

// CSV file path
const CSV_FILE = 'gps_data.csv';

// CSV headers (now with actual_lane and current_lane)
const CSV_HEADERS = [
    'timestamp',
    'latitude',
    'longitude',
    'altitude',
    'speed',
    'heading',
    'road_name',
    'road_type',
    'lanes',
    'yaw_rate',
    'hdop',
    'pdop',
    'lateral_acceleration',
    'longitudinal_acceleration',
    'accuracy',
    'actual_lane',
    'current_lane'
];

// Initialize CSV file with headers if it doesn't exist
function initializeCSV() {
    if (!fs.existsSync(CSV_FILE)) {
        fs.writeFileSync(CSV_FILE, CSV_HEADERS.join(',') + '\n');
        console.log('CSV file initialized with headers');
    }
}

// Get road information from OpenStreetMap
async function getRoadInfo(lat, lon) {
    return new Promise((resolve) => {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (jsonData.address) {
                        resolve({
                            road_name: jsonData.address.road || jsonData.address.highway || 'Unknown',
                            road_type: jsonData.address.highway || 'Unknown',
                            lanes: jsonData.address.lanes || 'Unknown'
                        });
                    } else {
                        resolve({
                            road_name: 'Unknown',
                            road_type: 'Unknown',
                            lanes: 'Unknown'
                        });
                    }
                } catch (error) {
                    console.error('Error parsing road info:', error);
                    resolve({
                        road_name: 'Error',
                        road_type: 'Error',
                        lanes: 'Error'
                    });
                }
            });
        }).on('error', (error) => {
            console.error('Error fetching road info:', error);
            resolve({
                road_name: 'Error',
                road_type: 'Error',
                lanes: 'Error'
            });
        });
    });
}

// Save GPS data to CSV
function saveToCSV(data) {
    const csvLine = [
        data.timestamp,
        data.latitude,
        data.longitude,
        data.altitude,
        data.speed,
        data.heading,
        data.road_name,
        data.road_type,
        data.lanes,
        data.yaw_rate,
        data.hdop,
        data.pdop,
        data.lateral_acceleration,
        data.longitudinal_acceleration,
        data.accuracy,
        data.actual_lane || '',
        data.current_lane || ''
    ].join(',');
    
    fs.appendFileSync(CSV_FILE, csvLine + '\n');
    console.log('Data saved to CSV:', data.timestamp, 'Actual Lane:', data.actual_lane, 'Current Lane:', data.current_lane);
}

// API endpoint to receive GPS data
app.post('/api/gps-data', async (req, res) => {
    try {
        const gpsData = req.body;
        
        // Get road information
        const roadInfo = await getRoadInfo(gpsData.latitude, gpsData.longitude);
        
        // Combine GPS data with road info
        const completeData = {
            timestamp: new Date().toISOString(),
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            altitude: gpsData.altitude || 0,
            speed: gpsData.speed || 0,
            heading: gpsData.heading || 0,
            road_name: roadInfo.road_name,
            road_type: roadInfo.road_type,
            lanes: roadInfo.lanes,
            yaw_rate: gpsData.yaw_rate || 0,
            hdop: gpsData.hdop || 0,
            pdop: gpsData.pdop || 0,
            lateral_acceleration: gpsData.lateral_acceleration || 0,
            longitudinal_acceleration: gpsData.longitudinal_acceleration || 0,
            accuracy: gpsData.accuracy || 0,
            actual_lane: gpsData.actual_lane || '',
            current_lane: gpsData.current_lane || ''
        };
        
        // Save to CSV
        saveToCSV(completeData);
        
        res.json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error processing GPS data:', error);
        res.status(500).json({ success: false, message: 'Error processing data' });
    }
});

// API endpoint to download CSV file
app.get('/api/download-csv', (req, res) => {
    if (fs.existsSync(CSV_FILE)) {
        res.download(CSV_FILE, 'gps_data.csv');
    } else {
        res.status(404).json({ message: 'CSV file not found' });
    }
});

// API endpoint to get data count
app.get('/api/data-count', (req, res) => {
    if (fs.existsSync(CSV_FILE)) {
        const content = fs.readFileSync(CSV_FILE, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const count = Math.max(0, lines.length - 1); // Subtract header
        res.json({ count });
    } else {
        res.json({ count: 0 });
    }
});

// API endpoint to flush (clear) the CSV file except for the header
app.post('/api/flush-csv', (req, res) => {
    const headers = [
        'timestamp',
        'latitude',
        'longitude',
        'altitude',
        'speed',
        'heading',
        'road_name',
        'road_type',
        'lanes',
        'yaw_rate',
        'hdop',
        'pdop',
        'lateral_acceleration',
        'longitudinal_acceleration',
        'accuracy',
        'actual_lane',
        'current_lane'
    ].join(',');
    fs.writeFileSync(CSV_FILE, headers + '\n');
    res.json({ success: true, message: 'CSV file flushed' });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize CSV and start server
initializeCSV();
app.listen(PORT, HOST, () => {
    console.log(`GPS Tracking Server running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    // console.log(`Network access: http://192.168.1.100:${PORT}`);
    // console.log(`Mobile access: http://192.168.1.100:${PORT}`);
}); 