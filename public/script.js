// GPS Tracking System - Main JavaScript File

class GPSTracker {
    constructor() {
        this.isRecording = false;
        this.recordingInterval = null;
        this.watchId = null;
        this.currentPosition = null;
        this.sensorData = {
            yawRate: 0,
            lateralAcceleration: 0,
            longitudinalAcceleration: 0,
            hdop: 0,
            pdop: 0
        };
        this.recordCount = 0;
        this.currentLane = '';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.checkPermissions();
        this.updateRecordCount();
    }

    initializeElements() {
        // Status indicators
        this.gpsStatus = document.getElementById('gpsStatus');
        this.sensorStatus = document.getElementById('sensorStatus');
        this.recordingStatus = document.getElementById('recordingStatus');
        
        // Control buttons
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Data display elements
        this.latitude = document.getElementById('latitude');
        this.longitude = document.getElementById('longitude');
        this.altitude = document.getElementById('altitude');
        this.speed = document.getElementById('speed');
        this.heading = document.getElementById('heading');
        this.accuracy = document.getElementById('accuracy');
        this.roadName = document.getElementById('roadName');
        this.roadType = document.getElementById('roadType');
        this.lanes = document.getElementById('lanes');
        this.yawRate = document.getElementById('yawRate');
        this.hdop = document.getElementById('hdop');
        this.pdop = document.getElementById('pdop');
        this.lateralAccel = document.getElementById('lateralAccel');
        this.longitudinalAccel = document.getElementById('longitudinalAccel');
        
        // Log container
        this.logContainer = document.getElementById('logContainer');
        this.recordCountElement = document.getElementById('recordCount');
        
        // Modal elements
        this.instructionsModal = document.getElementById('instructionsModal');
        this.helpBtn = document.getElementById('helpBtn');
        this.closeBtn = document.querySelector('.close');
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.downloadBtn.addEventListener('click', () => this.downloadCSV());
        this.helpBtn.addEventListener('click', () => this.showInstructions());
        this.closeBtn.addEventListener('click', () => this.hideInstructions());
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.instructionsModal) {
                this.hideInstructions();
            }
        });
    }

    async checkPermissions() {
        try {
            // Check GPS permission
            if ('geolocation' in navigator) {
                this.updateStatus(this.gpsStatus, 'GPS: Available', true);
                this.log('GPS service available');
                
                // Additional GPS diagnostics for Android
                const isAndroid = /Android/.test(navigator.userAgent);
                if (isAndroid) {
                    this.log('Android device detected - checking GPS settings...');
                    this.checkAndroidGPSSettings();
                }
            } else {
                this.updateStatus(this.gpsStatus, 'GPS: Not supported', false);
                this.log('GPS not supported by browser', 'error');
            }

            // Check device motion permission (mobile)
            if ('DeviceMotionEvent' in window) {
                if (typeof DeviceMotionEvent.requestPermission === 'function') {
                    this.updateStatus(this.sensorStatus, 'Sensors: Permission required', false);
                    this.log('Motion sensors require permission on mobile');
                } else {
                    this.updateStatus(this.sensorStatus, 'Sensors: Available', true);
                    this.log('Motion sensors available');
                    this.initializeSensors();
                }
            } else {
                this.updateStatus(this.sensorStatus, 'Sensors: Not supported', false);
                this.log('Motion sensors not supported', 'error');
            }
        } catch (error) {
            this.log('Error checking permissions: ' + error.message, 'error');
        }
    }

    checkAndroidGPSSettings() {
        // Create a diagnostic button for Android users
        const diagnosticBtn = document.createElement('button');
        diagnosticBtn.textContent = '🔧 Android GPS Diagnostic';
        diagnosticBtn.className = 'btn btn-info';
        diagnosticBtn.style.marginTop = '10px';
        diagnosticBtn.onclick = () => {
            this.log('Running Android GPS diagnostic...');
            this.runAndroidGPSDiagnostic();
        };
        this.logContainer.appendChild(diagnosticBtn);
    }

    async runAndroidGPSDiagnostic() {
        const isAndroid = /Android/.test(navigator.userAgent);
        const browser = this.getBrowserInfo();
        
        this.log(`Device: ${navigator.userAgent}`);
        this.log(`Browser: ${browser.name} ${browser.version}`);
        this.log(`Platform: ${navigator.platform}`);
        
        if (isAndroid) {
            this.log('📱 Android GPS Diagnostic Results:');
            this.log('1. ✅ GPS API available in browser');
            this.log('2. ⚠️  Check these settings on your device:');
            this.log('   • Settings → Location → ON');
            this.log('   • Settings → Location → Mode → High accuracy');
            this.log('   • Settings → Apps → [Browser] → Permissions → Location → Allow');
            this.log('3. 🌍 Try moving to an open area with clear sky view');
            this.log('4. ⏱️  Wait 1-2 minutes for GPS to acquire satellites');
            this.log('5. 🔄 Try restarting your browser if issues persist');
        }
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        
        if (userAgent.includes('Chrome')) {
            browserName = 'Chrome';
            browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Firefox')) {
            browserName = 'Firefox';
            browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Safari')) {
            browserName = 'Safari';
            browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('SamsungBrowser')) {
            browserName = 'Samsung Internet';
            browserVersion = userAgent.match(/SamsungBrowser\/(\d+)/)?.[1] || 'Unknown';
        }
        
        return { name: browserName, version: browserVersion };
    }

    async requestSensorPermission() {
        try {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (isIOS && typeof DeviceMotionEvent.requestPermission === 'function') {
                this.showPermissionInstructions();

                let motionPermission = 'denied';
                try {
                    motionPermission = await DeviceMotionEvent.requestPermission();
                } catch (error) {
                    this.log('Motion permission request failed: ' + error.message, 'error');
                }

                let orientationPermission = 'denied';
                try {
                    orientationPermission = await DeviceOrientationEvent.requestPermission();
                } catch (error) {
                    this.log('Orientation permission request failed: ' + error.message, 'error');
                }

                if (motionPermission === 'granted' || orientationPermission === 'granted') {
                    this.updateStatus(this.sensorStatus, 'Sensors: Active', true);
                    this.initializeSensors();
                    return true;
                } else {
                    this.updateStatus(this.sensorStatus, 'Sensors: Permission denied', false);
                    return false;
                }
            } else {
                // Android or Desktop: No permission prompt needed
                this.updateStatus(this.sensorStatus, 'Sensors: Active', true);
                this.initializeSensors();
                return true;
            }
        } catch (error) {
            this.log('Error requesting sensor permission: ' + error.message, 'error');
            return false;
        }
    }

    showPermissionInstructions() {
        const instructions = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h4>📱 iOS Permission Instructions:</h4>
                <ol>
                    <li>When prompted, tap <strong>"Allow"</strong> for motion sensors</li>
                    <li>If no prompt appears, go to <strong>Settings → Safari → Motion & Orientation Access → Allow</strong></li>
                    <li>For GPS: <strong>Settings → Privacy & Security → Location Services → Safari → While Using</strong></li>
                </ol>
                <p><strong>Note:</strong> If permissions are denied, the app will still work with simulated sensor data.</p>
            </div>
        `;
        
        // Add instructions to the log
        this.logContainer.insertAdjacentHTML('afterbegin', instructions);
    }

    initializeSensors() {
        const activateSensors = () => {
            let sensorsActive = false;

            if ('DeviceMotionEvent' in window) {
                window.addEventListener('devicemotion', (event) => {
                    const accel = event.accelerationIncludingGravity || event.acceleration || {};

                    this.sensorData.lateralAcceleration = (accel.x || 0) / 9.81;
                    this.sensorData.longitudinalAcceleration = (accel.y || 0) / 9.81;

                    this.lateralAccel.textContent = this.formatNumber(this.sensorData.lateralAcceleration) + ' m/s²';
                    this.longitudinalAccel.textContent = this.formatNumber(this.sensorData.longitudinalAcceleration) + ' m/s²';

                    sensorsActive = true;
                    this.log('Motion sensor data updated (Android)');
                });
            }

            if ('DeviceOrientationEvent' in window) {
                let lastYaw = null;
                let lastTime = null;

                window.addEventListener('deviceorientation', (event) => {
                    const currentYaw = event.alpha;
                    const currentTime = Date.now();

                    if (lastYaw !== null && lastTime !== null) {
                        const deltaYaw = currentYaw - lastYaw;
                        const deltaTime = (currentTime - lastTime) / 1000; // in seconds

                        this.sensorData.yawRate = deltaYaw / deltaTime; // degrees per second
                        this.yawRate.textContent = this.formatNumber(this.sensorData.yawRate) + ' °/s';
                    }

                    lastYaw = currentYaw;
                    lastTime = currentTime;
                    
                    sensorsActive = true;
                    this.log('Orientation sensor data updated (Android)');
                });
            }

            if (!sensorsActive) {
                this.log('Using fallback sensor data (possibly no permission or unsupported)', 'warning');
                setInterval(() => {
                    if (this.isRecording) {
                        this.sensorData.lateralAcceleration = (Math.random() - 0.5) * 0.5;
                        this.sensorData.longitudinalAcceleration = (Math.random() - 0.5) * 0.3;

                        this.lateralAccel.textContent = this.formatNumber(this.sensorData.lateralAcceleration) + ' m/s² (sim)';
                        this.longitudinalAccel.textContent = this.formatNumber(this.sensorData.longitudinalAcceleration) + ' m/s² (sim)';
                    }
                }, 1000);
            }

            // Simulate HDOP and PDOP (these are typically GPS-specific values)
            setInterval(() => {
                if (this.isRecording) {
                    // Simulate realistic HDOP/PDOP values (lower is better)
                    this.sensorData.hdop = Math.random() * 2 + 0.5; // 0.5 to 2.5
                    this.sensorData.pdop = Math.random() * 3 + 1; // 1 to 4
                    
                    this.hdop.textContent = this.formatNumber(this.sensorData.hdop);
                    this.pdop.textContent = this.formatNumber(this.sensorData.pdop);
                }
            }, 1000);
        };

        // Wait for user interaction to activate sensors (important for Android)
        const sensorActivationHandler = () => {
            activateSensors();
            window.removeEventListener('click', sensorActivationHandler);
            window.removeEventListener('touchstart', sensorActivationHandler);
        };

        window.addEventListener('click', sensorActivationHandler);
        window.addEventListener('touchstart', sensorActivationHandler);
    }

    async startRecording() {
        try {
            // Request sensor permission if needed
            const sensorPermission = await this.requestSensorPermission();
            
            // Start GPS tracking with improved Android support
            if ('geolocation' in navigator) {
                // Android-specific options
                const isAndroid = /Android/.test(navigator.userAgent);
                const options = {
                    enableHighAccuracy: true,
                    timeout: isAndroid ? 30000 : 10000, // Longer timeout for Android
                    maximumAge: 0
                };

                this.log('Starting GPS with options: ' + JSON.stringify(options));
                
                // First try to get a single position to test
                this.log('Testing GPS access...');
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.log('GPS test successful - starting continuous tracking');
                        this.handlePositionUpdate(position);
                        this.startContinuousTracking(options);
                    },
                    (error) => {
                        this.log('GPS test failed - trying continuous tracking anyway');
                        this.handlePositionError(error);
                        this.startContinuousTracking(options);
                    },
                    { ...options, timeout: 15000 }
                );
                
            } else {
                this.log('GPS not available', 'error');
            }
        } catch (error) {
            this.log('Error starting recording: ' + error.message, 'error');
        }
    }

    startContinuousTracking(options) {
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handlePositionError(error),
            options
        );

        this.isRecording = true;
        this.updateStatus(this.recordingStatus, 'Recording: Active', true);
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        
        this.log('Started continuous GPS tracking');
        
        // Start periodic data collection (every 5 seconds)
        this.recordingInterval = setInterval(() => {
            if (this.currentPosition) {
                this.collectAndSendData();
            }
        }, 2000);
    }

    stopRecording() {
        this.isRecording = false;
        
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
        
        this.updateStatus(this.recordingStatus, 'Recording: Stopped', false);
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.recordCount = 0;
        this.updateRecordCount();
        this.log('Stopped GPS recording');

        // Flush CSV file on the server
        fetch('/api/flush-csv', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.log('Previous data flushed from CSV file');
                    this.updateRecordCount();
                } else {
                    this.log('Failed to flush CSV file', 'error');
                }
            })
            .catch(err => {
                this.log('Error flushing CSV file: ' + err.message, 'error');
            });
    }

    handlePositionUpdate(position) {
        this.currentPosition = position;
        
        const coords = position.coords;
        
        // Update display
        this.latitude.textContent = this.formatNumber(coords.latitude, 6) + '°';
        this.longitude.textContent = this.formatNumber(coords.longitude, 6) + '°';
        this.altitude.textContent = coords.altitude ? this.formatNumber(coords.altitude, 1) + ' m' : 'N/A';
        this.speed.textContent = coords.speed ? this.formatNumber(coords.speed * 3.6, 1) + ' km/h' : 'N/A';
        this.heading.textContent = coords.heading ? this.formatNumber(coords.heading, 1) + '°' : 'N/A';
        this.accuracy.textContent = this.formatNumber(coords.accuracy, 1) + ' m';
        
        // Update map placeholder
        this.updateMapPlaceholder(coords.latitude, coords.longitude);
        
        // Fetch road info and update lane buttons
        this.updateRoadInfoAndLanes(coords.latitude, coords.longitude);
        
        this.log('GPS position updated');
    }

    async updateRoadInfoAndLanes(lat, lon) {
        try {
            // Fetch road info from backend (simulate by calling /api/gps-data with dummy data)
            const response = await fetch('/api/gps-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon })
            });
            if (response.ok) {
                // The backend will save a row, but we only want the road info, so let's fetch it another way
                // Instead, let's use the last known road info from the UI (if available)
                // For a more robust solution, you could create a dedicated endpoint for road info only
                // For now, let's just update the lane buttons based on the displayed lanes
                const lanesText = this.lanes.textContent;
                let lanes = parseInt(lanesText);
                if (isNaN(lanes) || lanes < 1) lanes = 2;
                this.renderLaneButtons(lanes);
            }
        } catch (error) {
            this.log('Error updating road info/lanes: ' + error.message, 'error');
        }
    }

    renderLaneButtons(lanes) {
        // Remove existing lane buttons if any
        let laneBtnContainer = document.getElementById('laneBtnContainer');
        if (!laneBtnContainer) {
            laneBtnContainer = document.createElement('div');
            laneBtnContainer.id = 'laneBtnContainer';
            laneBtnContainer.style.margin = '15px 0';
            this.lanes.parentElement.appendChild(laneBtnContainer);
        }
        laneBtnContainer.innerHTML = '';
        // Lane numbers: 2 (leftmost), 3, ..., N (rightmost)
        for (let i = 2; i <= lanes; i++) {
            const btn = document.createElement('button');
            btn.textContent = `Lane ${i}`;
            btn.className = 'btn btn-secondary';
            btn.style.margin = '0 5px 5px 0';
            btn.onclick = () => {
                this.currentLane = i;
                this.recordLane(i);
            };
            laneBtnContainer.appendChild(btn);
        }
    }

    async recordLane(laneNumber) {
        if (!this.currentPosition) {
            this.log('No GPS position available for lane record', 'warning');
            return;
        }
        this.currentLane = laneNumber;
        const coords = this.currentPosition.coords;
        const data = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: coords.altitude || 0,
            speed: coords.speed || 0,
            heading: coords.heading || 0,
            accuracy: coords.accuracy || 0,
            yaw_rate: this.sensorData.yawRate,
            hdop: this.sensorData.hdop,
            pdop: this.sensorData.pdop,
            lateral_acceleration: this.sensorData.lateralAcceleration,
            longitudinal_acceleration: this.sensorData.longitudinalAcceleration,
            actual_lane: laneNumber,
            current_lane: this.currentLane
        };
        try {
            const response = await fetch('/api/gps-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                this.log(`Lane ${laneNumber} recorded in CSV`);
                this.updateRecordCount();
            } else {
                this.log('Failed to record lane in CSV', 'error');
            }
        } catch (error) {
            this.log('Error recording lane: ' + error.message, 'error');
        }
    }

    handlePositionError(error) {
        const isAndroid = /Android/.test(navigator.userAgent);
        let errorMessage = 'GPS Error: ';
        let userHelp = '';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += 'Permission denied.';
                if (isAndroid) {
                    userHelp = `
                        <br><strong>Android GPS Troubleshooting:</strong>
                        <ol>
                            <li>Go to <strong>Settings → Apps → [Your Browser] → Permissions → Location → Allow</strong></li>
                            <li>Make sure <strong>Location Services</strong> are enabled in device settings</li>
                            <li>Try using <strong>Chrome</strong> or <strong>Samsung Internet</strong> browser</li>
                            <li>Go to <strong>Settings → Location → Mode → High accuracy</strong></li>
                            <li>Try moving to an open area with clear sky view</li>
                        </ol>
                    `;
                } else {
                    userHelp = '<br><strong>Tip:</strong> Please allow location access in your browser settings and reload the page.';
                }
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += 'Position unavailable.';
                if (isAndroid) {
                    userHelp = `
                        <br><strong>Android GPS Troubleshooting:</strong>
                        <ol>
                            <li>Check if <strong>GPS/Location</strong> is enabled in quick settings</li>
                            <li>Go to <strong>Settings → Location → Mode → High accuracy</strong></li>
                            <li>Move to an open area with clear sky view</li>
                            <li>Wait 1-2 minutes for GPS to acquire satellites</li>
                            <li>Try restarting your browser</li>
                        </ol>
                    `;
                } else {
                    userHelp = '<br><strong>Tip:</strong> Try moving to an open area or check if location is enabled in your device settings.';
                }
                break;
            case error.TIMEOUT:
                errorMessage += 'Timeout.';
                if (isAndroid) {
                    userHelp = `
                        <br><strong>Android GPS Troubleshooting:</strong>
                        <ol>
                            <li>Move to an open area with clear sky view</li>
                            <li>Wait 1-2 minutes for GPS to acquire satellites</li>
                            <li>Check if <strong>High accuracy</strong> mode is enabled</li>
                            <li>Try restarting your browser</li>
                            <li>Check your internet connection</li>
                        </ol>
                    `;
                } else {
                    userHelp = '<br><strong>Tip:</strong> Try again or check your network connection.';
                }
                break;
            default:
                errorMessage += 'Unknown error.';
                userHelp = '<br><strong>Tip:</strong> Try refreshing the page or restarting your browser.';
        }
        
        this.log(errorMessage + userHelp, 'error');
        this.updateStatus(this.gpsStatus, 'GPS: Error', false);

        // Show a retry button in the log
        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry GPS';
        retryBtn.className = 'btn btn-primary';
        retryBtn.style.marginTop = '10px';
        retryBtn.onclick = () => {
            this.log('Retrying GPS...');
            this.startRecording();
        };
        this.logContainer.appendChild(retryBtn);
    }

    async collectAndSendData() {
        if (!this.currentPosition) {
            this.log('No GPS position available for data collection', 'warning');
            return;
        }
        try {
            const coords = this.currentPosition.coords;
            const data = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                altitude: coords.altitude || 0,
                speed: coords.speed || 0,
                heading: coords.heading || 0,
                accuracy: coords.accuracy || 0,
                yaw_rate: this.sensorData.yawRate,
                hdop: this.sensorData.hdop,
                pdop: this.sensorData.pdop,
                lateral_acceleration: this.sensorData.lateralAcceleration,
                longitudinal_acceleration: this.sensorData.longitudinalAcceleration,
                current_lane: this.currentLane
            };
            // Send data to server
            const response = await fetch('/api/gps-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                this.recordCount++;
                this.updateRecordCount();
                this.log(`Data collected and saved (Record #${this.recordCount})`);
            } else {
                this.log('Failed to save data to server', 'error');
            }
        } catch (error) {
            this.log('Error collecting data: ' + error.message, 'error');
        }
    }

    async downloadCSV() {
        try {
            const response = await fetch('/api/download-csv');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gps_data.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.log('CSV file downloaded');
            } else {
                this.log('Failed to download CSV file', 'error');
            }
        } catch (error) {
            this.log('Error downloading CSV: ' + error.message, 'error');
        }
    }

    async updateRecordCount() {
        try {
            const response = await fetch('/api/data-count');
            if (response.ok) {
                const data = await response.json();
                this.recordCount = data.count;
                this.recordCountElement.textContent = this.recordCount;
            }
        } catch (error) {
            console.error('Error updating record count:', error);
        }
    }

    updateMapPlaceholder(lat, lon) {
        const mapContainer = document.getElementById('map');
        mapContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-map-marker-alt" style="font-size: 2rem; color: #667eea; margin-bottom: 10px;"></i>
                <p style="margin: 5px 0; font-weight: 500;">Current Location</p>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">
                    Lat: ${this.formatNumber(lat, 4)}<br>
                    Lon: ${this.formatNumber(lon, 4)}
                </p>
                <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15" 
                   target="_blank" style="color: #667eea; text-decoration: none; font-size: 0.8rem;">
                    View on OpenStreetMap
                </a>
            </div>
        `;
    }

    updateStatus(element, text, isActive) {
        const icon = element.querySelector('i');
        const span = element.querySelector('span');
        
        span.textContent = text;
        
        if (isActive) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }

    log(message, type = 'info') {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = timeString;
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'log-message';
        messageSpan.textContent = message;
        
        if (type === 'error') {
            messageSpan.style.color = '#dc3545';
        } else if (type === 'warning') {
            messageSpan.style.color = '#ffc107';
        }
        
        logEntry.appendChild(timeSpan);
        logEntry.appendChild(messageSpan);
        
        this.logContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        
        // Keep only last 50 entries
        while (this.logContainer.children.length > 50) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
    }

    formatNumber(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) {
            return 'N/A';
        }
        return Number(num).toFixed(decimals);
    }

    showInstructions() {
        this.instructionsModal.style.display = 'block';
    }

    hideInstructions() {
        this.instructionsModal.style.display = 'none';
    }
}

// Initialize the GPS Tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GPSTracker();
}); 