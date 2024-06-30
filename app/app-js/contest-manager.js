//Variable to store host's problems
const hostProblems = [];

//Adds problem to hostProblems given inputs
function addProblem(){
    const probName = document.querySelector("#problem-name-in").value
    const probDesc = document.querySelector("#problem-desc-in").value
    const publicTC = document.querySelector("#public-TC-in").value
    const privateTC = document.querySelector("#private-TC-in").value
    const points = document.querySelector("#point-value-in").value

    if(probName&&probDesc&&privateTC&&points){ //Ensure all essential info is present
        hostProblems.push({
            name: probName,
            description: probDesc,
            publicTC: publicTC,
            privateTC: privateTC,
            points: Number(points)
        })

        const li= document.createElement("li")
        li.textContent = probName
        document.querySelector("#problem-list").appendChild(li)
    }
}

