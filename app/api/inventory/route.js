import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Item from '@/models/Item';

export async function GET() {
    try {
        await connectDB();
        const items = await Item.find({}).sort({ createdAt: -1 });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        // Validate required fields
        if (!body.name || body.quantity === undefined || body.price === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if item with same name and price already exists (merge logic)
        // Using case-insensitive regex for name matching
        const existingItem = await Item.findOne({
            name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') },
            price: Number(body.price)
        });

        if (existingItem) {
            // Merge: add quantities
            existingItem.quantity = Number(existingItem.quantity) + Number(body.quantity);
            await existingItem.save();

            return NextResponse.json(
                existingItem,
                { status: 200 }
            );
        } else {
            // Create new item
            const newItem = await Item.create({
                name: body.name.trim(),
                quantity: Number(body.quantity),
                price: Number(body.price),
                threshold: Number(body.threshold) || 10,
            });

            return NextResponse.json(
                newItem,
                { status: 201 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

