
var React = require('react');
var $ = require('jquery');

var PrettyCheck = React.createClass({
  getInitialState: function () {
    return {
      focused: false,
    };
  },

  componentDidMount: function() {
    this.props.model.on('selectChange', () => {
      this.forceUpdate(function () {});
    });

    $(this.refs.input.getDOMNode()).focus(() => {
      this.setState({ focused: true });
    });
    $(this.refs.input.getDOMNode()).focusout(() => {
      this.setState({ focused: false });
    });
  },

  render: function () {

    var toggle = (event) => {
      // Call model's (or collection's) method, and listen to events
      // (coded above) in order to update.
      if (this.refs.input.getDOMNode().checked) {
        this.props.model.select();
      } else {
        this.props.model.unselect();
      }
    }

    var checked = this.props.model.selected;
    if (!checked) {
      var cclass = "";
    } else if (checked == 2) {
      var cclass = "is-some ";
    } else {
      var cclass = "is-checked ";
    }
    cclass += ' '+(this.state.focused?"is-focused":'');
    return (
      <div className={"PrettyCheck "+cclass}>
        <input type="checkbox" ref="input" role="checkbox" onChange={toggle}
          aria-checked={checked} />
      </div>
    );
  }
})

module.exports = PrettyCheck;