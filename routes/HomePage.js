const express = require("express");
const { convertDateToString } = require("../utils/timeManager");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {
  User,
  TravelLog,
  Manager,
  Like,
  Collect,
  Focus,
  Share,
} = require("../models");
const config = require("../config.json");
const { authenticateToken } = require("./auth");
const router = express.Router();

const createSuccessResponse = (message) => {
  return {
    success: true,
    message,
  };
};

const createErrorResponse = (message) => {
  return {
    success: false,
    message,
  };
};

// 获取瀑布流增量数据-首页  参数包括主题、搜索内容、数据条目
router.get("/travelLogs", async (req, res) => {
  try {
    const { selectedTopic, searchContent } = req.query;
    // 瀑布流数据加载 每次加载count张
    const count = parseInt(req.query.count);
    const travelLogs = await TravelLog.aggregate([
      {
        $lookup: {
          from: "users", // 用户集合名称
          localField: "userId", // TravelLog集合中的关联字段
          foreignField: "_id", // User集合中的关联字段
          as: "user", // 存储联结后的用户信息
        },
      },
      {
        $match: {
          $and: [
            { state: "已通过" }, // 查询状态为“已通过”的游记信息
            { isDelete: false }, // 游记信息未被逻辑删除
            { topic: { $regex: selectedTopic, $options: "i" } },
            {
              $or: [
                { title: { $regex: searchContent, $options: "i" } },
                { "user.username": { $regex: searchContent, $options: "i" } },
              ],
            },
          ],
        },
      },
      {
        // 从文档中选择并返回指定的字段
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          imagesUrl: 1,
          likes: 1,
          userId: 1,
          "user.username": 1,
          "user.userAvatar": 1,
        },
      },
      { $sample: { size: count } }, // 每次查询时采样不同的随机结果
    ]);
    const result = travelLogs
      // .sort((a, b) => b.likes - a.likes) // 按点赞量降序排序
      .map((item) => {
        let imageUrl = item.imagesUrl[0]; // 只展示第一张图片
        if (!imageUrl.startsWith("http")) {
          imageUrl = `${config.baseURL}/${config.imgUploadPath}/${imageUrl}`;
        }
        let userAvatar = item.user[0].userAvatar;
        if (!userAvatar.startsWith("http")) {
          userAvatar = `${config.baseURL}/${config.userAvatarPath}/${userAvatar}`;
        }
        // 将 MongoDB 文档对象转换为普通 JavaScript 对象
        const newItem = {
          _id: item._id,
          title: item.title,
          imageUrl: imageUrl,
          userId: item.userId,
          username: item.user[0].username,
          userAvatar: userAvatar,
        };
        return newItem;
      });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json(createErrorResponse("游记列表获取失败")); // 如果出现错误，返回500错误
  }
});

// 根据游记id返回作者详细信息
router.get("/findAuthor/:id", async (req, res) => {
  try {
    const logId = req.params.id;
    console.log("logId", logId);
    const travelLog = await TravelLog.findById(new ObjectId(logId));
    console.log("travelLog", travelLog);
    if (!travelLog) {
      return res.status(404).json({ error: "Travel log not found" });
    }
    const user = await User.findById(travelLog.userId);
    console.log("user", user);
    if (!user) {
      return res.status(404).json({ error: "Travel author not found" });
    }
    let userAvatar = user.userAvatar;
    if (!userAvatar.startsWith("http")) {
      userAvatar = `${config.baseURL}/${config.userAvatarPath}/${userAvatar}`;
    }
    const userInfo = {
      userId: user._id,
      username: user.username,
      userAvatar: userAvatar,
    };
    console.log(userInfo);
    res.json(userInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
