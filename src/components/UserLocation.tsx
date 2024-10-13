import React, { ReactElement } from 'react';
import { CircleLayerStyle } from '../Mapbox';
import locationManager, { type Location } from '../modules/location/locationManager';
import Annotation from './Annotation';
import CircleLayer from './CircleLayer';
import HeadingIndicator from './HeadingIndicator';
import LocationPuck from './LocationPuck';

const mapboxBlue = 'rgba(51, 181, 229, 100)';

const layerStyles: Record<'normal', Record<string, CircleLayerStyle>> = {
  normal: {
    pulse: {
      circleRadius: 15,
      circleColor: mapboxBlue,
      circleOpacity: 0.2,
      circlePitchAlignment: 'map',
    },
    background: {
      circleRadius: 9,
      circleColor: '#fff',
      circlePitchAlignment: 'map',
    },
    foreground: {
      circleRadius: 6,
      circleColor: mapboxBlue,
      circlePitchAlignment: 'map',
    },
  },
};

// Modify normalIcon to accept customizable styles
const normalIcon = (
  showsUserHeadingIndicator?: boolean,
  heading?: number | null,
  headingIconSize?: number,
  styles?: Record<string, CircleLayerStyle>,
): ReactElement[] => [
  <CircleLayer
    key="mapboxUserLocationPulseCircle"
    id="mapboxUserLocationPulseCircle"
    style={{ ...layerStyles.normal.pulse, ...styles?.pulse }}
  />,
  <CircleLayer
    key="mapboxUserLocationWhiteCircle"
    id="mapboxUserLocationWhiteCircle"
    style={{ ...layerStyles.normal.background, ...styles?.background }}
  />,
  <CircleLayer
    key="mapboxUserLocationBlueCircle"
    id="mapboxUserLocationBlueCircle"
    aboveLayerID="mapboxUserLocationWhiteCircle"
    style={{ ...layerStyles.normal.foreground, ...styles?.foreground }}
  />,
  ...(showsUserHeadingIndicator && typeof heading === 'number'
    ? [HeadingIndicator({ heading, headingIconSize, key: 'mapboxUserLocationHeadingIndicator' })]
    : []),
];

export enum UserLocationRenderMode {
  Native = 'native',
  Normal = 'normal',
}

type Props = {
  androidRenderMode?: 'normal' | 'compass' | 'gps';
  animated?: boolean;
  children?: ReactElement | ReactElement[];
  minDisplacement?: number;
  onPress?: () => void;
  onUpdate?: (location: Location) => void;
  renderMode?: UserLocationRenderMode;
  requestsAlwaysUse?: boolean;
  showsUserHeadingIndicator?: boolean;
  visible?: boolean;
  headingIconSize?: number;
  styles?: {
    pulse?: CircleLayerStyle;
    background?: CircleLayerStyle;
    foreground?: CircleLayerStyle;
  };
};

type UserLocationState = {
  shouldShowUserLocation: false;
  coordinates: number[] | null;
  heading: number | null;
};

class UserLocation extends React.Component<Props, UserLocationState> {
  static defaultProps = {
    animated: true,
    visible: true,
    showsUserHeadingIndicator: false,
    requestsAlwaysUse: false,
    minDisplacement: 0,
    renderMode: UserLocationRenderMode.Normal,
    styles: {
      pulse: { circleRadius: 15, circleColor: mapboxBlue },
      background: { circleRadius: 9, circleColor: '#fff' },
      foreground: { circleRadius: 6, circleColor: mapboxBlue },
    },
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      shouldShowUserLocation: false,
      coordinates: null,
      heading: null,
    };
    this._onLocationUpdate = this._onLocationUpdate.bind(this);
  }

  async componentDidMount() {
    this._isMounted = true;
    locationManager.setMinDisplacement(this.props.minDisplacement || 0);
    await this.setLocationManager({ running: this.needsLocationManagerRunning() });
  }

  async componentDidUpdate(prevProps: Props) {
    await this.setLocationManager({ running: this.needsLocationManagerRunning() });

    if (this.props.minDisplacement !== prevProps.minDisplacement) {
      locationManager.setMinDisplacement(this.props.minDisplacement || 0);
    }
    if (this.props.requestsAlwaysUse !== prevProps.requestsAlwaysUse) {
      locationManager.setRequestsAlwaysUse(this.props.requestsAlwaysUse || false);
    }
  }

  async componentWillUnmount() {
    this._isMounted = false;
    await this.setLocationManager({ running: false });
  }

  async setLocationManager({ running }: { running?: boolean }) {
    if (this.locationManagerRunning !== running) {
      this.locationManagerRunning = running;
      if (running) {
        locationManager.addListener(this._onLocationUpdate);
        const location = await locationManager.getLastKnownLocation();
        this._onLocationUpdate(location);
      } else {
        locationManager.removeListener(this._onLocationUpdate);
      }
    }
  }

  needsLocationManagerRunning() {
    return (
      !!this.props.onUpdate ||
      (this.props.renderMode === UserLocationRenderMode.Normal && this.props.visible)
    );
  }

  _onLocationUpdate(location: Location | null) {
    if (!this._isMounted || !location) {
      return;
    }
    let coordinates = null;
    let heading = null;

    if (location && location.coords) {
      const { longitude, latitude } = location.coords;
      ({ heading } = location.coords);
      coordinates = [longitude, latitude];
    }

    this.setState({
      coordinates,
      heading: heading ?? null,
    });

    if (this.props.onUpdate) {
      this.props.onUpdate(location);
    }
  }

  _renderNative() {
    const { androidRenderMode, showsUserHeadingIndicator, styles } = this.props;
    const props = {
      androidRenderMode,
      iosShowsUserHeadingIndicator: showsUserHeadingIndicator,
      styles,
    };
    return <LocationPuck {...props} />;
  }

  render() {
    const { heading, coordinates } = this.state;
    const { children, visible, showsUserHeadingIndicator, onPress, animated, headingIconSize, styles } =
      this.props;

    if (!visible) {
      return null;
    }

    if (this.props.renderMode === UserLocationRenderMode.Native) {
      return this._renderNative();
    }

    if (!coordinates) {
      return null;
    }

    return (
      <Annotation
        id="mapboxUserLocation"
        animated={animated}
        onPress={onPress}
        coordinates={coordinates}
        style={{
          iconRotate: heading,
          ...styles,
        }}
      >
        {children || normalIcon(showsUserHeadingIndicator, heading, headingIconSize, styles)}
      </Annotation>
    );
  }
}

export default UserLocation;
