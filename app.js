const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.static(path.join(__dirname, "public"))); // ✅ CHỈ dùng dòng này



// Cài đặt view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Cài đặt session
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}));

// Middleware yêu cầu đăng nhập
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Trang chủ chuyển hướng dashboard
app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

// -------------------- ĐĂNG KÝ --------------------
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { username, password, confirmPassword } = req.body;
  const filePath = "./data/users.json";

  // Kiểm tra nhập thiếu
  if (!username || !password || !confirmPassword) {
    return res.send("❌ Vui lòng nhập đầy đủ thông tin.");
  }

  if (password !== confirmPassword) {
    return res.send("❌ Mật khẩu không khớp.");
  }

  // Tạo file nếu chưa có
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  let users;
  try {
    users = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return res.send("⚠️ Lỗi đọc dữ liệu.");
  }

  if (users.find(u => u.username === username)) {
    return res.send("⚠️ Tài khoản đã tồn tại.");
  }

  const newUser = { username, password, balance: 2000, robux: 0 };
  users.push(newUser);

  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    console.log("✅ Đăng ký thành công:", newUser);
  } catch (err) {
    return res.send("⚠️ Không thể ghi file.");
  }

  res.redirect("/login");
});

// -------------------- ĐĂNG NHẬP --------------------
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.send("❌ Sai tài khoản hoặc mật khẩu!");

  req.session.user = { ...user };
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// -------------------- DASHBOARD --------------------
app.get("/dashboard", requireLogin, (req, res) => {
  const accounts = JSON.parse(fs.readFileSync("./data/accounts.json", "utf8"));
  res.render("dashboard", {
    user: req.session.user,
    accounts
  });
});

// -------------------- SPIN --------------------
app.get("/spin", requireLogin, (req, res) => {
  res.render("spin", { user: req.session.user });
});

app.post("/spin=", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ status: "fail", message: "Chưa đăng nhập" });
  }

  const users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
  const index = users.findIndex(u => u.username === req.session.user.username);
  if (index === -1) {
    return res.status(404).json({ status: "fail", message: "Không tìm thấy user" });
  }

  const user = users[index];

  if (user.balance < 20000) {
    return res.json({ status: "fail", message: "Không đủ xu để mở!" });
  }

  const rewards = [
    ...Array(30).fill(100),
    ...Array(25).fill(200),
    ...Array(20).fill(500),
    ...Array(15).fill(1000),
    ...Array(7).fill(2000),
    ...Array(3).fill(5000),
    ...Array(1).fill(10000)
  ];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  user.balance -= 20000;
  user.robux += reward;

  req.session.user.balance = user.balance;
  req.session.user.robux = user.robux;

  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2));

  return res.json({
    status: "success",
    reward,
    balance: user.balance,
    robux: user.robux
  });
});

app.post("/spin-reward", (req, res) => {
  const { cost, reward } = req.body;
  const user = req.session.user;

  if (!user || user.balance < cost) {
    return res.status(400).json({ message: "Không đủ xu", success: false });
  }

  user.balance -= cost;
  user.robux += reward;

  const users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
  const idx = users.findIndex(u => u.username === user.username);
  users[idx] = user;
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2));

  return res.json({ balance: user.balance, robux: user.robux });
});

// -------------------- MUA TÀI KHOẢN --------------------
app.post("/buy-account", (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });

  const { id, price } = req.body;
  const users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
  const accounts = JSON.parse(fs.readFileSync("./data/accounts.json", "utf8"));

  const userIndex = users.findIndex(u => u.username === req.session.user.username);
  const accIndex = accounts.findIndex(a => a.id === id);

  if (userIndex === -1 || accIndex === -1) {
    return res.json({ success: false, message: "Không tìm thấy tài khoản" });
  }

  if (accounts[accIndex].sold) {
    return res.json({ success: false, message: "Tài khoản đã được bán" });
  }

  if (users[userIndex].balance < price) {
    return res.json({ success: false, message: "Không đủ xu để mua" });
  }

  users[userIndex].balance -= price;
  accounts[accIndex].sold = true;
  req.session.user.balance = users[userIndex].balance;

  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2));
  fs.writeFileSync("./data/accounts.json", JSON.stringify(accounts, null, 2));

  return res.json({ success: true, newBalance: users[userIndex].balance });
});
app.get('/napthe', (req, res) => {
  const username = req.session.username || 'guest'; // Lấy từ session, hoặc 'guest' nếu chưa đăng nhập
  res.render('napthe', { username });
});

app.get('/history', (req, res) => {
  const username = req.session.username || 'guest';

  // Dữ liệu mẫu (có thể lấy từ DB trong thực tế)
  const lichSuMua = [
    { tenAcc: 'acc_legend1', gia: 500, thoigian: '2025-07-05 14:25' },
    { tenAcc: 'vip_acc_02', gia: 700, thoigian: '2025-07-04 09:55' }
  ];

  const lichSuNap = [
    { sotien: 100000, hinhthuc: 'Thẻ cào', thoigian: '2025-07-03 17:20' },
    { sotien: 200000, hinhthuc: 'Momo', thoigian: '2025-07-02 13:45' }
  ];

  res.render('history', { username, lichSuMua, lichSuNap });
});

app.get("/shop", (req, res) => {
  const user = req.session.user || { username: "Khách", robux: 0 };
  res.render("shop", { user });
});
app.get('/topup', (req, res) => {
  const username = req.session.username || 'guest'; // Lấy từ session, hoặc 'guest' nếu chưa đăng nhập
  res.render('topup', { username });
});
app.post('/napthe/card', (req, res) => {
  const { loaithe, menhgia, mathe, seri } = req.body;

  // TODO: xử lý lưu vào database hoặc gửi cho admin

  console.log(`[NAP THE] ${loaithe} - ${menhgia} - ${mathe} - ${seri}`);
  
  res.render('card'); // Hiển thị trang thành công
});

app.get('/profile', (req, res) => {
  const username = req.session.username || 'guest';

  // Dữ liệu giả lập — nên thay bằng lấy từ DB
  const user = {
    username: username,
    email: 'user@example.com',
    robux: 2500,
    muaAccCount: 3,
    napTotal: 300000,
    rank: 'VIP'
  };

  res.render('profile', { user });
});

app.post('/buy', (req, res) => {
  const { product } = req.body;
  const price = 10000;
  const username = req.session.user?.username;
  const filePath = './data/users.json';

  if (!username) return res.json({ success: false, message: 'Bạn chưa đăng nhập!' });

  const users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const user = users.find(u => u.username === username);

  if (!user) return res.json({ success: false, message: 'Không tìm thấy tài khoản!' });
  if (user.balance < price) return res.json({ success: false, message: 'Không đủ số dư!' });

  user.balance -= price;
  req.session.user.balance = user.balance;

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  res.json({ success: true, newBalance: user.balance });
});

// -------------------- CHẠY SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server đang chạy tại http://localhost:" + PORT);
});
