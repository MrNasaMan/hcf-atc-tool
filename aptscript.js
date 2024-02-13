const optionList = ['PHNL', 'PHOG', 'PHTO', 'PHMK', 'PHLI', 'PHLU', 'PHKO', 'PHNY', 'PHHI', 'PHJR', 'PHMU'];

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
    if (previousCharts) {
      previousCharts.remove();
    }
    const chartsResponse = await fetch(`https://corsproxy.io/?https://api.aviationapi.com/v1/charts?apt=${selectedAirport}`);
    const chartsData = await chartsResponse.json();
    const organizedCharts = {
      'Approach': [],
      'Departure': [],
      'Arrival': [],
      'Other': [],
    };
    if (chartsData[selectedAirport] && chartsData[selectedAirport].length > 0) {
      chartsData[selectedAirport].forEach((chart) => {
        let chartCode = 'Other'; 

        if (chart.chart_code) {
          if (chart.chart_code.includes('IAP')) {
            chartCode = 'Approach';
          } else if (chart.chart_code.includes('DP')) {
            chartCode = 'Departure';
          } else if (chart.chart_code.includes('STAR')) {
            chartCode = 'Arrival';
          }
        }

        organizedCharts[chartCode]?.push(chart);
      });
    }
    const popupContent = document.createElement('div');
    popupContent.id = 'chartsContainer';
    popupContent.classList.add('chart-popup-content');
    for (const chartCode in organizedCharts) {
      const chartCodeContainer = document.createElement('div');

      const chartCodeHeader = document.createElement('h3');
      chartCodeHeader.textContent = chartCode;
      chartCodeContainer.appendChild(chartCodeHeader);

      organizedCharts[chartCode]?.forEach((chart) => {
        const chartButton = document.createElement('chartbutton');
        chartButton.textContent = chart.chart_name;
        chartButton.addEventListener('click', () => displayChart(chart.pdf_path));
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
      <embed id="pdfEmbed" src="${pdfPath}#toolbar=1navpanes=0" type="application/pdf" style="width: 100vw; height: calc(100vh - ${topnavHeight}px);" />
    </div>`;
}

function exitPdf() {
  const pdfContainer = document.getElementById('pdfContainer');
  pdfContainer.innerHTML = '';
}
document.addEventListener('DOMContentLoaded', function () {
  populateDropdown();
});
