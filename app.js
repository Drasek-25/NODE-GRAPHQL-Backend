const express = require("express");
const bodyParser = require("body-parser");
const graphqlhttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");

const Event = require("./models/event");

const app = express();

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
         //allows events to be found and returned
         events: () => {
            return Event.find()
               .then((events) => {
                  return events.map((event) => {
                     return { ...event._doc, _id: event.id };
                  });
               })
               .catch((err) => {
                  throw err;
               });
         },
         //allows incoming events to be added to DB
         createEvent: (args) => {
            const event = new Event({
               title: args.eventInput.title,
               description: args.eventInput.description,
               price: +args.eventInput.price,
               date: new Date(args.eventInput.date),
            });
            return event
               .save()
               .then((res) => {
                  console.log(res);
                  return { ...res._doc, _id: event.id };
               })
               .catch((err) => {
                  console.log(err);
                  throw err;
               });
         },
      },
      graphiql: true,
   })
);

// connecting the api to mongoDB atlas via mongoose
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
