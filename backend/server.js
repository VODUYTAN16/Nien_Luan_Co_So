import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import axios from 'axios';
import util from 'util';
import { constrainedMemory } from 'process';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { scheduler } from 'timers/promises';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 8081;

// app.use(express.json({ limit: '50mb' })); // Tăng giới hạn payload JSON

// Cấu hình CORS và Express
app.use(
  cors({
    origin: [
      'https://webhamornycharitytravel-production.up.railway.app',
      'https://nienluancoso-production.up.railway.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Thêm OPTIONS cho preflight
    allowedHeaders: ['Content-Type', 'Authorization'], // Thêm Authorization nếu dùng JWT
    credentials: true,
  })
);
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(function (req, res, next) {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});
// Cấu hình Multer để lưu file vào thư mục uploads
const storage = multer.diskStorage({
  destination: 'uploads/', // Thư mục lưu ảnh
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file theo timestamp
  },
});

const upload = multer({ storage });

const sqlScript = fs.readFileSync('./init.sql', 'utf-8');

// Kết nối MySQL
const db = mysql.createConnection({
  // host: 'localhost',
  // user: 'root',
  // password: process.env.PASSWORD_MYSQL, // Thay bằng mật khẩu của bạn
  // database: 'TourManagement', // Tên database
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQLPORT,
  connectTimeout: 10000,
  multipleStatements: true,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  } else {
    console.log('Connected to MySQL');
  }
});

//initial database
db.query(sqlScript, (err, results) => {
  if (err) throw err;
  console.log('Database initialized.');
});
////////////////////////////////////////////////////////////////////////////////

// API để upload ảnh
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }
  console.log(req.body);

  const imagePath = `http://localhost:${port}/uploads/${req.file.filename}`;
  res
    .status(200)
    .json({ message: 'Upload succsessfully', imageUrl: imagePath });
});

// API tìm bài viết mới nhất
app.get('/api/posts/related', (req, res) => {
  const query = `
   SELECT 
    posts.postid, 
    posts.createdat, 
    posts.views, 
    user.fullname AS author, 
    user.avatarurl AS authoravatar, 
    categories.name AS category,
    postcontent.title, 
    postcontent.subtitle, 
    postcontent.contentintro, 
    postcontent.quote, 
    postcontent.contentbody, 
    postcontent.imageurl
FROM posts
INNER JOIN user ON posts.authorid = user.userid
INNER JOIN categories ON posts.categoryid = categories.categoryid
INNER JOIN postcontent ON posts.postid = postcontent.postid
WHERE categories.name = 'blog'
ORDER BY posts.createdat DESC
LIMIT 3
`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching related posts:', err);
      res.status(500).json({ message: 'Error fetching related posts' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/posts', (req, res) => {
  const category_name = req.query.category_name; // Lấy category_id từ tham số query
  // Xây dựng phần WHERE trong câu truy vấn
  let query = `
  SELECT 
      posts.postid, 
      posts.createdat, 
      posts.views, 
      user.fullname AS author, 
      user.avatarurl AS authoravatar, 
      categories.name AS category,
      postcontent.title, 
      postcontent.subtitle, 
      postcontent.contentintro, 
      postcontent.quote, 
      postcontent.contentbody, 
      postcontent.link, 
      postcontent.imageurl, 
      postcontent.contentid AS postcontentid
  FROM posts
  INNER JOIN user ON posts.authorid = user.userid
  INNER JOIN categories ON posts.categoryid = categories.categoryid
  INNER JOIN postcontent ON posts.postid = postcontent.postid
`;

  // Nếu có category_name, thêm điều kiện WHERE vào câu truy vấn
  if (category_name) {
    query += ` WHERE categories.name = ?`;
  } else {
    query += ` WHERE categories.name = 'blog'`;
  }

  query += ` ORDER BY posts.createdat DESC;`; // Sắp xếp theo thời gian tạo mới nhất

  // Thực thi truy vấn
  db.query(query, [category_name], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving posts' });
    } else {
      res.json(results);
    }
  });
});

// API để xóa bài đăng và nội dung bài đăng
app.delete('/api/posts/:postId/contents/:postContentId', (req, res) => {
  const { postId, postContentId } = req.params;

  // Kiểm tra sự tồn tại của bài đăng và nội dung bài đăng
  const checkQuery = `
    SELECT * FROM posts 
    INNER JOIN postcontent ON posts.postid = postcontent.postid
    WHERE posts.postid = ? AND postcontent.postid = ?
  `;

  db.query(checkQuery, [postId, postContentId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: 'Error checking post and content',
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Post or content not found' });
    }

    // Xóa nội dung bài đăng
    const deleteContentQuery = 'DELETE FROM postcontent WHERE contentid = ?';
    db.query(deleteContentQuery, [postContentId], (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Error deleting post content', error: err.message });
      }

      // Xóa bài đăng nếu không còn nội dung nào liên kết
      const checkRemainingContentsQuery =
        'SELECT * FROM postcontent WHERE postid = ?';
      db.query(
        checkRemainingContentsQuery,
        [postId],
        (err, remainingContents) => {
          if (err) {
            return res.status(500).json({
              message: 'Error checking remaining content',
              error: err.message,
            });
          }

          if (remainingContents.length === 0) {
            const deletePostQuery = 'DELETE FROM posts WHERE postid = ?';
            db.query(deletePostQuery, [postId], (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ message: 'Error deleting post', error: err.message });
              }

              return res
                .status(200)
                .json({ message: 'Post and content deleted successfully' });
            });
          } else {
            return res.status(200).json({
              message: 'Content deleted successfully, post still exists',
            });
          }
        }
      );
    });
  });
});

// API lấy chi tiết bài viết theo ID (posts và post_content)
app.get('/api/posts/:id', (req, res) => {
  const postId = req.params.id;
  const query = `
    SELECT *
    FROM posts
    INNER JOIN user ON posts.authorid = user.userid
    INNER JOIN categories ON posts.categoryid = categories.categoryid
    INNER JOIN postcontent ON posts.postid = postcontent.postid
    WHERE posts.postid = ?`;
  db.query(query, [postId], (err, results) => {
    if (err) {
      console.log('Error retrieving blog post');
      res.status(500).json({ message: 'Error retrieving blog post' });
    } else if (results.length === 0) {
      console.log('Post not found');
      res.status(404).json({ message: 'Post not found' });
    } else {
      res.json(results[0]);
    }
  });
});

