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
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cấu hình CORS và Express
app.use(
  cors({
    origin: '*', // Cho phép yêu cầu từ front-end trên cổng 5173
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Cho phép các phương thức HTTP này
    allowedHeaders: ['Content-Type'], // Các headers được phép
  })
);

app.use(express.json());

// Cấu hình Multer để lưu file vào thư mục uploads
const storage = multer.diskStorage({
  destination: 'uploads/', // Thư mục lưu ảnh
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file theo timestamp
  },
});

const upload = multer({ storage });

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

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
    Posts.PostID, 
    Posts.CreatedAt, 
    Posts.Views, 
    User.FullName AS Author, 
    User.AvatarUrl AS AuthorAvatar, 
    Categories.Name AS Category,
    PostContent.Title, 
    PostContent.Subtitle, 
    PostContent.ContentIntro, 
    PostContent.Quote, 
    PostContent.ContentBody, 
    PostContent.ImageUrl
FROM Posts
INNER JOIN User ON Posts.AuthorID = User.UserID
INNER JOIN Categories ON Posts.CategoryID = Categories.CategoryID
INNER JOIN PostContent ON Posts.PostID = PostContent.PostID
WHERE Categories.Name = 'blog'
ORDER BY Posts.CreatedAt DESC
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
      Posts.PostID, 
      Posts.CreatedAt, 
      Posts.Views, 
      User.FullName AS Author, 
      User.AvatarUrl AS AuthorAvatar, 
      Categories.Name AS Category,
      PostContent.Title, 
      PostContent.Subtitle, 
      PostContent.ContentIntro, 
      PostContent.Quote, 
      PostContent.ContentBody, 
      PostContent.Link, 
      PostContent.ImageUrl, 
      PostContent.ContentID AS PostContentID
  FROM Posts
  INNER JOIN User ON Posts.AuthorID = User.UserID
  INNER JOIN Categories ON Posts.CategoryID = Categories.CategoryID
  INNER JOIN PostContent ON Posts.PostID = PostContent.PostID
`;

  // Nếu có category_name, thêm điều kiện WHERE vào câu truy vấn
  if (category_name) {
    query += ` WHERE Categories.Name = ?`;
  } else {
    query += ` WHERE Categories.Name = 'blog'`;
  }

  query += ` ORDER BY Posts.CreatedAt DESC;`; // Sắp xếp theo thời gian tạo mới nhất

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
    INNER JOIN PostContent ON posts.PostID = PostContent.PostID
    WHERE posts.PostID = ? AND PostContent.PostID = ?
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
    const deleteContentQuery = 'DELETE FROM PostContent WHERE ContentID = ?';
    db.query(deleteContentQuery, [postContentId], (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Error deleting post content', error: err.message });
      }

      // Xóa bài đăng nếu không còn nội dung nào liên kết
      const checkRemainingContentsQuery =
        'SELECT * FROM PostContent WHERE PostID = ?';
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
            const deletePostQuery = 'DELETE FROM posts WHERE PostID = ?';
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
    INNER JOIN user ON posts.AuthorID = user.UserID
    INNER JOIN categories ON posts.CategoryID = categories.CategoryID
    INNER JOIN PostContent ON posts.PostID = PostContent.PostID
    WHERE posts.PostID = ?`;
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
    INSERT INTO posts (AuthorID, CategoryID)
    VALUES (?, ?)
  `;

  db.query(insertPostQuery, [AuthorID, CategoryID], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating post' });
    }

    const postId = result.insertId;

    // Thêm chi tiết bài viết vào bảng post_content
    const insertContentQuery = `
      INSERT INTO PostContent (PostID, Title, Subtitle, ContentIntro, Quote, ContentBody, ImageUrl, Link)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

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
  const query = `SELECT * from User join user_role ur on User.UserID = ur.UserID join role on ur.RoleID = role.RoleID`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving categories' });
    } else {
      res.json(results);
    }
  });
});

