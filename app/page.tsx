'use client'

import {useState} from "react"
import { Document, Page } from "react-pdf"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"

const pdfJS = await import('pdfjs-dist/build/pdf')
pdfJS.GlobalWorkerOptions.workerSrc =
				window.location.origin + '/pdf.worker.min.mjs'

export default function App() {
    const [file, setFile] = useState(null)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)

    const onFileChange = (event) => {
        setFile(event.target.files[0])
        setPageNumber(1); // Reset page number when a new file is uploaded
    };

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages)
    }

    function changePage(amount) {
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