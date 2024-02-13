
async function fetchATISInfo(callsign) {
    try {
        const response = await axios.get(`https://data.vatsim.net/v3/afv-atis-data.json`);
        const atisData = response.data;
        const atis = atisData.find((data) => data.callsign === callsign || data.callsign === `${callsign}_ATIS`);

        if (atis && atis.text_atis) {
            const atisText = atis.text_atis.join('\n');
            const letterMatch = atisText.match(/INFO (\w)/);
            const letter = letterMatch ? letterMatch[1] : null;

            return { letter, text: atisText };
        } else {
            console.error(`No matching ATIS data found for ${callsign}.`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching ATIS info:', error);
        return null;
    }
}

async function fetchMetar(icao) {
    try {
        const response = await axios.get(`https://metar.vatsim.net/${icao}`);
        const metarInfo = response.data;
        console.log(`METAR for ${icao}: ${metarInfo}`);
        return metarInfo;
    } catch (error) {
        console.error(`Error fetching METAR for ${icao}:`, error);
        return null;
    }
}

async function updateInfo(icao, callsign, atisElementId, infoElementId, labelElementId) {

    const atisInfo = await fetchATISInfo(callsign);
   
    if (atisInfo) {
        document.getElementById(atisElementId).textContent = `${atisInfo.letter || 'N/A'}`;
        document.getElementById(infoElementId).textContent = `${atisInfo.text || 'N/A'}`;
        document.getElementById(labelElementId).textContent = `${icao}`;
    } else {
        const metarInfo = await fetchMetar(icao);
        document.getElementById(atisElementId).textContent = '-';
        document.getElementById(infoElementId).textContent = `${metarInfo || 'N/A'}`;
        document.getElementById(labelElementId).textContent = `${icao}`;
    }
}
async function updateAllInfo() {
    const airports = [
        { icao: 'PHNL', callsign: 'PHNL_ATIS', atisElementId: 'phnl-atis', infoElementId: 'phnl-info', labelElementId: 'phnl-label' },
        { icao: 'PHTO', callsign: 'PHTO_ATIS', atisElementId: 'phto-atis', infoElementId: 'phto-info', labelElementId: 'phto-label' },
        { icao: 'PHKO', callsign: 'PHKO_ATIS', atisElementId: 'phko-atis', infoElementId: 'phko-info', labelElementId: 'phko-label' },
        { icao: 'PHLI', callsign: 'PHLI_ATIS', atisElementId: 'phli-atis', infoElementId: 'phli-info', labelElementId: 'phli-label' },
        { icao: 'PHOG', callsign: 'PHOG_ATIS', atisElementId: 'phog-atis', infoElementId: 'phog-info', labelElementId: 'phog-label' }
    ];

    for (const { icao, callsign, atisElementId, infoElementId, labelElementId } of airports) {
        await updateInfo(icao, callsign, atisElementId, infoElementId, labelElementId);
    }
}

updateAllInfo();
setInterval(updateAllInfo, 300000);
