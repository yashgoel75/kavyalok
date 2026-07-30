const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in environment variables.");
  process.exit(1);
}

const PostSchema = new mongoose.Schema(
  {
    sortByTime: { type: Date },
    createdAt: { type: Date },
  },
  { timestamps: true, strict: false }
);

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

async function backfillSortByTime() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully to MongoDB.");

    const result = await Post.updateMany(
      {
        $or: [
          { sortByTime: { $exists: false } },
          { sortByTime: null }
        ]
      },
      [
        {
          $set: {
            sortByTime: { $ifNull: ["$createdAt", new Date()] }
          }
        }
      ]
    );

    console.log(`Backfill complete! Updated ${result.modifiedCount} posts with sortByTime = createdAt.`);
  } catch (error) {
    console.error("Error running backfill script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

backfillSortByTime();
