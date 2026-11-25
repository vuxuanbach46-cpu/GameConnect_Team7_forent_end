// Module gọi API bằng axios: cấu hình 1 lần, mọi trang dùng chung.
// (axios được nạp từ CDN bằng thẻ <script> trong từng trang HTML, trước file này)
//
// Cách dùng (trong các file js/pages/*.js):
//   const items = await api.get("/items");
//   const items = await api.get("/items", { q: "com" });          // -> /items?q=com
//   const created = await api.post("/items", { name: "Trà đá", price: 5000 });
//   await api.put("/items/1", { name: "Tên mới" });
//   await api.delete("/items/1");
//
// Các hàm trả về thẳng dữ liệu JSON (đã lấy sẵn response.data).
// Nếu lỗi, hàm sẽ throw ApiError -> bắt bằng try/catch và hiện error.message cho người dùng.

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status; // mã HTTP: 404, 422, 500... (0 = không gọi được server)
    this.data = data; // nội dung lỗi gốc server trả về
  }
}

// Instance axios dùng chung: mọi request tự nối thêm baseURL phía trước
const http = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000, // quá 10 giây không phản hồi thì báo lỗi
  headers: { "Content-Type": "application/json" },
});

// Muốn gửi token đăng nhập cho mọi request (khi nhóm làm chức năng login), bỏ comment đoạn dưới:
http.interceptors.request.use((config) => {
  const isAuthPublic = config.url && (
    config.url.includes("/auth/login") || 
    config.url.includes("/auth/register") ||
    config.url.includes("/auth/google")
  );
  if (!isAuthPublic) {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy câu thông báo lỗi dễ đọc từ response của FastAPI
function getErrorMessage(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  // Lỗi 422 (dữ liệu không hợp lệ): detail là mảng [{ loc: [...], msg: "..." }]
  if (data && Array.isArray(data.detail)) {
    return data.detail.map((e) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join("; ");
  }
  return `Lỗi ${status}`;
}

// Chuyển hướng về trang đăng nhập khi token hết hạn và không thể refresh
function redirectToLoginOnExpired() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  const isLoginPage = window.location.pathname.endsWith("/login.html") || window.location.pathname.endsWith("/register.html");
  if (!isLoginPage) {
    const loginUrl = new URL(
      window.location.pathname.includes("/pages/") ? "login.html" : "pages/login.html",
      window.location.href,
    );
    if (window.location.pathname.includes("/pages/")) {
      loginUrl.searchParams.set(
        "next",
        `${window.location.pathname.split("/").pop()}${window.location.search}${window.location.hash}`,
      );
    }
    window.location.href = loginUrl.href;
  }
}

let _refreshTokenPromise = null;

// Gom xử lý lỗi một chỗ: đổi lỗi của axios thành ApiError dễ dùng + tự động xoay vòng token khi gặp 401
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const originalConfig = error.config || {};
      const reqUrl = String(originalConfig.url || "");
      const isAuthEndpoint = reqUrl.includes("/auth/login") || reqUrl.includes("/auth/refresh") || reqUrl.includes("/auth/register");

      if (status === 401 && !isAuthEndpoint && !originalConfig._retry) {
        originalConfig._retry = true;
        const refreshToken = localStorage.getItem("refresh_token");
        const oldAccessToken = localStorage.getItem("access_token") || "";

        if (!refreshToken) {
          redirectToLoginOnExpired();
          return Promise.reject(new ApiError(getErrorMessage(data, status), status, data));
        }

        try {
          if (!_refreshTokenPromise) {
            _refreshTokenPromise = axios
              .post(
                `${http.defaults.baseURL}/auth/refresh`,
                { refresh_token: refreshToken },
                {
                  headers: {
                    "Content-Type": "application/json",
                    ...(oldAccessToken ? { Authorization: `Bearer ${oldAccessToken}` } : {}),
                    "X-Refresh-Token": refreshToken
                  }
                }
              )
              .then((res) => {
                const body = res?.data;
                if (body && body.status_code && body.status_code >= 400) {
                  throw new Error(body.error || body.message || "Refresh token hết hạn");
                }
                const tokenData = body?.data || body || {};
                const newAccessToken = tokenData.access_token;
                const newRefreshToken = tokenData.refresh_token;
                if (!newAccessToken) {
                  throw new Error("Không nhận được access_token mới");
                }
                localStorage.setItem("access_token", newAccessToken);
                if (newRefreshToken) {
                  localStorage.setItem("refresh_token", newRefreshToken);
                }
                return newAccessToken;
              })
              .finally(() => {
                _refreshTokenPromise = null;
              });
          }

          const newToken = await _refreshTokenPromise;
          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return http(originalConfig);
        } catch (_) {
          redirectToLoginOnExpired();
          return Promise.reject(new ApiError(getErrorMessage(data, status), status, data));
        }
      }

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
  upload: (path, formData) => http.post(path, formData, {
    headers: { "Content-Type": undefined },
  }).then((res) => res.data),
  put: (path, body) => http.put(path, body).then((res) => res.data),
  patch: (path, body) => http.patch(path, body).then((res) => res.data),
  delete: (path) => http.delete(path).then((res) => res.data),
};
