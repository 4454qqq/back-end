const express = require("express");
const { User, TravelLog, Manager } = require("../models");
const router = express.Router();
const config = require("../config.json");
const { saveMediaFile } = require("../utils/fileManager");
const crypto = require("crypto");
const { authenticateToken } = require("./auth");
const calaMD5 = (data) => {
  return crypto.createHash("md5").update(data).digest("hex");
};

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

// 游记发布提交
router.post("/upload", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  // console.log(userId);
  const contentLength = req.headers["content-length"];
  console.log("请求体大小:", contentLength, "字节");
  const {
    travelId,
    title,
    content,
    state,
    httpImgUrls,
    httpVideoUrls,
    images,
    videos,
    travelMonth,
    percost,
    rate,
    destination,
    topic,
  } = req.body;
  const imageData = images._parts[0][1];
  const videoData = videos?._parts[0][1];
  res.setHeader("content-type", "application/json");
  // 保存游记图片
  try {
    const imagesUrl = imageData.map((data) => {
      const md5 = calaMD5(data[0]);
      const ext = data[1];
      return `${md5}.${ext}`;
    }); // 摘要运算得到加密文件名
    console.log(imagesUrl);
    imagesUrl.forEach((fileName, index) =>
      saveMediaFile(imageData[index][0], config.imgUploadPath, fileName)
    );

    // 处理视频保存
    const videosUrl = videoData.map((data) => {
      const md5 = calaMD5(data[0]);
      const ext = data[1];
      return `${md5}.${ext}`;
    });
    console.log(videosUrl);
    for (let i = 0; i < videoData.length; i++) {
      await saveMediaFile(videoData[i][0], config.videoUploadPath, videosUrl[i]);
    }

    const newImagesUrl = [...httpImgUrls, ...imagesUrl];
    const newVideosUrl = [...httpVideoUrls, ...videosUrl];
    const travelLog = new TravelLog({
      title,
      content,
      imagesUrl: newImagesUrl,
      videosUrl: newVideosUrl,
      travelMonth,
      percost,
      rate,
      destination,
      topic,
      userId,
      state,
    });
    // 保存游记到数据库
    if (travelId) {
      await TravelLog.findByIdAndUpdate(travelId, {
        title,
        content,
        imagesUrl: newImagesUrl,
        videosUrl: newVideosUrl,
        travelMonth,
        percost,
        rate,
        destination,
        topic,
        userId,
        state,
      });
    } else {
      await travelLog.save();
    }

    res.status(201).json(createSuccessResponse("游记发布成功！"));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse(err));
    return;
  }
});

// 游记保存到草稿箱
router.post("/drafts", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  // console.log(userId);
  const contentLength = req.headers["content-length"];
  console.log("请求体大小:", contentLength, "字节");
  const {
    title,
    content,
    images,
    videos,
    travelMonth,
    percost,
    rate,
    destination,
    topic,
    state,
  } = req.body;
  console.log(req.body);
  const imageData = images._parts[0][1];
  const videoData = videos?._parts[0][1];
  res.setHeader("content-type", "application/json");
  // 保存游记图片
  try {
    // console.log(imageData); // 打印出来是乱码但是没有关系
    const imagesUrl = imageData.map((data) => {
      const md5 = calaMD5(data[0]);
      const ext = data[1];
      return `${md5}.${ext}`;
    }); // 摘要运算得到加密文件名
    console.log(imagesUrl);
    const videosUrl = videoData.map((data) => {
      const md5 = calaMD5(data[0]);
      const ext = data[1];
      return `${md5}.${ext}`;
    }); // 摘要运算得到加密文件名
    console.log(videosUrl);
    imagesUrl.forEach((fileName, index) =>
      saveMediaFile(imageData[index][0], config.imgUploadPath, fileName)
    );

    const travelLog = new TravelLog({
      title,
      content,
      imagesUrl,
      travelMonth,
      percost,
      rate,
      destination,
      topic,
      userId,
      state,
    });
    // 保存游记到数据库
    await travelLog.save();
    res.status(201).json(createSuccessResponse("游记保存成功！"));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse(err));
    return;
  }
});



module.exports = router;
