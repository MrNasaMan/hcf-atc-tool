const optionList = ['PHNL','PHTO','PHKO','PHLI','PHOG'];

function populateDropdown() {
  const aptDropdown = document.getElementById('apt');
  aptDropdown.innerHTML = '';
  optionList.forEach((item) => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    aptDropdown.appendChild(option);
  });
  aptDropdown.onchange = loadChartsPopup;
  loadChartsPopup();
}

async function loadChartsPopup() {
  const airportSelect = document.getElementById('apt');
  const selectedAirport = airportSelect.value;
  try {
    const previousCharts = document.getElementById('chartsContainer');
    if (previousCharts) previousCharts.remove();

    const chartsResponse = await fetch(`https://api-v2.aviationapi.com/v2/charts?airport=${selectedAirport}`);
    const chartsData = await chartsResponse.json();

    // New API returns { airport_data: {...}, charts: { approach: [...], departure: [...], ... } }
    const charts = chartsData.charts;

    const categoryLabels = {
      airport_diagram: 'Airport Diagram',
      general:         'General',
      departure:       'Departure',
      arrival:         'Arrival',
      approach:        'Approach',
    };

    const popupContent = document.createElement('div');
    popupContent.id = 'chartsContainer';
    popupContent.classList.add('chart-popup-content');

    for (const [key, label] of Object.entries(categoryLabels)) {
      const categoryCharts = charts[key];
      if (!categoryCharts || categoryCharts.length === 0) continue;

      const chartCodeContainer = document.createElement('div');
      const chartCodeHeader = document.createElement('h3');
      chartCodeHeader.textContent = label;
      chartCodeContainer.appendChild(chartCodeHeader);

      categoryCharts.forEach((chart) => {
        const chartButton = document.createElement('chartbutton');
        chartButton.textContent = chart.chart_name;
        chartButton.setAttribute('role', 'button'); 
        chartButton.setAttribute('tabindex', '0');  
        chartButton.addEventListener('click', () => displayChart(chart.pdf_url)); 
        chartCodeContainer.appendChild(chartButton);
      });

      popupContent.appendChild(chartCodeContainer);
    }

    const popup = document.createElement('div');
    popup.classList.add('chart-popup');
    popup.appendChild(popupContent);
    document.body.appendChild(popup);

  } catch (error) {
    console.error('Error fetching charts:', error);
  }
}

function displayChart(pdfPath) {
  const topnavElement = document.getElementById('topnavv');
  if (!topnavElement) {
    console.error("Topnav element not found");
    return;
  }
  const topnavHeight = topnavElement.clientHeight;
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
  pdfContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', function () {
  populateDropdown();
});