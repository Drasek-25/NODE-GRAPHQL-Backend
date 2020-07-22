const express = require("express");
const bodyParser = require("body-parser");
const graphqlhttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const app = express();

const events = [];

app.use(bodyParser.json());

// ~ [Event!] means that this is a list([]) of type event(Event!) the (!) means that if values are inside of
//      the array, they must be events and ([]!)means it must return an array, empty or not.
// ~ createEvent(name: String): String  createEvent()is the add data function that needs 1 arguement(name:)
//      which will be a string(String), then it returns(:) a string(String)
// ~ rootValue stores our resolvers for our requests, they must be the same name as the schema called them
// ~ ID is a special type in graphql and the (!) means that it is required inside of the event type
// ~ input is a special type of data for how data must inputted for mutation
app.use(
   "/graphql",
   graphqlhttp({
      schema: buildSchema(` 
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        type RootQuery {
            events: [Event!]!
        }

        type RootMutation{
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }`),
      rootValue: {
         events: () => {
            return events;
         },
         createEvent: (args) => {
            const event = {
               _id: Math.random().toString(),
               title: args.eventInput.title,
               description: args.eventInput.description,
               price: +args.eventInput.price,
               date: new Date().toISOString(),
            };
            events.push(event);
            return event;
         },
      },
      graphiql: true,
   })
);

mongoose
   .connect(
      `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@eventspagegraphql.74paq.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`
   )
   .then(() => {
      app.listen(8080);
      console.log("Server live on port 8080");
   })
   .catch((err) => {
      console.log(err);
   });
