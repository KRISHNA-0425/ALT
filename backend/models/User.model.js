import mongoose from 'mongoose';

export const ALLOWED_ROLES = ["ADM", "OR", "SLC", "ADV", "LC", "DEV"];

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        maxLength: 25,
        trim: true,
    },
    userID: {
        type: String,
        required: true,
        maxLength: 25,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    roles: {
        type: String,
        enum: ALLOWED_ROLES,
        default: "OR",
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
},
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;