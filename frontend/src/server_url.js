// Use environment variable with fallback for development
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export default SERVER_URL;