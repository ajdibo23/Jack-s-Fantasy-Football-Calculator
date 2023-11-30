//(Average PPG/Average Past Def Rank) x 16 = Expected Past PPG (EPPPG)
//(EPPPG) (Average Future Def Rank) / 16 = Expected Future PPG
//PPG -> Points Per Game
//EPPPG -> Expected Past Points Per Game
//https://www.cbssports.com/fantasy/football/stats/posvsdef/RB/ALL/avg/standard
const stateToTeam = {
    "Arizona": "Cardinals",
    "Atlanta": "Falcons",
    "Baltimore": "Ravens",
    "Buffalo": "Bills",
    "Carolina": "Panthers",
    "Chicago": "Bears",
    "Cincinnati": "Bengals",
    "Cleveland": "Browns",
    "Dallas": "Cowboys",
    "Denver": "Broncos",
    "Detroit": "Lions",
    "Green Bay": "Packers",
    "Houston": "Texans",
    "Indianapolis": "Colts",
    "Jacksonville": "Jaguars",
    "Kansas City": "Chiefs",
    "Las Vegas": "Raiders",
    "L.A. Rams": "Rams",
    "L.A. Chargers": "Chargers",
    "Miami": "Dolphins",
    "Minnesota": "Vikings",
    "New England": "Patriots",
    "New Orleans": "Saints",
    "N.Y. Giants": "Giants",
    "N.Y. Jets": "Jets",
    "Philadelphia": "Eagles",
    "Pittsburgh": "Steelers",
    "San Francisco": "49ers",
    "Seattle": "Seahawks",
    "Tampa Bay": "Buccaneers",
    "Tennessee": "Titans",
    "Washington": "Commanders"
};
let team = "";
let player = "";
let position = "";
let pastGames = [];
let futureGames = [];
let pastTeamNames = [];
let futureTeamNames = [];
let ppg = 0;
async function teamSelectedButton() {
    if (document.getElementById("players") != null) {
        document.getElementById("players").remove();
    }
    team = document.getElementById("team").value;
    document.getElementById("nextButton1").remove();
    fetch('https://www.cbssports.com/nfl/teams/' + team + '/roster/')
        .then(res => res.text()).then(data => {
            data = data.split('"athlete":[{')[1];
            data = "[{" + data;
            data = data.split('"}]}')[0];
            data = data + '"}]';
            data = JSON.parse(data);
            let select = document.createElement("select");
            select.id = "players";
            document.getElementById("options").appendChild(select);
            data.forEach(element => {
                let option = document.createElement("option");
                option.value = element.url;
                option.text = element.name;
                document.getElementById("players").appendChild(option);
            });
            let button = document.createElement("button");
            button.id = "nextButton2";
            button.innerHTML = "Next";
            button.onclick = playerSelectedButton;
            document.getElementById("options").appendChild(button);
        });
};

async function playerSelectedButton() {
    document.getElementById("loading").style.display = "block";
    player = document.getElementById("players").value.split("/")[4].split("/")[0];
    fetch("https://www.cbssports.com" + document.getElementById("players").value + "fantasy/")
        .then(res => res.text()).then(data => {
            if (data.includes("Whoops! It looks like this page has been moved or deleted.")) {
                alert("This player does not have any stats (or an otherwise unknown error occured).");
            } else {
                let parser = new DOMParser();
                let doc = parser.parseFromString(data, "text/html");
                position = doc.querySelector('.PageTitle-description').innerHTML.toString().split(' • ')[2].split('\n')[0];
                let table = doc.querySelectorAll('table')[2];
                let row = table.querySelectorAll('tr')[2];
                if (row.querySelectorAll('td')[8]) {
                    let col = row.querySelectorAll('td')[8];
                    if (col.children[0].innerHTML) {
                        ppg = parseFloat(col.children[0].innerHTML);
                        getSchedule();
                    } else {
                        alert("an unknown error occured (please try again)");
                    }
                } else {
                    let col = row.querySelectorAll('td')[7];
                    if (col.children[0].innerHTML) {
                        ppg = parseFloat(col.children[0].innerHTML);
                        getSchedule();
                    } else {
                        alert("an unknown error occured (please try again)");
                    }
                }
            }
        });
}

