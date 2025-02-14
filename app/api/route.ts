import * as dotenv from 'dotenv'
dotenv.config()

export async function POST(request: Request) {
    try {
        const requestBody = await request.json()

        const response = await fetch("https://api.play.ai/api/v1/tts/stream", {
            method: 'POST',
            headers: {
                AUTHORIZATION: `Bearer ${process.env.API_KEY}`,
                'Content-Type': "application/json",
                'X-USER-ID': process.env.USER_ID,
            } as HeadersInit,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", response.status, errorData);
            return new Response(JSON.stringify(errorData), { status: response.status });
        }
        
        // Return the audio stream directly:
        return new Response(response.body, { // Use response.body directly
            headers: {
                'Content-Type': response.headers.get('Content-Type'), // Important: Forward the correct Content-Type
            } as HeadersInit,
        });
        
    } catch (error) {
        console.error("Fetch Error:", error);
        return new Response("An error occurred", { status: 500 });
    }
}
