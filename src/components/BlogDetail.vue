<template>
  <div class="body">
    <!-- <header>
      <Navigate></Navigate>
      <div class="heroimage"></div>
    </header> -->
    <main>
      <div class="container my-5">
        <!-- Blog Content -->
        <BlogContent :blog="blog" />

        <!-- Comments Section -->
        <div class="comments-section my-4">
          <h3 class="mb-4">Comments</h3>
          <!-- Add Comment Form -->
          <form @submit.prevent="addComment" class="mb-5">
            <!-- <div class="mb-3">
              <label for="name" class="form-label">Tên của bạn</label>
              <input
                id="name"
                v-model="newComment.author_name"
                class="form-control"
                placeholder="Nhập tên của bạn"
                required
              />
            </div> -->
            <div class="mb-3">
              <!-- <label for="comment" class="form-label">Comment</label> -->
              <textarea
                id="comment"
                v-model="newComment.content"
                class="form-control"
                rows="3"
                placeholder="Write comment there ..."
                required
              ></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Send</button>
          </form>
          <div class="list-group">
            <!-- Hiển thị các bình luận -->
            <div
              v-for="comment in visibleComments"
              :key="comment.id"
              class="list-group-item"
            >
              <div class="comment">
                <Comment :comment="comment" />
                <button
                  v-if="state.userid === comment.authorid"
                  class="btn btn-link text-danger p-0 mt-2"
                  @click="deleteComment(comment.commentid, state.userid)"
                >
                  <i class="fa-solid fa-rectangle-xmark fs-5"></i>
                </button>
              </div>
            </div>
            <div class="text-center showMoreAndLess">
              <!-- Nếu có nhiều hơn 5 bình luận, hiển thị nút 'Xem thêm' -->
              <button
                v-if="comments.length > visibleComments.length"
                @click="loadMoreComments"
                class="btn btn-link"
              >
                Show more
              </button>
              <!-- Thu gọn bình luận -->
              <button
                v-if="visibleComments.length > 4"
                class="btn btn-link"
                @click="showLessComment"
              >
                Show less
              </button>
            </div>
          </div>
        </div>
        <!-- Related Articles -->
        <div class="related-articles mb-5">
          <h3 class="mb-3">The Newest Blogs</h3>
          <div class="row">
            <div
              v-for="article in relatedArticles"
              :key="article.id"
              class="col-md-4 mb-4"
            >
              <Actical_card
                :image="article.imageurl"
                :title="article.title"
                :description="article.contentintro.slice(0, 100) + '...'"
                :author="article.author"
                :authoravatar="article.authoravatar"
                :views="article.views"
                :id="article.postid"
                :create_at="article.createdat"
              ></Actical_card>
            </div>
          </div>
        </div>
      </div>
      <!-- <Footer></Footer> -->
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { computed } from 'vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import api from '@/axios';
// import Navigate from './Navigate.vue';
// import Footer from './Footer.vue';
import BlogContent from './BlogContent.vue';
import Actical_card from './Actical_card.vue';
import Comment from './Comment.vue';
// import { AnnotationLayer } from 'pdfjs-dist';

const state = reactive({
  userid: 0,
});
// Khai báo biến và dữ liệu
const blog = ref({});
const comments = ref([]);
const newComment = ref({
  author_name: '',
  content: '',
  author_avatar: '',
  email: '',
});
const relatedArticles = ref([]);
const route = useRoute();

// Biến để theo dõi số lượng bình luận hiển thị
const visibleCommentsCount = ref(3);

// Tính toán danh sách bình luận cần hiển thị
const visibleComments = computed(() => {
  return comments.value.slice(0, visibleCommentsCount.value);
});

// Hàm để tải thêm bình luận
const loadMoreComments = () => {
  // Tăng số lượng bình luận hiển thị lên
  visibleCommentsCount.value =
    comments.value.length > visibleCommentsCount.value + 5
      ? visibleCommentsCount.value + 5
      : comments.value.length;
};

const showLessComment = () => {
  visibleCommentsCount.value = 3;
};

const clearForm = () => {
  newComment.value.content = '';
};

// Hàm gọi API
const fetchBlog = async (postid) => {
  try {
    const response = await api.get(`/api/posts/${postid}`);
    blog.value = response.data;
    console.log(blog.value);
    visibleCommentsCount.value = 3;
  } catch (error) {
    console.error('Error fetching blog:', error);
  }
};

