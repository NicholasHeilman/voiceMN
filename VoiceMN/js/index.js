// =========================================================
// main
// =========================================================
function main() {
	initializeButtons();
	initializeTextarea();
	setKeys();
	voice(window.annyangCommands);
	loadUserCommands(window.userCommands);
}

$(document).ready(main);
//
// =========================================================
// storage
// =========================================================
// window.storage = localforage;
window.storage = new Firestorage("notes");
//
// =========================================================
// annyang
// =========================================================
window.userCommands = {};
window.annyangCommands = {
	"llama set color :color": function (color) {
		logVoice("llama set color :color ", color);
		$("#buttons").css("backgroundColor", color);
		$("#buttons").html("<button>Nice!</button>", color);
		$("#hw").html("\n\n\n ~ooh colorful~ ", color);
	},
	"llama save": function () {
		logVoice("llama save");
		save();
	},
	"llama read key :key": function (key) {
		logVoice("llama read key :key ", key);
		read(key);
	},
	"llama to do": function () {
		logVoice("llama todo");
		read("todo");
	},
	"llama search *text": function (text) {
		logVoice("llama search *text ", text);
		googleSearch(text);
	},
	"llama CSS *text": function (text) {
		logVoice("llama CSS *text", text);
		googleSearchLucky("MDN CSS " + text);
	},
	"llama jQuery *text": function (text) {
		logVoice("llama jQuery *text", text);
		googleSearchLucky("jQuery " + text);
	},
	"llama voice reference": function () {
		Annyang();
	},
	"llama email": function () {
		email();
	},
	"llama translate to :language *text": function (language, text) {
		translateTo(language, text);
	},
	"llama :quarter stats": {
		"regexp": /^llama (January|April|July|October) stats$/, "callback": function (quarter) {
			appendLog("llama " + quarter + " stats");
		},
	},
};

function voice(commands) {
	if (annyang) {
		// Remove commands
		annyang.removeCommands();
		// Add system commands to annyang
		annyang.addCommands(commands);
		annyang.addCallback("resultNoMatch", function (phrases) {
			var withllama = phrases.filter(each => each.startsWith("llama"));
			if (withllama.length) {
				growl(("resultNoMatch " + withllama));
			}
		});
		annyang.addCallback("start", function () {
			eventAnnyangStart();
		});
		annyang.addCallback("end", function () {
			eventAnnyangEnd();
		});
		annyang.start({autoRestart: true, continuous: false});
	}
}

function eventAnnyangStart() {
	$("#buttons").css("backgroundColor", "sandybrown");
	$("#voiceStart").prop("disabled", true);
	$("#voiceEnd").prop("disabled", false);
}

function eventAnnyangEnd() {
	$("#buttons").css("backgroundColor", "orange");
	$("#voiceStart").prop("disabled", false);
	$("#voiceEnd").prop("disabled", true);
}

// =========================================================
// buttons
// =========================================================
function initializeButtons() {
	// ==========
	// buttons
	// ==========
	$("#btnSave").click(function () {
		save();
	});
	$("#btnDelete").click(function () {
		deletePage();
	});
	$("#btnTodo").click(function () {
		read("todo");
	});
	$("#voiceStart").click(function () {
		annyang.start({autoRestart: true, continuous: false});
	});
	$("#voiceEnd").click(function () {
		annyang.abort();
	});
	$("#btnGoogle").click(function () {
		var text = $("#entryField").val();
		googleSearch(text);
	});
	$("#btnSearchCSS").click(function () {
		var text = $("#entryField").val();
		googleSearchLucky("MDN CSS " + text);
	});
	$("#btnSearchJQuery").click(function () {
		var text = $("#entryField").val();
		googleSearchLucky("jQuery " + text);
	});
	$("#btnAnnyang").click(function () {
		Annyang();
	});
	$("#btnTranslate").click(function () {
		getSearchText().then(text => {
			translateTo(language, text);
		});
	});
	$("#btnWiktionary").click(function () {
		getSearchText().then(text => {
			text.split(" ").forEach(each => {
				openTab(`https://en.wiktionary.org/w/index.php?search=${encodeURIComponent(each)}&title=${encodeURIComponent(each)}`);
			});
		});
	});
	$("#btnEmail").click(function () {
		email();
	});
	// ==========
	// translation
	// ==========
	Object.keys(languageCodes).forEach(each => {
		$(".translation .dropdown .dropdown-menu").append(`<button class="dropdown-item" type="button">${each}</button>`);
	});
	$(".translation .dropdown .dropdown-item").click(function () {
		language = $(this).text();
		$(".translation .dropdown .btn").text(language);
	});
	$(".translation .dropdown .btn").text(language);
}

