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
