const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
   email: {
      type: String,
      required: true,
   },
   password: {
      type: String,
      required: true,
   },
   createdEvents: [
      {
         type: Schema.Types.ObjectId,
         //called 'Event' because the model for events is named such
         // a similar ref is added to Event to tie them together
         ref: "Event",
      },
   ],
});

module.exports = mongoose.model("User", userSchema);
