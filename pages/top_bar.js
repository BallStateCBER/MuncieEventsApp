import React, {Component} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Styles from './Styles';
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native';


export default class TopBar extends Component {
  constructor(props) {
    super(props);
    
  }

 
  DrawerIcon = () => {
    const navigation = useNavigation();
    return(
    <View>
        <TouchableOpacity onPress={() => {navigation.toggleDrawer(); } }>
            <Icon name="ios-menu" style={{padding: 10}} size={28} color="black" type={"font-awesome"}/>
        </TouchableOpacity>
    </View>
    );
};


  render() {
    return(
      <View style={{flexDirection:"row", flex:.6}}>
        <this.DrawerIcon/>
        <Text style={[Styles.title, {flex:.8}]}>
          MUNCIE EVENTS
        </Text>
      </View>

    );
  } 

}

