import React from 'react';
import {Text, View, FlatList, Button} from 'react-native';
import TopBar from './top_bar';
import DateAndTimeParser from "../DateAndTimeParser"

export default class AdvancedSearch extends React.Component {
  constructor(props){
    super(props);
    this.state ={ isLoading: true}
    this.state ={lastUsedDate: null}
    this.dateAndTimeParser = new DateAndTimeParser();
  }
  componentDidMount(){
    this.fetchAPIData();
  }

  render(){
    var contentView = this.getLoadingView();
    if(!this.state.isLoading){
      contentView = this.getEventDataView();
    }
    return (
      <View style={{paddingTop:20}}>
        <View style={{height: 50, flexDirection: 'row'}}>
          <Button
            title="Menu"
            onPress={() =>
            this.props.navigation.openDrawer()
            }
          />
          <TopBar />
        </View>
        {contentView}
      </View>
    );
  }

  fetchAPIData(){
    return fetch('https://api.muncieevents.com/v1/events/future?apikey=E7pQZbKGtPcOmKb6ednrQABtnW7vcGqJ')
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          isLoading: false,
          dataSource: responseJson.data,
        }, function(){});
      })
      .catch((error) =>{
        console.error(error);
      });
  }

  getLoadingView(){
    return(
      <View style={{flex: 1, padding: 20}}>
        <ActivityIndicator/>
      </View>
    );
  }

  getEventDataView(){
    return(
      <View style={{paddingTop: 20}}>
        <Text style={{textAlign:"center", fontSize:30, fontWeight:"bold", backgroundColor: '#ffa500'}}>
          Events:
        </Text>
        <FlatList
          data={this.state.dataSource}
          renderItem={({item}) => 
            this.generateEventEntryView(item)
          }
        />
      </View>
    );
  }

  generateEventEntryView(eventEntry){   
    var date = this.setDateText(eventEntry);
    var listText = this.setEventEntryText(eventEntry);

    return(
      <View>
        <Text style={{fontWeight: 'bold', fontSize:20}}>
          {date}
        </Text>
        <TouchableHighlight onPress={() => this.goToFullView(eventEntry)} style={{backgroundColor:'#ddd', borderColor:'black', borderWidth:1}}>
          <Text>
            {listText}
          </Text>
        </TouchableHighlight>
      </View>
    )
  }

  setEventEntryText(eventEntry) {
    var title = eventEntry.attributes.title;
    var startTimeText = this.dateAndTimeParser.extractTimeFromDate(eventEntry.attributes.time_start);
    var endTimeText = "";
    var locationText = eventEntry.attributes.location;
    if (eventEntry.attributes.time_end != null) {
      endTimeText = " to " + this.dateAndTimeParser.extractTimeFromDate(eventEntry.attributes.time_end);
    }
    var listText = title + '\n' + startTimeText + endTimeText + " @ " + locationText;
    return listText;
  }

  setDateText(eventEntry){
    var date = null;
    if(this.isNewDate(eventEntry.attributes.date)){
      date = this.dateAndTimeParser.formatDate(eventEntry.attributes.date) + "\n";
      this.state = {lastUsedDate: eventEntry.attributes.date};
    }
    return date;
  }

  isNewDate(date){
    return date != this.state.lastUsedDate;
  }

  goToFullView(eventEntry){
    return this.props.navigation.navigate('Contact', {
      event: eventEntry,
    });
  }
}