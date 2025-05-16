const express = require("express");
const { User, TravelLog, Manager } = require("../models");
const config = require("../config.json");
const router = express.Router();

// 根据游记id返回游记详细信息
router.get("/findLog/:id", async (req, res) => {
  try {
    console.log('start');
    
    const logId = req.params.id;
    const travelLog = await TravelLog.findById(logId);
    if (!travelLog) {
      return res.status(404).json({ error: "Travel log not found" });
    }

    // 拼接图片和视频路径
    const newImagesUrl = travelLog.imagesUrl.map(
      (imageUrl) => `${config.baseURL}/${config.imgUploadPath}/${imageUrl}`
    );
    travelLog.imagesUrl = newImagesUrl;
    
    const newVideosUrl = travelLog.videosUrl.map(
      (videoUrl) => `${config.baseURL}/${config.videoUploadPath}/${videoUrl}`
    );
    travelLog.videosUrl = newVideosUrl;
    
    res.json(travelLog);
    // console.log(travelLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;
