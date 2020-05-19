import React from 'react';
import {Text, View, Button} from 'react-native';
import CustomButton from "./CustomButton";
import EventList from "../EventList"
import Styles from './Styles';
import APICacher from '../APICacher'
import LoadingScreen from '../components/LoadingScreen';
import TopBar from './top_bar';
import InternetError from '../components/InternetError';
import APIKey from '../APIKey'
import DateTimePicker from "react-native-modal-datetime-picker";

export default class GoToDate extends React.Component {
  constructor(props){
    super(props);
    this.state = {formattedDate: '', 
                  lastUsedDate: null, 
                  chosenDate: new Date(), 
                  searchURL: "",
                  searchResultsFound: false,
                  isSearching: false,
                  failedToLoad:false,
                  isDateTimePickerVisible: false
                }  
    this.dateSelected = false; 
    this.setDate = this.setDate.bind(this);
    this.APICacher = new APICacher();
    this.APIKey = new APIKey();
  }
  
  

  componentDidMount(){
    this.setState({formattedDate: this.updateEventView(new Date())})
  }
  showDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: true });
  };

  hideDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: false });
  };

  handleDatePicked = date => {
    this.updateEventView(date)
    this.setState({isSearching: true})
    this.hideDateTimePicker();
  };

    render() {
      titleView = this.getTitle();
      mainView = this.getDatePicker()
      if(this.state.searchResultsFound){
        mainView = this.getResultsScreen()
      }
      else if(this.state.isSearching){
        mainView = this.getLoadingScreen();
        url = this.state.searchURL
        this._cacheSearchResults(url);
      }
      else if(this.state.failedToLoad){
        mainView = this.getErrorMessage();
      }
      return (
        <View style={Styles.wrapper}>
          <View style={Styles.topBarWrapper}>
            <TopBar/>
          </View>
          <View style={Styles.mainViewContent}>
            {titleView}
            {mainView}
          </View>
        </View>
      )
    }
  
  getErrorMessage(){
    return(
      <InternetError onRefresh = {() => {
        this.setState({failedToLoad:false, isSearching:false, searchResultsFound: false})
      }}/>
    );
  }

  getLoadingScreen(){
    return(
      <View style>
        <LoadingScreen/>
      </View>
    );
  }

  
   getTitle(){
      return(
        <Text style={Styles.title}>
          GO TO DATE
        </Text>
      );
    }

    updateEventView = date => {
          formattedDate = this.getIOSFormattedDate(date)
        
        url = 'https://api.muncieevents.com/v1/events?start='+formattedDate+'&end='+formattedDate+'&apikey='+this.APIKey.getAPIKey()
        this.setState({searchURL: url, chosenDate: date});
    }

    async _cacheSearchResults(searchURL){
      try{
        await this.APICacher._cacheJSONFromAPIAsync("SearchResults", searchURL)
        this.setState({ searchResultsFound: true, isSearching: false});
      }
      catch(error){
        this.setState({failedToLoad:true, isSearching:false})
      }
    }

    getResultsScreen(){
      return (   
        <View>        
          <CustomButton 
            text="Go Back"
            buttonStyle = {Styles.longButtonStyle}
            textStyle = {Styles.longButtonTextStyle}
            onPress={() => this.setState({searchResultsFound: false})}/>
          <View style={Styles.GoToDateSearchResults}>
            <EventList useSearchResults = {true}/>
          </View>
        </View> 
        );
    }
    
    
    
    

    getDatePicker(){
        return (
              <View>
                <CustomButton
                  text="Search"
                  onPress={this.showDateTimePicker}
                  buttonStyle={Styles.longButtonStyle}
                  textStyle={Styles.longButtonTextStyle}
                  />
                  <DateTimePicker
                    isVisible={this.state.isDateTimePickerVisible}
                    onConfirm={this.handleDatePicked}
                    onCancel={this.hideDateTimePicker}
                  />
              </View>)
      }
      

    

    getIOSFormattedDate(date){
      day = date.getDate();
      month = date.getMonth()+1;
      year = date.getFullYear();
      //pad month if needed for api
      if(date.getMonth()+1 < 10){
         month="0" + (date.getMonth()+1).toString();
      }
      //pad day if needed for api
      if(date.getDate() < 10){
        day='0' +date.getDate().toString();
      }
      return year + '-' + month + '-' + day;
    }

    setDate(newDate) {

        this.setState({chosenDate: newDate})
      
    }
}