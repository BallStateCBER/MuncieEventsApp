import React, {Component} from 'react';  
import {View, Text, Picker, TextInput, Modal, FlatList, Switch,  AsyncStorage, Linking, TouchableOpacity, KeyboardAvoidingView} from 'react-native';
import Styles from '../pages/Styles';
import APICacher from '../APICacher'
import CustomButton from '../pages/CustomButton';
import LoadingScreen from "./LoadingScreen";
import InternetError from './InternetError';
import DateAndTimeParser from '../DateAndTimeParser'
import APIKey from '../APIKey'
import DateTimePicker from "react-native-modal-datetime-picker";



export default class AddEventsForm extends Component{
    constructor(props){
        super(props)
        this.state = {
            isLoading: true,
            IOSModalVisible: false,
            tagModalVisable: false,
            chosenDate: new Date(),
            startTime: 0,
            endTime: null,
            selectedTagArray: [],
            filter: null,
            statusMessage: null,
            userToken: null,
            location: null,
            categorySelectedName: null,
            categorySelectedValue: null,
            tagSelectedValue: null,
            event: null,
            source: "",
            ageRestriction: "",
            cost: "",
            description: null,
            address: "",
            locationDetails: null,
            failedToLoad: false,
            eventSubmitted: false,
            isDateTimePickerVisible: false,
            isTimePickerVisible: false,
            isEndTimePickerVisible: false
        }
        this.tags=[]
        this.APICacher = new APICacher();
        this.APIKey = new APIKey();
    }

    componentDidMount(){
        this._fetchTagAndCategoryData().catch(error => this.setState({isLoading:false, failedToLoad:true}))
    }

    async _fetchTagAndCategoryData(){
        await this._fetchCategoryData();
        await this._fetchTagData();
        utoken = await this.retrieveStoredToken();
        this.setState({isLoading: false, userToken: utoken});
    }

    async _fetchCategoryData(){
        key = "Categories"
        url = "https://api.muncieevents.com/v1/categories?apikey="+this.APIKey.getAPIKey()
        await this._refreshData(key, url)
    
        this.categories = await this.APICacher._getJSONFromStorage(key)

        this.categories = this.categories.map((category) => {return [category.attributes.name, category.id]})
        this.setState({categorySelectedValue: this.categories[1][0], categorySelectedName:this.categories[0][0]})
    }   
    
    async _fetchTagData(){
        key = "Tags"
        url = "https://api.muncieevents.com/v1/tags?apikey="+this.APIKey.getAPIKey()
        await this._refreshData(key, url)
    
        this.tags = await this.APICacher._getJSONFromStorage(key)
        this.tags = this.tags.map((tag) => {return [tag.attributes.name, tag.id]})
        this.setState({tagSelectedValue: this.tags[0]})
    }

    async _refreshData(key, url){
        hasAPIData = await this.APICacher._hasAPIData(key)
        if(hasAPIData){
          await this.APICacher._refreshJSONFromStorage(key, url)
        }
        else{
          await this.APICacher._cacheJSONFromAPIWithExpDate(key, url)
        }
      }

    getCategoryPicker(){
        categorylist = this.categories.map( (name) => {
            return <Picker.Item key={name[0]} value={name[1]} label={name[0]} />
        });
        return(
            <View style = {[{borderColor:'black', borderRadius: 10, borderWidth: 1}]}>
                <Picker     
                    selectedValue = {this.state.categorySelectedValue}
                    style={{height:50}} 
                    itemStyle={{height:50}}
                    onValueChange={(value) => {
                    this.setState({categorySelectedValue: value, categorySelectedName: value.label});}}
                >
                    {categorylist}
                </Picker>
            </View> 
        );
    }

    getTagListModal(){
        tagFlatList = this.getSelectableTagsList();
        return(
            <Modal
            animationType ="slide"
            transparent={false}
            visible= {this.state.tagModalVisable}
            onRequestClose={() => {
            }}>
                {tagFlatList}
            </Modal>
        );
    }