// API đăng bài viết mới (posts và post_content)
app.post('/api/posts', (req, res) => {
  const {
    AuthorID,
    CategoryID,
    ImageUrl,
    Title,
    Subtitle,
    ContentIntro,
    Quote,
    ContentBody,
    Link,
  } = req.body;
  console.log(req.body);

  // Thêm vào bảng posts
  const insertPostQuery = `
    INSERT INTO posts (authorid, categoryid)
    VALUES (?, ?)
  `;

  db.query(insertPostQuery, [AuthorID, CategoryID], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating post' });
    }

    const postId = result.insertId;

    // Thêm chi tiết bài viết vào bảng post_content
    const insertContentQuery = `
      INSERT INTO postcontent (postid, title, subtitle, contentintro, quote, contentbody, imageurl, link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertContentQuery,
      [
        postId,
        Title,
        Subtitle,
        ContentIntro,
        Quote,
        ContentBody,
        ImageUrl,
        Link,
      ],
      (err, result) => {
        if (err) {
          res.status(500).json({ message: 'Error creating post content' });
        } else {
          res.status(200).json({
            Title,
            image: ImageUrl,
            message: 'Post created successfully',
            postId: postId,
          });
        }
      }
    );
  });
});

// API lấy danh sách danh mục
app.get('/api/categories', (req, res) => {
  const query = 'SELECT * FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.status(200).json(results);
    }
  });
});

// API lấy danh sách admin
app.get('/api/users/admin', (req, res) => {
  const query = `SELECT * from user join user_role ur on user.userid = ur.userid join role on ur.roleid = role.roleid`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error get admin list' });
    } else {
      res.json(results);
    }
  });
});

// API thêm danh mục mới
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  const query = `
    INSERT INTO categories (name)
    VALUES (?)
  `;
  db.query(query, [name], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error creating category' });
    } else {
      res.status(200).json({
        message: 'Category created successfully',
        categoryId: result.insertId,
      });
    }
  });
});

// API lấy danh sách bình luận cho bài viết
app.get('/api/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;
  const query = `
    SELECT 
      *
    FROM comments
    JOIN user ON comments.authorid = user.userid
    WHERE comments.postid = ?
  `;
  db.query(query, [postId], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving comments' });
    } else {
      res.json(results);
    }
  });
});

// API thêm bình luận cho bài viết
app.post('/api/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;
  const { author_id, content, email } = req.body;
  console.log(req.body);

  // Tiến hành chèn bình luận vào bảng comments
  const insertCommentQuery =
    'INSERT INTO comments (postid, authorid, content) VALUES (?, ?, ?)';

  console.log(postId, author_id, content);
  db.query(insertCommentQuery, [postId, author_id, content], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating comment' });
    }

    res.status(200).json({
      message: 'Comment created successfully',
      commentId: result.insertId,
    });
  });
});

//API xóa comment
app.delete('/api/posts/:postId/comments/:commentId', (req, res) => {
  const { postId, commentId } = req.params;
  const { author_id } = req.body; // Lấy `author_id` từ body của request

  // Truy vấn để xóa bình luận dựa trên `author_id`, `post_id` và `id`
  const deleteCommentQuery =
    'DELETE FROM comments WHERE commentid = ? AND postid = ? AND authorid = ?';

  db.query(
    deleteCommentQuery,
    [commentId, postId, author_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting comment' });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: 'Comment not found or unauthorized' });
      }

      res.status(200).json({ message: 'Comment deleted successfully' });
    }
  );
});

// API đếm số comment của bài viết
app.get('/api/comments/:postId', (req, res) => {
  const postId = req.params.postId;

  if (postId == undefined) {
    return res.status(400).json({ message: 'PostId is required' });
  }

  const query = `SELECT COUNT(*) as count FROM comments WHERE postid = ?`;

  db.query(query, [postId], (err, results) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Error checking like status' });
    }

    if (results) {
      return res.status(200).json(results[0].count);
    }
  });
});

// API tăng/giảm lượt thích
app.post('/api/posts/:id/like', (req, res) => {
  const postId = req.params.id; // ID bài viết
  const { userId, action } = req.body; // ID người dùng và hành động ('like' hoặc 'unlike')

  if (!['like', 'unlike'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  // Thực hiện thêm hoặc xóa bản ghi trong bảng user_likes
  if (action === 'like') {
    const addLikeQuery = `
        INSERT INTO userlikes (userid, postid)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE likeid=likeid; -- Đảm bảo không thêm trùng lặp
      `;
    db.query(addLikeQuery, [userId, postId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Error adding to user_likes' });
      }
      return res.status(200).json({ message: 'Post liked successfully' });
    });
  } else if (action === 'unlike') {
    const removeLikeQuery = `
        DELETE FROM userlikes
        WHERE userid = ? AND postid = ?
      `;
    db.query(removeLikeQuery, [userId, postId], (err) => {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({ message: 'Error removing from user_likes' });
      }
      return res.status(200).json({ message: 'Post unliked successfully' });
    });
  }
});

//API đếm số lượt like của bài viết
app.get('/api/user_likes/:postId', (req, res) => {
  const postId = req.params.postId;

  if (postId == undefined) {
    return res.status(400).json({ message: 'PostId is required' });
  }

  const query = `SELECT COUNT(*) as count FROM userlikes WHERE postid = ?`;

  db.query(query, [postId], (err, results) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Error checking like status' });
    }

    if (results) {
      return res.status(200).json(results[0].count);
    }
  });
});

// API kiểm tra người dùng đã like bài viết hay chưa
app.get('/api/posts/:userId/is-liked/:postId', (req, res) => {
  const userId = req.params.userId;
  const postId = req.params.postId;

  if (userId === undefined || userId == null) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const query = `
    SELECT *
    FROM userlikes
    WHERE userid = ? AND postid = ?
  `;

  db.query(query, [userId, postId], (err, results) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Error checking like status' });
    }

    if (results.length === 0) {
      return res.status(200).json({ isLiked: false });
    } else {
      return res.status(200).json({ isLiked: true });
    }
  });
});

////////////////////////////////////////////////////////////////////////////////////

// Số vòng lặp để tăng độ phức tạp của thuật toán băm
const saltRounds = 10;

// Hàm băm mật khẩu
async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Lỗi khi băm mật khẩu:', error);
    throw error;
  }
}

async function comparePassword(password, hashedPassword) {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match; // Trả về true nếu mật khẩu khớp, false nếu sai
  } catch (error) {
    console.error('Lỗi khi so sánh mật khẩu:', error);
    throw error;
  }
}

// API đăng nhập bằng google
app.post('/api/google-login', (req, res) => {
  const { Email, FullName, AvatarUrl } = req.body;

  // Kiểm tra xem user đã tồn tại chưa
  const queryCheck = 'SELECT * FROM user WHERE email = ?';
  db.query(queryCheck, [Email], (err, results) => {
    if (err) {
      console.error('Database error:', err); // Ghi lại lỗi cơ sở dữ liệu
      return res
        .status(500)
        .json({ message: 'Lỗi khi truy vấn cơ sở dữ liệu' });
    }
    if (results.length > 0) {
      // Nếu user đã tồn tại, trả về thông tin
      res
        .status(200)
        .json({ message: 'Đăng nhập thành công!', user: results[0] });
    } else {
      // Nếu chưa tồn tại, thêm user vào database
      const queryInsert =
        'INSERT INTO user (fullname, email, avatarurl) VALUES (?, ?, ?)';
      db.query(queryInsert, [FullName, Email, AvatarUrl], (err, result) => {
        if (err) throw err;
        // Lấy id của user vừa thêm
        const queryGetId = result.insertId;
        res.status(200).json({
          message: 'Tạo tài khoản mới và đăng nhập thành công!',
          user: {
            UserID: queryGetId,
            FullName: FullName,
            Email: Email,
            Role: 'user',
            AvatarUrl: AvatarUrl,
          },
        });
      });
    }
  });
});

// API đăng ký (Register)
app.post('/api/register', async (req, res) => {
  const { Email, FullName, PhoneNumber, AvatarUrl } = req.body;
  let { Password } = req.body;
  try {
    try {
      if (!Password) throw new Error('Mật khẩu không hợp lệ!');
      Password = await hashPassword(Password.trim());
    } catch (error) {
      console.error('Lỗi khi băm mật khẩu:', error);
    }

    // Kiểm tra xem email đã tồn tại chưa
    db.query(`SELECT * FROM user WHERE email = ?`, [Email], (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ message: `Database error1 ${err}`, error: err.message });
      }

      if (results.length > 0) {
        // Nếu email đã tồn tại
        return res.status(400).json({
          message: "This Account is already exist, let's Sign In",
        });
      }

      // Nếu email chưa tồn tại, tiến hành tạo tài khoản
      db.query(
        `INSERT INTO user (email, password, fullname, phonenumber, avatarurl) VALUES (?, ?, ?, ?, ?)`,
        [Email, Password, FullName, PhoneNumber, AvatarUrl],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ message: `Database error2 ${err}`, error: err.message });
          }

          res.status(200).json({
            message: 'Account created successfully!',
            user: result[0],
          });
        }
      );
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: 'Error creating user', error: error.message });
  }
});

// API đăng nhập (Login)
app.post('/api/login', async (req, res) => {
  const { Email } = req.body;
  let { Password } = req.body;
  if (!Email || !Password) {
    return res.status(400).json({ message: 'Email and Password are required' });
  }

  try {
    // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu không
    db.query(
      `SELECT * FROM user WHERE email = ?`,
      [Email],
      async (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ message: `Database error ${err}`, error: err.message });
        }

        if (results.length === 0) {
          return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = results[0];

        // Kiểm tra mật khẩu
        const isPasswordValid = await comparePassword(Password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({
            message:
              "Invalid email or password or you register by google before, Let's login by google",
          });
        }

        res.status(200).json({
          message: 'Login successful',
          user: results[0],
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// API đăng nhập (Login) của Admin
app.post('/api/login/admin', async (req, res) => {
  const { Email } = req.body;
  let { Password } = req.body;
  Password = Password.trim();
  console.log(req.body);
  try {
    // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu không
    db.query(
      `SELECT * FROM user join user_role ur on user.userid = ur.userid
      join role on ur.roleid = role.roleid WHERE email = ?`,
      [Email],
      async (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ message: 'Database error', error: err.message });
        }

        if (results.length === 0) {
          return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = results[0];
        console.log(user);

        // Kiểm tra mật khẩu
        const isPasswordValid = await comparePassword(Password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({
            message: 'Invalid password',
          });
        }

        res.status(200).json({
          message: 'Login successful',
          user: results[0],
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// API Proxy để tải file PDF từ Google Drive
app.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;

    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Đặt tiêu đề Content-Type để trình duyệt biết đây là file PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Hiển thị trực tiếp
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching PDF:', error.message);
    res.status(500).send('Error fetching PDF');
  }
});

////////////////////////////////////////////////////////////////////////////////

// API lấy thông tin cơ bản của tour theo tourid
const queryAsync = util.promisify(db.query).bind(db);
app.get('/api/basis_inf/:tourid', async (req, res) => {
  try {
    const tourid = req.params.tourid;

    const query = `
      SELECT * FROM tour 
      JOIN schedule s ON tour.tourid = s.tourid
      WHERE tour.tourid = ? AND s.isdeleted = 0 AND tour.isdeleted = 0`;

    const sql = `
      SELECT * FROM tour  
      JOIN tour_service ts ON ts.tourid = tour.tourid 
      WHERE tour.tourid = ? AND ts.isdeleted = 0`;

    const query1 = `SELECT it.* FROM tour 
    JOIN itinerary it ON tour.tourid = it.tourid WHERE tour.tourid = ? AND tour.isdeleted = 0 AND it.isdeleted = 0`;

    // Thực hiện truy vấn
    var tourInf = null;
    var dateForms = null;

    db.query(query, [tourid], async (err, results) => {
      if (err) {
        console.error('Error fetching tour info:', err.message);
        res.status(500).send('Error fetching tour info');
      }
      tourInf = results[0] || null;
      dateForms = await Promise.all(
        results.map(async (schedule) => {
          const query = `SELECT * FROM schedule 
                       JOIN schedule_ts s ON schedule.scheduleid = s.scheduleid
                       JOIN tour_service ts ON ts.serviceid = s.serviceid AND ts.tourid = s.tourid
                       WHERE schedule.scheduleid = ? AND schedule.isdeleted = 0 `;
          let results2 = await queryAsync(query, [schedule.scheduleid]);
          results2 = results2.reduce((acc, item) => {
            acc[item.serviceid] = item.availablespots;
            return acc;
          }, {});

          return {
            ScheduleID: schedule.scheduleid,
            date: schedule.startdate,
            Capacity: schedule.capacity,
            services: results2,
          };
        })
      );
    });

    const results2 = await queryAsync(sql, [tourid]);
    const results3 = await queryAsync(query1, [tourid]);

    // Xử lý dữ liệu
    const serviceForms = results2.map((service) => ({
      ServiceID: service.serviceid,
      Status: service.status,
    }));

    res
      .status(200)
      .json({ tourInf, serviceForms, dateForms, itinerary: results3 });
  } catch (err) {
    console.error('Error fetching tour information:', err);
    res.status(500).json({ message: 'Error fetching tour information' });
  }
});

// API lấy danh sách các tour
app.get('/api/tour', (req, res) => {
  const query = `SELECT * FROM tour WHERE tour.isdeleted = 0`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.status(200).json(results);
    }
  });
});

// API lấy thông tin tri tiết của tour theo tourid
app.get('/api/tour/:tourid/', (req, res) => {
  const tourid = req.params.tourid;
  const query = `SELECT * FROM tour WHERE tour.tourid = ?`;
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
  const query = `SELECT ts.*, tour.* FROM tour
  JOIN schedule ts ON tour.tourid = ts.tourid
  WHERE tour.tourid = ? AND tour.isdeleted = 0 AND ts.isdeleted = 0`;
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
  const query = `SELECT service.*, ts.* FROM tour
  JOIN tour_service ts ON tour.tourid = ts.tourid
  JOIN service ON ts.serviceid = service.serviceid
  WHERE tour.tourid = ? AND ts.isdeleted = 0`;
  db.query(query, [tourid], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.status(200).json(results);
    }
  });
});

// API dùng để lấy danh sách schedule_ts
app.get('/api/tour/:tourid/:scheduleid', (req, res) => {
  const tourid = req.params.tourid;
  const scheduleid = req.params.scheduleid;
  const query = `SELECT s.* FROM tour JOIN schedule ON tour.tourid = schedule.tourid 
  JOIN schedule_ts s ON s.scheduleid = schedule.scheduleid WHERE tour.tourid = ? AND s.scheduleid = ? AND schedule.isdeleted = 0`;
  db.query(query, [tourid, scheduleid], (err, results) => {
    if (err) {
      console.log('Error retrieving schedule_ts', err);
      res.status(500).json({ message: 'Error retrieving schedule_ts' });
    }
    console.log(results);
    res.status(200).json(results);
  });
});

// API dùng để xóa tour tạm thời
app.put('/api/tour/:tourID', (req, res) => {
  const tourID = req.params.tourID;
  console.log(tourID);
  const query = `UPDATE tour SET isdeleted = TRUE WHERE tourid = ?`;
  db.query(query, [tourID], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error delete tour' });
    } else {
      res.status(200).json({ message: 'Tour was deleted successfully' });
    }
  });
});

// API tạo service
app.post('/api/create_service', (req, res) => {
  const service = req.body;
  const query = `INSERT INTO service (servicename, description, price) VALUE (?,?,?)`;
  db.query(
    query,
    [service.servicename, service.description, service.price],
    (err, results) => {
      if (err) {
        res.status(500).json({ message: 'Error create service' });
      } else {
        res.status(200).json({
          message: 'Service created successfully',
        });
      }
    }
  );
});

// APi dùng để lấy danh sách service
app.get('/api/services', (req, res) => {
  const query = `SELECT * FROM service`;
  db.query(query, (err, results) => {
    if (err) {
      console.log('Error retrieving services');
      res.status(500).json({ message: 'Error retrieving services' });
    } else {
      res.status(200).json(results);
    }
  });
});

//API dùng để xóa tạm thời service
app.put('/api/delete_service/:serviceId', (req, res) => {
  const serviceId = req.params.serviceId;
  console.log(serviceId);
  const query = `UPDATE service SET isdeleted = TRUE WHERE serviceid = ?`;
  db.query(query, [serviceId], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error updating service' });
    } else {
      res
        .status(200)
        .json({ message: 'Service marked as deleted successfully' });
    }
  });
});

//API dùng để khôi phục service
app.put('/api/restore_service/:serviceId', (req, res) => {
  const serviceId = req.params.serviceId;
  const query = `UPDATE service SET isdeleted = FALSE WHERE serviceid = ?`;
  db.query(query, [serviceId], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error updating service' });
    } else {
      res
        .status(200)
        .json({ message: 'Service marked as restored successfully' });
    }
  });
});

// API dùng để edit service
app.put('/api/update_service', (req, res) => {
  const query = `UPDATE service SET servicename = ?, price = ?, description = ? WHERE serviceid = ?`;
  db.query(
    query,
    [
      req.body.ServiceName,
      req.body.Price,
      req.body.Description,
      req.body.ServiceID,
    ],
    (err, results) => {
      if (err) {
        res.status(500).json({ message: 'Error update service' });
      } else {
        res.status(200).json({ message: 'Service updated successfully' });
      }
    }
  );
});

// API dùng để lấy danh sách các booking
app.get('/api/booking', (req, res) => {
  const query = `SELECT booking.*, s.startdate, tour.* FROM booking JOIN schedule ts ON ts.scheduleid = booking.scheduleid 
  JOIN schedule s ON s.scheduleid = ts.scheduleid 
  JOIN tour ON tour.tourid = ts.tourid WHERE booking.isdeleted = FALSE`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving booking' });
    } else {
      res.json(results);
    }
  });
});

// API dùng để lấy danh sách các booking Của người dùng
app.get('/api/booking/:userID', (req, res) => {
  const userID = req.params.userID;
  const query = `SELECT booking.*, s.startdate, tour.* FROM booking JOIN schedule ts ON ts.scheduleid = booking.scheduleid 
  JOIN schedule s ON s.scheduleid = ts.scheduleid 
  JOIN tour ON tour.tourid = ts.tourid AND booking.userid = ?`;
  db.query(query, [userID], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving booking' });
    } else {
      res.json(results);
    }
  });
});

// API dùng để tạo booking
app.post('/api/create_booking', async (req, res) => {
  // Keep request body variables in original format
  const buyer = req.body.Buyer;
  const participants = req.body.Participant;
  const schedulePicked = req.body.schedulePicked;
  const selectedOptions = req.body.selectedOptions;
  const total = req.body.total;

  console.log(req.body);
  const queryAsync = (sql, values) => {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };

  try {
    // 1️⃣ Create booking
    const bookingResult = await queryAsync(
      `INSERT INTO booking (numberofguests, scheduleid, userid, totalamount) VALUES (?,?,?,?)`,
      [participants.length, schedulePicked.ScheduleID, buyer.UserID, total]
    );
    const bookingID = bookingResult.insertId;

    // 2️⃣ Get schedule info
    const scheduleResult = await queryAsync(
      `SELECT * FROM schedule WHERE scheduleid = ?`,
      [schedulePicked.ScheduleID]
    );
    if (!scheduleResult.length) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // 3️⃣ Reduce available spots
    const availableSpots =
      scheduleResult[0].availablespots - participants.length;

    console.log('availableSpots:', availableSpots);
    const query =
      availableSpots === 0
        ? `UPDATE schedule SET availablespots = ?, status = 'Full' WHERE scheduleid = ?`
        : `UPDATE schedule SET availablespots = ? WHERE scheduleid = ?`;
    db.query(
      query,
      [availableSpots, schedulePicked.ScheduleID],
      (err, result) => {}
    );

    // 4️⃣ Add participant info (Run in parallel with Promise.all)
    const participantPromises = participants.map((part) => {
      return queryAsync(
        `INSERT INTO participant (bookingid, email, fullname, fullnameonpassport, nationality, passportnumber, dateofbirth, gender, phonenumber) VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          bookingID,
          part.email,
          part.firstName + ' ' + part.lastName,
          part.fullNameOnPassport,
          part.nationality,
          part.passportNumber,
          part.dateOfBirth,
          part.gender,
          part.phoneNumber,
        ]
      );
    });

    // 5️⃣ Add booking services (Run in parallel with Promise.all)
    const servicePromises = selectedOptions.map((option) => {
      return queryAsync(
        `INSERT INTO booking_service (bookingid, serviceid, quantity) VALUES (?,?,?)`,
        [bookingID, option.ServiceID, option.Quantity]
      );
    });

    // Reduce available quantity of selected services for the tour
    selectedOptions.map(async (option) => {
      const query = `SELECT * FROM schedule_ts WHERE scheduleid = ? AND serviceid = ? AND tourid = ?`;

      try {
        // Execute SELECT query and wait for result
        db.query(
          query,
          [schedulePicked.ScheduleID, option.ServiceID, option.TourID],
          (err, result) => {
            if (err) {
              console.log(err);
              return;
            }
            // Check if no results returned
            if (result.length === 0) {
              console.log('no schedule_ts');
              return { success: false, message: 'No matching schedule found' };
            }

            // Execute UPDATE query and wait for result
            db.query(
              `UPDATE schedule_ts SET availablespots = ? WHERE serviceid = ? AND tourid = ? AND scheduleid = ?`,
              [
                result[0].availablespots - option.Quantity,
                option.ServiceID,
                option.TourID,
                schedulePicked.ScheduleID,
              ]
            );

            // Return success result
            return { success: true, message: 'Update successful' };
          }
        );
      } catch (err) {
        // Handle error
        console.error('servicePromises2: ', err);
        return { success: false, message: 'Error in servicePromises2' };
      }
    });

    // Run INSERT queries in parallel for faster processing
    await Promise.all([...participantPromises, ...servicePromises]);

    res.status(200).json({ message: 'Tour Booked Successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Booking Fail' });
  }
});
app.put('/api/delete_booking', (req, res) => {
  const bookingID = req.body.bookingId;
  const query = `UPDATE booking SET isdeleted = true WHERE bookingid = ?`;
  db.query(query, [bookingID], (err, result) => {
    if (err) {
      console.log('Error delete booking');
      return res.status(500).json({ message: 'Error delete booking' });
    }
    res.status(200).json({
      message: 'Booking deleted successfully',
    });
  });
});

