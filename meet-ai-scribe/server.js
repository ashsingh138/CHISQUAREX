const express = require("express");
const cors = require("cors");
require("dotenv").config();

const botRoutes = require("./routes/botRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/bot", botRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});