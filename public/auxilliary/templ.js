/**
 * Created by Paul on 10/23/2015.
 */
var _ = require('underscore');

//var myTemplate = '<h1>%= value %</h1>';
var myTemplate = '<ol><% _.each(values, function(value) { %>' +
        '<li><%= value %></li> <% }); %>' +
        '</ol>';
var templFun = _.template(myTemplate);
var output = templFun({
    values: ['My new <b>header</b>', 'asdf', 'fdaasdf', 'foo', 'bar']
});
console.log(output);