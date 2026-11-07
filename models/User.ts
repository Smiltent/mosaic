
import mongoose, { Schema } from "mongoose"

const UserSchema = new Schema({
    username: { type: String, required: true, trim: true, max: 16, unique: true },
    password: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "mod", "admin"], defualt: "user" },
    
    energy: { type: Number, default: 200 },
    maxEnergy: { type: Number, default: 200 },
    energyPerHour: { type: Number, default: 20 },

    smiley: { type: Number, defualt: 1 },
    aura: { type: Number, default: 1 },

    ownedSmileys: { type: [Number], default: [1,2,3,4,5,6,7,8,9,10] },
    ownedAuras: { type: [Number], default: [1] }
}, { timestamps: true })

export default mongoose.model("User", UserSchema)