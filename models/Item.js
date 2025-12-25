import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this item.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide the quantity.'],
        min: [0, 'Quantity cannot be negative'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide the price.'],
        min: [0, 'Price cannot be negative'],
    },
    threshold: {
        type: Number,
        default: 10,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
