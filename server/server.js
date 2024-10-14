const express = require("express");
const app = express();
const sha = require('sha256');

// body-parser 라이브러리 추가
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// 정적 파일 라이브러리 추가
app.use(express.static("public"));

let cookieParser = require("cookie-parser");
app.use(cookieParser("ncvka0e398423kpfd"));

let session = require("express-session");
app.use(
  session({
    secret: "dkufe8938493j408349u",
    resave: false,
    saveUnintialized: true,
  })
);

app.get("/session", (req, res) => {
  if (isNaN(req.session.milk)) {
    req.session.milk = 0;
  }
  req.session.milk = req.session.milk + 1000;
  res.send("session : " + req.session.milk + "원");
});

app.get("/cookie", function (req, res) {
  let milk = parseInt(req.signedCookies.milk) + 1000;
  if (isNaN(milk)) {
    milk = 0;
  }
  res.cookie("milk", milk, { signed: true });
  res.send("product : " + milk + "원");
});

const mongoclient = require("mongodb").MongoClient;
const ObjId = require("mongodb").ObjectId;

const url = "mongodb+srv://shongtruth:dydcks33!@cluster0.fe7n7.mongodb.net/";
let mydb;
mongoclient
  .connect(url)
  .then((client) => {
    mydb = client.db("myboard");
    app.listen(3000, () => {
      console.log("포트 3000으로 서버 대기 중");
    });
    console.log("몽고DB 접속 성공");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.render("index.ejs", { user: null });
});

app.get("/list", (req, res) => {
  mydb
    .collection("post")
    .find()
    .toArray()
    .then((result) => {
      console.log(result);
      res.render("list.ejs", { data: result });
    });
});

app.get("/enter", (req, res) => {
  res.render("enter.ejs");
});

app.post("/save", (req, res) => {
  console.log(req.body.title);
  console.log(req.body.content);
  console.log(req.body.someDate);
  mydb
    .collection("post")
    .insertOne({
      title: req.body.title,
      content: req.body.content,
      date: req.body.someDate,
    })
    .then((result) => {
      console.log(result);
      console.log("데이터 추가 성공!");
    });
  res.redirect("/list");
});

app.post("/delete", function (req, res) {
  console.log(req.body._id);
  req.body._id = new ObjId(req.body._id);
  mydb
    .collection("post")
    .deleteOne(req.body)
    .then((result) => {
      console.log(req.body);
      console.log(result);
      console.log("삭제완료");
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send();
    });
});

app.get("/content/:id", (req, res) => {
  req.params.id = new ObjId(req.params.id);
  console.log(req.params.id);
  mydb
    .collection("post")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("content.ejs", { data: result });
    });
});

app.get("/edit/:id", (req, res) => {
  req.params.id = new ObjId(req.params.id);
  mydb
    .collection("post")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("edit.ejs", { data: result });
    });
});

app.post("/edit/:id", (req, res) => {
  console.log(req.body);
  req.body.id = new ObjId(req.params.id);
  mydb
    .collection("post")
    .updateOne(
      { _id: req.body.id },
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          date: req.body.someDate,
        },
      }
    )
    .then((result) => {
      console.log("수정완료");
      res.redirect("/list");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/login", (req, res) => {
  console.log(req.session);
  if (req.session.user) {
    console.log("세션 유지");
    res.render("index.ejs", { user: req.session.user });
  } else {
    res.render("login.ejs");
  }
});

app.post("/login", (req, res) => {
  console.log("아이디 : " + req.body.userid);
  console.log("비밀번호 : " + req.body.userpw);

  mydb
    .collection("account")
    .findOne({ userid: req.body.userid })
    .then((result) => {
      if (result.userpw === sha(req.body.userpw)) {
        req.session.user = req.body;
        console.log("새로운 로그인");
        res.render("index.ejs", { user: req.session.user });
      } else {
        res.render("login.ejs");
      }
    })
    .catch((err) => {
      res.send("사용자 정보를 확인할 수 없습니다. 아이디를 확인해주세요.");
    });
});

app.get("/logout", (req, res) => {
  console.log("로그아웃");
  req.session.destroy();
  res.render("index.ejs", { user: null });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", (req, res) => {
  console.log(req.body.userid);
  console.log(sha(req.body.userpw));
  console.log(req.body.usergroup);
  console.log(req.body.useremail);

  mydb
    .collection("account")
    .insertOne({
      userid: req.body.userid,
      userpw: sha(req.body.userpw),
      usergroup: req.body.usergroup,
      useremail: req.body.useremail,
    })
    .then((result) => {
      console.log("회원가입 성공");
    });
  res.redirect("/");
});
