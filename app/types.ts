import { voices } from "./consts"
export type AduioControllable = {
    voice: keyof typeof voices, 
    speed: number, 
    temperature: number
}