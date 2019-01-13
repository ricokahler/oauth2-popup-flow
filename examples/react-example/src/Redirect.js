import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import auth from './auth';

const styles = theme => {
  return {
    root: {},
  };
};

class Redirect extends React.Component {
  state = {
    status: 'LOGGING_IN',
  };

  static propTypes = {
    classes: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const result = auth.handleRedirect();
    if (result !== 'SUCCESS') {
      this.setState({ status: 'FAILED' });
      return;
    }

    this.setState({ status: 'SUCCESS' });
  }

  render() {
    const { classes } = this.props;
    const { status } = this.state;
    return (
      <div className={classes.root}>
        <Typography variant="h5">
          {status === 'LOGGING_IN'
            ? 'Logging you in…'
            : status === 'FAILED'
            ? 'Login failed. Please close this window and try again.'
            : 'You may close this window.'}
        </Typography>
      </div>
    );
  }
}

export default withStyles(styles)(Redirect);
