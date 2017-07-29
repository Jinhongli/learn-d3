const d3 = require('d3');
const Chance = require('chance');
let chance = new Chance();

chance.mixin({
    'scores': function() {
        return {
            chinese: chance.natural({min: 70, max: 100}),
            math: chance.natural({min: 50, max: 90}),
            english: chance.natural({min: 70, max: 95}),
            physics: chance.natural({min: 50, max: 85}),
            chemistry: chance.natural({min: 70, max: 100}),
            computerScience: chance.natural({min: 80, max: 100}),
        }
    }
});

chance.mixin({
    'student': function() {
        return {
            name: chance.name(),
            scores: chance.scores()
        }
    }
});

const data = chance.n(chance.student, 10);

glue.define('component.DashBoard', {
    init: function () {
        this.svg = {};
        this.svg.$ = this.nodes.svgContainer;
        this.svg.node = this.svg.$[0];
        this.svg.selection = d3.select(this.svg.node);
        this.svg.width = this.svg.$.width();
        this.svg.height = this.svg.$.height();
        this.svg.padding = 20;
        this.subject = 'math';
        this.students = this.getStudentName();
        this.subjectData = this.getSubjectData(this.subject);
        this.drawAxis();
    },
    getSubjectData: function(subject){
        var subjectData = [];
        for(var i=0,l=data.length; i<l; i++){
            subjectData.push({
                name: data[i].name,
                score: data[i].scores[subject]
            });
        }
        console.log(subject, subjectData)
        return subjectData;
    },
    getStudentName: function(){
        var names = [];
        for(var i=0,l=data.length; i<l; i++){
            names.push({
                name: data[i].name,
            });
        }
        return names;
    },
    drawData: function(){
        let update = this.svg.selection.selectAll('rect').data(this.subjectData);
        let enter = update.enter();

        enter.append('rect')
            .attr('x', function(d, i){ return i*40})
            .attr('y', function(d){ return this.svg.height - this.svg.padding - d.score }.bind(this))
            .attr('width', '20')
            .attr('height', function(d){ return d.score });
    },
    drawAxis: function(){
        var yTranslate = this.svg.height - this.svg.padding;
        var xScale = d3.scaleLinear().domain([0,100]).range([this.svg.padding, this.svg.width - 2*this.svg.padding]);
        var xAxis = d3.axisBottom(xScale);
        this.svg.selection.append('g').call(xAxis)
            .attr('transform', 'translate(0, '+ yTranslate +')');
    },
    listeners: {
        click: function (event, element, elementType) {
            if(elementType === 'subjectBtn'){
                var subject = $(event.target).data('subject');
                console.log(subject);
                this.subject = subject;
                this.getSubjectData(subject);
            }
        }
    }
});
