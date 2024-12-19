const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
require("dotenv").config()

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

// Function to upload a file to S3
const uploadFile = async () => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: "example2.txt", // File name in S3
    Body: "Hello, world!", // File content
  }

  try {
    const command = new PutObjectCommand(params)
    const result = await s3Client.send(command)
    console.log("File uploaded successfully:", result)
  } catch (error) {
    console.error("Error uploading file:", error)
  }
}

uploadFile()