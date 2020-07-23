const express = require("express");
const bodyParser = require("body-parser");
const graphqlhttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

//all of the models are imported here
const Event = require("./models/event");
const User = require("./models/user");

const app = express();

app.use(bodyParser.json());

// ~ [Event!] means that this is a list([]) of type event(Event!) the (!) means that if values are inside of
//      the array, they must be events and ([]!)means it must return an array, empty or not.
// ~ createEvent(name: String): String  createEvent()is the add data function that needs 1 arguement(name:)
//      which will be a string(String), then it returns(:) a string(String)
// ~ rootValue stores our resolvers for our requests, they must be the same name as the schema called them
// ~ ID is a special type in graphql and the (!) means that it is required inside of the event type
// ~ input is a special type of data for how data must inputted for mutation
// ~ User password is not require because we will not ever want to return the password
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

         type User {
            _id: ID!
            email: String!
            password: String
         }

         input UserInput {
            email: String!
            password: String!
         }

         type RootQuery {
            events: [Event!]!
         }

         type RootMutation{
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
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
               creator: "5f19fa5a57a5c6154806aa34",
            });

            let createdEvent;
            //we must let express know we are performing async by using return
            //without return express will just finish this codeblock without waiting
            return event
               .save()
               .then((res) => {
                  createdEvent = { ...res._doc, _id: event.id };
                  return User.findById("5f19fa5a57a5c6154806aa34");
               })
               .then((user) => {
                  if (!user) {
                     throw new Error("User not found.");
                  }
                  user.createdEvents.push(event);
                  return user.save();
               })
               .then(() => {
                  return createdEvent;
               })
               .catch((err) => {
                  console.log(err);
                  throw err;
               });
         },
         createUser: (args) => {
            return User.findOne({ email: args.userInput.email })
               .then((user) => {
                  if (user) {
                     throw new Error("Email address exists already.");
                  }
                  // first hash arg is the password, second arg is number of times to salt
                  return bcrypt.hash(args.userInput.password, 12);
               })
               .then((hashedpw) => {
                  //args.userInput.email, args is all incoming data
                  //userInput referse that it is type userInput as defined in schema
                  //.email references that specific peice of info inside of userinput
                  const user = new User({
                     email: args.userInput.email,
                     password: hashedpw,
                  });
                  return user.save();
               })
               .then((res) => {
                  //this returns the item we created
                  //while overwriting the id with an appropriatly usable id
                  return { ...res._doc, password: null, _id: user.id };
               })
               .catch((err) => {
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
