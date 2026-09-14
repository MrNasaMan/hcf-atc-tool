// aptscript.js
async function loadCharts() {
  const airportInput = document.getElementById('aptInput');
  let selectedAirport = airportInput.value.trim().toUpperCase();

  // If user enters a 3-letter FAA LID, prepend K or PH if applicable
  if (selectedAirport.length === 3 && !selectedAirport.startsWith('P')) {
    selectedAirport = 'K' + selectedAirport;
  }

  if (!selectedAirport) return;

  const outputContainer = document.getElementById('chartsContainer');
  outputContainer.innerHTML = '<p style="margin: 10px;">Fetching charts...</p>';

  try {
    const chartsResponse = await fetch(`https://api-v2.aviationapi.com/v2/charts?airport=${selectedAirport}`);
    const chartsData = await chartsResponse.json();

    const charts = chartsData.charts;
    outputContainer.innerHTML = '';

    if (!charts || Object.keys(charts).length === 0) {
      outputContainer.innerHTML = `<p style="margin: 10px; color: #ff6b6b;">No charts found for "${selectedAirport}".</p>`;
      return;
    }

    const categoryLabels = {
      airport_diagram: 'Airport Diagram',
      general:         'General',
      departure:       'Departure',
      arrival:         'Arrival',
      approach:        'Approach',
    };

    for (const [key, label] of Object.entries(categoryLabels)) {
      const categoryCharts = charts[key];
      if (!categoryCharts || categoryCharts.length === 0) continue;

      const chartCodeContainer = document.createElement('div');
      chartCodeContainer.style.margin = '10px 0';
      const chartCodeHeader = document.createElement('h3');
      chartCodeHeader.textContent = label;
      chartCodeContainer.appendChild(chartCodeHeader);

      categoryCharts.forEach((chart) => {
        const chartButton = document.createElement('button');
        chartButton.className = 'button2';
        chartButton.style.margin = '4px';
        chartButton.textContent = chart.chart_name;
        chartButton.addEventListener('click', () => displayChart(chart.pdf_url));
        chartCodeContainer.appendChild(chartButton);
      });

      outputContainer.appendChild(chartCodeContainer);
    }
  } catch (error) {
    console.error('Error fetching charts:', error);
    outputContainer.innerHTML = '<p style="margin: 10px; color: #ff6b6b;">Error querying charts API.</p>';
  }
}

function displayChart(pdfPath) {
  const topnavElement = document.getElementById('topnavv');
  const topnavHeight = topnavElement ? topnavElement.clientHeight : 50;
  const pdfContainer = document.getElementById('pdfContainer');
  pdfContainer.innerHTML = `
    <div id="pdfWrapper">
      <button id="exit-button" onclick="exitPdf()">Close PDF</button>
      <embed id="pdfEmbed" src="${pdfPath}#toolbar=1&navpanes=0" type="application/pdf" 
             style="width: 100vw; height: calc(100vh - ${topnavHeight}px);" />
    </div>`;
}

function exitPdf() {
  const pdfContainer = document.getElementById('pdfContainer');
  if (pdfContainer) pdfContainer.innerHTML = '';
}