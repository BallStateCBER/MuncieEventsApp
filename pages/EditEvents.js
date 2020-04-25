import React from 'react';  
import {View, Platform, Text, Image, Button, Picker, TextInput, Modal, FlatList, Switch,  AsyncStorage, KeyboardAvoidingView} from 'react-native';
import Styles from './Styles';
import APICacher from '../APICacher'
import CustomButton from './CustomButton';
import LoadingScreen from "../components/LoadingScreen";
import InternetError from '../components/InternetError';
import DateAndTimeParser from '../DateAndTimeParser'
import APIKey from '../APIKey'
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import DateTimePicker from "react-native-modal-datetime-picker";


export default class EditEvents extends React.Component {
    constructor(props){
      super(props); 
      this.state = {
        isLoading: true,
        IOSModalVisible: false,
        tagModalVisable: false,
        chosenDate: new Date(),
        startTime: null,
        endTime: null,
        selectedTagArray: [],
        filter: null,
        statusMessage: "",
        userToken: null,
        location: null,
        categorySelectedName: null,
        categorySelectedValue: null,
        tagSelectedValue: null,
        event: null,
        source: null,
        ageRestriction: null,
        cost: null,
        description: null,
        address: null,
        locationDetails: null,
        id: null,
        failedToLoad: false,
        eventUpdated: false,
        image: null,
        images: null,
        isDateTimePickerVisible: false,
        isTimePickerVisible: false,
        isEndTimePickerVisible: false
    }
    this.event = null
    this.tags=[]
    this.APICacher = new APICacher();
    this.APIKey = new APIKey();

    }


    componentDidMount(){
        this._awaitStartupMethods()
  }

  async _awaitStartupMethods(){
    this.event = this.props.eventData
    await this._fetchTagAndCategoryData()
    await this.setStatesForEventData()
    utoken = await this.retrieveStoredToken();
    this.setState({isLoading: false, userToken: utoken});
  }

  async _fetchTagAndCategoryData(){
      await this._fetchCategoryData();
  }

  async _fetchCategoryData(){
      key = "Categories"
      url = "https://api.muncieevents.com/v1/categories?apikey="+this.APIKey.getAPIKey()
      await this._refreshData(key, url)
  
      this.categories = await this.APICacher._getJSONFromStorage(key)
      this.categories = this.categories.map((category) => {return [category.attributes.name, category.id]})
      this.setState({categorySelectedValue: this.categories[0]})
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
    console.log(date)
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
    console.log(date)
    this.setState({endTime: date})
    this.hideTimePicker();
  };



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
            <InternetError onRefresh = {() => {
                this._fetchTagAndCategoryData().catch(error => this.setState({failedToLoad:true}))
                this.setState({failedToLoad:false, isLoading: true})
            }}/>
        );
      }
      else if(this.state.eventUpdated){
        return(<View>
                    <Text style={Styles.centeredSingleItemText}>{this.state.statusMessage}</Text>
                </View>)
      }
      else{
    
          tagListModal = this.getTagListModal();
          required = this.getIsRequiredNotification();
          dateAndTimes = this.getDateAndTimes();
          imagePicker = this.getImagePicker();
          return(
                  <View style={{flex:1}}>
                      {tagListModal}
                      <View style={Styles.formRow}>
                          <Text style={Styles.formLabel}>Title {required}</Text>
                          <TextInput    
                              value={this.state.event}           
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
                                    {/*slight padding for buttons*/}
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
                              value={this.state.location}                
                              onChangeText={(location) => this.setState({location})}
                              style={[Styles.textBox, Styles.formEntry]}
                              underlineColorAndroid="transparent"
                          />
                      </View>
                      <View style={Styles.formRow}>
                          <Text style={Styles.formLabel}>Location Details </Text>
                          <TextInput              
                              value={this.state.locationDetails}  
                              onChangeText={(locationDetails) => this.setState({locationDetails})}
                              style={[Styles.textBox, Styles.formEntry]}
                              placeholder = "upstairs, room 149, etc."
                              underlineColorAndroid="transparent"
                          />
                      </View>
                      <View style ={Styles.formRow}>
                      
                          <Text style={Styles.formLabel}>Address </Text>
                          <TextInput 
                              value={this.state.address}               
                              onChangeText={(address) => this.setState({address})}
                              style={[Styles.textBox, Styles.formEntry]}
                              underlineColorAndroid="transparent"
                          />
                      </View>
                      <View style={Styles.formRow}>
                          <Text style={Styles.formLabel}>Description {required}</Text>
                          <TextInput     
                              value={this.state.description}          
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
                          <Text style={Styles.formEntry}>{this.state.selectedTagArray.toString()}</Text>
                      </View>
                      <View style = {Styles.formRow}>
                          <Text style={Styles.formLabel}>Cost </Text>
                          <TextInput      
                              value={this.state.cost}         
                              onChangeText={(cost) => this.setState({cost})}
                              style={[Styles.textBox, Styles.formEntry]}
                              placeholder = "Leave this blank if the event is free"
                              underlineColorAndroid="transparent"
                          />
                      </View>
                      <View style = {Styles.formRow}>
                          <Text style={Styles.formLabel}>Age Restriction </Text>
                          <TextInput      
                              value={this.state.ageRestriction}         
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
                                  value={this.state.source}
                                  onChangeText={(source) => this.setState({source})}
                                  style={[Styles.textBox, Styles.formEntry]}
                                  placeholder = "Did you get this information from a website, newspaper, flyer, etc?"
                                  underlineColorAndroid="transparent"
                              />
                          </View>
                          <View style={Styles.formRow}>
                          <Text>{this.state.statusMessage}</Text>
                            <Text>{'\n\n'}</Text>
                              <CustomButton
                                  text="Submit"
                                  buttonStyle={Styles.longButtonStyle}
                                  textStyle={Styles.longButtonTextStyle}
                                  onPress={() => this.submitEvent()}
                              />
                          </View>
                      </KeyboardAvoidingView>
                  </View>
          );
        }
    }