// =========================================================
// keydown
// =========================================================
function initializeTextarea() {
	$("#textBox").keydown(event => {
		if (event.metaKey || event.ctrlKey) {
			//command
			if (event.key === "s") {
				//command-S
				event.preventDefault();
				event.stopPropagation();
				save();
			}
		}
	});
}

// =========================================================
// pages
// =========================================================
function save() {
	var text = $("#textBox").val();
	var key = text.split("\n")[0].trim();
	storage.setItem(key, text, function (error) {
		setKeys();
	});
	addLinks(text);
	growl("save() " + key);
}

function deletePage() {
	var text = $("#textBox").val();
	var key = text.split("\n")[0].trim();
	storage.keys(function (error, keys) {
		const newIndex = (keys.indexOf(key) + 1) % keys.length;
		const newKey = keys[newIndex];
		storage.removeItem(key, function (error) {
			setKeys();
		});
		read(newKey);
	});
	growl("deletePage() " + key);
}

function read(sKey) {
	storage.getItem(sKey, function (error, text) {
		$("#textBox").val(text);
		addLinks(text);
	});
	growl("read() " + sKey);
}

function setKeys() {
	storage.keys(function (error, keys) {
		setListItems("ulKeys", keys);
		$("#ulKeys li").click(function () {
			var key = $(this).text();
			read(key);
		});
	});
}

function setListItems(sId, asItems) {
	var $ul = $("#" + sId);
	$ul.empty();
	asItems.sort().forEach(function (each) {
		$ul.append(`<li>${each}</li>`);
	});
}

// =========================================================
// log
// =========================================================
function appendLog(text) {
	const oldText = $("#log").val();
	const startText = oldText? oldText + "\n" : "";
	const newText = startText + text.toString();
	$("#log").val(newText);
}

function clearLog() {
	$("#log").val("");
}

function logVoice(string, value) {
	const valueString = value ? " >> " + value : "";
	const output = "==Voice: " + string + valueString;
	growl(output);
}

// =========================================================
// functions
// =========================================================
function email() {
	var text = $("#textBox").val();
	var key = text.split("\n")[0].trim();
	var textEncoded = encodeURIComponent(text);
	var url = `mailto:""?subject=${"Vox Note: " + key}&body=${textEncoded}`;
	window.open(url);
}

function googleSearch(sTerm) {
	var term = spacesToPlus(sTerm);
	openTab(`https://www.google.com/search?q=${term}&oq=${term}`);
}

function googleSearchLucky(sTerm) {
	googleSearch(sTerm + "&btnI");
}

function openTab(url) {
	var win = window.open(url, "_blank");
	win.focus();
}

function spacesToPlus(s) {
	return s.replace("/\s+/g", "+");
}

function translateTo(sLanguage, sText) {
	var code = languageCodes[sLanguage];
	growl("translate to " + sLanguage + " " + code);
	translate(sText, "auto", code);
}

function translate(sText, sFrom = "auto", sTo = "ru") {
	openTab(`https://translate.google.com/#view=home&op=translate&sl=${sFrom}&tl=${sTo}&text=${sText}`);
}

function Annyang() {
	openTab("https://github.com/TalAter/annyang/tree/master/docs");
}

