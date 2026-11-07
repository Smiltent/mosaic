
import mongoose, { Schema } from "mongoose"

const WorldSchema = new Schema({
    name: { type: String, required: true, trim: true, max: 32 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // world definition
    width: { type: Number },
    height: { type: Number },
    layers: { type: [[Number]], required: true },

    // world config
    
    /* ... */

    plays: { type: Number, defualt: 0 },
    likes: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.model("World", WorldSchema)