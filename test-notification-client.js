const path = require('path');
const API = 'http://localhost:3000';
const socketIoClientPath = path.join(__dirname, 'repairhubcoreui', 'node_modules', 'socket.io-client');
const io = require(socketIoClientPath);

(async () => {
  try {
    console.log('Logging in as admin...');
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@system.com', password: 'AdminMasterPass.00' })
    });
    const loginJson = await loginRes.json();
    console.log('Login response:', loginJson);
    const token = loginJson?.access_token || loginJson?.token || loginJson?.accessToken || loginJson?.data?.access_token;
    if (!token) {
      console.error('No token returned from login');
      process.exit(1);
    }

    console.log('Connecting socket with token...');
    const socket = io(API, { auth: { token } });

    socket.on('connect', () => {
      console.log('Socket connected', socket.id);
    });

    socket.on('notification', (n) => {
      console.log('Received notification via socket:', n);
      process.exit(0);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error', err.message || err);
    });

    // wait a bit to connect
    await new Promise(res => setTimeout(res, 1000));

    console.log('Creating broadcast notification via API...');
    const createRes = await fetch(`${API}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Prueba socket', message: 'Mensaje de prueba', isBroadcast: true })
    });
    const created = await createRes.json();
    console.log('Create response:', created);

    // wait up to 8s for socket event
    setTimeout(() => {
      console.log('No notification received within timeout');
      process.exit(2);
    }, 8000);

  } catch (err) {
    console.error('Test error', err);
    process.exit(1);
  }
})();
