

const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

//!----------- Middleware----------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://blood-donation-69994.web.app",
      "https://blood-donation-69994.firebaseapp.com",
    ],
    credentials: true,
  }),
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qq6y6.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect once; routes await this instead of living inside it
let clientPromise = client.connect();

const getCollections = async () => {
  await clientPromise;
  return {
    userCollection: client.db("BloodDB").collection("users"),
    recipientCollection: client.db("BloodDB").collection("recipient"),
    donorCollection: client.db("BloodDB").collection("donor"),
    blogCollection: client.db("BloodDB").collection("blog"),
    donorsCollection: client.db("BloodDB").collection("donors"),
  };
};

//? --------------JWT---------------
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "5h",
  });
  res.send({ token });
});

// ---middleware---------
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// !----------------------------Blog----------------------------------
app.post("/blog", async (req, res) => {
  const { blogCollection } = await getCollections();
  const blog = req.body;
  const result = await blogCollection.insertOne(blog);
  res.send(result);
});
// all-get-admin
app.get("/blog", async (req, res) => {
  const { blogCollection } = await getCollections();
  const result = await blogCollection.find().toArray();
  res.send(result);
});
// all-get-volunteer
app.get("/blogs", async (req, res) => {
  const { blogCollection } = await getCollections();
  const result = await blogCollection.find().toArray();
  res.send(result);
});
// ----public-get
app.get("/AllBlog", async (req, res) => {
  const { blogCollection } = await getCollections();
  const result = await blogCollection.find().toArray();
  res.send(result);
});

//!----------------------------Users-AUTH----------------------------------
app.post("/users", async (req, res) => {
  const { userCollection } = await getCollections();
  const user = req.body;
  const result = await userCollection.insertOne(user);
  res.send(result);
});
app.get("/users", verifyToken, async (req, res) => {
  const { userCollection } = await getCollections();
  const result = await userCollection.find().toArray();
  res.send(result);
});
// !MAKE-ADMIN--------****
app.get("/users/admin/:email", verifyToken, async (req, res) => {
  const email = req.params.email;

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const { userCollection } = await getCollections();
  const query = { email: email };
  const user = await userCollection.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === "admin";
  }
  res.send({ admin });
});
app.get("/user/Block", async (req, res) => {
  const { userCollection } = await getCollections();
  const result = await userCollection.find().toArray();
  res.send(result);
});
// ---------admin-role----------
app.patch("/users/admin/:id", async (req, res) => {
  const { userCollection } = await getCollections();
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
});
// user-profile
app.patch("/users/profile/:email", async (req, res) => {
  const { userCollection } = await getCollections();
  const email = req.params.email;
  const Data = req.body;
  const filter = { email: email };
  const updatedDoc = {
    $set: {
      name: Data.name,
      image: Data.image,
      bloodGroup: Data.bloodGroup,
      district: Data.district,
      upazila: Data.upazila,
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
});
// !---make-Volunteer-----***
app.get("/users/volunteer/:email", verifyToken, async (req, res) => {
  const email = req.params.email;

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const { userCollection } = await getCollections();
  const query = { email: email };
  const user = await userCollection.findOne(query);
  let volunteer = false;
  if (user) {
    volunteer = user?.role === "volunteer";
  }
  res.send({ volunteer });
});
// -------------------
app.patch("/users/volunteer/:id", async (req, res) => {
  const { userCollection } = await getCollections();
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: "volunteer",
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
});

// !------------------------------Recipient-NEED-BLOOD--------------------------
app.post("/recipient", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const recipientUser = req.body;
  const result = await recipientCollection.insertOne(recipientUser);
  res.send(result);
});
//------- limit----
app.get("/myDonor", async (req, res) => {
  const { donorCollection } = await getCollections();
  const email = req.query.email;

  const result = await donorCollection
    .find({ donorEmail: email })
    .sort({ date: -1 })
    .toArray();

  res.send(result);
});
app.get("/MyDonations", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const email = req.query.email;
  const query = { email: email };
  const cursor = recipientCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});
