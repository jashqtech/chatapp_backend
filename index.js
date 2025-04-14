const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 4000;

const userSocketMap = {};
const GROUP_NAME = "Garba Ghela";

app.get("/", (req, res) => {
  res.send("Socket.IO Server is running");
});

const getOnlineUsers = () => {
  return Object.keys(userSocketMap).reduce((acc, username) => {
    acc[username] = true;
    return acc;
  }, {});
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (username) => {
    userSocketMap[username] = socket.id;
    socket.username = username;
    socket.join(GROUP_NAME);
    io.emit("user_online_status", getOnlineUsers());
  });

  socket.on("private_message", ({ sender, receiver, message, timestamp }) => {
    if (receiver === "group") {
      io.to(GROUP_NAME).emit("group_message", { sender, message, timestamp });
    } else {
      const receiverSocket = userSocketMap[receiver];
      if (receiverSocket) {
        io.to(receiverSocket).emit("private_message", { sender, receiver, message, timestamp });
      } else {
        io.to(socket.id).emit("error_message", { error: "User is offline." });
      }
    }
  });

  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = userSocketMap[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { sender, receiver });
    }
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      delete userSocketMap[socket.username];
      io.emit("user_online_status", getOnlineUsers());
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('hi')
});