    getSelectableTagsList(){
        fullTagList = this.tags.map((name) =>{
            return(name[0])
        });
        if(this.state.filter){
            filteredTagList = fullTagList.filter(tag => tag.includes(this.state.filter.toLowerCase()))
        }
        else{
            filteredTagList = fullTagList
        }
        return(
            <View style={{flex: 1}}>
                <View>
                    <Text style={Styles.title}>Select Tags</Text>
                </View>
                <View style={{flex: .1, paddingBottom: 35}}>
                {/*Second view for just padding was added to avoid spacing issues with the filter textinput and the clear button*/}
                    <View style={{paddingBottom: 5}}>
                        <TextInput               
                            onChangeText={(userInput) => this.setState({filter: userInput})}
                            style={[Styles.textBox]}
                            ref={input => this.filterInput = input}
                            placeholder="Filter tags"
                            underlineColorAndroid="transparent"
                        />
                    </View>
                    <CustomButton
                        text="Clear Filter"
                        buttonStyle={[Styles.mediumButtonStyle, {alignSelf:"center"}]}
                        textStyle={Styles.mediumButtonTextStyle}
                        onPress={() => {
                            this.filterInput.clear()
                            this.setState({filter:null})
                        }}
                    />
                </View>
                <View style={{flex: .80, backgroundColor:'#eee'}}>
                    <FlatList
                        data={filteredTagList}
                        renderItem={({item}) => 
                            this.getSelectableTag(item)
                        }
                        keyExtractor={(item, index) => index.toString()}
                        ListEmptyComponent={() => this.getNoTagsFoundMessage()}
                        nestedScrollEnabled= {true}
                    />
                </View>
                {/*Due to issues with how flatlists use padding, there needed to be a seperate view that was just padding.*/}
                <View style={{paddingBottom:5}}></View>
                <View style={{alignItems:"center", flex: .1}}>
                    <CustomButton
                        text="Close"
                        buttonStyle={[Styles.mediumButtonStyle]}
                        textStyle={Styles.mediumButtonTextStyle}
                        onPress={() => {
                            this.filterInput.clear()
                            this.setState({tagModalVisable: false, filter: null})}
                        }
                    />
                </View>
            </View>
        );
    }

    getSelectableTag(tag){
        isTagAlreadySelected = this.isInSelectedTagList(tag)
        return(
            <View style={{flexDirection: 'row'}}>
                <Switch
                    value={isTagAlreadySelected}
                    onValueChange={() => this.updateSelectedTagList(tag)}
                />
                <Text style={{alignSelf:"center"}}>{tag}</Text>
            </View>
        );
    }

    isInSelectedTagList(tag){
        selectedTagList = this.state.selectedTagArray
        return selectedTagList.includes(tag)
    }

    getNoTagsFoundMessage(){
        return(
            <Text>No tags found.</Text>
        );
    }

    updateSelectedTagList(tag){
        selectedTagList = this.state.selectedTagArray
        tagNeedsRemoved = this.isInSelectedTagList(tag)
        if(tagNeedsRemoved){
            index = selectedTagList.indexOf(tag)
            selectedTagList.splice(index, 1)
        }
        else{
            selectedTagList.push(tag)
        }
        this.setState({selectedTagArray: selectedTagList})
    }

    

    setTime = (event, date) => {
        if (date === undefined) {
            modifier = "AM"
            if(minute == 0){
                minute += "0"
            }
            else if(minute < 10){
                minute = "0" + minute
            }
            if(hour > 12){
                hour -= 12
                modifier = "PM"
            }
            else if(hour == 0){
                hour = 12
            }
            else if(hour == 12){
                modifier = "PM"
            }
            time = hour + ":" + minute + ":" + "00 " + modifier
            if(isStartTime){
                this.setState({startTime: time})
            }
            else{
                this.setState({endTime: time})
            }
        }
      };



      showDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: true });
      };
    
      hideDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: false });
      };
    
      handleDatePicked = date => {
        this.setState({chosenDate: date})
        this.hideDateTimePicker();
      };

      showTimePicker = () => {
        this.setState({ isTimePickerVisible: true });
      };
    
      hideTimePicker = () => {
        this.setState({ isTimePickerVisible: false });
      };
    
      handleTimePicked = date => {
        this.setState({startTime: date})
        this.hideTimePicker();
      };

      showEndTimePicker = () => {
        this.setState({ isEndTimePickerVisible: true });
      };
    
      hideEndTimePicker = () => {
        this.setState({ isEndTimePickerVisible: false });
      };
    
      handleEndTimePicked = date => {
        this.setState({endTime: date})
        this.hideTimePicker();
      };


    


    selectDatePickerFromOS(){
        
            this.setState({IOSModalVisible: true})
       
    }

    submitForm(){
        console.log("The form was submitted")
        console.log("Event: " + this.state.event)
    }

    getIsRequiredNotification(){
        return(
            <Text style={Styles.requiredField}>*Required</Text>
        );
    }

    getDateAndTimes(){
        formattedDate = ""
        chosenDate = this.state.chosenDate
        if(chosenDate){
            formattedDate = this.getFormattedDate(chosenDate)
        }
        startTime = this.state.startTime
        if(startTime){
            const startTimeFormatted = this.formatTimeForAPI(startTime).toUpperCase().replace("A", " A").replace("P", " P");
            startTime = startTimeFormatted + " "
        }
        else{
            startTime = ""
        }
        endTime = this.state.endTime
        if(endTime){
            const endTimeFormatted = this.formatTimeForAPI(endTime).toUpperCase();
            endTime = "to " + endTimeFormatted
        }
        else{
            endTime = ""
        }
        return formattedDate + startTime + endTime
    }

    getFormattedDate(chosenDate){
        this.DateAndTimeParser = new DateAndTimeParser();
        monthNumber = chosenDate.getMonth() + 1
        monthNumberString = ""
        if(monthNumber < 10){
            monthNumberString = "0" + monthNumber
        }
        else{
            monthNumberString = "" + monthNumber
        }
        chosenMonth = this.DateAndTimeParser.getShorthandMonthByNumber(monthNumberString);
        
        dayNumber = chosenDate.getDate()
        daySuffix = this.DateAndTimeParser.deriveDayNumberSuffix(dayNumber);
        return chosenMonth + " " + dayNumber + daySuffix + ", " + chosenDate.getFullYear() + " "
    }

    goToWebsite(){
        url = "https://muncieevents.com/events/add"
        Linking.openURL(url)
    }

    

    render(){
        if(this.state.isLoading){;
            return(
            <View>
                <LoadingScreen/>
            </View>
            );
        }
        else if(this.state.failedToLoad){
            return(
                <InternetError onRefresh={()=>{
                    this.setState({failedToLoad:false, isLoading:true})
                    this._fetchTagAndCategoryData().catch(error => this.setState({isLoading: false, failedToLoad:true}))
                }}/>
            );
        }
        else if(this.state.eventSubmitted){
            return(<View style={Styles.centeredSingleItemText}>
                        {this.state.statusMessage}
                </View>)
        }
        else{
            tagListModal = this.getTagListModal();
            required = this.getIsRequiredNotification();
            dateAndTimes = this.getDateAndTimes();
            return(
                    <View style={{flex:1}}>
                        {tagListModal}
                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Title {required}</Text>
                            <TextInput               
                                onChangeText={(event) => this.setState({event})}
                                style={[Styles.textBox, Styles.formEntry]}
                                underlineColorAndroid="transparent"
                            />
                        </View>
                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Category {required}</Text>
                            {this.getCategoryPicker()}
                        </View>
                        <View style={Styles.formRow}>
                        
                            <View>
                            <Text style ={Styles.formLabel}>Date  {required}</Text>
                                <CustomButton
                                text="Select Date"
                                onPress={this.showDateTimePicker}
                                buttonStyle={Styles.mediumButtonStyle}
                                textStyle={Styles.mediumButtonTextStyle}
                                />
                                <DateTimePicker
                                    isVisible={this.state.isDateTimePickerVisible}
                                    onConfirm={this.handleDatePicked}
                                    onCancel={this.hideDateTimePicker}
                                />
                            </View>
                            <View>
                            <Text style ={Styles.formLabel}>Start Time  {required}</Text>
                            <CustomButton
                                text="Start Time"
                                onPress={this.showTimePicker}
                                buttonStyle={Styles.mediumButtonStyle}
                                textStyle={Styles.mediumButtonTextStyle}
                                />
                                <DateTimePicker
                                isVisible={this.state.isTimePickerVisible}
                                mode = "time"
                                onConfirm={this.handleTimePicked}
                                onCancel={this.hideTimePicker}
                                />
                            </View>
                            <View>
                            <Text style ={Styles.formLabel}>End Time</Text>
                                <CustomButton
                                    text="End Time"
                                    onPress={this.showEndTimePicker}
                                    buttonStyle={Styles.mediumButtonStyle}
                                    textStyle={Styles.mediumButtonTextStyle}
                                    />
                                    <Text>   </Text>
                                    <CustomButton
                                        text="Clear Time"
                                        buttonStyle={Styles.mediumButtonStyle}
                                        textStyle={Styles.mediumButtonTextStyle}
                                        onPress = {() => this.setState({endTime: null})}           
                                    />
                                    <DateTimePicker
                                        isVisible={this.state.isEndTimePickerVisible}
                                        mode = "time"
                                        onConfirm={this.handleEndTimePicked}
                                        onCancel={this.hideEndTimePicker}
                                    />
                            </View>
            
                        </View>
                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Chosen Date and Time</Text>
                            <Text style={Styles.formEntry}>{dateAndTimes}</Text>
                        </View>

                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Location {required}</Text>
                            <TextInput               
                                onChangeText={(location) => this.setState({location})}
                                style={[Styles.textBox, Styles.formEntry]}
                                underlineColorAndroid="transparent"
                            />
                        </View>
                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Location Details </Text>
                            <TextInput               
                                onChangeText={(locationDetails) => this.setState({locationDetails})}
                                style={[Styles.textBox, Styles.formEntry]}
                                placeholder = "upstairs, room 149, etc."
                                underlineColorAndroid="transparent"
                            />
                        </View>
                        <View style ={Styles.formRow}>
                            <Text style={Styles.formLabel}>Address </Text>
                            <TextInput               
                                onChangeText={(address) => this.setState({address})}
                                style={[Styles.textBox, Styles.formEntry]}
                                underlineColorAndroid="transparent"
                            />
                        </View>
                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Description {required}</Text>
                            <TextInput               
                                onChangeText={(description) => this.setState({description})}
                                style={[Styles.textArea, Styles.formEntry]}
                                multiline={true}
                                underlineColorAndroid="transparent"
                            />
                        </View>
                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Tags </Text>
                            <CustomButton
                                text="Add Tags"
                                buttonStyle={[Styles.mediumButtonStyle]}
                                textStyle={Styles.mediumButtonTextStyle}
                                onPress={() => this.setState({tagModalVisable: true})}
                            />
                        </View>
                        <View style={Styles.formRow}>
                            <Text style={Styles.formLabel}>Chosen Tags </Text>
                            <Text style={Styles.formEntry}>{this.state.selectedTagArray.toString().replace(/,/gi , ", ")}</Text>
                        </View>
                        <View style = {Styles.formRow}>
                            <Text style={Styles.formLabel}>Cost </Text>
                            <TextInput               
                                onChangeText={(cost) => this.setState({cost})}
                                style={[Styles.textBox, Styles.formEntry]}
                                placeholder = "Leave this blank if the event is free"
                                underlineColorAndroid="transparent"
                            />
                        </View>
                        <View style = {Styles.formRow}>
                            <Text style={Styles.formLabel}>Age Restriction </Text>
                            <TextInput               
                                onChangeText={(ageRestriction) => this.setState({ageRestriction})}
                                style={[Styles.textBox, Styles.formEntry]}
                                placeholder = "Leave this blank if there is no age restriction"
                                underlineColorAndroid="transparent"
                            />
                        </View>
						<KeyboardAvoidingView style ={{flex:1}} behavior="padding" enabled>
                            <View style={Styles.formRow}>
                                <Text style={Styles.formLabel}>Source </Text>
                                <TextInput
                                    onChangeText={(source) => this.setState({source})}
                                    style={[Styles.textBox, Styles.formEntry]}
                                    placeholder = "Did you get this information from a website, newspaper, flyer, etc?"
                                    underlineColorAndroid="transparent"
                                />
                            </View>
                            <View style={Styles.formRow}>
                                <Text style={Styles.formLabel}>Image </Text>
                                <Text style={Styles.formEntry}>If you would like to upload images for your event, please use the </Text>
                            <TouchableOpacity onPress={()=>{this.goToWebsite()}}><Text style={{color: 'blue'}}>Muncie Events website.</Text></TouchableOpacity>
                            </View>
                            <View style={Styles.formRow}>
                            <View>{this.state.statusMessage}</View>
                            <Text>{'\n\n'}</Text>
                                <CustomButton
                                    text="Submit"
                                    buttonStyle={Styles.longButtonStyle}
                                    textStyle={Styles.longButtonTextStyle}
                                    onPress={() => this.attemptEventSubmission()}
                                />
                            </View>
						</KeyboardAvoidingView>
                    </View>
            );
        }
    }

    retrieveStoredToken = async() => {
        try {
          const utoken = await AsyncStorage.getItem('UniqueToken')
          return utoken
         } catch (error) {
            return "NULL"
         }
      }

    attemptEventSubmission(){
        if(this.requiredFieldsAreFilled()){
            this.submitEvent()            
        }
        else{
            statusMessage = (<Text>ERROR: One or more required fields not completed</Text>)
            this.setState({statusMessage: statusMessage})
        }
    }
      
    requiredFieldsAreFilled(){
        chosenDate = this.state.chosenDate;
        startTime = this.state.startTime;
        endTime = this.state.endTime;
        tagNames = this.state.selectedTagArray;
        location = this.state.location;
        categoryID = this.state.categorySelectedValue;
        title = this.state.event;
        source = this.state.source;
        ageRestriction = this.state.ageRestriction;
        cost = this.state.cost;
        description = this.state.description;
        address = this.state.address;
        locationDetails = this.state.locationDetails;
        return (categoryID && title && chosenDate && startTime 
            && description && location);
    }

    formatTimeForAPI(date){
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    submitEvent(){
        userToken = this.state.userToken
        startTime = this.state.startTime
        endTime = this.state.endTime
        tagNames = this.state.selectedTagArray
        location = this.state.location
        categoryID = this.state.categorySelectedValue
        title =this.state.event
        source = this.state.source
        ageRestriction = this.state.ageRestriction
        cost = this.state.cost
        description = this.state.description
        address = this.state.address
        locationDetails = this.state.locationDetails
        chosenDate = this.state.chosenDate
       
        
        
        

        
       // fixes bug were categoryId = "Music"
       if(categoryID == "Music"){
            categoryID = 13
        }
        

        if(userToken){
            url = "https://api.muncieevents.com/v1/event?userToken=" + userToken + "&apikey="+this.APIKey.getAPIKey()
            imageurl = "https://api.muncieevents.com/v1/image?userToken=" + userToken + "&apikey="+this.APIKey.getAPIKey()
        }
        else{
            url = "https://api.muncieevents.com/v1/event?apikey="+this.APIKey.getAPIKey()
        }

        if(startTime){
            startTime = this.formatTimeForAPI(startTime)
        }

        if(endTime){
            endTime = this.formatTimeForAPI(endTime) 
        }

        if(chosenDate){
            chosenDate = chosenDate.getFullYear() + '-' + ('0' + (chosenDate.getMonth()+1)).slice(-2) + '-' + ('0' + chosenDate.getDate()).slice(-2)
        }
        this.setState({isLoading: true})

        
      
        fetch(url,
            {method: "POST",
            headers: {
                Accept: 'application/vnd.api+json',
                'Content-Type': 'application/json',
                },
            body: JSON.stringify({
                date: chosenDate,
                time_start: startTime,
                time_end: endTime,
                tag_names: tagNames,
                location: location,
                category_id: categoryID,
                title: title,
                source: source,
                age_restriction: ageRestriction,
                cost: cost,
                description: description,
                address: address,
                location_details: locationDetails,
            })
        })
        .then((response) => response.json())
        .then((responseJson) => this.handleAPIResponse(responseJson))
        .catch(error =>{
                        console.log(error)
                        this.setState({failedToLoad:true})});
                
           
    }
    
    

    handleAPIResponse(responseJson){
        try{
            statusMessage = (<Text>{responseJson.errors[0].detail}</Text>)
            this.setState({statusMessage: statusMessage})            

        }
        catch(error){
            statusMessage = (<View>
                                <Text style={Styles.header}>Event successfully submitted!</Text>
                                <TouchableOpacity onPress={()=>{this.resetForm()}}>
                                    <Text style={{color: 'blue'}}>Add another event</Text>
                                </TouchableOpacity> 
                                </View>)
            this.setState({statusMessage: statusMessage,eventSubmitted:true, isLoading: false})
        }
    }

    handleAPIResponseImage(responseJson){
        this.setState({imageId: responseJson.data[0].id})
    }

    resetForm(){
        this.setState({
            chosenDate: new Date(),
            startTime: null,
            endTime: null,
            selectedTagArray: [],
            filter: null,
            statusMessage: null,
            userToken: null,
            location: null,
            categorySelectedName: null,
            categorySelectedValue: null,
            tagSelectedValue: null,
            event: null,
            source: "",
            ageRestriction: "",
            cost: "",
            description: null,
            address: "",
            locationDetails: null,
            eventSubmitted: false,
            image: null
        })
    }

    addZeroPadding(num){
        if(num.length < 2){
            return "0" + num.toString().slice(-2)
        }
        return num.toString()
    }
}




