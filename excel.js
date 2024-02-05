let jsonOutputData;

function handleFileInput(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (file) {
    excelToJson(file)
      .then(data => {
        jsonOutputData = convertToRequiredFormat(data);
        document.getElementById('jsonOutput').textContent = jsonOutputData;
        enableDownloadLink(jsonOutputData);
      })
      .catch(error => {
        console.error("Error reading Excel file:", error);
      });
  }
}

function excelToJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      resolve(jsonData);
    };
    reader.onerror = function (error) {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
}

function convertToRequiredFormat(data) {
  const channelData = {
    "channel": {
      "wurl_channel_slug": "asiatvlimited_zeeworld_1",
      "title": "Zee World",
      "broadcast_url": "http://test1.com",
      "language": "en",
      "programs": [],
      "events": []
    }
  };

  // Skip the header row (starting from 2nd row)
  for (let i = 1; i < data.length; i++) {
    const programData = {
      "key": data[i][0],
      "title": data[i][1],
      "thumbnails": [
        {
          "url": data[i][4],
          "type": "image/jpg",
          "width": 600,
          "height": 900,
          "ratio": "16_9"
        }
      ],
      "content_type": "episode",
      "series": {
        "title": data[i][1],
        "description": data[i][3],
        "thumbnails": [
          {
            "url": data[i][4],
            "type": "url",
            "width": 600,
            "height": 900,
            "ratio": "16_9"
          }
        ],
        "season": {
          "title": data[i][5],
          "number": parseInt(data[i][6]),
          "episode_number": parseInt(data[i][7])
        }
      },
      "ratings": [
        {
          "source": "Program Rating",
          "rating": data[i][2]
        }
      ],
      "description": data[i][3]
    };

    const eventData = {
      "program_key": data[i][0],
      "time_slot": data[i][8],
      "duration": parseInt(data[i][9])
    };

    channelData.channel.programs.push(programData);
    channelData.channel.events.push(eventData);
  }

  return JSON.stringify(channelData, null, 2);
}

function enableDownloadLink(jsonData) {
  const downloadLink = document.getElementById('downloadLink');
  downloadLink.style.display = 'block';

  downloadLink.addEventListener('click', function () {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const currentDate = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
    const fileName = `output_${currentDate}.json`;
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = fileName;
  });
}

function sendToAPI() {
  const apiURL = 'https://ingest-api-prod.wurl.com/epgs'; // Replace with your actual API URL

  if (jsonOutputData && apiURL) {
    fetch(apiURL, {
      method: 'POST',
      mode:'no-cors',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'okGuMA3ZH8ay0agg8RP5D4gZNh8MoOAB2AxkmePe',

      },
      body: jsonOutputData,
    })
      .then(response => {
        if (response.ok) {
          document.getElementById('statusMessage').textContent = 'Data sent successfully!';
        } else {
          document.getElementById('statusMessage').textContent = 'Error sending data to the API.';
        }
      })
      .catch(error => {
        document.getElementById('statusMessage').textContent = 'Error: ' + error.message;
      });
  } else {
    document.getElementById('statusMessage').textContent = 'Please load an Excel file first.';
  }
}
