
$(document).ready(function() {

  var delay = 0.0;
  var feedback = 0.0;
  var filter = 0.0;

  /* Slider change listeners */
  $(document).on("change", "#delay-val", function() {
    if(delay != null) {
      d = parseFloat($(this).val());
      if(isNaN(d))
        d = 0.0;
      delay.delayTime.value = d;
    }
  });

  $(document).on("change", "#feedback-val", function() {
    if(feedback != null) {
      d = parseFloat($(this).val());
      if(isNaN(d))
        d = 0.0;
      feedback.gain.value = d;
      console.log("feedback: "+d);
    }
  });

  $(document).on("change", "#filter-val", function() {
    if(filter != null) {
      d = parseInt($(this).val());
      if(isNaN(d))
        d = 0;
      filter.frequency.value = d;
      console.log("filter: "+d);
    }
  });
  /* END Slider change listeners */
  /* Visualization toggle  */
  $(document).on("click", "#toggle-visualizer", function() {
    $("#bar-canvas").toggle();
    $("#graph-canvas").toggle();
  });

  //cross browser getUserMedia
  navigator.getUserMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

  //get canvas dom elements
  var bar_canvas = document.querySelector('#bar-canvas');
  var graph_canvas = document.querySelector('#graph-canvas');

  // visualiser setup - create web audio api context and canvas
  var ctx = new (window.AudioContext || webkitAudioContext)();
  var barCanvasCtx = bar_canvas.getContext("2d");
  var graphCanvasCtx = graph_canvas.getContext("2d");

  var id = 0;

  if (navigator.getUserMedia) {
    var data = [];

    navigator.getUserMedia(
      { audio: true },
      function(stream) {
        visualize(stream);
         // create an AudioNode from the mic stream
         var mediaStreamSource = ctx.createMediaStreamSource(stream);

         //apply effects
         delay = ctx.createDelay();
         delay.delayTime.value = 0;
         feedback = ctx.createGain();
         feedback.gain.value = 0;
         filter = ctx.createBiquadFilter();
         filter.frequency.value = 0;

         delay.connect(feedback);
         feedback.connect(filter);
         filter.connect(delay);

         //connect effects to stream audioNode
         mediaStreamSource.connect(delay);
         delay.connect(ctx.destination);

         //connect processed audio to the audio output
         mediaStreamSource.connect( ctx.destination );

      },
      function(err) {
        console.log(err);
      }
    );

  } else {
     console.log('getUserMedia not supported on your browser!');
  }

  function visualize(stream) {
    //get source from context stream
    var source = ctx.createMediaStreamSource(stream);

    var analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    draw_bar_graph();
    draw_oscilloscope();

    function draw_oscilloscope() {

      requestAnimationFrame(draw_oscilloscope);

      analyser.getByteTimeDomainData(dataArray);

      graphCanvasCtx.fillStyle = 'rgb(200, 200, 200)';
      graphCanvasCtx.fillRect(0, 0, graph_canvas.width, graph_canvas.height);

      graphCanvasCtx.lineWidth = 2;
      graphCanvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      graphCanvasCtx.beginPath();

      var sliceWidth = graph_canvas.width * 1.0 / bufferLength;
      var x = 0;


      for(var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * graph_canvas.height/2;

        if(i === 0) {
          graphCanvasCtx.moveTo(x, y);
        } else {
          graphCanvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      graphCanvasCtx.lineTo(graph_canvas.width, graph_canvas.height/2);
      graphCanvasCtx.stroke();

    }

    function draw_bar_graph() {

      requestAnimationFrame(draw_bar_graph);

      analyser.getByteTimeDomainData(dataArray);

      barCanvasCtx.fillStyle = 'rgb(0, 0, 0)';
      barCanvasCtx.fillRect(0, 0, bar_canvas.width, bar_canvas.height);

      var barWidth = (bar_canvas.width / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i]*1.25;

        barCanvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        barCanvasCtx.fillRect(x,bar_canvas.height-barHeight/2,barWidth,barHeight);

        x += barWidth + 1;
      }

    }
  }

});
