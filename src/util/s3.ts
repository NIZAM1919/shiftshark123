import AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3Bucket = new AWS.S3({ params: { Bucket: process.env.BUCKET_NAME } });

function guidGenerator() {
  const S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

export const uploadToS3Bucket = async (
  imageBinary: string,
  folderName: string,
): Promise<string> => {
  const type = imageBinary.split(';')[0].split('/')[1];
  const base64Data =
    type === 'pdf'
      ? Buffer.from(imageBinary.replace(/^data:application\/\w+;base64,/, ''), 'base64')
      : Buffer.from(imageBinary.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const path = `${folderName}/`;
  const fileName = guidGenerator(); // Assuming guidGenerator is a defined function
  const fullKey = `${path}${fileName}.${type}`;
  const contentType = ['jpeg', 'png'].includes(type)
    ? `image/${type}`
    : `application/${type}`;
  const data: PutObjectRequest = {
    Key: fullKey,
    Body: base64Data,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: contentType,
    Bucket: process.env.BUCKET_NAME,
  };
  try {
    await s3Bucket.putObject(data).promise();
    return `${process.env.BUCKET_URL}/${fullKey}`;
  } catch (error) {
    // Handle error appropriately
    console.error('Error uploading to S3:', error);
    throw error;
  }
};
