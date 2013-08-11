class Sequencer
  tracks: []
  notes: 16
  bpm: 120
  activeNote: 0
  playing: false

  play: ->
    return if @playInterval?
    @playInterval = setInterval =>
      @playing = true
      $(".indicator").removeClass("active")
      $("li").removeClass("playing")
      if @activeNote < @notes
        @activeNote = @activeNote + 1
      else
        @activeNote = 1
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
    else
      @activeNote = 0
      $(".indicator").removeClass("active")

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
      playSound(loadedTracks[@index], 0)
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

audioInit = ->
  # Fix up prefixing
  window.AudioContext = window.AudioContext or window.webkitAudioContext
  context = new AudioContext()
  bufferLoader = new BufferLoader(context, [
    "sounds/0.wav"
    "sounds/1.wav"
    "sounds/2.wav"
    "sounds/3.wav"
    "sounds/4.wav"
    "sounds/5.wav"
    "sounds/6.wav"
    "sounds/7.wav"
    "sounds/8.wav"
    "sounds/9.wav"
    "sounds/10.wav"
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


$(document).ready ->
  audioInit()
  sequencer = new Sequencer

  socket.on "assignSocketId", (data) ->
    socket.assignedId = data
    console.log "socketID assigned: ", socket.assignedId
    socket.emit "assignKitId", data

  socket.on "createSocket", (data) ->
    $.tmpl("<div class='track-group'><div class='track-title'></div><ul id='${id}' class='row'><li class='key k1'>1</li><li class='key k2'>2</li><li class='key k3'>3</li><li class='key k4'>4</li><li class='key k5'>5</li><li class='key k6'>6</li><li class='key k7'>7</li><li class='key k8'>8</li><li class='key k9'>9</li><li class='key k10'>10</li><li class='key k11'>11</li><li class='key k12'>12</li><li class='key k13'>13</li><li class='key k14'>14</li><li class='key k15'>15</li><li class='key k16'>16</li></ul></div>",
      id: data
    ).appendTo ".key-wrapper"

    sequencer.tracks.push new Track data, sequencer.tracks.length

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
    sequencer.play()
  $(".stop").click (event)->
    sequencer.stop()

  $(".bpm").val(sequencer.bpm)
  $(".bpm").blur ->
    sequencer.changeBpm $(@).val()


