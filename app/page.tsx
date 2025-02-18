'use client'

import { useState, useEffect, useRef } from "react"
import { Document, Page } from "react-pdf"
import * as pdfJS from "pdfjs-dist"
import pdfToText from 'react-pdftotext'
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { voices } from "./consts"
import { AduioControllable } from "./types"

if (typeof window !== 'undefined') {
    pdfJS.GlobalWorkerOptions.workerSrc =
        window.location.origin + '/pdf.worker.min.mjs'
}

export default function App() {
    const [file, setFile] = useState<File | undefined>(undefined)
    const [text, setText] = useState<string | null>(null)
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioControllables, setAudioControllables] = useState<AduioControllable>({voice: "Angelo", speed: 1, temperature: .1})
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
        setFile(selectedFile)

        console.log(selectedFile)
        const loadingTask = pdfJS.getDocument({ data: await selectedFile.arrayBuffer() });
        const pdf = await loadingTask.promise;
      
        // Get the specific page
        const page = await pdf.getPage(pageNumber);
      
        // Extract text from the page
        const textContent = await page.getTextContent();
        const textItems = textContent.items;
        const text = textItems.map(item => item.str).join(' ')

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
        setText(text)
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
                temperature: null,
                voiceConditioningSeconds: 20,
                language: "english"
            })
        })

        console.log("starting stream")
        setIsLoadingAudio(true)
        try {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
            }
    
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
            <div className="flex gap-10 p-10 items-center">
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
                        <div className="flex items-center justify-between mt-5 space-x-4">
                        {/* Previous Button */}
                        <button
                          type="button"
                          disabled={pageNumber <= 1}
                          onClick={() => changePage(-1)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Previous
                        </button>
                      
                        {/* Page Info */}
                        <span className="text-sm font-medium text-gray-700">
                          Page {pageNumber} of {numPages}
                        </span>
                      
                        {/* Next Button */}
                        <button
                          type="button"
                          disabled={pageNumber >= numPages}
                          onClick={() => changePage(1)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 ml-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                </div>
                
                <div className="flex flex-col gap-10">
                    <input type="file" accept=".pdf" onChange={onFileChange} disabled={isLoadingAudio}/>
                        
                    {/* Audio Controllables */}
                    <form className="space-y-4 p-6 bg-gray-100 rounded-lg shadow-md" onSubmit={onSubmit}>
                        {/* Dropdown for Voice Selection */}
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="voice-select" className="text-sm font-medium text-gray-700">
                                Select Voice:
                            </label>
                            <select
                                id="voice-select"
                                onChange={(e) =>
                                    setAudioControllables({ ...audioControllables, voice: e.target.value as keyof typeof voices })
                                }
                                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            {Object.keys(voices).map((key) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                            </select>
                        </div>

                        {/* Slider for Speed */}
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="speed-slider" className="text-sm font-medium text-gray-700">
                                Speed: {audioControllables.speed}
                            </label>
                            <input
                                id="speed-slider"
                                type="range"
                                min="0"
                                max="5"
                                step=".1"
                                value={audioControllables.speed}
                                onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    setAudioControllables({
                                        ...audioControllables,
                                        speed: newValue === 0 ? 0.1 : newValue, // Ensure speed is never 0
                                    })
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Slider for Temperature */}
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="temperature-slider" className="text-sm font-medium text-gray-700">
                                Temperature: {audioControllables.temperature}
                            </label>
                            <input
                                id="temperature-slider"
                                type="range"
                                min="0"
                                max="2"
                                step=".1"
                                value={audioControllables.temperature}
                                onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    setAudioControllables({
                                        ...audioControllables,
                                        temperature: newValue === 0 ? 0.1 : newValue, // Ensure speed is never 0
                                    })
                                }
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className={`w-full px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-all duration-200
                                ${
                                    text === null
                                        ? "bg-gray-400 cursor-not-allowed opacity-75" // Disabled state
                                        : "bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75" // Enabled state
                                }
                            `}
                            disabled={text === null}
                        >
                            Generate Audio
                        </button>
                    </form>

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
                </div>
            </div>
        </>
    )
}