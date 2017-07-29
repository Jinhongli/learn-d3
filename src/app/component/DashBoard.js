const d3 = require('d3');
const Chance = require('chance');
let chance = new Chance();

let numberOfCircles = 0;

glue.define('component.DashBoard', {
    init: function () {
        this.svg = {};
        this.svg.$ = this.nodes.svgContainer;
        this.svg.node = this.svg.$[0];
        this.svg.selection = d3.select(this.svg.node);
    },
    listeners: {
        click: function (event, element, elementType) {
            if(elementType === 'addCircleBtn'){
                let cx = chance.natural({min: 20, max: this.svg.$.width()-20});
                let cy = chance.natural({min: 20, max: this.svg.$.height()-20})
                console.log('x: '+cx, 'y:'+cy);

                this.svg.selection.append('circle')
                    .attr('cx', cx)
                    .attr('cy', cy)
                    .attr('r', '10')
                    .style('fill', chance.color())
                    .style('stroke', 'black')
                    .style('stroke-width', '4');
                this.model.number = ++numberOfCircles;
            }else if(elementType === 'clearBtn'){
                this.svg.$.html('');
                numberOfCircles = 0;
                this.model.number = '0';
            }
        }
    }
});
