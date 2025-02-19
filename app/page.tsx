'use client'

import { useState, useEffect, useRef } from "react"
import { Document, Page } from "react-pdf"
import * as pdfJS from "pdfjs-dist"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { voices } from "./consts"
import { AudioControllable } from "./types"
import { TextItem } from "pdfjs-dist/types/src/display/api"
import { PDFDocumentProxy} from "pdfjs-dist/types/src/display/api"
import AudioControllables from "./components/AudioControllables"
import PDFNav from "./components/PDFNav"
import { PDFPageProxy } from "pdfjs-dist/types/web/interfaces"

if (typeof window !== 'undefined') {
    pdfJS.GlobalWorkerOptions.workerSrc =
        window.location.origin + '/pdf.worker.min.mjs'
}

export default function App() {
    const [file, setFile] = useState<File | undefined>(undefined)
    const [pdf, setPDF] = useState<PDFDocumentProxy | null>(null)
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioControllables, setAudioControllables] = useState<AudioControllable>({voice: "Angelo", speed: 1, temperature: .1})
    const [isGenerating, setIsGenerating] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl) // Clean up the object URL
            }
        }
    }, [audioUrl])

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]

        if (!selectedFile) {
            return
        }

        // Save pdf to scrape pages for later
        const loadingTask = pdfJS.getDocument({ data: await selectedFile.arrayBuffer() })
        const pdf = await loadingTask.promise
        
        // Save current state of submission, and reset states for anything else for new file
        setTimeout(() => {
            setIsGenerating(false)
            setFile(selectedFile)
            setPDF(pdf)
            setPageNumber(1) // Reset page number when a new file is uploaded
            clearAudio()     // Clean up previous audio
        }, 500)
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)
    
        if (!pdf) {
            setIsGenerating(false)
            return
        }
    
        try {
            const page = await pdf.getPage(pageNumber)
            const text = await getPageText(page)
    
            const response = await fetchAudioStream(text)
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
            }
    
            await handleAudioStream(response)
    
        } catch (error) {
            console.error("Error fetching or playing audio:", error)
        }
    }
    
    // Helper function to fetch audio stream
    const fetchAudioStream = async (text: string) => {
        return await fetch("/api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "PlayDialog",
                text,
                voice: voices[audioControllables["voice"]],
                outputFormat: "mp3",
                speed: audioControllables["speed"],
                sampleRate: 24000,
                seed: null,
                temperature: null,
                voiceConditioningSeconds: 20,
                language: "english",
            }),
        })
    }
    
    // Helper function to handle audio stream
    const handleAudioStream = async (response: Response) => {
        const mediaSource = new MediaSource()
        const audioUrl = URL.createObjectURL(mediaSource)
        setAudioUrl(audioUrl)
    
        if (audioRef.current) {
            audioRef.current.src = audioUrl
        }
    
        mediaSource.addEventListener("sourceopen", async () => {
            const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg') // Adjust MIME type if needed
            const reader = response.body?.getReader()
    
            if (!reader) {
                throw new Error("Failed to create stream reader")
            }
    
            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        if (mediaSource.readyState === "open") {
                            mediaSource.endOfStream()
                        }
                        setIsGenerating(false)
                        break
                    }
    
                    // Wait for the SourceBuffer to be ready for more data
                    if (sourceBuffer.updating || mediaSource.readyState !== "open") {
                        await new Promise((resolve) => {
                            sourceBuffer.addEventListener("updateend", resolve, { once: true })
                        })
                        continue // Retry the loop after waiting
                    }
    
                    sourceBuffer.appendBuffer(value)
    
                    // Wait for the SourceBuffer to finish processing the current chunk
                    await new Promise((resolve) => {
                        sourceBuffer.addEventListener("updateend", resolve, { once: true })
                    })
                }
            } catch (error) {
                console.error("Error processing audio stream:", error)
                cleanupMediaSource(mediaSource, audioUrl)
            }
        })
    }
    
    // Helper function to clean up MediaSource
    const cleanupMediaSource = (mediaSource: MediaSource, audioUrl: string | null) => {
        if (mediaSource.readyState === "open") {
            mediaSource.endOfStream()
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
            setAudioUrl(null)
        }
    }

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
    }

    function changePage(amount: number) {
        // Clean up audio when changing pages
        setTimeout(() => {
            clearAudio()
            setIsGenerating(false)
            setPageNumber(Math.min(Math.max(1, pageNumber + amount), numPages))
        }, 500)
    }

    async function getPageText(page: PDFPageProxy) {
        const textContent = await page.getTextContent()
        const textItems = textContent.items as TextItem[]
        return textItems.map(item => item.str).join(' ')
    }

    function clearAudio() {
        if (audioRef.current) {
            audioRef.current.pause() 
            audioRef.current.src = "" // Clear the src to stop loading
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
            setAudioUrl(null)
        }
    }
    return (
        <div className="flex gap-10 p-10 items-center justify-center">
            <div className="flex flex-col items-center">
                {file ? (
                    <>
                        <div className="w-[500px] h-[700px] overflow-hidden border border-gray-300 shadow-lg">
                            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                                <Page pageNumber={pageNumber} width={500} scale={1}/>
                            </Document>
                        </div>
                        <PDFNav pageNumber={pageNumber} numPages={numPages} changePage={changePage}/>
                    </>
                ) : (
                    <div className="w-[500px] h-[700px] flex items-center justify-center bg-gray-100 border border-gray-300 shadow-lg">
                        <p className="text-gray-500">No PDF file selected</p>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col gap-10">
                <input type="file" accept=".pdf" onChange={onFileChange}/>
                    
                <AudioControllables 
                    audioControllables={audioControllables}
                    isDisabled={pdf === null || isGenerating}
                    onSubmit={onSubmit}
                    setAudioControllables={setAudioControllables}
                />

                {audioUrl && (
                    <audio
                        ref={audioRef}
                        controls
                        src={audioUrl} // Set the audio source dynamically
                        autoPlay // Auto-play the audio
                        onEnded={() => {
                            URL.revokeObjectURL(audioUrl)
                            setAudioUrl(null)
                        }}
                        onError={(error) => {
                            const nativeEvent = error.nativeEvent // Access the native browser event
                            console.error("Audio playback error:", nativeEvent)
                            URL.revokeObjectURL(audioUrl)
                            setAudioUrl(null)
                        }}
                    />
                )}
            </div>
        </div>
    )
}