//API dùng để approve booking
app.post('/api/change_status', async (req, res) => {
  const bookingId = req.body.bookingId;
  const status = req.body.status;
  const tourid = req.body.tourId;
  const queryAsync = (sql, values) => {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };

  if (status === 'Cancelled') {
    const query = `SELECT * FROM booking WHERE bookingid = ?`;
    db.query(query, [bookingId], async (err, result) => {
      if (err) {
        console.log('Error get booking');
        return res.status(500).json({ message: 'Error get booking' });
      }
      const scheduleResult = await queryAsync(
        `SELECT * FROM schedule WHERE scheduleid = ?`,
        [result[0].schedule_id]
      );
      if (!scheduleResult.length) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      // Khôi phục AvailableSpots ở schedule
      db.query(
        `UPDATE schedule SET availablespots = ? WHERE scheduleid = ?`,
        [
          scheduleResult[0].availablespots + result[0].numberofguests,
          result[0].scheduleid,
        ],
        (err, result) => {
          if (err) {
            console.log('Error update schedule');
            return res.status(500).json({ message: 'Error update schedule' });
          }
        }
      );

      // Khôi phục AvailableSpots ở schedule_ts
      db.query(
        `SELECT * FROM booking join booking_service bs on booking.bookingid = bs.bookingid WHERE booking.bookingid = ?`,
        [bookingId],
        async (err, result) => {
          if (err) {
            console.log('Error update schedule_ts1');
            return res
              .status(500)
              .json({ message: 'Error update schedule_ts1' });
          }

          if (result.length > 0) {
            result.map((item) => {
              db.query(
                `SELECT * FROM schedule_ts WHERE scheduleid = ? AND serviceid = ? AND tourid = ?`,
                [item.scheduleid, item.serviceid, tourid],
                (error, result1) => {
                  if (err) {
                    console.log('Error update schedule_ts2');
                    return res
                      .status(500)
                      .json({ message: 'Error update schedule_ts2' });
                  }
                  if (result1.length > 0) {
                    db.query(
                      `UPDATE schedule_ts SET availablespots = ? WHERE scheduleid = ? AND serviceid = ? AND tourid = ?`,
                      [
                        result1[0].availablespots + item.quantity,
                        item.scheduleid,
                        item.serviceid,
                        tourid,
                      ],
                      (err, result2) => {
                        if (err) {
                          console.log('Error update schedule_ts3');
                          return res
                            .status(500)
                            .json({ message: 'Error update schedule_ts3' });
                        }
                      }
                    );
                  }
                }
              );
            });
          }
        }
      );
    });
  }

  const query = `UPDATE booking SET status = ? WHERE bookingid = ?`;
  db.query(query, [status, bookingId], (err, result) => {
    if (err) {
      console.log('Error approve booking');
      return res.status(500).json({ message: 'Error approve booking' });
    }
    res.status(200).json({ message: 'Booking Approved Successfuly' });
  });
});

