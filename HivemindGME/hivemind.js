const channel_id = 'jegnoPBweXwNxzew';
var drone;
var room;
var roomname;
var username;
var membersArray = [];
var mode = "question";

function joinRoom() {
  if (document.getElementById("userNameField").value == "") {
    document.getElementById("usernameIsRequired").hidden = false;
  } else {
    drone = new ScaleDrone(channel_id, {
      data: {
        username: document.getElementById("userNameField").value,
      }
    });
    username = document.getElementById("userNameField").value;
    document.getElementById("usernameIsRequired").hidden = true;
    room = drone.subscribe("observable-" + document.getElementById("roomNameField").value);
    roomname = document.getElementById("roomNameField").value;
    room.on('members', function(members) {
      membersArray = members;
      updateMembers();
    });
    room.on('open', error => {
      if (error) {
        console.log(error);
        leaveRoom();
        alert("Error joining room");
      }
      room.on('message', message => onMessage(message));
      room.on('member_join', function(member) {
        membersArray.push(member);
        updateMembers();
      });
      room.on('member_leave', function(leavingMember) {
        membersArray = membersArray.filter(
          member => member.clientData.username != leavingMember.clientData.username);
        updateMembers();
      });
      onConnect();
    });
  }
}

function leaveRoom() {
  room.unsubscribe();
  drone.close();
  drone = null;
  room = null;
  username = null;
  document.getElementById("questionsAndAnswers").innerHTML = "";
  document.getElementById("preJoinControls").hidden = false;
  document.getElementById("postJoinControls").hidden = true;
  document.getElementById("roomNameField").value = ""
}

function onConnect() {
  document.getElementById("preJoinControls").hidden = true;
  document.getElementById("postJoinControls").hidden = false;
  document.getElementById("roomNameOutput").textContent = "\"" + roomname + "\"";
  onNewMode();
}

function updateMembers() {
  document.getElementById("usersConnectedOutput").innerHTML = "";
  var name = membersArray[0].clientData.username;
  var textnode = document.createTextNode(name);
  document.getElementById("usersConnectedOutput").appendChild(textnode);
  if (membersArray.length > 1) {
    for (var i = 1; i < membersArray.length; i++) {
      var name = membersArray[i].clientData.username;
      var textnode = document.createTextNode(", " + name);
      document.getElementById("usersConnectedOutput").appendChild(textnode);
    }
  }
}

function onMessage(message) {
  var data = message.data;
  if (data.type == "question") {
    onQuestion(data);
  } else {
    onAnswer(data);
  }
}

function onQuestion(data) {
  var Pnode = document.createElement("P");
  var Strongnode = document.createElement("Strong");
  var textnode = document.createTextNode("Question:\xa0\xa0\xa0\xa0");
  Strongnode.appendChild(textnode);
  Pnode.appendChild(Strongnode);
  var textnode = document.createTextNode(data.messageText);
  Pnode.appendChild(textnode);
  document.getElementById("questionsAndAnswers").appendChild(Pnode);
  var elem = document.getElementById('questionsAndAnswers');
  elem.scrollTop = elem.scrollHeight;
  switchMode();
}

function onAnswer(data) {
  var Pnode = document.createElement("P");
  var Strongnode = document.createElement("Strong");
  var textnode = document.createTextNode("Answer:\xa0\xa0");
  Strongnode.appendChild(textnode);
  Pnode.appendChild(Strongnode);
  var textnode = document.createTextNode(data.messageText);
  Pnode.appendChild(textnode);
  document.getElementById("questionsAndAnswers").appendChild(Pnode);
  var elem = document.getElementById('questionsAndAnswers');
  elem.scrollTop = elem.scrollHeight;
  switchMode();
}

function sendQuestion() {
  questionText = document.getElementById("questionField").value;
  if (questionText.charAt(questionText.length - 1) != '?') {
    questionText = questionText.concat("?");
  }
  var message = {
    type: "question",
    messageText: questionText
  };
  drone.publish({
    room: room.name,
    message: message
  });
  document.getElementById("questionField").value = "";
}

function sendAnswer() {
  var message = {
    type: "answer",
    messageText: document.getElementById("answerField").value
  };
  drone.publish({
    room: room.name,
    message: message
  });
  document.getElementById("answerField").value = "";
}

function switchMode() {
  if (mode == "question") {
    mode = "answer";
  } else {
    mode = "question";
  }
  onNewMode();
}

function onNewMode() {
  if (mode == "question") {
    document.getElementById("logColumn").style.border = "1px green solid";
    document.getElementById("controlsColumn").style.border = "1px #bdbdbd solid";
    document.getElementById("questionField").disabled = false;
    document.getElementById("questionEnterButton").disabled = false;
    document.getElementById("answerField").disabled = true;
    document.getElementById("answerEnterButton").disabled = true;
    document.getElementById("questionField").focus();
  } else {
    document.getElementById("controlsColumn").style.border = "1px green solid";
    document.getElementById("logColumn").style.border = "1px #bdbdbd solid";
    document.getElementById("questionField").disabled = true;
    document.getElementById("questionEnterButton").disabled = true;
    document.getElementById("answerField").disabled = false;
    document.getElementById("answerEnterButton").disabled = false;
    document.getElementById("answerField").focus();
  }
}

document.addEventListener('keyup', (e) => {
  if (e.code === "Enter") {
    if (mode == "question") {
      sendQuestion();
    } else {
      sendAnswer();
    }
  }
});
