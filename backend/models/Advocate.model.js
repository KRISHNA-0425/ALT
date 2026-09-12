import mongoose from "mongoose";

const advocateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    userID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^ADV\d{5}$/, "User ID must be in format ADV followed by a 5-digit number (e.g. ADV12345)"],
    },

    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },

    casesTaken: {
      type: Number,
      required: true,
      min: 0,
    },

    casesWon: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.casesTaken;
        },
        message: "Cases won cannot be greater than cases taken.",
      },
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "POCSO",
        "Murder",
        "Rape",
        "Harassment",
        "Assault",
        "Domestic Violence",
        "Cyber Crime",
        "Fraud & Cheating",
        "Property Dispute",
        "Narcotics",
        "White-Collar Crime",
        "Juvenile Justice",
        "Constitutional Law",
        "Family Law",
        "Labour Dispute",
        "Motor Accident Claims",
      ],
    },

    practiceCourt: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      default: "Delhi",
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

const Advocate = mongoose.models.Advocate || mongoose.model("Advocate", advocateSchema);

export default Advocate;
