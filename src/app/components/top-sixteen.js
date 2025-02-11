'use client'
import { AutoTextSize } from "auto-text-size";
import Image from "next/image"
import { useRef } from "react";

export default function TopSixteen({frameColor, portraitBg, shadow, placement, data, charData}) {
    const gamerTag = data?.player.gamerTag || "Player";
    const prefix = data?.player.prefix || "";
    const chars = data?.player.chars || [{index: 0, name: "random"}];
    const dimensions = useRef(placement === 1 ? {width:'32%', height:'100%'} : {width: '100%', height:'100%'});

    function getLighterColor() {
        const intValues = [];
        let output = '#';
        
        [1,3,5].map(function (str) {
            const elem = frameColor.slice(str, str+2);
            intValues.push(Number("0x" + elem));
        })

        for (let i of intValues) {
            const maxControl = i + 135 < 255 ? i + 135 : 255;
            const n = Math.max(175, maxControl);
            output += n.toString(16);
        }

        return output;
    }

    function formatName(string) {
        const lowerCase = string.toLowerCase();
        const noDots = lowerCase.replaceAll('.', '');
        const noDashes = noDots.replaceAll('-', ' ');
        const final = noDashes.replaceAll(' ', '_');
        
        return final;
    }

    return (
        <div style={{width: dimensions.current.width, height: dimensions.current.height, backgroundColor: placement > 7 ? frameColor : "transparent"}}>
            <div className="w-full h-full">
            {placement >= 1 && placement <= 7 &&
                <div className="relative w-full h-full shadow-[8px_8px_8px_#0008] overflow-y-hidden" style={{backgroundColor: portraitBg}}>
                    {<Image priority 
                    src={`/assets/renders/${chars
                        ? chars[0].name === "pikachu" ? (placement === 1 ? "pikachu-lg" : "pikachu-sm") : formatName(chars[0].name)
                        : "random"}.webp`} width={2000} height={2000} alt="Char render"
                        className="translate-y-[-2%]" style={{filter: `drop-shadow(-16px 16px 0 ${shadow})`}} />}
                    <div className={`absolute top-0 left-0 w-full z-10 ${placement > 1 ? placement > 4 ? "border-[6px] h-[72%]" : "border-[8px] h-[72%]" : "border-[10px] h-[83%]"} border-b-0`} style={{borderColor: frameColor}}/>
                    <div className={`absolute flex flex-col w-fit top-0 left-0 items-center ${placement > 1 ? placement > 4 ? "px-2" : "px-3" : "px-8"}`}>
                        <p className={`font-extrabold leading-none ${placement > 1 ? placement > 4 ? "text-white text-[84px] mb-2 px-2" : "text-[128px] px-3" : "text-[#fd0] text-[224px]"}
                        ${placement === 2 ? "text-[#ccd]" : placement === 3 ? "text-[#b64]" : ""}`} 
                        style={{filter: `drop-shadow(${placement > 1 ? placement > 4 ? "5px 5px" : "6px 6px" : "10px 10px"} 0 #000)`}}>
                            {placement}
                        </p>
                        <div className="w-14 flex flex-col gap-1">
                            <div className="relative w-full aspect-square">
                                {chars && chars[1] && <Image src={`${charData[chars[1].index].images[0].url}`} alt={"Second #1 stock icon"} width={2000} height={2000} style={{filter: `drop-shadow(4px 4px 0 #000)`}} />}
                            </div>
                            <div className="relative w-full aspect-square">
                                {chars && chars[2] && <Image src={`${charData[chars[2].index].images[0].url}`} alt={"Second #2 stock icon"} width={2000} height={2000} style={{filter: `drop-shadow(4px 4px 0 #000)`}} />}
                            </div>
                        </div>
                    </div>
                    <div className={`absolute w-full text-[2vw] ${placement === 1 ? "h-[17%]" : "h-[28%]"} flex items-center justify-center bottom-0 px-4`} style={{backgroundColor: frameColor}}>
                    <div className="flex items-center gap-1">
                        <AutoTextSize className={`font-black text-center ${placement === 1 ? prefix.length + gamerTag.length <= 10 ? "text-shadow-lg" : "text-shadow-md" 
                            : placement < 9 ? prefix.length + gamerTag.length <= 12 ? "text-shadow-md" : "text-shadow-sm" : prefix.length + gamerTag.length <= 9 ? "text-shadow-md" : "text-shadow-sm"} shadow-black`} style={{fontSize: placement === 1 ? 96 : 48, maxWidth: placement === 1 ? 540 : placement < 5 ? 350 : 260}}>
                            <span style={{color: getLighterColor()}}>{prefix}</span> <span>{gamerTag}</span>
                        </AutoTextSize> 
                    </div>
                    </div>
                </div>
            }
            {placement > 7 &&
                <div className="w-full h-full flex items-center gap-1 px-1.5 shadow-[8px_8px_8px_#0008]">
                    <p className="text-[27px] font-black text-shadow-xs shadow-black">{placement + 'th'}</p>
                    <div className="relative w-[40px] h-[40px]">
                        <Image src={`${chars ? charData[chars[0].index].images[0].url : charData[0].images[0].url}`} alt={"Char stock icon"} width={2000} height={2000} />
                    </div>
                    <div className="flex items-center gap-1">
                        <AutoTextSize className={`text-[27px] font-black text-center text-shadow-xs shadow-black`} style={{maxWidth: 160}}>
                            <span style={{color: getLighterColor()}}>{prefix.substring(0, 3)}</span> <span>{gamerTag}</span>
                        </AutoTextSize>
                    </div>
                </div>
            }
            </div>
        </div>
    )
}