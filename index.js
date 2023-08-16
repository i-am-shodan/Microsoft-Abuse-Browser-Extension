// start with the controls faded to error
$( function() {
    $( "input[type=radio]" ).checkboxradio();
  $( "fieldset" ).controlgroup();
} );

$('#main').fadeOut(0);
$('#ErrorText').fadeIn(0);

// wake up service worker
function onLoad() {
    chrome.runtime.sendMessage({ Type: "msrc-abuse-getstate", Request: {} }, storedData => {
        if (chrome.runtime.lastError) {
            console.log("There was a big error!", chrome.runtime.lastError);
            return;
        }

        if (storedData != null && Object.keys(storedData) != 0) {
            document.getElementById("nameField").value = storedData.State.Email;
            document.getElementById("emailField").value = storedData.State.Name;
            $('#ErrorText').fadeOut(0);
            $('#main').fadeIn(0);
        }
        else {
            console.log("Stored data is bad", storedData);
        }

    });
};

window.onload = async () => {
    changeSelectionBox();

    onLoad();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let result;
    try {
        [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => getSelection().toString(),
        });
    } catch (e) {
        return; // ignoring an unsupported page like chrome://extensions
    }

    console.log(`Result ${result}`);

    var indicatorSet = false;
    do
    {
        if (result == null || result.length == 0)
        {
            console.log("result was empty");
            break;
        }

        entities = getEntitiesFromText(result);

        if (entities == null || entities.length == 0)
        {
            console.log("entities were not found");
            break;
        }

        console.log(`Entities ${entities}`);
        setEntityAsIndicator(entities[0]);
        indicatorSet = true;
    }
    while (false);

    if (!indicatorSet)
    {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setEntityAsIndicator({ Type: "URL", Value: tab.url });
    }
};

function setEntityAsIndicator(entity) {
    document.getElementById("indicator").value = entity.Value;

    chrome.runtime.sendMessage({ Type: "msrc-abuse-check", Request: entity }, function (response) {
        console.log("Got check response of");
        console.log(response);
        if (!response)
        {
            document.getElementById("report").style.backgroundColor = "red";         
        }
        else
        {
            document.getElementById("report").style.backgroundColor = "";
        }
    });

    if (entity.Type == "URL")
    {
        $("#radio-url").prop("checked", true);
        $("#radio-url").checkboxradio("refresh");
    }
    else
    {
        $("#radio-ip").prop("checked", true);
        $("#radio-ip").checkboxradio("refresh");
    }
};

document.getElementById("radio-url").onchange = async () => {
    changeSelectionBox();
}

document.getElementById("radio-ip").onchange = async () => {
    changeSelectionBox();
}

function changeSelectionBox() {
    if (document.getElementById("radio-url").checked)
    {
        document.getElementById("incident_type").innerHTML = `<option value="Phishing">Phishing</option><option value="Malware">Malware</option><option value="Responsible AI">Responsible AI</option>`;
    }
    else
    {
        document.getElementById("incident_type").innerHTML = `<option value="Brute Force">Brute Force</option><option value="Denial of Service">Denial of Service</option><option value="Malware">Malware</option><option value="Scanning/Scraping">Scanning/Scraping</option><option value="Spam">Spam</option>`;
    }
};

document.getElementById("set-button").onclick = async () => {
    try {

        var emailExp = new RegExp(/^\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i);

        var email = $("#emailField").val(); // get the textbox value
        console.log(email);
        if (!emailExp.test(email)) {
            throw "Invalid email address";
        }

        var name = document.getElementById("nameField").value;

        if (name.length < 2) {
            throw "Too short";
        }

        var state = { Email: email, Name: name };
        chrome.runtime.sendMessage({ Type: "msrc-abuse-setstate", State: state }, function (response) {
            $('#ErrorText').fadeOut(0);
            $('#main').fadeIn(0);
        });
    }
    catch (error) {
        console.log(error);
        document.getElementById("validationMessage").innerText = error.toString();
    }
};

document.getElementById("hiddenButton").onclick = async () => {
    var answer = window.confirm("Erase settings?");
    if (answer) {
        chrome.storage.local.clear();
        window.close();
    }
};

document.getElementById("report").onclick = async () => {
    document.getElementById("report").disable = true;

    if (document.getElementById("report").style.backgroundColor == "red")
    {
        var confirmed = window.confirm("This doesn't look like a Microsoft indicator, still want to proceed?");
  
        if (!confirmed) {
            return;
        }
    }

    let date = new Date(); // get the current date and time
    let year = date.getUTCFullYear(); // get the year in UTC+0
    let month = date.getUTCMonth() + 1; // get the month in UTC+0 (0-11)
    let day = date.getUTCDate(); // get the day in UTC+0 (1-31)
    let hour = date.getUTCHours(); // get the hour in UTC+0 (0-23)
    let minute = date.getUTCMinutes(); // get the minute in UTC+0 (0-59)

    // format the date and time as strings
    let dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // 2020-12-01
    let timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`; // 11:00

    var request = {
        date: dateString,
        time: timeString,
        timeZone: "0000",
        reporterEmail: document.getElementById("emailField").value,
        reporterName: document.getElementById("nameField").value,
        reportNotes: document.getElementById("notes").value + " -- via browser extension",
        threatType: document.getElementById("radio-url").checked ? "URL" : "IP Address",
        incidentType: document.getElementById("incident_type").value,
        //"testSubmission": true
    }

    if (document.getElementById("radio-url").checked)
    {
        request.sourceUrl = document.getElementById("indicator").value;
    }
    else
    {
        request.sourceIp = document.getElementById("indicator").value;
    }

    console.log(request);

    chrome.runtime.sendMessage({ Type: "msrc-report", Request: request }, function (response) {
        console.log(response);
        if (response.message)
        {
            alert(response.message);
        }
        else
        {
            alert("Unknown error");
        }
    });

    document.getElementById("report").disable = false;
};