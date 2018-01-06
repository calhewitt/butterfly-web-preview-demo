var _idCount = 1 //used to dynamically assign marker IDs
var pWidth = 0;
var pHeight = 0;

var projectTitle;
var artworkID;
var currentMarker;
var currentID = -1;
var soundLibrary;


var csrfToken = $('input[name="csrfmiddlewaretoken"]').val();

$(document).ready(function() {
  initializeFromJson();

  window.onbeforeunload = function(){
    if (needsSave) {
      return 'Are you sure you want to leave?';
    }
  };
})

$(window).resize(function() {
  placePainting()
})

var needsSave = false
function needSave() {
  if (!needsSave) {
    //called whenever a change is made
    needsSave = true
    $("#save-button").css({"color": "black", "cursor": "pointer"});


    ////Autosave functionality
    setTimeout(function(){
      if (needsSave) { //still, that is
        saveProject()
      }
    }, 5000);
  }
}

function initializeFromJson() {
  // initialProject has been unpacked already.
  artworkID = initialProject['artwork-id']
  soundLibrary = initialProject['sound-library']
  projectTitle = initialProject['title']
  initialProject.sounds.forEach(function(el) {
    newSoundWithParams(el['sound-id'], el.x, el.y)
  })
  init()
}

function init() {
  $("#painting").css({'background-image': 'url(/media/artworks/' + artworkID +  ')'})
  placePainting()
  $("#project-title").val(projectTitle).on("input", function() {
    needSave()
    projectTitle = $(this).val()
  })

  initSL();

}


function initSL() {
  //Initialize sound library
  soundList = $("#sound-list")
  soundList.empty()
  $.each(soundLibrary, function(key, value) {
    if (key != "-1") {

      soundList.append("<div class = 'sound'>SOUND LOADING</div>");
      var newSoundDiv = soundList.children().last()

      newSoundDiv.html("<div class = 'sound-name'></div> <span class = 'preview-sound material-icons'>play_arrow</span> <span class = 'delete-sound material-icons'>delete</span>")
      newSoundDiv.children().eq(0).text(value);
      newSoundDiv.attr("data-sound-id", key);

    }
  })
  soundHandlers()
  $("#painting").click(function () {
    activate(-1)
  })
}

function uploader() {
  if ($("#sound-input").val() == "") {
    return false
  }

  var fileName = $("#sound-input").val().split(/(\\|\/)/g).pop()

  var soundList = $("#sound-list")
  soundList.append("<div class = 'sound'>SOUND LOADING</div>");
  var newSoundDiv = soundList.children().last()

  $.ajax({ ///// This code is MAGIC do not touch!!!!!
    url: '/bmsms',
    type: 'POST',

    data: new FormData($('#uploadform')[0]),

    cache: false,
    contentType: false,
    processData: false,


    xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                // For handling the progress of the upload
                myXhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        $('progress').attr({ //replace or whatever
                            value: e.loaded,
                            max: e.total,
                        });
                    }
                } , false);
            }
            return myXhr;
        },
  }).done(function(data) {
    soundLibrary[data] = fileName
    newSoundDiv.html("</div><div class = 'sound-name'></div> <span class = 'preview-sound material-icons'>play_arrow</span> <span class = 'delete-sound material-icons'>delete</span>")
    newSoundDiv.children().eq(0).text(fileName);
    newSoundDiv.attr("data-sound-id", data);
    soundHandlers()
    activate(currentID)
    needSave()
    saveProject()

  }).fail(function(data) {
    console.log(data)

  })
}

function soundHandlers() {
  $(".delete-sound").off('click').on('click', function() {
        var divIQ = $(this).parent() // in question :-)
        var idIQ = divIQ.attr("data-sound-id")
        var datas = new FormData();
        datas.append("action", "deletesound")
        datas.append("csrfmiddlewaretoken", csrfToken)
        datas.append("soundid", idIQ)

        $.ajax({
          url: '/bmsms',
          type: 'POST',

          data: datas,

          cache: false,
          contentType: false,
          processData: false,

          xhr: $.ajaxSettings.xhr

        }).done(function(data) {

          divIQ.remove()
          delete soundLibrary[idIQ]
          $(".marker").each(function() {
            if ($(this).attr("data-sound-id") == idIQ) {
              //marker has sound to be removed - delete it!
              markerid = $(this).attr("data-id")
              deleteMarker(markerid);
            }
          })
        }).fail(function(data) {
          console.log(data)
        })
  })

  $(".preview-sound").off('click').on('click', function() {
    if ($(this).hasClass("playing")) {
      $(".preview-sound").removeClass("playing")
      $(".preview-sound").html("play_arrow")
      $("audio").trigger("pause")
    }
    else {
      $("audio").trigger("pause")
      $(".preview-sound").removeClass("playing")
      $(".preview-sound").html("play_arrow")
      var parentDiv = $(this).parent()

      $(this).addClass("playing")
      $(this).html("stop")
      if (parentDiv.children("audio").length == 0) {
        parentDiv.append("<audio></audio>")
        parentDiv.children("audio").attr("src", "/media/sounds/" + parentDiv.attr("data-sound-id"))
        parentDiv.children("audio").trigger("play")
      }
      else {
        parentDiv.children("audio")[0].currentTime = 0
        parentDiv.children("audio")[0].play()
      }
    }

  })

}

