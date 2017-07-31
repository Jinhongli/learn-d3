const d3 = require('d3');
const Chance = require('chance');
let chance = new Chance();

chance.mixin({
    'scores': function() {
        return {
            chinese: chance.natural({min: 40, max: 100}),
            math: chance.natural({min: 40, max: 100}),
            english: chance.natural({min: 40, max: 100}),
            physics: chance.natural({min: 40, max: 100}),
            chemistry: chance.natural({min: 40, max: 100}),
            computerScience: chance.natural({min: 40, max: 100}),
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
        this.svg.width = this.svg.$.width() - 140;
        this.svg.height = this.svg.$.height();
        this.svg.padding = 30;
        this.subject = 'math';
        this.drawHistogram(this.getSubjectData());
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
    drawHistogram: function(subjectData){
        this.svg.selection.selectAll('g.axis').remove();
        let students = this.getStudentName();
        let yTranslate = this.svg.height - this.svg.padding;

        let xScale = d3.scaleBand().domain(d3.range(0, students.length)).range([this.svg.padding, this.svg.width - 2*this.svg.padding]).padding(0.3);
        let yScale = d3.scaleLinear().domain([0,100]).range([0, this.svg.height - 2*this.svg.padding]);

        let update = this.svg.selection.selectAll('g').data(subjectData);
        let enter = update.enter();
        let exit = update.exit();

        // ****** Update pattern ****** //
        update.select('rect')
            .transition()
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('width', xScale.bandwidth())

            .attr('height', function(d){ return yScale(d.score) }.bind(this));
        update.select('text')
            .text(function(d){return d.score})
            .transition()
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('dx', 15)
            .attr('dy', -10);

        // ****** Enter pattern ****** //
        let enterGroup = enter.append('g').classed('data', true);
        enterGroup.append('rect')
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('width', xScale.bandwidth())
            .attr('height', function(d){ return yScale(d.score) }.bind(this));
        enterGroup.append('text')
            .text(function(d){return d.score})
            .attr('x', function(d, i){ return xScale(i)}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .attr('dx', 15)
            .attr('dy', -10)

        // ****** Exit pattern ****** //
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

        this.drawPie(subjectData);
    },
    drawPie: function(subjectData){
        this.svg.selection.append('g')
            .classed('pie', true)
            .attr('transform', 'translate('+ (this.svg.width + 25) +', 140)');

        this.svg.selection.append('g')
            .classed('pie-legend', true)
            .attr('transform', 'translate('+ (this.svg.width + 25) +', 180)');

        let pieGenerator = d3.pie()
            .value(function(d){return d.score})
            .sort(function(a, b){return a-b});

        let data = [
            {scoreArea: '80', score: subjectData.filter(function(student){ return student.score >= 80}).length},
            {scoreArea: '60', score: subjectData.filter(function(student){ return student.score >= 60 && student.score < 80}).length},
            {scoreArea: 'Not Pass', score: subjectData.filter(function(student){ return student.score < 60}).length}
        ];
        console.log(data);

        let arcGenerator = d3.arc()
            .innerRadius(20)
            .outerRadius(80)
            .padRadius(80)
            .cornerRadius(4);

        let arcData = pieGenerator(data);

        // arc
        let arcUpdate = d3.select('g.pie')
            .selectAll('path')
            .data(arcData);
        let arcEnter = arcUpdate.enter();
        arcEnter.merge(arcUpdate)
            .append('path')
            .attr('d', arcGenerator);

        // label
        let labelUpdate = d3.select('g.pie')
            .selectAll('text')
            .data(arcData);
        let labelEnter = labelUpdate.enter();
        labelEnter.merge(labelUpdate)
            .append('text')
            .each(function(d) {
                var centroid = arcGenerator.centroid(d);
                d3.select(this)
                    .attr('x', centroid[0])
                    .attr('y', centroid[1])
                    .attr('dy', '0.33em')
                    .text(d.data.scoreArea);
            });
    },
    listeners: {
        click: function (event, element, elementType) {
            if(elementType === 'subjectBtn' && $(event.target).data('subject') ){
                let subject = $(event.target).data('subject');
                this.subject = subject;
                this.drawHistogram(this.getSubjectData());
            }
        }
    }
});
