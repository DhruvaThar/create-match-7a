const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const pathDB = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;
initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: pathDB,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDetailsResponse = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

const convertMatch = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};

// API 1

app.get("/players/", async (request, response) => {
  const playersQuery = `
    SELECT 
    *
    FROM player_details;`;
  const allPlayers = await db.all(playersQuery);
  response.send(allPlayers.map((each) => convertPlayerDetailsResponse(each)));
});

// API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};`;
  const output = await db.get(Query);
  response.send({
    playerId: output.player_id,
    playerName: output.player_name,
  });
});

// API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const Query = `
    UPDATE player_details
    SET 
    player_name = "${playerName}"
    WHERE player_id = ${playerId};`;
  const output = await db.run(Query);
  response.send("Player Details Updated");
});

// API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const Query = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const output = await db.get(Query);
  response.send({
    matchId: output.match_id,
    match: output.match,
    year: output.year,
  });
});

// API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT * FROM
    match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;
  const output = await db.all(Query);
  response.send(output.map((each) => convertMatch(each)));
});

// API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const Query = `
    SELECT player_details.player_id,
    player_details.player_name
    FROM player_details INNER JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId};`;
  const output = await db.all(Query);
  response.send(output.map((each) => convertPlayerDetailsResponse(each)));
});

// API 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT 
    player_match_score.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_details LEFT JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const output = await db.get(Query);
  response.send(output);
});

module.exports = app;
