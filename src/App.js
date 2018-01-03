import React, { Component } from 'react';
import ipRegex from './ip-regex.js'; //npm pull so we can quickly validate without boilerplate code. Does a regex check on a V4 ip and returns true/false
import {GoogleApiWrapper} from 'google-maps-react'; //So we can lazy load in google maps api without various terrible means like loadJS

import './App.css';
/* global google */


// const googleApikey = "AIzaSyBWyS9G2KtT2u8JD93MrqmT55RFmDPB-_E";
// let ourResults = [];

let getLongitudeLatitude = async (ipAddress) => {
  let requestSchema = 'https://api.graphloc.com/graphql?query={getLocation(ip:"'+ipAddress+'"){location{latitude longitude}}}';
  let data = await asyncFetchData(requestSchema);
  return data;
}


let asyncFetchData = async (requestSchema) => {
  console.log("request "+requestSchema);
  let data = await (await (fetch(requestSchema,{
    method: 'GET',
    headers:{
      Accept: 'application/json'}
   })
    .then(res => {
      return res.json()
    })
    .catch(err => {
      console.log('Error: ', err)
    })
  ))
  return data;
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
    if(ipRegex({exact:true}).test(this.state.originIp) && ipRegex({exact:true}).test(this.state.destinationIp)){ //still need to test despite validation
      let directionInfo = await this.getGoogleMaps(this.state.originIp, this.state.destinationIp)
        .then(ourResults => {
          this.setState({inputToggle: false,
             originAddress: ourResults.routes[0].legs[0].start_address.split(","),
             destinationAddress: ourResults.routes[0].legs[0].end_address.split(","),
             time: ourResults.routes[0].legs[0].duration.text      
          });
        });
    }
  }

  async getGoogleMaps(origin, destination){
    // Get our two lat/long asyncrhonously 
    let originObj = await getLongitudeLatitude(origin);
    let destObj = await getLongitudeLatitude(destination);
    //Set them.
    if(originObj.data.getLocation != null && destObj.data.getLocation != null){
      let directionsService = new google.maps.DirectionsService;
      //Seriously ugly method of getting Google maps Info via wrapping it in a promise.
      return new Promise((resolve,reject) => {directionsService.route({      
        origin: originObj.data.getLocation.location.latitude+", "+originObj.data.getLocation.location.longitude,
        destination: destObj.data.getLocation.location.latitude+", "+destObj.data.getLocation.location.longitude,
        travelMode: 'DRIVING'
      } , function(response, status) {
        if (status === 'OK') {
          resolve(response);
        }
        else{
          console.log('Could not display route due to: ' + status);
          reject(status);
        }
        });
      });
    }
    else{
      return false;
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

export default GoogleApiWrapper({apiKey: "AIzaSyBWyS9G2KtT2u8JD93MrqmT55RFmDPB-_E"})(App);
