class Sequencer
  tracks: []
  notes: 16
  bpm: 120
  activeNote: 0
  playing: false

  play: ->
    return if @playInterval?
    @backGroundTrackPlaying = window.playBackground(@backingTrackId) if @backingTrackId?
    @playInterval = setInterval =>
      @playing = true
      $(".indicator").removeClass("active")
      $("li").removeClass("playing")
      if @activeNote < @notes
        @activeNote = @activeNote + 1
      else
        @activeNote = 1
      if @activeNote == 16
        socket.emit("activeNote", 1)
      else
        socket.emit("activeNote", @activeNote + 1)
      $(".indicator.k" + @activeNote).addClass("active")
      _.each @tracks, (track)=>
        track.play(@activeNote)
    , (60 / @bpm) * 1000 / 4

  changeBpm: (bpm)->
    if @playing
      @stop()
      @bpm = bpm
      @play()

  stop: ->
    @playing = false
    if @playInterval?
      clearInterval(@playInterval)
      @playInterval = undefined
      if @backGroundTrackPlaying?
        @backGroundTrackPlaying.pause()
    else
      @activeNote = 0
      $(".indicator").removeClass("active")
      $(".playing").removeClass("playing")
      socket.emit("clearAll")

class Track
  constructor: (@id, @index) ->
    @beats = [
      false
      false
      false
      false
      false
      false
      false
      false
      false
      false
      false
      false
      false
      false
      false
      false
    ]

  play: (note) ->
    if @beats[note - 1]
      console.log @beats[note - 1]
      playSound(loadedTracks[@index + (window.selectedKit * 7) - 1], 0)
      $($("##{@id} li")[note - 1]).addClass("playing")


# Credit to: http://www.html5rocks.com/en/tutorials/webaudio/intro/js/buffer-loader.js

BufferLoader = (context, urlList, callback) ->
  @context = context
  @urlList = urlList
  @onload = callback
  @bufferList = new Array()
  @loadCount = 0
BufferLoader::loadBuffer = (url, index) ->
  # Load buffer asynchronously
  request = new XMLHttpRequest()
  request.open "GET", url, true
  request.responseType = "arraybuffer"
  loader = this
  request.onload = ->

    # Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData request.response, ((buffer) ->
      unless buffer
        alert "error decoding file data: " + url
        return
      loader.bufferList[index] = buffer
      loader.onload loader.bufferList  if ++loader.loadCount is loader.urlList.length
    ), (error) ->
      console.error "decodeAudioData error", error


  request.onerror = ->
    alert "BufferLoader: XHR error"

  request.send()

BufferLoader::load = ->
  i = 0

  while i < @urlList.length
    @loadBuffer @urlList[i], i
    ++i

context = undefined
bufferLoader = undefined
window.loadedTracks = undefined

window.kits = [["Kick", "Hat", "Thing", "Whatever", "Something", "Stuff", "Whatever", "Otherthing"], ["Bass", "Bell", "Corny", "Drums", "Electro", "Pianobell", "Woody", "Bass x2"],["Closed Hi Hat", "Crash", "Floor Tom", "Kick", "Open Hi Hat", "Rack Tom", "Ride", "Snare"]]
window.selectedKit = 1

audioInit = ->
  # Fix up prefixing
  window.AudioContext = window.AudioContext or window.webkitAudioContext
  context = new AudioContext()
  bufferLoader = new BufferLoader(context, [
    "sounds/kit1/0.wav"
    "sounds/kit1/1.wav"
    "sounds/kit1/2.wav"
    "sounds/kit1/3.wav"
    "sounds/kit1/4.wav"
    "sounds/kit1/5.wav"
    "sounds/kit1/6.wav"
    "sounds/kit1/7.wav"
    "sounds/kit2/bass.ogg"
    "sounds/kit2/bell.ogg"
    "sounds/kit2/corny4.ogg"
    "sounds/kit2/drums.ogg"
    "sounds/kit2/electro_4.ogg"
    "sounds/kit2/pianobell.ogg"
    "sounds/kit2/woody.ogg"
    "sounds/kit2/bass_10.ogg"
    "sounds/kit3/0.wav"
    "sounds/kit3/1.wav"
    "sounds/kit3/2.wav"
    "sounds/kit3/3.wav"
    "sounds/kit3/4.wav"
    "sounds/kit3/5.wav"
    "sounds/kit3/6.wav"
    "sounds/kit3/7.wav"
  ], finishedLoading)
  bufferLoader.load()
