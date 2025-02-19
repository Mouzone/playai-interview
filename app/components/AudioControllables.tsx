import { voices } from "../consts"
import { AudioControllable } from "../types"

type AudioControllablesProps = {
    audioControllables: AudioControllable,
    isDisabled: boolean,
    onSubmit: React.FormEventHandler<HTMLFormElement>,
    setAudioControllables: React.Dispatch<React.SetStateAction<AudioControllable>>
}

export default function AudioControllables({audioControllables, isDisabled, onSubmit, setAudioControllables}: AudioControllablesProps) {
    return (
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
                        const newValue = parseFloat(e.target.value)
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
                        const newValue = parseFloat(e.target.value)
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
                        isDisabled
                            ? "bg-gray-400 cursor-not-allowed opacity-75" // Disabled state
                            : "bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75" // Enabled state
                    }
                `}
                disabled={isDisabled}
            >
                Generate Audio
            </button>
        </form>
    )
}