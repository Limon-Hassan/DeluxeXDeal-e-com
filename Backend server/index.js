let express = require('express');
require('dotenv').config();
const path = require('path');
const Connection = require('./config/dbConfig');
let router = require('./Router/index');
let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let cors = require('cors');
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://deluxexdeal.com',
      'https://www.deluxexdeal.com',
      'https://dashboard.deluxexdeal.com',
      'https://www.dashboard.deluxexdeal.com',
      'https://api.deluxexdeal.com',
      'https://www.api.deluxexdeal.com',
    ],
    credentials: true,
  }),
);

Connection();
app.use(router);
app.use(express.static('uploads'));
app.use(express.static('productImage'));
app.use(express.static('productVideo'));
let http = require('http');
const { init: initSocket } = require('./socket_server');
const { sendServerEvent } = require('./config/sendServerEvent');
let server = http.createServer(app);
const io = initSocket(server);
io.on('connection', socket => {
  socket.on('joinUser', () => {
    const roomId = socket.id;
    socket.join(roomId);
  });

  socket.on('joinCart', ({ cartId }) => {
    socket.join(cartId);
  });

  socket.on('joinProduct', ({ productId }) => {
    socket.join(productId);
  });

  socket.on('joinAdmin', () => {
    socket.join('adminRoom');
  });

  socket.on('disconnect', () => {
    console.log(' User disconnected:', socket.id);
  });

  socket.on(
    'searchProducts',
    async ({ query: value, page = 1, limit = 20 }) => {
      try {
        const { searchProduct } = require('./AllHandler/searchHandler');

        const req = { query: { query: value, page, limit } };
        const res = {
          status: code => ({
            json: data => socket.emit('searchResults', data),
          }),
        };
        const next = err => {
          if (err) {
            socket.emit('searchError', { msg: err.message });
          }
        };

        await searchProduct(req, res, next);
      } catch (error) {
        console.error('Socket search error:', error);
        socket.emit('searchError', { msg: 'Something went wrong' });
      }
    },
  );
});

app.get('/test-fb-pixel', async (req, res) => {
  try {
    const data = await sendServerEvent('PageView', {
      email: 'test@gmail.com',
      ip: req.ip || '127.0.0.1',
      ua: req.headers['user-agent'] || 'test-agent',
      event_id: `test-pageview-${Date.now()}`,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World !');
});

const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
module.exports = { app, server };