// API thêm danh mục mới
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  const query = `
    INSERT INTO categories (Name)
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
    JOIN user ON comments.AuthorID = user.UserID
    WHERE comments.PostID = ?
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
    'INSERT INTO comments (PostID, AuthorID, Content) VALUES (?, ?, ?)';

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
    'DELETE FROM comments WHERE CommentID = ? AND PostID = ? AND AuthorID = ?';

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

  const query = `SELECT COUNT(*) as count FROM comments Where PostID = ?`;

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
        INSERT INTO UserLikes (UserID, PostID)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE LikeID=LikeID; -- Đảm bảo không thêm trùng lặp
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
        DELETE FROM UserLikes
        WHERE UserID = ? AND PostID = ?
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

  const query = `SELECT COUNT(*) as count FROM UserLikes Where PostID = ?`;

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
    FROM UserLikes
    WHERE UserID = ? AND PostID = ?
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
    db.query(`SELECT * FROM user WHERE Email = ?`, [Email], (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Database error1', error: err.message });
      }

      if (results.length > 0) {
        // Nếu email đã tồn tại
        return res.status(400).json({
          message: "This Account is already exist, let's Sign In",
        });
      }

      // Nếu email chưa tồn tại, tiến hành tạo tài khoản
      db.query(
        `INSERT INTO user (Email, Password, FullName, PhoneNumber, AvatarUrl) VALUES (?, ?, ?, ?, ?)`,
        [Email, Password, FullName, PhoneNumber, AvatarUrl],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'Database error2', error: err.message });
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
  try {
    // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu không
    db.query(
      `SELECT * FROM user  WHERE Email = ?`,
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

        // Kiểm tra mật khẩu
        const isPasswordValid = await comparePassword(Password, user.Password);
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
      `SELECT * FROM user join user_role ur on user.UserID = ur.UserID
      join role on ur.RoleID = role.RoleID WHERE Email = ?`,
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
        const isPasswordValid = await comparePassword(Password, user.Password);
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
// Chuyển db.query thành hàm Promise
const queryAsync = util.promisify(db.query).bind(db);
app.get('/api/basis_inf/:tourid', async (req, res) => {
  try {
    const tourid = req.params.tourid;

    const query = `
      SELECT * FROM tour 
      JOIN schedule s ON tour.TourID = s.TourID
      WHERE tour.TourID = ? AND s.IsDeleted = 0 AND tour.IsDeleted = 0`;

    const sql = `
      SELECT * FROM tour  
      JOIN tour_service ts ON ts.TourID = tour.TourID 
      WHERE tour.TourID = ? AND ts.IsDeleted = 0`;

    const query1 = `SELECT it.* FROM tour 
    JOIN Itinerary it ON tour.TourID = it.TourID WHERE tour.TourID = ? AND tour.IsDeleted = 0 AND it.IsDeleted = 0`;

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
                       JOIN schedule_ts s ON schedule.ScheduleID = s.ScheduleID
                       JOIN tour_service ts ON ts.ServiceID = s.ServiceID AND ts.TourID = s.TourID
                       WHERE schedule.ScheduleID = ? AND schedule.IsDeleted = 0 `;
          let results2 = await queryAsync(query, [schedule.ScheduleID]);
          results2 = results2.reduce((acc, item) => {
            acc[item.ServiceID] = item.AvailableSpots;
            return acc;
          }, {});

          return {
            ScheduleID: schedule.ScheduleID,
            date: schedule.StartDate,
            Capacity: schedule.Capacity,
            services: results2,
          };
        })
      );
    });

    const results2 = await queryAsync(sql, [tourid]);
    const results3 = await queryAsync(query1, [tourid]);

    // Xử lý dữ liệu

    const serviceForms = results2.map((service) => ({
      ServiceID: service.ServiceID,
      // Capacity: service.Capacity,
      Status: service.Status,
    }));

    // const dateForms = results1.map((schedule) => ({
    //   ScheduleID: schedule.ScheduleID,
    //   date: schedule.StartDate,
    //   Capacity: schedule.Capacity,
    // }));

    // Trả về kết quả JSON
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
  const query = `select * from tour where tour.IsDeleted = 0`;
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
  const query = `select ts.*, tour.* from tour
  join schedule ts on tour.tourid = ts.tourid
  where tour.tourid = ? and tour.IsDeleted = 0 and ts.IsDeleted = 0`;
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
  where tour.tourid = ? AND ts.IsDeleted = 0`;
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
  const query = `select s.* from tour join schedule on tour.TourID = schedule.TourID 
  join schedule_ts s on s.ScheduleID = schedule.ScheduleID where tour.tourid = ? and s.scheduleID = ? AND schedule.IsDeleted = 0`;
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
  const query = `UPDATE tour SET IsDeleted = TRUE WHERE TourID = ?`;
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
  const query = `INSERT INTO service (ServiceName, Description, Price) VALUE (?,?,?)`;
  db.query(
    query,
    [service.ServiceName, service.Description, service.Price],
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
  const query = `select * from service`;
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
  const query = `UPDATE service SET IsDeleted = TRUE WHERE ServiceID = ?`;
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
  const query = `UPDATE service SET IsDeleted = FALSE WHERE ServiceID = ?`;
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
  const query = `UPDATE service SET ServiceName = ?, Price = ?, Description = ? WHERE ServiceID = ?`;
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
  const query = `SELECT booking.*, s.StartDate, tour.* FROM booking JOIN Schedule ts on ts.ScheduleID = booking.ScheduleID 
