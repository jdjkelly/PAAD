(function() {
  var BufferLoader, Sequencer, Track, audioInit, bufferLoader, context, finishedLoading;

  Sequencer = (function() {
    function Sequencer() {}

    Sequencer.prototype.tracks = [];

    Sequencer.prototype.notes = 16;

    Sequencer.prototype.bpm = 360;

    Sequencer.prototype.activeNote = 0;

    Sequencer.prototype.playing = false;

    Sequencer.prototype.play = function() {
      var _this = this;
      if (this.playInterval != null) {
        return;
      }
      return this.playInterval = setInterval(function() {
        _this.playing = true;
        $(".indicator").removeClass("active");
        $("li").removeClass("playing");
        if (_this.activeNote < _this.notes) {
          _this.activeNote = _this.activeNote + 1;
        } else {
          _this.activeNote = 1;
        }
        $(".indicator.k" + _this.activeNote).addClass("active");
        return _.each(_this.tracks, function(track) {
          return track.play(_this.activeNote);
        });
      }, (60 / this.bpm) * 1000 / 4);
    };

    Sequencer.prototype.changeBpm = function(bpm) {
      if (this.playing) {
        this.stop();
        this.bpm = bpm;
        return this.play();
      }
    };

    Sequencer.prototype.stop = function() {
      this.playing = false;
      if (this.playInterval != null) {
        clearInterval(this.playInterval);
        return this.playInterval = void 0;
      } else {
        this.activeNote = 0;
        return $(".indicator").removeClass("active");
      }
    };

    return Sequencer;

  })();

  Track = (function() {
    function Track(id, index) {
      this.id = id;
      this.index = index;
      this.beats = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    }

    Track.prototype.play = function(note) {
      if (this.beats[note - 1]) {
        console.log(this.beats[note - 1]);
        playSound(loadedTracks[this.index], 0);
        return $($("#" + this.id + " li")[note - 1]).addClass("playing");
      }
    };

    return Track;

  })();

  BufferLoader = function(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    return this.loadCount = 0;
  };

  BufferLoader.prototype.loadBuffer = function(url, index) {
    var loader, request;
    request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    loader = this;
    request.onload = function() {
      return loader.context.decodeAudioData(request.response, (function(buffer) {
        if (!buffer) {
          alert("error decoding file data: " + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount === loader.urlList.length) {
          return loader.onload(loader.bufferList);
        }
      }), function(error) {
        return console.error("decodeAudioData error", error);
      });
    };
    request.onerror = function() {
      return alert("BufferLoader: XHR error");
    };
    return request.send();
  };

  BufferLoader.prototype.load = function() {
    var i, _results;
    i = 0;
    _results = [];
    while (i < this.urlList.length) {
      this.loadBuffer(this.urlList[i], i);
      _results.push(++i);
    }
    return _results;
  };

  context = void 0;

  bufferLoader = void 0;

  window.loadedTracks = void 0;

  audioInit = function() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    bufferLoader = new BufferLoader(context, ["sounds/0.wav", "sounds/1.wav", "sounds/2.wav", "sounds/3.wav", "sounds/4.wav", "sounds/5.wav", "sounds/6.wav", "sounds/7.wav", "sounds/8.wav", "sounds/9.wav", "sounds/10.wav"], finishedLoading);
    return bufferLoader.load();
  };

  finishedLoading = function(bufferList) {
    return window.loadedTracks = bufferList;
  };

  window.playSound = function(buffer, time) {
    var source;
    source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    return source.start(time);
  };

  $(document).ready(function() {
    var sequencer;
    audioInit();
    sequencer = new Sequencer;
    socket.on("assignSocketId", function(data) {
      socket.assignedId = data;
      console.log("socketID assigned: ", socket.assignedId);
      return socket.emit("assignKitId", data);
    });
    socket.on("createSocket", function(data) {
      $.tmpl("<ul id='${id}' class='row'><li class='key k1'>1</li><li class='key k2'>2</li><li class='key k3'>3</li><li class='key k4'>4</li><li class='key k5'>5</li><li class='key k6'>6</li><li class='key k7'>7</li><li class='key k8'>8</li><li class='key k9'>9</li><li class='key k10'>10</li><li class='key k11'>11</li><li class='key k12'>12</li><li class='key k13'>13</li><li class='key k14'>14</li><li class='key k15'>15</li><li class='key k16'>16</li></ul>", {
        id: data
      }).appendTo(".key-wrapper");
      return sequencer.tracks.push(new Track(data, sequencer.tracks.length));
    });
    socket.on("deleteSocket", function(data) {
      $("#" + data).remove();
      return sequencer.tracks = _.reject(sequencer.tracks, function(track) {
        return track.id === data;
      });
    });
    socket.on("toggle", function(data) {
      var beat, client;
      $("#" + data["socket"] + " ." + data["message"]).toggleClass("active");
      client = _.find(sequencer.tracks, function(track) {
        return track.id === data["socket"];
      });
      beat = client.beats[parseInt(data["message"].replace(/\w/, '')) - 1];
      if (beat === true) {
        return client.beats[parseInt(data["message"].replace(/\w/, '')) - 1] = false;
      } else {
        return client.beats[parseInt(data["message"].replace(/\w/, '')) - 1] = true;
      }
    });
    $(".play").click(function(event) {
      return sequencer.play();
    });
    $(".stop").click(function(event) {
      return sequencer.stop();
    });
    $(".bpm").val(sequencer.bpm);
    return $(".bpm").blur(function() {
      return sequencer.changeBpm($(this).val());
    });
  });

}).call(this);
