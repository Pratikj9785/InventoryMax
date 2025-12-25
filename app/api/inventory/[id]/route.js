import { NextResponse } from 'next/server';
import { getStore, setStore, updateItem, deleteItem, findItem } from '@/lib/inventory-store';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        
        const existingItem = findItem(id);
        
        if (!existingItem) {
            return NextResponse.json(
                { success: false, error: 'Item not found' },
                { status: 404 }
            );
        }
        
        // Prepare updates
        const updates = {
            ...body,
            updatedAt: new Date().toISOString(),
        };
        
        // Convert numeric fields
        if (body.quantity !== undefined) updates.quantity = Number(body.quantity);
        if (body.price !== undefined) updates.price = Number(body.price);
        if (body.threshold !== undefined) updates.threshold = Number(body.threshold);
        if (body.name !== undefined) updates.name = body.name.trim();
        
        const updatedItem = updateItem(id, updates);
        
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
        
        const deleted = deleteItem(id);
        
        if (!deleted) {
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

