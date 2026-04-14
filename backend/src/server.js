import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config();

const port = Number(process.env.PORT) || 5000;
const app = createApp();

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
