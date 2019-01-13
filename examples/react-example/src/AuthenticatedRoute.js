import React from 'react';
import PropTypes from 'prop-types';
import auth from './auth';
import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import { Redirect } from 'react-router';

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

class AuthenticatedRoute extends React.Component {
  state = {
    name: '',
  };

  static propTypes = {
    classes: PropTypes.object.isRequired,
  };

  async componentDidMount() {
    const payload = await auth.tokenPayload();
    this.setState({ name: payload.given_name || payload.name });
  }

  render() {
    const { classes } = this.props;
    const { name } = this.state;

    return (
      <div className={classes.root}>
        {!auth.loggedIn() && <Redirect to="/unauthenticated" />}
        <Typography className={classes.welcome} variant="h3">
          Welcome, {name}!
        </Typography>
      </div>
    );
  }
}

export default withStyles(styles)(AuthenticatedRoute);
