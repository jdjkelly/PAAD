(function() {
  $(document).ready(function() {
    $("ul.row li").click(function(event) {
      socket.emit("toggle", $(this).data("key"));
      return $(this).toggleClass("active");
    });
    socket.on("assignSocketId", function(data) {
      return socket.assignedId = data;
    });
    socket.on("deleteKitSocket", function() {
      return $("ul.row li").removeClass("active");
    });
    return socket.on("activeNote", function(data) {
      $(".playing").removeClass("playing");
      return $(".k" + data).addClass("playing");
    });
  });

}).call(this);