const fetchComments = async (postid) => {
  try {
    const response = await api.get(`/api/posts/${postid}/comments`);
    comments.value = response.data.reverse();
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
};

const fetchUser = () => {
  const userData = JSON.parse(localStorage.getItem('user'));
  console.log(userData);
  if (userData) {
    newComment.value.author_id = userData.userid;
    newComment.value.author_avatar = userData.imageavatar;
    newComment.value.email = userData.email;
    state.userid = userData.userid;
  } else {
    newComment.value.author_id = '';
    newComment.value.author_avatar = '';
    newComment.value.email = '';
  }
};

const addComment = async () => {
  const postid = route.params.id;
  try {
    if (!newComment.value.email) {
      alert('Vui long dang nhap');
      return;
    }
    const response = await api.post(
      `/api/posts/${postid}/comments`,
      newComment.value
    );
    if (response.status != 200) {
      alert('Faile to add comment');
    }
    // comments.value.push(response.data);
    fetchComments(postid);
    clearForm();
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};

async function deleteComment(commentid, authorid) {
  const confirmDelete = confirm(
    'Are you sure you want to delete this comment?'
  );
  if (!confirmDelete) {
    return; // Hủy xóa nếu người dùng chọn "Cancel"
  }
  try {
    const postid = route.params.id;
    // Gửi request DELETE đến API
    const response = await api.delete(
      `/api/posts/${postid}/comments/${commentid}`,
      {
        data: {
          author_id: authorid, // Truyền author_id trong phần body
        },
      }
    );

    // Kiểm tra kết quả trả về
    if (response.status === 200) {
      console.log(response.data.message); // Log thông báo thành công
      fetchComments(postid);
      // Thực hiện các hành động bổ sung, ví dụ:
      // - Cập nhật danh sách comment trên UI
      // - Hiển thị thông báo
    }
  } catch (error) {
    // Xử lý lỗi
    if (error.response) {
      // Lỗi từ phía server (404, 500,...)
      console.error(error.response.data.message);
      alert(error.response.data.message); // Hiển thị thông báo lỗi
    } else {
      // Lỗi kết nối hoặc lỗi không xác định
      console.error('Error deleting comment:', error.message);
      alert('Something went wrong. Please try again later.');
    }
  }
}

const fetchRelatedArticles = async () => {
  try {
    const response = await api.get('/api/posts/related');
    relatedArticles.value = response.data;
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching related articles:', error);
  }
};

// Lifecycle hook: Khi component được tạo
onMounted(() => {
  const postid = route.params.id;
  fetchBlog(postid);
  fetchRelatedArticles();
  fetchComments(postid);
  fetchUser();
});

// Xử lý khi route thay đổi
onBeforeRouteUpdate((to, from, next) => {
  const postid = to.params.id; // Lấy ID mới từ route
  fetchBlog(postid); // Cập nhật dữ liệu bài viết
  fetchComments(postid); // Cập nhật bình luận
  next(); // Cho phép điều hướng
});
</script>

<style scoped>
.comment {
  position: relative;
}

.comment button {
  position: absolute;
  top: 0;
  right: 0;
}
.card-img-top {
  height: 180px;
  object-fit: cover;
}
header {
  height: 150px;
  background-color: #b3d5ed;
}
.comments-section {
  border: 1px solid grey;
  padding: 30px;
  border-radius: 5px;
}
.related-articles {
  max-width: 80%;
}

.showMoreAndLess button {
  text-decoration: none;
  color: #fff;
  font-weight: bold;
  background-color: #a2d2df;
  margin: 30px 10px 0 10px;
}

.list-group {
  overflow-y: auto; /* Hiển thị thanh cuộn dọc */
  overflow-x: hidden; /* Ẩn thanh cuộn ngang */
  max-height: 400px;
}

/* Tùy chỉnh thanh cuộn */
.list-group::-webkit-scrollbar {
  width: 8px; /* Chiều rộng của thanh cuộn dọc */
}

.list-group::-webkit-scrollbar-thumb {
  background-color: #888; /* Màu của thanh cuộn */
  border-radius: 4px; /* Bo góc thanh cuộn */
}

.list-group::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* Màu của thanh cuộn khi hover */
}

.list-group::-webkit-scrollbar-track {
  background: #f1f1f1; /* Màu nền của thanh cuộn */
}
</style>
