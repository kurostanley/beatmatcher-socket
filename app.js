const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: "https://beatmatcher-production.up.railway.app/",
methods: ["GET", "POST"]
}));

const http = require("http").createServer(app);
const io = require("socket.io")(http, {cors:{ origin: '*' }});

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', 'https://beatmatcher-production.up.railway.app/'); // * allows all, or you can limit by domain
//     res.setHeader('Access-Control-Allow-Methods', '*'); // Set which header methods you want to allow (GET,POST,PUT,DELETE,OPTIONS)
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // These 2 are recommended
//     res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie'); // Required to allow the returned cookie to be set
// 	res.setHeader('Access-Control-Allow-Credentials', 'true'); // Required to allow auth credentials
//     next();
// });



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