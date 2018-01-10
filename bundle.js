/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_soundbank_pitch_shift__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_soundbank_pitch_shift___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_soundbank_pitch_shift__);


document.addEventListener('DOMContentLoaded', () => {
  const micBtn = document.getElementById('mic');
  const stopMicBtn = document.getElementById('stopMic');
  const player = document.getElementById('player');

  let mediaRecorder = null;

  stopMicBtn.addEventListener('click', function () {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  });

  micBtn.addEventListener('click', () => {
    const handleSuccess = stream => {
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const formant4Filter = context.createBiquadFilter();
      const pitchFilter = createPitchFilter(context, 1.4, 0.5);
      const pitchFilter2 = createPitchFilter(context, 1.4, 0.5);
      const gain = context.createGain();
      const merger = context.createChannelMerger(2);
      const dest = context.createMediaStreamDestination();

      formant4Filter.type = 'bandpass';
      formant4Filter.frequency.setValueAtTime(3000, context.currentTime);
      formant4Filter.Q.setValueAtTime(20, context.currentTime);

      gain.gain.setValueAtTime(85, context.currentTime);

      source.connect(formant4Filter);
      source.connect(pitchFilter);
      pitchFilter.connect(merger);
      formant4Filter.connect(pitchFilter2);
      pitchFilter2.connect(gain);
      gain.connect(merger);
      merger.connect(dest);

      const options = { mimeType: 'audio/webm' };
      mediaRecorder = new MediaRecorder(dest.stream, options);

      mediaRecorder.addEventListener('dataavailable', ev => {
        player.src = URL.createObjectURL(ev.data);
        mediaRecorder = null;
      });

      mediaRecorder.start();
    };

    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(handleSuccess);
  });

  // https://github.com/urtzurd/html-audio/blob/gh-pages/static/js/pitch-shifter.js
  function createPitchFilter(context, pitchRatio, overlapRatio) {
    const grainSize = 256;
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
      for (var i = 0, j = 0.0; i < grainSize; i++, j += pitchRatio) {

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
    };

    return pitchShifterProcessor;

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
});

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var createAudioNode = __webpack_require__(2)

module.exports = function PitchShift(audioContext){
  var instance = new Jungle(audioContext)
  var input = audioContext.createGain()
  var wet = audioContext.createGain()
  var dry = audioContext.createGain()
  var output = audioContext.createGain()

  dry.gain.value = 0

  input.connect(wet)
  input.connect(dry)

  wet.connect(instance.input)
  instance.output.connect(output)

  dry.connect(output)

  var node = createAudioNode(input, output, {
    dry: {
      min: 0, 
      defaultValue: 0,
      target: dry.gain
    },
    wet: {
      min: 0, 
      defaultValue: 1,
      target: wet.gain
    }
  })

  instance.setPitchOffset(getMultiplier(12))

  var transpose = 0
  Object.defineProperty(node, 'transpose', {
    set: function(value){
      transpose = getMultiplier(value)
      instance.setPitchOffset(transpose)
    },
    get: function(){
      return transpose
    }
  })
  return node
}

function getMultiplier(x){

  // don't ask...
  if (x<0){
    return x/12
  } else {
    var a5 = 1.8149080040913423e-7
    var a4 = -0.000019413043101157434
    var a3 = 0.0009795096626987743
    var a2 = -0.014147877819596033
    var a1 = 0.23005591195033048
    var a0 = 0.02278153473118749

    var x1 = x
    var x2 = x*x
    var x3 = x*x*x
    var x4 = x*x*x*x
    var x5 = x*x*x*x*x

    return a0 + x1*a1 + x2*a2 + x3*a3 + x4*a4 + x5*a5
  }

}

// include https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js

// Copyright 2012, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

function createFadeBuffer(context, activeTime, fadeTime) {
    var length1 = activeTime * context.sampleRate;
    var length2 = (activeTime - 2*fadeTime) * context.sampleRate;
    var length = length1 + length2;
    var buffer = context.createBuffer(1, length, context.sampleRate);
    var p = buffer.getChannelData(0);
        
    var fadeLength = fadeTime * context.sampleRate;

    var fadeIndex1 = fadeLength;
    var fadeIndex2 = length1 - fadeLength;
    
    // 1st part of cycle
    for (var i = 0; i < length1; ++i) {
        var value;
        
        if (i < fadeIndex1) {
            value = Math.sqrt(i / fadeLength);
        } else if (i >= fadeIndex2) {
            value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
        } else {
            value = 1;
        }
        
        p[i] = value;
    }

    // 2nd part
    for (var i = length1; i < length; ++i) {
        p[i] = 0;
    }
    
    
    return buffer;
}

function createDelayTimeBuffer(context, activeTime, fadeTime, shiftUp) {
    var length1 = activeTime * context.sampleRate;
    var length2 = (activeTime - 2*fadeTime) * context.sampleRate;
    var length = length1 + length2;
    var buffer = context.createBuffer(1, length, context.sampleRate);
    var p = buffer.getChannelData(0);
    
    // 1st part of cycle
    for (var i = 0; i < length1; ++i) {
        if (shiftUp)
          // This line does shift-up transpose
          p[i] = (length1-i)/length;
        else
          // This line does shift-down transpose
          p[i] = i / length1;
    }

    // 2nd part
    for (var i = length1; i < length; ++i) {
        p[i] = 0;
    }

    return buffer;
}

var delayTime = 0.100;
var fadeTime = 0.050;
var bufferTime = 0.100;

function Jungle(context) {
    this.context = context;
    // Create nodes for the input and output of this "module".
    var input = context.createGain();
    var output = context.createGain();
    this.input = input;
    this.output = output;
    
    // Delay modulation.
    var mod1 = context.createBufferSource();
    var mod2 = context.createBufferSource();
    var mod3 = context.createBufferSource();
    var mod4 = context.createBufferSource();
    this.shiftDownBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, false);
    this.shiftUpBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, true);
    mod1.buffer = this.shiftDownBuffer;
    mod2.buffer = this.shiftDownBuffer;
    mod3.buffer = this.shiftUpBuffer;
    mod4.buffer = this.shiftUpBuffer;
    mod1.loop = true;
    mod2.loop = true;
    mod3.loop = true;
    mod4.loop = true;

    // for switching between oct-up and oct-down
    var mod1Gain = context.createGain();
    var mod2Gain = context.createGain();
    var mod3Gain = context.createGain();
    mod3Gain.gain.value = 0;
    var mod4Gain = context.createGain();
    mod4Gain.gain.value = 0;

    mod1.connect(mod1Gain);
    mod2.connect(mod2Gain);
    mod3.connect(mod3Gain);
    mod4.connect(mod4Gain);

    // Delay amount for changing pitch.
    var modGain1 = context.createGain();
    var modGain2 = context.createGain();

    var delay1 = context.createDelay();
    var delay2 = context.createDelay();
    mod1Gain.connect(modGain1);
    mod2Gain.connect(modGain2);
    mod3Gain.connect(modGain1);
    mod4Gain.connect(modGain2);
    modGain1.connect(delay1.delayTime);
    modGain2.connect(delay2.delayTime);

    // Crossfading.
    var fade1 = context.createBufferSource();
    var fade2 = context.createBufferSource();
    var fadeBuffer = createFadeBuffer(context, bufferTime, fadeTime);
    fade1.buffer = fadeBuffer
    fade2.buffer = fadeBuffer;
    fade1.loop = true;
    fade2.loop = true;

    var mix1 = context.createGain();
    var mix2 = context.createGain();
    mix1.gain.value = 0;
    mix2.gain.value = 0;

    fade1.connect(mix1.gain);    
    fade2.connect(mix2.gain);
        
    // Connect processing graph.
    input.connect(delay1);
    input.connect(delay2);    
    delay1.connect(mix1);
    delay2.connect(mix2);
    mix1.connect(output);
    mix2.connect(output);
    
    // Start
    var t = context.currentTime + 0.050;
    var t2 = t + bufferTime - fadeTime;
    mod1.start(t);
    mod2.start(t2);
    mod3.start(t);
    mod4.start(t2);
    fade1.start(t);
    fade2.start(t2);

    this.mod1 = mod1;
    this.mod2 = mod2;
    this.mod1Gain = mod1Gain;
    this.mod2Gain = mod2Gain;
    this.mod3Gain = mod3Gain;
    this.mod4Gain = mod4Gain;
    this.modGain1 = modGain1;
    this.modGain2 = modGain2;
    this.fade1 = fade1;
    this.fade2 = fade2;
    this.mix1 = mix1;
    this.mix2 = mix2;
    this.delay1 = delay1;
    this.delay2 = delay2;
    
    this.setDelay(delayTime);
}

