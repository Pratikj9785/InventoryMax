import dbConnect from '@/lib/db';
import Inventory from '@/models/Inventory';
import { NextResponse } from 'next/server';

export async function GET() {
    await dbConnect();
    try {
        const items = await Inventory.find({});
        // Transform _id to id for frontend compatibility if needed, 
        // or frontend adapts. Let's make frontend adapt or map it here.
        // Mongoose returns _id. Frontend expects id?
        // Let's return as is, and update frontend to handle _id or map it.
        // Ideally map it to keep frontend stable.
        const validItems = items.map(doc => ({
            ...doc._doc,
            id: doc._id.toString(),
        }));
        return NextResponse.json(validItems);
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();

        // specific logic to merge items if name matches (case-insensitive) AND price matches
        // from original server.js logic
        const existingItem = await Inventory.findOne({
            name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') },
            price: body.price
        });

        if (existingItem) {
            // meaningful merge: add quantities
            const newQuantity = Number(existingItem.quantity) + Number(body.quantity);
            existingItem.quantity = newQuantity;
            await existingItem.save();
            return NextResponse.json({ ...existingItem._doc, id: existingItem._id.toString() });
        } else {
            const newItem = await Inventory.create(body);
            return NextResponse.json({ ...newItem._doc, id: newItem._id.toString() }, { status: 201 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
