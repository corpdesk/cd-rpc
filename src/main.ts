import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "cd-rpc runtime online",
  });
});

const PORT = process.env.PORT || 4010;

app.listen(PORT, () => {
  console.log(`[cd-rpc] running on port ${PORT}`);
});
