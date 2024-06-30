import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

//Create express server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
});

//Store data for all contests
const contestData = new Map();

//Gets last item in set
function getLastItem(set){
    let value;
    for(value of set);
    return value;
}

//Gets first item in set
function getFistItem(set){
    let value;
    for(value of set){return value;}
}

//Checks if username is repeated in given room
function repeatUsername(name, room){
    let roomData = contestData.get(room);
    for(let i in roomData){
        if(roomData[i].name==name){return true;}
    }
    return false;
}

//When socket connects to server
io.on("connection", (socket) => {
    //If socket asks to join room, check if data is valid and reply if so
    socket.on("join-room", (data)=>{
        if(!(io.sockets.adapter.rooms.get(data.room)))
            console.log(`${data.room} does not exist`);
        else if(repeatUsername(data.name, data.room))
            console.log(`User with username '${data.name}' already exists`);
        else
        {
            socket.join(data.room);
            
            //Add user to contestData with score 0
            contestData.get(data.room).push({
                name: data.name,
                score: 0
            });
            socket.emit("sucessful-action", {name: data.name, room: data.room, action: "join"});
        }
    })
    
    //If socket asks to create room check if data is valid and reply if so
    socket.on("create-room", (data)=>{
        if(io.sockets.adapter.rooms.get(data.room))
            console.log(`${data.room} already exists`);
        else
        {
            socket.join(data.room);
            contestData.set(data.room, []); //Creates new entry in contestData
            socket.emit("sucessful-action", {name: data.name, room: data.room, action: "create"});
        }
        
    })

    //When host requests for contest to start
    socket.on("start-contest", (problems)=>{
        const room = getLastItem(socket.rooms);
        const host = getFistItem(socket.rooms);

        io.to(room).except(host).emit("contest-started", problems); //Send request to all contestants
    })

    //If data needed for leaderboard update
    socket.on("request-data", (room)=>{
        io.to(room).emit("poll-request"); //Ask all users
        setTimeout(() => {
            //Compiles data and sends it back
            let data = contestData.get(room);
            socket.emit("sent-data", data);
        }, 1000);
    })

    //When user submit results, update data accordingly
    socket.on("results", (data)=>{
        let roomData = contestData.get(data.room);
        
        for(let i in roomData){
            if(roomData[i].name==data.name){
                roomData[i].score = data.score;
                break;
            }
        }
    })

    //When contest ends, send notification to users
    socket.on("end-contest", (room)=>{
        io.to(room).emit("contest-ended");
    })
    
});

//Set server to listen on Port 3500
httpServer.listen(3500, ()=>{
    console.log("Server listening on port 3500");
});