// get-all-admin
app.get("/DonationRequrestAdmin", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const result = await recipientCollection.find().toArray();
  res.send(result);
});
// get-all-VolunteerRequest
app.get("/DonationVolunteerRequest", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const result = await recipientCollection.find().toArray();
  res.send(result);
});
// all-get
app.get("/DonationRequrest", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const result = await recipientCollection.find().toArray();
  res.send(result);
});
app.get("/DonationRequrests", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const result = await recipientCollection.find().toArray();
  res.send(result);
});

//  ----------------------Delete Item---------------------
//  --my-donation-delete---
app.get("/donationDelete", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const cursor = recipientCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});
app.delete("/donationDelete/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await recipientCollection.deleteOne(query);
  res.send(result);
});
// -----admin-delete-----
app.get("/donationDeletee", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const cursor = recipientCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});
app.delete("/donationDeletee/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await recipientCollection.deleteOne(query);
  res.send(result);
});
// blog-delete
app.delete("/blogs/:id", async (req, res) => {
  const { blogCollection } = await getCollections();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await blogCollection.deleteOne(query);
  res.send(result);
});

// ----------------------Update Item----------------------------
app.get("/DonationUp/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await recipientCollection.findOne(query);
  res.send(result);
});
//  ----------------------Update Donation Status----------------------------
app.put("/DonationUp/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedDoc = {
    $set: req.body,
  };

  const result = await recipientCollection.updateOne(
    filter,
    updatedDoc,
    options,
  );

  res.send(result);
});
//  update-Status---------------------
app.put("/DonationUpStatus/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedDoc = {
    $set: { status: "inprogress" },
  };

  const result = await recipientCollection.updateOne(
    filter,
    updatedDoc,
    options,
  );

  res.send(result);
});
// ----------------------Update Donation Status----------------------------
app.put("/upDonationStatus/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const { status } = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = { $set: { status } };
  const result = await recipientCollection.updateOne(filter, updatedDoc);
  res.send(result);
});
// admin-update-Status---------------------
app.put("/upDonationStatuss/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const { status } = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = { $set: { status } };
  const result = await recipientCollection.updateOne(filter, updatedDoc);
  res.send(result);
});
// blog-update-status
app.put("/blogStatus/:id", async (req, res) => {
  const { blogCollection } = await getCollections();
  const id = req.params.id;
  const { status } = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = { $set: { status } };
  const result = await blogCollection.updateOne(filter, updatedDoc);
  res.send(result);
});
// user-blog-and-unblock
app.put("/userStatus/:id", async (req, res) => {
  const { userCollection } = await getCollections();
  const id = req.params.id;
  const { status } = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = { $set: { status } };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
});

// ----------------------------------------Details---------------------------------------
//--recipient-details---
app.get("/details/:id", async (req, res) => {
  const { recipientCollection } = await getCollections();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await recipientCollection.findOne(query);
  res.send(result);
});
// blog-details
app.get("/seeMore/:id", async (req, res) => {
  const { blogCollection } = await getCollections();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await blogCollection.findOne(query);
  res.send(result);
});

// !--------------------------Donor------------------------------------
app.post("/donor", async (req, res) => {
  const { donorCollection } = await getCollections();
  const user = req.body;
  const result = await donorCollection.insertOne(user);
  res.send(result);
});
// all-get
app.get("/donor", async (req, res) => {
  const { donorCollection } = await getCollections();
  const result = await donorCollection.find().toArray();
  res.send(result);
});
//! ----------------------All Donar----------------------------
app.post("/donors", async (req, res) => {
  const { donorsCollection } = await getCollections();
  const user = req.body;
  const result = await donorsCollection.insertOne(user);
  res.send(result);
});

// !----------------------------------Search Donors--------------------------------
app.get("/searchDonor", async (req, res) => {
  const { donorsCollection } = await getCollections();
  const { district, upazila, bloodGroup } = req.query;
  const query = {};

  if (district)
    query.district = { $regex: new RegExp(district.trim(), "i") };
  if (upazila) query.upazila = { $regex: new RegExp(upazila.trim(), "i") };
  if (bloodGroup)
    query.bloodGroup = { $regex: new RegExp(bloodGroup.trim(), "i") };

  const donors = await donorsCollection.find(query).toArray();
  res.json(donors);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;