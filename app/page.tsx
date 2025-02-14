'use client'

import {useState, useEffect} from "react"
import { Document, Page } from "react-pdf"
import * as pdfJS from "pdfjs-dist"
import pdfToText from 'react-pdftotext'
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"


if (typeof window !== 'undefined') { // Check if window is defined (client-side)
    pdfJS.GlobalWorkerOptions.workerSrc =
		window.location.origin + '/pdf.worker.min.mjs'
}

export default function App() {
    const [file, setFile] = useState<File | undefined>(undefined)
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null) // Store the audio element

    useEffect(() => {
        return () => {
            if (audio) {
                audio.pause()
                URL.revokeObjectURL(audio.src) // Use audio.src
            }
        }
    }, [audio])

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        setFile(selectedFile)

        setPageNumber(1) // Reset page number when a new file is uploaded
        if (!selectedFile) {
            return
        }
        console.log(selectedFile)
        console.log("parsing text")
        const text = await pdfToText(selectedFile)

        console.log("uploading")
        const response = await fetch("/api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model:"PlayDialog",
                text,
                voice:"s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json",
                outputFormat:"mp3",
                speed:1,
                sampleRate:24000,
                seed:null,
                temperature:null,
                voiceConditioningSeconds:20,
                language:"english"
            })
        })

        console.log("starting stream")
        try {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`) 
            }
            setIsLoadingAudio(true)
            const blob = await response.blob()
            const audioUrl = URL.createObjectURL(blob)
        
            const audio = new Audio(audioUrl)
            setAudio(audio)
            audio.controls = true
            audio.play()
        
            audio.onended = () => URL.revokeObjectURL(audioUrl) 
        
            audio.onerror = (error) => {
              console.error("Audio playback error:", error) 
              URL.revokeObjectURL(audioUrl) 
            }
        
            audio.onprogress = () => {
                if (!isNaN(audio.duration)) { // Check if duration is valid
                    console.log("Audio loading progress: ", audio.buffered.length / audio.duration)
                } else {
                    console.log("Audio loading progress: ", audio.buffered.length) 
                }
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
                {audio && <audio controls />}
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
                {!file && <p>No file selected.</p>} {/* Message when no file is selected */}
            </div>
        </>
    )
}