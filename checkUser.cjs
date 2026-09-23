
const mongoose = require('mongoose');
const uri = 'mongodb://servyyai_db_user:uiEjLg7nuATqmlXA@ac-xm1jfy1-shard-00-00.18tkgpv.mongodb.net:27017,ac-xm1jfy1-shard-00-01.18tkgpv.mongodb.net:27017,ac-xm1jfy1-shard-00-02.18tkgpv.mongodb.net:27017/?ssl=true&replicaSet=atlas-srqr7z-shard-0&authSource=admin&appName=Cluster0';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log(users.map(u => u.email));
  process.exit(0);
}).catch(console.error);
