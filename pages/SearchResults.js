import React from 'react';
import EventList from "../EventList"
import {View, Text} from 'react-native';
import Styles from './Styles';
import APICacher from '../APICacher';
import LoadingScreen from '../components/LoadingScreen';
import InternetError from '../components/InternetError';
import APIKey from '../APIKey'

export default class SearchResults extends React.Component{
    constructor(props){
        super(props)
        this.state={isLoading:true,
        failedToLoad: false
        }
        this.APIKey = new APIKey();
    }

    componentDidMount(){
        this._cacheSearchResults().catch(error => this.catchError())
    }

    catchError(){
        this.setState({isLoading:false, failedToLoad:true});
    }
    
    

    render(){
        const {searchInput} = this.props;
        mainView = null
        if(this.state.isLoading){
            mainView = this.getLoadingView()
        }
        else if(this.state.failedToLoad){
            mainView = this.getErrorMessage()
        }
        else{
            mainView = this.getSearchResultsView()
        }
        return(
            <View style={Styles.wrapper}>
                <View style={Styles.mainViewContent}>
                    <Text style={Styles.title}>Search Results For "{searchInput}"</Text>
                    {mainView}
                </View>
            </View>
            );
        }
    
    getErrorMessage(){
        return(
            <InternetError onRefresh = {() => {
                this.setState({isLoading:true, failedToLoad:false})
                this._cacheSearchResults().catch(error => this.catchError())
            }}/>
        );
    }

    getLoadingView(){
        return(
            <View style={{alignItems:'center', justifyContent: 'center'}}>
                <LoadingScreen/>
            </View>
        );
    }

    getSearchResultsView(){
        return(
            <View style={Styles.searchResults}>
                <EventList useSearchResults = {true} style={Styles.eventList}/>
            </View>
        );
    }

    async _cacheSearchResults(){
        const {searchInput} = this.props;
        beginningSearchURL = 'https://api.muncieevents.com/v1/events/search?q='
        endingSearchURL = '&apikey='+this.APIKey.getAPIKey()
        searchURL = beginningSearchURL + searchInput + endingSearchURL
        key = "SearchResults"

        this.APICacher = new APICacher();
        await this.APICacher._cacheJSONFromAPIAsync(key, searchURL)
        this.setState({isLoading:false})
    }
}
