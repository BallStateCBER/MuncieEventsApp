import React from 'react';
import {View, Linking} from 'react-native';
import { WebView } from 'react-native-webview';
import Styles from './Styles';
import APICacher from '../APICacher';
import LoadingScreen from '../components/LoadingScreen';
import TopBar from './top_bar';
import InternetError from '../components/InternetError';
import APIKey from '../APIKey'



export default class About extends React.Component {
  constructor(props){
    super(props);
    this.state ={isLoading: true,
    failedToLoad: false}
    this.APICacher = new APICacher();
    this.APIKey = new APIKey();
  }

  componentDidMount(){
    this._getCachedDataAsync().catch(error => this.catchError());
  }

  catchError(){
    this.setState({isLoading:false, failedToLoad:true})
  }

  render() {
    mainView = null
    if(this.state.isLoading){
      mainView = this.getLoadingScreen();
    }
    else if(this.state.failedToLoad){
      mainView = this.getErrorView();
    }
    else{
      aboutUsHTML = this.state.dataSource.attributes.body;
      mainView = this.getWebView(aboutUsHTML);
    }
    return (
      <View style={Styles.wrapper}>
        <View style={Styles.topBarWrapper}>
          <TopBar/>
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
        this.setState({failedToLoad:false, isLoading:true})
        this._getCachedDataAsync().catch(error => this.catchError())
      }}/>
    )
  }

  getLoadingScreen(){
    return(
      <View>
        <LoadingScreen/>
      </View>
    );
  }

  async _getCachedDataAsync(){
    key = "AboutUsData"
    url = "https://api.muncieevents.com/v1/pages/about?apikey="+this.APIKey.getAPIKey()
    hasAPIData = await this.APICacher._hasAPIData(key)
    if(hasAPIData){
      await this.APICacher._refreshJSONFromStorage(key, url)
    }
    else{
        await this.APICacher._cacheJSONFromAPIWithExpDate(key, url)
    }
    await this.APICacher._getJSONFromStorage(key)
      .then((response) => this.setState({dataSource: response, isLoading: false}))
  }

  

  getWebView(html){
    return(
      <WebView
        ref={(ref) => { this.webview = ref; }}
        originWhitelist={['*']}
        source={{ html: html }}
        scrollEnabled={true}
        startInLoadingState={false}
        
        onShouldStartLoadWithRequest={event => {
          if (event.url.slice(0,4) === 'http') {
              Linking.openURL(event.url)
              return false
          }
          return true
      }}
        
        scalesPageToFit={Platform.OS == "android"}
      />
    )
  }
}