import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;

const echoConfig = {
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'flowcharts-key',
  wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
  wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT || 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  encrypted: true,
  authEndpoint: '/broadcasting/auth',
  auth: {
    headers: {
      Accept: 'application/json',
    },
  },
};

export function getEchoInstance() {
  if (!echoInstance) {
    echoInstance = new Echo(echoConfig);
  }
  return echoInstance;
}

export async function initializeEcho(authToken) {
  if (echoInstance) {
    return echoInstance;
  }

  if (authToken) {
    echoConfig.auth.headers['Authorization'] = `Bearer ${authToken}`;
  }

  echoInstance = new Echo(echoConfig);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Echo connection timed out'));
    }, 10000);

    echoInstance.connector.pusher.connection.bind('connected', () => {
      clearTimeout(timeout);
      resolve(echoInstance);
    });

    echoInstance.connector.pusher.connection.bind('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Echo connection error: ${error.message || 'Unknown error'}`));
    });
  });
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
