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
      // const formant3Filter = context.createBiquadFilter()
      // const pitchFilter = PitchShift(context)
      const pitchFilter = createPitchFilter(context, 1.7, 0.5)
      const pitchFilter2 = createPitchFilter(context, 1.7, 0.5)
      const lowPitchFilter = createPitchFilter(context, 1.65, 0.4)
      const lowPitchFilter2 = createPitchFilter(context, 1.6, 0.4)
      const gain = context.createGain()
      // const formantMerger = context.createChannelMerger(2);
      const merger = context.createChannelMerger(4);
      const dest = context.createMediaStreamDestination()

      formant4Filter.type = 'bandpass'
      formant4Filter.frequency.setValueAtTime(3000, context.currentTime)
      formant4Filter.Q.setValueAtTime(50, context.currentTime)

      // formant3Filter.type = 'bandpass'
      // formant3Filter.frequency.setValueAtTime(2000, context.currentTime)
      // formant3Filter.Q.setValueAtTime(20, context.currentTime)

      // lowPitchFilter.transpose = 20
      // lowPitchFilter.wet.value = 0
      // lowPitchFilter.dry.value = 1

      gain.gain.setValueAtTime(30, context.currentTime)

      source.connect(formant4Filter)
      source.connect(pitchFilter)
      source.connect(lowPitchFilter)
      source.connect(lowPitchFilter2)
      lowPitchFilter.connect(merger)
      lowPitchFilter2.connect(merger)
      pitchFilter.connect(merger)
      // pitchFilter.connect(formant3Filter)
      formant4Filter.connect(lowPitchFilter)
      pitchFilter2.connect(gain)
      // formant3Filter.connect(formantMerger)
      // formantMerger.connect(gain)
      gain.connect(merger)
      merger.connect(dest)
      // gain.connect(dest)

      const options = { mimeType: 'video/webm;codecs=vp9' }
      const recordedChunks = []
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