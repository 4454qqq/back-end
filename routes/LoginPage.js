const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config.json");
const md5 = require("md5");
const router = express.Router();
const { User, TravelLog, Manager } = require("../models"); //引入模型
const rateLimit = require("express-rate-limit");

// 密钥，请替换为你的实际密钥
const secretKey = config.secretKey;

// 生成 JWT
function generateToken(payload) {
  const options = { expiresIn: "30d" }; // 设置过期时间

  return jwt.sign(payload, secretKey, options);
}

const loginLimit = 5;  //密码试错次数
const limitLoginTime = 1;  //限制登录时间（分钟）

// 登录接口限流 - 防止暴力破解
const loginLimiter = rateLimit({
  windowMs: limitLoginTime * 60 * 1000, // 分钟
  max: loginLimit + 1, // 限制登录尝试次数
  message: {
    error: "登录尝试次数过多"
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `${req.ip}-${req.body.username}`; // 根据IP+用户名组合限流
  }
});

// 处理用户登录请求
router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    // 防止用户恶意试探密码
    // 检查是否被限流
    console.log(req.rateLimit.remaining);
    
    if (req.rateLimit && req.rateLimit.remaining <= 0) {

      return res.status(429).json({
        status: "error",
        message: "操作频繁",
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    const user = await User.findOne({ username, password: md5(password) });
    if (user) {
      const payload = {
        id: user._id,
        username: user.username,
        customId: user.customId,
      };
      let userAvatar = user.userAvatar; //用户头像
      if (userAvatar != null && !userAvatar.startsWith("http")) {
        userAvatar = `${config.baseURL}/${config.userAvatarPath}/${userAvatar}`;
      }
      let background_image = user.backgroundImage; // 背景图
      if (background_image != null && !background_image.startsWith("http")) {
        background_image = `${config.baseURL}/${config.userBackgroundPath}/${background_image}`;
      }
      const token = generateToken(payload);
      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
          token: token,
          userInfo: {
            userId: user._id,
            username: user.username,
            customId: user.customId,
            profile: user.profile,
            userAvatar: userAvatar,
            backgroundImage: background_image,
          },
        },
      });
    } else {
      res.status(401).json({ status: "error", message: "用户名或密码不正确", remainingAttempts: req.rateLimit ? req.rateLimit.remaining : undefined });

      console.log("Invalid username or password");
    }
  } catch (err) {
    console.error("Error querying database:", err);
    res.status(500).json({ status: "error", message: "出错了，请联系管理员" });
  }
});


const registerLimit = 1;  //注册次数限制
const limitRegisterTime = 1;  //限制登录时间（分钟）

// 注册接口限流 - 防止恶意注册，ip匹配
const registerLimiter = rateLimit({
  windowMs: limitRegisterTime * 60 * 1000, // 时间窗口
  max: registerLimit + 1, // 限制注册次数
  message: {
    error: "注册次数过多"
  },
  skipFailedRequests: true, //跳过注册失败的请求
});

// 处理用户注册请求
router.post("/register", registerLimiter, async (req, res) => {
  const { username, password, email, phone } = req.body;
  try {
  
    // 检查是否被限流
    if (req.rateLimit && req.rateLimit.remaining <= 0) {

      return res.status(429).json({
        status: "error",
        message: "操作频繁",
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / (1000))
      });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res
        .status(401)
        .json({ status: "error", message: "用户名已经存在，请换一个吧~" });
    } else {
      const newUser = new User({
        username,
        password: md5(password),
        email,
        phone,
      });
      await newUser.save();
      res
        .status(200)
        .json({ status: "success", message: "Registration successful" });
    }
  } catch (err) {
    console.error("Error querying database:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

module.exports = router;
