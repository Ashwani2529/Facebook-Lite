const PRODUCTION_API_URL = 'https://facebook-lite-7fwj.onrender.com';

const isLocalBrowser = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const configuredUrl = process.env.REACT_APP_SERVER_URL?.trim();
const SERVER_URL = (
  configuredUrl
  || (isLocalBrowser ? 'http://localhost:5000' : PRODUCTION_API_URL)
).replace(/\/+$/, '');

export default SERVER_URL;
