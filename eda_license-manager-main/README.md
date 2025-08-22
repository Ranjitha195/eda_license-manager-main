# EDA License Manager

A React.js and Node.js application for monitoring and managing EDA (Electronic Design Automation) tool licenses. This application parses license manager output files and provides a web interface to view license usage statistics with filtering capabilities.

## Features

- **Multi-tool Support**: Supports Cadence, Synopsys, and MGS EDA tools
- **Real-time License Monitoring**: View license usage, availability, and user information
- **Tool Filtering**: Filter license data by specific EDA tools
- **Automatic File Monitoring**: Automatically detects new license files in the incoming folder
- **Modern UI**: Beautiful gradient-based interface with responsive design
- **License Usage Visualization**: Color-coded usage bars and status indicators

## Project Structure

```
eda_license_manager/
├── backend/                 # Node.js backend
│   ├── server.js           # Express server
│   ├── licenseParser.js    # License file parser
│   └── package.json        # Backend dependencies
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── LicenseTable.jsx
│   │   │   ├── ToolFilter.jsx
│   │   │   └── FileUpload.jsx
│   │   ├── App.jsx         # Main application component
│   │   └── index.js        # Application entry point
│   └── package.json        # Frontend dependencies
└── incoming/               # License files directory
    ├── cadence            # Cadence license file
    ├── mgs                # MGS license file
    └── synopsys           # Synopsys license file
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm

### Backend Setup
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

## Running the Application

### Start the Backend Server
1. Open a terminal in the backend directory:
   ```powershell
   cd backend
   npm start
   ```
   The backend server will start on http://localhost:3001

### Start the Frontend Development Server
1. Open another terminal in the frontend directory:
   ```powershell
   cd frontend
   npm start
   ```
   The React application will start on http://localhost:3000

## Usage

1. **View License Data**: The main dashboard displays license information in a table format
2. **Filter by Tool**: Use the tool filter dropdown to view data for specific EDA tools (Cadence, MGS, Synopsys)
3. **Automatic Updates**: The system automatically refreshes every 30 seconds to detect new license files
4. **Add New Files**: Simply place new license files in the `incoming/` folder and they will be automatically processed
5. **Monitor Usage**: Color-coded rows indicate license usage levels:
   - **Green**: Normal usage (< 70%)
   - **Orange**: Warning (70-90%)
   - **Red**: Critical (> 90%)

## Table Columns

- **Tool**: EDA tool name (Cadence, MGS, Synopsys)
- **Feature**: License feature name
- **Version**: Software version
- **Expiry**: License expiration date
- **Total Licenses**: Total number of available licenses
- **In Use**: Number of licenses currently in use
- **Available**: Number of available licenses remaining
- **Users**: List of users currently using the license

## API Endpoints

### Backend API
- `GET /api/health` - Health check
- `GET /api/tools` - Get available tools
- `GET /api/licenses` - Get all license data
- `GET /api/licenses?tool=<tool>` - Get license data filtered by tool
- `GET /api/licenses/<tool>` - Get license data for specific tool


## File Format

The application expects license manager output files (lmstat format) containing:
- License server information
- Feature usage statistics
- User information
- License expiration dates

## Development

### Adding New EDA Tools
1. Add license files to the `incoming/` directory
2. The parser will automatically detect and process new tool files
3. Tool names are derived from the filename

### Customizing the UI
- Modify CSS files in `frontend/src/components/` for styling changes
- The application uses gradient backgrounds as specified in user preferences
- Color scheme follows the orange and blue gradient theme

## Technologies Used

- **Frontend**: React.js, CSS3, Axios
- **Backend**: Node.js, Express.js, Multer
- **File Processing**: Custom license file parser
- **Styling**: CSS with gradient backgrounds and modern UI principles
