import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import axios from 'axios';

const app = express();
const port = 3000;

// Cấu hình CORS và Express
app.use(cors());

app.use(
  cors({
    origin: 'http://localhost:5173', // Cho phép yêu cầu từ front-end trên cổng 5173
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Cho phép các phương thức HTTP này
    allowedHeaders: ['Content-Type'], // Các headers được phép
  })
);

app.use(express.json());

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Kết nối MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.PASSWORD_MYSQL, // Thay bằng mật khẩu của bạn
  database: 'TourManagement', // Tên database
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  } else {
    console.log('Connected to MySQL');
  }
});

// API lấy danh sách các tour
app.get('/api/tour', (req, res) => {
  const query = `select * from tour`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.json(results);
    }
  });
});

// API lấy thông tin tri tiết của tour
app.get('/api/tour/:tourid/', (req, res) => {
  const tourid = req.params.tourid;
  const query = `select * from tour
  where tour.tourid = ?`;
  db.query(query, [tourid], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.json(results[0]);
    }
  });
});

// API lấy danh sách schedule của tourID
app.get('/api/tour/:tourid/schedule', (req, res) => {
  const tourid = req.params.tourid;
  const query = `select schedule.*, ts.* from tour
  join tour_schedule ts on tour.tourid = ts.tourid
  join schedule on ts.ScheduleID = schedule.ScheduleID
  where tour.tourid = ?`;
  db.query(query, [tourid], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.json(results);
    }
  });
});

// API lấy danh sách service của tourid
app.get('/api/tour/:tourid/service', (req, res) => {
  const tourid = req.params.tourid;
  const query = `select service.*, ts.* from tour
  join tour_service ts on tour.tourid = ts.tourid
  join service on ts.serviceid = service.serviceid
  where tour.tourid = ?`;
  db.query(query, [tourid], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.json(results);
    }
  });
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
