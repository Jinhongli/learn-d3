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
        this.svg.$.find('.links').html('');
        let root = d3.hierarchy(data);
        this.svg.treeLayout(root);
        let links = this.svg.selection.select('g.links');
        let nodes = this.svg.selection.select('g.nodes');
        let labels = this.svg.selection.select('g.texts');
        let nodesWidth = 50;
        let nodesHeight = 20;

        // Links
        let updateLinks = links.selectAll('line.link').data(root.links());
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

        // Nodes
        let updateNodes = nodes.selectAll('rect.node').data(root.descendants());
        let enterNodes = updateNodes.enter();
        enterNodes
            .append('rect')
            .classed('node', true)
            .merge(updateNodes)
            .attr('x', function(d) {return d.x - nodesWidth/2;})
            .attr('y', function(d) {return d.y - nodesHeight/2;})
            .attr('width', nodesWidth)
            .attr('height', nodesHeight)
            .attr('rx', 5)
            .classed('tag', d => d.data.tag);
        updateNodes.exit().remove();

        // Labels
        let updateLabels = labels.selectAll('text.text').data(root.descendants());
        let enterLabels = updateLabels.enter();
        enterLabels
            .append('text')
            .classed('text', true)
            .merge(updateLabels)
            .attr('x', function(d) {return d.x;})
            .attr('y', function(d) {return d.y;})
            .attr("dominant-baseline", "central")
            .attr("text-anchor", "middle")
            .text( d => d.data.tag ? d.data.tag.toUpperCase() : d.data.text)
        updateLabels.exit().remove();
    }
});
