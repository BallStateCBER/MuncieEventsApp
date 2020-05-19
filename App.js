import HomeScreen from './pages/Home';
import GoToDate from './pages/GoToDate';
import AddEditEvents from './pages/AddEditEvents';
import About from './pages/About';
import Contact from './pages/Contact';
import LogInRegister from './pages/LogInRegister';
import Widgets from './pages/Widgets';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {UserContext} from './context/UserContext';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.updateUserContext = this.updateUserContext.bind(this);
    this.state = {
      name: null,
      token: null,
      updateUserContext: this.updateUserContext
    };
  }

  /**
   * Updates user name and token in the UserContext
   *
   * @param {string} name The user's name
   * @param {string} token The user's API access token
   */
  updateUserContext(name, token) {
    this.setState({name: name, token: token});
  }

  render() {
    const Drawer = createDrawerNavigator();

    return (
      <UserContext.Provider value={this.state}>
        <NavigationContainer>
          <Drawer.Navigator initialRouteName="Home">
            <Drawer.Screen name="Home" component={HomeScreen}/>
            <Drawer.Screen name="Categories" component={Categories}/>
            <Drawer.Screen name="Tags" component={Tags}/>
            <Drawer.Screen name="Go To Date" component={GoToDate}/>
            <Drawer.Screen name="Add Event" component={AddEditEvents}/>
            <Drawer.Screen name="About" component={About}/>
            <Drawer.Screen name="Contact" component={Contact}/>
            <Drawer.Screen name="My Profile" component={LogInRegister}/>
            <Drawer.Screen name="Widgets" component={Widgets}/>
          </Drawer.Navigator>
        </NavigationContainer>
      </UserContext.Provider>
    );
  }
}

export default App;
