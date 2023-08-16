function isValidIP(ipAddress) {
    if (ipAddress == null || ipAddress == "")
        return false;

    if (ipAddress.includes("-")) {
        return false;
    }

    var ipRegex = '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}' +
        '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$';
    if (ipAddress.match(ipRegex) != null)

        console.log("Got an IP " + ipAddress, isPrivateIP(ipAddress));

    return true;
};

// https://stackoverflow.com/questions/13969655/how-do-you-check-whether-the-given-ip-is-internal-or-not
function isPrivateIP(ip) {
    var parts = ip.split('.');
    return parts[0] === '10' ||
        (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
        (parts[0] === '192' && parts[1] === '168');
}

function isValidURL(url) {
    try {
        const regex = /((?:(?:http?|ftp)[s]*:\/\/)?[a-z0-9-%\/\&=?\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?)/gi
        if (!regex.test(url)) {
            return false;
        }

        if (url.endsWith(".exe") || url.endsWith(".ps1") || url.endsWith(".sh")) {
            return false;
        }

        if (url.includes("://")) {
            (new URL(url));
        }
        else {
            (new URL("http://" + url));
        }
        return true;
    }
    catch
    {
        return false;
    }
};