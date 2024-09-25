let notes = [];
let tonicSelect;
let modeSelect; // major/minor
const DEFAULT_SIZE = 40;
const tonics = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
let key = Tonal.Key.majorKey("C");

function setup() {

  let test1 = Tonal.Note.get("A4");
  let test2 = Tonal.Note.get("A");

  createCanvas(1600, 800);
  textAlign(CENTER, CENTER);

  let angle = 0;
  tonics.forEach(x => {
    let note = Tonal.Note.get(x);
    note.isPlaying = false;
    note.schedulePlaying = false;
    note.size = DEFAULT_SIZE;
    note.hue = angle;
    note.solfege = "";
    angle += 30;
    notes.push(note);
  });

  colorMode(HSB);

  tonicSelect = createSelect();
  tonicSelect.position(85, 700);

  tonics.forEach(x => {
    tonicSelect.option(x);
  });

  tonicSelect.changed(tonicChanged);
  tonicChanged();
}

function tonicChanged() {
  
  resetNotes(true);

  let tonic = tonicSelect.value();
  key = Tonal.Key.majorKey(tonic);
  const isInScale = Tonal.Pcset.isNoteIncludedIn(Tonal.Pcset.get(key.scale));
  const solfegeNmesMajor = ["Do", "Re", "Mi", "Fa", "So", "La", "Ti"];

  let i = 0;
  key.scale.forEach(s => {
    let scaleNote = Tonal.Note.get(s);
    for (j = 0; j < notes.length; j++) {
      let x = notes[j];
      if (scaleNote.height == x.height) { // TODO pc correct??
        x.solfege = solfegeNmesMajor[i];
        break;
      }
    }
    i++;
  });

  notes.forEach(x => {

  });
}

function drawCof(doRotate, angle, utils, solfege) {

  i = 0;
  let key = Tonal.Key.majorKey(tonicSelect.value());

  notes.forEach(x => {


    let rotation = angle;
    if (doRotate && i > 0 && i % 2 == 1) {
      rotation -= 180;
    }

    let alpha = 1.0;
    let s = 100;
    let b = 100;
    const isInScale = Tonal.Pcset.isNoteIncludedIn(Tonal.Pcset.get(key.scale));
    if (doRotate && !isInScale(x.pc)) {
      b = 66;
      s = 47;
    }

    let fillcolor = color(x.hue, s, b, alpha);

    fill(fillcolor);
    let tonic = tonicSelect.value();
    let tonicRotation = tonics.indexOf(tonic) * -30;
    let final_rot = (doRotate ? rotation : angle);

    // 2 color radial gradient
    var colors = [fillcolor, color(x.hue, 10, 50, 0)];

    // Begin radial gradient fill
    // Short version to use function must require 4 arguments
    // utils.beginRadialGradient(
    //   colors,     // Colors of the gradient fill
    //   0, // x position of the inner circle gradient
    //   0, // y position of the inner circle gradient
    //   150  // diameter of the gradient fill
    //);

    //ellipseMode(CORNER);

    if (x.schedulePlaying) {
      x.schedulePlaying = false;
      x.isPlaying = true;
      x.size = 60;
    } else if (x.isPlaying) {
      x.size -= 1;
      if (x.size <= DEFAULT_SIZE / 3) {
        x.size = DEFAULT_SIZE;
        x.isPlaying = false;
      }
    }
    polarEllipse(final_rot, x.size, x.size, 200);
    //utils.endRadialGradient();


    push();
    angleMode(DEGREES);
    //translate(width / 2, height / 2);
    rotate(final_rot);
    translate(0, -200);
    rotate(-final_rot);
    var col = color(100);
    if (!isInScale(x.pc)) {
      col = color(0,0, 40);
    }
    fill(col);
    stroke(0);
    textSize(25);
    strokeWeight(4);
    text(x.pc, 0, 0);

    if (solfege && x.isPlaying) {
      rotate(final_rot);
      translate(0, -70);
      rotate(-final_rot);
      text(x.solfege, 0, 0);
    }

    pop();
    angleMode(RADIANS);

    i++;
    angle += 30;
  });
}

function resetNotes(hardReset = false) {


  notes.forEach(x => {
    x.isPlaying = false;
    x.schedulePlaying = false;
    x.size = DEFAULT_SIZE;
    if (hardReset) {
      x.solfege = "";
    }
  });
}

function draw() {

  background("black");
  push();
  translate(400, 400);

  let utils = new p5.Utils();
  let tonic = tonicSelect.value();
  let index = notes.findIndex(x => x.pc == tonic);
  if (index == -1) {
    //TODO ERROR
    return;
  }

  notes = Tonal.Collection.rotate(index, notes);
  drawCof(false, 0, utils, false);
  translate(600,0);

  drawCof(true, 0, utils, true);

  pop();


  textSize(25);
  text('Tonic:', 50, 710);
}

var MidiPlayer = MidiPlayer;
var loadFile, loadDataUri;
var Player = new MidiPlayer.Player;
var AudioContext = window.AudioContext || window.webkitAudioContext || false; 
var ac = new AudioContext || new webkitAudioContext;

var changeTempo = function(tempo) {
	Player.tempo = tempo;
}

var play = function() {
	Player.play();
	document.getElementById('play-button').innerHTML = 'Pause';
}

var pause = function() {
	Player.pause();
	document.getElementById('play-button').innerHTML = 'Play';
}

var stop = function() {
	Player.stop();
	document.getElementById('play-button').innerHTML = 'Play';
}


Soundfont.instrument(ac, 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/acoustic_guitar_nylon-mp3.js').then(function (instrument) {
	document.getElementById('select-file').style.display = 'block';

	loadFile = function() {
		Player.stop();
		var file = document.querySelector('input[type=file]').files[0];
		var reader = new FileReader();
		if (file) reader.readAsArrayBuffer(file);

		reader.addEventListener("load", function () {
			Player = new MidiPlayer.Player(function(event) {
				if (event.name == 'Note on') {
					instrument.play(event.noteName, ac.currentTime, {gain:event.velocity/100});
          var playedNote = Tonal.Note.get(event.noteName);
          for (i = 0; i < notes.length; i++) {
            let x = notes[i];
            if (x.pc == playedNote.pc) {
              x.schedulePlaying = true;
            }
          }
				}

				document.getElementById('tempo-display').innerHTML = Player.tempo;
				// document.getElementById('file-format-display').innerHTML = Player.format;
				// document.getElementById('play-bar').style.width = 100 - Player.getSongPercentRemaining() + '%';
			});

			Player.loadArrayBuffer(reader.result);
			
			document.getElementById('play-button').removeAttribute('disabled');

			play();
		}, false);
	}

	loadDataUri = function(dataUri) {
		Player = new MidiPlayer.Player(function(event) {
			if (event.name == 'Note on' && event.velocity > 0) {
				instrument.play(event.noteName, ac.currentTime, {gain:event.velocity/100});
			}

			// document.getElementById('tempo-display').innerHTML = Player.tempo;
			// document.getElementById('file-format-display').innerHTML = Player.format;	
			// document.getElementById('play-bar').style.width = 100 - Player.getSongPercentRemaining() + '%';
		});

		Player.loadDataUri(dataUri);

		document.getElementById('play-button').removeAttribute('disabled');

		//play();
	}
});

