
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://<username>:<password>@cluster.mongodb.net/<dbname>';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log(users.map(u => u.email));
  process.exit(0);
}).catch(console.error);
