'use client'

import { useState, useEffect, useRef } from "react"
import { Document, Page } from "react-pdf"
import * as pdfJS from "pdfjs-dist"
import pdfToText from 'react-pdftotext'
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"

if (typeof window !== 'undefined') {
    pdfJS.GlobalWorkerOptions.workerSrc =
        window.location.origin + '/pdf.worker.min.mjs'
}

export default function App() {
    const [file, setFile] = useState<File | undefined>(undefined)
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null) // Store the audio URL
    const audioRef = useRef<HTMLAudioElement | null>(null) // Ref for the audio element

    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl) // Clean up the object URL
            }
        }
    }, [audioUrl])

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        setFile(selectedFile)

        setPageNumber(1) // Reset page number when a new file is uploaded

        if (!selectedFile) {
            return
        }

        // Clean up previous audio
        if (audioRef.current) {
            audioRef.current.pause() // Pause the current audio
            audioRef.current.src = "" // Clear the src to stop loading
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl) // Revoke the previous URL
            setAudioUrl(null)
        }

        console.log("parsing text")
        const text = await pdfToText(selectedFile)

        console.log("uploading")
        const response = await fetch("/api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "PlayDialog",
                text,
                voice: "s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json",
                outputFormat: "mp3",
                speed: 1,
                sampleRate: 24000,
                seed: null,
                temperature: null,
                voiceConditioningSeconds: 20,
                language: "english"
            })
        })

        console.log("starting stream")
        try {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
            }
            setIsLoadingAudio(true)
            const blob = await response.blob()
            const newAudioUrl = URL.createObjectURL(blob)
            setAudioUrl(newAudioUrl) // Set the new audio URL

            // Play the new audio
            if (audioRef.current) {
                audioRef.current.src = newAudioUrl
                audioRef.current.play()
            }

            setIsLoadingAudio(false)
        } catch (error) {
            console.error("Error fetching or playing audio:", error)
            setIsLoadingAudio(false)
        }
    }

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
    }

    function changePage(amount: number) {
        setPageNumber(Math.min(Math.max(1, pageNumber + amount), numPages))
    }

    return (
        <>
            <input type="file" accept=".pdf" onChange={onFileChange} />
            <div>
                {file && (
                    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber} />
                    </Document>
                )}
                {isLoadingAudio && <p>Loading audio...</p>}
                {audioUrl && (
                    <audio
                        ref={audioRef} // Attach the ref to the audio element
                        controls
                        src={audioUrl} // Set the audio source dynamically
                        autoPlay // Auto-play the audio
                        onEnded={() => {
                            URL.revokeObjectURL(audioUrl) // Clean up the URL when playback ends
                            setAudioUrl(null)
                        }}
                        onError={(error) => {
                            console.error("Audio playback error:", error)
                            URL.revokeObjectURL(audioUrl) // Clean up the URL on error
                            setAudioUrl(null)
                        }}
                    />
                )}
                {file && numPages && (
                    <div>
                        <button
                            type="button"
                            disabled={pageNumber <= 1}
                            onClick={() => changePage(-1)}
                        >
                            Previous
                        </button>
                        <span>
                            Page {pageNumber} of {numPages}
                        </span>
                        <button
                            type="button"
                            disabled={pageNumber >= numPages}
                            onClick={() => changePage(1)}
                        >
                            Next
                        </button>
                    </div>
                )}
                {!file && <p>No file selected.</p>}
            </div>
        </>
    )
}