function getSearchText() {
	// promise(text)
	const text = $("#entryField").val();
	if (text) {
		return Promise.resolve(text);
	} else {
		return navigator.clipboard.readText();
	}
}

var languageCodes = {
	"Afrikaans": "af",
	"Albanian": "sq",
	"Amharic": "am",
	"Arabic": "ar",
	"Armenian": "hy",
	"Azerbaijani": "az",
	"Basque": "eu",
	"Belarusian": "be",
	"Bengali": "bn",
	"Bosnian": "bs",
	"Bulgarian": "bg",
	"Catalan": "ca",
	"Cebuano": "ceb",
	"Chinese (Simplified)": "zh-CN",
	"Chinese (Traditional)": "zh-TW",
	"Corsican": "co",
	"Croatian": "hr",
	"Czech": "cs",
	"Danish": "da",
	"Dutch": "nl",
	"English": "en",
	"Esperanto": "eo",
	"Estonian": "et",
	"Finnish": "fi",
	"French": "fr",
	"Frisian": "fy",
	"Galician": "gl",
	"Georgian": "ka",
	"German": "de",
	"Greek": "el",
	"Gujarati": "gu",
	"Haitian Creole": "ht",
	"Hausa": "ha",
	"Hawaiian": "haw",
	"Hebrew": "he**",
	"Hindi": "hi",
	"Hmong": "hmn",
	"Hungarian": "hu",
	"Icelandic": "is",
	"Igbo": "ig",
	"Indonesian": "id",
	"Irish": "ga",
	"Italian": "it",
	"Japanese": "ja",
	"Javanese": "jw",
	"Kannada": "kn",
	"Kazakh": "kk",
	"Khmer": "km",
	"Korean": "ko",
	"Kurdish": "ku",
	"Kyrgyz": "ky",
	"Lao": "lo",
	"Latin": "la",
	"Latvian": "lv",
	"Lithuanian": "lt",
	"Luxembourgish": "lb",
	"Macedonian": "mk",
	"Malagasy": "mg",
	"Malay": "ms",
	"Malayalam": "ml",
	"Maltese": "mt",
	"Maori": "mi",
	"Marathi": "mr",
	"Mongolian": "mn",
	"Myanmar (Burmese)": "my",
	"Nepali": "ne",
	"Norwegian": "no",
	"Nyanja (Chichewa)": "ny",
	"Pashto": "ps",
	"Persian": "fa",
	"Polish": "pl",
	"Portuguese (Portugal, Brazil)": "pt",
	"Punjabi": "pa",
	"Romanian": "ro",
	"Russian": "ru",
	"Samoan": "sm",
	"Scots Gaelic": "gd",
	"Serbian": "sr",
	"Sesotho": "st",
	"Shona": "sn",
	"Sindhi": "sd",
	"Sinhala (Sinhalese)": "si",
	"Slovak": "sk",
	"Slovenian": "sl",
	"Somali": "so",
	"Spanish": "es",
	"Sundanese": "su",
	"Swahili": "sw",
	"Swedish": "sv",
	"Tagalog (Filipino)": "tl",
	"Tajik": "tg",
	"Tamil": "ta",
	"Telugu": "te",
	"Thai": "th",
	"Turkish": "tr",
	"Ukrainian": "uk",
	"Urdu": "ur",
	"Uzbek": "uz",
	"Vietnamese": "vi",
	"Welsh": "cy",
	"Xhosa": "xh",
	"Yiddish": "yi",
	"Yoruba": "yo",
	"Zulu": "zu",
};
let language = "Romanian";
// ====================
// Commands
// ====================
class Command {
	constructor(oOptions) {
		//button, voice, function
		this.options_ = oOptions;
		if (oOptions.fArguments && oOptions.fBody) {
			oOptions.function = new Function(oOptions.fArguments, oOptions.fBody);
		}
	}

	id() {
		return "btn" + _.upperFirst(_.camelCase(this.options_.button));
	}

