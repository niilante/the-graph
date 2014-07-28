(function (context) {
  "use strict";

  var TheGraph = context.TheGraph;

  // Initialize configuration for the Port view.
  var config = TheGraph.config.port = {
    container: {
      className: "port arrow"
    },
    backgroundCircle: {
      className: "port-circle-bg"
    },
    arc: {
      className: "port-arc"
    },
    innerCircle: {
      ref: "circleSmall"
    },
    text: {
      ref: "label",
      className: "port-label drag"
    }
  };

  var factories = TheGraph.factories.port = {
    createPortGroup: TheGraph.factories.createGroup,
    createPortBackgroundCircle: TheGraph.factories.createCircle,
    createPortArc: TheGraph.factories.createPath,
    createPortInnerCircle: TheGraph.factories.createCircle,
    createPortLabelText: TheGraph.factories.createText
  };

  // Port view

  TheGraph.Port = React.createClass({
    mixins: [
      TheGraph.mixins.Tooltip
    ],
    componentDidMount: function () {
      // Preview edge start
      this.getDOMNode().addEventListener("tap", this.edgeStart);
      this.getDOMNode().addEventListener("trackstart", this.edgeStart);
      // Make edge
      this.getDOMNode().addEventListener("trackend", this.triggerDropOnTarget);
      this.getDOMNode().addEventListener("the-graph-edge-drop", this.edgeStart);

      // Show context menu
      if (this.props.showContext) {
        this.getDOMNode().addEventListener("contextmenu", this.showContext);
        this.getDOMNode().addEventListener("hold", this.showContext);
      }

      // HACK to change SVG class https://github.com/facebook/react/issues/1139
      this.componentDidUpdate();
    },
    getTooltipTrigger: function () {
      return this.getDOMNode();
    },
    shouldShowTooltip: function () {
      return (
        this.props.app.state.scale < TheGraph.zbpBig ||
        this.props.label.length > 8
      );
    },
    showContext: function (event) {
      // Don't show port menu on export node port
      if (this.props.isExport) {
        return;
      }
      // Click on label, pass context menu to node
      if (event && (event.target === this.refs.label.getDOMNode())) {
        return;
      }
      // Don't show native context menu
      event.preventDefault();

      // Don't tap graph on hold event
      event.stopPropagation();
      if (event.preventTap) { event.preventTap(); }

      // Get mouse position
      var x = event.x || event.clientX || 0;
      var y = event.y || event.clientY || 0;

      // App.showContext
      this.props.showContext({
        element: this,
        type: (this.props.isIn ? "nodeInport" : "nodeOutport"),
        x: x,
        y: y,
        graph: this.props.graph,
        itemKey: this.props.label,
        item: this.props.port
      });
    },
    getContext: function (menu, options, hide) {
      return TheGraph.Menu({
        menu: menu,
        options: options,
        label: this.props.label,
        triggerHideContext: hide
      });
    },
    edgeStart: function (event) {
      // Don't start edge on export node port
      if (this.props.isExport) {
        return;
      }
      // Click on label, pass context menu to node
      if (event && (event.target === this.refs.label.getDOMNode())) {
        return;
      }
      // Don't tap graph
      event.stopPropagation();
      
      var edgeStartEvent = new CustomEvent('the-graph-edge-start', { 
        detail: {
          isIn: this.props.isIn,
          port: this.props.port,
          // process: this.props.processKey,
          route: this.props.route
        },
        bubbles: true
      });
      this.getDOMNode().dispatchEvent(edgeStartEvent);      
    },
    triggerDropOnTarget: function (event) {
      // If dropped on a child element will bubble up to port
      if (!event.relatedTarget) { return; }
      var dropEvent = new CustomEvent('the-graph-edge-drop', { 
        detail: null,
        bubbles: true
      });
      event.relatedTarget.dispatchEvent(dropEvent);      
    },
    componentDidUpdate: function (prevProps, prevState) {
      // HACK to change SVG class https://github.com/facebook/react/issues/1139
      var c = "port-circle-small fill route"+this.props.route;
      this.refs.circleSmall.getDOMNode().setAttribute("class", c);
    },
    render: function() {
      var style;
      if (this.props.label.length > 7) {
        var fontSize = 6 * (30 / (4 * this.props.label.length));
        style = { "font-size": fontSize+"px" };
      }
      var r = 4;
      // Highlight matching ports
      var highlightPort = this.props.highlightPort;
      var inArc = TheGraph.arcs.inport;
      var outArc = TheGraph.arcs.outport;
      if (highlightPort && highlightPort.isIn === this.props.isIn && highlightPort.type === this.props.port.type) {
        r = 6;
        inArc = TheGraph.arcs.inportBig;
        outArc = TheGraph.arcs.outportBig;
      }

      var backgroundCircleOptions = TheGraph.merge(config.backgroundCircle, { r: r + 1 });
      var backgroundCircle = factories.createPortBackgroundCircle.call(this, backgroundCircleOptions);

      var arcOptions = TheGraph.merge(config.arc, { d: (this.props.isIn ? inArc : outArc) });
      var arc = factories.createPortArc.call(this, arcOptions);

      var innerCircleOptions = TheGraph.merge(config.innerCircle, { r: r - 1.5 });
      var innerCircle = factories.createPortInnerCircle.call(this, innerCircleOptions);

      var labelTextOptions = {
        x: (this.props.isIn ? 5 : -5),
        style: style,
        children: this.props.label
      };
      labelTextOptions = TheGraph.merge(config.text, labelTextOptions);
      var labelText = factories.createPortLabelText.call(this, labelTextOptions);

      var portContents = [
        backgroundCircle,
        arc,
        innerCircle,
        labelText
      ];

      var portX = this.props

      var containerOptions = TheGraph.merge(config.container, { title: this.props.label, transform: "translate("+this.props.x+","+this.props.y+")" });
      return factories.createPortGroup.call(this, containerOptions, portContents);

    }
  });


})(this);