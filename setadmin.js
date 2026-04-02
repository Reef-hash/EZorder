import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'riffsyaz@gmail.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Modified:', result.modifiedCount);
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
