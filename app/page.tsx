'use client'

import {useState} from "react"
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

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0])
        setPageNumber(1) // Reset page number when a new file is uploaded
        if (!file) {
            return
        }
        const text = await pdfToText(file)
        const response = await fetch("/api", {
            method: "POST",
            body: JSON.stringify({
                model:"PlayDialog",
                text,
                voice:"s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json",
                voice2:"s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json",
                outputFormat:"mp3",
                speed:1,
                sampleRate:24000,
                seed:null,
                temperature:null,
                turnPrefix:"Country Mouse:",
                turnPrefix2:"Town Mouse:",
                prompt:"<string>",
                prompt2:"<string>",
                voiceConditioningSeconds:20,
                voiceConditioningSeconds2:20,
                language:"english"
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        try {
            const blob = await response.blob()
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.controls = true; // Show audio controls
            document.body.appendChild(audio);
            audio.play()
        } catch(err) {
            console.error(err)
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