Jungle.prototype.setDelay = function(delayTime) {
    this.modGain1.gain.setTargetAtTime(0.5*delayTime, 0, 0.010);
    this.modGain2.gain.setTargetAtTime(0.5*delayTime, 0, 0.010);
}

Jungle.prototype.setPitchOffset = function(mult) {
  if (mult>0) { // pitch up
    this.mod1Gain.gain.value = 0;
    this.mod2Gain.gain.value = 0;
    this.mod3Gain.gain.value = 1;
    this.mod4Gain.gain.value = 1;
  } else { // pitch down
    this.mod1Gain.gain.value = 1;
    this.mod2Gain.gain.value = 1;
    this.mod3Gain.gain.value = 0;
    this.mod4Gain.gain.value = 0;
  }
  this.setDelay(delayTime*Math.abs(mult));
}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var createAudioParam = __webpack_require__(3)

module.exports = function(input, output, params, onDestinationChange){
  var audioContext = (input || output).context

  var node = audioContext.createGain()
  node._onDestinationChange = onDestinationChange

  if (input){
    node.connect(input)
  }

  node._output = output
  node._targetCount = 0

  if (output){
    node.connect = connect
    node.disconnect = disconnect
  }

  addAudioParams(node, params)

  return node
}

module.exports.createAudioParam = createAudioParam

