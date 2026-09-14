// calc.js

// --- 1. OCEANIC / SPACING CALCULATOR ---
function calculateSpacing() {
  const leadSpeed = parseFloat(document.getElementById('leadSpeed').value);
  const trailSpeed = parseFloat(document.getElementById('trailSpeed').value);
  const targetDist = parseFloat(document.getElementById('targetDist').value) || 0;
  const currentDist = parseFloat(document.getElementById('currentDist').value) || 0;
  const resultDiv = document.getElementById('calcResult');

  if (isNaN(leadSpeed) || isNaN(trailSpeed) || leadSpeed <= 0 || trailSpeed <= 0) {
    resultDiv.innerHTML = '<span style="color: #ff6b6b;">Please enter valid groundspeeds or Mach values.</span>';
    return;
  }

  const isMach = leadSpeed < 2.0 && trailSpeed < 2.0;
  const leadKts = isMach ? leadSpeed * 575 : leadSpeed;
  const trailKts = isMach ? trailSpeed * 575 : trailSpeed;

  const speedDiff = trailKts - leadKts;
  let html = `<div style="margin-top: 10px; line-height: 1.6;">`;

  if (speedDiff > 0) {
    const closureRateMin = (speedDiff / 60).toFixed(2);
    html += `<b>Closure Rate:</b> Trailing aircraft is gaining at <b>${closureRateMin} NM/min</b> (${speedDiff.toFixed(0)} kts faster).<br>`;

    if (currentDist > targetDist) {
      const bufferToLose = currentDist - targetDist;
      const minutesUntilLoss = (bufferToLose / (speedDiff / 60)).toFixed(1);
      html += `<b>Time to minimum spacing (${targetDist} NM):</b> <b>${minutesUntilLoss} minutes</b> (${(minutesUntilLoss * (leadKts / 60)).toFixed(0)} NM travel distance).<br>`;
    }
  } else if (speedDiff < 0) {
    html += `<b>Separation Trend:</b> Diverging. Distance increasing by <b>${(Math.abs(speedDiff) / 60).toFixed(2)} NM/min</b>.<br>`;
  } else {
    html += `<b>Separation Trend:</b> Constant spacing. Groundspeeds are identical.<br>`;
  }

  if (targetDist > 0) {
    const timeAtLeadSpeed = ((targetDist / leadKts) * 60).toFixed(1);
    html += `<b>Time Equivalent:</b> ${targetDist} NM behind leader = <b>${timeAtLeadSpeed} minutes</b> separation.`;
  }

  html += `</div>`;
  resultDiv.innerHTML = html;
}

// --- 2. TOP OF DESCENT (TOD) CALCULATOR ---
function calculateTOD() {
  const currentAlt = parseFloat(document.getElementById('todCurrentAlt').value);
  const targetAlt = parseFloat(document.getElementById('todTargetAlt').value);
  const gs = parseFloat(document.getElementById('todGS').value);
  const angle = parseFloat(document.getElementById('todAngle').value) || 3.0; // Default 3° descent
  const resultDiv = document.getElementById('todResult');

  if (isNaN(currentAlt) || isNaN(targetAlt) || isNaN(gs) || currentAlt <= targetAlt || gs <= 0) {
    resultDiv.innerHTML = '<span style="color: #ff6b6b;">Please enter valid altitudes (Current > Target) and a positive groundspeed.</span>';
    return;
  }

  const altToLose = currentAlt - targetAlt; // e.g. 35000 - 10000 = 25000 ft

  // 1. Distance required (NM): Altitude to lose / (tan(angle) * 6076.12 ft/NM)
  // At standard 3°, tan(3°) * 6076.12 ≈ 318.4 ft/NM (approximately 3 NM per 1,000 ft)
  const angleRad = (angle * Math.PI) / 180;
  const feetPerNM = Math.tan(angleRad) * 6076.12;
  const distRequiredNM = (altToLose / feetPerNM).toFixed(1);

  // 2. Required Vertical Speed (FPM): Groundspeed (NM/min) * feet per NM
  // Standard 3° rule of thumb: GS * 5 (e.g. 400 kts * 5 = 2,000 FPM)
  const nmPerMin = gs / 60;
  const requiredFPM = Math.round(nmPerMin * feetPerNM);

  // 3. Time to descend (Minutes)
  const timeMinutes = (altToLose / requiredFPM).toFixed(1);

  let html = `<div style="margin-top: 10px; line-height: 1.6;">`;
  html += `<b>Altitude to Lose:</b> ${altToLose.toLocaleString()} ft<br>`;
  html += `<b>Top of Descent (TOD):</b> Begin descent <b>${distRequiredNM} NM</b> prior to target fix/altitude.<br>`;
  html += `<b>Required Vertical Speed:</b> <b>-${requiredFPM.toLocaleString()} FPM</b> (at ${angle}° descent path).<br>`;
  html += `<b>Time in Descent:</b> <b>${timeMinutes} min</b> to reach target altitude.`;
  html += `</div>`;

  resultDiv.innerHTML = html;
}