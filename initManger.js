const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Manager } = require("./models"); // 引入 Manager 模型

// 连接到 MongoDB 数据库
mongoose
  .connect("mongodb://127.0.0.1:27017/AuditManagementSystem", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// 初始化管理员数据
const initializeManagerData = async () => {
    const username = 'Admin'
    const role = "superAdmin"
    const password = '123'

  try {
    // 检查是否已经存在管理员（超级管理员）
    const existingAdmin = await Manager.findOne({ username });
    if (existingAdmin) {
      console.log("用户已经存在，跳过初始化");
      return;
    }

    // 加密管理员的密码
    const hashedPassword = await bcrypt.hash(password, 10); // 将明文密码加密

    // 创建一个新的超级管理员
    const superAdmin = new Manager({
      username, // 管理员的用户名
      password: hashedPassword, // 使用加密后的密码
      role, // 设置角色为超级管理员
    });

    // 保存到数据库
    await superAdmin.save();
    console.log("超级管理员初始化成功！");
    console.log('用户名：', username);
    console.log('密码：', password);
    
  } catch (error) {
    console.error("初始化超级管理员失败：", error);
  }finally{
    mongoose.disconnect()
  }
};

// 执行初始化
initializeManagerData();
