import { NextResponse } from 'next/server';
import { getStore, setStore, addItem, findItemIndex } from '@/lib/inventory-store';

export async function GET() {
    try {
        const store = getStore();
        return NextResponse.json(store);
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

        const store = getStore();
        
        // Check if item with same name and price already exists (merge logic)
        const existingItemIndex = findItemIndex(
            item => item.name.toLowerCase().trim() === body.name.toLowerCase().trim() &&
                    item.price === Number(body.price)
        );

        if (existingItemIndex !== -1) {
            // Merge: add quantities
            const existingItem = store[existingItemIndex];
            existingItem.quantity = Number(existingItem.quantity) + Number(body.quantity);
            existingItem.updatedAt = new Date().toISOString();
            
            // Update store
            store[existingItemIndex] = existingItem;
            setStore(store);
            
            return NextResponse.json(
                { ...existingItem, id: existingItem.id },
                { status: 200 }
            );
        } else {
            // Create new item
            const newItem = {
                id: Date.now().toString(),
                name: body.name.trim(),
                quantity: Number(body.quantity),
                price: Number(body.price),
                threshold: Number(body.threshold) || 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            addItem(newItem);
            
            return NextResponse.json(
                { ...newItem, id: newItem.id },
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

