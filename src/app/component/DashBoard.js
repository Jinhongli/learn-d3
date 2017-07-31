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
        this.svg.width = 2*this.svg.$.width()/3 ;
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

        let update = this.svg.selection.selectAll('g.data').data(subjectData);
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
            .attr('x', function(d, i){ return xScale(i) + xScale.bandwidth()/2}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .style('text-anchor', 'middle')
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
            .attr('x', function(d, i){ return xScale(i) + xScale.bandwidth()/2}.bind(this))
            .attr('y', function(d){ return this.svg.height - this.svg.padding - yScale(d.score) }.bind(this))
            .style('text-anchor', 'middle')
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
        let pieOuterRadius = 90;
        let pieInnerRadius = 20;
        let data = [
            {scoreArea: '80', number: subjectData.filter(function(student){ return student.score >= 80}).length},
            {scoreArea: '60', number: subjectData.filter(function(student){ return student.score >= 60 && student.score < 80}).length},
            {scoreArea: 'Not Pass', number: subjectData.filter(function(student){ return student.score < 60}).length}
        ];
        console.log(data);

        this.svg.selection.select('g.pie')
            .attr('transform', 'translate('+ 2.25*this.svg.$.width()/3 +', '+ (pieOuterRadius + this.svg.padding) +')')

        let pieGenerator = d3.pie()
            .value(function(d){return d.number})
            .sort(function(a, b){return a-b});
        let arcGenerator = d3.arc()
            .innerRadius(pieInnerRadius)
            .outerRadius(pieOuterRadius)
            .padRadius(100)
            .padAngle(.02)
            .cornerRadius(5);

        let arcData = pieGenerator(data);console.log(arcData)

        let arcUpdate = d3.select('g.pie')
            .selectAll('path')
            .data(arcData);
        arcUpdate.enter()
            .append('path')
            .merge(arcUpdate)
            .attr('d', arcGenerator);

        let labelUpdate = d3.select('g.pie')
            .selectAll('text.label')
            .data(arcData);
        labelUpdate.enter()
            .append('text').classed('label', true)
            .merge(labelUpdate)
            .each(function(d) {
                var centroid = arcGenerator.centroid(d);
                d3.select(this)
                    .attr('x', centroid[0])
                    .attr('y', centroid[1])
                    .attr('dy', '0.33em')
                    .text(d.data.scoreArea);
            });

        let legendUpdate = d3.select('g.pie')
            .selectAll('text.legend')
            .data(data);
        legendUpdate.enter()
            .append('text').classed('legend', true)
            .merge(legendUpdate)
            .text(function(d, i){return `${d.scoreArea}: ${d.number}`})
            .attr('transform', function(d, i){ return 'translate(0, '+ (120+i*20) +')' }.bind(this));
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
