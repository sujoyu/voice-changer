import PitchShift from 'soundbank-pitch-shift'

document.addEventListener('DOMContentLoaded', () => {
  const micBtn = document.getElementById('mic')
  const stopMicBtn = document.getElementById('stopMic')
  const player = document.getElementById('player')

  let mediaRecorder = null

  stopMicBtn.addEventListener('click', function() {
    if (mediaRecorder) {
      mediaRecorder.stop()
    }
  })



  micBtn.addEventListener('click', () => {
    const  handleSuccess = (stream) => {
      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const formant4Filter = context.createBiquadFilter()
      const pitchFilter = createPitchFilter(context, 1.4, 0.5)
      const pitchFilter2 = createPitchFilter(context, 1.4, 0.5)
      const gain = context.createGain()
      const merger = context.createChannelMerger(2);
      const dest = context.createMediaStreamDestination()

      formant4Filter.type = 'bandpass'
      formant4Filter.frequency.setValueAtTime(3000, context.currentTime)
      formant4Filter.Q.setValueAtTime(20, context.currentTime)

      gain.gain.setValueAtTime(85, context.currentTime)

      source.connect(formant4Filter)
      source.connect(pitchFilter)
      pitchFilter.connect(merger)
      formant4Filter.connect(pitchFilter2)
      pitchFilter2.connect(gain)
      gain.connect(merger)
      merger.connect(dest)

      const options = { mimeType: 'audio/webm' }
      mediaRecorder = new MediaRecorder(dest.stream, options)

      mediaRecorder.addEventListener('dataavailable', (ev) => {
        player.src = URL.createObjectURL(ev.data)
        mediaRecorder = null
      })

      mediaRecorder.start()
    }

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(handleSuccess)
  })

  // https://github.com/urtzurd/html-audio/blob/gh-pages/static/js/pitch-shifter.js
  function createPitchFilter(context, pitchRatio, overlapRatio) {
    const grainSize = 256
    const pitchShifterProcessor = context.createScriptProcessor(grainSize, 1, 1);

    pitchShifterProcessor.buffer = new Float32Array(grainSize * 2);
    pitchShifterProcessor.grainWindow = hannWindow(grainSize);
    pitchShifterProcessor.onaudioprocess = function (event) {
      var inputData = event.inputBuffer.getChannelData(0);
      var outputData = event.outputBuffer.getChannelData(0);

      for (i = 0; i < inputData.length; i++) {
          // Apply the window to the input buffer
          inputData[i] *= this.grainWindow[i];

          // Shift half of the buffer
          this.buffer[i] = this.buffer[i + grainSize];

          // Empty the buffer tail
          this.buffer[i + grainSize] = 0.0;
      }

      // Calculate the pitch shifted grain re-sampling and looping the input
      var grainData = new Float32Array(grainSize * 2);
      for (var i = 0, j = 0.0;
           i < grainSize;
           i++, j += pitchRatio) {

          var index = Math.floor(j) % grainSize;
          var a = inputData[index];
          var b = inputData[(index + 1) % grainSize];
          grainData[i] += linearInterpolation(a, b, j % 1.0) * this.grainWindow[i];
      }

      // Copy the grain multiple times overlapping it
      for (i = 0; i < grainSize; i += Math.round(grainSize * (1 - overlapRatio))) {
          for (j = 0; j <= grainSize; j++) {
              this.buffer[i + j] += grainData[j];
          }
      }

      // Output the first half of the buffer
      for (i = 0; i < grainSize; i++) {
          outputData[i] = this.buffer[i];
      }
    }

    return pitchShifterProcessor

    function hannWindow(length) {
        var window = new Float32Array(length);
        for (var i = 0; i < length; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
        }
        return window;
    }

    function linearInterpolation(a, b, t) {
        return a + (b - a) * t;
    }
  }

})