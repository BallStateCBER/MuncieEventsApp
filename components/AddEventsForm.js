import React, {Component} from 'react';  
import {View, Button, Image, Platform, Text, Picker, TextInput, Modal, DatePickerAndroid, TimePickerAndroid, DatePickerIOS, FlatList, Switch, ScrollView, AsyncStorage, Linking, TouchableOpacity, KeyboardAvoidingView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import Styles from '../pages/Styles';
import APICacher from '../APICacher'
import CustomButton from '../pages/CustomButton';
import LoadingScreen from "./LoadingScreen";
import InternetError from './InternetError';
import DateAndTimeParser from '../DateAndTimeParser'
import APIKey from '../APIKey'

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
            image: null
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

    getAndroidTimeFields(){
        if(Platform.OS == "android"){
            isRequired = this.getIsRequiredNotification();
            return(
                <View>
                    <View style={Styles.formRow}>
                        <Text style ={Styles.formLabel}>Start Time  {isRequired}</Text>
                        <CustomButton 
                            buttonStyle={Styles.mediumButtonStyle}
                            textStyle={Styles.mediumButtonTextStyle}
                            text="Select Time"
                            onPress = {() => this.getAndroidTimePicker(true)}
                        />
                    </View>
                    <View style={Styles.formRow}>
                        <Text style ={Styles.formLabel}>End Time </Text>
                        <View style={{flexDirection:"row"}}>
                            <CustomButton 
                                buttonStyle={Styles.mediumButtonStyle}
                                textStyle={Styles.mediumButtonTextStyle}
                                text="Select Time"
                                onPress = {() => this.getAndroidTimePicker(false)}
                            />
                            {/*slight padding for buttons*/}
                            <Text>   </Text>
                            <CustomButton
                                text="Clear Time"
                                buttonStyle={Styles.mediumButtonStyle}
                                textStyle={Styles.mediumButtonTextStyle}
                                onPress = {() => this.setState({endTime: null})}           
                            />
                        </View>  
                    </View>
                </View>
                
            );
        }
        else{
            //return nothing if on IOS
            return(
                <View></View>
            );
        }
    }

    async getAndroidTimePicker(isStartTime){
        try {
            const {action, hour, minute} = await TimePickerAndroid.open({
              hour: 12,
              minute: 0,
              is24Hour: false,
            });
            if (action !== TimePickerAndroid.dismissedAction) {
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
          } catch ({code, message}) {
            console.warn('Cannot open time picker', message);
          }
    }


    getIOSDatePicker(){
        highlightedDate = new Date()
        highlightedStartTime = new Date()
        highlightedEndTime = new Date()
        isRequired = this.getIsRequiredNotification();
        return(
            <Modal
                animationType ="slide"
                transparent={false}
                visible= {this.state.IOSModalVisible}
                onRequestClose={() => {
            }}>
                <ScrollView style={{paddingTop: 10}}>
                    <Text style={Styles.title}>Date {isRequired}</Text>
                    <View style = {[{borderColor:'black', borderRadius: 10, borderWidth: 1}]}>
                        <DatePickerIOS 
                            date={this.state.chosenDate}
                            onDateChange={(date) => {
                                this.highlightedDate = date
                            }}
                            mode={'date'}
                            itemStyle={{height:50}}
                        />
                    </View>
                    <Text style={Styles.title}>Start Time {isRequired}</Text>
                    <View style = {[{borderColor:'black', borderRadius: 10, borderWidth: 1}]}>
                        <DatePickerIOS 
                            date={new Date()}
                            mode= "time"
                            onDateChange={(time) => {
                                this.highlightedStartTime = time
                            }}
                            itemStyle={{height:50}}
                        />
                    </View>
                    <Text style={Styles.title}>End Time </Text>
                    <View style = {[{borderColor:'black', borderRadius: 10, borderWidth: 1}]}>
                        <DatePickerIOS 
                            date={new Date()}
                            mode= "time"
                            onDateChange={(time) => {
                                this.highlightedEndTime = time
                            }}
                            itemStyle={{height:50}}
                        />
                    </View>
                    {/*select button*/}
                    <CustomButton
                        text="Select"
                        buttonStyle={Styles.longButtonStyle}
                        textStyle={Styles.longButtonTextStyle}
                        onPress = {() => {
                            start = this.highlightedStartTime
                            end = this.highlightedEndTime
                            if(!this.highlightedDate){
                                this.highlightedDate = this.state.chosenDate
                            }
                            if(!this.highlightedStartTime){
                                start = this.state.startTime
                            }
                            if(!this.highlightedEndTime){
                                end = this.state.endTime
                            }
                            if(this.highlightedStartTime){
                                start = this.highlightedStartTime.toLocaleTimeString()
                            }
                            if(this.highlightedEndTime){
                                end = this.highlightedEndTime.toLocaleTimeString()
                            }
                            this.setState({chosenDate: this.highlightedDate, startTime: start, endTime: end, IOSModalVisible: false})
                    }}/>
                    {/*cancel button*/}
                    <CustomButton
                        text="Cancel"
                        buttonStyle={Styles.longButtonStyle}
                        textStyle={Styles.longButtonTextStyle}
                        onPress = {() => {
                            this.setState({IOSModalVisible: false})
                    }}/>
                </ScrollView>
            </Modal>
        );
    }

    async getAndroidDatePicker(){
        try {
            const {action, year, month, day} = await DatePickerAndroid.open({
              date: new Date()
            });
            if (action == DatePickerAndroid.dateSetAction) {
              newDate = new Date(year, month, day);
              this.setState({chosenDate: newDate})
            }
          } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
          }
    }


    selectDatePickerFromOS(){
        if(Platform.OS == "ios"){
            this.setState({IOSModalVisible: true})
        }
        else{
            this.getAndroidDatePicker()
        }
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
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1
        });
    
        console.log(result);
    
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
            IOSDatePickerModal = this.getIOSDatePicker();
            androidTimePicker = this.getAndroidTimeFields();
            tagListModal = this.getTagListModal();
            required = this.getIsRequiredNotification();
            dateAndTimes = this.getDateAndTimes();
            imagePicker = this.getImagePicker();
            return(
                    <View style={{flex:1}}>
                        {IOSDatePickerModal}
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
                            <Text style={Styles.formLabel}>Date {required}</Text>
                            <CustomButton
                                text="Select Date"
                                buttonStyle={[Styles.mediumButtonStyle]}
                                textStyle={Styles.mediumButtonTextStyle}
                                onPress={() => this.selectDatePickerFromOS()}
                            />
                        </View>
                        {androidTimePicker}
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
                                <Text style={Styles.formLabel}>Images </Text>
                                    {imagePicker}
                            </View>
                            <View style={Styles.formRow}>
                                <CustomButton
                                    text="Submit"
                                    buttonStyle={Styles.longButtonStyle}
                                    textStyle={Styles.longButtonTextStyle}
                                    onPress={() => this.attemptEventSubmission()}
                                />
                            </View>
						</KeyboardAvoidingView>
                        <View>{this.state.statusMessage}</View>
                        <Text>{'\n\n'}</Text>
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

    formatTimeForAPI(time){
        splitTime = time.split(':')
        timeampm = splitTime[2].split(' ')[1]
        return splitTime[0]+':'+splitTime[1]+timeampm.toLowerCase()
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
        image = this.state.image

        if(userToken){
            url = "https://api.muncieevents.com/v1/event?userToken=" + userToken + "&apikey="+this.APIKey.getAPIKey()
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
                image: image
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
        })
    }

    addZeroPadding(num){
        if(num.length < 2){
            return "0" + num.toString().slice(-2)
        }
        return num.toString()
    }
}