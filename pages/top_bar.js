import React, {Component} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Styles from './Styles';


export default class TopBar extends Component {
  constructor(props) {
    super(props);
    
  }

 /*
  DrawerIcon = () => {
    return(
    <View>
        <TouchableOpacity onPress={() => {this.openDrawer(); } }>
            <Icon name="ios-menu" style={{padding: 10}} size={28} color="black" type={"font-awesome"}/>
        </TouchableOpacity>
    </View>
    );
};
*/

  render() {
    return(
      <View style={{flexDirection:"row", flex:.6}}>
        
        <Text style={[Styles.title, {flex:.8}]}>
          MUNCIE EVENTS
        </Text>
      </View>

    );
  } 

}