	titleWithSpan() {
		return this.options_.button.replace(/\[\[/g, "<span class=\"under\">").replace(/\]\]/g, "</span>");
	}

	$newButton() {
		const f = this.options_.function;
		return $("<button/>")
			.prop("id", this.id())
			.prop("title", this.options_.voice)
			.addClass("commandButton")
			.addClass("autoGenerated")
			.html(this.titleWithSpan())
			.click(function () {
				getSearchText().then(text => f(text));
			});
	}

	addToId(sId) {
		const parent = $("#" + sId);
		parent.append(this.$newButton());
		return parent;
	}

	addToCommands(oCommands) {
		oCommands["llama " + this.options_.voice] = this.options_.function;
		return oCommands;
	}
}

function loadCommand(oData, oCommands) {
	const command = new Command(oData);
	command.addToId("buttons2");
	command.addToCommands(oCommands);
}

function loadUserCommands(oCommands) {
	storage.keys().then(function (keys) {
		const commandKeys = keys.filter(each => each.startsWith("c_"));
		return Promise.all(commandKeys.map(function (key) {
			return storage.getItem(key).then(function (text) {
				const yamls = text.split("\n===<yaml>===\n").slice(1).map(each => parseYaml(each.trim()));
				yamls.forEach(each => loadCommand(each, oCommands));
			});
		}));
	}).then(function () {
		annyang.addCommands(oCommands);
	});
}

// =========================================================
// eval
// =========================================================
function evalText(sText) {
	const delimiter = "===//===";
	const text = sText;
	let body, code, result;
	if (text.includes(delimiter)) {
		body = text.slice(0, text.indexOf(delimiter)).trim();
	} else {
		body = text.trim();
	}
	if (!body) {
		body = "3 + 4";
	}
	try {
		code = `try{${body}} catch(error) {error}`;
		result = evalInContext(code, window);
	} catch (error) {
		// with parentheses
		code = `try{(${body})} catch(error) {error}`;
		result = evalInContext(code, window);
	}
	return body + "\n\n" + delimiter + "\n\n" + JSON.stringify(result);
}

function evalInContext(js, context) {
	//# Return the results of the in-line anonymous function we .call with the passed context
	return function () {
		return eval(js);
	}.call(context);
}

// =========================================================
// YAML
// =========================================================
function parseYaml(sText) {
	//return YAML.parse(sText);
	return jsyaml.load(sText);
}

// =========================================================
// growl
// =========================================================
function growl(sText, sTitle = "") {
	// ({options}, {settings})
	// need animate.css
	let title = "";
	if (sTitle) {
		title = sTitle + ":";
	}
	$.notify(
		{
			title: `<strong>${title}</strong>`,
			message: sText,
		},
		{
			type: "danger",
			animate: {
				enter: "animated bounceInDown",
				exit: "animated bounceOutUp",
			},
		},
	);
}

// =========================================================
// user links
// =========================================================
function getDataPaths(sText) {
	if (!sText || sText.trim().length === 0) {
		return [];
	}
	const lines = sText.split("\n");
	const dataLines = lines.filter(each => {
		return each.startsWith("@@");
	});
	const dataPaths = dataLines.map(each => {
		const delimiter = each[2];
		const path = each.split(delimiter);
		return (path.slice(1));
	});
	return dataPaths;
}

function addLinks(sText) {
	$("#links2").empty();
	const linkPaths = getDataPaths(sText).filter(each => each[0] = "Link");
	linkPaths.forEach(each => addLink(each));
}

function addLink(asLinkPath) {
	//["Link", "Name", "href" [, "color"]]
	const existing = $("#links2 .userLink").get().map(each => each.textContent);
	if (existing.includes(asLinkPath[1])) {
		return this;
	}
	const link = $(`<a target="_blank" rel="noopener" class="userLink" href="${asLinkPath[2]}">${asLinkPath[1]}</a>`);
	if (asLinkPath[3]) {
		link.css("backgroundColor", asLinkPath[3]);
	}
	$("#links2").append(link);
}

