
import mongoose, { Schema } from "mongoose"

const UserSchema = new Schema({
    username: { type: String, required: true, trim: true, max: 16, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "mod", "admin"], default: "user" },

    verified: { type: Boolean, default: false },
    verifyCode: { type: String },
    verifyExpires: { type: Date },
    resetCode: { type: String },
    resetExpires: { type: Date },
    
    energy: { type: Number, default: 200 },
    maxEnergy: { type: Number, default: 200 },
    energyPerHour: { type: Number, default: 20 },
    lastEnergyAt: { type: Date, default: Date.now },

    smiley: { type: Number, default: 1 },
    aura: { type: Number, default: 1 },

    ownedWorlds: { type: Map, default: { "1": 1 } },
    ownedSmileys: { type: [Number], default: [1,2,3,4,5,6,7,8,9,10] },
    ownedAuras: { type: [Number], default: [1] }
}, { timestamps: true })

export default mongoose.model("User", UserSchema)