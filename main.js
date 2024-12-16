// loads the dic
let dictionary = null;
async function fetchDic() {
    if (!dictionary) {
        const response = await fetch(chrome.runtime.getURL("pinyin.json"));
        dictionary = await response.json();
    }
    return dictionary;
}

// tones
const toneMap = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    v: ["ǖ", "ǘ", "ǚ", "ǜ"] 
};

// kinda broken but meh
const particles = ["le", "de", "ne", "men", "zai", "guo", "la", "ma", "ba", "jiu"];

// so there are these numbers in the dictionary im using to help for the tonestuff yeh just gets rid of those numbers
function applyTone(pinyin) {
    const toneMatch = pinyin.match(/([aeiouv]+)([1-4])/); 
    if (toneMatch) {
        const [_, vowels, tone] = toneMatch;
        const toneIndex = parseInt(tone, 10) - 1;

        // replaces numba with tone
        for (const char of vowels) {
            if (toneMap[char]) {
                pinyin = pinyin.replace(char + tone, toneMap[char][toneIndex]);
            }
        }
    }

    // still needs to remove numbers if there arny any tones cuz it skips them up there ^
    if (!/[āáǎà]/.test(pinyin)) {
        pinyin = pinyin.replace(/[1-4]/g, ''); 
    }

    return pinyin;
}

// replace chinese with pinyin 
async function convertP(text) {
    const dictionary = await fetchDic();
    let convertedText = "";
    let tempWord = "";

    // get each char data
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charCode = char.charCodeAt(0).toString(16).toUpperCase();
        let pinyin = dictionary[charCode] || char; // Get Pinyin or use character itself

        // is particle
        const particleMatch = particles.some(particle => pinyin.includes(particle));

        // then calls the tone function
        pinyin = applyTone(pinyin);

        // if particle dont add space
        if (particleMatch) {
            tempWord += pinyin;
        } else {
            // else do add space
            convertedText += tempWord + " ";
            tempWord = pinyin;
        }
    }
    // quick note i cant really do anything about words and spacing like if ur chinese word has to words init like yuishui or something too bad im lazy 
    convertedText += tempWord;

    return convertedText.trim(); // removes extra spaces
}

// scan for chinese stuff
async function spyConvert(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const originalText = node.textContent;
        
        // only converts the chinese stuff
        if (/[一-龯]/.test(originalText)) {
            node.textContent = await convertP(originalText);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (const child of node.childNodes) {
            await spyConvert(child); // repeat
        }
    }
}

(async () => {
    try {
        console.log("please work goddamit");
        await spyConvert(document.body); // erm debug logs bc i tried to add translate but that didnt go well
        console.log("nice it worked");
    } catch (error) {
        console.error("FUCK THIS EXTNETION", error);
    }
})();
