'use client'
import TopSixteen from "./components/top-sixteen";
import { useEffect, useRef, useState } from "react";
import { domToPng } from "modern-screenshot";
import Selector from "./components/selector";
import char_data from "../../public/resources/characters.json";
import Image from "next/image";
import { AutoTextSize } from "auto-text-size";
import DatePicker from "react-datepicker";
import { Colorful } from "@uiw/react-color";

import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from  "react-datepicker";
import { es } from 'date-fns/locale/es';
registerLocale('es', es)

export default function Home() {
  const token = "db3f816b8f72144b83019b8201ac7593";

  const data = useRef(initializeValues());
  const imgSrc = useRef(null);
  const logoInputRef = useRef(null);
  const urlRef = useRef('');
  const fileInput = useRef("No image yet");
  const background = useRef('#ff8282');
  const primaryColor = useRef('#c33d3d');
  const secondaryColor = useRef('#63b440');

  const [dataToRender, setDataToRender] = useState(null);
  const [isSixteen, setIsSixteen] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [refreshDataInputs, setRefreshDataInputs] = useState(-1);
  const [date, setDate] = useState(null);

  useEffect(() => {
    setRefreshDataInputs(refreshDataInputs + 1);
  }, []);

  useEffect(() => {
    if (refreshDataInputs > 0) {
      document.querySelector("#selectors").scrollIntoView({behavior: "smooth"});
    }
  }, [refreshDataInputs])

  useEffect(() => {
    if (dataToRender !== null) {
      domToPng(document.querySelector("#builder"), {quality: 1}).then(dataUrl => {
        imgSrc.current = dataUrl;
        setTimeout(() => {
          document.querySelector("#img").scrollIntoView({behavior: "smooth"});
        }, 300);
        setDataToRender(null);
      },);
    }
  }, [dataToRender])

  function initializeValues() {
    const values = [];
    for (let i=0; i<16; i++) {
      values.push(
        {player:
          {
            prefix: '',
            gamerTag: '',
            char: {index: 0, name: 'random'},
          }
        }
      );
    }
    return {tournament: '', info: {location: '', date: null, entrants: ''}, players: values};
  }

  function modifyData(index, dataToChange) {
    data.current.players[index] = dataToChange
  }

  function handleLogoChange(e) {
    if (e.target.files.length > 0) {
      fileInput.current = `${e.target.files[0].name} (${(e.target.files[0].size / 1024).toFixed(0)} KB)`;
      setLogoFile(URL.createObjectURL(e.target.files[0]));
    }
  };

  function getCharacterIndex(name) {
    for (const [i, char_info] of char_data.entries()) {
      if (char_info.name.toLowerCase().localeCompare(name.toLowerCase()) === 0) {
        return i;
      }
    }
    return 0;
  }

  const GetInputFields = () => {
    const [name, setName] = useState('');
    const [entrants, setEntrants] = useState('');
    const [location, setLocation] = useState('');
    const [url, setUrl] = useState('');

    const [bgAux, setBgAux] = useState(background.current);
    const [primaryAux, setPrimaryAux] = useState(primaryColor.current);
    const [secondaryAux, setSecondaryAux] = useState(secondaryColor.current);

    const [showChangeBg, setShowChangeBg] = useState(false);
    const [showChangePrimary, setShowChangePrimary] = useState(false);
    const [showChangeSecondary, setShowChangeSecondary] = useState(false);
    const [showLoadFromUrlError, setShowLoadFromUrlError] = useState(false);
    const [showWait, setShowWait] = useState(null);

    async function getCharacter(eventId, entrant) {
      try {
        const response = await fetch('https://api.start.gg/gql/alpha', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({
            query:
    `query EventQuery($id: ID, $entrant: [ID]) {
      event(id: $id) {
        sets (sortType: ROUND, filters: {entrantIds: $entrant}) {
          nodes{
            id
            games{
              selections {
                entrant {
                  id
                }
                character {
                  name
                } 
              }
            }
          }
        }
      }
    }`,
          operationName: 'EventQuery',
          variables: {
            "id": eventId,
            "entrant": [entrant],
          },      
    }),
        });
        const json = await response.json();
        const sets = json.data.event.sets.nodes;
  
        const mostUsed = {};
        
        for (const s of sets) {
          if (s.games) {
            for (const g of s.games) {
              const selections = g.selections;
              const character = selections[0].entrant.id === entrant ? selections[0].character.name : selections[1].character.name;
              if (mostUsed[character]) {
                  mostUsed[character]++;
              }
              else {
                  mostUsed[character] = 1;
              }
            }
          }
        }
        let max = -1;
        let final = 'Random';
        for (const [c, times] of Object.entries(mostUsed)) {
          if (times > max) {
            final = c;
            max = times; 
          }
        }
        return final;
      }
      catch (e) {
        setShowLoadFromUrlError(true);
        setShowWait(false);
      }
    }
  
    async function loadData(slug) {
      try {
        setShowWait(true);
        const response = await fetch('https://api.start.gg/gql/alpha', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({
            query:
    `query EventQuery($slug: String) {
      event(slug: $slug) {
        id
        numEntrants
        standings(query: {perPage: 16}) {
          nodes {
            id
            entrant {
              id
            }
            player {
              prefix
              gamerTag
            }
            placement
          }
        }
        tournament {
            name
            city
            startAt
        }
      }
    }`,
          operationName: 'EventQuery',
          variables: {
            "slug": slug,
          },      
    }),
        });
        const json = await response.json();
        const event = json.data.event;
        const standings = event.standings.nodes;
        standings.sort((a, b) => {
          if (a.placement === b.placement) {
            return a.id - b.id
          }
          return a.placement - b.placement
        })
        for (let s of standings) {
          const charName = await getCharacter(event.id, s.entrant.id);
          s.player.char = {index: getCharacterIndex(charName), name: charName};
        }
        data.current.players = standings;
        data.current.info.entrants = event.numEntrants;
  
        const tournament = event.tournament;
        data.current.tournament = tournament.name;
        data.current.info.location = tournament.city;
        data.current.info.date = new Date(tournament.startAt * 1000);
  
        setShowWait(false);
        setRefreshDataInputs(refreshDataInputs + 1);
      }
      catch (e) {
        setShowLoadFromUrlError(true);
        setShowWait(false);
      }
    }

    function changeBg(hex) {
      background.current = hex;
      setBgAux(hex);
    }

    function changePrimary(hex) {
      primaryColor.current = hex;
      setPrimaryAux(hex);
    }

    function changeSecondary(hex) {
      secondaryColor.current = hex;
      setSecondaryAux(hex);
    }

    function getEntrants() {
      const output = [];

      for (let i=0; i<16; i++) {
        output.push(
          <div key={`sel-${i}`} className={`${!isSixteen && i > 7 ? "hidden": ""}`}>
            <Selector index={i} data={data.current.players[i]} modifyData={modifyData} charData={char_data} />
          </div>
        );
      }

      return output;
    }

    return (
      <>
        {showWait &&
          <div className="fixed top-0 left-0 w-screen h-screen bg-[#000c] z-[100] flex justify-center items-center">
            <div className="flex flex-col items-center gap-3 px-16 py-8 bg-zinc-800 rounded-lg">
              <svg aria-hidden="true" className="w-8 h-8 text-zinc-500 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <p className="text-xl font-medium">
                Please wait...
              </p>
            </div>
          </div>
        }
        <div className="flex flex-col">
          <div className="w-fit flex flex-col self-end">
            <div className="flex flex-col items-end gap-2">
              <p className="text-5xl font-bold">SB16</p>
              <p className="text-sm font-medium">
                Top 8 & 16 creator for Super Smash Bros
              </p>
              <div className="flex items-center justify-end gap-4">
                <a className="text-sm flex items-center gap-1 hover:underline" href="https://devjosm.vercel.app" target="_blank">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 181 91"
                  width="24px"
                  height="24px"
                  fill="#fff"
                >
                  <path d="M0 0 C2.75901954 1.11580286 4.3264762 2.65940214 6.4478302 4.74798584 C7.29162735 5.57264343 8.1354245 6.39730103 9.00479126 7.24694824 C9.9059819 8.14480042 10.80717255 9.04265259 11.735672 9.9677124 C12.66461777 10.88667297 13.59356354 11.80563354 14.55065918 12.75244141 C16.51362028 14.69745719 18.47029785 16.6485577 20.42341614 18.60345459 C22.9281375 21.10848139 25.4528885 23.59220838 27.98341084 26.07113266 C30.39348336 28.43986114 32.78190465 30.830002 35.173172 33.2177124 C36.54013969 34.55234528 36.54013969 34.55234528 37.9347229 35.91394043 C39.17677742 37.16983978 39.17677742 37.16983978 40.44392395 38.45111084 C41.18020523 39.18311707 41.91648651 39.91512329 42.67507935 40.66931152 C44.12239075 42.8583374 44.12239075 42.8583374 44.10609436 45.35160828 C42.9016048 48.42095662 41.40673136 50.05544683 39.06159973 52.37322998 C38.20078293 53.23374466 37.33996613 54.09425934 36.45306396 54.98085022 C35.51765274 55.8956163 34.58224152 56.81038239 33.6184845 57.75286865 C32.6549722 58.70891619 31.69234255 59.66585402 30.7305603 60.62364197 C28.20263598 63.13632855 25.66292985 65.63676883 23.12055969 68.13482666 C20.52603925 70.68835429 17.94287209 73.2533106 15.35871887 75.81732178 C10.29098122 80.84222152 5.21070537 85.85426845 0.12239075 90.8583374 C-4.28377854 88.731544 -7.23315263 85.90636534 -10.69010925 82.4833374 C-11.30048035 81.9058374 -11.91085144 81.3283374 -12.53971863 80.7333374 C-13.39726746 79.88642334 -13.39726746 79.88642334 -14.2721405 79.0223999 C-14.79654724 78.51144775 -15.32095398 78.00049561 -15.86125183 77.47406006 C-16.87760925 75.8583374 -16.87760925 75.8583374 -16.59739685 73.93490601 C-15.40231453 70.48712442 -12.6553908 68.2727329 -10.092453 65.7802124 C-9.51677078 65.20877502 -8.94108856 64.63733765 -8.34796143 64.04858398 C-6.51060606 62.22799938 -4.66308793 60.41813173 -2.81510925 58.6083374 C-1.56637787 57.37465488 -0.31832256 56.14028762 0.92903137 54.9052124 C3.98570094 51.88159085 7.051526 48.8675382 10.12239075 45.8583374 C4.73598151 39.30456644 -1.23646052 33.38587105 -7.25260925 27.4208374 C-8.2853952 26.39307757 -9.31794916 25.36508455 -10.3502655 24.33685303 C-12.85671212 21.84132142 -15.36628005 19.34895658 -17.87760925 16.8583374 C-14.26848566 12.59399992 -10.62491044 8.38844397 -6.75260925 4.3583374 C-5.92503113 3.4817749 -5.097453 2.6052124 -4.24479675 1.7020874 C-1.87760925 -0.1416626 -1.87760925 -0.1416626 0 0 Z " fill="#FFFFFF" transform="translate(136.8776092529297,0.14166259765625)"/>
                  <path d="M0 0 C2.34172768 1.04277868 3.72918923 2.36594184 5.51795959 4.20097351 C6.18182678 4.87450867 6.84569397 5.54804382 7.52967834 6.24198914 C8.21159241 6.94903992 8.89350647 7.6560907 9.59608459 8.38456726 C10.29346741 9.09548523 10.99085022 9.8064032 11.70936584 10.53886414 C13.4285504 12.2933744 15.14034331 14.05450078 16.84608459 15.82206726 C11.45967536 22.37583823 5.48723332 28.29453361 -0.52891541 34.25956726 C-1.56170136 35.28732709 -2.59425531 36.31532011 -3.62657166 37.34355164 C-6.13301827 39.83908324 -8.6425862 42.33144808 -11.15391541 44.82206726 C-7.63183099 49.12815697 -3.932087 53.0826881 0.06092834 56.95878601 C0.99356506 57.86564148 1.92620178 58.77249695 2.88710022 59.70683289 C4.34540393 61.12158298 5.8071254 62.53197042 7.27894592 63.93266296 C8.71739114 65.30480947 10.13945992 66.69406007 11.56092834 68.08378601 C12.40776184 68.89807068 13.25459534 69.71235535 14.12709045 70.55131531 C15.84608459 72.82206726 15.84608459 72.82206726 15.81141663 74.90238953 C14.69466163 77.12318987 13.46805609 78.54123013 11.68592834 80.27519226 C11.05751038 80.89394226 10.42909241 81.51269226 9.78163147 82.15019226 C9.122276 82.78441101 8.46292053 83.41862976 7.78358459 84.07206726 C6.78875061 85.04659851 6.78875061 85.04659851 5.77381897 86.04081726 C4.13779142 87.64153486 2.49517547 89.23482919 0.84608459 90.82206726 C-2.56692199 89.34254073 -4.83287765 87.41654949 -7.47935486 84.81889343 C-8.32315201 83.99431137 -9.16694916 83.16972931 -10.03631592 82.32015991 C-10.93750656 81.42746902 -11.8386972 80.53477814 -12.76719666 79.61503601 C-13.69614243 78.69749039 -14.6250882 77.77994476 -15.58218384 76.83459473 C-17.54364543 74.89409813 -19.50044527 72.94902161 -21.4549408 71.00151062 C-23.96135328 68.50610146 -26.48579755 66.02980374 -29.01493549 63.55745983 C-31.42461762 61.19393289 -33.81313885 58.809399 -36.20469666 56.42753601 C-37.11600845 55.54091782 -38.02732025 54.65429962 -38.96624756 53.74081421 C-39.79428391 52.90677567 -40.62232025 52.07273712 -41.47544861 51.21342468 C-42.21172989 50.48443466 -42.94801117 49.75544464 -43.706604 49.00436401 C-45.15391541 46.82206726 -45.15391541 46.82206726 -45.12791443 44.32504272 C-43.95509811 41.31114805 -42.52521824 39.67920717 -40.24839783 37.38310242 C-39.42051254 36.5393808 -38.59262726 35.69565918 -37.73965454 34.82637024 C-36.83866531 33.93034088 -35.93767609 33.03431152 -35.00938416 32.11112976 C-34.08805191 31.18359894 -33.16671967 30.25606812 -32.21746826 29.3004303 C-30.26952938 27.34209899 -28.31430868 25.3914141 -26.35386658 23.44560242 C-23.83983251 20.94879824 -21.34678189 18.43215278 -18.85898876 15.909235 C-16.48335169 13.50639988 -14.08927906 11.12228106 -11.69688416 8.73612976 C-10.80196762 7.82795502 -9.90705109 6.91978027 -8.98501587 5.98408508 C-8.1476741 5.15927643 -7.31033234 4.33446777 -6.44761658 3.48466492 C-5.34627632 2.3847673 -5.34627632 2.3847673 -4.22268677 1.26264954 C-2.15391541 -0.17793274 -2.15391541 -0.17793274 0 0 Z " fill="#FFFFFF" transform="translate(45.15391540527344,0.1779327392578125)"/>
                  <path d="M0 0 C8.25 0 16.5 0 25 0 C23.01797327 8.06057083 21.03553866 16.12104104 19.05245018 24.18135071 C18.13092045 27.9269944 17.20954677 31.6726763 16.28857422 35.41845703 C11.89485292 53.28807438 7.47640688 71.15085709 3 89 C-5.25 89 -13.5 89 -22 89 C-19.41855233 77.17941849 -16.66733569 65.43235496 -13.671875 53.7109375 C-13.27379266 52.14488593 -12.87595019 50.57877337 -12.47833252 49.01260376 C-11.44833293 44.95817503 -10.4151535 40.90456372 -9.38122559 36.85113525 C-8.3198724 32.68772029 -7.26164456 28.52351111 -6.203125 24.359375 C-4.13841185 16.23881833 -2.07003688 8.11920121 0 0 Z " fill="#FFFFFF" transform="translate(89,1)"/>
                </svg>
                  devjosm
                </a>
                <a className="text-sm flex items-center gap-1 hover:underline" href="https://github.com/jmmdev" target="_blank">
                  <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24px"
                  height="24px"
                  >
                    <path
                      fill="#fff"
                      d="M12.006 2a9.85 9.85 0 0 0-6.484 2.44a10.32 10.32 0 0 0-3.393 6.17a10.48 10.48 0 0 0 1.317 6.955a10.05 10.05 0 0 0 5.4 4.418c.504.095.683-.223.683-.494c0-.245-.01-1.052-.014-1.908c-2.78.62-3.366-1.21-3.366-1.21a2.7 2.7 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621c.317.044.62.163.885.346c.266.183.487.426.647.71c.135.253.318.476.538.655a2.08 2.08 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37c-2.219-.259-4.554-1.138-4.554-5.07a4.02 4.02 0 0 1 1.031-2.75a3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05c.37.858.406 1.828.101 2.713a4.02 4.02 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.47 2.47 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814c0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421a10.47 10.47 0 0 0 1.313-6.948a10.32 10.32 0 0 0-3.39-6.165A9.85 9.85 0 0 0 12.007 2Z"
                    />
                  </svg>
                  Github
                </a>
              </div>
            </div>
          </div>
          <div id="selectors" className="flex flex-col gap-0.5 border-b py-8 border-zinc-500">
            <p className="font-semibold">Tournament details</p>
            <div className="flex flex-col items-start gap-2">
              <input className="w-full max-w-[800px] text-black p-1" placeholder="Your tournament name" value={data.current.tournament.length > 0 ? data.current.tournament : name} onChange={e => {
                const value = e.target.value;
                data.current.tournament = value;
                setName(value);
              }} />
              <input className="w-full max-w-[500px] text-black p-1" placeholder="Location" value={data.current.info.location.length > 0 ? data.current.info.location : location} onChange={e => {
                const value = e.target.value;
                data.current.info.location = value;
                setLocation(value);
              }} />
              <div className="flex items-center gap-2">
                <input className="w-[5ch] text-black p-1" placeholder="#" maxLength={4} value={data.current.info.entrants > 0 ? data.current.info.entrants : entrants} onChange={e => {
                  const value = e.target.value;
                  const number = Number(value)
                  if (!isNaN(number) && number > 0 || value === "") {
                    data.current.info.entrants = value;
                    setEntrants(value);
                  }
                }} />
                <p>entrants</p>
              </div>
              <DatePicker className="text-black p-1" locale="en" placeholderText="Date" dateFormat="dd/MM/yyyy" selected={date} value={data.current.info.date ? data.current.info.date.toLocaleDateString('en-Gb') : date} onChange={(d) => {
                data.current.info.date = d;
                setDate(d);
              }} />
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-8">
            <div className="flex w-full justify-end">
              <div className="flex items-center gap-2">
                <p>Top 8</p>
                <button className="group flex w-10 p-1 rounded-full bg-zinc-500 hover:bg-zinc-400 ring-2 ring-[#fffc]" onClick={() => setIsSixteen(!isSixteen)}>
                  <div className={`w-4 aspect-square rounded-full bg-white ${isSixteen ? "translate-x-full group-active:translate-x-0" : "translate-x-0 group-active:translate-x-full"} transition-all`} />
                </button>
                <p>Top 16</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {getEntrants()}
            </div>
            <div className="flex flex-col gap-1">
              <p>Load from start.gg</p>
              <div className="w-full flex items-center gap-2">
                <input className="w-full p-1 italic text-black" placeholder="https://start.gg/tournament/.../event/..." type="text" value={urlRef.current.length > 0 ? urlRef.current : url}
                onChange={e => {
                  if (showLoadFromUrlError) {
                    setShowLoadFromUrlError(false);
                  }
                  urlRef.current = e.target.value;
                  setUrl(e.target.value);
                }} />
                <button className={`font-semibold rounded-sm bg-blue-500 text-zinc-100 px-2 py-1 ${url.length > 0 ? "hover:bg-blue-400 active:bg-blue-600" : "opacity-70"}`} disabled={!(url.length > 0)} onClick={() => {
                    let slug = url;
                    slug = slug.replace('https://', '');
                    slug = slug.replace('www.', '');
                    slug = slug.replace('start.gg/', '');
                    loadData(slug);
                  }}>
                  GO!
                </button>
              </div>
              <p className="text-sm italic">
                Example: https://start.gg/tournament/smash-mouth-22/event/singles
              </p>
            </div>
            {showLoadFromUrlError &&
              <p className="font-medium italic text-red-500">
                There was an error while retrieving data. Please check the url, start.gg services and your internet connection and try again
              </p>
            }
          </div>
          <div className="flex flex-col gap-8 pt-8">
            <p className="w-full border-b border-zinc-500 font-semibold">
              Extra
            </p>
            <div className="w-full flex flex-col xl:flex-row gap-4">
              <div className="w-full max-w-[200px] flex-col justify-center gap-2">
                <p className="truncate">Background color</p>
                <button className="relative w-full h-12 border-2 hover:border-sky-400 rounded-lg" style={{backgroundColor: bgAux}} onBlur={() => setShowChangeBg(false)} onClick={() => setShowChangeBg(!showChangeBg)}>
                  {showChangeBg &&
                    <div className="absolute z-10 top-[calc(100%+8px)] left-[50%] translate-x-[-50%]" onClick={e => e.stopPropagation()}>
                      <Colorful
                      color={bgAux}
                      onChange={(color) => {
                        changeBg(color.hex);
                      }}
                      />
                    </div>
                  }
                </button>
              </div>
              <div className="w-full max-w-[200px] flex-col justify-center gap-2">
                <p className="truncate">Primary color</p>
                <button className="relative w-full h-12 border-2 hover:border-sky-400 rounded-lg" style={{backgroundColor: primaryAux}} onBlur={() => setShowChangePrimary(false)} onClick={() => setShowChangePrimary(!showChangePrimary)}>
                {showChangePrimary &&
                <div className="absolute z-10 top-[calc(100%+8px)] left-[50%] translate-x-[-50%]" onClick={e => e.stopPropagation()}>
                  <Colorful
                  color={primaryAux}
                  onChange={(color) => {
                    changePrimary(color.hex);
                  }}
                  />
                </div>
                }
                </button>
              </div>
              <div className="w-full max-w-[200px] flex-col justify-center gap-2">
                <p className="truncate">Secondary color</p>
                <button className="relative w-full h-12 border-2 hover:border-sky-400 rounded-lg" style={{backgroundColor: secondaryAux}} onBlur={() => setShowChangeSecondary(false)} onClick={() => setShowChangeSecondary(!showChangeSecondary)}>
                {showChangeSecondary &&
                <div className="absolute z-10 top-[calc(100%+8px)] left-[50%] translate-x-[-50%]" onClick={e => e.stopPropagation()}>
                  <Colorful
                  color={secondaryAux}
                  onChange={(color) => {
                    changeSecondary(color.hex);
                  }}
                  />
                </div>
                }
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p>Upload your logo</p>
              <div className="w-full flex items-center gap-2">
                <input ref={logoInputRef} style={{display: 'none'}} type="file" onChange={e => handleLogoChange(e)} />
                <button className="font-medium rounded-sm bg-gray-500 px-2 py-1 hover:bg-gray-400 active:bg-gray-600" onClick={() => logoInputRef.current.click()}>
                  Browse...
                </button>
                <input className="w-full max-w-[800px] p-1 italic text-zinc-400 bg-zinc-700" type="text" disabled value={fileInput.current} />
                {logoFile &&
                <button className="hover:text-red-500 underline" onClick={() => {
                  fileInput.current = '';
                  setLogoFile(null);
                }}>
                  Remove
                </button>
                }
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const GetTopSixTeen = () => {
    let winner = null;
    let topFour = [];
    let topEight = [];
    let topThirteen = [];
    let topSixteen = [];

    for (let i=0; i<16; i++) {
      if (i===0)
        winner = <TopSixteen frameColor={primaryColor.current} portraitBg={background.current} shadow={secondaryColor.current} placement={1} data={data.current.players[i]} charData={char_data} />
      if (i > 0 && i < 4)
        topFour.push(<TopSixteen key={i} frameColor={primaryColor.current} portraitBg={background.current} shadow={secondaryColor.current} placement={i+1} data={data.current.players[i]} charData={char_data} />);
      if (i >= 4 && i < 8) {
        if (i / 5 <= 1) {
          topEight.push(<TopSixteen key={i} frameColor={primaryColor.current} portraitBg={background.current} shadow={secondaryColor.current} placement={5} data={data.current.players[i]} charData={char_data} />)
        } else {
          topEight.push(<TopSixteen key={i} frameColor={primaryColor.current} portraitBg={background.current} shadow={secondaryColor.current} placement={7} data={data.current.players[i]} charData={char_data} />)
        }
      }
      if (i >= 8 && i < 12)
        topThirteen.push(<TopSixteen key={i} frameColor={primaryColor.current} portraitBg={background.current} shadow={secondaryColor.current} placement={9} data={data.current.players[i]} charData={char_data}/>)
      if (i >= 12)
        topSixteen.push(<TopSixteen key={i} frameColor={primaryColor.current} portraitBg={background.current} shadow={secondaryColor.current} placement={13} data={data.current.players[i]} charData={char_data}/>)

    }

    return (
      <>
        {winner}
        <div className="w-[68%] h-full flex flex-col gap-[2.777%]">
          <div className={`w-full ${isSixteen ? "h-[45.8333%]" : "h-[57.222%]"} flex gap-[2%]`}>
            {topFour}
          </div>
          <div className={`w-full ${isSixteen ? "h-[34.7222%]" : "h-[40%]"} flex gap-[2%]`}>
            {topEight}
          </div>
          {isSixteen &&
          <>
            <div className="w-full h-full flex gap-[2%]">
              {topThirteen}
            </div>
            <div className="w-full h-full flex gap-[2%]">
              {topSixteen}
            </div>
          </>
          }
        </div>
      </>
    )
  }

  function getLogoStyle() {
    const logo = document.querySelector("#logo");
    if (logo) {
      const aspectRatio = logo.naturalWidth / logo.naturalHeight;
      return {aspectRatio: aspectRatio};
    }
    return {aspectRatio: 1};
  }

  return (
    <div className="relative w-screen max-w-screen h-screen flex justify-center overflow-x-hidden">
      <div id="builder" className="absolute w-[1920px] h-[1080px] z-10 top-0 left-0" style={{backgroundColor: background.current}}>
        <div className="relative w-full h-full overflow-hidden">
          <svg className="absolute top-0 left-0 z-20" width="1920px" height="1080px" style={{fill: primaryColor.current}}>
            <g><path d="M 194.5,-0.5 C 211.833,-0.5 229.167,-0.5 246.5,-0.5C 164.404,142.032 82.0708,284.366 -0.5,426.5C -0.5,396.5 -0.5,366.5 -0.5,336.5C 65.2544,224.665 130.254,112.332 194.5,-0.5 Z"/></g>
            <g><path d="M 457.5,-0.5 C 510.5,-0.5 563.5,-0.5 616.5,-0.5C 411.335,355.835 205.669,711.835 -0.5,1067.5C -0.5,975.5 -0.5,883.5 -0.5,791.5C 152.657,527.862 305.323,263.862 457.5,-0.5 Z"/></g>
            <g><path d="M 628.5,-0.5 C 638.5,-0.5 648.5,-0.5 658.5,-0.5C 450.833,359.5 243.167,719.5 35.5,1079.5C 25.8333,1079.5 16.1667,1079.5 6.5,1079.5C 213.833,719.5 421.167,359.5 628.5,-0.5 Z"/></g>
            <g><path d="M 1278.5,-0.5 C 1288.17,-0.5 1297.83,-0.5 1307.5,-0.5C 1100.17,359.5 892.833,719.5 685.5,1079.5C 675.5,1079.5 665.5,1079.5 655.5,1079.5C 863.167,719.5 1070.83,359.5 1278.5,-0.5 Z"/></g>
            <g><path d="M 1320.5,-0.5 C 1373.5,-0.5 1426.5,-0.5 1479.5,-0.5C 1271.86,359.483 1064.19,719.483 856.5,1079.5C 803.5,1079.5 750.5,1079.5 697.5,1079.5C 905.167,719.5 1112.83,359.5 1320.5,-0.5 Z"/></g>
            <g><path d="M 1919.5,139.5 C 1919.5,169.833 1919.5,200.167 1919.5,230.5C 1755.44,513.236 1591.78,796.236 1428.5,1079.5C 1411.17,1079.5 1393.83,1079.5 1376.5,1079.5C 1557.52,766.131 1738.52,452.798 1919.5,139.5 Z"/></g>
          </svg>
          <svg className="absolute top-0 left-0 z-20" width="1920px" height="1080px" style={{fill: secondaryColor.current}}>
            <g><path d="M 277.5,-0.5 C 329.5,-0.5 381.5,-0.5 433.5,-0.5C 289.588,250.332 144.921,500.665 -0.5,750.5C -0.5,660.5 -0.5,570.5 -0.5,480.5C 92.4042,320.366 185.071,160.032 277.5,-0.5 Z"/></g>
            <g><path d="M 1043.5,-0.5 C 1095.5,-0.5 1147.5,-0.5 1199.5,-0.5C 991.845,359.473 784.178,719.473 576.5,1079.5C 524.5,1079.5 472.5,1079.5 420.5,1079.5C 628.167,719.5 835.833,359.5 1043.5,-0.5 Z"/></g>
            <g><path d="M 1243.5,-0.5 C 1246.83,-0.5 1250.17,-0.5 1253.5,-0.5C 1045.81,359.517 838.139,719.517 630.5,1079.5C 626.833,1079.5 623.167,1079.5 619.5,1079.5C 827.5,719.5 1035.5,359.5 1243.5,-0.5 Z"/></g>
            <g><path d="M 1509.5,-0.5 C 1511.5,-0.5 1513.5,-0.5 1515.5,-0.5C 1307.81,359.517 1100.14,719.517 892.5,1079.5C 890.167,1079.5 887.833,1079.5 885.5,1079.5C 1092.98,719.201 1300.98,359.201 1509.5,-0.5 Z"/></g>
            <g><path d="M 1522.5,-0.5 C 1524.83,-0.5 1527.17,-0.5 1529.5,-0.5C 1321.83,359.5 1114.17,719.5 906.5,1079.5C 904.167,1079.5 901.833,1079.5 899.5,1079.5C 1107.17,719.5 1314.83,359.5 1522.5,-0.5 Z"/></g>
            <g><path d="M 1863.5,-0.5 C 1865.83,-0.5 1868.17,-0.5 1870.5,-0.5C 1662.83,359.5 1455.17,719.5 1247.5,1079.5C 1245.17,1079.5 1242.83,1079.5 1240.5,1079.5C 1448.17,719.5 1655.83,359.5 1863.5,-0.5 Z"/></g>
            <g><path d="M 1877.5,-0.5 C 1879.83,-0.5 1882.17,-0.5 1884.5,-0.5C 1677.02,359.799 1469.02,719.799 1260.5,1079.5C 1258.5,1079.5 1256.5,1079.5 1254.5,1079.5C 1462.19,719.483 1669.86,359.483 1877.5,-0.5 Z"/></g>
            <g><path d="M 1919.5,382.5 C 1919.5,388.5 1919.5,394.5 1919.5,400.5C 1788.26,626.634 1657.26,852.968 1526.5,1079.5C 1523.17,1079.5 1519.83,1079.5 1516.5,1079.5C 1650.47,846.886 1784.8,614.553 1919.5,382.5 Z"/></g>
            <g><path d="M 1919.5,475.5 C 1919.5,565.5 1919.5,655.5 1919.5,745.5C 1854.68,856.471 1790.34,967.804 1726.5,1079.5C 1674.5,1079.5 1622.5,1079.5 1570.5,1079.5C 1686.33,877.832 1802.66,676.498 1919.5,475.5 Z"/></g>
          </svg>
          <svg className="absolute top-0 left-0 z-20" width="1920px" height="1080px" style={{opacity: 0.3}} >
          <g><path fill="#000000" d="M 457.5,-0.5 C 476.167,-0.5 494.833,-0.5 513.5,-0.5C 342.669,296.501 171.335,593.168 -0.5,889.5C -0.5,856.833 -0.5,824.167 -0.5,791.5C 152.657,527.862 305.323,263.862 457.5,-0.5 Z"/></g>
          <g><path fill="#fefffe" d="M 692.5,-0.5 C 731.833,-0.5 771.167,-0.5 810.5,-0.5C 602.833,359.5 395.167,719.5 187.5,1079.5C 148.167,1079.5 108.833,1079.5 69.5,1079.5C 277.178,719.473 484.845,359.473 692.5,-0.5 Z"/></g>
          <g><path fill="#fefffe" d="M 819.5,-0.5 C 832.5,-0.5 845.5,-0.5 858.5,-0.5C 650.806,359.517 443.139,719.517 235.5,1079.5C 221.5,1079.5 207.5,1079.5 193.5,1079.5C 402.167,719.5 610.833,359.5 819.5,-0.5 Z"/></g>
          <g><path fill="#fefffe" d="M 881.5,-0.5 C 920.5,-0.5 959.5,-0.5 998.5,-0.5C 790.861,359.483 583.194,719.483 375.5,1079.5C 336.167,1079.5 296.833,1079.5 257.5,1079.5C 465.073,719.259 673.073,359.259 881.5,-0.5 Z"/></g>
          <g><path fill="#000000" d="M 1423.5,-0.5 C 1442.17,-0.5 1460.83,-0.5 1479.5,-0.5C 1271.83,359.5 1064.17,719.5 856.5,1079.5C 837.5,1079.5 818.5,1079.5 799.5,1079.5C 1007.5,719.5 1215.5,359.5 1423.5,-0.5 Z"/></g>
          <g><path fill="#fefffe" d="M 1546.5,-0.5 C 1585.83,-0.5 1625.17,-0.5 1664.5,-0.5C 1456.93,359.741 1248.93,719.741 1040.5,1079.5C 1001.5,1079.5 962.5,1079.5 923.5,1079.5C 1131.14,719.517 1338.81,359.517 1546.5,-0.5 Z"/></g>
          <g><path fill="#fefffe" d="M 1686.5,-0.5 C 1700.5,-0.5 1714.5,-0.5 1728.5,-0.5C 1519.83,359.5 1311.17,719.5 1102.5,1079.5C 1089.5,1079.5 1076.5,1079.5 1063.5,1079.5C 1271.19,719.483 1478.86,359.483 1686.5,-0.5 Z"/></g>
          <g><path fill="#fefffe" d="M 1734.5,-0.5 C 1773.83,-0.5 1813.17,-0.5 1852.5,-0.5C 1644.82,359.527 1437.15,719.527 1229.5,1079.5C 1190.17,1079.5 1150.83,1079.5 1111.5,1079.5C 1319.17,719.5 1526.83,359.5 1734.5,-0.5 Z"/></g>
        </svg>
          <div className="w-full h-full flex flex-col justify-between px-[64px] py-[40px] absolute z-40">
            <div className="w-full h-[110px] flex justify-between">
              <div  className={`flex items-center gap-[32px] h-full ${(data.current.info.date || data.current.info.location || data.current.info.entrants) ? "w-[1328px]" : "w-full"}`}>
                {logoFile &&
                  <div className={"relative max-w-[200px] max-h-[96px]"} style={getLogoStyle()}>
                    <Image id="logo" width={2000} height={2000} src={logoFile} alt="Logo"/>
                  </div>
                }
                <div className="flex h-full w-fit max-w-full">
                  <AutoTextSize className="font-black leading-none text-shadow-lg shadow-black" style={{fontSize: 100, alignSelf: "center", maxWidth: logoFile ? 1180 : 1380}}>
                    {data.current.tournament.length > 0 ? data.current.tournament : "Tournament name"}
                  </AutoTextSize>
                </div>
              </div>
              {(data.current.info.location.length > 0 || data.current.info.entrants.length > 0 || data.current.info.date > 0) &&
                <div className="w-[400px] h-full flex flex-col items-end justify-center">
                  {data.current.info.location.length > 0 &&
                    <div className="w-fit max-w-full">
                      <AutoTextSize className="text-[36px] font-black leading-none text-shadow-sm shadow-black uppercase">{data.current.info.location}</AutoTextSize>
                    </div>
                  }
                  {data.current.info.entrants > 0 &&
                    <div className="w-fit max-w-full">
                      <AutoTextSize className="text-[36px] font-black leading-none text-shadow-sm shadow-black">{data.current.info.entrants} entrants</AutoTextSize>
                    </div>
                  }
                  {data.current.info.date &&
                    <div className="w-fit max-w-full">
                      <AutoTextSize className="text-[36px] font-black leading-none text-shadow-sm shadow-black">{data.current.info.date.toLocaleDateString('en-Gb')}</AutoTextSize>
                    </div>
                  }
                </div>
              }
            </div>
            <div className="w-full h-[866px] flex gap-[1.34%]">
              <GetTopSixTeen />
            </div>
          </div>
        </div>
      </div>
      <main className="w-full min-h-[1080px] flex justify-center p-8 bg-zinc-950 absolute z-50 overflow-y-auto">
        <div className="w-full max-w-[1500px] flex flex-col items-center gap-16">
          <GetInputFields />
          <button className="w-40 p-3 font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700" onClick={() => setDataToRender(data.current)}>
            Generate
          </button>
          <div className="flex flex-col gap-4">
            <p className="text-3xl md:text-4xl xl:text-5xl font-bold">{imgSrc.current ? "Your image" :"Sample"}</p>
            <div className="flex flex-col w-full max-w-[1500px]">
              <img id="img" src={imgSrc.current || "/assets/extra/sample.webp"} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
