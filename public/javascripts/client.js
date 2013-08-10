(function() {
  $(document).ready(function() {
    $("ul.row li").click(function(event) {
      socket.emit("toggle", $(this).data("key"));
      return $(this).toggleClass("active");
    });
    socket.on("assignSocketId", function(data) {
      return socket.assignedId = data;
    });
    return socket.on("deleteKitSocket", function() {
      return $("ul.row li").removeClass("active");
    });
  });

}).call(this);
