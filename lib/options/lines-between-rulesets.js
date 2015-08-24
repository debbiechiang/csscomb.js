'use strict';

var gonzales = require('gonzales-pe');

module.exports = (function() {
    var valueFromSettings;
    var value;
    var space;

    function insertLines(node, index) {
        var prevNode = node.get(index - 1);
        var shouldInsert = false;

        // check for previous nodes that are not a space
        // do not insert if the ruleset is the first item
        for (var i = 0; i < index; i++) {
            if (!node.get(i).is('space')) {
                shouldInsert = true;
                break;
            }
        }

        if (prevNode && shouldInsert) {
            // console.log('FOUND AN INSERT POINT');
            // console.log('prevNode is', prevNode);
            // console.log(space);
            if (prevNode.is('space')) {
                var content = prevNode.content;
                // console.log('content is', content);
                var lastNewline = content.lastIndexOf('\n');

                if (lastNewline > -1) {
                    content = content.substring(lastNewline + 1);
                }

                var valueStr = valueFromSettings + content;
                prevNode.content = valueStr;
                return;
            } else {
                node.insert(index, space);
            }
        }
    }

    function findAtRules(node) {
        node.forEach('atruleb', function(atRuleNode, index) {
            // For every atrule block - check for preceding space
            insertLines(node, index);
        });

        node.forEach('atruler', function(atRuleNode) {
            // for every atrule ruleset, find the atrulestyles and then process
            // rulesets within those atrulestyles.
            atRuleNode.forEach('atrulers', function(atRuleSNode) {
                findRuleSets(atRuleSNode);
            });
        });
    }

    function findRuleSets(node) {
        node.forEach('ruleset', function(ruleSetNode, index) {
            // For every ruleset - check for preceding space
            insertLines(node, index);
        });
    }

    function processBlock(x) {
        value = valueFromSettings;
        space = gonzales.createNode({ type: 'space', content: value });

        if (x.is('stylesheet')) {
            // Check all @rules
            findAtRules(x);

            // Check all rulesets
            findRuleSets(x);
        }

        x.forEach(function(node) {
            if (typeof node !== 'object') return;

            if (!node.is('block')) return processBlock(node);

            // Check all @rules
            findAtRules(node);

            // Check all rulesets
            findRuleSets(node);

            processBlock(node);
        });
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
