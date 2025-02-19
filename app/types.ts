import { voices } from "./consts"
export type AudioControllable = {
    voice: keyof typeof voices, 
    speed: number, 
    temperature: number
}