

import React, { useState } from 'react';
import { View, Button } from 'react-native';
import WebVideo from './video.web'

let adsManager;
let adsLoader;
let adDisplayContainer;
let intervalTimer;
let playButton;
let videoContent;

export default function WebPlayer(props) {
  const adContainerRef = React.useRef(null);
  const contentRef = React.useRef(null);
  let [mainPlayer, setMainPlayer] = useState({});

  function init() {
    videoContent = contentRef.current;
    // videoContent = document.getElementById('contentElement');
    // playButton = document.getElementById('playButton');
    // playButton.addEventListener('onclick', this.playAds);
    setUpIMA();
  }

  function setUpIMA() {
    // console.log('window.google', new window.google)
    console.log('videoContent', videoContent, contentRef)
    // Create the ad display container.
    createAdDisplayContainer();
    // Create ads loader.

    adsLoader = new window.google.ima.AdsLoader(adDisplayContainer);
    // Listen and respond to ads loaded and error events.
    console.log('adsLoader', adsLoader)

    adsLoader.addEventListener(
      window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded, false);
    adsLoader.addEventListener(
      onAdError, false);

    // An event listener to tell the SDK that our content video
    // is completed so the SDK can play any post-roll ads.
    const contentEndedListener = () => {
      adsLoader.contentComplete();
    };
    contentRef.current.videoElement.onended = contentEndedListener;
    // Request video ads.
    const adsRequest = new window.google.ima.AdsRequest();
    // adsRequest.adTagUrl = props.webConfig.adsUrl;
    adsRequest.adTagUrl = `https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/simid&description_url=https%3A%2F%2Fdevelopers.google.com%2Finteractive-media-ads&sz=640x480&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=`
    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = window.screen.availWidth;
    adsRequest.linearAdSlotHeight = window.screen.availheight - window.screen.availTop;

    adsRequest.nonLinearAdSlotWidth = window.screen.availWidth;
    adsRequest.nonLinearAdSlotHeight = window.screen.availheight - window.screen.availTop;

    adsLoader.requestAds(adsRequest);
  }

  /**
 * Sets the 'adContainer' div as the IMA ad display container.
 */
  function createAdDisplayContainer() {
    // We assume the adContainer is the DOM id of the element that will house
    // the ads.
    adDisplayContainer = new window.google.ima.AdDisplayContainer(
      adContainerRef.current, contentRef.current);
    console.log("adDisplayContainer", adDisplayContainer)
  }

  /**
   * Loads the video content and initializes IMA ad playback.
   */
  function playAds() {
    console.log("log ", videoContent, google.ima)
    // Initialize the container. Must be done via a user action on mobile devices.
    adDisplayContainer.initialize();

    try {
      // Initialize the ads manager. Ad rules playlist will start at this time.
      adsManager.init(window.screen.availWidth, window.screen.availHeight - window.screen.availTop, google.ima.ViewMode.NORMAL);
      // Call play to start showing the ad. Single video and overlay ads will
      // start at this time; the call will be ignored for ad rules.
      adsManager.start();
    } catch (adError) {
      console.log("here in error", adError)
      // An error may be thrown if there was a problem with the VAST response.
      contentRef.current.videoElement.play();
    }
  }

  /**
   * Handles the ad manager loading and sets ad event listeners.
   * @param {!window.google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
   */
  function onAdsManagerLoaded(adsManagerLoadedEvent) {
    // Get the ads manager.
    console.log("her in onAdsManagerLoaded", adsManagerLoadedEvent)
    const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    // videoContent should be set to the content video element.
    adsManager =
      adsManagerLoadedEvent.getAdsManager(contentRef.current, adsRenderingSettings);
    console.log("her in onAdsManagerLoaded adsManager", adsManager, adsRenderingSettings, window.google.ima.AdEvent)

    // Add listeners to the required events.
    adsManager.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(
      window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    adsManager.addEventListener(
      window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested);
    adsManager.addEventListener(
      window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);

    // Listen to any additional events, if necessary.
    adsManager.addEventListener(window.google.ima.AdEvent.Type.LOADED, onAdEvent);
    adsManager.addEventListener(window.google.ima.AdEvent.Type.STARTED, onAdEvent);
    adsManager.addEventListener(window.google.ima.AdEvent.Type.COMPLETE, onAdEvent);
  }

  /**
   * Handles actions taken in response to ad events.
   * @param {!window.google.ima.AdEvent} adEvent
   */
  function onAdEvent(adEvent) {
    // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
    // don't have ad object associated.
    // console.log("here in adEvent", adEvent)
    const ad = adEvent.getAd();
    switch (adEvent.type) {
      case window.google.ima.AdEvent.Type.LOADED:
        if (!ad.isLinear()) {
          contentRef.current.videoElement.play();
        }
        break;
      case window.google.ima.AdEvent.Type.STARTED:
        if (ad.isLinear()) {
          // For a linear ad, a timer can be started to poll for
          // the remaining time.
          intervalTimer = setInterval(
            () => {
              // Example: const remainingTime = adsManager.getRemainingTime();
            },
            300);  // every 300ms
        }
        break;
      case window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
      case window.google.ima.AdEvent.Type.COMPLETE:
        {
          adContainerRef.current.style.display = "none"
          contentRef.current.videoElement.play();
          if (ad.isLinear()) {
            clearInterval(intervalTimer);
          }
          break;
        }
    }
  }

  /**
   * Handles ad errors.
   * @param {!window.google.ima.AdErrorEvent} adErrorEvent
   */
  function onAdError(adErrorEvent) {
    console.log(adErrorEvent.getError());
    adsManager.destroy();
  }

  /**
   * Pauses video content and sets up ad UI.
   */
  function onContentPauseRequested() {
    // console.log("contentRef check", contentRef.current)
    contentRef.current.videoElement.pause();
  }

  /**
   * Resumes video content and removes ad UI.
   */
  function onContentResumeRequested() {
    contentRef.current.videoElement.play();
  }

  React.useEffect(() => {
    // if (adsLoader) {
    //   return
    // }
    // init()
  }, [])
  console.log('contentRef', contentRef)
  return (
    <View>
      <View id="mainContainer" >
        {/* <View> */}
        <WebVideo 
          {...props.webConfig} 
          autoPlay={props.autoplay} 
          onLoad={(e)=> console.log('on LOad',e)} 
          ref={contentRef} 
          onLoadStart={(e)=> console.log('on LOad start',e)}
          onLoadedData={(e)=> console.log('on onloadeddata start',e)}
          onLoadedMetadata={(e)=> console.log('on load mettttttttaa start',e)}
          src={props.source.uri} 
          controls={props.controls} 
        /> 
        {/* </View> */}
        {/* <View ref={adContainerRef} style={{ top: 0, zIndex: 100, position: "absolute", color: 'red' }}></View> */}
      </View>
      {/* <Button style={{ zIndex: 100, position: "absolute", color: 'red' }} onPress={() => playAds()}  title='Play' /> */}
    </View>
  );
}
