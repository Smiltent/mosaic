
import mongoose, { Schema } from "mongoose"

const WorldSchema = new Schema({
    name: { type: String, required: true, trim: true, maxlength: 32 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // world definition
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    type: { type: String, required: true },
    layers: { type: [Buffer], required: true },

    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.model("World", WorldSchema)