const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
<<<<<<< HEAD
=======
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
>>>>>>> 26d76ba (Remove node_modules and update .gitignore)

const app = express();


// Setup view engine & static files
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

<<<<<<< HEAD
// Home page
app.get("/", (req, res) => {
  res.send("✅ Website đang chạy trên Koyeb thành công!");
});

// Route test callback (giả lập cho T3)
app.post("/callback", (req, res) => {
  console.log("📩 Callback nhận được:", req.body);
  res.status(200).send("OK");
});
=======
// TEST CALLBACK API
app.post('/callback', (req, res) => {
  const { status, amount, request_id, message } = req.body;
  console.log("Callback Received:", req.body);

  if (status === 1) {
    const requestMapPath = './data/request.json';
    const usersPath = './data/users.json';

    let requestMap = JSON.parse(fs.readFileSync(requestMapPath, 'utf8'));
    const username = requestMap[request_id];

    if (!username) return res.send("❌ Không tìm thấy user từ request_id");

    let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    let userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.send("❌ User không tồn tại.");

    const xuNhan = parseInt(amount);
    users[userIndex].balance += xuNhan;
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    delete requestMap[request_id];
    fs.writeFileSync(requestMapPath, JSON.stringify(requestMap, null, 2));

    console.log(`✅ Cộng ${xuNhan} xu cho ${username}`);
  } else {
    console.log(`❌ Thẻ bị từ chối (${amount}đ): ${message}`);
  }

  res.status(200).send("OK");
});

>>>>>>> 26d76ba (Remove node_modules and update .gitignore)

});

// -------------------- ĐĂNG NHẬP --------------------
app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.send("❌ Sai tài khoản hoặc mật khẩu!");
  req.session.user = { ...user };
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// -------------------- DASHBOARD --------------------
app.get("/dashboard", requireLogin, (req, res) => {
  const accounts = JSON.parse(fs.readFileSync("./data/accounts.json", "utf8"));
  res.render("dashboard", { user: req.session.user, accounts });
});

// -------------------- SPIN (ĐÃ SỬA ĐÚNG) --------------------
app.get("/spin", requireLogin, (req, res) => {
  res.render("spin", { user: req.session.user });
});

app.post('/spin', (req, res) => {
  const username = req.session.user?.username;
  if (!username) return res.json({ error: 'Bạn chưa đăng nhập!' });

  const filePath = './data/users.json';
  if (!fs.existsSync(filePath)) return res.json({ error: 'Không tìm thấy dữ liệu người dùng.' });

  const users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const userIndex = users.findIndex(u => u.username === username);
  if (userIndex === -1) return res.json({ error: 'Không tìm thấy tài khoản!' });

  const user = users[userIndex];

  if (user.balance < 20000) {
    return res.json({ error: "Bạn không đủ Xu để quay!" });
  }

  const rewards = [5, 10, 15, 20, 25, 30, 50, 100, 200, 250];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  user.balance -= 20000;
  user.robux += reward;

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  req.session.user = {
    username: user.username,
    password: user.password,
    balance: user.balance,
    robux: user.robux
  };

  res.json({ success: true, reward });
});
// -------------------- RÚT ROBUX --------------------
app.get("/withdraw", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("withdraw", { user: req.session.user, message: null });
});

app.post("/withdraw", (req, res) => {
  const username = req.session.user?.username;
  const { amount, robloxId } = req.body;
  const robux = parseInt(amount);
  const filePath = "./data/users.json";

  if (!username || !robloxId || isNaN(robux)) {
    return res.render("withdraw", {
      user: req.session.user,
      message: "❌ Vui lòng nhập đầy đủ thông tin."
    });
  }

  const users = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const index = users.findIndex(u => u.username === username);
  if (index === -1) {
    return res.render("withdraw", {
      user: req.session.user,
      message: "❌ Không tìm thấy tài khoản."
    });
  }

  const user = users[index];

  if (user.robux < robux) {
    return res.render("withdraw", {
      user: req.session.user,
      message: "❌ Bạn không đủ Robux để rút."
    });
  }

  // Trừ robux
  user.robux -= robux;
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

  // Cập nhật session
  req.session.user = { ...user };

  // Gửi thông báo
  res.render("withdraw", {
    user: user,
    message: `✅ Đã ghi nhận rút ${robux} Robux cho ID ${robloxId}. Vui lòng đợi 120 giờ để nhận Robux.`
  });
});

// -------------------- CÁC ROUTE KHÁC --------------------


// Route hiển thị form nạp thẻ
app.get('/napthe', (req, res) => {
  const username = req.session.user?.username || 'guest';
  res.render('napthe', { username });
});

