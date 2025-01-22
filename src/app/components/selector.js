import { useState } from "react";

export default function Selector({index, data, modifyData, charData}) {
    const [prefix, setPrefix] = useState(data?.player.prefix || "");
    const [gamerTag, setGamerTag] = useState(data?.player.gamerTag || "");
    const [char, setChar] = useState(data?.player.char);
    const [showCharacters, setShowCharacters] = useState(false);

    const GetCharacters = () => {    
        const output = [];
        for (let [i, c] of charData.entries()) {
            output.push(
                <button key={c.name.toLowerCase()} className="w-full text-left hover:bg-zinc-300 hover:text-zinc-950 px-2 py-1" onClick={() => {
                    const newData = data;
                    newData.player.char = {index: i, name: formatName(c.name)};
                    modifyData(index, newData);
                    setChar({index: i, name: formatName(c.name)});
                    setShowCharacters(false);
                }}>
                    {c.name}
                </button>
            );
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

    function getPlacement() {
        if (index < 4)
            return index+1 + (index === 0 ? "st" : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th')
        if (index >= 4 && index < 6)
            return '5th'
        if (index >= 6 && index < 8)
            return '7th'
        if (index >= 8 && index < 12)
            return '9th'
        return '13th'
    }

    return (
        <div className="w-full flex flex-col gap-4 p-4 bg-zinc-900 border-2 border-zinc-700 rounded-lg">
            <p className={`border-b border-zinc-500 font-semibold ${index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-400" : index === 2 ? "text-[#c5714f]" : "text-zinc-300"}`}>{getPlacement()}</p>
            <div className="flex gap-2 items-center justify-between">
                <div className={`${index > 7 ? "w-[4ch]" : "w-1/3"}`}>
                    <p>Prefix</p>
                    <input className="w-full text-black p-1" placeholder={index > 7 ? "PRE" : "Prefix"} maxLength={index > 7 ? 3 : undefined} value={prefix ? index > 7 ? prefix.substring(0, 3) : prefix : ''} onChange={e => {
                        const newData = data;
                        const value = e.target.value;
                        newData.player.prefix = value;
                        modifyData(index, newData);
                        setPrefix(value);
                    }} />
                </div>
                <div className="w-[1px] self-end h-[32px] bg-white" />
                <div className={`${index > 7 ? "w-[calc(100%-4ch)]" : "w-2/3"}`}>
                    <p>Tag</p>
                    <input className="w-full text-black p-1" placeholder={"Player " + (index+1)} value={gamerTag} onChange={e => {
                        const newData = data;
                        const value = e.target.value;
                        newData.player.gamerTag = value;
                        modifyData(index, newData);
                        setGamerTag(value);
                    }} />
                </div>
            </div>
            <div className="flex flex-col">
                <p>Character</p>
                <div className="relative">
                    <button className="group w-full bg-zinc-700 px-2 py-1 rounded-sm flex justify-between active:bg-zinc-600" onClick={() => setShowCharacters(!showCharacters)}>
                        <p className="text-left">{charData[char.index].name}</p>
                        <p className="group-hover:opacity-60">{showCharacters ? "▲" : "▼"}</p>
                    </button>
                    {showCharacters &&
                        <div className="absolute w-full left-0 top-[calc(100%+2px)] h-36 overflow-y-scroll bg-zinc-700">
                            <GetCharacters />
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}