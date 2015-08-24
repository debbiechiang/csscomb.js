'use strict';

module.exports = (function() {
    var valueFromSettings;
    var value;
    var space;

    function insertLines(node, index) {
        var prevNode = node.content[index - 1];
        var shouldInsert = false;

        // check for previous nodes that are not a space
        // do not insert if the ruleset is the first item
        for (var i = 0; i < index; i++) {
            if (node.content[i].type !== 'space') {
                shouldInsert = true;
                break;
            }
        }

        if (prevNode && shouldInsert) {
            if (prevNode.type === 'space' || prevNode[0] === 's') {
                var content = prevNode.content || prevNode[1];
                var lastNewline = content.lastIndexOf('\n');

                if (lastNewline > -1) {
                    content = content.substring(lastNewline + 1);
                }

                var valueStr = valueFromSettings + content;
                prevNode.content = valueStr;
                return;
            } else {
                node.content.splice(index, 0, space);
            }
        }
    }

    function findAtRules(node) {
        for (var i = node.content.length; i--;) {
            if (node.content[i].type !== 'atruleb') continue;
            insertLines(node, i);
        }

        for (var j = node.content.length; j--;) {
            if (node.content[j].type !== 'atruler') continue;
            var atruler = node.content[j];
            insertLines(node, j);
            for (var x = atruler.length; x--;) {
                if (atruler.content[x].type !== 'atrulers') continue;
                var atrulers = atruler.content[x];
                findRuleSets(atrulers);
            }
        }
    }

    function findRuleSets(node) {
        for (var y = 0; y < node.content.length; y++) {
            if (node.content[y].type !== 'ruleset') continue;
            insertLines(node, y);
        }
    }

    function processBlock(x) {
        value = valueFromSettings;
        space = ['s', value];

        if (x.type === 'stylesheet') {
            // Check all @rules
            findAtRules(x);

            // Check all rulesets
            findRuleSets(x);
        }

        for (var p = x.content.length; p--;) {
            var currentNode = x.content[p];
            if (typeof currentNode !== 'object') return;

            if (currentNode.type !== 'block') return processBlock(currentNode);
            // Check all @rules
            findAtRules(currentNode);

            // Check all rulesets
            findRuleSets(currentNode);

            processBlock(currentNode);
        }
    }

    return {
        name: 'lines-between-rulesets',

        syntax: ['sass', 'scss', 'css', 'less'],

        runBefore: 'block-indent',

        setValue: function(value) {
            if (typeof value === 'number') {
                value = new Array(Math.round(value) + 2).join('\n');
            } else {
                var err = 'The option only accepts numbers';

                throw new Error(err, value);
            }

            valueFromSettings = value;

            return value;
        },

        process: function(ast) {
            // valueFromSettings = this.value;
            processBlock(ast);
        }
    };
})();
