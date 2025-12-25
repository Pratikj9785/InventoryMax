import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Item from '@/models/Item';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        await connectDB();

        // Prepare updates
        const updates = {};

        // Convert numeric fields and validate
        if (body.quantity !== undefined) updates.quantity = Number(body.quantity);
        if (body.price !== undefined) updates.price = Number(body.price);
        if (body.threshold !== undefined) updates.threshold = Number(body.threshold);
        if (body.name !== undefined) updates.name = body.name.trim();

        const updatedItem = await Item.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return NextResponse.json(
                { success: false, error: 'Item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedItem);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const deletedItem = await Item.findByIdAndDelete(id);

        if (!deletedItem) {
            return NextResponse.json(
                { success: false, error: 'Item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

