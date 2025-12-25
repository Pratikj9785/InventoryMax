import dbConnect from '@/lib/db';
import Inventory from '@/models/Inventory';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    await dbConnect();
    const { id } = await params; // Next.js 15+ params are promises? Or standard. Safe to await.

    try {
        const body = await req.json();
        const item = await Inventory.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!item) {
            return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ ...item._doc, id: item._id.toString() });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    await dbConnect();
    const { id } = await params;

    try {
        const deletedItem = await Inventory.deleteOne({ _id: id });
        if (!deletedItem) {
            return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
