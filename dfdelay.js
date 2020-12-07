const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const fs = require('fs');
const yargs = require('yargs');

/**
 * Command-line parser
 */
let argv = yargs
    .usage('Usage: $0 --project projectID --commands WelcomeEvent 20 Directions 600')
    .alias('p', 'project')
    .describe('project', 'REQUIRED: specify a Dialogflow project')
    .demandOption(['p'])

    .alias('q', 'queries')
    .describe('queries', 'specify a query json file (default: query.json)')

    .alias('c', 'commands')
    .option('commands', {
        type: 'array',
        desc: 'Queries or delays to run. Use a period to start a new session'
    })
    .alias('o', 'output')
    .describe('output', 'specify an output csv file (default: results.csv)')

    .alias('r', 'runs')
    .describe('runs', 'the numbers of times to run (default: 1)')

    .epilog('see the readme.md for more information')
    .argv;

let availQueries = fs.readFileSync(argv.queries || 'queries.json');
availQueries = JSON.parse(availQueries);
// console.log(JSON.stringify(availQueries));

const projectId = argv.project;
let sessionId = uuid.v4();

/**
 * Send a query to the dialogflow agent, and return the query result.
 */
async function runSample(queryInput, newSession = true) {
    // A unique identifier for the given session
    if (newSession) {
        sessionId = uuid.v4();
        console.log(`new sessionId: ${sessionId}`);

    }

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);


    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: queryInput,
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    let webhookTime;
    if (result.diagnosticInfo && result.diagnosticInfo.fields && result.diagnosticInfo.fields.webhook_latency_ms)
        webhookTime = result.diagnosticInfo.fields.webhook_latency_ms.numberValue;
    return webhookTime;

}

// use await to pause execution
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}

// Main script function
async function start(runs, sessions) {
    for (let n = 0; n < runs; n++) {
        console.log(`run ${n + 1}`);

        //await sessions.forEach(async session => {
        for (let s in sessions) {
            session = sessions[s];
            let newSession = true;
            for (let r = 0; r <= session.length - 1; r += 2) {
                let queryName = session[r];
                let delay = session[r + 1];
                //console.log(`command: ${queryName}, delay: ${delay}`);

                let query = availQueries.find(q => q.name === queryName);
                let start = Date.now();
                let webhookTimer = await runSample(query.query, newSession);
                let finish = Date.now();
                let duration = finish - start;

                console.log(`${finish}: Name: ${query.name} | Total: ${duration} ms | Webhook ${webhookTimer} ms`);

                let results = `${sessionId}, ${start}, ${query.name}, ${duration}, ${webhookTimer}\n`;
                fs.appendFileSync(argv.output || 'results.csv', results);
                //console.log(query);
                newSession = false;

                console.log(`waiting for ${delay} seconds`);
                await sleep(delay);
            }
        }
    }
}


let runCommands = argv.commands || ['Welcome', 60 * 5];

// Separate commands into sessions
let sessions = [];
let session = [];

runCommands.forEach(command => {
    if (command === '.') {
        sessions.push(session);
        session = [];
    } else
        session.push(command);
});
sessions.push(session); // get the last one

// ToDo: check to make sure commands match what is actually in availQueries

start(argv.runs || 1, sessions)
    .then(() => console.log("Testing complete"))
    .catch(err => console.error(err));

