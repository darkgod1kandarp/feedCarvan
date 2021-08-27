const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
const app = express();
const mysql = require("mysql2");
const distance = require("google-distance-matrix");
distance.key("AIzaSyCejofxtxXDqgb1_xYwkgZy06mF-VNa15Q");
const { v4: uuidv4 } = require("uuid");

app.use(cors());
// let bodyParser = require('body-parser');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
var mailjet = require("node-mailjet").connect(
  "7a92a782bec6c95b4938cffe0dcafbc7",
  "8834329e09ddf2c22105a769843ab089"
);

const otp = () => {
  let data = "";
  for (let x = 0; x < 4; x++) {
    data += `${Math.floor(Math.random() * 10)}`;
  }
  return data;
};

var fileupload = require("express-fileupload");
app.use(express.static("tmp"));

app.use(
  fileupload({
    useTempFiles: true,
  })
);

const Port = process.env.PORT || 6000;
const server = app.listen(Port, () =>
  console.log("Server started on port 6000")
);

var cloudinary = require("cloudinary").v2;
const Address = require("ipaddr.js");
const { language } = require("google-distance-matrix");
cloudinary.config({
  cloud_name: "ur-cirkle",
  api_key: "858755792955291",
  api_secret: "7Tin6b3Em8ThMYGHLWvyNBPzXRk",
});

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const pool = mysql.createPool({
  host: "163.123.183.88",
  database: "kandarp",
  user: "admin",
  password: "2OtCm0bY",
  port: "17387",
});

const db = pool.promise();

app.get("/jwttoken", (req, res) => {
  // Mock user

  jwt.sign({}, "secretkey", (err, token) => {
    res.json({
      token,
    });
  });
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const uuid1 = makeid(11);
  let sql = `  select checking1('${uuid1}','${username}','${email}','${password}') as c1;`;

  const [row1] = await db.query(sql);

  if (row1[0].c1 === 1) {
    res.json({ message: "alva" });
  } else {
    res.json({ message: "nalva", data: `${uuid1}` });
  }
});
let id;

app.post("/userprofile", async (req, res) => {
  const { userid } = req.body;
  let sql = `select username,email,type_account,university_name,location from userinfo,user_account_details where userinfo.userid1 = '${userid}' and user_account_details.userid1='${userid}'  ;`;
  console.log(sql);
  const [row1, column1] = await db.query(sql);
  console.log(row1);
  return res.send(row1);
});
// toshi@explified.com
//kushal@explified.com
app.post("/profile", async (req, res) => {
  const { userid, typeofaccount, location, collegeName, userimage } = req.body;
  let sql;

  cloudinary.uploader.upload(userimage, async (err, result) => {
    if (err) return err;
    sql = `insert into user_account_details value('${userid}','${typeofaccount}','${location}','${collegeName}','${result.url}');`;
    await db.query(sql);
  });

  if (typeofaccount === "student") {
    const { startYear, lastYear, skills_already, skills_demanded } = req.body;
    sql = `insert into student_account values('${userid}','${startYear}','${lastYear}');`;
    await db.query(sql);
    sql = `insert into skills_already_have values `;
    var x;
    d = [];
    for (x of skills_already) {
      d.push(`('${userid}','${x}')`);
    }
    sql += d.join(",");

    await db.query(sql);
    sql = `insert into skills_demand values `;
    var x;
    d = [];
    for (x of skills_demanded) {
      d.push(`('${userid}','${x}')`);
    }
    sql += d.join(",");
    await db.query(sql);
  } else if (typeofaccount === "subjme") {
    const { subject, experience, coursetosell, jobrequired } = req.body;
    sql = `insert into student_account values('${userid}','0','${experience}');`;
    await db.query(sql);
    sql = `insert into skills_already_have values `;
    var x;
    d = [];
    for (x of subject) {
      d.push(`('${userid}','${x}')`);
    }
    sql += d.join(",");
    await db.query(sql);
    sql = `insert into skills_demand values `;
    var x;
    d = [];
    for (x of coursetosell) {
      d.push(`('${userid}','${x}')`);
    }
    sql += d.join(",");

    await db.query(sql);
    d = [];
    sql = `insert into jobs_required values `;
    for (x of jobrequired) {
      d.push(`('${userid}','${x}')`);
    }
    sql += d.join(",");

    await db.query(sql);
  } else {
    const { jobInstance } = req.body;
    sql = `insert into jobs values`;
    d = [];
    sql = `insert into jobs_taken_account values `;
    const uuid2 = makeid(11);
    console.log(uuid2, 123);
    for (x of jobInstance) {
      d.push(
        `('${userid}','${x.uuid1}','${x.job}','${x.startSalary}','${x.endSalary}')`
      );
    }

    sql += d.join(",");
    sql = `insert into jobs_language values `;
    d = [];
    let p;
    for (x of jobInstance) {
      for (p of x.language) {
        d.push(`('${x.uuid1}','${p}')`);
      }
    }
    sql += d.join(",");
    console.log(sql);
    await db.query(sql);
  }
  return res.send({ data: "send" });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  let sql = `select count(*) as c1 from userinfo where email = '${email}' and password = '${password}';`;
  console.log(sql);
  const [row1, column1] = await db.query(sql);
  console.log(row1[0].c1);
  if (row1[0].c1 === 0) {
    res.json({ message: "nuf" });
  } else {
    res.json({
      message: "uf",
    });
  }
});

app.post("/home", async (req, res) => {
  const { userid } = req.body;
  let sql = `select * from connection_people where (connector = '${userid}' or connecting = '${userid}') and sided = 1;`;

  const [counting, column1] = await db.query(sql);
  const flipFlop = [];
  if (counting.length !== 0) {
    
    for (let x of counting) {
      if (x.connector !== userid) {
        flipFlop.push(x.connector);
      }
      if (x.connecting !== userid) {
        flipFlop.push(x.connecting);
      }
    }
    console.log(flipFlop);
    sql = `select * from post,userinfo where post.userid1=userinfo.userid1 and post.userid1 in (?) order by timing`
    const[row2,column2] =  await db.query(sql,[flipFlop]);
    res.send({"data":row2});
    
  }

  res.send({data:"ddnjf"})


});

app.post("/checking", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      //  console.log(err)
      res.json({ message: "not verified" });
    } else {
      res.json({ message: "verified" });
    }
  });
});

app.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;
  let sql = `select count(*) as c1 from userinfo where email = '${email}';`;
  const [row1, column1] = await db.query(sql);
  if (row1[0].c1 == 1) {
    const opo = otp();
    mailjet
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: "rushabh.s1@ahduni.edu.in",
              Name: "carvan",
            },
            To: [
              {
                Email: email,
              },
            ],
            Subject: "OTP123",
            TextPart: `your otp is ${opo}`,
          },
        ],
      })
      .then((result) => {
        res.json({ data: opo });
      })
      .catch((err) => {
        res.json({ data: "uu" });
      });
  } else {
    res.json({ data: "no userfound od this type" });
  }
});

app.post("/changepassword", async (req, res) => {
  const { email, password } = req.body;
  let sql = `update userinfo set password ='${password}' where email = '${email}';`;
  await db.query(sql);
  res.send({ message: "updated" });
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");

    const bearerToken = bearer[1];

    req.token = bearerToken;

    next();
  } else {
    // Forbidden
    res.sendStatus(403);
  }
}
