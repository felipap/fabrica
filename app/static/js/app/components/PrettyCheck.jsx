
var React = require('react');
var $ = require('jquery');

var PrettyCheck = React.createClass({
  getInitialState: function () {
    return {
      checked: false,
      focused: false,
    };
  },

  componentDidMount: function() {
    $(this.refs.input.getDOMNode()).focus(() => {
      console.log('focusin')
      this.setState({ focused: true });
    });
    $(this.refs.input.getDOMNode()).focusout(() => {
      console.log('focusout')
      this.setState({ focused: false });
    });
  },

  render: function () {

    var toggle = (event) => {
      console.log("checked", this.state.checked)
      if (this.refs.input.getDOMNode().checked) {
        this.setState({ checked: true });
        console.log(this.state.checked)
      } else {
        console.log(this.state.checked)
        this.setState({ checked: false });
      }
    }

    var cclass = ' '+(this.state.checked?"is-checked":'')+' '+(this.state.focused?"is-focused":'');
    return (
      <div className={"PrettyCheck "+cclass}>
        <input type="checkbox" ref="input" role="checkbox" onChange={toggle}
          aria-checked={this.state.checked} />
      </div>
    );
  }
})

module.exports = PrettyCheck;