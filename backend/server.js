import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' })); // Tăng giới hạn payload JSON
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  connectTimeout: 10000,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  } else {
    console.log('Connected to MySQL');
  }
});
////////////////////////////////////////////////////////////////////////////////

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
    INNER JOIN post_content ON posts.id = post_content.post_id 
    WHERE posts.id = ? AND post_content.id = ?
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
    const deleteContentQuery = 'DELETE FROM post_content WHERE id = ?';
    db.query(deleteContentQuery, [postContentId], (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Error deleting post content', error: err.message });
      }

      // Xóa bài đăng nếu không còn nội dung nào liên kết
      const checkRemainingContentsQuery =
        'SELECT * FROM post_content WHERE post_id = ?';
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
            const deletePostQuery = 'DELETE FROM posts WHERE id = ?';
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
    SELECT posts.id, posts.created_at, posts.views, users.id AS user_id,
           users.username AS author, users.image_avatar AS authorAvatar, categories.name AS category,
           post_content.title, post_content.subtitle, post_content.content_intro, post_content.quote, post_content.content_body, post_content.image_url
    FROM posts
    INNER JOIN users ON posts.author_id = users.id
    INNER JOIN categories ON posts.category_id = categories.id
    INNER JOIN post_content ON posts.id = post_content.post_id
    WHERE posts.id = ?`;
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
    author_id,
    category_id,
    image_url,
    title,
    subtitle,
    content_intro,
    quote,
    content_body,
    link,
  } = req.body;
  console.log(req.body);

  // Thêm vào bảng posts
  const insertPostQuery = `
    INSERT INTO posts (AuthorID, CategoryID)
    VALUES (?, ?)
  `;

  db.query(insertPostQuery, [author_id, category_id], (err, result) => {
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
        title,
        subtitle,
        content_intro,
        quote,
        content_body,
        image_url,
        link,
      ],
      (err, result) => {
        if (err) {
          res.status(500).json({ message: 'Error creating post content' });
        } else {
          res.status(200).json({
            title,
            image: image_url,
            message: 'Post created successfully',
            postId: postId,
          });
        }
      }
    );
  });
});

// API lấy danh sách danh mục
app.get('D', (req, res) => {
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
  const query = `SELECT * from User join role on User.UserID = role.UserID`;
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
      comments.id, 
      comments.content, 
      comments.author_id, 
      comments.created_at,
      users.image_avatar AS author_avatar,
      users.username as name
    FROM comments
    JOIN users ON comments.author_id = users.id
    WHERE comments.post_id = ?
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
  const { author_name, content, email } = req.body;

  // Truy vấn để lấy author_id từ bảng users dựa trên email
  const getUserQuery = 'SELECT id FROM users WHERE email = ?';

  db.query(getUserQuery, [email], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user data' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Lấy author_id từ kết quả truy vấn
    const author_id = result[0].id;

    // Tiến hành chèn bình luận vào bảng comments
    const insertCommentQuery =
      'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)';

    db.query(
      insertCommentQuery,
      [postId, author_id, content],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error creating comment' });
        }

        res.status(200).json({
          message: 'Comment created successfully',
          commentId: result.insertId,
        });
      }
    );
  });
});

//API xóa comment
app.delete('/api/posts/:postId/comments/:commentId', (req, res) => {
  const { postId, commentId } = req.params;
  const { author_id } = req.body; // Lấy `author_id` từ body của request

  // Truy vấn để xóa bình luận dựa trên `author_id`, `post_id` và `id`
  const deleteCommentQuery =
    'DELETE FROM comments WHERE id = ? AND post_id = ? AND author_id = ?';

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

  const query = `SELECT COUNT(*) as count FROM comments Where post_id = ?`;

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
        INSERT INTO user_likes (user_id, post_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE id=id; -- Đảm bảo không thêm trùng lặp
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
        DELETE FROM user_likes
        WHERE user_id = ? AND post_id = ?
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

  const query = `SELECT COUNT(*) as count FROM user_likes Where post_id = ?`;

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
    FROM user_likes
    WHERE user_id = ? AND post_id = ?
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

// API đăng nhập bằng google
app.post('/api/google-login', (req, res) => {
  const { email, name, avatarurl } = req.body;

  // Kiểm tra xem user đã tồn tại chưa
  const queryCheck = 'SELECT * FROM user WHERE email = ?';
  db.query(queryCheck, [email], (err, results) => {
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
      db.query(queryInsert, [name, email, avatarurl], (err, result) => {
        if (err) throw err;
        // Lấy id của user vừa thêm
        const queryGetId = result.insertId;
        res.status(200).json({
          message: 'Tạo tài khoản mới và đăng nhập thành công!',
          user: {
            UserID: queryGetId,
            FullName: name,
            Email: email,
            Role: 'user',
            AvatarUrl: avatarurl,
          },
        });
      });
    }
  });
});

// API đăng ký (Register)
app.post('/api/register', async (req, res) => {
  const { Email, Password, FullName, PhoneNumber } = req.body;

  try {
    // Kiểm tra xem email đã tồn tại chưa
    db.query(`SELECT * FROM user WHERE Email = ?`, [Email], (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Database error', error: err.message });
      }

      if (results.length > 0) {
        // Nếu email đã tồn tại
        return res.status(400).json({
          message: "This Account is already, let's Sign In",
        });
      }

      // Nếu email chưa tồn tại, tiến hành tạo tài khoản
      db.query(
        `INSERT INTO user (Email, Password, FullName, PhoneNumber) VALUE (?, ?, ?, ?)`,
        [Email, Password, FullName, PhoneNumber],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'Database error', error: err.message });
          }

          res.status(200).json({
            message: 'Account created successfully',
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
  const { email, password } = req.body;

  try {
    // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu không
    db.query(
      `SELECT * FROM user join role on user.UserID = role.UserID WHERE email = ?`,
      [email],
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
        const isPasswordValid = password == user.Password;
        if (!isPasswordValid) {
          return res.status(400).json({
            message:
              "Invalid email or password or you register by google before, Let's login by google",
          });
        }

        // Tạo token JWT
        // const token = jwt.sign(
        //   { id: user.id, email: user.email, role: user.role },
        //   secretKey,
        //   { expiresIn: '1h' } // Thời gian hết hạn token
        // );

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
  join schedule ts on tour.tourid = ts.tourid
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
////////////////////////////////////////////////////////////////////////////////////
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
      res.json(results);
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
  const query = `SELECT booking.*, s.StartDate, s.EndDate, tour.* FROM booking JOIN Schedule ts on ts.ScheduleID = booking.ScheduleID 
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

// API dùng để tạo booking
app.post('/api/create_booking', async (req, res) => {
  const buyer = req.body.Buyer;
  const participants = req.body.Participant;
  const schedulePicked = req.body.schedulePicked;
  const selectedOptions = req.body.selectedOptions;
  const total = req.body.total;

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
    const servicePromises2 = selectedOptions.map((option) => {
      return queryAsync(
        `UPDATE tour_service SET AvailableSpots = ? WHERE ServiceID = ? AND TourID = ?`,
        [
          option.AvailableSpots - option.Quantity,
          option.ServiceID,
          schedulePicked.TourID,
        ]
      );
    });

    // Chạy các truy vấn INSERT song song để tăng tốc độ xử lý
    await Promise.all([
      ...participantPromises,
      ...servicePromises,
      ...servicePromises2,
    ]);

    res.status(200).json({ message: 'Tour Booked Successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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
  const queryAsync = (sql, values) => {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };

  if (status === 'Cancelled') {
    const query = `SELECT * FROM booking
    join participant on booking.BookingID = participant.BookingID WHERE booking.BookingID = ?`;
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

      db.query(
        `UPDATE schedule SET AvailableSpots = ? WHERE ScheduleID = ?`,
        [
          scheduleResult[0].AvailableSpots + result.length,
          result[0].ScheduleID,
        ],
        (err, result) => {}
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
app.post('/api/create_tour', (req, res) => {
  const tourInf = req.body.tourInf;
  const dateForms = req.body.dateForms;
  const serviceForms = req.body.serviceForms;

  const query = `INSERT INTO tour (TourName, Description, StartLocation, Destination, Price, Img_Tour) VALUES (?,?,?,?,?,?)`;

  db.query(
    query,
    [
      tourInf.tourName,
      tourInf.description,
      tourInf.startLocation,
      tourInf.destination,
      tourInf.price,
      tourInf.image,
    ],
    (err, result) => {
      if (err) {
        console.log('Error create tour', err);
        return res.status(500).json({ message: 'Error create tour' });
      } else {
        const tourID = result.insertId;
        dateForms.map((date) => {
          const query = `INSERT INTO schedule (TourID, StartDate, EndDate, Capacity, AvailableSpots) VALUES (?,?,?,?,?)`;
          db.query(
            query,
            [
              tourID,
              date.date.start,
              date.date.end,
              date.capacity,
              date.capacity,
            ],
            (err, result) => {
              if (err) {
                console.log('Error create schedule', err);

                return res
                  .status(500)
                  .json({ message: 'Error create schedule for tour' });
              }
            }
          );
        });

        serviceForms.map((service) => {
          const query = `INSERT INTO tour_service(TourID, ServiceID, AvailableSpots, Capacity ,Status) VALUES (?,?,?,?,?)`;
          db.query(
            query,
            [
              tourID,
              service.serviceID,
              service.capacity,
              service.capacity,
              service.status,
            ],
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

        res.status(200).json({
          message: 'schedule for tour created successfully',
        });
      }
    }
  );
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
  const query = `select * from user join role on user.UserID = role.UserID`;
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
  const query = `SELECT * FROM user join role on user.UserID = role.UserID WHERE email = ?`;
  db.query(query, [user.Email], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error promote user' });
    } else {
      if (results.length === 0) {
        const query = `INSERT INTO role (UserID, Role) VALUES (?, ?)`;
        db.query(query, [user.UserID, req.body.role], (err, results) => {
          if (err) {
            res.status(500).json({ message: 'Error promote user' });
          } else {
            res.json({ message: 'User promoted successfully' });
          }
        });
      } else {
        const query = `UPDATE role SET Role = ? WHERE UserID = ?`;
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
  const query = `DELETE FROM role WHERE UserID = ?`;
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
    FROM Booking b ${condition}
  `;

  const query = `
    SELECT AVG(DATEDIFF(CURDATE(), p.DateOfBirth) / 365) AS avgAge
    FROM Booking b 
    LEFT JOIN Participant p ON b.BookingID = p.BookingID
    ${condition}
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
        const avgAge = result[0].avgAge;
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
        acc[0] = schedule.AvailableSpots ? acc[0] + schedule.AvailableSpots : 0;
        acc[1] = schedule.Capacity ? acc[1] + schedule.Capacity : 0;
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
       ${condition}
      GROUP BY s.ScheduleID 
    `;

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }

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

// Khởi động server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
