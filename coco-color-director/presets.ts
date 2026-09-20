import type{Hex,PalettePolicy}from"./types.ts";
export type PalettePreset={dominant:Hex;support:Hex;accent:Hex;neutral:Hex;dark:Hex;light:Hex};
export const PRESETS:Record<PalettePolicy,PalettePreset>={
"image-led":{dominant:"#1A1A1A",support:"#F4EBDD",accent:"#C8A96B",neutral:"#D8D1C4",dark:"#101010",light:"#F4EBDD"},
"warm-premium":{dominant:"#211A16",support:"#E7D5BA",accent:"#B88A4A",neutral:"#CFC1AE",dark:"#15110E",light:"#F3E9DC"},
"champagne-black":{dominant:"#111111",support:"#E5D0A5",accent:"#C9A45F",neutral:"#D9D2C7",dark:"#080808",light:"#F6F0E7"},
"tropical-emerald":{dominant:"#123D2F",support:"#F0E3C8",accent:"#B9C94A",neutral:"#D7D0C2",dark:"#0A211B",light:"#F7F0E4"},
"rose-glamour":{dominant:"#2A1722",support:"#F0D8DE",accent:"#C98C9F",neutral:"#D8C9CE",dark:"#140B10",light:"#F8EEF1"},
"sunset-warm":{dominant:"#6A2F1D",support:"#F4C58D",accent:"#E18B37",neutral:"#E4D2BF",dark:"#2C150F",light:"#FFF0DC"},
"burgundy-intimate":{dominant:"#3A1420",support:"#E8D6CE",accent:"#A56A55",neutral:"#CDBEB8",dark:"#160A0E",light:"#F7EEE9"},
"electric-night":{dominant:"#070A12",support:"#EAF2FF",accent:"#26D9FF",neutral:"#A8B2C4",dark:"#02040A",light:"#F5F9FF"},
"industrial-monochrome":{dominant:"#14171A",support:"#D9DEE3",accent:"#7E8A96",neutral:"#9FA7AE",dark:"#080A0C",light:"#F0F3F5"},
"retro-pop":{dominant:"#3D1F50",support:"#F4DFB5",accent:"#E85D9E",neutral:"#D3C3B4",dark:"#1A0E21",light:"#FFF5E2"},
"neutral-editorial":{dominant:"#ECE8E1",support:"#1B1B1B",accent:"#8C6F57",neutral:"#AFA79D",dark:"#121212",light:"#FAF7F2"}}