/*

import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';


This portion is to implement in future updates. This is the base work to get the user's uploaded images from api.muncieevents.
The problem is this ''this.setState({images: responseData.data.map((category) => {return [ category.attributes.full_url, category.id]})}) ''
It does map json data but when an array is called (this.state.images[0]) it is undefined at first then becomes the array.
If you press the button multiple times the error goes away.

getImagePicker(){

        if(this.state.userToken){
            return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Button
                title="Pick from your uploaded images"
                onPress={this._pickImage}
                />
                
            </View>
            );
         }
        
         else{
             return(
             <View>
                 <Text>Please log in to pick from your uploaded images and close app</Text>
             </View>
             );
         }
    
    
    }


    _pickImage = async () => {

                imageurl = "https://api.muncieevents.com/v1/user/images?userToken=" + this.state.userToken + "&apikey="+this.APIKey.getAPIKey()
                
                

                fetch(imageurl,
                    {method: "GET",
                    headers: {
                        Accept: 'application/vnd.api+json',
                        },
                    
                })
                    .then((response) => response.json())
                    .then((responseData) => {
                        this.setState({images: responseData.data.map((category) => {return [ category.attributes.full_url, category.id]})}) 
                    })
                    .catch(error =>{
                        console.log(error)
                        this.setState({failedToLoad:true})});
                    
      };





============================================================================================================

This is an image picker and it does pick an image but could never format the image correctly to post to api.muncieevents

       getImagePicker(){
    let { image } = this.state;

    return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button
        title="Pick an image from camera roll"
        onPress={this._pickImage}
        />
        {image &&
        <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
    </View>
    );


}

_pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });


    if (!result.cancelled) {
      this.setState({ image: result.uri });
    }
  };

getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
}


===============================================================================================

https://stackoverflow.com/questions/42521679/how-can-i-upload-a-photo-with-expo

I attempted this and numerous other modifications with formData. The api just would never accept it.
I think sending a blob might work but RN and expo do not have good support for that.
Graham Watson 'The API just expects a binary image file to be uploaded to that endpoint, the same as if an image is being uploaded to a form in a browser'
I tried to rn-fetch-blob but that is not supported by expo.

I though this link would be the best place to get started https://www.reddit.com/r/reactnative/comments/d65y2w/help_send_file_in_binary/



async function takeAndUploadPhotoAsync() {
  // Display the camera to the user and wait for them to take a photo or to cancel
  // the action
  let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
  });

  if (result.cancelled) {
    return;
  }

  // ImagePicker saves the taken photo to disk and returns a local URI to it
  let localUri = result.uri;
  let filename = localUri.split('/').pop();

  // Infer the type of the image
  let match = /\.(\w+)$/.exec(filename);
  let type = match ? `image/${match[1]}` : `image`;

  // Upload the image using the fetch and FormData APIs
  let formData = new FormData();
  // Assume "file" is the name of the form field the server expects
  formData.append('file', { uri: localUri, name: filename, type });

  imageurl = 'https://api.muncieevents.com/v1/image?userToken=' + this.state.userToken + "&apikey="+this.APIKey.getAPIKey()

  return await fetch(YOUR_SERVER_URL, {
    method: 'POST',
    body: formData,
    headers: {
      'content-type': 'multipart/form-data',
    },
  });
}


*/