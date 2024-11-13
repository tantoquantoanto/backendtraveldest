const mongoose = require("mongoose");
const bcrypt = require('bcrypt')

const UsersModel = new mongoose.Schema(
  {
    name: {
        type: String, 
        required:true
    },

    surname: {
        type: String, 
        required: true
    },

    username: {
      type: String,
      required: true,
      unique: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true, 
    },
    password: {
      type: String,
      required: true, 
      minLength: 8,
    },

    isActive: {
      type: Boolean,
      required: false

    },
    destinations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination"
    }],

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review', 
       
      }
    ],

    likedDestinations: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination"
    }],
    
    role: {
      type: String,
      enum: ['user', 'admin'], 
      default: 'user', 
    },
    img: {
      type: String,
      required: true

    },
  },
  { timestamps: true, strict: true }
);

UsersModel.pre('save', async function(next){
  const user = this;
  if (!user.isModified('password')) return next();

  try {
      const salt = await bcrypt.genSalt(10)

      user.password = await bcrypt.hash(user.password, salt)
      next()
  } catch (e) {
      next(e)
  }
})


module.exports = mongoose.model('User', UsersModel, 'users');