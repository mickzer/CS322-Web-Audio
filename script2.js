
$(document).ready(function() {

  var delay = null;
  var feedback = null;
  var filter = null;

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

  navigator.getUserMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);


  var canvas = document.querySelector('.visualizer');

  // visualiser setup - create web audio api context and canvas

  var ctx = new (window.AudioContext || webkitAudioContext)();
  var canvasCtx = canvas.getContext("2d");

  var id = 0;

  if (navigator.getUserMedia) {
    var data = [];

    navigator.getUserMedia(
      { audio: true },
      function(stream) {
        visualize(stream);

         // Create an AudioNode from the stream.
         var mediaStreamSource = ctx.createMediaStreamSource( stream );

         delay = ctx.createDelay();
         delay.delayTime.value = 0.5;
         feedback = ctx.createGain();
         feedback.gain.value = 0.8;
         filter = ctx.createBiquadFilter();
         filter.frequency.value = 1000;

         delay.connect(feedback);
         feedback.connect(filter);
         filter.connect(delay);
         //
        mediaStreamSource.connect(delay);
        //  mediaStreamSource.connect(ctx.destination);
        delay.connect(ctx.destination);

         // Connect it to the destination to hear yourself (or any other node for processing!)
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
    var source = ctx.createMediaStreamSource(stream);

    var analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    //analyser.connect(audioCtx.destination);

    WIDTH = canvas.width
    HEIGHT = canvas.height;

    draw()

    function draw() {

      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;


      for(var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height/2);
      canvasCtx.stroke();

    }
  }

});
