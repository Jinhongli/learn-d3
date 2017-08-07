const d3 = require('d3');

glue.define('component.DashBoard', {
    message: ['PARSE_TREE_DATA'],
    onMessage: function (message, data) {
        if(message === 'PARSE_TREE_DATA'){
            data = JSON.parse(JSON.stringify(data).replace(/child/g, 'children'));
            console.log(data);
            this.render(data.children[0]);
        }
    },
    init: function () {
        this.svg = {};
        this.svg.$ = this.nodes.svgContainer;
        this.svg.node = this.svg.$[0];
        this.svg.selection = d3.select(this.svg.node);
        this.svg.padding = 30;
        this.svg.width = this.svg.$.width() - 2*this.svg.padding ;
        this.svg.height = this.svg.$.height() - 2*this.svg.padding;
        console.log(this.svg.width, this.svg.height)
        this.svg.treeLayout = d3.tree().size([this.svg.width, this.svg.height]);
    },
    render: function(data){
        // this.svg.$.find('.nodes').html('');
        // this.svg.$.find('.texts').html('');
        this.svg.$.find('.links').html('');
        let root = d3.hierarchy(data);
        this.svg.treeLayout(root);

        // Nodes
        let nodes = this.svg.selection.select('g.nodes');
        let updateNodes = nodes.selectAll('circle.node').data(root.descendants());
        let enterNodes = updateNodes.enter();
        enterNodes
            .append('circle')
            .classed('node', true)
            .merge(updateNodes)
            .attr('cx', function(d) {return d.x;})
            .attr('cy', function(d) {return d.y;})
            .attr('r', 10);
        updateNodes.exit().remove();

        // Labels
        let labels = this.svg.selection.select('g.texts');
        let updateLabels = nodes.selectAll('text.text').data(root.descendants());
        let enterLabels = updateLabels.enter();
        enterLabels
            .append('text')
            .classed('text', true)
            .merge(updateLabels)
            .attr('x', function(d) {return d.x;})
            .attr('y', function(d) {return d.y;})
            .text( d => d.data.tag || 'text');
        updateLabels.exit().remove();

        // Links
        let links = this.svg.selection.select('g.links');
        let updateLinks = nodes.selectAll('line.link').data(root.links());
        let enterLinks = updateLinks.enter();
        enterLinks
            .append('line')
            .classed('link', true)
            .merge(updateLinks)
            .attr('x1', function(d) {return d.source.x;})
            .attr('y1', function(d) {return d.source.y;})
            .attr('x2', function(d) {return d.target.x;})
            .attr('y2', function(d) {return d.target.y;});
        updateLinks.exit().remove();
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
