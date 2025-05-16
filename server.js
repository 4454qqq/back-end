const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit"); // 新增限流库

const auditManagementRoutes = require("./routes/AuditManagementPage");
const homeRoutes = require("./routes/HomePage");
const logDetailRoutes = require("./routes/LogDetailPage");
const loginRoutes = require("./routes/LoginPage");
const logPublicRoutes = require("./routes/LogPublicPage");
const myLogRoutes = require("./routes/MyLogPage");
const settingRoutes = require("./routes/SettingPage");
const userInfoRoutes = require("./routes/UserInfoPage");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080;

// 通用速率限制器 - 适用于所有路由
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP限制1000次请求
  message: {
    error: "请求过于频繁，请稍后再试"
  },
  standardHeaders: true, // 返回标准速率限制头
  legacyHeaders: false, // 禁用旧的X-RateLimit-*头
});


// API接口限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 300, // 每个IP限制300次API请求
  message: {
    error: "API请求过于频繁, 请稍后再试"
  },
});

// 设置请求体大小限制为50MB
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: false,
  })
);

// 应用通用速率限制
app.use(generalLimiter);

// 静态文件目录
app.use("/data", express.static("data"));
app.use("/userAvatar", express.static("userAvatar"));

// 路由配置 - 为不同路由应用不同的限制
app.use("/login", apiLimiter, loginRoutes); // 登录接口内部设置严格限制
app.use("/auditManagement", apiLimiter, auditManagementRoutes);
app.use("/home", homeRoutes);
app.use("/logDetail", apiLimiter, logDetailRoutes);
app.use("/logPublic", apiLimiter, logPublicRoutes);
app.use("/myLog", apiLimiter, myLogRoutes);
app.use("/setting", apiLimiter, settingRoutes);
app.use("/userInfo", apiLimiter, userInfoRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));