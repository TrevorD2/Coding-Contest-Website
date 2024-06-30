//Variables to control leaderboard timing and updates
var timerId;
var updateInterval = 2000;

//Inform the user that user state is not saved before page unloads
window.addEventListener('beforeunload', function (event) {
    const message = "Warning: refreshing the page will result in your user state being canceled.";
    return message;
});

//Load designated page
function loadPage(page){
    $('#home-main').load(page, function(response, status, xhr) {
        if (status === "error") {
            console.log("Error loading page: " + xhr.status + " " + xhr.statusText);
        }
    });
}

//Add text to output window in the editor
function addToOutput(text){
    const li = document.createElement("li");
    li.textContent = text;
    outputElement.appendChild(li);
}

//Clears output window
function clearOutput(){
    while (outputElement.firstChild) {
        outputElement.removeChild(outputElement.lastChild);
    }
}

//Opens TC panel
function openTCPanel(){
    document.getElementById('TC-panel').style.display='block';
    const input = document.getElementById('TC-editor');
    const prob = $("#problem-select").val();

    for(i in problems){
        if(problems[i].name==prob){
            input.value=problems[i].publicTC;
            break;
        }
    }
}

//Closes TC panel
function closeTCPanel(){
    document.getElementById('TC-panel').style.display='none';
}

//Saves user input for TCs
function saveTCs(){
    const input = document.getElementById('TC-editor');
    const prob = $("#problem-select").val();

    for(i in problems){
        if(problems[i].name==prob){
            problems[i].publicTC = input.value;
            break;
        }
    }
    closeTCPanel();
}

//Update timer and time
function updateCountdown(){
    if(time<=0){endContest();} //If time is up, request to end contest
    let seconds = time%60;
    let minutes = Math.floor(time/60);
    let hours = Math.floor(minutes/60);
    minutes%=60;

    if(seconds<10){seconds = `0${seconds}`;}
    if(minutes<10){minutes = `0${minutes}`;}
    if(hours<10){hours = `0${hours}`;}

    timer.innerHTML = `${hours}:${minutes}:${seconds}`;

    time--;
}

//Used to sort contestants by score
function ascending(a, b) {
    return b.score-a.score;
}

//Repositions board rows
function reposition() {
    var height = $("#rankings .contestant").height();
    var y = height;
    for (var i = 0; i < contestants.length; i++) {
        if (contestants[i].$item) {
            contestants[i].$item.css("top", y + "px");
            y += height;
        }
    }
}

//Updates rankings
function updateRanks(contestants) {
    for (var i = 0; i < contestants.length; i++) {
        if (contestants[i].$item) {
            contestants[i].$item.find(".rank").text(i + 1);
        }
    }
}

//Renders board
function renderBoard() {
    var $list = $("#rankings");
    $list.empty();  //Clear the existing contestants

    //Reconstructs board based on contestants
    for (var i = 0; i < contestants.length; i++) {
        var $item = $(
            "<tr class='contestant'>" +
            "<th class='rank'>" + (i + 1) + "</th>" +
            "<td class='name'>" + contestants[i].name + "</td>" +
            "<td class='score'>" + contestants[i].score + "</td>" +
            "</tr>"
        );
        contestants[i].$item = $item;
        $list.append($item);
    }
}

//Loads board
function loadBoard() {
    socket.emit("request-data", room); //Request for data update

    //When data recieved
    socket.on("sent-data", (data) => {
        contestants = data;  //Update the contestants array with received data

        if (timerId !== undefined) {
            clearInterval(timerId);
        }

        //Sort contestants before rendering them
        contestants.sort(ascending);
        console.log(contestants)
        renderBoard();
        updateRanks(contestants);
        reposition();

        //Set interval to periodically request data and update the board
        timerId = setInterval(() => {
            socket.emit("request-data", room);
        }, updateInterval);
    });

    //Additional handling for data received in setInterval
    socket.on("sent-data", (data) => {
        contestants = data;
        contestants.sort(ascending);
        renderBoard();
        updateRanks(contestants);
        reposition();
    });
}