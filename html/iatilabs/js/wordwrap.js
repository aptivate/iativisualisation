function wordWrap(text, width) {
    var words = getArrayOfSmallWordsFrom(text, width);

    var lines = Array();

    var currentLine = "";
    var spaceLeft = width;

    var spaceWidth = 1;

    for (var i = 0; i < words.length; i++) {
        var currentWord = words[i];
        
        if (currentWord.length > spaceLeft) {
            lines.push(trim(currentLine));
            currentLine = "";
            spaceLeft = width;
        }
        
        currentLine += (currentWord + " ");
        spaceLeft -= (currentWord.length + spaceWidth);
    }

    if (currentLine.length > 0) {
        lines.push(trim(currentLine));
    }

    return lines.join("\n");        
}

function getArrayOfSmallWordsFrom(text, width) {
    var words = text.split(" ");

    var smallWords = Array();

    for (var i = 0; i < words.length; i++) {
        var splitWordParts = splitWord(words[i], width);
        
        for (var j = 0; j < splitWordParts.length; j++) {
            smallWords.push(splitWordParts[j]);
        }       
    }        
    
    return smallWords;
}

function splitWord(word, width) {
    var splitWordParts = Array();
    
    for (var i = 0; i < word.length; i+= width) {
        splitWordParts.push(word.substring(i, i+width));
    }
    
    return splitWordParts;
}

function trim(str) {
    var str = str.replace(/^\s\s*/, ''),
        ws = /\s/,
        i = str.length;
    while (ws.test(str.charAt(--i)));
    return str.slice(0, i + 1);
}


var failures = 0;

function runWordWrapTests() {
    var tests = Array(
        function testNoWrapForShortText() {
            var wrapped = wordWrap("Hello", 6);
            assertEquals("Hello", wrapped);
        },
        
        function testWrapSingleSpaceReplacedWithNewline() {
            var wrapped = wordWrap("Hello there", 6);
            assertEquals("Hello\nthere", wrapped);
        },
        
        function testLongStringSplitInTwo() {
            var wrapped = wordWrap("The William and Flora Hewlett Foundation",
                25);
            assertEquals("The William and Flora\nHewlett Foundation", wrapped);
        },
        
        function testStringTooLongWithNoSpacesSplitInHalf() {
            var wrapped = wordWrap("TheWilliamAndFloraHewlettFoundation",
                15);
            assertEquals("TheWilliamAndFl\noraHewlettFound\nation", wrapped);
        });
        
    for (var i=0; i < tests.length; i++) {
        tests[i]();
    }
    
    document.write("<p>Total tests:" + tests.length + "</p>");
    document.write("<p>Total failed:" + failures + "</p>");
    
}

function assertEquals(expected, actual) {
    if (expected != actual) {
        document.write("<p>Expected:</p><pre>[" + format(expected) + "]</pre>");
        document.write("<p>Actual:</p><pre>[" + format(actual) + "]</pre>");
        failures++
    }
}

function format(text) {
    return text.replace(new RegExp("\\n", "g"), "\\n");
}