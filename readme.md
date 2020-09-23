# Dialogflow Delay Tester

Use this script to gather response and webhook delay information from Dialogflow.
This can be used to diagnose webhook delay issues and adjust your conversational design for delays. 
Results are saved to a CSV file for external analysis.

#### Input
`node dfdelay.js --project my-agent-projectid  --queries custom_queries.json --runs 10 --commands WelcomeEvent 15 Buy 600 . WelcomeEvent 10 Buy 14 Sell 15`

#### Output: results.csv
```$xslt
SessionId, timestamp, query, responseTimeMs, webhooktimeMs
2f538d5e-b5a8-4d29-af93-07d7729ec31e, 1600815123806, WelcomeEvent, 861, 194
2f538d5e-b5a8-4d29-af93-07d7729ec31e, 1600815139669, Buy, 793, 88
e6057528-2b18-42c2-8bb8-22c78ccd889a, 1600815518319, WelcomeEvent, 848, 143
e6057528-2b18-42c2-8bb8-22c78ccd889a, 1600815534172, Buy, 570, 50
b125db2b-5484-4b9c-bf32-91688ca0dd7f, 1600816134759, Sell, 580, 63
```

This projects uses the [Dialogflow NodeJS client](https://github.com/googleapis/nodejs-dialogflow) to 
send queries to a Dialogflow agent after a specified delay. 

## Installation
```
npm clone [this repo name]
npm install
```
See below for setting required environment variables.

## Dialogflow dependencies

Make sure the `GOOGLE_APPLICATION_CREDENTIAL` environment variable is set - i.e.
`export GOOGLE_APPLICATION_CREDENTIALS=your-df-agent-uuid-8dc0cd8a9c7c.json`

Make sure to obtain the project ID for your agent - i.e. `unit-converter-nyofsy`. This can be found in Google Cloud Console or 
under the *General* tab of Agent Settings in the Dialogflow console.

## Usage

### Query file setup
Queries are stored in queries.json or specified on the command line. The query format matches the `request.input` 
value passed to `sessionClient.detectIntent` in the [Dialogflow NodeJS client](https://github.com/googleapis/nodejs-dialogflow). 
The query should look something like:
```$xslt
[
  {
    "name":"WelcomeEvent",
    "query":{
      "event":{
        "name":"Welcome",
        "languageCode":"en-US"
      }
    }
  },
  {
    "name":"Buy",
    "query":{
      "text":{
        "text":"I would like to buy a widget",
        "languageCode":"en-US"
      }
    }
  
    
]
```
Events and text inputs are allowed. You can add contexts and any other valid `sessionClient.detectIntent` input. 
You must specify every intent you plan to use. 

## Commandline options

Use the `--commands` or `-c` to pass an series of query names followed by a number representing the amount of time 
to wait after the query has been sent. Use a period ( `.` ) after a wait time to start a new session instead of continuing the 
previously created one.

The script reads from this queries file and runs comments. 
The `--runs` option indicates the number of times the script should repeat.


### Example

Run the following 10 times:
1. Fire the `WelcomeEvent`
2. wait 15 seconds
3. Send the `Buy` query 
4. Wait 600 seconds
5. Start a new session
6. Fire the `WelcomeEvent`
7. Wait 10 seconds
7. Send the `Buy` query
8. Wait 14 seconds
9. Send the `Sell` query
19. Send Wait 15 seconds


`node dfdelay.js --project my-agent-projectid  --queries custom_queries.json --runs 10 --commands WelcomeEvent 15 Buy 600 . WelcomeEvent 10 Buy 14 Sell 15`



## ToDo
- Error checking - there's none of it
- Verify the queries named in the command string match the queries in the json file
- Form queries from the command line so the query.json isn't needed
