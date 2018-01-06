var soundObjects = []
var soundPositions = []

var numSounds = project.sounds.length;


var RADIUS = 0.25;

var numLoaded = 0;

function soundLoaded() {
  console.log("SKADOOSH")
  numLoaded++;
  if (numLoaded == numSounds) {
    soundObjects.forEach(function(sound) {
      sound.play()
    })
  }
}

function placePainting() {
  containerWidth = $("#left").width()
  containerHeight = $("#left").height()
  if (containerWidth / containerHeight > aspectRatio) {
    pHeight = containerHeight
    pWidth = pHeight * aspectRatio
  }
  else {
    pWidth = containerWidth
    pHeight = pWidth / aspectRatio
  }
  $("#painting").css({"width": pWidth + "px", "height": pHeight + "px"})
  $("#painting").css({"left": ((containerWidth - pWidth) / 2) + "px"})
  $("#painting").css({"top": ((containerHeight - pHeight) / 2) + "px"})

  $("#circle").css({'width': RADIUS * 2*pWidth + "px", 'height': RADIUS * 2*pWidth + "px", 'margin-top': RADIUS * 2*pWidth/-2 + "px", 'margin-left': RADIUS * 2*pWidth/-2 + "px", 'border-radius': RADIUS * 2*pWidth/2 + "px"})
}

$(window).on("load", function() {
    $("#painting").css({'background-image': 'url(' + project['artwork-id'] +  ')'})
    placePainting()
    project.sounds.forEach(function(sound) {
      var sobj = new Howl({
        src: [sound['sound-id']],
        loop: true
      })
      sobj.once('load', function(){
        soundLoaded()
      });
      soundObjects.push(sobj)
      soundPositions.push([sound.x, sound.y])
      //marker on screen
      var fx = parseFloat(sound.x)
      var fy = parseFloat(sound.y)
      var newMarker = $("#painting").append("<div class = 'marker' data-sound-id = '" + sound['sound-id'] +  "' style = 'top:" + fy*100 + "%; left: " + fx*100 + "%;'></div>").children().last()
    })

})

$("#painting").on("mousemove", function(e) {

  var offset = $("#painting").offset(),
  offsetX = e.clientX - offset.left,
  offsetY = e.clientY - offset.top;

  var x  = offsetX/$("#painting").width()
  var y  = offsetY/$("#painting").height()
  $("#circle").css({"top": y*100 + "%", "left": x*100 + "%"})

  for (i = 0; i < numSounds; i++) {
      var dx = x - soundPositions[i][0]
      var dy = (y - soundPositions[i][1]) * aspectRatio
      var dist = Math.sqrt(dx**2 + dy**2)
      var volume = 1 - (dist/RADIUS)
      if (volume < 0) {
        volume = 0
      }
      soundObjects[i].volume(volume)
  }

})

$(window).resize(function() {
  placePainting()
})

document.addEventListener("keydown", keyDownTextField, false);

function keyDownTextField(e) {
var keyCode = e.keyCode;
  if(keyCode==38) {
    if (RADIUS < 0.45) {
      RADIUS += 0.05;
      $("#circle").css({'width': RADIUS * 2*pWidth + "px", 'height': RADIUS * 2*pWidth + "px", 'margin-top': RADIUS * 2*pWidth/-2 + "px", 'margin-left': RADIUS * 2*pWidth/-2 + "px", 'border-radius': RADIUS * 2*pWidth/2 + "px"});
    }
  }
  else if (keyCode ==40) {
    if (RADIUS > 0.15) {
      RADIUS -= 0.05;
      $("#circle").css({'width': RADIUS * 2*pWidth + "px", 'height': RADIUS * 2*pWidth + "px", 'margin-top': RADIUS * 2*pWidth/-2 + "px", 'margin-left': RADIUS * 2*pWidth/-2 + "px", 'border-radius': RADIUS * 2*pWidth/2 + "px"});
    }
  }
  else if (keyCode ==77) { //m
    $(".marker").toggle()
  }
  else if (keyCode ==67) { //c
    $("#circle").toggle()
  }
}