//API dùng để lấy thông tin tri tiết về participant của booking
app.get('/api/detail_booking/:bookingId', (req, res) => {
  const bookingId = req.params.bookingId;
  const query = `SELECT * from booking 
join participant on booking.bookingid = participant.bookingid
join schedule on schedule.scheduleid = booking.scheduleid 
join tour on tour.tourid = schedule.tourid where booking.bookingid = ?`;
  db.query(query, bookingId, (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error get detail of booking' });
    } else {
      res.status(200).json(result);
    }
  });
});

// API dùng để lấy thông tin tri tiết của participant theo từng tour
app.get('/api/participant/:tourId/:scheduleId', (req, res) => {
  const tourId = req.params.tourId;
  const scheduleId = req.params.scheduleId;
  const query = `SELECT participant.*, booking.* FROM booking 
                 JOIN schedule ON booking.scheduleid = schedule.scheduleid
                 JOIN tour ON schedule.tourid = tour.tourid 
                 join participant on booking.bookingid = participant.bookingid
                 WHERE tour.tourid = ? AND schedule.scheduleid = ? AND booking.status != 'Pending' AND booking.isdeleted = FALSE`;

  db.query(query, [tourId, scheduleId], async (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Error getting participant of tour' });
    }
    res.status(200).json(result);
  });
});

