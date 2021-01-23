var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

var usersOnline = [];

io.on("connection", function (socket) {
  io.emit("updateUsers", usersOnline);
  socket.on("leave", function (user) {
    const id = socket.id;
    const idx = usersOnline.findIndex((usr) => usr.id === id);
    if (idx >= 0) {
      usersOnline.splice(idx, 1);
      socket.to("chat").emit("stopped", user);
      socket.broadcast.emit("chat message", {
        msg: `User ${user} disconnected`,
      });
      socket.broadcast.emit("updateUsers", usersOnline);
    }
  });
  socket.on("user connected", function (user) {
    const id = socket.id;
    socket.join("chat");
    usersOnline.push({ id, user });
    socket.broadcast.emit("chat message", {
      msg: `User ${user} connected`,
    });
    socket.broadcast.emit("updateUsers", usersOnline);
  });
  socket.on("chat message", function ({ user, msg }) {
    console.log("message: " + msg);
    socket.to("chat").emit("chat message", { user, msg });
  });
  socket.on("writing", function (user) {
    socket.to("chat").emit("writing", user);
  });
  socket.on("stopped", function (user) {
    socket.to("chat").emit("stopped", user);
  });
  socket.on("sendPM", function ({ user, target, msg }) {
    socket.to(target).emit("receivePM", { user, msg });
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
