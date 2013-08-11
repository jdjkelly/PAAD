(function() {
  var BufferLoader, Sequencer, Track, audioInit, bufferLoader, context, finishedLoading;

  Sequencer = (function() {
    function Sequencer() {}

    Sequencer.prototype.tracks = [];

    Sequencer.prototype.notes = 16;

    Sequencer.prototype.bpm = 120;

    Sequencer.prototype.activeNote = 0;

    Sequencer.prototype.playing = false;

    Sequencer.prototype.play = function() {
      var _this = this;
      if (this.playInterval != null) {
        return;
      }
      if (this.backingTrackId != null) {
        this.backGroundTrackPlaying = window.playBackground(this.backingTrackId);
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
        if (_this.activeNote === 16) {
          socket.emit("activeNote", 1);
        } else {
          socket.emit("activeNote", _this.activeNote + 1);
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
        this.playInterval = void 0;
        if (this.backGroundTrackPlaying != null) {
          return this.backGroundTrackPlaying.pause();
        }
      } else {
        this.activeNote = 0;
        $(".indicator").removeClass("active");
        $(".playing").removeClass("playing");
        return socket.emit("clearAll");
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
        playSound(loadedTracks[this.index + (window.selectedKit * 7) - 1], 0);
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

  window.kits = [["Kick", "Hat", "Thing", "Whatever", "Something", "Stuff", "Whatever", "Otherthing"], ["Bass", "Bell", "Corny", "Drums", "Electro", "Pianobell", "Woody", "Bass x2"], ["Closed Hi Hat", "Crash", "Floor Tom", "Kick", "Open Hi Hat", "Rack Tom", "Ride", "Snare"]];

  window.selectedKit = 1;

  audioInit = function() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    bufferLoader = new BufferLoader(context, ["sounds/kit1/0.wav", "sounds/kit1/1.wav", "sounds/kit1/2.wav", "sounds/kit1/3.wav", "sounds/kit1/4.wav", "sounds/kit1/5.wav", "sounds/kit1/6.wav", "sounds/kit1/7.wav", "sounds/kit2/bass.ogg", "sounds/kit2/bell.ogg", "sounds/kit2/corny4.ogg", "sounds/kit2/drums.ogg", "sounds/kit2/electro_4.ogg", "sounds/kit2/pianobell.ogg", "sounds/kit2/woody.ogg", "sounds/kit2/bass_10.ogg", "sounds/kit3/0.wav", "sounds/kit3/1.wav", "sounds/kit3/2.wav", "sounds/kit3/3.wav", "sounds/kit3/4.wav", "sounds/kit3/5.wav", "sounds/kit3/6.wav", "sounds/kit3/7.wav"], finishedLoading);
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

  window.playBackground = function(id) {
    var audio, source, url;
    url = "http://api.soundcloud.com/tracks/" + id + "/stream?client_id=435a565aaa07ebba76881f95805f6bf7";
    audio = new Audio();
    audio.src = url;
    source = context.createMediaElementSource(audio);
    source.connect(context.destination);
    source.mediaElement.play();
    return source.mediaElement;
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
      $.tmpl("<div class='track-group'><div class='track-title'>${name}</div><ul id='${id}' class='row'><li class='key k1'>1</li><li class='key k2'>2</li><li class='key k3'>3</li><li class='key k4'>4</li><li class='key k5'>5</li><li class='key k6'>6</li><li class='key k7'>7</li><li class='key k8'>8</li><li class='key k9'>9</li><li class='key k10'>10</li><li class='key k11'>11</li><li class='key k12'>12</li><li class='key k13'>13</li><li class='key k14'>14</li><li class='key k15'>15</li><li class='key k16'>16</li></ul></div>", {
        id: data,
        name: window.kits[window.selectedKit][sequencer.tracks.length]
      }).appendTo(".key-wrapper");
      sequencer.tracks.push(new Track(data, sequencer.tracks.length + 1));
      return socket.emit("trackTitle", {
        id: data,
        title: window.kits[window.selectedKit][sequencer.tracks.length]
      });
    });
    socket.on("deleteSocket", function(data) {
      $("#" + data).parent().remove();
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
      $(this).addClass("active");
      $(".stop").removeClass("active");
      return sequencer.play();
    });
    $(".stop").click(function(event) {
      if ($(this).hasClass("active")) {
        $(this).removeClass("active");
      } else {
        $(this).addClass("active");
      }
      $(".play").removeClass("active");
      return sequencer.stop();
    });
    $(".record").click(function(event) {
      return $(this).addClass("active");
    });
    $(".slider").noUiSlider({
      range: [30, 400],
      start: 130,
      handles: 1,
      step: 5,
      slide: function() {
        if ($(this).val() > 300) {
          $(".bpm .count").text("ERR");
        } else {
          $(".bpm .count").text($(this).val());
        }
        return sequencer.changeBpm($(this).val());
      }
    });
    $(".backing-track").change(function(event) {
      return sequencer.backingTrackId = $(this).val();
    });
    return $(".load-track").click(function(event) {
      var kit;
      sequencer.stop();
      kit = window.prompt("Which kit?", "Enter 0 through " + (window.kits.length - 1));
      window.selectedKit = parseInt(kit);
      return _.each($(".track-title"), function(title, index) {
        $(title).text(window.kits[window.selectedKit][index]);
        return socket.emit("trackTitle", {
          id: $(title).siblings("ul").attr("id"),
          title: window.kits[window.selectedKit][index]
        });
      });
    });
  });

}).call(this);
