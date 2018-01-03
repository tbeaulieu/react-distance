import React, { Component } from 'react';
import ipRegex from './ip-regex.js'; //npm pull so we can quickly validate without boilerplate code. Does a regex check on a V4 ip and returns true/false
import './App.css';

const googleApikey = "AIzaSyBWyS9G2KtT2u8JD93MrqmT55RFmDPB-_E";

let getLongitudeLatitude = async (ipAddress) => {
  let requestSchema = 'https://api.graphloc.com/graphql?query={getLocation(ip:"'+ipAddress+'"){location{latitude longitude}}}';
  let data = await asyncFetchData(requestSchema);
  return data;
}

//Yes we're using a different call to google instead of adding in another variable due to the multi input.

let asyncFetchData = async (requestSchema) => {
  console.log("request "+requestSchema);
  let data = await (await (fetch(requestSchema)
    .then(res => {
      return res.json()
    })
    .catch(err => {
      console.log('Error: ', err)
    })
  ))
  return data;
}

let getGoogleMaps = async (origin, destination) => {
  // Get our two lat/long asyncrhonously 
  let originObj = await getLongitudeLatitude(origin);
  let destObj = await getLongitudeLatitude(destination);
  //Set them.
  if(originObj.data.getLocation != null && destObj.data.getLocation != null){
    let requestSchema = "https://maps.googleapis.com/maps/api/directions/json?origin="+originObj.data.getLocation.location.latitude+","
                            +originObj.data.getLocation.location.longitude+"&destination="
                            +destObj.data.getLocation.location.latitude+","
                            +destObj.data.getLocation.location.longitude+"&key="+googleApikey;
    // Get the Google Maps Data
    let data = await asyncFetchData(requestSchema);
    return data;
  }
  else{
    return null
  }
}

class App extends Component {
  constructor(props){
    super(props);
    this.state={
      inputToggle: true,
      originIp: null,
      originAddress: [],
      destinationIp: null,
      destinationAddress: [],
      distance: null,
      time: null,
      error: false
    };
  }  
  //We're doing ip checking on blur so we don't keep hammering the graphql server
  async checkip(event){
    event.persist();  //Keeps the event around while we're waiting for the async back.
    if(ipRegex({exact:true}).test(event.target.value)){
      let checkedIP = await getLongitudeLatitude(event.target.value);
      // console.log("derp"+checkedIP.data.getLocation);
      if(checkedIP.data.getLocation !=null){
        this.setState({[event.target.name]: event.target.value});
        event.target.className="";
      }
      else{
        event.target.className="error";
      }
    }
    else{
      event.target.className="error";
    }
  }

  async getResults(e){
    //check if our inputs are valid
    if(ipRegex({exact:true}).test(this.state.originIp) && ipRegex({exact:true}).test(this.state.destinationIp)){
      let directionInfo = await getGoogleMaps(this.state.originIp, this.state.destinationIp);
      if(directionInfo!=null){  //Our error checking.
        this.setState({inputToggle: false,
                      originAddress: directionInfo.routes[0].legs[0].start_address.split(","),
                      destinationAddress: directionInfo.routes[0].legs[0].end_address.split(","),
                      time: directionInfo.routes[0].legs[0].duration.text      
        });

      }
    }
  }
  goBack(e){
    this.setState({
      inputToggle: true,
      originIp: null,
      destinationIp: null
    });
  }
  render() {
    return (
      <div className="App">
        <div className="ThingsHappening">
        {!this.state.inputToggle ? (<button className="goBack" onClick={(e)=> this.goBack(e)}>Back</button>):('')}
          <h3 className={!this.state.inputToggle ? ('solved') : ('')}>How long is the drive?</h3>

          <section>
            <figure>
            <label>Origin:</label>
          {this.state.inputToggle ?(
            <div><input type="text" name="originIp" onBlur={(e)=> this.checkip(e)}></input><p>Please input a valid ip</p></div>) : 
            (<div><strong>{this.state.originAddress[0]}</strong>
                  <p>{this.state.originAddress[1]}, {this.state.originAddress[2]}</p></div>) }
            </figure>
            <figure>
          <label>Destination:</label>
          {this.state.inputToggle ?(
            <div><input type="text" name="destinationIp" onBlur={(e)=> this.checkip(e)}></input><p>Please Input a valid ip</p></div>) : 
            (<div><strong>{this.state.destinationAddress[0]}</strong><p>{this.state.destinationAddress[1]}, {this.state.destinationAddress[2]}</p></div>) }
            </figure>

          </section>
        </div>
          {this.state.inputToggle ?(
            <button className="goGetIt" onClick={(e)=> this.getResults(e)}>Gimmie the Distance!</button>) :
            (<div><h4>{this.state.time}.</h4><p>Well, that ain't far.</p></div>)}
      </div>
    );
  }
}

export default App;