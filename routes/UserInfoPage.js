const express = require("express");
const config = require("../config.json");
const router = express.Router();
const { User, TravelLog, Manager, Focus } = require("../models"); //引入模型
const crypto = require("crypto");
const { saveMediaFile } = require("../utils/fileManager");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const calaMD5 = (data) => {
  return crypto.createHash("md5").update(data).digest("hex");
};
//验证用户登录状态
const { authenticateToken } = require("./auth");

router.get("/info", authenticateToken, async (req, res) => {
  // 获取token中的用户id
  const userId = req.user.id;
  console.log(userId);
  try {
    const user = await User.findOne({ _id: userId });
    if (user) {
      let userAvatar = user.userAvatar; //用户头像
      if (userAvatar != null && !userAvatar.startsWith("http")) {
        userAvatar = `${config.baseURL}/${config.userAvatarPath}/${userAvatar}`;
      }
      let background_image = user.backgroundImage; // 背景图
      if (background_image != null && !background_image.startsWith("http")) {
        background_image = `${config.baseURL}/${config.userBackgroundPath}/${background_image}`;
      }
      console.log("success");
      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
          userId: user._id,
          userAvatar: userAvatar,
          username: user.username,
          customId: user.customId,
          profile: user.profile,
          gender: user.gender,
          backgroundImage: background_image, // 用户头像的 URL
          follow: user.follow,
          fans: user.fans,
        },
      });
    } else {
      res.status(401).json({ status: "error", message: "请先登录" });
      console.log("用户不存在");
    }
  } catch (err) {
    console.error("Error querying database:", err);
    res.status(500).json({ status: "error", message: "出错了，请联系管理员" });
  }
});


router.get("/getUserById/:id", async (req, res) => {
  // 获取token中的用户id
  const userId = req.params.id;
  console.log(userId);
  try {
    const user = await User.findOne({ _id: userId });
    if (user) {
      let userAvatar = user.userAvatar; //用户头像
      if (userAvatar != null && !userAvatar.startsWith("http")) {
        userAvatar = `${config.baseURL}/${config.userAvatarPath}/${userAvatar}`;
      }
      let background_image = user.backgroundImage; // 背景图
      if (background_image != null && !background_image.startsWith("http")) {
        background_image = `${config.baseURL}/${config.userBackgroundPath}/${background_image}`;
      }
      console.log("success");
      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
          userAvatar: userAvatar,
          username: user.username,
          customId: user.customId,
          profile: user.profile,
          gender: user.gender,
          backgroundImage: background_image, // 用户头像的 URL
        },
      });
    } else {
      res
        .status(401)
        .json({ status: "error", message: "用户不存在或者已经注销！" });
      console.log("用户不存在或者已经注销！");
    }
  } catch (err) {
    console.error("Error querying database:", err);
    res.status(500).json({ status: "error", message: "出错了，请联系管理员" });
  }
});

router.post("/updateBackgroundImage", authenticateToken, async (req, res) => {
  //todo:上传的背景图片需要管理员审核？
  // 获取token中的用户id
  const userId = req.user.id;
  //获取请求体中的图片
  const { images } = req.body;
  const imageData = images._parts[0][1];
  try {
    const md5 = calaMD5(imageData[0]);
    const ext = imageData[1];
    const imagesUrl = md5 + "." + ext;
    // 摘要运算得到加密文件名
    console.log(imagesUrl);
    await saveMediaFile(imageData[0], config.userBackgroundPath, imagesUrl);
    //更新用户的背景图片
    console.log(userId);
    const result = await User.updateOne(
      { _id: userId },
      { $set: { backgroundImage: imagesUrl } }
    );
    console.log(result); // 打印更新操作的结果信息
    if (result.modifiedCount > 0) {
      console.log("success");
      let background_image = imagesUrl;
      if (background_image != null && !background_image.startsWith("http")) {
        background_image = `${config.baseURL}/${config.userBackgroundPath}/${background_image}`;
      }
      res.status(200).json({
        status: "success",
        message: "update successful",
        data: {
          url: background_image, // 用户头像的 URL
        },
      });
    } else {
      res.status(401).json({ status: "error", message: "更新失败" });
      console.log("请不要上传相同的图片");
    }
  } catch (err) {
    console.error("Error querying database:", err);
    res.status(500).json({ status: "error", message: "出错了，请联系管理员" });
  }
});

router.post("/updateUserAvatar", authenticateToken, async (req, res) => {
  //todo:上传的头像图片需要管理员审核？
  // 获取token中的用户id
  const userId = req.user.id;
  //获取请求体中的图片
  const { images } = req.body;
  const imageData = images._parts[0][1];
  try {
    const md5 = calaMD5(imageData[0]);
    const ext = imageData[1];
    const imagesUrl = md5 + "." + ext;
    // 摘要运算得到加密文件名
    console.log(imagesUrl);
    saveMediaFile(imageData[0], config.userAvatarPath, imagesUrl);
    //更新用户的背景图片
    console.log(userId);
    const result = await User.updateOne(
      { _id: userId },
      { $set: { userAvatar: imagesUrl } }
    );
    console.log(result); // 打印更新操作的结果信息
    if (result.modifiedCount > 0) {
      console.log("success");
      let userAvatar_image = imagesUrl;
      if (userAvatar_image != null && !userAvatar_image.startsWith("http")) {
        userAvatar_image = `${config.baseURL}/${config.userAvatarPath}/${userAvatar_image}`;
      }
      res.status(200).json({
        status: "success",
        message: "update successful",
        data: {
          url: userAvatar_image, // 用户头像的 URL
        },
      });
    } else {
      res.status(401).json({ status: "error", message: "更新失败" });
      console.log("请不要上传相同的图片");
    }
  } catch (err) {
    console.error("Error querying database:", err);
    res.status(500).json({ status: "error", message: "出错了，请联系管理员" });
  }
});


//用户信息更改
router.put("/update", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userData = req.body;

  try {
    // 根据 userId 查找用户
    const user = await User.findByIdAndUpdate(userId, userData, { new: true });

    if (user) {
      res
        .status(200)
        .json({ status: "success", message: "用户信息已更新", data: user });
    } else {
      res.status(404).json({ status: "error", message: "未找到用户" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ status: "error", message: "更新用户信息时出错" });
  }
});

module.exports = router;
