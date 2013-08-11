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
    socket.on("activeNote", function(data) {
      $(".playing").removeClass("playing");
      return $(".k" + data).addClass("playing");
    });
    socket.on("trackTitle", function(data) {
      return $("h1").text(data);
    });
    socket.on("activeClient", function() {
      $(".full").hide();
      return $(".open").show();
    });
    socket.on("inactiveClient", function() {
      $(".open").hide();
      return $(".full").show();
    });
    return socket.on("clearAll", function() {
      $(".playing").removeClass("playing");
      return $("ul.row li.active").each(function(index, activeBeat) {
        $(activeBeat).removeClass("active");
        return socket.emit("toggle", $(activeBeat).data("key"));
      });
    });
  });

}).call(this);
