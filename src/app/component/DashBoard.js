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
            name: chance.first(),
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
        this.svg.padding = 30;
        this.subject = 'math';
        this.draw(this.getSubjectData());
    },
    getSubjectData: function(subject){
        subject = this.subject;
        let subjectData = [];
        for(let i=0,l=data.length; i<l; i++){
            subjectData.push({
                name: data[i].name,
                score: data[i].scores[subject]
            });
        }
        console.log(subject, subjectData)
        return subjectData;
    },
    getStudentName: function(){
        let names = [];
        for(let i=0,l=data.length; i<l; i++){
            names.push(data[i].name);
        }
        return names;
    },
    draw: function(subjectData){
        this.svg.selection.selectAll('g.axis').remove();
        let students = this.getStudentName();
        let yTranslate = this.svg.height - this.svg.padding;

        let xScale = d3.scaleBand().domain(d3.range(0, students.length)).range([this.svg.padding, this.svg.width - 2*this.svg.padding]).padding(0.3);
        let yScale = d3.scaleLinear().domain([0,100]).range([0, this.svg.height - 2*this.svg.padding]);

        let update = this.svg.selection.selectAll('g').data(subjectData);
        let enter = update.enter();
        let exit = update.exit();

        // Update pattern
        update.select('rect')
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('width', xScale.bandwidth())
            .attr('height', function(d){ return yScale(d.score) }.bind(this));
        update.select('text').text(function(d){return d.score})
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('dx', 15)
            .attr('dy', -10);

        // Enter pattern
        let enterGroup = enter.append('g');
        enterGroup.append('rect')
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('width', xScale.bandwidth())
            .attr('height', function(d){ return yScale(d.score) }.bind(this));
        enterGroup.append('text').text(function(d){return d.score})
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('dx', 15)
            .attr('dy', -10)

        // Exit pattern
        exit.remove();

        // draw x-axis
        let xAxis = d3.axisBottom(xScale).tickFormat(function(d, i){return students[i]});
        this.svg.selection.append('g').call(xAxis)
            .attr('transform', 'translate(0, '+ yTranslate +')')
            .classed('axis', true);
        // draw y-axis
        yScale.range([this.svg.height - 2*this.svg.padding, 0]);
        let yAxis = d3.axisLeft(yScale);
        this.svg.selection.append('g').call(yAxis)
            .attr('transform', 'translate('+ this.svg.padding +','+ this.svg.padding +')')
            .classed('axis', true);
    },
    listeners: {
        click: function (event, element, elementType) {
            if(elementType === 'subjectBtn'){
                let subject = $(event.target).data('subject');
                this.subject = subject;
                this.draw(this.getSubjectData());
            }
        }
    }
});