function newSoundWithParams(soundID, x, y) { //create marker, actually
  $(".marker").removeClass("active")
  var fx = parseFloat(x)
  var fy = parseFloat(y)
  var newMarker = $("#painting").append("<div class = 'marker' data-sound-id = '" + soundID +  "' style = 'top:" + fy*100 + "%; left: " + fx*100 + "%;' data-x = '" + x + "' data-y ='" + y + "' data-id = '" + (_idCount++).toString() + "'></div>").children().last()

  interact('.marker')
  .draggable({
    // enable inertial throwing
    inertia: false,
    // keep the element within the area of it's parent
    restrict: {
      restriction: "parent",
      endOnly: true,
      elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    },
    // enable autoScroll
    autoScroll: true,

    // call this function on every dragmove event

    onmove: dragMoveListener

  })
  .on('dragstart', startlistener)
  .on('click', startlistener)
  .styleCursor(false)
  activate(_idCount - 1);
}

function newSound() {
  needSave()
  newSoundWithParams("-1", 0.5, 0.5 )
}

function deleteMarker(markerID) {
  needSave()
  theMarker = $("[data-id=" + markerID +"]");
  theMarker.remove();
  if (currentID == markerID) {
    if ($(".marker").length > 0) { //markers still exist
      activate($(".marker").first().attr("data-id"))
    }
    else {
      activate(-1)
    }
  }
}

function saveProject() {
  if (!needsSave) {
    return false
  }
  needsSave = false
  var project = {}
  var sounds = []
  $(".marker").each(function() {
    thissound = {}
    thissound['x'] = $(this).attr("data-x")
    thissound['y'] = $(this).attr("data-y")
    thissound['sound-id'] = $(this).attr("data-sound-id")
    sounds.push(thissound)

  })
  project['sounds'] = sounds
  project['title'] = projectTitle
  project['artwork-id'] = artworkID;
  project['sound-library'] = soundLibrary;
  var serialized = JSON.stringify(project)
  var datas = new FormData();
  datas.append("csrfmiddlewaretoken", csrfToken)
  datas.append("project-id", PROJECTID)
  datas.append("contents", serialized)

  $.ajax({
    url: '/bmpms',
    type: 'POST',

    data: datas,

    cache: false,
    contentType: false,
    processData: false,

    xhr: $.ajaxSettings.xhr

  }).done(function(data) {
    console.log(data)
    if (!needsSave) {
      $("#save-button").css({"color": "#aaa", "cursor": "default"});
    }
  })

}

function startlistener(event) {
  id = $(event.target).attr("data-id")
  activate(id)
}

function dragMoveListener (event) {
  needSave()
  var target = event.target,
      // keep the dragged position in the data-x/data-y attributes
      x = (parseFloat(target.getAttribute('data-x'))*pWidth || 0) + event.dx,
      y = (parseFloat(target.getAttribute('data-y')) || 0)*pHeight + event.dy;

  // translate the element
  target.style.left =  x*100/pWidth + '%'
  target.style.top = y*100/pHeight + '%'
  // update the posiion attributes
  target.setAttribute('data-x', x/pWidth);
  target.setAttribute('data-y', y/pHeight);
}

function activate(id) {
  $("#ms-placeholder").hide()
  $("#marker-properties").show() //first time

  if (id == "-1") {
    $("#marker-properties").hide();
    $("#ms-placeholder").show()
  }
  currentID = id
  $(".marker").removeClass("active")
  currentMarker = $("[data-id=" + id +"]")
  currentMarker.addClass("active")
  //Populate sound selector
  soundID = currentMarker.attr("data-sound-id")
  var dropDown = $("#sound-selector");
  dropDown.empty()
  $.each(soundLibrary, function(key, value) {
    dropDown.append($("<option />").val(key).text(value));
  });
  dropDown.val(soundID)
  dropDown.change(function() {
    needSave()
    newSoundID = $(this).val()
    currentMarker.attr("data-sound-id", newSoundID)
  })
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
}


function sureDelete() {
  if (confirm("Are you sure you want to delete the project?")) {
    $("#delete-form").submit()
  }

}
