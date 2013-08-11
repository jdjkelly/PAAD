$(document).ready ->
  $("ul.row li").click (event) ->
    socket.emit "toggle", $(@).data("key")
    $(@).toggleClass "active"

  socket.on "assignSocketId", (data) ->
    socket.assignedId = data

  socket.on "deleteKitSocket", ->
    $("ul.row li").removeClass("active")

  socket.on "activeNote", (data) ->
    $(".playing").removeClass("playing")
    $(".k" + data).addClass("playing")

  socket.on "trackTitle", (data) ->
    $("h1").text data

  socket.on "activeClient", ->
    $(".full").hide()
    $(".open").show()

  socket.on "inactiveClient", ->
    $(".open").hide()
    $(".full").show()

  socket.on "clearAll", ->
    $(".playing").removeClass("playing")

    $("ul.row li.active").each (index, activeBeat) ->
      $(activeBeat).removeClass("active")
      socket.emit "toggle", $(activeBeat).data("key")