// API dùng để lấy thông tin các service đã booked theo bookingId
app.get('/api/booked_service/:bookingId', (req, res) => {
  const bookingId = req.params.bookingId;
  const query = `SELECT * FROM booking
  join booking_service bs on booking.bookingid = bs.bookingid
  join service on bs.serviceid = service.serviceid where booking.bookingid = ?`;
  db.query(query, bookingId, (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error get booked service of booking' });
    } else {
      res.status(200).json(result);
    }
  });
});

// API dùng để tạo tour
app.post('/api/create_tour', async (req, res) => {
  const tourInf = req.body.tourInf;
  const dateForms = req.body.dateForms;
  const serviceForms = req.body.serviceForms;
  const itinerary = req.body.itinerary;

  console.log(dateForms);

  const query = `INSERT INTO tour (tourname, description, price, imgtour, duration) VALUES (?,?,?,?,?)`;

  db.query(
    query,
    [
      tourInf.tourname,
      tourInf.description,
      tourInf.price,
      tourInf.imgtour || 'no image',
      tourInf.duration,
    ],
    (err, result) => {
      if (err) {
        console.log('Error create tour', err);
        return res.status(500).json({ message: `Error create tour 1 ${err}` });
      } else {
        const tourID = result.insertId;
        dateForms.map((date) => {
          const query = `INSERT INTO schedule (tourid, startdate, capacity, availablespots, status) VALUES (?,?,?,?, ?)`;
          db.query(
            query,
            [tourID, date.date, date.capacity, date.capacity, 'available'],
            (err, result) => {
              if (err) {
                console.log('Error create schedule', err);
                return res
                  .status(500)
                  .json({ message: 'Error create schedule for tour ${err}' });
              }

              const scheduleID = result.insertId;
              const numericKeys = Object.entries(date.services);

              numericKeys.map(([serviceid, capacity]) => {
                const query = `INSERT INTO schedule_ts (tourid, scheduleid, serviceid, availablespots, capacity) VALUES (?,?,?,?,?)`;
                console.log(tourID, scheduleID, serviceid, capacity);
                db.query(
                  query,
                  [tourID, scheduleID, serviceid, capacity, capacity],
                  (err) => {
                    if (err) {
                      console.log('Error create schedule_ts', err);
                      return res
                        .status(500)
                        .json({ message: 'Error create schedule_ts' });
                    }
                  }
                );
              });
            }
          );
        });

        serviceForms.map((service) => {
          const query = `INSERT INTO tour_service(tourid, serviceid ,status) VALUES (?,?,?)`;
          db.query(
            query,
            [tourID, service.serviceid, service.status],
            (err, result) => {
              if (err) {
                console.log('Error create service', err);

                return res
                  .status(500)
                  .json({ message: 'Error create service for tour' });
              }
            }
          );
        });

        itinerary.map((item) => {
          const query = `INSERT INTO itinerary(daynumber, location, activities, mealsincluded, imageurl, description, tourid) VALUES (?,?,?,?,?,?,?)`;

          db.query(
            query,
            [
              item.daynumber,
              item.location,
              item.activities,
              item.mealsincluded,
              item.imageurl,
              item.description,
              tourID,
            ],
            (err, result) => {
              if (err) {
                console.log('Error create itinerary', err);

                return res
                  .status(500)
                  .json({ message: 'Error create itinerary for tour' });
              }
            }
          );
        });

        res.status(200).json({
          message: 'schedule for tour created successfully',
        });
      }
    }
  );
});

