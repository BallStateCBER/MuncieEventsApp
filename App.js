import HomeScreen from './pages/Home';
import AdvancedSearch from './pages/AdvancedSearch';
import GoToDate from './pages/GoToDate';
import AddEditEvents from './pages/AddEditEvents';
import About from './pages/About';
import Contact from './pages/Contact';
import LogInRegister from './pages/LogInRegister';
import Widgets from './pages/Widgets';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import * as React from 'react';
import { NavigationContainer, DrawerActions } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView,  DrawerItemList,  DrawerItem} from '@react-navigation/drawer';


const Drawer = createDrawerNavigator();




function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home" >
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Advanced Search" component={AdvancedSearch} />
        <Drawer.Screen name="Categories" component={Categories} />
        <Drawer.Screen name="Tags" component={Tags} />
        <Drawer.Screen name="Go To Date" component={GoToDate} />
        <Drawer.Screen name="Add Event" component={AddEditEvents} />
        <Drawer.Screen name="About" component={About} />
        <Drawer.Screen name="Contact" component={Contact} />
        <Drawer.Screen name="My Profile" component={LogInRegister} />
        <Drawer.Screen name="Widgets" component={Widgets} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}




export default App;

