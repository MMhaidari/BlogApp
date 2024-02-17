import * as dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose';
import app from './server'

const DB = process.env.DATABASE;
const port = 3000;

mongoose.connect(DB).then(() => {
  app.listen(port, () => {
    console.log(`Application is runnning on http://localhost:${port}`)
  });
}).catch((error) => {
  console.log(error)
});

