const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
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

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found");
  process.exit(1);
}

const PostSchema = new mongoose.Schema(
  {
    title: String,
    sortByTime: Date,
    createdAt: Date,
    updatedAt: Date,
    repostCount: Number,
    isRepost: Boolean,
  },
  { timestamps: true, strict: false }
);

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB.");

    // Update all posts where sortByTime is missing or null
    const updateResult = await Post.updateMany(
      { $or: [{ sortByTime: { $exists: false } }, { sortByTime: null }] },
      [{ $set: { sortByTime: { $ifNull: ["$createdAt", new Date()] } } }]
    );
    console.log("Backfill updateResult modifiedCount:", updateResult.modifiedCount);

    const posts = await Post.find({ isRepost: { $ne: true } })
      .sort({ sortByTime: -1 })
      .limit(10)
      .select("title sortByTime createdAt updatedAt repostCount")
      .lean();

    console.log(`Top ${posts.length} posts sorted by sortByTime -1:`);
    posts.forEach((p, i) => {
      console.log(`${i + 1}. Title: "${p.title}" | sortByTime: ${p.sortByTime?.toISOString()} | createdAt: ${p.createdAt?.toISOString()} | reposts: ${p.repostCount || 0}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
