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

const PostSchema = new mongoose.Schema(
  {
    title: String,
    sortByTime: Date,
    createdAt: Date,
    repostCount: Number,
    isRepost: Boolean,
  },
  { timestamps: true }
);

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB.");

    // First: Perform explicit backfill for all existing posts that don't have sortByTime
    const updateResult = await Post.updateMany(
      { $or: [{ sortByTime: { $exists: false } }, { sortByTime: null }] },
      [{ $set: { sortByTime: { $ifNull: ["$createdAt", "$updatedAt"] } } }]
    );
    console.log("Update result modifiedCount:", updateResult.modifiedCount);

    const posts = await Post.find({ isRepost: { $ne: true } })
      .sort({ sortByTime: -1, createdAt: -1 })
      .limit(10)
      .select("title sortByTime createdAt repostCount")
      .lean();

    console.log("Top 10 posts sorted by sortByTime -1:");
    posts.forEach((p, i) => {
      console.log(`${i + 1}. Title: "${p.title}" | sortByTime: ${p.sortByTime} | createdAt: ${p.createdAt} | reposts: ${p.repostCount || 0}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
