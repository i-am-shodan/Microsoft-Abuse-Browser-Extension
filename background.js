chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(`Background worker got request ${request}`);
    console.log(request);
    if (request.Type == "msrc-report") {
        console.log("got report");
        var data = request.Request;
        console.log("got data");
        console.log(data);
        sendReport(data).then(response => {
            console.log("Status", response.status);
            console.log("StatusText", response.statusText);
            console.log(response);
            sendResponse({ message : "The report was successfully send" });
        }).catch(err => sendResponse({ message : "An unexpected error occured: " + err.message}));
        return true;  // sendResponse will be called async
    }
    else if (request.Type == "msrc-abuse-getstate") {
        console.log("msrc-abuse-getstate - Getting state");
        chrome.storage.local.get("State", (storedData) => {
            console.log("msrc-abuse-getstate - Got state", storedData);
            sendResponse(storedData);
        });
        return true; // sendResponse will be called async
    }
    else if (request.Type == "msrc-abuse-setstate") {
        console.log("Setting state to", request.State);
        chrome.storage.local.set({ 'State': request.State });
        sendResponse();
    }
    else if (request.Type == "msrc-abuse-check")
    {
        console.log("msrc-abuse-check");
        var data = request.Request;
        var ret = true;
        if (data.Type == "IP")
        {
            console.log("Is IP so checking: "+data.Value);
            ret = isIPInPrefixes(data.Value);
        }
        else
        {
            var url = data.Value.includes("://") ? new URL(data.Value) : new URL("http://" + data.Value);
            ret = testHostInDomains(url.host);
        }
        sendResponse(ret);
    }
});

let fullDomains = [];
let domains = [];
let ipPrefixes = [];
processDomainsFile("microsoft");
processIPRangesCsv("msft-public-ips.csv");

async function loadFile(filename) {
    let response = await fetch(chrome.runtime.getURL("lookup/"+filename));
    let text = await response.text();
    return text;
}

async function processDomainsFile(filename) {
    let text = await loadFile(filename);
    let lines = text.split("\n");
    for (let line of lines) {
      if (line.startsWith("#")) {
        // comment, ignore
      } else if (line.startsWith("include:")) {
        // file include, process recursively
        let anotherFile = line.substring(8);
        await processDomainsFile(anotherFile);
      } else if (line.startsWith("full:")) {
        // full domain, add to list
        let domain = line.substring(5).split(" ").shift();
        fullDomains.push(domain);
      } else if (line.startsWith("regexp")) {
        // regexp, ignore
      } else if (line.trim() !== "") {
        // other non-empty line, add to list
        let domain = line.split(" ").shift();
        domains.push(domain);
      }
    }
}

async function processIPRangesCsv(filename)
{
    let text = await loadFile(filename);
    let lines = text.split("\n");

    const prefixIndex = 0;

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length > prefixIndex) {
        const prefix = columns[prefixIndex].trim();
        if (prefix) {
          ipPrefixes.push(prefix);
        }
      }
    }

    console.log(ipPrefixes);
}

async function sendReport(data) {

    console.log(`sendReport`);
    console.log(data);

    var url = 'https://api.msrc.microsoft.com/report/v2.0/abuse';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw Error(`${response.status} ${response.statusText}`);
    }

    return response;
};

function isIPInRange(ip, range) {
    const [ipAddress, prefixLength] = range.split('/');
    const ipAsNumber = ipAddress.split('.').reduce((acc, octet, index) => acc + (parseInt(octet) << (24 - index * 8)), 0);
    const prefixMask = 0xffffffff << (32 - parseInt(prefixLength));
    const ipAsNumberWithPrefix = ipAsNumber & prefixMask;
  
    const ipToCheckAsNumber = ip.split('.').reduce((acc, octet, index) => acc + (parseInt(octet) << (24 - index * 8)), 0);
  
    return (ipAsNumberWithPrefix === ipToCheckAsNumber & prefixMask);
}
  
function isIPInPrefixes(ip) {
    return ipPrefixes.some(prefix => isIPInRange(ip, prefix));
}

function testHostInDomains(host) {
    // Check if host appears exactly in fullDomains
    if (fullDomains.includes(host)) {
        return true;
    }
    
    // Check if host ends with any string in domains
    for (const domain of domains) {
        if (host.endsWith(domain)) {
            return true;
        }
    }
    
    return false;
}