async function getSchedule() {
    fetch('https://www.cbssports.com/nfl/teams/' + team + '/schedule/')
        .then(res => res.text()).then(data => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(data, "text/html");
            let futureTable = doc.querySelectorAll('table')[2];
            let futureRows = futureTable.querySelectorAll('tr');
            let pastTable = doc.querySelectorAll('table')[1];
            let pastRows = pastTable.querySelectorAll('tr');
            for (let q = 0; q < pastRows.length; q++) {
                let element = pastRows[q];
                if (q == 0) {
                    continue;
                }
                let col = element.querySelectorAll('td')[2];
                if ((!col) || (!col.querySelectorAll('a')[1]) || (col.children[0].innerHTML == "BYE")) {
                    continue;
                } else {
                    let teamName = col.querySelectorAll('a')[1].innerHTML;
                    pastTeamNames.push(stateToTeam[teamName]);
                }
            };
            for (let q = 0; q < futureRows.length; q++) {
                let element = futureRows[q];
                if (q == 0) {
                    continue;
                }
                let col = element.querySelectorAll('td')[2];
                if ((!col) || (!col.querySelectorAll('a')[1]) || col.children[0].innerHTML == "BYE") {
                    continue;
                } else {
                    let teamName = col.querySelectorAll('a')[1].innerHTML;
                    futureTeamNames.push(stateToTeam[teamName]);
                }
            };
            getOtherThings();
        });
}

async function getOtherThings() {
    //sort https://www.cbssports.com/fantasy/football/stats/posvsdef/RB/ALL/avg/standard by player type
    //check players game log (get rank of those teams from the website above)
    //add all ranks together then divide by number of games (dont include by weeks)
    //then do (ppg / average rank)*16 which becomes the epppg
    //multiply epppg by average future rank... //get ranks for teams for/from future games
    //then average it out and multiply by epppg
    //then divide by 16 to get the final answer
    fetch('https://www.cbssports.com/fantasy/football/stats/posvsdef/' + position + '/ALL/avg/standard')
        .then(res => res.text()).then(data => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(data, "text/html");
            let table = doc.querySelectorAll('table')[0];
            let rows = table.querySelectorAll('tr');
            let numbersToAddPast = [];
            let numbersToAddFuture = [];
            for (let q = 3; q < rows.length; q++) {
                let rank = rows[q].querySelectorAll('td')[0].innerHTML;
                let team = rows[q].querySelectorAll('td')[1].querySelectorAll('a')[0].innerHTML.toString().split(' vs ')[1];
                if (pastTeamNames.includes(team)) {
                    if (pastTeamNames.filter(x => x == team).length > 1) {
                        for (let w = 0; w < pastTeamNames.filter(x => x == team).length; w++) {
                            numbersToAddPast.push(parseInt(rank));
                        }
                    } else {
                        numbersToAddPast.push(parseInt(rank));
                    }
                }
                if (futureTeamNames.includes(team)) {
                    if (futureTeamNames.filter(x => x == team).length > 1) {
                        for (let w = 0; w < futureTeamNames.filter(x => x == team).length; w++) {
                            numbersToAddFuture.push(parseInt(rank));
                        }
                    } else {
                        numbersToAddFuture.push(parseInt(rank));
                    }
                }
            }
            let averagePast = 0;
            let averageFuture = 0;
            numbersToAddPast.forEach(element => {
                averagePast += element;
            });
            numbersToAddFuture.forEach(element => {
                averageFuture += element;
            });
            averagePast = averagePast / numbersToAddPast.length;
            averageFuture = averageFuture / numbersToAddFuture.length;
            let epppg = (ppg / averagePast) * 16;
            let expectedFuturePPG = (epppg * averageFuture);
            let finalAnswer = expectedFuturePPG / 16;
            finalAnswer = finalAnswer.toFixed(2);
            if (document.getElementById("answer") != null) {
                document.getElementById("answer").remove();
            }
            let answer = document.createElement("h1");
            answer.id = "answer";
            answer.innerHTML = "Expected Future Points Per Game: " + finalAnswer;
            document.getElementById("options").appendChild(answer);
            document.getElementById("loading").style.display = "none";
            let button = document.createElement("button");
            button.id = "resetButton";
            button.innerHTML = "Reset";
            button.onclick = resetButton;
            document.getElementById("options").appendChild(button);
        });
}

document.getElementById("team").addEventListener("change", function () {

});

async function resetButton() {
    team = "";
    player = "";
    position = "";
    pastGames = [];
    futureGames = [];
    pastTeamNames = [];
    futureTeamNames = [];
    ppg = 0;
    if (document.getElementById("players") != null) {
        document.getElementById("players").remove();
    }
    if (document.getElementById("nextButton2") != null) {
        document.getElementById("nextButton2").remove();
    }
    if (document.getElementById("answer") != null) {
        document.getElementById("answer").remove();
    }
    if (document.getElementById("nextButton1") != null) {
        document.getElementById("nextButton1").remove();
    }
    let button = document.createElement("button");
    button.id = "nextButton1";
    button.innerHTML = "Next";
    button.onclick = teamSelectedButton;
    document.getElementById("options").appendChild(button);
    if (document.getElementById("resetButton") != null) {
        document.getElementById("resetButton").remove();
    }
}