// API dùng để chỉnh sửa tour
app.put('/api/edit_tour', async (req, res) => {
  try {
    const { tourInf, dateForms, serviceForms, itinerary } = req.body;
    console.log(dateForms);
    // Kiểm tra tourID
    if (!tourInf.TourID) {
      return res.status(400).json({ message: 'Missing TourID' });
    }

    // Cập nhật thông tin tour
    const updateTourQuery = `
      UPDATE tour 
      SET tourname = ?, description = ?, price = ?, imgtour = ?, duration = ?
      WHERE tourid = ?
    `;

    await queryAsync(updateTourQuery, [
      tourInf.TourName,
      tourInf.Description,
      tourInf.Price,
      tourInf.Img_Tour,
      tourInf.Duration,
      tourInf.TourID,
    ]);

    if (dateForms) {
      for (const date of dateForms) {
        const services = Object.entries(date.services);
        // Kiểm tra xem lịch trình có tồn tại không
        const checkScheduleQuery = `SELECT * FROM schedule WHERE tourid = ? AND startdate = ?`;
        const existingSchedule = await queryAsync(checkScheduleQuery, [
          tourInf.TourID,
          date.date,
        ]);

        if (existingSchedule.length > 0) {
          // Nếu tồn tại, cập nhật số lượng chỗ trống
          const SpotsIncrease = date.Capacity - existingSchedule[0].capacity;
          console.log(SpotsIncrease, date.Capacity);
          const updateScheduleQuery = `
          UPDATE schedule 
          SET capacity = ?, availablespots = ?
          WHERE tourid = ? AND startdate = ?
        `;
          await queryAsync(updateScheduleQuery, [
            date.Capacity,
            existingSchedule[0].availablespots + SpotsIncrease >= 0
              ? existingSchedule[0].availablespots + SpotsIncrease
              : 0,
            tourInf.TourID,
            date.date,
          ]);

          for (const [key, value] of services) {
            const checkService = `SELECT * FROM schedule_ts WHERE tourid = ? AND scheduleid = ? AND serviceid = ?`;
            const existingService = await queryAsync(checkService, [
              tourInf.TourID,
              date.ScheduleID,
              key,
            ]);

            if (existingService.length > 0) {
              const serviceIncrease = value - existingService[0].availablespots;
              const updateServiceQuery = `UPDATE schedule_ts SET capacity = ?, availablespots = ? WHERE tourid = ? AND scheduleid = ? AND serviceid = ?`;
              await queryAsync(updateServiceQuery, [
                existingService[0].capacity + serviceIncrease >= 0
                  ? existingService[0].capacity + serviceIncrease
                  : 0,
                value,
                tourInf.TourID,
                date.ScheduleID,
                key,
              ]);
            } else {
              const insertServiceQuery = `INSERT INTO schedule_ts (tourid, scheduleid, serviceid, capacity, availablespots) VALUES (?, ?, ?, ?, ?)`;
              await queryAsync(insertServiceQuery, [
                tourInf.TourID,
                date.ScheduleID,
                key,
                value,
                value,
              ]);
            }
          }
        } else {
          // Nếu chưa tồn tại, chèn mới
          const insertScheduleQuery = `
          INSERT INTO schedule (tourid, startdate, capacity, availablespots, status) 
          VALUES (?, ?, ?, ?, ?)
        `;

          db.query(
            insertScheduleQuery,
            [
              tourInf.TourID,
              date.date,
              date.Capacity,
              date.AvailableSpots,
              'Available',
            ],
            async (err, result) => {
              if (err) {
                console.log('insertScheduleQuery', err);
                res.status(500).json({ message: 'Error insertScheduleQuery' });
              }
              const ScheduleID = result.insertId;
              if (services.length > 0) {
                for (const [key, value] of services) {
                  const insertServiceQuery = `INSERT INTO schedule_ts (tourid, scheduleid, serviceid, capacity, availablespots) VALUES (?, ?, ?, ?, ?)`;
                  await queryAsync(insertServiceQuery, [
                    tourInf.TourID,
                    ScheduleID,
                    key,
                    value,
                    value,
                  ]);
                }
              }
            }
          );
        }
      }
    }

    if (serviceForms) {
      for (const service of serviceForms) {
        const checkServiceQuery = `SELECT * FROM tour_service WHERE tourid = ? AND serviceid = ?`;
        const existingService = await queryAsync(checkServiceQuery, [
          tourInf.TourID,
          service.ServiceID,
        ]);

        if (existingService.length > 0) {
          // Nếu dịch vụ đã tồn tại, cập nhật lại
          const updateServiceQuery = `
          UPDATE tour_service 
          SET status = ?, isdeleted = false
          WHERE tourid = ? AND serviceid = ?
        `;
          await queryAsync(updateServiceQuery, [
            service.Status,
            tourInf.TourID,
            service.ServiceID,
          ]);
        } else {
          // Nếu chưa tồn tại, chèn mới
          const insertServiceQuery = `
          INSERT INTO tour_service (tourid, serviceid, status) 
          VALUES (?, ?, ?)
        `;
          await queryAsync(insertServiceQuery, [
            tourInf.TourID,
            service.ServiceID,
            service.Status,
          ]);
        }
      }
    }

    if (itinerary) {
      for (const item of itinerary) {
        const checkItineraryQuery = `SELECT * FROM itinerary WHERE tourid = ? AND daynumber = ? AND isdeleted = 0`;
        const existingItinerary = await queryAsync(checkItineraryQuery, [
          tourInf.TourID,
          item.DayNumber,
        ]);

        if (existingItinerary.length > 0) {
          // Nếu đã tồn tại, cập nhật thông tin
          const updateItineraryQuery = `
          UPDATE itinerary 
          SET location = ?, activities = ?, mealsincluded = ?, imageurl = ?, description = ?
          WHERE tourid = ? AND daynumber = ?
        `;
          await queryAsync(updateItineraryQuery, [
            item.Location,
            item.Activities,
            item.MealsIncluded,
            item.ImageUrl,
            item.Description,
            tourInf.TourID,
            item.DayNumber,
          ]);
        } else {
          // Nếu chưa tồn tại, chèn mới
          const insertItineraryQuery = `
          INSERT INTO itinerary (daynumber, location, activities, mealsincluded, imageurl, description, tourid) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
          await queryAsync(insertItineraryQuery, [
            item.DayNumber,
            item.Location,
            item.Activities,
            item.MealsIncluded,
            item.ImageUrl,
            item.Description,
            tourInf.TourID,
          ]);
        }
      }
    }

    res.status(200).json({ message: 'Tour updated successfully' });
  } catch (err) {
    console.error('Error updating tour:', err);
    res.status(500).json({ message: 'Error updating tour' });
  }
});

// API lấy danh sách user
app.get('/api/users_list', (req, res) => {
  const query = `SELECT * from user`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving user' });
    } else {
      res.status(200).json(results);
    }
  });
});

// API lấy danh sách admin
app.get('/api/admins_list', (req, res) => {
  const query = `select * from user join user_role ur on user.userid = ur.userid join role on ur.roleid = role.roleid`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving admin list' });
    } else {
      if (results.length === 0) {
        res.status(200).json({ message: 'No admin found' });
      }
      res.json(results);
    }
  });
});

// API promote admin hay manager
app.post('/api/promote', (req, res) => {
  const user = req.body.user;
  const query = `SELECT * FROM user join user_role ur on user.userid = ur.userid WHERE email = ?`;
  db.query(query, [user.email], (err, results) => {
    if (err) {
      res.status(500).json({ message: `Error promote user 1 ${err}` });
    } else {
      if (results.length === 0) {
        const query = `INSERT INTO user_role (userid, roleid) VALUES (?, ?)`;
        db.query(query, [user.userid, req.body.role], (err, results) => {
          if (err) {
            res.status(500).json({ message: `Error promote user 2 ${err}` });
          } else {
            res.json({ message: 'User promoted successfully' });
          }
        });
      } else {
        const query = `UPDATE userrole SET roleid = ? WHERE userid = ?`;
        db.query(query, [req.body.role, user.userid], (err, results) => {
          if (err) {
            res.status(500).json({ message: `Error promote user 3 ${err}` });
          } else {
            res.status(200).json({ message: 'User promoted successfully' });
          }
        });
      }
    }
  });
});

// API dùng để xóa user
app.put('/api/delete_user', (req, res) => {
  const query = `UPDATE user SET isdeleted = true WHERE userid = ?`;
  db.query(query, [req.body.UserID], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error delete user' });
    } else {
      res.status(200).json({ message: 'User deleted successfully' });
    }
  });
});

// APi dùng để chỉnh sửa thông tin user
app.put('/api/update_user', (req, res) => {
  const query = `UPDATE user SET fullname = ?, email = ?, password = ?, phonenumber = ? WHERE userid = ?`;
  db.query(
    query,
    [
      req.body.FullName,
      req.body.Email,
      req.body.Password,
      req.body.PhoneNumber,
      req.body.UserID,
    ],
    (err, results) => {
      if (err) {
        res.status(500).json({ message: 'Error update user' });
      } else {
        res.status(200).json({ message: 'User updated successfully' });
      }
    }
  );
});

// API dùng để gián chức user
app.delete('/api/dismissal/:UserID', (req, res) => {
  const query = `DELETE FROM user_role WHERE userid = ?`;
  db.query(query, [req.params.UserID], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error dismissal user' });
    } else {
      res.status(200).json({
        message: 'User dismissed successfully',
      });
    }
  });
});

// API lấy thống kê đặt tour theo năm/quý
app.get('/api/statistics', async (req, res) => {
  const { year, quarter } = req.query;

  let condition = '';
  let params = [];

  // Nếu có năm
  if (year) {
    condition += ` YEAR(b.bookingdate) = ?`;
    params.push(year);
  }

  // Nếu có quý (quarter = 1,2,3,4 hoặc 5 là cả năm)
  if (quarter && quarter != 5) {
    condition += ` AND QUARTER(b.bookingdate) = ?`;
    params.push(quarter);
  }

  // Nếu có điều kiện, thêm WHERE vào SQL
  condition = condition ? ` WHERE ${condition.replace(/^ AND/, '')}` : '';

  const sql = `
    SELECT 
      COUNT(b.bookingid) AS totalBookings, 
      SUM(b.totalamount) AS totalRevenue, 
      SUM(b.numberofguests) AS totalGuests
    FROM booking b ${condition} AND b.status != 'Cancelled'
  `;

  const query = `
    SELECT AVG(DATEDIFF(CURDATE(), p.dateofbirth) / 365) AS avgAge
    FROM booking b 
    LEFT JOIN participant p ON b.bookingid = p.bookingid
    ${condition}  AND b.status != 'Cancelled'
  `;

  try {
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal Server Error' });
      }
      const stats = result[0];
      db.query(query, params, (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send({ message: 'Internal Server Error' });
        }
        const avgAge = Math.ceil(result[0].avgAge);
        res.status(200).json({ stats, avgAge });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API lấy dữ liệu biểu đồ tỷ lệ lấp đầy tour
app.get('/api/tour-capacity', async (req, res) => {
  try {
    const { year, quarter } = req.query;

    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Vui lòng cung cấp năm hợp lệ' });
    }

    let startDate, endDate;

    if (quarter >= 1 && quarter <= 4) {
      const startMonth = (quarter - 1) * 3 + 1;
      startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
      endDate = new Date(year, startMonth + 2, 0).toISOString().split('T')[0];
    } else if (quarter == 5) {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      return res
        .status(400)
        .json({ error: 'Quý không hợp lệ, chỉ nhận giá trị từ 1-5' });
    }

    const query = `
      SELECT * FROM schedule s
      WHERE DATE(s.startdate) BETWEEN ? AND ?;
    `;

    const [result] = await db.promise().query(query, [startDate, endDate]);
    const tourCapacity = result.reduce(
      (acc, schedule) => {
        acc[0] = schedule.availablespots
          ? acc[0] + schedule.availablespots
          : acc[0] + 0;
        acc[1] = schedule.capacity ? acc[1] + schedule.capacity : acc[1] + 0;
        return acc;
      },
      [0, 0]
    );

    res.json({
      filled: tourCapacity[1] - tourCapacity[0],
      notFilled: tourCapacity[0],
      period: quarter == 5 ? `Năm ${year}` : `Quý ${quarter} năm ${year}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API dùng để lấy thông tin về sóo lượng khách và doanh thu theo từng tour
app.get('/api/tour-statistics', async (req, res) => {
  try {
    const { year, quarter } = req.query;

    let condition = '';
    let params = [];

    if (year) {
      condition += ` YEAR(b.bookingdate) = ?`;
      params.push(year);
    }

    if (quarter && quarter != 5) {
      condition += ` AND QUARTER(b.bookingdate) = ?`;
      params.push(quarter);
    }

    condition = condition ? ` WHERE ${condition.replace(/^ AND/, '')}` : '';

    const sql = `
      SELECT 
        s.scheduleid, 
        SUM(b.numberofguests) AS totalGuests,
        SUM(b.totalamount) AS totalRevenue
      FROM booking b
      JOIN schedule s ON b.scheduleid = s.scheduleid
       ${condition} AND b.status != 'Cancelled'
      GROUP BY s.scheduleid 
    `;
    console.log(sql);

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
      console.log(results);

      const guestData = results.map((tour) => tour.totalGuests || 0);
      const revenueData = results.map((tour) => tour.totalRevenue || 0);

      res.json({
        datasets: [
          {
            data: revenueData,
          },
          {
            data: guestData,
          },
        ],
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API lấy thông tin lịch trình itinerary
app.get('/api/itinerary/:tourId', (req, res) => {
  const tourId = req.params.tourId;
  db.query(
    `SELECT * FROM itinerary WHERE tourid = ? AND isdeleted = 0`,
    [tourId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }

      res.status(200).json(results);
    }
  );
});

///////////////////// API dùng để thay đổi các thông tin tour /////////////////////////////////////
// API xóa mềm schedule
app.put('/api/delete_schedule', (req, res) => {
  const scheduleId = req.body.id;
  db.query(
    `UPDATE schedule SET isdeleted = true WHERE scheduleid = ?`,
    [scheduleId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({
          error: err.message,
          message: 'Can not delete this schedule',
        });
      }
      res.status(200).json({ message: 'Schedule deleted successfully' });
    }
  );
});

// API xóa mềm itinerary
app.put('/api/delete_itinerary', (req, res) => {
  const itiID = req.body.id;
  console.log(itiID);
  db.query(
    `UPDATE itinerary SET isdeleted = true WHERE itineraryid = ?`,
    [itiID],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({
          error: err.message,
          message: 'Can not delete this itinerary',
        });
      }
      res.status(200).json({ message: 'itinerary deleted successfully' });
    }
  );
});

// API xóa mềm service
app.put('/api/delete_tourService', (req, res) => {
  const serviceId = req.body.ServiceID;
  const tourId = req.body.TourID;
  db.query(
    `UPDATE tour_service SET isdeleted = true WHERE tourid = ? AND serviceid = ?`,
    [tourId, serviceId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({
          error: err.message,
          message: 'Can not delete this service',
        });
      }
      res.status(200).json({ message: 'Service deleted successfully' });
    }
  );
});

// Cấu hình để có thể truy cập ảnh từ thư mục uploads
app.use('/uploads', express.static('uploads'));
// Khởi động server
app.listen(process.env.PORT, () => {
  console.log(
    `Server running on http://${process.env.MYSQLHOST}:${process.env.PORT}`
  );
});
