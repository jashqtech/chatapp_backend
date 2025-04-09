const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(process.env.PORT || 4000, {
  cors: { origin: "*" }
});

  
  const userSocketMap = {};
  
  const getOnlineUsers = () => {
    return Object.keys(userSocketMap).reduce((acc, username) => {
      acc[username] = true;
      return acc;
    }, {});
  };
  
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
  
    socket.on("register", (username) => {
      userSocketMap[username] = socket.id;
      socket.username = username;
      console.log(`${username} registered with socket ${socket.id}`);
      io.emit("user_online_status", getOnlineUsers()); // broadcast status
    });
  
    socket.on("private_message", (data) => {
      const { sender, receiver, message } = data;
      const receiverSocket = userSocketMap[receiver];
      if (receiverSocket) {
        io.to(receiverSocket).emit("private_message", data);
      } else {
        io.to(socket.id).emit("error_message", { error: "User is offline." });
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