async setStatesForEventData(){
    getChosenDate = new Date(this.event.attributes.date)
    getChosenDate.setDate(getChosenDate.getDate() + 1);
    this.setState({
        chosenDate: getChosenDate,
        startTime: new Date(this.event.attributes.time_start),
        endTime: new Date(this.event.attributes.time_end),
        selectedTagArray: this.getTags(),
        location: this.event.attributes.location,
        categorySelectedName: this.event.attributes.category.name,
        categorySelectedValue: this.event.relationships.category.data.id,
        event: this.event.attributes.title,
        source: this.event.attributes.source,
        ageRestriction: this.event.attributes.age_restriction,
        cost: this.event.attributes.cost,
        description: this.event.attributes.description,
        address: this.event.attributes.address,
        locationDetails: this.event.attributes.location_details,
        id: this.event.id,
        images: this.event.relationships.images
    })
  }

  getTags(){
    tagsArray = []
    if(this.event.attributes.tags){
      tags = this.event.attributes.tags;
     for(i = 0; i < tags.length; i++){
       tagsArray.push(tags[i].name)
     }
     return tagsArray
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

    checkIfStringAttributeIsNull(attribute){
        if(attribute){
            return attribute
        }
        else{
            return ""
        }
    }

    checkForEmptyTagArray(tagArray){
        if(tagArray.length == 0){
            return null
        }
        else{
            return tagArray
        }
    }

    formatTime(date){
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
      url = "https://api.muncieevents.com/v1/event/" +this.state.id + "?userToken=" + this.state.userToken + "&apikey="+this.APIKey.getAPIKey()

      startTime = this.formatTime(this.state.startTime)

      endTime = this.formatTime(this.state.endTime)
  
      chosenDate = this.state.chosenDate.getFullYear() + '-' + ('0' + (this.state.chosenDate.getMonth()+1)).slice(-2) + '-' + ('0' + this.state.chosenDate.getDate()).slice(-2)
      this.setState({isLoading: true})
      fetch(url,
      {method: "PATCH",
      headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
          },
      body: JSON.stringify({
          date: chosenDate,
          start: startTime,
          time_end: endTime,
          tag_names: this.state.selectedTagArray,
          location: this.state.location,
          category_id: this.state.categorySelectedValue,
          title: this.state.event,
          source: this.checkIfStringAttributeIsNull(this.state.source),
          age_restriction: this.checkIfStringAttributeIsNull(this.state.ageRestriction),
          cost: this.checkIfStringAttributeIsNull(this.state.cost),
          description: this.state.description,
          address: this.checkIfStringAttributeIsNull(this.state.address),
          location_details: this.checkIfStringAttributeIsNull(this.state.locationDetails),
          images: this.state.images
      })
  })
  .then((response) => response.json())
  .then((responseJson) => this.handelAPIResponse(responseJson))
    .catch((error) =>{
       this.setState({failedToLoad:true})
    })
  }

  handelAPIResponse(responseJson){
      try{
          this.setState({statusMessage: responseJson.errors[0].detail, isLoading: false})
      }
      catch(error){
          this.setState({statusMessage: "Event successfully updated!", eventUpdated: true, isLoading: false})
      }
  }

  goToWebsite(){
    url = "https://muncieevents.com/events/add"
    Linking.openURL(url)
}

getDateAndTimes(){
    formattedDate = ""
    chosenDate = this.state.chosenDate
    if(chosenDate){
        formattedDate = this.getFormattedDate(chosenDate)
    }
    ampm = this.state.startTime.getHours() >= 12 ? 'pm' : 'am';
    hours = this.state.startTime.getHours() % 12
    if(hours == 0){
        hours = 12
    }
    if(this.state.startTime.getMinutes() < 10){
        minutes = '0' + this.state.startTime.getMinutes().toString()
    }
    else{
        minutes = this.state.startTime.getMinutes().toString() 
    }
    startTime = hours + ':' + minutes + ':' + this.state.startTime.getSeconds() + ' ' + ampm
    if(startTime){
        const startTimeFormatted = this.formatTimeForAPI(startTime).toUpperCase().replace("A", " A").replace("P", " P");
        startTime = startTimeFormatted + " "
    }
    else{
        startTime = ""
    }
    if(this.state.endTime){
        ampm = this.state.endTime.getHours() >= 12 ? 'pm' : 'am';
        hours = this.state.endTime.getHours() % 12
        if(hours == 0){
            hours = 12
        }
        if(this.state.endTime.getMinutes() < 10){
            minutes = '0' + this.state.endTime.getMinutes().toString()
        }
        else{
            minutes = this.state.endTime.getMinutes().toString() 
        }
        endTime = hours + ':' + minutes + ':' + this.state.endTime.getSeconds() + ' ' + ampm
        const endTimeFormatted = this.formatTimeForAPI(endTime).toUpperCase().replace("A", " A").replace("P", " P");
        endTime = "to " + endTimeFormatted
    }
    else{
        endTime = ""
    }
    
    return formattedDate + startTime + endTime
}

getTimes(){
    formattedDate = ""
    chosenDate = this.state.chosenDate
    timeArray = []
    if(chosenDate){
        formattedDate = this.getFormattedDate(chosenDate)
    }
    ampm = this.state.startTime.getHours() >= 12 ? 'pm' : 'am';
    hours = this.state.startTime.getHours() % 12
    if(hours == 0){
        hours = 12
    }
    if(this.state.startTime.getMinutes() < 10){
        minutes = '0' + this.state.startTime.getMinutes().toString()
    }
    else{
        minutes = this.state.startTime.getMinutes().toString() 
    }
    startTime = hours + ':' + minutes + ':' + this.state.startTime.getSeconds() + ' ' + ampm
    if(startTime){
        const startTimeFormatted = this.formatTimeForAPI(startTime).toUpperCase().replace("A", " A").replace("P", " P");
        timeArray.append(startTimeFormatted)
        startTime = startTimeFormatted + " "
    }
    else{
        startTime = ""
    }
    if(this.state.endTime){
        ampm = this.state.endTime.getHours() >= 12 ? 'pm' : 'am';
        hours = this.state.endTime.getHours() % 12
        if(hours == 0){
            hours = 12
        }
        if(this.state.endTime.getMinutes() < 10){
            minutes = '0' + this.state.endTime.getMinutes().toString()
        }
        else{
            minutes = this.state.endTime.getMinutes().toString() 
        }
        endTime = hours + ':' + minutes + ':' + this.state.endTime.getSeconds() + ' ' + ampm
        const endTimeFormatted = this.formatTimeForAPI(endTime).toUpperCase().replace("A", " A").replace("P", " P");
        timeArray.append(endTimeFormatted)
        endTime = "to " + endTimeFormatted
    }
    else{
        endTime = ""
    }
    
    return timeArray
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

formatTimeForAPI(time){
    splitTime = time.split(':')
    timeampm = splitTime[2].split(' ')[1]
    return splitTime[0]+':'+splitTime[1]+timeampm.toLowerCase()
}

getIsRequiredNotification(){
    return(
        <Text style={Styles.requiredField}>*Required</Text>
    );
}
}