join schedule s on s.ScheduleID = ts.ScheduleID 
join tour on tour.TourID = ts.TourID WHERE booking.IsDeleted = FALSE`;
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
  const query = `SELECT booking.*, s.StartDate, tour.* FROM booking JOIN Schedule ts on ts.ScheduleID = booking.ScheduleID 
join schedule s on s.ScheduleID = ts.ScheduleID 
join tour on tour.TourID = ts.TourID AND booking.UserID = ?`;
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
    // 1️⃣ Tạo booking
    const bookingResult = await queryAsync(
      `INSERT INTO booking (NumberOfGuests, ScheduleID, UserID, TotalAmount) VALUES (?,?,?,?)`,
      [participants.length, schedulePicked.ScheduleID, buyer.UserID, total]
    );
    const bookingID = bookingResult.insertId;

    // 2️⃣ Lấy thông tin Schedule
    const scheduleResult = await queryAsync(
      `SELECT * FROM schedule WHERE ScheduleID = ?`,
      [schedulePicked.ScheduleID]
    );
    if (!scheduleResult.length) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // 3️⃣ Giảm số lượng AvailableSpots
    const availableSpots =
      scheduleResult[0].AvailableSpots - participants.length;

    console.log('availableSpots:', availableSpots);
    const query =
      availableSpots === 0
        ? `UPDATE schedule SET AvailableSpots = ?, Status = 'Full' WHERE ScheduleID = ?`
        : `UPDATE schedule SET AvailableSpots = ? WHERE ScheduleID = ?`;
    db.query(
      query,
      [availableSpots, schedulePicked.ScheduleID],
      (err, result) => {}
    );
    // 4️⃣ Thêm thông tin Participant (Chạy song song với Promise.all)
    const participantPromises = participants.map((part) => {
      return queryAsync(
        `INSERT INTO participant (BookingID, Email, FullName, FullNameOnPassport, Nationality, PassportNumber, DateOfBirth, Gender, PhoneNumber) VALUES (?,?,?,?,?,?,?,?,?)`,
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

    // 5️⃣ Thêm booking services (Chạy song song với Promise.all)
    const servicePromises = selectedOptions.map((option) => {
      return queryAsync(
        `INSERT INTO booking_service (BookingID, ServiceID, Quantity) VALUES (?,?,?)`,
        [bookingID, option.ServiceID, option.Quantity]
      );
    });

    // Giảm số lượng available của service đã chọn của tour
    selectedOptions.map(async (option) => {
      const query = `SELECT * FROM schedule_ts WHERE ScheduleID = ? AND ServiceID = ? AND TourID = ?`;

      try {
        // Thực hiện truy vấn SELECT và đợi kết quả
        db.query(
          query,
          [schedulePicked.ScheduleID, option.ServiceID, option.TourID],
          (err, result) => {
            if (err) {
              console.log(err);
              return;
            }
            // Kiểm tra nếu không có kết quả trả về
            if (result.length === 0) {
              console.log('no schedule_ts');
              return { success: false, message: 'No matching schedule found' };
            }

            // Thực hiện truy vấn UPDATE và đợi kết quả
            db.query(
              `UPDATE schedule_ts SET AvailableSpots = ? WHERE ServiceID = ? AND TourID = ? AND ScheduleID = ?`,
              [
                result[0].AvailableSpots - option.Quantity,
                option.ServiceID,
                option.TourID,
                schedulePicked.ScheduleID,
              ]
            );

            // Trả về kết quả thành công
            return { success: true, message: 'Update successful' };
          }
        );
      } catch (err) {
        // Xử lý lỗi
        console.error('servicePromises2: ', err);
        return { success: false, message: 'Error in servicePromises2' };
      }
    });

    // Chạy các truy vấn INSERT song song để tăng tốc độ xử lý
    await Promise.all([...participantPromises, ...servicePromises]);

    res.status(200).json({ message: 'Tour Booked Successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Booking Fail' });
  }
});

app.put('/api/delete_booking', (req, res) => {
  const bookingID = req.body.bookingId;
  const query = `UPDATE booking SET IsDeleted = true WHERE BookingID = ?`;
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
    const query = `SELECT * FROM booking WHERE BookingID = ?`;
    db.query(query, [bookingId], async (err, result) => {
      if (err) {
        console.log('Error get booking');
        return res.status(500).json({ message: 'Error get booking' });
      }
      const scheduleResult = await queryAsync(
        `SELECT * FROM schedule WHERE ScheduleID = ?`,
        [result[0].ScheduleID]
      );
      if (!scheduleResult.length) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      // Khôi phục AvailableSpots ở schedule
      db.query(
        `UPDATE schedule SET AvailableSpots = ? WHERE ScheduleID = ?`,
        [
          scheduleResult[0].AvailableSpots + result[0].NumberOfGuests,
          result[0].ScheduleID,
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
        `SELECT * FROM Booking join booking_service bs on  Booking.BookingID = bs.BookingID WHERE Booking.BookingID = ?`,
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
                `SELECT * FROM schedule_ts WHERE ScheduleID = ? AND ServiceID = ? AND TourID = ?`,
                [item.ScheduleID, item.ServiceID, tourid],
                (error, result1) => {
                  if (err) {
                    console.log('Error update schedule_ts2');
                    return res
                      .status(500)
                      .json({ message: 'Error update schedule_ts2' });
                  }
                  if (result1.length > 0) {
                    db.query(
                      `UPDATE schedule_ts SET AvailableSpots = ? WHERE ScheduleID = ? AND ServiceID = ? AND TourID = ?`,
                      [
                        result1[0].AvailableSpots + item.Quantity,
                        item.ScheduleID,
                        item.ServiceID,
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

  const query = `UPDATE booking SET Status = ? WHERE BookingID = ?`;
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
join participant on booking.BookingID = participant.BookingID
join schedule on schedule.ScheduleID = booking.ScheduleID 
join tour on tour.TourID = schedule.TourID where booking.BookingID = ?`;
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
                 JOIN schedule ON booking.ScheduleID = schedule.ScheduleID
                 JOIN tour ON schedule.TourID = tour.TourID 
                 join participant on booking.BookingID = participant.BookingID
                 WHERE tour.TourID = ? AND schedule.ScheduleID = ? AND booking.Status != 'Pending' AND booking.IsDeleted = FALSE`;

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
  join booking_service bs on booking.BookingID = bs.BookingID
  join service on bs.ServiceID = service.ServiceID where booking.BookingID = ?`;
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

  const query = `INSERT INTO tour (TourName, Description, Price, Img_Tour, Duration) VALUES (?,?,?,?,?)`;

  db.query(
    query,
    [
      tourInf.TourName,
      tourInf.Description,
      tourInf.Price,
      tourInf.Img_Tour,
      tourInf.Duration,
    ],
    (err, result) => {
      if (err) {
        console.log('Error create tour', err);
        return res.status(500).json({ message: 'Error create tour' });
      } else {
        const tourID = result.insertId;
        dateForms.map((date) => {
          const query = `INSERT INTO schedule (TourID, StartDate, Capacity, AvailableSpots, Status) VALUES (?,?,?,?, ?)`;
          db.query(
            query,
            [tourID, date.date, date.Capacity, date.Capacity, 'Available'],
            (err, result) => {
              if (err) {
                console.log('Error create schedule', err);
                return res
                  .status(500)
                  .json({ message: 'Error create schedule for tour' });
              }

              const scheduleID = result.insertId;
              const numericKeys = Object.entries(date.services);

              numericKeys.map(([serviceID, Capacity]) => {
                const query = `INSERT INTO Schedule_TS (TourID, ScheduleID, ServiceID, AvailableSpots, Capacity) VALUES (?,?,?,?,?)`;
                console.log(tourID, scheduleID, serviceID, Capacity);
                db.query(
                  query,
                  [tourID, scheduleID, serviceID, Capacity, Capacity],
                  (err) => {
                    if (err) {
                      console.log('Error create Schedule_TS', err);
                      return res
                        .status(500)
                        .json({ message: 'Error create Schedule_TS' });
                    }
                  }
                );
              });
            }
          );
        });

        serviceForms.map((service) => {
          const query = `INSERT INTO tour_service(TourID, ServiceID ,Status) VALUES (?,?,?)`;
          db.query(
            query,
            [tourID, service.ServiceID, service.Status],
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
          const query = `INSERT INTO itinerary(DayNumber, Location, Activities,MealsIncluded, ImageUrl, Description, TourID) VALUES (?,?,?,?,?,?,?)`;

          db.query(
            query,
            [
              item.DayNumber,
              item.Location,
              item.Activities,
              item.MealsIncluded,
              item.ImageUrl,
              item.Description,
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
      SET TourName = ?, Description = ?, Price = ?, Img_Tour = ?, Duration = ?
      WHERE TourID = ?
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
        const checkScheduleQuery = `SELECT * FROM schedule WHERE TourID = ? AND StartDate = ?`;
        const existingSchedule = await queryAsync(checkScheduleQuery, [
          tourInf.TourID,
          date.date,
        ]);

        if (existingSchedule.length > 0) {
          // Nếu tồn tại, cập nhật số lượng chỗ trống
          const SpotsIncrease = date.Capacity - existingSchedule[0].Capacity;
          console.log(SpotsIncrease, date.Capacity);
          const updateScheduleQuery = `
          UPDATE schedule 
          SET Capacity = ?, AvailableSpots = ?
          WHERE TourID = ? AND StartDate = ?
        `;
          await queryAsync(updateScheduleQuery, [
            date.Capacity,
            existingSchedule[0].AvailableSpots + SpotsIncrease >= 0
              ? existingSchedule[0].AvailableSpots + SpotsIncrease
              : 0,
            tourInf.TourID,
            date.date,
          ]);

          for (const [key, value] of services) {
            const checkService = `SELECT * FROM schedule_ts WHERE TourID = ? AND ScheduleID = ? AND ServiceID = ?`;
            const existingService = await queryAsync(checkService, [
              tourInf.TourID,
              date.ScheduleID,
              key,
            ]);

            if (existingService.length > 0) {
              const serviceIncrease = value - existingService[0].AvailableSpots;
              const updateServiceQuery = `UPDATE schedule_ts SET Capacity = ?, AvailableSpots = ? WHERE TourID = ? AND ScheduleID = ? AND ServiceID = ?`;
              await queryAsync(updateServiceQuery, [
                existingService[0].Capacity + serviceIncrease >= 0
                  ? existingService[0].Capacity + serviceIncrease
                  : 0,
                value,
                tourInf.TourID,
                date.ScheduleID,
                key,
              ]);
            } else {
              const insertServiceQuery = `INSERT INTO schedule_ts (TourID, ScheduleID, ServiceID, Capacity, AvailableSpots) VALUES (?, ?, ?, ?, ?)`;
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
          INSERT INTO schedule (TourID, StartDate, Capacity, AvailableSpots, Status) 
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
                  const insertServiceQuery = `INSERT INTO schedule_ts (TourID, ScheduleID, ServiceID, Capacity, AvailableSpots) VALUES (?, ?, ?, ?, ?)`;
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
        const checkServiceQuery = `SELECT * FROM tour_service WHERE TourID = ? AND ServiceID = ?`;
        const existingService = await queryAsync(checkServiceQuery, [
          tourInf.TourID,
          service.ServiceID,
        ]);

        if (existingService.length > 0) {
          // Nếu dịch vụ đã tồn tại, cập nhật lại
          const updateServiceQuery = `
          UPDATE tour_service 
          SET Status = ?, IsDeleted = false
          WHERE TourID = ? AND ServiceID = ?
        `;
          await queryAsync(updateServiceQuery, [
            service.Status,
            tourInf.TourID,
            service.ServiceID,
          ]);
        } else {
          // Nếu chưa tồn tại, chèn mới
          const insertServiceQuery = `
          INSERT INTO tour_service (TourID, ServiceID, Status) 
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
        const checkItineraryQuery = `SELECT * FROM itinerary WHERE TourID = ? AND DayNumber = ? AND IsDeleted = 0`;
        const existingItinerary = await queryAsync(checkItineraryQuery, [
          tourInf.TourID,
          item.DayNumber,
        ]);

        if (existingItinerary.length > 0) {
          // Nếu đã tồn tại, cập nhật thông tin
          const updateItineraryQuery = `
          UPDATE itinerary 
          SET Location = ?, Activities = ?, MealsIncluded = ?, ImageUrl = ?, Description = ?
          WHERE TourID = ? AND DayNumber = ?
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
          INSERT INTO itinerary (DayNumber, Location, Activities, MealsIncluded, ImageUrl, Description, TourID) 
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
  const query = `select * from user join user_role ur on user.UserID = ur.UserID join role on ur.RoleID = role.RoleID`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving admin list' });
    } else {
      res.json(results);
    }
  });
});

// API promote admin hay manager
app.post('/api/promote', (req, res) => {
  const user = req.body.user;
  const query = `SELECT * FROM user join user_role ur on user.UserID = ur.UserID WHERE email = ?`;
  db.query(query, [user.Email], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error promote user' });
    } else {
      if (results.length === 0) {
        const query = `INSERT INTO user_role (UserID, RoleID) VALUES (?, ?)`;
        db.query(query, [user.UserID, req.body.role], (err, results) => {
          if (err) {
            res.status(500).json({ message: 'Error promote user' });
          } else {
            res.json({ message: 'User promoted successfully' });
          }
        });
      } else {
        const query = `UPDATE user_role SET RoleID = ? WHERE UserID = ?`;
        db.query(query, [req.body.Role, user.UserID], (err, results) => {
          if (err) {
            res.status(500).json({ message: 'Error promote user' });
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
  const query = `UPDATE user SET IsDeleted = true WHERE UserID = ?`;
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
  const query = `UPDATE user SET FullName = ?, Email = ?, Password = ?, PhoneNumber = ? WHERE UserID = ?`;
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
  const query = `DELETE FROM user_role WHERE UserID = ?`;
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
    condition += ` YEAR(b.BookingDate) = ?`;
    params.push(year);
  }

  // Nếu có quý (quarter = 1,2,3,4 hoặc 5 là cả năm)
  if (quarter && quarter != 5) {
    condition += ` AND QUARTER(b.BookingDate) = ?`;
    params.push(quarter);
  }

  // Nếu có điều kiện, thêm WHERE vào SQL
  condition = condition ? ` WHERE ${condition.replace(/^ AND/, '')}` : '';

  const sql = `
    SELECT 
      COUNT(b.BookingID) AS totalBookings, 
      SUM(b.TotalAmount) AS totalRevenue, 
      SUM(b.NumberOfGuests) AS totalGuests
    FROM Booking b ${condition} AND b.Status != 'Cancelled'
  `;

  const query = `
    SELECT AVG(DATEDIFF(CURDATE(), p.DateOfBirth) / 365) AS avgAge
    FROM Booking b 
    LEFT JOIN Participant p ON b.BookingID = p.BookingID
    ${condition}  AND b.Status != 'Cancelled'
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

    // const today = new Date().toISOString().split('T')[0];

    // if (quarter >= 1 && quarter <= 4) {
    //   // Xác định ngày đầu và cuối của quý
    //   const startMonth = (quarter - 1) * 3 + 1;
    //   startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
    //   let calculatedEndDate = new Date(year, startMonth + 2, 0)
    //     .toISOString()
    //     .split('T')[0];

    //   // Đảm bảo endDate không vượt quá ngày hiện tại
    //   endDate = calculatedEndDate > today ? today : calculatedEndDate;
    // } else if (quarter == 5) {
    //   // Nếu quarter = 5, lấy cả năm nhưng không vượt quá ngày hiện tại
    //   startDate = `${year}-01-01`;
    //   let calculatedEndDate = `${year}-12-31`;

    //   // Đảm bảo endDate không vượt quá ngày hiện tại
    //   endDate = calculatedEndDate > today ? today : calculatedEndDate;
    // } else {
    //   return res
    //     .status(400)
    //     .json({ error: 'Quý không hợp lệ, chỉ nhận giá trị từ 1-5' });
    // }

    if (quarter >= 1 && quarter <= 4) {
      // Xác định ngày đầu và cuối của quý
      const startMonth = (quarter - 1) * 3 + 1; // Quý 1 -> tháng 1, Quý 2 -> tháng 4, ...
      startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
      endDate = new Date(year, startMonth + 2, 0).toISOString().split('T')[0]; // Ngày cuối của tháng cuối trong quý
    } else if (quarter == 5) {
      // Nếu quarter = 5, lấy cả năm
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      return res
        .status(400)
        .json({ error: 'Quý không hợp lệ, chỉ nhận giá trị từ 1-5' });
    }

    const query = `
      SELECT * FROM Schedule s
      WHERE DATE(s.StartDate) BETWEEN ? AND ?;
    `;

    // Thực hiện truy vấn
    const [result] = await db.promise().query(query, [startDate, endDate]);
    const tourCapacity = result.reduce(
      (acc, schedule) => {
        acc[0] = schedule.AvailableSpots
          ? acc[0] + schedule.AvailableSpots
          : acc[0] + 0;
        acc[1] = schedule.Capacity ? acc[1] + schedule.Capacity : acc[1] + 0;
        return acc;
      },
      [0, 0]
    );

    // Tính toán tỷ lệ lấp đầy
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

    // Nếu có năm
    if (year) {
      condition += ` YEAR(b.BookingDate) = ?`;
      params.push(year);
    }

    // Nếu có quý (quarter = 1,2,3,4 hoặc 5 là cả năm)
    if (quarter && quarter != 5) {
      condition += ` AND QUARTER(b.BookingDate) = ?`;
      params.push(quarter);
    }

    condition = condition ? ` WHERE ${condition.replace(/^ AND/, '')}` : '';

    const sql = `
      SELECT 
        s.ScheduleID, 
        SUM(b.NumberOfGuests) AS totalGuests,
        SUM(b.TotalAmount) AS totalRevenue
      FROM Booking b
      JOIN Schedule s ON b.ScheduleID = s.ScheduleID
       ${condition} AND b.Status != 'Cancelled'
      GROUP BY s.ScheduleID 
    `;
    console.log(sql);

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
      console.log(results);

      const guestData = results.map((tour) => tour.totalGuests || 0);
      const revenueData = results.map((tour) => tour.totalRevenue || 0); // Đổi đơn vị thành triệu VND

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
    `SELECT * FROM itinerary WHERE TourID = ? AND IsDeleted = 0`,
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
    `UPDATE schedule SET isDeleted = true WHERE ScheduleID = ?`,
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
    `UPDATE itinerary SET isDeleted = true WHERE ItineraryID = ?`,
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
    `UPDATE Tour_Service SET isDeleted = true WHERE TourID = ? AND ServiceID = ?`,
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