finishedLoading = (bufferList) ->
  # source2 = context.createBufferSource()
  window.loadedTracks = bufferList
window.playSound = (buffer, time) ->
  source = context.createBufferSource()
  source.buffer = buffer
  source.connect context.destination
  source.start time
window.playBackground = (id) ->
  url = "http://api.soundcloud.com/tracks/#{id}/stream?client_id=435a565aaa07ebba76881f95805f6bf7"
  audio = new Audio()
  audio.src = url
  source = context.createMediaElementSource(audio)
  source.connect(context.destination)
  source.mediaElement.play()
  source.mediaElement

$(document).ready ->
  audioInit()
  sequencer = new Sequencer

  socket.on "assignSocketId", (data) ->
    socket.assignedId = data
    console.log "socketID assigned: ", socket.assignedId
    socket.emit "assignKitId", data

  socket.on "createSocket", (data) ->
    $.tmpl("<div class='track-group'><div class='track-title'>${name}</div><ul id='${id}' class='row'><li class='key k1'>1</li><li class='key k2'>2</li><li class='key k3'>3</li><li class='key k4'>4</li><li class='key k5'>5</li><li class='key k6'>6</li><li class='key k7'>7</li><li class='key k8'>8</li><li class='key k9'>9</li><li class='key k10'>10</li><li class='key k11'>11</li><li class='key k12'>12</li><li class='key k13'>13</li><li class='key k14'>14</li><li class='key k15'>15</li><li class='key k16'>16</li></ul></div>",
      id: data
      name: window.kits[window.selectedKit][sequencer.tracks.length]
    ).appendTo ".key-wrapper"

    sequencer.tracks.push new Track data, sequencer.tracks.length + 1
    socket.emit("trackTitle", {id: data, title: window.kits[window.selectedKit][sequencer.tracks.length]})

  socket.on "deleteSocket", (data) ->
    $("#" + data).parent().remove()
    sequencer.tracks = _.reject sequencer.tracks, (track)->
      track.id == data

  socket.on "toggle", (data) ->
    $("#" + data["socket"] + " ." + data["message"]).toggleClass "active"
    client = _.find sequencer.tracks, (track)->
      track.id == data["socket"]
    beat = client.beats[parseInt(data["message"].replace(/\w/,'')) - 1]
    if beat == true
      client.beats[parseInt(data["message"].replace(/\w/,'')) - 1] = false
    else
      client.beats[parseInt(data["message"].replace(/\w/,'')) - 1] = true

  $(".play").click (event)->
    $(this).addClass("active")
    $(".stop").removeClass("active")
    sequencer.play()
  $(".stop").click (event)->
    if $(this).hasClass("active")
      $(this).removeClass("active")
    else
      $(this).addClass("active")
    $(".play").removeClass("active")
    sequencer.stop()

  $(".record").click (event)->
    $(this).addClass("active")


  $(".slider").noUiSlider(
    range: [30, 400]
    start: 130
    handles: 1
    step: 5
    slide: ->
      if $(@).val() > 300
        $(".bpm .count").text("ERR")
      else
        $(".bpm .count").text $(@).val()
      sequencer.changeBpm $(@).val()
  )

  $(".backing-track").change (event)->
    sequencer.backingTrackId = $(@).val()

  $(".load-track").click (event)->
    sequencer.stop()
    kit = window.prompt("Which kit?","Enter 0 through #{window.kits.length - 1}")
    window.selectedKit = parseInt(kit)
    _.each $(".track-title"), (title, index)->
      $(title).text(window.kits[window.selectedKit][index])
      socket.emit("trackTitle", {id: $(title).siblings("ul").attr("id"), title: window.kits[window.selectedKit][index]})
