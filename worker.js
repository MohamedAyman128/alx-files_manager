
import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import fileUtils from './utils/file';
import userUtils from './utils/user';
import basicUtils from './utils/basic';

const imageThumbnail = require('image-thumbnail');

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  // Delete bull keys in redis
  //   redis-cli keys "bull*" | xargs redis-cli del

  if (!userId) {
    console.log('Missing userId');
    throw new Error('Missing userId');
  }

  if (!fileId) {
    console.log('Missing fileId');
    throw new Error('Missing fileId');
  }

  if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) throw new Error('File not found');

  const file = await fileUtils.getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  const { localPath } = file;
  const options = {};
  const widths = [500, 250, 100];

  widths.forEach(async (width) => {
    options.width = width;
    try {
      const thumbnail = await imageThumbnail(localPath, options);
      await fsPromises.writeFile(`${localPath}_${width}`, thumbnail);
      //   console.log(thumbnail);
    } catch (err) {
      console.error(err.message);
    }
  });
});

userQueue.process(async (job) => {
  const { userId } = job.data;
  // Delete bull keys in redis
  //   redis-cli keys "bull*" | xargs redis-cli del

  if (!userId) {
    console.log('Missing userId');
    throw new Error('Missing userId');
  }

  if (!basicUtils.isValidId(userId)) throw new Error('User not found');

  const user = await userUtils.getUser({
    _id: ObjectId(userId),
  });

  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});
/* eslint no-console: off */
import Queue from 'bull';
import { ObjectId } from 'mongodb';
import generateThumbnail from './utils/thumbnails';
import UsersCollection from './utils/users';
import FilesCollection from './utils/files';

fileQueue = Queue('thumbnail generation');
userQueue = Queue('send welcome email');

// Thumbnail jobs consumer
fileQueue.process(10, async (job) => {
  const { fileId, userId } = job.data;
  // job essential properties validation
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  // file id and user id conversion to ObjectId before querying db
  const _id = ObjectId.isValid(fileId) ? new ObjectId(fileId) : fileId;
  const _userId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
  const file = await FilesCollection.getFile({ _id, userId: _userId });
  const { localPath } = file;

  // Check if file exists in db
  if (!file) throw new Error('File not found');

  // Create thumbnails and store them in local storage
  await generateThumbnail(localPath);

  return Promise.resolve(`Thumbnails for ${file.name} created successfully.`);
});

fileQueue.on('completed', (job, result) => {
  console.log(`Thumbnail generation job #${job.id} completed: ${result}`);
});

// Email jobs consumer
userQueue.process(20, async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');
  const _id = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
  const user = await UsersCollection.getUser({ _id });
  if (!user) throw new Error('User not found');
  return Promise.resolve(`Welcome ${user.email}`);
});

userQueue.on('completed', (_job, result) => {
  console.log(result);
});

