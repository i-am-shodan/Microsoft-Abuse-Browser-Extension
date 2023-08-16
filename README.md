# Microsoft abuse unofficial browser extension
This repository contains the code for a browser extension that can be used to report malicious IP/URLs to Microsoft. It is an unofficial open source browser extension for Chrome and Edge that allows you to report malicious URLs or IP addresses using the public MSRC abuse API. You can use it by either selecting some text on the page and clicking the browser extension button or just clicking the browser extension button (in which case it will use the active tab's current URL). You can then select the type of abuse report and click the report button to send it to MSRC.

## Features
- Easy and convenient way to report abuse originating from Microsoft online services
- Supports various types of abuse reports, such as phishing, malware, spam, etc.
- Validates and formats your input before sending it to the MSRC abuse API

## Installation
To install the extension, follow these steps:
1. Download or clone this repository to your local machine
1. Open Chrome or Edge and go to the extensions page (chrome://extensions or edge://extensions)
1. Enable developer mode
1. Click on "Load unpacked" and select the folder where you downloaded or cloned this repository
1. The extension should appear in your browser toolbar

## Usage
To use the extension, follow these steps:
1. Navigate to a web page that contains a malicious URL or IP address, or open a new tab with one
1. Select the URL or IP address on the page, or leave it blank if you want to use the current tab's URL
1. Click on the extension icon in your browser toolbar
1. A popup window will appear with a form to fill out
1. Select the type of abuse report from the dropdown menu
1. Optionally, add any additional information or comments in the text box
1. Click on the "Report" button
1. The extension will validate and format your input and send it to the MSRC abuse API
1. You will see a message indicating the status and response of your report

## License
This project is licensed under the MIT License - see the LICENSE file for details.

This extension is not authoried or maintained by Microsoft. It uses the Microsoft public abuse API only and is not affiliated with Microsoft in any way. Microsoft does not officially or unofficially support the use of this extension.

## References
- [New and Improved Report Abuse Portal and API! - msrc-blog.microsoft.com](https://msrc-blog.microsoft.com/2021/02/01/new-and-improved-report-abuse-portal-and-api/)
- [Report Abuse API – Microsoft Security Response Center](https://msrc-blog.microsoft.com/tag/report-abuse-api/)
- [GitHub - microsoft/MSRC-Microsoft-Engage-API: MSRC Engage API](https://github.com/Microsoft/MSRC-Microsoft-Engage-API)
