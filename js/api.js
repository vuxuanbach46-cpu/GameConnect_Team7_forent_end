// Module gọi API bằng axios: cấu hình 1 lần, mọi trang dùng chung.
// (axios được nạp từ CDN bằng thẻ <script> trong từng trang HTML, trước file này)

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status; // mã HTTP: 404, 422, 500... (0 = không gọi được server)
    this.data = data; // nội dung lỗi gốc server trả về
  }
}

// Instance axios dùng chung: mọi request tự nối thêm baseURL phía trước
const http = axios.create({
  baseURL: (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : "http://127.0.0.1:8000",
  timeout: 10000, // quá 10 giây không phản hồi thì báo lỗi
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn token xác thực cho các request cần đăng nhập (trừ các endpoint auth công khai)
http.interceptors.request.use((config) => {
  const isAuthPublic = config.url && (
    config.url.includes("/auth/login") || 
    config.url.includes("/auth/register") ||
    config.url.includes("/auth/google")
  );
  if (!isAuthPublic) {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy câu thông báo lỗi dễ đọc từ response của backend
function getErrorMessage(data, status) {
  if (!data) return `Lỗi ${status}`;
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string" && data.message !== "Failed") return data.message;

  // Lỗi 422 (dữ liệu không hợp lệ): detail là mảng [{ loc: [...], msg: "..." }]
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => `${e.loc ? e.loc[e.loc.length - 1] : ""}: ${e.msg}`).join("; ");
  }
  if (Array.isArray(data.error)) {
    return data.error.map((e) => `${e.loc ? e.loc[e.loc.length - 1] : ""}: ${e.msg}`).join("; ");
  }
  return `Lỗi ${status}`;
}

// Gom xử lý lỗi một chỗ: đổi lỗi của axios thành ApiError dễ dùng
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server có trả lời nhưng là lỗi (4xx, 5xx)
      const { status, data } = error.response;
      return Promise.reject(new ApiError(getErrorMessage(data, status), status, data));
    }
    // Không có response: server tắt, sai URL, bị chặn CORS, hoặc quá thời gian chờ
    return Promise.reject(new ApiError(
      "Không kết nối được backend. Backend đã chạy chưa? Kiểm tra CONFIG.API_BASE_URL.", 0,
    ));
  },
);

const api = {
  get: (path, params) => http.get(path, { params }).then((res) => res.data),
  post: (path, body) => http.post(path, body).then((res) => res.data),
  put: (path, body) => http.put(path, body).then((res) => res.data),
  delete: (path) => http.delete(path).then((res) => res.data),
};
