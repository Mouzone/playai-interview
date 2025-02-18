'use client'

import { useState, useEffect, useRef } from "react"
import { Document, Page } from "react-pdf"
import * as pdfJS from "pdfjs-dist"
import pdfToText from 'react-pdftotext'
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { voices } from "./consts"

if (typeof window !== 'undefined') {
    pdfJS.GlobalWorkerOptions.workerSrc =
        window.location.origin + '/pdf.worker.min.mjs'
}

export default function App() {
    const [file, setFile] = useState<File | undefined>(undefined)
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioControllables, setAudioControllables] = useState({voice: "Angelo", speed: 1, temperature: 0})
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
            URL.revokeObjectURL(audioUrl) // Remove the previous URL
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
                voice: voices[audioControllables["voice"]],
                outputFormat: "mp3",
                speed: audioControllables["speed"],
                sampleRate: 24000,
                seed: null,
                temperature: audioControllables["temperature"],
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
            setAudioUrl(newAudioUrl)

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
            {isLoadingAudio && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                        <span className="mt-3 text-white">Loading Audio...</span>
                    </div>
                </div>
            )}
            <div className="flex gap-10 p-10">
                <div>
                    <div className="flex flex-col items-center">
                        {file ? (
                            <div className="w-[600px] h-[700px] overflow-hidden border border-gray-300 shadow-lg">
                            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                                <Page pageNumber={pageNumber} width={600} />
                            </Document>
                            </div>
                        ) : (
                            <div className="w-[600px] h-[700px] flex items-center justify-center bg-gray-100 border border-gray-300 shadow-lg">
                            <p className="text-gray-500">No PDF file selected</p>
                            </div>
                        )}
                    </div>
                    {file && numPages && (
                        <div className="flex mt-5 justify-between">
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
                </div>
                
                <div className="flex items-center">
                    <input type="file" accept=".pdf" onChange={onFileChange} disabled={isLoadingAudio}/>
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
                                console.error("Audio playback error:", error)
                                URL.revokeObjectURL(audioUrl)
                                setAudioUrl(null)
                            }}
                        />
                    )}
                    
                    {/* Audio Controllables */}
                    <div className="space-y-4 p-6 bg-gray-100 rounded-lg shadow-md">
                        {/* Dropdown for Voice Selection */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Select Voice:</label>
                            <select
                                onChange={(e) =>
                                    setAudioControllables({ ...audioControllables, voice: e.target.value })
                                }
                                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            {Object.keys(voices).map(key => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                            </select>
                        </div>

                        {/* Slider for Speed */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Speed: {audioControllables.speed}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                value={audioControllables.speed}
                                onChange={(e) => {
                                    const newValue = parseFloat(e.target.value) 
                                    setAudioControllables({
                                        ...audioControllables,
                                        speed: newValue === 0 ? 0.1 : newValue,
                                    })
                                }
                                    
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Slider for Temperature */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Temperature: {audioControllables.temperature}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step=".1"
                                value={audioControllables.temperature}
                                onChange={(e) =>
                                    setAudioControllables({
                                    ...audioControllables,
                                    temperature: parseFloat(e.target.value),
                                    })
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}