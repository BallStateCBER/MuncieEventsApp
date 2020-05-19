import React from 'react';
import {Text, View, ScrollView} from 'react-native';
import Styles from './Styles';
import AddEventsForm from "../components/AddEventsForm"
import TopBar from './top_bar';
import {UserContext} from '../context/UserContext';

export default class AddEditEvent extends React.Component {

    render() {
        return (
            <View style={Styles.wrapper}>
                <View style={Styles.topBarWrapper}>
                    <TopBar/>
                </View>
                <View style={Styles.mainViewContent}>
                    <Text style={Styles.title}>
                        Add an Event
                    </Text>
                    <ScrollView style={Styles.content} nestedScrollEnabled={true}>
                        <AddEventsForm userToken={this.context.token}/>
                    </ScrollView>
                </View>
            </View>
      );
    }
}

AddEditEvent.contextType = UserContext;
