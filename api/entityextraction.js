function getIPEntitiesFromText(text) {
    // we need to find a list of IPs BUT one IP might be represented in a few different forms
    // we need to coalese them all under a single object with multiple RawValues in them

    const ipAddressLookupToRaw = {};

    const re = /(\d+\[*[.]\]*\d+\[*[.]\]*\d+\[*[.]\]*\d+)/g; // matches IPs even if they are defanged with [] ie 1.2.3[.]4
    var m;

    do {
        m = re.exec(text);
        if (m) {
            var rawValue = m[1];
            var cleanedValue = rawValue.replace("[", "").replace("]", "").trim();

            if (isValidIP(cleanedValue)) {
                if (!ipAddressLookupToRaw[cleanedValue]) {
                    ipAddressLookupToRaw[cleanedValue] = [];
                }

                ipAddressLookupToRaw[cleanedValue].push(rawValue);
            }
        }
    } while (m);

    const entities = [];

    for (let [key, value] of Object.entries(ipAddressLookupToRaw)) {
        entities.push({ Type: "IP", Value: key, Enabled: true, RawValues: value });
    }

    return entities;
};

function getUrlsFromText(text) {
    const re = /((?:(?:http?|ftp)[s]*:\/\/)?[a-z0-9-%\/\&=?\.]+\[*[.]\]*[a-z0-9]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?)/g;

    const urlLookup = {};

    do {
        m = re.exec(text);
        if (m) {
            var rawValue = m[0].trim();
            var cleanedValue = rawValue.replace("[", "").replace("]", "").replace(/[).]+$/, ''); // unfang

            try {
                if (cleanedValue.includes("://")) {
                    new URL(cleanedValue); // will throw if invalid
                }
                else {
                    new URL("http://" + cleanedValue);  // will throw if invalid
                }

                if (!urlLookup[cleanedValue]) {
                    urlLookup[cleanedValue] = [];
                }

                urlLookup[cleanedValue].push(rawValue);
            }
            catch
            {
            }
        }
    } while (m);

    const entities = [];

    for (let [key, value] of Object.entries(urlLookup)) {
        entities.push({ Type: "URL", Value: key, Enabled: true, RawValues: value });
    }

    return entities;
};

