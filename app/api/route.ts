import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const requestBody = await request.json();

        // Forward the request to the external API
        const externalResponse = await fetch('https://api.play.ai/api/v1/tts/stream', {
            method: 'POST',
            headers: {
                AUTHORIZATION: `Bearer ${process.env.API_KEY}`,
                'Content-Type': 'application/json',
                'X-USER-ID': process.env.USER_ID,
            } as HeadersInit,
            body: JSON.stringify(requestBody),
        });

        // Handle errors from the external API
        if (!externalResponse.ok) {
            const errorData = await externalResponse.json();
            console.error('API Error:', externalResponse.status, errorData);
            return NextResponse.json(errorData, { status: externalResponse.status });
        }

        // Create a ReadableStream from the external API's response body
        const readableStream = externalResponse.body;

        // Create a TransformStream to chunk the data
        const transformStream = new TransformStream({
            transform(chunk, controller) {
                // Process each chunk of data
                controller.enqueue(chunk);
            },
        });

        // Pipe the external API's response through the TransformStream
        if (!readableStream){
           throw new Error("Error creating TransformStream")
        }

        readableStream.pipeThrough(transformStream);

        // Return a streaming response to the client
        return new Response(transformStream.readable, {
            headers: {
                'Content-Type': externalResponse.headers.get('Content-Type') || 'audio/mpeg',
            },
        });

    } catch (error) {
        console.error('Fetch Error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}