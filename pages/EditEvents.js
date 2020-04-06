import React from 'react';  
import {View, Platform, Text, Picker, TextInput, Modal, DatePickerAndroid, TimePickerAndroid, RNDateTimePicker, FlatList, Switch, ScrollView, AsyncStorage, TouchableOpacity, KeyboardAvoidingView} from 'react-native';
import Styles from './Styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import APICacher from '../APICacher'
import CustomButton from './CustomButton';
import LoadingScreen from "../components/LoadingScreen";
import InternetError from '../components/InternetError';
import DateAndTimeParser from '../DateAndTimeParser'
import APIKey from '../APIKey'

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
        eventUpdated: false
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
                      keyExtractor={(item,index) => item + index}
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
          return(
              <View style={Styles.formRow}>
                  <Text style ={Styles.formLabel}>Time </Text>
                  <CustomButton 
                      buttonStyle={Styles.mediumButtonStyle}
                      textStyle={Styles.mediumButtonTextStyle}
                      text="Select Time"
                      onPress = {() => this.getAndroidTimePicker()}
                  />
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

  async getAndroidTimePicker(){
      <RNDateTimePicker mode="time" value={new Date()}></RNDateTimePicker>
          if (action !== TimePickerAndroid.onChange) {
            time = hour + ":" + minute
            this.setState({startTime: time})
          }
  }


  getIOSDatePicker(){
      highlightedDate = this.state.chosenDate
      highlightedStartTime = this.state.startTime
      highlightedEndTime = this.state.endTime
      isRequired = this.getIsRequiredNotification();
      return(
          <Modal
              animationType ="slide"
              transparent={false}
              visible= {this.state.IOSModalVisible}
              onRequestClose={() => {
          }}>
              <ScrollView style={{paddingTop: 10}}>
                  <Text style={Styles.title}>Date: {isRequired}</Text>
                  <View style = {[{borderColor:'black', borderRadius: 10, borderWidth: 1}]}>
                      <RNDateTimePicker 
                          value={this.state.chosenDate}
                          onChange={(event, date) => {
                              this.highlightedDate = date
                          }}
                          mode={'date'}
                          itemStyle={{height:50}}
                      />
                  </View>
                  <Text style={Styles.title}>Start Time: {isRequired}</Text>
                  <View style = {[{borderColor:'black', borderRadius: 10, borderWidth: 1}]}>
                      <RNDateTimePicker 
                          value={this.state.startTime}
                          mode= "time"
                          onChange={(time) => {
                              this.highlightedStartTime = time
                          }}
                          itemStyle={{height:50}}
                      />
                  </View>
                  <Text style={Styles.title}>End Time:</Text>
                  <View style = {[{borderColor:'black', borderRadius: 10, borderWidth: 1}]}>
                      <RNDateTimePicker 
                          value={this.state.endTime}
                          mode= "time"
                          onChange={(time) => {
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
                          if(!this.highlightedDate){
                                this.highlightedDate = this.state.chosenDate
                          }
                          if(!this.highlightedStartTime){
                            this.highlightedStartTime = this.state.startTime
                          }
                          if(!this.highlightedEndTime){
                            this.highlightedEndTime = this.state.endTime
                          }
                          this.setState({chosenDate: this.highlightedDate, startTime: this.highlightedStartTime, endTime: this.highlightedEndTime, IOSModalVisible: false})
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
      <RNDateTimePicker mode="date" value={new Date()} />
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
          IOSDatePickerModal = this.getIOSDatePicker();
          androidTimePicker = this.getAndroidTimeFields();
          tagListModal = this.getTagListModal();
          required = this.getIsRequiredNotification();
          dateAndTimes = this.getDateAndTimes();
          return(
                  <View style={{flex:1}}>
                      {IOSDatePickerModal}
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
                                <Text style={Styles.formLabel}>Images </Text>
                                <Text style={Styles.formEntry}>If you would like to upload images for your event, please use the </Text>
                                <TouchableOpacity onPress={()=>{this.goToWebsite()}}><Text style={{color: 'blue'}}>Muncie Events website.</Text></TouchableOpacity>
                            </View>
                          <View style={Styles.formRow}>
                              <CustomButton
                                  text="Submit"
                                  buttonStyle={Styles.longButtonStyle}
                                  textStyle={Styles.longButtonTextStyle}
                                  onPress={() => this.submitEvent()}
                              />
                          </View>
                      </KeyboardAvoidingView>
                      <Text>{this.state.statusMessage}</Text>
                      <Text>{'\n\n'}</Text>
                  </View>
          );
        }
    }
}