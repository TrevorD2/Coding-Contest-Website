const socket = io("ws://localhost:3500")

//Declare variables
let username;
let room;
let time;
let problems;
let score = 0;
let solved = [];
let contestants;
let coundownInterval;

//Requests to join room if all info is present
function joinRoom(){
    const name = document.querySelector('#name-in')
    const room = document.querySelector('#room-in')

    if(name.value && room.value)
    {
        socket.emit("join-room", {
            name: name.value,
            room: room.value,
        })
    }
}

//Requests to create room if all info is present
function createRoom(){
    const name = document.querySelector('#name-in')
    const room = document.querySelector('#room-in')

    if(name.value && room.value)
    {
        socket.emit("create-room", {
            name: name.value,
            room: room.value,
        })
    }
}

//Save the results so they can be sent to the server
function saveResults(prob){
    if(!solved.includes(prob)){ //Make sure problem has not been completed before
        solved.push(prob);
        for(i in problems){
            if(problems[i].name==prob){
                score+=problems[i].points;
            }
        }
    }
}

//Starts timer and sends request to start
function startContest(){
    time = Number(document.querySelector("#duration-in").value)
    if(time){
        socket.emit("start-contest", hostProblems)
        loadPage("leaderboard.html")
        setTimeout(()=>{
            coundownInterval = setInterval(updateCountdown, 1000)
        }, 500)
    }   
}

//Stops timer and sends request to end
function endContest(){
    clearInterval(coundownInterval);
    socket.emit("end-contest", room);
}

//When client successfully joins or creates room
socket.on("sucessful-action", (data)=>{
    //Assign variables
    username = data.name
    room = data.room

    //Load respective page
    if(data.action=="create"){
        loadPage('contest-creator.html')
    }
    else{
        loadPage('lobby.html')
    }
})

//When server indicates that the contest has started
socket.on("contest-started", (newProblems) => {
    loadPage("contest.html") //Enter contest
    problems = newProblems //Assigns problems

    //Waits for page to load then adds problems for the contestants
    setTimeout(() => {
        const problemList = document.querySelector("#problem-select")

        for (let problem in problems){ 
            const option = document.createElement("option")
            option.value = problems[problem].name
            option.innerHTML = problems[problem].name
            problemList.appendChild(option)
        }
    }, 3000)
})

//When server asks for user data, compile and send data
socket.on("poll-request", ()=>{
    data = {
        name: username,
        room: room,
        score: score
    }
    socket.emit("results", data)
})

//After server compiles data, assign variable
socket.on("sent-data", (data)=>{
    contestants = data    
})

//When server confirms that the contest has ended
socket.on("contest-ended", ()=>{
    loadPage("leaderboard.html"); //Load leaderboard
}) 
