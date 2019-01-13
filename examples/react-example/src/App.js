import React from 'react';
import PropTypes from 'prop-types';
import compose from 'recompose/compose';
import auth from './auth';
import withStyles from '@material-ui/core/styles/withStyles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { Switch, Route, Redirect, withRouter } from 'react-router';

import AuthenticatedRoute from './AuthenticatedRoute';
import UnauthenticatedRoute from './UnauthenticatedRoute';
import RedirectCallback from './Redirect';

const styles = theme => {
  return {
    root: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    appBar: {
      flex: '0 0 auto',
    },
    grow: {
      flexGrow: 1,
    },
    body: {
      flex: '1 1 auto',
      display: 'flex',
      flexDirection: 'column',
    },
  };
};

class App extends React.Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentDidMount() {
    auth.addEventListener('login', this.handleLogin);
    auth.addEventListener('logout', this.handleLogout);
  }

  componentWillUnmount() {
    auth.removeEventListener('login', this.handleLogin);
    auth.removeEventListener('logout', this.handleLogout);
  }

  handleLogin = () => {
    const { history } = this.props;
    history.push('/authenticated');
  };

  handleLogout = () => {
    const { history } = this.props;
    history.replace('/unauthenticated');
  };

  handleClick = async () => {
    if (auth.loggedIn()) {
      auth.logout();
    } else {
      await auth.tryLoginPopup();
    }
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <AppBar className={classes.appBar} position="static">
          <Toolbar>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              Example App
            </Typography>
            <Button onClick={this.handleClick}>{auth.loggedIn() ? 'Logout' : 'Login'}</Button>
          </Toolbar>
        </AppBar>
        <div className={classes.body}>
          <Switch>
            <Route path="/authenticated" component={AuthenticatedRoute} />
            <Route path="/unauthenticated" component={UnauthenticatedRoute} />
            <Route path="/redirect" component={RedirectCallback} />
            <Redirect to="/unauthenticated" />
          </Switch>
        </div>
      </div>
    );
  }
}

export default compose(
  withRouter,
  withStyles(styles),
)(App);
