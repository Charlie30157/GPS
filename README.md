# GPS Tracking System

A comprehensive web application for collecting GPS data along with road information and sensor data. The system works on both mobile phones and laptops, automatically saving data to CSV format every 5 seconds.

## Features

- **Real-time GPS Tracking**: Latitude, longitude, altitude, speed, heading, and accuracy
- **Road Information**: Automatic road name, type, and lane count detection
- **Sensor Data**: Yaw rate, HDOP, PDOP, lateral and longitudinal acceleration
- **Cross-Platform**: Works on both mobile and desktop browsers
- **Data Export**: Automatic CSV file generation with all collected data
- **User-Friendly Interface**: Modern, responsive design with real-time status updates

## Data Collected

The system collects the following data every 5 seconds:

| Category | Data Points |
|----------|-------------|
| **GPS Data** | Latitude, Longitude, Altitude, Speed, Heading, Accuracy |
| **Road Information** | Road Name, Road Type, Number of Lanes |
| **Sensor Data** | Yaw Rate, HDOP, PDOP, Lateral Acceleration, Longitudinal Acceleration |

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Modern web browser** with GPS support
- **Internet connection** (for road data lookup)

## Installation

1. **Clone or download** the project files to your computer

2. **Open terminal/command prompt** and navigate to the project directory:
   ```bash
   cd /path/to/gps-tracking-system
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## Usage Instructions

### Getting Started

1. **Allow Location Access**: When prompted by your browser, click "Allow" to grant location access
2. **Allow Motion Sensors** (Mobile Only): On mobile devices, allow access to device motion sensors when prompted
3. **Start Recording**: Click the "Start Recording" button to begin data collection
4. **Monitor Data**: Watch the real-time data updates in the interface
5. **Stop Recording**: Click "Stop Recording" when you're done
6. **Download Data**: Click "Download CSV" to get your collected data

### Mobile vs Desktop

#### Mobile Devices
- **Full sensor access**: GPS, motion sensors, orientation sensors
- **Better accuracy**: Built-in GPS hardware
- **Motion data**: Real acceleration and yaw rate data
- **Touch-friendly interface**: Optimized for touch interaction

#### Desktop/Laptop
- **GPS access**: If GPS hardware is available
- **Limited sensor data**: May not have motion sensors
- **Simulated values**: HDOP/PDOP values are simulated
- **Mouse/keyboard interface**: Optimized for desktop interaction

### Understanding the Data

#### GPS Data
- **Latitude/Longitude**: Your exact position on Earth
- **Altitude**: Height above sea level (if available)
- **Speed**: Current movement speed in km/h
- **Heading**: Direction of travel in degrees (0-360°)
- **Accuracy**: GPS accuracy in meters

#### Road Information
- **Road Name**: Name of the road you're on
- **Road Type**: Type of road (highway, residential, etc.)
- **Lanes**: Number of lanes on the road

#### Sensor Data
- **Yaw Rate**: Rate of rotation around the vertical axis (°/s)
- **HDOP**: Horizontal Dilution of Precision (GPS accuracy indicator)
- **PDOP**: Position Dilution of Precision (GPS accuracy indicator)
- **Lateral Acceleration**: Side-to-side acceleration (m/s²)
- **Longitudinal Acceleration**: Forward/backward acceleration (m/s²)

## Technical Details

### Architecture
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express
- **Data Storage**: CSV file format
- **Road Data**: OpenStreetMap API (Nominatim)

### API Endpoints
- `POST /api/gps-data`: Receive and store GPS data
- `GET /api/download-csv`: Download collected data
- `GET /api/data-count`: Get number of records collected

### File Structure
```
gps-tracking-system/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── public/
│   ├── index.html         # Main web page
│   ├── styles.css         # Styling
│   └── script.js          # Frontend JavaScript
├── gps_data.csv           # Generated data file
└── README.md              # This file
```

## Troubleshooting

### Common Issues

1. **GPS Not Working**
   - Ensure location services are enabled on your device
   - Check that you've granted location permission to the browser
   - Try refreshing the page and allowing location access again

2. **Sensors Not Available**
   - On mobile: Ensure you've granted motion sensor permissions
   - On desktop: Motion sensors may not be available (this is normal)
   - HDOP/PDOP values are simulated on desktop

3. **Server Won't Start**
   - Check that Node.js is installed: `node --version`
   - Ensure all dependencies are installed: `npm install`
   - Check if port 3000 is already in use

4. **Data Not Saving**
   - Check your internet connection (needed for road data)
   - Ensure the server is running
   - Check browser console for error messages

### Browser Compatibility

| Browser | GPS | Motion Sensors | Notes |
|---------|-----|----------------|-------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Safari | ✅ | ⚠️ | Limited sensor support |
| Edge | ✅ | ✅ | Full support |

## Data Format

The CSV file contains the following columns:
```csv
timestamp,latitude,longitude,altitude,speed,heading,road_name,road_type,lanes,yaw_rate,hdop,pdop,lateral_acceleration,longitudinal_acceleration,accuracy
```

### Sample Data
```csv
2024-01-15T10:30:00.000Z,37.7749,-122.4194,10.5,25.2,180.0,Market Street,residential,2,0.5,1.2,2.1,0.1,0.3,5.0
```

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon to automatically restart the server when files change.

### Customizing the System

1. **Change Data Collection Interval**: Modify the interval in `script.js` (currently 5000ms = 5 seconds)
2. **Add New Data Fields**: Update the CSV headers in `server.js` and the data collection in `script.js`
3. **Modify UI**: Edit `styles.css` for styling changes
4. **Add New APIs**: Extend the server endpoints in `server.js`

## Security Considerations

- The application runs locally and doesn't store data on external servers
- GPS data is only sent to OpenStreetMap for road information lookup
- No personal data is collected or transmitted
- CSV files are stored locally on your computer

## License

This project is open source and available under the MIT License.

## Support

If you encounter issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all prerequisites are met
4. Try refreshing the page and restarting the server

## Future Enhancements

Potential improvements for future versions:
- Real-time map integration
- Data visualization and charts
- Export to other formats (JSON, XML)
- Offline road data caching
- Multiple device synchronization
- Advanced filtering and analysis tools # GPS
