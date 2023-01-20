const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: '*' }));

const http = require("http").createServer(app);
const io = require("socket.io")(http, {cors:{ origin: '*' }});


const port = process.env.PORT || 3000;
http.listen(port, ()=>{
	console.log("Listning to port " + port);
});



var users =[];

const addUser = (userId, socketId) => {
  !users.some(user => user.userId === userId) && 
    users.push({userId, socketId})
}

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
}

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.sockets.on('connection', function (socket) {
  console.log("a user connected.")
   
  // take userId and sock.id from user
  socket.on('addUser', (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  })

  //send and get message
  socket.on("sendMessage", ({ senderId, senderName, receiverId, text, receiverAvatar }) => {
    const user = getUser(receiverId);
    if(user){
      io.to(user.socketId).emit("getMessage", {
        senderId,
        senderName,
        receiverId,
        text,
        receiverAvatar
      });
      console.log("message send")
    }
  });

  //get new like from someone
  socket.on("match", ({ senderId, senderName, senderAvatar, receiverId, receiverName }) => {
    const user = getUser(receiverId);
    if(user){
      io.to(user.socketId).emit("getMatch", {
        senderId,
        senderName,
        senderAvatar,
        receiverId,
        receiverName
      });
    }
  });


  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
})