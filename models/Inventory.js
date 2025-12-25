import 'server-only';
import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this item.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide the quantity.'],
        default: 0,
    },
    price: {
        type: Number,
        required: [true, 'Please provide the price.'],
    },
    threshold: {
        type: Number,
        default: 10,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
