import React from 'react';
import EventList from "../EventList"
import {TextInput, View, Text, BackHandler, Keyboard} from 'react-native';
import Styles from './Styles';
import APICacher from '../APICacher';
import TopBar from './top_bar';
import SearchResults from './SearchResults';
import LoadingScreen from '../components/LoadingScreen';
import InternetError from '../components/InternetError';
import APIKey from '../APIKey'
import Icon from 'react-native-vector-icons/Ionicons'




export default class HomeScreen extends React.Component{
  constructor(props){
    super(props);
    this.state={url : ''};
    this.state = {isLoading: true,
                  failedToLoad: false,
                  search: '',
                  update: false};
    this._startupCachingAsync = this._startupCachingAsync.bind(this);
    this.APICacher = new APICacher();
    this.APIKey = new APIKey();
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }  

      componentDidMount(){
        this._startupCachingAsync().catch(error => this.catchError())
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
      }

      componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        }

      handleBackButtonClick() {
        this.setState({update: false});
        return true;
      }

      catchError(){
        this.setState({failedToLoad:true, isLoading: false})
      }

      updateSearch = search => {
        this.setState({ search });
      };

      

      render(){
        const { search } = this.state;
        if(this.state.isLoading){
          mainView = this.getLoadingScreen();
        }
        else if(this.state.failedToLoad){
          mainView = this.getErrorView();
        }
        else if(this.state.update){ 
            mainView = <SearchResults searchInput ={this.state.search}/>     
           
        }
        else{
          mainView = this.getHomeView();
        }
        return(
          <View style={Styles.wrapper}>
            <View style={Styles.topBarWrapper}>
              <TopBar/>
            </View>
            
                <View style={[Styles.topBarContent, {flex:.06}]}>
                  <TextInput
                    placeholder=' Search Muncie Events'
                    value={search} 
                    style={Styles.searchBar}
                    underlineColorAndroid="transparent"
                    onChangeText={this.updateSearch}
                    showLoading='true'
                  />
                  <Icon name="ios-search" style={Styles.iosSearch} size={34}
                    onPress={() => {
                      this.setState({update: true})
                      Keyboard.dismiss()
                     }}
                  />
              
            </View>
            <View style={Styles.mainViewContent}>
              {mainView}
            </View>
          </View>
          );
        }

      getErrorView(){
        return(
          <InternetError onRefresh = {() => {
            this.setState({isLoading:true, failedToLoad:false, url: 'https://api.muncieevents.com/v1/events/future?apikey=' + this.APIKey.getAPIKey()})
            this._startupCachingAsync().catch(error => this.catchError())
          }}/>
        );
      }

      getLoadingScreen(){
        return(
          <View>
            <LoadingScreen/>
          </View>
        );
      }
      

      async _startupCachingAsync(){
          key = "APIData"
          url = "https://api.muncieevents.com/v1/events/future?apikey="+this.APIKey.getAPIKey()
          hasAPIData = await this.APICacher._hasAPIData(key)
          if(hasAPIData){
           await this.APICacher._cacheJSONFromAPIAsync(key, url)
          }
          if(!hasAPIData){
            await this.APICacher._cacheJSONFromAPIWithExpDate(key, url);
          }
          this.setState({isLoading:false})
      }

      getHomeView(){
        return(
            <View>
              <EventList/>
            </View>
            );
        }
  }