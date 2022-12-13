const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");
const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    Population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
    *
    FROM 
        state;`;
  const stateArray = await database.all(getStatesQuery);
  response.send(
    stateArray.map((eachstate) => convertStateObjectToResponseObject(eachstate))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT 
      *
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`;

  const states = await database.get(getStateQuery);
  response.send(convertStateObjectToResponseObject(states));
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO
        district ( state_id, district_name, cases, cured, active, deaths )
    VALUES
        (${stateId}, '${districtName}', '${cases}', '${cured}','${active}' '${deaths}');`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
    *
    FROM 
        district
    WHERE 
        district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        district
    WHERE 
        district_id = ${districtId};`;
  await database.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
    UPDATE
        district
    SET
        district_name = ${districtName},
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};`;
  await database.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(death)
    FROM 
        district
    WHERE 
        state_id = ${stateId};`;
  const stats = await database.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeath: stats["SUM(death)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
        state_name
    FROM 
        district
    NATURAL JOIN
        state
    WHERE 
        district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  respose.send({ stateName: state.state_name });
});

module.exports = app;
