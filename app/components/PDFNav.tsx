type PDFNavProps = {
    pageNumber: number,
    numPages: number,
    changePage: (amount: number) => void
}

export default function PDFNav({pageNumber, numPages, changePage}: PDFNavProps) {
    return (
        <div className="flex w-full items-center justify-between mt-5 space-x-4">
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
    )
}