// tmu.js
const HCF_AIRPORTS = {
  PHNL: { name: 'Honolulu', lat: 21.3187, lon: -157.9224 },
  PHOG: { name: 'Kahului', lat: 20.8986, lon: -156.4305 },
  PHKO: { name: 'Kona', lat: 19.7388, lon: -156.0456 },
  PHLI: { name: 'Lihue', lat: 21.9760, lon: -159.3390 },
  PHTO: { name: 'Hilo', lat: 19.7203, lon: -155.0485 },
  PHMK: { name: 'Molokai', lat: 21.1529, lon: -157.0963 },
  PHNY: { name: 'Lanai', lat: 20.7856, lon: -156.9514 },
  PHJR: { name: 'Kalaeloa', lat: 21.3073, lon: -158.0704 },
  PNGF: { name: 'Kaneohe Bay', lat: 21.4502, lon: -157.7681 },
  PBKH: { name: 'Barking Sands', lat: 22.0229, lon: -159.7850 }
};

let tmuInterval = null;
let currentFilter = 'ALL';

// Haversine formula to compute Nautical Miles between two coordinates
function getDistanceNM(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchVatsimTraffic() {
  const statusEl = document.getElementById('tmuStatus');
  statusEl.textContent = 'Syncing...';

  try {
    const response = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();

    const pilots = data.pilots || [];
    processTraffic(pilots);

    const now = new Date();
    statusEl.textContent = `Live: ${now.toUTCString().slice(17, 25)}z (${pilots.length} online)`;
  } catch (err) {
    console.error('TMU Data Fetch Error:', err);
    statusEl.textContent = 'Data feed offline or throttled';
  }
}

function processTraffic(pilots) {
  const aptKeys = Object.keys(HCF_AIRPORTS);
  const inbounds = [];
  const outbounds = [];
  const interIsland = [];
  const airportDemand = {};

  aptKeys.forEach(k => { airportDemand[k] = { arr: 0, dep: 0 }; });

  pilots.forEach(pilot => {
    if (!pilot.flight_plan) return;

    const dep = (pilot.flight_plan.departure || '').toUpperCase().trim();
    const arr = (pilot.flight_plan.arrival || '').toUpperCase().trim();
    const isDepHCF = aptKeys.includes(dep);
    const isArrHCF = aptKeys.includes(arr);

    if (!isDepHCF && !isArrHCF) return;

    // Track airport stats
    if (isArrHCF && airportDemand[arr]) airportDemand[arr].arr++;
    if (isDepHCF && airportDemand[dep]) airportDemand[dep].dep++;

    // Compute remaining distance & ETA if inbound to an HCF airport
    let distRem = null;
    let eta = '--:--z';

    if (isArrHCF && pilot.latitude && pilot.longitude) {
      const destCoords = HCF_AIRPORTS[arr];
      distRem = Math.round(getDistanceNM(pilot.latitude, pilot.longitude, destCoords.lat, destCoords.lon));
      
      if (pilot.groundspeed && pilot.groundspeed > 50) {
        const timeHours = distRem / pilot.groundspeed;
        const etaDate = new Date(Date.now() + timeHours * 3600000);
        eta = etaDate.toUTCString().slice(17, 22) + 'z';
      }
    }

    const flight = {
      callsign: pilot.callsign,
      actype: pilot.flight_plan.aircraft_short || pilot.flight_plan.aircraft || '????',
      dep,
      arr,
      alt: pilot.altitude,
      filedAlt: pilot.flight_plan.altitude,
      gs: pilot.groundspeed,
      transponder: pilot.transponder,
      distRem,
      eta,
      route: pilot.flight_plan.route || 'DIRECT',
      lat: pilot.latitude,
      lon: pilot.longitude
    };

    if (isDepHCF && isArrHCF) {
      interIsland.push(flight);
    } else if (isArrHCF) {
      inbounds.push(flight);
    } else if (isDepHCF) {
      outbounds.push(flight);
    }
  });

  // Sort arrivals by closest distance first
  inbounds.sort((a, b) => (a.distRem || 9999) - (b.distRem || 9999));
  interIsland.sort((a, b) => (a.distRem || 9999) - (b.distRem || 9999));

  renderDemandPills(airportDemand);
  renderTMUTable(inbounds, outbounds, interIsland);
}

function renderDemandPills(demand) {
  const container = document.getElementById('tmuDemandPills');
  container.innerHTML = '';

  for (const [icao, stats] of Object.entries(demand)) {
    if (stats.arr === 0 && stats.dep === 0) continue;
    const pill = document.createElement('div');
    pill.className = 'tmu-pill';
    pill.innerHTML = `
      <b>${icao}</b>
      <span>ARR: <strong>${stats.arr}</strong></span>
      <span>DEP: <strong>${stats.dep}</strong></span>
    `;
    container.appendChild(pill);
  }

  if (container.children.length === 0) {
    container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">No active traffic filed for HCF airfields.</span>';
  }
}

function renderTMUTable(inbounds, outbounds, interIsland) {
  const tbody = document.getElementById('tmuTableBody');
  tbody.innerHTML = '';

  let listToRender = [];
  if (currentFilter === 'ALL') {
    listToRender = [...inbounds, ...interIsland, ...outbounds];
  } else if (currentFilter === 'ARR') {
    listToRender = [...inbounds, ...interIsland];
  } else if (currentFilter === 'DEP') {
    listToRender = [...outbounds, ...interIsland];
  } else if (currentFilter === 'INTER') {
    listToRender = interIsland;
  }

  const countBadge = document.getElementById('tmuTrafficCount');
  countBadge.textContent = `${listToRender.length} Flights`;

  if (listToRender.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: var(--text-muted);">No airborne traffic matching selected filter.</td></tr>`;
    return;
  }

  listToRender.forEach(f => {
    const isInter = HCF_AIRPORTS[f.dep] && HCF_AIRPORTS[f.arr];
    const typeBadge = isInter ? 'INTER-ISLAND' : (HCF_AIRPORTS[f.arr] ? 'INBOUND' : 'OUTBOUND');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 700; font-family: monospace;">${f.callsign}</td>
      <td><span class="route-badge">${f.actype}</span></td>
      <td><strong>${f.dep}</strong> &rarr; <strong>${f.arr}</strong></td>
      <td>${Math.round(f.alt).toLocaleString()} ft</td>
      <td>${f.gs} kts</td>
      <td style="font-family: monospace;">${f.transponder}</td>
      <td>${f.distRem !== null ? f.distRem + ' NM' : '--'}</td>
      <td style="font-weight: 700; color: var(--text-primary);">${f.eta}</td>
      <td><span class="tmu-type-tag ${typeBadge.toLowerCase()}">${typeBadge}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setTMUFilter(type, el) {
  currentFilter = type;
  document.querySelectorAll('.tmu-filter-btn').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');
  fetchVatsimTraffic();
}

function startTMUSync() {
  fetchVatsimTraffic();
  if (tmuInterval) clearInterval(tmuInterval);
  tmuInterval = setInterval(fetchVatsimTraffic, 25000); // 25 second refresh cadence
}