function getDomainsFromText(text) {
    // You) what the hell is this regex?
    // Me) Well it turns out pulling domains out of text is not trivial!

    // It is basically \s(\w+(\[.\]|[.]))*([a-z]+\w*[-]*(\[.\]|[.])) fused with every valid TLD
    // Which you can get by running: curl -s http://data.iana.org/TLD/tlds-alpha-by-domain.txt | sed '1d; s/^ *//; s/ *$//; /^$/d' | awk '{print length" "$0}' | sort -rn | cut -d' ' -f2- | tr '\n' '|' | tr '[:upper:]' '[:lower:]' | sed 's/\(.*\)./\1/'
    // The \s(\w+(\[.\]|[.]))*([a-z]+\w*[-]*(\[.\]|[.])) regex is matching on
    // A space + (optional subdomain), domain followed by . then the TLD
    // Dot can either be [.] or . so we can unfang domains
    const re = /\s(\w+(\[.\]|[.]))*([a-z]+\w*[-]*(\[.\]|[.]))(xn--vermgensberatung-pwb|xn--vermgensberater-ctb|xn--clchc0ea0b2g2a9gcd|xn--w4r85el8fhu5dnra|travelersinsurance|northwesternmutual|xn--xkc2dl3a5ee0h|xn--mgberp4a5d4ar|xn--mgbai9azgqp6j|xn--mgbah1a3hjkrd|xn--bck1b9a5dre4c|xn--5su34j936bgsg|xn--xkc2al3hye2a|xn--mgbcpq6gpa1a|xn--mgba7c0bbn0a|xn--fzys8d69uvgm|xn--nqv7fs00ema|xn--mgbc0a9azcg|xn--mgbaakc7dvf|xn--mgba3a4f16a|xn--lgbbat1ad8j|xn--kcrx77d1x4a|xn--i1b6b1a6a2e|sandvikcoromant|kerryproperties|americanexpress|xn--rvc1e0am3e|xn--mgbx4cd0ab|xn--mgbi4ecexp|xn--mgbca7dzdo|xn--mgbbh1a71e|xn--mgbayh7gpa|xn--mgbaam7a8h|xn--mgba3a3ejt|xn--jlq61u9w7b|xn--jlq480n2rg|xn--h2breg3eve|xn--fiq228c5hs|xn--b4w605ferd|xn--80aqecdr1a|xn--6qq986b3xl|xn--54b7fta0cc|weatherchannel|kerrylogistics|cookingchannel|cancerresearch|bananarepublic|americanfamily|xn--ygbi2ammx|xn--yfro4i67o|xn--tiq49xqyj|xn--h2brj9c8c|xn--fzc2c9e2c|xn--fpcrj9c3d|xn--eckvdtc9d|xn--cckwcxetd|wolterskluwer|travelchannel|lifeinsurance|international|xn--qcka1pmc|xn--ogbpf8fl|xn--ngbe9e0a|xn--ngbc5azd|xn--mk1bu44c|xn--mgbt3dhd|xn--mgbpl2fh|xn--mgbgu82a|xn--mgbab2bd|xn--mgb9awbf|xn--gckr3f0f|xn--8y0a063a|xn--80asehdb|xn--80adxhks|xn--4dbrk0ce|xn--45br5cyl|xn--3e0b707e|versicherung|scholarships|lplfinancial|construction|xn--zfr164b|xn--xhq521b|xn--w4rs40l|xn--vuq861b|xn--t60b56a|xn--ses554g|xn--s9brj9c|xn--rovu88b|xn--rhqv96g|xn--q9jyb4c|xn--pgbs0dh|xn--otu796d|xn--nyqy26a|xn--mix891f|xn--mgbtx2b|xn--mgbbh1a|xn--kpry57d|xn--kprw13d|xn--jvr189m|xn--j6w193g|xn--imr513n|xn--hxt814e|xn--h2brj9c|xn--gk3at1e|xn--gecrj9c|xn--g2xx48c|xn--flw351e|xn--fjq720a|xn--fct429k|xn--efvy88h|xn--d1acj3b|xn--czr694b|xn--cck2b3b|xn--9krt00a|xn--80ao21a|xn--6frz82g|xn--55qw42g|xn--45brj9c|xn--42c2d9a|xn--3hcrj9c|xn--3ds443g|xn--3bst00m|xn--2scrj9c|xn--1qqw23a|xn--1ck2e1b|xn--11b4c3d|williamhill|redumbrella|progressive|productions|playstation|photography|olayangroup|motorcycles|lamborghini|kerryhotels|investments|foodnetwork|enterprises|engineering|creditunion|contractors|calvinklein|bridgestone|blockbuster|blackfriday|barclaycard|accountants|xn--y9a3aq|xn--wgbl6a|xn--wgbh1c|xn--unup4y|xn--q7ce6a|xn--pssy2u|xn--o3cw4h|xn--mxtq1m|xn--kput3i|xn--io0a7i|xn--fiqz9s|xn--fiqs8s|xn--fiq64b|xn--czru2d|xn--czrs0t|xn--cg4bki|xn--c2br7g|xn--9et52u|xn--9dbq2a|xn--90a3ac|xn--80aswg|xn--5tzm5g|xn--55qx5d|xn--4gbrim|xn--45q11c|xn--3pxu8k|xn--30rr7y|volkswagen|vlaanderen|university|technology|tatamotors|schaeffler|restaurant|republican|realestate|prudential|protection|properties|nextdirect|mitsubishi|management|industries|immobilien|healthcare|foundation|extraspace|eurovision|cuisinella|creditcard|consulting|capitalone|boehringer|bnpparibas|basketball|associates|apartments|accountant|yodobashi|xn--vhquv|xn--tckwe|xn--qxa6a|xn--p1acf|xn--nqv7f|xn--ngbrx|xn--l1acc|xn--j1amh|xn--j1aef|xn--fhbei|xn--e1a4c|xn--d1alf|xn--c1avg|xn--90ais|vacations|travelers|stockholm|statefarm|statebank|solutions|shangrila|richardli|pramerica|passagens|panasonic|microsoft|melbourne|marshalls|marketing|lifestyle|landrover|lancaster|kuokgroup|insurance|institute|homesense|homegoods|homedepot|hisamitsu|goldpoint|furniture|frontdoor|fresenius|firestone|financial|fairwinds|equipment|education|directory|community|christmas|bloomberg|barcelona|aquarelle|analytics|amsterdam|allfinanz|alfaromeo|accenture|yokohama|xn--qxam|xn--p1ai|xn--node|xn--90ae|woodside|verisign|ventures|vanguard|training|supplies|stcgroup|software|softbank|showtime|shopping|services|security|samsclub|saarland|reliance|redstone|property|plumbing|pictures|pharmacy|partners|observer|mortgage|merckmsd|memorial|mckinsey|maserati|marriott|lundbeck|lighting|jpmorgan|istanbul|ipiranga|infiniti|hospital|holdings|helsinki|hdfcbank|guardian|graphics|grainger|goodyear|frontier|football|firmdale|fidelity|feedback|exchange|etisalat|ericsson|engineer|download|discover|discount|diamonds|democrat|deloitte|delivery|computer|commbank|clothing|clinique|cleaning|cityeats|cipriani|catholic|catering|capetown|business|builders|brussels|broadway|bradesco|boutique|baseball|bargains|barefoot|barclays|attorney|allstate|airforce|abudhabi|zuerich|youtube|yamaxun|xfinity|winners|windows|whoswho|wedding|website|weather|watches|wanggou|walmart|trading|toshiba|tiffany|tickets|theatre|theater|temasek|systems|surgery|support|storage|staples|singles|shiksha|science|schwarz|schmidt|sandvik|samsung|rexroth|reviews|rentals|recipes|realtor|politie|pioneer|philips|origins|organic|oldnavy|okinawa|neustar|network|netflix|netbank|monster|markets|lincoln|limited|leclerc|latrobe|lasalle|lanxess|lacaixa|komatsu|kitchen|juniper|jewelry|ismaili|hyundai|hotmail|hoteles|hosting|holiday|hitachi|hangout|hamburg|guitars|grocery|godaddy|genting|gallery|fujitsu|frogans|forsale|flowers|florist|flights|fitness|fishing|finance|ferrero|ferrari|fashion|farmers|express|exposed|domains|digital|dentist|cruises|cricket|courses|coupons|country|corsica|cooking|contact|compare|company|comcast|cologne|college|clubmed|citadel|chintai|charity|channel|careers|caravan|capital|bugatti|brother|booking|bestbuy|bentley|bauhaus|banamex|avianca|auspost|audible|auction|athleta|android|alibaba|agakhan|academy|abogado|zappos|yandex|yachts|xihuan|webcam|walter|vuelos|voyage|voting|vision|virgin|villas|viking|viajes|unicom|travel|toyota|tkmaxx|tjmaxx|tienda|tennis|tattoo|target|taobao|taipei|sydney|swatch|suzuki|supply|studio|stream|social|soccer|shouji|select|secure|search|schule|school|sanofi|sakura|safety|ryukyu|rogers|rocher|review|report|repair|reisen|realty|racing|quebec|pictet|physio|photos|pfizer|otsuka|orange|oracle|online|olayan|office|nowruz|norton|nissay|nissan|natura|nagoya|mutual|museum|moscow|mormon|monash|mobile|mattel|market|makeup|maison|madrid|luxury|london|locker|living|lefrak|lawyer|latino|lancia|kosher|kindle|kinder|kaufen|juegos|joburg|jaguar|intuit|insure|imamat|hughes|hotels|hockey|hiphop|hermes|health|gratis|google|global|giving|george|garden|gallup|futbol|flickr|family|expert|events|estate|energy|emerck|durban|dupont|dunlop|doctor|direct|design|dental|degree|dealer|datsun|dating|cruise|credit|coupon|condos|comsec|coffee|clinic|claims|circle|church|chrome|chanel|center|casino|career|camera|broker|boston|bostik|bharti|berlin|beauty|bayern|author|aramco|anquan|amazon|alstom|alsace|alipay|airtel|airbus|agency|africa|abbvie|abbott|abarth|yahoo|xerox|world|works|weibo|weber|watch|wales|volvo|vodka|video|vegas|ubank|tushu|tunes|trust|trade|tours|total|toray|tools|tokyo|today|tmall|tirol|tires|tatar|swiss|sucks|style|study|store|stada|sport|space|solar|smile|smart|sling|skype|shoes|shell|sharp|seven|sener|salon|rugby|rodeo|rocks|ricoh|reise|rehab|radio|quest|promo|prime|press|praxi|poker|place|pizza|photo|phone|party|parts|paris|osaka|omega|nowtv|nokia|ninja|nikon|nexus|music|movie|money|miami|media|mango|macys|lotto|lotte|locus|loans|lipsy|linde|lilly|lexus|legal|lease|lamer|kyoto|koeln|jetzt|irish|ikano|hyatt|house|horse|honda|homes|guide|gucci|group|gripe|green|gmail|globo|glass|gives|gifts|games|gallo|forum|forex|final|fedex|faith|epson|email|edeka|earth|dubai|drive|delta|deals|dance|dabur|cymru|crown|codes|coach|cloud|click|citic|cisco|cheap|chase|cards|canon|build|bosch|boats|black|bingo|bible|beats|baidu|azure|autos|audio|archi|apple|amica|amfam|aetna|adult|actor|zone|zero|zara|yoga|xbox|work|wine|wiki|wien|weir|wang|voto|vote|vivo|viva|visa|vana|tube|toys|town|tips|tiaa|teva|tech|team|taxi|talk|surf|star|spot|sony|song|sohu|sncf|skin|site|sina|silk|show|shop|shia|shaw|sexy|seek|seat|scot|saxo|save|sarl|sale|safe|ruhr|rsvp|room|rich|rest|rent|reit|read|qpon|prof|prod|post|porn|pohl|plus|play|pink|ping|pics|pccw|pars|page|open|ollo|nike|nico|next|news|navy|name|moto|moda|mobi|mint|mini|menu|meme|meet|maif|luxe|ltda|love|loft|loan|live|link|limo|like|life|lidl|lgbt|lego|land|kred|kpmg|kiwi|kids|kddi|jprs|jobs|jeep|java|itau|info|immo|imdb|ieee|icbc|hsbc|host|hgtv|here|help|hdfc|haus|hair|guru|guge|goog|golf|gold|gmbh|gift|ggee|gent|gbiz|game|fund|free|ford|food|flir|fish|fire|film|fido|fiat|fast|farm|fans|fail|fage|erni|dvag|docs|dish|diet|desi|dell|deal|dclk|date|data|cyou|coop|cool|club|city|citi|chat|cern|cbre|cash|case|casa|cars|care|camp|call|cafe|buzz|book|bond|bofa|blue|blog|bing|bike|best|beer|bbva|bank|band|baby|auto|audi|asia|asda|arte|arpa|army|arab|amex|ally|akdn|aero|adac|able|aarp|zip|yun|you|xyz|xxx|xin|wtf|wtc|wow|wme|win|wed|vip|vin|vig|vet|ups|uol|uno|ubs|tvs|tui|trv|top|tjx|thd|tel|tdk|tci|tax|tab|stc|srl|spa|soy|sky|ski|sfr|sex|sew|ses|scb|sca|sbs|sbi|sas|sap|rwe|run|rip|rio|ril|ren|red|pwc|pub|pru|pro|pnc|pin|pid|phd|pet|pay|ovh|ott|org|ooo|onl|ong|one|obi|nyc|ntt|nrw|nra|now|nhk|ngo|nfl|new|net|nec|nba|nab|mtr|mtn|msd|mov|mom|moi|moe|mma|mls|mlb|mit|mil|men|med|mba|map|man|ltd|lpl|lol|llp|llc|lds|law|lat|krd|kpn|kim|kia|kfh|joy|jot|jnj|jmp|jll|jio|jcb|itv|ist|int|ink|ing|inc|ifm|icu|ice|ibm|how|hot|hkt|hiv|hbo|gov|got|gop|goo|gmx|gmo|gle|gea|gdn|gay|gap|gal|fyi|fun|ftr|frl|fox|foo|fly|fit|fan|eus|esq|edu|eco|eat|dvr|dtv|dot|dog|dnp|diy|dhl|dev|dds|day|dad|crs|cpa|com|cfd|cfa|ceo|cbs|cbn|cba|cat|car|cam|cal|cab|bzh|buy|box|bot|boo|bom|bmw|bms|biz|bio|bid|bet|bcn|bcg|bbt|bbc|bar|axa|aws|art|app|aol|anz|aig|afl|aeg|ads|aco|abc|abb|aaa|zw|zm|za|yt|ye|ws|wf|vu|vn|vi|vg|ve|vc|va|uz|uy|us|uk|ug|ua|tz|tw|tv|tt|tr|to|tn|tm|tl|tk|tj|th|tg|tf|td|tc|sz|sy|sx|sv|su|st|ss|sr|so|sn|sm|sl|sk|sj|si|sh|sg|se|sd|sc|sb|sa|rw|ru|rs|ro|re|qa|py|pw|pt|ps|pr|pn|pm|pl|pk|ph|pg|pf|pe|pa|om|nz|nu|nr|np|no|nl|ni|ng|nf|ne|nc|na|mz|my|mx|mw|mv|mu|mt|ms|mr|mq|mp|mo|mn|mm|ml|mk|mh|mg|me|md|mc|ma|ly|lv|lu|lt|ls|lr|lk|li|lc|lb|la|kz|ky|kw|kr|kp|kn|km|ki|kh|kg|ke|jp|jo|jm|je|it|is|ir|iq|io|in|im|il|ie|id|hu|ht|hr|hn|hm|hk|gy|gw|gu|gt|gs|gr|gq|gp|gn|gm|gl|gi|gh|gg|gf|ge|gd|gb|ga|fr|fo|fm|fk|fj|fi|eu|et|es|er|eg|ee|ec|dz|do|dm|dk|dj|de|cz|cy|cx|cw|cv|cu|cr|co|cn|cm|cl|ck|ci|ch|cg|cf|cd|cc|ca|bz|by|bw|bv|bt|bs|br|bo|bn|bm|bj|bi|bh|bg|bf|be|bd|bb|ba|az|ax|aw|au|at|as|ar|aq|ao|am|al|ai|ag|af|ae|ad|ac)\s/g;
    const domainLookupToRaw = {};

    do {
        m = re.exec(text);
        if (m) {
            var rawValue = m[0].trim();
            var cleanedValue = rawValue.replace("[", "").replace("]", ""); // unfang

            if (!domainLookupToRaw[cleanedValue]) {
                domainLookupToRaw[cleanedValue] = [];
            }

            domainLookupToRaw[cleanedValue].push(rawValue);
        }
    } while (m);

    const entities = [];

    for (let [key, value] of Object.entries(domainLookupToRaw)) {
        entities.push({ Type: "Domain", Value: key, Enabled: true, RawValues: value });
    }

    return entities;
};

function getHashesFromText(text) {
    var hashes = new Set();
    const re = /((([a-f0-9]{32})[a-f0-9]{0,8})[a-f0-9]{0,24})/gi

    do {
        m = re.exec(text);
        if (m) {
            hashes.add(m[0].trim());
        }
    } while (m);

    const entities = [];

    hashes.forEach(function callback(key, value, Set) {
        var type = (key.length == 32) ? "MD5" : (key.length == 40) ? "SHA1" : "SHA256";
        var rawValues = [];
        rawValues.push(key);
        entities.push({ Type: type, Value: key, Enabled: true, RawValues: rawValues });
    });

    return entities;
};

function getEntitiesFromText(text) {
    var arr1 = getIPEntitiesFromText(text);
    var arr2 = getDomainsFromText(text);
    var arr3 = getUrlsFromText(text);
    var arr4 = getHashesFromText(text);

    var dedupe = new Set();
    var entitiesWithDuplicates = arr1.concat(arr2).concat(arr3).concat(arr4);
    entities = [];

    entitiesWithDuplicates.forEach(entity => {

        // If set doesn't have our values then keep it
        if (!dedupe.has(entity.Value)) {
            dedupe.add(entity.Value);
            entities.push(entity);
        }
    });

    return entities;
};