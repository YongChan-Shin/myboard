let router = require("express").Router();

const mongoclient = require("mongodb").MongoClient;
const ObjId = require("mongodb").ObjectId;

const url = process.env.DB_URL;
let mydb;
mongoclient
  .connect(url)
  .then((client) => {
    mydb = client.db("myboard");
    app.listen(process.env.PORT, () => {
      console.log("포트 3000으로 서버 대기 중");
    });
    console.log("몽고DB 접속 성공");
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/list", (req, res) => {
  mydb
    .collection("post")
    .find()
    .toArray()
    .then((result) => {
      console.log(result);
      res.render("list.ejs", { data: result });
    });
});

module.exports = router;