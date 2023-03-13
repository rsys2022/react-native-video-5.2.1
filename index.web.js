import React, {Component} from 'react';
import { Platform} from 'react-native';
import WebPlayer from './web';
console.log("Platform.OS", Platform.OS)

export default class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <WebPlayer {...this.props} />
  }
}
