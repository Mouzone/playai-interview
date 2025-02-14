import * as dotenv from 'dotenv';
dotenv.config()

export async function POST(request: Request) {
    fetch("https://api.play.ai/api/v1/tts/stream", {
        method: 'POST',
        headers: {
            AUTHORIZATION: `Bearer ${process.env.API_KEY}`,
            'Content-Type': "application/json",
            'X-USER-ID': process.env.USER_ID
        } as HeadersInit,
        body: '{"model":"PlayDialog","text":"Country Mouse: Welcome to my humble home, cousin! Town Mouse: Thank you, cousin. It\'s quite... peaceful here. Country Mouse: It is indeed. I hope you\'re hungry. I\'ve prepared a simple meal of beans, barley, and fresh roots. Town Mouse: Well, it\'s... earthy. Do you eat this every day?","voice":"s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json","voice2":"s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json","outputFormat":"mp3","speed":1,"sampleRate":24000,"seed":null,"temperature":null,"turnPrefix":"Country Mouse:","turnPrefix2":"Town Mouse:","prompt":"<string>","prompt2":"<string>","voiceConditioningSeconds":20,"voiceConditioningSeconds2":20,"language":"english"}'
    })
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err))
}