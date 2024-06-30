//Get output window
var outputElement = document.getElementById('output');

//Get API object to send requests to Piston API
const API = axios.create({
    baseURL: "https://emkc.org/api/v2/piston",
});

//Executes code written in the editor given stdin
async function executeCode(stdin){
    try {
        //Get version
        const version = await extractLanguageVersion($("#languages").val());

        //Send API call to execute the code with appropriate data
        const response = await API.post("/execute", {
            language: $("#languages").val(),
            version: version,
            files: [
                {
                    content: editor.getValue(),
                },
            ],
            stdin: stdin,
        });

        return response;
    } catch (error) {
        //Handle and display any errors from the request
        if (error.response) {
            //Server responded with a status other than 2xx
            outputElement.textContent = `Error: ${error.response.data.message || error.response.statusText}`;
        } else if (error.request) {
            //Request was made but no response was received
            outputElement.textContent = 'Error: No response received from the server.';
        } else {
            //Something happened in setting up the request
            outputElement.textContent = `Error: ${error.message}`;
        }  
    }
    return null;
}

function displayResponse(response)
{
    //Extract and display only the stdout from the response
    if (response.data.run.stdout) {
        //stdout
        addToOutput(response.data.run.stdout)
    } else if (response.data.run.stderr) {
        //Error occured in client code
        addToOutput(`Error: ${response.data.run.stderr}`)
    } else {
        addToOutput('No output received.')
    }
}

//Submits code against private TCs
async function submitCode(){
    let submissionState = true

    clearOutput()
    let testcases;
    const curProblem = $("#problem-select").val()

    let prob=0
    for(prob in problems){
        if(problems[prob].name==curProblem){
            testcases=problems[prob].privateTC
            break
        }
    }

    let data = parseTCs(testcases)
    let tcs = data[0]
    let ans = data[1]

    let i=0;
    for(i in tcs){
        addToOutput(`Master TC: ${i}\n`)
        try {
            const result = await executeCode(tcs[i]);  //Wait for executeCode() to complete and return its result

            //If answer is correct, continue to next testcase
            if(result.data.run.stdout&&(result.data.run.stdout).toString().trim()==ans[i].toString()){continue}

            //Else, display the testcase, output, and expected value
            addToOutput(`Testcase Failed\n${tcs[i]}`)
            addToOutput(`Expected: ${ans[i]}`)

            if(result.data.run.stdout){
                addToOutput(`Got: ${result.data.run.stdout}`)
            } else if (result.data.run.stderr) {
                //Error occured in client code
                addToOutput(`Got: Error: ${result.data.run.stderr}`)
            } else {
                addToOutput('Got: No output received.')
            }
            submissionState = false
            break
        } catch (error) {
            //Handle any errors from executeCode() or displayResponse()
            console.error('Error in runCode:', error);
        }
    }
    //If all TCs were passed, save the data to be sent to server
    if(submissionState){
        addToOutput("Problem passed!")
        saveResults(problems[prob].name)
    }
}

//Run code against public TCs
async function runCode(){
    clearOutput()
    let testcases;
    const curProblem = $("#problem-select").val()
    for(let prob in problems){
        if(problems[prob].name==curProblem){
            testcases=problems[prob].publicTC
            break
        }
    }
    let data = parseTCs(testcases)
    let tcs = data[0]
    let ans = data[1]
    for(i in tcs){
        addToOutput(`TC: ${tcs[i]}\n`)
        try {
            const result = await executeCode(tcs[i]);  //Wait for executeCode() to complete and return its result
            displayResponse(result);  //Pass the actual response object to displayResponse()
        } catch (error) {
            //Handle any errors from executeCode() or displayResponse()
            console.error('Error in runCode:', error);
        }
        addToOutput(`Expected:\n${ans[i]}`)
    } 
}

//Convert TCs from (TC:Ans) to seperate lists
function parseTCs(TCs){
    tclist = TCs.split(",")
    let answers = []
    let newtcs = []
    for(i in tclist){
        data = tclist[i].split(":")
        tc = data[0]
        ans = data[1]
        newtcs.push(tc)
        answers.push(ans)
    }
    return [newtcs, answers]
}

//Gets Piston language version based on input language
async function extractLanguageVersion(inputLanguage){
    const { data: languages } = await API.get("/runtimes");

    for (const lang of languages) {
        if (lang.language === inputLanguage || (lang.aliases && lang.aliases.includes(inputLanguage))) {
          return lang.version;
        }
      }
    return null;
}
