import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import Button from '@material-ui/core/Button';
import auth from './auth';

const styles = () => {
  return {
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '1 1 auto',
    },
  };
};

class UnauthenticatedRoute extends React.Component {
  handleLogin = async () => {
    await auth.tryLoginPopup();
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Button variant="contained" onClick={this.handleLogin}>
          Login
        </Button>
        <div>to continue.</div>
      </div>
    );
  }
}

export default withStyles(styles)(UnauthenticatedRoute);