// Route xử lý gửi thẻ tới web trung gian
app.post("/napthe", async (req, res) => {
  const { loaithe, menhgia, mathe, seri } = req.body;

  const request_id = Date.now().toString();
  const username = req.session.user?.username || "guest";

const requestMapPath = './data/request.json';
let mapData = {};
if (fs.existsSync(requestMapPath)) {
  mapData = JSON.parse(fs.readFileSync(requestMapPath, "utf8"));
}
mapData[request_id] = username;
fs.writeFileSync(requestMapPath, JSON.stringify(mapData, null, 2));

  const partner_id = "17305102095";
  const partner_key = "637e2af464f3b59d6928828b665b4b67";

  const crypto = require("crypto");
  const sign = crypto
    .createHash("md5")
    .update(partner_id + mathe + seri + menhgia + partner_key)
    .digest("hex");

  try {
    const response = await axios.post("https://thesieure.com/chargingws/v2", {
      telco: loaithe,
      code: mathe,
      serial: seri,
      amount: menhgia,
      request_id,
      partner_id,
      sign,
      command: "charging",
 
     
      callback_url: "https://codecdvnrb.onrender.com/callback"
      
    });

    if (response.data.status === 1) {
      res.send("✅ Gửi thẻ thành công, vui lòng đợi duyệt...");
    } else {
      res.send("❌ Lỗi gửi thẻ: " + response.data.message);
    }
  } catch (err) {
    console.error(err.message);
    res.send("⚠️ Không thể kết nối đến máy chủ trung gian.");
  }
});


// Cấu hình view và static
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware đọc dữ liệu form và JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cấu hình session
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware yêu cầu đăng nhập
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// ========== ROUTE CALLBACK NẠP TỪ T3 ==========
app.post("/callback", (req, res) => {
  const { status, amount, request_id, message } = req.body;

  if (status === 1) {
    const requestMapPath = './data/request.json';
    const usersPath = './data/users.json';

    let requestMap = JSON.parse(fs.readFileSync(requestMapPath, 'utf8'));
    const username = requestMap[request_id];

    if (!username) return res.send("❌ Không tìm thấy user từ request_id");

    let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    let userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.send("❌ User không tồn tại.");

    const xuNhan = parseInt(amount);
    users[userIndex].balance += xuNhan;
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    delete requestMap[request_id];
    fs.writeFileSync(requestMapPath, JSON.stringify(requestMap, null, 2));

    console.log(`✅ Cộng ${xuNhan} xu cho ${username}`);
  } else {
    console.log(`❌ Thẻ bị từ chối (${amount}đ): ${message}`);
  }

  res.status(200).send("OK");
});


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



app.get("/history", (req, res) => {
  const fs = require("fs");
  const lichSuPath = "./data/lichsumua.json";
  let history = [];

  if (fs.existsSync(lichSuPath)) {
    history = JSON.parse(fs.readFileSync(lichSuPath, "utf8"));
  }

  // Lọc theo user nếu cần:
  // const user = req.session.user?.username;
  // history = history.filter(h => h.username === user);

  res.render("history", { history });
});


app.get("/shop", (req, res) => {
  const user = req.session.user || { username: "Khách", robux: 0 };
  res.render("shop", { user });
});

app.get('/topup', (req, res) => {
  const username = req.session.user?.username || 'guest';
  res.render('topup', { username });
});

app.post('/napthe/card', (req, res) => {
  const { loaithe, menhgia, mathe, seri } = req.body;
  console.log(`[NAP THE] ${loaithe} - ${menhgia} - ${mathe} - ${seri}`);
  res.render('card');
});
app.get('/profile', (req, res) => {
  const username = req.session.user?.username || 'guest';
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

app.get('/doimatkhau', (req, res) => {
  res.render('doimatkhau'); // render trang form
});

app.post('/doimatkhau', (req, res) => {
  const username = req.session.user?.username; // lấy user từ session
  const { oldPassword, newPassword } = req.body;

  if (!username) return res.send("❌ Bạn chưa đăng nhập.");

  const usersPath = './data/users.json';
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  let userIndex = users.findIndex(u => u.username === username && u.password === oldPassword);

  if (userIndex === -1) {
    return res.send("❌ Mật khẩu cũ không đúng.");
  }

  users[userIndex].password = newPassword;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  // Cập nhật lại session
  req.session.user.password = newPassword;

  res.send("✅ Đổi mật khẩu thành công!");
});


app.get("/lichsunap", (req, res) => {
  const fs = require("fs");
  const path = "./data/lichsunap.json";
  let nap = [];

  if (fs.existsSync(path)) {
    nap = JSON.parse(fs.readFileSync(path, "utf8"));
  }

  // Nếu muốn lọc theo user đang đăng nhập:
  // const user = req.session.user?.username;
  // nap  nap.filter(n => n.username  user);

  res.render("lichsunap", { nap });
});
// Route hiển thị trang admin
app.get('/admin', (req, res) => {
  const user = req.session.user;
  if (!user || user.username !== 'admin') return res.status(403).send("❌ Bạn không có quyền truy cập.");

  const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
  res.render('admin', { user, users });
});

// Route cộng xu / robux
app.post('/admin/update', (req, res) => {
  const { username, xu, robux } = req.body;
  const user = req.session.user;
  if (!user || user.username !== 'admin') return res.status(403).send("❌ Không có quyền");

  const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
  const index = users.findIndex(u => u.username === username);
  if (index === -1) return res.send("❌ User không tồn tại");

  if (xu) users[index].balance += parseInt(xu);
  if (robux) users[index].robux += parseInt(robux);

  fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
  res.redirect('/admin');
});

// Route xoá user
app.post('/admin/delete', (req, res) => {
  const { username } = req.body;
  const user = req.session.user;
  if (!user || user.username !== 'admin') return res.status(403).send("❌ Không có quyền");

  let users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
  users = users.filter(u => u.username !== username);
  fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
  res.redirect('/admin');
});
app.get('/', (req, res) => {
  res.redirect('/login');
});


// -------------------- CHẠY SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server đang chạy tại http://localhost:" + PORT);
});