function connect(destination, channel){
  this._targetCount += 1
  this._output.connect(destination, channel)
  if (typeof this._onDestinationChange === 'function'){
    this._onDestinationChange(this._targetCount)
  }
}

function disconnect(param){
  this._targetCount = 0
  this._output.disconnect(param)
  if (typeof this._onDestinationChange === 'function'){
    this._onDestinationChange(this._targetCount)
  }
}

function addAudioParams(node, params){
  if (params){
    var keys = Object.keys(params)
    for (var i=0,l=keys.length;i<l;i++){
      var key = keys[i]
      node[key] = createAudioParam(node.context, key, params[key])
    }
  }
}

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = function(audioContext, name, options){
  // options: provider, target(s)

  options = options || {}

  var targets = options.targets

  if (!targets && options.target){
    targets = [options.target]
  } else if (!targets){
    targets = []
  }

  var param = Object.create(AudioParam.prototype, {
    value: {
      get: function(){
        return param._lastValue
      },
      set: function(value){
        value = param.fence(value)
        param._lastValue = value
        for (var i=0,l=targets.length;i<l;i++){
          var target = targets[i]
          target.value = value
        }
      }
    },
    defaultValue: {
      get: function(){
        return options.defaultValue
      }
    },
    name: {
      value: name,
      writable: false
    },
    min: {
      value: options.min,
      writable: false
    },
    max: {
      value: options.max,
      writable: false
    }
  })



  param._targets = targets
  param._lastValue = options.defaultValue

  // override proto-methods
  param.setValueAtTime = setValueAtTime
  param.linearRampToValueAtTime = linearRampToValueAtTime
  param.exponentialRampToValueAtTime = exponentialRampToValueAtTime
  param.setTargetAtTime = setTargetAtTime
  param.setValueCurveAtTime = setValueCurveAtTime
  param.cancelScheduledValues = cancelScheduledValues
  param.addTarget = addTarget
  param.clearTargets = clearTargets
  param.context = audioContext

  // get value between min and max
  param.fence = fence
  
  // set initial value
  if (options.defaultValue != null){
    param.value = options.defaultValue
  }

  return param
}

function fence(value){
  if (this.min != null){
    value = Math.max(this.min, value)
  }

  if (this.max != null){
    value = Math.min(this.max, value)

  }
  return value
}

function setValueAtTime(value, startTime){
  var targets = this._targets
  value = this.fence(value)

  this._lastValue = value

  for (var i=0,l=targets.length;i<l;i++){
    targets[i].setValueAtTime(value, startTime)
  }
}

function setTargetAtTime(value, startTime, timeConstant){
  // this needs to be rewritten to use custom curve
  var targets = this._targets
  value = this.fence(value)
  for (var i=0,l=targets.length;i<l;i++){
    if (targets[i].setTargetAtTime){
      targets[i].setTargetAtTime(value, startTime, timeConstant)
    }
  }
}

function linearRampToValueAtTime(value, endTime){
  var targets = this._targets
  value = this.fence(value)

  this._lastValue = value

  for (var i=0,l=targets.length;i<l;i++){
    targets[i].linearRampToValueAtTime(value, endTime)
  }
}

function exponentialRampToValueAtTime(value, endTime){
  var targets = this._targets
  value = this.fence(value)

  this._lastValue = value

  for (var i=0,l=targets.length;i<l;i++){
    targets[i].exponentialRampToValueAtTime(value, endTime)
  }
}

function setValueCurveAtTime(curve, startTime, duration){
  var targets = this._targets
  this._lastValue = curve[curve.length-1]

  for (var i=0,l=targets.length;i<l;i++){
    targets[i].setValueCurveAtTime(curve, startTime, duration)
  }
}

function cancelScheduledValues(startTime){
  var targets = this._targets
  for (var i=0,l=targets.length;i<l;i++){
    targets[i].cancelScheduledValues(startTime)
  }
}

function clearTargets(){
  this._targets = []
}

function addTarget(target){
  this._targets.push(target)
  if (this._lastValue != null){
    target.value = this._lastValue
  }
}

/***/ })
/******/ ]);