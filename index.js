const express = require("express");
const Redis = require("ioredis");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(cors());
const client = new Redis({
  port: 12429, // Replace with your port
  host: "redis-15589.c10.us-east-1-4.ec2.redns.redis-cloud.com:15589", // Replace with your host
  username: "default", // Replace with your username if needed
  password: "FDU4ID8YPkuz7RDDjSNcol8wTheDZ8ei", // Replace with your password
});

client.on("connect", () => {
  console.log("Connected to Redis");
  initializeTasks();
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

// Function to initialize tasks
function initializeTasks() {
  const defaultTasks = [
    { title: "Task 1", description: "Description 1" },
    { title: "Task 2", description: "Description 2" },
  ];

  defaultTasks.forEach((task) => {
    client.rpush("tasks", JSON.stringify(task));
  });

  console.log("Initialized default tasks");
}

app.get("/tasks", async (req, res) => {
  const tasks = await client.lrange("tasks", 0, -1);
  res.json(tasks.map(JSON.parse));
});

app.post("/tasks", async (req, res) => {
  const task = req.body;
  await client.rpush("tasks", JSON.stringify(task));
  res.status(201).send("Task added.");
});

app.put("/tasks/:index", async (req, res) => {
  const index = req.params.index;
  const task = req.body;
  await client.lset("tasks", index, JSON.stringify(task));
  res.send("Task updated.");
});

app.delete("/tasks/:index", async (req, res) => {
  const index = req.params.index;
  // Redis לא תומך במחיקה ישירה של אלמנט באמצע הרשימה, כך שנצטרך להשתמש בטריק
  await client.lset("tasks", index, "TO_DELETE"); // סימון המשימה למחיקה
  await client.lrem("tasks", 1, "TO_DELETE"); // מחיקת המשימה
  res.send("Task deleted.");
});

const port = 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
